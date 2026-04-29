/**
 * Shared types for the AI generation system.
 * Every step route imports from here for consistency.
 */

// ─── Provider Config ──────────────────────────────────────────

export type AIProvider = "anthropic" | "openai" | "gemini";

export interface AIRequestOptions {
  /** System-level instruction that shapes the AI persona */
  systemPrompt: string;
  /** The user's actual request / context for this generation */
  userMessage: string;
  /** Max tokens the model should return (maps to skill token limits) */
  maxTokens?: number;
  /** Sampling temperature — lower = more deterministic */
  temperature?: number;
}

// ─── Standard AI Response ─────────────────────────────────────

export interface AIResponse<T = unknown> {
  success: true;
  data: T;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface AIErrorResponse {
  success: false;
  error: string;
  code: "RATE_LIMITED" | "AUTH_ERROR" | "INVALID_JSON" | "PROVIDER_ERROR" | "UNKNOWN";
  retryAfterMs?: number;
}

export type AIResult<T = unknown> = AIResponse<T> | AIErrorResponse;

// ─── Step-specific output shapes ──────────────────────────────
// These interfaces define the JSON contract between AI and the app.
// Each step route will narrow T to its specific shape.

export interface IdeaOutput {
  ideas: {
    title: string;
    description: string;
    targetAudience: string;
    viralPotential: "low" | "medium" | "high";
  }[];
}

export interface HookOutput {
  hooks: {
    text: string;
    style: "question" | "statistic" | "story" | "controversial" | "visual";
    estimatedRetentionBoost: number;
  }[];
}

export interface ScriptOutput {
  title: string;
  sections: {
    label: string;
    content: string;
    durationSeconds: number;
    speakerNotes: string;
  }[];
  totalDurationSeconds: number;
  wordCount: number;
}

export interface ScenesOutput {
  scenes: {
    sceneNumber: number;
    narration: string;
    visualDescription: string;
    imagePrompt: string;
    durationSeconds: number;
    transition: "cut" | "fade" | "slide" | "zoom";
  }[];
}

// ─── Standalone AI Endpoints ──────────────────────────────────

export interface ViralIdea {
  title: string;
  category: string;
  viralityScore: number; // 1-100
  reason: string;
}

export interface ViralIdeasOutput {
  ideas: ViralIdea[];
  niche: string;
  platform: "shorts" | "long";
}

export type HookTone = "dramatic" | "emotional" | "curiosity";
export type HookStyle = "question" | "statistic" | "story" | "controversial" | "visual";

export interface ViralHook {
  text: string;
  score: number;  // 1-100 CTR / retention score
  style: HookStyle;
}

export interface ViralHooksOutput {
  hooks: ViralHook[];
  idea: string;
  tone: HookTone;
}

// ─── Image Generation ─────────────────────────────────────────

export type ImageStyle = "cinematic" | "anime" | "realistic" | "minimal";

export interface SceneImageInput {
  sceneId: string;
  prompt: string;
  text: string;
  duration: number;
}

export interface SceneImageOutput {
  sceneId: string;
  imageUrl: string;
  prompt: string;
  status: "success" | "failed";
  error?: string;
}

export interface ImageGenerationOutput {
  images: SceneImageOutput[];
  style: ImageStyle;
  generatedAt: string;
}

// ─── Voice Generation ─────────────────────────────────────────

export type VoiceId = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

export interface VoiceGenerationOutput {
  audioUrl: string;
  durationSeconds: number;
  voiceId: VoiceId;
  speed: number;
  provider: string;
}

// ─── Subtitles Generation ──────────────────────────────────────

export interface SubtitleWord {
  word: string;
  start: number;
  end: number;
}

export interface SubtitleSegment {
  text: string;
  start: number;
  end: number;
  words?: SubtitleWord[];
}

export interface SubtitlesGenerationOutput {
  segments: SubtitleSegment[];
  words?: SubtitleWord[];
}
