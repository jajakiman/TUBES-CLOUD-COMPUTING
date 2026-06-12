import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import mysql from 'mysql2/promise';

interface UserRow extends mysql.RowDataPacket {
  id: number;
  username: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required fields.' },
        { status: 400 }
      );
    }

    const rows = await query<UserRow[]>(
      'SELECT id, username FROM users WHERE username = ? AND password = ? LIMIT 1',
      [username, password]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    const user = rows[0];

    const cookieStore = await cookies();
    cookieStore.set('session_user', user.username, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in login microservice API:', error);
    return NextResponse.json(
      { success: false, error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
