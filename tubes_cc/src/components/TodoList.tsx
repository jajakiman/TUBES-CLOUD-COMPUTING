'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Todo } from '@/app/actions/todos';
import Toast from './Toast';

interface TodoListProps {
  initialTodos: Todo[];
  readOnly?: boolean;
  ownerName?: string;
  onMutationSuccess?: () => void;
}

type FilterStatus = 'all' | 'pending' | 'in_progress' | 'completed';

export default function TodoList({ initialTodos, readOnly = false, ownerName, onMutationSuccess }: TodoListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    setTodos(initialTodos);
  }, [initialTodos]);

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

  // Fetch all todos from the API microservice
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

  // Filter logic
  const filteredTodos = todos.filter((todo) => {
    if (filter === 'all') return true;
    return todo.status === filter;
  });

  // Task count calculations
  const totalCount = todos.length;
  const completedCount = todos.filter((t) => t.status === 'completed').length;
  const inProgressCount = todos.filter((t) => t.status === 'in_progress').length;
  const pendingCount = todos.filter((t) => t.status === 'pending').length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Handle Create
  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const res = await fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTitle, description: newDesc }),
        });
        const data = await res.json();
        if (data.success) {
          setNewTitle('');
          setNewDesc('');
          setShowDescInput(false);
          await fetchTodos();
          setToast({ message: 'Task created successfully!', type: 'success' });
          onMutationSuccess?.();
        } else {
          setErrorMessage(data.error || 'Failed to create task.');
        }
      } catch (err) {
        setErrorMessage('Failed to connect to the task service.');
      }
    });
  };

  // Handle Toggle Checkbox (Status switch between completed and pending)
  const handleToggleComplete = async (todo: Todo) => {
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
          setToast({ message: 'Task status updated!', type: 'success' });
          onMutationSuccess?.();
        } else {
          setErrorMessage(data.error || 'Failed to update task.');
        }
      } catch (err) {
        setErrorMessage('Failed to connect to the task service.');
      }
    });
  };

  // Handle Cycle Status Badge (pending -> in_progress -> completed -> pending)
  const handleCycleStatus = async (todo: Todo) => {
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
          setToast({ message: 'Task status updated!', type: 'success' });
          onMutationSuccess?.();
        } else {
          setErrorMessage(data.error || 'Failed to update task.');
        }
      } catch (err) {
        setErrorMessage('Failed to connect to the task service.');
      }
    });
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTodo || !editTitle.trim()) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/todos/${editingTodo.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: editTitle, description: editDesc, status: editStatus }),
        });
        const data = await res.json();
        if (data.success) {
          setEditingTodo(null);
          await fetchTodos();
          setToast({ message: 'Task changes saved successfully!', type: 'success' });
          onMutationSuccess?.();
        } else {
          setErrorMessage(data.error || 'Failed to save task edits.');
        }
      } catch (err) {
        setErrorMessage('Failed to connect to the task service.');
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
      try {
        const res = await fetch(`/api/todos/${id}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (data.success) {
          await fetchTodos();
          setToast({ message: 'Task deleted successfully!', type: 'success' });
          onMutationSuccess?.();
        } else {
          setErrorMessage(data.error || 'Failed to delete task.');
        }
      } catch (err) {
        setErrorMessage('Failed to connect to the task service.');
      }
    });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300">
      {/* Header and Progress Metrics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
              {ownerName ? `${ownerName}'s Tasks` : 'My Tasks'}
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              {readOnly ? 'Monitoring team member deliverables' : 'Manage your project deliverables'}
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-650 bg-indigo-50 px-2.5 py-1.5 rounded-xl border border-indigo-100 shadow-sm leading-none">
            {completedCount}/{totalCount} Completed
          </span>
        </div>

        {totalCount > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Progress Bar</span>
              <span>{completionPercentage}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200/20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-all duration-500 ease-out"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-center justify-between">
          <span className="font-semibold">{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700 font-extrabold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Create Todo Form */}
      {!readOnly && (
        <form onSubmit={handleCreateTodo} className="mt-6 space-y-3">
          <div className="flex gap-2.5">
            <input
              type="text"
              required
              placeholder="What needs to be done?"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              disabled={isPending}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-300 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowDescInput(!showDescInput)}
              className={`rounded-xl border px-3.5 py-2.5 text-xs font-bold transition-all duration-300 cursor-pointer ${
                showDescInput
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-650'
                  : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              Details
            </button>
            <button
              type="submit"
              disabled={isPending || !newTitle.trim()}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-500 hover:opacity-95 px-4.5 py-2.5 text-sm font-bold text-white transition-all duration-300 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none shadow-sm shadow-indigo-100/50 cursor-pointer"
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all duration-300 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:opacity-50 resize-none"
            />
          )}
        </form>
      )}

      {/* Filter Tabs */}
      <div className="mt-6 flex border-b border-slate-100 pb-2.5 overflow-x-auto gap-1">
        {[
          { id: 'all', label: 'All', count: totalCount },
          { id: 'pending', label: 'Not Started', count: pendingCount },
          { id: 'in_progress', label: 'In Progress', count: inProgressCount },
          { id: 'completed', label: 'Completed', count: completedCount },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as FilterStatus)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer duration-300 ${
              filter === tab.id
                ? 'bg-indigo-50 text-indigo-650 border-indigo-200/80 shadow-sm shadow-indigo-100/20'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-transparent'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-colors ${
              filter === tab.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="mt-4 space-y-3 max-h-[360px] overflow-y-auto pr-1">
        {filteredTodos.length === 0 ? (
          <div className="py-10 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
            <svg
              className="mx-auto h-8 w-8 text-slate-350"
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
            <p className="mt-2 text-xs font-bold text-slate-400">No tasks found</p>
          </div>
        ) : (
          filteredTodos.map((todo) => (
            <div
              key={todo.id}
              className={`group relative flex items-start gap-3.5 rounded-xl border p-4.5 transition-all duration-300 animate-scale-in hover:-translate-y-1 hover:shadow-premium ${
                todo.status === 'completed'
                  ? 'border-emerald-100 bg-emerald-50/20 opacity-90'
                  : 'border-slate-200 bg-white hover:border-slate-350'
              }`}
            >
              {/* Checkbox */}
              <button
                type="button"
                onClick={() => !readOnly && handleToggleComplete(todo)}
                disabled={isPending || readOnly}
                className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                  todo.status === 'completed'
                    ? 'border-emerald-500 bg-emerald-500 text-white shadow shadow-emerald-500/20 cursor-pointer'
                    : 'border-slate-300 bg-white' + (readOnly ? '' : ' group-hover:border-indigo-500/50 cursor-pointer')
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
                  className={`text-sm font-bold tracking-tight break-words transition-all duration-300 ${
                    todo.status === 'completed'
                      ? 'text-slate-400 line-through decoration-slate-300'
                      : 'text-slate-800'
                  }`}
                >
                  {todo.title}
                </h4>
                {todo.description && (
                  <p className="mt-1 text-xs text-slate-500 break-words leading-relaxed font-medium">
                    {todo.description}
                  </p>
                )}
              </div>

              {/* Actions & Badge */}
              <div className="flex items-center gap-2">
                {/* Status Cycle Badge */}
                {readOnly ? (
                  <span
                    className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-extrabold border ${
                      todo.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : todo.status === 'in_progress'
                        ? 'bg-amber-50 text-amber-700 border-amber-105'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {todo.status === 'completed'
                      ? 'COMPLETED'
                      : todo.status === 'in_progress'
                      ? 'IN PROGRESS'
                      : 'NOT STARTED'}
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCycleStatus(todo)}
                      disabled={isPending}
                      className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-extrabold transition-all active:scale-[0.98] border cursor-pointer ${
                        todo.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : todo.status === 'in_progress'
                          ? 'bg-amber-50 text-amber-700 border-amber-105'
                          : 'bg-slate-100 text-slate-650 border-slate-200 hover:bg-slate-200/50'
                      }`}
                    >
                      {todo.status === 'completed'
                        ? 'COMPLETED'
                        : todo.status === 'in_progress'
                        ? 'IN PROGRESS'
                        : 'NOT STARTED'}
                    </button>

                    {/* Edit Action Button */}
                    <button
                      type="button"
                      onClick={() => openEditModal(todo)}
                      disabled={isPending}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
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
                      className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
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

      {!readOnly && (
        <div className="mt-8 pt-6 border-t border-slate-100 text-center flex flex-col items-center justify-center">
          <svg className="h-6 w-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">Add more infrastructure tasks</span>
        </div>
      )}

      {/* Edit Todo Modal */}
      {editingTodo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-scale-in">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Edit Task</h3>
              <p className="text-xs text-slate-500">Update task details and completion status</p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  disabled={isPending}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-indigo-650 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  disabled={isPending}
                  rows={3}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-indigo-650 focus:bg-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'pending' | 'in_progress' | 'completed')}
                  disabled={isPending}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-indigo-650 focus:bg-white"
                >
                  <option value="pending">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTodo(null)}
                  disabled={isPending}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !editTitle.trim()}
                  className="rounded-xl bg-gradient-to-r from-indigo-650 to-emerald-650 px-4 py-2.5 text-xs font-bold text-white transition-all hover:opacity-95 cursor-pointer shadow-sm shadow-indigo-100"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Toast */}
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
