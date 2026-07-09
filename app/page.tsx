"use client";
import React, { useState, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  Sparkles, Brain, Waves, Video, Captions, Share2,
  ArrowRight, ChevronDown, Play, Check, Star, Zap,
  Film, Mic, Clock, Shield, Globe, BarChart3,
} from "lucide-react";
import dynamic from "next/dynamic";
const AnimatedGradientBG = dynamic(() => import("@/components/ui/animated-gradient-bg").then(mod => mod.AnimatedGradientBG), { ssr: false });
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spotlight } from "@/components/ui/spotlight";
import { SparklesCore } from "@/components/ui/sparkles";

/* ─── Animation Helpers ─── */

const stagger = {
  container: {
    animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  },
  item: {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
  },
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

const InViewSection = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─── Data ─── */

const STATS = [
  { value: "4K", label: "Export Quality" },
  { value: "10x", label: "Faster Workflow" },
  { value: "100%", label: "Automated" },
  { value: "24/7", label: "Creative Partner" },
];

const LOGOS = [
  "TechCrunch", "Product Hunt", "Y Combinator", "Forbes", "Wired",
  "The Verge", "Fast Company", "Mashable",
];

const FEATURES = [
  {
    icon: Brain,
    title: "Concept-to-Script AI",
    desc: "Simply prompt your niche and tone. Our neural engine builds complete, SEO-optimized YouTube scripts with built-in hook points and retention loops.",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    size: "large" as const,
  },
  {
    icon: Waves,
    title: "Hyper-Real Audio",
    desc: "Studio-quality AI voice synthesis with human-like inflection and atmospheric sound design synced automatically to your timeline.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    size: "medium" as const,
  },
  {
    icon: Video,
    title: "Auto-B-Roll",
    desc: "Seamlessly sources and cuts high-end footage to match your script's context.",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    size: "small" as const,
  },
  {
    icon: Captions,
    title: "Dynamic Captions",
    desc: "Modern, high-retention animated captions tailored to your brand identity.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    size: "small" as const,
  },
  {
    icon: Share2,
    title: "Multi-Format",
    desc: "One-click export for Shorts, Reels, TikTok, and standard widescreen YouTube.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    size: "small" as const,
  },
];

const WORKFLOW_STEPS = [
  { icon: Sparkles, label: "Idea", color: "from-indigo-500 to-indigo-600" },
  { icon: Zap, label: "Hook", color: "from-amber-500 to-orange-500" },
  { icon: Film, label: "Script", color: "from-sky-500 to-cyan-500" },
  { icon: Video, label: "Scenes", color: "from-violet-500 to-purple-500" },
  { icon: Mic, label: "Voice", color: "from-pink-500 to-rose-500" },
  { icon: Play, label: "Render", color: "from-emerald-500 to-green-500" },
];

const PRICING = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    desc: "Perfect for getting started with AI video creation.",
    features: ["5 renders/month", "720p export", "3 AI voices", "Basic captions", "Community support"],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    desc: "For serious creators who want unlimited power.",
    features: ["Unlimited renders", "4K export", "20+ AI voices", "Advanced captions", "Priority support", "YouTube scheduling", "Custom branding"],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For teams and agencies at scale.",
    features: ["Everything in Pro", "Team collaboration", "API access", "White-label exports", "Dedicated account manager", "SLA guarantee", "Custom integrations"],
    cta: "Contact Sales",
    popular: false,
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    role: "YouTube Creator • 500K subs",
    text: "Velora cut my production time from 40 hours to 2. The AI scripts are genuinely better than what I was writing myself.",
    rating: 5,
  },
  {
    name: "Marcus Rivera",
    role: "Agency Founder • DigitalFirst",
    text: "We produce 50+ faceless videos a month for clients. Velora is the backbone of our entire operation. Nothing else comes close.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "Finance Creator • 1.2M subs",
    text: "The voice quality is insane. My audience literally can't tell it's AI. The retention on AI-scripted videos is 20% higher.",
    rating: 5,
  },
];

