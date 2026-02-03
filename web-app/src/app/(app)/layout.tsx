'use client';

import { Navbar } from '@/components/Navbar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      <div className="relative z-10">
        <Navbar />
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
