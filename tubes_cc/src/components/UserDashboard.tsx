'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TodoList from './TodoList';
import InstanceBadge from './InstanceBadge';
import { Todo } from '@/app/actions/todos';
import { Member } from '@/app/actions/members';
import Toast from './Toast';

interface UserDashboardProps {
  sessionUser: string;
  initialTodos: Todo[];
  fetchError: string | null;
}

export default function UserDashboard({ sessionUser, initialTodos, fetchError }: UserDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'my_tasks' | 'team'>('my_tasks');
  
  // Client state for tasks and members
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Hover state for SVG chart tooltip
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    total: number;
    completed: number;
    day: string;
  } | null>(null);

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
        setToast({ message: 'Logged out successfully!', type: 'success' });
        setTimeout(() => {
          router.push('/login');
          router.refresh();
        }, 800);
      }
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f1f5f9] text-slate-800 font-sans select-none p-4 gap-6">
      
      {/* 1. Sidebar Layout */}
      <aside className="w-64 bg-white/95 border border-slate-200/60 rounded-3xl flex flex-col justify-between shrink-0 hidden md:flex shadow-premium">
        <div className="p-6 space-y-8">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-50 to-indigo-100/50 border border-indigo-100/80 text-indigo-600 shadow-sm">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 4 3 8 12 12 22 7 12 4" fill="currentColor" fillOpacity="0.15" />
                <path d="M3 12l9 4 9-4" />
                <path d="M3 16l9 4 9-4" />
              </svg>
            </div>
            <div className="flex flex-col">
              <h2 className="text-sm font-extrabold tracking-wide text-slate-800 uppercase leading-none">
                Kelompok 3
              </h2>
              <span className="text-[8px] text-slate-400 font-bold tracking-widest block mt-1.5 uppercase">
                Cloud Workspace
              </span>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('my_tasks')}
              className={`flex items-center gap-3.5 w-full text-left rounded-xl px-4 py-3 text-xs font-bold transition-premium cursor-pointer ${
                activeTab === 'my_tasks'
                  ? 'bg-indigo-600 text-white shadow-premium shadow-glow-indigo'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              My Tasks
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-3.5 w-full text-left rounded-xl px-4 py-3 text-xs font-bold transition-premium cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-premium shadow-glow-indigo'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`flex items-center gap-3.5 w-full text-left rounded-xl px-4 py-3 text-xs font-bold transition-premium cursor-pointer ${
                activeTab === 'team'
                  ? 'bg-indigo-600 text-white shadow-premium shadow-glow-indigo'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Team Portal
            </button>
          </nav>
        </div>

        {/* Bottom logout */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl">
          <button
            onClick={() => handleSignOut()}
            className="flex items-center gap-3.5 w-full text-left rounded-xl px-4 py-3 text-xs font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-premium cursor-pointer"
          >
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white border border-slate-200/60 rounded-3xl shadow-premium">
        
        {/* Top Header Navbar */}
        <header className="h-18 border-b border-slate-100 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search infrastructure..."
                className="w-56 rounded-xl bg-slate-50 border border-slate-200/80 pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition-all duration-350 focus:ring-2 focus:ring-indigo-100/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Profile Avatar */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500">{sessionUser}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-650 to-violet-550 font-bold text-white shadow-premium text-xs border border-indigo-100/40 uppercase">
                {sessionUser[0]}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto p-8 space-y-8 relative">
          {/* Ambient Glow effect inside main area */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

          {activeTab === 'dashboard' && (
            <div className="space-y-6 relative w-full animate-slide-up-fade">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  Welcome back, <span className="bg-gradient-to-r from-indigo-600 to-violet-550 bg-clip-text text-transparent">{sessionUser}</span> 👋
                </h2>
                <p className="text-xs text-slate-500 mt-1.5 font-bold uppercase tracking-wider">
                  Operational status: <span className="text-emerald-600">OPTIMIZED</span> • Region: US-EAST-1
                </p>
              </div>

              {/* Progress visualizer cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-premium">
                {/* Left Column: SVG Circle progress */}
                <div className="flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl p-5 border border-slate-100/80 h-36">
                  <div className="relative flex items-center justify-center">
                    <svg className="h-24 w-24 transform -rotate-90">
                      <circle cx="48" cy="48" r={radius} className="stroke-slate-200/60 fill-none" strokeWidth={strokeWidth} />
                      <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        className="fill-none transition-all duration-500 ease-out"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        style={{ stroke: 'url(#completionGlowUser)' }}
                      />
                      <defs>
                        <linearGradient id="completionGlowUser" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#4338ca" />
                          <stop offset="100%" stopColor="#6d28d9" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="font-mono text-base font-extrabold text-slate-800 leading-none">{completionPercentage}%</span>
                      <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Done</span>
                    </div>
                  </div>
                </div>

                {/* Right Columns: Metrics Breakdown */}
                <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Completed */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 flex flex-col justify-between h-36 shadow-premium transition-premium hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed</span>
                      <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-extrabold text-emerald-700 border border-emerald-100">
                        Active
                      </span>
                    </div>
                    <div>
                      <span className="text-3xl font-black text-emerald-600 tracking-tight">{completedTasks}</span>
                      <span className="text-xs text-slate-400 font-bold ml-1.5">tasks</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium leading-none">Deliverables fully ready</span>
                  </div>

                  {/* In Progress */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 flex flex-col justify-between h-36 shadow-premium transition-premium hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">In Progress</span>
                      <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[9px] font-extrabold text-amber-700 border border-amber-100 animate-pulse">
                        Working
                      </span>
                    </div>
                    <div>
                      <span className="text-3xl font-black text-amber-600 tracking-tight">{inProgressTasks}</span>
                      <span className="text-xs text-slate-400 font-bold ml-1.5">tasks</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium leading-none">In active execution</span>
                  </div>

                  {/* Not Started */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 flex flex-col justify-between h-36 shadow-premium transition-premium hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Not Started</span>
                      <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-[9px] font-extrabold text-slate-650 border border-slate-200">
                        Queued
                      </span>
                    </div>
                    <div>
                      <span className="text-3xl font-black text-slate-600 tracking-tight">{notStartedTasks}</span>
                      <span className="text-xs text-slate-400 font-bold ml-1.5">tasks</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium leading-none">Awaiting development</span>
                  </div>
                </div>
              </div>

              {/* Bento Grid with SVG Productivity Chart and Cloud Diagnostics */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                {/* Left Panel: SVG Productivity Chart */}
                <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-premium flex flex-col justify-between relative">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Productivity & Task Velocity
                      </h3>
                      {chartData.isPlaceholder && (
                        <span className="inline-flex items-center rounded-md bg-amber-50 px-2.5 py-0.5 text-[9px] font-extrabold text-amber-700 border border-amber-100 uppercase">
                          Demo Baseline Mode
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-800 mt-1.5">
                      Cumulative task volume and completion status over the last 7 days.
                    </p>
                  </div>

                  {/* SVG Chart Container */}
                  <div className="my-6 relative w-full h-[180px]">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
                      {/* Gradients definitions */}
                      <defs>
                        <linearGradient id="totalAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.12" />
                          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="completedAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.12" />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                        </linearGradient>
                        <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
                          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#8b5cf6" floodOpacity="0.2" />
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
                              className="stroke-slate-100"
                              strokeWidth="1"
                              strokeDasharray="4 4"
                            />
                            <text
                              x={paddingX - 10}
                              y={y + 3}
                              className="fill-slate-400 font-mono text-[9px] text-right"
                              textAnchor="end"
                            >
                              {tickVal}
                            </text>
                          </g>
                        );
                      })}

                      {/* Hover vertical guide line */}
                      {hoveredPoint && (
                        <line
                          x1={hoveredPoint.x}
                          y1={paddingY}
                          x2={hoveredPoint.x}
                          y2={chartHeight - paddingY}
                          className="stroke-indigo-200"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                        />
                      )}

                      {/* Filled Area Paths */}
                      {areaTotal && (
                        <path d={areaTotal} fill="url(#totalAreaGrad)" className="transition-all duration-550" />
                      )}
                      {areaCompleted && (
                        <path d={areaCompleted} fill="url(#completedAreaGrad)" className="transition-all duration-550" />
                      )}

                      {/* Curve Lines */}
                      {pathTotal && (
                        <path
                          d={pathTotal}
                          fill="none"
                          stroke="#cbd5e1"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                          className="transition-all duration-550"
                        />
                      )}
                      {pathCompleted && (
                        <path
                          d={pathCompleted}
                          fill="none"
                          stroke="#8b5cf6"
                          strokeWidth="2.5"
                          filter="url(#glow)"
                          className="transition-all duration-550"
                        />
                      )}

                      {/* Coordinates Nodes (Dots) */}
                      {pointsX.map((x, i) => (
                        <g 
                          key={i} 
                          className="group/node cursor-pointer"
                          onMouseEnter={() => setHoveredPoint({
                            x: pointsX[i],
                            y: pointsYCompleted[i],
                            total: chartData.totals[i],
                            completed: chartData.completed[i],
                            day: chartData.days[i]
                          })}
                          onMouseLeave={() => setHoveredPoint(null)}
                        >
                          {/* Total node */}
                          <circle
                            cx={x}
                            cy={pointsYTotal[i]}
                            r="4"
                            className="fill-slate-300 stroke-white hover:r-5.5 transition-all"
                            strokeWidth="1.5"
                          />
                          {/* Completed node */}
                          <circle
                            cx={x}
                            cy={pointsYCompleted[i]}
                            r="4.5"
                            className="fill-indigo-600 stroke-white hover:r-6 hover:fill-violet-650 transition-all shadow-sm"
                            strokeWidth="1.5"
                          />
                        </g>
                      ))}

                      {/* X Axis Labels */}
                      {chartData.days.map((day, i) => (
                        <text
                          key={i}
                          x={pointsX[i]}
                          y={chartHeight - 5}
                          className="fill-slate-400 font-bold text-[9px] text-center"
                          textAnchor="middle"
                        >
                          {day}
                        </text>
                      ))}
                    </svg>

                    {/* Chart Tooltip Overlay */}
                    {hoveredPoint && (
                      <div 
                        className="absolute z-10 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-xl p-3 shadow-xl pointer-events-none text-[10px] space-y-1 animate-scale-in"
                        style={{
                          left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                          top: `${(hoveredPoint.y / chartHeight) * 100 - 32}%`,
                          transform: 'translateX(-50%)'
                        }}
                      >
                        <p className="font-extrabold text-slate-800 leading-none">{hoveredPoint.day}</p>
                        <div className="flex items-center gap-1.5 mt-1 font-bold text-slate-500 leading-none">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-350" />
                          <span>Total: {hoveredPoint.total}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold text-indigo-650 leading-none">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                          <span>Done: {hoveredPoint.completed}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Legend Indicator */}
                  <div className="flex items-center gap-6 text-[10px] text-slate-500 border-t border-slate-100 pt-4 font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-slate-300" />
                      <span>Total Tasks Created</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-indigo-600 shadow-sm" />
                      <span>Completed Tasks</span>
                    </div>
                    {chartData.isPlaceholder && (
                      <span className="text-[9px] text-slate-400 italic ml-auto">
                        *Create tasks to update chart metrics
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Panel: Active EC2 Node Status & System Diagnostics */}
                <div className="lg:col-span-5 space-y-6 animate-scale-in">
                  {/* AWS EC2 Instance Badge */}
                  <InstanceBadge />

                  {/* System Diagnostics Card */}
                  <div className="relative overflow-hidden rounded-2xl border border-slate-205 bg-white p-6 shadow-sm">
                    {/* Background Radial Glow */}
                    <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 leading-none">
                      Cluster Performance
                    </h3>

                    <div className="space-y-4 text-xs font-semibold">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Database Connection</span>
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Operational
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">API Response Latency</span>
                        <span className="text-indigo-650 font-mono font-bold">14 ms</span>
                      </div>

                      {/* Node Utilization Bar */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="flex justify-between text-slate-500 text-[11px]">
                          <span>Virtual CPU Load</span>
                          <span className="font-mono text-indigo-605">8.4%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200/10">
                          <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500" style={{ width: '8.4%' }} />
                        </div>
                      </div>

                      {/* Memory Allocation Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-slate-550 text-[11px]">
                          <span>Memory Allocation</span>
                          <span className="font-mono text-indigo-605">42%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200/10">
                          <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500" style={{ width: '42%' }} />
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-extrabold uppercase tracking-wide leading-none">
                        <span>Cluster Status:</span>
                        <span className="text-indigo-600">Optimized</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'my_tasks' && (
            <div className="relative mx-auto max-w-2xl animate-slide-up-fade">
              {/* Task list centered component */}
              {!fetchError ? (
                <TodoList initialTodos={todos} onMutationSuccess={fetchTodos} />
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-400 text-sm">
                  {fetchError}
                </div>
              )}
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-6 relative w-full animate-slide-up-fade">
              <div>
                <h2 className="text-3xl font-black text-slate-905 tracking-tight">
                  Team <span className="bg-gradient-to-r from-indigo-600 to-violet-550 bg-clip-text text-transparent">Contributors</span>
                </h2>
                <p className="text-sm text-slate-500 mt-1 font-semibold">
                  Project Kelompok 3 - Tugas Besar Cloud Computing
                </p>
              </div>

              {isLoadingMembers ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                  {[1, 2, 3].map((n) => (
                     <div key={n} className="rounded-2xl border border-slate-200 bg-white p-6 h-60 animate-pulse bg-slate-100" />
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
                        className="relative overflow-hidden rounded-2xl border border-slate-205 bg-white p-6 shadow-sm transition-all duration-300 hover:border-indigo-300 hover:shadow-md hover:scale-[1.01] hover:-translate-y-0.5"
                      >
                        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-500/5 blur-2xl pointer-events-none" />

                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-650 to-violet-500 font-bold text-white shadow-sm text-sm">
                            {initials}
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-base font-bold text-slate-800 leading-snug">{member.name}</h4>
                            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-705 border border-indigo-150">
                              {role}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 space-y-3 pt-3 border-t border-slate-100">
                          <div className="flex justify-between items-center text-xs text-slate-500">
                            <span>Class Room</span>
                            <span className="font-semibold text-slate-705">{member.class_room}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-slate-500">
                            <span>NIM / Student ID</span>
                            <span className="font-mono text-slate-500">120223000{member.id}</span>
                          </div>
                          <p className="text-xs text-slate-400 italic mt-2 leading-relaxed font-semibold">
                            &ldquo;{bio}&rdquo;
                          </p>
                        </div>

                        {/* metrics */}
                        <div className="mt-5 space-y-2.5 pt-4 border-t border-slate-100">
                          <div className="flex items-center justify-between text-xs text-slate-505">
                            <span className="font-semibold">Task Completion</span>
                            <span className="font-bold text-indigo-650">{rate}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-550 transition-all duration-500"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-400 pt-1 font-semibold">
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

      {/* Logout/Interaction Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
