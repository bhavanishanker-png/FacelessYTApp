"use client";
import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

  return (
    <div className="min-h-screen bg-[#141313] text-[#e5e2e1] font-sans selection:bg-[#c0c1ff]/20 flex overflow-hidden">

      {/* LEFT: Cinematic Image Panel */}
      <section className="hidden lg:flex relative w-1/2 flex-col justify-between p-16 overflow-hidden bg-[#0e0e0e]">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1636036688687-04c1a7b03e3e?w=1200&q=80"
            alt="Creative Studio"
            className="w-full h-full object-cover opacity-40 grayscale-[0.3]"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1]/12 via-transparent to-[#a855f7]/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141313] via-transparent to-transparent opacity-80" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#a855f7] flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tighter bg-gradient-to-r from-[#c0c1ff] to-[#ddb7ff] bg-clip-text text-transparent">
            Velora AI
          </span>
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-[3.5rem] leading-[1.1] font-bold tracking-tight text-[#e5e2e1] mb-6">
            Start your{" "}
            <span className="text-[#c0c1ff] italic">creative</span>{" "}
            journey
          </h1>
          <p className="text-lg text-[#c7c4d7] font-light leading-relaxed">
            From idea to final render in minutes. Join thousands of creators automation-powering their YouTube channels with Velora AI.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-8 text-[#c7c4d7]/40 text-xs font-medium tracking-widest uppercase">
          {["4K Rendering", "AI Neural Engine", "Cloud Studio"].map((item) => (
            <span key={item} className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[#c0c1ff]" />
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* RIGHT: Form */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-24 bg-[#141313] relative">
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-[#c0c1ff]/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[10%] left-[5%] w-[30%] h-[30%] bg-[#ddb7ff]/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="mb-10">
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#a855f7] flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-lg font-extrabold tracking-tighter bg-gradient-to-r from-[#c0c1ff] to-[#ddb7ff] bg-clip-text text-transparent">Velora AI</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-[#e5e2e1] mb-2">Create workspace</h2>
            <p className="text-[#c7c4d7]">Your AI studio awaits.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSignup}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Social login */}
            <div className="mb-2">
              <motion.button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                whileHover={{ borderColor: "rgba(192,193,255,0.3)" }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#464554]/20 hover:bg-[#2a2a2a] transition-all duration-300 text-sm font-medium text-[#e5e2e1]"
              >
                Google
              </motion.button>
            </div>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-[#464554]/10" />
              <span className="flex-shrink mx-4 text-xs font-medium uppercase tracking-widest text-[#464554]/60">Or continue with email</span>
              <div className="flex-grow border-t border-[#464554]/10" />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label className="text-xs font-medium tracking-wider uppercase text-[#c7c4d7]/80 ml-1" htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-4 bg-[#0e0e0e] border border-transparent rounded-xl focus:ring-2 focus:ring-[#c0c1ff]/20 focus:bg-[#1c1b1b] transition-all placeholder:text-[#908fa0]/40 text-[#e5e2e1] outline-none text-sm"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-xs font-medium tracking-wider uppercase text-[#c7c4d7]/80 ml-1" htmlFor="signup-email">Work Email</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#908fa0] text-sm">@</span>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@velora.ai"
                  className="w-full pl-10 pr-4 py-4 bg-[#0e0e0e] border border-transparent rounded-xl focus:ring-2 focus:ring-[#c0c1ff]/20 focus:bg-[#1c1b1b] transition-all placeholder:text-[#908fa0]/40 text-[#e5e2e1] outline-none text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs font-medium tracking-wider uppercase text-[#c7c4d7]/80" htmlFor="signup-password">Password</label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full pl-4 pr-12 py-4 bg-[#0e0e0e] border border-transparent rounded-xl focus:ring-2 focus:ring-[#c0c1ff]/20 focus:bg-[#1c1b1b] transition-all placeholder:text-[#908fa0]/40 text-[#e5e2e1] outline-none text-sm"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#908fa0] hover:text-[#e5e2e1] transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01, boxShadow: "0 0 30px rgba(128,131,255,0.3)" }}
              whileTap={{ scale: 0.98 }}
              className="w-full relative flex items-center justify-center gap-2 bg-[#8083ff] text-[#07006c] py-4 rounded-xl font-bold text-lg transition-all duration-300 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-[#07006c]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                "Create Workspace"
              )}
            </motion.button>

            <p className="text-center text-sm text-[#c7c4d7] pt-2">
              Already have an account?{" "}
              <Link href="/login" className="text-[#c0c1ff] font-semibold hover:underline decoration-[#c0c1ff]/30 underline-offset-4">
                Sign in
              </Link>
            </p>

            <p className="text-center text-[10px] text-[#c7c4d7]/30 tracking-wide">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
