'use client';

import React, { useEffect, useState, useRef } from 'react';

/**
 * InstanceBadge Component
 * Reads the public environment variable NEXT_PUBLIC_INSTANCE_ID
 * to visually display which EC2 instance is currently handling the request.
 */
interface InstanceBadgeProps {
  className?: string;
}

export default function InstanceBadge({ className = '' }: InstanceBadgeProps) {
  const [instanceId, setInstanceId] = useState<string>('Detecting...');
  const [timestamp, setTimestamp] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

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
    <div ref={containerRef} className={`relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/40 backdrop-blur-md p-5 transition-colors duration-200 text-white shadow-2xl flex flex-col justify-between ${className}`}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Animated Pulsing Active Node Indicator */}
            <div className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              System Instance Node
            </span>
          </div>

          <span className="inline-flex items-center rounded bg-indigo-600/10 px-1.5 py-0.5 text-[9px] font-bold text-indigo-300 border border-indigo-500/20">
            AWS ALB Active
          </span>
        </div>

        <div className="flex items-baseline justify-between mt-1">
          <h3 className="font-mono text-sm font-bold text-white tracking-tight">
            {instanceId}
          </h3>
          <span className="text-[9px] font-medium text-slate-400">
            Refreshed: <span className="font-mono font-semibold text-slate-350">{timestamp}</span>
          </span>
        </div>
      </div>

      <div className="mt-4 border-t border-white/5 pt-3">
        <p className="text-[11px] text-slate-400 leading-normal">
          This stateless instance handles application requests under an Application Load Balancer (ALB) deployment.
        </p>
      </div>
    </div>
  );
}

