/**
 * AI Provider — Claude (weekdays) + Groq (weekends).
 *
 * This is the single point of contact with the LLM APIs.
 * All step routes call `askAI()` or `askAIJSON()` from here.
 *
 * Routing: Mon–Fri uses the Anthropic API, Sat–Sun uses Groq's free tier.
 * Override with AI_PROVIDER=anthropic | groq (default "auto" = by weekday).
 * The rest of the app is provider-agnostic via shared types.
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { AIRequestOptions, AIResult } from "./types";

// ─── Model Config ─────────────────────────────────────────────

// Weekdays — Anthropic.
const ANTHROPIC_MODEL_ID = "claude-opus-5";
// Opus 5 thinks by default and thinking tokens count against max_tokens,
// so requests get headroom on top of the caller's requested output size.
const ANTHROPIC_EFFORT = "low";
const THINKING_HEADROOM = 2048;

// Weekends — Groq. Groq decommissioned all Llama chat models;
// gpt-oss-120b is the current flagship on the free tier and supports JSON mode.
const GROQ_MODEL_ID = "openai/gpt-oss-120b";
// gpt-oss is a reasoning model — same max_tokens caveat as above.
const GROQ_REASONING_EFFORT = "low";
const REASONING_HEADROOM = 1024;

const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_TEMPERATURE = 0.7;

// ─── Provider Routing ─────────────────────────────────────────

type Provider = "anthropic" | "groq";

/**
 * Weekday → Claude, weekend → Groq.
 * Set AI_SCHEDULE_TZ (e.g. "Asia/Kolkata") to pin the day boundary to a
 * specific zone; otherwise the server's local time decides.
 */
function isWeekend(): boolean {
  const tz = process.env.AI_SCHEDULE_TZ;
  const day = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    ...(tz ? { timeZone: tz } : {}),
  }).format(new Date());
  return day === "Sat" || day === "Sun";
}

export function activeProvider(): Provider {
  const override = process.env.AI_PROVIDER?.toLowerCase();
  if (override === "anthropic" || override === "groq") return override;
  return isWeekend() ? "groq" : "anthropic";
}

/** Whichever provider last actually answered — may differ from the schedule after a fallback. */
let lastServedBy: Provider | null = null;

export interface ActiveModelInfo {
  provider: Provider;
  /** Raw model ID sent to the API */
  model: string;
  /** Human-friendly name for the UI badge */
  label: string;
  /** Why this provider is active right now */
  reason: "weekday" | "weekend" | "forced";
  /** True when Claude was scheduled but Groq is actually serving requests */
  fellBack: boolean;
}

export function activeModel(): ActiveModelInfo {
  const forced =
    process.env.AI_PROVIDER?.toLowerCase() === "anthropic" ||
    process.env.AI_PROVIDER?.toLowerCase() === "groq";
  const scheduled = activeProvider();
  // Report what's really answering, so the badge doesn't claim Claude during a fallback.
  const provider = lastServedBy ?? scheduled;

  return {
    provider,
    model: provider === "anthropic" ? ANTHROPIC_MODEL_ID : GROQ_MODEL_ID,
    label: provider === "anthropic" ? "Claude Opus 5" : "GPT-OSS 120B",
    reason: forced ? "forced" : isWeekend() ? "weekend" : "weekday",
    fellBack: provider !== scheduled,
  };
}

// ─── Singleton Clients ────────────────────────────────────────

let anthropicClient: Anthropic | null = null;
let groqClient: OpenAI | null = null;

function getAnthropic(): Anthropic {
  if (anthropicClient) return anthropicClient;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY — add it to .env.local");
  }

  anthropicClient = new Anthropic({ apiKey });
  return anthropicClient;
}

function getGroq(): OpenAI {
  if (groqClient) return groqClient;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY — add it to .env.local");
  }

  groqClient = new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
  return groqClient;
}

// ─── Rate-Limit Helpers ───────────────────────────────────────

function extractRetryAfter(error: unknown): number {
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    (error as any).status === 429
  ) {
    const headers = (error as any).headers;
    const retryAfter =
      headers?.["retry-after"] ?? headers?.get?.("retry-after");
    if (retryAfter) return parseInt(retryAfter, 10) * 1000;
    return 60_000; // default 60s
  }
  return 0;
}

// ─── Core: Raw Text Response ──────────────────────────────────

/**
 * Runs the scheduled provider, falling back to Groq if Claude can't answer —
 * bad/missing key, rate limit, outage, refusal, or empty response.
 * Set AI_FALLBACK=off to disable and surface Claude's error directly.
 */
export async function askAI(
  options: AIRequestOptions
): Promise<AIResult<string>> {
  const primary = activeProvider();
  const result = await callProvider(primary, options);

  if (result.success) return result;

  // Groq is the last resort — nothing to fall back to from there.
  const fallbackDisabled = process.env.AI_FALLBACK?.toLowerCase() === "off";
  if (primary !== "anthropic" || fallbackDisabled) return result;

  console.warn(
    `[ai] Claude unavailable (${result.code}: ${result.error}) — falling back to Groq.`
  );

  const fallback = await callProvider("groq", options);
  if (fallback.success) return fallback;

  console.error(
    `[ai] Groq fallback also failed (${fallback.code}: ${fallback.error}).`
  );

  return {
    success: false,
    error: `Claude failed (${result.error}) and the Groq fallback also failed (${fallback.error}).`,
    code: fallback.code,
    ...(fallback.retryAfterMs
      ? { retryAfterMs: fallback.retryAfterMs }
      : result.retryAfterMs
        ? { retryAfterMs: result.retryAfterMs }
        : {}),
  };
}

