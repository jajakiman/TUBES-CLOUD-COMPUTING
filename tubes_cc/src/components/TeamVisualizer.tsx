'use client';

import React from 'react';
import { Member } from '@/app/actions/members';

interface TeamVisualizerProps {
  members: Member[];
  activeFilter: 'all' | 'no_todo' | 'in_progress' | 'completed';
  onFilterChange: (filter: 'all' | 'no_todo' | 'in_progress' | 'completed') => void;
}

export default function TeamVisualizer({
  members,
  activeFilter,
  onFilterChange,
}: TeamVisualizerProps) {
  // Metrics calculations
  const totalMembers = members.length;
  const completedMembersCount = members.filter((m) => m.status === 'completed').length;
  const inProgressMembersCount = members.filter((m) => m.status === 'in_progress').length;
  const noTodoMembersCount = members.filter((m) => m.status === 'no_todo').length;

  // Calculate task completion percentage across the entire team
  let totalTasks = 0;
  let completedTasks = 0;

  members.forEach((m) => {
    totalTasks += m.total_tasks;
    completedTasks += m.completed_tasks;
  });

  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // SVG Circular progress configurations
  const radius = 36;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      {/* Subtle top background abstract gradient panel */}
      <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-gradient-to-tr from-indigo-500/5 to-violet-500/5 blur-3xl pointer-events-none" />

      {/* Header with Title */}
      <div className="mb-6">
        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider leading-none">
          Team Progress Overview
        </h3>
        <p className="text-[11px] text-slate-400 mt-1.5 font-semibold leading-none">
          Real-time collaboration status metrics
        </p>
      </div>

      {/* Flex container */}
      <div className="flex flex-col md:flex-row gap-8 items-center">
        
        {/* Left: SVG Circular Progress Ring */}
        <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shrink-0 w-36 h-36">
          <div className="relative flex items-center justify-center">
            {/* SVG Ring */}
            <svg className="h-24 w-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="stroke-slate-200/60 fill-none"
                strokeWidth={strokeWidth}
              />
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="fill-none transition-all duration-500 ease-out"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  stroke: 'url(#completionGlowAdmin)',
                }}
              />
              {/* Define Gradient */}
              <defs>
                <linearGradient id="completionGlowAdmin" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4f46e5" /> {/* Indigo */}
                  <stop offset="100%" stopColor="#8b5cf6" /> {/* Violet */}
                </linearGradient>
              </defs>
            </svg>

            {/* Inner Percentage text */}
            <div className="absolute flex flex-col items-center">
              <span className="font-mono text-xl font-black text-slate-800 leading-none">
                {completionPercentage}%
              </span>
              <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">
                Completed
              </span>
            </div>
          </div>
        </div>

        {/* Right side: Detailed Stats and Information */}
        <div className="flex-1 space-y-4">
          <div>
            <h4 className="text-base font-bold text-slate-800 tracking-tight">Team Workspace Health & Delivery</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
              Overview of all tasks assigned to Kelompok 3 members. Status tracking helps monitor cloud-native microservice integration progress.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Contributors</span>
              <span className="text-lg font-black text-slate-800 mt-0.5">{totalMembers}</span>
            </div>
            <div className="h-8 w-px bg-slate-200 self-center" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Project Tasks</span>
              <span className="text-lg font-black text-slate-800 mt-0.5">{totalTasks}</span>
            </div>
            <div className="h-8 w-px bg-slate-200 self-center" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed Tasks</span>
              <span className="text-lg font-black text-indigo-600 mt-0.5">{completedTasks}</span>
            </div>
            <div className="h-8 w-px bg-slate-200 self-center" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Running Tasks</span>
              <span className="text-lg font-black text-amber-500 mt-0.5">{inProgressMembersCount} active</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
