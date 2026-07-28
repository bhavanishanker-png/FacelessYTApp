/**
 * POST /api/ai/render
 *
 * Video rendering pipeline using FFmpeg.
 *
 * Composites:
 *   - Scene images (with Ken Burns / pan animations)
 *   - Narration audio track
 *   - Burned-in subtitles (ASS format)
 *   - Cross-fade transitions between scenes
 *
 * The render runs asynchronously in the background.
 * The client polls /api/ai/render/status?jobId=xxx for progress.
 *
 * Returns: { jobId, status: "queued" }
 */

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { renderStore, type RenderJob } from "@/lib/renderStore";
import Project from "@/models/Project";
import { spawn } from "child_process";
import crypto from "crypto";
import { existsSync } from "fs";
import { mkdir, stat, writeFile } from "fs/promises";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import path from "path";

// ─── Quality Presets ──────────────────────────────────────────

const QUALITY_PRESETS: Record<string, { width: number; height: number; bitrate: string; crf: number }> = {
  "720p":  { width: 1280, height: 720,  bitrate: "2500k", crf: 28 },
  "1080p": { width: 1920, height: 1080, bitrate: "5000k", crf: 23 },
  "4k":    { width: 3840, height: 2160, bitrate: "15000k", crf: 18 },
};

// ─── Helpers ──────────────────────────────────────────────────

function generateJobId(): string {
  return `render_${crypto.randomBytes(8).toString("hex")}`;
}

