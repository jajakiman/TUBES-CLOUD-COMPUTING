'use client';

import React, { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Todo } from '@/app/actions/todos';
import Toast from './Toast';

interface TodoListProps {
  initialTodos: Todo[];
  readOnly?: boolean;
  ownerName?: string;
  onMutationSuccess?: () => void;
}

type ViewLayout = 'grid' | 'flow';
type FilterStatus = 'all' | 'pending' | 'in_progress' | 'completed';
type SortOrder = 'newest' | 'oldest' | 'alphabetical';
type CategoryTag = 'all' | 'devops' | 'database' | 'frontend' | 'backend' | 'general';

export default function TodoList({
  initialTodos,
  readOnly = false,
  ownerName,
  onMutationSuccess,
}: TodoListProps) {
  const router = useRouter();

  // Helper to get profile image path
  const getProfileImage = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('farid')) return '/Farid.png';
    if (lower.includes('hafiz')) return '/Hafiz.png';
    if (lower.includes('zaky')) return '/Zaky.png';
    if (lower.includes('haris')) return '/haris.png';
    if (lower.includes('djordhi') || lower.includes('michail')) return '/Kai.png';
    return null;
  };

  // Server Action hooks
  const [isPending, startTransition] = useTransition();

  // Local state
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [viewLayout, setViewLayout] = useState<ViewLayout>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Advanced filters state
  const [statusFilter, setStatusFilter] = useState<Record<string, boolean>>({
    pending: true,
    in_progress: true,
    completed: true,
  });
  const [categoryFilter, setCategoryFilter] = useState<Record<CategoryTag, boolean>>({
    all: true,
    devops: true,
    database: true,
    frontend: true,
    backend: true,
    general: true,
  });
  const [assigneeFilter, setAssigneeFilter] = useState<Record<number, boolean>>({
    2: true, // Zaky
    3: true, // Hafiz
    4: true, // Haris
    5: true, // Djordhi
    6: true, // Farid
  });
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  // Drawer / Specs state
  const [selectedTodoId, setSelectedTodoId] = useState<number | null>(null);

  // Form inline creation state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<CategoryTag>('general');
  const [newAssigneeId, setNewAssigneeId] = useState<number>(2); // Default to Muhammad Zaky (2)
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isDesktopSortDropdownOpen, setIsDesktopSortDropdownOpen] = useState(false);
  const [isMobileSortDropdownOpen, setIsMobileSortDropdownOpen] = useState(false);

  // Edit inline drawer state
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');
  const [editCategory, setEditCategory] = useState<CategoryTag>('general');

  // UI state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  useEffect(() => {
    setTodos(initialTodos);
  }, [initialTodos]);

  // Fetch todos on mutations
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

  // Helper: Dynamically categorize tasks
  const getTaskCategory = (title: string, desc: string | null): CategoryTag => {
    const combined = `${title} ${desc || ''}`.toLowerCase();
    if (
      combined.includes('deploy') ||
      combined.includes('aws') ||
      combined.includes('ec2') ||
      combined.includes('instance') ||
      combined.includes('docker') ||
      combined.includes('nginx') ||
      combined.includes('ci') ||
      combined.includes('cd') ||
      combined.includes('cloud')
    ) {
      return 'devops';
    }
    if (
      combined.includes('db') ||
      combined.includes('sql') ||
      combined.includes('database') ||
      combined.includes('query') ||
      combined.includes('table') ||
      combined.includes('schema') ||
      combined.includes('migrate') ||
      combined.includes('seed')
    ) {
      return 'database';
    }
    if (
      combined.includes('ui') ||
      combined.includes('ux') ||
      combined.includes('css') ||
      combined.includes('style') ||
      combined.includes('design') ||
      combined.includes('animate') ||
      combined.includes('tailwind') ||
      combined.includes('page') ||
      combined.includes('component') ||
      combined.includes('form') ||
      combined.includes('theme')
    ) {
      return 'frontend';
    }
    if (
      combined.includes('api') ||
      combined.includes('auth') ||
      combined.includes('login') ||
      combined.includes('route') ||
      combined.includes('server') ||
      combined.includes('endpoint') ||
      combined.includes('logout') ||
      combined.includes('backend')
    ) {
      return 'backend';
    }
    return 'general';
  };

  // Filter & Search Logic
  const filteredTodos = todos.filter((todo) => {
    const category = getTaskCategory(todo.title, todo.description);

    // Status filter matching
    const matchesStatus = statusFilter[todo.status] === true;

    // Category filter matching
    let matchesCategory = false;
    if (categoryFilter.all) {
      matchesCategory = true;
    } else {
      matchesCategory = categoryFilter[category] === true;
    }

    // Assignee filter matching
    const matchesAssignee = assigneeFilter[todo.user_id] === true;

    // Search query matching
    const matchesSearch =
      todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (todo.description && todo.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      `#task-${todo.id}`.includes(searchQuery.toLowerCase());

    return matchesStatus && matchesCategory && matchesAssignee && matchesSearch;
  });

  // Sorting Logic
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    if (sortOrder === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sortOrder === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    if (sortOrder === 'alphabetical') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  // Currently inspected todo
  const currentInspectedTodo = sortedTodos.find((t) => t.id === selectedTodoId) || null;

  // Flow navigation index
  const inspectedIndex = currentInspectedTodo ? sortedTodos.findIndex((t) => t.id === selectedTodoId) : -1;

  // Load next/prev inspected todo (Carousel)
  const navigateInspected = (direction: 'prev' | 'next') => {
    if (sortedTodos.length <= 1 || inspectedIndex === -1) return;
    let nextIdx = inspectedIndex;
    if (direction === 'prev') {
      nextIdx = inspectedIndex === 0 ? sortedTodos.length - 1 : inspectedIndex - 1;
    } else {
      nextIdx = inspectedIndex === sortedTodos.length - 1 ? 0 : inspectedIndex + 1;
    }
    const nextTodo = sortedTodos[nextIdx];
    setSelectedTodoId(nextTodo.id);
    setIsEditingMode(false);
  };

  // Keyboard navigation listener for drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedTodoId === null || isEditingMode) return;
      if (e.key === 'ArrowLeft') {
        navigateInspected('prev');
      } else if (e.key === 'ArrowRight') {
        navigateInspected('next');
      } else if (e.key === 'Escape') {
        setSelectedTodoId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTodoId, inspectedIndex, sortedTodos, isEditingMode]);

  // Handle Create Task
  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const res = await fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newTitle,
            description: newDesc,
            category: newCategory,
            assignedUserId: newAssigneeId
          }),
        });
        const data = await res.json();
        if (data.success) {
          setNewTitle('');
          setNewDesc('');
          setNewCategory('general');
          setNewAssigneeId(2);
          setIsCreatingInline(false);
          await fetchTodos();
          setToast({ message: 'Screen deliverable task logged!', type: 'success' });
          onMutationSuccess?.();
        } else {
          setErrorMessage(data.error || 'Failed to create task.');
        }
      } catch (err) {
        setErrorMessage('Failed to connect to MySQL backend.');
      }
    });
  };

  // Handle Edit/Save Task details inside drawer
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInspectedTodo || !editTitle.trim()) return;
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/todos/${currentInspectedTodo.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: editTitle, description: editDesc, status: editStatus, category: editCategory }),
        });
        const data = await res.json();
        if (data.success) {
          setIsEditingMode(false);
          await fetchTodos();
          setToast({ message: 'Task changes saved!', type: 'success' });
          onMutationSuccess?.();
        } else {
          setErrorMessage(data.error || 'Failed to save changes.');
        }
      } catch (err) {
        setErrorMessage('Failed to connect to MySQL backend.');
      }
    });
  };

  // Start editing mode in drawer
  const startEditing = (todo: Todo) => {
    setEditTitle(todo.title);
    setEditDesc(todo.description || '');
    setEditStatus(todo.status);
    setEditCategory((todo.category as CategoryTag) || 'general');
    setIsEditingMode(true);
  };

  // Cycle status instantly from card action
  const handleCycleStatus = async (todo: Todo, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection click
    let nextStatus: 'pending' | 'in_progress' | 'completed' = 'pending';
    if (todo.status === 'pending') nextStatus = 'in_progress';
    else if (todo.status === 'in_progress') nextStatus = 'completed';

    startTransition(async () => {
      try {
        const res = await fetch(`/api/todos/${todo.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: todo.title, description: todo.description, status: nextStatus }),
        });
        const data = await res.json();
        if (data.success) {
          await fetchTodos();
          setToast({ message: `Status updated to ${nextStatus}`, type: 'success' });
          onMutationSuccess?.();
        }
      } catch (err) {
        console.error('Failed to quick-cycle status:', err);
      }
    });
  };

  // Toggle complete from card checkbox click
  const handleToggleComplete = async (todo: Todo, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = todo.status === 'completed' ? 'pending' : 'completed';
    startTransition(async () => {
      try {
        const res = await fetch(`/api/todos/${todo.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: todo.title, description: todo.description, status: nextStatus }),
        });
        const data = await res.json();
        if (data.success) {
          await fetchTodos();
          setToast({ message: nextStatus === 'completed' ? 'Task completed!' : 'Task reopened', type: 'success' });
          onMutationSuccess?.();
        }
      } catch (err) {
        console.error('Failed to toggle completion:', err);
      }
    });
  };

  // Delete task inside drawer or quick-action
  const handleDeleteTodo = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task screen?')) return;
    setSelectedTodoId(null);
    setIsEditingMode(false);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/todos/${id}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (data.success) {
          await fetchTodos();
          setToast({ message: 'Task screen deleted.', type: 'success' });
          onMutationSuccess?.();
        } else {
          setErrorMessage(data.error || 'Failed to delete task.');
        }
      } catch (err) {
        setErrorMessage('Failed to connect to backend.');
      }
    });
  };

  // Total Task metrics
  const totalCount = todos.length;
  const pendingCount = todos.filter((t) => t.status === 'pending').length;
  const inProgressCount = todos.filter((t) => t.status === 'in_progress').length;
  const completedCount = todos.filter((t) => t.status === 'completed').length;
  const rate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Category Tag display helper
  const getCategoryDetails = (cat: CategoryTag) => {
    switch (cat) {
      case 'devops':
        return { label: 'DevOps / AWS', bg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25' };
      case 'database':
        return { label: 'Database SQL', bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25' };
      case 'frontend':
        return { label: 'Frontend UI', bg: 'bg-sky-500/10 text-sky-300 border-sky-500/25' };
      case 'backend':
        return { label: 'Backend API', bg: 'bg-amber-500/10 text-amber-300 border-amber-500/25' };
      default:
        return { label: 'General Task', bg: 'bg-slate-500/10 text-slate-300 border-slate-500/25' };
    }
  };

  const getAssigneeName = (userId: number) => {
    switch (userId) {
      case 2: return 'Zaky';
      case 3: return 'Hafiz';
      case 4: return 'Haris';
      case 5: return 'Djordhi';
      case 6: return 'Farid';
      default: return 'Admin';
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 text-white min-h-[calc(100vh-8rem)]">

      {/* 1. Header Toolbar (Search + View Toggles) */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-slate-900/40 border border-white/10 backdrop-blur-md rounded-xl p-4 shadow-sm w-full">

        {/* Title */}
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-sm font-extrabold text-white tracking-tight leading-none uppercase">
              {ownerName ? `${ownerName}'s Directory` : 'Team Workspace'}
            </h2>
            <span className="text-[10px] font-bold text-slate-400 block mt-1 uppercase tracking-wider">
              {readOnly ? 'Audit session mode' : 'Collaborative project deliverables'}
            </span>
          </div>
          {/* Nyempill: tiny DB monster peeking next to title */}
          <div className="relative group select-none hidden sm:block shrink-0">
            <svg viewBox="0 0 80 80" className="w-7 h-7 animate-float-peeker opacity-70 group-hover:opacity-100 transition-opacity">
              <rect x="20" y="25" width="40" height="35" rx="6" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />
              <ellipse cx="40" cy="25" rx="20" ry="5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
              <circle cx="34" cy="40" r="2" fill="#1e293b" />
              <circle cx="46" cy="40" r="2" fill="#1e293b" />
              <path d="M 38 47 Q 40 49 42 47" fill="none" stroke="#1e293b" strokeWidth="1" />
            </svg>
          </div>
        </div>

        {/* Search + New Task */}
        <div className="flex flex-1 w-full md:justify-end items-center gap-3">
          {!readOnly && (
            <button
              onClick={() => setIsCreatingInline(true)}
              className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2 text-xs font-bold transition-all shadow-md shadow-indigo-500/10 cursor-pointer flex items-center justify-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Log New Task
            </button>
          )}

          <div className="flex-1 w-full sm:flex-none sm:w-full md:max-w-xs relative group hidden sm:block">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search tasks by title, details or #ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/50 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
            />
          </div>

          {/* Mobile Filters Trigger */}
          <button
            onClick={() => setIsMobileFiltersOpen(true)}
            className="md:hidden flex items-center justify-center gap-1.5 px-4 py-2 border border-white/10 bg-slate-900/40 rounded-lg text-xs font-bold text-slate-350 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Configure Filters
          </button>
        </div>
      </div>

      {/* 2. Main Directories Layout (Sidebar filters + Grid / Flow Content) */}
      <div className="flex items-stretch gap-5 w-full flex-1 min-h-0">

        {/* Left Filter Accordion Column (Desktop) */}
        <aside className="w-60 shrink-0 hidden md:flex flex-col gap-4 bg-slate-900/40 border border-white/10 backdrop-blur-md rounded-xl p-4 shadow-sm sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto overscroll-contain">

          {/* Section: Status */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
              Filter by Status
            </h3>
            <div className="space-y-2 text-xs font-bold text-slate-300">
              {Object.keys(statusFilter).map((status) => (
                <label key={status} className="flex items-center gap-2.5 cursor-pointer hover:text-white transition-colors capitalize">
                  <input
                    type="checkbox"
                    checked={statusFilter[status]}
                    onChange={(e) =>
                      setStatusFilter((prev) => ({ ...prev, [status]: e.target.checked }))
                    }
                    className="h-3.5 w-3.5 rounded border-white/10 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>
                    {status === 'in_progress' ? 'Running' : status === 'completed' ? 'Completed' : 'Pending'}
                  </span>
                  <span className="ml-auto font-mono text-[9px] px-1 bg-white/5 border border-white/5 rounded text-slate-400 font-medium">
                    {todos.filter((t) => t.status === status).length}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <hr className="border-white/5" />

          {/* Section: Dynamic Category Tags */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
              Category modules
            </h3>
            <div className="space-y-2 text-xs font-bold text-slate-300">
              <label className="flex items-center gap-2.5 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={categoryFilter.all}
                  onChange={(e) =>
                    setCategoryFilter((prev) => ({
                      ...prev,
                      all: e.target.checked,
                      devops: e.target.checked,
                      database: e.target.checked,
                      frontend: e.target.checked,
                      backend: e.target.checked,
                      general: e.target.checked,
                    }))
                  }
                  className="h-3.5 w-3.5 rounded border-white/10 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
                <span>All Categories</span>
              </label>

              {(['devops', 'database', 'frontend', 'backend', 'general'] as CategoryTag[]).map((cat) => (
                <label key={cat} className="flex items-center gap-2.5 cursor-pointer hover:text-white capitalize ml-2">
                  <input
                    type="checkbox"
                    checked={categoryFilter.all ? true : categoryFilter[cat]}
                    disabled={categoryFilter.all}
                    onChange={(e) =>
                      setCategoryFilter((prev) => ({ ...prev, [cat]: e.target.checked }))
                    }
                    className="h-3.5 w-3.5 rounded border-white/10 bg-slate-950 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                  />
                  <span>{cat === 'devops' ? 'DevOps / AWS' : cat}</span>
                  <span className="ml-auto font-mono text-[9px] px-1 bg-white/5 border border-white/5 rounded text-slate-400 font-medium">
                    {todos.filter((t) => getTaskCategory(t.title, t.description) === cat).length}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <hr className="border-white/5" />

          {/* Section: Assignee Filter */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
              Filter by Assignee
            </h3>
            <div className="space-y-2 text-xs font-bold text-slate-300">
              {([{id: 2, name: 'Zaky'}, {id: 3, name: 'Hafiz'}, {id: 4, name: 'Haris'}, {id: 5, name: 'Djordhi'}, {id: 6, name: 'Farid'}] as const).map((member) => (
                <label key={member.id} className="flex items-center gap-2.5 cursor-pointer hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={assigneeFilter[member.id]}
                    onChange={(e) =>
                      setAssigneeFilter((prev) => ({ ...prev, [member.id]: e.target.checked }))
                    }
                    className="h-3.5 w-3.5 rounded border-white/10 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{member.name}</span>
                  <span className="ml-auto font-mono text-[9px] px-1 bg-white/5 border border-white/5 rounded text-slate-400 font-medium">
                    {todos.filter((t) => t.user_id === member.id).length}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <hr className="border-white/5" />

          {/* Section: Sort Settings */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
              Sorting Order
            </h3>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-950/60 border border-white/5">
              {([
                { value: 'newest' as SortOrder, label: 'Newest', icon: '↓' },
                { value: 'oldest' as SortOrder, label: 'Oldest', icon: '↑' },
                { value: 'alphabetical' as SortOrder, label: 'A – Z', icon: '⇅' },
              ]).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSortOrder(opt.value)}
                  className={`flex flex-col items-center gap-0.5 rounded-md py-1.5 px-1 text-[9px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    sortOrder === opt.value
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-[11px] leading-none">{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Total stats */}
          <div className="pt-1 text-[10px] font-bold text-slate-400 uppercase space-y-1 shrink-0">
            <div className="flex justify-between">
              <span>Team Coverage:</span>
              <span className="text-white font-mono">{rate}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${rate}%` }} />
            </div>
          </div>

          {/* Nyempill: tiny cloud bot peeking from bottom of sidebar */}
          <div className="flex justify-center pt-0.5 pb-1 select-none shrink-0">
            <svg viewBox="0 0 100 50" className="w-10 h-5 opacity-40 hover:opacity-80 transition-opacity animate-float-peeker">
              <path d="M 30 45 C 22 45, 18 38, 24 32 C 24 22, 38 16, 48 24 C 56 16, 68 22, 66 32 C 72 32, 74 38, 68 45 Z" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
              <circle cx="40" cy="34" r="1.5" fill="#475569" />
              <circle cx="50" cy="34" r="1.5" fill="#475569" />
              <path d="M 43 38 Q 45 40 47 38" fill="none" stroke="#475569" strokeWidth="0.8" />
            </svg>
          </div>

        </aside>

        {/* Right Content Area (Grid / Flow directory display) */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* Error banner */}
          {errorMessage && (
            <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-200 flex items-center justify-between shadow-xs animate-scale-in">
              <span className="font-bold">{errorMessage}</span>
              <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-200 font-extrabold cursor-pointer">
                ✕
              </button>
            </div>
          )}

          {/* VIEW: GRID MODE (Default) */}
          <div className="flex-1 space-y-6">
            {sortedTodos.length === 0 ? (
              <div className="py-20 text-center rounded-xl border border-dashed border-white/10 bg-slate-900/40 shadow-xs">
                <svg className="mx-auto h-12 w-12 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-wider">No deliverables match selected filter logs</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 auto-rows-fr">
                {sortedTodos.map((todo) => {
                  const cat = getTaskCategory(todo.title, todo.description);
                  const catDetails = getCategoryDetails(cat);

                  return (
                    <div
                      key={todo.id}
                      onClick={() => setSelectedTodoId(todo.id)}
                      className="group h-full min-h-[280px] bg-slate-900/40 border border-white/10 shadow-xs hover:border-white/20 transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden relative hover:-translate-y-0.5 backdrop-blur-sm rounded-xl"
                    >
                      {/* 1. Device Chrome Frame Mockup on Top */}
                      <div className="w-full bg-slate-950/60 border-b border-white/5 flex flex-col">
                        {/* Chrome Tab Header */}
                        <div className="h-6 px-3 flex items-center justify-between border-b border-white/5 bg-slate-900/40">
                          {/* Browser controls */}
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500/80" />
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80" />
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                          </div>
                          {/* URL address mockup */}
                          <span className="text-[7.5px] font-mono font-bold text-slate-500 truncate max-w-[150px] uppercase tracking-wide">
                            specs.dev/task-{todo.id}
                          </span>
                          <span className="w-1.5 h-1.5" />
                        </div>

                        {/* Interactive mock content depending on Status */}
                        <div className="h-28 p-3 overflow-hidden select-none font-mono text-[8px] leading-tight">
                          {todo.status === 'completed' && (
                            <div className="text-emerald-400 bg-slate-950 p-2.5 rounded border border-white/5 h-full flex flex-col justify-between">
                              <div className="space-y-0.5">
                                <span className="text-slate-500 block">$ ec2-deploy --task-id={todo.id}</span>
                                <span className="block text-emerald-400 font-bold">&gt; COMPILATION: SUCCESS</span>
                                <span className="block text-slate-500 font-medium">&gt; PORT: 8080 | SSL: OK</span>
                              </div>
                              <span className="text-emerald-400 block font-bold text-[7px] text-right mt-1">STATUS: OK</span>
                            </div>
                          )}

                          {todo.status === 'in_progress' && (
                            <div className="text-sky-400 bg-slate-950 p-2.5 rounded border border-white/5 h-full flex flex-col justify-between animate-pulse">
                              <div className="space-y-0.5">
                                <span className="text-slate-500 block">$ npm run test --task={todo.id}</span>
                                <span className="block text-sky-400 font-bold">&gt; COMPILING COMPONENT VIEWS...</span>
                                <span className="block text-slate-500 font-medium">&gt; 18/24 assertions passed</span>
                              </div>
                              <div className="flex justify-between items-center text-[7px] mt-1">
                                <span className="text-sky-400 font-bold">DEPLOYING...</span>
                                <span className="text-slate-500">68%</span>
                              </div>
                            </div>
                          )}

                          {todo.status === 'pending' && (
                            <div className="text-slate-400 bg-slate-950/40 border border-dashed border-white/10 rounded h-full flex flex-col justify-center items-center p-2 text-center">
                              <svg className="w-4 h-4 text-slate-500 stroke-1.5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <span className="font-bold text-[7px] tracking-wide uppercase">Awaiting Schema & Build Configuration</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 2. Card Details Box */}
                      <div className="p-4.5 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          {/* Tags list */}
                          <div className="flex flex-wrap gap-1.5 items-center">
                            <span className="font-mono text-[8.5px] font-bold text-slate-455">
                              #TASK-0{todo.id}
                            </span>
                            <span className={`inline-block rounded px-1.5 py-0.5 text-[8.5px] font-bold border capitalize ${catDetails.bg}`}>
                              {catDetails.label}
                            </span>
                          </div>

                          {/* Title */}
                          <h4 className="text-xs font-bold text-white tracking-tight leading-snug line-clamp-2">
                            {todo.title}
                          </h4>

                          {/* Short Desc */}
                          {todo.description && (
                            <p className="text-[10.5px] text-slate-350 line-clamp-2 leading-relaxed">
                              {todo.description}
                            </p>
                          )}
                        </div>

                        {/* Card Footer Info */}
                        <div className="border-t border-white/5 pt-3 mt-3 flex items-center justify-between">
                          {/* Assignee info */}
                          <div className="flex items-center gap-2">
                            {(() => {
                              const aName = getAssigneeName(todo.user_id);
                              const aImg = getProfileImage(aName);
                              return aImg ? (
                                <img 
                                  src={aImg} 
                                  alt={aName}
                                  className="w-5 h-5 rounded-full object-cover border border-white/10 shrink-0 bg-slate-900"
                                  style={{ objectPosition: (aName.toLowerCase().includes('zaky') || aName.toLowerCase().includes('hafiz')) ? '50% 15%' : 'center' }}
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-[9px] font-mono font-bold text-indigo-300 uppercase shrink-0">
                                  {aName[0]}
                                </div>
                              );
                            })()}
                            <span className="text-[9.5px] font-bold text-slate-400 truncate max-w-[110px]">
                              {getAssigneeName(todo.user_id)}
                            </span>
                          </div>

                          {/* Status label */}
                          <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${todo.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                              : todo.status === 'in_progress'
                                ? 'bg-sky-500/10 text-sky-300 border-sky-500/25 animate-pulse'
                                : 'bg-amber-500/10 text-amber-300 border-amber-500/25'
                            }`}>
                            {todo.status === 'completed' ? 'Done' : todo.status === 'in_progress' ? 'Running' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 3. Sliding Inspect Drawer Panel Overlay (slides in from right) */}
      {selectedTodoId !== null && currentInspectedTodo && (
        <div className="fixed inset-0 z-50 flex justify-end">

          {/* Blur backdrop backing */}
          <div
            onClick={() => {
              setSelectedTodoId(null);
              setIsEditingMode(false);
            }}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm transition-all animate-fade-in-backdrop"
          />

          {/* Drawer content frame */}
          <div className="relative w-full max-w-lg bg-slate-950/90 border-l border-white/10 backdrop-blur-md h-full flex flex-col shadow-2xl z-10 animate-slide-in-right text-white">

            {/* Drawer Header */}
            <div className="h-16 border-b border-white/10 px-6 flex items-center justify-between shrink-0 bg-slate-900/20 z-10">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest bg-slate-900/60 border border-white/10 px-2 py-1 rounded">
                  #TASK-{currentInspectedTodo.id}
                </span>
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Deliverable Specifications
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedTodoId(null);
                  setIsEditingMode(false);
                }}
                className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-colors text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable details wrapper */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Large Chrome Viewport Mock */}
              <div className="w-full bg-slate-950 rounded-xl border border-white/5 overflow-hidden font-mono text-[9px]">
                <div className="h-6 px-3 flex items-center justify-between bg-slate-900 border-b border-white/5">
                  <div className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500/80" />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-[7.5px] text-slate-500 font-bold uppercase tracking-wider">
                    system-telemetry-output-log.sh
                  </span>
                  <span className="w-1.5 h-1.5" />
                </div>
                <div className="p-4 text-[8.5px] text-slate-300 space-y-1">
                  <p className="text-slate-550"># AWS EC2 Cloud Cluster Node Diagnostics</p>
                  <p>Node Name: <span className="text-sky-400">{ownerName || 'Personal Member'}</span></p>
                  <p>Instance: <span className="text-amber-400">aws.ec2.t2.micro</span></p>
                  <p className="pt-2">Task Title: &quot;{currentInspectedTodo.title}&quot;</p>
                  <p>Status: <span className={`font-bold ${currentInspectedTodo.status === 'completed'
                      ? 'text-emerald-400'
                      : currentInspectedTodo.status === 'in_progress'
                        ? 'text-sky-400 animate-pulse'
                        : 'text-yellow-400'
                    }`}>{currentInspectedTodo.status.toUpperCase()}</span></p>

                  <div className="pt-3 border-t border-slate-900 mt-2 text-slate-500 text-[7.5px] space-y-0.5">
                    <p>Created Date: {new Date(currentInspectedTodo.created_at).toLocaleString()}</p>
                    <p>Modified Date: {new Date(currentInspectedTodo.updated_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Editable specs vs view mode */}
              {!isEditingMode ? (
                <div className="space-y-6">
                  {/* Text details */}
                  <div className="space-y-3">
                    <span className={`inline-block rounded px-2 py-0.5 text-[9px] font-extrabold uppercase border ${getCategoryDetails(getTaskCategory(currentInspectedTodo.title, currentInspectedTodo.description)).bg}`}>
                      {getCategoryDetails(getTaskCategory(currentInspectedTodo.title, currentInspectedTodo.description)).label}
                    </span>
                    <h3 className="text-base font-extrabold text-white tracking-tight leading-snug">
                      {currentInspectedTodo.title}
                    </h3>
                    <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4 min-h-[100px]">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description specs</h4>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium break-words">
                        {currentInspectedTodo.description || 'No description tags defined for this deliverable.'}
                      </p>
                    </div>
                  </div>

                  <hr className="border-white/5" />

                  {/* Actions buttons */}
                  {!readOnly && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => startEditing(currentInspectedTodo)}
                        className="flex-1 border border-white/10 bg-slate-900/40 hover:bg-slate-900/80 hover:border-white/20 text-slate-300 hover:text-white rounded-lg py-2.5 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edit Specs
                      </button>
                      <button
                        onClick={() => handleDeleteTodo(currentInspectedTodo.id)}
                        className="flex-1 border border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/30 rounded-lg py-2.5 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Screen
                      </button>
                    </div>
                  )}

                  {/* Status segments switcher inside drawer */}
                  <div className="space-y-2.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Set Execution Status
                    </label>
                    <div className="grid grid-cols-3 border border-white/10 bg-slate-950/60 p-1 rounded-xl gap-1">
                      {(['pending', 'in_progress', 'completed'] as const).map((statusVal) => {
                        const active = currentInspectedTodo.status === statusVal;
                        return (
                          <button
                            key={statusVal}
                            disabled={readOnly || isPending}
                            onClick={(e) => {
                              // Wrap in click simulation to cycle state update
                              startTransition(async () => {
                                try {
                                  await fetch(`/api/todos/${currentInspectedTodo.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      title: currentInspectedTodo.title,
                                      description: currentInspectedTodo.description,
                                      status: statusVal
                                    }),
                                  });
                                  await fetchTodos();
                                  onMutationSuccess?.();
                                } catch (err) {
                                  console.error(err);
                                }
                              });
                            }}
                            className={`py-2 text-[10px] font-bold rounded-lg uppercase tracking-wide transition-all border ${active
                                ? 'bg-indigo-600 text-white shadow-xs border-indigo-500/30'
                                : 'text-slate-400 hover:text-white border-transparent disabled:opacity-50 hover:bg-white/5'
                              } ${!readOnly ? 'cursor-pointer' : 'cursor-default'}`}
                          >
                            {statusVal === 'in_progress' ? 'Running' : statusVal === 'completed' ? 'Done' : 'Pending'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* Edit details Form mode */
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Title Deliverable
                    </label>
                    <input
                      type="text"
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      disabled={isPending}
                      className="block w-full rounded-lg border border-white/10 bg-slate-950/80 px-3.5 py-2 text-xs font-bold text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Description details
                    </label>
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      disabled={isPending}
                      rows={4}
                      className="block w-full rounded-lg border border-white/10 bg-slate-950/80 px-3.5 py-2 text-xs text-slate-300 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none font-medium leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Category Module
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as any)}
                      disabled={isPending}
                      className="block w-full rounded-lg border border-white/10 bg-slate-955/80 px-3.5 py-2 text-xs font-bold text-white outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="general">General Task</option>
                      <option value="devops">DevOps / AWS</option>
                      <option value="database">Database SQL</option>
                      <option value="frontend">Frontend UI</option>
                      <option value="backend">Backend API</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Build Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      disabled={isPending}
                      className="block w-full rounded-lg border border-white/10 bg-slate-950/80 px-3.5 py-2 text-xs font-bold text-white outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="pending">Pending Configuration</option>
                      <option value="in_progress">Running Development</option>
                      <option value="completed">Completed / Implemented</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditingMode(false)}
                      disabled={isPending}
                      className="flex-1 px-4 py-2 border border-white/10 bg-slate-900/40 text-slate-400 rounded-lg text-xs font-bold hover:text-white cursor-pointer hover:bg-slate-900/80"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPending || !editTitle.trim()}
                      className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-505 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              )}

            </div>

            {/* Drawer Flow Navigator Carousel */}
            <div className="h-14 border-t border-white/10 px-6 flex items-center justify-between bg-slate-900/20 shrink-0">
              <button
                onClick={() => navigateInspected('prev')}
                className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                ◀ Prev Screen
              </button>

              <span className="text-[9px] font-bold text-slate-400 font-mono">
                SCREEN {inspectedIndex + 1} OF {sortedTodos.length}
              </span>

              <button
                onClick={() => navigateInspected('next')}
                className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                Next Screen ▶
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 4. Sliding Modal: Log/Create New Task */}
      {isCreatingInline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsCreatingInline(false)}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm animate-fade-in-backdrop"
          />
          <div className="w-full max-w-md bg-slate-900 border border-white/10 shadow-2xl rounded-xl p-6 relative z-10 animate-scale-in space-y-4 text-white">
            <div>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-tight">Log Deliverable Screen</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Setup database or build checklist step</p>
            </div>

            <form onSubmit={handleCreateTodo} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Redesign User Dashboard page"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs font-bold text-white outline-none focus:border-indigo-500 placeholder-slate-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  placeholder="Describe details, parameters, or specifications..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-355 outline-none focus:border-indigo-500 placeholder-slate-500 resize-none font-medium leading-relaxed"
                />
              </div>

              <div className="space-y-1 relative">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Category Module</label>
                <div 
                  className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs font-bold text-white cursor-pointer hover:border-indigo-500/50 transition-colors flex justify-between items-center select-none"
                  onClick={() => { setIsCategoryDropdownOpen(!isCategoryDropdownOpen); setIsAssigneeDropdownOpen(false); }}
                >
                  <span>
                    {newCategory === 'general' ? 'General Task' : 
                     newCategory === 'devops' ? 'DevOps / AWS' : 
                     newCategory === 'database' ? 'Database SQL' : 
                     newCategory === 'frontend' ? 'Frontend UI' : 'Backend API'}
                  </span>
                  <svg className={`w-4 h-4 text-slate-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {isCategoryDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-full bg-slate-800 border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50 py-1">
                    {[
                      { value: 'general', label: 'General Task' },
                      { value: 'devops', label: 'DevOps / AWS' },
                      { value: 'database', label: 'Database SQL' },
                      { value: 'frontend', label: 'Frontend UI' },
                      { value: 'backend', label: 'Backend API' }
                    ].map(cat => (
                      <div 
                        key={cat.value} 
                        className="px-3 py-2 text-xs font-bold text-white hover:bg-slate-700/50 cursor-pointer transition-colors"
                        onClick={() => { setNewCategory(cat.value as CategoryTag); setIsCategoryDropdownOpen(false); }}
                      >
                        {cat.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1 relative">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Assign To Member</label>
                <div 
                  className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 flex justify-between items-center cursor-pointer hover:border-indigo-500/50 transition-colors select-none"
                  onClick={() => { setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen); setIsCategoryDropdownOpen(false); }}
                >
                  <div className="flex items-center gap-3">
                    {(() => {
                       const members = [
                         { id: 2, name: 'Zaky' }, { id: 3, name: 'Hafiz' }, 
                         { id: 4, name: 'Haris' }, { id: 5, name: 'Djordhi' }, { id: 6, name: 'Farid' }
                       ];
                       const selName = members.find(m => m.id === newAssigneeId)?.name || 'Admin';
                       const img = getProfileImage(selName);
                       return img ? (
                         <img 
                            src={img} 
                            className="w-8 h-6 rounded border border-white/10 object-cover" 
                            style={{ objectPosition: (selName.toLowerCase().includes('zaky') || selName.toLowerCase().includes('hafiz')) ? '50% 15%' : 'center' }}
                            alt={selName} 
                         />
                       ) : (
                         <div className="w-8 h-6 rounded bg-indigo-600 text-white text-[9px] flex items-center justify-center font-bold border border-white/10">{selName.slice(0,2).toUpperCase()}</div>
                       );
                    })()}
                    <span className="text-xs font-bold text-white">
                      {[
                         { id: 2, name: 'Muhammad Zaky Ryan Ardhiansyah' }, 
                         { id: 3, name: 'Muhammad Hafiz Nur Irawan' }, 
                         { id: 4, name: 'Muhammad Haris Caisariyanto' }, 
                         { id: 5, name: 'Michail Djordhi' }, 
                         { id: 6, name: 'Farid Munadhil' }
                      ].find(m => m.id === newAssigneeId)?.name || 'Admin'}
                    </span>
                  </div>
                  <svg className={`w-4 h-4 text-slate-400 transition-transform ${isAssigneeDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                {isAssigneeDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-full bg-slate-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                    {[
                      { id: 2, name: 'Muhammad Zaky Ryan Ardhiansyah', shortName: 'Zaky' },
                      { id: 3, name: 'Muhammad Hafiz Nur Irawan', shortName: 'Hafiz' },
                      { id: 4, name: 'Muhammad Haris Caisariyanto', shortName: 'Haris' },
                      { id: 5, name: 'Michail Djordhi', shortName: 'Djordhi' },
                      { id: 6, name: 'Farid Munadhil', shortName: 'Farid' }
                    ].map(member => (
                      <div 
                        key={member.id} 
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700/50 cursor-pointer transition-colors border-b border-white/5 last:border-0"
                        onClick={() => { setNewAssigneeId(member.id); setIsAssigneeDropdownOpen(false); }}
                      >
                        {getProfileImage(member.shortName) ? (
                          <div className="w-10 h-7 rounded bg-slate-900 border border-white/10 shrink-0 overflow-hidden">
                            <img 
                              src={getProfileImage(member.shortName)!} 
                              className="w-full h-full object-cover" 
                              style={{ objectPosition: (member.shortName.toLowerCase().includes('zaky') || member.shortName.toLowerCase().includes('hafiz')) ? '50% 15%' : 'center' }}
                              alt={member.name} 
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-7 rounded bg-indigo-600 border border-white/10 shrink-0 flex items-center justify-center text-white text-[10px] font-bold">
                            {member.shortName.slice(0,2).toUpperCase()}
                          </div>
                        )}
                        <span className="text-[11px] font-bold text-white truncate">{member.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingInline(false)}
                  className="flex-1 px-4 py-2 border border-white/10 bg-slate-900/40 text-slate-400 rounded-lg text-xs font-bold hover:text-white cursor-pointer hover:bg-slate-900/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !newTitle.trim()}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-505 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Confirm Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Mobile Filters Slide-over sheet */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            onClick={() => setIsMobileFiltersOpen(false)}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm animate-fade-in-backdrop"
          />
          <div className="relative w-64 bg-slate-900 border-l border-white/10 h-full flex flex-col justify-between p-6 shadow-2xl z-10 animate-slide-in-right text-white">
            <div className="space-y-6 overflow-y-auto pr-1">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Configure Filters</h3>
                <button onClick={() => setIsMobileFiltersOpen(false)} className="text-slate-400 hover:text-white text-sm cursor-pointer">✕</button>
              </div>

              {/* Status */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter by Status</h4>
                <div className="space-y-2 text-xs font-bold text-slate-300">
                  {Object.keys(statusFilter).map((status) => (
                    <label key={status} className="flex items-center gap-2 cursor-pointer capitalize">
                      <input
                        type="checkbox"
                        checked={statusFilter[status]}
                        onChange={(e) =>
                          setStatusFilter((prev) => ({ ...prev, [status]: e.target.checked }))
                        }
                        className="h-3.5 w-3.5 rounded border-white/10 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{status === 'in_progress' ? 'Running' : status === 'completed' ? 'Completed' : 'Pending'}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category Modules</h4>
                <div className="space-y-2 text-xs font-bold text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={categoryFilter.all}
                      onChange={(e) =>
                        setCategoryFilter((prev) => ({
                          ...prev,
                          all: e.target.checked,
                          devops: e.target.checked,
                          database: e.target.checked,
                          frontend: e.target.checked,
                          backend: e.target.checked,
                          general: e.target.checked,
                        }))
                      }
                      className="h-3.5 w-3.5 rounded border-white/10 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>All Categories</span>
                  </label>
                  {(['devops', 'database', 'frontend', 'backend', 'general'] as CategoryTag[]).map((cat) => (
                    <label key={cat} className="flex items-center gap-2 cursor-pointer capitalize ml-2">
                      <input
                        type="checkbox"
                        checked={categoryFilter.all ? true : categoryFilter[cat]}
                        disabled={categoryFilter.all}
                        onChange={(e) =>
                          setCategoryFilter((prev) => ({ ...prev, [cat]: e.target.checked }))
                        }
                        className="h-3.5 w-3.5 rounded border-white/10 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{cat === 'devops' ? 'DevOps' : cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Assignee */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter by Assignee</h4>
                <div className="space-y-2 text-xs font-bold text-slate-300">
                  {([{id: 2, name: 'Zaky'}, {id: 3, name: 'Hafiz'}, {id: 4, name: 'Haris'}, {id: 5, name: 'Djordhi'}, {id: 6, name: 'Farid'}] as const).map((member) => (
                    <label key={member.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={assigneeFilter[member.id]}
                        onChange={(e) =>
                          setAssigneeFilter((prev) => ({ ...prev, [member.id]: e.target.checked }))
                        }
                        className="h-3.5 w-3.5 rounded border-white/10 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{member.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort Order */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sorting Order</h4>
                <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-950/60 border border-white/5">
                  {([
                    { value: 'newest' as SortOrder, label: 'Newest', icon: '↓' },
                    { value: 'oldest' as SortOrder, label: 'Oldest', icon: '↑' },
                    { value: 'alphabetical' as SortOrder, label: 'A – Z', icon: '⇅' },
                  ]).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSortOrder(opt.value)}
                      className={`flex flex-col items-center gap-0.5 rounded-md py-2 px-1 text-[9px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer touch-manipulation ${
                        sortOrder === opt.value
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className="text-[11px] leading-none">{opt.icon}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="w-full border border-white/10 text-slate-400 rounded-lg py-2 text-xs font-bold hover:text-white hover:bg-white/5 cursor-pointer"
              >
                Close Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Notifications */}
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
