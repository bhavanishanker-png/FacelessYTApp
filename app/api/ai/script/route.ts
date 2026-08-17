/**
 * POST /api/ai/script
 *
 * AI-powered script generator — creates a full video script
 * from a selected video idea, hook, format, and duration.
 *
 * Body:  { idea: string, hook: string, format: "shorts" | "long", duration: string }
 * Returns: { success: true, data: ScriptOutput } | { success: false, error: string }
 */

import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { askAIJSON, SCRIPT_SYSTEM_PROMPT, SCRIPT_CRITIC_SYSTEM_PROMPT, runCriticRefiner } from "@/lib/ai";
import type { ScriptOutput } from "@/lib/ai";

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
    const rl = await checkRateLimit(userId, "script", 5);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: `Rate limit exceeded. Try again in ${Math.ceil(rl.resetInMs / 1000)}s.` },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetInMs / 1000)) } }
      );
    }

    // ── Parse & Validate Input ────────────────────────────────
    let body: { idea?: string; hook?: string; format?: string; duration?: string | number };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const { idea, hook, format, duration } = body;

    if (!idea || typeof idea !== "string" || idea.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "\"idea\" is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    if (!hook || typeof hook !== "string" || hook.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "\"hook\" is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    const safeFormat = (format === "shorts" || format === "long") ? format : "long";
    const safeDuration = duration || (safeFormat === "shorts" ? "1 minute" : "5 minutes");

    // ── AI Generation ─────────────────────────────────────────
    const result = await askAIJSON<ScriptOutput>({
      systemPrompt: SCRIPT_SYSTEM_PROMPT,
      userMessage: [
        `Video Idea: "${idea.trim()}"`,
        `Selected Hook: "${hook.trim()}"`,
        `Target Format: ${safeFormat}`,
        `Target Duration: ${safeDuration}`,
        "",
        `Write a complete, highly engaging video script based on the above parameters.`,
        `Ensure the final structure has a Hook Intro, a Body, and a Payoff Ending.`,
      ].join("\n"),
      // Increase max tokens since scripts can be long, especially for long-form.
      maxTokens: safeFormat === "shorts" ? 1500 : 4000, 
      temperature: 0.7, // Balance between creativity and structure
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

    if (!data.sections || !Array.isArray(data.sections) || data.sections.length === 0) {
      return NextResponse.json(
        { success: false, error: "AI returned an empty or malformed script sections list." },
        { status: 502 }
      );
    }

    // ── Critic-Refiner Agent Loop ─────────────────────────────
    const refined = await runCriticRefiner<ScriptOutput>({
      draft: data,
      draftSerializer: (d) =>
        d.sections
          .map((s) => `[${s.label}] (${s.durationSeconds}s)\n${s.content}`)
          .join("\n\n"),
      critiqueSystemPrompt: SCRIPT_CRITIC_SYSTEM_PROMPT,
      critiqueContext: `Video Idea: "${idea.trim()}"\nHook: "${hook.trim()}"\nFormat: ${safeFormat}\nDuration: ${safeDuration}`,
      refineSystemPrompt: SCRIPT_SYSTEM_PROMPT,
      buildRefineMessage: (draft, critique) =>
        [
          `Video Idea: "${idea.trim()}"`,
          `Selected Hook: "${hook.trim()}"`,
          `Target Format: ${safeFormat}`,
          `Target Duration: ${safeDuration}`,
          "",
          `--- CRITIC FEEDBACK (score: ${critique.score}/10) ---`,
          `Weaknesses: ${critique.weaknesses.join("; ")}`,
          `Required improvements: ${critique.improvements}`,
          `--- END CRITIC FEEDBACK ---`,
          "",
          `Rewrite the full script addressing every point in the critic's feedback.`,
          `Ensure the final structure has a Hook Intro, a Body, and a Payoff Ending.`,
        ].join("\n"),
      threshold: 7,
      maxIterations: 2,
    });

    // ── Response ──────────────────────────────────────────────
    return NextResponse.json(
      {
        success: true,
        data: refined.data,
        agentMeta: {
          score: refined.critique.score,
          iterations: refined.iterations,
          improved: refined.improved,
          strengths: refined.critique.strengths,
          weaknesses: refined.critique.weaknesses,
        },
        usage: result.usage,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[/api/ai/script] Unhandled error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
