import React, { useEffect, useRef } from 'react';

interface ParticlesProps {
  className?: string;
  density?: number; // particles per 10,000 px^2 baseline
  color?: string;
  opacity?: number; // 0..1
  maxSpeed?: number; // px per second
}

// Lightweight, subtle particles using canvas. Auto-scales for DPR, pauses when tab hidden,
// respects prefers-reduced-motion, and caps particle count for performance.
export const Particles: React.FC<ParticlesProps> = ({
  className,
  density = 0.004, // very light density
  color = 'rgba(125, 211, 252, 0.35)', // tailwind sky-300 @ ~35%
  opacity = 0.6,
  maxSpeed = 12,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; r: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return; // Respect user preference

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.scale(dpr, dpr);

      // Re-seed particles based on area
      const area = rect.width * rect.height;
      const target = Math.min(60, Math.max(12, Math.floor(area * density)));

      const arr = particlesRef.current;
      arr.length = 0;
      for (let i = 0; i < target; i++) {
        const speed = (Math.random() * 0.6 + 0.2) * maxSpeed / 60; // px/frame approx
        const dir = Math.random() * Math.PI * 2;
        arr.push({
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          vx: Math.cos(dir) * speed,
          vy: Math.sin(dir) * speed,
          r: Math.random() * 1.2 + 0.4, // tiny circles
        });
      }
    };

    let lastHidden = document.hidden;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      ctx.globalAlpha = opacity;
      ctx.fillStyle = color;

      const arr = particlesRef.current;
      for (let i = 0; i < arr.length; i++) {
        const p = arr[i];
        p.x += p.vx;
        p.y += p.vy;

        // Soft wrap at edges
        if (p.x < -5) p.x = rect.width + 5;
        if (p.x > rect.width + 5) p.x = -5;
        if (p.y < -5) p.y = rect.height + 5;
        if (p.y > rect.height + 5) p.y = -5;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };

    const onVis = () => {
      if (document.hidden) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        lastHidden = true;
      } else {
        // If coming back visible, re-sync sizes once
        if (lastHidden) resize();
        if (!rafRef.current) rafRef.current = requestAnimationFrame(draw);
        lastHidden = false;
      }
    };

    const onResize = () => {
      // Reset scale to avoid compounding
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      resize();
    };

    resize();
    rafRef.current = requestAnimationFrame(draw);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('resize', onResize);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', onResize);
    };
  }, [color, density, maxSpeed, opacity]);

  return (
    <canvas
      ref={canvasRef}
      className={
        'pointer-events-none absolute inset-0 -z-10 opacity-70 ' + (className || '')
      }
      aria-hidden="true"
    />
  );
};

export default Particles;
