"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Lightbulb,
  Pencil,
  RefreshCcw,
  ChevronRight,
  Loader2,
  Scissors,
  Expand,
  RotateCcw,
  Sparkles,
  Type,
  AlignLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────────── Mock Data ─────────────────────── */

const MOCK_SCRIPT = `Most people think they are working hard...

But in reality, they are just busy.

Every day, you wake up,
scroll your phone,
delay your goals...

And slowly,
you are wasting your life.

If you want to change this,
you need discipline...

Not motivation.`;

const REWRITTEN_SCRIPT = `Everyone believes they're grinding hard…

But the truth? They're just filling time.

Wake up. Scroll. Procrastinate.
Repeat.

Day after day,
your dreams slip further away.

Here's the uncomfortable truth —
motivation fades.

What you really need…
is raw, brutal discipline.

That's the only way out.`;

const SHORTENED_SCRIPT = `Most people think they work hard.
In reality, they're just busy.

You wake up, scroll, delay your goals.
You're wasting your life.

The fix isn't motivation.
It's discipline.`;

const EXPANDED_SCRIPT = `Most people think they are working hard...

But in reality, they are just busy.
Busy doing things that don't matter.
Busy avoiding the hard work that actually counts.

Every day, you wake up,
scroll your phone for 30 minutes,
delay your goals for "tomorrow"...

And slowly,
without even realizing it,
you are wasting your life.

The scary part?
You won't notice until it's too late.

If you want to change this,
you need discipline...
You need a system.
You need to show up even when you don't feel like it.

Not motivation.
Motivation is temporary.
Discipline is what builds empires.

Start today. Not tomorrow.
Today.`;

/* ─────────────────────── Component ─────────────────────── */

