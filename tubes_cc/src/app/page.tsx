import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ensureDatabaseSetup } from '@/lib/db';

/**
 * Root Home page that redirects users dynamically
 * based on their authentication status.
 * Also triggers the automatic database initialization/migration.
 */
export default async function HomePage() {
  // Trigger automatic database and table initialization on first visit
  try {
    await ensureDatabaseSetup();
  } catch (error) {
    console.error('Database auto-initialization failed:', error);
  }

  const cookieStore = await cookies();
  const sessionUser = cookieStore.get('session_user')?.value;

  if (sessionUser) {
    redirect('/dashboard/user');
  } else {
    redirect('/login');
  }
}

