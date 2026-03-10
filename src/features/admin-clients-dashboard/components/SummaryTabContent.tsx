import { Mail, Phone, Ruler, Scale, Timer } from 'lucide-react';
import { calculateBMI } from '@/lib/health/calculators';
import { WeightTargetProgressCard } from '@/features/admin-clients-dashboard/components/WeightTargetProgressCard';
import type { AdminClientDetail } from '@/features/admin-clients-dashboard/types/adminClientsDashboard.types';

export function SummaryTabContent({
  client,
  onEditProfileAction,
}: {
  client: AdminClientDetail;
  onEditProfileAction: () => void;
}) {
  const bmi =
    typeof client.currentWeight === 'number' && typeof client.height === 'number'
      ? calculateBMI(client.currentWeight, client.height)
      : null;

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl border p-5"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
              {client.name}
            </h2>
            <div className="mt-2 space-y-1">
              <p className="text-sm inline-flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                <Mail size={14} /> {client.email}
              </p>
              <p className="text-sm inline-flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                <Phone size={14} /> {client.phone || 'Not provided'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onEditProfileAction}
            className="rounded-lg border px-3 py-2 text-sm font-medium"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          >
            Edit Profile
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <MetricTile label="Status" value={client.status} />
          <MetricTile label="BMI" value={bmi == null ? 'N/A' : bmi.toFixed(1)} />
          <MetricTile label="Age" value={client.age == null ? 'N/A' : `${client.age}`} icon={<Timer size={14} />} />
          <MetricTile
            label="Sessions"
            value={client.sessionsCompleted == null ? '0' : `${client.sessionsCompleted}`}
            icon={<Scale size={14} />}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WeightTargetProgressCard currentWeight={client.currentWeight} targetWeight={client.targetWeight} />

        <div
          className="rounded-2xl border p-5"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
        >
          <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
            Body Metrics
          </h3>
          <div className="space-y-2 text-sm">
            <Row
              label="Height"
              value={client.height == null ? 'N/A' : `${client.height} cm`}
              icon={<Ruler size={14} />}
            />
            <Row
              label="Current Weight"
              value={client.currentWeight == null ? 'N/A' : `${client.currentWeight} kg`}
              icon={<Scale size={14} />}
            />
            <Row
              label="Target Weight"
              value={client.targetWeight == null ? 'N/A' : `${client.targetWeight} kg`}
              icon={<Scale size={14} />}
            />
            <Row label="Activity" value={client.activityLevel || 'N/A'} />
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl border p-5"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
          Goals and Restrictions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TagSection title="Goals" items={client.goals} emptyLabel="No goals configured" />
          <TagSection title="Dietary Restrictions" items={client.dietaryRestrictions} emptyLabel="No restrictions" />
        </div>
      </div>
    </div>
  );
}

function MetricTile({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border px-3 py-2"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
    >
      <p className="text-xs mb-1 inline-flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
        {icon}
        {label}
      </p>
      <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
        {value}
      </p>
    </div>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="inline-flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
        {icon}
        {label}
      </span>
      <span style={{ color: 'var(--color-text)' }}>{value}</span>
    </div>
  );
}

function TagSection({ title, items, emptyLabel }: { title: string; items: string[]; emptyLabel: string }) {
  return (
    <div>
      <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.length ? (
          items.map(item => (
            <span
              key={item}
              className="rounded-full px-2.5 py-1 text-xs"
              style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text)' }}
            >
              {item}
            </span>
          ))
        ) : (
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {emptyLabel}
          </span>
        )}
      </div>
    </div>
  );
}
