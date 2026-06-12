import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AppLayout } from '@/components/AppLayout';
import './globals.css';

export const metadata: Metadata = {
  title: 'Beta ERP - Oxyral & Chimiral',
  description: 'Application de gestion interne Beta',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AppLayout>{children}</AppLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
