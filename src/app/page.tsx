'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store/app-context';
import { Orbit, Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, currentUser, isSuspended } = useApp();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/login');
      } else if (isSuspended) {
        router.replace('/login');
      } else if (currentUser.role === 'ADMIN') {
        router.replace('/admin');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, isSuspended, currentUser, router]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
          <Orbit className="w-6 h-6 animate-spin duration-1000" />
        </div>
        <div className="text-center">
          <h2 className="text-sm font-semibold text-gray-900">SEDS REC</h2>
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5 mt-1">
            <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
            <span>Resolving authentication...</span>
          </p>
        </div>
      </div>
    </div>
  );
}
