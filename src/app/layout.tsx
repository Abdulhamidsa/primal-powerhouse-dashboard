import { Geist, Geist_Mono } from 'next/font/google';
import '@primal/theme/web.css';
import './globals.css';
import PWAInstaller from '@/components/PWAInstaller';
import InstallPrompt from '@/components/InstallPrompt';
import { RootAuthGate } from '@/components/RootAuthGate';
import { LoadingProvider } from '@/contexts/LoadingProvider';
// import LayoutClient from '@/components/LayoutClient';
import { Metadata } from 'next/types';
import { SwrProvider } from '@/providers/swr-provider';
import { AppUpdateProvider } from '@/components/AppUpdateManager';
import { cookies } from 'next/headers';
import { themeIdSchema, DEFAULT_THEME_ID, type ThemeId } from '@primal/theme';
import { ThemeProvider } from '@/features/theme/components/ThemeProvider';
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Primal Powerhouse | Professional Fitness Dashboard',
  description: 'Professional fitness coaching platform for trainers and clients',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Primal Powerhouse',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ef4444',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const parsedTheme = themeIdSchema.safeParse(cookieStore.get('pph_theme_preference')?.value);
  const cookieTheme: ThemeId | null = parsedTheme.success ? parsedTheme.data : null;
  const initialTheme: ThemeId = cookieTheme ?? DEFAULT_THEME_ID;

  return (
    <html lang="en" className="dark" data-theme={initialTheme} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('pph_theme_preference');var v=['ember','ocean','forest','ruby','aura','arctic','dusk','onyx'];if(!${cookieTheme ? 'true' : 'false'}&&v.indexOf(t)!==-1)document.documentElement.dataset.theme=t}catch(e){}})()` }} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Primal Powerhouse" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
          <ThemeProvider initialTheme={cookieTheme}>
            <LoadingProvider>
              <RootAuthGate>
                <AppUpdateProvider>
                  <PWAInstaller />
                  <InstallPrompt />
                  <SwrProvider>{children}</SwrProvider>
                </AppUpdateProvider>
              </RootAuthGate>
            </LoadingProvider>
          </ThemeProvider>
      </body>
    </html>
  );
}
