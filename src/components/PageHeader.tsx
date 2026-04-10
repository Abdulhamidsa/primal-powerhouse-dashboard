import React from 'react';

interface PageHeaderProps {
  title?: string;
  label?: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, label, description, children }: PageHeaderProps) {
  return (
    <div
      className="-mx-4 px-4 pt-5 pb-6"
      style={{
        background: 'radial-gradient(ellipse 150% 110% at 50% 0%, var(--color-accent-muted) 0%, transparent 72%)',
      }}
    >
      <div className="mx-auto w-full max-w-xl">
        {label && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            {label}
          </p>
        )}
        {title && (
          <h1
            className={[
              'text-[28px] font-semibold leading-[1.08] tracking-[-0.025em] text-[var(--color-text)]',
              label ? 'mt-1' : '',
            ]
              .join(' ')
              .trim()}
          >
            {title}
          </h1>
        )}
        {description && <p className="mt-2 text-[13px] leading-5 text-[var(--color-text-muted)]">{description}</p>}
        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  );
}
