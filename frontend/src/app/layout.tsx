import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { Navbar } from '@/components/ui/navbar';
import { Footer } from '@/components/ui/footer';
import { ToasterProvider } from '@/components/providers/toaster-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LightSpeedPay - Payment Gateway Wrapper',
  description: 'A unified payment gateway solution for merchants and gaming clients',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryProvider>
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
            <ToasterProvider />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
} 