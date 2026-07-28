/**
 * POST /api/ai/images
 *
 * Generates one image per scene using OpenAI DALL-E 3.
 * Supports:
 *  - Full batch generation (all scenes)
 *  - Single scene regeneration (sceneId param)
 *  - Style presets that augment prompts
 *  - Automatic retry on transient failures
 *  - Results saved to MongoDB steps.images
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";

import type { ImageStyle, SceneImageOutput } from "@/lib/ai/types";

// ─── Style Prompt Augmentations ───────────────────────────────

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

// Best Pollinations model per style
const STYLE_MODELS: Record<ImageStyle, string> = {
  cinematic: "flux",
  anime: "flux-anime",
  realistic: "flux-realism",
  minimal: "flux",
};

// (OpenAI removed - using Pollinations instead)

// ─── Single Image Generator (with retry) ──────────────────────

async function generateSingleImage(
  prompt: string,
  style: ImageStyle,
  projectId: string,
  sceneId: string,
  retries = 2
): Promise<{ imageUrl: string; error?: string }> {
  const augmentedPrompt = `${prompt}. Style: ${STYLE_MODIFIERS[style]}. Do NOT include any text, watermarks, or logos in the image.`;
  const seed = Math.floor(Math.random() * 100000000);
  const model = STYLE_MODELS[style];
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(augmentedPrompt)}?width=1920&height=1080&nologo=true&enhance=true&model=${model}&seed=${seed}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(pollinationsUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });
      
      if (!response.ok) {
        throw new Error(`Pollinations API error: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Cloudinary to persist the image
      const { uploadBufferToCloudinary } = await import("@/lib/storage");
      const folderPath = `faceless-yt/projects/${projectId}/images`;
      const result = await uploadBufferToCloudinary(buffer, folderPath, "image", sceneId);
      
      console.log(`[Image Gen] Success! Image generated & saved for scene ${sceneId}`);
      return { imageUrl: result.url };
    } catch (err: any) {
      console.error(`[Image Gen] Attempt ${attempt + 1} failed for prompt: "${prompt.slice(0, 60)}..."`, err.message);

      // Fail fast for deterministic configuration errors
      if (err.message.includes("Invalid cloud_name") || err.message.includes("Must supply api_key")) {
         return {
           imageUrl: "",
           error: `Cloudinary Configuration Error: ${err.message}. Please check your .env.local file.`,
         };
      }

      // Rate limit or transient error — wait and retry
      if (attempt < retries) {
        // Backoff slightly more aggressively for Pollinations
        const waitMs = Math.min(3000 * (attempt + 1), 12000);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }

      if (attempt === retries) {
        return {
          imageUrl: "",
          error: err.message || "Image generation failed after retries",
        };
      }
    }
  }

  return { imageUrl: "", error: "Exhausted retries" };
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

    // Rate limit — image generation hits Pollinations + Cloudinary on every call
    const { checkRateLimit } = await import("@/lib/rateLimit");
    const rl = await checkRateLimit(userId, "images", 5);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${Math.ceil(rl.resetInMs / 1000)}s.` },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetInMs / 1000)) } }
      );
    }

    // 2. Parse body
    const body = await request.json();
    const {
      projectId,
      scenes,
      style = "cinematic",
      sceneId, // Optional: for single-scene regeneration
    } = body;

    // 3. Validate
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

    // ─── Single Scene Regeneration ─────────────────────────────
    if (sceneId) {
      const existingImages = project.steps?.images?.data || [];
      const sceneToRegen = existingImages.find((img: any) => img.sceneId === sceneId);

      if (!sceneToRegen) {
        return NextResponse.json(
          { error: `Scene ${sceneId} not found in existing images` },
          { status: 404 }
        );
      }

      const result = await generateSingleImage(sceneToRegen.prompt, style, projectId, sceneId);

      // Update only the specific scene in the array
      const updatedImages = existingImages.map((img: any) =>
        img.sceneId === sceneId
          ? {
              ...img,
              imageUrl: result.imageUrl || img.imageUrl,
              status: result.error ? "failed" : "success",
              error: result.error || "",
            }
          : img
      );

      project.steps.images.data = updatedImages;
      project.steps.images.style = style;
      project.markModified("steps.images");
      await project.save();

      return NextResponse.json({
        success: true,
        data: {
          sceneId,
          imageUrl: result.imageUrl,
          status: result.error ? "failed" : "success",
          error: result.error,
        },
      });
    }

    // ─── Batch Generation ──────────────────────────────────────
    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return NextResponse.json(
        { error: "scenes array is required for batch generation" },
        { status: 400 }
      );
    }

    // Generate all images concurrently (restored to 3 now that User-Agent and seed are bypassing rate limits)
    const CONCURRENCY = 3;
    const results: SceneImageOutput[] = [];

    for (let i = 0; i < scenes.length; i += CONCURRENCY) {
      const batch = scenes.slice(i, i + CONCURRENCY);

      const batchResults = await Promise.all(
        batch.map(async (scene: any, batchIdx: number) => {
          const sceneIndex = i + batchIdx;
          const id = scene.sceneId || `scene_${sceneIndex + 1}`;
          const prompt = scene.prompt || scene.imagePrompt || "";

          if (!prompt) {
            return {
              sceneId: id,
              imageUrl: "",
              prompt: "",
              status: "failed" as const,
              error: "No prompt provided for this scene",
            };
          }

          const result = await generateSingleImage(prompt, style, projectId, id);

          return {
            sceneId: id,
            imageUrl: result.imageUrl,
            prompt,
            status: (result.error ? "failed" : "success") as "success" | "failed",
            error: result.error || "",
          };
        })
      );

      results.push(...batchResults);
    }

    // 4. Persist to MongoDB
    project.steps.images = {
      status: "editing",
      style,
      data: results,
    };
    project.markModified("steps.images");
    await project.save();

    return NextResponse.json({
      success: true,
      data: {
        images: results,
        style,
        generatedAt: new Date().toISOString(),
        stats: {
          total: results.length,
          succeeded: results.filter((r) => r.status === "success").length,
          failed: results.filter((r) => r.status === "failed").length,
        },
      },
    });
  } catch (error: any) {
    console.error("[/api/ai/images] Error:", error);



    return NextResponse.json(
      { error: "Internal server error during image generation" },
      { status: 500 }
    );
  }
}
