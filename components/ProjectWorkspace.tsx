"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { StepperNavigation, STEPS, StepValue } from "./StepperNavigation";
import { IdeaStepPanel } from "./IdeaStepPanel";
import { HookStepPanel } from "./HookStepPanel";
import { ScriptStepPanel } from "./ScriptStepPanel";
import { ScenesStepPanel } from "./ScenesStepPanel";
import { ImagesStepPanel } from "./ImagesStepPanel";
import { AnimationStepPanel } from "./AnimationStepPanel";
import { VoiceStepPanel } from "./VoiceStepPanel";
import { SubtitlesStepPanel } from "./SubtitlesStepPanel";
import { CompositionStepPanel } from "./CompositionStepPanel";
import { EditorStepPanel } from "./EditorStepPanel";
import { RenderStepPanel } from "./RenderStepPanel";
import { ProjectWorkspaceSkeleton } from "./ProjectWorkspaceSkeleton";

export const ProjectWorkspace = ({ project }: { project: any }) => {
  const router = useRouter();
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/login");
    },
  });

  const initialStep = (project?.currentStep && STEPS.includes(project.currentStep as StepValue))
    ? (project.currentStep as StepValue)
    : "idea";

  const [viewingStep, setViewingStep] = useState<StepValue>(initialStep);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Safe fallbacks for data
  const stepsData = project?.steps || {};
  const [selectedIdea, setSelectedIdea] = useState<string>(stepsData.idea?.userSelected || "");
  const [selectedHook, setSelectedHook] = useState<string>(stepsData.hook?.editedHook || stepsData.hook?.selectedHook || "");
  const [selectedScript, setSelectedScript] = useState<string>(stepsData.script?.content || "");
  const [selectedScenes, setSelectedScenes] = useState<any[]>(Array.isArray(stepsData.scenes?.data) ? stepsData.scenes.data : []);

  const advanceTo = (next: StepValue) => {
    if (!project) return;
    const currentIndex = STEPS.indexOf(project.currentStep as StepValue);
    const nextIndex = STEPS.indexOf(next);
    
    if (currentIndex < nextIndex || !project.currentStep) {
      project.currentStep = next;
    }
    setViewingStep(next);
  };

  if (status === "loading") {
    return <ProjectWorkspaceSkeleton />;
  }

  const panelClass = "h-full rounded-2xl bg-[#0d0d0d] border border-white/[0.04] p-6 md:p-8 relative overflow-hidden";

  const executeUpdate = async (step: string, data: any, nextStep: StepValue) => {
    try {
      setSaveStatus("saving");
      setSaveError(null);
      
      const res = await fetch("/api/project/update-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project._id, step, data, nextStep }),
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        console.error(`API error for step "${step}":`, result.error);
        setSaveStatus("error");
        setSaveError(result.error || "Failed to save");
        setTimeout(() => { setSaveStatus("idle"); setSaveError(null); }, 4000);
        return;
      }

      // 1. Sync backend state bounds into local pointer
      if (result.currentStep) {
        project.currentStep = result.currentStep;
      }
      if (result.stepData) {
        if (!project.steps) project.steps = {};
        project.steps[step] = result.stepData;
      }

      // Success — update UI from response
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      router.refresh(); // forces next server component lifecycle
      
      // 2. Visually shift screen to next step
      advanceTo(nextStep as StepValue);
    } catch (err) {
      setSaveStatus("error");
      setSaveError("Network error — check your connection");
      setTimeout(() => { setSaveStatus("idle"); setSaveError(null); }, 4000);
      console.error(`Failed to execute update for ${step}`, err);
    }
  };

  const handleAutoSave = async (step: string, data: any) => {
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/project/update-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project._id, step, data }),
      });
      
      const result = await res.json();
      
      if (res.ok) {
        if (result.stepData) {
          if (!project.steps) project.steps = {};
          project.steps[step] = result.stepData;
        }
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        setSaveStatus("idle");
      }
    } catch (err) {
      setSaveStatus("idle");
    }
  };

  const renderStep = () => {
    switch (viewingStep) {
      case "idea":
        return (
          <div className={panelClass}>
            <IdeaStepPanel
              stepData={project?.steps?.idea}
              onApprove={async (idea, niche) => {
                if (idea) setSelectedIdea(idea);
                await executeUpdate("idea", { userSelected: idea, niche, status: "completed" }, "hook");
              }}
            />
          </div>
        );
      case "hook":
        return (
          <div className={panelClass}>
            <HookStepPanel
              selectedIdea={selectedIdea}
              stepData={project?.steps?.hook}
              onApprove={async (hook) => {
                if (hook) setSelectedHook(hook);
                await executeUpdate("hook", { selectedHook: hook, status: "completed" }, "script");
              }}
            />
          </div>
        );
      case "script":
        return (
          <div className={panelClass}>
            <ScriptStepPanel
              selectedIdea={selectedIdea}
              selectedHook={selectedHook}
              initialScript={selectedScript}
              onAutoSave={(data) => handleAutoSave("script", data)}
              onApprove={async (script) => {
                if (script) setSelectedScript(script);
                await executeUpdate("script", { content: script, status: "completed" }, "scenes");
              }}
            />
          </div>
        );
      case "scenes":
        return (
          <div className={panelClass}>
            <ScenesStepPanel
              scriptPreview={selectedScript || "Your script will appear here after Step 3 is approved."}
              initialScenes={project?.steps?.scenes?.data}
              onAutoSave={(scenes) => handleAutoSave("scenes", { data: scenes })}
              onApprove={async (scenes) => {
                if (scenes && scenes.length > 0) setSelectedScenes(scenes);
                await executeUpdate("scenes", { data: scenes }, "images");
              }}
            />
          </div>
        );
      case "images":
        return (
          <div className={panelClass}>
            <ImagesStepPanel
              scenes={selectedScenes}
              onApprove={async () => await executeUpdate("images", { status: "completed" }, "animation")}
            />
          </div>
        );
      case "animation":
        return (
          <div className={panelClass}>
            <AnimationStepPanel
              scenes={selectedScenes}
              stepData={project?.steps?.animation}
              onApprove={async (animData) => await executeUpdate("animation", { ...animData, status: "completed" }, "voice")}
            />
          </div>
        );
      case "voice":
        return (
          <div className={panelClass}>
            <VoiceStepPanel
              scriptPreview={selectedScript || "Your script narration will appear here."}
              initialVoice={project?.steps?.voice}
              onApprove={async (voiceData) => {
                const payload = voiceData
                  ? { type: voiceData.voiceType || voiceData.type, settings: voiceData.settings }
                  : {};
                await executeUpdate("voice", payload, "subtitles");
              }}
            />
          </div>
        );
      case "subtitles":
        return (
          <div className={panelClass}>
            <SubtitlesStepPanel
              script={selectedScript}
              stepData={project?.steps?.subtitles}
              onApprove={async (subData) => await executeUpdate("subtitles", { settings: subData, status: "completed" }, "composition")}
            />
          </div>
        );
      case "composition":
        return (
          <div className={panelClass}>
            <CompositionStepPanel
              projectTitle={project.title}
              onApprove={async () => await executeUpdate("composition", { status: "completed" }, "editor")}
            />
          </div>
        );
      case "editor":
        return (
          <div className={panelClass}>
            <EditorStepPanel
              projectTitle={project.title}
              onApprove={async () => await executeUpdate("editor", { status: "completed" }, "render")}
            />
          </div>
        );
      case "render":
        return (
          <div className={panelClass}>
            <RenderStepPanel
              projectTitle={project.title}
              onComplete={async (videoUrl) => {
                await executeUpdate("render", { videoUrl: videoUrl || "", status: "completed" }, "render");
                project.status = "completed";
              }}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex w-full h-screen bg-[#030303] overflow-hidden font-sans selection:bg-indigo-500/30">
      <Sidebar activeItem="Dashboard" />
      <StepperNavigation
        project={project}
        viewingStep={viewingStep}
        setViewingStep={setViewingStep}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative z-0">
        {/* Ambient glows */}
        <div className="absolute top-[-15%] left-[5%] w-[45%] h-[45%] bg-indigo-600/[0.05] blur-[160px] rounded-full mix-blend-screen pointer-events-none -z-10" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] bg-purple-600/[0.04] blur-[140px] rounded-full mix-blend-screen pointer-events-none -z-10" />

        {/* Header */}
        <header className="px-8 pt-8 pb-5 border-b border-white/[0.03] shrink-0 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-[0.12em] bg-white/[0.04] text-white/30 border border-white/[0.06]">
                {project.type || "LONG"}
              </span>
              <span className="text-white/[0.1] text-[10px] tracking-[0.12em] font-mono truncate max-w-[200px]">
                {project._id}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white/90 truncate">
              {project.title}
            </h1>
          </div>

          {/* Core Auto-Save Indication */}
          <div className="flex items-center">
            <AnimatePresence mode="wait">
              {saveStatus === "saving" && (
                <motion.div
                  key="saving"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.05]"
                >
                  <div className="w-3 h-3 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  <span className="text-[11px] font-bold text-white/40 tracking-wider uppercase">Saving...</span>
                </motion.div>
              )}
              {saveStatus === "saved" && (
                <motion.div
                  key="saved"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20"
                >
                  <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[11px] font-bold text-emerald-500/90 tracking-wider uppercase">Saved</span>
                </motion.div>
              )}
              {saveStatus === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-rose-500/10 border border-rose-500/20 max-w-xs"
                >
                  <svg className="w-3 h-3 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-[11px] font-bold text-rose-400/90 tracking-wide truncate">
                    {saveError || "Save failed"}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto hide-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewingStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="h-full"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
