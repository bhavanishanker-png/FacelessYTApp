"use client";
import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Check, ChevronRight, Loader2,
  TrendingUp, Flame, Zap, Target, Brain, AlertTriangle,
  BookOpen, Lightbulb, Eye, MessageSquare, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────

interface ViralIdea {
  title: string;
  category: string;
  viralityScore: number;
  reason: string;
}

// ─── Category → Icon + Color mapping ─────────────────────────

const CATEGORY_META: Record<string, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  "Listicle":       { icon: BookOpen,       color: "text-sky-400",    bg: "bg-sky-500/15",    border: "border-sky-500/25" },
  "Story":          { icon: MessageSquare,  color: "text-amber-400",  bg: "bg-amber-500/15",  border: "border-amber-500/25" },
  "Myth-Busting":   { icon: Zap,            color: "text-rose-400",   bg: "bg-rose-500/15",   border: "border-rose-500/25" },
  "Comparison":     { icon: Eye,            color: "text-violet-400", bg: "bg-violet-500/15", border: "border-violet-500/25" },
  "How-To":         { icon: Target,         color: "text-emerald-400",bg: "bg-emerald-500/15",border: "border-emerald-500/25" },
  "Shocking Facts": { icon: Flame,          color: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/25" },
  "Emotional":      { icon: Star,           color: "text-pink-400",   bg: "bg-pink-500/15",   border: "border-pink-500/25" },
  "Contrarian":     { icon: AlertTriangle,  color: "text-red-400",    bg: "bg-red-500/15",    border: "border-red-500/25" },
  "Tutorial":       { icon: Lightbulb,      color: "text-cyan-400",   bg: "bg-cyan-500/15",   border: "border-cyan-500/25" },
  "Trend":          { icon: TrendingUp,     color: "text-indigo-400", bg: "bg-indigo-500/15", border: "border-indigo-500/25" },
};

const DEFAULT_META = { icon: Brain, color: "text-white/40", bg: "bg-white/5", border: "border-white/10" };

function getCategoryMeta(category: string) {
  return CATEGORY_META[category] || DEFAULT_META;
}

// ─── Virality score color ─────────────────────────────────────

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

