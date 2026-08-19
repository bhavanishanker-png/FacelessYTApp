"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ImageIcon,
  ChevronRight,
  Loader2,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  Check,
  Palette,
  Film,
  Paintbrush,
  Minimize2,
  Wand2,
  Zap,
  Star,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────

type ImageStyle = "cinematic" | "anime" | "realistic" | "minimal";
type ImageProvider = "auto" | "pollinations-flux" | "pollinations-realism" | "pollinations-pro";

interface SceneInput {
  sceneNumber?: number;
  text?: string;
  narration?: string;
  prompt?: string;
  imagePrompt?: string;
  duration?: number;
}

interface GeneratedImage {
  sceneId: string;
  imageUrl: string;
  prompt: string;
  status: "success" | "failed" | "pending";
  error?: string;
}

interface Props {
  projectId: string;
  scenes: SceneInput[];
  stepData?: any;
  onAutoSave?: (data: any) => void;
  onApprove: (images?: GeneratedImage[]) => Promise<void>;
}

// ─── Model Options ────────────────────────────────────────────

const MODEL_OPTIONS: {
  value: ImageProvider;
  label: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  desc: string;
  badge?: string;
}[] = [
  {
    value: "auto",
    label: "HuggingFace SD3",
    icon: Cpu,
    color: "text-indigo-400",
    gradient: "from-indigo-500/20 to-violet-500/10",
    desc: "SD3 primary, Pollinations fallback",
    badge: "Best",
  },
  {
    value: "pollinations-flux",
    label: "Flux",
    icon: Zap,
    color: "text-yellow-400",
    gradient: "from-yellow-500/20 to-amber-500/10",
    desc: "Fast & free via Pollinations",
    badge: "Free",
  },
  {
    value: "pollinations-realism",
    label: "Flux Realism",
    icon: ImageIcon,
    color: "text-emerald-400",
    gradient: "from-emerald-500/20 to-teal-500/10",
    desc: "Photorealistic Pollinations model",
    badge: "Free",
  },
  {
    value: "pollinations-pro",
    label: "Flux Pro",
    icon: Star,
    color: "text-rose-400",
    gradient: "from-rose-500/20 to-pink-500/10",
    desc: "Highest quality Pollinations model",
    badge: "Free",
  },
];

// ─── Style Options ────────────────────────────────────────────

const STYLE_OPTIONS: {
  value: ImageStyle;
  label: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  desc: string;
}[] = [
  {
    value: "cinematic",
    label: "Cinematic",
    icon: Film,
    color: "text-amber-400",
    gradient: "from-amber-500/20 to-orange-500/10",
    desc: "Film-grade dramatic lighting",
  },
  {
    value: "anime",
    label: "Anime",
    icon: Paintbrush,
    color: "text-pink-400",
    gradient: "from-pink-500/20 to-purple-500/10",
    desc: "Studio Ghibli inspired",
  },
  {
    value: "realistic",
    label: "Realistic",
    icon: ImageIcon,
    color: "text-emerald-400",
    gradient: "from-emerald-500/20 to-teal-500/10",
    desc: "Photorealistic DSLR quality",
  },
  {
    value: "minimal",
    label: "Minimal",
    icon: Minimize2,
    color: "text-sky-400",
    gradient: "from-sky-500/20 to-blue-500/10",
    desc: "Clean vector illustration",
  },
];

// ─── Skeleton Loader ──────────────────────────────────────────

