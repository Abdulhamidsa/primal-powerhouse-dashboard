import {
  PulseIcon as Activity,
  ChartBarIcon as BarChart,
  FilmSlateIcon as Film,
  ForkKnifeIcon as Utensils,
} from '@phosphor-icons/react/ssr';
import { cx, iosPanel, iosPanelStyle } from '@/lib/ui';
import { JSX } from 'react';
export function ClientQuickStats({
  videosCount,
  mealsCount,
  bmi,
  sessions,
}: {
  videosCount: number;
  mealsCount: number;
  bmi: string;
  sessions: number;
}) {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="grid gap-3 overflow-x-auto no-scrollbar sm:grid-cols-1 pb-2 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:pb-0">
        <Stat
          title="Assigned Videos"
          value={videosCount}
          icon={<Film aria-hidden="true" focusable="false" size={22} style={{ color: 'var(--color-accent)' }} />}
        />
        <Stat
          title="Assigned Meals"
          value={mealsCount}
          icon={<Utensils aria-hidden="true" focusable="false" size={22} style={{ color: 'var(--color-accent)' }} />}
        />
        <Stat
          title="BMI"
          value={bmi}
          icon={<BarChart aria-hidden="true" focusable="false" size={22} style={{ color: 'var(--color-accent)' }} />}
        />
        <Stat
          title="Sessions"
          value={sessions}
          icon={<Activity aria-hidden="true" focusable="false" size={22} style={{ color: 'var(--color-accent)' }} />}
        />
      </div>
    </div>
  );
}

function Stat({ title, value, icon }: { title: string; value: number | string; icon: JSX.Element }) {
  return (
    <div className={cx(iosPanel, 'p-5 min-w-[220px] md:min-w-0')} style={iosPanelStyle}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
            {title}
          </p>
          <p className="text-3xl font-semibold" style={{ color: 'var(--color-accent)' }}>
            {value}
          </p>
        </div>
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--color-bg-alt)' }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
