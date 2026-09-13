import type { ReactNode } from 'react';

type HeroTone = 'neutral' | 'good' | 'warn' | 'danger';

export type UserPageHeroStatusItem = {
  label: string;
  value: string;
  tone?: HeroTone;
};

type UserPageHeroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  statusItems?: UserPageHeroStatusItem[];
  children?: ReactNode;
};

const TONE_CLASS: Record<HeroTone, string> = {
  neutral: 'text-[var(--color-text-muted)]',
  good: 'text-emerald-500',
  warn: 'text-amber-500',
  danger: 'text-red-500',
};

export function UserPageHero({ eyebrow, title, description, icon, statusItems = [], children }: UserPageHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[32px] px-4 py-5 sm:px-5 sm:py-6">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--color-accent-translucent),transparent_42%),linear-gradient(135deg,var(--color-surface),var(--color-bg)_78%)]"
      />
      <div aria-hidden="true" className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/45 to-transparent" />
      <div aria-hidden="true" className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-[var(--color-accent-translucent)] blur-3xl" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {icon ? (
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent-translucent)] text-[var(--color-accent)]">
                  {icon}
                </span>
              ) : null}
              {eyebrow ? (
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                  {eyebrow}
                </p>
              ) : null}
            </div>

            <h1 className="mt-3 text-[1.9rem] font-semibold leading-[1.05] tracking-[-0.04em] text-[var(--color-text)]">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 max-w-[42ch] text-sm leading-6 text-[var(--color-text-muted)]">{description}</p>
            ) : null}
          </div>
        </div>

        {statusItems.length ? (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {statusItems.map(item => (
              <div
                key={`${item.label}:${item.value}`}
                className="rounded-2xl bg-[var(--color-bg-alt)] px-3 py-2"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                  {item.label}
                </p>
                <p className={`mt-1 truncate text-sm font-semibold ${TONE_CLASS[item.tone ?? 'neutral']}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {children ? <div className="mt-4">{children}</div> : null}
      </div>
    </section>
  );
}
