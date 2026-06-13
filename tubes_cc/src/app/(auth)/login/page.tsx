'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/Toast';

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

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
          setSuccessMessage('Logged in successfully! Redirecting...');
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1000);
        } else {
          setError(result.error || 'Authentication failed. Please try again.');
        }
      } catch (err) {
        setError('Failed to connect to the authentication service.');
      }
    });
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-[#f8fafc] px-4 font-sans select-none overflow-hidden text-slate-800">
      {/* Premium grid overlay for background depth */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />

      {/* Decorative ambient glowing spheres */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-violet-500/10 via-pink-500/5 to-transparent rounded-full blur-[140px] pointer-events-none" />

      {/* Floating decorative glass glassmorphism nodes */}
      <div className="absolute top-[18%] left-[22%] w-10 h-10 rounded-full bg-white/60 border border-white/40 shadow-sm backdrop-blur-md hidden lg:block animate-bounce duration-[5000ms]" />
      <div className="absolute bottom-[22%] right-[18%] w-14 h-14 rounded-full bg-white/60 border border-white/40 shadow-sm backdrop-blur-md hidden lg:block animate-bounce duration-[7000ms]" />
      
      {/* High-Fidelity Centered Glass Card */}
      <div className="relative w-full max-w-[450px] rounded-[32px] border border-white/60 bg-white/80 p-8 md:p-11 shadow-premium backdrop-blur-xl animate-scale-in">
        
        {/* Subtle top indicator bar */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 h-1 w-24 rounded-b-xl bg-gradient-to-r from-indigo-650 to-violet-550" />

        <div className="text-center mt-2">
          {/* Logo Badge */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-50 to-indigo-100/50 border border-indigo-100/80 text-indigo-600 shadow-sm">
            <svg
              className="h-6.5 w-6.5"
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
          
          <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-slate-900">
            Welcome Back
          </h2>
          
          <p className="mt-2 text-[9px] font-bold tracking-[0.25em] text-slate-400 uppercase leading-none">
            TUGAS BESAR CLOUD COMPUTING • KELOMPOK 3
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-xs text-red-700 flex items-center gap-2.5 animate-scale-in">
              <svg
                className="h-4 w-4 shrink-0 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-bold">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Username Input Container */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Username
              </label>
              <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 transition-all duration-300 focus-within:border-indigo-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/10">
                <svg className="h-4.5 w-4.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  disabled={isPending}
                  className="block w-full bg-transparent pl-3 pr-2 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none disabled:opacity-50"
                  placeholder="Enter your username"
                />
              </div>
            </div>
            
            {/* Password Input Container */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 transition-all duration-300 focus-within:border-indigo-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/10">
                <svg className="h-4.5 w-4.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isPending}
                  className="block w-full bg-transparent pl-3 pr-10 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none disabled:opacity-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
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

          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="relative flex w-full justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-550 px-4 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:opacity-95 hover:shadow-lg hover:shadow-indigo-100/50 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-md shadow-indigo-100/30"
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

        <div className="mt-8 border-t border-slate-100 pt-6">
          <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-widest leading-none">
            Multi-Instance AWS Deployment
          </p>
        </div>
      </div>

      {/* Floating Brand Footer (bottom-left corner) */}
      <div className="absolute bottom-6 left-6 flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-slate-200/80 shadow-sm">
          <svg className="w-5.5 h-5.5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 4 3 8 12 12 22 7 12 4" fill="currentColor" fillOpacity="0.1" />
            <path d="M3 12l9 4 9-4" />
            <path d="M3 16l9 4 9-4" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-extrabold tracking-wider text-slate-800 uppercase leading-none">
            Kelompok 3
          </span>
          <span className="text-[8px] font-bold text-slate-400 leading-none mt-1 uppercase tracking-wider">
            Cloud Computing
          </span>
        </div>
      </div>

      {/* Success Toast */}
      {successMessage && (
        <Toast
          message={successMessage}
          type="success"
          onClose={() => setSuccessMessage(null)}
        />
      )}
    </div>
  );
}