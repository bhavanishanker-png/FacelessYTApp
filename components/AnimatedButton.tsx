"use client";
import React from "react";
import { Button, type ButtonVariant, type ButtonSize } from "./ui/button";
import { cn } from "@/lib/utils";

export const AnimatedButton = ({
  children,
  onClick,
  className,
  type = "button",
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
}) => {
  return (
    <Button
      type={type}
      onClick={onClick}
      variant={variant}
      size={size}
      loading={loading}
      disabled={disabled}
      glow
      className={cn("px-6 py-3", className)}
    >
      {children}
    </Button>
  );
};
