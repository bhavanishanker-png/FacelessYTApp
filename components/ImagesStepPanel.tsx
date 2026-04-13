"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, RotateCcw, ChevronRight, ImageIcon, Loader2 } from "lucide-react";

interface Scene {
  id?: string;
  narration?: string;
  imagePrompt?: string;
  imageUrl?: string;
}

interface Props {
  scenes: Scene[];
  onApprove: () => void;
}

const DEMO_IMAGES = [
  "https://images.unsplash.com/photo-1626544827763-d516dce335e2?w=600&q=80",
  "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=600&q=80",
  "https://images.unsplash.com/photo-1633984726576-495a6540da9c?w=600&q=80",
  "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=600&q=80",
  "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&q=80",
  "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=80",
];

const DEMO_SCENES: Scene[] = [
  { narration: "The city breathed in neon, a digital pulse echoing through the rain-slicked alleys of Neo-Veridia.", imagePrompt: "Cyberpunk aesthetic, hyper-realistic, 8k, anamorphic lens, indigo and violet lighting, heavy rain, volumetric fog." },
  { narration: "High above the clouds of Saturn, the orbital station stood as a silent sentinel of humanity's reach.", imagePrompt: "Sci-fi orbital view, cinematic lighting, purple planetary glow, high detail space station, interstellar atmosphere." },
  { narration: "Within the quiet laboratory, the holographic interface shimmered with the secrets of the code.", imagePrompt: "Interior tech lab, minimalist architecture, soft blue holograms, bokeh effect, sleek metal surfaces, dramatic shadows." },
  { narration: "Every shadow told a story, every light revealed a fragment of the forgotten world.", imagePrompt: "Moody landscape, ruins of a digital city, glowing embers, twilight, cinematic wide shot." },
];

export const ImagesStepPanel = ({ scenes, onApprove }: Props) => {
  const displayScenes = scenes?.length > 0 ? scenes : DEMO_SCENES;
  const [generatingAll, setGeneratingAll] = useState(false);
  const [processingIdx, setProcessingIdx] = useState<number | null>(3); // demo: scene 4 processing
  const [progress, setProgress] = useState(75);

  const handleGenerateAll = () => {
    setGeneratingAll(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(interval); setGeneratingAll(false); return 100; }
        return p + 2;
      });
    }, 80);
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
              Step 5 of 11
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">Image Generation</h2>
          <p className="text-sm text-white/40 mt-1">
            Curating the visual landscape. Review and regenerate AI-crafted scenes.
          </p>
        </div>
        <motion.button
          onClick={handleGenerateAll}
          whileHover={{ scale: 1.03, boxShadow: "0 0 25px rgba(99,102,241,0.35)" }}
          whileTap={{ scale: 0.97 }}
          disabled={generatingAll}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-500 text-white font-bold text-sm transition-all disabled:opacity-60"
        >
          {generatingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Generate All Images
        </motion.button>
      </div>

      {/* Scene Grid */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayScenes.map((scene, idx) => {
            const isProcessing = processingIdx === idx;
            const imgSrc = DEMO_IMAGES[idx % DEMO_IMAGES.length];

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#111] rounded-2xl border border-white/[0.06] overflow-hidden"
              >
                {/* Image area */}
                <div className="relative aspect-video bg-[#0a0a0a]">
                  {isProcessing ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-indigo-500/40 border-t-indigo-400 animate-spin" />
                      <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">
                        Processing Scene {String(idx + 1).padStart(2, "0")}...
                      </span>
                    </div>
                  ) : (
                    <>
                      <img src={imgSrc} alt={`Scene ${idx + 1}`} className="w-full h-full object-cover" />
                      {/* Regenerate overlay */}
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all group flex items-center justify-center">
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-bold">
                          <RotateCcw className="w-3 h-3" /> Regenerate
                        </button>
                      </div>
                      {/* Scene badge */}
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[9px] font-bold uppercase tracking-widest text-white/60">
                        Scene {String(idx + 1).padStart(2, "0")}
                      </div>
                      {/* Regen button top-right */}
                      <button className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 backdrop-blur-sm hover:bg-white/10 transition-all text-white/50 hover:text-white">
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>

                {/* Scene info */}
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-white/25 font-bold mb-1">Narration</p>
                    <p className="text-xs text-white/70 leading-relaxed line-clamp-2">
                      &ldquo;{scene.narration || "Scene narration goes here."}&rdquo;
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-white/25 font-bold mb-1">Visual Prompt</p>
                    <div className="bg-[#0a0a0a] rounded-lg p-2.5">
                      <p className="text-[10px] text-white/40 leading-relaxed font-mono line-clamp-3">
                        {scene.imagePrompt || "AI-generated visual prompt for this scene."}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Global progress + Footer */}
      <div className="shrink-0 flex items-center justify-between gap-4 px-5 py-4 rounded-2xl bg-[#111] border border-white/[0.06]">
        <div className="flex items-center gap-4 flex-1">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-1">Global Rendering</p>
            <div className="flex items-center gap-3">
              <div className="w-48 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-sm font-bold text-white">{progress}% Complete</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-white/30">
            <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
            AI is refining scene consistency based on your brand palette.
          </div>
        </div>
        <div className="flex items-center gap-3">

          <motion.button
            onClick={onApprove}
            whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(99,102,241,0.35)" }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 text-white font-bold text-sm"
          >
            Continue <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};
