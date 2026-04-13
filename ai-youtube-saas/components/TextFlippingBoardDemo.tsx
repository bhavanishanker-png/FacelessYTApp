"use client";
import React from "react";
import { motion } from "framer-motion";

export const TextFlippingBoardDemo = () => {
  const words = "Build faceless YouTube channels with AI".split(" ");

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.04 * i },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: "spring" as const,
        damping: 14,
        stiffness: 120,
      },
    },
    hidden: {
      opacity: 0,
      y: 40,
      rotateX: -90,
      transition: {
        type: "spring" as const,
        damping: 14,
        stiffness: 120,
      },
    },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="flex flex-wrap justify-center gap-x-4 gap-y-2 max-w-5xl mx-auto text-center"
      style={{ perspective: "1000px" }}
    >
      {words.map((word, index) => (
        <motion.span
          variants={child}
          style={{ transformOrigin: "bottom" }}
          key={index}
          className="text-6xl md:text-8xl font-black tracking-tighter text-white"
        >
          {word === "AI" ? (
             <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-purple-400">
               {word}
             </span>
          ) : word}
        </motion.span>
      ))}
    </motion.div>
  );
};
