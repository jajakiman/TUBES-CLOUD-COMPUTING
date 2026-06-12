import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/AdminDashboard';
import { getMembersAction, Member } from '@/app/actions/members';

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const sessionUser = cookieStore.get('session_user')?.value;

  if (!sessionUser || sessionUser !== 'admin') {
    redirect('/login');
  }

  let initialMembers: Member[] = [];
  try {
    initialMembers = await getMembersAction();
  } catch (err) {
    console.error('Failed to get initial members in Admin page:', err);
  }

  return (
    <AdminDashboard
      sessionUser={sessionUser}
      initialMembers={initialMembers}
    />
  );
}
