'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Todo, createTodoAction, updateTodoAction, deleteTodoAction } from '@/app/actions/todos';

interface TodoListProps {
  initialTodos: Todo[];
  readOnly?: boolean;
  ownerName?: string;
}

type FilterStatus = 'all' | 'pending' | 'in_progress' | 'completed';

export default function TodoList({ initialTodos, readOnly = false, ownerName }: TodoListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<FilterStatus>('all');
  
  // Form state for creating a new todo
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [showDescInput, setShowDescInput] = useState(false);

  // Modal state for editing a todo
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter logic
  const filteredTodos = initialTodos.filter((todo) => {
    if (filter === 'all') return true;
    return todo.status === filter;
  });

  // Task count calculations
  const totalCount = initialTodos.length;
  const completedCount = initialTodos.filter((t) => t.status === 'completed').length;
  const inProgressCount = initialTodos.filter((t) => t.status === 'in_progress').length;
  const pendingCount = initialTodos.filter((t) => t.status === 'pending').length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Handle Create
  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setErrorMessage(null);

    startTransition(async () => {
      const res = await createTodoAction(newTitle, newDesc);
      if (res.success) {
        setNewTitle('');
        setNewDesc('');
        setShowDescInput(false);
        router.refresh();
      } else {
        setErrorMessage(res.error || 'Failed to create task.');
      }
    });
  };

  // Handle Toggle Checkbox (Status switch between completed and pending)
  const handleToggleComplete = async (todo: Todo) => {
    const nextStatus = todo.status === 'completed' ? 'pending' : 'completed';
    startTransition(async () => {
      const res = await updateTodoAction(todo.id, todo.title, todo.description, nextStatus);
      if (res.success) {
        router.refresh();
      } else {
        setErrorMessage(res.error || 'Failed to update task.');
      }
    });
  };

  // Handle Cycle Status Badge (pending -> in_progress -> completed -> pending)
  const handleCycleStatus = async (todo: Todo) => {
    let nextStatus: 'pending' | 'in_progress' | 'completed' = 'pending';
    if (todo.status === 'pending') nextStatus = 'in_progress';
    else if (todo.status === 'in_progress') nextStatus = 'completed';

    startTransition(async () => {
      const res = await updateTodoAction(todo.id, todo.title, todo.description, nextStatus);
      if (res.success) {
        router.refresh();
      } else {
        setErrorMessage(res.error || 'Failed to update task.');
      }
    });
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTodo || !editTitle.trim()) return;

    startTransition(async () => {
      const res = await updateTodoAction(editingTodo.id, editTitle, editDesc, editStatus);
      if (res.success) {
        setEditingTodo(null);
        router.refresh();
      } else {
        setErrorMessage(res.error || 'Failed to save task edits.');
      }
    });
  };

  // Open Edit Modal
  const openEditModal = (todo: Todo) => {
    setEditingTodo(todo);
    setEditTitle(todo.title);
    setEditDesc(todo.description || '');
    setEditStatus(todo.status);
  };

  // Handle Delete
  const handleDeleteTodo = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    startTransition(async () => {
      const res = await deleteTodoAction(id);
      if (res.success) {
        router.refresh();
      } else {
        setErrorMessage(res.error || 'Failed to delete task.');
      }
    });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl transition-all duration-300">
      {/* Glow background effect */}
      <div className="absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      {/* Header and Progress Metrics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              {ownerName ? `${ownerName}'s Tasks` : 'My Tasks'}
            </h2>
            <p className="text-xs text-slate-400">
              {readOnly ? 'Monitoring team member deliverables' : 'Manage your project deliverables'}
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
            {completedCount}/{totalCount} Completed
          </span>
        </div>

        {totalCount > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-400">
              <span>Progress Bar</span>
              <span>{completionPercentage}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500 ease-out"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400 flex items-center justify-between">
          <span className="font-medium">{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Create Todo Form */}
      {!readOnly && (
        <form onSubmit={handleCreateTodo} className="mt-6 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              required
              placeholder="What needs to be done?"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              disabled={isPending}
              className="flex-1 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/40 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowDescInput(!showDescInput)}
              className={`rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                showDescInput
                  ? 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                  : 'border-white/10 bg-slate-950/40 text-slate-400 hover:bg-white/5'
              }`}
            >
              Details
            </button>
            <button
              type="submit"
              disabled={isPending || !newTitle.trim()}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 px-4 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none shadow-md"
            >
              Add
            </button>
          </div>

          {/* Collapsible Description Input */}
          {showDescInput && (
            <textarea
              placeholder="Add some details or description (optional)..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              disabled={isPending}
              rows={2}
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/40 disabled:opacity-50 resize-none"
            />
          )}
        </form>
      )}

      {/* Filter Tabs */}
      <div className="mt-6 flex border-b border-white/5 pb-2 overflow-x-auto gap-1">
        {[
          { id: 'all', label: 'All', count: totalCount },
          { id: 'pending', label: 'Not Started', count: pendingCount },
          { id: 'in_progress', label: 'In Progress', count: inProgressCount },
          { id: 'completed', label: 'Completed', count: completedCount },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as FilterStatus)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${
              filter === tab.id
                ? 'bg-white/5 text-white shadow-sm border border-white/10'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
              filter === tab.id ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-950 text-slate-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="mt-4 space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
        {filteredTodos.length === 0 ? (
          <div className="py-10 text-center rounded-xl border border-dashed border-white/5 bg-slate-950/10">
            <svg
              className="mx-auto h-8 w-8 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            <p className="mt-2 text-xs font-medium text-slate-500">No tasks found</p>
          </div>
        ) : (
          filteredTodos.map((todo) => (
            <div
              key={todo.id}
              className={`group relative flex items-start gap-3 rounded-xl border p-3.5 transition-all duration-200 ${
                todo.status === 'completed'
                  ? 'border-emerald-500/10 bg-emerald-500/[0.01] opacity-75 hover:opacity-100'
                  : 'border-white/5 bg-slate-950/20 hover:border-white/10 hover:bg-slate-950/40'
              }`}
            >
              {/* Checkbox */}
              <button
                type="button"
                onClick={() => !readOnly && handleToggleComplete(todo)}
                disabled={isPending || readOnly}
                className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border transition-all ${
                  todo.status === 'completed'
                    ? 'border-emerald-500 bg-emerald-500 text-slate-950 shadow shadow-emerald-500/20'
                    : 'border-white/20 bg-slate-900' + (readOnly ? '' : ' group-hover:border-blue-500/50 cursor-pointer')
                }`}
              >
                {todo.status === 'completed' && (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              {/* Title & Desc */}
              <div className="flex-1 min-w-0">
                <h4
                  className={`text-sm font-semibold tracking-tight break-words transition-all ${
                    todo.status === 'completed'
                      ? 'text-slate-400 line-through decoration-slate-600'
                      : 'text-white'
                  }`}
                >
                  {todo.title}
                </h4>
                {todo.description && (
                  <p className="mt-0.5 text-xs text-slate-400 break-words leading-relaxed">
                    {todo.description}
                  </p>
                )}
              </div>

              {/* Actions & Badge */}
              <div className="flex items-center gap-2">
                {/* Status Cycle Badge */}
                {readOnly ? (
                  <span
                    className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium border ${
                      todo.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : todo.status === 'in_progress'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}
                  >
                    {todo.status === 'completed'
                      ? 'Selesai'
                      : todo.status === 'in_progress'
                      ? 'In Progress'
                      : 'Not Started'}
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCycleStatus(todo)}
                      disabled={isPending}
                      className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium transition-all active:scale-[0.98] border ${
                        todo.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : todo.status === 'in_progress'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}
                    >
                      {todo.status === 'completed'
                        ? 'Selesai'
                        : todo.status === 'in_progress'
                        ? 'In Progress'
                        : 'Not Started'}
                    </button>

                    {/* Edit Action Button */}
                    <button
                      type="button"
                      onClick={() => openEditModal(todo)}
                      disabled={isPending}
                      className="rounded-lg p-1 text-slate-500 hover:bg-white/5 hover:text-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>

                    {/* Delete Action Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteTodo(todo.id)}
                      disabled={isPending}
                      className="rounded-lg p-1 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Todo Modal */}
      {editingTodo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">Edit Task</h3>
              <p className="text-xs text-slate-400">Update task details and completion status</p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  disabled={isPending}
                  className="block w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500/80"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  disabled={isPending}
                  rows={3}
                  className="block w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500/80 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'pending' | 'in_progress' | 'completed')}
                  disabled={isPending}
                  className="block w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none transition-all focus:border-blue-500/80"
                >
                  <option value="pending">Not Started (Belum Mulai)</option>
                  <option value="in_progress">In Progress (Sedang Mengerjakan)</option>
                  <option value="completed">Completed (Selesai)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTodo(null)}
                  disabled={isPending}
                  className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2.5 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !editTitle.trim()}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 px-4 py-2.5 text-xs font-semibold text-white transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
