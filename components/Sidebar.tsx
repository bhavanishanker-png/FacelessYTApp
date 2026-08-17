"use client";
import React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { Sparkles, LayoutDashboard, LogOut, BarChart3, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModelBadge } from "./ModelBadge";

const SIDEBAR_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Library", href: "/dashboard/library", icon: FolderOpen },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
];

export const Sidebar = ({ activeItem = "Dashboard" }: { activeItem?: string }) => {
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col h-full border-r border-white/[0.04] bg-[#0a0a0a] z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.04]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)] group-hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] transition-all duration-300">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-base font-black tracking-tighter text-gradient-indigo">
            Velora AI
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {SIDEBAR_ITEMS.map((item) => {
          const isActive = activeItem === item.label;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl relative transition-all duration-200 group",
                isActive
                  ? "text-white bg-white/[0.04]"
                  : "text-white/25 hover:bg-white/[0.03] hover:text-white/50"
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-nav-active"
                  className="absolute left-0 w-0.5 h-5 bg-indigo-500 rounded-r-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon className={cn("w-4 h-4", isActive && "text-indigo-400")} />
              <span className="text-[12px] font-semibold tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-5">
        <ModelBadge />
        <div className="pt-3 mt-3 border-t border-white/[0.04]">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-[11px] font-medium text-white/20 hover:text-rose-400/70 hover:bg-white/[0.02]"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
};
