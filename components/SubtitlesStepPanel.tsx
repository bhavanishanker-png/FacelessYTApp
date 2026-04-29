"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronRight, RefreshCw, Copy, Trash2, PenLine } from "lucide-react";

interface Subtitle {
  id: string;
  text: string;
  start: string;
  end: string;
}

const DEMO_SUBTITLES: Subtitle[] = [
  { id: "1", text: "The future of AI-driven video production is here, allowing creators to focus purely on the visual narrative.", start: "00:04", end: "00:08" },
  { id: "2", text: "Every stitch of code woven into a tapestry of infinite possibilities.", start: "00:12", end: "00:16" },
  { id: "3", text: "Welcome to the Velora Edit. Let's begin the final render process together.", start: "00:18", end: "00:22" },
  { id: "4", text: "The neural engine processes each frame with cinematic precision and detail.", start: "00:24", end: "00:29" },
  { id: "5", text: "AI is not replacing creativity — it's amplifying it beyond imagination.", start: "00:30", end: "00:35" },
];

interface Props {
  projectId: string;
  audioUrl?: string;
  script: string;
  stepData?: any;
  initialSubtitles?: any;
  onApprove: (data: any) => void;
  onAutoSave?: (data: any) => void;
}

const FONT_SIZES = [16, 20, 24, 32];
const COLORS = ["#c0c1ff", "#f9fafb", "#f59e0b", "#10b981"];
const POSITIONS = ["top-left", "top-center", "top-right", "mid-left", "mid-center", "mid-right", "bot-left", "bot-center", "bot-right"];

