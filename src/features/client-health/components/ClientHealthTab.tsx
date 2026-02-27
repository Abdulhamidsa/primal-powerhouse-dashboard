'use client';

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, Search } from 'lucide-react';
import { useClientHealth } from '@/features/client-health/hooks/useClientHealth';
import type {
  DailyComplianceBreakdown,
  WeeklyComplianceBreakdown,
} from '@/features/client-health/types/clientHealth.types';

function formatPercent(value: number | null): string {
  if (value == null) return 'No Data';
  return `${value.toFixed(0)}%`;
}

function trendIcon(trend: WeeklyComplianceBreakdown['trend']) {
  if (trend === 'up') return <ArrowUp size={14} />;
  if (trend === 'down') return <ArrowDown size={14} />;
  return <ArrowRight size={14} />;
}

function riskPillClass(status: WeeklyComplianceBreakdown['riskStatus']): string {
  if (status === 'on_track') return 'risk-pill-on-track';
  if (status === 'needs_attention') return 'risk-pill-needs-attention';
  if (status === 'at_risk') return 'risk-pill-at-risk';
  return 'risk-pill-no-data';
}

function riskLabel(status: WeeklyComplianceBreakdown['riskStatus']): string {
  if (status === 'on_track') return 'On Track';
  if (status === 'needs_attention') return 'Needs Attention';
  if (status === 'at_risk') return 'At Risk';
  return 'No Data';
}

function formatDateLabel(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateKey;
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function ClientHealthTab({ clientId }: { clientId: string }) {
  const { data, isLoading, error } = useClientHealth(clientId);
  const [query, setQuery] = useState('');

  const history = useMemo(() => {
    const source = data?.dailyHistory ?? [];
    if (!query.trim()) return source;

    const term = query.toLowerCase();
    return source.filter(row => {
      const date = row.dateKey.toLowerCase();
      const risk = riskLabel(row.riskStatus).toLowerCase();
      return date.includes(term) || risk.includes(term);
    });
  }, [data?.dailyHistory, query]);

  if (isLoading) {
    return (
      <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
        Loading client health...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-sm" style={{ color: 'var(--color-danger)' }}>
        Failed to load health compliance data.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div
          className="rounded-2xl border p-4"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
        >
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Overall Compliance
          </p>
          <p className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
            {formatPercent(data.currentWeek.overallCompliance)}
          </p>
        </div>
        <div
          className="rounded-2xl border p-4"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
        >
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Training
          </p>
          <p className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
            {formatPercent(data.currentWeek.trainingCompliance)}
          </p>
        </div>
        <div
          className="rounded-2xl border p-4"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
        >
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Nutrition
          </p>
          <p className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
            {formatPercent(data.currentWeek.nutritionCompliance)}
          </p>
        </div>
        <div
          className="rounded-2xl border p-4"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
        >
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Check-In Completion
          </p>
          <p className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
            {formatPercent(data.currentWeek.checkInCompliance)}
          </p>
        </div>
        <div
          className="rounded-2xl border p-4"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
        >
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Risk Status
          </p>
          <span
            className={`inline-flex mt-2 px-2.5 py-1 rounded-full text-xs border ${riskPillClass(data.currentWeek.riskStatus)}`}
          >
            {riskLabel(data.currentWeek.riskStatus)}
          </span>
        </div>
      </section>

      <section
        className="rounded-2xl border p-4"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
            Daily Compliance History
          </h3>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5" style={{ color: 'var(--color-text-muted)' }} />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search date or risk"
              className="pl-8 pr-3 py-2 text-sm rounded-lg border"
              style={{
                background: 'var(--color-bg-alt)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}>
                <th className="text-left py-2">Date</th>
                <th className="text-left py-2">Training</th>
                <th className="text-left py-2">Nutrition</th>
                <th className="text-left py-2">Overall</th>
                <th className="text-left py-2">Trend</th>
                <th className="text-left py-2">Risk</th>
                <th className="text-left py-2">Last Check-In</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row: DailyComplianceBreakdown) => (
                <tr
                  key={row.dateKey}
                  className="border-b"
                  style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                >
                  <td className="py-2">{formatDateLabel(row.dateKey)}</td>
                  <td className="py-2">{formatPercent(row.trainingCompliance)}</td>
                  <td className="py-2">{formatPercent(row.nutritionCompliance)}</td>
                  <td className="py-2">{formatPercent(row.overallCompliance)}</td>
                  <td className="py-2">
                    <span className="inline-flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                      {trendIcon(row.trend)}
                      {row.trendDelta == null
                        ? 'No Data'
                        : `${row.trendDelta > 0 ? '+' : ''}${row.trendDelta.toFixed(0)}%`}
                    </span>
                  </td>
                  <td className="py-2">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${riskPillClass(row.riskStatus)}`}
                    >
                      {riskLabel(row.riskStatus)}
                    </span>
                  </td>
                  <td className="py-2">{row.lastCheckInDate ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <style jsx>{`
        .risk-pill-on-track {
          background: var(--color-accent-muted);
          color: var(--color-accent);
          border-color: var(--color-accent);
        }

        .risk-pill-needs-attention {
          background: var(--color-bg-alt);
          color: var(--color-text);
          border-color: var(--color-border);
        }

        .risk-pill-at-risk {
          background: var(--color-bg-alt);
          color: var(--color-danger);
          border-color: var(--color-danger);
        }

        .risk-pill-no-data {
          background: var(--color-bg-alt);
          color: var(--color-text-muted);
          border-color: var(--color-border);
        }
      `}</style>
    </div>
  );
}
