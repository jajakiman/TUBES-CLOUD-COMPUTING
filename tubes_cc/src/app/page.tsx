import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Root Home page that redirects users dynamically
 * based on their authentication status.
 */
export default async function HomePage() {
  const cookieStore = await cookies();
  const sessionUser = cookieStore.get('session_user')?.value;

  if (sessionUser) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
