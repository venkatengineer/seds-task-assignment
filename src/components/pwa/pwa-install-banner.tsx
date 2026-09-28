'use client';

import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone, Monitor } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already running standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if previously dismissed in session
    const dismissed = sessionStorage.getItem('seds_pwa_dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('seds_pwa_dismissed', 'true');
  };

  // Only show if prompt is available and not dismissed and not already installed
  if (!deferredPrompt || isDismissed || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 leading-tight">Install SEDS</h4>
              <p className="text-xs text-gray-500 mt-0.5">Desktop & Mobile Operating System</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          Install SEDS as a standalone desktop or mobile application for instant notifications, offline access, and faster navigation.
        </p>

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
            <span className="text-gray-300">•</span>
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDismiss}
              className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              Not now
            </button>
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install SEDS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
