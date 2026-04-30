"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Loader2, CheckCircle, XCircle, ChevronLeft, Cloud, AlertCircle, PlaySquare, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  projectId: string;
  projectTitle: string;
  initialRenderData?: any;
  onComplete: (videoUrl?: string) => void;
}

type RenderState = "selecting" | "rendering" | "complete" | "error";

const QUALITY_OPTIONS = [
  { id: "720p", label: "720p", size: "~50MB", icon: "⚡", desc: "Fast export" },
  {
    id: "1080p", label: "1080p", size: "~150MB", icon: "★",
    desc: "Recommended", recommended: true
  },
  { id: "4k", label: "Cinematic 4K", size: "~1.2 GB", icon: "🎬", desc: "Lossless HDR", pro: true },
];

export const RenderStepPanel = ({ projectId, projectTitle, initialRenderData, onComplete }: Props) => {
  const [renderState, setRenderState] = useState<RenderState>("selecting");
  const [selectedQuality, setSelectedQuality] = useState("1080p");
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState("Initializing...");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [ytStatus, setYtStatus] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");

  useEffect(() => {
    async function fetchChannels() {
      try {
        const res = await fetch("/api/youtube/channels");
        if (res.ok) {
          const data = await res.json();
          if (data.channels?.length > 0) {
            setChannels(data.channels);
            setSelectedChannelId(data.channels[0].channelId);
          }
        }
      } catch (e) {}
    }
    fetchChannels();
  }, []);

  useEffect(() => {
    if (initialRenderData?.status === "completed" && initialRenderData?.videoUrl) {
      setRenderState("complete");
      setVideoUrl(initialRenderData.videoUrl);
      if (initialRenderData.quality) setSelectedQuality(initialRenderData.quality);
    } else if (initialRenderData?.status === "rendering" || initialRenderData?.status === "queued" || initialRenderData?.status === "encoding") {
      setRenderState("rendering");
    } else if (initialRenderData?.status === "failed") {
      setRenderState("error");
      setErrorMsg(initialRenderData.error || "Previous render failed.");
    }
  }, [initialRenderData]);

  const startRender = async () => {
    try {
      setRenderState("rendering");
      setProgress(0);
      setElapsed(0);
      setPhase("Starting render job...");
      setErrorMsg(null);

      const res = await fetch("/api/ai/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, quality: selectedQuality }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to start render");
      }
    } catch (err: any) {
      setRenderState("error");
      setErrorMsg(err.message);
    }
  };

  useEffect(() => {
    if (renderState !== "rendering") return;

    let timer: NodeJS.Timeout;
    
    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/ai/render/status?projectId=${projectId}`);
        if (!res.ok) return;
        
        const data = await res.json();
        
        if (data.status === "completed" || data.status === "complete") {
          setProgress(100);
          setPhase("Complete");
          setVideoUrl(data.videoUrl);
          setTimeout(() => setRenderState("complete"), 600);
        } else if (data.status === "failed") {
          setRenderState("error");
          setErrorMsg(data.error || "Render failed during processing");
        } else if (data.status === "rendering" || data.status === "encoding" || data.status === "queued") {
          setProgress(data.progress || 0);
          setPhase(data.phase || "Processing...");
          setElapsed(data.elapsedSeconds || 0);
        }
      } catch (err) {
        // ignore fetch errors, keep polling
      }
    };

    pollStatus();
    timer = setInterval(pollStatus, 2000);

    return () => clearInterval(timer);
  }, [renderState, projectId]);

  const formatTime = (s: number) => {
    if (!s) return "0m 0s";
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  const handleYoutubeUpload = async (isSchedule = false) => {
    if (!videoUrl) return;
    setIsUploading(true);
    setYtStatus(isSchedule ? "Scheduling..." : "Uploading...");
    
    try {
      const endpoint = isSchedule ? "/api/youtube/schedule" : "/api/youtube/upload";
      const payload = isSchedule 
        ? { projectId, scheduledAtISO: new Date(scheduleDate).toISOString(), channelId: selectedChannelId, title: projectTitle, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }
        : { videoUrl, title: projectTitle, channelId: selectedChannelId };
        
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setYtStatus(isSchedule ? "Scheduled successfully!" : "Uploaded successfully!");
    } catch (e: any) {
      setYtStatus(`Error: ${e.message}`);
    } finally {
      setIsUploading(false);
    }
  };

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
                onClick={startRender}
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
                  <p className="text-sm text-white/40 mt-1 animate-pulse">{phase}</p>
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

              <div className="flex items-center gap-4 text-xs text-white/30">
                <span><Loader2 className="w-3 h-3 inline animate-spin mr-1"/> Rendering on Cloud GPU</span>
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

        {/* STATE: ERROR */}
        {renderState === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-8 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-center"
          >
            <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
            <h3 className="text-2xl font-black text-white mb-2">Render Failed</h3>
            <p className="text-rose-400/80 mb-6 max-w-md">{errorMsg}</p>
            <button
              onClick={() => setRenderState("selecting")}
              className="px-6 py-3 rounded-xl bg-rose-500/20 text-rose-400 font-bold hover:bg-rose-500/30 transition-all"
            >
              Try Again
            </button>
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
            <div className="flex-1 p-6 rounded-2xl bg-[#0d0d0d] border border-white/[0.06] flex flex-col items-center justify-center space-y-6">
              <div className="flex items-center gap-3">
                 <motion.div
                   initial={{ scale: 0 }}
                   animate={{ scale: 1 }}
                   transition={{ type: "spring", stiffness: 200, damping: 15 }}
                 >
                   <CheckCircle className="w-8 h-8 text-emerald-400" />
                 </motion.div>
                 <h3 className="text-2xl font-black text-white">Render Complete!</h3>
              </div>
              
              {videoUrl ? (
                <div className="w-full max-w-2xl aspect-video rounded-xl overflow-hidden bg-black border border-white/10 shadow-2xl relative group">
                  <video 
                    src={videoUrl} 
                    controls 
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-full max-w-2xl aspect-video rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <p className="text-white/40">Video preview unavailable</p>
                </div>
              )}

              {videoUrl && (
                <div className="w-full max-w-2xl bg-[#111] border border-white/10 p-4 rounded-xl flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white font-bold">
                      <PlaySquare className="w-5 h-5 text-red-500" />
                      Publish to YouTube
                    </div>
                    {channels.length > 0 ? (
                      <select 
                        value={selectedChannelId} 
                        onChange={e => setSelectedChannelId(e.target.value)}
                        className="bg-black border border-white/20 text-white rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        {channels.map((c: any) => (
                          <option key={c.channelId} value={c.channelId}>{c.channelName}</option>
                        ))}
                      </select>
                    ) : (
                      <a href="/api/youtube/auth" className="text-sm text-red-400 hover:underline">Connect Channel</a>
                    )}
                  </div>
                  
                  {channels.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button 
                        onClick={() => handleYoutubeUpload(false)}
                        disabled={isUploading}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold flex justify-center items-center gap-2 disabled:opacity-50"
                      >
                        {isUploading && ytStatus === "Uploading..." ? <Loader2 className="w-4 h-4 animate-spin"/> : <PlaySquare className="w-4 h-4"/>}
                        Upload Now
                      </button>
                      <div className="flex-1 flex gap-2">
                        <input 
                          type="datetime-local" 
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="w-2/3 bg-black border border-white/20 rounded-lg px-3 text-sm text-white"
                        />
                        <button 
                          onClick={() => handleYoutubeUpload(true)}
                          disabled={!scheduleDate || isUploading}
                          className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg font-semibold flex justify-center items-center gap-2 disabled:opacity-50"
                        >
                          <Calendar className="w-4 h-4"/>
                          Schedule
                        </button>
                      </div>
                    </div>
                  )}
                  {ytStatus && <p className="text-xs text-center font-medium text-white/60">{ytStatus}</p>}
                </div>
              )}

              <div className="flex gap-4 w-full max-w-2xl pt-2">
                {videoUrl && (
                  <motion.a
                    href={videoUrl}
                    download={`project_${projectId}.mp4`}
                    target="_blank"
                    rel="noreferrer"
                    whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(16,185,129,0.2)" }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-emerald-500 text-white font-bold text-lg shadow-lg"
                  >
                    <Download className="w-5 h-5" /> Download Video
                  </motion.a>
                )}
                <button 
                  onClick={() => {
                    onComplete(videoUrl || undefined);
                    router.push("/dashboard");
                  }}
                  className="flex-1 px-6 py-4 rounded-xl border border-white/10 text-white font-semibold text-lg hover:bg-white/[0.04] transition-all text-center"
                >
                  Finish Project
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
