"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedGradientBGProps {
  children?: React.ReactNode;
  className?: string;
  /** Show grid pattern overlay */
  grid?: boolean;
  /** Show dot pattern overlay */
  dots?: boolean;
  /** Show noise texture overlay */
  noise?: boolean;
  /** Intensity of the aurora effect (0-1) */
  intensity?: number;
}

export const AnimatedGradientBG = ({
  children,
  className,
  grid = false,
  dots = false,
  noise = false,
  intensity = 1,
}: AnimatedGradientBGProps) => {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Aurora blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[80%] h-[80%] -top-[20%] -left-[20%] rounded-full blur-[120px] animate-aurora"
          style={{
            background: `radial-gradient(ellipse, rgba(99, 102, 241, ${0.12 * intensity}), transparent 70%)`,
            animationDuration: "15s",
          }}
        />
        <div
          className="absolute w-[60%] h-[60%] -bottom-[10%] -right-[10%] rounded-full blur-[100px] animate-aurora"
          style={{
            background: `radial-gradient(ellipse, rgba(168, 85, 247, ${0.1 * intensity}), transparent 70%)`,
            animationDuration: "20s",
            animationDelay: "-5s",
          }}
        />
        <div
          className="absolute w-[50%] h-[50%] top-[30%] left-[30%] rounded-full blur-[80px] animate-aurora"
          style={{
            background: `radial-gradient(ellipse, rgba(192, 193, 255, ${0.08 * intensity}), transparent 70%)`,
            animationDuration: "25s",
            animationDelay: "-10s",
          }}
        />
      </div>

      {/* Grid pattern */}
      {grid && (
        <div className="absolute inset-0 grid-pattern pointer-events-none z-[1]" />
      )}

      {/* Dot pattern */}
      {dots && (
        <div className="absolute inset-0 dot-pattern pointer-events-none z-[1]" />
      )}

      {/* Noise texture */}
      {noise && (
        <div className="absolute inset-0 noise-overlay pointer-events-none z-[1]" />
      )}

      {/* Content */}
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
};
