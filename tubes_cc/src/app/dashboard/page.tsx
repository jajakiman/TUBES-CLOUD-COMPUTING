import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Root Dashboard Page.
 * Inspects session cookie and performs redirection to role-specific layouts.
 */
export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionUser = cookieStore.get('session_user')?.value;

  if (!sessionUser) {
    redirect('/login');
  }

  if (sessionUser === 'admin') {
    redirect('/dashboard/admin');
  } else {
    redirect('/dashboard/user');
  }
}
