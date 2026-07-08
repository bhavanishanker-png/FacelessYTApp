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

// ─── Groq Client ────────────────────────────────────────────

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (openaiClient) return openaiClient;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY — add it to .env.local");
  }

  openaiClient = new OpenAI({ 
    apiKey,
    baseURL: "https://api.groq.com/openai/v1" 
  });
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

    // Resolve audio file (local or remote)
    let fileStreamOrBlob: any;

    if (audioUrl.startsWith("http")) {
      console.log(`[Subtitles] Downloading audio from remote URL: ${audioUrl}`);
      const audioRes = await fetch(audioUrl);
      if (!audioRes.ok) {
        return NextResponse.json(
          { error: `Failed to download audio from ${audioUrl}` },
          { status: 404 }
        );
      }
      fileStreamOrBlob = await toFile(audioRes, "audio.mp3");
    } else {
      const localFilePath = audioUrl.startsWith("/")
        ? path.join(process.cwd(), "public", audioUrl)
        : path.join(process.cwd(), "public", "/", audioUrl);

      if (!fs.existsSync(localFilePath)) {
        return NextResponse.json(
          { error: `Audio file not found at ${localFilePath}` },
          { status: 404 }
        );
      }
      console.log(`[Subtitles] Transcribing local audio: ${localFilePath}`);
      fileStreamOrBlob = fs.createReadStream(localFilePath);
    }

    await connectDB();

    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 4. Generate subtitles via Groq Whisper
    const openai = getOpenAI();

    const transcription = await openai.audio.transcriptions.create({
      file: fileStreamOrBlob,
      model: "whisper-large-v3",
      response_format: "verbose_json",
      timestamp_granularities: ["segment", "word"],
    });

    const words: SubtitleWord[] = transcription.words?.map((w: any) => ({
      word: w.word,
      start: w.start,
      end: w.end,
    })) || [];

    let segments: SubtitleSegment[] = [];
    if (words.length > 0) {
      // Chunk into smaller, punchier segments (e.g., max 5 words or 3 seconds)
      let currentSegment: SubtitleSegment = { text: "", start: words[0].start, end: words[0].end, words: [] };
      const MAX_WORDS = 5;
      const MAX_DURATION = 3; 

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const duration = word.end - currentSegment.start;
        const wordCount = currentSegment.words?.length || 0;
        
        // If adding this word exceeds limits, push current segment and start new
        if (wordCount > 0 && (wordCount >= MAX_WORDS || duration > MAX_DURATION || /[.!?]$/.test(currentSegment.words![wordCount - 1].word.trim()))) {
          currentSegment.text = currentSegment.words!.map(w => w.word).join("").trim();
          // Fallback if words don't have leading spaces
          if (!currentSegment.text.includes(" ") && currentSegment.words!.length > 1) {
             currentSegment.text = currentSegment.words!.map(w => w.word.trim()).join(" ");
             // Quick fix for punctuation spaces: "hello , world" -> "hello, world"
             currentSegment.text = currentSegment.text.replace(/\s+([.,!?])/g, "$1");
          }
          segments.push(currentSegment);
          currentSegment = { text: "", start: word.start, end: word.end, words: [] };
        }
        
        currentSegment.words!.push(word);
        currentSegment.end = word.end;
      }
      if (currentSegment.words && currentSegment.words.length > 0) {
        currentSegment.text = currentSegment.words.map(w => w.word).join("").trim();
        if (!currentSegment.text.includes(" ") && currentSegment.words.length > 1) {
           currentSegment.text = currentSegment.words.map(w => w.word.trim()).join(" ").replace(/\s+([.,!?])/g, "$1");
        }
        segments.push(currentSegment);
      }
    } else {
      segments = transcription.segments?.map((s: any) => ({
        text: s.text,
        start: s.start,
        end: s.end,
      })) || [];
    }

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

    if (error.message?.includes("GROQ_API_KEY")) {
      return NextResponse.json(
        { error: "Groq API key not configured. Add GROQ_API_KEY to .env.local" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error during subtitles generation" },
      { status: 500 }
    );
  }
}
