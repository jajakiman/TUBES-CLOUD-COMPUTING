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
    // Read the injected environment variable for instance identity
    const id = process.env.NEXT_PUBLIC_INSTANCE_ID || 'EC2-LOCAL-DEV-01';
    setInstanceId(id);
    setTimestamp(new Date().toLocaleTimeString());
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5">
      {/* Background radial gradient glow */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {/* Animated Pulsing Active Node Indicator */}
          <div className="relative flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500"></span>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Active Routing Node
            </p>
            <h3 className="font-mono text-lg font-bold text-white tracking-tight">
              {instanceId}
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* AWS ALB Indicator Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-400 border border-blue-500/20">
            <svg className="h-1.5 w-1.5 fill-blue-400" viewBox="0 0 6 6" aria-hidden="true">
              <circle cx="3" cy="3" r="3" />
            </svg>
            AWS ALB Directed
          </span>

          <span className="text-xs font-medium text-slate-500">
            Refreshed at: <span className="font-mono text-slate-400">{timestamp}</span>
          </span>
        </div>
      </div>

      <div className="mt-4 border-t border-white/5 pt-3">
        <p className="text-xs text-slate-400">
          This traffic is processed by the monolith application deployed on a stateless EC2 scaling group.
        </p>
      </div>
    </div>
  );
}