export const SubtitlesStepPanel = ({ projectId, audioUrl, script, stepData, initialSubtitles, onApprove, onAutoSave }: Props) => {
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [fontSize, setFontSize] = useState(stepData?.fontSize ?? 24);
  const [selectedColor, setSelectedColor] = useState(stepData?.color || COLORS[0]);
  const [selectedPosition, setSelectedPosition] = useState(stepData?.position || "bot-center");
  const [bgEnabled, setBgEnabled] = useState(stepData?.bgEnabled ?? true);
  const [isBold, setIsBold] = useState(stepData?.isBold ?? false);
  const [isItalic, setIsItalic] = useState(stepData?.isItalic ?? false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialSubtitles?.data && initialSubtitles.data.length > 0) {
      const mapped = initialSubtitles.data.map((s: any, idx: number) => ({
        id: idx.toString(),
        text: s.text,
        start: new Date(s.start * 1000).toISOString().substring(14, 19),
        end: new Date(s.end * 1000).toISOString().substring(14, 19),
        rawStart: s.start,
        rawEnd: s.end,
      }));
      setSubtitles(mapped);
      if (mapped.length > 0) setActiveId(mapped[0].id);
    }
  }, [initialSubtitles]);

  const handleGenerate = async () => {
    if (!projectId || !audioUrl) {
      setError("Missing audio file for transcription.");
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/subtitles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, audioUrl }),
      });
      const result = await res.json();
      
      if (!res.ok || !result.success) {
        setError(result.error || "Failed to generate subtitles");
        setIsGenerating(false);
        return;
      }
      
      const mapped = result.data.segments.map((s: any, idx: number) => ({
        id: idx.toString(),
        text: s.text,
        start: new Date(s.start * 1000).toISOString().substring(14, 19),
        end: new Date(s.end * 1000).toISOString().substring(14, 19),
        rawStart: s.start,
        rawEnd: s.end,
      }));
      
      setSubtitles(mapped);
      if (mapped.length > 0) setActiveId(mapped[0].id);
      
      if (onAutoSave) {
        onAutoSave({ 
          status: "completed", 
          data: result.data.segments,
          settings: { fontSize, color: selectedColor, position: selectedPosition, bgEnabled, isBold, isItalic }
        });
      }
    } catch (err) {
      setError("Network error while generating subtitles.");
    } finally {
      setIsGenerating(false);
    }
  };

  const activeSubtitle = subtitles.find((s) => s.id === activeId);

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
              Step 08
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">Subtitle Generation</h2>
          <p className="text-sm text-white/40 mt-1">Review, edit, and style your AI-generated subtitles.</p>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={isGenerating || !audioUrl}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white/60 text-sm font-semibold hover:bg-white/[0.07] transition-all disabled:opacity-50"
        >
          {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-400" />} 
          {isGenerating ? "Transcribing..." : "AI Re-transcribe"}
        </button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3"
          >
            <span className="text-[13px] text-rose-300 font-medium flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-rose-400/50 hover:text-rose-400 text-xs font-bold">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 min-h-0 overflow-hidden">
        {/* LEFT: Subtitle List */}
        <div className="flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
            {subtitles.map((sub, idx) => {
              const isActive = sub.id === activeId;
              return (
                <motion.div
                  key={sub.id}
                  onClick={() => setActiveId(sub.id)}
                  whileHover={{ x: 2 }}
                  className={`relative p-4 rounded-xl border cursor-pointer transition-all ${
                    isActive
                      ? "border-indigo-500/30 bg-indigo-500/[0.06]"
                      : "border-white/[0.04] bg-[#111] hover:bg-white/[0.02]"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full bg-indigo-500" />
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-mono text-white/30 tracking-widest">
                      {sub.start} — {sub.end}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                      {isActive && (
                        <>
                          <button className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/70 transition-all">
                            <Copy className="w-3 h-3" />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-rose-500/10 text-white/30 hover:text-rose-400 transition-all">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <p className={`text-sm leading-relaxed ${isActive ? "text-white" : "text-white/60"}`}>
                    &ldquo;{sub.text}&rdquo;
                  </p>
                  {isActive && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <button className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-indigo-400 transition-all">
                        <Copy className="w-3 h-3" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-rose-500/10 text-white/30 hover:text-rose-400 transition-all">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Preview + Controls */}
        <div className="space-y-4 overflow-y-auto hide-scrollbar">
          {/* Video Preview */}
          <div className="relative rounded-2xl overflow-hidden aspect-video bg-[#080808] border border-white/[0.06]">
            <img
              src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=600&q=80"
              alt="Preview"
              className="w-full h-full object-cover opacity-70"
            />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-rose-500/80 text-white text-[9px] font-bold uppercase tracking-widest">
              Live Preview
            </div>
            {/* Subtitle overlay */}
            <AnimatePresence>
              {activeSubtitle && (
                <motion.div
                  key={activeSubtitle.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute bottom-6 left-4 right-4 flex justify-center"
                >
                  <span
                    className={`px-4 py-2 rounded-xl text-center text-sm leading-relaxed ${
                      bgEnabled ? "bg-black/60 backdrop-blur-sm" : ""
                    } ${isBold ? "font-black" : "font-semibold"} ${isItalic ? "italic" : ""}`}
                    style={{ color: selectedColor, fontSize: `${fontSize * 0.6}px` }}
                  >
                    {activeSubtitle.text.substring(0, 40)}...
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Typography */}
          <div className="p-4 rounded-xl bg-[#111] border border-white/[0.06] space-y-3">
            <p className="text-[9px] uppercase tracking-widest font-bold text-white/25">Typography</p>
            <select className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 outline-none">
              <option>Inter Display Bold</option>
              <option>Inter</option>
              <option>Roboto Condensed</option>
            </select>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-[#1a1a1a] rounded-lg px-2 py-1.5 border border-white/10">
                <span className="text-[9px] text-white/30 font-bold uppercase mr-1">Size</span>
                <span className="text-sm font-bold text-white">{fontSize}px</span>
              </div>
              <button
                onClick={() => setIsBold(!isBold)}
                className={`px-3 py-1.5 rounded-lg border text-sm font-black transition-all ${
                  isBold ? "bg-indigo-500 border-indigo-500 text-white" : "bg-[#1a1a1a] border-white/10 text-white/50"
                }`}
              >B</button>
              <button
                onClick={() => setIsItalic(!isItalic)}
                className={`px-3 py-1.5 rounded-lg border text-sm font-bold italic transition-all ${
                  isItalic ? "bg-indigo-500 border-indigo-500 text-white" : "bg-[#1a1a1a] border-white/10 text-white/50"
                }`}
              >I</button>
            </div>
            <input
              type="range" min={12} max={48} value={fontSize}
              onChange={(e) => setFontSize(+e.target.value)}
              className="w-full h-1 accent-indigo-500 bg-white/10 rounded-full cursor-pointer"
            />
          </div>

          {/* Styling */}
          <div className="p-4 rounded-xl bg-[#111] border border-white/[0.06] space-y-3">
            <p className="text-[9px] uppercase tracking-widest font-bold text-white/25">Styling</p>
            {/* Colors */}
            <div>
              <p className="text-[9px] text-white/20 mb-2">Primary Color</p>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${selectedColor === c ? "border-white scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            {/* Background toggle */}
            <div className="flex items-center justify-between">
              <p className="text-[9px] text-white/20">Background</p>
              <button
                onClick={() => setBgEnabled(!bgEnabled)}
                className={`w-10 h-5 rounded-full relative transition-all ${bgEnabled ? "bg-indigo-500" : "bg-white/10"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${bgEnabled ? "left-5.5" : "left-0.5"}`} style={{ left: bgEnabled ? 22 : 2 }} />
              </button>
            </div>
            {/* Position grid */}
            <div>
              <p className="text-[9px] text-white/20 mb-2">Positioning</p>
              <div className="grid grid-cols-3 gap-1">
                {POSITIONS.map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setSelectedPosition(pos)}
                    className={`h-7 rounded-lg transition-all ${selectedPosition === pos ? "bg-indigo-500/30 border border-indigo-500/50" : "bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 flex items-center justify-end pt-4 border-t border-white/[0.04]">
          <motion.button
            onClick={() => onApprove({ fontSize, color: selectedColor, position: selectedPosition, bgEnabled, isBold, isItalic })}
            whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(99,102,241,0.35)" }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-500 text-white font-bold text-sm"
          >
            Continue to Export <ChevronRight className="w-4 h-4" />
          </motion.button>
      </div>
    </div>
  );
};
