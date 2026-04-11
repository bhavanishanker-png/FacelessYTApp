"use client";
import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { AnimatedButton } from "@/components/AnimatedButton";
import { ProjectCard } from "@/components/ProjectCard";
import { CreateProjectModal } from "@/components/CreateProjectModal";
import { Plus, Loader2 } from "lucide-react";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/project");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="flex w-full min-h-screen bg-[#030303] font-sans selection:bg-indigo-500/30">
      <Sidebar />
      
      <main className="flex-1 flex flex-col items-center overflow-y-auto w-full relative z-0">
        {/* Premium Background Mesh Gradient */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[140px] rounded-full mix-blend-screen" />
          <div className="absolute top-[20%] right-[-5%] w-[30%] h-[50%] bg-purple-600/10 blur-[130px] rounded-full mix-blend-screen" />
        </div>
        
        <div className="max-w-7xl w-full p-10 lg:p-16">
          <header className="flex justify-between items-end mb-16">
            <div className="flex flex-col gap-2">
              <h1 className="text-5xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white via-white/80 to-white/30">
                Your Projects
              </h1>
              <p className="text-white/40 font-medium tracking-wide">
                Manage and track your AI generated video pipelines.
              </p>
            </div>
            
            <AnimatedButton onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-7 py-2.5 rounded-full shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)]">
              <Plus className="w-4 h-4" />
              New Project
            </AnimatedButton>
          </header>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-32 opacity-40">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-6" />
              <p className="text-white/50 tracking-wide text-sm font-medium">Loading workspace...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-24 border border-white/5 rounded-3xl bg-white/[0.02] backdrop-blur-2xl transition-all hover:bg-white/[0.03]">
              <div className="w-20 h-20 bg-white/5 flex items-center justify-center rounded-full mb-6 shadow-2xl shadow-indigo-500/10">
                <Plus className="w-8 h-8 text-white/30" />
              </div>
              <h3 className="text-2xl font-bold text-white/90 mb-3 tracking-tight">No projects yet</h3>
              <p className="text-white/40 mb-8 text-center max-w-sm leading-relaxed">
                Your workspace is empty. Get started by creating your first AI video pipeline in seconds.
              </p>
              <AnimatedButton onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 rounded-full px-8 py-3">
                <Plus className="w-4 h-4" />
                Create First Project
              </AnimatedButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((proj: any) => (
                <ProjectCard key={proj._id} project={proj} />
              ))}
            </div>
          )}
        </div>
      </main>

      <CreateProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchProjects}
      />
    </div>
  );
}
