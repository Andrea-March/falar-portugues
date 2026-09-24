import type { Metadata, Viewport } from 'next';
import { Baloo_2, Nunito } from 'next/font/google';
import './globals.css';
import { UserProvider } from '@/context/UserContext';

const baloo = Baloo_2({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-baloo' });
const nunito = Nunito({ subsets: ['latin'], weight: ['400', '600', '700', '800'], variable: '--font-nunito' });

export const metadata: Metadata = {
  title: 'FalaLuso - Aprender Português',
  description: 'Aprende português europeu de forma prática',
};

export const viewport: Viewport = {
  themeColor: '#f3f6fc',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt" className={`${baloo.variable} ${nunito.variable}`}>
      <body className="bg-brand-background text-ink antialiased min-h-screen">
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
