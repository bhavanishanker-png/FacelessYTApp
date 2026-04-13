"use client";
import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles, Brain, Waves, Video, Captions, Share2,
  ArrowRight, ChevronDown, Play
} from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

export default function LandingPage() {
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen bg-[#141313] text-[#e5e2e1] font-sans overflow-x-hidden selection:bg-[#c0c1ff]/25">

      {/* NAV */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 w-full z-50 bg-[#141313]/80 backdrop-blur-xl border-b border-[#464554]/10 h-20"
      >
        <div className="flex justify-between items-center px-8 h-full max-w-7xl mx-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#a855f7] flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] group-hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tighter text-gradient-indigo">Velora AI</span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {["Studio", "Library", "AI Assets", "Analytics"].map((item, i) => (
              <a
                key={item}
                href="#"
                className={`text-sm font-semibold tracking-wide uppercase transition-all duration-300 ${
                  i === 0 ? "text-[#c0c1ff]" : "text-[#e5e2e1]/50 hover:text-[#c0c1ff]"
                }`}
              >
                {item}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <Link href="/signup">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="bg-[#8083ff] text-[#07006c] px-6 py-2.5 rounded-xl font-bold text-sm tracking-tight hover:shadow-[0_0_30px_rgba(128,131,255,0.35)] transition-all duration-300"
            >
              Get Started
            </motion.button>
          </Link>
        </div>
      </motion.header>

      <main className="pt-20">

        {/* ── HERO ── */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden px-6">
          {/* Cinematic BG */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-[#141313] via-transparent to-[#141313] z-10" />
            <div className="absolute inset-0 bg-[#141313]/50 z-10" />
            <img
              src="https://images.unsplash.com/photo-1536240478700-b869ad10a2eb?w=1600&q=80"
              alt="Studio"
              className="w-full h-full object-cover grayscale opacity-30 scale-105"
            />
          </div>

          {/* Ambient glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#6366f1]/10 blur-[120px] rounded-full pointer-events-none z-0" />

          <div className="relative z-20 max-w-5xl text-center">
            {/* Badge */}
            <motion.div {...fadeUp(0.1)} className="mb-8">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#464554]/30 bg-[#201f1f]/50 backdrop-blur-md text-[10px] font-bold tracking-[0.2em] uppercase text-[#c7c4d7]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c0c1ff] animate-pulse" />
                The Future of Content Creation
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              {...fadeUp(0.2)}
              className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 bg-gradient-to-b from-[#e5e2e1] to-[#c7c4d7] bg-clip-text text-transparent"
            >
              Generate YouTube{" "}
              <br className="hidden md:block" />
              videos from ideas to{" "}
              <span className="italic text-[#c0c1ff]">final render.</span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              {...fadeUp(0.35)}
              className="text-lg md:text-xl text-[#c7c4d7]/70 max-w-2xl mx-auto mb-12 leading-relaxed"
            >
              Velora AI automates the workflow of top-tier creators. Scripting, visuals, voiceover, and editing—all synthesized in minutes.
            </motion.p>

            {/* CTAs */}
            <motion.div {...fadeUp(0.45)} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
              <Link href="/signup">
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: "0 0 40px rgba(192,193,255,0.25)" }}
                  whileTap={{ scale: 0.97 }}
                  className="group flex items-center gap-2 bg-[#c0c1ff] text-[#07006c] px-10 py-5 rounded-xl font-bold text-lg transition-all duration-300"
                >
                  Start Creating Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
              <button className="flex items-center gap-2 px-10 py-5 rounded-xl font-bold text-lg border border-[#464554]/40 text-[#c7c4d7] hover:bg-[#353434]/30 hover:text-white transition-all">
                <Play className="w-5 h-5" />
                View Showcase
              </button>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-subtle opacity-30 z-20">
            <ChevronDown className="w-7 h-7" />
          </div>
        </section>

        {/* ── FEATURES / BENTO GRID ── */}
        <section className="py-32 px-8 max-w-7xl mx-auto mesh-gradient">
          <div className="mb-20">
            <p className="text-sm font-bold text-[#c0c1ff] tracking-[0.3em] uppercase mb-4">Core Engine</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">The Obsidian Edit Suite.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Large card */}
            <motion.div
              whileHover={{ borderColor: "rgba(99,102,241,0.4)" }}
              className="md:col-span-8 group relative overflow-hidden rounded-3xl bg-[#201f1f]/60 backdrop-blur-2xl border border-[#464554]/15 p-10 transition-all duration-500"
            >
              <div className="relative z-10 max-w-md">
                <div className="w-12 h-12 rounded-2xl bg-[#6366f1]/15 border border-[#6366f1]/20 flex items-center justify-center mb-6">
                  <Brain className="w-6 h-6 text-[#c0c1ff]" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Concept-to-Script AI</h3>
                <p className="text-[#c7c4d7] leading-relaxed mb-8">
                  Simply prompt your niche and tone. Our neural engine builds complete, SEO-optimized YouTube scripts with built-in hook points and retention loops.
                </p>
                <div className="flex items-center gap-2 text-[#c0c1ff] font-bold text-sm cursor-pointer group/link">
                  Explore Neural Scripting
                  <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                </div>
              </div>
              <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-10 group-hover:opacity-25 transition-opacity duration-700 bg-gradient-to-l from-[#6366f1]/30 to-transparent" />
            </motion.div>

            {/* Secondary card */}
            <motion.div
              whileHover={{ borderColor: "rgba(221,183,255,0.4)" }}
              className="md:col-span-4 rounded-3xl bg-[#201f1f]/60 backdrop-blur-2xl border border-[#464554]/15 p-10 transition-all duration-500"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#a855f7]/10 border border-[#a855f7]/20 flex items-center justify-center mb-6">
                <Waves className="w-6 h-6 text-[#ddb7ff]" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Hyper-Real Audio</h3>
              <p className="text-[#c7c4d7] leading-relaxed">
                Studio-quality AI voice synthesis with human-like inflection and atmospheric sound design synced automatically to your timeline.
              </p>
            </motion.div>

            {/* Small cards */}
            {[
              { icon: <Video className="w-5 h-5 text-[#c7c4d7]" />, title: "Auto-B-Roll", desc: "Seamlessly sources and cuts high-end footage to match your script's context." },
              { icon: <Captions className="w-5 h-5 text-[#c7c4d7]" />, title: "Dynamic Captions", desc: "Modern, high-retention animated captions tailored to your brand identity." },
              { icon: <Share2 className="w-5 h-5 text-[#c7c4d7]" />, title: "Multi-Format", desc: "One-click export for Shorts, Reels, TikTok, and standard widescreen YouTube." },
            ].map((card) => (
              <motion.div
                key={card.title}
                whileHover={{ borderColor: "rgba(70,69,84,0.5)" }}
                className="md:col-span-4 rounded-3xl bg-[#201f1f]/60 backdrop-blur-2xl border border-[#464554]/15 p-8 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-[#2a2a2a] flex items-center justify-center mb-4 border border-[#464554]/20">
                  {card.icon}
                </div>
                <h4 className="text-xl font-bold mb-2">{card.title}</h4>
                <p className="text-sm text-[#c7c4d7]/70">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="py-32 flex flex-col items-center justify-center">
          <div className="max-w-4xl px-8 w-full">
            <div className="rounded-[2.5rem] bg-gradient-to-br from-[#2a2a2a] to-[#141313] p-12 md:p-20 text-center relative overflow-hidden border border-[#464554]/20 shadow-2xl">
              <div className="absolute inset-0 opacity-5 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800')] bg-cover" />
              <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-[#a855f7]/8 blur-[100px] rounded-full" />
              <div className="relative z-10">
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">
                  Ready to launch your{" "}
                  <span className="text-[#ddb7ff]">next viral hit?</span>
                </h2>
                <p className="text-lg text-[#c7c4d7]/70 mb-10 max-w-xl mx-auto">
                  Join 15,000+ creators who have replaced weeks of editing with minutes of AI magic.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="bg-[#0e0e0e] border border-[#464554]/30 rounded-xl px-6 py-4 w-full sm:w-72 focus:ring-2 focus:ring-[#c0c1ff]/40 focus:border-transparent outline-none text-[#e5e2e1] placeholder:text-[#908fa0]/50"
                  />
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="bg-[#c0c1ff] text-[#07006c] font-bold px-8 py-4 rounded-xl hover:shadow-[0_0_30px_rgba(192,193,255,0.3)] transition-all"
                  >
                    Get Early Access
                  </motion.button>
                </div>
                <p className="text-[10px] uppercase tracking-widest text-[#c7c4d7]/30 mt-6">
                  No credit card required • 5 free renders included
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="py-12 border-t border-[#464554]/10">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#a855f7] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tighter text-gradient-indigo">Velora AI</span>
          </div>
          <div className="flex gap-8 text-[10px] font-medium tracking-widest uppercase text-[#c7c4d7]/30">
            {["Privacy Policy", "Terms of Service", "Security", "Brand Assets"].map((item) => (
              <a key={item} href="#" className="hover:text-[#c0c1ff] transition-colors">{item}</a>
            ))}
          </div>
          <div className="text-[10px] text-[#c7c4d7]/20 tracking-widest">
            © 2024 VELORA AI LABS. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </div>
  );
}
