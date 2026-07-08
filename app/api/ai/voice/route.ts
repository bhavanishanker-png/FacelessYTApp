/**
 * POST /api/ai/voice
 *
 * Generates narration audio from script text using Deepgram Aura TTS.
 *
 * Supports:
 *  - 4 voice options mapped to UI (male-deep, female-calm, energetic, storytelling)
 *  - Speed control
 *  - Saves audio to Cloudinary
 *  - Persists results to MongoDB steps.voice
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import { DeepgramClient } from "@deepgram/sdk";
import type { VoiceId } from "@/lib/ai/types";

// ─── Voice Metadata ───────────────────────────────────────────

const VALID_VOICES: VoiceId[] = ["male-deep", "female-calm", "energetic", "storytelling"];

const VOICE_DESCRIPTIONS: Record<VoiceId, string> = {
  "male-deep": "Deep, authoritative (Aura Orion)",
  "female-calm": "Soft, expressive (Aura Asteria)",
  "energetic": "Friendly, upbeat (Aura Arcas)",
  "storytelling": "British, narrative (Aura Helios)",
};

const VOICE_MAPPING: Record<string, string> = {
  "male-deep": "aura-orion-en",
  "female-calm": "aura-asteria-en",
  "energetic": "aura-arcas-en",
  "storytelling": "aura-helios-en",
};

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
      voice = "male-deep",
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

    // Deepgram limit is quite high, but let's keep a reasonable bound
    if (cleanedScript.length > 30000) {
      return NextResponse.json(
        { error: `Script is too long (${cleanedScript.length} chars). Max is 30000 for TTS.` },
        { status: 400 }
      );
    }

    await connectDB();

    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 5. Generate audio via Deepgram
    if (!process.env.DEEPGRAM_API_KEY) {
       return NextResponse.json(
         { error: "DEEPGRAM_API_KEY is missing from .env.local" },
         { status: 500 }
       );
    }

    const deepgram = new DeepgramClient({ apiKey: process.env.DEEPGRAM_API_KEY });
    const modelId = VOICE_MAPPING[voice as string] || VOICE_MAPPING["male-deep"];

    console.log(`[Voice Gen] Generating audio with Deepgram ${modelId}`);

    let audioBuffer: Buffer;
    try {
      const response = await deepgram.speak.v1.audio.generate({
        text: cleanedScript,
        model: modelId,
        encoding: "mp3"
      });

      const arrayBuffer = await response.arrayBuffer();
      audioBuffer = Buffer.from(arrayBuffer);

    } catch (ttsError: any) {
      console.error("[Voice Gen] Deepgram API error:", ttsError.message);
      return NextResponse.json(
        { error: `TTS generation failed: ${ttsError.message}. Make sure your Deepgram API Key is valid.` },
        { status: 500 }
      );
    }

    // 6. Upload audio file to Cloudinary
    const { uploadBufferToCloudinary } = await import("@/lib/storage");
    const timestamp = Date.now();
    const publicId = `voiceover_${voice}_${timestamp}`;
    const folderPath = `faceless-yt/projects/${projectId}/audio`;
    
    const uploadResult = await uploadBufferToCloudinary(
      audioBuffer,
      folderPath,
      "video", // Cloudinary treats audio as "video" resource type
      publicId
    );

    const audioUrl = uploadResult.url;

    // 7. Estimate duration (Note: Deepgram doesn't return exact duration for TTS, so we estimate)
    const durationSeconds = estimateDuration(cleanedScript, clampedSpeed);

    // 8. Persist to MongoDB
    project.steps.voice = {
      type: voice,
      voiceId: voice,
      audioUrl,
      durationSeconds,
      provider: "deepgram-aura",
      settings: { speed: clampedSpeed, model: modelId },
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
        provider: "deepgram-aura",
        fileSizeBytes: audioBuffer.length,
      },
    });
  } catch (error: any) {
    console.error("[/api/ai/voice] Error:", error);

    return NextResponse.json(
      { error: "Internal server error during voice generation" },
      { status: 500 }
    );
  }
}
