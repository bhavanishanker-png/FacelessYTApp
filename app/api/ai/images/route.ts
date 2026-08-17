/**
 * POST /api/ai/images  — Start async batch image generation (fire-and-forget)
 * GET  /api/ai/images  — Poll generation progress
 *
 * Batch generation returns immediately; client polls until status === "complete".
 * Single-scene regeneration (sceneId param) stays synchronous.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";

import type { ImageStyle, SceneImageOutput } from "@/lib/ai/types";

// ─── Style Config ─────────────────────────────────────────────

const STYLE_MODIFIERS: Record<ImageStyle, string> = {
  cinematic:
    "cinematic composition, dramatic lighting, anamorphic lens flare, film grain, 35mm photography, shallow depth of field, moody color grading, high contrast shadows, masterpiece, ultra-detailed, 8k uhd, professional cinematography",
  anime:
    "Studio Ghibli inspired anime art style, vibrant cel-shading, expressive linework, soft pastel palette, atmospheric watercolor backgrounds, anime aesthetic, masterpiece, highly detailed, professional illustration",
  realistic:
    "photorealistic, ultra high resolution, natural lighting, DSLR quality, hyper-detailed textures, accurate proportions, photojournalism style, 8k uhd, award-winning photography, professional color grading",
  minimal:
    "clean minimalist illustration, flat design, geometric shapes, limited color palette, whitespace emphasis, modern graphic design, vector art style, professional, high quality",
};

// FLUX.1-schnell is deprecated on hf-inference; SD3 is the current supported text-to-image model
const HF_MODEL = "stabilityai/stable-diffusion-3-medium-diffusers";
const HF_API_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`;

// ─── Pollinations fallback ────────────────────────────────────

const POLLINATIONS_STYLE_MODELS: Record<ImageStyle, string> = {
  cinematic: "flux",
  anime: "flux-anime",
  realistic: "flux-realism",
  minimal: "flux",
};

async function generateViaPollinationsWithRetry(
  augmentedPrompt: string,
  style: ImageStyle,
  projectId: string,
  sceneId: string
): Promise<{ imageUrl: string; error?: string }> {
  const seed = Math.floor(Math.random() * 100000000);
  const model = POLLINATIONS_STYLE_MODELS[style];
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(augmentedPrompt)}?width=1280&height=720&nologo=true&enhance=true&model=${model}&seed=${seed}`;

  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      if (response.status === 429) {
        const waitMs = parseInt(response.headers.get("retry-after") ?? "30", 10) * 1000;
        console.warn(`[Image Gen] Pollinations 429 for ${sceneId} — waiting ${waitMs / 1000}s`);
        if (attempt < 2) { await new Promise((r) => setTimeout(r, waitMs)); continue; }
        return { imageUrl: "", error: "Pollinations rate limit" };
      }

      if (!response.ok) throw new Error(`Pollinations ${response.status}`);

      const buffer = Buffer.from(await response.arrayBuffer());
      const { uploadBufferToCloudinary } = await import("@/lib/storage");
      const result = await uploadBufferToCloudinary(buffer, `faceless-yt/projects/${projectId}/images`, "image", sceneId);
      console.log(`[Image Gen] Pollinations fallback success for ${sceneId}`);
      return { imageUrl: result.url };
    } catch (err: any) {
      if (attempt < 2) { await new Promise((r) => setTimeout(r, 5000 * (attempt + 1))); continue; }
      return { imageUrl: "", error: err.message };
    }
  }
  return { imageUrl: "", error: "Pollinations exhausted retries" };
}

// ─── Single Image Generator (HuggingFace → Pollinations fallback) ──

async function generateSingleImage(
  prompt: string,
  style: ImageStyle,
  projectId: string,
  sceneId: string,
  retries = 2
): Promise<{ imageUrl: string; error?: string }> {
  const apiKey = process.env.HF_TOKEN ?? process.env.HUGGINGFACE_API_KEY;
  const augmentedPrompt = `${prompt}. ${STYLE_MODIFIERS[style]}. No text, watermarks, or logos.`;
  const seed = Math.floor(Math.random() * 2147483647);

  // ── HuggingFace (primary) ─────────────────────────────────────
  if (apiKey) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90_000);

        let response: Response;
        try {
          response = await fetch(HF_API_URL, {
            method: "POST",
            signal: controller.signal,
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ inputs: augmentedPrompt }),
          });
        } finally {
          clearTimeout(timeoutId);
        }

        if (response.status === 503) {
          const json = await response.json().catch(() => ({}));
          const waitSec = (json.estimated_time ?? 20) + 2;
          console.warn(`[Image Gen] HF model loading for ${sceneId} — waiting ${waitSec}s`);
          if (attempt < retries) { await new Promise((r) => setTimeout(r, waitSec * 1000)); continue; }
          break; // fall through to Pollinations
        }

        if (response.status === 429) {
          const waitMs = parseInt(response.headers.get("retry-after") ?? "30", 10) * 1000;
          console.warn(`[Image Gen] HF 429 for ${sceneId} — waiting ${waitMs / 1000}s`);
          if (attempt < retries) { await new Promise((r) => setTimeout(r, waitMs)); continue; }
          break; // fall through to Pollinations
        }

        if (!response.ok) {
          const text = await response.text().catch(() => `status ${response.status}`);
          throw new Error(`HuggingFace API error ${response.status}: ${text.slice(0, 200)}`);
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        const { uploadBufferToCloudinary } = await import("@/lib/storage");
        const result = await uploadBufferToCloudinary(buffer, `faceless-yt/projects/${projectId}/images`, "image", sceneId);
        console.log(`[Image Gen] HF success for ${sceneId}`);
        return { imageUrl: result.url };
      } catch (err: any) {
        const cause = err.name === "AbortError" ? "timeout (90s)" : (err.cause?.code ?? err.message);
        console.warn(`[Image Gen] HF attempt ${attempt + 1} failed for ${sceneId}: ${cause}`);

        if (err.message?.includes("Invalid cloud_name") || err.message?.includes("Must supply api_key")) {
          return { imageUrl: "", error: `Cloudinary config error: ${err.message}` };
        }

        const isNetworkError = err.cause?.code === "ENOTFOUND" || err.cause?.code === "ECONNREFUSED";
        if (isNetworkError) {
          console.warn(`[Image Gen] HF unreachable — falling back to Pollinations for ${sceneId}`);
          break; // skip remaining HF retries, go straight to Pollinations
        }

        if (attempt < retries) { await new Promise((r) => setTimeout(r, 5000 * (attempt + 1))); continue; }
        break; // fall through to Pollinations
      }
    }
  }

  // ── Pollinations (fallback) ───────────────────────────────────
  console.log(`[Image Gen] Using Pollinations for ${sceneId}`);
  return generateViaPollinationsWithRetry(augmentedPrompt, style, projectId, sceneId);
}

// ─── Background Batch Generator ───────────────────────────────

async function generateImagesBackground(
  projectId: string,
  userId: string,
  scenes: { sceneId: string; prompt: string }[],
  style: ImageStyle
) {
  const IMAGE_GAP_MS = 3000;

  try {
    await connectDB();

    for (let i = 0; i < scenes.length; i++) {
      if (i > 0) await new Promise((r) => setTimeout(r, IMAGE_GAP_MS));

      const { sceneId, prompt } = scenes[i];

      let imageUrl = "";
      let status: "success" | "failed" = "success";
      let error = "";

      if (!prompt) {
        status = "failed";
        error = "No prompt provided";
      } else {
        const result = await generateSingleImage(prompt, style, projectId, sceneId);
        imageUrl = result.imageUrl;
        if (result.error) { status = "failed"; error = result.error; }
      }

      // Atomic per-scene update — no read-modify-write race
      await Project.findOneAndUpdate(
        { _id: projectId, userId },
        {
          $set: {
            [`steps.images.data.${i}.imageUrl`]: imageUrl,
            [`steps.images.data.${i}.status`]: status,
            [`steps.images.data.${i}.error`]: error,
          },
        }
      );
    }

    await Project.findOneAndUpdate(
      { _id: projectId, userId },
      { $set: { "steps.images.status": "complete" } }
    );
  } catch (err: any) {
    console.error("[Image Gen Background] Fatal error:", err.message);
    try {
      await Project.findOneAndUpdate(
        { _id: projectId, userId },
        { $set: { "steps.images.status": "failed" } }
      );
    } catch {}
  }
}

// ─── GET — Poll Progress ───────────────────────────────────────

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json({ error: "projectId required" }, { status: 400 });
    }

    await connectDB();
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const imagesStep = project.steps?.images;
    const data: any[] = imagesStep?.data || [];
    const total = data.length;
    const completed = data.filter((i: any) => i.status === "success" || i.status === "failed").length;

    return NextResponse.json({
      status: imagesStep?.status || "pending",
      style: imagesStep?.style || "cinematic",
      images: data,
      total,
      completed,
    });
  } catch (error: any) {
    console.error("[GET /api/ai/images] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST — Start Generation ───────────────────────────────────

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const { checkRateLimit } = await import("@/lib/rateLimit");
    const rl = await checkRateLimit(userId, "images", 5);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${Math.ceil(rl.resetInMs / 1000)}s.` },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetInMs / 1000)) } }
      );
    }

    const body = await request.json();
    const { projectId, scenes, style = "cinematic", sceneId } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const validStyles: ImageStyle[] = ["cinematic", "anime", "realistic", "minimal"];
    if (!validStyles.includes(style)) {
      return NextResponse.json(
        { error: `Invalid style. Must be one of: ${validStyles.join(", ")}` },
        { status: 400 }
      );
    }

    await connectDB();
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // ── Single Scene Regen (stays synchronous — one image is fast) ──
    if (sceneId) {
      const existingImages = project.steps?.images?.data || [];
      const sceneToRegen = existingImages.find((img: any) => img.sceneId === sceneId);

      if (!sceneToRegen) {
        return NextResponse.json({ error: `Scene ${sceneId} not found` }, { status: 404 });
      }

      const result = await generateSingleImage(sceneToRegen.prompt, style, projectId, sceneId);

      const updatedImages = existingImages.map((img: any) =>
        img.sceneId === sceneId
          ? { ...img, imageUrl: result.imageUrl || img.imageUrl, status: result.error ? "failed" : "success", error: result.error || "" }
          : img
      );

      project.steps.images.data = updatedImages;
      project.steps.images.style = style;
      project.markModified("steps.images");
      await project.save();

      return NextResponse.json({
        success: true,
        data: { sceneId, imageUrl: result.imageUrl, status: result.error ? "failed" : "success", error: result.error },
      });
    }

    // ── Batch Generation — fire and forget ────────────────────
    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return NextResponse.json({ error: "scenes array is required" }, { status: 400 });
    }

    const scenesPayload = scenes.map((s: any, i: number) => ({
      sceneId: s.sceneId || `scene_${i + 1}`,
      prompt: s.prompt || s.imagePrompt || "",
    }));

    // Initialize all scenes as pending in MongoDB
    const initialImages: SceneImageOutput[] = scenesPayload.map((s) => ({
      sceneId: s.sceneId,
      imageUrl: "",
      prompt: s.prompt,
      status: "pending" as const,
      error: "",
    }));

    project.steps.images = { status: "generating", style, data: initialImages };
    project.markModified("steps.images");
    await project.save();

    // Fire and forget — Node.js continues the async work after response is sent
    generateImagesBackground(projectId, userId, scenesPayload, style).catch(console.error);

    return NextResponse.json({
      success: true,
      status: "generating",
      total: scenesPayload.length,
    });
  } catch (error: any) {
    console.error("[POST /api/ai/images] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
