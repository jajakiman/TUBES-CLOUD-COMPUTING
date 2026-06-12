import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import UserDashboard from '@/components/UserDashboard';
import { getTodosAction, Todo } from '@/app/actions/todos';

export default async function UserDashboardPage() {
  const cookieStore = await cookies();
  const sessionUser = cookieStore.get('session_user')?.value;

  if (!sessionUser || sessionUser === 'admin') {
    redirect('/login');
  }

  let initialTodos: Todo[] = [];
  let fetchError = null;
  try {
    initialTodos = await getTodosAction();
  } catch (err: any) {
    console.error('Failed to get initial todos in User page:', err);
    fetchError = err?.message || 'Database connection error.';
  }

  return (
    <UserDashboard
      sessionUser={sessionUser}
      initialTodos={initialTodos}
      fetchError={fetchError}
    />
  );
}
