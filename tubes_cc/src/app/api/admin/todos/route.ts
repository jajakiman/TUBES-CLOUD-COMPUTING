import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import mysql from 'mysql2/promise';

interface MemberRow extends mysql.RowDataPacket {
  user_id: number | null;
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

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const username = cookieStore.get('session_user')?.value;

    if (!username || username !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const memberIdStr = searchParams.get('memberId');
    if (!memberIdStr) {
      return NextResponse.json({ success: false, error: 'memberId is required.' }, { status: 400 });
    }

    const memberId = Number(memberIdStr);
    if (isNaN(memberId)) {
      return NextResponse.json({ success: false, error: 'Invalid memberId.' }, { status: 400 });
    }

    // Find the user_id linked to the member
    const members = await query<MemberRow[]>('SELECT user_id FROM members WHERE id = ? LIMIT 1', [memberId]);
    if (members.length === 0) {
      return NextResponse.json({ success: false, error: 'Member not found.' }, { status: 404 });
    }

    const userId = members[0].user_id;
    if (!userId) {
      return NextResponse.json({ success: true, todos: [] }); // No linked user account yet
    }

    const todos = await query<TodoRow[]>(
      'SELECT id, user_id, title, description, status, created_at, updated_at FROM todos WHERE user_id = ? ORDER BY id DESC',
      [userId]
    );

    return NextResponse.json({ success: true, todos });
  } catch (error: any) {
    console.error('Error in GET admin todos microservice API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
