import React from 'react';
import { LucideIcon } from 'lucide-react';

type StatsCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
};

export const StatsCard = ({ title, value, icon: Icon }: StatsCardProps) => {
  return (
    <div className="card-base flex items-center justify-between p-5">
      <div className="space-y-1">
        <h3 className="text-xs uppercase tracking-[0.12em] text-[var(--color-text-muted)]">{title}</h3>

        <p className="text-3xl font-semibold text-[var(--color-text)]">{value}</p>
      </div>

      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-accent-muted)]">
        <Icon size={20} className="text-[var(--color-accent)]" />
      </div>
    </div>
  );
};
