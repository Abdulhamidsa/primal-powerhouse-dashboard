import { Activity, ClipboardList, Dumbbell, Eye, Salad, UserSquare2 } from 'lucide-react';
import { cx } from '@/lib/ui';
import type { DashboardTabKey } from '@/features/admin-clients-dashboard/types/adminClientsDashboard.types';

const tabs: Array<{ key: DashboardTabKey; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { key: 'summary', label: 'Summary', icon: UserSquare2 },
  { key: 'nutrition', label: 'Nutrition', icon: Salad },
  { key: 'assignments', label: 'Assignments', icon: ClipboardList },
  { key: 'check-ins', label: 'Check-Ins', icon: Activity },
  { key: 'training', label: 'Training', icon: Dumbbell },
  { key: 'feature-visibility', label: 'Features', icon: Eye },
];

export function ClientDetailTabs({
  activeTab,
  onTabChangeAction,
  actions,
}: {
  activeTab: DashboardTabKey;
  onTabChangeAction: (tab: DashboardTabKey) => void;
  actions?: React.ReactNode;
}) {
  return (
    <div className="border-b pb-3" style={{ borderColor: 'var(--color-border)' }}>
      <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = tab.key === activeTab;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChangeAction(tab.key)}
                className={cx(
                  'inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'shadow-sm' : '',
                )}
                style={{
                  background: isActive ? 'var(--color-accent-muted)' : 'var(--color-surface)',
                  color: isActive ? 'var(--color-accent)' : 'var(--color-text)',
                  borderColor: isActive ? 'var(--color-accent)' : 'var(--color-border)',
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
