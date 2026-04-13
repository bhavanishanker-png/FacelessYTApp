"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signOut, useSession } from "next-auth/react";
import {
  Sparkles, LayoutDashboard, Film, Clock, FolderOpen,
  Share2, Bell, Settings, Search, Plus, MoreVertical,
  Mic, Captions, ChevronRight, HelpCircle, LogOut,
} from "lucide-react";
import { CreateProjectModal } from "@/components/CreateProjectModal";

const NAV_ITEMS = [
  { icon: <LayoutDashboard className="w-4 h-4" />, label: "Dashboard", href: "/dashboard", active: true },
  { icon: <Film className="w-4 h-4" />, label: "Editor", href: "#", active: false },
  { icon: <Clock className="w-4 h-4" />, label: "Timeline", href: "#", active: false },
  { icon: <FolderOpen className="w-4 h-4" />, label: "Media", href: "#", active: false },
  { icon: <Share2 className="w-4 h-4" />, label: "Export", href: "#", active: false },
];

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
            {["Projects", "Assets", "Templates"].map((item, i) => (
              <a
                key={item}
                href="#"
                className={`font-bold tracking-tight text-sm transition-all duration-300 ${
                  i === 0
                    ? "text-[#c0c1ff] border-b-2 border-[#c0c1ff] pb-0.5"
                    : "text-[#e5e2e1]/50 hover:text-[#c0c1ff]"
                }`}
              >
                {item}
              </a>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center bg-[#0e0e0e] px-4 py-2 rounded-full border border-[#464554]/15">
            <Search className="w-4 h-4 text-[#908fa0] mr-2" />
            <input
              className="bg-transparent border-none focus:ring-0 text-sm text-[#e5e2e1] w-48 placeholder:text-[#908fa0]/50 outline-none"
              placeholder="Search projects..."
              type="text"
            />
          </div>
          <button
            className="text-[#e5e2e1]/50 hover:text-[#c0c1ff] transition-all"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
          </button>
          <button
            className="text-[#e5e2e1]/50 hover:text-[#c0c1ff] transition-all"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <motion.button
            onClick={openCreate}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="bg-[#8083ff] text-[#07006c] px-5 py-2 rounded-xl text-sm font-bold transition-all"
          >
            Create New
          </motion.button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366f1] to-[#a855f7] flex items-center justify-center text-white text-xs font-bold cursor-pointer">
            V
          </div>
        </div>
      </nav>

      {/* ── SIDEBAR ── */}
      <aside className="fixed left-0 top-16 bottom-0 w-64 flex flex-col py-6 border-r border-[#464554]/10 bg-[#1c1b1b]/40 backdrop-blur-xl z-40">
        {/* Active Project pill */}
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#201f1f]">
            <div className="w-10 h-10 bg-[#6f00be] rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#ddb7ff]" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#c0c1ff]">Project Alpha</p>
              <p className="text-[10px] text-[#908fa0]">AI Processing...</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 px-3">
          {NAV_ITEMS.map(({ icon, label, href, active }) => (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl relative transition-all group ${
                active
                  ? "text-[#c0c1ff] bg-[#c0c1ff]/5"
                  : "text-[#e5e2e1]/35 hover:bg-[#c0c1ff]/8 hover:text-[#c0c1ff]"
              }`}
            >
              {active && <span className="absolute left-0 w-0.5 h-5 bg-[#c0c1ff] rounded-r-full" />}
              {icon}
              <span className="text-xs font-medium uppercase tracking-widest">{label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-4 mt-auto space-y-3">
          <button
            onClick={openCreate}
            className="w-full py-2.5 rounded-xl border border-[#c0c1ff]/20 text-[#c0c1ff] text-xs font-bold uppercase tracking-widest hover:bg-[#c0c1ff]/10 transition-all"
          >
            Upgrade Plan
          </button>
          <div className="pt-3 border-t border-[#464554]/10 space-y-0.5">
            <a
              href="#"
              className="flex items-center gap-4 px-2 py-2 rounded-lg transition-all text-[10px] font-medium uppercase tracking-widest text-[#e5e2e1]/35 hover:text-[#c0c1ff]"
            >
              <HelpCircle className="w-4 h-4" />
              Help
            </a>
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
            <p className="text-[#c0c1ff] font-medium text-sm tracking-wide mb-1">Welcome back, Creative</p>
            <h1 className="text-4xl font-black tracking-tighter text-[#e5e2e1]">Your Studio Canvas</h1>
          </div>
          <div className="bg-[#201f1f] px-4 py-3 rounded-xl border border-[#464554]/10">
            <p className="text-[10px] text-[#908fa0] uppercase tracking-widest mb-1.5">Compute Usage</p>
            <div className="flex items-center gap-3">
              <div className="w-32 h-1.5 bg-[#353434] rounded-full overflow-hidden">
                <div className="h-full bg-[#c0c1ff] rounded-full" style={{ width: "65%" }} />
              </div>
              <span className="text-xs font-bold text-[#e5e2e1]">65%</span>
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
              <h2 className="text-lg font-bold tracking-tight mb-1">Cloud Storage</h2>
              <p className="text-sm text-[#908fa0] mb-6">42.8 GB of 100 GB used</p>
              <div className="h-3 bg-[#353434] rounded-full overflow-hidden flex mb-4">
                <div className="h-full bg-[#c0c1ff] rounded-full" style={{ width: "30%" }} />
                <div className="h-full bg-[#ddb7ff]" style={{ width: "12%" }} />
                <div className="h-full bg-[#f751a1]" style={{ width: "5%" }} />
              </div>
              <div className="flex flex-wrap gap-6">
                {[
                  { color: "bg-[#c0c1ff]", label: "Videos (30GB)" },
                  { color: "bg-[#ddb7ff]", label: "Assets (12GB)" },
                  { color: "bg-[#f751a1]", label: "Audio (0.8GB)" },
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
              <h2 className="text-2xl font-black tracking-tight">Recent Creations</h2>
              <button
                onClick={() => {}}
                className="text-[#c0c1ff] text-xs font-bold uppercase tracking-widest hover:underline flex items-center gap-1 transition-all"
              >
                View All Projects <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="h-[300px] bg-[#201f1f] rounded-3xl animate-pulse border border-[#464554]/10" />
                ))
              ) : (
                projects.map((project) => {
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
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(menuOpenId === project._id ? null : project._id);
                            }}
                            className="text-[#908fa0] hover:text-[#c0c1ff] transition-colors p-1 rounded-lg hover:bg-white/10"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Three-dot dropdown */}
                      {menuOpenId === project._id && (
                        <div
                          className="absolute bottom-12 right-4 bg-[#1c1b1b] border border-[#464554]/20 rounded-xl shadow-xl z-10 min-w-[140px] overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {["Open", "Duplicate", "Rename", "Delete"].map((action) => (
                            <button
                              key={action}
                              onClick={() => {
                                if (action === "Open") router.push(`/project/${project._id}`);
                                setMenuOpenId(null);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-widest transition-all hover:bg-white/5 ${
                                action === "Delete" ? "text-rose-400/70 hover:text-rose-400" : "text-[#e5e2e1]/60 hover:text-[#c0c1ff]"
                              }`}
                            >
                              {action}
                            </button>
                          ))}
                        </div>
                      )}
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

      {/* Close dropdown on outside click */}
      {menuOpenId && (
        <div
          className="fixed inset-0 z-[5]"
          onClick={() => setMenuOpenId(null)}
        />
      )}
    </div>
  );
}
