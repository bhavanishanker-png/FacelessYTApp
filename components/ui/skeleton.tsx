"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "card";
  /** Width — can be a Tailwind class or CSS value */
  width?: string;
  /** Height — can be a Tailwind class or CSS value */
  height?: string;
  /** Number of text lines to render */
  lines?: number;
}

export const Skeleton = ({
  className,
  variant = "rectangular",
  width,
  height,
  lines = 1,
}: SkeletonProps) => {
  const baseClasses = cn(
    "relative overflow-hidden bg-white/[0.04]",
    "before:absolute before:inset-0",
    "before:bg-gradient-to-r before:from-transparent before:via-white/[0.06] before:to-transparent",
    "before:animate-shimmer before:bg-[length:200%_100%]",
  );

  if (variant === "text" && lines > 1) {
    return (
      <div className={cn("flex flex-col gap-2.5", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseClasses,
              "h-3 rounded-md",
              i === lines - 1 && "w-3/4",
            )}
            style={{
              animationDelay: `${i * 100}ms`,
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === "circular") {
    return (
      <div
        className={cn(
          baseClasses,
          "rounded-full",
          width || "w-10",
          height || "h-10",
          className,
        )}
      />
    );
  }

  if (variant === "card") {
    return (
      <div
        className={cn(
          baseClasses,
          "rounded-2xl border border-white/[0.04]",
          width || "w-full",
          height || "h-48",
          className,
        )}
      />
    );
  }

  // rectangular (default)
  return (
    <div
      className={cn(
        baseClasses,
        "rounded-lg",
        width,
        height || "h-4",
        className,
      )}
    />
  );
};

/** A preset skeleton for a card with thumbnail + text */
export const SkeletonCard = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "rounded-2xl border border-white/[0.04] bg-white/[0.02] overflow-hidden",
      className,
    )}
  >
    <Skeleton variant="rectangular" height="h-44" className="rounded-none" />
    <div className="p-5 space-y-3">
      <Skeleton variant="text" height="h-4" width="w-3/4" />
      <Skeleton variant="text" height="h-3" width="w-1/2" />
      <div className="flex items-center gap-2 pt-2">
        <Skeleton variant="circular" width="w-6" height="h-6" />
        <Skeleton variant="text" height="h-3" width="w-20" />
      </div>
    </div>
  </div>
);
