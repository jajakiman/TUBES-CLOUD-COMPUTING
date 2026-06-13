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

export default function AdminDashboard({
  sessionUser,
  initialMembers,
}: AdminDashboardProps) {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [activeFilter, setActiveFilter] = useState<'all' | 'no_todo' | 'in_progress' | 'completed'>('all');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'contributors'>('dashboard');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

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

  // Helper to get unique avatar gradient
  const getAvatarGradient = (id: number) => {
    const gradients = [
      'from-blue-500 to-indigo-500',
      'from-indigo-500 to-violet-500',
      'from-violet-500 to-purple-500',
      'from-fuchsia-500 to-pink-500',
      'from-pink-500 to-rose-500'
    ];
    return gradients[id % gradients.length];
  };

  // Filter members list based on filter
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
      setToast({ message: `Auditing tasks for ${member.name}`, type: 'info' });
    }
  };

  // Sign out via Auth Microservice
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

  return (
    <div className="flex min-h-screen bg-[#f1f5f9] text-slate-800 font-sans select-none p-4 gap-6">
      
      {/* 1. Sidebar Layout */}
      <aside className="w-64 bg-white/95 border border-slate-200/60 rounded-3xl flex flex-col justify-between shrink-0 hidden md:flex shadow-premium">
        <div className="p-6 space-y-8">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-50 to-indigo-100/50 border border-indigo-100/80 text-indigo-660 shadow-sm">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 17V9h6v8" />
              </svg>
            </div>
            <div className="flex flex-col">
              <h2 className="text-sm font-extrabold tracking-wide text-slate-800 uppercase leading-none">
                Cloud Monolith
              </h2>
              <span className="text-[8px] text-slate-400 font-bold tracking-widest block mt-1.5 uppercase">
                Admin Portal
              </span>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="space-y-1.5">
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
              onClick={() => setActiveTab('contributors')}
              className={`flex items-center gap-3.5 w-full text-left rounded-xl px-4 py-3 text-xs font-bold transition-premium cursor-pointer ${
                activeTab === 'contributors'
                  ? 'bg-indigo-600 text-white shadow-premium shadow-glow-indigo'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Contributors
            </button>
          </nav>
        </div>

        {/* Bottom logout */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl">
          <form onSubmit={handleSignOut}>
            <button
              type="submit"
              className="flex items-center gap-3.5 w-full text-left rounded-xl px-4 py-3 text-xs font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-premium cursor-pointer"
            >
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white border border-slate-200/60 rounded-3xl shadow-premium">
        
        {/* Top Header Navbar */}
        <header className="h-18 border-b border-slate-100 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <h2 className="text-xs font-extrabold text-indigo-600 uppercase tracking-widest hidden sm:block">
              Cloud Monolith Dashboard
            </h2>

            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search resources..."
                className="w-56 rounded-xl bg-slate-50 border border-slate-200/80 pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition-all duration-350 focus:ring-2 focus:ring-indigo-100/50"
              />
            </div>
          </div>


        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto p-8 space-y-8">
          {activeTab === 'dashboard' ? (
            <div className="space-y-8 animate-slide-up-fade">
              {/* Welcome Section */}
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  Welcome back, <span className="bg-gradient-to-r from-indigo-600 to-violet-550 bg-clip-text text-transparent">{sessionUser}</span> 👋
                </h2>
                <p className="text-sm text-slate-500 mt-1.5 font-semibold">
                  Monitor system integrity and cloud resource allocation across distributed nodes.
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
                      <h3 className="text-xl font-bold text-slate-800 tracking-tight">Project Contributors</h3>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">
                        Click on any contributor row to audit their tasks and view system permissions.
                      </p>
                    </div>

                    {/* Table */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-150 bg-slate-50 text-slate-500 font-bold tracking-wider uppercase">
                              <th className="px-6 py-4">No</th>
                              <th className="px-6 py-4">Full Name</th>
                              <th className="px-6 py-4">Class</th>
                              <th className="px-6 py-4">Task Status</th>
                              <th className="px-6 py-4">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredMembers.map((member, idx) => {
                              const initials = getInitials(member.name);
                              const isSelected = selectedMemberId === member.id;
                              const avatarGradient = getAvatarGradient(member.id);
                              return (
                                <tr
                                  key={member.id}
                                  onClick={() => handleMemberClick(member)}
                                  className={`group hover:bg-slate-50/70 transition-colors cursor-pointer ${
                                    isSelected ? 'bg-indigo-50/40' : ''
                                  }`}
                                >
                                  <td className="px-6 py-4 font-mono font-bold text-indigo-650">
                                    {idx + 1}
                                  </td>
                                  <td className="px-6 py-4 flex items-center gap-3">
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr ${avatarGradient} font-bold text-white shadow-sm text-[10px]`}>
                                      {initials}
                                    </div>
                                    <span className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                      {member.name}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-slate-500 font-semibold">
                                    {member.class_room}
                                  </td>
                                  <td className="px-6 py-4">
                                    {member.status === 'no_todo' && (
                                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-slate-655 font-bold">
                                        <svg className="h-1.5 w-1.5 fill-slate-450" viewBox="0 0 6 6">
                                          <circle cx="3" cy="3" r="3" />
                                        </svg>
                                        Not Started
                                      </span>
                                    )}
                                    {member.status === 'in_progress' && (
                                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-amber-700 font-bold">
                                        <svg className="h-1.5 w-1.5 fill-amber-500 animate-pulse" viewBox="0 0 6 6">
                                          <circle cx="3" cy="3" r="3" />
                                        </svg>
                                        In Progress ({member.completed_tasks}/{member.total_tasks})
                                      </span>
                                    )}
                                    {member.status === 'completed' && (
                                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-emerald-700 font-bold">
                                        <svg className="h-1.5 w-1.5 fill-emerald-500" viewBox="0 0 6 6">
                                          <circle cx="3" cy="3" r="3" />
                                        </svg>
                                        Completed ({member.completed_tasks}/{member.total_tasks})
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-55 border border-slate-200 text-slate-400 hover:text-slate-700 transition-colors shadow-sm">
                                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3" />
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
                  </section>
                </div>

                {/* Right Column: Audit Panel & diagnostics info */}
                <div className="lg:col-span-5 space-y-6">
                  {selectedMemberId !== null ? (
                    isLoadingAudited ? (
                      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm min-h-[350px]">
                        {/* pulsing background particles */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none animate-pulse" />

                        {/* Checklist Skeleton Layout */}
                        <div className="space-y-6 animate-pulse">
                          {/* Header skeleton */}
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <div className="h-5 w-36 rounded-md bg-slate-100" />
                              <div className="h-3.5 w-56 rounded bg-slate-200" />
                            </div>
                            <div className="h-6 w-24 rounded-lg bg-slate-100" />
                          </div>

                          {/* Progress bar skeleton */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="h-3 w-16 rounded bg-slate-200" />
                              <div className="h-3 w-8 rounded bg-slate-200" />
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-100" />
                          </div>

                          {/* Filter pills skeleton */}
                          <div className="flex gap-2 border-b border-slate-100 pb-3">
                            <div className="h-7 w-12 rounded-lg bg-slate-100" />
                            <div className="h-7 w-20 rounded-lg bg-slate-100" />
                            <div className="h-7 w-20 rounded-lg bg-slate-100" />
                            <div className="h-7 w-18 rounded-lg bg-slate-100" />
                          </div>

                          {/* Task row list skeleton */}
                          <div className="space-y-3">
                            {[1, 2].map((i) => (
                              <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                                <div className="h-4.5 w-4.5 rounded-full bg-slate-200" />
                                <div className="flex-1 space-y-2">
                                  <div className="h-4 w-1/3 rounded bg-slate-100" />
                                  <div className="h-3 w-2/3 rounded bg-slate-200" />
                                </div>
                                <div className="h-5 w-16 rounded bg-slate-200" />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Central glow badge */}
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/20 backdrop-blur-[1px]">
                          <div className="relative flex flex-col items-center justify-center p-5 rounded-2xl border border-indigo-200 bg-white shadow-xl max-w-[200px] text-center">
                            <span className="relative flex h-3 w-3 mb-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-650"></span>
                            </span>
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Syncing Audit</span>
                            <span className="text-[10px] text-slate-400 mt-1 leading-normal">Connecting stateless node payload...</span>
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
                    <div className="relative overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-slate-55/50 p-12 text-center min-h-[250px] flex flex-col items-center justify-center shadow-inner h-[280px] animate-scale-in">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 shadow-sm">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <h4 className="mt-4 text-sm font-bold text-slate-800">Monitoring Mode</h4>
                      <p className="mt-1.5 text-xs text-slate-400 max-w-[240px] mx-auto leading-relaxed font-semibold">
                        Select a contributor from the table to audit their live tasks and performance logs.
                      </p>
                    </div>
                  )}

                  {/* AWS EC2 Instance Badge */}
                  <InstanceBadge />

                  {/* System Diagnostics Card */}
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    {/* Background Radial Glow */}
                    <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 leading-none">
                      Cluster Performance
                    </h3>

                    <div className="space-y-4 text-xs font-semibold">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-505">Database Connection</span>
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
                        <div className="flex justify-between text-slate-500 text-[11px]">
                          <span>Memory Allocation</span>
                          <span className="font-mono text-indigo-605">42%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200/10">
                          <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-550" style={{ width: '42%' }} />
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
          ) : (
            // ==================== TABS VIEW: CONTRIBUTORS PROFILE VIEW ====================
            <div className="space-y-6 relative w-full animate-slide-up-fade">
              <div>
                <h2 className="text-3xl font-black text-slate-905">
                  Team <span className="bg-gradient-to-r from-indigo-655 to-violet-550 bg-clip-text text-transparent">Contributors</span>
                </h2>
                <p className="text-sm text-slate-500 mt-1 font-semibold">
                  Project Kelompok 3 - Tugas Besar Cloud Computing
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map((member) => {
                  const initials = getInitials(member.name);
                  const completionRate = member.total_tasks > 0 ? Math.round((member.completed_tasks / member.total_tasks) * 100) : 0;
                  const avatarGradient = getAvatarGradient(member.id);
                  
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
                      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-indigo-300 hover:shadow-md hover:scale-[1.01] hover:-translate-y-0.5"
                    >
                      {/* Glow background effect */}
                      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-500/5 blur-2xl pointer-events-none" />

                      <div className="flex items-start gap-4">
                        {/* Member initials avatar */}
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr ${avatarGradient} font-bold text-white shadow-sm text-sm`}>
                          {initials}
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-base font-bold text-slate-800 leading-snug">{member.name}</h4>
                          <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-705 border border-indigo-100">
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
                          <span className="font-mono text-slate-505">120223000{member.id}</span>
                        </div>
                        <p className="text-xs text-slate-400 italic mt-2 leading-relaxed font-semibold">
                          &ldquo;{bio}&rdquo;
                        </p>
                      </div>

                      {/* Member task metrics */}
                      <div className="mt-5 space-y-2.5 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="font-semibold">Task Completion</span>
                          <span className="font-bold text-indigo-650">{completionRate}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-650 to-violet-550 transition-all duration-500"
                            style={{ width: `${completionRate}%` }}
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
            </div>
          )}
        </main>
        
        {/* Footer */}
        <footer className="py-4 border-t border-slate-100 text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50/50 rounded-b-3xl mt-auto">
          Security Level: Alpha • Monolith Cluster Alpha-7
        </footer>
      </div>

      {/* Confirmation Toasts */}
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
