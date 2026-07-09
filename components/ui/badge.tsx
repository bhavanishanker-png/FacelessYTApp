"use client";
import React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
  size?: "sm" | "md";
}

const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
  default: {
    container: "bg-white/[0.06] text-white/50 border-white/[0.08]",
    dot: "bg-white/40",
  },
  primary: {
    container: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    dot: "bg-indigo-400",
  },
  success: {
    container: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  warning: {
    container: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dot: "bg-amber-400",
  },
  danger: {
    container: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    dot: "bg-rose-400",
  },
  info: {
    container: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    dot: "bg-sky-400",
  },
};

const sizeStyles: Record<"sm" | "md", string> = {
  sm: "px-2 py-0.5 text-[9px]",
  md: "px-2.5 py-1 text-[10px]",
};

export const Badge = ({
  children,
  variant = "default",
  dot = false,
  pulse = false,
  className,
  size = "sm",
}: BadgeProps) => {
  const styles = variantStyles[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-[0.12em]",
        styles.container,
        sizeStyles[size],
        className,
      )}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && (
            <span
              className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
                styles.dot,
              )}
            />
          )}
          <span
            className={cn(
              "relative inline-flex rounded-full h-1.5 w-1.5",
              styles.dot,
            )}
          />
        </span>
      )}
      {children}
    </span>
  );
};
