"use client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, Clapperboard, MoveLeft, MoveRight,
  Pause, Play, Wind, ZoomIn, ZoomOut, Layers,
} from "lucide-react";
import React, { useState } from "react";

interface Props {
  scenes: any[];
  stepData?: any;
  onAutoSave?: (data: any) => void;
  onApprove: (data: any) => void;
}

const ANIMATION_PRESETS = [
  { id: "zoom_in",    icon: ZoomIn,      label: "Zoom In",    desc: "100% → 120%",        gradient: "from-sky-500/20 to-sky-600/10",    border: "border-sky-500/30",    icon_color: "text-sky-400" },
  { id: "zoom_out",   icon: ZoomOut,     label: "Zoom Out",   desc: "120% → 100%",        gradient: "from-violet-500/20 to-violet-600/10", border: "border-violet-500/30", icon_color: "text-violet-400" },
  { id: "pan_left",   icon: MoveLeft,    label: "Pan Left",   desc: "Sweep right → left", gradient: "from-rose-500/20 to-rose-600/10",   border: "border-rose-500/30",   icon_color: "text-rose-400" },
  { id: "pan_right",  icon: MoveRight,   label: "Pan Right",  desc: "Sweep left → right", gradient: "from-amber-500/20 to-amber-600/10", border: "border-amber-500/30",  icon_color: "text-amber-400" },
  { id: "ken_burns",  icon: Clapperboard, label: "Ken Burns", desc: "Cinematic zoom + pan", gradient: "from-indigo-500/20 to-purple-600/10", border: "border-indigo-500/30", icon_color: "text-indigo-400", recommended: true },
];

const TRANSITIONS = ["Cross Dissolve", "Glitch", "Light Leak", "Morph"];

const FALLBACK_THUMBS = [
  "https://images.unsplash.com/photo-1534996858221-380b92700493?w=300&q=70",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300&q=70",
  "https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=300&q=70",
  "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300&q=70",
];

