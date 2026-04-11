"use client";
import React from "react";
import { motion } from "framer-motion";
import { Check, CircleDot, Circle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["idea", "hook", "script", "scenes", "voice", "video"] as const;
type StepValue = typeof STEPS[number];

const STEP_LABELS: Record<StepValue, string> = {
  idea: "Concept",
  hook: "Hook",
  script: "Script",
  scenes: "Scenes",
  voice: "Voice",
  video: "Export",
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
  const globalCurrentIndex = STEPS.indexOf(project.currentStep as StepValue) !== -1
    ? STEPS.indexOf(project.currentStep as StepValue)
    : 0;

  return (
    <div className="w-64 border-r border-white/[0.04] bg-[#050505] py-10 px-8 flex flex-col shrink-0 h-full z-10">
      <h2 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/20 mb-10 pl-1">Pipeline</h2>

      <div className="relative flex-1">
        {/* Vertical connector */}
        <div className="absolute left-[15px] top-3 bottom-6 w-px bg-gradient-to-b from-white/[0.06] via-white/[0.04] to-transparent" />

        <div className="flex flex-col gap-1">
          {STEPS.map((stepId, index) => {
            const isAccessible = index <= globalCurrentIndex;
            const isViewing = viewingStep === stepId;
            const status = project.steps?.[stepId]?.status || "pending";

            let nodeClasses = "bg-[#0A0A0A] border-white/[0.06] text-white/15";
            let labelColor = "text-white/25";
            let statusColor = "text-white/10";
            let icon = <Circle className="w-3 h-3" />;

            if (status === "approved") {
              nodeClasses = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
              labelColor = "text-emerald-400/80";
              statusColor = "text-emerald-500/40";
              icon = <Check className="w-3 h-3" />;
            } else if (status === "editing") {
              nodeClasses = "bg-amber-500/10 border-amber-500/20 text-amber-400";
              labelColor = "text-amber-400/80";
              statusColor = "text-amber-500/40";
              icon = <CircleDot className="w-3 h-3" />;
            } else if (isAccessible) {
              nodeClasses = "bg-white/[0.04] border-white/10 text-white/40";
              labelColor = "text-white/50";
              statusColor = "text-white/15";
            }

            if (!isAccessible) {
              icon = <Lock className="w-2.5 h-2.5" />;
            }

            return (
              <motion.button
                key={stepId}
                disabled={!isAccessible}
                onClick={() => setViewingStep(stepId)}
                whileHover={isAccessible ? { x: 2 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={cn(
                  "flex items-center gap-4 text-left py-3 px-1 rounded-xl transition-all duration-200 relative group",
                  !isAccessible && "opacity-20 cursor-not-allowed",
                  isViewing && "bg-white/[0.03]"
                )}
              >
                {/* Node circle */}
                <div className="relative z-10">
                  <div className={cn(
                    "w-[30px] h-[30px] rounded-full border flex items-center justify-center transition-all duration-300",
                    nodeClasses,
                    isViewing && "ring-[2px] ring-indigo-500/40 ring-offset-1 ring-offset-[#050505] shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                  )}>
                    {icon}
                  </div>
                </div>

                {/* Label column */}
                <div className="flex flex-col gap-0.5">
                  <span className={cn(
                    "text-[13px] font-semibold tracking-tight transition-colors duration-200",
                    isViewing ? "text-white" : labelColor
                  )}>
                    {STEP_LABELS[stepId]}
                  </span>
                  <span className={cn(
                    "text-[10px] tracking-wider uppercase font-medium transition-colors duration-200",
                    isViewing ? "text-indigo-400/60" : statusColor
                  )}>
                    {status}
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
