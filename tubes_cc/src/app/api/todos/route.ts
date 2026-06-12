import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import mysql from 'mysql2/promise';

interface UserRow extends mysql.RowDataPacket {
  id: number;
}

interface TodoRow extends mysql.RowDataPacket {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

// GET all todos for current user
export async function GET() {
  try {
    const cookieStore = await cookies();
    const username = cookieStore.get('session_user')?.value;

    if (!username) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    // Resolve user ID
    const users = await query<UserRow[]>('SELECT id FROM users WHERE username = ? LIMIT 1', [username]);
    if (users.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }
    const userId = users[0].id;

    const todos = await query<TodoRow[]>(
      'SELECT id, user_id, title, description, status, created_at, updated_at FROM todos WHERE user_id = ? ORDER BY id DESC',
      [userId]
    );

    return NextResponse.json({ success: true, todos });
  } catch (error: any) {
    console.error('Error in GET todos microservice API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}

// POST create a new todo
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const username = cookieStore.get('session_user')?.value;

    if (!username) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Title is required.' }, { status: 400 });
    }

    // Resolve user ID
    const users = await query<UserRow[]>('SELECT id FROM users WHERE username = ? LIMIT 1', [username]);
    if (users.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }
    const userId = users[0].id;

    const result = await query<mysql.ResultSetHeader>(
      'INSERT INTO todos (user_id, title, description, status) VALUES (?, ?, ?, ?)',
      [userId, title.trim(), description?.trim() || null, 'pending']
    );

    return NextResponse.json({ success: true, todoId: result.insertId });
  } catch (error: any) {
    console.error('Error in POST todo microservice API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
