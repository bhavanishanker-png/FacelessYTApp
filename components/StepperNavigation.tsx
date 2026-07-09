"use client";
import React from "react";
import { motion } from "framer-motion";
import { Check, CircleDot, Circle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export const STEPS = [
  "idea", "hook", "script", "scenes",
  "images", "animation", "voice",
  "subtitles", "composition", "editor", "render"
] as const;

export type StepValue = typeof STEPS[number];

export const STEP_LABELS: Record<StepValue, string> = {
  idea: "Concept",
  hook: "Hook",
  script: "Script",
  scenes: "Scenes",
  images: "Images",
  animation: "Animate",
  voice: "Voice",
  subtitles: "Subtitles",
  composition: "Compose",
  editor: "Editor",
  render: "Export",
};

export const STEP_NUMBERS: Record<StepValue, number> = {
  idea: 1, hook: 2, script: 3, scenes: 4,
  images: 5, animation: 6, voice: 7,
  subtitles: 8, composition: 9, editor: 10, render: 11,
};

export const StepperNavigation = ({
  project,
  viewingStep,
  setViewingStep,
}: {
  project: any;
  viewingStep: StepValue;
  setViewingStep: (step: StepValue) => void;
}) => {
  const currentStepId = project.currentStep as StepValue;
  const globalCurrentIndex = STEPS.indexOf(currentStepId) !== -1
    ? STEPS.indexOf(currentStepId)
    : 0;

  return (
    <div className="hidden md:flex w-60 border-r border-white/[0.04] bg-[#0a0a0a] py-8 px-5 flex-col shrink-0 h-full z-10">
      <h2 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/20 mb-8 pl-1">Workflow Pipeline</h2>

      <div className="relative flex-1 overflow-y-auto hide-scrollbar">
        {/* Vertical connector line */}
        <div className="absolute left-[15px] top-3 bottom-6 w-px bg-gradient-to-b from-white/[0.08] via-white/[0.04] to-transparent" />

        <div className="flex flex-col gap-1 relative z-10">
          {STEPS.map((stepId, index) => {
            const isAccessible = index <= globalCurrentIndex;
            const isViewing = viewingStep === stepId;
            const stepNum = STEP_NUMBERS[stepId];

            const rawStatus = (project?.steps?.[stepId]?.status || "pending").toLowerCase();
            let statusLabel = rawStatus;

            let nodeClasses = "bg-[#111] border-white/[0.06] text-white/15";
            let labelColor = "text-white/25";
            let icon = <Circle className="w-2.5 h-2.5" />;

            if (["completed", "success", "approved", "done"].includes(rawStatus)) {
              nodeClasses = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
              labelColor = "text-emerald-400/80";
              icon = <Check className="w-3 h-3" />;
            } else if (["editing", "in-progress", "rendering", "generating"].includes(rawStatus)) {
              nodeClasses = "bg-amber-500/10 border-amber-500/20 text-amber-400";
              labelColor = "text-amber-400/80";
              icon = <CircleDot className="w-3 h-3" />;
            } else if (["failed", "error"].includes(rawStatus)) {
              nodeClasses = "bg-rose-500/10 border-rose-500/20 text-rose-400";
              labelColor = "text-rose-400/80";
            } else if (isAccessible) {
              nodeClasses = "bg-white/[0.04] border-white/10 text-white/40";
              labelColor = "text-white/50";
            }

            if (!isAccessible) {
              icon = <Lock className="w-2.5 h-2.5" />;
              statusLabel = "locked";
            }

            return (
              <motion.button
                key={stepId}
                disabled={!isAccessible}
                onClick={() => setViewingStep(stepId)}
                whileHover={isAccessible ? { x: 4 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={cn(
                  "flex items-center gap-4 text-left py-2.5 px-2 rounded-xl transition-all duration-200 relative group w-full",
                  !isAccessible && "opacity-30 cursor-not-allowed",
                  isViewing && "bg-white/[0.03]"
                )}
              >
                {/* Active Indicator Line */}
                {isViewing && (
                  <motion.div
                    layoutId="stepper-active"
                    className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r-full bg-indigo-500"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Step number node */}
                <div className="relative shrink-0">
                  <div className={cn(
                    "w-[30px] h-[30px] rounded-full border flex items-center justify-center transition-all duration-300",
                    nodeClasses,
                    isViewing && "ring-[2px] ring-indigo-500/40 ring-offset-2 ring-offset-[#0a0a0a] shadow-[0_0_15px_rgba(99,102,241,0.25)] bg-indigo-500/10 border-indigo-500/30 text-indigo-400",
                    isViewing && ["completed", "success", "approved", "done"].includes(rawStatus) && "ring-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.25)] text-emerald-400",
                  )}>
                    {icon}
                  </div>
                  {/* Step number label (hide if completed to show checkmark cleanly, or show always?) */}
                  {isViewing && (
                    <span className={cn(
                      "absolute -top-1 -right-1 w-[14px] h-[14px] rounded-full text-[8px] font-black flex items-center justify-center shadow-lg",
                      ["completed", "success", "approved", "done"].includes(rawStatus) ? "bg-emerald-500 text-emerald-950" : "bg-indigo-500 text-indigo-50"
                    )}>
                      {stepNum}
                    </span>
                  )}
                </div>

                {/* Label */}
                <div className="flex flex-col min-w-0">
                  <span className={cn(
                    "text-[13px] font-bold tracking-wide transition-colors duration-200 truncate",
                    isViewing ? "text-white" : labelColor,
                    !isViewing && isAccessible && "group-hover:text-white/80"
                  )}>
                    {STEP_LABELS[stepId]}
                  </span>
                  <span className={cn(
                    "text-[9px] tracking-[0.15em] uppercase font-bold transition-colors duration-200",
                    isViewing ? "text-indigo-400" : "text-white/[0.15]"
                  )}>
                    {isViewing ? `Step ${stepNum}` : statusLabel}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
