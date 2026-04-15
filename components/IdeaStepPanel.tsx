"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, RefreshCcw, Check, ChevronRight, Loader2,
  TrendingUp, Flame, Zap, Target, Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const IdeaStepPanel = ({
  stepData,
  onApprove 
}: { 
  stepData?: any;
  onApprove: (idea: string, niche: string) => Promise<void> 
}) => {
  const [niche, setNiche] = useState(stepData?.niche || "");
  // Strictly map purely from DB payload string array into our standardized layout dictionary
  const [ideas, setIdeas] = useState<{title: string, tag: string, icon: any}[]>(
    stepData?.generatedIdeas?.map((str: string) => ({ title: str, tag: "generated", icon: Brain })) || []
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [generationCount, setGenerationCount] = useState(0);

  // Hydrate exact selection if it was locked previously
  React.useEffect(() => {
    if (stepData?.niche && !niche) setNiche(stepData.niche);
    if (stepData?.userSelected && ideas.length === 0) {
      setIdeas([{ title: stepData.userSelected, tag: "saved", icon: Sparkles }]);
      setSelectedIndex(0);
    }
  }, [stepData, ideas.length, niche]);

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!niche.trim() || isGenerating) return;

    setIsGenerating(true);
    setSelectedIndex(null);

    // Simulated delay for UX — replace with real AI API call
    await new Promise((r) => setTimeout(r, 1500));

    // Mock ideas based on the niche input
    const nicheTitle = niche.trim().charAt(0).toUpperCase() + niche.trim().slice(1);
    const mockIdeas = [
      { title: `Why Most People Fail at ${nicheTitle} (And How to Fix It)`, tag: "trending", icon: TrendingUp },
      { title: `${nicheTitle} Secrets the Top 1% Don't Want You to Know`, tag: "viral", icon: Flame },
      { title: `I Tried ${nicheTitle} for 30 Days — Here's What Happened`, tag: "challenge", icon: Zap },
      { title: `The Ultimate Beginner's Guide to ${nicheTitle} in 2025`, tag: "evergreen", icon: Target },
    ];

    setIdeas(mockIdeas);
    setGenerationCount((c) => c + 1);
    setIsGenerating(false);
  };

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
          Enter a niche and let AI suggest viral content ideas for your channel.
        </p>
      </div>

      {/* ── Input Section ── */}
      <form onSubmit={handleGenerate} className="flex gap-3 mb-10">
        <input
          type="text"
          placeholder="e.g. motivation, finance, fitness"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          disabled={isGenerating}
          className="flex-1 bg-white/[0.03] border border-white/8 rounded-xl px-5 py-3.5 text-white text-[15px] placeholder:text-white/15 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/30 transition-all duration-200 font-medium disabled:opacity-40"
        />
        <motion.button
          type="submit"
          disabled={!niche.trim() || isGenerating}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={cn(
            "px-6 py-3.5 rounded-xl font-bold text-[13px] tracking-wide flex items-center gap-2 transition-all shrink-0",
            "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/20",
            (!niche.trim() || isGenerating) && "opacity-40 cursor-not-allowed saturate-50"
          )}
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Generate
            </>
          )}
        </motion.button>
      </form>

      {/* ── Ideas Grid ── */}
      <div className="flex-1 overflow-y-auto hide-scrollbar -mx-1 px-1 pb-2">
        {ideas.length === 0 && !isGenerating ? (
          <div className="flex flex-col items-center justify-center h-full text-white/30 space-y-4">
            <Brain className="w-12 h-12 opacity-20" />
            <p className="text-sm font-medium tracking-wide">Ready for backend AI integration. Type a niche above to run generation tests.</p>
          </div>
        ) : (
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
                const Icon = idea.icon;

                return (
                  <motion.div
                    key={idea.title}
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
                      "relative p-5 rounded-2xl border cursor-pointer transition-all duration-200 flex items-start gap-4 group",
                      isSelected
                        ? "bg-indigo-500/[0.06] border-indigo-500/30 shadow-[0_0_24px_rgba(99,102,241,0.08)]"
                        : "bg-white/[0.015] border-white/[0.05] hover:bg-white/[0.03] hover:border-white/[0.08]"
                    )}
                  >
                    {/* Icon */}
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-all duration-200",
                      isSelected
                        ? "bg-indigo-500/15 border-indigo-500/25 text-indigo-400"
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
                      <span className={cn(
                        "inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-[0.12em] border",
                        idea.tag === "saved" || idea.tag === "generated" 
                          ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" 
                          : "bg-white/5 text-white/40 border-white/10"
                      )}>
                        {idea.tag}
                      </span>
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
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* ── Action Footer ── */}
      <AnimatePresence>
        {ideas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 30 }}
            className="pt-6 mt-4 border-t border-white/[0.04] flex justify-end items-center"
          >
            <motion.button
              onClick={async () => {
                if (selectedIndex !== null && !isApproving) {
                  setIsApproving(true);
                  await onApprove(ideas[selectedIndex].title, niche);
                  setIsApproving(false);
                }
              }}
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