function ImageSkeleton({ index }: { index: number }) {
  return (
    <div className="rounded-2xl bg-[#111] border border-white/[0.06] overflow-hidden">
      <div className="aspect-video bg-[#0a0a0a] relative overflow-hidden">
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)",
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)",
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)",
            ],
            backgroundPosition: ["-200% 0", "200% 0", "-200% 0"],
          }}
          transition={{ duration: 2, repeat: Infinity, delay: index * 0.15 }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <motion.div
            className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center"
            animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
          >
            <Wand2 className="w-4 h-4 text-indigo-400/50" />
          </motion.div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-bold">
            Generating Scene {String(index + 1).padStart(2, "0")}
          </span>
        </div>
      </div>
      <div className="p-4 space-y-2">
        <div className="h-3 bg-white/[0.03] rounded-full w-3/4" />
        <div className="h-3 bg-white/[0.03] rounded-full w-1/2" />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────

export const ImagesStepPanel = ({
  projectId,
  scenes,
  stepData,
  onAutoSave,
  onApprove,
}: Props) => {
  const [style, setStyle] = useState<ImageStyle>(stepData?.style || "cinematic");
  const [provider, setProvider] = useState<ImageProvider>(stepData?.provider || "auto");
  const [images, setImages] = useState<GeneratedImage[]>(() => {
    if (stepData?.data && Array.isArray(stepData.data) && stepData.data.length > 0) {
      return stepData.data;
    }
    return [];
  });
  const [isGenerating, setIsGenerating] = useState(() =>
    stepData?.status === "generating"
  );
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasImages = images.length > 0 && images.some((i) => i.status === "success");
  const successCount = images.filter((i) => i.status === "success").length;
  const failedCount = images.filter((i) => i.status === "failed").length;

  // ── Build scenes payload ──────────────────────────────────────
  const buildScenesPayload = useCallback(() => {
    return scenes.map((s, idx) => ({
      sceneId: `scene_${idx + 1}`,
      prompt: s.prompt || s.imagePrompt || "",
      text: s.text || s.narration || "",
      duration: s.duration || 5,
    }));
  }, [scenes]);

  // ── Poll progress from backend ────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/ai/images?projectId=${projectId}`);
        if (!res.ok) return;
        const data = await res.json();

        if (Array.isArray(data.images) && data.images.length > 0) {
          setImages(data.images);
          const pct = data.total > 0 ? (data.completed / data.total) * 100 : 0;
          setProgress(pct);
        }

        if (data.status === "complete") {
          stopPolling();
          setIsGenerating(false);
          setProgress(100);
          if (onAutoSave) {
            onAutoSave({ data: data.images, style, status: "editing" });
          }
        } else if (data.status === "failed") {
          stopPolling();
          setIsGenerating(false);
          setError("Image generation failed. Please try again.");
          setImages([]);
        }
      } catch {
        // keep polling on transient errors
      }
    }, 2000);
  }, [projectId, style, onAutoSave, stopPolling]);

  // Resume polling if we load with status "generating"
  useEffect(() => {
    if (stepData?.status === "generating") {
      startPolling();
    }
    return stopPolling;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Generate All Images ────────────────────────────────────────
  const handleGenerateAll = useCallback(async () => {
    if (isGenerating || !scenes?.length) return;

    setIsGenerating(true);
    setError(null);
    setProgress(0);

    const placeholders: GeneratedImage[] = scenes.map((_, idx) => ({
      sceneId: `scene_${idx + 1}`,
      imageUrl: "",
      prompt: scenes[idx].prompt || scenes[idx].imagePrompt || "",
      status: "pending",
    }));
    setImages(placeholders);

    try {
      const res = await fetch("/api/ai/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, scenes: buildScenesPayload(), style, provider }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setError(
          res.status === 429
            ? "Rate limited — please wait a moment and try again."
            : result.error || "Failed to start image generation."
        );
        setImages([]);
        setIsGenerating(false);
        return;
      }

      // Backend accepted the job — start polling for real progress
      startPolling();
    } catch (err) {
      console.error("[ImagesStepPanel] Generation error:", err);
      setError("Network error — please check your connection.");
      setImages([]);
      setIsGenerating(false);
    }
  }, [isGenerating, scenes, projectId, style, buildScenesPayload, startPolling]);

  // ── Regenerate Single Scene ─────────────────────────────────
  const handleRegenerate = useCallback(
    async (sceneId: string) => {
      if (regeneratingId) return;

      setRegeneratingId(sceneId);
      setError(null);

      // Mark as pending in UI
      setImages((prev) =>
        prev.map((img) =>
          img.sceneId === sceneId ? { ...img, status: "pending" as const, error: undefined } : img
        )
      );

      try {
        const res = await fetch("/api/ai/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            sceneId,
            style,
            provider,
          }),
        });

        const result = await res.json();

        if (!res.ok || !result.success) {
          setImages((prev) =>
            prev.map((img) =>
              img.sceneId === sceneId
                ? { ...img, status: "failed" as const, error: result.error || "Regeneration failed" }
                : img
            )
          );
          return;
        }

        setImages((prev) =>
          prev.map((img) =>
            img.sceneId === sceneId
              ? {
                  ...img,
                  imageUrl: result.data.imageUrl,
                  status: result.data.status,
                  error: result.data.error,
                }
              : img
          )
        );

        // Auto-save after regen
        if (onAutoSave) {
          const updated = images.map((img) =>
            img.sceneId === sceneId
              ? { ...img, imageUrl: result.data.imageUrl, status: result.data.status }
              : img
          );
          onAutoSave({ data: updated, style, status: "editing" });
        }
      } catch (err) {
        console.error("[ImagesStepPanel] Regen error:", err);
        setImages((prev) =>
          prev.map((img) =>
            img.sceneId === sceneId
              ? { ...img, status: "failed" as const, error: "Network error" }
              : img
          )
        );
      } finally {
        setRegeneratingId(null);
      }
    },
    [regeneratingId, projectId, style, images, onAutoSave]
  );

  return (
    <div className="flex flex-col h-full relative z-10 w-full">
      {/* ── Header ── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-400/70">
            Step 5
          </span>
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
          Image Generation
        </h2>
        <p className="text-white/35 text-[15px] font-medium leading-relaxed max-w-lg">
          Generate stunning visuals for each scene with AI. Choose a style and craft your visual
          narrative.
        </p>
      </div>

      {/* ── Error Banner ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="mb-6 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="text-[13px] text-rose-300 font-medium flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-rose-400/50 hover:text-rose-400 transition-colors text-xs font-bold"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Settings Toolbar ── */}
      <div className="mb-4 flex items-center gap-2 p-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex-wrap">
        {/* Style group */}
        <span className="text-[9px] font-bold uppercase tracking-widest text-white/20 pl-1 pr-0.5 shrink-0">Style</span>
        {STYLE_OPTIONS.map((opt) => {
          const isActive = style === opt.value;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              onClick={() => setStyle(opt.value)}
              title={opt.desc}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-150",
                isActive
                  ? `bg-white/10 ${opt.color} border border-white/15`
                  : "text-white/30 hover:text-white/55 hover:bg-white/[0.05]"
              )}
            >
              <Icon className="w-3 h-3" />
              {opt.label}
            </button>
          );
        })}

        {/* Divider */}
        <div className="w-px h-5 bg-white/[0.08] mx-1 shrink-0" />

        {/* Model group */}
        <span className="text-[9px] font-bold uppercase tracking-widest text-white/20 pr-0.5 shrink-0">Model</span>
        {MODEL_OPTIONS.map((opt) => {
          const isActive = provider === opt.value;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              onClick={() => setProvider(opt.value)}
              title={opt.desc}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-150",
                isActive
                  ? `bg-white/10 ${opt.color} border border-white/15`
                  : "text-white/30 hover:text-white/55 hover:bg-white/[0.05]"
              )}
            >
              <Icon className="w-3 h-3" />
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* ── Generate Button ── */}
      {!hasImages && !isGenerating && (
        <button
          onClick={handleGenerateAll}
          disabled={!scenes?.length}
          className={cn(
            "w-full py-4 rounded-xl font-bold text-[13px] tracking-wide flex items-center justify-center gap-2.5 transition-all mb-6 h-[52px]",
            !scenes?.length 
              ? "bg-white/[0.05] border border-white/[0.1] text-white/40 cursor-not-allowed hover:shadow-none hover:translate-y-0"
              : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.3)] hover:-translate-y-0.5 active:translate-y-0"
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Generate All Images ({scenes?.length || 0} Scenes)
        </button>
      )}

      {/* ── Progress Bar (during generation) ── */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-bold">
                {images.filter((i) => i.status !== "pending").length} / {images.length} images ready...
              </span>
              <span className="text-[12px] font-mono font-bold text-indigo-400">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Empty State ── */}
      {!hasImages && !isGenerating && images.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/[0.04] min-h-[240px]">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.02] flex items-center justify-center border border-white/[0.04]">
            <Palette className="w-6 h-6 text-white/10" />
          </div>
          <p className="text-white/15 font-medium text-sm text-center max-w-xs">
            {scenes?.length
              ? "Choose a style and generate images for your scenes."
              : "Complete the Scenes step first to generate images."}
          </p>
        </div>
      )}

      {/* ── Image Gallery Grid ── */}
      {(images.length > 0 || isGenerating) && (
        <div className="flex-1 overflow-y-auto hide-scrollbar mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(isGenerating && images.every((i) => i.status === "pending")
              ? images
              : images
            ).map((img, idx) => {
              const isPending = img.status === "pending";
              const isFailed = img.status === "failed";
              const isSuccess = img.status === "success";
              const isThisRegenerating = regeneratingId === img.sceneId;

              if (isPending && !isThisRegenerating) {
                return <ImageSkeleton key={img.sceneId || idx} index={idx} />;
              }

              if (isThisRegenerating) {
                return <ImageSkeleton key={img.sceneId || idx} index={idx} />;
              }

              return (
                <motion.div
                  key={img.sceneId || idx}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06, duration: 0.35 }}
                  className="rounded-2xl bg-[#111] border border-white/[0.06] overflow-hidden group"
                >
                  {/* Image Area */}
                  <div className="relative aspect-video bg-[#0a0a0a]">
                    {isSuccess && img.imageUrl ? (
                      <>
                        <img
                          src={img.imageUrl}
                          alt={`Scene ${idx + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        {/* Regenerate button */}
                        <button
                          onClick={() => handleRegenerate(img.sceneId)}
                          className="absolute top-3 right-3 p-2 rounded-xl bg-black/50 backdrop-blur-md border border-white/10
                                     opacity-0 group-hover:opacity-100 transition-all duration-300
                                     hover:bg-white/10 hover:border-white/20 text-white/60 hover:text-white"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        {/* Scene badge */}
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md border border-white/10">
                          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/70">
                            Scene {String(idx + 1).padStart(2, "0")}
                          </span>
                        </div>
                        {/* Success indicator */}
                        <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center backdrop-blur-md">
                          <Check className="w-3 h-3 text-emerald-400" />
                        </div>
                      </>
                    ) : isFailed ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                        </div>
                        <p className="text-[11px] text-rose-300/70 font-medium text-center max-w-[200px]">
                          {img.error || "Generation failed"}
                        </p>
                        <button
                          onClick={() => handleRegenerate(img.sceneId)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] font-bold hover:bg-rose-500/20 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Retry
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {/* Scene Info */}
                  <div className="p-4 space-y-2.5">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.15em] text-white/20 font-bold mb-1">
                        Prompt Used
                      </p>
                      <div className="bg-[#0a0a0a] rounded-lg p-2.5">
                        <p className="text-[10px] text-white/35 leading-relaxed font-mono line-clamp-3">
                          {img.prompt || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      {hasImages && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="pt-5 mt-2 border-t border-white/[0.04] flex items-center justify-between"
        >
          {/* Stats */}
          <div className="flex items-center gap-4 text-[11px] font-mono text-white/20">
            <span className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-emerald-400" />
              {successCount} generated
            </span>
            {failedCount > 0 && (
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                {failedCount} failed
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Regenerate All */}
            <button
              onClick={handleGenerateAll}
              disabled={isGenerating}
              className="px-4 py-2.5 rounded-xl font-bold text-[12px] tracking-wide flex items-center gap-2
                         bg-white/[0.03] border border-white/[0.06] text-white/40
                         hover:bg-white/[0.05] hover:text-white/60 hover:border-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Regenerate All
            </button>

            {/* Approve */}
            <button
              onClick={async () => {
                if (isApproving) return;
                setIsApproving(true);
                await onApprove(images);
                setIsApproving(false);
              }}
              disabled={isApproving || isGenerating}
              className={cn(
                "px-6 py-2.5 rounded-xl font-bold text-[13px] tracking-wide flex items-center gap-2 transition-all",
                !isApproving && !isGenerating
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.3)] hover:-translate-y-0.5 active:translate-y-0"
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
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
