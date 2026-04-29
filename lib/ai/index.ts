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
export { askAI, askAIJSON } from "./provider";

// System prompts
export {
  IDEA_SYSTEM_PROMPT,
  HOOK_SYSTEM_PROMPT,
  SCRIPT_SYSTEM_PROMPT,
  SCENES_SYSTEM_PROMPT,
  VIRAL_IDEAS_SYSTEM_PROMPT,
  VIRAL_HOOKS_SYSTEM_PROMPT,
} from "./prompts";

// Types — re-export for convenience
export type {
  AIRequestOptions,
  AIResult,
  AIResponse,
  AIErrorResponse,
  AIProvider,
  IdeaOutput,
  HookOutput,
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
