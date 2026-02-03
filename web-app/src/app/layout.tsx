import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { AnimatedBackground } from '@/components/ui/animated-background';

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
          <AnimatedBackground />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
