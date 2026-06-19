'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/Toast';

type FocusedField = 'username' | 'password' | 'none';
type AuthStatus = 'idle' | 'pending' | 'success' | 'failed';

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form states
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Authentication statuses
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');

  // Interactive tracking states
  const [focusedField, setFocusedField] = useState<FocusedField>('none');
  const [mouseOffset, setMouseOffset] = useState({ dx: 0, dy: 0 });

  // 1. GLOBAL CURSOR TRACKING
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      // Normalize mouse coordinates relative to the screen center
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      // Clamp coordinates between -1 and 1
      const dx = Math.max(-1, Math.min(1, (e.clientX - centerX) / (window.innerWidth / 2)));
      const dy = Math.max(-1, Math.min(1, (e.clientY - centerY) / (window.innerHeight / 2)));

      setMouseOffset({ dx, dy });
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, []);

  // Form submission logic
  const performLogin = async (uname: string, pass: string) => {
    if (!uname.trim() || !pass.trim()) return;
    setError(null);
    setSuccessMessage(null);
    setAuthStatus('pending');

    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: uname.trim(), password: pass }),
        });
        const result = await res.json();
        if (result.success) {
          setAuthStatus('success');
          setSuccessMessage('Logged in successfully! Redirecting...');
          setTimeout(() => {
            window.location.href = '/dashboard/user';
          }, 1000);
        } else {
          setAuthStatus('failed');
          setError(result.error || 'Authentication failed. Please verify credentials.');
        }
      } catch (err) {
        setAuthStatus('failed');
        setError('Failed to connect to authentication server.');
      }
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    performLogin(usernameInput, passwordInput);
  };

  // Pupil translations
  const pupilX = mouseOffset.dx * 6;
  const pupilY = mouseOffset.dy * 4.5;

  // Determine if password is typed or focused, and hidden
  const isPasswordHidden = focusedField === 'password' && !showPassword;

  // 2. STACKED ANIMATION TRANSFORMS
  // Main CRT Bot follows cursor; turns away on password focus unless shown
  const getGigaTransform = () => {
    if (isPasswordHidden) {
      return 'translate(-6px, 5px) rotate(-12deg)';
    }
    return `translate(${mouseOffset.dx * 6}px, ${mouseOffset.dy * 4}px) rotate(${mouseOffset.dx * 3}deg)`;
  };

  // Database stack bot floats on the right
  const getMiniTransform = () => {
    if (isPasswordHidden) {
      return 'translate(6px, 8px) rotate(15deg)';
    }
    return `translate(${mouseOffset.dx * 10}px, ${mouseOffset.dy * 7}px) rotate(${mouseOffset.dx * 6}deg)`;
  };

  // Cloud bot floats on the left
  const getPeekerTransform = () => {
    if (isPasswordHidden) {
      return 'translate(-12px, -6px) rotate(-10deg)';
    }
    return `translate(${mouseOffset.dx * 5}px, ${mouseOffset.dy * 3}px) rotate(${mouseOffset.dx * 2}deg)`;
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-12 font-sans select-none overflow-hidden text-white">
      
      {/* Dynamic animations and autocomplete background overrides style block */}
      <style>{`
        /* Stop yellow/white background overlays on autofilled input elements */
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: #ffffff !important;
          -webkit-box-shadow: 0 0 0px 1000px #090d16 inset !important;
          box-shadow: 0 0 0px 1000px #090d16 inset !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        /* Floating keyframes to remove stiffness */
        @keyframes floatGiga {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3.5px); }
        }
        @keyframes floatMini {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes floatPeeker {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }

        .animate-float-giga {
          animation: floatGiga 4s ease-in-out infinite;
        }
        .animate-float-mini {
          animation: floatMini 3s ease-in-out infinite;
        }
        .animate-float-peeker {
          animation: floatPeeker 3.5s ease-in-out infinite;
        }
      `}</style>

      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Glassmorphism Split Card */}
      <div className="relative w-full max-w-4xl min-h-[550px] rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-md shadow-2xl flex flex-col md:flex-row overflow-hidden transition-all duration-500">
        
        {/* LEFT COLUMN: MINIMALIST FORM */}
        <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col justify-center space-y-8 bg-slate-950/40 border-b md:border-b-0 md:border-r border-white/5">
          <div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <svg viewBox="0 0 32 32" className="w-6 h-6">
                {/* Monitor outer */}
                <rect x="5" y="7" width="22" height="18" rx="4" fill="#ffffff" />
                {/* Screen inner */}
                <rect x="8" y="10" width="16" height="12" rx="2" fill="#4f46e5" />
                {/* Tiny eyes */}
                <circle cx="12" cy="15" r="1.2" fill="#22d3ee" />
                <circle cx="20" cy="15" r="1.2" fill="#22d3ee" />
                {/* Tiny stand */}
                <rect x="13" y="25" width="6" height="2" fill="#ffffff" />
              </svg>
            </div>
            <h2 className="mt-5 text-xl font-black text-white tracking-tight leading-none">
              Sign In to Website
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-200 flex items-center gap-2.5 animate-scale-in">
                <svg className="h-4 w-4 shrink-0 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-bold">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Username Input */}
              <div className="space-y-1.5">
                <label htmlFor="username" className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  required
                  disabled={isPending}
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField('none')}
                  className="block w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-xs font-bold text-white placeholder-slate-500 outline-none transition-all focus:border-indigo-500 focus:bg-slate-950 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                  placeholder="Enter your username"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isPending}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField('none')}
                    className="block w-full rounded-xl border border-white/10 bg-slate-950/80 pl-4 pr-11 py-2.5 text-xs font-bold text-white placeholder-slate-500 outline-none transition-all focus:border-indigo-500 focus:bg-slate-950 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isPending || !usernameInput || !passwordInput}
                className="flex w-full justify-center rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-md shadow-indigo-500/10"
              >
                {isPending ? (
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Verifying Credentials...</span>
                  </div>
                ) : (
                  'Login to Console'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: TECH CHARACTER STACK */}
        <div className="w-full md:w-1/2 bg-slate-950/20 p-8 flex flex-col justify-center items-center relative min-h-[300px] md:min-h-[440px]">
          
          {/* Subtle panel layout elements */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1.5px,transparent_1.5px)] bg-[size:1.5rem_1.5rem] opacity-20 pointer-events-none" />

          {/* Dynamic Stacked Vector Viewport */}
          <svg
            viewBox="0 0 320 320"
            className="w-full max-w-[280px] md:max-w-[310px] h-auto relative z-10 select-none"
          >
            {/* SVG Drop Shadows */}
            <defs>
              <filter id="monsterShadow" x="-10%" y="-10%" width="125%" height="125%">
                <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#020617" floodOpacity="0.45" />
              </filter>
            </defs>

            {/* Shelf shadow under Server base */}
            <ellipse cx="160" cy="272" rx="90" ry="9" fill="#020617" opacity="0.5" />

            {/* Server Rack Base Chassis */}
            <g filter="url(#monsterShadow)">
              <rect x="70" y="240" width="180" height="30" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="2.5" />
              {/* Ventilation grids */}
              <rect x="85" y="251" width="35" height="7" rx="2" fill="#0f172a" />
              <rect x="128" y="251" width="35" height="7" rx="2" fill="#0f172a" />
              {/* LED Monitors */}
              <circle cx="185" cy="255" r="3.2" fill="#22c55e" className="animate-pulse" />
              <circle cx="200" cy="255" r="3.2" fill="#eab308" />
              <circle cx="215" cy="255" r="3.2" fill="#ef4444" />
            </g>

            {/* ==================== CHAR 3: FLOATING CLOUD (Left Side - Enlarged) ==================== */}
            <g
              className="animate-float-peeker"
              style={{
                transform: getPeekerTransform(),
                transformOrigin: '75px 100px',
                transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {/* Cloud Body Shape */}
              <path d="M 52 110 C 45 110, 40 102, 45 94 C 45 80, 62 72, 74 82 C 84 72, 98 80, 96 94 C 104 94, 106 102, 98 110 C 92 110, 58 110, 52 110 Z" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
              
              {/* Cheek blush */}
              <circle cx="62" cy="100" r="2.5" fill="#f43f5e" opacity="0.4" />
              <circle cx="86" cy="100" r="2.5" fill="#f43f5e" opacity="0.4" />

              {/* Eyes */}
              {isPasswordHidden ? (
                <g>
                  <path d="M 64 95 Q 67 98 70 95" stroke="#475569" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                  <path d="M 78 95 Q 81 98 84 95" stroke="#475569" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                </g>
              ) : (
                <g>
                  <circle cx={67 + pupilX * 0.4} cy={95 + pupilY * 0.4} r="2.5" fill="#475569" />
                  <circle cx={81 + pupilX * 0.4} cy={95 + pupilY * 0.4} r="2.5" fill="#475569" />
                </g>
              )}

              {/* Mouth */}
              {focusedField === 'username' ? (
                <circle cx="74" cy="100" r="3" fill="#475569" />
              ) : isPasswordHidden ? (
                <line x1="70" y1="100" x2="78" y2="100" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
              ) : authStatus === 'success' ? (
                <path d="M 70 98 Q 74 103 78 98" stroke="#475569" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              ) : authStatus === 'failed' ? (
                <path d="M 70 102 Q 74 97 78 102" stroke="#475569" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              ) : (
                <path d="M 71 99 Q 74 101 77 99" stroke="#475569" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              )}
            </g>


            {/* ==================== CHAR 1: RETRO CRT MONITOR BOT (Main Character) ==================== */}
            <g
              filter="url(#monsterShadow)"
              className="animate-float-giga"
              style={{
                transform: getGigaTransform(),
                transformOrigin: '160px 200px',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {/* Metallic Peg Legs connecting to server chassis */}
              <line x1="130" y1="210" x2="115" y2="242" stroke="#475569" strokeWidth="6" strokeLinecap="round" />
              <line x1="190" y1="210" x2="205" y2="242" stroke="#475569" strokeWidth="6" strokeLinecap="round" />

              {/* Cyber Antennas */}
              <line x1="120" y1="110" x2="105" y2="85" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
              <circle cx="102" cy="80" r="5" fill="#38bdf8" />

              <line x1="200" y1="110" x2="215" y2="85" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
              <circle cx="218" cy="80" r="5" fill="#38bdf8" />

              {/* Main Monitor Head Casing */}
              <rect x="100" y="110" width="120" height="95" rx="16" fill="#1e293b" stroke="#475569" strokeWidth="4" />
              
              {/* Bezel frame */}
              <rect x="110" y="120" width="100" height="75" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="2" />

              {/* Glowing monitor Screen */}
              <rect x="114" y="124" width="92" height="67" rx="6" fill="#020617" />

              {/* Cute digital screen eyes */}
              {isPasswordHidden ? (
                // Closed sleeping/hiding lines
                <g>
                  <line x1="126" y1="152" x2="142" y2="152" stroke="#22d3ee" strokeWidth="4.5" strokeLinecap="round" />
                  <line x1="178" y1="152" x2="194" y2="152" stroke="#22d3ee" strokeWidth="4.5" strokeLinecap="round" />
                </g>
              ) : focusedField === 'username' ? (
                // Surprised coding brackets `<` and `>`
                <g>
                  <path d="M 140 144 L 132 152 L 140 160" fill="none" stroke="#22d3ee" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M 180 144 L 188 152 L 180 160" fill="none" stroke="#22d3ee" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              ) : authStatus === 'success' ? (
                // Checkmark success eyes
                <g>
                  <path d="M 126 152 L 133 158 L 144 146" fill="none" stroke="#22d3ee" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M 176 152 L 183 158 L 194 146" fill="none" stroke="#22d3ee" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              ) : authStatus === 'failed' ? (
                // Dead cross eyes
                <g>
                  <path d="M 128 146 L 140 158 M 140 146 L 128 158" stroke="#f43f5e" strokeWidth="4.5" strokeLinecap="round" />
                  <path d="M 180 146 L 192 158 M 192 146 L 180 158" stroke="#f43f5e" strokeWidth="4.5" strokeLinecap="round" />
                </g>
              ) : (
                // Normal responsive tracking eyes
                <g>
                  <circle cx={138 + pupilX * 0.6} cy={152 + pupilY * 0.6} r="8.5" fill="#22d3ee" />
                  <circle cx={182 + pupilX * 0.6} cy={152 + pupilY * 0.6} r="8.5" fill="#22d3ee" />
                  
                  {/* Digital Pupil Insets */}
                  <circle cx={138 + pupilX * 0.8} cy={152 + pupilY * 0.8} r="3.5" fill="#020617" />
                  <circle cx={182 + pupilX * 0.8} cy={152 + pupilY * 0.8} r="3.5" fill="#020617" />
                </g>
              )}

              {/* Digital screen mouth */}
              {focusedField === 'username' ? (
                <circle cx="160" cy="168" r="5.5" fill="#22d3ee" />
              ) : focusedField === 'password' ? (
                showPassword ? (
                  <path d="M 156 166 Q 160 170 164 166" fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" />
                ) : (
                  <line x1="154" y1="168" x2="166" y2="168" stroke="#22d3ee" strokeWidth="3.2" strokeLinecap="round" />
                )
              ) : authStatus === 'success' ? (
                <path d="M 152 165 Q 160 175 168 165" fill="none" stroke="#22d3ee" strokeWidth="3.5" strokeLinecap="round" />
              ) : authStatus === 'failed' ? (
                <path d="M 152 170 Q 160 160 168 170" fill="none" stroke="#f43f5e" strokeWidth="3.5" strokeLinecap="round" />
              ) : (
                <path d="M 154 166 Q 157 169 160 166 Q 163 169 166 166" fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" />
              )}
            </g>


            {/* ==================== CHAR 2: FLOATING DATABASE STACK BOT (Right Side - Enlarged) ==================== */}
            <g
              className="animate-float-mini"
              style={{
                transform: getMiniTransform(),
                transformOrigin: '235px 100px',
                transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {/* Server Stack Cylinder Casing */}
              <path d="M 211 80 C 211 71, 259 71, 259 80 L 259 112 C 259 121, 211 121, 211 112 Z" fill="#f59e0b" stroke="#d97706" strokeWidth="2" />
              
              {/* Server Layers & Segments */}
              <ellipse cx="235" cy="80" rx="24" ry="4" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
              <path d="M 211 85 Q 235 88 259 85" stroke="#d97706" strokeWidth="1.5" fill="none" />
              <path d="M 211 106 Q 235 109 259 106" stroke="#d97706" strokeWidth="1.5" fill="none" />

              {/* Database Status Lights */}
              <circle cx="220" cy="85" r="2" fill="#10b981" />
              <circle cx="220" cy="96" r="2" fill="#10b981" />
              <circle cx="220" cy="107" r="2" fill="#10b981" />

              {/* Cheek Blush */}
              <circle cx="230" cy="99" r="1.5" fill="#d97706" opacity="0.3" />
              <circle cx="250" cy="99" r="1.5" fill="#d97706" opacity="0.3" />

              {/* Eyes */}
              {isPasswordHidden ? (
                <g>
                  <path d="M 232 96 Q 235 93 238 96" stroke="#78350f" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M 242 96 Q 245 93 248 96" stroke="#78350f" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </g>
              ) : (
                <g>
                  <circle cx={235 + pupilX * 0.4} cy={96 + pupilY * 0.4} r="2.2" fill="#78350f" />
                  <circle cx={245 + pupilX * 0.4} cy={96 + pupilY * 0.4} r="2.2" fill="#78350f" />
                </g>
              )}

              {/* Smile */}
              {focusedField === 'username' ? (
                <circle cx="241" cy="102" r="2" fill="#78350f" />
              ) : isPasswordHidden ? (
                <line x1="237" y1="102" x2="245" y2="102" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
              ) : authStatus === 'success' ? (
                <path d="M 237 101 Q 241 104 245 101" stroke="#78350f" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              ) : authStatus === 'failed' ? (
                <path d="M 237 103 Q 241 100 245 103" stroke="#78350f" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              ) : (
                <path d="M 237 102 Q 240 104 243 102" stroke="#78350f" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              )}
            </g>

          </svg>

          {/* Bottom stats subtitle banner */}
          <div className="mt-6 text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest text-center">
            Kelompok 3 - Tugas besar cloud computing
          </div>
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