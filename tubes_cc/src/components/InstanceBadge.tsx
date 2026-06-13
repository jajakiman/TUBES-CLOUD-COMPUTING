'use client';

import React, { useEffect, useState } from 'react';

/**
 * InstanceBadge Component
 * Reads the public environment variable NEXT_PUBLIC_INSTANCE_ID
 * to visually display which EC2 instance is currently handling the request.
 */
export default function InstanceBadge() {
  const [instanceId, setInstanceId] = useState<string>('Detecting...');
  const [timestamp, setTimestamp] = useState<string>('');

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) {
        const id = process.env.NEXT_PUBLIC_INSTANCE_ID || 'EC2-LOCAL-DEV-01';
        setInstanceId(id);
        setTimestamp(new Date().toLocaleTimeString());
      }
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:border-indigo-300">
      {/* Soft abstract background gradient block */}
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-gradient-to-tr from-indigo-500/5 to-violet-500/5 blur-xl pointer-events-none" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {/* Animated Pulsing Active Node Indicator */}
          <div className="relative flex h-3 w-3 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
          </div>

          <div>
            <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase leading-none">
              Active Routing Node
            </p>
            <h3 className="font-mono text-sm font-bold text-slate-800 tracking-tight mt-1">
              {instanceId}
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
          {/* AWS ALB Indicator Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-650 border border-indigo-100">
            <svg className="h-1.5 w-1.5 fill-indigo-600 animate-pulse" viewBox="0 0 6 6" aria-hidden="true">
              <circle cx="3" cy="3" r="3" />
            </svg>
            AWS ALB Directed
          </span>

          <span className="text-[10px] font-medium text-slate-400">
            Refreshed: <span className="font-mono text-slate-500">{timestamp}</span>
          </span>
        </div>
      </div>

      <div className="mt-3 border-t border-slate-100 pt-3">
        <p className="text-[10.5px] text-slate-500 leading-relaxed">
          Traffic is processed by the monolith application deployed on a stateless EC2 scaling group.
        </p>
      </div>
    </div>
  );
}
