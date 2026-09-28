'use client';

import { CheckIcon as Check, CaretDownIcon as CaretDown } from '@phosphor-icons/react';
import { accentThemes, composeTheme, type AccentThemeId, type AppearanceMode, type ThemeOption } from '@primal/theme';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type ThemePreferenceSectionProps = {
  mode: AppearanceMode;
  accentTheme: AccentThemeId;
  options: readonly ThemeOption[];
  onModeChangeAction: (mode: AppearanceMode) => void | Promise<void>;
  onAccentChangeAction: (accentTheme: AccentThemeId) => void | Promise<void>;
};

export function ThemePreferenceSection({ mode, accentTheme, options, onModeChangeAction, onAccentChangeAction }: ThemePreferenceSectionProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const selected = options.find(option => option.id === accentTheme) ?? options[0];
  const activeAccent = accentThemes[accentTheme];

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: MouseEvent) => {
      if (!popoverRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', dismiss);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', dismiss);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <section className="space-y-4 rounded-3xl border border-border bg-card p-4 sm:p-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Appearance</p>
        <p className="mt-1 text-sm text-muted-foreground">Choose how Primal Powerhouse looks.</p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Mode</p>
        <div role="group" aria-label="Appearance mode" className="grid grid-cols-2 rounded-2xl border border-border bg-input p-1">
          {(['dark', 'light'] as const).map(option => {
            const active = mode === option;
            return (
              <button key={option} type="button" aria-pressed={active} onClick={() => void onModeChangeAction(option)} className={cn('rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                {option === 'dark' ? 'Dark' : 'Light'}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2" ref={popoverRef}>
        <p className="text-sm font-medium text-foreground">Accent</p>
        <button type="button" aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen(value => !value)} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-input px-3 py-2.5 text-left transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex gap-1" aria-hidden="true">
            {[activeAccent.accent, activeAccent.accentHover, activeAccent.chartSecondary].map(color => <span key={color} className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: color }} />)}
          </span>
          <span className="flex-1 text-sm font-medium text-foreground">{selected.label}</span>
          <CaretDown aria-hidden="true" size={16} className={cn('text-muted-foreground transition-transform', open && 'rotate-180')} />
        </button>

        {open ? (
          <div role="listbox" aria-label="Accent theme" className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-secondary p-2 shadow-lg sm:grid-cols-4">
            {options.map(option => {
              const tokens = composeTheme(mode, option.id);
              const accent = accentThemes[option.id];
              const active = option.id === accentTheme;
              return (
                <button key={option.id} type="button" role="option" aria-selected={active} onClick={() => { void onAccentChangeAction(option.id); setOpen(false); }} className={cn('relative rounded-xl border p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', active ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-border-strong')}>
                  <span className="mb-2 flex items-center gap-1.5" aria-hidden="true">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: accent.accent }} />
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: accent.chartSecondary }} />
                    <span className="h-3 flex-1 rounded-full" style={{ backgroundColor: tokens.textMuted, maxWidth: 20 }} />
                  </span>
                  <span className="block text-xs font-semibold text-foreground">{option.label}</span>
                  {active ? <Check aria-hidden="true" weight="bold" size={14} className="absolute right-2 top-2 text-primary" /> : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
