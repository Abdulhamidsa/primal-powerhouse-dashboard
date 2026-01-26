'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  showLoading: (duration?: number) => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showLoading = (duration?: number) => {
    setIsLoading(true);
    if (duration) {
      window.setTimeout(() => setIsLoading(false), duration);
    }
  };

  const hideLoading = () => setIsLoading(false);

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading, showLoading, hideLoading }}>
      {children}
      {mounted && isLoading && <LoadingOverlay />}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) throw new Error('useLoading must be used within LoadingProvider');
  return context;
}

function LoadingOverlay() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-full bg-white p-4 shadow-lg">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
        <p className="text-sm font-medium text-foreground">Loading…</p>
      </div>
    </div>
  );
}
