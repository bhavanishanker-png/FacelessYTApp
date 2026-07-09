"use client";
import React, { forwardRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      success,
      icon,
      iconRight,
      containerClassName,
      className,
      id,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={cn("flex flex-col gap-2", containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-200 ml-1",
              isFocused ? "text-indigo-400" : "text-white/40",
              error && "text-rose-400",
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <span
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200",
                isFocused ? "text-indigo-400" : "text-white/25",
                error && "text-rose-400",
              )}
            >
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            className={cn(
              "w-full bg-white/[0.03] border rounded-xl text-white text-sm font-medium",
              "placeholder:text-white/20 outline-none transition-all duration-200",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              icon ? "pl-11" : "pl-4",
              iconRight || error || success ? "pr-11" : "pr-4",
              "py-3.5",
              isFocused && !error
                ? "border-indigo-500/40 bg-white/[0.05] ring-2 ring-indigo-500/15 shadow-[0_0_20px_rgba(99,102,241,0.08)]"
                : "border-white/[0.06]",
              error && "border-rose-500/40 ring-2 ring-rose-500/15",
              success && "border-emerald-500/40 ring-2 ring-emerald-500/15",
              className,
            )}
            {...props}
          />

          {/* Status icons */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.span
                key="error"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-400"
              >
                <AlertCircle className="w-4 h-4" />
              </motion.span>
            )}
            {success && !error && (
              <motion.span
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400"
              >
                <CheckCircle className="w-4 h-4" />
              </motion.span>
            )}
            {iconRight && !error && !success && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25">
                {iconRight}
              </span>
            )}
          </AnimatePresence>
        </div>

        {/* Error / Success message */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              key="error-msg"
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              className="text-xs text-rose-400 font-medium ml-1"
            >
              {error}
            </motion.p>
          )}
          {success && !error && (
            <motion.p
              key="success-msg"
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              className="text-xs text-emerald-400 font-medium ml-1"
            >
              {success}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  },
);

Input.displayName = "Input";
