import { ArchiveIcon as Archive, EnvelopeSimpleIcon as Mail, PhoneIcon as Phone, RulerIcon as Ruler, ScalesIcon as Scale, TimerIcon as Timer, ArrowCounterClockwiseIcon as Undo2 } from '@phosphor-icons/react/ssr';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { HealthMetricsResults } from '@/components/HealthMetricsResults';
import { HealthMetricsWidget } from '@/components/client-profile/HealthMetricsWidget';
import { calculateBMI } from '@/lib/health/calculators';
import type { HealthMetricsOutput } from '@/lib/health/calculators';
import { WeightTargetProgressCard } from '@/features/admin-clients-dashboard/components/WeightTargetProgressCard';
import { WeightProjectionTimelineCard } from '@/features/admin-clients-dashboard/components/WeightProjectionTimelineCard';
import { MotivationalMessageTab } from '@/features/admin-clients-dashboard/components/MotivationalMessageTab';
import type { AdminClientDetail } from '@/features/admin-clients-dashboard/types/adminClientsDashboard.types';
import type { AdminWeeklyCheckInListItem } from '@/features/weekly-checkin/types/adminWeeklyCheckIn.types';

export function SummaryTabContent({
  client,
  summaryWeightKg,
  weeklyWeightHistory,
  onEditProfileAction,
  healthMetricsResult,
  onOpenHealthMetricsAction,
  onCloseHealthMetricsResultsAction,
  onHealthMetricsNotesSavedAction,
  onArchiveClientAction,
  onRefreshClientAction,
}: {
  client: AdminClientDetail;
  summaryWeightKg: number | null;
  weeklyWeightHistory: AdminWeeklyCheckInListItem[];
  onEditProfileAction: () => void;
  healthMetricsResult: HealthMetricsOutput | null;
  onOpenHealthMetricsAction: () => void;
  onCloseHealthMetricsResultsAction: () => void;
  onHealthMetricsNotesSavedAction: () => void;
  onArchiveClientAction: () => void;
  onRefreshClientAction?: () => void;
}) {
  const bmi =
    typeof summaryWeightKg === 'number' && typeof client.height === 'number'
      ? calculateBMI(summaryWeightKg, client.height)
      : null;

  const bmiCategory =
    bmi == null ? 'unknown' : bmi < 18.5 ? 'underweight' : bmi < 25 ? 'normal' : bmi < 30 ? 'overweight' : 'obese';

  const goalMacros = parseGoalMacros(client.goalMacros);

  const weeklyTrendData = weeklyWeightHistory
    .filter(item => item.weightKg != null)
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
    .slice(-12)
    .map(item => ({
      week: new Date(item.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      weightKg: Number(item.weightKg),
    }));

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
                <Mail aria-hidden="true" focusable="false" size={14} /> {client.email}
              </p>
              <p className="text-sm inline-flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                <Phone aria-hidden="true" focusable="false" size={14} /> {client.phone || 'Not provided'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEditProfileAction}
              className="rounded-lg border px-3 py-2 text-sm font-medium"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            >
              Edit Profile
            </button>

            <button
              type="button"
              onClick={onArchiveClientAction}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              {client.status === 'ARCHIVED' ? (
                <>
                  <Undo2 aria-hidden="true" focusable="false" size={14} /> Restore
                </>
              ) : (
                <>
                  <Archive aria-hidden="true" focusable="false" size={14} /> Archive
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <MetricTile label="Status" value={client.status} />
          <MetricTile label="BMI" value={bmi == null ? 'N/A' : bmi.toFixed(1)} />
          <MetricTile label="Age" value={client.age == null ? 'N/A' : `${client.age}`} icon={<Timer aria-hidden="true" focusable="false" size={14} />} />
          <MetricTile
            label="Sessions"
            value={client.sessionsCompleted == null ? '0' : `${client.sessionsCompleted}`}
            icon={<Scale aria-hidden="true" focusable="false" size={14} />}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WeightTargetProgressCard currentWeight={summaryWeightKg} targetWeight={client.targetWeight} />

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
              icon={<Ruler aria-hidden="true" focusable="false" size={14} />}
            />
            <Row
              label="Current Weight"
              value={summaryWeightKg == null ? 'N/A' : `${summaryWeightKg} kg`}
              icon={<Scale aria-hidden="true" focusable="false" size={14} />}
            />
            <Row
              label="Target Weight"
              value={client.targetWeight == null ? 'N/A' : `${client.targetWeight} kg`}
              icon={<Scale aria-hidden="true" focusable="false" size={14} />}
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
          Weight History (Last 12 Check-ins)
        </h3>
        {weeklyTrendData.length >= 2 ? (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrendData} margin={{ top: 8, right: 10, left: 0, bottom: 6 }}>
                <XAxis
                  dataKey="week"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                  domain={['dataMin - 1', 'dataMax + 1']}
                />
                <Tooltip
                  formatter={value => `${Number(value).toFixed(1)} kg`}
                  contentStyle={{
                    borderColor: 'var(--color-border)',
                    borderRadius: '10px',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text)',
                  }}
                />
                <Line
                  dataKey="weightKg"
                  type="monotone"
                  stroke="var(--color-accent)"
                  strokeWidth={2.5}
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Not enough weekly weight records yet to show a trend.
          </p>
        )}
      </div>

      <WeightProjectionTimelineCard
        clientName={client.name}
        currentWeightKg={summaryWeightKg}
        targetWeightKg={client.targetWeight}
        weeklyCheckIns={weeklyWeightHistory}
        healthMetrics={healthMetricsResult}
      />

      <HealthMetricsWidget
        bmi={bmi}
        goalCalories={client.goalCalories}
        goalMacros={goalMacros}
        bmiCategory={bmiCategory}
        onUpdate={onOpenHealthMetricsAction}
      />

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

      {healthMetricsResult ? (
        <HealthMetricsResults
          clientId={client.id}
          metrics={healthMetricsResult}
          onCloseAction={onCloseHealthMetricsResultsAction}
          onSaveNotesAction={() => {
            onHealthMetricsNotesSavedAction();
          }}
        />
      ) : null}

      <MotivationalMessageTab
        clientId={client.id}
        clientName={client.name}
        currentMessage={client.motivationalMessage}
        onRefreshAction={onRefreshClientAction ?? (() => {})}
      />
    </div>
  );
}

function parseGoalMacros(goalMacros: string | null): { protein: number; carbs: number; fat: number } | null {
  if (!goalMacros) return null;

  try {
    const parsed = JSON.parse(goalMacros) as Record<string, unknown>;
    const protein = Number(parsed.protein);
    const carbs = Number(parsed.carbs);
    const fat = Number(parsed.fat);

    if ([protein, carbs, fat].some(value => Number.isNaN(value))) {
      return null;
    }

    return {
      protein,
      carbs,
      fat,
    };
  } catch {
    return null;
  }
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
