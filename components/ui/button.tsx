"use client";
import React, { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  glow?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:from-indigo-500 hover:to-indigo-500",
  secondary:
    "bg-white/[0.04] text-white/80 border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] hover:text-white",
  ghost:
    "bg-transparent text-white/60 hover:bg-white/[0.06] hover:text-white",
  danger:
    "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/30",
  success:
    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/30",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5 rounded-lg",
  md: "px-5 py-2.5 text-sm gap-2 rounded-xl",
  lg: "px-7 py-3.5 text-[15px] gap-2.5 rounded-xl",
  xl: "px-10 py-4.5 text-lg gap-3 rounded-2xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconRight,
      fullWidth = false,
      glow = false,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        whileHover={!isDisabled ? { scale: 1.02, y: -1 } : undefined}
        whileTap={!isDisabled ? { scale: 0.98 } : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        disabled={isDisabled}
        className={cn(
          "relative inline-flex items-center justify-center font-bold tracking-wide transition-all duration-200 overflow-hidden group",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500/60",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          glow && variant === "primary" && "shadow-[0_0_30px_rgba(99,102,241,0.3)]",
          className,
        )}
        {...props}
      >
        {/* Shine sweep effect for primary variant */}
        {variant === "primary" && !isDisabled && (
          <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-150%] group-hover:translate-x-[200%] transition-transform duration-700 ease-out" />
          </span>
        )}

        {/* Content */}
        <span className="relative z-10 flex items-center justify-center gap-inherit">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          ) : icon ? (
            <span className="shrink-0">{icon}</span>
          ) : null}
          <span>{children}</span>
          {iconRight && !loading && (
            <span className="shrink-0 group-hover:translate-x-0.5 transition-transform duration-200">
              {iconRight}
            </span>
          )}
        </span>
      </motion.button>
    );
  },
);

Button.displayName = "Button";
