'use server';

import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import mysql from 'mysql2/promise';

interface UserRow extends mysql.RowDataPacket {
  id: number;
  username: string;
}

export interface LoginResult {
  success: boolean;
  error?: string;
}

/**
 * Server Action for authenticating users.
 * Performs a parameterized SQL query against the users table.
 */
export async function loginAction(formData: FormData): Promise<LoginResult> {
  try {
    const username = formData.get('username');
    const password = formData.get('password');

    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return { success: false, error: 'Username and password are required fields.' };
    }

    // Parameterized SQL query to prevent SQL Injection
    const rows = await query<UserRow[]>(
      'SELECT id, username FROM users WHERE username = ? AND password = ? LIMIT 1',
      [username, password]
    );

    if (rows.length === 0) {
      return { success: false, error: 'Invalid username or password.' };
    }

    const user = rows[0];

    // Establish stateless cookie session (Next.js 15/16 async cookies)
    const cookieStore = await cookies();
    cookieStore.set('session_user', user.username, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day session duration
      path: '/',
    });

    return { success: true };
  } catch (error: any) {
    console.error('Database connection error in loginAction:', error);
    return {
      success: false,
      error: 'An internal server error occurred. Please verify your database connection.',
    };
  }
}

/**
 * Helper Server Action to clear the session.
 */
export async function logoutAction(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session_user');
  } catch (error) {
    console.error('Error during logout action:', error);
  }
}
