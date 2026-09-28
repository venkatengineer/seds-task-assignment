'use client';

import { AppShell } from '@/components/layout/app-shell';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { useApp } from '@/lib/store/app-context';
import { Permissions } from '@/lib/permissions';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const { currentUser, isLoading } = useApp();
  const canAccess = Permissions.canManageUsers(currentUser);

  if (isLoading) {
    return null; // AppShell will show loading state
  }

  if (!canAccess) {
    return (
      <AppShell breadcrumbs={[{ label: 'SEDS REC', href: '/dashboard' }, { label: 'Admin Panel' }]}>
        <div className="max-w-md mx-auto my-12 bg-white border border-gray-200 rounded-xl p-6 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-gray-900">Restricted Administration Access</h2>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            The Admin Panel is reserved for Platform Administrators. Your current role does not have authorization to view or configure member governance.
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/dashboard"
              className="px-4 py-2 text-xs font-medium text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell breadcrumbs={[{ label: 'SEDS REC', href: '/admin' }, { label: 'Admin Panel' }]}>
      <AdminDashboard />
    </AppShell>
  );
}
