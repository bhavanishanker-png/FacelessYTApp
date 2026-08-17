/**
 * Critic-Refiner Agent Loop
 *
 * A two-agent pattern:
 *   1. Critic  — scores a draft (1-10) and lists specific weaknesses
 *   2. Refiner — rewrites the draft guided by the critique
 *
 * Loops up to `maxIterations` times. Stops early if score >= threshold.
 * Returns the best version alongside the final critique and iteration count.
 */

import { askAIJSON } from "./provider";

export interface CritiqueOutput {
  score: number;
  strengths: string[];
  weaknesses: string[];
  improvements: string;
}

export interface CriticRefinedResult<T> {
  data: T;
  critique: CritiqueOutput;
  iterations: number;
  improved: boolean;
}

export async function runCriticRefiner<T>(options: {
  draft: T;
  draftSerializer: (d: T) => string;
  critiqueSystemPrompt: string;
  critiqueContext: string;
  refineSystemPrompt: string;
  buildRefineMessage: (draft: T, critique: CritiqueOutput) => string;
  threshold?: number;
  maxIterations?: number;
}): Promise<CriticRefinedResult<T>> {
  const {
    critiqueSystemPrompt,
    critiqueContext,
    refineSystemPrompt,
    buildRefineMessage,
    draftSerializer,
    threshold = 7,
    maxIterations = 2,
  } = options;

  let current = options.draft;
  let lastCritique: CritiqueOutput = {
    score: 0,
    strengths: [],
    weaknesses: [],
    improvements: "",
  };
  let iterations = 0;
  let improved = false;

  for (let i = 0; i < maxIterations; i++) {
    // ── Critic step ──────────────────────────────────────────────
    const critiqueResult = await askAIJSON<CritiqueOutput>({
      systemPrompt: critiqueSystemPrompt,
      userMessage: `${critiqueContext}\n\nContent to evaluate:\n${draftSerializer(current)}`,
      maxTokens: 600,
      temperature: 0.3,
    });

    if (!critiqueResult.success) break;

    lastCritique = critiqueResult.data;
    iterations++;

    if (lastCritique.score >= threshold) break;

    // ── Refiner step ─────────────────────────────────────────────
    const refineResult = await askAIJSON<T>({
      systemPrompt: refineSystemPrompt,
      userMessage: buildRefineMessage(current, lastCritique),
      maxTokens: 4000,
      temperature: 0.8,
    });

    if (!refineResult.success) break;

    current = refineResult.data;
    improved = true;
  }

  return { data: current, critique: lastCritique, iterations, improved };
}
