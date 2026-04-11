"use client";
import React from "react";
import { Home, FolderHeart, Settings, PlaySquare, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const Sidebar = () => {
  return (
    <div className="w-72 h-screen border-r border-white/5 bg-[#050505] flex flex-col p-8 flex-shrink-0 z-20">
      
      <Link href="/" className="flex items-center gap-4 mb-14 group">
        <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_30px_-5px_rgba(99,102,241,0.5)] group-hover:shadow-[0_0_35px_-5px_rgba(99,102,241,0.8)] transition-all">
          <PlaySquare className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 group-hover:to-white transition-all">
          AI Studio
        </h1>
      </Link>

      <nav className="flex flex-col gap-3 flex-grow">
        <NavItem href="/dashboard" icon={<Home />} label="Dashboard" active />
        <NavItem href="/dashboard" icon={<FolderHeart />} label="Projects" />
        <NavItem href="#" icon={<Settings />} label="Settings" />
      </nav>

      <div className="mt-auto p-5 rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden group hover:border-indigo-500/30 transition-colors duration-500">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-50" />
        
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <p className="text-sm font-bold text-white/90 tracking-wide">Pro Plan</p>
        </div>
        <p className="text-xs text-white/40 leading-relaxed font-medium">Unlimited scaling & top-tier GPU priority enabled.</p>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active, href = "#" }: { icon: React.ReactNode; label: string; active?: boolean; href?: string }) => {
  return (
    <Link href={href}>
      <div
        className={cn(
          "flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 font-semibold text-sm",
          active 
            ? "bg-white/10 text-white shadow-xl shadow-black/50" 
            : "text-white/40 hover:bg-white/5 hover:text-white/90 hover:translate-x-1"
        )}
      >
        {React.cloneElement(icon as React.ReactElement, { className: "w-4 h-4" })}
        {label}
      </div>
    </Link>
  );
};
