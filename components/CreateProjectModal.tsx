"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Film, Smartphone, MonitorPlay } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";

const PROJECT_TYPES = [
  {
    id: "shorts",
    label: "Shorts",
    desc: "Vertical 9:16 for Shorts, Reels & TikTok",
    icon: Smartphone,
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "long",
    label: "Long-form",
    desc: "Horizontal 16:9 standard YouTube",
    icon: MonitorPlay,
    color: "from-indigo-500 to-purple-500",
  },
];

export const CreateProjectModal = ({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("shorts");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/project/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, type }),
      });
      if (res.ok) {
        const data = await res.json();
        setTitle("");
        setType("shorts");
        onSuccess();
        onClose();
        router.push(`/project/${data._id}`);
      } else {
        console.error("Failed to create");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#0d0d0d] border border-white/[0.06] rounded-2xl shadow-2xl p-8 z-50"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">New Project</h2>
                <p className="text-sm text-white/30 mt-1">Start a new AI-powered video.</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white transition-all"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <Input
                label="Project Title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. My Next Viral Video"
                icon={<Film className="w-4 h-4" />}
                required
              />

              {/* Type selector — visual cards */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-white/40 ml-1 block mb-3">
                  Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {PROJECT_TYPES.map((pt) => {
                    const isSelected = type === pt.id;
                    return (
                      <motion.button
                        key={pt.id}
                        type="button"
                        onClick={() => setType(pt.id)}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        className={`relative p-4 rounded-xl border text-left transition-all duration-200 ${
                          isSelected
                            ? "border-indigo-500/40 bg-indigo-500/[0.06] shadow-[0_0_20px_rgba(99,102,241,0.08)]"
                            : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${pt.color} flex items-center justify-center mb-3 ${isSelected ? "shadow-lg" : "opacity-60"} transition-all`}>
                          <pt.icon className="w-5 h-5 text-white" />
                        </div>
                        <h4 className={`text-sm font-bold ${isSelected ? "text-white" : "text-white/50"} transition-colors`}>
                          {pt.label}
                        </h4>
                        <p className="text-[11px] text-white/25 mt-0.5">{pt.desc}</p>

                        {isSelected && (
                          <motion.div
                            layoutId="type-indicator"
                            className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center"
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          >
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  disabled={!title.trim()}
                  glow
                >
                  {loading ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
