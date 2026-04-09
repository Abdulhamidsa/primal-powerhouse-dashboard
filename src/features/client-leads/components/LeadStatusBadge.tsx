import type { LeadStatus } from '@/features/client-leads/types/clientLead.types';

const STATUS_CONFIG: Record<LeadStatus, { label: string; bg: string; text: string; dot: string }> = {
  CONTACTED: {
    label: 'Contacted',
    bg: 'var(--color-bg-alt)',
    text: 'var(--color-text-muted)',
    dot: 'var(--color-text-muted)',
  },
  HAD_MEETING: {
    label: 'Had Meeting',
    bg: 'rgba(59,130,246,0.12)',
    text: 'rgb(96,165,250)',
    dot: 'rgb(96,165,250)',
  },
  MADE_DEAL: {
    label: 'Made Deal',
    bg: 'rgba(34,197,94,0.12)',
    text: 'rgb(74,222,128)',
    dot: 'rgb(74,222,128)',
  },
  CONVERTED: {
    label: 'Converted',
    bg: 'var(--color-accent-muted)',
    text: 'var(--color-accent)',
    dot: 'var(--color-accent)',
  },
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.CONTACTED;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

export { STATUS_CONFIG };
