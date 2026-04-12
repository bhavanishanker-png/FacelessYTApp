"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Film,
  RefreshCcw,
  Download,
  RotateCcw,
  Loader2,
  CheckCircle2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Clapperboard,
  Sparkles,
  PartyPopper,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────────── Mock Data ─────────────────────── */

const MOCK_VIDEO_URL = "https://www.w3schools.com/html/mov_bbb.mp4";

const MOCK_SCENES = [
  { id: 1, label: "Scene 1", text: "Working hard illusion", duration: 4, color: "bg-violet-500" },
  { id: 2, label: "Scene 2", text: "Just being busy", duration: 4, color: "bg-cyan-500" },
  { id: 3, label: "Scene 3", text: "Scrolling your phone", duration: 5, color: "bg-amber-500" },
  { id: 4, label: "Scene 4", text: "Wasting your life", duration: 5, color: "bg-rose-500" },
];

/* ─────────────────────── Component ─────────────────────── */

export const VideoStepPanel = ({
  projectTitle,
  initialVideoUrl,
  onApprove,
}: {
  projectTitle: string;
  initialVideoUrl?: string;
  onApprove: (videoUrl?: string) => Promise<void>;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [videoKey, setVideoKey] = useState(0);

  const currentVideoUrl = initialVideoUrl || MOCK_VIDEO_URL;

  /* ── Video controls ── */
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    setProgress(video.duration ? (video.currentTime / video.duration) * 100 : 0);

    // Determine active scene based on progress
    const totalSceneDuration = MOCK_SCENES.reduce((s, sc) => s + sc.duration, 0);
    const elapsed = (video.currentTime / (video.duration || 1)) * totalSceneDuration;
    let acc = 0;
    for (let i = 0; i < MOCK_SCENES.length; i++) {
      acc += MOCK_SCENES[i].duration;
      if (elapsed <= acc) {
        setActiveSceneIndex(i);
        break;
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setProgress(100);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    video.currentTime = pct * video.duration;
  };

  const handleReplay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play();
    setIsPlaying(true);
    setProgress(0);
  };

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setIsPlaying(false);
    setProgress(0);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setTimeout(() => {
      setVideoKey((k) => k + 1);
      setIsRegenerating(false);
    }, 2000);
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = currentVideoUrl;
    a.download = `${projectTitle.replace(/\s+/g, "_")}_final.mp4`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleFinish = async () => {
    setIsApproving(true);
    await onApprove(currentVideoUrl);
    setIsApproving(false);
    setIsFinished(true);
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const handleFullscreen = () => {
    videoRef.current?.requestFullscreen?.();
  };

  return (
    <div className="flex flex-col h-full relative z-10 w-full">

      {/* ── Completion Overlay ── */}
      <AnimatePresence>
        {isFinished && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0A0A]/95 backdrop-blur-xl rounded-2xl"
          >
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/30"
            >
              <PartyPopper className="w-10 h-10 text-white" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-extrabold text-white tracking-tight mb-3"
            >
              Video Complete! 🎉
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="text-white/40 text-[15px] font-medium max-w-md text-center leading-relaxed mb-10"
            >
              Your video &quot;{projectTitle}&quot; has been finalised and is ready to download and upload to YouTube.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex gap-3"
            >
              <motion.button
                onClick={handleDownload}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-[13px] tracking-wide flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Download className="w-4 h-4" />
                Download Video
              </motion.button>
              <motion.button
                onClick={() => setIsFinished(false)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="px-6 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/60 font-bold text-[13px] tracking-wide hover:text-white/80 transition-colors"
              >
                Back to Preview
              </motion.button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6"
            >
              <Link
                href="/dashboard"
                className="text-[13px] font-semibold text-indigo-400/60 hover:text-indigo-400 transition-colors duration-200"
              >
                ← Back to Dashboard
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Film className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400/70">Step 6 · Final</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
          Video Preview
        </h2>
        <p className="text-white/35 text-[15px] font-medium leading-relaxed max-w-lg">
          Review your final rendered video. Replay, regenerate, or download — then approve to finish.
        </p>
      </div>

      {/* ── Main content (scrollable) ── */}
      <div className="flex-1 overflow-y-auto hide-scrollbar -mx-1 px-1 pb-2">

        {/* ── Video Player Container ── */}
        <div className="rounded-2xl bg-[#080808] border border-white/[0.06] overflow-hidden mb-5 group relative">
          {/* Regenerating overlay */}
          <AnimatePresence>
            {isRegenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 bg-[#080808]/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4"
              >
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                <p className="text-white/50 text-sm font-medium">Regenerating video...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Player header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04] bg-white/[0.01]">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
            </div>
            <span className="text-[10px] font-mono text-white/15 tracking-wider uppercase">
              {projectTitle.replace(/\s+/g, "_").toLowerCase()}_final.mp4
            </span>
          </div>

          {/* Video element */}
          <div className="relative bg-black aspect-video cursor-pointer" onClick={togglePlay}>
            <video
              key={videoKey}
              ref={videoRef}
              src={currentVideoUrl}
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleVideoEnded}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              preload="metadata"
            />

            {/* Play overlay (shown when paused) */}
            <AnimatePresence>
              {!isPlaying && !isRegenerating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/30"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20"
                  >
                    <Play className="w-7 h-7 text-white ml-1" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Custom controls bar */}
          <div className="px-5 py-3 border-t border-white/[0.04] bg-white/[0.01]">
            {/* Progress bar */}
            <div
              className="w-full h-1.5 bg-white/[0.06] rounded-full mb-3 cursor-pointer group/progress relative"
              onClick={handleSeek}
            >
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-100 relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-400 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              </div>
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Play/Pause */}
                <motion.button
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5 text-white/70" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-white/70 ml-0.5" />
                  )}
                </motion.button>

                {/* Mute */}
                <motion.button
                  onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="w-3.5 h-3.5 text-white/70" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-white/70" />
                  )}
                </motion.button>

                {/* Time */}
                <span className="text-[11px] font-mono text-white/25 tabular-nums">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Fullscreen */}
              <motion.button
                onClick={(e) => { e.stopPropagation(); handleFullscreen(); }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5 text-white/70" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* ── Scene Timeline ── */}
        <div className="mb-5">
          <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-white/25 mb-3">
            <Clapperboard className="w-3 h-3" />
            Scene Timeline
          </label>
          <div className="flex gap-2">
            {MOCK_SCENES.map((scene, idx) => {
              const totalDur = MOCK_SCENES.reduce((s, sc) => s + sc.duration, 0);
              const widthPct = (scene.duration / totalDur) * 100;
              const isActive = activeSceneIndex === idx;

              return (
                <motion.div
                  key={scene.id}
                  className={cn(
                    "rounded-xl border p-3 transition-all duration-200 relative overflow-hidden cursor-default",
                    isActive
                      ? "bg-white/[0.04] border-white/[0.1]"
                      : "bg-white/[0.015] border-white/[0.04]"
                  )}
                  style={{ width: `${widthPct}%` }}
                  whileHover={{ y: -1 }}
                >
                  {/* Color bar at top */}
                  <div className={cn("absolute top-0 left-0 right-0 h-[2px]", scene.color, isActive ? "opacity-100" : "opacity-30")} />

                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn("w-1.5 h-1.5 rounded-full", scene.color, isActive ? "opacity-100" : "opacity-30")} />
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-[0.1em] transition-colors",
                      isActive ? "text-white/60" : "text-white/20"
                    )}>
                      {scene.label}
                    </span>
                  </div>
                  <p className={cn(
                    "text-[11px] font-medium truncate transition-colors",
                    isActive ? "text-white/40" : "text-white/15"
                  )}>
                    {scene.text}
                  </p>
                  <span className={cn(
                    "text-[9px] font-mono mt-1 block transition-colors",
                    isActive ? "text-white/25" : "text-white/10"
                  )}>
                    {scene.duration}s
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── Quick Action Buttons ── */}
        <div className="flex gap-3 mb-2">
          <motion.button
            onClick={handleReplay}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={isRegenerating}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-200 font-semibold text-[12px] tracking-wide disabled:opacity-30"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Replay
          </motion.button>

          <motion.button
            onClick={handleRegenerate}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={isRegenerating}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-200 font-semibold text-[12px] tracking-wide disabled:opacity-30"
          >
            {isRegenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCcw className="w-3.5 h-3.5" />
            )}
            Regenerate
          </motion.button>

          <motion.button
            onClick={handleDownload}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={isRegenerating}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-200 font-semibold text-[12px] tracking-wide disabled:opacity-30"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </motion.button>
        </div>
      </div>

      {/* ── Finish Footer ── */}
      <div className="pt-5 mt-2 border-t border-white/[0.04] flex justify-between items-center">
        <div className="flex items-center gap-2 text-[11px] font-mono text-white/15">
          <CheckCircle2 className="w-3 h-3" />
          All steps completed
        </div>

        <motion.button
          onClick={handleFinish}
          disabled={isRegenerating || isApproving}
          whileHover={!isRegenerating && !isApproving ? { scale: 1.02 } : {}}
          whileTap={!isRegenerating && !isApproving ? { scale: 0.98 } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={cn(
            "px-7 py-3 rounded-xl font-bold text-[13px] tracking-wide flex items-center gap-2.5 transition-all duration-200",
            !isRegenerating && !isApproving
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
              : "bg-white/[0.03] text-white/15 cursor-not-allowed border border-white/[0.04]"
          )}
        >
          {isApproving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Approve & Finish
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};
