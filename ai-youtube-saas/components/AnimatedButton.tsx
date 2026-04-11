"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const AnimatedButton = ({
  children,
  onClick,
  className,
  type = "button"
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
}) => {
  return (
    <motion.button
      type={type}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative rounded-full font-bold text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_35px_rgba(99,102,241,0.4)] overflow-hidden group",
        className
      )}
    >
      {/* Background with slight glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 group-hover:opacity-90 transition-opacity" />
      
      {/* Inner sheen effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-[linear-gradient(to_right,transparent,white,transparent)] -skew-x-12 translate-x-[-150%] group-hover:animate-shimmer" />

      {/* Button content */}
      <div className="relative z-10 flex items-center justify-center gap-2 text-white">
        {children}
      </div>
    </motion.button>
  );
};
