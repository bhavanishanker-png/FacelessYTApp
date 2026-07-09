"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useSpring } from "framer-motion";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

export function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Mouse tracking with framer-motion springs
  const mouseX = useSpring(0, { stiffness: 100, damping: 25, mass: 1 });
  const mouseY = useSpring(0, { stiffness: 100, damping: 25, mass: 1 });
  // For canvas, we need raw coordinates for precise interaction without spring delay
  const rawMouseRef = useRef({ x: -1000, y: -1000 }); 

  const colors = [
    "rgba(99, 102, 241, opacity)", // Indigo
    "rgba(168, 85, 247, opacity)", // Purple
    "rgba(14, 165, 233, opacity)", // Sky/Cyan
    "rgba(236, 72, 153, opacity)", // Pink
  ];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(motionQuery.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    motionQuery.addEventListener("change", handleMotionChange);

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      motionQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion || isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      rawMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      rawMouseRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [mouseX, mouseY, reducedMotion, isMobile]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const numParticles = isMobile ? 0 : isTablet ? 40 : 80;
    
    const initParticles = () => {
      particles = [];
      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.5 + 0.1,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const render = () => {
      // Pause if tab is inactive
      if (document.visibilityState === "hidden") {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const mouse = rawMouseRef.current;

      particles.forEach((p, i) => {
        // Move particle
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around screen
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Interactive mouse effects
        if (!reducedMotion && !isMobile) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 150) {
            // Magnetic attraction based on distance
            const force = (150 - dist) / 150;
            p.x += (dx / dist) * force * 0.5; // Slight attraction
            p.y += (dy / dist) * force * 0.5;
            
            // Make them glow when close
            p.opacity = Math.min(p.opacity + 0.05, 0.8);
          } else {
            // Return to normal opacity
            p.opacity = Math.max(p.opacity - 0.01, 0.1);
          }
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace("opacity", p.opacity.toString());
        ctx.fill();

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${(100 - dist) / 100 * 0.1})`;
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    if (!reducedMotion) {
      render();
    }

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isMobile, isTablet, reducedMotion]);

  return (
    <div className="fixed inset-0 z-[-50] bg-black overflow-hidden pointer-events-none select-none">
      
      {/* Animated gradient mesh & Aurora lights */}
      <div className="absolute inset-0 opacity-40">
        <div 
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full mix-blend-screen blur-[120px] animate-aurora opacity-70"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.5) 0%, rgba(0,0,0,0) 70%)', animationDuration: '12s' }}
        />
        <div 
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full mix-blend-screen blur-[120px] animate-aurora opacity-50"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(0,0,0,0) 70%)', animationDuration: '18s', animationDelay: '-5s' }}
        />
        <div 
          className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full mix-blend-screen blur-[100px] animate-aurora opacity-60"
          style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.3) 0%, rgba(0,0,0,0) 70%)', animationDuration: '24s', animationDelay: '-12s' }}
        />
      </div>

      {/* Noise Texture */}
      <div 
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      {/* Canvas for Particles */}
      {!reducedMotion && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
        />
      )}

      {/* Cursor Glow */}
      {!reducedMotion && !isMobile && (
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full mix-blend-screen blur-[100px] opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(0,0,0,0) 70%)',
            left: -300,
            top: -300,
            x: mouseX,
            y: mouseY,
          }}
        />
      )}
    </div>
  );
}