export const ScriptStepPanel = ({
  selectedIdea,
  selectedHook,
  initialScript,
  onApprove,
}: {
  selectedIdea: string;
  selectedHook: string;
  initialScript?: string;
  onApprove: (script?: string) => Promise<void>;
}) => {
  const [script, setScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTransforming, setIsTransforming] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [lineCount, setLineCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialScript && !script && !hasGenerated) {
      setScript(initialScript);
      setHasGenerated(true);
    }
  }, [initialScript, script, hasGenerated]);

  /* ── Word / line count ── */
  useEffect(() => {
    const words = script.trim() ? script.trim().split(/\s+/).length : 0;
    const lines = script ? script.split("\n").length : 0;
    setWordCount(words);
    setLineCount(lines);
  }, [script]);

  /* ── Auto-resize textarea ── */
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 320)}px`;
  }, []);

  useEffect(() => {
    autoResize();
  }, [script, autoResize]);

  /* ── Generate script ── */
  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setScript(MOCK_SCRIPT);
      setHasGenerated(true);
      setIsGenerating(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }, 1600);
  };

  /* ── Tool transforms ── */
  const handleRewrite = () => {
    setIsTransforming("rewrite");
    setTimeout(() => {
      setScript(REWRITTEN_SCRIPT);
      setIsTransforming(null);
    }, 1200);
  };

  const handleShorten = () => {
    setIsTransforming("shorten");
    setTimeout(() => {
      setScript(SHORTENED_SCRIPT);
      setIsTransforming(null);
    }, 1000);
  };

  const handleExpand = () => {
    setIsTransforming("expand");
    setTimeout(() => {
      setScript(EXPANDED_SCRIPT);
      setIsTransforming(null);
    }, 1400);
  };

  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const variants = [MOCK_SCRIPT, REWRITTEN_SCRIPT, EXPANDED_SCRIPT];
      const random = variants[Math.floor(Math.random() * variants.length)];
      setScript(random);
      setIsGenerating(false);
    }, 1400);
  };

  const isToolActive = isTransforming !== null || isGenerating;

  return (
    <div className="flex flex-col h-full relative z-10 w-full">

      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <FileText className="w-4 h-4 text-violet-400" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-400/70">Step 3</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
          Script Editor
        </h2>
        <p className="text-white/35 text-[15px] font-medium leading-relaxed max-w-lg">
          Generate and refine your video script. Edit freely, use AI tools, and craft the perfect narrative.
        </p>
      </div>

      {/* ── Context Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Selected Idea */}
        <div className="p-4 rounded-xl bg-indigo-500/[0.04] border border-indigo-500/15 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Lightbulb className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-400/50 mb-1">Selected Idea</p>
            <p className="text-white/75 font-semibold text-[14px] leading-snug truncate">{selectedIdea}</p>
          </div>
        </div>
        {/* Selected Hook */}
        <div className="p-4 rounded-xl bg-amber-500/[0.04] border border-amber-500/15 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Pencil className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-400/50 mb-1">Selected Hook</p>
            <p className="text-white/75 font-semibold text-[14px] leading-snug truncate">{selectedHook}</p>
          </div>
        </div>
      </div>

      {/* ── Generate Button (shown before first generation) ── */}
      {!hasGenerated && (
        <motion.button
          onClick={handleGenerate}
          disabled={isGenerating}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={cn(
            "w-full py-4 rounded-xl font-bold text-[13px] tracking-wide flex items-center justify-center gap-2.5 transition-all mb-8",
            "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/15",
            isGenerating && "opacity-60 cursor-not-allowed saturate-50"
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Script...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Generate Script
            </>
          )}
        </motion.button>
      )}

      {/* ── Empty State ── */}
      {!hasGenerated && !isGenerating && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/[0.04] min-h-[240px]">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.02] flex items-center justify-center border border-white/[0.04]">
            <FileText className="w-6 h-6 text-white/10" />
          </div>
          <p className="text-white/15 font-medium text-sm text-center max-w-xs">
            Click &quot;Generate Script&quot; to create your video script based on the selected idea and hook.
          </p>
        </div>
      )}

      {/* ── Script Editor Area ── */}
      <AnimatePresence>
        {hasGenerated && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* ── Tool Bar ── */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {/* Rewrite */}
              <motion.button
                onClick={handleRewrite}
                disabled={isToolActive}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg border text-[12px] font-semibold tracking-wide transition-all duration-200",
                  isTransforming === "rewrite"
                    ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                    : "bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.04] hover:border-white/[0.1]",
                  isToolActive && isTransforming !== "rewrite" && "opacity-30 cursor-not-allowed"
                )}
              >
                {isTransforming === "rewrite" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RotateCcw className="w-3 h-3" />
                )}
                Rewrite
              </motion.button>

              {/* Shorten */}
              <motion.button
                onClick={handleShorten}
                disabled={isToolActive}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg border text-[12px] font-semibold tracking-wide transition-all duration-200",
                  isTransforming === "shorten"
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    : "bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.04] hover:border-white/[0.1]",
                  isToolActive && isTransforming !== "shorten" && "opacity-30 cursor-not-allowed"
                )}
              >
                {isTransforming === "shorten" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Scissors className="w-3 h-3" />
                )}
                Shorten
              </motion.button>

              {/* Expand */}
              <motion.button
                onClick={handleExpand}
                disabled={isToolActive}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg border text-[12px] font-semibold tracking-wide transition-all duration-200",
                  isTransforming === "expand"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.04] hover:border-white/[0.1]",
                  isToolActive && isTransforming !== "expand" && "opacity-30 cursor-not-allowed"
                )}
              >
                {isTransforming === "expand" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Expand className="w-3 h-3" />
                )}
                Expand
              </motion.button>

              {/* Spacer + stats */}
              <div className="flex-1" />
              <div className="flex items-center gap-4 text-[11px] font-mono text-white/20">
                <span className="flex items-center gap-1.5">
                  <Type className="w-3 h-3" />
                  {wordCount} words
                </span>
                <span className="flex items-center gap-1.5">
                  <AlignLeft className="w-3 h-3" />
                  {lineCount} lines
                </span>
              </div>
            </div>

            {/* ── Editor Container ── */}
            <div className="relative flex-1 mb-4 group">
              {/* Glow border on focus */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-violet-500/20 via-transparent to-purple-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="relative rounded-2xl bg-[#080808] border border-white/[0.06] group-focus-within:border-violet-500/20 transition-all duration-300 overflow-hidden">
                {/* Editor top bar */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.04] bg-white/[0.01]">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                  </div>
                  <span className="text-[10px] font-mono text-white/15 tracking-wider uppercase">script.txt</span>
                </div>

                {/* Textarea */}
                <div className="relative">
                  {/* Transform overlay */}
                  <AnimatePresence>
                    {isTransforming && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-[#080808]/80 backdrop-blur-sm z-10 flex items-center justify-center"
                      >
                        <div className="flex items-center gap-3 text-white/50 text-sm font-medium">
                          <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                          {isTransforming === "rewrite" && "Rewriting script..."}
                          {isTransforming === "shorten" && "Shortening script..."}
                          {isTransforming === "expand" && "Expanding script..."}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <textarea
                    ref={textareaRef}
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    disabled={isToolActive}
                    spellCheck={false}
                    className={cn(
                      "w-full bg-transparent px-6 py-6 text-white/85 text-[15px] leading-[2] font-[420]",
                      "placeholder:text-white/10 resize-none focus:outline-none",
                      "hide-scrollbar min-h-[320px]",
                      "transition-opacity duration-200",
                      "selection:bg-violet-500/30",
                      isToolActive && "opacity-30"
                    )}
                    style={{ fontFamily: "'Inter', 'SF Pro Text', system-ui, sans-serif" }}
                    placeholder="Your script will appear here..."
                  />
                </div>
              </div>
            </div>

            {/* ── Action Footer ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 30 }}
              className="pt-5 mt-2 border-t border-white/[0.04] flex justify-between items-center"
            >
              <button
                onClick={handleRegenerate}
                disabled={isToolActive}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.03] transition-all duration-200 font-semibold text-[13px] disabled:opacity-30"
              >
                <RefreshCcw className={cn("w-3.5 h-3.5", isGenerating && "animate-spin")} />
                Regenerate
              </button>

              <motion.button
                onClick={async () => {
                  if (script.trim() && !isToolActive && !isApproving) {
                    setIsApproving(true);
                    await onApprove(script);
                    setIsApproving(false);
                  }
                }}
                disabled={!script.trim() || isToolActive || isApproving}
                whileHover={script.trim() && !isToolActive && !isApproving ? { scale: 1.02 } : {}}
                whileTap={script.trim() && !isToolActive && !isApproving ? { scale: 0.98 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={cn(
                  "px-6 py-3 rounded-xl font-bold text-[13px] tracking-wide flex items-center gap-2 transition-all duration-200",
                  script.trim() && !isToolActive && !isApproving
                    ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/15 hover:shadow-violet-500/25"
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