async function callProvider(
  provider: Provider,
  options: AIRequestOptions
): Promise<AIResult<string>> {
  try {
    const result =
      provider === "anthropic"
        ? await askAnthropic(options)
        : await askGroq(options);
    if (result.success) lastServedBy = provider;
    return result;
  } catch (error: unknown) {
    return handleProviderError(error, provider);
  }
}

// ─── Anthropic (weekdays) ─────────────────────────────────────

async function askAnthropic(
  options: AIRequestOptions
): Promise<AIResult<string>> {
  const anthropic = getAnthropic();

  // Note: temperature is not accepted on Opus 5 — steering is via the prompt.
  const response = await anthropic.messages.create({
    model: ANTHROPIC_MODEL_ID,
    max_tokens: (options.maxTokens ?? DEFAULT_MAX_TOKENS) + THINKING_HEADROOM,
    output_config: { effort: ANTHROPIC_EFFORT },
    system: options.systemPrompt,
    messages: [{ role: "user", content: options.userMessage }],
  });

  if (response.stop_reason === "refusal") {
    return {
      success: false,
      error: "Claude declined this request. Try rephrasing the prompt.",
      code: "PROVIDER_ERROR",
    };
  }

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  if (!text) {
    return {
      success: false,
      error: "Claude returned no text content.",
      code: "PROVIDER_ERROR",
    };
  }

  return {
    success: true,
    data: text,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}

// ─── Groq (weekends) ──────────────────────────────────────────

async function askGroq(
  options: AIRequestOptions
): Promise<AIResult<string>> {
  const openai = getGroq();

  const response = await openai.chat.completions.create({
    model: GROQ_MODEL_ID,
    max_tokens:
      (options.maxTokens ?? DEFAULT_MAX_TOKENS) + REASONING_HEADROOM,
    temperature: options.temperature ?? DEFAULT_TEMPERATURE,
    reasoning_effort: GROQ_REASONING_EFFORT,
    response_format: options.jsonMode ? { type: "json_object" } : undefined,
    messages: [
      {
        role: "system",
        content: options.systemPrompt,
      },
      {
        role: "user",
        content: options.userMessage,
      },
    ],
  });

  const text = response.choices[0]?.message?.content;
  if (!text) {
    return {
      success: false,
      error: "Groq returned no text content.",
      code: "PROVIDER_ERROR",
    };
  }

  return {
    success: true,
    data: text,
    usage: {
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
    },
  };
}

// ─── Core: Typed JSON Response ────────────────────────────────

export async function askAIJSON<T = unknown>(
  options: AIRequestOptions
): Promise<AIResult<T>> {
  const jsonSystemPrompt = `${options.systemPrompt}

CRITICAL FORMATTING RULES:
- Respond ONLY with valid JSON. No markdown, no code fences, no explanation.
- Do NOT wrap the response in \`\`\`json blocks.
- The response must parse with JSON.parse() without any preprocessing.`;

  const rawResult = await askAI({
    ...options,
    systemPrompt: jsonSystemPrompt,
    jsonMode: true,
  });

  if (!rawResult.success) return rawResult;

  let cleaned = rawResult.data.trim();
  if (cleaned.startsWith("\`\`\`")) {
    cleaned = cleaned.replace(/^\`\`\`(?:json)?\s*/, "").replace(/\s*\`\`\`$/, "");
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
      error: `AI response was not valid JSON.\nRaw: ${cleaned.slice(0, 300)}`,
      code: "INVALID_JSON",
    };
  }
}

// ─── Error Mapping ────────────────────────────────────────────

function handleProviderError(
  error: unknown,
  provider: Provider
): AIResult<never> {
  const label = provider === "anthropic" ? "Claude" : "Groq";
  const keyName =
    provider === "anthropic" ? "ANTHROPIC_API_KEY" : "GROQ_API_KEY";

  if (error && typeof error === "object" && "status" in error) {
    const status = (error as any).status as number;
    const message = (error as any).message ?? `Unknown ${label} error`;

    if (status === 401 || status === 403) {
      return {
        success: false,
        error: `Invalid or missing ${keyName}.`,
        code: "AUTH_ERROR",
      };
    }

    if (status === 429) {
      return {
        success: false,
        error: `Rate limited by ${label}. Try again shortly.`,
        code: "RATE_LIMITED",
        retryAfterMs: extractRetryAfter(error),
      };
    }

    return {
      success: false,
      error: `${label} API error (${status}): ${message}`,
      code: "PROVIDER_ERROR",
    };
  }

  const msg =
    error instanceof Error ? error.message : "Unknown error contacting AI provider.";
  return {
    success: false,
    error: msg,
    code: "UNKNOWN",
  };
}
