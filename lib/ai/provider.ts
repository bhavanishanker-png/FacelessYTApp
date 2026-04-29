/**
 * AI Provider — Anthropic Claude integration.
 *
 * This is the single point of contact with the Claude API.
 * All step routes call `askAI()` or `askAIJSON()` from here.
 *
 * To swap providers (OpenAI / Gemini), only this file needs to change.
 * The rest of the app is provider-agnostic via shared types.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { AIRequestOptions, AIResult } from "./types";

// ─── Singleton Client ─────────────────────────────────────────

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (client) return client;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing ANTHROPIC_API_KEY — add it to .env.local"
    );
  }

  client = new Anthropic({ apiKey });
  return client;
}

// ─── Model Config ─────────────────────────────────────────────

const MODEL_ID = "claude-sonnet-4-20250514";
const DEFAULT_MAX_TOKENS = 2048;
const DEFAULT_TEMPERATURE = 0.7;

// ─── Rate-Limit Helpers ───────────────────────────────────────

/**
 * Extracts Retry-After from Anthropic 429 errors.
 * Returns milliseconds to wait, or a sensible default.
 */
function extractRetryAfter(error: unknown): number {
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    (error as any).status === 429
  ) {
    const headers = (error as any).headers;
    const retryAfter = headers?.["retry-after"];
    if (retryAfter) return parseInt(retryAfter, 10) * 1000;
    return 60_000; // default 60s
  }
  return 0;
}

// ─── Core: Raw Text Response ──────────────────────────────────

/**
 * Send a prompt to Claude and get back raw text.
 * Use `askAIJSON()` instead when you need structured data.
 */
export async function askAI(
  options: AIRequestOptions
): Promise<AIResult<string>> {
  try {
    const anthropic = getClient();

    const response = await anthropic.messages.create({
      model: MODEL_ID,
      max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: options.temperature ?? DEFAULT_TEMPERATURE,
      system: options.systemPrompt,
      messages: [
        {
          role: "user",
          content: options.userMessage,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return {
        success: false,
        error: "Claude returned no text content.",
        code: "PROVIDER_ERROR",
      };
    }

    return {
      success: true,
      data: textBlock.text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  } catch (error: unknown) {
    return handleProviderError(error);
  }
}

// ─── Core: Typed JSON Response ────────────────────────────────

/**
 * Send a prompt to Claude and parse the response as JSON.
 *
 * The system prompt should explicitly instruct Claude to respond
 * with valid JSON only — no markdown, no explanations.
 *
 * @template T - The expected shape of the parsed JSON.
 */
export async function askAIJSON<T = unknown>(
  options: AIRequestOptions
): Promise<AIResult<T>> {
  // Augment the system prompt with strict JSON instruction
  const jsonSystemPrompt = `${options.systemPrompt}

CRITICAL FORMATTING RULES:
- Respond ONLY with valid JSON. No markdown, no code fences, no explanation.
- Do NOT wrap the response in \`\`\`json blocks.
- The response must parse with JSON.parse() without any preprocessing.`;

  const rawResult = await askAI({
    ...options,
    systemPrompt: jsonSystemPrompt,
  });

  if (!rawResult.success) return rawResult;

  // Strip any accidental code fences / whitespace
  let cleaned = rawResult.data.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  try {
    const parsed: T = JSON.parse(cleaned);
    return {
      success: true,
      data: parsed,
      usage: rawResult.usage,
    };
  } catch {
    return {
      success: false,
      error: `Claude response was not valid JSON.\nRaw: ${cleaned.slice(0, 300)}`,
      code: "INVALID_JSON",
    };
  }
}

// ─── Error Mapping ────────────────────────────────────────────

function handleProviderError(error: unknown): AIResult<never> {
  // Anthropic SDK errors carry a `status` property
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as any).status as number;
    const message =
      (error as any).message ?? "Unknown Anthropic error";

    if (status === 401 || status === 403) {
      return {
        success: false,
        error: "Invalid or missing ANTHROPIC_API_KEY.",
        code: "AUTH_ERROR",
      };
    }

    if (status === 429) {
      return {
        success: false,
        error: "Rate limited by Anthropic. Try again shortly.",
        code: "RATE_LIMITED",
        retryAfterMs: extractRetryAfter(error),
      };
    }

    return {
      success: false,
      error: `Anthropic API error (${status}): ${message}`,
      code: "PROVIDER_ERROR",
    };
  }

  // Generic / network errors
  const msg =
    error instanceof Error ? error.message : "Unknown error contacting AI provider.";
  return {
    success: false,
    error: msg,
    code: "UNKNOWN",
  };
}
