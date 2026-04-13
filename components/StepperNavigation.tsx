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
    <div className="w-60 border-r border-white/[0.04] bg-[#0a0a0a] py-8 px-5 flex flex-col shrink-0 h-full z-10">
      <h2 className="text-[9px] uppercase tracking-[0.35em] font-bold text-white/20 mb-8 pl-1">Pipeline</h2>

      <div className="relative flex-1">
        {/* Vertical connector line */}
        <div className="absolute left-[14px] top-3 bottom-6 w-px bg-gradient-to-b from-white/[0.08] via-white/[0.04] to-transparent" />

        <div className="flex flex-col gap-0.5">
          {STEPS.map((stepId, index) => {
            const isAccessible = index <= globalCurrentIndex;
            const isViewing = viewingStep === stepId;
            const status = project?.steps?.[stepId]?.status || "pending";
            const stepNum = STEP_NUMBERS[stepId];

            let nodeClasses = "bg-[#111] border-white/[0.06] text-white/15";
            let labelColor = "text-white/25";
            let statusLabel = "pending";
            let icon = <Circle className="w-2.5 h-2.5" />;

            if (status === "approved") {
              nodeClasses = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
              labelColor = "text-emerald-400/80";
              statusLabel = "approved";
              icon = <Check className="w-2.5 h-2.5" />;
            } else if (status === "editing") {
              nodeClasses = "bg-amber-500/10 border-amber-500/20 text-amber-400";
              labelColor = "text-amber-400/80";
              statusLabel = "in-progress";
              icon = <CircleDot className="w-2.5 h-2.5" />;
            } else if (isAccessible) {
              nodeClasses = "bg-white/[0.04] border-white/10 text-white/40";
              labelColor = "text-white/50";
              statusLabel = "ready";
            }

            if (!isAccessible) {
              icon = <Lock className="w-2 h-2" />;
              statusLabel = "locked";
            }

            return (
              <motion.button
                key={stepId}
                disabled={!isAccessible}
                onClick={() => setViewingStep(stepId)}
                whileHover={isAccessible ? { x: 2 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={cn(
                  "flex items-center gap-3.5 text-left py-2.5 px-1 rounded-xl transition-all duration-200 relative group w-full",
                  !isAccessible && "opacity-20 cursor-not-allowed",
                  isViewing && "bg-white/[0.03]"
                )}
              >
                {/* Step number node */}
                <div className="relative z-10 shrink-0">
                  <div className={cn(
                    "w-[28px] h-[28px] rounded-full border flex items-center justify-center transition-all duration-300",
                    nodeClasses,
                    isViewing && "ring-[2px] ring-indigo-500/40 ring-offset-1 ring-offset-[#0a0a0a] shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                  )}>
                    {icon}
                  </div>
                  {/* Step number label */}
                  {isViewing && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-indigo-500 text-white text-[7px] font-black flex items-center justify-center">
                      {stepNum}
                    </span>
                  )}
                </div>

                {/* Label */}
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className={cn(
                    "text-[12px] font-semibold tracking-tight transition-colors duration-200 truncate",
                    isViewing ? "text-white" : labelColor
                  )}>
                    {STEP_LABELS[stepId]}
                  </span>
                  <span className={cn(
                    "text-[9px] tracking-wider uppercase font-medium transition-colors duration-200",
                    isViewing ? "text-indigo-400/70" : "text-white/[0.12]"
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
