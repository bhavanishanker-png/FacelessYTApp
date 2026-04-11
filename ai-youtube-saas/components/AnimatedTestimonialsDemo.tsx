"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const testimonials = [
  { name: "Alex R.", handle: "@alexcreates", text: "This platform literally built my entire channel. I hit monetization in 3 weeks without ever showing my face or recording a mic." },
  { name: "Sarah M.", handle: "@sarahinvests", text: "The automated B-roll pulling mapped precisely to the AI script generation saves me roughly 40 hours a week in Premier Pro." },
  { name: "Marcus T.", handle: "@top10facts", text: "Premium interface, absolute zero downtime. Dropping a single sentence prompt and waking up to a finished video is pure magic." }
];

export const AnimatedTestimonialsDemo = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto relative h-80 flex flex-col items-center justify-center px-4">
      <AnimatePresence mode="wait">
        <motion.div
           key={index}
           initial={{ opacity: 0, y: 30, scale: 0.95 }}
           animate={{ opacity: 1, y: 0, scale: 1 }}
           exit={{ opacity: 0, y: -30, scale: 0.95 }}
           transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
           className="flex flex-col items-center text-center gap-8 relative"
        >
          {/* Subtle quotation watermark */}
          <span className="absolute -top-16 text-[120px] font-serif text-white/5 leading-none select-none">"</span>
          
          <p className="text-3xl md:text-5xl font-semibold text-white/90 leading-tight tracking-tight max-w-4xl relative z-10">
            {testimonials[index].text}
          </p>
          
          <div className="flex flex-col items-center gap-2 mt-4 relative z-10">
            <span className="font-bold text-indigo-400 text-lg">{testimonials[index].name}</span>
            <span className="text-sm text-white/30 font-mono tracking-widest uppercase">{testimonials[index].handle}</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
