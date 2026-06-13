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
    ? 'bg-white border-slate-200 text-slate-800 shadow-xl shadow-slate-100' 
    : type === 'error'
    ? 'bg-rose-50 border-rose-200 text-rose-800 shadow-xl shadow-rose-100/50'
    : 'bg-white border-slate-200 text-slate-800 shadow-xl shadow-slate-100';

  const icon = type === 'success' ? (
    <svg className="h-5 w-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ) : type === 'error' ? (
    <svg className="h-5 w-5 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ) : (
    <svg className="h-5 w-5 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const barColor = type === 'success'
    ? 'bg-emerald-500'
    : type === 'error'
    ? 'bg-rose-500'
    : 'bg-indigo-600';

  return (
    <div className={`fixed bottom-5 right-5 z-50 flex flex-col overflow-hidden rounded-2xl border shadow-xl animate-slide-up-fade ${bgColor}`}>
      <div className="flex items-center gap-3 px-5 py-4 min-w-[280px]">
        {icon}
        <span className="text-xs font-semibold tracking-tight text-slate-700 flex-1">{message}</span>
        <button 
          type="button" 
          onClick={onClose} 
          className="ml-2 hover:opacity-75 transition-opacity text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer"
        >
          ✕
        </button>
      </div>
      {/* Shrinking progress bar */}
      <div className={`h-1 w-full animate-shrink-x ${barColor}`} />
    </div>
  );
}
