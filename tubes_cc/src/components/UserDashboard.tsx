'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TodoList from './TodoList';
import InstanceBadge from './InstanceBadge';
import { Todo } from '@/app/actions/todos';
import { Member } from '@/app/actions/members';

interface UserDashboardProps {
  sessionUser: string;
  initialTodos: Todo[];
  fetchError: string | null;
}

export default function UserDashboard({ sessionUser, initialTodos, fetchError }: UserDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'my_tasks' | 'team'>('dashboard');
  
  // Client state for tasks and members
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Fetch personal todos
  const fetchTodos = async () => {
    try {
      const res = await fetch('/api/todos');
      const data = await res.json();
      if (data.success) {
        setTodos(data.todos);
      }
    } catch (err) {
      console.error('Failed to fetch todos:', err);
    }
  };

  // Fetch team members
  const fetchMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const res = await fetch('/api/members');
      const data = await res.json();
      if (data.success) {
        setMembers(data.members);
      }
    } catch (err) {
      console.error('Failed to fetch team members:', err);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // Load team members on team tab activation
  useEffect(() => {
    let active = true;
    if (activeTab === 'team') {
      const timer = setTimeout(() => {
        if (active) fetchMembers();
      }, 0);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    } else if (activeTab === 'dashboard') {
      const timer = setTimeout(() => {
        if (active) fetchTodos();
      }, 0);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    }
  }, [activeTab]);

  // Compute metrics for personal dashboard tab
  const totalTasks = todos.length;
  const completedTasks = todos.filter((t) => t.status === 'completed').length;
  const inProgressTasks = todos.filter((t) => t.status === 'in_progress').length;
  const notStartedTasks = todos.filter((t) => t.status === 'pending').length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // SVG Circular progress configurations
  const radius = 36;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

  // Generate task velocity data for the last 7 days (or placeholder if empty)
  const getChartData = () => {
    const days = [];
    const completedCounts = [];
    const totalCounts = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      days.push(dayLabel);

      const dateStr = d.toDateString();
      
      // Count total tasks created up to this day
      const createdUpToDay = todos.filter(t => {
        const tDate = new Date(t.created_at);
        return tDate.toDateString() === dateStr || tDate < d;
      }).length;
      
      // Count completed tasks up to this day
      const completedUpToDay = todos.filter(t => {
        if (t.status !== 'completed') return false;
        const tDate = new Date(t.updated_at);
        return tDate.toDateString() === dateStr || tDate < d;
      }).length;

      totalCounts.push(createdUpToDay);
      completedCounts.push(completedUpToDay);
    }

    const hasData = totalCounts.some(c => c > 0);
    const chartTotals = hasData ? totalCounts : [0.8, 0.8, 0.8, 0.8, 0.8, 1.2, 5.5];
    const chartCompleted = hasData ? completedCounts : [0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 5.0];

    return { days, totals: chartTotals, completed: chartCompleted, isPlaceholder: !hasData };
  };

  const chartData = getChartData();

  // SVG Line Chart coordinates calculation
  const isDemo = chartData.isPlaceholder;
  const scaleMax = isDemo ? 5.5 : Math.max(...chartData.totals, 2);
  const ticks = isDemo 
    ? [5.5, 5.0, 2.5, 2.0, 1.5, 1.0, 0.5, 0]
    : [scaleMax, scaleMax * 0.8, scaleMax * 0.6, scaleMax * 0.4, scaleMax * 0.2, 0].map(v => Number(v.toFixed(1)));

  const chartHeight = 160;
  const chartWidth = 720;
  const paddingX = 40;
  const paddingY = 25;

  const pointsX = [0, 1, 2, 3, 4, 5, 6].map(i => paddingX + (i * (chartWidth - paddingX * 2)) / 6);
  const pointsYTotal = chartData.totals.map(v => chartHeight - paddingY - (v / scaleMax) * (chartHeight - paddingY * 2));
  const pointsYCompleted = chartData.completed.map(v => chartHeight - paddingY - (v / scaleMax) * (chartHeight - paddingY * 2));

  const getCurvePath = (xs: number[], ys: number[]) => {
    if (xs.length === 0) return '';
    let path = `M ${xs[0]} ${ys[0]}`;
    for (let i = 0; i < xs.length - 1; i++) {
      const cpX1 = xs[i] + (xs[i + 1] - xs[i]) / 2;
      const cpY1 = ys[i];
      const cpX2 = xs[i] + (xs[i + 1] - xs[i]) / 2;
      const cpY2 = ys[i + 1];
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${xs[i + 1]} ${ys[i + 1]}`;
    }
    return path;
  };

  const getAreaPath = (xs: number[], ys: number[]) => {
    const linePath = getCurvePath(xs, ys);
    if (!linePath) return '';
    return `${linePath} L ${xs[xs.length - 1]} ${chartHeight - paddingY} L ${xs[0]} ${chartHeight - paddingY} Z`;
  };

  const pathTotal = getCurvePath(pointsX, pointsYTotal);
  const areaTotal = getAreaPath(pointsX, pointsYTotal);

  const pathCompleted = getCurvePath(pointsX, pointsYCompleted);
  const areaCompleted = getAreaPath(pointsX, pointsYCompleted);

  // Helper to get initials
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Sign out via Auth Microservice
  const handleSignOut = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        router.push('/login');
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050811] text-white">
      
      {/* 1. Sidebar Layout */}
      <aside className="w-64 bg-[#090d16] border-r border-white/5 flex flex-col justify-between shrink-0 hidden md:flex min-h-screen">
        <div className="p-6 space-y-8">
          {/* Logo / Brand */}
          <div>
            <h2 className="text-xl font-bold tracking-wider text-[#00f0ff] uppercase">
              Cloud Monolith
            </h2>
            <span className="text-[10px] text-slate-500 font-bold tracking-widest block mt-0.5">
              Terminal v2.4
            </span>
          </div>

          {/* Navigation links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-3.5 w-full text-left rounded-xl px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'border-r-2 border-[#00f0ff] bg-cyan-500/5 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('my_tasks')}
              className={`flex items-center gap-3.5 w-full text-left rounded-xl px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'my_tasks'
                  ? 'border-r-2 border-[#00f0ff] bg-cyan-500/5 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              My Tasks
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`flex items-center gap-3.5 w-full text-left rounded-xl px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'team'
                  ? 'border-r-2 border-[#00f0ff] bg-cyan-500/5 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Team
            </button>
          </nav>
        </div>

        {/* Bottom logout */}
        <div className="p-6 border-t border-white/5">
          <button
            onClick={() => handleSignOut()}
            className="flex items-center gap-3.5 w-full text-left rounded-xl px-4 py-3 text-sm font-semibold text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 min-h-screen flex flex-col overflow-hidden bg-[#050811]">
        
        {/* Top Header Navbar */}
        <header className="h-18 border-b border-white/5 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search infrastructure..."
                className="w-56 rounded-lg bg-slate-900/60 border border-white/5 pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500/40"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Profile Avatar */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400">{sessionUser}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-[#00f0ff] font-bold text-white shadow-md text-xs border border-white/10 uppercase">
                {sessionUser[0]}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto p-8 space-y-8 relative">
          {/* Ambient Glow effect inside main area */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

          {activeTab === 'dashboard' && (
            <div className="space-y-6 relative w-full">
              <div>
                <h2 className="text-3xl font-black text-white font-serif tracking-tight">
                  Welcome back, <span className="bg-gradient-to-r from-[#00f0ff] to-blue-400 bg-clip-text text-transparent">{sessionUser}</span> 👋
                </h2>
                <p className="text-xs text-slate-400 mt-1.5 font-serif">
                  Track your personal deliverables and performance statistics. All systems are currently <span className="text-emerald-400 font-bold uppercase font-mono text-[10px] tracking-wider">OPTIMIZED</span> in region US-EAST-1.
                </p>
              </div>

              {/* Progress visualizer cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center bg-[#090d16] p-6 rounded-2xl border border-white/5 shadow-xl">
                {/* Left Column: SVG Circle progress */}
                <div className="flex flex-col items-center justify-center bg-[#050811] rounded-xl p-5 border border-white/5 h-36">
                  <div className="relative flex items-center justify-center">
                    <svg className="h-24 w-24 transform -rotate-90">
                      <circle cx="48" cy="48" r={radius} className="stroke-slate-900 fill-none" strokeWidth={strokeWidth} />
                      <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        className="stroke-cyan-400 fill-none transition-all duration-500 ease-out"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        style={{ stroke: 'url(#completionGlowUser)' }}
                      />
                      <defs>
                        <linearGradient id="completionGlowUser" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#00f0ff" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="font-mono text-sm font-bold text-white leading-none">{completionPercentage}%</span>
                      <span className="text-[7px] font-mono font-bold text-slate-400 uppercase tracking-widest mt-1">DONE</span>
                    </div>
                  </div>
                </div>

                {/* Right Columns: Metrics Breakdown */}
                <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-r-xl border-y border-r border-white/5 border-l-4 border-l-[#10b981] bg-[#0c1322]/35 p-4 flex flex-col justify-between h-36">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">Completed</span>
                      <span className="flex h-2 w-2 rounded-full bg-[#10b981]" />
                    </div>
                    <div>
                      <span className="text-3xl font-black text-white">{completedTasks}</span>
                      <span className="text-xs text-slate-500 ml-1">tasks</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Tasks fully completed</span>
                  </div>

                  <div className="rounded-r-xl border-y border-r border-white/5 border-l-4 border-l-[#f59e0b] bg-[#0c1322]/35 p-4 flex flex-col justify-between h-36">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">In Progress</span>
                      <span className="flex h-2 w-2 rounded-full bg-[#f59e0b]" />
                    </div>
                    <div>
                      <span className="text-3xl font-black text-white">{inProgressTasks}</span>
                      <span className="text-xs text-slate-500 ml-1">tasks</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Tasks in execution state</span>
                  </div>

                  <div className="rounded-r-xl border-y border-r border-white/5 border-l-4 border-l-[#64748b] bg-[#0c1322]/35 p-4 flex flex-col justify-between h-36">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">Not Started</span>
                      <span className="flex h-2 w-2 rounded-full bg-[#64748b]" />
                    </div>
                    <div>
                      <span className="text-3xl font-black text-white">{notStartedTasks}</span>
                      <span className="text-xs text-slate-500 ml-1">tasks</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Tasks pending start</span>
                  </div>
                </div>
              </div>

              {/* Bento Grid with SVG Productivity Chart and Cloud Diagnostics */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                {/* Left Panel: SVG Productivity Chart */}
                <div className="lg:col-span-7 bg-[#090d16] p-6 rounded-2xl border border-white/5 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                        Productivity & Task Velocity
                      </h3>
                      {chartData.isPlaceholder && (
                        <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
                          Demo Baseline Mode
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Cumulative task volume and completion status over the last 7 days.
                    </p>
                  </div>

                  {/* SVG Chart */}
                  <div className="my-6 relative w-full h-[180px]">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
                      {/* Gradients definitions */}
                      <defs>
                        <linearGradient id="totalAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="completedAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.0" />
                        </linearGradient>
                        <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
                          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00f0ff" floodOpacity="0.3" />
                        </filter>
                      </defs>

                      {/* Grid Lines */}
                      {ticks.map((tickVal, idx) => {
                        const y = paddingY + (1 - tickVal / scaleMax) * (chartHeight - paddingY * 2);
                        return (
                          <g key={idx}>
                            <line
                              x1={paddingX}
                              y1={y}
                              x2={chartWidth - paddingX}
                              y2={y}
                              className="stroke-white/5"
                              strokeWidth="1"
                              strokeDasharray="4 4"
                            />
                            <text
                              x={paddingX - 10}
                              y={y + 3}
                              className="fill-slate-500 font-mono text-[9px] text-right"
                              textAnchor="end"
                            >
                              {tickVal}
                            </text>
                          </g>
                        );
                      })}

                      {/* Filled Area Paths */}
                      {areaTotal && (
                        <path d={areaTotal} fill="url(#totalAreaGrad)" className="transition-all duration-500" />
                      )}
                      {areaCompleted && (
                        <path d={areaCompleted} fill="url(#completedAreaGrad)" className="transition-all duration-500" />
                      )}

                      {/* Curve Lines */}
                      {pathTotal && (
                        <path
                          d={pathTotal}
                          fill="none"
                          stroke="#64748b"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                          className="transition-all duration-500"
                        />
                      )}
                      {pathCompleted && (
                        <path
                          d={pathCompleted}
                          fill="none"
                          stroke="#00f0ff"
                          strokeWidth="2.5"
                          filter="url(#glow)"
                          className="transition-all duration-500"
                        />
                      )}

                      {/* Coordinates Nodes (Dots) */}
                      {pointsX.map((x, i) => (
                        <g key={i} className="group/node cursor-pointer">
                          {/* Total node */}
                          <circle
                            cx={x}
                            cy={pointsYTotal[i]}
                            r="4.5"
                            className="fill-blue-600 stroke-[#050811] hover:r-6 transition-all"
                            strokeWidth="2"
                          />
                          {/* Completed node */}
                          <circle
                            cx={x}
                            cy={pointsYCompleted[i]}
                            r="4.5"
                            className="fill-cyan-400 stroke-[#050811] hover:r-6 transition-all"
                            strokeWidth="2"
                          />
                        </g>
                      ))}

                      {/* X Axis Labels */}
                      {chartData.days.map((day, i) => (
                        <text
                          key={i}
                          x={pointsX[i]}
                          y={chartHeight - 5}
                          className="fill-slate-500 font-semibold text-[9px] text-center"
                          textAnchor="middle"
                        >
                          {day}
                        </text>
                      ))}
                    </svg>
                  </div>

                  {/* Legend Indicator */}
                  <div className="flex items-center gap-6 text-[10px] text-slate-500 border-t border-white/5 pt-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#64748b]" />
                      <span>Total Tasks Created</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.4)]" />
                      <span>Completed Tasks</span>
                    </div>
                    {chartData.isPlaceholder && (
                      <span className="text-[9px] text-slate-600 italic ml-auto">
                        *Create tasks to update chart metrics
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Panel: Active EC2 Node Status & System Diagnostics */}
                <div className="lg:col-span-5 space-y-6">
                  {/* AWS EC2 Instance Badge */}
                  <InstanceBadge />

                  {/* System Diagnostics Card */}
                  <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#090d16] p-6 shadow-xl">
                    {/* Background Radial Glow */}
                    <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
                      Cluster Performance
                    </h3>

                    <div className="space-y-4 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Database Connection</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Operational
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">API Response Latency</span>
                        <span className="text-cyan-400 font-mono font-bold">14 ms</span>
                      </div>

                      {/* Node Utilization Bar */}
                      <div className="space-y-1.5 pt-2 border-t border-white/5">
                        <div className="flex justify-between text-slate-400 text-[11px]">
                          <span>Virtual CPU Load</span>
                          <span className="font-mono text-cyan-400">8.4%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-[#00f0ff]" style={{ width: '8.4%' }} />
                        </div>
                      </div>

                      {/* Memory Allocation Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-slate-400 text-[11px]">
                          <span>Memory Allocation</span>
                          <span className="font-mono text-cyan-400">42%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-[#00f0ff]" style={{ width: '42%' }} />
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-white/5 text-[10px] text-slate-500">
                        <span>Cluster Status:</span>
                        <span className="font-bold uppercase tracking-wider text-[#00f0ff]">Optimized</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'my_tasks' && (
            <div className="relative mx-auto max-w-2xl">
              {/* Task list centered component */}
              {!fetchError ? (
                <TodoList initialTodos={todos} onMutationSuccess={fetchTodos} />
              ) : (
                <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-6 text-center text-slate-500 text-sm">
                  {fetchError}
                </div>
              )}
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-6 relative w-full">
              <div>
                <h2 className="text-3xl font-black text-white">
                  Team <span className="bg-gradient-to-r from-[#00f0ff] to-blue-400 bg-clip-text text-transparent">Contributors</span>
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Project Kelompok 3 - Tugas Besar Cloud Computing
                </p>
              </div>

              {isLoadingMembers ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="rounded-2xl border border-white/5 bg-[#0a0f1d]/50 p-6 h-60" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {members.map((member) => {
                    const initials = getInitials(member.name);
                    const rate = member.total_tasks > 0 ? Math.round((member.completed_tasks / member.total_tasks) * 100) : 0;
                    
                    // Contributor descriptions
                    let role = 'Software Engineer';
                    let bio = 'Responsible for codebase development and state modules.';
                    if (member.name.toLowerCase().includes('zaky')) {
                      role = 'Cloud System Architect';
                      bio = 'Leads local database design and multi-instance cloud deployments.';
                    } else if (member.name.toLowerCase().includes('hafiz')) {
                      role = 'DevOps / CI-CD Specialist';
                      bio = 'Handles container configuration and EC2 stateless auto-scaling.';
                    } else if (member.name.toLowerCase().includes('haris')) {
                      role = 'Database Engineer';
                      bio = 'Designs schema migrations, indexing optimization, and query plans.';
                    } else if (member.name.toLowerCase().includes('djordhi')) {
                      role = 'Frontend Developer';
                      bio = 'Fosters visual aesthetics, glassmorphism designs, and UI responsiveness.';
                    } else if (member.name.toLowerCase().includes('farid')) {
                      role = 'Fullstack Developer';
                      bio = 'Responsible for Next.js app router server actions and state sync.';
                    }

                    return (
                      <div
                        key={member.id}
                        className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0a0f1d]/50 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-[#00f0ff]/30 hover:shadow-[0_0_20px_rgba(0,240,255,0.05)] hover:scale-[1.01]"
                      >
                        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-500/5 blur-2xl pointer-events-none" />

                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-[#00f0ff] font-bold text-white shadow-md text-sm">
                            {initials}
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-base font-bold text-white leading-snug">{member.name}</h4>
                            <span className="inline-flex items-center rounded-md bg-cyan-500/10 px-2 py-0.5 text-xs font-semibold text-[#00f0ff] border border-cyan-500/20">
                              {role}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 space-y-3 pt-3 border-t border-white/5">
                          <div className="flex justify-between items-center text-xs text-slate-400">
                            <span>Class Room</span>
                            <span className="font-semibold text-white">{member.class_room}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-slate-400">
                            <span>NIM / Student ID</span>
                            <span className="font-mono text-slate-400">120223000{member.id}</span>
                          </div>
                          <p className="text-xs text-slate-500 italic mt-2 leading-relaxed">
                            &ldquo;{bio}&rdquo;
                          </p>
                        </div>

                        {/* metrics */}
                        <div className="mt-5 space-y-2.5 pt-4 border-t border-white/5">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span className="font-medium">Task Completion</span>
                            <span className="font-semibold text-cyan-400">{rate}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-[#00f0ff] transition-all duration-500"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                            <span>{member.completed_tasks} completed</span>
                            <span>{member.total_tasks} total tasks</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

    </div>
  );
}