/* ─── Component ─── */

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const { data: session } = useSession();
  const ctaHref = session ? "/dashboard" : "/signup";
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  return (
    <div className="min-h-screen bg-transparent text-[#e5e2e1] font-sans overflow-x-hidden selection:bg-[#c0c1ff]/25">

      {/* ═══ NAV ═══ */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 w-full z-50 glass-frosted border-b border-white/[0.04] h-16"
      >
        <div className="flex justify-between items-center px-6 md:px-8 h-full max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)] group-hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all duration-300">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tighter text-gradient-indigo">Velora AI</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: "Features", href: "#features" },
              { label: "Pricing", href: "#pricing" },
              { label: "Testimonials", href: "#testimonials" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-[13px] font-medium text-white/40 hover:text-white transition-colors duration-200"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {session ? (
              <Link href="/dashboard">
                <Button variant="secondary" size="sm">Dashboard</Button>
              </Link>
            ) : (
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
            )}
            <Link href={ctaHref}>
              <Button size="sm" glow>Get Started</Button>
            </Link>
          </div>
        </div>
      </motion.header>

      <main>

        {/* ═══ HERO ═══ */}
        <motion.section
          ref={heroRef}
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6"
        >
          <AnimatedGradientBG
            grid
            noise
            intensity={0.8}
            className="absolute inset-0 z-0"
          />

          {/* Floating workflow cards */}
          <div className="absolute inset-0 z-[1] pointer-events-none hidden lg:block">
            {WORKFLOW_STEPS.map((step, i) => {
              const positions = [
                { top: "18%", left: "8%" },
                { top: "25%", right: "6%" },
                { top: "55%", left: "5%" },
                { top: "60%", right: "8%" },
                { top: "38%", left: "3%" },
                { top: "45%", right: "3%" },
              ];
              const pos = positions[i] || {};
              return (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute animate-float-slow"
                  style={{ ...pos, animationDelay: `${i * 0.8}s` }}
                >
                  <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl glass-frosted border border-white/[0.08] shadow-lg">
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                      <step.icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-white/60">{step.label}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="relative z-20 max-w-5xl text-center pt-20">
            {/* Badge */}
            <motion.div {...fadeUp(0.1)} className="mb-8">
              <Badge variant="primary" dot pulse size="md" className="px-4 py-2 text-[11px]">
                The Future of Content Creation
              </Badge>
            </motion.div>

            <div className="w-full relative flex flex-col items-center justify-center">
              {/* Headline — stagger word reveal */}
              <motion.h1
                variants={stagger.container}
                initial="initial"
                animate="animate"
                className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 relative z-20"
              >
              {["Generate", "YouTube"].map((word) => (
                <motion.span key={word} variants={stagger.item} className="inline-block mr-[0.3em] text-gradient-hero">
                  {word}
                </motion.span>
              ))}
              <br className="hidden md:block" />
              {["videos", "from", "ideas", "to"].map((word) => (
                <motion.span key={word} variants={stagger.item} className="inline-block mr-[0.3em] text-gradient-hero">
                  {word}
                </motion.span>
              ))}
              <motion.span variants={stagger.item} className="inline-block italic text-[#c0c1ff]">
                final render.
              </motion.span>
              </motion.h1>
            </div>

            {/* Subtext */}
            <motion.p
              {...fadeUp(0.5)}
              className="text-lg md:text-xl text-white/40 max-w-2xl mx-auto mb-6 leading-relaxed font-medium"
            >
              Velora AI automates the workflow of top-tier creators. Scripting, visuals, voiceover, and editing—all synthesized in minutes.
            </motion.p>

            {/* Sparkles Effect below subtext */}
            <div className="w-full max-w-[40rem] h-24 relative mx-auto hidden md:block mb-10">
              {/* Gradients */}
              <div className="absolute inset-x-0 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-3/4 blur-sm mx-auto" />
              <div className="absolute inset-x-0 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4 mx-auto" />
              <div className="absolute inset-x-0 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[5px] w-1/4 blur-sm mx-auto" />
              <div className="absolute inset-x-0 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px w-1/4 mx-auto" />

              {/* Core component */}
              <div className="absolute inset-0 w-full h-full [mask-image:radial-gradient(350px_150px_at_top,white_20%,transparent_100%)]">
                <SparklesCore
                  background="transparent"
                  minSize={0.4}
                  maxSize={1.5}
                  particleDensity={800}
                  className="w-full h-full"
                  particleColor="#ffffff"
                />
              </div>
            </div>

            {/* CTAs */}
            <motion.div {...fadeUp(0.65)} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href={ctaHref}>
                <Button size="lg" glow iconRight={<ArrowRight className="w-5 h-5" />}>
                  Start Creating Free
                </Button>
              </Link>
              <a href="#features">
                <Button variant="secondary" size="lg" icon={<Play className="w-4 h-4" />}>
                  View Showcase
                </Button>
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div
              {...fadeUp(0.8)}
              className="flex flex-wrap justify-center gap-8 md:gap-12 mb-12"
            >
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-2xl md:text-3xl font-black text-white">{stat.value}</span>
                    {/* @ts-ignore */}
                    {stat.icon}
                  </div>
                  <p className="text-xs text-white/30 font-medium mt-1 uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-subtle z-20"
          >
            <ChevronDown className="w-6 h-6" />
          </motion.div>
        </motion.section>

        {/* ═══ LOGO MARQUEE ═══ */}
        <section className="py-12 border-y border-white/[0.03] overflow-hidden">
          <p className="text-center text-[10px] uppercase tracking-[0.3em] text-white/20 font-bold mb-6">
            Trusted by creators featured on
          </p>
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#030303] to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#030303] to-transparent z-10" />
            <div className="flex animate-marquee whitespace-nowrap">
              {[...LOGOS, ...LOGOS].map((logo, i) => (
                <span
                  key={`${logo}-${i}`}
                  className="mx-8 md:mx-12 text-lg md:text-xl font-bold text-white/[0.08] tracking-tight flex-shrink-0"
                >
                  {logo}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FEATURES / BENTO GRID ═══ */}
        <section id="features" className="py-24 md:py-32 px-6 md:px-8 max-w-7xl mx-auto scroll-mt-24">
          <InViewSection className="mb-16 md:mb-20">
            <Badge variant="primary" dot size="md" className="mb-4">Core Engine</Badge>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
              The Obsidian Edit Suite.
            </h2>
            <p className="text-white/35 mt-4 max-w-xl text-lg font-medium leading-relaxed">
              Every tool you need to go from idea to viral video, powered by state-of-the-art AI.
            </p>
          </InViewSection>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              const colSpan = feature.size === "large"
                ? "md:col-span-8"
                : feature.size === "medium"
                  ? "md:col-span-4"
                  : "md:col-span-4";

              return (
                <InViewSection key={feature.title} className={colSpan}>
                  <Spotlight
                    className="h-full rounded-2xl"
                    color={feature.color.replace("text-", "rgba(").replace("-400", ", 0.06)")}
                  >
                    <motion.div
                      whileHover={{ borderColor: "rgba(255,255,255,0.1)" }}
                      className="h-full rounded-2xl bg-white/[0.02] border border-white/[0.05] p-8 md:p-10 transition-all duration-500 group"
                    >
                      <div className={`w-12 h-12 rounded-2xl ${feature.bg} border ${feature.border} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`w-6 h-6 ${feature.color}`} />
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-3">{feature.title}</h3>
                      <p className="text-white/35 leading-relaxed text-[15px]">{feature.desc}</p>
                      {feature.size === "large" && (
                        <div className="flex items-center gap-2 mt-6 text-indigo-400 font-semibold text-sm cursor-pointer group/link">
                          <span>Explore Neural Scripting</span>
                          <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                        </div>
                      )}
                    </motion.div>
                  </Spotlight>
                </InViewSection>
              );
            })}
          </div>
        </section>

        {/* ═══ WORKFLOW PIPELINE ═══ */}
        <section className="py-24 md:py-32 px-6 md:px-8 overflow-hidden">
          <InViewSection className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <Badge variant="primary" dot size="md" className="mb-4">How It Works</Badge>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
                Idea to upload in minutes.
              </h2>
              <p className="text-white/35 mt-4 max-w-xl mx-auto text-lg font-medium">
                Six AI-powered steps. One seamless pipeline.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
              {WORKFLOW_STEPS.map((step, i) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -6, transition: { type: "spring", stiffness: 300 } }}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-all group cursor-default"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <step.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-bold text-white/60 group-hover:text-white transition-colors">
                    {step.label}
                  </span>
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                    Step {i + 1}
                  </span>
                </motion.div>
              ))}
            </div>
          </InViewSection>
        </section>

        {/* ═══ TESTIMONIALS ═══ */}
        <section id="testimonials" className="py-24 md:py-32 px-6 md:px-8 scroll-mt-24">
          <InViewSection className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <Badge variant="primary" dot size="md" className="mb-4">Testimonials</Badge>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
                Loved by creators worldwide.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {TESTIMONIALS.map((t, i) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-all"
                >
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, s) => (
                      <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-white/50 text-[15px] leading-relaxed mb-6 font-medium">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{t.name}</p>
                      <p className="text-xs text-white/30">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </InViewSection>
        </section>

        {/* ═══ PRICING ═══ */}
        <section id="pricing" className="py-24 md:py-32 px-6 md:px-8 scroll-mt-24">
          <InViewSection className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <Badge variant="primary" dot size="md" className="mb-4">Pricing</Badge>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
                Simple, transparent pricing.
              </h2>
              <p className="text-white/35 mt-4 max-w-xl mx-auto text-lg font-medium">
                Start free. Scale as you grow. No hidden fees.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {PRICING.map((plan, i) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className={`relative rounded-2xl p-8 border transition-all ${
                    plan.popular
                      ? "bg-white/[0.04] border-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.1)]"
                      : "bg-white/[0.02] border-white/[0.05] hover:border-white/[0.1]"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="primary" className="bg-indigo-500 text-white border-indigo-400 px-3 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-4xl font-black text-white">{plan.price}</span>
                    {plan.period && <span className="text-sm text-white/30">{plan.period}</span>}
                  </div>
                  <p className="text-sm text-white/35 mb-6">{plan.desc}</p>

                  <Link href={ctaHref}>
                    <Button
                      variant={plan.popular ? "primary" : "secondary"}
                      size="md"
                      fullWidth
                      glow={plan.popular}
                    >
                      {plan.cta}
                    </Button>
                  </Link>

                  <ul className="mt-8 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm text-white/50">
                        <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </InViewSection>
        </section>

        {/* ═══ FINAL CTA ═══ */}
        <section className="py-24 md:py-32 flex flex-col items-center justify-center px-6">
          <InViewSection className="max-w-4xl w-full">
            <div className="relative rounded-3xl overflow-hidden">
              <AnimatedGradientBG noise intensity={1.2} className="absolute inset-0" />
              <div className="relative z-10 p-12 md:p-20 text-center border border-white/[0.06] rounded-3xl">
                <div className="relative w-full flex flex-col items-center justify-center">
                  <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 text-white relative z-20">
                    Ready to launch your{" "}
                    <span className="text-[#c0c1ff]">next viral hit?</span>
                  </h2>
                </div>
                
                <p className="text-lg text-white/40 mb-6 max-w-xl mx-auto font-medium">
                  Join 15,000+ creators who have replaced weeks of editing with minutes of AI magic.
                </p>

                <div className="w-full max-w-[30rem] h-20 relative mx-auto hidden md:block mb-8">
                  <div className="absolute inset-x-0 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-3/4 blur-sm mx-auto" />
                  <div className="absolute inset-x-0 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4 mx-auto" />
                  
                  <div className="absolute inset-0 w-full h-full [mask-image:radial-gradient(250px_100px_at_top,white_20%,transparent_100%)]">
                    <SparklesCore
                      background="transparent"
                      minSize={0.4}
                      maxSize={1}
                      particleDensity={600}
                      className="w-full h-full"
                      particleColor="#ffffff"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-xl px-5 py-4 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/30 outline-none text-white placeholder:text-white/25 text-sm font-medium transition-all"
                  />
                  <Button size="lg" glow iconRight={<ArrowRight className="w-5 h-5" />}>
                    Get Early Access
                  </Button>
                </div>
                <p className="text-[10px] uppercase tracking-widest text-white/20 mt-6 font-medium">
                  No credit card required • 5 free renders included
                </p>
              </div>
            </div>
          </InViewSection>
        </section>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-16 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-base font-extrabold tracking-tighter text-gradient-indigo">Velora AI</span>
              </div>
              <p className="text-xs text-white/25 leading-relaxed max-w-[200px]">
                From idea to final render — powered by AI.
              </p>
            </div>

            {/* Links */}
            {[
              {
                title: "Product",
                links: ["Features", "Pricing", "Changelog", "Roadmap"],
              },
              {
                title: "Company",
                links: ["About", "Blog", "Careers", "Press"],
              },
              {
                title: "Resources",
                links: ["Documentation", "API", "Tutorials", "Community"],
              },
              {
                title: "Legal",
                links: ["Privacy", "Terms", "Security", "GDPR"],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
                  {col.title}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-white/25 hover:text-white/60 transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-white/[0.04] flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[11px] text-white/15 tracking-wider">
              © {new Date().getFullYear()} Velora AI Labs. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="success" dot pulse size="sm">All systems operational</Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
