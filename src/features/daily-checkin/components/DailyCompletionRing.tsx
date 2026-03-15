'use client';

import { cn } from '@/lib/utils';

type DailyCompletionRingProps = {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
};

function getProgressColor(percentage: number): string {
  const ratio = Math.min(Math.max(percentage, 0), 100) / 100;
  const red = Math.round(239 - ratio * 205);
  const green = Math.round(68 + ratio * 129);
  const blue = Math.round(68 + ratio * 26);
  return `rgb(${red}, ${green}, ${blue})`;
}

export function DailyCompletionRing({ percentage, size = 120, strokeWidth = 10, className }: DailyCompletionRingProps) {
  const normalizedPercentage = Math.min(Math.max(percentage, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (normalizedPercentage / 100) * circumference;
  const progressColor = getProgressColor(normalizedPercentage);

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 overflow-visible">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148, 163, 184, 0.18)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 300ms ease, stroke 300ms ease' }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-lg font-semibold text-foreground">{normalizedPercentage}%</span>
        <span className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
          {normalizedPercentage === 100 ? 'Complete' : 'In Progress'}
        </span>
      </div>
    </div>
  );
}