export const IdeaStepPanel = ({
  stepData,
  projectType,
  onApprove,
  onAutoSave,
}: {
  stepData?: any;
  projectType?: "shorts" | "long";
  onApprove: (idea: string, niche: string) => Promise<void>;
  onAutoSave?: (data: any) => void;
}) => {
  const [niche, setNiche] = useState(stepData?.niche || "");
  const [ideas, setIdeas] = useState<ViralIdea[]>(() => {
    // Rehydrate from DB if ideas were previously generated
    if (stepData?.aiOutput) {
      if (typeof stepData.aiOutput === "string") {
        try {
          const parsed = JSON.parse(stepData.aiOutput);
          if (parsed.ideas) return parsed.ideas;
        } catch { /* ignore */ }
      } else if (typeof stepData.aiOutput === "object" && stepData.aiOutput.ideas) {
        return stepData.aiOutput.ideas;
      }
    }
    return [];
  });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(() => {
    // Rehydrate selection
    if (stepData?.userSelected && ideas.length > 0) {
      const idx = ideas.findIndex((i: ViralIdea) => i.title === stepData.userSelected);
      return idx >= 0 ? idx : null;
    }
    return null;
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [generationCount, setGenerationCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // ── Generate ideas via real API ─────────────────────────────
  const handleGenerate = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!niche.trim() || isGenerating) return;

    setIsGenerating(true);
    setSelectedIndex(null);
    setError(null);

    try {
      const res = await fetch("/api/ai/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche: niche.trim(),
          platform: projectType || "long",
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        // Handle rate limiting with friendly message
        if (res.status === 429) {
          const waitSec = result.retryAfterMs
            ? Math.ceil(result.retryAfterMs / 1000)
            : 60;
          setError(`Rate limited — please try again in ${waitSec}s`);
        } else {
          setError(result.error || "Failed to generate ideas. Please try again.");
        }
        return;
      }

      setIdeas(result.data.ideas);
      setGenerationCount((c) => c + 1);
      
      if (onAutoSave) {
        onAutoSave({ aiOutput: result.data });
      }
    } catch (err) {
      setError("Network error — check your connection and try again.");
      console.error("[IdeaStepPanel] Generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [niche, isGenerating, projectType, onAutoSave]);

  // ── Approve selected idea ───────────────────────────────────
  const handleApprove = useCallback(async () => {
    if (selectedIndex === null || isApproving) return;
    setIsApproving(true);
    try {
      await onApprove(ideas[selectedIndex].title, niche);
    } finally {
      setIsApproving(false);
    }
  }, [selectedIndex, isApproving, ideas, niche, onApprove]);

  return (
    <div className="flex flex-col h-full relative z-10 w-full">

      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-400/70">Step 1</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
          Generate Video Ideas
        </h2>
        <p className="text-white/35 text-[15px] font-medium leading-relaxed max-w-lg">
          Enter a niche and let AI generate 10 viral content ideas ranked by virality score.
        </p>
      </div>

      {/* ── Input Section ── */}
      <form onSubmit={handleGenerate} className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="e.g. motivation, finance, fitness, AI tools"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          disabled={isGenerating}
          className="flex-1 bg-white/[0.03] border border-white/8 rounded-xl px-5 py-3.5 text-white text-[15px] placeholder:text-white/15 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/30 transition-all duration-200 font-medium disabled:opacity-40"
        />
        <motion.button
          type="submit"
          disabled={!niche.trim() || isGenerating}
          whileHover={!isGenerating && niche.trim() ? { scale: 1.02 } : {}}
          whileTap={!isGenerating && niche.trim() ? { scale: 0.98 } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={cn(
            "px-6 py-3.5 rounded-xl font-bold text-[13px] tracking-wide flex items-center gap-2 transition-all shrink-0",
            "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/20",
            (!niche.trim() || isGenerating) && "opacity-40 cursor-not-allowed saturate-50"
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              {ideas.length > 0 ? "Regenerate" : "Generate"}
            </>
          )}
        </motion.button>
      </form>

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

      {/* ── Loading Skeleton ── */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-white/[0.04] bg-white/[0.015] animate-pulse"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.06]" />
                  <div className="flex-1 space-y-3 pt-1">
                    <div className="h-4 bg-white/[0.06] rounded-md w-3/4" />
                    <div className="h-3 bg-white/[0.04] rounded-md w-1/2" />
                    <div className="h-3 bg-white/[0.03] rounded-md w-full" />
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Ideas Grid ── */}
      <div className="flex-1 overflow-y-auto hide-scrollbar -mx-1 px-1 pb-2">
        {ideas.length === 0 && !isGenerating ? (
          <div className="flex flex-col items-center justify-center h-full text-white/30 space-y-4">
            <Brain className="w-12 h-12 opacity-20" />
            <p className="text-sm font-medium tracking-wide">Type a niche above and hit Generate to get 10 AI-powered video ideas.</p>
          </div>
        ) : !isGenerating ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={generationCount}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {ideas.map((idea, idx) => {
                const isSelected = selectedIndex === idx;
                const meta = getCategoryMeta(idea.category);
                const Icon = meta.icon;

                return (
                  <motion.div
                    key={`${idea.title}-${idx}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: idx * 0.04,
                      type: "spring",
                      stiffness: 300,
                      damping: 24,
                    }}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => setSelectedIndex(idx)}
                    className={cn(
                      "relative p-5 rounded-2xl border cursor-pointer transition-all duration-200 group",
                      isSelected
                        ? "bg-indigo-500/[0.06] border-indigo-500/30 shadow-[0_0_24px_rgba(99,102,241,0.08)]"
                        : "bg-white/[0.015] border-white/[0.05] hover:bg-white/[0.03] hover:border-white/[0.08]"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-all duration-200",
                        isSelected
                          ? `${meta.bg} ${meta.border} ${meta.color}`
                          : "bg-white/[0.03] border-white/[0.06] text-white/25 group-hover:text-white/40 group-hover:border-white/10"
                      )}>
                        <Icon className="w-[18px] h-[18px]" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <h3 className={cn(
                          "text-[15px] font-semibold tracking-tight leading-snug transition-colors duration-200 mb-2",
                          isSelected ? "text-white" : "text-white/60 group-hover:text-white/80"
                        )}>
                          {idea.title}
                        </h3>

                        {/* Category + Virality Row */}
                        <div className="flex items-center gap-3 mb-2.5">
                          <span className={cn(
                            "inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-[0.12em] border",
                            isSelected
                              ? `${meta.bg} ${meta.color} ${meta.border}`
                              : "bg-white/5 text-white/40 border-white/10"
                          )}>
                            {idea.category}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <div className="w-16 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${idea.viralityScore}%` }}
                                transition={{ delay: idx * 0.04 + 0.2, duration: 0.6, ease: "easeOut" }}
                                className={cn("h-full rounded-full", getScoreBarColor(idea.viralityScore))}
                              />
                            </div>
                            <span className={cn("text-[11px] font-bold tabular-nums", getScoreColor(idea.viralityScore))}>
                              {idea.viralityScore}
                            </span>
                          </div>
                        </div>

                        {/* Reason */}
                        <p className={cn(
                          "text-[12px] leading-relaxed transition-colors duration-200",
                          isSelected ? "text-white/45" : "text-white/20 group-hover:text-white/30"
                        )}>
                          {idea.reason}
                        </p>
                      </div>

                      {/* Radio indicator */}
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200",
                        isSelected
                          ? "border-indigo-500 bg-indigo-500"
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
        ) : null}
      </div>

      {/* ── Action Footer ── */}
      <AnimatePresence>
        {ideas.length > 0 && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 30 }}
            className="pt-6 mt-4 border-t border-white/[0.04] flex justify-between items-center"
          >
            {/* Selection hint */}
            <p className="text-[12px] text-white/20 font-medium">
              {selectedIndex !== null
                ? `Selected: "${ideas[selectedIndex].title}"`
                : "Click an idea card to select it"}
            </p>

            <motion.button
              onClick={handleApprove}
              disabled={selectedIndex === null || isApproving}
              whileHover={selectedIndex !== null && !isApproving ? { scale: 1.02 } : {}}
              whileTap={selectedIndex !== null && !isApproving ? { scale: 0.98 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={cn(
                "px-6 py-3 rounded-xl font-bold text-[13px] tracking-wide flex items-center gap-2 transition-all duration-200",
                selectedIndex !== null && !isApproving
                  ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
                  : "bg-white/[0.03] text-white/15 cursor-not-allowed border border-white/[0.04]"
              )}
            >
              {isApproving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
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
