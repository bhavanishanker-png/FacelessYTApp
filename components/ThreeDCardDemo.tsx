"use client";
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export const ThreeDCardDemo = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    // Limits the rotation to extremely subtle bounds for premium feel
    setRotateX(yPct * -15);
    setRotateY(xPct * 15);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full mt-24" style={{ perspective: "1200px" }}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{ rotateX, rotateY }}
        transition={{ type: "spring", stiffness: 400, damping: 40, mass: 0.5 }}
        className="relative w-full max-w-2xl rounded-[32px] p-[1px] bg-gradient-to-br from-white/10 via-transparent to-white/5 transform-gpu shadow-2xl"
      >
        <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-10" />
        
        <div className="relative bg-[#0A0A0A] rounded-[31px] overflow-hidden p-12 flex flex-col items-center text-center gap-6 shadow-2xl border border-white/5">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 shadow-inner ring-1 ring-white/10">
             <Sparkles className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className="text-4xl font-extrabold text-white tracking-tight">Create viral videos automatically</h3>
          <p className="text-white/50 leading-relaxed font-medium max-w-md text-lg">
            Our autonomous platform orchestrates scripts, voiceovers, and dynamic B-Roll editing without any human intervention. Setup once, scale forever.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
