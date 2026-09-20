import type { ReactNode } from 'react';

interface AddMealSectionProps {
  title: string;
  description: string;
  children: ReactNode;
  action?: ReactNode;
}

export function AddMealSection({ title, description, children, action }: AddMealSectionProps) {
  return (
    <section className="space-y-5 rounded-[22px] border border-white/10 bg-white/[0.035] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.14)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>

        {action}
      </div>

      {children}
    </section>
  );
}
