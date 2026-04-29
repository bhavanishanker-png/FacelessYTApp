/**
 * POST /api/ai/voice
 *
 * Generates narration audio from script text using OpenAI TTS.
 *
 * Supports:
 *  - 6 voice options (alloy, echo, fable, onyx, nova, shimmer)
 *  - Speed control (0.25–4.0)
 *  - Saves audio as .mp3 to /public/audio/{projectId}/
 *  - Persists results to MongoDB steps.voice
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import OpenAI from "openai";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import type { VoiceId } from "@/lib/ai/types";

// ─── Voice Metadata ───────────────────────────────────────────

const VALID_VOICES: VoiceId[] = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];

const VOICE_DESCRIPTIONS: Record<VoiceId, string> = {
  alloy: "Neutral, balanced",
  echo: "Warm, conversational",
  fable: "British, narrative",
  onyx: "Deep, authoritative",
  nova: "Friendly, upbeat",
  shimmer: "Soft, expressive",
};

// ─── OpenAI Client ────────────────────────────────────────────

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (openaiClient) return openaiClient;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY — add it to .env.local");
  }

  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

// ─── Duration Estimator ───────────────────────────────────────

function estimateDuration(text: string, speed: number): number {
  // Average speaking rate: ~150 words per minute at 1.0x speed
  const wordCount = text.trim().split(/\s+/).length;
  const minutesAtNormal = wordCount / 150;
  const adjustedMinutes = minutesAtNormal / speed;
  return Math.round(adjustedMinutes * 60); // seconds
}

// ─── Route Handler ────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // 1. Auth
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    // 2. Parse body
    const body = await request.json();
    const {
      projectId,
      script,
      voice = "onyx",
      speed = 1.0,
    } = body;

    // 3. Validate
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    if (!script || typeof script !== "string" || script.trim().length === 0) {
      return NextResponse.json({ error: "script text is required" }, { status: 400 });
    }

    if (!VALID_VOICES.includes(voice)) {
      return NextResponse.json(
        { error: `Invalid voice. Must be one of: ${VALID_VOICES.join(", ")}` },
        { status: 400 }
      );
    }

    const clampedSpeed = Math.max(0.25, Math.min(4.0, Number(speed) || 1.0));

    // 4. Clean script text for TTS
    // Remove section headers like [HOOK], [BODY], [PAYOFF] etc.
    const cleanedScript = script
      .replace(/\[([A-Z\s]+)\]/g, "") // Remove [SECTION] headers
      .replace(/\n{3,}/g, "\n\n")     // Collapse excessive newlines
      .trim();

    if (cleanedScript.length === 0) {
      return NextResponse.json({ error: "Script has no speakable content" }, { status: 400 });
    }

    // 5. Check script length (OpenAI TTS limit is ~4096 chars)
    if (cleanedScript.length > 4096) {
      return NextResponse.json(
        { error: `Script is too long (${cleanedScript.length} chars). Max is 4096 for TTS.` },
        { status: 400 }
      );
    }

    await connectDB();

    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 6. Generate audio via OpenAI TTS
    const openai = getOpenAI();

    let audioBuffer: Buffer;
    try {
      const mp3Response = await openai.audio.speech.create({
        model: "tts-1-hd",
        voice: voice as any,
        input: cleanedScript,
        speed: clampedSpeed,
        response_format: "mp3",
      });

      // Get the audio data as ArrayBuffer then convert to Buffer
      const arrayBuffer = await mp3Response.arrayBuffer();
      audioBuffer = Buffer.from(arrayBuffer);
    } catch (ttsError: any) {
      console.error("[Voice Gen] TTS API error:", ttsError.message);

      if (ttsError.status === 429) {
        return NextResponse.json(
          { error: "Rate limited by OpenAI. Please wait and try again.", code: "RATE_LIMITED" },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: `TTS generation failed: ${ttsError.message}` },
        { status: 500 }
      );
    }

    // 7. Save audio file to /public/audio/{projectId}/
    const audioDir = path.join(process.cwd(), "public", "audio", projectId);
    await mkdir(audioDir, { recursive: true });

    const timestamp = Date.now();
    const filename = `voiceover_${voice}_${timestamp}.mp3`;
    const filePath = path.join(audioDir, filename);
    await writeFile(filePath, audioBuffer);

    // Public URL path (served by Next.js static files)
    const audioUrl = `/audio/${projectId}/${filename}`;

    // 8. Estimate duration
    const durationSeconds = estimateDuration(cleanedScript, clampedSpeed);

    // 9. Persist to MongoDB
    project.steps.voice = {
      type: voice,
      voiceId: voice,
      audioUrl,
      durationSeconds,
      provider: "openai-tts-1-hd",
      settings: { speed: clampedSpeed, model: "tts-1-hd" },
      status: "completed",
    };
    project.markModified("steps.voice");
    await project.save();

    return NextResponse.json({
      success: true,
      data: {
        audioUrl,
        durationSeconds,
        voiceId: voice,
        voiceDescription: VOICE_DESCRIPTIONS[voice as VoiceId],
        speed: clampedSpeed,
        provider: "openai-tts-1-hd",
        fileSizeBytes: audioBuffer.length,
      },
    });
  } catch (error: any) {
    console.error("[/api/ai/voice] Error:", error);

    if (error.message?.includes("OPENAI_API_KEY")) {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Add OPENAI_API_KEY to .env.local" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error during voice generation" },
      { status: 500 }
    );
  }
}
