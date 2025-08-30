import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const targetDate = new Date('2025-09-01T00:00:00');

function useCountdown(to: Date) {
  const [timeLeft, setTimeLeft] = useState<number>(Math.max(0, to.getTime() - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(Math.max(0, to.getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [to]);

  const totalSeconds = Math.floor(timeLeft / 1000);
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, finished: timeLeft <= 0 };
}

export const ComingSoon: React.FC = () => {
  const { days, hours, minutes, seconds, finished } = useCountdown(targetDate);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email.');
      return;
    }
    try {
      setSubmitting(true);
      const { error: fnError } = await supabase.functions.invoke('notify-list', {
        body: { email, source: 'coming-soon', ts: new Date().toISOString() }
      });
      if (fnError) throw fnError;
      setSubmitted(true);
    } catch (err: unknown) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen text-white flex items-center justify-center px-4">
      {/* Background image + overlay */}
      <div className="absolute inset-0 -z-10">
        <img
          src="/crandon.jpg"
          alt="Racing background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      <div className="w-full max-w-4xl text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/files_4459890-1753947080801-only%20race%20fans%20logo.png"
            alt="OnlyRaceFans logo"
            className="h-14 w-14 rounded-2xl object-cover shadow-lg"
          />
        </div>
        <div className="mb-8 inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-fedex-orange to-fedex-orange-dark text-white text-sm font-semibold shadow-lg">
          <span>🏁</span>
          <span>OnlyRaceFans</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
          Coming Soon
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-8">
          Launching Sept 1st. The platform where racers, fans, and sponsors connect.
        </p>

        {/* Countdown */}
        <div className="grid grid-cols-4 gap-3 md:gap-4 justify-center max-w-2xl mx-auto mb-10">
          {[{
            label: 'Days', value: days
          }, {
            label: 'Hours', value: hours
          }, {
            label: 'Minutes', value: minutes
          }, {
            label: 'Seconds', value: seconds
          }].map((item) => (
            <div key={item.label} className="rounded-2xl bg-gray-900 border border-gray-800 py-4 md:py-6 shadow-lg">
              <div className="text-2xl md:text-4xl font-extrabold text-fedex-orange">
                {finished ? 0 : item.value.toString().padStart(2, '0')}
              </div>
              <div className="mt-1 text-xs md:text-sm text-gray-400">{item.label}</div>
            </div>
          ))}
        </div>

        {finished && (
          <div className="mb-6 text-green-400 font-medium">We are live! 🎉</div>
        )}

        <div className="flex gap-3 justify-center mt-8">
          <a
            href="/"
            className="px-5 py-3 rounded-lg border border-gray-700 hover:bg-gray-900 transition"
          >
            Back to Home
          </a>
          <button
            onClick={() => { setOpen(true); setSubmitted(false); setEmail(''); setError(null); }}
            className="px-5 py-3 rounded-lg bg-fedex-orange hover:bg-fedex-orange-dark text-white transition shadow-lg"
          >
            Notify me
          </button>
        </div>

        
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-gray-800 p-6 shadow-2xl">
            {!submitted ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Get notified at launch</h3>
                  <button
                    onClick={() => setOpen(false)}
                    className="text-gray-400 hover:text-white"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-gray-400 mb-4">Drop your email and we’ll ping you when we go live.</p>
                <form onSubmit={onSubmit} className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg bg-black border border-gray-800 px-4 py-3 focus:outline-none focus:border-fedex-orange"
                    required
                  />
                  {error && <p className="text-sm text-red-400">{error}</p>}
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="px-4 py-2 rounded-lg border border-gray-700 hover:bg-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 rounded-lg bg-fedex-orange hover:bg-fedex-orange-dark disabled:opacity-60 text-white"
                    >
                      {submitting ? 'Submitting…' : 'Notify me'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-green-500/20 text-green-400 grid place-items-center">✓</div>
                <h3 className="text-xl font-semibold mb-1">You’re on the list!</h3>
                <p className="text-gray-400 mb-4">We’ll email you as soon as we launch.</p>
                <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg bg-fedex-orange hover:bg-fedex-orange-dark text-white">Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComingSoon;
