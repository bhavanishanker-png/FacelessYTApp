"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signOut, useSession } from "next-auth/react";
import {
  Sparkles, LayoutDashboard, Film, Clock, FolderOpen,
  Share2, Bell, Search, Plus, MoreVertical,
  Mic, Captions, ChevronRight, LogOut, X,
  Copy, Trash2, Pencil, ExternalLink, Loader2,
  Command, Menu, Terminal, CheckCircle2, AlertCircle, ShieldCheck,
} from "lucide-react";
import { CreateProjectModal } from "@/components/CreateProjectModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SkeletonCard } from "@/components/ui/skeleton";
import { GlowingEffect } from "@/components/ui/glowing-effect";

const NAV_LABELS = ["Dashboard", "Editor", "Timeline", "Media", "Export"] as const;
type NavLabel = typeof NAV_LABELS[number];

const NAV_ICONS: Record<NavLabel, React.ReactNode> = {
  Dashboard: <LayoutDashboard className="w-4 h-4" />,
  Editor: <Film className="w-4 h-4" />,
  Timeline: <Clock className="w-4 h-4" />,
  Media: <FolderOpen className="w-4 h-4" />,
  Export: <Share2 className="w-4 h-4" />,
};

/** Map sidebar tab → which project statuses / steps to show */
const TAB_FILTERS: Record<NavLabel, (p: any) => boolean> = {
  Dashboard: () => true,
  Editor: (p) => ["idea", "hook", "script", "scenes", "images", "voice", "video"].includes(p.currentStep),
  Timeline: (p) => p.status === "in-progress",
  Media: (p) => ["images", "video", "animation"].includes(p.currentStep),
  Export: (p) => ["render", "completed"].includes(p.currentStep) || p.status === "completed",
};

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/login?callbackUrl=/dashboard");
    },
  });
  
  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeNav, setActiveNav] = useState<NavLabel>("Dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // LeetCode daily trigger
  const [lcRunning, setLcRunning] = useState(false);
  const [lcLog, setLcLog] = useState<string[]>([]);
  const [lcResult, setLcResult] = useState<{ success: boolean; problem?: any; projectId?: string; error?: string } | null>(null);
  const [lcPanelOpen, setLcPanelOpen] = useState(false);
  const lcLogRef = useRef<HTMLDivElement>(null);
  const lcAbortRef = useRef<AbortController | null>(null);

  // API key health check
  type KeyResult = { key: string; label: string; ok: boolean; detail: string };
  const [keysChecking, setKeysChecking] = useState(false);
  const [keysResults, setKeysResults] = useState<KeyResult[] | null>(null);
  const [keysPanelOpen, setKeysPanelOpen] = useState(false);

  const checkApiKeys = async () => {
    setKeysChecking(true);
    setKeysPanelOpen(true);
    setKeysResults(null);
    try {
      const res = await fetch("/api/health/keys");
      const data = await res.json();
      setKeysResults(data.results ?? []);
    } catch (e: any) {
      setKeysResults([{ key: "error", label: "Request failed", ok: false, detail: e.message }]);
    } finally {
      setKeysChecking(false);
    }
  };

  // Auto-scroll log to bottom
  useEffect(() => {
    if (lcLogRef.current) lcLogRef.current.scrollTop = lcLogRef.current.scrollHeight;
  }, [lcLog]);

  const triggerLeetCode = async () => {
    setLcRunning(true);
    setLcLog([]);
    setLcResult(null);
    setLcPanelOpen(true);

    const controller = new AbortController();
    lcAbortRef.current = controller;

    try {
      const res = await fetch("/api/leetcode/trigger", { method: "POST", signal: controller.signal });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        setLcResult({ success: false, error: err.error });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.log) setLcLog((prev) => [...prev, data.log]);
            if (data.done) {
              setLcResult({ success: true, problem: data.problem, projectId: data.projectId });
              const updated = await fetch("/api/project").then((r) => r.json());
              if (Array.isArray(updated)) setProjects(updated);
            }
            if (data.error) setLcResult({ success: false, error: data.error });
          } catch { /* malformed chunk */ }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        setLcLog((prev) => [...prev, "⛔ Stopped by user."]);
      } else {
        setLcResult({ success: false, error: err.message });
      }
    } finally {
      lcAbortRef.current = null;
      setLcRunning(false);
    }
  };

  const stopLeetCode = () => {
    lcAbortRef.current?.abort();
  };

  // Rename modal state
  const [renameTarget, setRenameTarget] = useState<{ id: string; title: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null); // holds projectId being acted on

  // Track menuOpenId in a ref so the event handler always sees the latest value
  const menuOpenIdRef = useRef(menuOpenId);
  menuOpenIdRef.current = menuOpenId;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
      // Close project card menu if click is outside any menu or menu trigger
      if (menuOpenIdRef.current) {
        const target = e.target as HTMLElement;
        const isInsideMenu = target.closest('[data-project-menu]');
        const isMenuTrigger = target.closest('[data-menu-trigger]');
        if (!isInsideMenu && !isMenuTrigger) {
          setMenuOpenId(null);
        }
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Filtered projects based on active tab + search
  const filteredProjects = useMemo(() => {
    let result = projects.filter(TAB_FILTERS[activeNav]);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.title?.toLowerCase().includes(q));
    }
    return result;
  }, [projects, activeNav, searchQuery]);

  // ── Dynamic storage stats computed from project data ──
  const storageStats = useMemo(() => {
    const STORAGE_LIMIT_GB = 100;
    let totalImages = 0;
    let totalAudioSec = 0;
    let totalRenderBytes = 0;

    for (const p of projects) {
      // Count generated images
      const imgs = p.steps?.images?.data;
      if (Array.isArray(imgs)) {
        totalImages += imgs.filter((img: any) => img.imageUrl).length;
      }
      // Sum audio duration
      const voiceDur = p.steps?.voice?.durationSeconds;
      if (typeof voiceDur === "number" && voiceDur > 0) totalAudioSec += voiceDur;
      // Sum rendered video file sizes
      const renderBytes = p.steps?.render?.fileSizeBytes;
      if (typeof renderBytes === "number" && renderBytes > 0) totalRenderBytes += renderBytes;
    }

    // Estimate sizes (images ~2MB each, audio ~1MB per 60s, render is actual)
    const videoGB = totalRenderBytes / (1024 ** 3);
    const assetsGB = (totalImages * 2) / 1024; // ~2MB per image
    const audioGB = (totalAudioSec * (1 / 60)) / 1024; // ~1MB per minute
    const totalUsedGB = videoGB + assetsGB + audioGB;
    const usedPercent = Math.min((totalUsedGB / STORAGE_LIMIT_GB) * 100, 100);

    const videoPct = STORAGE_LIMIT_GB > 0 ? (videoGB / STORAGE_LIMIT_GB) * 100 : 0;
    const assetsPct = STORAGE_LIMIT_GB > 0 ? (assetsGB / STORAGE_LIMIT_GB) * 100 : 0;
    const audioPct = STORAGE_LIMIT_GB > 0 ? (audioGB / STORAGE_LIMIT_GB) * 100 : 0;

    const fmt = (gb: number) => gb >= 1 ? `${gb.toFixed(1)} GB` : `${(gb * 1024).toFixed(0)} MB`;

    return {
      totalUsed: fmt(totalUsedGB),
      limit: `${STORAGE_LIMIT_GB} GB`,
      usedPercent: Math.round(usedPercent),
      video: { label: `Videos (${fmt(videoGB)})`, pct: videoPct },
      assets: { label: `Assets (${fmt(assetsGB)})`, pct: assetsPct },
      audio: { label: `Audio (${fmt(audioGB)})`, pct: audioPct },
      totalProjects: projects.length,
      totalImages,
      totalAudioMin: Math.round(totalAudioSec / 60),
    };
  }, [projects]);

  // ── Action handlers ──
  const handleDuplicate = async (projectId: string) => {
    setActionLoading(projectId);
    setMenuOpenId(null);
    try {
      const res = await fetch("/api/project/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (res.ok) {
        const newProject = await res.json();
        setProjects((prev) => [newProject, ...prev]);
      }
    } catch (err) {
      console.error("Failed to duplicate:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRenameStart = (project: any) => {
    setMenuOpenId(null);
    setRenameTarget({ id: project._id, title: project.title });
    setRenameValue(project.title);
  };

  const handleRenameSubmit = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    setActionLoading(renameTarget.id);
    try {
      const res = await fetch(`/api/project/${renameTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: renameValue.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProjects((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      }
    } catch (err) {
      console.error("Failed to rename:", err);
    } finally {
      setActionLoading(null);
      setRenameTarget(null);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project? This cannot be undone.")) return;
    setActionLoading(projectId);
    setMenuOpenId(null);
    try {
      const res = await fetch(`/api/project/${projectId}`, { method: "DELETE" });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p._id !== projectId));
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    } finally {
      setActionLoading(null);
    }
  };

  React.useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/project")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setProjects(data);
          }
        })
        .catch((err) => console.error("Failed to fetch projects:", err))
        .finally(() => setIsLoading(false));
    }
  }, [status]);

  if (status === "loading") {
    // Prevent flickering UI by freezing render until session validates
    return <div className="min-h-screen bg-[#030303] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
    </div>;
  }

  const openCreate = () => setModalOpen(true);

  const quickActions = [
    {
      icon: <Sparkles className="w-5 h-5" />,
      label: "AI Script",
      color: "text-indigo-400",
      gradient: "from-indigo-500 to-indigo-600",
      onClick: openCreate,
    },
    {
      icon: <Mic className="w-5 h-5" />,
      label: "Voiceover",
      color: "text-purple-400",
      gradient: "from-purple-500 to-purple-600",
      onClick: openCreate,
    },
    {
      icon: <Film className="w-5 h-5" />,
      label: "B-Roll",
      color: "text-sky-400",
      gradient: "from-sky-500 to-sky-600",
      onClick: openCreate,
    },
    {
      icon: <Captions className="w-5 h-5" />,
      label: "Captions",
      color: "text-amber-400",
      gradient: "from-amber-500 to-amber-600",
      onClick: openCreate,
    },
  ];

  return (
    <div className="min-h-screen bg-[#030303] text-[#e5e2e1] font-sans selection:bg-[#c0c1ff]/20">

      {/* ── TOP NAV ── */}
      <nav className="flex justify-between items-center px-4 md:px-8 h-14 w-full fixed top-0 glass-frosted z-50 border-b border-white/[0.04]">
        <div className="flex items-center gap-3 md:gap-6">
          {/* Hamburger for mobile */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-white/[0.04] text-white/50 hover:text-white/80 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-base font-black tracking-tighter text-gradient-indigo hidden sm:inline">Velora Studio</span>
          </Link>
          <div className="hidden md:flex items-center gap-4">
            <span className="font-bold tracking-tight text-sm text-indigo-400 border-b-2 border-indigo-400 pb-0.5">Projects</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="hidden lg:flex items-center bg-white/[0.03] px-3.5 py-2 rounded-xl border border-white/[0.04] focus-within:border-indigo-500/20 focus-within:bg-white/[0.05] transition-all group">
            <Search className="w-4 h-4 text-white/20 mr-2 group-focus-within:text-indigo-400 transition-colors" />
            <input
              className="bg-transparent border-none focus:ring-0 text-sm text-white w-44 placeholder:text-white/20 outline-none font-medium"
              placeholder="Search projects..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery ? (
              <button onClick={() => setSearchQuery("")} className="text-white/20 hover:text-white/50 transition-colors ml-1" aria-label="Clear search">
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden xl:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/[0.04] text-[9px] font-bold text-white/15 border border-white/[0.04]">
                <Command className="w-2.5 h-2.5" />K
              </kbd>
            )}
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
              className={`relative p-2 rounded-lg hover:bg-white/[0.04] transition-all ${showNotifications ? "text-indigo-400 bg-white/[0.04]" : "text-white/30 hover:text-white/60"}`}
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute right-0 top-12 w-80 bg-[#0d0d0d] border border-white/[0.06] rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-white/[0.04] flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white">Notifications</h3>
                  </div>
                  <div className="max-h-72 overflow-y-auto flex flex-col items-center justify-center py-10 text-center">
                    <p className="text-white/30 text-xs">No notifications yet.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* API Key Health */}
          <button
            onClick={checkApiKeys}
            disabled={keysChecking}
            title="Check all API keys"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border border-violet-500/30 text-violet-400 bg-violet-500/5 hover:bg-violet-500/10 hover:border-violet-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {keysChecking
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <ShieldCheck className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{keysChecking ? "Checking…" : "API Status"}</span>
          </button>

          {/* LeetCode Daily */}
          <button
            onClick={triggerLeetCode}
            disabled={lcRunning}
            title="Generate today's LeetCode Daily video"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {lcRunning
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Terminal className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{lcRunning ? "Running…" : "LeetCode Daily"}</span>
          </button>

          {/* Create New */}
          <Button onClick={openCreate} size="sm" glow icon={<Plus className="w-3.5 h-3.5" />}>
            Create
          </Button>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer ring-2 ring-transparent hover:ring-indigo-500/30 transition-all"
            >
              {session?.user?.name?.charAt(0)?.toUpperCase() || "V"}
            </button>
            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute right-0 top-12 w-64 bg-[#0d0d0d] border border-white/[0.06] rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-white/[0.04]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                        {session?.user?.name?.charAt(0)?.toUpperCase() || "V"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{session?.user?.name || "User"}</p>
                        <p className="text-[10px] text-white/25 truncate">{session?.user?.email || ""}</p>
                      </div>
                    </div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="w-full flex items-center gap-3 px-5 py-2.5 text-xs font-semibold text-rose-400/60 hover:text-rose-400 hover:bg-white/[0.02] transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* ── MOBILE SIDEBAR DRAWER ── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mobile-overlay md:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="slide-drawer md:hidden safe-top safe-bottom"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-base font-black tracking-tighter text-gradient-indigo">Velora Studio</span>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/[0.04] text-white/40 hover:text-white/80 transition-colors"
                  aria-label="Close navigation menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Active project pill (mobile) */}
              {(() => {
                const latestActive = projects.find((p) => p.status === "in-progress");
                if (!latestActive) return null;
                return (
                  <div className="px-4 py-4">
                    <button
                      onClick={() => { router.push(`/project/${latestActive._id}`); setMobileSidebarOpen(false); }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] transition-all text-left group"
                    >
                      <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-white/70 truncate">{latestActive.title}</p>
                        <p className="text-[10px] text-white/25">Step: {latestActive.currentStep}</p>
                      </div>
                    </button>
                  </div>
                );
              })()}

              {/* Nav (mobile) */}
              <nav className="flex-1 space-y-0.5 px-3 py-2">
                {NAV_LABELS.map((label) => {
                  const isActive = activeNav === label;
                  return (
                    <button
                      key={label}
                      onClick={() => { setActiveNav(label); setMobileSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl relative transition-all duration-200 ${
                        isActive
                          ? "text-white bg-white/[0.04]"
                          : "text-white/25 hover:bg-white/[0.03] hover:text-white/50"
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 w-0.5 h-5 bg-indigo-500 rounded-r-full" />
                      )}
                      <span className={isActive ? "text-indigo-400" : ""}>{NAV_ICONS[label]}</span>
                      <span className="text-[13px] font-semibold tracking-wide">{label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Logout (mobile) */}
              <div className="px-3 pb-4 mt-auto">
                <div className="pt-3 border-t border-white/[0.04]">
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-[12px] font-medium text-white/20 hover:text-rose-400/70 hover:bg-white/[0.02]"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── SIDEBAR (Desktop) ── */}
      <aside className="fixed left-0 top-14 bottom-0 w-60 flex-col py-6 border-r border-white/[0.04] bg-[#0a0a0a] z-40 hidden md:flex">
        {/* Active Project pill */}
        {(() => {
          const latestActive = projects.find((p) => p.status === "in-progress");
          if (!latestActive) return null;
          return (
            <div className="px-4 mb-6">
              <button
                onClick={() => router.push(`/project/${latestActive._id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] transition-all text-left group"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-white/70 truncate group-hover:text-white transition-colors">{latestActive.title}</p>
                  <p className="text-[10px] text-white/25">Step: {latestActive.currentStep}</p>
                </div>
              </button>
            </div>
          );
        })()}

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 px-3">
          {NAV_LABELS.map((label) => {
            const isActive = activeNav === label;
            return (
              <button
                key={label}
                onClick={() => setActiveNav(label)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl relative transition-all duration-200 group ${
                  isActive
                    ? "text-white bg-white/[0.04]"
                    : "text-white/25 hover:bg-white/[0.03] hover:text-white/50"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute left-0 w-0.5 h-5 bg-indigo-500 rounded-r-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={isActive ? "text-indigo-400" : ""}>{NAV_ICONS[label]}</span>
                <span className="text-[12px] font-semibold tracking-wide">{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 mt-auto">
          <div className="pt-3 border-t border-white/[0.04]">
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

      {/* ── MAIN ── */}
      <main className="md:ml-60 pt-14 p-6 md:p-8 min-h-screen">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4"
        >
          <div>
            <p className="text-indigo-400 font-semibold text-sm tracking-wide mb-1">Welcome back, {session?.user?.name?.split(" ")[0] || "Creative"}</p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white">Your Studio Canvas</h1>
          </div>
          <div className="bg-white/[0.02] px-4 py-3 rounded-xl border border-white/[0.04]">
            <p className="text-[10px] text-white/25 uppercase tracking-widest mb-1.5 font-bold">Compute Usage</p>
            <div className="flex items-center gap-3">
              <div className="w-32 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${storageStats.usedPercent}%` }}
                  transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <span className="text-xs font-bold text-white/60">{storageStats.usedPercent}%</span>
            </div>
          </div>
        </motion.header>

        <div className="grid grid-cols-12 gap-5">

          {/* ── Quick Actions ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="col-span-12 lg:col-span-4 rounded-2xl p-5 border border-white/[0.04] bg-white/[0.02] flex flex-col gap-4"
          >
            <h2 className="text-base font-bold tracking-tight text-white">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map(({ icon, label, color, gradient, onClick }) => (
                <motion.button
                  key={label}
                  onClick={onClick}
                  whileHover={{ y: -3, transition: { type: "spring", stiffness: 300 } }}
                  whileTap={{ scale: 0.96 }}
                  className="relative flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-all border border-white/[0.04] hover:border-white/[0.08] group cursor-pointer"
                >
                  <GlowingEffect spread={30} glow disabled={false} proximity={48} inactiveZone={0.01} />
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 relative z-10`}>
                    <span className="text-white">{icon}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 group-hover:text-white/60 transition-colors relative z-10">{label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* ── Cloud Storage ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="col-span-12 lg:col-span-8 rounded-2xl p-5 border border-white/[0.04] bg-white/[0.02] flex flex-col justify-between relative"
          >
            <GlowingEffect spread={50} glow disabled={false} proximity={80} inactiveZone={0.01} />
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-0">
              <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-500/[0.05] blur-[100px] rounded-full pointer-events-none" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-bold tracking-tight text-white">Cloud Storage</h2>
                <Badge variant="primary" size="sm">{storageStats.totalProjects} projects</Badge>
              </div>
              <p className="text-sm text-white/30 mb-5">{storageStats.totalUsed} of {storageStats.limit} used</p>
              <div className="h-2.5 bg-white/[0.04] rounded-full overflow-hidden flex mb-4">
                <motion.div
                  className="h-full bg-indigo-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${storageStats.video.pct}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                />
                <motion.div
                  className="h-full bg-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${storageStats.assets.pct}%` }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                />
                <motion.div
                  className="h-full bg-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${storageStats.audio.pct}%` }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                />
              </div>
              <div className="flex flex-wrap gap-5">
                {[
                  { color: "bg-indigo-500", label: storageStats.video.label },
                  { color: "bg-purple-500", label: storageStats.assets.label },
                  { color: "bg-pink-500", label: storageStats.audio.label },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${color}`} />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-white/30">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── Recent Projects ── */}
          <div className="col-span-12">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-black tracking-tight text-white">
                {activeNav === "Dashboard" ? "Recent Creations" : `${activeNav} Projects`}
                {searchQuery && <span className="text-sm font-normal text-white/25 ml-3">matching &ldquo;{searchQuery}&rdquo;</span>}
              </h2>
              <button
                onClick={() => { setActiveNav("Dashboard"); setSearchQuery(""); }}
                className="text-indigo-400 text-xs font-bold hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                {activeNav !== "Dashboard" || searchQuery ? "Show All" : `${projects.length} total`} <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))
              ) : filteredProjects.length === 0 && (projects.length > 0) ? (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                  <Search className="w-10 h-10 text-white/10 mb-4" />
                  <p className="text-sm font-bold text-white/30">No projects found</p>
                  <p className="text-xs text-white/15 mt-1">
                    {searchQuery ? `No results for "${searchQuery}"` : `No projects match the ${activeNav} filter`}
                  </p>
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="mt-3 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">Clear search</button>
                  )}
                </div>
              ) : (
                filteredProjects.map((project, i) => {
                  const statusColor = project.status === "completed" 
                    ? "success" as const
                    : "default" as const;
                  const statusLabel = project.status === "completed" ? "COMPLETED" : "EDITING";
                  
                  return (
                    <motion.div
                      key={project._id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      onClick={() => router.push(`/project/${project._id}`)}
                      whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                      className="group bg-white/[0.02] rounded-2xl cursor-pointer relative border border-white/[0.04] hover:border-white/[0.1] transition-all"
                    >
                      <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} />
                      
                      <div className="relative z-10 overflow-hidden rounded-2xl h-full flex flex-col">
                        {/* Thumbnail */}
                        <div className="relative h-40 overflow-hidden bg-[#0a0a0a]">
                        <img
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-40 group-hover:opacity-60"
                          src={project.steps?.images?.data?.[0]?.imageUrl || "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=600&q=80"}
                          alt={project.title}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-transparent" />
                        <div className="absolute top-3 right-3">
                          <Badge
                            variant={statusColor}
                            dot={project.status === "in-progress"}
                            pulse={project.status === "in-progress"}
                            size="sm"
                          >
                            {statusLabel}
                          </Badge>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-4 relative z-10 bg-[#0d0d0d]/40 backdrop-blur-md flex-1">
                        <h3 className="text-white font-bold mb-1 truncate text-sm group-hover:text-indigo-200 transition-colors">{project.title}</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-3">Step: {project.currentStep}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex -space-x-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 border-2 border-[#0d0d0d]" />
                          </div>
                          {/* Three-dot menu */}
                          <button
                            data-menu-trigger
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(menuOpenId === project._id ? null : project._id);
                            }}
                            className="text-white/15 hover:text-white/50 transition-colors p-1 rounded-lg hover:bg-white/[0.06] relative z-[1]"
                            aria-label="Project actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      </div>

                      {/* Three-dot dropdown */}
                      <AnimatePresence>
                        {menuOpenId === project._id && (
                          <motion.div
                            data-project-menu
                            initial={{ opacity: 0, scale: 0.95, y: 4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 4 }}
                            transition={{ duration: 0.12 }}
                            className="absolute bottom-12 right-4 bg-[#0d0d0d] border border-white/[0.08] rounded-xl shadow-2xl min-w-[160px] overflow-hidden"
                            style={{ zIndex: 9999 }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {[
                              { label: "Open", icon: ExternalLink, onClick: () => { router.push(`/project/${project._id}`); setMenuOpenId(null); } },
                              { label: "Duplicate", icon: Copy, onClick: () => handleDuplicate(project._id), disabled: actionLoading === project._id },
                              { label: "Rename", icon: Pencil, onClick: () => handleRenameStart(project) },
                            ].map((action) => (
                              <button
                                key={action.label}
                                onClick={action.onClick}
                                disabled={action.disabled}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-white/40 hover:text-white hover:bg-white/[0.03] transition-all disabled:opacity-30"
                              >
                                <action.icon className="w-3.5 h-3.5" /> {action.label}
                              </button>
                            ))}
                            <div className="border-t border-white/[0.04]" />
                            <button
                              onClick={() => handleDelete(project._id)}
                              disabled={actionLoading === project._id}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-rose-400/50 hover:text-rose-400 hover:bg-rose-500/[0.04] transition-all disabled:opacity-30"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}

              {/* New Project Card */}
              {!isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * filteredProjects.length + 0.1, duration: 0.4 }}
                  onClick={openCreate}
                  whileHover={{ y: -4, borderColor: "rgba(99,102,241,0.2)", transition: { type: "spring", stiffness: 300 } }}
                  className="group bg-transparent rounded-2xl transition-all flex flex-col items-center justify-center min-h-[280px] cursor-pointer border-2 border-dashed border-white/[0.06] hover:bg-white/[0.01]"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mb-3 group-hover:bg-indigo-500/10 transition-all duration-300"
                  >
                    <Plus className="w-5 h-5 text-white/20 group-hover:text-indigo-400 transition-colors" />
                  </motion.div>
                  <p className="text-sm font-bold text-white/20 group-hover:text-indigo-400 transition-colors">Start New Video</p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── Create Project Modal ── */}
      <CreateProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => setModalOpen(false)}
      />

      {/* ── LeetCode Live Terminal Panel ── */}
      <AnimatePresence>
        {lcPanelOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-6 right-6 z-50 w-full max-w-md bg-[#0a0a0a] border border-white/[0.07] rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05] bg-[#0d0d0d]">
              <div className="flex items-center gap-2.5">
                {lcRunning
                  ? <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                  : lcResult?.success
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  : <AlertCircle className="w-4 h-4 text-red-400" />}
                <span className="text-sm font-semibold text-white">
                  {lcRunning
                    ? "LeetCode Pipeline Running..."
                    : lcResult?.success
                    ? `Done · ${lcResult.problem?.difficulty ?? ""} · ${lcResult.problem?.title ?? ""}`
                    : lcResult?.error
                    ? "Pipeline Failed"
                    : "LeetCode Daily"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {lcRunning && (
                  <button
                    onClick={stopLeetCode}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-red-400 border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-all"
                  >
                    <X className="w-3 h-3" /> Stop
                  </button>
                )}
                <button
                  onClick={() => { setLcPanelOpen(false); setLcLog([]); setLcResult(null); }}
                  className="text-white/30 hover:text-white/60 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Terminal log */}
            <div
              ref={lcLogRef}
              className="h-56 overflow-y-auto px-4 py-3 space-y-1 font-mono bg-[#0a0a0a]"
            >
              {lcLog.length === 0 && (
                <p className="text-[11px] text-white/20">Initializing pipeline...</p>
              )}
              {lcLog.map((line, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-[11px] leading-relaxed text-emerald-400/70"
                >
                  <span className="text-white/20 mr-2">›</span>{line}
                </motion.p>
              ))}
              {lcRunning && (
                <p className="text-[11px] text-white/20 animate-pulse">▋</p>
              )}
              {lcResult?.error && (
                <p className="text-[11px] text-red-400 mt-1">{lcResult.error}</p>
              )}
            </div>

            {/* Footer */}
            {lcResult?.success && (
              <div className="px-4 py-2.5 border-t border-white/[0.05] bg-emerald-500/5 flex items-center justify-between">
                <span className="text-[11px] text-emerald-400/80">Video queued · publishes tomorrow at 07:00 UTC</span>
                <button
                  onClick={() => lcResult.projectId && router.push(`/project/${lcResult.projectId}`)}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                >
                  View project →
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── API Key Status Panel ── */}
      <AnimatePresence>
        {keysPanelOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-6 right-6 z-50 w-full max-w-sm bg-[#0a0a0a] border border-white/[0.07] rounded-2xl shadow-2xl overflow-hidden"
            style={{ right: lcPanelOpen ? "calc(24px + 28rem + 16px)" : "24px" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05] bg-[#0d0d0d]">
              <div className="flex items-center gap-2.5">
                {keysChecking
                  ? <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                  : keysResults?.every(r => r.ok)
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  : <AlertCircle className="w-4 h-4 text-amber-400" />}
                <span className="text-sm font-semibold text-white">
                  {keysChecking ? "Checking API keys..." : keysResults
                    ? `${keysResults.filter(r => r.ok).length}/${keysResults.length} keys OK`
                    : "API Status"}
                </span>
              </div>
              <button
                onClick={() => { setKeysPanelOpen(false); setKeysResults(null); }}
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results */}
            <div className="px-3 py-3 space-y-1.5 max-h-80 overflow-y-auto">
              {keysChecking && !keysResults && (
                <div className="flex items-center justify-center py-8 text-white/20 text-xs">
                  Running checks…
                </div>
              )}
              {keysResults?.map((r) => (
                <div
                  key={r.key}
                  className={`flex items-start gap-3 px-3 py-2.5 rounded-xl border ${
                    r.ok
                      ? "border-emerald-500/15 bg-emerald-500/5"
                      : "border-red-500/15 bg-red-500/5"
                  }`}
                >
                  <div className={`mt-0.5 shrink-0 ${r.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {r.ok
                      ? <CheckCircle2 className="w-3.5 h-3.5" />
                      : <AlertCircle className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold ${r.ok ? "text-white/80" : "text-red-300"}`}>{r.label}</p>
                    <p className={`text-[11px] mt-0.5 truncate ${r.ok ? "text-white/30" : "text-red-400/70"}`}>{r.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Re-check footer */}
            {keysResults && (
              <div className="px-4 py-2.5 border-t border-white/[0.05] flex justify-end">
                <button
                  onClick={checkApiKeys}
                  disabled={keysChecking}
                  className="text-[11px] text-violet-400 hover:text-violet-300 font-semibold transition-colors disabled:opacity-50"
                >
                  Re-check
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Rename Modal ── */}
      <AnimatePresence>
        {renameTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setRenameTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-[#0d0d0d] border border-white/[0.06] rounded-2xl shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-1">Rename Project</h3>
              <p className="text-xs text-white/25 mb-4">Enter a new name for your project.</p>
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/15 outline-none focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/15 transition-all font-medium"
                placeholder="Project title..."
              />
              <div className="flex justify-end gap-3 mt-5">
                <Button variant="ghost" onClick={() => setRenameTarget(null)}>Cancel</Button>
                <Button
                  onClick={handleRenameSubmit}
                  disabled={!renameValue.trim() || renameValue.trim() === renameTarget.title || actionLoading === renameTarget.id}
                  loading={actionLoading === renameTarget.id}
                >
                  Save
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
