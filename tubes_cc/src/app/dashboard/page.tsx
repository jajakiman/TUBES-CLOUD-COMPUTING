import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import InstanceBadge from '@/components/InstanceBadge';
import DashboardLayoutCoordinator from '@/components/DashboardLayoutCoordinator';
import { getMembersAction, Member } from '@/app/actions/members';
import { getTodosAction, Todo } from '@/app/actions/todos';

/**
 * DashboardPage is a Server Component.
 * Fetches data on the server side before pre-rendering.
 * Delegates interactive client coordination and POV layout to DashboardLayoutCoordinator.
 */
export default async function DashboardPage() {
  // Secure the dashboard by checking the stateless session cookie
  const cookieStore = await cookies();
  const sessionUser = cookieStore.get('session_user')?.value;

  if (!sessionUser) {
    redirect('/login');
  }

  let members: Member[] = [];
  let todos: Todo[] = [];
  let fetchError: string | null = null;

  try {
    // Call server actions directly inside Server Component
    members = await getMembersAction();
    // Non-admin users fetch their personal todos. Admin fetches dynamically via interactive selections.
    if (sessionUser !== 'admin') {
      todos = await getTodosAction();
    }
  } catch (error: any) {
    console.error('Failed to pre-render data in Dashboard:', error);
    fetchError = error?.message || 'Database connectivity error.';
  }

  return (
    <DashboardLayoutCoordinator
      sessionUser={sessionUser}
      members={members}
      initialTodos={todos}
      fetchError={fetchError}
      instanceBadgeNode={<InstanceBadge />}
    />
  );
}
