"use client";
import React from "react";
import Link from "next/link";
import { NoiseBackground } from "@/components/ui/noise-background";

export const NoiseBackgroundDemo = ({ text = "Start Creating Videos", fullWidth = false }: { text?: string; fullWidth?: boolean }) => {
  if (fullWidth) {
    return (
      <div className="relative overflow-hidden rounded-[3rem] w-full border border-white/5 shadow-2xl">
        <NoiseBackground
          containerClassName="w-full rounded-[3rem] p-0"
          className="px-6 py-24 sm:py-32 text-center"
          gradientColors={[
            "rgb(99, 102, 241)",
            "rgb(139, 92, 246)",
            "rgb(99, 102, 241)",
          ]}
          noiseIntensity={0.15}
          speed={0.08}
        >
          <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white to-white/60">
            Ready to scale your channel?
          </h2>
          <p className="text-lg leading-8 text-white/50 mb-10 max-w-xl mx-auto font-medium">
            Join thousands of automated creators who generate months of content in a single afternoon.
          </p>
          <Link href="/login">
            <button className="px-8 py-4 rounded-full bg-white text-zinc-950 font-bold tracking-wide hover:bg-zinc-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] cursor-pointer active:scale-95 duration-100">
              {text}
            </button>
          </Link>
        </NoiseBackground>
      </div>
    );
  }

  // Compact pill button mode
  return (
    <div className="flex justify-center">
      <Link href="/login">
        <NoiseBackground
          containerClassName="w-fit p-1.5 rounded-full mx-auto cursor-pointer"
          gradientColors={[
            "rgb(99, 102, 241)",
            "rgb(139, 92, 246)",
            "rgb(168, 85, 247)",
          ]}
          noiseIntensity={0.12}
          speed={0.06}
        >
          <button className="h-full w-full cursor-pointer rounded-full bg-[#0A0A0A] hover:bg-[#111] px-8 py-3.5 text-white text-[14px] font-bold tracking-wide shadow-[0px_1px_0px_0px_rgba(10,10,10,1)_inset] transition-all duration-200 active:scale-95 flex items-center gap-2">
            {text} <span className="text-indigo-400">→</span>
          </button>
        </NoiseBackground>
      </Link>
    </div>
  );
};
