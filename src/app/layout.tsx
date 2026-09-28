import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/store/app-context';
import { ServiceWorkerRegistrar } from '@/components/pwa/service-worker-registrar';
import { PwaInstallBanner } from '@/components/pwa/pwa-install-banner';
import { OfflineIndicator } from '@/components/pwa/offline-indicator';

export const metadata: Metadata = {
  title: 'SEDS Team Management & Sprint Platform',
  description: 'Production-ready internal operating system for SEDS REC engineering teams, sprint management, and aerospace projects.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SEDS',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#FFFFFF',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#F8F9FA] text-[#171717] antialiased min-h-screen selection:bg-blue-100 selection:text-blue-900 font-sans">
        <AppProvider>
          <ServiceWorkerRegistrar />
          <OfflineIndicator />
          {children}
          <PwaInstallBanner />
        </AppProvider>
      </body>
    </html>
  );
}
