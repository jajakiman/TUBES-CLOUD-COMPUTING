'use client';

import React, { useState, useEffect } from 'react';
import { Member } from '@/app/actions/members';
import { Todo, getMemberTodosAction } from '@/app/actions/todos';
import TodoList from './TodoList';
import TeamVisualizer from './TeamVisualizer';

interface DashboardLayoutCoordinatorProps {
  sessionUser: string;
  members: Member[];
  initialTodos: Todo[];
  fetchError: string | null;
  instanceBadgeNode: React.ReactNode;
}

export default function DashboardLayoutCoordinator({
  sessionUser,
  members,
  initialTodos,
  fetchError,
  instanceBadgeNode,
}: DashboardLayoutCoordinatorProps) {
  const isAdmin = sessionUser === 'admin';

  // State for visualizer filtering
  const [activeFilter, setActiveFilter] = useState<'all' | 'no_todo' | 'in_progress' | 'completed'>('all');

  // State for admin auditing
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [selectedMemberName, setSelectedMemberName] = useState<string | null>(null);
  const [auditedTodos, setAuditedTodos] = useState<Todo[]>([]);
  const [isLoadingAudited, setIsLoadingAudited] = useState(false);

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

  // Fetch audited todos when admin clicks a team member
  useEffect(() => {
    if (!isAdmin || selectedMemberId === null) {
      setAuditedTodos([]);
      return;
    }

    const memberId = selectedMemberId;

    async function loadAuditedTodos() {
      setIsLoadingAudited(true);
      try {
        const todos = await getMemberTodosAction(memberId);
        setAuditedTodos(todos);
      } catch (err) {
        console.error('Failed to load audited todos:', err);
      } finally {
        setIsLoadingAudited(false);
      }
    }

    loadAuditedTodos();
  }, [selectedMemberId, isAdmin]);

  // Handle member row clicks
  const handleMemberClick = (member: Member) => {
    if (!isAdmin) return; // Regular users cannot audit other members
    
    // Toggle selection if clicking the same member, otherwise select new one
    if (selectedMemberId === member.id) {
      setSelectedMemberId(null);
      setSelectedMemberName(null);
    } else {
      setSelectedMemberId(member.id);
      setSelectedMemberName(member.name);
    }
  };

  // ==================== POV USER (REGULAR) ====================
  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#050811] px-4 py-8 sm:px-6 lg:px-8 text-white relative">
        {/* Glow background effect */}
        <div className="absolute top-10 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
        
        <div className="mx-auto max-w-2xl space-y-8 relative">
          {/* Top Navbar Section for Users */}
          <header className="flex items-center justify-between border-b border-white/5 pb-6">
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Cloud Monolith Dashboard
              </h1>
              <p className="mt-1.5 text-xs text-slate-400">
                Welcome back, <span className="font-semibold text-blue-400">{sessionUser}</span>
              </p>
            </div>

            <form action="/api/auth/logout" method="POST" onSubmit={async (e) => {
              e.preventDefault();
              const { logoutAction } = await import('@/app/actions/auth');
              await logoutAction();
              window.location.href = '/login';
            }}>
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
          </header>

          {!fetchError ? (
            <TodoList initialTodos={initialTodos} />
          ) : (
            <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-6 text-center text-slate-500 text-sm">
              Task manager unavailable due to database connection issue.
            </div>
          )}
        </div>
      </main>
    );
  }

  // ==================== POV ADMIN (MONITORING) ====================
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
            <button className="flex items-center gap-3.5 w-full text-left rounded-xl px-4 py-3 text-sm font-semibold border-l-2 border-[#00f0ff] bg-cyan-500/5 text-[#00f0ff] transition-all">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Dashboard
            </button>
            <button className="flex items-center gap-3.5 w-full text-left rounded-xl px-4 py-3 text-sm font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition-all cursor-pointer">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Contributors
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-white/5 space-y-4">
          <button className="flex items-center gap-3.5 w-full text-left text-sm font-semibold text-slate-400 hover:text-white transition-all cursor-pointer">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Docs
          </button>
          <button className="flex items-center gap-3.5 w-full text-left text-sm font-semibold text-slate-400 hover:text-white transition-all cursor-pointer">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Support
          </button>
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

          {/* Navigation Links & User Menu */}
          <div className="flex items-center gap-6">
            {/* Utility icons */}
            <div className="flex items-center gap-3 text-slate-400">
              <button className="p-1 hover:text-white transition-all cursor-pointer">
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <button className="p-1 hover:text-white transition-all cursor-pointer">
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            </div>

            {/* Sign Out Button */}
            <form action="/api/auth/logout" method="POST" onSubmit={async (e) => {
              e.preventDefault();
              const { logoutAction } = await import('@/app/actions/auth');
              await logoutAction();
              window.location.href = '/login';
            }}>
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
          
          {/* Welcome Section */}
          <div>
            <h2 className="text-3xl font-black text-white">
              Welcome back, <span className="bg-gradient-to-r from-[#00f0ff] to-blue-400 bg-clip-text text-transparent">{sessionUser}</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Monitor system integrity and cloud resource allocation across 12 distributed nodes.
            </p>
          </div>

          {/* Team Progress Overview (Bento Visualizer on top) */}
          <TeamVisualizer
            members={members}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />

          {/* Grid: Contributors Table & Audit Panel side-by-side */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Project Contributors Table (7 cols) */}
            <div className="lg:col-span-7">
              <section className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Project Contributors</h3>
                  <p className="text-xs text-slate-500">
                    Click on any contributor row to audit their tasks and view system permissions.
                  </p>
                </div>

                {fetchError ? (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-slate-300">
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg bg-amber-500/10 p-2 text-amber-500">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-amber-400">Database Connection Incomplete</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          The Server Component was unable to fetch the contributors. Ensure database connection and schema are correct.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-12 text-center">
                    <h4 className="text-sm font-semibold text-white">No Members Found</h4>
                    <p className="mt-1 text-xs text-slate-500">No members match the active filter criteria.</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#090d16] shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 bg-slate-950/30">
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              No
                            </th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Nama Lengkap
                            </th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Kelas
                            </th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Status Tugas
                            </th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredMembers.map((member, index) => {
                            const isSelected = selectedMemberId === member.id;
                            const initials = getInitials(member.name);
                            return (
                              <tr
                                key={member.id}
                                onClick={() => handleMemberClick(member)}
                                className={`transition-all duration-200 cursor-pointer hover:bg-white/[0.02] ${
                                  isSelected ? 'bg-cyan-500/5 border-l-2 border-[#00f0ff]' : ''
                                }`}
                              >
                                {/* NO */}
                                <td className="px-6 py-4 font-mono text-sm font-medium text-blue-400">
                                  {index + 1}
                                </td>
                                {/* NAMA LENGKAP WITH INITIALS */}
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 border border-white/10 font-bold text-xs text-[#00f0ff] uppercase select-none">
                                      {initials}
                                    </span>
                                    <span className="text-sm font-semibold text-white">
                                      {member.name}
                                    </span>
                                  </div>
                                </td>
                                {/* KELAS */}
                                <td className="px-6 py-4">
                                  <span className="inline-flex items-center rounded bg-slate-950 px-2.5 py-1 text-xs font-mono font-medium text-slate-400 border border-white/5">
                                    {member.class_room}
                                  </span>
                                </td>
                                {/* STATUS TUGAS BADGES */}
                                <td className="px-6 py-4">
                                  {member.status === 'no_todo' ? (
                                    <span className="inline-flex items-center rounded-full bg-slate-500/10 px-3 py-1 text-xs font-medium text-slate-400 border border-slate-500/20">
                                      Belum ada to-do-list
                                    </span>
                                  ) : member.status === 'in_progress' ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
                                      {/* Sync/arrows icon */}
                                      <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8.89M9 11l3 3L22 4" />
                                      </svg>
                                      Sedang Kerja ({member.completed_tasks}/{member.total_tasks})
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                                      {/* Check icon */}
                                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                      Selesai ({member.completed_tasks}/{member.total_tasks})
                                    </span>
                                  )}
                                </td>
                                {/* ACTIONS */}
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

            {/* Right Column: Audit Panel (TodoList) or Placeholder (5 cols) */}
            <div className="lg:col-span-5">
              {selectedMemberId !== null ? (
                isLoadingAudited ? (
                  <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#090d16] p-12 shadow-xl flex flex-col items-center justify-center min-h-[250px]">
                    <svg className="h-8 w-8 animate-spin text-cyan-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="mt-4 text-xs text-slate-500">Loading {selectedMemberName}'s tasks...</span>
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
          
        </main>
        
        {/* Footer */}
        <footer className="py-4 border-t border-white/5 text-center text-[9px] text-slate-600 uppercase tracking-widest bg-slate-950/20">
          Security Level: Alpha • Monolith Cluster Alpha-7
        </footer>
      </div>

      {/* Floating Action Terminal Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00f0ff] hover:bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3" />
          </svg>
        </button>
      </div>

    </div>
  );
}
