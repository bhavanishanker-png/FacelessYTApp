"use client";
import React from "react";
import { motion } from "framer-motion";
import { Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActiveModelInfo } from "@/lib/ai";

const REASON_TEXT: Record<ActiveModelInfo["reason"], string> = {
  weekday: "Weekdays run on Claude",
  weekend: "Weekends run on Groq",
  forced: "Pinned via AI_PROVIDER",
};

const POLL_MS = 30_000;

/**
 * Small pill showing which LLM is serving generations right now.
 * Renders nothing until the model is known, so it never flashes a wrong value.
 */
export const ModelBadge = () => {
  const [info, setInfo] = React.useState<ActiveModelInfo | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const load = () =>
      fetch("/api/ai/model")
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (!cancelled && json?.success) setInfo(json.data as ActiveModelInfo);
        })
        .catch(() => {
          /* badge is cosmetic — stay hidden if this fails */
        });

    load();
    // Re-check so a mid-session fallback shows up without a page reload.
    const timer = setInterval(load, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  if (!info) return null;

  const isClaude = info.provider === "anthropic";
  const tooltip = info.fellBack
    ? `Claude unavailable — fell back to Groq · ${info.model}`
    : `${REASON_TEXT[info.reason]} · ${info.model}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      title={tooltip}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border",
        info.fellBack ? "border-amber-400/20" : "border-white/[0.04]"
      )}
    >
      <span className="relative flex w-1.5 h-1.5 shrink-0">
        <span
          className={cn(
            "absolute inline-flex w-full h-full rounded-full opacity-60 animate-ping",
            isClaude ? "bg-indigo-400" : "bg-amber-400"
          )}
        />
        <span
          className={cn(
            "relative inline-flex w-1.5 h-1.5 rounded-full",
            isClaude ? "bg-indigo-400" : "bg-amber-400"
          )}
        />
      </span>
      <Cpu className="w-3 h-3 text-white/20 shrink-0" />
      <span className="text-[10px] font-semibold tracking-wide text-white/40 truncate">
        {info.label}
      </span>
    </motion.div>
  );
};
