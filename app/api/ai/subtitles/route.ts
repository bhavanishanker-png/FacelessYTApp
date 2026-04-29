/**
 * POST /api/ai/subtitles
 *
 * Generates timed captions automatically from the generated audio URL using OpenAI Whisper.
 *
 * Input:
 * - projectId
 * - audioUrl (path to local file e.g., /audio/{projectId}/voiceover_onyx_123.mp3)
 *
 * Output:
 * - segments: [{ text, start, end }]
 * - words: [{ word, start, end }]
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import OpenAI, { toFile } from "openai";
import fs from "fs";
import path from "path";
import type { SubtitleSegment, SubtitleWord } from "@/lib/ai/types";

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
    const { projectId, audioUrl } = body;

    // 3. Validate
    if (!projectId || !audioUrl) {
      return NextResponse.json({ error: "projectId and audioUrl are required" }, { status: 400 });
    }

    // Resolve local file path from URL
    // URL format: /audio/projectId/filename.mp3
    const localFilePath = path.join(process.cwd(), "public", audioUrl);

    if (!fs.existsSync(localFilePath)) {
      return NextResponse.json(
        { error: `Audio file not found at ${localFilePath}` },
        { status: 404 }
      );
    }

    await connectDB();

    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 4. Generate subtitles via OpenAI Whisper
    const openai = getOpenAI();

    console.log(`[Subtitles] Transcribing audio: ${localFilePath}`);

    const fileStream = fs.createReadStream(localFilePath);

    const transcription = await openai.audio.transcriptions.create({
      file: fileStream,
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment", "word"],
    });

    const segments: SubtitleSegment[] = transcription.segments?.map((s: any) => ({
      text: s.text,
      start: s.start,
      end: s.end,
    })) || [];

    const words: SubtitleWord[] = transcription.words?.map((w: any) => ({
      word: w.word,
      start: w.start,
      end: w.end,
    })) || [];

    // 5. Persist to MongoDB
    project.steps.subtitles = {
      status: "completed",
      data: segments,
    };
    project.markModified("steps.subtitles");
    await project.save();

    return NextResponse.json({
      success: true,
      data: {
        segments,
        words,
      },
    });
  } catch (error: any) {
    console.error("[/api/ai/subtitles] Error:", error);

    if (error.message?.includes("OPENAI_API_KEY")) {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Add OPENAI_API_KEY to .env.local" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error during subtitles generation" },
      { status: 500 }
    );
  }
}
