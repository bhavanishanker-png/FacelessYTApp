/**
 * POST /api/ai/scenes
 *
 * AI-powered scene breakdown generator — converts a script
 * into distinct visual scenes with image prompts and durations.
 *
 * Body:  { script: string }
 * Returns: { success: true, data: ScenesOutput } | { success: false, error: string }
 */

import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { askAIJSON, SCENES_SYSTEM_PROMPT } from "@/lib/ai";
import type { ScenesOutput } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // ── Parse & Validate Input ────────────────────────────────
    let body: { script?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const { script } = body;

    if (!script || typeof script !== "string" || script.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "\"script\" is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    // ── AI Generation ─────────────────────────────────────────
    const result = await askAIJSON<ScenesOutput>({
      systemPrompt: SCENES_SYSTEM_PROMPT,
      userMessage: [
        `Here is the video script:`,
        `---`,
        script.trim(),
        `---`,
        `Break this down into high-retention visual scenes. Ensure pacing is good, visuals are strong, and image prompts are useful for AI image generators.`,
      ].join("\n"),
      maxTokens: 4000, // Scenes can be quite large
      temperature: 0.6, // More deterministic for structural breakdown
    });

    // ── Handle AI Errors ──────────────────────────────────────
    if (!result.success) {
      const status = result.code === "RATE_LIMITED" ? 429 : 500;
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          code: result.code,
          ...(result.retryAfterMs && { retryAfterMs: result.retryAfterMs }),
        },
        { status }
      );
    }

    // ── Validate AI Output ────────────────────────────────────
    const { data } = result;

    if (!data.scenes || !Array.isArray(data.scenes) || data.scenes.length === 0) {
      return NextResponse.json(
        { success: false, error: "AI returned an empty or malformed scenes list." },
        { status: 502 }
      );
    }

    // ── Response ──────────────────────────────────────────────
    return NextResponse.json(
      {
        success: true,
        data,
        usage: result.usage,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[/api/ai/scenes] Unhandled error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
