"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb, RefreshCcw, Check, ChevronRight, Loader2, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const HookStepPanel = ({
  selectedIdea,
  stepData,
  onApprove,
}: {
  selectedIdea: string;
  stepData?: any;
  onApprove: (hook?: string) => Promise<void>;
}) => {
  const [hooks, setHooks] = useState<string[]>(stepData?.aiOutput || []);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [editedHook, setEditedHook] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [generationCount, setGenerationCount] = useState(0);

  // Initialize from saved DB state
  useEffect(() => {
    if (stepData?.editedHook && hooks.length === 0) {
      setHooks([stepData.editedHook]);
      setSelectedIndex(0);
      setEditedHook(stepData.editedHook);
    } else if (stepData?.selectedHook && hooks.length === 0) {
      setHooks([stepData.selectedHook]);
      setSelectedIndex(0);
      setEditedHook(stepData.selectedHook);
    }
  }, [stepData, hooks.length]);

  // Sync textarea whenever user selects a different hook card
  useEffect(() => {
    if (selectedIndex !== null && hooks[selectedIndex]) {
      setEditedHook(hooks[selectedIndex]);
    }
  }, [selectedIndex, hooks]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setSelectedIndex(null);
    setEditedHook("");

    // TODO: Connect LIVE AI API endpoint here when backend is wired.

    setIsGenerating(false);
  };

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
      <div className="mb-8 p-5 rounded-xl bg-indigo-500/[0.04] border border-indigo-500/15 flex items-start gap-4">
        <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <Lightbulb className="w-4 h-4 text-indigo-400" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-indigo-400/50 mb-1">Selected Idea</p>
          <p className="text-white/80 font-semibold text-[15px] leading-snug">{selectedIdea}</p>
        </div>
      </div>

      {/* ── Generate Button ── */}
      {hooks.length === 0 && (
        <motion.button
          onClick={handleGenerate}
          disabled={isGenerating}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={cn(
            "w-full py-4 rounded-xl font-bold text-[13px] tracking-wide flex items-center justify-center gap-2.5 transition-all mb-8",
            "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/15",
            isGenerating && "opacity-60 cursor-not-allowed saturate-50"
          )}
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Pencil className="w-3.5 h-3.5" />
              Generate Hooks
            </>
          )}
        </motion.button>
      )}

      {/* ── Hook Cards Grid ── */}
      <div className="flex-1 overflow-y-auto hide-scrollbar -mx-1 px-1 pb-2">
        <AnimatePresence mode="wait">
          {hooks.length > 0 && (
            <motion.div
              key={generationCount}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {hooks.map((hook, idx) => {
                const isSelected = selectedIndex === idx;

                return (
                  <motion.div
                    key={hook}
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
                        ? "bg-amber-500/[0.06] border-amber-500/30 shadow-[0_0_24px_rgba(245,158,11,0.08)]"
                        : "bg-white/[0.015] border-white/[0.05] hover:bg-white/[0.03] hover:border-white/[0.08]"
                    )}
                  >
                    {/* Quote mark */}
                    <span className={cn(
                      "text-3xl font-serif leading-none mt-[-2px] shrink-0 transition-colors duration-200",
                      isSelected ? "text-amber-400/60" : "text-white/10 group-hover:text-white/20"
                    )}>"</span>

                    {/* Hook text */}
                    <p className={cn(
                      "text-[15px] font-semibold tracking-tight leading-relaxed transition-colors duration-200 flex-1",
                      isSelected ? "text-white" : "text-white/55 group-hover:text-white/75"
                    )}>
                      {hook}
                    </p>

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
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Edit Hook Textarea ── */}
      <AnimatePresence>
        {selectedIndex !== null && (
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
        {hooks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 30 }}
            className="pt-6 mt-4 border-t border-white/[0.04] flex justify-end items-center"
          >
            <motion.button
              onClick={async () => {
                if (hasApproval && !isApproving) {
                  setIsApproving(true);
                  await onApprove(editedHook);
                  setIsApproving(false);
                }
              }}
              disabled={!hasApproval || isApproving}
              whileHover={hasApproval && !isApproving ? { scale: 1.02 } : {}}
              whileTap={hasApproval && !isApproving ? { scale: 0.98 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={cn(
                "px-6 py-3 rounded-xl font-bold text-[13px] tracking-wide flex items-center gap-2 transition-all duration-200",
                hasApproval && !isApproving
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
