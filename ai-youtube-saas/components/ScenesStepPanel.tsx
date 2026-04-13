"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clapperboard,
  FileText,
  RefreshCcw,
  ChevronRight,
  Loader2,
  Sparkles,
  Clock,
  ImageIcon,
  Type,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────────── Types ─────────────────────── */

interface Scene {
  id: number;
  text: string;
  prompt: string;
  duration: number;
}

/* ─────────────────────── Component ─────────────────────── */

const SCENE_COLORS = [
  { bg: "bg-violet-500/8", border: "border-violet-500/20", text: "text-violet-400", dot: "bg-violet-500" },
  { bg: "bg-cyan-500/8", border: "border-cyan-500/20", text: "text-cyan-400", dot: "bg-cyan-500" },
  { bg: "bg-amber-500/8", border: "border-amber-500/20", text: "text-amber-400", dot: "bg-amber-500" },
  { bg: "bg-rose-500/8", border: "border-rose-500/20", text: "text-rose-400", dot: "bg-rose-500" },
];

export const ScenesStepPanel = ({
  scriptPreview,
  initialScenes,
  onApprove,
  onAutoSave,
}: {
  scriptPreview: string;
  initialScenes?: Scene[];
  onApprove: (scenes?: Scene[]) => Promise<void>;
  onAutoSave?: (scenes: Scene[]) => void;
}) => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    if (initialScenes && initialScenes.length > 0 && !hasGenerated) {
      setScenes(initialScenes);
      setHasGenerated(true);
    }
  }, [initialScenes, hasGenerated]);

  const selectedScene = scenes[selectedIndex] ?? null;

  /* ── Auto-Save Debouncer ── */
  useEffect(() => {
    if (!hasGenerated || scenes.length === 0 || !onAutoSave) return;
    const timer = setTimeout(() => {
      onAutoSave(scenes);
    }, 1000);
    return () => clearTimeout(timer);
  }, [scenes, hasGenerated, onAutoSave]);

  /* ── Update a scene field ── */
  const updateScene = (index: number, field: keyof Scene, value: string | number) => {
    setScenes((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  /* ── Generate scenes ── */
  const handleGenerate = async () => {
    setIsGenerating(true);
    setSelectedIndex(0);
    // TODO: Connect LIVE AI API endpoint here when backend is wired.
    setIsGenerating(false);
  };

  /* ── Total duration ── */
  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="flex flex-col h-full relative z-10 w-full">

      {/* ── Header ── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Clapperboard className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-400/70">Step 4</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
          Scene Builder
        </h2>
        <p className="text-white/35 text-[15px] font-medium leading-relaxed max-w-lg">
          Break your script into visual scenes with image prompts and timing for each segment.
        </p>
      </div>

      {/* ── Script Preview ── */}
      <div className="mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <FileText className="w-3.5 h-3.5 text-violet-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-400/50 mb-1.5">Script Preview</p>
          <p className="text-white/45 text-[13px] leading-relaxed font-medium line-clamp-3">
            {scriptPreview || "No script available"}
          </p>
        </div>
      </div>

      {/* ── Generate Button (before first generation) ── */}
      {!hasGenerated && (
        <motion.button
          onClick={handleGenerate}
          disabled={isGenerating}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={cn(
            "w-full py-4 rounded-xl font-bold text-[13px] tracking-wide flex items-center justify-center gap-2.5 transition-all mb-6",
            "bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/15",
            isGenerating && "opacity-60 cursor-not-allowed saturate-50"
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Scenes...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Generate Scenes
            </>
          )}
        </motion.button>
      )}

      {/* ── Empty State ── */}
      {!hasGenerated && !isGenerating && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/[0.04] min-h-[200px]">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.02] flex items-center justify-center border border-white/[0.04]">
            <Clapperboard className="w-6 h-6 text-white/10" />
          </div>
          <p className="text-white/15 font-medium text-sm text-center max-w-xs">
            Click &quot;Generate Scenes&quot; to break your script into visual segments.
          </p>
        </div>
      )}

      {/* ── Scenes Split Layout ── */}
      <AnimatePresence>
        {hasGenerated && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Stats bar */}
            <div className="flex items-center gap-5 mb-5">
              <div className="flex items-center gap-2 text-[11px] font-mono text-white/20">
                <Clapperboard className="w-3 h-3" />
                {scenes.length} scenes
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-white/20">
                <Clock className="w-3 h-3" />
                {totalDuration}s total
              </div>
              <div className="flex-1" />
              {/* Timeline dots */}
              <div className="flex items-center gap-1.5">
                {scenes.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedIndex(i)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      i === selectedIndex
                        ? `${SCENE_COLORS[i % SCENE_COLORS.length].dot} scale-125 shadow-lg`
                        : "bg-white/10 hover:bg-white/25"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Split panel */}
            <div className="flex-1 flex gap-5 min-h-0">

              {/* LEFT — Scene List */}
              <div className="w-[280px] shrink-0 flex flex-col gap-2.5 overflow-y-auto hide-scrollbar pr-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={scenes.length}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-2.5"
                  >
                    {scenes.map((scene, idx) => {
                      const isActive = selectedIndex === idx;
                      const color = SCENE_COLORS[idx % SCENE_COLORS.length];

                      return (
                        <motion.button
                          key={scene.id}
                          initial={{ opacity: 0, x: -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: idx * 0.08,
                            type: "spring",
                            stiffness: 300,
                            damping: 24,
                          }}
                          onClick={() => setSelectedIndex(idx)}
                          className={cn(
                            "text-left p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden",
                            isActive
                              ? `${color.bg} ${color.border} shadow-lg`
                              : "bg-white/[0.015] border-white/[0.05] hover:bg-white/[0.03] hover:border-white/[0.08]"
                          )}
                        >
                          {/* Active indicator bar */}
                          {isActive && (
                            <motion.div
                              layoutId="activeSceneBar"
                              className={cn("absolute left-0 top-0 bottom-0 w-[3px] rounded-full", color.dot)}
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                          )}

                          <div className="flex items-center gap-3 mb-2">
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-md border",
                              isActive
                                ? `${color.bg} ${color.border} ${color.text}`
                                : "bg-white/[0.03] border-white/[0.06] text-white/25"
                            )}>
                              Scene {idx + 1}
                            </span>
                            <span className={cn(
                              "text-[10px] font-mono transition-colors",
                              isActive ? "text-white/40" : "text-white/15"
                            )}>
                              {scene.duration}s
                            </span>
                          </div>

                          <p className={cn(
                            "text-[13px] font-medium leading-relaxed transition-colors duration-200 line-clamp-2",
                            isActive ? "text-white/80" : "text-white/35 group-hover:text-white/55"
                          )}>
                            {scene.text}
                          </p>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* RIGHT — Scene Editor */}
              <div className="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                  {selectedScene && (
                    <motion.div
                      key={selectedIndex}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="h-full flex flex-col"
                    >
                      <div className="rounded-2xl bg-[#080808] border border-white/[0.06] flex-1 flex flex-col overflow-hidden">
                        {/* Editor header */}
                        <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/[0.04] bg-white/[0.01]">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-2.5 h-2.5 rounded-full",
                              SCENE_COLORS[selectedIndex % SCENE_COLORS.length].dot
                            )} />
                            <span className="text-[12px] font-bold text-white/50 tracking-wide">
                              Scene {selectedIndex + 1}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-white/20">
                            <Play className="w-2.5 h-2.5" />
                            {selectedScene.duration}s
                          </div>
                        </div>

                        {/* Editor fields */}
                        <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto hide-scrollbar">

                          {/* Scene Text */}
                          <div>
                            <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-white/25 mb-3">
                              <Type className="w-3 h-3" />
                              Scene Narration
                            </label>
                            <textarea
                              value={selectedScene.text}
                              onChange={(e) => updateScene(selectedIndex, "text", e.target.value)}
                              rows={4}
                              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-5 py-4 text-white/80 text-[14px] leading-relaxed placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500/25 focus:border-cyan-500/25 transition-all duration-200 font-medium resize-none hide-scrollbar"
                              placeholder="Scene narration text..."
                            />
                          </div>

                          {/* Image Prompt */}
                          <div>
                            <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-white/25 mb-3">
                              <ImageIcon className="w-3 h-3" />
                              Image Prompt
                            </label>
                            <input
                              type="text"
                              value={selectedScene.prompt}
                              onChange={(e) => updateScene(selectedIndex, "prompt", e.target.value)}
                              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-5 py-3.5 text-white/80 text-[14px] placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500/25 focus:border-cyan-500/25 transition-all duration-200 font-medium"
                              placeholder="Describe the visual for this scene..."
                            />
                            {/* Prompt preview card */}
                            <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-white/[0.02] to-white/[0.005] border border-dashed border-white/[0.06] flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center shrink-0">
                                <ImageIcon className="w-5 h-5 text-white/10" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/15 mb-1">Visual Preview</p>
                                <p className="text-[12px] text-white/30 font-medium leading-relaxed italic">
                                  &quot;{selectedScene.prompt}&quot;
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Duration */}
                          <div>
                            <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-white/25 mb-3">
                              <Clock className="w-3 h-3" />
                              Duration (seconds)
                            </label>
                            <div className="flex items-center gap-4">
                              <input
                                type="range"
                                min={1}
                                max={15}
                                value={selectedScene.duration}
                                onChange={(e) => updateScene(selectedIndex, "duration", parseInt(e.target.value))}
                                className="flex-1 h-1.5 bg-white/[0.06] rounded-full appearance-none cursor-pointer accent-cyan-500
                                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500
                                  [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(6,182,212,0.4)] [&::-webkit-slider-thumb]:cursor-pointer
                                  [&::-webkit-slider-thumb]:transition-shadow [&::-webkit-slider-thumb]:hover:shadow-[0_0_16px_rgba(6,182,212,0.6)]"
                              />
                              <div className="w-14 h-10 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                                <span className="text-[15px] font-bold text-white/70 tabular-nums">{selectedScene.duration}s</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── Action Footer ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 300, damping: 30 }}
              className="pt-5 mt-4 border-t border-white/[0.04] flex justify-end items-center"
            >
              <motion.button
                onClick={async () => {
                  if (scenes.length > 0 && !isGenerating && !isApproving) {
                    setIsApproving(true);
                    await onApprove(scenes);
                    setIsApproving(false);
                  }
                }}
                disabled={scenes.length === 0 || isGenerating || isApproving}
                whileHover={scenes.length > 0 && !isApproving ? { scale: 1.02 } : {}}
                whileTap={scenes.length > 0 && !isApproving ? { scale: 0.98 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={cn(
                  "px-6 py-3 rounded-xl font-bold text-[13px] tracking-wide flex items-center gap-2 transition-all duration-200",
                  scenes.length > 0 && !isGenerating && !isApproving
                    ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/15 hover:shadow-cyan-500/25"
                    : "bg-white/[0.03] text-white/15 cursor-not-allowed border border-white/[0.04]"
                )}
              >
                {isApproving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    Approve & Continue
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
