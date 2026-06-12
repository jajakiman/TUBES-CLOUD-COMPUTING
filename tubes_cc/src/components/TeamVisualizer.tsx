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
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#090d16] p-6 shadow-xl transition-all duration-300">
      
      {/* Header with Title and Icons */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Team Progress Overview
        </h3>
        <div className="flex items-center gap-2.5 text-slate-500">
          <button 
            type="button"
            onClick={() => onFilterChange('all')}
            className="p-1.5 hover:text-white transition-colors rounded-lg hover:bg-white/5 cursor-pointer"
            title="Reset active filters"
          >
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8.89M9 11l3 3L22 4" />
            </svg>
          </button>
          <button 
            type="button"
            className="p-1.5 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        
        {/* Left Column: SVG Circular Progress Ring */}
        <div 
          onClick={() => onFilterChange('all')}
          className="flex flex-col items-center justify-center bg-[#050811] rounded-xl p-5 border border-white/5 cursor-pointer hover:bg-white/[0.02] transition-all duration-300 shrink-0 group h-36"
          title="Click to reset filter to All"
        >
          <div className="relative flex items-center justify-center">
            {/* SVG Ring */}
            <svg className="h-24 w-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="stroke-slate-900 fill-none"
                strokeWidth={strokeWidth}
              />
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="stroke-cyan-400 fill-none transition-all duration-500 ease-out"
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
                  <stop offset="0%" stopColor="#00f0ff" /> {/* Cyan */}
                  <stop offset="100%" stopColor="#3b82f6" /> {/* Blue */}
                </linearGradient>
              </defs>
            </svg>

            {/* Inner Percentage text */}
            <div className="absolute flex flex-col items-center">
              <span className="font-mono text-xl font-black text-white leading-none">
                {completionPercentage}%
              </span>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider mt-0.5">
                Completed
              </span>
            </div>
          </div>
          <span className="mt-2 text-[10px] font-bold text-slate-400 group-hover:text-white transition-colors uppercase tracking-wider">
            Team Health Rate
          </span>
        </div>

        {/* Right column: Metric breakdown cards */}
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Card: Completed */}
          <div
            onClick={() => onFilterChange(activeFilter === 'completed' ? 'all' : 'completed')}
            className={`cursor-pointer rounded-r-xl border-y border-r border-white/5 border-l-4 p-4.5 transition-all duration-300 flex flex-col justify-between h-36 hover:scale-[1.02] ${
              activeFilter === 'completed'
                ? 'border-l-[#10b981] bg-[#10b981]/10 shadow-lg shadow-emerald-500/5'
                : 'border-l-[#10b981] bg-[#0c1322]/30 hover:bg-[#10b981]/5'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Completed</span>
              <span className="flex h-2 w-2 rounded-full bg-[#10b981]" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-white">{completedMembersCount}</span>
              <span className="text-xs text-slate-500 ml-1">members</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Tasks 100% finished</span>
          </div>

          {/* Card: In Progress */}
          <div
            onClick={() => onFilterChange(activeFilter === 'in_progress' ? 'all' : 'in_progress')}
            className={`cursor-pointer rounded-r-xl border-y border-r border-white/5 border-l-4 p-4.5 transition-all duration-300 flex flex-col justify-between h-36 hover:scale-[1.02] ${
              activeFilter === 'in_progress'
                ? 'border-l-[#f59e0b] bg-[#f59e0b]/10 shadow-lg shadow-amber-500/5'
                : 'border-l-[#f59e0b] bg-[#0c1322]/30 hover:bg-[#f59e0b]/5'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">In Progress</span>
              <span className="flex h-2 w-2 rounded-full bg-[#f59e0b]" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-white">{inProgressMembersCount}</span>
              <span className="text-xs text-slate-500 ml-1">members</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Tasks in progress</span>
          </div>

          {/* Card: No Todo (Not Started) */}
          <div
            onClick={() => onFilterChange(activeFilter === 'no_todo' ? 'all' : 'no_todo')}
            className={`cursor-pointer rounded-r-xl border-y border-r border-white/5 border-l-4 p-4.5 transition-all duration-300 flex flex-col justify-between h-36 hover:scale-[1.02] ${
              activeFilter === 'no_todo'
                ? 'border-l-[#64748b] bg-[#64748b]/20 shadow-lg shadow-slate-500/5'
                : 'border-l-[#64748b] bg-[#0c1322]/30 hover:bg-[#64748b]/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Not Started</span>
              <span className="flex h-2 w-2 rounded-full bg-[#64748b]" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-white">{noTodoMembersCount}</span>
              <span className="text-xs text-slate-500 ml-1">members</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Tasks not started</span>
          </div>

        </div>
      </div>

      {activeFilter !== 'all' && (
        <div className="mt-4 flex items-center justify-between bg-cyan-500/5 border border-cyan-500/10 rounded-lg px-3 py-1.5 text-xs text-cyan-400">
          <span>
            Filtering contributors list by status: <strong className="capitalize font-bold">{activeFilter === 'no_todo' ? 'Not Started' : activeFilter === 'in_progress' ? 'In Progress' : 'Completed'}</strong>
          </span>
          <button 
            onClick={() => onFilterChange('all')}
            className="hover:text-white font-bold ml-2 underline cursor-pointer"
          >
            Clear Filter
          </button>
        </div>
      )}
    </div>
  );
}
