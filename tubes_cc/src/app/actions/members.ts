'use server';

import { query } from '@/lib/db';
import mysql from 'mysql2/promise';

export interface Member {
  id: number;
  name: string;
  class_room: string;
}

interface MemberRow extends mysql.RowDataPacket {
  id: number;
  name: string;
  class_room: string;
}

/**
 * Server Action to fetch project contributors from the database.
 * Directly executes a raw SQL query.
 */
export async function getMembersAction(): Promise<Member[]> {
  try {
    const rows = await query<MemberRow[]>('SELECT id, name, class_room FROM members');
    
    // Explicitly map MySQL row packets to Member interface
    return rows.map((row) => ({
      id: Number(row.id),
      name: String(row.name),
      class_room: String(row.class_room),
    }));
  } catch (error: any) {
    console.error('Database connection error in getMembersAction:', error);
    // Return a structured error response or throw an error for the Server Component boundary
    throw new Error(
      `Failed to query members from the database. Ensure database connection and schema are correct. Details: ${error?.message || error}`
    );
  }
}
