"use client";
import React from "react";
import { TextFlippingBoardDemo } from "@/components/TextFlippingBoardDemo";
import { NoiseBackgroundDemo } from "@/components/NoiseBackgroundDemo";
import { ThreeDCardDemo } from "@/components/ThreeDCardDemo";
import { CarouselDemo } from "@/components/CarouselDemo";
import { AnimatedTestimonialsDemo } from "@/components/AnimatedTestimonialsDemo";
import { Zap, LayoutTemplate, PlayCircle, Clock } from "lucide-react";
import "./globals.css"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans overflow-x-hidden selection:bg-indigo-500/30">
      
      {/* 1. HERO SECTION */}
      <section className="relative w-full pt-32 pb-24 flex flex-col items-center justify-center min-h-[60vh] gap-16 px-6">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80%] max-w-3xl h-[600px] bg-indigo-500/10 blur-[150px] -z-10 rounded-full mix-blend-screen pointer-events-none" />
        <TextFlippingBoardDemo />
        <div className="w-full max-w-3xl mx-auto">
          <NoiseBackgroundDemo text="Start For Free" />
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
        <NoiseBackgroundDemo text="Start Creating Videos" />
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
