"use client";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertCircle, ChevronRight, Layers } from "lucide-react";

interface Props {
  projectTitle: string;
  voice: { audioUrl?: string; durationSeconds?: number };
  images: { sceneId: string; imageUrl: string; status: string }[];
  subtitles: { text: string; start: number; end: number }[];
  scenes: { text: string; duration: number }[];
  onApprove: () => void;
}

interface AssetCheck {
  label: string;
  description: string;
  status: "ok" | "warn" | "missing";
  detail: string;
}

export const CompositionStepPanel = ({
  projectTitle,
  voice,
  images,
  subtitles,
  scenes,
  onApprove,
}: Props) => {
  const successImages = images.filter((img) => img.imageUrl && img.status === "success");

  const checks: AssetCheck[] = [
    {
      label: "Audio Track",
      description: "Narration audio generated and ready",
      status: voice?.audioUrl ? "ok" : "missing",
      detail: voice?.audioUrl
        ? `${voice.durationSeconds ? `${Math.round(voice.durationSeconds)}s` : "Ready"}`
        : "Not generated — complete the Voice step",
    },
    {
      label: "Scene Images",
      description: "Images generated for all scenes",
      status:
        successImages.length === 0
          ? "missing"
          : successImages.length < scenes.length
          ? "warn"
          : "ok",
      detail:
        successImages.length === 0
          ? "Not generated — complete the Scenes step"
          : `${successImages.length} of ${scenes.length} scenes ready`,
    },
    {
      label: "Subtitles",
      description: "Subtitle segments synced to audio",
      status: subtitles.length > 0 ? "ok" : "warn",
      detail:
        subtitles.length > 0
          ? `${subtitles.length} segments`
          : "No subtitles — video will render without captions",
    },
    {
      label: "Scene Timeline",
      description: "Scene order and durations defined",
      status: scenes.length > 0 ? "ok" : "missing",
      detail:
        scenes.length > 0
          ? `${scenes.length} scenes`
          : "Not defined — complete the Scenes step",
    },
  ];

  const criticalMissing = checks.some((c) => c.status === "missing");
  const previewImage = successImages[0]?.imageUrl;

  const iconFor = (status: AssetCheck["status"]) => {
    if (status === "ok") return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
    if (status === "warn") return <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />;
    return <XCircle className="w-5 h-5 text-rose-400 shrink-0" />;
  };

  return (
    <div className="flex flex-col h-full gap-5">
      <div className="flex items-center gap-2">
        <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
          Step 9 — Composition
        </span>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 min-h-0">
        {/* LEFT: Asset checklist */}
        <div className="flex flex-col gap-4">
          <div className="p-5 rounded-2xl bg-[#0d0d0d] border border-white/[0.06]">
            <p className="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-4">
              Asset Validation
            </p>
            <div className="space-y-3">
              {checks.map((check) => (
                <motion.div
                  key={check.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-start gap-3 p-4 rounded-xl border ${
                    check.status === "ok"
                      ? "border-emerald-500/15 bg-emerald-500/[0.04]"
                      : check.status === "warn"
                      ? "border-amber-500/15 bg-amber-500/[0.04]"
                      : "border-rose-500/15 bg-rose-500/[0.04]"
                  }`}
                >
                  {iconFor(check.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">{check.label}</p>
                      <span
                        className={`text-[10px] font-mono shrink-0 ${
                          check.status === "ok"
                            ? "text-emerald-400"
                            : check.status === "warn"
                            ? "text-amber-400"
                            : "text-rose-400"
                        }`}
                      >
                        {check.detail}
                      </span>
                    </div>
                    <p className="text-xs text-white/35 mt-0.5">{check.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Summary pill */}
          <div
            className={`p-4 rounded-2xl border flex items-center gap-3 ${
              criticalMissing
                ? "bg-rose-500/[0.06] border-rose-500/20"
                : "bg-emerald-500/[0.06] border-emerald-500/20"
            }`}
          >
            <Layers
              className={`w-5 h-5 shrink-0 ${criticalMissing ? "text-rose-400" : "text-emerald-400"}`}
            />
            <div>
              <p className={`text-sm font-bold ${criticalMissing ? "text-rose-300" : "text-emerald-300"}`}>
                {criticalMissing
                  ? "Missing required assets"
                  : "All critical assets ready"}
              </p>
              <p className="text-xs text-white/30 mt-0.5">
                {criticalMissing
                  ? "Complete the missing steps before proceeding to the Editor."
                  : "You can proceed to the Editor to review subtitles and scene order."}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: Preview */}
        <div className="flex flex-col gap-4">
          <div className="relative rounded-2xl overflow-hidden bg-[#080808] border border-white/[0.06] flex-1 min-h-[200px]">
            {previewImage ? (
              <>
                <img
                  src={previewImage}
                  alt="Scene preview"
                  className="w-full h-full object-cover opacity-70"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  Scene 1 preview
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-center p-6">
                <Layers className="w-10 h-10 text-white/10" />
                <p className="text-xs text-white/20">No preview available</p>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-[#0d0d0d] border border-white/[0.06] space-y-2">
            <p className="text-[10px] uppercase tracking-widest font-bold text-white/30">Project</p>
            <p className="text-sm font-bold text-white truncate">{projectTitle}</p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <p className="text-[10px] text-white/25">Scenes</p>
                <p className="text-sm font-bold text-white">{scenes.length}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/25">Images ready</p>
                <p className={`text-sm font-bold ${successImages.length === scenes.length ? "text-emerald-400" : "text-amber-400"}`}>
                  {successImages.length}/{scenes.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-between pt-4 border-t border-white/[0.04]">
        <p className="text-xs text-white/30">
          {criticalMissing
            ? "Fix missing assets before continuing"
            : "Assets validated — ready for the editor"}
        </p>
        <motion.button
          whileHover={!criticalMissing ? { y: -1 } : {}}
          whileTap={!criticalMissing ? { y: 0 } : {}}
          onClick={!criticalMissing ? onApprove : undefined}
          disabled={criticalMissing}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[13px] tracking-wide transition-all bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.3)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          Proceed to Editor <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
};
