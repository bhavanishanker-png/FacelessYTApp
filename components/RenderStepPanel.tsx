"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Loader2, CheckCircle, XCircle, ChevronLeft, Cloud } from "lucide-react";

interface Props {
  projectTitle: string;
  onComplete: (videoUrl?: string) => void;
}

type RenderState = "selecting" | "rendering" | "complete";

const QUALITY_OPTIONS = [
  { id: "720p", label: "720p", size: "~50MB", icon: "⚡", desc: "Fast export" },
  {
    id: "1080p", label: "1080p", size: "~150MB", icon: "★",
    desc: "Recommended", recommended: true
  },
  { id: "4k", label: "Cinematic 4K", size: "~1.2 GB", icon: "🎬", desc: "Lossless HDR", pro: true },
];

const RENDER_STEPS = [
  { label: "Metadata & Upscaling", status: "done" },
  { label: "Color Grading", status: "active" },
  { label: "Adding Audio", status: "pending" },
  { label: "Final Encoding", status: "pending" },
];

export const RenderStepPanel = ({ projectTitle, onComplete }: Props) => {
  const [renderState, setRenderState] = useState<RenderState>("selecting");
  const [selectedQuality, setSelectedQuality] = useState("1080p");
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (renderState !== "rendering") return;
    const prog = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(prog);
          setTimeout(() => setRenderState("complete"), 600);
          return 100;
        }
        return p + 0.8;
      });
    }, 120);
    const time = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { clearInterval(prog); clearInterval(time); };
  }, [renderState]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Step label */}
      <div>
        <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
          Step 11 — Finalization
        </span>
        <h2 className="text-2xl font-black tracking-tight text-white mt-2">Exporting Masterpiece</h2>
        <p className="text-sm text-white/40 mt-1">
          Your cinematic sequence is being stitched together. Select your preferred output profile.
        </p>
      </div>

      <AnimatePresence mode="wait">

        {/* STATE: SELECTING */}
        {renderState === "selecting" && (
          <motion.div
            key="selecting"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col gap-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {QUALITY_OPTIONS.map((q) => (
                <motion.button
                  key={q.id}
                  onClick={() => setSelectedQuality(q.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative p-5 rounded-2xl border text-left transition-all ${
                    selectedQuality === q.id
                      ? "border-indigo-500/50 bg-indigo-500/[0.08]"
                      : "border-white/[0.06] bg-[#111] hover:border-white/15"
                  }`}
                >
                  {q.recommended && (
                    <span className="absolute top-3 right-3 text-[8px] px-2 py-0.5 rounded-full bg-indigo-500 text-white font-bold uppercase">
                      Recommended
                    </span>
                  )}
                  {q.pro && (
                    <span className="absolute top-3 right-3 text-[8px] px-2 py-0.5 rounded-full bg-amber-500 text-black font-bold uppercase">
                      Pro
                    </span>
                  )}
                  <span className="text-2xl mb-3 block">{q.icon}</span>
                  <h3 className="text-lg font-black text-white">{q.label}</h3>
                  <p className="text-xs text-white/40 mt-1">{q.desc}</p>
                  <p className="text-[10px] text-white/25 mt-3 font-mono">{q.size} Est.</p>
                  {selectedQuality === q.id && (
                    <div className="absolute bottom-3 right-3 w-5 h-5 rounded-full border-2 border-indigo-500 bg-indigo-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Asset info */}
            <div className="p-5 rounded-2xl bg-[#0d0d0d] border border-white/[0.06]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {[
                  { label: "Resolution", value: selectedQuality === "4k" ? "3840 × 2160" : selectedQuality === "1080p" ? "1920 × 1080" : "1280 × 720" },
                  { label: "Frame Rate", value: "24 fps" },
                  { label: "AI Model", value: "Cinema-V3 Ultra" },
                  { label: "Asset Stitching", value: "Active" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[9px] uppercase tracking-widest text-white/25 mb-1">{label}</p>
                    <p className="font-bold text-white/70">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <motion.button
                onClick={() => setRenderState("rendering")}
                whileHover={{ scale: 1.03, boxShadow: "0 0 30px rgba(99,102,241,0.4)" }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black text-base shadow-lg"
              >
                Start Rendering
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* STATE: RENDERING */}
        {renderState === "rendering" && (
          <motion.div
            key="rendering"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col gap-5"
          >
            <div className="p-6 rounded-2xl bg-[#0d0d0d] border border-white/[0.06] space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-black text-white">
                    Rendering &ldquo;{projectTitle}&rdquo;
                  </h3>
                  <p className="text-sm text-white/40 mt-1">ETA: ~02:45 remaining</p>
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black text-white">{Math.round(progress)}</span>
                  <span className="text-xl font-bold text-white/40 mb-1">%</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: "linear" }}
                />
              </div>

              {/* Step indicators */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {RENDER_STEPS.map((step, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs ${
                    step.status === "done" ? "text-emerald-400"
                    : step.status === "active" ? "text-amber-400"
                    : "text-white/20"
                  }`}>
                    {step.status === "done" ? "✓"
                      : step.status === "active" ? <Loader2 className="w-3 h-3 animate-spin" />
                      : "⚪"}
                    <span className="font-medium">{step.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 text-xs text-white/30">
                <span>⏱ {formatTime(elapsed)} elapsed</span>
              </div>
            </div>

            <div className="flex justify-start">
              <button
                onClick={() => setRenderState("selecting")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-white/40 text-sm font-semibold hover:border-rose-500/30 hover:text-rose-400/70 transition-all"
              >
                <XCircle className="w-4 h-4" /> Cancel Render
              </button>
            </div>
          </motion.div>
        )}

        {/* STATE: COMPLETE */}
        {renderState === "complete" && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col gap-5"
          >
            <div className="flex-1 p-8 rounded-2xl bg-emerald-500/[0.05] border border-emerald-500/20 flex flex-col items-center justify-center text-center space-y-5">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <CheckCircle className="w-16 h-16 text-emerald-400" />
              </motion.div>
              <div>
                <h3 className="text-3xl font-black text-white">Render Complete!</h3>
                <p className="text-white/40 mt-2">Your masterpiece is ready to launch.</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-white/50">
                <span>Size: 145MB</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>Duration: 45s</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>Quality: {selectedQuality.toUpperCase()}</span>
              </div>
              <div className="flex gap-3 mt-2">
                <motion.button
                  onClick={() => onComplete("https://velora.ai/renders/demo.mp4")}
                  whileHover={{ scale: 1.04, boxShadow: "0 0 30px rgba(16,185,129,0.4)" }}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-2 px-8 py-4 rounded-xl bg-emerald-500 text-white font-bold text-base"
                >
                  <Download className="w-5 h-5" /> Download Video
                </motion.button>
                <button className="px-6 py-4 rounded-xl border border-white/10 text-white/50 font-semibold text-sm hover:bg-white/[0.04] transition-all">
                  Start New Project
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      {renderState === "selecting" && (
        <div className="shrink-0 flex items-center justify-between pt-4 border-t border-white/[0.04]">
          <button className="flex items-center gap-1.5 text-white/40 text-sm hover:text-white/70 transition-all">
            <ChevronLeft className="w-4 h-4" /> Back to Editor
          </button>
          <div className="flex items-center gap-3 text-xs text-white/25">
            <Cloud className="w-4 h-4 text-indigo-400/50" />
            Auto-syncing to cloud library
          </div>
        </div>
      )}
    </div>
  );
};
