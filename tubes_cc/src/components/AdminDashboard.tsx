'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Member } from '@/app/actions/members';
import { Todo } from '@/app/actions/todos';
import TodoList from './TodoList';
import TeamVisualizer from './TeamVisualizer';

interface AdminDashboardProps {
  sessionUser: string;
  initialMembers: Member[];
}

export default function AdminDashboard({
  sessionUser,
  initialMembers,
}: AdminDashboardProps) {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [activeFilter, setActiveFilter] = useState<'all' | 'no_todo' | 'in_progress' | 'completed'>('all');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'contributors'>('dashboard');
  
  // State for admin auditing
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [selectedMemberName, setSelectedMemberName] = useState<string | null>(null);
  const [auditedTodos, setAuditedTodos] = useState<Todo[]>([]);
  const [isLoadingAudited, setIsLoadingAudited] = useState(false);

  // Fetch members to get latest stats
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

  // Poll members stats periodically or when selecting to audit
  useEffect(() => {
    fetchMembers();
  }, [selectedMemberId]);

  // Fetch audited todos when selecting a team member
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

  // Helper to get name initials (e.g., "Muhammad Zaky" -> "MZ")
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Filter members list based on TeamVisualizer filter card
  const filteredMembers = members.filter((member) => {
    if (activeFilter === 'all') return true;
    return member.status === activeFilter;
  });

  // Handle member row clicks
  const handleMemberClick = (member: Member) => {
    if (selectedMemberId === member.id) {
      setSelectedMemberId(null);
      setSelectedMemberName(null);
    } else {
      setSelectedMemberId(member.id);
      setSelectedMemberName(member.name);
    }
  };

  // Sign out via Auth Microservice
  const handleSignOut = async (e: React.FormEvent) => {
    e.preventDefault();
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
              V0.4.2-Stable
            </span>
          </div>

          {/* Navigation links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-3.5 w-full text-left rounded-xl px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'border-l-2 border-[#00f0ff] bg-cyan-500/5 text-[#00f0ff]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('contributors')}
              className={`flex items-center gap-3.5 w-full text-left rounded-xl px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'contributors'
                  ? 'border-l-2 border-[#00f0ff] bg-cyan-500/5 text-[#00f0ff]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Contributors
            </button>
          </nav>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 min-h-screen flex flex-col overflow-hidden bg-[#050811]">
        
        {/* Top Header Navbar */}
        <header className="h-18 border-b border-white/5 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <h2 className="text-sm font-bold text-[#00f0ff] uppercase tracking-wider hidden sm:block">
              Cloud Monolith Dashboard
            </h2>

            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search resources..."
                className="w-56 rounded-lg bg-slate-900/60 border border-white/5 pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500/40"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Sign Out Button */}
            <form onSubmit={handleSignOut}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/5 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:bg-white/5 hover:text-white cursor-pointer active:scale-[0.98]"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Sign Out
              </button>
            </form>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto p-8 space-y-8">
          {activeTab === 'dashboard' ? (
            <>
              {/* Welcome Section */}
              <div>
                <h2 className="text-3xl font-black text-white">
                  Welcome back, <span className="bg-gradient-to-r from-[#00f0ff] to-blue-400 bg-clip-text text-transparent">{sessionUser}</span>
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Monitor system integrity and cloud resource allocation across 12 distributed nodes.
                </p>
              </div>

              {/* Team Progress Overview */}
              <TeamVisualizer
                members={members}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
              />

              {/* Grid: Contributors Table & Audit Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Column: Project Contributors Table */}
                <div className="lg:col-span-7">
                  <section className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">Project Contributors</h3>
                      <p className="text-xs text-slate-500">
                        Click on any contributor row to audit their tasks and view system permissions.
                      </p>
                    </div>

                    {/* Filter Status Badge Info */}
                    {activeFilter !== 'all' && (
                      <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/5 px-4 py-2.5 flex items-center justify-between text-xs text-cyan-400">
                        <span className="font-semibold">
                          Filtering contributors list by status: {activeFilter === 'no_todo' ? 'Not Started' : activeFilter === 'in_progress' ? 'In Progress' : 'Completed'}
                        </span>
                        <button
                          onClick={() => setActiveFilter('all')}
                          className="text-[#00f0ff] hover:underline font-bold transition-all cursor-pointer"
                        >
                          Clear Filter
                        </button>
                      </div>
                    )}

                    {/* Table */}
                    {filteredMembers.length === 0 ? (
                      <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-12 text-center text-slate-500 text-sm">
                        No contributors match the selected status filter.
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white/5 bg-[#090d16] overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-white/5 bg-slate-950/40 text-slate-400 font-semibold tracking-wider uppercase">
                                <th className="px-6 py-4">No</th>
                                <th className="px-6 py-4">Full Name</th>
                                <th className="px-6 py-4">Class</th>
                                <th className="px-6 py-4">Task Status</th>
                                <th className="px-6 py-4">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {filteredMembers.map((member, idx) => {
                                const initials = getInitials(member.name);
                                const isSelected = selectedMemberId === member.id;
                                return (
                                  <tr
                                    key={member.id}
                                    onClick={() => handleMemberClick(member)}
                                    className={`group hover:bg-white/2.5 transition-colors cursor-pointer ${
                                      isSelected ? 'bg-cyan-500/5' : ''
                                    }`}
                                  >
                                    <td className="px-6 py-4 font-mono font-medium text-cyan-400">
                                      {idx + 1}
                                    </td>
                                    <td className="px-6 py-4 flex items-center gap-3">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-[#00f0ff] font-bold text-white shadow-sm text-[10px]">
                                        {initials}
                                      </div>
                                      <span className="font-semibold text-white group-hover:text-cyan-300 transition-colors">
                                        {member.name}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 font-medium">
                                      {member.class_room}
                                    </td>
                                    <td className="px-6 py-4">
                                      {member.status === 'no_todo' && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 border border-white/5 px-3 py-1 text-slate-500 font-medium">
                                          <svg className="h-1.5 w-1.5 fill-slate-500 animate-pulse" viewBox="0 0 6 6">
                                            <circle cx="3" cy="3" r="3" />
                                          </svg>
                                          Not Started
                                        </span>
                                      )}
                                      {member.status === 'in_progress' && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 px-3 py-1 text-amber-400 font-medium">
                                          <svg className="h-1.5 w-1.5 fill-amber-400 animate-pulse" viewBox="0 0 6 6">
                                            <circle cx="3" cy="3" r="3" />
                                          </svg>
                                          In Progress ({member.completed_tasks}/{member.total_tasks})
                                        </span>
                                      )}
                                      {member.status === 'completed' && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 text-emerald-400 font-medium">
                                          <svg className="h-1.5 w-1.5 fill-emerald-400" viewBox="0 0 6 6">
                                            <circle cx="3" cy="3" r="3" />
                                          </svg>
                                          Completed ({member.completed_tasks}/{member.total_tasks})
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 border border-white/5 text-slate-500 hover:text-white transition-colors">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </section>
                </div>

                {/* Right Column: Audit Panel */}
                <div className="lg:col-span-5">
                  {selectedMemberId !== null ? (
                    isLoadingAudited ? (
                      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl min-h-[350px]">
                        {/* pulsing background particles */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none animate-pulse" />
                        <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-blue-500/5 blur-xl pointer-events-none" />

                        {/* Checklist Skeleton Layout */}
                        <div className="space-y-6 animate-pulse">
                          {/* Header skeleton */}
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <div className="h-5 w-36 rounded-md bg-slate-800" />
                              <div className="h-3.5 w-56 rounded bg-slate-850" />
                            </div>
                            <div className="h-6 w-24 rounded-lg bg-slate-800" />
                          </div>

                          {/* Progress bar skeleton */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="h-3 w-16 rounded bg-slate-850" />
                              <div className="h-3 w-8 rounded bg-slate-850" />
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-950" />
                          </div>

                          {/* Filter pills skeleton */}
                          <div className="flex gap-2 border-b border-white/5 pb-3">
                            <div className="h-7 w-12 rounded-lg bg-slate-850" />
                            <div className="h-7 w-20 rounded-lg bg-slate-850" />
                            <div className="h-7 w-20 rounded-lg bg-slate-850" />
                            <div className="h-7 w-18 rounded-lg bg-slate-850" />
                          </div>

                          {/* Task row list skeleton */}
                          <div className="space-y-3">
                            {[1, 2].map((i) => (
                              <div key={i} className="flex items-start gap-3 rounded-xl border border-white/5 bg-slate-950/20 p-4">
                                <div className="h-4.5 w-4.5 rounded-full bg-slate-850" />
                                <div className="flex-1 space-y-2">
                                  <div className="h-4 w-1/3 rounded bg-slate-800" />
                                  <div className="h-3 w-2/3 rounded bg-slate-850" />
                                </div>
                                <div className="h-5 w-16 rounded bg-slate-850" />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Central Glassmorphic Pulsing Glow Badge */}
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/25 backdrop-blur-[2px]">
                          <div className="relative flex flex-col items-center justify-center p-5 rounded-2xl border border-cyan-500/20 bg-slate-900/80 shadow-xl max-w-[200px] text-center">
                            {/* Neon pulsing dots */}
                            <span className="relative flex h-3 w-3 mb-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                            </span>
                            <span className="text-xs font-bold text-white uppercase tracking-wider">Syncing Audit</span>
                            <span className="text-[10px] text-slate-500 mt-1 leading-normal">Connecting stateless node payload...</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <TodoList
                        initialTodos={auditedTodos}
                        readOnly={true}
                        ownerName={selectedMemberName || 'Contributor'}
                      />
                    )
                  ) : (
                    /* Admin Dashboard Monitor Placeholder */
                    <div className="relative overflow-hidden rounded-2xl border border-dashed border-white/10 bg-slate-905/10 p-12 text-center min-h-[250px] flex flex-col items-center justify-center shadow-inner h-[280px]">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950/80 border border-white/5 text-slate-400">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <h4 className="mt-4 text-sm font-semibold text-white">Monitoring Mode</h4>
                      <p className="mt-1.5 text-xs text-slate-500 max-w-[240px] mx-auto leading-relaxed">
                        Select a contributor from the table below to audit their live tasks and performance logs.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </>
          ) : (
            // ==================== TABS VIEW: CONTRIBUTORS PROFILE VIEW ====================
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-black text-white">
                  Team <span className="bg-gradient-to-r from-[#00f0ff] to-blue-400 bg-clip-text text-transparent">Contributors</span>
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Project Kelompok 3 - Tugas Besar Cloud Computing
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map((member) => {
                  const initials = getInitials(member.name);
                  const completionRate = member.total_tasks > 0 ? Math.round((member.completed_tasks / member.total_tasks) * 100) : 0;
                  
                  // Specific member role descriptions for Kelompok 3
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
                      {/* Glow background effect */}
                      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-500/5 blur-2xl pointer-events-none" />

                      <div className="flex items-start gap-4">
                        {/* Member initials avatar */}
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
                          "{bio}"
                        </p>
                      </div>

                      {/* Member task metrics */}
                      <div className="mt-5 space-y-2.5 pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="font-medium">Task Completion</span>
                          <span className="font-semibold text-cyan-400">{completionRate}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-[#00f0ff] transition-all duration-500"
                            style={{ width: `${completionRate}%` }}
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
            </div>
          )}
        </main>
        
        {/* Footer */}
        <footer className="py-4 border-t border-white/5 text-center text-[9px] text-slate-600 uppercase tracking-widest bg-slate-950/20">
          Security Level: Alpha • Monolith Cluster Alpha-7
        </footer>
      </div>

    </div>
  );
}
