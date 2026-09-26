'use client';

import { useMemo, useState } from 'react';
import { CheckIcon as Check, CaretDownIcon as ChevronDown, PaletteIcon as Palette } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { ThemeOption, ThemePreference } from '@/features/theme-preference/types/themePreference.types';

type ThemePreferenceSectionProps = {
  value: ThemePreference;
  options: ThemeOption[];
  onChangeAction: (theme: ThemePreference) => void;
};

export function ThemePreferenceSection({ value, options, onChangeAction }: ThemePreferenceSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = useMemo(() => options.find(option => option.value === value) ?? options[0], [options, value]);

  return (
    <section className="space-y-2">
      <p className="px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Appearance</p>

      <div className="overflow-hidden rounded-[24px] border border-border bg-card shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <button
          type="button"
          onClick={() => setIsOpen(current => !current)}
          className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/20"
          aria-expanded={isOpen}
        >
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-muted/50">
            <Palette aria-hidden="true" focusable="false" className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Theme</p>
            <p className="text-xs text-muted-foreground">Choose your accent color</p>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-muted/40 px-2.5 py-1.5">
            <span
              className="h-3.5 w-3.5 rounded-full ring-2 ring-background"
              style={{ backgroundColor: `var(${selectedOption.swatchVarName})` }}
            />
            <span className="text-sm font-medium text-foreground">{selectedOption.label}</span>
            <ChevronDown
              aria-hidden="true"
              focusable="false"
              className={cn('h-4 w-4 text-muted-foreground transition-transform', isOpen ? 'rotate-180' : '')}
            />
          </div>
        </button>

        <div
          className={cn(
            'grid transition-all duration-200 ease-out',
            isOpen ? 'grid-rows-[1fr] border-t border-border/60' : 'grid-rows-[0fr]',
          )}
        >
          <div className="overflow-hidden">
            <div className="space-y-2 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent)] p-3">
              {options.map(option => {
                const active = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChangeAction(option.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-[20px] border px-3.5 py-3 text-left transition-all',
                      active
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-translucent)] text-foreground shadow-[0_8px_20px_rgba(0,0,0,0.06)]'
                        : 'border-border bg-background/50 text-muted-foreground hover:bg-muted/35 hover:text-foreground',
                    )}
                    aria-pressed={active}
                  >
                    <span
                      className="h-9 w-9 rounded-2xl border border-white/20 shadow-inner"
                      style={{ backgroundColor: `var(${option.swatchVarName})` }}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground/90">
                        Accent preview for cards, buttons, and highlights
                      </p>
                    </div>

                    <span
                      className={cn(
                        'inline-flex h-6 w-6 items-center justify-center rounded-full border transition-colors',
                        active
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                          : 'border-border bg-card text-transparent',
                      )}
                    >
                      <Check aria-hidden="true" focusable="false" className="h-3.5 w-3.5" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
