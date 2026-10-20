import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function AdminPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('mx-auto flex w-full max-w-[1500px] flex-col gap-6', className)}>{children}</div>;
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[var(--color-surface)] px-6 py-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0 space-y-2">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>
        ) : null}
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground md:text-3xl">{title}</h1>
          {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function AdminPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-xl border border-white/10 bg-[var(--color-surface)]',
        className,
      )}
    >
      {children}
    </section>
  );
}

export function AdminPanelHeader({
  icon,
  title,
  description,
  meta,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  meta?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-muted-foreground">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {meta ? <div className="shrink-0">{meta}</div> : null}
    </div>
  );
}
