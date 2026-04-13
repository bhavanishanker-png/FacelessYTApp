"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Layers, Mic, Type, ChevronRight, XCircle, Zap } from "lucide-react";

interface Props {
  projectTitle: string;
  onApprove: () => void;
}

const STEPS_LIST = [
  { label: "Combining scenes", status: "done" },
  { label: "Audio sync & alignment", status: "done" },
  { label: "Color grading", status: "active" },
  { label: "Final encoding", status: "pending" },
];

export const CompositionStepPanel = ({ projectTitle, onApprove }: Props) => {
  const [progress, setProgress] = useState(84);
  const [assetSync, setAssetSync] = useState({ audio: 100, lipSync: 92, colorGrading: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => Math.min(p + 0.3, 100));
    }, 400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Header status pill */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Processing Composition</span>
        </div>
      </div>

      {/* Main render card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl bg-[#0d0d0d] border border-white/[0.06] space-y-5"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white truncate max-w-sm">
              {projectTitle.replace(/\s+/g, "_")}_v4
            </h2>
            <p className="text-sm text-white/40 mt-1">
              Finalizing neural render and temporal upscaling. Estimated completion in 02:45.
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-white/25 mb-1">Current Progress</p>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-black text-white">{Math.round(progress)}</span>
              <span className="text-xl font-bold text-white/40 mb-1">%</span>
            </div>
            <p className="text-[10px] text-white/25 mt-1 uppercase tracking-widest">Final Resolution · <span className="text-white/50">4K HDR</span></p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-2 bg-white/[0.05] rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-6">
          {STEPS_LIST.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                step.status === "done" ? "bg-emerald-400"
                : step.status === "active" ? "bg-amber-400 animate-pulse"
                : "bg-white/15"
              }`} />
              <span className={`text-[10px] font-medium uppercase tracking-widest ${
                step.status === "done" ? "text-emerald-400/70"
                : step.status === "active" ? "text-amber-400/70"
                : "text-white/20"
              }`}>
                {step.status === "done" ? "✓" : step.status === "active" ? "⏳" : "⚪"} {step.label}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 min-h-0">
        {/* Preview */}
        <div className="relative rounded-2xl overflow-hidden bg-[#080808] border border-white/[0.06] min-h-[250px]">
          <img
            src="https://images.unsplash.com/photo-1617957743098-f2f73b4c5d2c?w=800&q=80"
            alt="Composition preview"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        {/* Asset Alignment */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#0d0d0d] border border-white/[0.06] space-y-4">
            <p className="text-[10px] uppercase tracking-widest font-bold text-white/25">Asset Alignment</p>

            {[
              { icon: <Mic className="w-4 h-4 text-indigo-400" />, label: "Audio Sync", value: 100, valueLabel: "Matched", color: "bg-emerald-400" },
              { icon: <Type className="w-4 h-4 text-purple-400" />, label: "Lip Sync AI", value: 92, valueLabel: "92%", color: "bg-indigo-400" },
              { icon: <Layers className="w-4 h-4 text-white/30" />, label: "Color Grading", value: 0, valueLabel: "Queued", color: "bg-white/20" },
            ].map((asset) => (
              <div key={asset.label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1a1a1a] border border-white/[0.06] flex items-center justify-center shrink-0">
                  {asset.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-semibold text-white/70">{asset.label}</span>
                    <span className="text-[10px] text-white/35">{asset.valueLabel}</span>
                  </div>
                  <div className="h-0.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className={`h-full ${asset.color} rounded-full`} style={{ width: `${asset.value}%` }} />
                  </div>
                </div>
              </div>
            ))}

            <button className="w-full py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs font-bold text-white/50 uppercase tracking-widest hover:bg-white/[0.07] transition-all mt-2">
              Manage All Assets
            </button>
          </div>

          {/* System Health */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/15 border border-indigo-500/20">
            <p className="text-[9px] uppercase tracking-widest font-bold text-indigo-400/60 mb-2">System Health</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-white">Optimal</span>
              <Zap className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 flex items-center justify-end pt-4 border-t border-white/[0.04]">
        <motion.button
          onClick={onApprove}
          whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(99,102,241,0.35)" }}
          whileTap={{ scale: 0.97 }}
          disabled={progress < 100}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-sm disabled:opacity-50"
        >
          Publish Now <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
};
