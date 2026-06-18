'use client';

import React, { useEffect } from 'react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' 
    ? 'bg-slate-900/90 border-white/10 text-white shadow-2xl backdrop-blur-md' 
    : type === 'error'
    ? 'bg-rose-950/90 border-rose-500/20 text-rose-200 shadow-2xl backdrop-blur-md'
    : 'bg-slate-900/90 border-white/10 text-white shadow-2xl backdrop-blur-md';

  const icon = type === 'success' ? (
    <svg className="h-4 w-4 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ) : type === 'error' ? (
    <svg className="h-4 w-4 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ) : (
    <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );

  const barColor = type === 'success'
    ? 'bg-indigo-500'
    : type === 'error'
    ? 'bg-rose-500'
    : 'bg-indigo-400';

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden rounded-xl border animate-slide-up-fade ${bgColor}`}>
      <div className="flex items-center gap-3.5 px-4.5 py-3.5 min-w-[280px]">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-950/60 border border-white/5 shrink-0">
          {icon}
        </div>
        <span className="text-xs font-bold text-white flex-1 pr-2">{message}</span>
        <button 
          type="button" 
          onClick={onClose} 
          className="hover:opacity-75 transition-opacity text-slate-400 hover:text-white font-bold text-[10px] cursor-pointer"
        >
          ✕
        </button>
      </div>
      {/* Shrinking progress bar */}
      <div className={`h-[3px] w-full animate-shrink-x ${barColor}`} />
    </div>
  );
}

