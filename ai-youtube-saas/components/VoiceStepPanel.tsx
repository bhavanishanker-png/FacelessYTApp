"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  FileText,
  RefreshCcw,
  ChevronRight,
  Loader2,
  Sparkles,
  Play,
  Pause,
  Volume2,
  Gauge,
  Check,
  User,
  Zap,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────────── Types ─────────────────────── */

interface Voice {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  color: {
    bg: string;
    border: string;
    text: string;
    dot: string;
    glow: string;
    gradient: string;
  };
  waveform: number[];
}

/* ─────────────────────── Mock Data ─────────────────────── */

const VOICES: Voice[] = [
  {
    id: "male-deep",
    name: "Male Deep",
    subtitle: "Calm & Serious",
    description: "A deep, authoritative voice with a calm and composed delivery. Perfect for motivational and educational content.",
    icon: User,
    color: {
      bg: "bg-indigo-500/8",
      border: "border-indigo-500/20",
      text: "text-indigo-400",
      dot: "bg-indigo-500",
      glow: "shadow-indigo-500/20",
      gradient: "from-indigo-500 to-indigo-600",
    },
    waveform: [0.3, 0.5, 0.8, 0.6, 0.9, 0.4, 0.7, 0.5, 0.8, 0.3, 0.6, 0.9, 0.5, 0.7, 0.4, 0.8, 0.6, 0.3, 0.7, 0.5],
  },
  {
    id: "female-calm",
    name: "Female Calm",
    subtitle: "Soft & Clear",
    description: "A soothing, clear voice with gentle articulation. Ideal for guided content and wellness topics.",
    icon: Mic,
    color: {
      bg: "bg-rose-500/8",
      border: "border-rose-500/20",
      text: "text-rose-400",
      dot: "bg-rose-500",
      glow: "shadow-rose-500/20",
      gradient: "from-rose-500 to-pink-500",
    },
    waveform: [0.2, 0.4, 0.6, 0.5, 0.7, 0.3, 0.5, 0.4, 0.6, 0.2, 0.5, 0.7, 0.4, 0.6, 0.3, 0.5, 0.4, 0.2, 0.6, 0.4],
  },
  {
    id: "energetic",
    name: "Energetic",
    subtitle: "Fast & Engaging",
    description: "A high-energy voice with dynamic pacing that commands attention. Great for hype and fast-paced content.",
    icon: Zap,
    color: {
      bg: "bg-amber-500/8",
      border: "border-amber-500/20",
      text: "text-amber-400",
      dot: "bg-amber-500",
      glow: "shadow-amber-500/20",
      gradient: "from-amber-500 to-orange-500",
    },
    waveform: [0.5, 0.8, 0.9, 0.7, 1.0, 0.6, 0.9, 0.8, 0.7, 0.5, 0.9, 1.0, 0.7, 0.8, 0.6, 0.9, 0.7, 0.5, 0.8, 0.9],
  },
  {
    id: "storytelling",
    name: "Storytelling",
    subtitle: "Emotional Tone",
    description: "A warm, expressive voice with natural pauses and emotional depth. Built for narrative-driven videos.",
    icon: BookOpen,
    color: {
      bg: "bg-emerald-500/8",
      border: "border-emerald-500/20",
      text: "text-emerald-400",
      dot: "bg-emerald-500",
      glow: "shadow-emerald-500/20",
      gradient: "from-emerald-500 to-teal-500",
    },
    waveform: [0.3, 0.6, 0.7, 0.4, 0.8, 0.5, 0.6, 0.7, 0.5, 0.3, 0.7, 0.8, 0.6, 0.5, 0.4, 0.7, 0.5, 0.6, 0.4, 0.7],
  },
];

/* ─────────────────────── Waveform Visualiser ─────────────────────── */

const WaveformVisualiser = ({
  bars,
  isPlaying,
  progress,
  color,
}: {
  bars: number[];
  isPlaying: boolean;
  progress: number;
  color: string;
}) => (
  <div className="flex items-center gap-[3px] h-10">
    {bars.map((height, i) => {
      const filled = i / bars.length <= progress;
      return (
        <motion.div
          key={i}
          className={cn(
            "w-[3px] rounded-full transition-colors duration-200",
            filled ? color : "bg-white/[0.08]"
          )}
          animate={{
            height: isPlaying
              ? `${height * 40}px`
              : `${height * 20}px`,
          }}
          transition={{
            duration: 0.3,
            delay: isPlaying ? i * 0.02 : 0,
            repeat: isPlaying ? Infinity : 0,
            repeatType: "reverse",
          }}
        />
      );
    })}
  </div>
);

/* ─────────────────────── Component ─────────────────────── */

