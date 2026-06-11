import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import InstanceBadge from '@/components/InstanceBadge';
import { getMembersAction, Member } from '@/app/actions/members';
import { logoutAction } from '@/app/actions/auth';

/**
 * DashboardPage is a Server Component.
 * Fetches data on the server side before pre-rendering.
 */
export default async function DashboardPage() {
  // Secure the dashboard by checking the stateless session cookie
  const cookieStore = await cookies();
  const sessionUser = cookieStore.get('session_user')?.value;

  if (!sessionUser) {
    redirect('/login');
  }

  let members: Member[] = [];
  let fetchError: string | null = null;

  try {
    // Call server action directly inside Server Component
    members = await getMembersAction();
  } catch (error: any) {
    console.error('Failed to pre-render members in Dashboard:', error);
    fetchError = error?.message || 'Database connectivity error.';
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6 lg:px-8 text-white relative">
      {/* Background ambient lighting */}
      <div className="absolute top-10 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-5xl space-y-8 relative">
        {/* Top Navbar Section */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Cloud Monolith Dashboard
            </h1>
            <p className="mt-1.5 text-sm text-slate-400">
              Welcome back, <span className="font-semibold text-blue-400">{sessionUser}</span>
            </p>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:bg-white/5 hover:text-white active:scale-[0.98]"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sign Out
            </button>
          </form>
        </header>

        {/* 3. Instance Identification Section (Prominent) */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Infrastructure Status
          </h2>
          <InstanceBadge />
        </section>

        {/* 5. Contributor Data Table Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Project Contributors</h2>
              <p className="text-xs text-slate-400">List of registered active team members</p>
            </div>
          </div>

          {fetchError ? (
            /* Graceful handling of database errors */
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-slate-300">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-amber-500/10 p-2 text-amber-500">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-amber-400">Database Connection Incomplete</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    The Server Component was unable to fetch the contributors. This usually happens if the MySQL tables do not exist yet, or environment variables are not injected.
                  </p>
                  <p className="font-mono text-xs text-amber-500 mt-2 bg-slate-950 p-2 rounded-lg border border-white/5">
                    Error Code: {fetchError}
                  </p>
                </div>
              </div>
            </div>
          ) : members.length === 0 ? (
            /* Empty State */
            <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="mt-4 text-sm font-semibold text-white">No Members Found</h3>
              <p className="mt-1.5 text-xs text-slate-400">The members table is currently empty.</p>
            </div>
          ) : (
            /* Enterprise-Grade Data Table */
            <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-slate-900/50">
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        No
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Nama Lengkap
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Kelas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {members.map((member, index) => (
                      <tr
                        key={member.id}
                        className="transition-colors hover:bg-white/[0.02] duration-200"
                      >
                        <td className="px-6 py-4 font-mono text-sm font-medium text-blue-400">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-white">
                          {member.name}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex items-center rounded-md bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300 ring-1 ring-inset ring-white/10">
                            {member.class_room}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
