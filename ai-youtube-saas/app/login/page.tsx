"use client";
import React, { useState, Suspense, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { PlaySquare, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/* ─────────────────────── Flipping Hero Text ─────────────────────── */

const FlippingHeroText = () => {
  const words = "Build faceless YouTube channels with AI".split(" ");

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 },
    },
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: { type: "spring" as const, damping: 14, stiffness: 120 },
    },
    hidden: {
      opacity: 0,
      y: 30,
      rotateX: -90,
      transition: { type: "spring" as const, damping: 14, stiffness: 120 },
    },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="flex flex-wrap gap-x-3 gap-y-1.5 max-w-md"
      style={{ perspective: "800px" }}
    >
      {words.map((word, index) => (
        <motion.span
          variants={child}
          style={{ transformOrigin: "bottom" }}
          key={index}
          className="text-4xl lg:text-5xl font-black tracking-tighter text-white"
        >
          {word === "AI" ? (
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-purple-400">
              {word}
            </span>
          ) : (
            word
          )}
        </motion.span>
      ))}
    </motion.div>
  );
};

/* ─────────────────────── Floating Particles ─────────────────────── */

const FloatingParticle = ({ delay, x, y, size }: { delay: number; x: string; y: string; size: number }) => (
  <motion.div
    className="absolute rounded-full bg-indigo-500/20"
    style={{ left: x, top: y, width: size, height: size }}
    animate={{
      y: [0, -20, 0],
      opacity: [0.2, 0.5, 0.2],
      scale: [1, 1.2, 1],
    }}
    transition={{
      duration: 4,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

/* ─────────────────────── Login Page Content ─────────────────────── */

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setIsLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsLoading(false);

    if (res?.error) {
      setError("Invalid email or password");
    } else {
      window.location.href = "/dashboard";
    }
  };

  const isValid = email.trim().length > 0 && password.trim().length >= 6;

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError === "OAuthCallback") {
      setError("Google authentication failed. Please clear your browser cookies for localhost and try again.");
    } else if (urlError) {
      setError(`Authentication Error: ${urlError}`);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen w-full flex bg-[#030303] font-sans">

      {/* ═══════════════ LEFT SIDE — Branding ═══════════════ */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-between p-12 xl:p-16">

        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/40 via-[#030303] to-purple-950/30 -z-10" />
        <div className="absolute top-[15%] left-[10%] w-[60%] h-[50%] bg-indigo-600/[0.08] blur-[180px] rounded-full mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-[5%] right-[5%] w-[40%] h-[40%] bg-purple-600/[0.06] blur-[140px] rounded-full mix-blend-screen pointer-events-none" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Floating particles */}
        <FloatingParticle delay={0} x="15%" y="25%" size={6} />
        <FloatingParticle delay={1.2} x="75%" y="20%" size={4} />
        <FloatingParticle delay={0.8} x="60%" y="70%" size={5} />
        <FloatingParticle delay={2} x="25%" y="80%" size={3} />
        <FloatingParticle delay={1.5} x="85%" y="50%" size={4} />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_30px_-5px_rgba(99,102,241,0.5)] group-hover:shadow-[0_0_40px_-5px_rgba(99,102,241,0.8)] transition-all">
              <PlaySquare className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 group-hover:to-white transition-all">
              AI Studio
            </h1>
          </Link>
        </motion.div>

        {/* Hero content */}
        <div className="flex-1 flex flex-col justify-center -mt-10">
          <FlippingHeroText />

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="mt-8 text-white/30 text-[16px] font-medium leading-relaxed max-w-md"
          >
            Generate ideas, scripts, voiceovers, and videos — all from a single prompt.
            No face, no camera, no editing skills required.
          </motion.p>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.5 }}
            className="flex flex-wrap gap-2 mt-8"
          >
            {["AI Scripts", "Voice Synthesis", "Auto Scenes", "One-Click Export"].map((tag, i) => (
              <span
                key={tag}
                className="px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.1em] bg-white/[0.03] text-white/25 border border-white/[0.06]"
              >
                {tag}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Bottom stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.5 }}
          className="flex gap-10"
        >
          {[
            { value: "2,400+", label: "Videos Created" },
            { value: "850+", label: "Active Users" },
            { value: "98%", label: "Uptime" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-extrabold text-white/80 tracking-tight">{stat.value}</p>
              <p className="text-[11px] font-medium text-white/20 uppercase tracking-[0.1em] mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ═══════════════ RIGHT SIDE — Login Form ═══════════════ */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">

        {/* Subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505] to-transparent lg:bg-none" />

        {/* Mobile Logo */}
        <div className="absolute top-6 left-6 lg:hidden">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <PlaySquare className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-extrabold text-white/80">AI Studio</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[420px] relative z-10"
        >
          {/* Welcome text */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-400/70">Welcome Back</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
              Sign in to your account
            </h2>
            <p className="text-white/30 text-[15px] font-medium">
              Enter your credentials to access your workspace.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium text-center">
              {error}
            </div>
          )}

          {/* Form Card */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label htmlFor="login-email" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-white/25 mb-2.5">
                <Mail className="w-3 h-3" />
                Email Address
              </label>
              <div className="relative group">
                {/* Focus glow */}
                <div className={cn(
                  "absolute -inset-px rounded-xl bg-gradient-to-r from-indigo-500/30 to-purple-500/20 transition-opacity duration-300 pointer-events-none",
                  focusedField === "email" ? "opacity-100" : "opacity-0"
                )} />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="relative w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-white text-[14px] placeholder:text-white/15 focus:outline-none focus:border-indigo-500/30 transition-all duration-200 font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label htmlFor="login-password" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-white/25">
                  <Lock className="w-3 h-3" />
                  Password
                </label>
                <Link
                  href="#"
                  className="text-[11px] font-semibold text-indigo-400/60 hover:text-indigo-400 transition-colors duration-200"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                {/* Focus glow */}
                <div className={cn(
                  "absolute -inset-px rounded-xl bg-gradient-to-r from-indigo-500/30 to-purple-500/20 transition-opacity duration-300 pointer-events-none",
                  focusedField === "password" ? "opacity-100" : "opacity-0"
                )} />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="relative w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 pr-12 text-white text-[14px] placeholder:text-white/15 focus:outline-none focus:border-indigo-500/30 transition-all duration-200 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors duration-200 z-10"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={!isValid || isLoading}
              whileHover={isValid && !isLoading ? { scale: 1.01 } : {}}
              whileTap={isValid && !isLoading ? { scale: 0.99 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={cn(
                "w-full py-3.5 rounded-xl font-bold text-[13px] tracking-wide flex items-center justify-center gap-2.5 transition-all duration-300 mt-2",
                isValid && !isLoading
                  ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
                  : "bg-white/[0.04] text-white/20 cursor-not-allowed border border-white/[0.04]"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/15">or continue with</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {/* Social Buttons */}
            <div className="flex flex-col gap-3">
              <motion.button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex w-full items-center justify-center gap-2.5 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-[14px] font-semibold text-white/80">Continue with Google</span>
              </motion.button>
            </div>
          </form>

          {/* Sign up link */}
          <p className="text-center mt-8 text-[13px] text-white/25 font-medium">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-indigo-400/70 hover:text-indigo-400 font-semibold transition-colors duration-200"
            >
              Sign up for free
            </Link>
          </p>

          {/* Terms */}
          <p className="text-center mt-4 text-[10px] text-white/10 font-medium leading-relaxed">
            By signing in, you agree to our{" "}
            <Link href="#" className="underline hover:text-white/20 transition-colors">Terms of Service</Link>
            {" "}and{" "}
            <Link href="#" className="underline hover:text-white/20 transition-colors">Privacy Policy</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full bg-[#030303]" />}>
      <LoginContent />
    </Suspense>
  );
}