/** Build an ASS subtitle file from subtitle segments */
function buildAssSubtitles(
  subtitles: { text: string; start: number; end: number }[],
  width: number,
  height: number,
  settings?: Record<string, any>
): string {
  const fontSize = Math.round(height * 0.038);
  const fontName = settings?.fontFamily || "Arial";
  const primaryColor = "&H00FFFFFF"; // White
  const outlineColor = "&H00000000"; // Black outline
  const shadowColor  = "&H80000000"; // Semi-transparent shadow
  const marginV = Math.round(height * 0.06);

  let ass = `[Script Info]
Title: Generated Subtitles
ScriptType: v4.00+
PlayResX: ${width}
PlayResY: ${height}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSize},${primaryColor},&H000000FF,${outlineColor},${shadowColor},-1,0,0,0,100,100,0,0,1,2.5,1,2,20,20,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  for (const seg of subtitles) {
    const startStr = formatAssTime(seg.start);
    const endStr = formatAssTime(seg.end);
    const cleanText = seg.text
      .replace(/\\/g, "\\\\")
      .replace(/[{}]/g, "")
      .replace(/\n/g, "\\N");
    ass += `Dialogue: 0,${startStr},${endStr},Default,,0,0,0,,${cleanText}\n`;
  }

  return ass;
}

/** Build an SRT subtitle file from subtitle segments */
function buildSrtSubtitles(
  subtitles: { text: string; start: number; end: number }[]
): string {
  return subtitles
    .map((seg, i) => {
      const startStr = formatSrtTime(seg.start);
      const endStr = formatSrtTime(seg.end);
      return `${i + 1}\n${startStr} --> ${endStr}\n${seg.text.trim()}\n`;
    })
    .join("\n");
}

function formatSrtTime(seconds: number): string {
  const safeSeconds = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const totalMs = Math.floor(safeSeconds * 1000);
  const h = Math.floor(totalMs / 3600000);
  const m = Math.floor((totalMs % 3600000) / 60000);
  const s = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

function formatAssTime(seconds: number): string {
  const safeSeconds = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const totalCentiseconds = Math.floor(safeSeconds * 100);
  const h = Math.floor(totalCentiseconds / 360000);
  const m = Math.floor((totalCentiseconds % 360000) / 6000);
  const s = Math.floor((totalCentiseconds % 6000) / 100);
  const cs = totalCentiseconds % 100;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

function normalizeSubtitles(input: any): { text: string; start: number; end: number }[] {
  const raw = Array.isArray(input)
    ? input
    : Array.isArray(input?.data)
      ? input.data
      : Array.isArray(input?.segments)
        ? input.segments
        : [];

  return raw
    .map((seg: any) => {
      const start = Number(seg?.start);
      const end = Number(seg?.end);
      const text = typeof seg?.text === "string" ? seg.text.trim() : "";
      return { text, start, end };
    })
    .filter((seg: { text: string; start: number; end: number }) => seg.text.length > 0 && Number.isFinite(seg.start) && Number.isFinite(seg.end) && seg.end > seg.start);
}

/** Run an FFmpeg command and return a promise. Registers the proc so it can be killed. */
function runFFmpeg(args: string[], jobId?: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", args, { stdio: ["pipe", "pipe", "pipe"] });
    if (jobId) renderStore.setProcess(jobId, proc);

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (d) => { stdout += d.toString(); });
    proc.stderr?.on("data", (d) => { stderr += d.toString(); });

    proc.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`FFmpeg exited with code ${code}:\n${stderr.slice(-2000)}`));
    });

    proc.on("error", (err) => {
      reject(new Error(`FFmpeg spawn error: ${err.message}`));
    });
  });
}

/** Probe duration of a media file */
async function probeDuration(filePath: string): Promise<number> {
  return new Promise((resolve) => {
    const proc = spawn("ffprobe", [
      "-v", "quiet",
      "-show_entries", "format=duration",
      "-of", "csv=p=0",
      filePath,
    ]);
    let out = "";
    proc.stdout?.on("data", (d) => { out += d.toString(); });
    proc.on("close", () => {
      const dur = parseFloat(out.trim());
      resolve(isNaN(dur) ? 0 : dur);
    });
    proc.on("error", () => resolve(0));
  });
}

// ─── Background Render Pipeline ───────────────────────────────

async function executeRenderPipeline(
  jobId: string,
  projectId: string,
  quality: string,
  images: { imageUrl: string; sceneId: string }[],
  scenes: { text: string; duration: number }[],
  audioUrl: string,
  subtitles: { text: string; start: number; end: number }[],
  subtitleSettings: Record<string, any> | undefined,
  animationData: any,
) {
  const preset = QUALITY_PRESETS[quality] || QUALITY_PRESETS["1080p"];
  const outputDir = path.join("/tmp", "velora-renders", projectId);
  await mkdir(outputDir, { recursive: true });

  const tempDir = path.join(outputDir, "temp");
  await mkdir(tempDir, { recursive: true });

  try {
    // ─── Phase 1: Validate & Prepare Assets ───────────────────
    renderStore.update(jobId, { progress: 5, phase: "Validating assets" });

    // Resolve audio file path
    let audioFilePath = "";
    if (audioUrl.startsWith("http")) {
      const audioRes = await fetch(audioUrl);
      if (!audioRes.ok) throw new Error(`Failed to download audio: ${audioUrl}`);
      const audioBuffer = await audioRes.arrayBuffer();
      audioFilePath = path.join(tempDir, "source_audio.mp3");
      await writeFile(audioFilePath, Buffer.from(audioBuffer));
    } else {
      audioFilePath = audioUrl.startsWith("/")
        ? path.join(process.cwd(), "public", audioUrl)
        : path.join(process.cwd(), "public", "/", audioUrl);
      if (!existsSync(audioFilePath)) {
        throw new Error(`Audio file not found: ${audioUrl}`);
      }
    }

    // Get actual audio duration for timing
    const audioDuration = await probeDuration(audioFilePath);
    const totalDuration = audioDuration > 0 ? audioDuration : scenes.reduce((s, sc) => s + (sc.duration || 4), 0);

    // Calculate per-scene durations proportionally to fill audio
    const sceneDurations: number[] = [];
    const totalSceneDur = scenes.reduce((s, sc) => s + (sc.duration || 4), 0);
    for (const sc of scenes) {
      const ratio = (sc.duration || 4) / totalSceneDur;
      sceneDurations.push(ratio * totalDuration);
    }

    renderStore.update(jobId, { progress: 10, phase: "Preparing images" });

    // ─── Phase 2: Generate image segments with Ken Burns ──────
    const segmentPaths: string[] = [];
    const transitionDur = 0.5; // cross-fade seconds

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const dur = sceneDurations[i] || 4;
      const segPath = path.join(tempDir, `segment_${i}.mp4`);

      // Resolve image path
      let imgPath = img.imageUrl;
      if (imgPath.startsWith("http")) {
        const imgRes = await fetch(imgPath);
        if (!imgRes.ok) throw new Error(`Failed to download image: ${imgPath}`);
        const imgBuffer = await imgRes.arrayBuffer();
        const localImgPath = path.join(tempDir, `source_img_${i}.jpg`);
        await writeFile(localImgPath, Buffer.from(imgBuffer));
        imgPath = localImgPath;
      } else if (imgPath.startsWith("/")) {
        imgPath = path.join(process.cwd(), "public", imgPath);
      }

      if (!existsSync(imgPath)) {
        console.warn(`[Render] Image not found: ${imgPath}, generating placeholder`);
        // Generate a solid color placeholder
        await runFFmpeg([
          "-f", "lavfi",
          "-i", `color=c=0x1a1a2e:s=${preset.width}x${preset.height}:d=${dur}`,
          "-c:v", "libx264",
          "-preset", "fast",
          "-t", String(dur),
          "-y", segPath,
        ], jobId);
      } else {
        // Apply user-selected animation preset from the Animation step
        const preset_id = animationData?.preset || "ken_burns";
        const motionIntensity = (animationData?.intensity ?? 75) / 100; // 0-1
        const maxZoom = 1 + (0.2 * motionIntensity); // between 1.0 and 1.2

        let zoomExpr: string;
        let panXExpr: string;
        let panYExpr: string;

        switch (preset_id) {
          case "zoom_in":
            zoomExpr = `min(zoom+${(0.001 * motionIntensity).toFixed(5)},${maxZoom})`;
            panXExpr = "iw/2-(iw/zoom/2)";
            panYExpr = "ih/2-(ih/zoom/2)";
            break;
          case "zoom_out":
            zoomExpr = `max(zoom-${(0.001 * motionIntensity).toFixed(5)},1)`;
            panXExpr = "iw/2-(iw/zoom/2)";
            panYExpr = "ih/2-(ih/zoom/2)";
            break;
          case "pan_left":
            zoomExpr = `${1 + 0.1 * motionIntensity}`;
            panXExpr = `iw-(iw/zoom)-(iw-(iw/zoom))*on/(${Math.ceil(dur * 25)})`;
            panYExpr = "ih/2-(ih/zoom/2)";
            break;
          case "pan_right":
            zoomExpr = `${1 + 0.1 * motionIntensity}`;
            panXExpr = `(iw-(iw/zoom))*on/(${Math.ceil(dur * 25)})`;
            panYExpr = "ih/2-(ih/zoom/2)";
            break;
          case "ken_burns":
          default:
            zoomExpr = `min(zoom+${(0.0008 * motionIntensity).toFixed(5)},${maxZoom})`;
            panXExpr = i % 2 === 0 ? "iw/2-(iw/zoom/2)" : "0";
            panYExpr = "ih/2-(ih/zoom/2)";
            break;
        }

        await runFFmpeg([
          "-loop", "1",
          "-i", imgPath,
          "-vf", [
            `scale=${preset.width * 2}:${preset.height * 2}`,
            `zoompan=z='${zoomExpr}':x='${panXExpr}':y='${panYExpr}':d=${Math.ceil(dur * 25)}:s=${preset.width}x${preset.height}:fps=25`,
            `fade=t=in:st=0:d=0.3`,
            `fade=t=out:st=${Math.max(0, dur - 0.3)}:d=0.3`,
          ].join(","),
          "-c:v", "libx264",
          "-preset", "fast",
          "-pix_fmt", "yuv420p",
          "-t", String(dur),
          "-y", segPath,
        ], jobId);
      }

      segmentPaths.push(segPath);

      // Update progress (10–50% for image processing)
      const imgProgress = 10 + Math.round(((i + 1) / images.length) * 40);
      renderStore.update(jobId, { progress: imgProgress, phase: `Processing scene ${i + 1}/${images.length}` });
    }

    // ─── Phase 3: Concatenate video segments ──────────────────
    renderStore.update(jobId, { progress: 55, phase: "Stitching scenes", status: "rendering" });

    // Create concat file
    const concatListPath = path.join(tempDir, "concat.txt");
    const concatContent = segmentPaths.map((p) => `file '${p}'`).join("\n");
    await writeFile(concatListPath, concatContent);

    const rawVideoPath = path.join(tempDir, "raw_video.mp4");
    await runFFmpeg([
      "-f", "concat",
      "-safe", "0",
      "-i", concatListPath,
      "-c:v", "libx264",
      "-preset", "fast",
      "-pix_fmt", "yuv420p",
      "-y", rawVideoPath,
    ], jobId);

    // ─── Phase 4: Add audio track ─────────────────────────────
    renderStore.update(jobId, { progress: 70, phase: "Mixing audio" });

    const withAudioPath = path.join(tempDir, "with_audio.mp4");
    await runFFmpeg([
      "-i", rawVideoPath,
      "-i", audioFilePath,
      "-c:v", "copy",
      "-c:a", "aac",
      "-b:a", "192k",
      "-map", "0:v:0",
      "-map", "1:a:0",
      "-shortest",
      "-y", withAudioPath,
    ], jobId);

    // ─── Phase 5: Burn subtitles ──────────────────────────────
    renderStore.update(jobId, { progress: 80, phase: "Burning subtitles" });

    let videoForEncode = withAudioPath;

    if (subtitles && subtitles.length > 0) {
      console.log(`[Render] Burning ${subtitles.length} subtitle segments into video...`);

      // Build both SRT and ASS subtitle files
      const srtContent = buildSrtSubtitles(subtitles);
      const srtPath = path.join(tempDir, "subtitles.srt");
      await writeFile(srtPath, srtContent);

      const assContent = buildAssSubtitles(subtitles, preset.width, preset.height, subtitleSettings);
      const assPath = path.join(tempDir, "subtitles.ass");
      await writeFile(assPath, assContent);

      const withSubsPath = path.join(tempDir, "with_subs.mp4");
      let subtitlesBurned = false;

      // Strategy 1: Try ASS filter (best quality, needs libass)
      if (!subtitlesBurned) {
        try {
          // Escape the path for the filter by replacing backslashes/colons/single-quotes
          const escapedAssPath = assPath.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "'\\''");
          await runFFmpeg([
            "-i", withAudioPath,
            "-vf", `ass='${escapedAssPath}'`,
            "-c:v", "libx264",
            "-crf", String(preset.crf),
            "-preset", "medium",
            "-c:a", "copy",
            "-y", withSubsPath,
          ], jobId);
          videoForEncode = withSubsPath;
          subtitlesBurned = true;
          console.log("[Render] ✅ Subtitles burned via ASS filter.");
        } catch (e: any) {
          console.warn("[Render] ASS filter failed:", e.message?.substring(0, 200));
        }
      }

      // Strategy 2: Try SRT subtitles filter (needs libass too, but different syntax)
      if (!subtitlesBurned) {
        try {
          const escapedSrtPath = srtPath.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "'\\''");
          await runFFmpeg([
            "-i", withAudioPath,
            "-vf", `subtitles='${escapedSrtPath}':force_style='FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Shadow=1,Bold=1,MarginV=30'`,
            "-c:v", "libx264",
            "-crf", String(preset.crf),
            "-preset", "medium",
            "-c:a", "copy",
            "-y", withSubsPath,
          ], jobId);
          videoForEncode = withSubsPath;
          subtitlesBurned = true;
          console.log("[Render] ✅ Subtitles burned via SRT subtitles filter.");
        } catch (e: any) {
          console.warn("[Render] SRT subtitles filter failed:", e.message?.substring(0, 200));
        }
      }

      // Strategy 3: Embed as soft subtitles via mov_text (always works, but player must support them)
      if (!subtitlesBurned) {
        try {
          await runFFmpeg([
            "-i", withAudioPath,
            "-i", srtPath,
            "-c:v", "copy",
            "-c:a", "copy",
            "-c:s", "mov_text",
            "-metadata:s:s:0", "language=eng",
            "-y", withSubsPath,
          ], jobId);
          videoForEncode = withSubsPath;
          subtitlesBurned = true;
          console.log("[Render] ✅ Subtitles embedded as soft subs (mov_text). Note: These are NOT burned in — viewer needs to enable CC.");
        } catch (e: any) {
          console.warn("[Render] mov_text embedding also failed:", e.message?.substring(0, 200));
        }
      }

      if (!subtitlesBurned) {
        console.error("[Render] ❌ All subtitle strategies failed. Video will NOT have subtitles.");
        console.error("[Render] To fix: Install FFmpeg with libass: brew install homebrew-ffmpeg/ffmpeg/ffmpeg");
      }
    } else {
      console.log("[Render] No subtitles to burn (0 segments found).");
    }

    // ─── Phase 6: Final encode ────────────────────────────────
    renderStore.update(jobId, { progress: 90, phase: "Final encoding", status: "encoding" });

    const timestamp = Date.now();
    const finalFilename = `render_${quality}_${timestamp}.mp4`;
    const finalPath = path.join(outputDir, finalFilename);

    // The video is already h264 encoded from Phase 3 and Phase 5.
    // We skip the redundant re-encode pass to prevent FFmpeg crashes and save time.
    const { copyFile } = await import("fs/promises");
    await copyFile(videoForEncode, finalPath);

    // ─── Phase 7: Finalize ────────────────────────────────────
    renderStore.update(jobId, { progress: 95, phase: "Finalizing" });

    const fileStat = await stat(finalPath);
    const finalDuration = await probeDuration(finalPath);

    // Upload video to Cloudinary
    renderStore.update(jobId, { progress: 98, phase: "Uploading to cloud" });
    const { uploadFileToCloudinary } = await import("@/lib/storage");
    const uploadResult = await uploadFileToCloudinary(
      finalPath,
      `faceless-yt/projects/${projectId}/renders`,
      "video",
      `render_${quality}_${timestamp}`
    );
    
    const publicUrl = uploadResult.url;

    // Persist to MongoDB
    await connectDB();
    const project = await Project.findById(projectId);
    if (project) {
      project.steps.render = {
        videoUrl: publicUrl,
        status: "completed",
        jobId,
        progress: 100,
        phase: "Complete",
        quality,
        durationSeconds: Math.round(finalDuration),
        fileSizeBytes: fileStat.size,
        error: "",
      };
      project.status = "completed";
      project.markModified("steps.render");
      await project.save();
    }

    // Update job store
    renderStore.update(jobId, {
      status: "complete",
      progress: 100,
      phase: "Complete",
      videoUrl: publicUrl,
      durationSeconds: Math.round(finalDuration),
      fileSizeBytes: fileStat.size,
      completedAt: Date.now(),
    });

    // Cleanup entire output directory — video is on Cloudinary, no need to keep local copy
    try {
      const { rm } = await import("fs/promises");
      await rm(outputDir, { recursive: true, force: true });
    } catch { /* non-critical */ }

    console.log(`[Render] ✅ Job ${jobId} complete: ${publicUrl} (${Math.round(finalDuration)}s, ${(fileStat.size / 1024 / 1024).toFixed(1)}MB)`);

  } catch (err: any) {
    console.error(`[Render] ❌ Job ${jobId} failed:`, err.message);
    renderStore.update(jobId, {
      status: "failed",
      phase: "Failed",
      error: err.message || "Unknown render error",
    });

    // Persist failure to MongoDB
    try {
      await connectDB();
      const project = await Project.findById(projectId);
      if (project) {
        project.steps.render.status = "failed";
        project.steps.render.error = err.message || "Unknown render error";
        project.markModified("steps.render");
        await project.save();
      }
    } catch { /* ignore */ }

    // Cleanup temp files on failure too
    try {
      const { rm } = await import("fs/promises");
      await rm(outputDir, { recursive: true, force: true });
    } catch { /* non-critical */ }
  }
}

// ─── Route Handler ────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // 1. Auth
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    // 2. Parse body
    const body = await request.json();
    const { projectId, quality = "1080p" } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    if (!QUALITY_PRESETS[quality]) {
      return NextResponse.json({ error: `Invalid quality. Use: ${Object.keys(QUALITY_PRESETS).join(", ")}` }, { status: 400 });
    }

    // 3. Check for existing active render
    const existingJob = renderStore.getByProject(projectId);
    if (existingJob && existingJob.status !== "complete" && existingJob.status !== "failed") {
      return NextResponse.json({
        jobId: existingJob.jobId,
        status: existingJob.status,
        message: "Render already in progress",
      });
    }

    // 4. Load project and validate assets
    await connectDB();
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Validate required assets exist
    const images = project.steps?.images?.data || [];
    const scenes = project.steps?.scenes?.data || [];
    const audioUrl = project.steps?.voice?.audioUrl;
    const subtitles = normalizeSubtitles(project.steps?.subtitles);
    const subtitleSettings = project.steps?.subtitles?.settings;
    const animationData = project.steps?.animation?.data;

    if (!images.length) {
      return NextResponse.json({ error: "No images found. Complete the Images step first." }, { status: 400 });
    }
    if (!audioUrl) {
      return NextResponse.json({ error: "No audio found. Complete the Voice step first." }, { status: 400 });
    }

    // 5. Create render job
    const jobId = generateJobId();
    const job: RenderJob = {
      jobId,
      projectId,
      status: "queued",
      progress: 0,
      phase: "Queued",
      startedAt: Date.now(),
      quality,
    };
    renderStore.create(job);

    // Update project with job reference
    project.steps.render.jobId = jobId;
    project.steps.render.status = "rendering";
    project.steps.render.progress = 0;
    project.steps.render.quality = quality;
    project.steps.render.error = "";
    project.markModified("steps.render");
    await project.save();

    // 6. Fire and forget — run pipeline in background
    executeRenderPipeline(
      jobId,
      projectId,
      quality,
      images,
      scenes,
      audioUrl,
      subtitles,
      subtitleSettings,
      animationData,
    ).catch((err) => {
      console.error("[Render] Unhandled pipeline error:", err);
    });

    return NextResponse.json({
      success: true,
      jobId,
      status: "queued",
      message: "Render job started. Poll /api/ai/render/status for progress.",
    });

  } catch (error: any) {
    console.error("[/api/ai/render] Error:", error);
    return NextResponse.json(
      { error: "Internal server error starting render" },
      { status: 500 }
    );
  }
}

// ─── Cancel Render ────────────────────────────────────────────

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    const job = renderStore.get(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Kill the FFmpeg process and mark cancelled
    renderStore.killJob(jobId);

    // Clean up temp files
    try {
      const { rm } = await import("fs/promises");
      await rm(path.join("/tmp", "velora-renders", job.projectId), { recursive: true, force: true });
    } catch { /* non-critical */ }

    // Reset render status in MongoDB so user can start a new render
    await connectDB();
    const project = await Project.findOne({ _id: job.projectId, userId });
    if (project) {
      project.steps.render.status = "pending";
      project.steps.render.progress = 0;
      project.steps.render.jobId = "";
      project.steps.render.error = "";
      project.markModified("steps.render");
      await project.save();
    }

    return NextResponse.json({ success: true, message: "Render cancelled." });
  } catch (error: any) {
    console.error("[/api/ai/render DELETE] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
