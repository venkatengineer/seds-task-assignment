import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/store/app-context';

export const metadata: Metadata = {
  title: 'SEDS REC Sprint Planner & Team Management Platform',
  description: 'Production-ready internal operating system for SEDS REC engineering teams, sprint management, and aerospace telemetry.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#07080d] text-slate-100 antialiased min-h-screen">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
