"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { StepperNavigation } from "./StepperNavigation";
import { IdeaStepPanel } from "./IdeaStepPanel";
import { HookStepPanel } from "./HookStepPanel";

const STEPS = ["idea", "hook", "script", "scenes", "voice", "video"] as const;
type StepValue = typeof STEPS[number];

const STEP_PLACEHOLDERS: Record<string, { title: string; desc: string }> = {
  script: { title: "Script Writer", desc: "Generate a complete, retention-optimised script with pacing cues and engagement markers." },
  scenes: { title: "Scene Planner", desc: "Break your script into visual scenes with B-roll suggestions and transition timing." },
  voice: { title: "Voice Studio", desc: "Select and synthesise a premium AI voice perfectly matched to your content." },
  video: { title: "Video Export", desc: "Render your final video with subtitles, music, and branding — ready to upload." },
};

export const ProjectWorkspace = ({ project }: { project: any }) => {
  const [viewingStep, setViewingStep] = useState<StepValue>(project.currentStep as StepValue);
  const [selectedIdea, setSelectedIdea] = useState<string>("Why you are wasting your life");

  const isPlaceholderStep = viewingStep !== "idea" && viewingStep !== "hook";

  return (
    <div className="flex w-full h-screen bg-[#030303] overflow-hidden font-sans selection:bg-indigo-500/30">
      <Sidebar />
      <StepperNavigation
        project={project}
        viewingStep={viewingStep}
        setViewingStep={setViewingStep}
      />

      <main className="flex-1 flex flex-col overflow-y-auto relative z-0 w-full">
        {/* Ambient glow */}
        <div className="absolute top-[-15%] left-[5%] w-[45%] h-[45%] bg-indigo-600/[0.06] blur-[160px] rounded-full mix-blend-screen pointer-events-none -z-10" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] bg-purple-600/[0.05] blur-[140px] rounded-full mix-blend-screen pointer-events-none -z-10" />

        {/* Header bar */}
        <header className="px-10 pt-10 pb-6 border-b border-white/[0.03] shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-[0.15em] bg-white/[0.04] text-white/30 border border-white/[0.06]">
              {project.type}
            </span>
            <span className="text-white/12 text-[10px] tracking-[0.15em] font-mono">
              {project._id}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white/90 truncate">
            {project.title}
          </h1>
        </header>

        {/* Content area */}
        <div className="flex-1 p-8 overflow-y-auto hide-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewingStep}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full"
            >
              {viewingStep === "idea" && (
                <div className="h-full rounded-2xl bg-[#0A0A0A] border border-white/[0.04] p-8 md:p-10 relative overflow-hidden">
                  <IdeaStepPanel onApprove={(idea) => {
                    setSelectedIdea(idea);
                    if (project.currentStep === "idea") project.currentStep = "hook";
                    setViewingStep("hook");
                  }} />
                </div>
              )}

              {viewingStep === "hook" && (
                <div className="h-full rounded-2xl bg-[#0A0A0A] border border-white/[0.04] p-8 md:p-10 relative overflow-hidden">
                  <HookStepPanel
                    selectedIdea={selectedIdea}
                    onApprove={() => {
                      if (project.currentStep === "hook") project.currentStep = "script";
                      setViewingStep("script");
                    }}
                  />
                </div>
              )}

              {isPlaceholderStep && (
                <div className="h-full rounded-2xl bg-[#0A0A0A] border border-white/[0.04] p-10 relative overflow-hidden flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.02] flex items-center justify-center border border-white/[0.04] mb-8">
                    <div className="w-6 h-6 bg-indigo-500/20 rounded-lg animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-bold text-white/80 tracking-tight mb-3">
                    {STEP_PLACEHOLDERS[viewingStep]?.title ?? `${viewingStep} Panel`}
                  </h2>
                  <p className="text-white/30 max-w-md leading-relaxed text-[15px] font-medium">
                    {STEP_PLACEHOLDERS[viewingStep]?.desc ?? "This step is coming soon."}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
