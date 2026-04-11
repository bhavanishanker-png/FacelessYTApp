"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { StepperNavigation } from "./StepperNavigation";
import { IdeaStepPanel } from "./IdeaStepPanel";
import { HookStepPanel } from "./HookStepPanel";
import { ScriptStepPanel } from "./ScriptStepPanel";
import { ScenesStepPanel } from "./ScenesStepPanel";
import { VoiceStepPanel } from "./VoiceStepPanel";
import { VideoStepPanel } from "./VideoStepPanel";

const STEPS = ["idea", "hook", "script", "scenes", "voice", "video"] as const;
type StepValue = typeof STEPS[number];


export const ProjectWorkspace = ({ project }: { project: any }) => {
  const [viewingStep, setViewingStep] = useState<StepValue>(project.currentStep as StepValue);
  const [selectedIdea, setSelectedIdea] = useState<string>("Why you are wasting your life");
  const [selectedHook, setSelectedHook] = useState<string>("You are wasting your life without realizing it");
  const [selectedScript, setSelectedScript] = useState<string>("");

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
                    onApprove={(hook?: string) => {
                      if (hook) setSelectedHook(hook);
                      if (project.currentStep === "hook") project.currentStep = "script";
                      setViewingStep("script");
                    }}
                  />
                </div>
              )}

              {viewingStep === "script" && (
                <div className="h-full rounded-2xl bg-[#0A0A0A] border border-white/[0.04] p-8 md:p-10 relative overflow-hidden">
                  <ScriptStepPanel
                    selectedIdea={selectedIdea}
                    selectedHook={selectedHook}
                    onApprove={(script?: string) => {
                      if (script) setSelectedScript(script);
                      if (project.currentStep === "script") project.currentStep = "scenes";
                      setViewingStep("scenes");
                    }}
                  />
                </div>
              )}

              {viewingStep === "scenes" && (
                <div className="h-full rounded-2xl bg-[#0A0A0A] border border-white/[0.04] p-8 md:p-10 relative overflow-hidden">
                  <ScenesStepPanel
                    scriptPreview={selectedScript || "Most people think they are working hard... But in reality, they are just busy. Every day, you wake up, scroll your phone, delay your goals..."}
                    onApprove={() => {
                      if (project.currentStep === "scenes") project.currentStep = "voice";
                      setViewingStep("voice");
                    }}
                  />
                </div>
              )}

              {viewingStep === "voice" && (
                <div className="h-full rounded-2xl bg-[#0A0A0A] border border-white/[0.04] p-8 md:p-10 relative overflow-hidden">
                  <VoiceStepPanel
                    scriptPreview={selectedScript || "Most people think they are working hard... But in reality, they are just busy."}
                    onApprove={() => {
                      if (project.currentStep === "voice") project.currentStep = "video";
                      setViewingStep("video");
                    }}
                  />
                </div>
              )}

              {viewingStep === "video" && (
                <div className="h-full rounded-2xl bg-[#0A0A0A] border border-white/[0.04] p-8 md:p-10 relative overflow-hidden">
                  <VideoStepPanel
                    projectTitle={project.title}
                    onApprove={() => {
                      // Final step — project is complete
                    }}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
