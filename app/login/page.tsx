"use client";
import React, { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
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
      <div className="min-h-screen bg-[#141313] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#6366f1] border-t-transparent animate-spin" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
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
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?w=1200&q=80"
            alt="Cinematic Studio"
            className="w-full h-full object-cover opacity-50 grayscale-[0.2]"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1]/15 via-transparent to-[#6f00be]/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141313] via-transparent to-transparent opacity-80" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#a855f7] flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tighter bg-gradient-to-r from-[#c0c1ff] to-[#ddb7ff] bg-clip-text text-transparent">
            Velora AI
          </span>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-lg">
          <h1 className="text-[3.5rem] leading-[1.1] font-bold tracking-tight text-[#e5e2e1] mb-6">
            Join the{" "}
            <span className="text-[#c0c1ff] italic">Velora</span> Edit
          </h1>
          <p className="text-lg text-[#c7c4d7] font-light leading-relaxed">
            Step into a hyper-responsive suite designed for the next generation of visual storytelling. Precision AI tools meets editorial authority.
          </p>
        </div>

        {/* Footer Meta */}
        <div className="relative z-10 flex items-center gap-8 text-[#c7c4d7]/40 text-xs font-medium tracking-widest uppercase">
          {["4K Rendering", "AI Neural Engine", "Cloud Studio"].map((item) => (
            <span key={item} className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[#c0c1ff]" />
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* RIGHT: Form Panel */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-24 bg-[#141313] relative">
        {/* Ambient glows */}
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-[#c0c1ff]/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[10%] left-[5%] w-[30%] h-[30%] bg-[#ddb7ff]/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          {/* Header */}
          <div className="mb-12">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#a855f7] flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-lg font-extrabold tracking-tighter bg-gradient-to-r from-[#c0c1ff] to-[#ddb7ff] bg-clip-text text-transparent">Velora AI</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-[#e5e2e1] mb-2">Welcome Back</h2>
            <p className="text-[#c7c4d7]">Continue your creative workflow.</p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Social login */}
            <div className="mb-8">
              <motion.button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                whileHover={{ borderColor: "rgba(192,193,255,0.3)" }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-[#464554]/20 hover:bg-[#2a2a2a] transition-all duration-300"
              >
                <span className="text-sm font-bold text-[#c7c4d7] font-mono">G</span>
                <span className="text-sm font-medium text-[#e5e2e1]">Google</span>
              </motion.button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-[#464554]/10" />
              <span className="flex-shrink mx-4 text-xs font-medium uppercase tracking-widest text-[#464554]/60">Or email</span>
              <div className="flex-grow border-t border-[#464554]/10" />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-xs font-medium tracking-wider uppercase text-[#c7c4d7]/80 ml-1" htmlFor="email">
                Work Email
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#908fa0] text-sm">@</span>
                <input
                  id="email"
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
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-medium tracking-wider uppercase text-[#c7c4d7]/80" htmlFor="password">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert("Password reset is coming soon! Please contact support for now.")}
                  className="text-[10px] uppercase tracking-widest font-bold text-[#c0c1ff] hover:text-[#ddb7ff] transition-colors"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#908fa0]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-4 bg-[#0e0e0e] border border-transparent rounded-xl focus:ring-2 focus:ring-[#c0c1ff]/20 focus:bg-[#1c1b1b] transition-all placeholder:text-[#908fa0]/40 text-[#e5e2e1] outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#908fa0] hover:text-[#e5e2e1] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01, boxShadow: "0 0 30px rgba(128,131,255,0.3)" }}
              whileTap={{ scale: 0.98 }}
              className="w-full relative flex items-center justify-center gap-2 bg-[#8083ff] text-[#07006c] py-4 rounded-xl font-bold text-lg hover:shadow-[0_0_30px_rgba(128,131,255,0.3)] transition-all duration-300 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-[#07006c]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </>
              ) : (
                "Sign In to Velora AI"
              )}
            </motion.button>

            <p className="text-center text-sm text-[#c7c4d7] pt-2">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-[#c0c1ff] font-semibold hover:underline decoration-[#c0c1ff]/30 underline-offset-4">
                Create workspace
              </Link>
            </p>
          </form>

          {/* Help */}
          <div className="mt-20 text-center">
            <button className="inline-flex items-center gap-2 text-xs font-medium text-[#908fa0] hover:text-[#c0c1ff] transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                <circle cx="12" cy="17" r=".5" fill="currentColor" />
              </svg>
              Need technical support?
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
