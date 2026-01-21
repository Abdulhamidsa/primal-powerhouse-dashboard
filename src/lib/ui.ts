export type ClassValue = string | false | undefined | null;

export const cx = (...classes: ClassValue[]) => classes.filter(Boolean).join(' ');

export const iosPanel = 'rounded-2xl border shadow-sm';

export const iosPanelStyle = {
  background: 'var(--color-surface)',
  borderColor: 'var(--color-border)',
} as const;

export const iosCardStyle = {
  background: 'var(--color-bg-alt)',
  borderColor: 'var(--color-border)',
} as const;
