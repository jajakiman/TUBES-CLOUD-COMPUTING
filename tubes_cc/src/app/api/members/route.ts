import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import mysql from 'mysql2/promise';

interface MemberRow extends mysql.RowDataPacket {
  id: number;
  name: string;
  class_room: string;
  user_id: number | null;
  total_tasks: number;
  completed_tasks: number;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const username = cookieStore.get('session_user')?.value;

    if (!username) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const rows = await query<MemberRow[]>(`
      SELECT 
        m.id, 
        m.name, 
        m.class_room, 
        m.user_id,
        COUNT(t.id) as total_tasks,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
      FROM members m
      LEFT JOIN todos t ON m.user_id = t.user_id
      GROUP BY m.id, m.name, m.class_room, m.user_id
      ORDER BY m.id ASC
    `);

    const members = rows.map((row) => {
      const total_tasks = Number(row.total_tasks);
      const completed_tasks = Number(row.completed_tasks);
      let status: 'no_todo' | 'in_progress' | 'completed' = 'no_todo';
      
      if (total_tasks > 0) {
        if (completed_tasks === total_tasks) {
          status = 'completed';
        } else {
          status = 'in_progress';
        }
      }

      return {
        id: Number(row.id),
        name: String(row.name),
        class_room: String(row.class_room),
        user_id: row.user_id ? Number(row.user_id) : null,
        total_tasks,
        completed_tasks,
        status,
      };
    });

    return NextResponse.json({ success: true, members });
  } catch (error: any) {
    console.error('Error in GET members microservice API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
