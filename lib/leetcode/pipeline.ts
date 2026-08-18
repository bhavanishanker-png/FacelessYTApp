/**
 * Shared LeetCode daily video pipeline.
 * Called by both the cron route (batch) and the streaming trigger endpoint.
 */

import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import { askAIJSON } from "@/lib/ai/provider";
import {
  LEETCODE_HOOK_SYSTEM_PROMPT,
  LEETCODE_SCRIPT_SYSTEM_PROMPT,
  SCENES_SYSTEM_PROMPT,
} from "@/lib/ai/prompts";
import type { ViralHooksOutput, ScenesOutput } from "@/lib/ai/types";
import { DeepgramClient } from "@deepgram/sdk";
import OpenAI, { toFile } from "openai";

const MAX_SCENES = 8;
const DEEPGRAM_CHAR_LIMIT = 1900;
const HF_ENDPOINT =
  "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-3-medium-diffusers";

// ─── Helpers ──────────────────────────────────────────────────

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+[\s]*/g) ?? [text];
  let cur = "";
  for (const s of sentences) {
    if (cur.length + s.length > DEEPGRAM_CHAR_LIMIT) {
      if (cur.trim()) chunks.push(cur.trim());
      cur = s;
    } else {
      cur += s;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

async function generateImageBuffer(prompt: string): Promise<{ buffer: Buffer | null; error: string }> {
  const hfToken = process.env.HF_TOKEN ?? process.env.HUGGINGFACE_API_KEY;

  // ── HuggingFace SD3 ───────────────────────────────────────
  if (hfToken) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 90_000);
        const res = await fetch(HF_ENDPOINT, {
          method: "POST",
          headers: { Authorization: `Bearer ${hfToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ inputs: prompt }),
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (res.ok) return { buffer: Buffer.from(await res.arrayBuffer()), error: "" };

        if (res.status === 429) {
          const retryAfter = parseInt(res.headers.get("retry-after") ?? "15", 10);
          console.warn(`[LC Pipeline] HF 429 — waiting ${retryAfter}s (attempt ${attempt})`);
          await new Promise((r) => setTimeout(r, retryAfter * 1000));
          continue;
        }

        // Non-retriable HF error — break to Pollinations
        console.warn(`[LC Pipeline] HF HTTP ${res.status} — trying Pollinations`);
        break;
      } catch (err: any) {
        const code = err?.cause?.code;
        if (code === "ENOTFOUND" || code === "ECONNREFUSED") {
          console.warn("[LC Pipeline] HF unreachable — trying Pollinations");
          break;
        }
        console.warn(`[LC Pipeline] HF attempt ${attempt} error:`, err.message);
        if (attempt < 2) await new Promise((r) => setTimeout(r, 5_000));
      }
    }
  }

  // ── Pollinations fallback ─────────────────────────────────
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const encoded = encodeURIComponent(prompt.slice(0, 500));
      const res = await fetch(
        `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=576&model=flux`,
        { signal: AbortSignal.timeout(35_000) }
      );

      if (res.ok) return { buffer: Buffer.from(await res.arrayBuffer()), error: "" };

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("retry-after") ?? "30", 10);
        console.warn(`[LC Pipeline] Pollinations 429 — waiting ${retryAfter}s (attempt ${attempt})`);
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        continue;
      }

      return { buffer: null, error: `Pollinations HTTP ${res.status}` };
    } catch (err: any) {
      const msg = err?.message ?? "unknown";
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 5_000 * attempt));
      } else {
        return { buffer: null, error: `Pollinations error: ${msg}` };
      }
    }
  }

  return { buffer: null, error: "All providers failed after retries" };
}

function nextPublishAt(): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(7, 0, 0, 0);
  return d;
}

// ─── Pipeline Result ──────────────────────────────────────────

export interface PipelineResult {
  projectId: string;
  problem: { title: string; difficulty: string; url: string };
  images: { ok: number; total: number };
  scheduledAt: string;
}

// ─── Main Pipeline ────────────────────────────────────────────

function checkAbort(signal?: AbortSignal) {
  if (signal?.aborted) throw new Error("Pipeline stopped by user.");
}

export async function runLeetCodePipeline(
  botUserId: string,
  baseUrl: string,
  cronSecret: string,
  onStep: (msg: string) => void,
  signal?: AbortSignal
): Promise<PipelineResult> {

  await connectDB();

  // ── Step 1: Fetch problem ──────────────────────────────────
  onStep("Fetching today's LeetCode problem...");
  const lcRes = await fetch(`${baseUrl}/api/leetcode/daily`);
  if (!lcRes.ok) throw new Error(`LeetCode fetch failed: HTTP ${lcRes.status}`);
  const { problem } = await lcRes.json();
  onStep(`Problem: "${problem.title}" · ${problem.difficulty} · ${problem.acceptanceRate?.toFixed(1) ?? "?"}% AC`);

  checkAbort(signal);

  // ── Step 2: Duplicate check ────────────────────────────────
  // Match on steps.idea.userSelected which always contains problem.title,
  // not on `title` which is an AI-generated YouTube title that won't match.
  const todayMidnight = new Date();
  todayMidnight.setUTCHours(0, 0, 0, 0);
  const existing = await Project.findOne({
    userId: botUserId,
    "steps.idea.userSelected": { $regex: problem.title, $options: "i" },
    createdAt: { $gte: todayMidnight },
  });
  if (existing) {
    onStep("Already generated a video for this problem today — skipped.");
    return {
      projectId: existing._id.toString(),
      problem: { title: problem.title, difficulty: problem.difficulty, url: problem.url },
      images: { ok: 0, total: 0 },
      scheduledAt: nextPublishAt().toISOString(),
    };
  }

  checkAbort(signal);

  // ── Step 3: Hook ───────────────────────────────────────────
  onStep("Generating hook...");
  const hookAI = await askAIJSON<ViralHooksOutput>({
    systemPrompt: LEETCODE_HOOK_SYSTEM_PROMPT,
    userMessage: [
      `Problem: ${problem.title}`,
      `Difficulty: ${problem.difficulty}`,
      `Topics: ${problem.tags.join(", ")}`,
      `Acceptance Rate: ${problem.acceptanceRate?.toFixed(1) ?? "?"}%`,
    ].join("\n"),
    maxTokens: 1000,
    temperature: 0.8,
  });
  const hookData = hookAI.success ? hookAI.data : null;
  if (!hookAI.success) onStep(`⚠️ Hook AI failed: ${hookAI.error} — using fallback`);
  const selectedHook =
    hookData?.hooks?.[0]?.text ??
    `Most developers fail this ${problem.difficulty} LeetCode problem — here is the optimal solution.`;
  const hookScore = hookData?.hooks?.[0]?.score;
  onStep(`Hook locked in${hookScore ? ` (score: ${hookScore})` : ""}`);

  checkAbort(signal);

  // ── Step 4: Script ─────────────────────────────────────────
  onStep("Generating script (6-8 min explainer)...");
  type ScriptShape = {
    title: string;
    sections: { label: string; content: string; durationSeconds: number; speakerNotes: string }[];
    totalDurationSeconds: number;
    wordCount: number;
  };
  const scriptAI = await askAIJSON<ScriptShape>({
    systemPrompt: LEETCODE_SCRIPT_SYSTEM_PROMPT,
    userMessage: [
      `Problem: ${problem.title}`,
      `Difficulty: ${problem.difficulty}`,
      `Topics: ${problem.tags.join(", ")}`,
      `Hook: "${selectedHook}"`,
      ``,
      `Problem Description:`,
      problem.content.slice(0, 3000),
      ``,
      `Examples: ${problem.examples || "See description."}`,
      `Hints: ${problem.hints?.join("\n") || "None."}`,
      `Format: long-form (6-8 minutes)`,
    ].join("\n"),
    maxTokens: 4000,
    temperature: 0.7,
  });
  const scriptData = scriptAI.success ? scriptAI.data : null;
  const fullScript = scriptData?.sections?.map((s) => s.content).join("\n\n") ?? selectedHook;
  onStep(`Script: ${scriptData?.wordCount ?? 0} words · ${Math.round((scriptData?.totalDurationSeconds ?? 0) / 60)} min`);

  checkAbort(signal);

  // ── Step 5: Scenes ─────────────────────────────────────────
  onStep(`Breaking into ${MAX_SCENES} visual scenes...`);
  const scenesAI = await askAIJSON<ScenesOutput>({
    systemPrompt: SCENES_SYSTEM_PROMPT,
    userMessage: [
      `Script:\n${fullScript.slice(0, 6000)}`,
      ``,
      `IMPORTANT: Limit to exactly ${MAX_SCENES} scenes.`,
      `Image prompts: abstract algorithm-visualization style — colored blocks for arrays,`,
      `arrows for pointers, node diagrams for trees, dark background, neon accents. No people.`,
    ].join("\n"),
    maxTokens: 3000,
    temperature: 0.5,
  });

  let scenes = ((scenesAI.success ? scenesAI.data?.scenes : []) ?? []).slice(0, MAX_SCENES);

  if (!scenesAI.success) onStep(`⚠️ Scenes AI failed: ${scenesAI.error} — using fallback scenes`);

  // Fallback: derive scenes from script sections so the pipeline never stalls
  if (!scenes.length && scriptData?.sections?.length) {
    const sectionPrompts: Record<string, string> = {
      "Hook": `dramatic neon text title card, glowing code symbols, dark background, electric blue accents`,
      "Problem Breakdown": `abstract diagram of the problem: input array with colored blocks, arrows, dark background, neon green`,
      "Brute Force": `nested loops visualization, red X marks on slow path, binary tree or nested boxes, dark background`,
      "Key Insight": `lightbulb moment: key pattern highlighted in neon, pointer or sliding window diagram, bright yellow accent`,
      "Optimal Solution": `step-by-step algorithm flow, colored pointer arrows moving through array, dark background neon cyan`,
      "Complexity Analysis": `Big-O graph: O(n) vs O(n²) curves, dark background, purple and orange gradient`,
      "Pattern Takeaway": `checklist of patterns, glowing trophy icon, algorithmic pattern label cards, neon on dark`,
    };
    scenes = scriptData.sections.slice(0, MAX_SCENES).map((s, i) => ({
      sceneNumber: i + 1,
      narration: s.content.slice(0, 300),
      visualDescription: s.label,
      imagePrompt: sectionPrompts[s.label] ?? `abstract algorithm visualization scene ${i + 1}, dark background, neon accents`,
      durationSeconds: s.durationSeconds ?? 30,
      transition: "fade" as const,
    }));
    onStep(`Using ${scenes.length} fallback scenes from script sections`);
  }

  if (!scenes.length) throw new Error("Scene generation returned 0 scenes — cannot continue.");
  onStep(`${scenes.length} scenes ready`);

  checkAbort(signal);

  // ── Step 6: Create project ─────────────────────────────────
  onStep("Creating project in database...");
  const videoTitle = scriptData?.title || `LeetCode ${problem.difficulty}: ${problem.title} Explained`;
  const project = await Project.create({
    userId: botUserId,
    title: videoTitle,
    type: "long",
    currentStep: "images",
    status: "in-progress",
    steps: {
      idea: {
        aiOutput: { source: "leetcode-daily", url: problem.url, tags: problem.tags },
        userSelected: `LeetCode Daily — ${problem.title} (${problem.difficulty})`,
        status: "completed",
      },
      hook: {
        aiOutput: hookData?.hooks ?? [],
        selectedHook,
        editedHook: selectedHook,
        status: "completed",
      },
      script: { content: fullScript, versions: [fullScript], status: "completed" },
      scenes: {
        aiOutput: scenes,
        status: "completed",
        data: scenes.map((s: any) => ({ text: s.narration, prompt: s.imagePrompt, duration: s.durationSeconds })),
      },
      images: { status: "pending", style: "cinematic", data: [] },
      animation: { status: "completed", data: { preset: "kenburns" } },
      voice: { status: "pending" },
      subtitles: { status: "pending", data: [] },
      composition: { status: "pending" },
      editor: { status: "pending" },
      render: { status: "pending", progress: 0, quality: "1080p" },
    },
    youtube: {
      status: "scheduled",
      scheduledAt: nextPublishAt(),
      timezone: "UTC",
      title: videoTitle,
      description: [
        `Today's LeetCode Daily Challenge: ${problem.title}`,
        `Difficulty: ${problem.difficulty} | Topics: ${problem.tags.join(", ")}`,
        ``,
        `What you'll learn:`,
        `• Brute-force approach and why it's slow`,
        `• The key insight that unlocks the optimal solution`,
        `• Time & Space complexity analysis`,
        ``,
        `Problem: ${problem.url}`,
        ``,
        `#LeetCode #CodingInterview #DSA #${problem.difficulty} #Programming`,
      ].join("\n"),
      tags: ["leetcode", "coding interview", "algorithms", "data structures",
        problem.difficulty.toLowerCase(), "faang", ...problem.tags.slice(0, 5).map((t: string) => t.toLowerCase())],
      visibility: "public",
    },
  });
  const projectId = project._id.toString();
  onStep(`Project created → ${projectId}`);

  // ── Step 7: Images ─────────────────────────────────────────
  const { uploadBufferToCloudinary } = await import("@/lib/storage");
  const imageData: any[] = [];

  for (let i = 0; i < scenes.length; i++) {
    const sceneId = `scene_${i + 1}`;
    onStep(`Image ${i + 1}/${scenes.length}: generating ${sceneId}...`);
    try {
      const { buffer, error: imgError } = await generateImageBuffer(scenes[i].imagePrompt);
      if (buffer) {
        const upload = await uploadBufferToCloudinary(buffer, `faceless-yt/projects/${projectId}/images`, "image", `${sceneId}_${Date.now()}`);
        imageData.push({ sceneId, imageUrl: upload.url, prompt: scenes[i].imagePrompt, status: "success" });
        onStep(`Image ${i + 1}/${scenes.length}: ✅ done`);
      } else {
        imageData.push({ sceneId, imageUrl: "", prompt: scenes[i].imagePrompt, status: "failed", error: imgError });
        onStep(`Image ${i + 1}/${scenes.length}: ❌ ${imgError}`);
      }
    } catch (e: any) {
      imageData.push({ sceneId, imageUrl: "", prompt: scenes[i].imagePrompt, status: "failed", error: e.message });
      onStep(`Image ${i + 1}/${scenes.length}: ❌ ${e.message}`);
    }
    checkAbort(signal);
    if (i < scenes.length - 1) await new Promise((r) => setTimeout(r, 4000));
  }

  project.steps.images = { status: "completed", style: "cinematic", data: imageData };
  project.markModified("steps.images");
  await project.save();
  const okImages = imageData.filter((d) => d.status === "success").length;
  onStep(`Images: ${okImages}/${scenes.length} succeeded`);

  checkAbort(signal);

  // ── Step 8: Voice ──────────────────────────────────────────
  onStep("Generating voice narration (Deepgram Aura)...");
  if (!process.env.DEEPGRAM_API_KEY) throw new Error("DEEPGRAM_API_KEY not set");
  const deepgram = new DeepgramClient({ apiKey: process.env.DEEPGRAM_API_KEY });
  const cleanScript = fullScript.replace(/\[([A-Z\s]+)\]/g, "").replace(/\n{3,}/g, "\n\n").trim();
  const chunks = chunkText(cleanScript);
  onStep(`TTS: ${chunks.length} chunk(s), ${cleanScript.length} chars`);

  const audioChunks: Buffer[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const resp = await deepgram.speak.v1.audio.generate({ text: chunks[i], model: "aura-orion-en", encoding: "mp3" });
    audioChunks.push(Buffer.from(await resp.arrayBuffer()));
    onStep(`TTS chunk ${i + 1}/${chunks.length} done`);
  }
  const audioBuffer = Buffer.concat(audioChunks);
  const audioUpload = await uploadBufferToCloudinary(audioBuffer, `faceless-yt/projects/${projectId}/audio`, "video", `voiceover_${Date.now()}`);
  const audioUrl = audioUpload.url;
  const durationSeconds = Math.round((cleanScript.trim().split(/\s+/).length / 150) * 60);

  project.steps.voice = {
    type: "male-deep", voiceId: "male-deep", audioUrl, durationSeconds,
    provider: "deepgram-aura", settings: { speed: 1.0, model: "aura-orion-en" }, status: "completed",
  };
  project.markModified("steps.voice");
  await project.save();
  onStep(`Voice: ${durationSeconds}s audio ready`);

  checkAbort(signal);

  // ── Step 9: Subtitles (optional — skipped gracefully on auth/rate errors) ──
  onStep("Transcribing with Groq Whisper...");
  let segments: { text: string; start: number; end: number }[] = [];
  try {
    if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY not set");
    const groq = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
    const audioDownload = await fetch(audioUrl);
    if (!audioDownload.ok) throw new Error(`Failed to download audio: HTTP ${audioDownload.status}`);
    const audioFile = await toFile(audioDownload, "audio.mp3");
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile, model: "whisper-large-v3",
      response_format: "verbose_json", timestamp_granularities: ["segment", "word"],
    });

    const words = transcription.words?.map((w: any) => ({ word: w.word, start: w.start, end: w.end })) ?? [];
    if (words.length > 0) {
      let cur = { start: words[0].start, end: words[0].end, buf: [] as typeof words };
      for (const w of words) {
        if (cur.buf.length >= 5 || w.end - cur.start > 3) {
          if (cur.buf.length) segments.push({ text: cur.buf.map((x) => x.word.trim()).join(" "), start: cur.start, end: cur.end });
          cur = { start: w.start, end: w.end, buf: [] };
        }
        cur.buf.push(w);
        cur.end = w.end;
      }
      if (cur.buf.length) segments.push({ text: cur.buf.map((x) => x.word.trim()).join(" "), start: cur.start, end: cur.end });
    } else {
      segments.push(...(transcription.segments?.map((s: any) => ({ text: s.text, start: s.start, end: s.end })) ?? []));
    }
    onStep(`Subtitles: ${segments.length} segments`);
  } catch (e: any) {
    onStep(`⚠️ Transcription skipped: ${e.message} — video will render without subtitles`);
  }

  project.steps.subtitles = { status: segments.length ? "completed" : "pending", data: segments };
  project.markModified("steps.subtitles");
  await project.save();

  // ── Step 10: Render ────────────────────────────────────────
  onStep("Triggering FFmpeg render...");
  const renderRes = await fetch(`${baseUrl}/api/ai/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-cron-secret": cronSecret },
    body: JSON.stringify({ projectId, userId: botUserId, quality: "1080p" }),
  });
  if (renderRes.ok) {
    const rd = await renderRes.json();
    onStep(`Render queued — job ${rd.jobId}`);
  } else {
    onStep("Render trigger failed — open the project to render manually");
  }

  const scheduledAt = nextPublishAt().toISOString();
  onStep(`Done! YouTube scheduled for ${scheduledAt}`);

  return {
    projectId,
    problem: { title: problem.title, difficulty: problem.difficulty, url: problem.url },
    images: { ok: okImages, total: scenes.length },
    scheduledAt,
  };
}
