"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb, Check, ChevronRight, Loader2, Pencil, AlertTriangle,
  Flame, Heart, HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ViralHook, HookTone, HookStyle } from "@/lib/ai";

// ─── Constants ────────────────────────────────────────────────

const TONES: { value: HookTone; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { value: "dramatic", label: "Dramatic", icon: Flame, color: "text-rose-400", bg: "bg-rose-500/10" },
  { value: "emotional", label: "Emotional", icon: Heart, color: "text-pink-400", bg: "bg-pink-500/10" },
  { value: "curiosity", label: "Curiosity", icon: HelpCircle, color: "text-amber-400", bg: "bg-amber-500/10" },
];

function getScoreColor(score: number) {
  if (score >= 85) return "text-emerald-400";
  if (score >= 70) return "text-amber-400";
  if (score >= 50) return "text-orange-400";
  return "text-white/40";
}

function getScoreBarColor(score: number) {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 70) return "bg-amber-500";
  if (score >= 50) return "bg-orange-500";
  return "bg-white/20";
}

// ─── Component ────────────────────────────────────────────────

export const HookStepPanel = ({
  selectedIdea,
  niche,
  stepData,
  onApprove,
  onAutoSave,
}: {
  selectedIdea: string;
  niche: string;
  stepData?: any;
  onApprove: (hook?: string) => Promise<void>;
  onAutoSave?: (data: any) => void;
}) => {
  const [hooks, setHooks] = useState<ViralHook[]>(() => {
    if (stepData?.aiOutput) {
      if (typeof stepData.aiOutput === "string") {
        try {
          const parsed = JSON.parse(stepData.aiOutput);
          if (parsed.hooks) return parsed.hooks;
        } catch { /* ignore */ }
      } else if (typeof stepData.aiOutput === "object" && stepData.aiOutput.hooks) {
        return stepData.aiOutput.hooks;
      }
    }
    return [];
  });
  
  const [selectedIndex, setSelectedIndex] = useState<number | null>(() => {
    // Rehydrate selection from DB
    if (stepData?.selectedHook && hooks.length > 0) {
      // Find the index of the hook that matches the DB selection, if it exists
      const idx = hooks.findIndex((h: ViralHook) => h.text === stepData.selectedHook || h.text === stepData.editedHook);
      return idx >= 0 ? idx : null;
    }
    return null;
  });

  const [editedHook, setEditedHook] = useState(stepData?.editedHook || stepData?.selectedHook || "");
  const [tone, setTone] = useState<HookTone>(stepData?.tone || "dramatic");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [generationCount, setGenerationCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Sync textarea whenever user selects a different hook card
  useEffect(() => {
    if (selectedIndex !== null && hooks[selectedIndex]) {
      setEditedHook(hooks[selectedIndex].text);
    }
  }, [selectedIndex, hooks]);

  const handleGenerate = useCallback(async () => {
    if (isGenerating || !selectedIdea || !niche) return;

    setIsGenerating(true);
    setSelectedIndex(null);
    setEditedHook("");
    setError(null);

    try {
      const res = await fetch("/api/ai/hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: selectedIdea, niche, tone }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        if (res.status === 429) {
          const waitSec = result.retryAfterMs ? Math.ceil(result.retryAfterMs / 1000) : 60;
          setError(`Rate limited — please try again in ${waitSec}s`);
        } else {
          setError(result.error || "Failed to generate hooks. Please try again.");
        }
        return;
      }

      setHooks(result.data.hooks);
      setGenerationCount((c) => c + 1);
      
      if (onAutoSave) {
        onAutoSave({ aiOutput: result.data });
      }
    } catch (err) {
      setError("Network error — check your connection and try again.");
      console.error("[HookStepPanel] Generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, selectedIdea, niche, tone, onAutoSave]);

  const handleApprove = useCallback(async () => {
    if (isApproving || editedHook.trim().length === 0) return;
    setIsApproving(true);
    try {
      await onApprove(editedHook.trim());
    } finally {
      setIsApproving(false);
    }
  }, [editedHook, isApproving, onApprove]);

  const hasApproval = editedHook.trim().length > 0;

  return (
    <div className="flex flex-col h-full relative z-10 w-full">

      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Pencil className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400/70">Step 2</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
          Optimize Your Hook
        </h2>
        <p className="text-white/35 text-[15px] font-medium leading-relaxed max-w-lg">
          Generate attention-grabbing opening lines that stop the scroll in the first 3 seconds.
        </p>
      </div>

      {/* ── Selected Idea Card ── */}
      <div className="mb-6 p-5 rounded-xl bg-indigo-500/[0.04] border border-indigo-500/15 flex items-start gap-4">
        <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <Lightbulb className="w-4 h-4 text-indigo-400" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-indigo-400/50 mb-1">Selected Idea</p>
          <p className="text-white/80 font-semibold text-[15px] leading-snug">{selectedIdea}</p>
        </div>
      </div>

      {/* ── Tone Selector ── */}
      <div className="mb-6">
        <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-white/30 mb-3 block">
          Select Hook Tone
        </p>
        <div className="flex gap-3">
          {TONES.map((t) => {
            const Icon = t.icon;
            const isSelected = tone === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setTone(t.value)}
                disabled={isGenerating}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all duration-200",
                  isSelected
                    ? `${t.bg} border-${t.color.split("-")[1]}-500/30 shadow-sm`
                    : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]"
                )}
              >
                <Icon className={cn("w-4 h-4", isSelected ? t.color : "text-white/40")} />
                <span className={cn("text-[13px] font-bold tracking-wide", isSelected ? "text-white/90" : "text-white/50")}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Error Banner ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="mb-6 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[13px] text-rose-300 font-medium">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-rose-400/50 hover:text-rose-400 transition-colors text-xs font-bold"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Generate Button ── */}
      <motion.button
        onClick={handleGenerate}
        disabled={isGenerating}
        whileHover={!isGenerating ? { scale: 1.01 } : {}}
        whileTap={!isGenerating ? { scale: 0.99 } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "w-full py-4 rounded-xl font-bold text-[13px] tracking-wide flex items-center justify-center gap-2.5 transition-all mb-8 shadow-lg",
          isGenerating 
            ? "bg-white/[0.05] border border-white/[0.1] text-white/40 cursor-not-allowed"
            : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/15 hover:shadow-amber-500/25"
        )}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Generating...
          </>
        ) : (
          <>
            <Pencil className="w-3.5 h-3.5" />
            {hooks.length > 0 ? "Regenerate Hooks" : "Generate Hooks"}
          </>
        )}
      </motion.button>

      {/* ── Loading Skeleton ── */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-white/[0.04] bg-white/[0.015] animate-pulse"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/[0.06]" />
                  <div className="flex-1 space-y-3 pt-1">
                    <div className="h-4 bg-white/[0.06] rounded-md w-full" />
                    <div className="h-4 bg-white/[0.04] rounded-md w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hook Cards Grid ── */}
      <div className="flex-1 overflow-y-auto hide-scrollbar -mx-1 px-1 pb-2">
        {!isGenerating && (
          <AnimatePresence mode="wait">
            <motion.div
              key={generationCount}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 gap-4"
            >
              {hooks.map((hook, idx) => {
                const isSelected = selectedIndex === idx;

                return (
                  <motion.div
                    key={`${hook.text}-${idx}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: idx * 0.06,
                      type: "spring",
                      stiffness: 300,
                      damping: 24,
                    }}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => setSelectedIndex(idx)}
                    className={cn(
                      "relative p-5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col group",
                      isSelected
                        ? "bg-amber-500/[0.06] border-amber-500/30 shadow-[0_0_24px_rgba(245,158,11,0.08)]"
                        : "bg-white/[0.015] border-white/[0.05] hover:bg-white/[0.03] hover:border-white/[0.08]"
                    )}
                  >
                    <div className="flex items-start gap-4 w-full">
                      {/* Quote mark */}
                      <span className={cn(
                        "text-4xl font-serif leading-none mt-[-4px] shrink-0 transition-colors duration-200",
                        isSelected ? "text-amber-400/60" : "text-white/10 group-hover:text-white/20"
                      )}>"</span>

                      {/* Hook text & Meta */}
                      <div className="flex-1">
                        <p className={cn(
                          "text-[16px] font-semibold tracking-tight leading-relaxed transition-colors duration-200 mb-3",
                          isSelected ? "text-white" : "text-white/60 group-hover:text-white/80"
                        )}>
                          {hook.text}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded border border-white/10 bg-white/5 text-[10px] uppercase tracking-widest text-white/40 font-bold">
                            {hook.style}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">CTR Potential</span>
                            <div className="w-16 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${hook.score}%` }}
                                transition={{ delay: idx * 0.06 + 0.2, duration: 0.6, ease: "easeOut" }}
                                className={cn("h-full rounded-full", getScoreBarColor(hook.score))}
                              />
                            </div>
                            <span className={cn("text-[11px] font-bold tabular-nums", getScoreColor(hook.score))}>
                              {hook.score}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Radio */}
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200",
                        isSelected
                          ? "border-amber-500 bg-amber-500"
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
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* ── Edit Hook Textarea ── */}
      <AnimatePresence>
        {selectedIndex !== null && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="pt-6 mt-4 border-t border-white/[0.04]">
              <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/25 mb-3 block">
                Edit Hook
              </label>
              <textarea
                value={editedHook}
                onChange={(e) => setEditedHook(e.target.value)}
                rows={3}
                className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-5 py-4 text-white text-[15px] placeholder:text-white/15 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/30 transition-all duration-200 font-medium resize-none hide-scrollbar"
                placeholder="Refine your hook here..."
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Action Footer ── */}
      <AnimatePresence>
        {hooks.length > 0 && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 30 }}
            className="pt-6 mt-4 border-t border-white/[0.04] flex justify-between items-center"
          >
            <p className="text-[12px] text-white/20 font-medium">
              {selectedIndex !== null
                ? "You can edit the hook before approving"
                : "Select a hook to continue"}
            </p>

            <motion.button
              onClick={handleApprove}
              disabled={!hasApproval || isApproving || selectedIndex === null}
              whileHover={hasApproval && !isApproving && selectedIndex !== null ? { scale: 1.02 } : {}}
              whileTap={hasApproval && !isApproving && selectedIndex !== null ? { scale: 0.98 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={cn(
                "px-6 py-3 rounded-xl font-bold text-[13px] tracking-wide flex items-center gap-2 transition-all duration-200",
                hasApproval && !isApproving && selectedIndex !== null
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/15 hover:shadow-amber-500/25"
                  : "bg-white/[0.03] text-white/15 cursor-not-allowed border border-white/[0.04]"
              )}
            >
              {isApproving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> saving...
                </>
              ) : (
                <>
                  Approve & Continue
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
