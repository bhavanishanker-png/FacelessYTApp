"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { NoiseBackgroundDemo } from "@/components/NoiseBackgroundDemo";
import { ThreeDCardDemo } from "@/components/ThreeDCardDemo";
import { CarouselDemo } from "@/components/CarouselDemo";
import { AnimatedTestimonialsDemo } from "@/components/AnimatedTestimonialsDemo";
import { Zap, LayoutTemplate, PlayCircle, Clock, PlaySquare, ArrowRight } from "lucide-react";
import { GridPattern } from "@/components/ui/grid-pattern";
import "./globals.css"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans overflow-x-hidden selection:bg-indigo-500/30">

      {/* NAVBAR */}
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 lg:px-16 py-4 bg-[#030303]/70 backdrop-blur-xl border-b border-white/[0.04]"
      >
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_25px_-5px_rgba(99,102,241,0.4)] group-hover:shadow-[0_0_35px_-5px_rgba(99,102,241,0.7)] transition-all">
            <PlaySquare className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 group-hover:to-white transition-all">
            AI Studio
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-5 py-2 rounded-full text-[13px] font-semibold text-white/50 hover:text-white/90 transition-colors duration-200"
          >
            Login
          </Link>
          <Link href="/signup">
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="px-5 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-[13px] font-bold tracking-wide shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all flex items-center gap-1.5"
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.div>
          </Link>
        </div>
      </motion.nav>
      
      {/* 1. HERO SECTION */}
      <section className="relative w-full pt-36 pb-24 flex flex-col items-center justify-center min-h-[85vh] px-6 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80%] max-w-3xl h-[600px] bg-indigo-500/10 blur-[150px] -z-10 rounded-full mix-blend-screen pointer-events-none" />

        <GridPattern
          width={40}
          height={40}
          strokeDasharray="4 2"
          className="absolute inset-0 opacity-20 [mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
        />

        {/* Structured content */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">

          {/* Tagline badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-[12px] font-bold uppercase tracking-[0.15em] text-indigo-400/80">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              AI Video Automation Platform
            </span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white leading-[0.95] mb-8"
          >
            Build Faceless{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-purple-400">
              YouTube
            </span>{" "}
            Channels with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-purple-400">
              AI
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="text-lg md:text-xl text-white/40 font-medium leading-relaxed max-w-2xl mb-12"
          >
            Generate ideas, scripts, videos, and grow your channel — all in one place.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mb-20"
          >
            <NoiseBackgroundDemo text="Get Started" />
          </motion.div>
        </div>
      </section>

      {/* 2. PRODUCT HIGHLIGHT */}
      <section className="w-full pb-32 flex justify-center px-6">
        <ThreeDCardDemo />
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="w-full py-32 flex flex-col items-center border-t border-white/[0.02]">
        <div className="text-center mb-20 px-6">
          <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-6">How it works</h2>
          <p className="text-white/40 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            From a simple text prompt to a fully rendered video ready for YouTube. Completely automated.
          </p>
        </div>
        <CarouselDemo />
      </section>

      {/* 4. FEATURES GRID */}
      <section className="w-full py-32 bg-[#0A0A0A] border-y border-white/[0.05] px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-6">Everything you need</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeatureCard 
              icon={<Zap className="w-5 h-5 text-indigo-400" />}
              title="AI Idea Generator" 
              desc="Our AI scrapes trending niches and topics to build viral content configurations automatically." 
            />
            <FeatureCard 
              icon={<LayoutTemplate className="w-5 h-5 text-purple-400" />}
              title="Hook Optimizer" 
              desc="Data-backed scripts designed to maximize viewer retention in the critical first 3 seconds." 
            />
            <FeatureCard 
              icon={<PlayCircle className="w-5 h-5 text-emerald-400" />}
              title="Video Automation" 
              desc="Intelligent B-roll fetching, voice synthesis, and subtitle burning with zero manual touch." 
            />
            <FeatureCard 
              icon={<Clock className="w-5 h-5 text-orange-400" />}
              title="Smart Scheduler" 
              desc="Push rendered videos directly to your YouTube channel at peak viewer hours." 
            />
          </div>
        </div>
      </section>

      {/* 5. TESTIMONIALS */}
      <section className="w-full py-32 px-6 relative">
        <div className="absolute top-[20%] left-[-10%] w-[40%] h-[60%] bg-purple-600/10 blur-[150px] -z-10 rounded-full mix-blend-screen pointer-events-none" />
        <AnimatedTestimonialsDemo />
      </section>

      {/* 6. FINAL CTA */}
      <section className="w-full pb-32 pt-10 px-6 max-w-3xl mx-auto">
        <NoiseBackgroundDemo text="Start Creating Videos" fullWidth />
      </section>

    </div>
  );
}

const FeatureCard = ({ title, desc, icon }: { title: string, desc: string, icon: React.ReactNode }) => (
  <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 flex flex-col gap-4">
    <div className="w-11 h-11 rounded-xl bg-[#0A0A0A] border border-white/10 flex items-center justify-center">
      {icon}
    </div>
    <h3 className="text-2xl font-bold tracking-tight text-white/90">{title}</h3>
    <p className="text-white/40 leading-relaxed font-medium">{desc}</p>
  </div>
);
