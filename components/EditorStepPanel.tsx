"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { PenLine, Check, ChevronRight, FileText, Image } from "lucide-react";

interface Subtitle {
  text: string;
  start: number;
  end: number;
}

interface SceneImage {
  sceneId: string;
  imageUrl: string;
  prompt: string;
}

interface Props {
  projectTitle: string;
  subtitles: Subtitle[];
  images: SceneImage[];
  onApprove: (editedSubtitles: Subtitle[]) => void;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.round((seconds % 1) * 100);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(cs).padStart(2, "0")}`;
}

export const EditorStepPanel = ({ projectTitle, subtitles, images, onApprove }: Props) => {
  const [edited, setEdited] = useState<Subtitle[]>(subtitles.map((s) => ({ ...s })));
  const [activeIdx, setActiveIdx] = useState(0);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [activeScene, setActiveScene] = useState(0);

  const totalDuration = edited.length > 0 ? edited[edited.length - 1].end : 0;
  const currentTime = edited[activeIdx]?.start ?? 0;
  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  const saveEdit = (idx: number, text: string) => {
    setEdited((prev) => prev.map((s, i) => (i === idx ? { ...s, text } : s)));
    setEditingIdx(null);
  };

  const previewImage = images[activeScene]?.imageUrl || images[0]?.imageUrl;

  return (
    <div className="flex flex-col h-full gap-5">
      <div>
        <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
          Step 10 — Editor
        </span>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 min-h-0 overflow-hidden">
        {/* LEFT: Subtitle Editor */}
        <div className="flex flex-col bg-[#0d0d0d] rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-white/30" />
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/50">
                Subtitle Editor
              </h3>
              <span className="text-[10px] text-white/20">({edited.length} segments)</span>
            </div>
          </div>

          {edited.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
              <FileText className="w-10 h-10 text-white/10" />
              <p className="text-sm text-white/30">No subtitles generated yet.</p>
              <p className="text-xs text-white/20">Complete the Voice step to generate subtitles.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
              {edited.map((sub, idx) => {
                const isActive = idx === activeIdx;
                const isEditing = idx === editingIdx;
                return (
                  <div
                    key={idx}
                    onClick={() => { setActiveIdx(idx); }}
                    className={`relative p-4 rounded-xl border cursor-pointer transition-all ${
                      isActive
                        ? "border-indigo-500/25 bg-[#141420]"
                        : "border-white/[0.04] bg-[#111] hover:bg-white/[0.02]"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-indigo-400 rounded-r-full" />
                    )}
                    <span className="text-[9px] font-mono text-white/25 block mb-1.5 tracking-widest">
                      {formatTime(sub.start)} → {formatTime(sub.end)}
                    </span>

                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          autoFocus
                          defaultValue={sub.text}
                          rows={2}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              saveEdit(idx, (e.target as HTMLTextAreaElement).value);
                            }
                            if (e.key === "Escape") setEditingIdx(null);
                          }}
                          className="w-full bg-white/[0.05] border border-indigo-500/30 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-indigo-500/60"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingIdx(null); }}
                            className="px-3 py-1 rounded-lg text-[10px] text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const ta = e.currentTarget.closest(".flex")?.previousSibling as HTMLTextAreaElement;
                              if (ta) saveEdit(idx, ta.value);
                            }}
                            className="px-3 py-1 rounded-lg text-[10px] bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-all flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className={`text-sm leading-relaxed ${isActive ? "text-white" : "text-white/50"}`}>
                          {sub.text}
                        </p>
                        {isActive && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingIdx(idx); }}
                            className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 text-white/25 hover:text-indigo-400 transition-all"
                          >
                            <PenLine className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Timeline */}
          <div className="p-4 border-t border-white/[0.04] bg-[#0a0a0a]">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[10px] font-mono text-white/30 tracking-widest">
                {formatTime(currentTime)} / {formatTime(totalDuration)}
              </span>
            </div>
            <div className="h-1 bg-white/[0.05] rounded-full mb-3">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Scene thumbnails */}
            {images.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                {images.map((img, i) => (
                  <button
                    key={img.sceneId}
                    onClick={() => { setActiveScene(i); }}
                    className={`relative flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                      activeScene === i ? "border-indigo-400" : "border-transparent"
                    }`}
                    style={{ width: 80, height: 50 }}
                  >
                    {img.imageUrl ? (
                      <img src={img.imageUrl} alt={`Scene ${i + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/[0.04] flex items-center justify-center">
                        <Image className="w-4 h-4 text-white/20" />
                      </div>
                    )}
                    <div className="absolute bottom-0.5 left-0.5 text-[7px] font-bold text-white/60 bg-black/50 px-1 rounded">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-white/20">No scene images yet.</p>
            )}
          </div>
        </div>

        {/* RIGHT: Scene preview */}
        <div className="flex flex-col gap-4">
          <div className="relative rounded-2xl overflow-hidden bg-[#080808] border border-white/[0.06] flex-1 min-h-0">
            {previewImage ? (
              <>
                <img
                  src={previewImage}
                  alt={`Scene ${activeScene + 1}`}
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
                <div className="absolute bottom-3 left-3 text-[10px] font-bold text-white/50 uppercase tracking-widest">
                  Scene {activeScene + 1}
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-center p-6">
                <Image className="w-10 h-10 text-white/10" />
                <p className="text-xs text-white/20">Generate scenes to see a preview</p>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="p-4 rounded-xl bg-[#0d0d0d] border border-white/[0.06] space-y-2">
            <p className="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-3">Ready to render</p>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Subtitle segments</span>
              <span className={edited.length > 0 ? "text-emerald-400 font-bold" : "text-rose-400"}>{edited.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Scene images</span>
              <span className={images.length > 0 ? "text-emerald-400 font-bold" : "text-rose-400"}>{images.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Total duration</span>
              <span className="text-white/60 font-mono">{formatTime(totalDuration)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-between pt-4 border-t border-white/[0.04]">
        <p className="text-xs text-white/30">
          {editingIdx !== null ? "Press Enter to save or Escape to cancel" : "Click a subtitle then the pencil to edit"}
        </p>
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ y: 0 }}
          onClick={() => onApprove(edited)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[13px] tracking-wide bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.3)] transition-all"
        >
          Finalize &amp; Export <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
};
