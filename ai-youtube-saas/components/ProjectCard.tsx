"use client";
import React from "react";
import { motion } from "framer-motion";
import { Play, Settings2, Sparkles, Box } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const ProjectCard = ({ project }: { project: any }) => {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative p-8 rounded-[24px] bg-[#0A0A0A] border border-white/5 flex flex-col gap-5 overflow-hidden ring-1 ring-white/10 hover:ring-indigo-500/30 transition-all duration-300 shadow-2xl"
    >
      {/* Subtle Glow Effect on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Card Header Layer */}
      <div className="flex justify-between items-start relative z-10">
        <h3 className="text-xl font-bold text-white/90 truncate mr-4 tracking-tight leading-tight" title={project.title}>
          {project.title}
        </h3>
        <span className={cn(
          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex-shrink-0 shadow-lg",
          project.type === "shorts" 
            ? "bg-pink-500/10 text-pink-400 border border-pink-500/20 shadow-pink-500/10" 
            : "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-blue-500/10"
        )}>
          {project.type}
        </span>
      </div>
      
      {/* Metadata Layer */}
      <div className="flex items-center gap-3 text-white/40 text-xs font-medium tracking-wide mt-2 relative z-10">
        <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-md border border-white/5">
          <Settings2 className="w-3.5 h-3.5" />
          <span className="capitalize">{project.currentStep}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-md border border-white/5">
          <Box className="w-3.5 h-3.5" />
          <span className="capitalize">{project.status}</span>
        </div>
      </div>
      
      {/* Bottom Interface Layer */}
      <div className="mt-8 pt-6 border-t border-white/[0.03] flex items-center justify-between relative z-10">
        <span className="text-[11px] font-mono tracking-wider text-white/20">ID: {project._id?.slice(-6)}</span>
        <Link href={`/project/${project._id}`} className="text-sm font-semibold text-indigo-400/80 hover:text-indigo-300 transition-colors flex items-center gap-1.5 group/btn">
          Open Studio 
          <Play className="w-3.5 h-3.5 group-hover/btn:translate-x-1 group-hover/btn:text-indigo-200 transition-all" />
        </Link>
      </div>
    </motion.div>
  );
};