export const AnimationStepPanel = ({ scenes, stepData, onAutoSave, onApprove }: Props) => {
  const [playing, setPlaying] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(stepData?.preset || "ken_burns");
  const [selectedTransition, setSelectedTransition] = useState(stepData?.transition || "Cross Dissolve");
  const [intensity, setIntensity] = useState(stepData?.intensity ?? 75);
  const [duration, setDuration] = useState(stepData?.duration ?? 4.5);
  const [activeThumb, setActiveThumb] = useState(0);
  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const t = setTimeout(() => {
      onAutoSave?.({ preset: selectedPreset, transition: selectedTransition, intensity, duration });
    }, 500);
    return () => clearTimeout(t);
  }, [selectedPreset, selectedTransition, intensity, duration, onAutoSave]);

  const sceneList = scenes?.length > 0 ? scenes : FALLBACK_THUMBS;

  const getThumbSrc = (i: number) =>
    (scenes?.length > 0 ? scenes[i]?.imageUrl : null) || FALLBACK_THUMBS[i % FALLBACK_THUMBS.length];

  const getAnimationProps = () => {
    if (!playing) return { scale: 1, x: 0, y: 0 };
    switch (selectedPreset) {
      case "zoom_in":   return { scale: [1, 1.2],   x: 0,       y: 0 };
      case "zoom_out":  return { scale: [1.2, 1],   x: 0,       y: 0 };
      case "pan_left":  return { scale: 1.1,         x: [0, -20], y: 0 };
      case "pan_right": return { scale: 1.1,         x: [-20, 0], y: 0 };
      case "ken_burns": return { scale: [1, 1.15],  x: [0, -20], y: [0, -10] };
      default:          return { scale: 1,           x: 0,       y: 0 };
    }
  };

  const activePreset = ANIMATION_PRESETS.find(p => p.id === selectedPreset)!;

  return (
    <div className="flex flex-col gap-5 w-full min-w-0">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-widest text-indigo-400">Step 06</span>
        </div>
        <h2 className="text-xl font-black tracking-tight text-white">Image Animation</h2>
        <p className="text-sm text-white/40 mt-0.5">Choose how each scene moves and transitions.</p>
      </div>

      {/* Preview */}
      <div className="relative rounded-2xl overflow-hidden bg-black border border-white/[0.06] w-full">
        <div className="aspect-video relative overflow-hidden">
          <motion.img
            src={getThumbSrc(activeThumb)}
            alt="Preview"
            className="w-full h-full object-cover"
            animate={getAnimationProps()}
            transition={{ duration: playing ? duration : 0.4, ease: "linear", repeat: playing ? Infinity : 0, repeatType: "reverse" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.button
              onClick={() => setPlaying(p => !p)}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
              className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center hover:bg-white/25 transition-colors"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={playing ? "pause" : "play"} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.12 }}>
                  {playing ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Active preset badge */}
          <div className="absolute top-3 left-3">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${activePreset.border} bg-black/50 backdrop-blur-sm`}>
              <activePreset.icon className={`w-3 h-3 ${activePreset.icon_color}`} />
              <span className={`text-[10px] font-bold ${activePreset.icon_color}`}>{activePreset.label}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-white/50">Scene {String(activeThumb + 1).padStart(2, "0")}</span>
              <div className="flex-1 h-[2px] bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-indigo-400 rounded-full"
                  animate={playing ? { width: ["0%", "100%"] } : { width: "30%" }}
                  transition={playing ? { duration, ease: "linear", repeat: Infinity } : { duration: 0 }}
                />
              </div>
              <span className="text-[10px] font-mono text-white/50">{duration.toFixed(1)}s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scene thumbnails — internal horizontal scroll, no page bleed */}
      <div className="w-full overflow-x-auto hide-scrollbar">
        <div className="flex gap-2 pb-0.5" style={{ width: "max-content" }}>
          {sceneList.map((scene: any, i: number) => (
            <motion.button
              key={i}
              onClick={() => setActiveThumb(i)}
              whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}
              className={`shrink-0 relative rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                activeThumb === i ? "border-indigo-400 shadow-[0_0_14px_rgba(99,102,241,0.45)]" : "border-white/[0.07] hover:border-white/20"
              }`}
              style={{ width: 72, height: 46 }}
            >
              <img src={scene.imageUrl || scene} alt={`Scene ${i + 1}`} className="w-full h-full object-cover" />
              {activeThumb === i && <div className="absolute inset-0 bg-indigo-500/10" />}
              <div className="absolute bottom-0.5 left-0.5 text-[8px] font-bold text-white/70 bg-black/60 px-1 py-0.5 rounded">
                {String(i + 1).padStart(2, "0")}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Motion Presets */}
      <div className="w-full p-4 rounded-2xl bg-[#0a0a0a] border border-white/[0.05]">
        <p className="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-3">Motion Preset</p>
        <div className="grid grid-cols-2 gap-2">
          {ANIMATION_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isActive = selectedPreset === preset.id;
            return (
              <motion.button
                key={preset.id}
                onClick={() => setSelectedPreset(preset.id)}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className={`relative flex items-center gap-2.5 p-3 rounded-xl border transition-all duration-200 text-left min-w-0 ${
                  preset.recommended ? "col-span-2" : ""
                } ${
                  isActive
                    ? `bg-gradient-to-br ${preset.gradient} ${preset.border}`
                    : "border-white/[0.06] bg-[#111] hover:bg-white/[0.03] hover:border-white/10"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive ? `bg-gradient-to-br ${preset.gradient}` : "bg-white/[0.04]"
                }`}>
                  <Icon className={`w-4 h-4 ${isActive ? preset.icon_color : "text-white/40"}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className={`text-xs font-bold truncate ${isActive ? "text-white" : "text-white/60"}`}>{preset.label}</p>
                    {preset.recommended && (
                      <span className="px-1.5 py-0.5 rounded-full bg-indigo-500 text-white text-[8px] font-bold uppercase tracking-wide shrink-0">AI Pick</span>
                    )}
                  </div>
                  <p className={`text-[10px] truncate ${isActive ? preset.icon_color : "text-white/25"}`}>{preset.desc}</p>
                </div>
                {isActive && (
                  <div className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full shrink-0 ${preset.icon_color.replace("text-", "bg-")}`} />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Transitions */}
      <div className="w-full p-4 rounded-2xl bg-[#0a0a0a] border border-white/[0.05]">
        <p className="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-3 flex items-center gap-2">
          <Layers className="w-3 h-3" /> Scene Transitions
        </p>
        <div className="flex flex-wrap gap-2">
          {TRANSITIONS.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTransition(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                selectedTransition === t
                  ? "bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                  : "bg-white/[0.04] border border-white/[0.07] text-white/50 hover:border-white/15 hover:text-white/70"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="w-full p-4 rounded-2xl bg-[#0a0a0a] border border-white/[0.05] space-y-5">

        {/* Intensity */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[10px] uppercase tracking-widest font-bold text-white/30">Motion Intensity</p>
            <span className="text-xs font-black text-white/80 tabular-nums">{intensity}%</span>
          </div>
          <div className="relative">
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-75" style={{ width: `${intensity}%` }} />
            </div>
            <input type="range" min={0} max={100} value={intensity} onChange={e => setIntensity(+e.target.value)}
              className="absolute inset-0 w-full opacity-0 cursor-pointer h-1.5" />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[9px] text-white/20">Subtle</span>
            <span className="text-[9px] text-white/20">Dramatic</span>
          </div>
        </div>

        {/* Duration */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[10px] uppercase tracking-widest font-bold text-white/30">Clip Duration</p>
            <span className="text-xs font-black text-white/80 tabular-nums">{duration.toFixed(1)}s</span>
          </div>
          <div className="relative">
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-75" style={{ width: `${((duration - 1) / 9) * 100}%` }} />
            </div>
            <input type="range" min={1} max={10} step={0.1} value={duration} onChange={e => setDuration(+e.target.value)}
              className="absolute inset-0 w-full opacity-0 cursor-pointer h-1.5" />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[9px] text-white/20">1s</span>
            <span className="text-[9px] text-white/20">10s</span>
          </div>
        </div>
      </div>

      {/* Tip */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-indigo-500/[0.05] border border-indigo-500/[0.12]">
        <Wind className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-white/40 leading-relaxed">
          Ken Burns combines a slow zoom with a subtle pan — great for narrative and documentary-style videos.
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end pt-2 border-t border-white/[0.04]">
        <motion.button
          onClick={() => onApprove({ preset: selectedPreset, transition: selectedTransition, intensity, duration })}
          whileHover={{ scale: 1.02, boxShadow: "0 0 24px rgba(99,102,241,0.35)" }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm shadow-[0_0_16px_rgba(99,102,241,0.2)]"
        >
          Approve & Continue <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>

    </div>
  );
};
