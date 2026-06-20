import React from 'react';

interface PageHeaderProps {
  title?: string;
  label?: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, label, description, children }: PageHeaderProps) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <section className="relative overflow-hidden rounded-[30px] border bg-card/75 p-5 shadow-sm backdrop-blur-xl sm:p-6">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"
        />

        <div className="relative space-y-2">
          {label && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              {label}
            </p>
          )}

          {title && (
            <h1
              className={[
                'text-[28px] font-semibold leading-[1.08] tracking-[-0.03em] text-[var(--color-text)] sm:text-[31px]',
                label ? 'mt-1' : '',
              ]
                .join(' ')
                .trim()}
            >
              {title}
            </h1>
          )}

          {description && <p className="text-[13px] leading-5 text-[var(--color-text-muted)]">{description}</p>}

          {children && <div className="pt-2">{children}</div>}
        </div>
      </section>
    </div>
  );
}
