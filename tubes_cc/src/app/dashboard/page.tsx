import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Root Dashboard Page.
 * Inspects session cookie and redirects all authenticated users
 * to the unified user dashboard.
 */
export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionUser = cookieStore.get('session_user')?.value;

  if (!sessionUser) {
    redirect('/login');
  }

  redirect('/dashboard/user');
}
