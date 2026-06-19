'use server';

import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
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

    // 🚀 TAMBAHAN: Otomatis melempar user ke halaman utama setelah login sukses
    // Ganti '/dashboard' di bawah ini jika rute utama kelompokmu menggunakan nama lain (misal: '/home' or '/admin')
    redirect('/dashboard/user');

    return { success: true };
  } catch (error: any) {
    // INFO: Next.js 'redirect' secara teknis melempar error internal bertipe 'NEXT_REDIRECT'.
    // Kita harus membiarkan error tersebut lolos agar proses pengalihan halaman tidak diblokir oleh blok catch.
    if (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
      throw error;
    }

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