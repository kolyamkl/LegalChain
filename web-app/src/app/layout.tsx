import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { AuthProvider } from '@/components/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LegalChain - AI-Powered Smart Contract Security',
  description: 'Analyze smart contracts for vulnerabilities and risks with AI-powered explanations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background min-h-screen text-white antialiased`}>
        <AuthProvider>
          <div className="relative min-h-screen">
            <div className="fixed inset-0 bg-gradient-to-br from-background via-background-secondary to-background pointer-events-none" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10">
              <Navbar />
              <main className="container mx-auto px-4 py-6">
                {children}
              </main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
