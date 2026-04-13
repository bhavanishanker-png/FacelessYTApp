"use client";
import React from "react";
import { motion } from "framer-motion";

const items = [
  { step: 1, title: "Input Basic Idea", desc: "Just drop a one-liner about your niche or video topic. The AI takes context instantly." },
  { step: 2, title: "AI Magic Generation", desc: "Our models construct viral hooks, perfectly paced scripts, and dynamic scene boundaries." },
  { step: 3, title: "Voice & Visuals", desc: "Premium voice cloning synced alongside dynamically pulled 4K royalty-free B-roll." },
  { step: 4, title: "Automated Output", desc: "Renders are cleanly exported and pushed directly to your YouTube channel on schedule." }
];

export const CarouselDemo = () => {
  return (
    <div className="w-full max-w-6xl mx-auto overflow-x-auto pb-8 snap-x snap-mandatory flex hide-scrollbar">
      <div className="flex gap-6 px-4 md:px-8 w-max">
        {items.map((item, idx) => (
          <div key={idx} className="w-[85vw] md:w-[400px] shrink-0 snap-center">
            <motion.div 
               whileHover={{ y: -8 }}
               className="h-full bg-white/[0.02] border border-white/5 rounded-[2rem] p-10 shadow-2xl flex flex-col gap-5 relative overflow-hidden group hover:border-white/10 transition-colors"
            >
              <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-indigo-500/10 blur-[60px] rounded-full group-hover:bg-purple-500/20 transition-colors duration-700" />
              
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center font-black text-2xl text-white/80 border border-white/10 shadow-inner">
                {item.step}
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight leading-tight">{item.title}</h3>
              <p className="text-white/40 font-medium leading-relaxed">{item.desc}</p>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
};
