'use client';

import { useEffect, useMemo, useState } from 'react';
import { DownloadIcon as Download, XIcon as X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const DISMISS_KEY = 'installPromptDismissedAt';
const DISMISS_DAYS = 7;

function isDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;

    const dismissedAt = Number(raw);
    if (!Number.isFinite(dismissedAt)) return false;

    const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
    return daysSince < DISMISS_DAYS;
  } catch {
    return false;
  }
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;

  const mql = window.matchMedia?.('(display-mode: standalone)');
  const standaloneByMql = mql?.matches ?? false;

  // iOS Safari fallback
  const standaloneByNavigator = (window.navigator as any).standalone === true;

  return standaloneByMql || standaloneByNavigator;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);

  const dismissedRecently = useMemo(() => {
    if (typeof window === 'undefined') return true;
    return isDismissedRecently();
  }, []);

  useEffect(() => {
    if (isInStandaloneMode()) {
      setInstalled(true);
      setVisible(false);
      setDeferredPrompt(null);
      return;
    }

    const onInstalled = () => {
      setInstalled(true);
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', onInstalled);
    return () => window.removeEventListener('appinstalled', onInstalled);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      if (installed) return;
      if (dismissedRecently) return;
      if (isInStandaloneMode()) return;

      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [dismissedRecently, installed]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setInstalled(true);
    }

    setDeferredPrompt(null);
    setVisible(false);
  };

  const handleDismiss = () => {
    setVisible(false);
    setDeferredPrompt(null);

    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {
      // ignore storage errors
    }
  };

  if (installed || !visible || !deferredPrompt) return null;

  return (
    <div className="fixed inset-x-4 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 fade-in-0 duration-300">
      <Card className="overflow-hidden rounded-[28px] border-border/80 bg-card/90 shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-primary/10 text-primary">
              <Download size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold tracking-tight text-foreground">Install Primal Powerhouse</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Add it to your home screen for quicker access.</p>
                </div>

                <button
                  onClick={handleDismiss}
                  className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-3 flex gap-2">
                <Button onClick={handleInstall} size="sm" className="h-9 flex-1 rounded-full px-4">
                  Install
                </Button>

                <Button
                  onClick={handleDismiss}
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-full px-4 text-muted-foreground"
                >
                  Not now
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
