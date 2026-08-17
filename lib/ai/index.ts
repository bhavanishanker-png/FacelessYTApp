/**
 * Public API for the AI module.
 *
 * Import everything from `@/lib/ai` — no need to dig into submodules.
 *
 * Usage in a route:
 *   import { askAIJSON, IDEA_SYSTEM_PROMPT } from "@/lib/ai";
 *   import type { IdeaOutput } from "@/lib/ai";
 */

// Provider functions
export { askAI, askAIJSON, activeProvider, activeModel } from "./provider";
export type { ActiveModelInfo } from "./provider";

// System prompts
export {
  IDEA_SYSTEM_PROMPT,
  HOOK_SYSTEM_PROMPT,
  SCRIPT_SYSTEM_PROMPT,
  SCENES_SYSTEM_PROMPT,
  VIRAL_IDEAS_SYSTEM_PROMPT,
  VIRAL_HOOKS_SYSTEM_PROMPT,
  HOOKS_CRITIC_SYSTEM_PROMPT,
  SCRIPT_CRITIC_SYSTEM_PROMPT,
} from "./prompts";

// Critic-Refiner agent loop
export { runCriticRefiner } from "./criticRefiner";
export type { CritiqueOutput, CriticRefinedResult } from "./criticRefiner";

// Types — re-export for convenience
export type {
  AIRequestOptions,
  AIResult,
  AIResponse,
  AIErrorResponse,
  AIProvider,
  ScriptOutput,
  ScenesOutput,
  ViralIdea,
  ViralIdeasOutput,
  ViralHook,
  ViralHooksOutput,
  HookTone,
  HookStyle,
  ImageStyle,
  SceneImageInput,
  SceneImageOutput,
  ImageGenerationOutput,
  VoiceId,
  VoiceGenerationOutput,
  SubtitleWord,
  SubtitleSegment,
  SubtitlesGenerationOutput,
} from "./types";
