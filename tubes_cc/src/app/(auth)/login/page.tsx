'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username');
    const password = formData.get('password');

    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        const result = await res.json();
        if (result.success) {
          // Redirect to secure dashboard view on successful login
          router.push('/dashboard');
          router.refresh();
        } else {
          setError(result.error || 'Authentication failed. Please try again.');
        }
      } catch (err) {
        setError('Failed to connect to the authentication service.');
      }
    });
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-[#050811] px-4 font-sans select-none overflow-hidden">
      {/* Background ambient glowing spheres */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Centered Login Card */}
      <div className="relative w-full max-w-[460px] rounded-2xl border border-white/5 bg-[#0a0f1d]/40 p-10 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        <div className="text-center animate-fade-in">
          {/* Lock Icon */}
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/20 bg-[#071724]/60 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            <svg
              className="h-5.5 w-5.5 text-[#00f0ff]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-white md:text-3xl">
          <span className="text-[#00f0ff]">Sign In</span>
          </h2>
          
          <p className="mt-2.5 text-[10px] font-bold tracking-[0.15em] text-[#4b5b75] uppercase leading-relaxed">
            TUGAS BESAR CLOUD COMPUTING
            <br />
            KELOMPOK 3
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400 flex items-center gap-2.5 transition-all duration-300">
              <svg
                className="h-4 w-4 shrink-0 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-[10px] font-bold text-[#4c5c76] uppercase tracking-wider mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                disabled={isPending}
                className="block w-full rounded-xl border border-[#1b273b] bg-[#070c14] px-4 py-3 text-sm text-white placeholder-[#2b3d54] outline-none transition-all duration-300 focus:border-[#00f0ff]/80 focus:ring-1 focus:ring-[#00f0ff]/30 disabled:opacity-50"
                placeholder="Enter your username"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-[10px] font-bold text-[#4c5c76] uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isPending}
                  className="block w-full rounded-xl border border-[#1b273b] bg-[#070c14] pl-4 pr-11 py-3 text-sm text-white placeholder-[#2b3d54] outline-none transition-all duration-300 focus:border-[#00f0ff]/80 focus:ring-1 focus:ring-[#00f0ff]/30 disabled:opacity-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#4c5c76] hover:text-[#00f0ff] transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isPending}
              className="relative flex w-full justify-center rounded-xl bg-gradient-to-r from-blue-600 to-[#00f0ff] px-4 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:opacity-95 hover:shadow-[0_0_20px_rgba(0,240,255,0.25)] focus:outline-none focus:ring-2 focus:ring-[#00f0ff]/50 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Authenticating...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 border-t border-[#121c2e] pt-6">
          <p className="text-[11px] font-medium text-[#4b5b75] text-center mb-1.5 leading-none">
            Multi-Instance AWS Deployment
          </p>
          <p className="text-[9px] font-bold text-[#344259] tracking-[0.12em] text-center leading-none">
          </p>
        </div>
      </div>

      {/* Floating Brand Footer (bottom-left corner) */}
      <div className="absolute bottom-6 left-6 flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#071926]/40 border border-[#00f0ff]/10 shadow-[0_0_10px_rgba(0,240,255,0.05)]">
          <svg className="w-5.5 h-5.5 text-[#00f0ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 4 3 8 12 12 22 7 12 4" fill="currentColor" fillOpacity="0.2" />
            <path d="M3 12l9 4 9-4" />
            <path d="M3 16l9 4 9-4" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-extrabold tracking-wider text-white uppercase leading-none">
            Kelompok 3
          </span>
          <span className="text-[9px] font-medium text-[#4b5b75] leading-none mt-1">
            Tugas Besar Cloud Computing
          </span>
        </div>
      </div>
    </div>
  );
}