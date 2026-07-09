"use client";
import React, { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Eye, EyeOff, User, Mail, Lock, Check, X } from "lucide-react";
import dynamic from "next/dynamic";
const AnimatedGradientBG = dynamic(() => import("@/components/ui/animated-gradient-bg").then(mod => mod.AnimatedGradientBG), { ssr: false });
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PASSWORD_CRITERIA = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Contains a number", test: (p: string) => /\d/.test(p) },
  { label: "Contains uppercase", test: (p: string) => /[A-Z]/.test(p) },
];

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill out all fields.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong.");
        setLoading(false);
        return;
      }

      // Automatically sign the user in with NextAuth after successful creation
      const signRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signRes?.error) {
        setError(signRes.error);
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  };

  const passwordStrength = PASSWORD_CRITERIA.filter((c) => c.test(password)).length;
  const strengthPercent = password.length > 0 ? (passwordStrength / PASSWORD_CRITERIA.length) * 100 : 0;
  const strengthColor = strengthPercent === 100 ? "bg-emerald-500" : strengthPercent >= 66 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="min-h-screen bg-[#030303] text-[#e5e2e1] font-sans selection:bg-[#c0c1ff]/20 flex overflow-hidden">

      {/* LEFT: Cinematic Panel */}
      <section className="hidden lg:flex relative w-1/2 flex-col justify-between p-12 xl:p-16 overflow-hidden">
        <AnimatedGradientBG grid noise intensity={0.6} className="absolute inset-0" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tighter text-gradient-indigo">
            Velora AI
          </span>
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-[3.5rem] leading-[1.05] font-black tracking-tight text-white mb-6">
            Start your{" "}
            <span className="text-[#c0c1ff] italic">creative</span>{" "}
            journey
          </h1>
          <p className="text-lg text-white/40 font-medium leading-relaxed">
            From idea to final render in minutes. Join thousands of creators automation-powering their YouTube channels with Velora AI.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-8 text-white/20 text-[10px] font-bold tracking-[0.2em] uppercase">
          {["4K Rendering", "AI Neural Engine", "Cloud Studio"].map((item) => (
            <span key={item} className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-indigo-400" />
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* RIGHT: Form */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-16 xl:p-24 relative">
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-indigo-500/[0.04] blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[10%] left-[5%] w-[30%] h-[30%] bg-purple-500/[0.04] blur-[100px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="mb-8">
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-lg font-extrabold tracking-tighter text-gradient-indigo">Velora AI</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white mb-2">Create workspace</h2>
            <p className="text-white/35 font-medium">Your AI studio awaits.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSignup}>
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-3.5 rounded-xl flex items-center gap-3"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Social login */}
            <div className="mb-2">
              <motion.button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                whileHover={{ borderColor: "rgba(255,255,255,0.12)" }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border border-white/[0.06] hover:bg-white/[0.03] transition-all duration-200 group"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm font-semibold text-white/70 group-hover:text-white transition-colors">
                  Continue with Google
                </span>
              </motion.button>
            </div>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-white/[0.05]" />
              <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-[0.15em] text-white/15">Or continue with email</span>
              <div className="flex-grow border-t border-white/[0.05]" />
            </div>

            {/* Name */}
            <Input
              label="Full Name"
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              icon={<User className="w-4 h-4" />}
            />

            {/* Email */}
            <Input
              label="Work Email"
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@velora.ai"
              icon={<Mail className="w-4 h-4" />}
            />

            {/* Password */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-white/40 ml-1 block mb-2" htmlFor="signup-password">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full pl-11 pr-12 py-3.5 bg-white/[0.03] border border-white/[0.06] rounded-xl focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500/40 focus:bg-white/[0.05] transition-all placeholder:text-white/15 text-white outline-none text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength indicator */}
              {password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 space-y-2"
                >
                  <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${strengthColor}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${strengthPercent}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {PASSWORD_CRITERIA.map((c) => {
                      const pass = c.test(password);
                      return (
                        <div key={c.label} className="flex items-center gap-1.5">
                          {pass ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <X className="w-3 h-3 text-white/15" />
                          )}
                          <span className={`text-[10px] font-medium ${pass ? "text-emerald-400/80" : "text-white/20"}`}>
                            {c.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              fullWidth
              size="lg"
              glow
              className="mt-2"
            >
              {loading ? "Creating..." : "Create Workspace"}
            </Button>

            <p className="text-center text-sm text-white/35 pt-1 font-medium">
              Already have an account?{" "}
              <Link href="/login" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
                Sign in
              </Link>
            </p>

            <p className="text-center text-[10px] text-white/15 tracking-wide">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </motion.div>
      </section>
    </div>
  );
}
