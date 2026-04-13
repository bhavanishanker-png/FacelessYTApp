import React from "react";
import { Sidebar } from "./Sidebar";

export const ProjectWorkspaceSkeleton = () => {
  return (
    <div className="flex w-full h-screen bg-[#030303] overflow-hidden font-sans selection:bg-indigo-500/30">
      <Sidebar activeItem="Dashboard" />
      
      {/* Stepper Skeleton */}
      <div className="w-60 border-r border-white/[0.04] bg-[#0a0a0a] py-8 px-5 flex flex-col shrink-0 h-full z-10">
        <div className="h-2 w-16 bg-white/[0.05] rounded mb-8 ml-1 animate-pulse" />

        <div className="relative flex-1">
          <div className="absolute left-[14px] top-3 bottom-6 w-px bg-white/[0.03]" />

          <div className="flex flex-col gap-0.5">
            {[...Array(11)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 group relative py-3 px-1 rounded-lg">
                <div className="w-5 h-5 rounded-full border border-white/[0.05] bg-white/[0.02] flex items-center justify-center shrink-0 z-10 animate-pulse" />
                <div className="h-3 w-16 bg-white/[0.05] rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col overflow-hidden relative z-0">
        {/* Ambient glows */}
        <div className="absolute top-[-15%] left-[5%] w-[45%] h-[45%] bg-indigo-600/[0.05] blur-[160px] rounded-full mix-blend-screen pointer-events-none -z-10" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] bg-purple-600/[0.04] blur-[140px] rounded-full mix-blend-screen pointer-events-none -z-10" />

        {/* Header Skeleton */}
        <header className="px-8 pt-8 pb-5 border-b border-white/[0.03] shrink-0 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-4 w-12 bg-white/[0.05] rounded animate-pulse" />
              <div className="h-3 w-24 bg-white/[0.03] rounded animate-pulse" />
            </div>
            <div className="h-6 w-48 bg-white/[0.08] rounded animate-pulse" />
          </div>
        </header>

        {/* Panel Skeleton */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pt-6 pb-20 px-4 md:px-8 custom-scrollbar">
          <div className="max-w-[700px] w-full mx-auto h-full pb-10">
            <div className="h-full rounded-2xl bg-[#0d0d0d] border border-white/[0.04] p-6 md:p-8 relative overflow-hidden flex flex-col gap-5">
              
              <div className="flex items-start justify-between">
                <div>
                  <div className="h-6 w-32 bg-white/[0.08] rounded animate-pulse mb-2" />
                  <div className="h-4 w-64 bg-white/[0.04] rounded animate-pulse" />
                </div>
              </div>

              <div className="mt-8 flex-1">
                <div className="h-full min-h-[300px] w-full bg-white/[0.02] border border-white/[0.04] rounded-2xl animate-pulse" />
              </div>

              <div className="mt-8 pt-6 border-t border-white/[0.04] flex items-center justify-between">
                <div className="h-10 w-24 bg-white/[0.03] rounded-xl animate-pulse" />
                <div className="h-10 w-36 bg-white/[0.08] rounded-xl animate-pulse" />
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
