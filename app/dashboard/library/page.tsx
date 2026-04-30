"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Download, Trash2, PlaySquare, Calendar, Clock, Edit3, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LibraryPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchLibrary() {
      try {
        const res = await fetch("/api/project");
        const data = await res.json();
        if (res.ok) {
          setProjects(data.projects || []);
        }
      } catch (err) {
        console.error("Failed to load library", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLibrary();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project? This cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/project/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProjects(prev => prev.filter(p => p._id !== id));
      }
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const getThumbnail = (project: any) => {
    if (project.steps?.images?.data && project.steps.images.data.length > 0) {
      return project.steps.images.data[0].imageUrl;
    }
    return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=450&fit=crop";
  };

  const getStatusDisplay = (project: any) => {
    const isRendered = project.steps?.render?.status === "completed";
    const ytStatus = project.youtube?.status;

    if (ytStatus === "published") {
      return { label: "Published", color: "text-emerald-400", bg: "bg-emerald-400/10", icon: PlaySquare };
    }
    if (ytStatus === "scheduled") {
      return { label: "Scheduled", color: "text-amber-400", bg: "bg-amber-400/10", icon: Calendar };
    }
    if (isRendered) {
      return { label: "Ready to Upload", color: "text-blue-400", bg: "bg-blue-400/10", icon: CheckCircle2 };
    }
    return { label: "Draft", color: "text-white/60", bg: "bg-white/5", icon: Edit3 };
  };

  const openProject = (id: string) => {
    router.push(`/project/${id}`);
  };

  if (loading) {
    return (
      <div className="flex h-[500px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Video Library</h1>
        <p className="text-white/60 mt-1">Manage all your generated projects and uploads.</p>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[400px] rounded-2xl border border-white/[0.06] bg-[#0d0d0d]">
          <Play className="w-16 h-16 text-white/10 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No videos yet</h2>
          <p className="text-white/40 mb-6 text-center max-w-sm">
            Create your first AI-generated video and it will appear here.
          </p>
          <button 
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition-colors"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {projects.map((project, i) => {
              const status = getStatusDisplay(project);
              const isRendered = project.steps?.render?.status === "completed";
              const videoUrl = project.steps?.render?.videoUrl;

              return (
                <motion.div
                  key={project._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => openProject(project._id)}
                  className="group cursor-pointer rounded-2xl overflow-hidden bg-[#0d0d0d] border border-white/[0.06] hover:border-indigo-500/50 transition-all flex flex-col"
                >
                  <div className="relative aspect-video bg-[#111] overflow-hidden">
                    <img 
                      src={getThumbnail(project)} 
                      alt={project.title}
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    />
                    
                    <div className="absolute top-3 left-3 flex gap-2">
                      <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${status.bg} ${status.color} border border-current/20 backdrop-blur-md`}>
                        <status.icon className="w-3 h-3" />
                        {status.label}
                      </div>
                    </div>

                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                        <Play className="w-5 h-5 ml-1" />
                      </div>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-1 line-clamp-1 group-hover:text-indigo-400 transition-colors">
                      {project.title || "Untitled Project"}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-white/40 mb-4">
                      <Clock className="w-3 h-3" />
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </div>

                    <div className="mt-auto pt-4 border-t border-white/[0.04] flex items-center justify-between">
                      <div className="flex gap-2">
                        {isRendered ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); openProject(project._id); }}
                            className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-semibold hover:bg-indigo-500/20"
                          >
                            {project.youtube?.status === "none" ? "Upload" : "View"}
                          </button>
                        ) : (
                          <button 
                            onClick={(e) => { e.stopPropagation(); openProject(project._id); }}
                            className="px-3 py-1.5 bg-white/5 text-white/60 rounded-lg text-xs font-semibold hover:bg-white/10"
                          >
                            Edit Draft
                          </button>
                        )}
                        
                        {isRendered && videoUrl && (
                          <a 
                            href={videoUrl}
                            download
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                      </div>

                      <button 
                        onClick={(e) => handleDelete(project._id, e)}
                        className="p-1.5 rounded-lg text-rose-500/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/>
  </svg>
);
