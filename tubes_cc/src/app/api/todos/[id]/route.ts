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
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: todoIdStr } = await context.params;
    const todoId = Number(todoIdStr);
    if (isNaN(todoId)) {
      return NextResponse.json({ success: false, error: 'Invalid todo ID.' }, { status: 400 });
    }

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
    const isAdmin = username === 'admin';

    // Verify ownership
    const existingTodos = await query<TodoRow[]>('SELECT id, user_id FROM todos WHERE id = ? LIMIT 1', [todoId]);
    if (existingTodos.length === 0) {
      return NextResponse.json({ success: false, error: 'Task not found.' }, { status: 404 });
    }

    if (!isAdmin && existingTodos[0].user_id !== userId) {
      return NextResponse.json({ success: false, error: 'Access denied.' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, status } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Title is required.' }, { status: 400 });
    }

    const validStatuses = ['pending', 'in_progress', 'completed'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status.' }, { status: 400 });
    }

    await query(
      'UPDATE todos SET title = ?, description = ?, status = ? WHERE id = ?',
      [title.trim(), description?.trim() || null, status || 'pending', todoId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in PUT todo microservice API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: todoIdStr } = await context.params;
    const todoId = Number(todoIdStr);
    if (isNaN(todoId)) {
      return NextResponse.json({ success: false, error: 'Invalid todo ID.' }, { status: 400 });
    }

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
    const isAdmin = username === 'admin';

    // Verify ownership
    const existingTodos = await query<TodoRow[]>('SELECT id, user_id FROM todos WHERE id = ? LIMIT 1', [todoId]);
    if (existingTodos.length === 0) {
      return NextResponse.json({ success: false, error: 'Task not found.' }, { status: 404 });
    }

    if (!isAdmin && existingTodos[0].user_id !== userId) {
      return NextResponse.json({ success: false, error: 'Access denied.' }, { status: 403 });
    }

    await query('DELETE FROM todos WHERE id = ?', [todoId]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE todo microservice API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
