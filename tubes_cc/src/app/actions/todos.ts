'use server';

import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import mysql from 'mysql2/promise';

export interface Todo {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  category?: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

interface UserRow extends mysql.RowDataPacket {
  id: number;
  username: string;
}

interface TodoRow extends mysql.RowDataPacket {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  category: string;
  status: string;
  created_at: string | Date;
  updated_at: string | Date;
}

/**
 * Helper to fetch the currently authenticated user from the database
 * based on the session_user cookie.
 */
export async function getCurrentUser(): Promise<UserRow | null> {
  try {
    const cookieStore = await cookies();
    const username = cookieStore.get('session_user')?.value;

    if (!username) return null;

    const rows = await query<UserRow[]>(
      'SELECT id, username FROM users WHERE username = ? LIMIT 1',
      [username]
    );

    if (rows.length === 0) return null;
    return rows[0];
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

/**
 * Fetch all todos for the entire team (collaborative workspace).
 */
export async function getTodosAction(): Promise<Todo[]> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Team-wide: fetch ALL todos, not just the current user's
    const rows = await query<TodoRow[]>(
      'SELECT id, user_id, title, description, category, status, created_at, updated_at FROM todos ORDER BY created_at DESC'
    );

    return rows.map((row) => ({
      id: Number(row.id),
      user_id: Number(row.user_id),
      title: String(row.title),
      description: row.description ? String(row.description) : null,
      category: row.category ? String(row.category) : 'general',
      status: row.status as 'pending' | 'in_progress' | 'completed',
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    }));
  } catch (error) {
    console.error('Error in getTodosAction:', error);
    return [];
  }
}

/**
 * Create a new todo for the current user.
 */
export async function createTodoAction(
  title: string,
  description?: string,
  category?: string,
  assignedUserId?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return { success: false, error: 'Title is required' };
    }

    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const targetUserId = assignedUserId ? Number(assignedUserId) : user.id;
    const targetCategory = category || 'general';

    await query(
      'INSERT INTO todos (user_id, title, description, status, category) VALUES (?, ?, ?, ?, ?)',
      [targetUserId, title.trim(), description?.trim() || null, 'pending', targetCategory]
    );

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error in createTodoAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create task' };
  }
}

/**
 * Update an existing todo (team-collaborative: any authenticated member can update).
 */
export async function updateTodoAction(
  id: number,
  title: string,
  description: string | null,
  status: 'pending' | 'in_progress' | 'completed',
  category?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return { success: false, error: 'Title is required' };
    }

    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Team-collaborative: verify the todo exists (no per-user ownership check)
    const check = await query<TodoRow[]>(
      'SELECT id FROM todos WHERE id = ? LIMIT 1',
      [id]
    );

    if (check.length === 0) {
      return { success: false, error: 'Task not found' };
    }

    await query(
      'UPDATE todos SET title = ?, description = ?, status = ?, category = ? WHERE id = ?',
      [title.trim(), description?.trim() || null, status, category || 'general', id]
    );

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error in updateTodoAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update task' };
  }
}

/**
 * Delete a todo (team-collaborative: any authenticated member can delete).
 */
export async function deleteTodoAction(
  id: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Team-collaborative: verify the todo exists (no per-user ownership check)
    const check = await query<TodoRow[]>(
      'SELECT id FROM todos WHERE id = ? LIMIT 1',
      [id]
    );

    if (check.length === 0) {
      return { success: false, error: 'Task not found' };
    }

    await query('DELETE FROM todos WHERE id = ?', [id]);

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error in deleteTodoAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete task' };
  }
}

