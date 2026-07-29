/**
 * POST /api/ai/ideas
 *
 * Standalone AI idea generator — not tied to a specific project.
 * Generates 10 viral faceless YouTube video ideas for a given niche.
 *
 * Body:  { niche: string, platform: "shorts" | "long" }
 * Returns: { success: true, data: ViralIdeasOutput } | { success: false, error: string }
 */

import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { askAIJSON, VIRAL_IDEAS_SYSTEM_PROMPT } from "@/lib/ai";
import type { ViralIdeasOutput } from "@/lib/ai";
import { retrieveViralContent, formatViralContentAsContext } from "@/lib/rag/viralContentRetriever";

// ─── Input Validation ─────────────────────────────────────────

const VALID_PLATFORMS = ["shorts", "long"] as const;
type Platform = (typeof VALID_PLATFORMS)[number];

function isValidPlatform(value: unknown): value is Platform {
  return typeof value === "string" && VALID_PLATFORMS.includes(value as Platform);
}

// ─── Route Handler ────────────────────────────────────────────

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
    const userId = (session.user as any).id;

    // ── Rate Limit ────────────────────────────────────────────
    const { checkRateLimit } = await import("@/lib/rateLimit");
    const rl = await checkRateLimit(userId, "ideas", 10);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: `Rate limit exceeded. Try again in ${Math.ceil(rl.resetInMs / 1000)}s.` },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetInMs / 1000)) } }
      );
    }

    // ── Parse & Validate Input ────────────────────────────────
    let body: { niche?: string; platform?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const { niche, platform } = body;

    if (!niche || typeof niche !== "string" || niche.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "\"niche\" is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    if (!isValidPlatform(platform)) {
      return NextResponse.json(
        { success: false, error: "\"platform\" must be either \"shorts\" or \"long\"." },
        { status: 400 }
      );
    }

    // ── RAG: Retrieve Viral Content Examples ─────────────────
    let ragContext = "";
    let ragCount = 0;
    try {
      const ragQuery = `${niche.trim()} ${platform} viral youtube content`;
      const viralExamples = await retrieveViralContent(ragQuery, 5);
      if (viralExamples.length > 0) {
        ragContext = formatViralContentAsContext(viralExamples);
        ragCount = viralExamples.length;
      }
    } catch (ragErr) {
      // Non-fatal — proceed without RAG context if DB unavailable
      console.warn("[/api/ai/ideas] RAG retrieval failed (proceeding without):", ragErr);
    }

    // ── AI Generation ─────────────────────────────────────────
    const userMessage = [
      `Niche: "${niche.trim()}"`,
      `Platform: ${platform}`,
      "",
      ...(ragContext
        ? [
            "--- VIRAL CONTENT KNOWLEDGE BASE ---",
            "Study these proven high-performing videos from similar niches.",
            "Learn their hook styles, storytelling patterns, and viral factors.",
            "Use this intelligence to craft superior ideas for this niche:",
            ragContext,
            "--- END KNOWLEDGE BASE ---",
            "",
          ]
        : []),
      `Generate 10 viral faceless YouTube ${platform === "shorts" ? "Shorts" : "long-form video"} ideas for the "${niche.trim()}" niche.`,
      "Apply the hook styles, storytelling patterns, and viral factors from the examples above.",
      "Make every title irresistibly clickable. Sort by virality score (highest first).",
    ].join("\n");

    const result = await askAIJSON<ViralIdeasOutput>({
      systemPrompt: VIRAL_IDEAS_SYSTEM_PROMPT,
      userMessage,
      maxTokens: 2500,
      temperature: 0.85,
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

    if (!data.ideas || !Array.isArray(data.ideas) || data.ideas.length === 0) {
      return NextResponse.json(
        { success: false, error: "AI returned an empty or malformed ideas list." },
        { status: 502 }
      );
    }

    // ── Response ──────────────────────────────────────────────
    return NextResponse.json(
      {
        success: true,
        data: {
          ideas: data.ideas,
          niche: niche.trim(),
          platform,
          ragExamplesUsed: ragCount,
        },
        usage: result.usage,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[/api/ai/ideas] Unhandled error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
