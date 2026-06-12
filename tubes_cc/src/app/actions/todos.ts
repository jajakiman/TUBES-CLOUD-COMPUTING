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
 * Fetch all todos for the current logged-in user.
 */
export async function getTodosAction(): Promise<Todo[]> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const rows = await query<TodoRow[]>(
      'SELECT id, user_id, title, description, status, created_at, updated_at FROM todos WHERE user_id = ? ORDER BY created_at DESC',
      [user.id]
    );

    return rows.map((row) => ({
      id: Number(row.id),
      user_id: Number(row.user_id),
      title: String(row.title),
      description: row.description ? String(row.description) : null,
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
  description?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return { success: false, error: 'Title is required' };
    }

    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    await query(
      'INSERT INTO todos (user_id, title, description, status) VALUES (?, ?, ?, ?)',
      [user.id, title.trim(), description?.trim() || null, 'in_progress']
    );

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error in createTodoAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create task' };
  }
}

/**
 * Update an existing todo.
 */
export async function updateTodoAction(
  id: number,
  title: string,
  description: string | null,
  status: 'pending' | 'in_progress' | 'completed'
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return { success: false, error: 'Title is required' };
    }

    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Security: check that the todo belongs to the user
    const check = await query<TodoRow[]>(
      'SELECT id FROM todos WHERE id = ? AND user_id = ? LIMIT 1',
      [id, user.id]
    );

    if (check.length === 0) {
      return { success: false, error: 'Task not found or permission denied' };
    }

    await query(
      'UPDATE todos SET title = ?, description = ?, status = ? WHERE id = ?',
      [title.trim(), description?.trim() || null, status, id]
    );

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error in updateTodoAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update task' };
  }
}

/**
 * Delete a todo.
 */
export async function deleteTodoAction(
  id: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Security: check that the todo belongs to the user
    const check = await query<TodoRow[]>(
      'SELECT id FROM todos WHERE id = ? AND user_id = ? LIMIT 1',
      [id, user.id]
    );

    if (check.length === 0) {
      return { success: false, error: 'Task not found or permission denied' };
    }

    await query('DELETE FROM todos WHERE id = ?', [id]);

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error in deleteTodoAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete task' };
  }
}

interface MemberUserRow extends mysql.RowDataPacket {
  user_id: number | null;
}

/**
 * Fetch todos for a specific member (Admin only)
 */
export async function getMemberTodosAction(
  memberId: number
): Promise<Todo[]> {
  try {
    const user = await getCurrentUser();
    if (!user || user.username !== 'admin') {
      throw new Error('Unauthorized. Admin access only.');
    }

    // Get the user_id associated with the member
    const memberRows = await query<MemberUserRow[]>(
      'SELECT user_id FROM members WHERE id = ? LIMIT 1',
      [memberId]
    );

    if (memberRows.length === 0 || !memberRows[0].user_id) {
      return [];
    }

    const targetUserId = memberRows[0].user_id;

    const rows = await query<TodoRow[]>(
      'SELECT id, user_id, title, description, status, created_at, updated_at FROM todos WHERE user_id = ? ORDER BY created_at DESC',
      [targetUserId]
    );

    return rows.map((row) => ({
      id: Number(row.id),
      user_id: Number(row.user_id),
      title: String(row.title),
      description: row.description ? String(row.description) : null,
      status: row.status as 'pending' | 'in_progress' | 'completed',
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    }));
  } catch (error) {
    console.error('Error in getMemberTodosAction:', error);
    return [];
  }
}

