/**
 * POST /api/ai/render
 *
 * Video rendering pipeline using FFmpeg.
 *
 * Composites:
 *   - Scene images (with Ken Burns / pan animations)
 *   - Narration audio track
 *   - Burned-in subtitles (ASS format)
 *   - Cross-fade transitions between scenes
 *
 * The render runs asynchronously in the background.
 * The client polls /api/ai/render/status?jobId=xxx for progress.
 *
 * Returns: { jobId, status: "queued" }
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import { renderStore, type RenderJob } from "@/lib/renderStore";
import { spawn } from "child_process";
import { writeFile, mkdir, readFile, stat, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";

// ─── Quality Presets ──────────────────────────────────────────

const QUALITY_PRESETS: Record<string, { width: number; height: number; bitrate: string; crf: number }> = {
  "720p":  { width: 1280, height: 720,  bitrate: "2500k", crf: 28 },
  "1080p": { width: 1920, height: 1080, bitrate: "5000k", crf: 23 },
  "4k":    { width: 3840, height: 2160, bitrate: "15000k", crf: 18 },
};

// ─── Helpers ──────────────────────────────────────────────────

function generateJobId(): string {
  return `render_${crypto.randomBytes(8).toString("hex")}`;
}

/** Build an ASS subtitle file from subtitle segments */
function buildAssSubtitles(
  subtitles: { text: string; start: number; end: number }[],
  width: number,
  height: number,
  settings?: Record<string, any>
): string {
  const fontSize = Math.round(height * 0.038);
  const fontName = settings?.fontFamily || "Arial";
  const primaryColor = "&H00FFFFFF"; // White
  const outlineColor = "&H00000000"; // Black outline
  const shadowColor  = "&H80000000"; // Semi-transparent shadow
  const marginV = Math.round(height * 0.06);

  let ass = `[Script Info]
Title: Generated Subtitles
ScriptType: v4.00+
PlayResX: ${width}
PlayResY: ${height}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSize},${primaryColor},&H000000FF,${outlineColor},${shadowColor},-1,0,0,0,100,100,0,0,1,2.5,1,2,20,20,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  for (const seg of subtitles) {
    const startStr = formatAssTime(seg.start);
    const endStr = formatAssTime(seg.end);
    const cleanText = seg.text.replace(/\n/g, "\\N");
    ass += `Dialogue: 0,${startStr},${endStr},Default,,0,0,0,,${cleanText}\n`;
  }

  return ass;
}

function formatAssTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.round((seconds % 1) * 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

/** Run an FFmpeg command and return a promise */
function runFFmpeg(args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", args, { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (d) => { stdout += d.toString(); });
    proc.stderr?.on("data", (d) => { stderr += d.toString(); });

    proc.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`FFmpeg exited with code ${code}:\n${stderr.slice(-2000)}`));
    });

    proc.on("error", (err) => {
      reject(new Error(`FFmpeg spawn error: ${err.message}`));
    });
  });
}

/** Probe duration of a media file */
async function probeDuration(filePath: string): Promise<number> {
  return new Promise((resolve) => {
    const proc = spawn("ffprobe", [
      "-v", "quiet",
      "-show_entries", "format=duration",
      "-of", "csv=p=0",
      filePath,
    ]);
    let out = "";
    proc.stdout?.on("data", (d) => { out += d.toString(); });
    proc.on("close", () => {
      const dur = parseFloat(out.trim());
      resolve(isNaN(dur) ? 0 : dur);
    });
    proc.on("error", () => resolve(0));
  });
}

// ─── Background Render Pipeline ───────────────────────────────

async function executeRenderPipeline(
  jobId: string,
  projectId: string,
  quality: string,
  images: { imageUrl: string; sceneId: string }[],
  scenes: { text: string; duration: number }[],
  audioUrl: string,
  subtitles: { text: string; start: number; end: number }[],
  subtitleSettings: Record<string, any> | undefined,
  animationData: any,
) {
  const preset = QUALITY_PRESETS[quality] || QUALITY_PRESETS["1080p"];
  const outputDir = path.join(process.cwd(), "public", "renders", projectId);
  await mkdir(outputDir, { recursive: true });

  const tempDir = path.join(outputDir, "temp");
  await mkdir(tempDir, { recursive: true });

  try {
    // ─── Phase 1: Validate & Prepare Assets ───────────────────
    renderStore.update(jobId, { progress: 5, phase: "Validating assets" });

    // Resolve audio file path
    let audioFilePath = "";
    if (audioUrl.startsWith("http")) {
      const audioRes = await fetch(audioUrl);
      if (!audioRes.ok) throw new Error(`Failed to download audio: ${audioUrl}`);
      const audioBuffer = await audioRes.arrayBuffer();
      audioFilePath = path.join(tempDir, "source_audio.mp3");
      await writeFile(audioFilePath, Buffer.from(audioBuffer));
    } else {
      audioFilePath = audioUrl.startsWith("/")
        ? path.join(process.cwd(), "public", audioUrl)
        : path.join(process.cwd(), "public", "/", audioUrl);
      if (!existsSync(audioFilePath)) {
        throw new Error(`Audio file not found: ${audioUrl}`);
      }
    }

    // Get actual audio duration for timing
    const audioDuration = await probeDuration(audioFilePath);
    const totalDuration = audioDuration > 0 ? audioDuration : scenes.reduce((s, sc) => s + (sc.duration || 4), 0);

    // Calculate per-scene durations proportionally to fill audio
    const sceneDurations: number[] = [];
    const totalSceneDur = scenes.reduce((s, sc) => s + (sc.duration || 4), 0);
    for (const sc of scenes) {
      const ratio = (sc.duration || 4) / totalSceneDur;
      sceneDurations.push(ratio * totalDuration);
    }

    renderStore.update(jobId, { progress: 10, phase: "Preparing images" });

    // ─── Phase 2: Generate image segments with Ken Burns ──────
    const segmentPaths: string[] = [];
    const transitionDur = 0.5; // cross-fade seconds

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const dur = sceneDurations[i] || 4;
      const segPath = path.join(tempDir, `segment_${i}.mp4`);

      // Resolve image path
      let imgPath = img.imageUrl;
      if (imgPath.startsWith("http")) {
        const imgRes = await fetch(imgPath);
        if (!imgRes.ok) throw new Error(`Failed to download image: ${imgPath}`);
        const imgBuffer = await imgRes.arrayBuffer();
        const localImgPath = path.join(tempDir, `source_img_${i}.jpg`);
        await writeFile(localImgPath, Buffer.from(imgBuffer));
        imgPath = localImgPath;
      } else if (imgPath.startsWith("/")) {
        imgPath = path.join(process.cwd(), "public", imgPath);
      }

      if (!existsSync(imgPath)) {
        console.warn(`[Render] Image not found: ${imgPath}, generating placeholder`);
        // Generate a solid color placeholder
        await runFFmpeg([
          "-f", "lavfi",
          "-i", `color=c=0x1a1a2e:s=${preset.width}x${preset.height}:d=${dur}`,
          "-c:v", "libx264",
          "-preset", "fast",
          "-t", String(dur),
          "-y", segPath,
        ]);
      } else {
        // Ken Burns effect: slow zoom + slight pan
        const zoomSpeed = 0.0008;
        const panX = i % 2 === 0 ? "iw/2-(iw/zoom/2)" : "0";
        const panY = "ih/2-(ih/zoom/2)";

        await runFFmpeg([
          "-loop", "1",
          "-i", imgPath,
          "-vf", [
            `scale=${preset.width * 2}:${preset.height * 2}`,
            `zoompan=z='min(zoom+${zoomSpeed},1.15)':x='${panX}':y='${panY}':d=${Math.ceil(dur * 25)}:s=${preset.width}x${preset.height}:fps=25`,
            `fade=t=in:st=0:d=0.3`,
            `fade=t=out:st=${Math.max(0, dur - 0.3)}:d=0.3`,
          ].join(","),
          "-c:v", "libx264",
          "-preset", "fast",
          "-pix_fmt", "yuv420p",
          "-t", String(dur),
          "-y", segPath,
        ]);
      }

      segmentPaths.push(segPath);

      // Update progress (10–50% for image processing)
      const imgProgress = 10 + Math.round(((i + 1) / images.length) * 40);
      renderStore.update(jobId, { progress: imgProgress, phase: `Processing scene ${i + 1}/${images.length}` });
    }

    // ─── Phase 3: Concatenate video segments ──────────────────
    renderStore.update(jobId, { progress: 55, phase: "Stitching scenes", status: "rendering" });

    // Create concat file
    const concatListPath = path.join(tempDir, "concat.txt");
    const concatContent = segmentPaths.map((p) => `file '${p}'`).join("\n");
    await writeFile(concatListPath, concatContent);

    const rawVideoPath = path.join(tempDir, "raw_video.mp4");
    await runFFmpeg([
      "-f", "concat",
      "-safe", "0",
      "-i", concatListPath,
      "-c:v", "libx264",
      "-preset", "fast",
      "-pix_fmt", "yuv420p",
      "-y", rawVideoPath,
    ]);

    // ─── Phase 4: Add audio track ─────────────────────────────
    renderStore.update(jobId, { progress: 70, phase: "Mixing audio" });

    const withAudioPath = path.join(tempDir, "with_audio.mp4");
    await runFFmpeg([
      "-i", rawVideoPath,
      "-i", audioFilePath,
      "-c:v", "copy",
      "-c:a", "aac",
      "-b:a", "192k",
      "-map", "0:v:0",
      "-map", "1:a:0",
      "-shortest",
      "-y", withAudioPath,
    ]);

    // ─── Phase 5: Burn subtitles ──────────────────────────────
    renderStore.update(jobId, { progress: 80, phase: "Burning subtitles" });

    let videoForEncode = withAudioPath;

    if (subtitles && subtitles.length > 0) {
      const assContent = buildAssSubtitles(subtitles, preset.width, preset.height, subtitleSettings);
      const assPath = path.join(tempDir, "subtitles.ass");
      await writeFile(assPath, assContent);

      const withSubsPath = path.join(tempDir, "with_subs.mp4");
      // Use the subtitles filter (requires libass)
      await runFFmpeg([
        "-i", withAudioPath,
        "-vf", `ass='${assPath.replace(/'/g, "'\\''")}'`,
        "-c:v", "libx264",
        "-crf", String(preset.crf),
        "-preset", "medium",
        "-c:a", "copy",
        "-y", withSubsPath,
      ]);
      videoForEncode = withSubsPath;
    }

    // ─── Phase 6: Final encode ────────────────────────────────
    renderStore.update(jobId, { progress: 90, phase: "Final encoding", status: "encoding" });

    const timestamp = Date.now();
    const finalFilename = `render_${quality}_${timestamp}.mp4`;
    const finalPath = path.join(outputDir, finalFilename);

    if (videoForEncode !== withAudioPath || subtitles.length === 0) {
      // If subtitles were burned, the file is already re-encoded; just move it
      const { copyFile } = await import("fs/promises");
      await copyFile(videoForEncode, finalPath);
    } else {
      // Final quality pass
      await runFFmpeg([
        "-i", videoForEncode,
        "-c:v", "libx264",
        "-crf", String(preset.crf),
        "-preset", "medium",
        "-b:v", preset.bitrate,
        "-maxrate", preset.bitrate,
        "-bufsize", String(parseInt(preset.bitrate) * 2) + "k",
        "-c:a", "copy",
        "-movflags", "+faststart",
        "-y", finalPath,
      ]);
    }

    // ─── Phase 7: Finalize ────────────────────────────────────
    renderStore.update(jobId, { progress: 95, phase: "Finalizing" });

    const fileStat = await stat(finalPath);
    const finalDuration = await probeDuration(finalPath);

    // Upload video to Cloudinary
    renderStore.update(jobId, { progress: 98, phase: "Uploading to cloud" });
    const { uploadFileToCloudinary } = await import("@/lib/storage");
    const uploadResult = await uploadFileToCloudinary(
      finalPath,
      `faceless-yt/projects/${projectId}/renders`,
      "video",
      `render_${quality}_${timestamp}`
    );
    
    const publicUrl = uploadResult.url;

    // Persist to MongoDB
    await connectDB();
    const project = await Project.findById(projectId);
    if (project) {
      project.steps.render = {
        videoUrl: publicUrl,
        status: "completed",
        jobId,
        progress: 100,
        phase: "Complete",
        quality,
        durationSeconds: Math.round(finalDuration),
        fileSizeBytes: fileStat.size,
        error: "",
      };
      project.status = "completed";
      project.markModified("steps.render");
      await project.save();
    }

    // Update job store
    renderStore.update(jobId, {
      status: "complete",
      progress: 100,
      phase: "Complete",
      videoUrl: publicUrl,
      durationSeconds: Math.round(finalDuration),
      fileSizeBytes: fileStat.size,
      completedAt: Date.now(),
    });

    // Cleanup temp directory
    try {
      const { rm } = await import("fs/promises");
      await rm(tempDir, { recursive: true, force: true });
    } catch { /* non-critical */ }

    console.log(`[Render] ✅ Job ${jobId} complete: ${publicUrl} (${Math.round(finalDuration)}s, ${(fileStat.size / 1024 / 1024).toFixed(1)}MB)`);

  } catch (err: any) {
    console.error(`[Render] ❌ Job ${jobId} failed:`, err.message);
    renderStore.update(jobId, {
      status: "failed",
      phase: "Failed",
      error: err.message || "Unknown render error",
    });

    // Persist failure to MongoDB
    try {
      await connectDB();
      const project = await Project.findById(projectId);
      if (project) {
        project.steps.render.status = "failed";
        project.steps.render.error = err.message || "Unknown render error";
        project.markModified("steps.render");
        await project.save();
      }
    } catch { /* ignore */ }
  }
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
    const { projectId, quality = "1080p" } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    if (!QUALITY_PRESETS[quality]) {
      return NextResponse.json({ error: `Invalid quality. Use: ${Object.keys(QUALITY_PRESETS).join(", ")}` }, { status: 400 });
    }

    // 3. Check for existing active render
    const existingJob = renderStore.getByProject(projectId);
    if (existingJob && existingJob.status !== "complete" && existingJob.status !== "failed") {
      return NextResponse.json({
        jobId: existingJob.jobId,
        status: existingJob.status,
        message: "Render already in progress",
      });
    }

    // 4. Load project and validate assets
    await connectDB();
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Validate required assets exist
    const images = project.steps?.images?.data || [];
    const scenes = project.steps?.scenes?.data || [];
    const audioUrl = project.steps?.voice?.audioUrl;
    const subtitles = project.steps?.subtitles?.data || [];
    const subtitleSettings = project.steps?.subtitles?.settings;
    const animationData = project.steps?.animation?.data;

    if (!images.length) {
      return NextResponse.json({ error: "No images found. Complete the Images step first." }, { status: 400 });
    }
    if (!audioUrl) {
      return NextResponse.json({ error: "No audio found. Complete the Voice step first." }, { status: 400 });
    }

    // 5. Create render job
    const jobId = generateJobId();
    const job: RenderJob = {
      jobId,
      projectId,
      status: "queued",
      progress: 0,
      phase: "Queued",
      startedAt: Date.now(),
      quality,
    };
    renderStore.create(job);

    // Update project with job reference
    project.steps.render.jobId = jobId;
    project.steps.render.status = "rendering";
    project.steps.render.progress = 0;
    project.steps.render.quality = quality;
    project.steps.render.error = "";
    project.markModified("steps.render");
    await project.save();

    // 6. Fire and forget — run pipeline in background
    executeRenderPipeline(
      jobId,
      projectId,
      quality,
      images,
      scenes,
      audioUrl,
      subtitles,
      subtitleSettings,
      animationData,
    ).catch((err) => {
      console.error("[Render] Unhandled pipeline error:", err);
    });

    return NextResponse.json({
      success: true,
      jobId,
      status: "queued",
      message: "Render job started. Poll /api/ai/render/status for progress.",
    });

  } catch (error: any) {
    console.error("[/api/ai/render] Error:", error);
    return NextResponse.json(
      { error: "Internal server error starting render" },
      { status: 500 }
    );
  }
}
