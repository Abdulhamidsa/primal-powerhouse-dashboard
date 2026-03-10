import { Activity, ClipboardList, Salad, UserSquare2 } from 'lucide-react';
import { cx } from '@/lib/ui';
import type { DashboardTabKey } from '@/features/admin-clients-dashboard/types/adminClientsDashboard.types';

const tabs: Array<{ key: DashboardTabKey; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { key: 'summary', label: 'Summary', icon: UserSquare2 },
  { key: 'nutrition', label: 'Nutrition', icon: Salad },
  { key: 'assignments', label: 'Assignments', icon: ClipboardList },
  { key: 'check-ins', label: 'Check-Ins', icon: Activity },
];

export function ClientDetailTabs({
  activeTab,
  onTabChangeAction,
}: {
  activeTab: DashboardTabKey;
  onTabChangeAction: (tab: DashboardTabKey) => void;
}) {
  return (
    <div className="border-b pb-3" style={{ borderColor: 'var(--color-border)' }}>
      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = tab.key === activeTab;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChangeAction(tab.key)}
              className={cx(
                'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'shadow-sm' : ''
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
    </div>
  );
}
