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
import { accentThemeIdSchema, appearanceModeSchema, DEFAULT_ACCENT_THEME_ID, DEFAULT_APPEARANCE_MODE, type AccentThemeId, type AppearanceMode } from '@primal/theme';
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
  const parsedMode = appearanceModeSchema.safeParse(cookieStore.get('pph_appearance_mode')?.value);
  const parsedAccent = accentThemeIdSchema.safeParse(cookieStore.get('pph_appearance_accent')?.value ?? cookieStore.get('pph_theme_preference')?.value);
  const cookieMode: AppearanceMode | null = parsedMode.success ? parsedMode.data : null;
  const cookieAccent: AccentThemeId | null = parsedAccent.success ? parsedAccent.data : null;
  const initialMode = cookieMode ?? DEFAULT_APPEARANCE_MODE;
  const initialAccent = cookieAccent ?? DEFAULT_ACCENT_THEME_ID;

  return (
    <html lang="en" className={initialMode === 'dark' ? 'dark' : undefined} data-mode={initialMode} data-accent={initialAccent} data-theme={initialAccent} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var e=document.documentElement,v=['ember','ocean','forest','ruby','aura','arctic','dusk','onyx'],m=['dark','light'],r=localStorage.getItem('pph_appearance_v1'),a=r?JSON.parse(r):null;if(!a){var t=localStorage.getItem('pph_theme_preference');if(v.indexOf(t)!==-1)a={mode:'dark',accentTheme:t}}if(a){var mode=m.indexOf(a.mode)!==-1?a.mode:'dark',accent=v.indexOf(a.accentTheme)!==-1?a.accentTheme:'ember';e.dataset.mode=mode;e.dataset.accent=accent;e.dataset.theme=accent;e.classList.toggle('dark',mode==='dark')}}catch(e){}})()` }} />
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
          <ThemeProvider initialAppearance={cookieMode || cookieAccent ? { mode: initialMode, accentTheme: initialAccent } : null}>
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
