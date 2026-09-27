'use client';

import { CheckIcon as Check } from '@phosphor-icons/react';
import { themes } from '@primal/theme';
import { cn } from '@/lib/utils';
import type { ThemeOption, ThemePreference } from '@/features/theme-preference/types/themePreference.types';

type ThemePreferenceSectionProps = {
  value: ThemePreference;
  options: ThemeOption[];
  onChangeAction: (theme: ThemePreference) => void | Promise<void>;
};

export function ThemePreferenceSection({ value, options, onChangeAction }: ThemePreferenceSectionProps) {
  return (
    <section className="space-y-3">
      <div className="px-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Appearance</p>
        <p className="mt-1 text-sm text-muted-foreground">Choose how Primal Powerhouse looks.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {options.map(option => {
          const active = option.value === value;
          const tokens = themes[option.value];

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => void onChangeAction(option.value)}
              className={cn(
                'group relative overflow-hidden rounded-3xl border p-2.5 text-left transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                active ? 'shadow-[0_14px_34px_rgba(0,0,0,0.24)]' : 'border-border hover:border-border-strong',
              )}
              style={{
                backgroundColor: tokens.surface,
                borderColor: active ? tokens.accent : tokens.border,
                color: tokens.text,
              }}
            >
              <div
                className="relative overflow-hidden rounded-[22px] border p-2.5"
                style={{ backgroundColor: tokens.background, borderColor: tokens.border }}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tokens.accent }} />
                  {active ? (
                    <span
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full"
                      style={{ backgroundColor: tokens.accent, color: tokens.onAccent }}
                    >
                      <Check aria-hidden="true" focusable="false" size={12} weight="bold" />
                    </span>
                  ) : null}
                </div>

                <div className="space-y-2 rounded-2xl border p-2" style={{ backgroundColor: tokens.card, borderColor: tokens.border }}>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tokens.accent }} />
                    <span className="h-1.5 w-10 rounded-full" style={{ backgroundColor: tokens.text }} />
                  </div>
                  <span className="block h-1.5 w-16 rounded-full" style={{ backgroundColor: tokens.textMuted }} />
                  <div className="flex items-center justify-between gap-2">
                    <span className="h-5 flex-1 rounded-lg" style={{ backgroundColor: tokens.surfaceElevated }} />
                    <span className="h-5 w-8 rounded-lg" style={{ backgroundColor: tokens.accent }} />
                  </div>
                </div>
              </div>

              <div className="px-1 pb-1 pt-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{option.label}</span>
                  {option.isDefault ? <span className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">Default</span> : null}
                </div>
                <span className="mt-0.5 block truncate text-[11px]" style={{ color: tokens.textMuted }}>
                  {option.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
