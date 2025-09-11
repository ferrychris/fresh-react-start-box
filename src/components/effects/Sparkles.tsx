import React, { useEffect, useRef } from 'react';

interface SparklesProps {
  durationMs?: number; // total life of the effect
  count?: number; // particles to emit
  colors?: string[]; // list of CSS colors
  className?: string;
}

// A short-lived celebratory sparkles burst using canvas.
// Automatically cleans up and pauses on hidden tab.
const Sparkles: React.FC<SparklesProps> = ({
  durationMs = 1800,
  count = 80,
  colors = ['#fbbf24', '#60a5fa', '#34d399', '#f472b6', '#f87171'],
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.scale(dpr, dpr);

    // Emit particles from near top-center area
    const centerX = rect.width * 0.5;
    const centerY = rect.height * 0.25;

    type P = { x: number; y: number; vx: number; vy: number; life: number; color: string; r: number; g: number };
    const parts: P[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 1.6 + 0.6) * 2.2; // px/frame approx
      const life = Math.random() * 0.6 + 0.9; // seconds
      const color = colors[Math.floor(Math.random() * colors.length)] || '#fff';
      parts.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        life: life * 60, // frames
        color,
        r: Math.random() * 2 + 1.2,
        g: 0.06 + Math.random() * 0.04,
      });
    }

    let frames = 0;
    const maxFrames = Math.max(1, Math.floor((durationMs / 1000) * 60));

    const draw = () => {
      frames++;
      ctx.clearRect(0, 0, rect.width, rect.height);

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life -= 1;
        p.vy += p.g; // gravity
        p.x += p.vx;
        p.y += p.vy;

        const alpha = Math.max(0, Math.min(1, p.life / (60 * 1.2))); // fade out
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (p.life <= 0) parts.splice(i, 1);
      }

      if (frames < maxFrames && parts.length > 0) {
        rafRef.current = requestAnimationFrame(draw);
      }
    };

    const onVis = () => {
      if (document.hidden) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      } else if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(draw);
      }
    };

    document.addEventListener('visibilitychange', onVis);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [colors, count, durationMs]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 z-40 ${className || ''}`}
      aria-hidden="true"
    />
  );
};

export default Sparkles;
