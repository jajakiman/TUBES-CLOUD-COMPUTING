'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Member } from '@/app/actions/members';
import { Todo } from '@/app/actions/todos';
import TodoList from './TodoList';
import TeamVisualizer from './TeamVisualizer';
import InstanceBadge from './InstanceBadge';
import Toast from './Toast';

interface AdminDashboardProps {
  sessionUser: string;
  initialMembers: Member[];
}

type AdminActiveTab = 'dashboard' | 'contributors';

export default function AdminDashboard({
  sessionUser,
  initialMembers,
}: AdminDashboardProps) {
  const router = useRouter();
  
  // Layout views state
  const [activeTab, setActiveTab] = useState<AdminActiveTab>('dashboard');
  const [activeFilter, setActiveFilter] = useState<'all' | 'no_todo' | 'in_progress' | 'completed'>('all');
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Auditing drawer state
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [selectedMemberName, setSelectedMemberName] = useState<string | null>(null);
  const [auditedTodos, setAuditedTodos] = useState<Todo[]>([]);
  const [isLoadingAudited, setIsLoadingAudited] = useState(false);

  // Fetch contributors to get latest status
  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/members');
      const data = await res.json();
      if (data.success) {
        setMembers(data.members);
      }
    } catch (err) {
      console.error('Failed to load contributors:', err);
    }
  };

  // Poll contributors stats
  useEffect(() => {
    fetchMembers();
  }, [selectedMemberId]);

  // Fetch audited member todos when selected
  useEffect(() => {
    if (selectedMemberId === null) {
      setAuditedTodos([]);
      return;
    }

    const memberId = selectedMemberId;

    async function loadAuditedTodos() {
      setIsLoadingAudited(true);
      try {
        const res = await fetch(`/api/admin/todos?memberId=${memberId}`);
        const data = await res.json();
        if (data.success) {
          setAuditedTodos(data.todos);
        }
      } catch (err) {
        console.error('Failed to load audited todos:', err);
      } finally {
        setIsLoadingAudited(false);
      }
    }

    loadAuditedTodos();
  }, [selectedMemberId]);

  // Helper to get initials
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Filter members based on selection
  const filteredMembers = members.filter((member) => {
    if (activeFilter === 'all') return true;
    return member.status === activeFilter;
  });

  // Handle contributor card clicks
  const handleMemberClick = (member: Member) => {
    setSelectedMemberId(member.id);
    setSelectedMemberName(member.name);
    setToast({ message: `Initiating audit for ${member.name}`, type: 'info' });
  };

  // Sign out via Auth
  const handleSignOut = async (e: React.FormEvent) => {
    e.preventDefault();
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

  // Helper to resolve roles and bios
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

        .animate-float-giga {
          animation: floatGiga 4s ease-in-out infinite;
        }
        .animate-float-mini {
          animation: floatMini 3s ease-in-out infinite;
        }
        .animate-float-peeker {
          animation: floatPeeker 3.5s ease-in-out infinite;
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
                Kelompok 3 Cloud Portal
              </h1>
              <span className="text-[8.5px] text-slate-400 font-extrabold tracking-wider block mt-1 uppercase leading-none">
                Admin Console
              </span>
            </div>
          </div>
        </div>



        {/* Right: Telemetry status & User Profile */}
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
              <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest mt-1 block">Administrator</span>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-950 font-bold text-white text-[11px] uppercase shadow-sm border border-rose-900/40">
              {sessionUser[0]}
            </div>
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
                Admin Console
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
                Overview Console
              </button>

              <button
                onClick={() => setActiveTab('contributors')}
                className={`flex items-center gap-3 w-full text-left rounded-lg px-3.5 py-2.5 text-xs font-bold transition-all border ${
                  activeTab === 'contributors'
                    ? 'bg-indigo-600 text-white border-indigo-500/30 shadow-md shadow-indigo-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                }`}
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Contributor Audits
              </button>
            </nav>

            {/* Micro AWS info in sidebar */}
            <div className="pt-4 border-t border-white/5 space-y-2.5">
              <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">ALB Telemetry</span>
              <div className="p-3 bg-slate-950/60 border border-white/10 rounded-lg text-[10px] space-y-1.5 font-bold">
                <div className="flex justify-between text-slate-400">
                  <span>Routing:</span>
                  <span className="text-white">Stateless</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Active Nodes:</span>
                  <span className="text-white">5 EC2 Nodes</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom logout block */}
          <div className="pt-4 border-t border-white/5">
            <form onSubmit={handleSignOut}>
              <button
                type="submit"
                className="flex items-center gap-3 w-full text-left rounded-lg px-3.5 py-2.5 text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-transparent cursor-pointer"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </form>
          </div>
        </aside>        {/* Scrollable Main Area Panel */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 min-w-0 bg-transparent">
          
          {/* TAB: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-slide-up-fade max-w-5xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight leading-none uppercase flex items-center gap-2.5">
                    Overview Console
                  </h2>
                  <p className="text-xs text-slate-400 mt-2 font-medium">
                    Review project deliverables, perform team audits, and monitor virtual server metrics.
                  </p>
                </div>
                {/* Floating cloud monster mascot */}
                <div className="relative group select-none hidden sm:block">
                  <svg viewBox="0 0 100 60" className="w-16 h-12 animate-float-mini">
                    <path d="M 20 40 C 15 40, 10 35, 15 28 C 15 15, 35 10, 48 20 C 58 10, 72 15, 70 28 C 78 28, 80 35, 72 40 C 65 40, 25 40, 20 40 Z" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
                    <circle cx="38" cy="27" r="2" fill="#22d3ee" className="animate-pulse" />
                    <circle cx="48" cy="27" r="2" fill="#22d3ee" className="animate-pulse" />
                    <path d="M 41 31 Q 43 33 45 31" fill="none" stroke="#475569" strokeWidth="1" />
                  </svg>
                  <div className="absolute -top-6 -right-2 bg-indigo-600/90 text-white text-[7.5px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-indigo-500/30">
                    Cloud Node Active
                  </div>
                </div>
              </div>

              {/* Team Progress Ring panel */}
              <TeamVisualizer
                members={members}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
              />

              {/* Cluster diagnostics and diagnostics widgets */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* ALB active info */}
                <div className="md:col-span-4">
                  <InstanceBadge />
                </div>

                {/* Performance stats bento */}
                <div className="md:col-span-5 bg-slate-900/40 border border-white/10 backdrop-blur-md rounded-xl p-5 shadow-2xl space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    System Telemetry Status
                  </h3>

                  <div className="space-y-3.5 text-xs font-bold text-slate-205">
                    <div className="flex justify-between items-center">
                      <span>Database Cluster Node</span>
                      <span className="text-emerald-400 font-extrabold flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        ONLINE
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span>Response Latency</span>
                      <span className="text-slate-350 font-mono">14 ms</span>
                    </div>

                    {/* CPU allocation */}
                    <div className="space-y-1.5 border-t border-white/5 pt-2.5">
                      <div className="flex justify-between text-[9px] text-slate-400 uppercase">
                        <span>CPU Load</span>
                        <span className="font-mono text-slate-300">8.4%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-950/60 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-indigo-500" style={{ width: '8.4%' }} />
                      </div>
                    </div>

                    {/* RAM usage */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[9px] text-slate-400 uppercase">
                        <span>Memory Load</span>
                        <span className="font-mono text-slate-300">42%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-950/60 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-indigo-500" style={{ width: '42%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Cyber Mascot Companion */}
                <div className="md:col-span-3 bg-slate-900/40 border border-white/10 backdrop-blur-md rounded-xl p-5 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-20 pointer-events-none" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Workspace Mascot Cluster</span>
                  
                  <div className="relative w-full h-32 flex justify-center items-end gap-3 mt-2">
                    {/* Cloud Bot floating on the left */}
                    <svg viewBox="0 0 100 80" className="w-14 h-14 animate-float-peeker absolute left-2 bottom-8">
                      <path d="M 52 110 C 45 110, 40 102, 45 94 C 45 80, 62 72, 74 82 C 84 72, 98 80, 96 94 C 104 94, 106 102, 98 110 C 92 110, 58 110, 52 110 Z" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" transform="scale(0.8) translate(-10, -50)" />
                      <circle cx="36" cy="30" r="1.5" fill="#f43f5e" opacity="0.4" />
                      <circle cx="52" cy="30" r="1.5" fill="#f43f5e" opacity="0.4" />
                      <circle cx="40" cy="27" r="1.5" fill="#475569" />
                      <circle cx="48" cy="27" r="1.5" fill="#475569" />
                      <path d="M 42 32 Q 44 34 46 32" fill="none" stroke="#475569" strokeWidth="1" />
                    </svg>

                    {/* Database cylinder bot floating on the right */}
                    <svg viewBox="0 0 100 80" className="w-14 h-16 animate-float-mini absolute right-2 bottom-6">
                      <g transform="scale(0.8) translate(0, -10)">
                        <rect x="25" y="20" width="50" height="50" rx="8" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />
                        <ellipse cx="50" cy="20" rx="25" ry="6" fill="#fef08a" stroke="#ca8a04" strokeWidth="2" />
                        <ellipse cx="50" cy="35" rx="25" ry="6" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />
                        <ellipse cx="50" cy="50" rx="25" ry="6" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />
                        <circle cx="40" cy="42" r="2.5" fill="#1e293b" />
                        <circle cx="60" cy="42" r="2.5" fill="#1e293b" />
                        <path d="M 46 52 Q 50 56 54 52" fill="none" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
                      </g>
                    </svg>

                    {/* Monitor Bot sitting in center */}
                    <svg viewBox="0 0 100 100" className="w-20 h-20 animate-float-giga relative z-10">
                      <line x1="40" y1="75" x2="35" y2="92" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
                      <line x1="60" y1="75" x2="65" y2="92" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
                      <rect x="25" y="30" width="50" height="42" rx="7" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                      <rect x="30" y="35" width="40" height="32" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                      <rect x="32" y="37" width="36" height="28" rx="2" fill="#020617" />
                      <circle cx="44" cy="48" r="1.5" fill="#22d3ee" className="animate-pulse" />
                      <circle cx="56" cy="48" r="1.5" fill="#22d3ee" className="animate-pulse" />
                      <path d="M 47 54 Q 50 57 53 54" fill="none" stroke="#22d3ee" strokeWidth="1" strokeLinecap="round" />
                    </svg>
                  </div>
                  
                  <p className="text-[9px] text-slate-350 font-bold text-center mt-3 uppercase tracking-wider">
                    Companion Mascot Cluster
                  </p>
                  <span className="text-[7.5px] text-indigo-400 font-medium italic mt-0.5">"All nodes online & synced!"</span>
                </div>

              </div>
            </div>
          )}

          {/* TAB: CONTRIBUTOR AUDITS GRID */}
          {activeTab === 'contributors' && (
            <div className="space-y-8 animate-slide-up-fade max-w-5xl">
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight leading-none uppercase">
                  Contributor Auditing Grid
                </h2>
                <p className="text-xs text-slate-400 mt-2 font-medium">
                  Select a team contributor profile card to trigger the audit slide-over panel.
                </p>
              </div>

              {/* Contributors Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMembers.map((member) => {
                  const { role, bio } = getMemberDetails(member.name);
                  const initials = getInitials(member.name);
                  const progress = member.total_tasks > 0 ? Math.round((member.completed_tasks / member.total_tasks) * 100) : 0;
                  const isSelected = selectedMemberId === member.id;

                  return (
                    <div
                      key={member.id}
                      onClick={() => handleMemberClick(member)}
                      className={`group bg-slate-900/40 border p-6 shadow-2xl backdrop-blur-md transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[285px] rounded-xl ${
                        isSelected 
                          ? 'border-indigo-500 ring-1 ring-indigo-500/30 bg-slate-955/60 shadow-[0_0_15px_rgba(99,102,241,0.25)]' 
                          : 'border-white/10 hover:border-indigo-500/40 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-950 border border-indigo-500/20 font-mono font-bold text-indigo-300 text-xs uppercase shadow-sm">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white group-hover:text-indigo-200 transition-colors truncate">
                              {member.name}
                            </h4>
                            <span className="inline-block text-[8.5px] font-black text-slate-400 uppercase tracking-wider mt-1.5">
                              {role}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 pt-3 border-t border-white/5 text-[10.5px] font-bold text-slate-400">
                          <div className="flex justify-between items-center">
                            <span>Class Group</span>
                            <span className="text-slate-200">{member.class_room}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Student NIM</span>
                            <span className="text-slate-200 font-mono">120223000{member.id}</span>
                          </div>
                          <p className="text-[10px] text-slate-300 font-medium italic mt-2.5 leading-relaxed font-semibold">
                            &ldquo;{bio}&rdquo;
                          </p>
                        </div>
                      </div>

                      {/* progress */}
                      <div className="mt-5 space-y-2 pt-3 border-t border-white/5">
                        <div className="flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          <span>Task Delivery</span>
                          <span className="text-white font-mono">{progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-950/60 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all duration-500" 
                            style={{ width: `${progress}%` }} 
                          />
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 font-bold pt-1">
                          <span>{member.completed_tasks} done</span>
                          <span>{member.total_tasks} total</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 3. MOBBIN-STYLE AUDITING DRAWER SLIDE-OVER SHEET */}
      {selectedMemberId !== null && (
        <div className="fixed inset-0 z-50 flex justify-end">
          
          {/* Backdrop overlay */}
          <div 
            onClick={() => {
              setSelectedMemberId(null);
              setSelectedMemberName(null);
            }}
            className="absolute inset-0 bg-slate-905/60 backdrop-blur-md transition-opacity animate-fade-in-backdrop"
          />

          {/* Drawer Body panel */}
          <div className="relative w-full max-w-4xl bg-slate-950 border-l border-white/10 h-full flex flex-col shadow-2xl z-10 animate-slide-in-right overflow-hidden">
            
            {/* Drawer Header */}
            <div className="h-16 border-b border-white/10 px-6 flex items-center justify-between shrink-0 bg-slate-900/40 z-10 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-950 border border-indigo-500/20 font-mono font-bold text-indigo-300 text-xs uppercase shadow-sm">
                  {selectedMemberName ? getInitials(selectedMemberName) : 'M'}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white leading-none">
                    Auditing Contributor: {selectedMemberName}
                  </h3>
                  <span className="inline-block mt-1 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                    {selectedMemberName ? getMemberDetails(selectedMemberName).role : 'Contributor'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedMemberId(null);
                  setSelectedMemberName(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Audit Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {isLoadingAudited ? (
                <div className="space-y-6 animate-pulse mt-4">
                  <div className="space-y-2">
                    <div className="h-4 w-40 rounded bg-slate-800" />
                    <div className="h-3.5 w-64 rounded bg-slate-900" />
                  </div>
                  <div className="h-2 w-full rounded bg-slate-800" />
                  <div className="space-y-3 pt-6 border-t border-white/5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3 items-center rounded-lg border border-white/5 p-4 bg-slate-900/40 shadow-xs">
                        <div className="h-4.5 w-4.5 rounded bg-slate-800" />
                        <div className="h-4 w-44 rounded bg-slate-850 flex-1" />
                        <div className="h-5 w-16 rounded bg-slate-900" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6 max-w-4xl mx-auto">
                  {/* Detailed Member info metadata banner */}
                  {selectedMemberName && (
                    <div className="rounded-xl border border-white/10 p-4 bg-slate-900/40 shadow-xs text-xs space-y-2.5 font-bold text-slate-400">
                      <div className="flex justify-between">
                        <span>Class Room:</span>
                        <span className="text-slate-200 font-extrabold">{members.find(m => m.id === selectedMemberId)?.class_room}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Student NIM:</span>
                        <span className="text-indigo-300 font-mono">120223000{selectedMemberId}</span>
                      </div>
                      <div className="border-t border-white/5 pt-2 text-slate-400 italic font-semibold leading-relaxed">
                        &ldquo;{getMemberDetails(selectedMemberName).bio}&rdquo;
                      </div>
                    </div>
                  )}

                  {/* Todo List component (Editable by Admin) */}
                  <TodoList
                    initialTodos={auditedTodos}
                    readOnly={false} // Allows admin to modify items
                    ownerName={selectedMemberName || 'Contributor'}
                    onMutationSuccess={fetchMembers}
                  />
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="py-3.5 border-t border-white/10 text-center text-[9px] text-slate-500 font-bold uppercase tracking-wider bg-slate-950/80 shrink-0 shadow-inner">
              Secure Auditing Session • Kelompok 3 Console
            </div>
          </div>
        </div>
      )}

      {/* 4. MOBILE DRAWER NAVIGATION MENU */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute inset-0 bg-slate-905/60 backdrop-blur-md animate-fade-in-backdrop"
          />

          <div className="relative w-64 bg-slate-950 h-full flex flex-col justify-between p-6 shadow-2xl z-10 animate-slide-in-right border-l border-white/10">
            <div className="space-y-8">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-500/20 select-none shrink-0">
                    <svg viewBox="0 0 32 32" className="w-5 h-5">
                      <rect x="5" y="7" width="22" height="18" rx="4" fill="#ffffff" />
                      <rect x="8" y="10" width="16" height="12" rx="2" fill="#4f46e5" />
                      <circle cx="12" cy="15" r="1.2" fill="#22d3ee" />
                      <circle cx="20" cy="15" r="1.2" fill="#22d3ee" />
                      <rect x="13" y="25" width="6" height="2" fill="#ffffff" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Admin Console</span>
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
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                  }`}
                >
                  Overview Console
                </button>
                <button
                  onClick={() => {
                    setActiveTab('contributors');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full text-left rounded-lg px-3.5 py-2.5 text-xs font-bold transition-all border ${
                    activeTab === 'contributors'
                      ? 'bg-indigo-600 text-white border-indigo-500/30 shadow-md shadow-indigo-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                  }`}
                >
                  Contributor Audits
                </button>
              </nav>
            </div>

            {/* Logout bottom */}
            <div className="border-t border-white/5 pt-6">
              <form onSubmit={handleSignOut}>
                <button
                  type="submit"
                  className="flex items-center gap-3 w-full text-left rounded-lg px-3.5 py-2.5 text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
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
