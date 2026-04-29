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
import OpenAI from "openai";
import type { ImageStyle, SceneImageOutput } from "@/lib/ai/types";

// ─── Style Prompt Augmentations ───────────────────────────────

const STYLE_MODIFIERS: Record<ImageStyle, string> = {
  cinematic:
    "Cinematic composition, dramatic lighting, anamorphic lens flare, film grain, 35mm photography, shallow depth of field, moody color grading, high contrast shadows",
  anime:
    "Studio Ghibli inspired anime art style, vibrant cel-shading, expressive linework, soft pastel palette, atmospheric watercolor backgrounds, anime aesthetic",
  realistic:
    "Photorealistic, ultra high resolution, natural lighting, DSLR quality, hyper-detailed textures, accurate proportions, photojournalism style",
  minimal:
    "Clean minimalist illustration, flat design, geometric shapes, limited color palette, whitespace emphasis, modern graphic design, vector art style",
};

// ─── OpenAI Client ────────────────────────────────────────────

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (openaiClient) return openaiClient;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY — add it to .env.local");
  }

  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

// ─── Single Image Generator (with retry) ──────────────────────

async function generateSingleImage(
  prompt: string,
  style: ImageStyle,
  retries = 2
): Promise<{ imageUrl: string; error?: string }> {
  const openai = getOpenAI();
  const augmentedPrompt = `${prompt}. Style: ${STYLE_MODIFIERS[style]}. Do NOT include any text, watermarks, or logos in the image.`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: augmentedPrompt.slice(0, 4000), // DALL-E 3 max prompt length
        n: 1,
        size: "1792x1024", // Widescreen for video scenes
        quality: "standard",
        response_format: "url",
      });

      const url = response.data?.[0]?.url;
      if (url) {
        return { imageUrl: url };
      }

      throw new Error("No image URL in response");
    } catch (err: any) {
      console.error(`[Image Gen] Attempt ${attempt + 1} failed for prompt: "${prompt.slice(0, 60)}..."`, err.message);

      // Don't retry on content policy violations or auth errors
      if (err.status === 400 || err.status === 401 || err.status === 403) {
        return {
          imageUrl: "",
          error: err.status === 400
            ? "Content policy violation — prompt was rejected"
            : `Auth error (${err.status})`,
        };
      }

      // Rate limit — wait and retry
      if (err.status === 429 && attempt < retries) {
        const waitMs = Math.min(2000 * (attempt + 1), 10000);
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

      const result = await generateSingleImage(sceneToRegen.prompt, style);

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

    // Generate all images concurrently with controlled concurrency
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

          const result = await generateSingleImage(prompt, style);

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

    if (error.message?.includes("OPENAI_API_KEY")) {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Add OPENAI_API_KEY to .env.local" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error during image generation" },
      { status: 500 }
    );
  }
}
