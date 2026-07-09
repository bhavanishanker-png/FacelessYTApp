"use client";
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PremiumCardProps {
  children: React.ReactNode;
  className?: string;
  /** Enable mouse-tracking spotlight effect */
  spotlight?: boolean;
  /** Enable hover lift + shadow */
  hover?: boolean;
  /** Enable animated gradient border */
  gradientBorder?: boolean;
  /** Enable glow effect on hover */
  glow?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Make it a motion div with layout */
  layout?: boolean;
}

export const PremiumCard = ({
  children,
  className,
  spotlight = false,
  hover = true,
  gradientBorder = false,
  glow = false,
  onClick,
  layout = false,
}: PremiumCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!spotlight || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      whileHover={
        hover
          ? { y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }
          : undefined
      }
      whileTap={onClick ? { scale: 0.985 } : undefined}
      layout={layout}
      className={cn(
        "relative rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm transition-all duration-300 overflow-hidden",
        hover && "hover:border-white/[0.12] hover:bg-white/[0.04]",
        glow && "hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]",
        onClick && "cursor-pointer",
        gradientBorder && "gradient-border",
        className,
      )}
      style={onClick ? { WebkitTapHighlightColor: "transparent" } : undefined}
    >
      {/* Spotlight effect */}
      {spotlight && isHovered && (
        <div
          className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(99,102,241,0.06), transparent 40%)`,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};
