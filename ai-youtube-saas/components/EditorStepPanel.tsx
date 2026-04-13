"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { PenLine, Trash2, CheckCircle, ChevronRight, Sparkles } from "lucide-react";

interface Props {
  projectTitle: string;
  onApprove: () => void;
}

const SUBTITLES = [
  { id: "1", time: "00:00:04:12", text: "The vast expanse of the digital void began to stir with newborn intelligence." },
  { id: "2", time: "00:00:12:05", text: "Every stitch of code woven into a tapestry of infinite possibilities." },
  { id: "3", time: "00:00:18:22", text: "A new era of narrative generation is here." },
];

const SCENE_THUMBS = [
  "https://images.unsplash.com/photo-1534996858221-380b92700493?w=200&q=70",
  "https://images.unsplash.com/photo-1524721696987-b9527df9e512?w=200&q=70",
  "https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=200&q=70",
];

const TABS = ["Timeline", "Subtitles", "Audio", "Visual Pipeline", "Dashboard"];

export const EditorStepPanel = ({ projectTitle, onApprove }: Props) => {
  const [activeTab, setActiveTab] = useState("Subtitles");
  const [activeSubId, setActiveSubId] = useState("2");
  const [bloom, setBloom] = useState(64);
  const [rhythm, setRhythm] = useState(88);
  const [activeScene, setActiveScene] = useState(1);

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Header label */}
      <div>
        <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
          Step 10 — Editor
        </span>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 min-h-0 overflow-hidden">
        {/* LEFT: Subtitle Editor or Tabs */}
        <div className="flex flex-col bg-[#0d0d0d] rounded-2xl border border-white/[0.06] overflow-hidden">
          {/* Tab bar + header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.04]">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/50">Subtitle Editor</h3>
            <div className="flex items-center gap-1">
              <button className="p-2 rounded-lg hover:bg-white/[0.04] text-white/30 hover:text-white/70 transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/></svg>
              </button>
              <button className="p-2 rounded-lg hover:bg-white/[0.04] text-white/30 hover:text-white/70 transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5h11M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/></svg>
              </button>
            </div>
          </div>

          {/* Subtitle list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
            {SUBTITLES.map((sub) => {
              const isActive = sub.id === activeSubId;
              return (
                <div
                  key={sub.id}
                  onClick={() => setActiveSubId(sub.id)}
                  className={`relative p-4 rounded-xl border cursor-pointer transition-all ${
                    isActive
                      ? "border-indigo-500/25 bg-[#141420]"
                      : "border-white/[0.04] bg-[#111] hover:bg-white/[0.02]"
                  }`}
                >
                  {isActive && <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-indigo-400 rounded-r-full" />}
                  <span className="text-[9px] font-mono text-white/25 block mb-1.5 tracking-widest">{sub.time}</span>
                  <p className={`text-sm leading-relaxed ${isActive ? "text-white" : "text-white/50"}`}>{sub.text}</p>
                  {isActive && (
                    <button className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 text-white/25 hover:text-indigo-400 transition-all">
                      <PenLine className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Timeline scrubber */}
          <div className="p-4 border-t border-white/[0.04] bg-[#0a0a0a]">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2 text-white/40">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span className="text-[10px] font-mono tracking-widest">00:00:12:05 / 03:45:00</span>
              </div>
            </div>
            <div className="h-1 bg-white/[0.05] rounded-full mb-3">
              <div className="h-full w-1/4 bg-indigo-500 rounded-full" />
            </div>
            {/* Scene thumbnails */}
            <div className="flex gap-2">
              {SCENE_THUMBS.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveScene(i)}
                  className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                    activeScene === i ? "border-pink-400" : "border-transparent"
                  }`}
                  style={{ width: 80, height: 50 }}
                >
                  <img src={src} alt={`Scene ${i+1}`} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0.5 left-0.5 text-[7px] font-bold text-white/60 bg-black/50 px-1 rounded">
                    SCENE {String(i+1).padStart(2, "0")}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Preview + Controls */}
        <div className="flex flex-col gap-4">
          {/* Preview */}
          <div className="relative rounded-2xl overflow-hidden bg-[#080808] border border-white/[0.06] flex-1 min-h-0">
            <img
              src="https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=600&q=80"
              alt="Preview"
              className="w-full h-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
          </div>

          {/* Global Bloom slider */}
          <div className="p-4 rounded-xl bg-[#0d0d0d] border border-white/[0.06] space-y-3">
            <div className="flex justify-between">
              <span className="text-[10px] uppercase tracking-widest font-bold text-white/30">Global Bloom</span>
              <span className="text-xs font-bold text-white/60">{bloom}%</span>
            </div>
            <input
              type="range" min={0} max={100} value={bloom}
              onChange={(e) => setBloom(+e.target.value)}
              className="w-full h-1 accent-indigo-500 bg-white/10 rounded-full cursor-pointer"
            />

            <div className="flex justify-between mt-1">
              <span className="text-[10px] uppercase tracking-widest font-bold text-white/30">Rhythm Sync</span>
              <span className="text-xs font-bold text-white/60">{rhythm}%</span>
            </div>
            <input
              type="range" min={0} max={100} value={rhythm}
              onChange={(e) => setRhythm(+e.target.value)}
              className="w-full h-1 accent-indigo-500 bg-white/10 rounded-full cursor-pointer"
            />
          </div>

          {/* AI Recommendation */}
          <div className="p-4 rounded-xl bg-[#0d0d0d] border border-white/[0.06] space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[9px] uppercase tracking-widest font-bold text-indigo-400/60">AI Recommendation</span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">
              The pacing in <span className="text-white/80 font-semibold">Scene 02</span> is slightly aggressive. I recommend extending the transition by{" "}
              <span className="text-white font-bold">1.2 seconds</span> to match the audio crescendo.
            </p>
            <button className="w-full py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[10px] font-bold uppercase tracking-widest text-white/40 hover:bg-white/[0.08] hover:text-white/60 transition-all">
              Apply Recommendation
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 flex items-center justify-end pt-4 border-t border-white/[0.04]">
        <motion.button
          onClick={onApprove}
          whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(99,102,241,0.35)" }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-500 text-white font-bold text-sm"
        >
          Finalize &amp; Export <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
};
