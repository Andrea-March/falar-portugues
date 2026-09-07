import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from '@/context/UserContext';

export const metadata: Metadata = {
  title: "FalarLisboa - Aprender Português",
  description: "Aprende português europeu de forma prática",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body className="bg-brand-background text-slate-900 antialiased min-h-screen">
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}