import type { Metadata } from 'next';
import './globals.css';
import { HQSidebar } from '@/components/layout/HQSidebar';
import { HQHeader } from '@/components/layout/HQHeader';

export const metadata: Metadata = {
  title: 'Gideon AI HQ — Personal AI Workforce OS',
  description: 'Mission Control for autonomous digital employees',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground flex min-h-screen">
        <HQSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <HQHeader />
          <main className="flex-1 p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
