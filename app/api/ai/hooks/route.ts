/**
 * POST /api/ai/hooks
 *
 * AI-powered hook generator — creates 5 high-CTR hooks
 * from a selected video idea, niche, and tone.
 *
 * Body:  { idea: string, niche: string, tone: "dramatic" | "emotional" | "curiosity" }
 * Returns: { success: true, data: ViralHooksOutput } | { success: false, error: string }
 */

import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { askAIJSON, VIRAL_HOOKS_SYSTEM_PROMPT, HOOKS_CRITIC_SYSTEM_PROMPT, runCriticRefiner } from "@/lib/ai";
import type { ViralHooksOutput, HookTone } from "@/lib/ai";
import { retrieveHookFormulas, formatFormulasAsContext } from "@/lib/rag/retriever";

// ─── Input Validation ─────────────────────────────────────────

const VALID_TONES: HookTone[] = ["dramatic", "emotional", "curiosity"];

function isValidTone(value: unknown): value is HookTone {
  return typeof value === "string" && VALID_TONES.includes(value as HookTone);
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
    const rl = await checkRateLimit(userId, "hooks", 10);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: `Rate limit exceeded. Try again in ${Math.ceil(rl.resetInMs / 1000)}s.` },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetInMs / 1000)) } }
      );
    }

    // ── Parse & Validate Input ────────────────────────────────
    let body: { idea?: string; niche?: string; tone?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const { idea, niche, tone } = body;

    if (!idea || typeof idea !== "string" || idea.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "\"idea\" is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    if (!niche || typeof niche !== "string" || niche.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "\"niche\" is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    if (!isValidTone(tone)) {
      return NextResponse.json(
        { success: false, error: "\"tone\" must be one of: \"dramatic\", \"emotional\", \"curiosity\"." },
        { status: 400 }
      );
    }

    // ── RAG: Retrieve top-3 hook formulas for this topic ─────
    const ragQuery = `${idea.trim()} ${niche.trim()} ${tone}`;
    const retrievedFormulas = await retrieveHookFormulas(ragQuery, 3);
    const formulaContext = formatFormulasAsContext(retrievedFormulas);

    // ── AI Generation ─────────────────────────────────────────
    const result = await askAIJSON<ViralHooksOutput>({
      systemPrompt: VIRAL_HOOKS_SYSTEM_PROMPT,
      userMessage: [
        `Video Idea: "${idea.trim()}"`,
        `Niche: ${niche.trim()}`,
        `Tone: ${tone}`,
        "",
        `--- PROVEN HOOK FORMULAS (retrieved for this topic) ---`,
        formulaContext,
        `--- END FORMULAS ---`,
        "",
        `Generate 5 killer hooks for this video idea.`,
        `Use the retrieved formulas above as structural inspiration — adapt their patterns to this specific idea and niche. Do NOT copy the examples verbatim.`,
        `The tone must be "${tone}" — every hook should drip with ${tone === "dramatic" ? "urgency and power" : tone === "emotional" ? "vulnerability and relatability" : "open loops and incomplete reveals"}.`,
        `Make them impossible to scroll past.`,
      ].join("\n"),
      maxTokens: 1500,
      temperature: 0.9, // high creativity for varied hooks
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

    if (!data.hooks || !Array.isArray(data.hooks) || data.hooks.length === 0) {
      return NextResponse.json(
        { success: false, error: "AI returned an empty or malformed hooks list." },
        { status: 502 }
      );
    }

    // ── Critic-Refiner Agent Loop ─────────────────────────────
    const refined = await runCriticRefiner<ViralHooksOutput>({
      draft: data,
      draftSerializer: (d) =>
        d.hooks
          .map((h, i) => `Hook ${i + 1} [${h.style}] (score: ${h.score}):\n${h.text}`)
          .join("\n\n"),
      critiqueSystemPrompt: HOOKS_CRITIC_SYSTEM_PROMPT,
      critiqueContext: `Video Idea: "${idea.trim()}"\nNiche: ${niche.trim()}\nTone: ${tone}`,
      refineSystemPrompt: VIRAL_HOOKS_SYSTEM_PROMPT,
      buildRefineMessage: (draft, critique) =>
        [
          `Video Idea: "${idea.trim()}"`,
          `Niche: ${niche.trim()}`,
          `Tone: ${tone}`,
          "",
          `--- PROVEN HOOK FORMULAS ---`,
          formulaContext,
          `--- END FORMULAS ---`,
          "",
          `--- CRITIC FEEDBACK (score: ${critique.score}/10) ---`,
          `Weaknesses: ${critique.weaknesses.join("; ")}`,
          `Required improvements: ${critique.improvements}`,
          `--- END CRITIC FEEDBACK ---`,
          "",
          `Rewrite all 5 hooks to address the critic's feedback. Target score 8+.`,
          `Maintain the "${tone}" tone throughout.`,
        ].join("\n"),
      threshold: 7,
      maxIterations: 2,
    });

    // ── Response ──────────────────────────────────────────────
    return NextResponse.json(
      {
        success: true,
        data: {
          hooks: refined.data.hooks,
          idea: idea.trim(),
          tone,
          ragFormulas: retrievedFormulas.map((f) => ({
            id: f.id,
            formula: f.formula,
            style: f.style,
            psychTrigger: f.psychTrigger,
          })),
        },
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
    console.error("[/api/ai/hooks] Unhandled error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
