import React from 'react';
import type { Icon } from '@phosphor-icons/react';

type StatsCardProps = {
  title: string;
  value: string | number;
  icon: Icon;
};

export const StatsCard = ({ title, value, icon: Icon }: StatsCardProps) => {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] p-4">
      <div className="space-y-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</h3>

        <p className="text-2xl font-semibold tracking-[-0.03em] text-foreground">{value}</p>
      </div>

      <div className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/[0.04]">
        <Icon aria-hidden="true" focusable="false" size={20} className="text-muted-foreground" />
      </div>
    </div>
  );
};
