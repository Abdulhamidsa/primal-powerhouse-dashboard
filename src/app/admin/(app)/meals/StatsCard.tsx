import React from 'react';
import { LucideIcon } from 'lucide-react';

type StatsCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
};

export const StatsCard = ({ title, value, icon: Icon }: StatsCardProps) => {
  return (
    <div className="flex items-center justify-between rounded-[22px] border border-white/10 bg-white/[0.035] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
      <div className="space-y-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</h3>

        <p className="text-2xl font-semibold tracking-[-0.03em] text-foreground">{value}</p>
      </div>

      <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--color-accent)]/25 bg-[var(--color-accent-muted)]">
        <Icon size={20} className="text-[var(--color-accent)]" />
      </div>
    </div>
  );
};
