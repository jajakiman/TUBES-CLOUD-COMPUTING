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
  const radius = 32;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/40 backdrop-blur-md p-6 transition-colors duration-200 text-white shadow-2xl">
      {/* Header with Title */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-none">
            Team Workspace Analytics
          </h3>
          <h2 className="text-lg font-extrabold text-white tracking-tight mt-1.5 leading-none">
            Overall Progress Overview
          </h2>
        </div>

        {/* Dynamic Filter Tabs for Contributor Status */}
        <div className="flex flex-wrap gap-1 border border-white/10 p-0.5 rounded-lg bg-slate-950/60 self-start">
          {[
            { id: 'all', label: 'All' },
            { id: 'no_todo', label: 'Not Started' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'completed', label: 'Completed' }
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => onFilterChange(btn.id as any)}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-premium cursor-pointer ${
                activeFilter === btn.id
                  ? 'bg-indigo-600 text-white shadow-sm border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Content Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
        
        {/* Left: SVG Circular Progress Ring */}
        <div className="flex flex-col items-center justify-center bg-slate-950/40 border border-white/5 rounded-xl p-4 shrink-0 h-36">
          <div className="relative flex items-center justify-center">
            {/* SVG Ring */}
            <svg className="h-20 w-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="stroke-white/5 fill-none"
                strokeWidth={strokeWidth}
              />
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="stroke-indigo-500 fill-none transition-all duration-500 ease-out"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>

            {/* Inner Percentage text */}
            <div className="absolute flex flex-col items-center">
              <span className="font-mono text-sm font-bold text-white leading-none">
                {completionPercentage}%
              </span>
              <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Done
              </span>
            </div>
          </div>
        </div>

        {/* Right side: Detailed Stats and Information */}
        <div className="md:col-span-3 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">Delivery Health</h4>
            <p className="text-xs text-slate-350 mt-1 leading-relaxed font-medium">
              Tracks the collective output of Kelompok 3 members. In-progress tasks show active microservice integration logs, while completed tasks indicate verified deployment states.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-white/5">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Team</span>
              <span className="text-base font-bold text-white mt-1">{totalMembers} contributors</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Tasks</span>
              <span className="text-base font-bold text-white mt-1">{totalTasks} items</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Completed</span>
              <span className="text-base font-bold text-white mt-1">{completedTasks} items</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Active Status</span>
              <span className="text-base font-bold text-emerald-400 mt-1">{inProgressMembersCount} active</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

