'use client';

import { PulseIcon as Activity } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

type DailyCompletionRingProps = {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
};

export function DailyCompletionRing({
  percentage,
  size = 96,
  strokeWidth = 8,
  className,
}: DailyCompletionRingProps) {
  const normalizedPercentage = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <ProgressRing value={normalizedPercentage} size={size} strokeWidth={strokeWidth} />
    </div>
  );
}

type ProgressRingProps = {
  value: number;
  size?: number;
  strokeWidth?: number;
};

function ProgressRing({ value, size = 96, strokeWidth = 8 }: ProgressRingProps) {
  const normalizedValue = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalizedValue / 100) * circumference;
  const centerSize = size * 0.42;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90 overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="daily-completion-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(184, 106, 78, 0.72)" />
              <stop offset="100%" stopColor="var(--color-accent)" />
            </linearGradient>
          </defs>

          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-bg-alt)"
            strokeWidth={strokeWidth}
          />

          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#daily-completion-ring-gradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 500ms ease',
              filter: 'drop-shadow(0 0 12px rgba(184, 106, 78, 0.28))',
            }}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="flex items-center justify-center rounded-full border backdrop-blur-sm"
            style={{
              width: centerSize,
              height: centerSize,
              background: 'linear-gradient(180deg, var(--color-surface) 0%, var(--color-bg-alt) 100%)',
              borderColor: 'var(--color-border)',
              boxShadow:
                '0 10px 30px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
            }}
          >
            <Activity
              size={Math.max(18, size * 0.18)}
              className="text-[var(--color-accent)]"
              strokeWidth={2.2}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 text-center">
        <p className="text-lg font-semibold leading-none text-[var(--color-text)]">{normalizedValue}%</p>
        <p className="mt-1 text-xs font-medium text-[var(--color-text-muted)]">Daily progress</p>
      </div>
    </div>
  );
}