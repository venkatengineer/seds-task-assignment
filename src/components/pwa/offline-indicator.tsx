'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff, CheckCircle2 } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    // Initial check
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
    }

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline && !showReconnected) return null;

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50">
      {isOffline && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs px-3.5 py-1.5 rounded-full shadow-sm flex items-center gap-2 font-medium animate-in fade-in slide-in-from-top-2">
          <WifiOff className="w-3.5 h-3.5 text-amber-600" />
          <span>Offline mode active. Changes are cached locally.</span>
        </div>
      )}

      {showReconnected && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs px-3.5 py-1.5 rounded-full shadow-sm flex items-center gap-2 font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Connection restored. Back online.</span>
        </div>
      )}
    </div>
  );
};
