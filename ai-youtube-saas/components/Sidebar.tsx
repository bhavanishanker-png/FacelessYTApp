"use client";
import React from "react";
import Link from "next/link";
import { Sparkles, LayoutDashboard, Film, Clock, FolderOpen, Share2, HelpCircle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: <LayoutDashboard className="w-4 h-4" />, label: "Dashboard", href: "/dashboard" },
  { icon: <Film className="w-4 h-4" />, label: "Editor", href: "#" },
  { icon: <Clock className="w-4 h-4" />, label: "Timeline", href: "#" },
  { icon: <FolderOpen className="w-4 h-4" />, label: "Media", href: "#" },
  { icon: <Share2 className="w-4 h-4" />, label: "Export", href: "#" },
];

export const Sidebar = ({ activeItem = "Dashboard" }: { activeItem?: string }) => {
  return (
    <aside className="w-64 shrink-0 flex flex-col h-full border-r border-[#464554]/10 bg-[#1c1b1b]/60 backdrop-blur-xl z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[#464554]/10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#a855f7] flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-base font-black tracking-tighter bg-gradient-to-r from-[#c0c1ff] to-[#ddb7ff] bg-clip-text text-transparent">
            Velora AI
          </span>
        </Link>
      </div>

      {/* Active Project */}
      <div className="px-4 py-4 border-b border-[#464554]/10">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#201f1f]">
          <div className="w-9 h-9 bg-[#6f00be] rounded-lg flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-[#ddb7ff]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#c0c1ff] truncate">Project Alpha</p>
            <p className="text-[10px] text-[#908fa0]">AI Processing...</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {NAV_ITEMS.map(({ icon, label, href }) => {
          const isActive = label === activeItem;
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-xl relative transition-all duration-200 group",
                isActive
                  ? "text-[#c0c1ff] bg-[#c0c1ff]/[0.06]"
                  : "text-[#e5e2e1]/35 hover:bg-[#c0c1ff]/[0.06] hover:text-[#c0c1ff]"
              )}
            >
              {isActive && (
                <span className="absolute left-0 w-0.5 h-5 bg-[#c0c1ff] rounded-r-full" />
              )}
              {icon}
              <span className="text-[11px] font-semibold uppercase tracking-widest">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-4 pb-6 space-y-3">
        <button className="w-full py-2.5 rounded-xl border border-[#c0c1ff]/15 text-[#c0c1ff] text-[11px] font-bold uppercase tracking-widest hover:bg-[#c0c1ff]/10 transition-all">
          Upgrade Plan
        </button>
        <div className="pt-3 border-t border-[#464554]/10 space-y-0.5">
          {[
            { icon: <HelpCircle className="w-4 h-4" />, label: "Help" },
            { icon: <LogOut className="w-4 h-4" />, label: "Logout", danger: true },
          ].map(({ icon, label, danger }) => (
            <a
              key={label}
              href="#"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-[10px] font-medium uppercase tracking-widest",
                danger
                  ? "text-[#e5e2e1]/30 hover:text-[#ffb4ab]"
                  : "text-[#e5e2e1]/30 hover:text-[#c0c1ff]"
              )}
            >
              {icon}
              {label}
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
};
