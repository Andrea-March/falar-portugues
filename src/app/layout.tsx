import type { Metadata, Viewport } from 'next';
import './globals.css';
import { UserProvider } from '@/context/UserContext';
import ServiceWorker from '@/components/common/ServiceWorker';
import { courseConfig } from '@/content';

const baloo = { variable: '' }; const nunito = { variable: '' };

export const metadata: Metadata = {
  title: courseConfig.appTitle,
  description: courseConfig.appDescription,
  // favicon.ico e apple-icon.png in src/app vengono collegate in automatico da Next
  // Permette a iOS di aprirla a schermo intero senza barra di Safari
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: courseConfig.appShortName,
  },
};

export const viewport: Viewport = {
  themeColor: '#f3f6fc',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={courseConfig.targetLang} className={`${baloo.variable} ${nunito.variable}`}>
      <body className="bg-brand-background text-ink antialiased min-h-screen">
        <UserProvider>{children}</UserProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