export const VoiceStepPanel = ({
  scriptPreview,
  onApprove,
}: {
  scriptPreview: string;
  onApprove: () => void;
}) => {
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1.0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const selectedVoice = VOICES.find((v) => v.id === selectedVoiceId) ?? null;

  /* ── Mock playback simulation ── */
  const startPlayback = () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }
    setIsPlaying(true);
    setPlaybackProgress(0);
    playIntervalRef.current = setInterval(() => {
      setPlaybackProgress((prev) => {
        if (prev >= 1) {
          stopPlayback();
          return 0;
        }
        return prev + 0.02;
      });
    }, 100);
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
  };

  /* ── Stop playback when voice changes ── */
  useEffect(() => {
    stopPlayback();
    setPlaybackProgress(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVoiceId]);

  /* ── Cleanup on unmount ── */
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, []);

  /* ── Generate voiceover ── */
  const handleGenerate = () => {
    if (!selectedVoiceId) return;
    setIsGenerating(true);
    stopPlayback();
    setTimeout(() => {
      setHasGenerated(true);
      setIsGenerating(false);
    }, 2200);
  };

  /* ── Regenerate ── */
  const handleRegenerate = () => {
    setHasGenerated(false);
    setIsGenerating(false);
    stopPlayback();
    setPlaybackProgress(0);
  };

  const formatSpeed = (s: number) => `${s.toFixed(1)}x`;

  return (
    <div className="flex flex-col h-full relative z-10 w-full">

      {/* ── Header ── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
            <Mic className="w-4 h-4 text-pink-400" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-pink-400/70">Step 5</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
          Voice Studio
        </h2>
        <p className="text-white/35 text-[15px] font-medium leading-relaxed max-w-lg">
          Select and preview a premium AI voice for your narration. Fine-tune the speed and generate.
        </p>
      </div>

      {/* ── Script Preview ── */}
      <div className="mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <FileText className="w-3.5 h-3.5 text-violet-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-400/50 mb-1.5">Script Preview</p>
          <p className="text-white/45 text-[13px] leading-relaxed font-medium line-clamp-2">
            {scriptPreview || "No script available"}
          </p>
        </div>
      </div>

      {/* ── Main content area (scrollable) ── */}
      <div className="flex-1 overflow-y-auto hide-scrollbar -mx-1 px-1 pb-2">

        {/* ── Voice Cards Grid ── */}
        <div className="mb-6">
          <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-white/25 mb-4">
            <Volume2 className="w-3 h-3" />
            Select Voice
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {VOICES.map((voice, idx) => {
              const isSelected = selectedVoiceId === voice.id;
              const Icon = voice.icon;

              return (
                <motion.button
                  key={voice.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: idx * 0.06,
                    type: "spring",
                    stiffness: 300,
                    damping: 24,
                  }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => setSelectedVoiceId(voice.id)}
                  className={cn(
                    "text-left p-5 rounded-2xl border transition-all duration-200 group relative overflow-hidden",
                    isSelected
                      ? `${voice.color.bg} ${voice.color.border} shadow-lg ${voice.color.glow}`
                      : "bg-white/[0.015] border-white/[0.05] hover:bg-white/[0.03] hover:border-white/[0.08]"
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 transition-all duration-200",
                      isSelected
                        ? `${voice.color.bg} ${voice.color.border} ${voice.color.text}`
                        : "bg-white/[0.03] border-white/[0.06] text-white/20 group-hover:text-white/40"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={cn(
                          "text-[15px] font-bold tracking-tight transition-colors duration-200",
                          isSelected ? "text-white" : "text-white/55 group-hover:text-white/80"
                        )}>
                          {voice.name}
                        </h3>
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-md border transition-all",
                          isSelected
                            ? `${voice.color.bg} ${voice.color.border} ${voice.color.text}`
                            : "bg-white/[0.02] border-white/[0.05] text-white/20"
                        )}>
                          {voice.subtitle}
                        </span>
                      </div>
                      <p className={cn(
                        "text-[12px] leading-relaxed transition-colors duration-200",
                        isSelected ? "text-white/45" : "text-white/20 group-hover:text-white/35"
                      )}>
                        {voice.description}
                      </p>
                    </div>

                    {/* Radio */}
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-all duration-200",
                      isSelected
                        ? `${voice.color.border.replace("border-", "border-")} ${voice.color.dot}`
                        : "border-white/10 group-hover:border-white/20"
                    )}>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        >
                          <Check className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Mini waveform preview */}
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="mt-4 pt-4 border-t border-white/[0.05]"
                    >
                      <div className="flex items-center justify-center">
                        <WaveformVisualiser
                          bars={voice.waveform}
                          isPlaying={false}
                          progress={0}
                          color={voice.color.dot}
                        />
                      </div>
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── Speed Control ── */}
        <AnimatePresence>
          {selectedVoiceId && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="mb-6 p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-white/25 mb-4">
                  <Gauge className="w-3 h-3" />
                  Playback Speed
                </label>
                <div className="flex items-center gap-5">
                  <span className="text-[11px] font-mono text-white/25 w-8">0.8x</span>
                  <input
                    type="range"
                    min={0.8}
                    max={1.2}
                    step={0.1}
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 bg-white/[0.06] rounded-full appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-pink-500
                      [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(236,72,153,0.4)] [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-webkit-slider-thumb]:transition-shadow [&::-webkit-slider-thumb]:hover:shadow-[0_0_16px_rgba(236,72,153,0.6)]"
                  />
                  <span className="text-[11px] font-mono text-white/25 w-8">1.2x</span>
                  <div className="w-16 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                    <span className="text-[14px] font-bold text-white/60 tabular-nums">{formatSpeed(speed)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Generate Voiceover Button ── */}
        <AnimatePresence>
          {selectedVoiceId && !hasGenerated && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <motion.button
                onClick={handleGenerate}
                disabled={isGenerating}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={cn(
                  "w-full py-4 rounded-xl font-bold text-[13px] tracking-wide flex items-center justify-center gap-2.5 transition-all mb-6",
                  selectedVoice
                    ? `bg-gradient-to-r ${selectedVoice.color.gradient} text-white shadow-lg ${selectedVoice.color.glow}`
                    : "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/15",
                  isGenerating && "opacity-60 cursor-not-allowed saturate-50"
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Voiceover...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate Voiceover
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Audio Player (post-generation) ── */}
        <AnimatePresence>
          {hasGenerated && selectedVoice && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="mb-6"
            >
              <div className="rounded-2xl bg-[#080808] border border-white/[0.06] overflow-hidden">
                {/* Player header */}
                <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/[0.04] bg-white/[0.01]">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2.5 h-2.5 rounded-full", selectedVoice.color.dot)} />
                    <span className="text-[12px] font-bold text-white/50 tracking-wide">
                      {selectedVoice.name} — {formatSpeed(speed)} speed
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-white/20 tracking-wider uppercase">voiceover.mp3</span>
                </div>

                {/* Player body */}
                <div className="p-6">
                  {/* Waveform */}
                  <div className="flex items-center justify-center mb-6">
                    <WaveformVisualiser
                      bars={selectedVoice.waveform}
                      isPlaying={isPlaying}
                      progress={playbackProgress}
                      color={selectedVoice.color.dot}
                    />
                  </div>

                  {/* Progress bar */}
                  <div className="mb-5">
                    <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <motion.div
                        className={cn("h-full rounded-full", selectedVoice.color.dot)}
                        style={{ width: `${playbackProgress * 100}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-[10px] font-mono text-white/20">
                        {Math.floor(playbackProgress * 18)}:{String(Math.floor((playbackProgress * 18 * 60) % 60)).padStart(2, "0")}
                      </span>
                      <span className="text-[10px] font-mono text-white/20">0:18</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-4">
                    <motion.button
                      onClick={startPlayback}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200",
                        `bg-gradient-to-br ${selectedVoice.color.gradient} shadow-lg ${selectedVoice.color.glow}`
                      )}
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 text-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Action Footer ── */}
      <div className="pt-5 mt-2 border-t border-white/[0.04] flex justify-between items-center">
        {hasGenerated ? (
          <button
            onClick={handleRegenerate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.03] transition-all duration-200 font-semibold text-[13px]"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Regenerate
          </button>
        ) : (
          <div />
        )}

        <motion.button
          onClick={onApprove}
          disabled={!hasGenerated || isGenerating}
          whileHover={hasGenerated && !isGenerating ? { scale: 1.02 } : {}}
          whileTap={hasGenerated && !isGenerating ? { scale: 0.98 } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={cn(
            "px-6 py-3 rounded-xl font-bold text-[13px] tracking-wide flex items-center gap-2 transition-all duration-200",
            hasGenerated && !isGenerating
              ? `bg-gradient-to-r ${selectedVoice ? selectedVoice.color.gradient : "from-pink-500 to-rose-500"} text-white shadow-lg ${selectedVoice ? selectedVoice.color.glow : "shadow-pink-500/15"} hover:shadow-pink-500/25`
              : "bg-white/[0.03] text-white/15 cursor-not-allowed border border-white/[0.04]"
          )}
        >
          Approve & Continue
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
};
