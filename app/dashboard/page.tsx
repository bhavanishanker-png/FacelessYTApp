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
} from "lucide-react";
import { CreateProjectModal } from "@/components/CreateProjectModal";

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
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

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
      <div className="w-8 h-8 rounded-full border-2 border-[#6366f1] border-t-transparent animate-spin" />
    </div>;
  }

  const openCreate = () => setModalOpen(true);

  const quickActions = [
    {
      icon: <Sparkles className="w-5 h-5" />,
      label: "AI Script",
      color: "text-[#c0c1ff]",
      hover: "hover:bg-[#c0c1ff]/20",
      onClick: openCreate,
    },
    {
      icon: <Mic className="w-5 h-5" />,
      label: "Voiceover",
      color: "text-[#ddb7ff]",
      hover: "hover:bg-[#ddb7ff]/20",
      onClick: openCreate,
    },
    {
      icon: <Film className="w-5 h-5" />,
      label: "B-Roll",
      color: "text-[#c0c1ff]",
      hover: "hover:bg-[#c0c1ff]/20",
      onClick: openCreate,
    },
    {
      icon: <Captions className="w-5 h-5" />,
      label: "Captions",
      color: "text-[#ddb7ff]",
      hover: "hover:bg-[#ddb7ff]/20",
      onClick: openCreate,
    },
  ];

  return (
    <div className="min-h-screen bg-[#141313] text-[#e5e2e1] font-sans selection:bg-[#c0c1ff]/20">

      {/* ── TOP NAV ── */}
      <nav className="flex justify-between items-center px-8 h-16 w-full fixed top-0 bg-[#141313]/80 backdrop-blur-xl z-50 border-b border-[#464554]/10">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#a855f7] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-lg font-black tracking-tighter text-[#c0c1ff]">Velora Studio</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <span className="font-bold tracking-tight text-sm text-[#c0c1ff] border-b-2 border-[#c0c1ff] pb-0.5">Projects</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* ── Search ── */}
          <div className="hidden lg:flex items-center bg-[#0e0e0e] px-4 py-2 rounded-full border border-[#464554]/15 focus-within:border-[#c0c1ff]/30 transition-colors">
            <Search className="w-4 h-4 text-[#908fa0] mr-2" />
            <input
              className="bg-transparent border-none focus:ring-0 text-sm text-[#e5e2e1] w-48 placeholder:text-[#908fa0]/50 outline-none"
              placeholder="Search projects..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-[#908fa0] hover:text-[#c0c1ff] transition-colors ml-1">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* ── Notifications ── */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
              className={`relative text-[#e5e2e1]/50 hover:text-[#c0c1ff] transition-all ${showNotifications ? "text-[#c0c1ff]" : ""}`}
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#f751a1] rounded-full" />
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-80 bg-[#1c1b1b] border border-[#464554]/20 rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-[#464554]/10 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-[#e5e2e1]">Notifications</h3>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#c0c1ff] bg-[#c0c1ff]/10 px-2 py-0.5 rounded-full">3 new</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {[
                      { title: "Render Complete", desc: "Your video has finished rendering.", time: "2m ago", dot: "bg-[#4ade80]" },
                      { title: "AI Script Ready", desc: "Script generation completed for your project.", time: "15m ago", dot: "bg-[#c0c1ff]" },
                      { title: "Storage Warning", desc: "You've used 65% of your cloud storage.", time: "1h ago", dot: "bg-[#f59e0b]" },
                    ].map((n, i) => (
                      <div key={i} className="px-5 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer border-b border-[#464554]/5 last:border-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${n.dot}`} />
                          <span className="text-xs font-bold text-[#e5e2e1]">{n.title}</span>
                          <span className="ml-auto text-[9px] text-[#908fa0] font-medium">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-[#908fa0] pl-3.5">{n.desc}</p>
                      </div>
                    ))}
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>



          {/* ── Create New ── */}
          <motion.button
            onClick={openCreate}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="bg-[#8083ff] text-[#07006c] px-5 py-2 rounded-xl text-sm font-bold transition-all"
          >
            Create New
          </motion.button>

          {/* ── Profile ── */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366f1] to-[#a855f7] flex items-center justify-center text-white text-xs font-bold cursor-pointer ring-2 ring-transparent hover:ring-[#c0c1ff]/40 transition-all"
            >
              {session?.user?.name?.charAt(0)?.toUpperCase() || "V"}
            </button>
            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-64 bg-[#1c1b1b] border border-[#464554]/20 rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  {/* User info */}
                  <div className="px-5 py-4 border-b border-[#464554]/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6366f1] to-[#a855f7] flex items-center justify-center text-white text-sm font-bold">
                        {session?.user?.name?.charAt(0)?.toUpperCase() || "V"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#e5e2e1] truncate">{session?.user?.name || "User"}</p>
                        <p className="text-[10px] text-[#908fa0] truncate">{session?.user?.email || ""}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#464554]/10 py-1">
                    <button
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="w-full flex items-center gap-3 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#ffb4ab]/70 hover:text-[#ffb4ab] hover:bg-white/[0.03] transition-all"
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

      {/* ── SIDEBAR ── */}
      <aside className="fixed left-0 top-16 bottom-0 w-64 flex flex-col py-6 border-r border-[#464554]/10 bg-[#1c1b1b]/40 backdrop-blur-xl z-40">
        {/* Active Project pill — shows most recent in-progress project */}
        {(() => {
          const latestActive = projects.find((p) => p.status === "in-progress");
          if (!latestActive) return null;
          return (
            <div className="px-6 mb-8">
              <button
                onClick={() => router.push(`/project/${latestActive._id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#201f1f] hover:bg-[#2a2a2a] transition-colors text-left"
              >
                <div className="w-10 h-10 bg-[#6f00be] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-[#ddb7ff]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#c0c1ff] truncate">{latestActive.title}</p>
                  <p className="text-[10px] text-[#908fa0]">Step: {latestActive.currentStep}</p>
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
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl relative transition-all group ${
                  isActive
                    ? "text-[#c0c1ff] bg-[#c0c1ff]/5"
                    : "text-[#e5e2e1]/35 hover:bg-[#c0c1ff]/8 hover:text-[#c0c1ff]"
                }`}
              >
                {isActive && <span className="absolute left-0 w-0.5 h-5 bg-[#c0c1ff] rounded-r-full" />}
                {NAV_ICONS[label]}
                <span className="text-xs font-medium uppercase tracking-widest">{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-4 mt-auto space-y-3">
          <div className="pt-3 border-t border-[#464554]/10 space-y-0.5">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-4 px-2 py-2 rounded-lg transition-all text-[10px] font-medium uppercase tracking-widest text-[#e5e2e1]/35 hover:text-[#ffb4ab]"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="ml-64 pt-16 p-8 min-h-screen">
        {/* Header */}
        <header className="mb-10 flex justify-between items-end">
          <div>
            <p className="text-[#c0c1ff] font-medium text-sm tracking-wide mb-1">Welcome back, {session?.user?.name?.split(" ")[0] || "Creative"}</p>
            <h1 className="text-4xl font-black tracking-tighter text-[#e5e2e1]">Your Studio Canvas</h1>
          </div>
          <div className="bg-[#201f1f] px-4 py-3 rounded-xl border border-[#464554]/10">
            <p className="text-[10px] text-[#908fa0] uppercase tracking-widest mb-1.5">Compute Usage</p>
            <div className="flex items-center gap-3">
              <div className="w-32 h-1.5 bg-[#353434] rounded-full overflow-hidden">
                <div className="h-full bg-[#c0c1ff] rounded-full transition-all duration-700" style={{ width: `${storageStats.usedPercent}%` }} />
              </div>
              <span className="text-xs font-bold text-[#e5e2e1]">{storageStats.usedPercent}%</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6">

          {/* ── Quick Actions ── */}
          <div className="col-span-12 lg:col-span-4 rounded-3xl p-6 border border-[#464554]/10 bg-[#1c1b1b]/60 flex flex-col gap-4">
            <h2 className="text-lg font-bold tracking-tight">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map(({ icon, label, color, hover, onClick }) => (
                <motion.button
                  key={label}
                  onClick={onClick}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl bg-[#2a2a2a] ${hover} transition-all border border-[#464554]/5 group cursor-pointer`}
                >
                  <span className={`${color} group-hover:scale-110 transition-transform`}>{icon}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#e5e2e1]/60">{label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* ── Cloud Storage ── */}
          <div className="col-span-12 lg:col-span-8 rounded-3xl p-6 border border-[#464554]/10 bg-[#1c1b1b]/60 flex flex-col justify-between overflow-hidden relative">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-bold tracking-tight">Cloud Storage</h2>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#c0c1ff] bg-[#c0c1ff]/10 px-2.5 py-1 rounded-full">
                  {storageStats.totalProjects} projects
                </span>
              </div>
              <p className="text-sm text-[#908fa0] mb-6">{storageStats.totalUsed} of {storageStats.limit} used</p>
              <div className="h-3 bg-[#353434] rounded-full overflow-hidden flex mb-4">
                <div className="h-full bg-[#c0c1ff] rounded-full transition-all duration-700" style={{ width: `${storageStats.video.pct}%` }} />
                <div className="h-full bg-[#ddb7ff] transition-all duration-700" style={{ width: `${storageStats.assets.pct}%` }} />
                <div className="h-full bg-[#f751a1] transition-all duration-700" style={{ width: `${storageStats.audio.pct}%` }} />
              </div>
              <div className="flex flex-wrap gap-6">
                {[
                  { color: "bg-[#c0c1ff]", label: storageStats.video.label },
                  { color: "bg-[#ddb7ff]", label: storageStats.assets.label },
                  { color: "bg-[#f751a1]", label: storageStats.audio.label },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${color}`} />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#e5e2e1]/50">{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#c0c1ff]/8 blur-[100px] rounded-full" />
          </div>

          {/* ── Recent Projects ── */}
          <div className="col-span-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black tracking-tight">
                {activeNav === "Dashboard" ? "Recent Creations" : `${activeNav} Projects`}
                {searchQuery && <span className="text-sm font-normal text-[#908fa0] ml-3">matching "{searchQuery}"</span>}
              </h2>
              <button
                onClick={() => { setActiveNav("Dashboard"); setSearchQuery(""); }}
                className="text-[#c0c1ff] text-xs font-bold uppercase tracking-widest hover:underline flex items-center gap-1 transition-all"
              >
                {activeNav !== "Dashboard" || searchQuery ? "Show All" : `${projects.length} total`} <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="h-[300px] bg-[#201f1f] rounded-3xl animate-pulse border border-[#464554]/10" />
                ))
              ) : filteredProjects.length === 0 && (projects.length > 0) ? (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                  <Search className="w-10 h-10 text-[#908fa0]/30 mb-4" />
                  <p className="text-sm font-bold text-[#908fa0]">No projects found</p>
                  <p className="text-xs text-[#908fa0]/60 mt-1">
                    {searchQuery ? `No results for "${searchQuery}"` : `No projects match the ${activeNav} filter`}
                  </p>
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="mt-3 text-xs font-bold text-[#c0c1ff] hover:underline">Clear search</button>
                  )}
                </div>
              ) : (
                filteredProjects.map((project) => {
                  const statusColor = project.status === "completed" 
                    ? "bg-[#6f00be]/80 text-[#d6a9ff]" 
                    : "bg-[#2a2a2a]/80 text-[#908fa0]";
                  const statusLabel = project.status === "completed" ? "COMPLETED" : "EDITING";
                  
                  return (
                    <motion.div
                      key={project._id}
                      onClick={() => router.push(`/project/${project._id}`)}
                      whileHover={{ boxShadow: "0 0 0 1.5px rgba(192,193,255,0.35)", y: -4 }}
                      transition={{ duration: 0.2 }}
                      style={{ border: "1px solid rgba(70,69,84,0.10)" }}
                      className="group bg-[#201f1f] rounded-3xl overflow-hidden cursor-pointer relative"
                    >
                      {/* Thumbnail */}
                      <div className="relative h-44 overflow-hidden bg-[#1c1b1b]">
                        <img
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-50"
                          src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=600&q=80"
                          alt={project.title}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#201f1f] to-transparent" />
                        <div className={`absolute top-3 right-3 ${statusColor} backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2`}>
                          {project.status === "in-progress" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#c0c1ff] animate-pulse" />
                          )}
                          <span className="text-[10px] font-bold uppercase tracking-widest">{statusLabel}</span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-5">
                        <h3 className="text-[#e5e2e1] font-bold mb-1 truncate">{project.title}</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#908fa0] mb-4">Step: {project.currentStep}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex -space-x-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6366f1] to-[#a855f7] border-2 border-[#201f1f]" />
                          </div>
                          {/* Three-dot menu — stop propagation so card click doesn't fire */}
                          <button
                            data-menu-trigger
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(menuOpenId === project._id ? null : project._id);
                            }}
                            className="text-[#908fa0] hover:text-[#c0c1ff] transition-colors p-1 rounded-lg hover:bg-white/10 relative z-[1]"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
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
                            className="absolute bottom-12 right-4 bg-[#1c1b1b] border border-[#464554]/20 rounded-xl shadow-2xl min-w-[160px] overflow-hidden"
                            style={{ zIndex: 9999 }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => { router.push(`/project/${project._id}`); setMenuOpenId(null); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#e5e2e1]/60 hover:text-[#c0c1ff] hover:bg-white/5 transition-all"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Open
                            </button>
                            <button
                              onClick={() => handleDuplicate(project._id)}
                              disabled={actionLoading === project._id}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#e5e2e1]/60 hover:text-[#c0c1ff] hover:bg-white/5 transition-all disabled:opacity-40"
                            >
                              <Copy className="w-3.5 h-3.5" /> Duplicate
                            </button>
                            <button
                              onClick={() => handleRenameStart(project)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#e5e2e1]/60 hover:text-[#c0c1ff] hover:bg-white/5 transition-all"
                            >
                              <Pencil className="w-3.5 h-3.5" /> Rename
                            </button>
                            <div className="border-t border-[#464554]/10" />
                            <button
                              onClick={() => handleDelete(project._id)}
                              disabled={actionLoading === project._id}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/5 transition-all disabled:opacity-40"
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
              <motion.div
                onClick={openCreate}
                whileHover={{ boxShadow: "0 0 0 2px rgba(192,193,255,0.35)", y: -4 }}
                transition={{ duration: 0.2 }}
                style={{ border: "2px dashed rgba(70,69,84,0.20)" }}
                className="group bg-[#0e0e0e] rounded-3xl transition-all flex flex-col items-center justify-center min-h-[300px] cursor-pointer"
              >
                <div className="w-14 h-14 rounded-full bg-[#201f1f] flex items-center justify-center mb-4 group-hover:bg-[#8083ff]/20 transition-all duration-300">
                  <Plus className="w-6 h-6 text-[#c0c1ff]" />
                </div>
                <p className="text-sm font-bold text-[#908fa0] group-hover:text-[#c0c1ff] transition-colors">Start New Video</p>
              </motion.div>
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

      {/* ── Rename Modal ── */}
      <AnimatePresence>
        {renameTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setRenameTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-[#1c1b1b] border border-[#464554]/20 rounded-2xl shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-[#e5e2e1] mb-1">Rename Project</h3>
              <p className="text-xs text-[#908fa0] mb-4">Enter a new name for your project.</p>
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
                className="w-full bg-[#0e0e0e] border border-[#464554]/20 rounded-xl px-4 py-3 text-sm text-[#e5e2e1] placeholder:text-[#908fa0]/50 outline-none focus:border-[#c0c1ff]/40 transition-colors"
                placeholder="Project title..."
              />
              <div className="flex justify-end gap-3 mt-5">
                <button
                  onClick={() => setRenameTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-[#908fa0] hover:text-[#e5e2e1] hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRenameSubmit}
                  disabled={!renameValue.trim() || renameValue.trim() === renameTarget.title || actionLoading === renameTarget.id}
                  className="px-5 py-2 rounded-xl bg-[#8083ff] text-[#07006c] text-xs font-bold uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#9395ff] transition-all flex items-center gap-2"
                >
                  {actionLoading === renameTarget.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
