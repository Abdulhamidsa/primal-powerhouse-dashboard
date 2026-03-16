import type { ReactNode } from 'react';

interface AddMealSectionProps {
  title: string;
  description: string;
  children: ReactNode;
  action?: ReactNode;
}

export function AddMealSection({ title, description, children, action }: AddMealSectionProps) {
  return (
    <section className="space-y-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--color-text)]">{title}</h3>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p>
        </div>

        {action}
      </div>

      {children}
    </section>
  );
}
