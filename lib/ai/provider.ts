/**
 * AI Provider — Groq integration (using OpenAI SDK).
 *
 * This is the single point of contact with the Groq API.
 * All step routes call `askAI()` or `askAIJSON()` from here.
 *
 * To swap providers (OpenAI / Gemini), only this file needs to change.
 * The rest of the app is provider-agnostic via shared types.
 */

import OpenAI from "openai";
import type { AIRequestOptions, AIResult } from "./types";

// ─── Singleton Client ─────────────────────────────────────────

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (client) return client;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing GROQ_API_KEY — add it to .env.local"
    );
  }

  client = new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
  return client;
}

// ─── Model Config ─────────────────────────────────────────────

const MODEL_ID = "llama-3.3-70b-versatile";
const DEFAULT_MAX_TOKENS = 2048;
const DEFAULT_TEMPERATURE = 0.7;

// ─── Rate-Limit Helpers ───────────────────────────────────────

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

export async function askAI(
  options: AIRequestOptions
): Promise<AIResult<string>> {
  try {
    const openai = getClient();

    const response = await openai.chat.completions.create({
      model: MODEL_ID,
      max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: options.temperature ?? DEFAULT_TEMPERATURE,
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
  } catch (error: unknown) {
    return handleProviderError(error);
  }
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
      error: `Groq response was not valid JSON.\nRaw: ${cleaned.slice(0, 300)}`,
      code: "INVALID_JSON",
    };
  }
}

// ─── Error Mapping ────────────────────────────────────────────

function handleProviderError(error: unknown): AIResult<never> {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as any).status as number;
    const message =
      (error as any).message ?? "Unknown Groq error";

    if (status === 401 || status === 403) {
      return {
        success: false,
        error: "Invalid or missing GROQ_API_KEY.",
        code: "AUTH_ERROR",
      };
    }

    if (status === 429) {
      return {
        success: false,
        error: "Rate limited by Groq. Try again shortly.",
        code: "RATE_LIMITED",
        retryAfterMs: extractRetryAfter(error),
      };
    }

    return {
      success: false,
      error: `Groq API error (${status}): ${message}`,
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
