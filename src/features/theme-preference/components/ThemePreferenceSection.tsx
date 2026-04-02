'use client';

import { Check, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ThemeOption, ThemePreference } from '@/features/theme-preference/types/themePreference.types';

type ThemePreferenceSectionProps = {
  value: ThemePreference;
  options: ThemeOption[];
  onChangeAction: (theme: ThemePreference) => void;
};

export function ThemePreferenceSection({ value, options, onChangeAction }: ThemePreferenceSectionProps) {
  return (
    <section className="space-y-2">
      <p className="px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Appearance</p>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-muted/50">
            <Palette className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Theme</p>
            <p className="text-xs text-muted-foreground">Choose your accent color</p>
          </div>
        </div>

        <div className="h-px bg-border/60" />

        <div className="grid grid-cols-2 gap-2 p-3">
          {options.map(option => {
            const active = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChangeAction(option.value)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors',
                  active
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-translucent)] text-foreground'
                    : 'border-border bg-background/40 text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                )}
                aria-pressed={active}
              >
                <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: `var(${option.swatchVarName})` }} />
                <span className="text-sm font-medium">{option.label}</span>
                {active ? <Check className="ml-auto h-4 w-4 text-[var(--color-accent)]" /> : null}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
