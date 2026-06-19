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

type UserActiveTab = 'my_tasks' | 'dashboard' | 'team';

export default function UserDashboard({ sessionUser, initialTodos, fetchError }: UserDashboardProps) {
  const router = useRouter();
  
  // Navigation layout state
  const [activeTab, setActiveTab] = useState<UserActiveTab>('my_tasks');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Profile Modal State
  const [selectedProfile, setSelectedProfile] = useState<Member | null>(null);
  const [isProfileModalClosing, setIsProfileModalClosing] = useState(false);
  const [originPoint, setOriginPoint] = useState({ x: '50%', y: '50%' });
  const [isModalMounted, setIsModalMounted] = useState(false);
  
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

  // Load team members or todos depending on active tab
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
  const radius = 44;
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
      
      const createdUpToDay = todos.filter(t => {
        const tDate = new Date(t.created_at);
        return tDate.toDateString() === dateStr || tDate < d;
      }).length;
      
      const completedUpToDay = todos.filter(t => {
        if (t.status !== 'completed') return false;
        const tDate = new Date(t.updated_at);
        return tDate.toDateString() === dateStr || tDate < d;
      }).length;

      totalCounts.push(createdUpToDay);
      completedCounts.push(completedUpToDay);
    }

    const hasData = totalCounts.some(c => c > 0);
    const chartTotals = hasData ? totalCounts : [1, 2, 2, 3, 3, 5, 8];
    const chartCompleted = hasData ? completedCounts : [0, 1, 1, 2, 2, 4, 6];

    return { days, totals: chartTotals, completed: chartCompleted, isPlaceholder: !hasData };
  };

  const chartData = getChartData();

  // SVG Line Chart coordinates calculation
  const isDemo = chartData.isPlaceholder;
  const scaleMax = isDemo ? 8 : Math.max(...chartData.totals, 2);
  const ticks = [scaleMax, scaleMax * 0.75, scaleMax * 0.5, scaleMax * 0.25, 0].map(v => Number(v.toFixed(1)));

  const chartHeight = 150;
  const chartWidth = 700;
  const paddingX = 35;
  const paddingY = 20;

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

  // Helper to get profile image path
  const getProfileImage = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('farid')) return '/Farid.png';
    if (lower.includes('hafiz')) return '/Hafiz.png';
    if (lower.includes('zaky')) return '/Zaky.png';
    if (lower.includes('haris')) return '/haris.png';
    if (lower.includes('djordhi') || lower.includes('michail')) return '/Kai.png';
    // Fallback if not found
    return null;
  };

  // Profile Modal Handlers
  const openProfile = (member: Member, e: React.MouseEvent) => {
    // Capture click position for dynamic origin animation
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    setOriginPoint({ 
      x: `${(x / window.innerWidth) * 100}%`, 
      y: `${(y / window.innerHeight) * 100}%` 
    });

    setSelectedProfile(member);
    setIsProfileModalClosing(false);
    setIsModalMounted(false);

    // Trigger expansion after initial render
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsModalMounted(true);
      });
    });
  };

  const closeProfile = () => {
    setIsProfileModalClosing(true);
    setIsModalMounted(false);
    setTimeout(() => {
      setSelectedProfile(null);
      setIsProfileModalClosing(false);
    }, 500); // match transition duration
  };

  // Sign out via Auth
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

  // Helper to resolve member role
  const getMemberDetails = (name: string) => {
    let role = 'Software Engineer';
    let bio = 'Responsible for codebase development and state modules.';
    if (name.toLowerCase().includes('zaky')) {
      role = 'Cloud System Architect';
      bio = 'Leads local database design and multi-instance cloud deployments.';
    } else if (name.toLowerCase().includes('hafiz')) {
      role = 'DevOps / CI-CD Specialist';
      bio = 'Handles container configuration and EC2 stateless auto-scaling.';
    } else if (name.toLowerCase().includes('haris')) {
      role = 'Database Engineer';
      bio = 'Designs schema migrations, indexing optimization, and query plans.';
    } else if (name.toLowerCase().includes('djordhi')) {
      role = 'Frontend Developer';
      bio = 'Fosters visual aesthetics, glassmorphism designs, and UI responsiveness.';
    } else if (name.toLowerCase().includes('farid')) {
      role = 'Fullstack Developer';
      bio = 'Responsible for Next.js server actions and state sync.';
    }
    return { role, bio };
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white font-sans select-none antialiased relative overflow-x-hidden">
      
      {/* Dynamic animations style block */}
      <style>{`
        @keyframes floatGiga {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes floatMini {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes floatPeeker {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes appOpen {
          0% { transform: scale(0.85) translateY(20px); opacity: 0; }
          60% { transform: scale(1.02) translateY(-2px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes fadeOpen {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        .animate-float-giga {
          animation: floatGiga 4s ease-in-out infinite;
        }
        .animate-float-mini {
          animation: floatMini 3s ease-in-out infinite;
        }
        .animate-float-peeker {
          animation: floatPeeker 5s ease-in-out infinite;
        }
        .animate-app-open {
          animation: appOpen 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-fade-open {
          animation: fadeOpen 0.4s ease-out forwards;
        }
      `}</style>

      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 1. TOP STICKY HEADER (Mobbin Header Layout) */}
      <header className="h-16 bg-slate-950/40 border-b border-white/10 px-6 md:px-8 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md shadow-2xl">
        
        {/* Brand Brand & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1 rounded hover:bg-white/5 text-slate-300 md:hidden cursor-pointer"
          >
            <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-500/20 select-none shrink-0">
              <svg viewBox="0 0 32 32" className="w-6 h-6">
                {/* Monitor outer */}
                <rect x="5" y="7" width="22" height="18" rx="4" fill="#ffffff" />
                {/* Screen inner */}
                <rect x="8" y="10" width="16" height="12" rx="2" fill="#4f46e5" />
                {/* Tiny eyes */}
                <circle cx="12" cy="15" r="1.2" fill="#22d3ee" />
                <circle cx="20" cy="15" r="1.2" fill="#22d3ee" />
                {/* Tiny stand */}
                <rect x="13" y="25" width="6" height="2" fill="#ffffff" />
              </svg>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xs font-black tracking-wider text-white uppercase leading-none">
                Kelompok 3 Cloud Computing
              </h1>
              <span className="text-[8.5px] text-slate-400 font-extrabold tracking-wider block mt-1 uppercase leading-none">
                Workspace Console
              </span>
            </div>
          </div>
        </div>



        {/* Right: Latency indicator & Profile dropdown */}
        <div className="flex items-center gap-6">
          {/* Latency Telemetry */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1 text-[10px] font-bold text-slate-400 bg-slate-900/40 shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>DB Online</span>
            <span className="mx-1 text-white/10">|</span>
            <span className="font-mono text-slate-350">14ms ping</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-white leading-none">{sessionUser}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">Member</span>
            </div>
            {getProfileImage(sessionUser) ? (
              <img 
                src={getProfileImage(sessionUser)!} 
                alt={sessionUser}
                className="h-8 w-8 rounded-lg object-cover border border-indigo-500/30 shadow-sm bg-slate-800"
                style={{ objectPosition: (sessionUser.toLowerCase().includes('zaky') || sessionUser.toLowerCase().includes('hafiz')) ? '50% 15%' : 'center' }}
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white text-[11px] uppercase shadow-sm border border-indigo-500/20">
                {sessionUser[0]}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE directory structure (Left Navigation Sidebar + Main Board) */}
      <div className="flex-1 flex w-full">
        
        {/* Left Side Directories Sidebar (Desktop) */}
        <aside className="w-60 bg-slate-900/30 border-r border-white/10 backdrop-blur-md shrink-0 hidden md:flex flex-col justify-between sticky top-16 h-[calc(100vh-64px)] p-5 z-20">
          <div className="space-y-6">
            
            {/* Navigation title */}
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Workspace directory
              </span>
            </div>

            {/* Folder Tabs */}
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-3 w-full text-left rounded-lg px-3.5 py-2.5 text-xs font-bold transition-all border ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-600 text-white border-indigo-500/30 shadow-md shadow-indigo-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                }`}
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" />
                </svg>
                Workspace Stats
              </button>

              <button
                onClick={() => setActiveTab('my_tasks')}
                className={`flex items-center gap-3 w-full text-left rounded-lg px-3.5 py-2.5 text-xs font-bold transition-all border ${
                  activeTab === 'my_tasks'
                    ? 'bg-indigo-600 text-white border-indigo-500/30 shadow-md shadow-indigo-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                }`}
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Tasks Directory
              </button>

              <button
                onClick={() => setActiveTab('team')}
                className={`flex items-center gap-3 w-full text-left rounded-lg px-3.5 py-2.5 text-xs font-bold transition-all border ${
                  activeTab === 'team'
                    ? 'bg-indigo-600 text-white border-indigo-500/30 shadow-md shadow-indigo-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                }`}
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Contributor Profiles
              </button>
            </nav>

            {/* Micro AWS ec2 quick display info in sidebar */}
            <div className="pt-4 border-t border-white/5 space-y-2.5">
              <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">EC2 Infrastructure</span>
              <div className="p-3 bg-slate-950/60 border border-white/10 rounded-lg text-[10px] space-y-1.5">
                <div className="flex justify-between font-bold text-slate-400">
                  <span>Instance ID:</span>
                  <span className="font-mono text-white">t2.micro</span>
                </div>
                <div className="flex justify-between font-bold text-slate-400">
                  <span>Provider:</span>
                  <span className="text-white">AWS APAC</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom logout block */}
          <div className="pt-4 border-t border-white/5">
            <button
              onClick={() => handleSignOut()}
              className="flex items-center gap-3 w-full text-left rounded-lg px-3.5 py-2.5 text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-transparent cursor-pointer"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </aside>

        {/* Scrollable Main Area Panel */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 min-w-0 bg-transparent">
          
          {/* TAB: TASKS DIRECTORY CATALOG (TodoList embedded) */}
          {activeTab === 'my_tasks' && (
            <div className="w-full animate-slide-up-fade">
              {!fetchError ? (
                <TodoList initialTodos={todos} onMutationSuccess={fetchTodos} ownerName={sessionUser} />
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-400 text-xs font-bold uppercase tracking-wider shadow-xs">
                  {fetchError}
                </div>
              )}
            </div>
          )}          {/* TAB: WORKSPACE STATS BENTO PANEL */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-slide-up-fade w-full">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight leading-none uppercase flex items-center gap-2.5">
                    Team Telemetry & Productivity
                  </h2>
                  <p className="text-xs text-slate-400 mt-2 font-medium">
                    Review team deliverables and task velocity metric logs.
                  </p>
                </div>
                {/* Nyempill: tiny cloud bot peeking next to header */}
                <div className="relative select-none hidden sm:block">
                  <svg viewBox="0 0 100 60" className="w-10 h-7 opacity-50 hover:opacity-90 transition-opacity animate-float-peeker">
                    <path d="M 20 40 C 15 40, 10 35, 15 28 C 15 15, 35 10, 48 20 C 58 10, 72 15, 70 28 C 78 28, 80 35, 72 40 C 65 40, 25 40, 20 40 Z" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
                    <circle cx="38" cy="27" r="1.5" fill="#475569" />
                    <circle cx="48" cy="27" r="1.5" fill="#475569" />
                    <path d="M 41 31 Q 43 33 45 31" fill="none" stroke="#475569" strokeWidth="1" />
                  </svg>
                </div>
              </div>

              {/* Bento Row 1: Metrics stats + Circular gauge */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                
                {/* 1. Progress Gauge box */}
                <div className="md:col-span-3 bg-slate-900/40 border border-white/10 backdrop-blur-md rounded-xl p-6 shadow-2xl flex flex-col justify-center items-center text-center relative overflow-hidden">
                  {/* Subtle radial glow behind gauge */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-40 h-40 bg-indigo-500/8 rounded-full blur-2xl" />
                  </div>

                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-5 relative z-10">Team Completion Rate</span>

                  <div className="relative flex items-center justify-center z-10">
                    <svg className="h-32 w-32 transform -rotate-90" viewBox="0 0 100 100">
                      {/* SVG gradient definition */}
                      <defs>
                        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#818cf8" />
                          <stop offset="50%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#22d3ee" />
                        </linearGradient>
                        <filter id="gaugeGlow">
                          <feGaussianBlur stdDeviation="2" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      {/* Decorative tick marks */}
                      {Array.from({ length: 40 }).map((_, i) => {
                        const angle = (i / 40) * 360;
                        const rad = (angle * Math.PI) / 180;
                        const innerR = 48;
                        const outerR = 50;
                        const x1 = 50 + innerR * Math.cos(rad);
                        const y1 = 50 + innerR * Math.sin(rad);
                        const x2 = 50 + outerR * Math.cos(rad);
                        const y2 = 50 + outerR * Math.sin(rad);
                        return (
                          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeOpacity={i % 10 === 0 ? 0.15 : 0.05} strokeWidth="0.5" />
                        );
                      })}

                      {/* Background track */}
                      <circle cx="50" cy="50" r={radius} className="fill-none" stroke="white" strokeOpacity="0.06" strokeWidth={strokeWidth + 2} />

                      {/* Progress arc with gradient + glow */}
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        className="fill-none transition-all duration-1000 ease-out"
                        stroke="url(#gaugeGradient)"
                        strokeWidth={strokeWidth + 1}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        filter="url(#gaugeGlow)"
                      />
                    </svg>

                    {/* Center text */}
                    <div className="absolute flex flex-col items-center">
                      <span className="font-mono text-2xl font-extrabold text-white leading-none" style={{ textShadow: '0 0 20px rgba(99,102,241,0.3)' }}>
                        {completionPercentage}%
                      </span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-2">Completed</span>
                    </div>
                  </div>

                  {/* Bottom stats row */}
                  <div className="mt-5 w-full relative z-10 space-y-2">
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Done</span>
                      <span className="text-white font-mono">{completedTasks} / {totalTasks}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${completionPercentage}%`,
                          background: 'linear-gradient(90deg, #818cf8, #6366f1, #22d3ee)',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Micro statistics panels */}
                <div className="md:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Completed */}
                  <div className="bg-slate-900/40 border border-white/10 backdrop-blur-md rounded-xl p-5 flex flex-col justify-between shadow-2xl">
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Completed</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <div className="my-2.5">
                      <span className="text-3xl font-extrabold text-white font-mono leading-none">{completedTasks}</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mt-1">Ready screens</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Deliverables verified online.</p>
                  </div>

                  {/* In Progress */}
                  <div className="bg-slate-900/40 border border-white/10 backdrop-blur-md rounded-xl p-5 flex flex-col justify-between shadow-2xl">
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>In Development</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                    </div>
                    <div className="my-2.5">
                      <span className="text-3xl font-extrabold text-white font-mono leading-none">{inProgressTasks}</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mt-1">Running tasks</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">In active code modifications.</p>
                  </div>

                  {/* Not Started */}
                  <div className="bg-slate-900/40 border border-white/10 backdrop-blur-md rounded-xl p-5 flex flex-col justify-between shadow-2xl">
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Queued</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-550" />
                    </div>
                    <div className="my-2.5">
                      <span className="text-3xl font-extrabold text-white font-mono leading-none">{notStartedTasks}</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mt-1">Pending items</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Awaiting developer assignment.</p>
                  </div>
                </div>

                {/* 3. Team Members Quick View */}
                <div className="md:col-span-3 bg-slate-900/40 border border-white/10 backdrop-blur-md rounded-xl p-5 shadow-2xl flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Team Members</span>
                  <div className="space-y-2.5 flex-1">
                    {([{id: 2, name: 'Zaky', color: 'bg-indigo-600'}, {id: 3, name: 'Hafiz', color: 'bg-emerald-600'}, {id: 4, name: 'Haris', color: 'bg-amber-600'}, {id: 5, name: 'Djordhi', color: 'bg-sky-600'}, {id: 6, name: 'Farid', color: 'bg-rose-600'}]).map((m) => {
                      const memberTasks = todos.filter(t => t.user_id === m.id).length;
                      const memberDone = todos.filter(t => t.user_id === m.id && t.status === 'completed').length;
                      const imgSrc = getProfileImage(m.name);
                      return (
                        <div key={m.id} className="flex items-center gap-2.5">
                          {imgSrc ? (
                            <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-white/10 shadow-sm">
                              <img
                                src={imgSrc}
                                alt={m.name}
                                className="w-full h-full object-cover"
                                style={{
                                  objectPosition: (m.name.toLowerCase().includes('zaky') || m.name.toLowerCase().includes('hafiz')) ? '50% 15%' : 'center'
                                }}
                              />
                            </div>
                          ) : (
                            <div className={`w-6 h-6 rounded-full ${m.color} flex items-center justify-center text-[8px] font-bold text-white shrink-0`}>
                              {m.name[0]}
                            </div>
                          )}
                          <span className="text-[10px] font-bold text-slate-300 flex-1 truncate">{m.name}</span>
                          <span className="text-[9px] font-mono font-bold text-slate-400">{memberDone}/{memberTasks}</span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Nyempill: tiny monitor bot peeking from bottom */}
                  <div className="flex justify-center pt-2 select-none">
                    <svg viewBox="0 0 60 40" className="w-8 h-5 opacity-30 hover:opacity-70 transition-opacity animate-float-peeker">
                      <rect x="15" y="8" width="30" height="22" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                      <rect x="18" y="11" width="24" height="16" rx="2" fill="#020617" />
                      <circle cx="26" cy="18" r="1" fill="#22d3ee" />
                      <circle cx="34" cy="18" r="1" fill="#22d3ee" />
                      <path d="M 28 22 Q 30 24 32 22" fill="none" stroke="#22d3ee" strokeWidth="0.8" />
                    </svg>
                  </div>
                </div>

              </div>

              {/* Bento Row 2: Chart + Diagnostics */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 1. SVG Productivity velocity line chart */}
                <div className="lg:col-span-8 bg-slate-900/40 border border-white/10 backdrop-blur-md rounded-xl p-6 shadow-2xl flex flex-col justify-between relative min-h-[300px]">
                  <div>
                    <div className="flex justify-between items-center">
                      <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Task Velocity over last 7 days
                      </h3>
                      {chartData.isPlaceholder && (
                        <span className="text-[7.5px] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 uppercase tracking-wider">
                          Demo Log State
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-355 mt-1.5 leading-relaxed">
                      Cumulative volume chart indicating deliverables completed relative to total task allocations.
                    </p>
                  </div>

                  {/* SVG Container */}
                  <div className="my-5 relative w-full h-[180px]">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
                      <defs>
                        <linearGradient id="totalAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#475569" stopOpacity="0.08" />
                          <stop offset="100%" stopColor="#475569" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="completedAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.12" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Ticks horizontal grid lines */}
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
                              x={paddingX - 8}
                              y={y + 3}
                              className="fill-slate-400 font-mono text-[8.5px] text-right font-semibold"
                              textAnchor="end"
                            >
                              {tickVal}
                            </text>
                          </g>
                        );
                      })}

                      {/* Guide line on hover */}
                      {hoveredPoint && (
                        <line
                          x1={hoveredPoint.x}
                          y1={paddingY}
                          x2={hoveredPoint.x}
                          y2={chartHeight - paddingY}
                          className="stroke-white/20"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                      )}

                      {/* Areas */}
                      {areaTotal && (
                        <path d={areaTotal} fill="url(#totalAreaGrad)" className="transition-all" />
                      )}
                      {areaCompleted && (
                        <path d={areaCompleted} fill="url(#completedAreaGrad)" className="transition-all" />
                      )}

                      {/* Curves lines */}
                      {pathTotal && (
                        <path d={pathTotal} fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="3 3" />
                      )}
                      {pathCompleted && (
                        <path d={pathCompleted} fill="none" stroke="#6366f1" strokeWidth="2.5" />
                      )}

                      {/* Interactive nodes dots */}
                      {pointsX.map((x, i) => (
                        <g
                          key={i}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredPoint({
                            x: pointsX[i],
                            y: pointsYCompleted[i],
                            total: chartData.totals[i],
                            completed: chartData.completed[i],
                            day: chartData.days[i]
                          })}
                          onMouseLeave={() => setHoveredPoint(null)}
                        >
                          <circle cx={x} cy={pointsYTotal[i]} r="3" className="fill-slate-500 stroke-slate-950" strokeWidth="1.5" />
                          <circle cx={x} cy={pointsYCompleted[i]} r="4" className="fill-indigo-500 stroke-slate-950" strokeWidth="1.5" />
                        </g>
                      ))}

                      {/* X labels */}
                      {chartData.days.map((day, i) => (
                        <text
                          key={i}
                          x={pointsX[i]}
                          y={chartHeight - 4}
                          className="fill-slate-400 font-extrabold text-[8.5px] text-center"
                          textAnchor="middle"
                        >
                          {day}
                        </text>
                      ))}
                    </svg>

                    {/* Chart Tooltip popover */}
                    {hoveredPoint && (
                      <div
                        className="absolute z-10 bg-slate-950/95 border border-white/10 rounded-lg p-2.5 shadow-2xl backdrop-blur-md pointer-events-none text-[9px] space-y-1.5 animate-scale-in text-white"
                        style={{
                          left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                          top: `${(hoveredPoint.y / chartHeight) * 100 - 32}%`,
                          transform: 'translateX(-50%)'
                        }}
                      >
                        <p className="font-extrabold text-white leading-none">{hoveredPoint.day}</p>
                        <div className="flex items-center gap-1 mt-0.5 text-slate-400 font-bold leading-none">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                          <span>Total Alloc: {hoveredPoint.total}</span>
                        </div>
                        <div className="flex items-center gap-1 text-indigo-400 font-bold leading-none">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                          <span>Finished: {hoveredPoint.completed}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Legend tags */}
                  <div className="flex gap-5 text-[9px] text-slate-400 font-bold uppercase tracking-wider border-t border-white/5 pt-3">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                      <span>Total deliverable logs</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      <span>Completed / Deployed</span>
                    </div>
                  </div>
                </div>

                {/* 2. AWS Node badge + Telemetry cluster panel */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* EC2 Info Badge */}
                  <InstanceBadge />

                  {/* Telemetry diagnostics stats */}
                  <div className="bg-slate-900/40 border border-white/10 backdrop-blur-md rounded-xl p-5 shadow-2xl space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Host Node Telemetry
                    </h3>

                    <div className="space-y-3.5 text-xs font-bold text-slate-300">
                      <div className="flex justify-between items-center">
                        <span>Database Server</span>
                        <span className="text-emerald-400 font-extrabold flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          ONLINE
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span>ALB Load Balancer</span>
                        <span className="text-white font-mono">OK</span>
                      </div>

                      {/* Memory load */}
                      <div className="space-y-1.5 border-t border-white/5 pt-2.5">
                        <div className="flex justify-between text-[9px] text-slate-400 uppercase">
                          <span>RAM Allocation</span>
                          <span className="font-mono text-white">42%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                          <div className="h-full bg-indigo-500" style={{ width: '42%' }} />
                        </div>
                      </div>

                      {/* CPU load */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[9px] text-slate-400 uppercase">
                          <span>CPU Load</span>
                          <span className="font-mono text-white">8.4%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                          <div className="h-full bg-indigo-500" style={{ width: '8.4%' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* TAB: CONTRIBUTOR PROFILES GRID */}
          {activeTab === 'team' && (
            <div className="space-y-8 animate-slide-up-fade">
              <div>
                <h2 className="text-xl font-extrabold text-slate-905 tracking-tight leading-none uppercase">
                  Contributor Profiles
                </h2>
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  Cloud computing project team contributions and active assignments.
                </p>
              </div>              {isLoadingMembers ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="rounded-xl border border-white/10 bg-slate-900/40 h-64" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {members.map((member) => {
                    const initials = getInitials(member.name);
                    const completionRate = member.total_tasks > 0 ? Math.round((member.completed_tasks / member.total_tasks) * 100) : 0;
                    const { role, bio } = getMemberDetails(member.name);

                    return (
                      <div
                        key={member.id}
                        onClick={(e) => openProfile(member, e)}
                        className="group relative bg-slate-900/40 border border-white/10 backdrop-blur-md rounded-xl p-6 shadow-2xl hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)] hover:-translate-y-2 hover:border-indigo-500/50 transition-all duration-500 ease-out flex flex-col justify-between min-h-[280px] cursor-pointer overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        
                        <div className="space-y-4 relative z-10">
                          <div className="flex items-start gap-4">
                            {getProfileImage(member.name) ? (
                              <div className="h-14 w-14 rounded-xl overflow-hidden bg-gradient-to-b from-slate-800 to-slate-950 border border-white/10 shadow-inner shrink-0 group-hover:border-indigo-500/50 transition-colors duration-500 flex items-center justify-center">
                                <img 
                                  src={getProfileImage(member.name)!} 
                                  alt={member.name} 
                                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-transform duration-500" 
                                  style={{
                                    objectPosition: (member.name.toLowerCase().includes('zaky') || member.name.toLowerCase().includes('hafiz')) ? '50% 15%' : 'center'
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 font-mono font-bold text-white text-sm shadow-sm group-hover:shadow-indigo-500/30 transition-all">
                                {initials}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-white truncate leading-snug group-hover:text-indigo-300 transition-colors">{member.name}</h4>
                              <span className="inline-block mt-1.5 rounded bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[8.5px] font-bold text-indigo-300 uppercase tracking-wider group-hover:bg-indigo-500/20 transition-colors">
                                {role}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2 pt-3 border-t border-white/5 text-[10.5px] font-bold text-slate-400">
                            <div className="flex justify-between items-center">
                              <span>Class Room</span>
                              <span className="text-white">{member.class_room}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Student NIM</span>
                              <span className="text-white font-mono">{member.nim ?? '—'}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium italic mt-2.5 leading-relaxed font-semibold">
                              &ldquo;{bio}&rdquo;
                            </p>
                          </div>
                        </div>

                        {/* stats */}
                        <div className="mt-5 space-y-2 pt-3 border-t border-white/5">
                          <div className="flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <span>Deliverable Coverage</span>
                            <span className="text-white font-mono font-bold">{completionRate}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                            <div
                              className="h-full bg-indigo-500 transition-all duration-500"
                              style={{ width: `${completionRate}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                            <span>{member.completed_tasks} completed</span>
                            <span>{member.total_tasks} total</span>
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

      {/* 3. MOBILE MENU SLIDE-OUT MENU PANEL */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm animate-fade-in-backdrop"
          />

          {/* Drawer content */}
          <div className="relative w-64 bg-slate-900 border-l border-white/10 h-full flex flex-col justify-between p-6 shadow-2xl z-10 animate-slide-in-right text-white">
            <div className="space-y-8">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-500/20 select-none shrink-0">
                    <svg viewBox="0 0 32 32" className="w-5 h-5">
                      <rect x="5" y="7" width="22" height="18" rx="4" fill="#ffffff" />
                      <rect x="8" y="10" width="16" height="12" rx="2" fill="#4f46e5" />
                      <circle cx="12" cy="15" r="1.2" fill="#22d3ee" />
                      <circle cx="20" cy="15" r="1.2" fill="#22d3ee" />
                      <rect x="13" y="25" width="6" height="2" fill="#ffffff" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Cloud Console</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 text-slate-400 hover:text-white text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Navigation links */}
              <nav className="space-y-1.5">
                <button
                  onClick={() => {
                    setActiveTab('dashboard');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full text-left rounded-lg px-3.5 py-2.5 text-xs font-bold transition-all border ${
                    activeTab === 'dashboard'
                      ? 'bg-indigo-600 text-white border-indigo-500/30 shadow-md shadow-indigo-500/10'
                      : 'text-slate-400 hover:text-white border-transparent hover:bg-white/5'
                  }`}
                >
                  Workspace Stats
                </button>
                <button
                  onClick={() => {
                    setActiveTab('my_tasks');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full text-left rounded-lg px-3.5 py-2.5 text-xs font-bold transition-all border ${
                    activeTab === 'my_tasks'
                      ? 'bg-indigo-600 text-white border-indigo-500/30 shadow-md shadow-indigo-500/10'
                      : 'text-slate-400 hover:text-white border-transparent hover:bg-white/5'
                  }`}
                >
                  Tasks Directory
                </button>
                <button
                  onClick={() => {
                    setActiveTab('team');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full text-left rounded-lg px-3.5 py-2.5 text-xs font-bold transition-all border ${
                    activeTab === 'team'
                      ? 'bg-indigo-600 text-white border-indigo-500/30 shadow-md shadow-indigo-500/10'
                      : 'text-slate-400 hover:text-white border-transparent hover:bg-white/5'
                  }`}
                >
                  Contributor Profiles
                </button>
              </nav>
            </div>

            {/* Logout bottom */}
            <div className="border-t border-white/5 pt-6">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="flex items-center gap-3 w-full text-left rounded-lg px-3.5 py-2.5 text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-transparent cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. FULL PROFILE MODAL (Dynamic FLIP / Card Origin Expansion) */}
      {selectedProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden pointer-events-none">
          {/* Backdrop */}
          <div 
            className={`absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-500 ease-out pointer-events-auto ${(!isModalMounted || isProfileModalClosing) ? 'opacity-0' : 'opacity-100'}`}
            onClick={closeProfile}
          />
          
          {/* Modal Content */}
          <div 
            className={`relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-white/10 rounded-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] flex flex-col md:flex-row transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-auto ${(!isModalMounted || isProfileModalClosing) ? 'scale-[0.05] opacity-0' : 'scale-100 opacity-100'}`}
            style={{ transformOrigin: `${originPoint.x} ${originPoint.y}` }}
          >
            
            {/* Left Side: Photo with animated BG */}
            <div className="w-full md:w-2/5 relative bg-slate-950 flex flex-col items-center justify-center overflow-hidden min-h-[250px] md:min-h-[500px] border-b md:border-b-0 md:border-r border-white/10 p-8 rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none">
              {/* Animated Background */}
              <div className="absolute inset-0 opacity-40">
                <div className="absolute top-0 left-0 w-[150%] h-[150%] bg-[radial-gradient(circle_at_50%_50%,_#4f46e5_0%,_transparent_50%)] animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute bottom-0 right-0 w-[150%] h-[150%] bg-[radial-gradient(circle_at_100%_100%,_#06b6d4_0%,_transparent_50%)] animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250px_250px] animate-[slide_3s_linear_infinite]" />
              
              {/* Profile Image / Fallback */}
              <div className="relative z-10 w-40 h-40 sm:w-56 sm:h-56 rounded-full border-[6px] border-slate-900 shadow-[0_0_40px_rgba(79,70,229,0.5)] overflow-hidden bg-gradient-to-b from-slate-800 to-slate-950 flex items-center justify-center transform hover:scale-105 transition-transform duration-500">
                {getProfileImage(selectedProfile.name) ? (
                  <img 
                    src={getProfileImage(selectedProfile.name)!} 
                    alt={selectedProfile.name} 
                    className="w-full h-full object-cover"
                    style={{
                      objectPosition: (selectedProfile.name.toLowerCase().includes('zaky') || selectedProfile.name.toLowerCase().includes('hafiz')) ? '50% 15%' : 'center'
                    }}
                  />
                ) : (
                  <span className="text-5xl font-mono font-bold text-white">{getInitials(selectedProfile.name)}</span>
                )}
              </div>
            </div>

            {/* Right Side: Details */}
            <div className="w-full md:w-3/5 p-6 sm:p-10 flex flex-col overflow-y-auto">
              {/* Close button */}
              <button 
                onClick={closeProfile}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800/50 border border-white/5 text-slate-400 hover:text-white hover:bg-slate-700 hover:border-white/20 transition-all z-10"
              >
                ✕
              </button>
              
              {/* Info */}
              <div className="space-y-8 pb-4">
                <div>
                  <h2 className="text-3xl font-extrabold text-white tracking-tight leading-none uppercase drop-shadow-md">{selectedProfile.name}</h2>
                  <div className="mt-3 inline-block rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 text-xs font-bold text-indigo-300 uppercase tracking-wider shadow-inner">
                    {getMemberDetails(selectedProfile.name).role}
                  </div>
                </div>

                {/* Card-identical info block */}
                <div className="space-y-2 pt-5 border-t border-white/5 text-[10.5px] font-bold text-slate-400">
                  <div className="flex justify-between items-center">
                    <span>Class Room</span>
                    <span className="text-white">{selectedProfile.class_room}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Student NIM</span>
                    <span className="text-white font-mono">{selectedProfile.nim ?? '—'}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium italic mt-2.5 leading-relaxed font-semibold pt-1">
                    &ldquo;{getMemberDetails(selectedProfile.name).bio}&rdquo;
                  </p>
                </div>

                {/* Deliverable Coverage bar — mirrors card bottom stats */}
                {(() => {
                  const memberTasks = todos.filter(t => selectedProfile.user_id !== null && t.user_id === selectedProfile.user_id);
                  const completedCount = memberTasks.filter(t => t.status === 'completed').length;
                  const totalCount = memberTasks.length;
                  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                  return (
                    <div className="mt-2 space-y-2 pt-3 border-t border-white/5">
                      <div className="flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <span>Deliverable Coverage</span>
                        <span className="text-white font-mono font-bold">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background: pct === 100 ? '#22c55e' : pct >= 50 ? '#06b6d4' : '#6366f1'
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                        <span>{completedCount} completed</span>
                        <span>{totalCount} total</span>
                      </div>
                    </div>
                  );
                })()}


                <div className="pt-5 border-t border-white/5">
                   <div className="flex items-center justify-between mb-4">
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Assigned Tasks</span>
                     <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                       {todos.filter(t => t.user_id === selectedProfile.user_id).length} Total
                     </span>
                   </div>

                   {/* Status Summary Cards */}
                   {(() => {
                     const memberTasks = todos.filter(t => selectedProfile.user_id !== null && t.user_id === selectedProfile.user_id);
                     const pendingTasks = memberTasks.filter(t => t.status === 'pending');
                     const inProgressTasks = memberTasks.filter(t => t.status === 'in_progress');
                     const completedTasks = memberTasks.filter(t => t.status === 'completed');
                     const total = memberTasks.length;
                     const completionPct = total > 0 ? Math.round((completedTasks.length / total) * 100) : 0;

                     return memberTasks.length === 0 ? (
                       <div className="text-xs text-slate-500 italic p-4 bg-slate-900/30 border border-white/5 rounded-xl text-center">No active tasks assigned to this member.</div>
                     ) : (
                       <div className="space-y-4">

                         {/* Summary stat row */}
                         <div className="grid grid-cols-3 gap-2">
                           {/* Pending */}
                           <div className="bg-slate-900/60 border border-slate-600/20 rounded-xl p-3 flex flex-col gap-1 shadow-inner">
                             <div className="flex items-center gap-1.5">
                               <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Pending</span>
                             </div>
                             <span className="text-xl font-extrabold font-mono text-slate-200 leading-none">{pendingTasks.length}</span>
                             <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                               <div className="h-full bg-slate-500 rounded-full transition-all duration-500" style={{ width: `${total > 0 ? (pendingTasks.length / total) * 100 : 0}%` }} />
                             </div>
                           </div>

                           {/* In Progress */}
                           <div className="bg-sky-950/30 border border-sky-500/15 rounded-xl p-3 flex flex-col gap-1 shadow-inner">
                             <div className="flex items-center gap-1.5">
                               <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse shrink-0" />
                               <span className="text-[9px] font-bold text-sky-400 uppercase tracking-widest">Running</span>
                             </div>
                             <span className="text-xl font-extrabold font-mono text-sky-200 leading-none">{inProgressTasks.length}</span>
                             <div className="h-1 rounded-full bg-sky-950/60 overflow-hidden">
                               <div className="h-full bg-sky-500 rounded-full transition-all duration-500" style={{ width: `${total > 0 ? (inProgressTasks.length / total) * 100 : 0}%` }} />
                             </div>
                           </div>

                           {/* Completed */}
                           <div className="bg-emerald-950/30 border border-emerald-500/15 rounded-xl p-3 flex flex-col gap-1 shadow-inner">
                             <div className="flex items-center gap-1.5">
                               <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                               <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Done</span>
                             </div>
                             <span className="text-xl font-extrabold font-mono text-emerald-200 leading-none">{completedTasks.length}</span>
                             <div className="h-1 rounded-full bg-emerald-950/60 overflow-hidden">
                               <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${completionPct}%` }} />
                             </div>
                           </div>
                         </div>

                         {/* Overall completion progress bar */}
                         <div className="space-y-1.5">
                           <div className="flex justify-between items-center">
                             <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Overall Completion</span>
                             <span className="text-[9px] font-mono font-bold text-indigo-300">{completionPct}%</span>
                           </div>
                           <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                             <div
                               className="h-full rounded-full transition-all duration-700 ease-out"
                               style={{
                                 width: `${completionPct}%`,
                                 background: completionPct === 100
                                   ? 'linear-gradient(90deg, #10b981, #34d399)'
                                   : completionPct > 50
                                   ? 'linear-gradient(90deg, #6366f1, #38bdf8)'
                                   : 'linear-gradient(90deg, #6366f1, #818cf8)'
                               }}
                             />
                           </div>
                         </div>

                         {/* Task list grouped by status */}
                         {[
                           { label: 'In Progress', tasks: inProgressTasks, dotClass: 'bg-sky-400', badgeBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20', rowBorder: 'border-sky-500/10' },
                           { label: 'Pending', tasks: pendingTasks, dotClass: 'bg-slate-400', badgeBg: 'bg-slate-500/10 text-slate-400 border-slate-500/20', rowBorder: 'border-white/5' },
                           { label: 'Completed', tasks: completedTasks, dotClass: 'bg-emerald-400', badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', rowBorder: 'border-emerald-500/10' },
                         ].map(group => group.tasks.length > 0 && (
                           <div key={group.label} className="space-y-1.5">
                             <div className="flex items-center gap-2">
                               <span className={`w-1.5 h-1.5 rounded-full ${group.dotClass} shrink-0`} />
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{group.label}</span>
                               <span className="ml-auto text-[9px] font-mono text-slate-500">{group.tasks.length}</span>
                             </div>
                             {group.tasks.map(task => (
                               <div key={task.id} className={`bg-slate-800/40 border ${group.rowBorder} hover:border-white/10 transition-colors rounded-xl p-3 flex justify-between items-start gap-3 shadow-sm`}>
                                 <div className="min-w-0 flex-1">
                                   <h4 className="text-[11px] font-bold text-white truncate leading-snug">{task.title}</h4>
                                   {task.description && (
                                     <p className="text-[9px] text-slate-500 truncate mt-0.5">{task.description}</p>
                                   )}
                                 </div>
                                 <span className={`shrink-0 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${group.badgeBg}`}>
                                   {task.status === 'in_progress' ? 'Running' : task.status === 'completed' ? 'Done' : 'Pending'}
                                 </span>
                               </div>
                             ))}
                           </div>
                         ))}

                       </div>
                     );
                   })()}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 4. Interaction Toast */}
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
