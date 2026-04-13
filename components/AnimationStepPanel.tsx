"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, ChevronRight, RefreshCw, ZoomIn, ZoomOut, MoveLeft, MoveRight, Minus, Wind, Clapperboard } from "lucide-react";

interface Props {
  scenes: any[];
  stepData?: any;
  onApprove: (data: any) => void;
}

const ANIMATION_PRESETS = [
  { id: "zoom_in", icon: <ZoomIn className="w-5 h-5" />, label: "Zoom In", desc: "Slowly zoom 100% → 120%" },
  { id: "zoom_out", icon: <ZoomOut className="w-5 h-5" />, label: "Zoom Out", desc: "Slowly zoom 120% → 100%" },
  { id: "pan_left", icon: <MoveLeft className="w-5 h-5" />, label: "Pan Left", desc: "Horizontal pan, left side" },
  { id: "pan_right", icon: <MoveRight className="w-5 h-5" />, label: "Pan Right", desc: "Horizontal pan, right side" },
  { id: "ken_burns", icon: <Clapperboard className="w-5 h-5" />, label: "Ken Burns Editorial", desc: "Cinematic zoom + pan", recommended: true },
];

const TRANSITIONS = ["Cross Dissolve", "Glitch", "Light Leak", "Morph"];

const SCENE_THUMBS = [
  "https://images.unsplash.com/photo-1534996858221-380b92700493?w=300&q=70",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300&q=70",
  "https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=300&q=70",
  "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300&q=70",
];

export const AnimationStepPanel = ({ scenes, stepData, onApprove }: Props) => {
  const [playing, setPlaying] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(stepData?.preset || "ken_burns");
  const [selectedTransition, setSelectedTransition] = useState(stepData?.transition || "Cross Dissolve");
  const [intensity, setIntensity] = useState(stepData?.intensity ?? 75);
  const [duration, setDuration] = useState(stepData?.duration ?? 4.5);
  const [activeThumb, setActiveThumb] = useState(0);

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
            Step 06
          </span>
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white">Image Animation</h2>
        <p className="text-sm text-white/40 mt-1">Select motion presets and transitions for each scene.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 min-h-0">
        {/* LEFT: Preview */}
        <div className="flex flex-col gap-4">
          {/* Video preview */}
          <div className="relative bg-[#080808] rounded-2xl overflow-hidden aspect-video border border-white/[0.06] flex-1 min-h-0">
            <img
              src={SCENE_THUMBS[activeThumb]}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={() => setPlaying(!playing)}
                className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all"
              >
                {playing ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-1" />}
              </button>
            </div>
            {/* Timeline bar */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="h-1 bg-white/10 rounded-full">
                <div className="h-full w-1/3 bg-indigo-400 rounded-full" />
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-white/40 font-mono">
                <span>00:03:12</span>
                <span>00:10:00</span>
              </div>
            </div>
          </div>

          {/* Scene thumbnails */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {SCENE_THUMBS.map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveThumb(i)}
                className={`shrink-0 relative rounded-xl overflow-hidden border-2 transition-all ${
                  activeThumb === i ? "border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.4)]" : "border-white/10"
                }`}
                style={{ width: 80, height: 50 }}
              >
                <img src={src} alt={`Scene ${i + 1}`} className="w-full h-full object-cover" />
                <div className="absolute bottom-0.5 left-0.5 text-[8px] font-bold text-white/70 bg-black/50 px-1 rounded">
                  {String(i + 1).padStart(2, "0")}
                </div>
              </button>
            ))}
          </div>

          {/* AI Insight card */}
          <div className="p-4 rounded-xl bg-[#111] border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-2">
              <Wind className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-400/70">AI Insight</span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">
              The pacing in <span className="text-white/80 font-semibold">Scene 02</span> is slightly aggressive. I recommend extending the transition by{" "}
              <span className="text-white font-bold">1.2 seconds</span> to match the audio crescendo.
            </p>
          </div>

          {/* Active clip info */}
          <div className="flex items-center gap-4 text-xs text-white/30">
            <span className="uppercase tracking-widest text-[9px] font-bold">Active Clip</span>
            <span className="text-white/50 font-mono">Scene_{String(activeThumb + 1).padStart(2, "0")}_Transition.mp4</span>
            <span className="flex items-center gap-1 text-emerald-400/70 text-[9px] font-bold uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Ready to Render
            </span>
          </div>
        </div>

        {/* RIGHT: Animation Settings */}
        <div className="flex flex-col gap-5 overflow-y-auto hide-scrollbar">
          <div className="p-5 rounded-2xl bg-[#0d0d0d] border border-white/[0.06] space-y-5">
            {/* AI Motion Presets */}
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-3">AI Motion Presets</p>
              <div className="grid grid-cols-2 gap-2.5">
                {ANIMATION_PRESETS.map((preset) => (
                  <motion.button
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center ${
                      selectedPreset === preset.id
                        ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300"
                        : "border-white/[0.06] bg-[#111] text-white/50 hover:bg-white/[0.03]"
                    } ${preset.recommended ? "col-span-2" : ""}`}
                  >
                    {preset.recommended && (
                      <span className="absolute top-2 right-2 text-[8px] px-1.5 py-0.5 rounded-full bg-indigo-500 text-white font-bold uppercase">
                        AI Recommended
                      </span>
                    )}
                    {preset.icon}
                    <span className="text-xs font-bold">{preset.label}</span>
                    {preset.recommended && (
                      <span className="text-[10px] text-white/30">{preset.desc}</span>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Transitions */}
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-3">Transitions</p>
              <div className="flex flex-wrap gap-2">
                {TRANSITIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTransition(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      selectedTransition === t
                        ? "bg-indigo-500 text-white"
                        : "bg-[#1a1a1a] border border-white/10 text-white/50 hover:bg-white/[0.05]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Motion Intensity slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] uppercase tracking-widest font-bold text-white/30">Motion Intensity</p>
                <span className="text-xs font-bold text-white/60">{intensity}%</span>
              </div>
              <input
                type="range" min={0} max={100} value={intensity}
                onChange={(e) => setIntensity(+e.target.value)}
                className="w-full h-1.5 accent-indigo-500 bg-white/10 rounded-full cursor-pointer"
              />
            </div>

            {/* Duration slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] uppercase tracking-widest font-bold text-white/30">Duration</p>
                <span className="text-xs font-bold text-white/60">{duration.toFixed(1)}s</span>
              </div>
              <input
                type="range" min={1} max={10} step={0.1} value={duration}
                onChange={(e) => setDuration(+e.target.value)}
                className="w-full h-1.5 accent-indigo-500 bg-white/10 rounded-full cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 flex items-center justify-end pt-4 border-t border-white/[0.04]">
        <motion.button
          onClick={() => onApprove({ preset: selectedPreset, transition: selectedTransition, intensity, duration })}
          whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(99,102,241,0.35)" }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-500 text-white font-bold text-sm"
        >
          Approve &amp; Continue <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
};
