import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session_user');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in logout microservice API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear session.' },
      { status: 500 }
    );
  }
}
