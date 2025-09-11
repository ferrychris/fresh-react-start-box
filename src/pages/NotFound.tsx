import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const particles: Array<{ x: number; y: number; vx: number; vy: number; r: number; a: number; hue: number }> = [];

    const resize = () => {
      const { innerWidth, innerHeight } = window;
      canvas.width = Math.floor(innerWidth * DPR);
      canvas.height = Math.floor(innerHeight * DPR);
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize a small particle field (subtle, not CPU heavy)
    const init = () => {
      particles.length = 0;
      const count = Math.min(100, Math.floor((canvas.width * canvas.height) / (1920 * 1080) * 80));
      for (let i = 0; i < count; i++) {
        const r = 1 + Math.random() * 2.5;
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3 * DPR,
          vy: (Math.random() * 0.6 + 0.2) * DPR,
          r,
          a: Math.random() * 0.6 + 0.25,
          hue: 210 + Math.random() * 60,
        });
      }
    };
    init();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.y += p.vy;
        p.x += p.vx;
        if (p.y - p.r > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        ctx.beginPath();
        ctx.fillStyle = `hsla(${p.hue}, 70%, 60%, ${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Particle Canvas */}
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" />

      {/* Decorative gradient corners */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-fedex-orange/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-fedex-purple/20 blur-3xl" />

      {/* Content Card */}
      <div className="relative z-10 max-w-2xl w-full mx-auto text-center px-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs border border-white/15 backdrop-blur-md animate-[fadeIn_600ms_ease-out]">
          <span>🏁</span>
          <span>Oops—missed the apex!</span>
        </div>

        <div className="mt-4 text-7xl font-extrabold text-white drop-shadow-sm animate-[fadeInUp_600ms_ease-out]">404</div>
        <h1 className="mt-3 text-2xl md:text-3xl font-bold text-white animate-[fadeInUp_700ms_ease-out]">
          This page pulled into the pits
        </h1>
        <p className="mt-2 text-sm md:text-base text-gray-400 animate-[fadeInUp_800ms_ease-out]">
          Either the track changed or your link took a detour. Let’s get you back on the racing line.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3 animate-[fadeInUp_900ms_ease-out]">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-fedex-orange hover:bg-fedex-orange-dark text-white font-semibold shadow-lg shadow-fedex-orange/20 transition-transform hover:scale-[1.02]"
          >
            <span>🏎️</span>
            <span>Back to Home</span>
          </Link>
          <Link
            to="/grandstand"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold transition-transform hover:scale-[1.02]"
          >
            <span>🎟️</span>
            <span>Open Grandstand</span>
          </Link>
        </div>

        {/* Racing humor + animated car */}
        <div className="relative mt-10 h-16 w-full overflow-hidden">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-white/10" />
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[pulseLine_2.2s_ease-in-out_infinite]" />
          <div className="absolute left-[-20%] top-1/2 -translate-y-1/2 text-2xl animate-[drive_6s_linear_infinite] select-none">
            <span role="img" aria-label="racing-car">🏎️</span>
            <span className="ml-3 text-sm text-gray-400 align-middle">"Flat out through 404—what could go wrong?"</span>
          </div>
        </div>
      </div>

      {/* Local keyframes to avoid global CSS edits */}
      <style>{`
        @keyframes drive {
          0% { transform: translate3d(0, -50%, 0); }
          100% { transform: translate3d(140%, -50%, 0); }
        }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fadeInUp { from { opacity: 0; transform: translate3d(0, 10px, 0) } to { opacity: 1; transform: translate3d(0, 0, 0) } }
        @keyframes pulseLine { 0%,100%{ opacity:.2 } 50%{ opacity:.6 } }
      `}</style>
    </div>
  );
};

export default NotFound;
