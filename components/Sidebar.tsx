"use client";
import React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Sparkles, LayoutDashboard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

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

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-4 px-4 py-3 rounded-xl relative transition-all duration-200 group",
            activeItem === "Dashboard"
              ? "text-[#c0c1ff] bg-[#c0c1ff]/[0.06]"
              : "text-[#e5e2e1]/35 hover:bg-[#c0c1ff]/[0.06] hover:text-[#c0c1ff]"
          )}
        >
          {activeItem === "Dashboard" && (
            <span className="absolute left-0 w-0.5 h-5 bg-[#c0c1ff] rounded-r-full" />
          )}
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[11px] font-semibold uppercase tracking-widest">Dashboard</span>
        </Link>
      </nav>

      {/* Bottom */}
      <div className="px-4 pb-6">
        <div className="pt-3 border-t border-[#464554]/10">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-[10px] font-medium uppercase tracking-widest text-[#e5e2e1]/30 hover:text-[#ffb4ab]"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
};
