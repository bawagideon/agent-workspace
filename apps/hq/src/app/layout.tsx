import type { Metadata } from 'next';
import './globals.css';
import { HQSidebar } from '@/components/layout/HQSidebar';
import { HQHeader } from '@/components/layout/HQHeader';
import { GlobalCommandPalette } from '@/components/dashboard/GlobalCommandPalette';

export const metadata: Metadata = {
  title: 'Gideon AI HQ — Autonomous Workforce & Engineering OS',
  description: 'Mission Control for autonomous digital employees and verified engineering deliverables',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-ambient-glow text-foreground flex min-h-screen selection:bg-primary-500/30 selection:text-white">
        <GlobalCommandPalette />
        <HQSidebar />
        <div className="flex-1 flex flex-col min-w-0 relative">
          <HQHeader />
          <main className="flex-1 p-6 md:p-8 overflow-y-auto min-w-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
