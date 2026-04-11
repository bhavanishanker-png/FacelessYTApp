"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export const NoiseBackgroundDemo = ({ text = "Start Creating Videos" }: { text?: string }) => {
  return (
    <div className="relative overflow-hidden bg-zinc-950 px-6 py-24 sm:py-32 rounded-[3rem] w-full border border-white/5 shadow-2xl group text-center">
      {/* Absolute SVG Noise filter overlay */}
      <div 
        className="absolute inset-0 opacity-[0.04] mix-blend-screen z-0 pointer-events-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
      
      {/* Background Animated Gradient Mesh */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-indigo-500/20 blur-[120px] rounded-full group-hover:bg-purple-500/30 transition-colors duration-1000 z-0 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center">
        <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white to-white/60">
          Ready to scale your channel?
        </h2>
        <p className="text-lg leading-8 text-white/50 mb-10 max-w-xl mx-auto font-medium">
          Join thousands of automated creators who generate months of content in a single afternoon.
        </p>
        <Link href="/dashboard">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 rounded-full bg-white text-zinc-950 font-bold tracking-wide hover:bg-zinc-200 transition-colors shadow-[0_0_40px_rgba(255,255,255,0.2)]"
          >
            {text}
          </motion.div>
        </Link>
      </div>
    </div>
  );
};
