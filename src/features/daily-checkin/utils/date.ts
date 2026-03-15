export function toDateKeyLocal(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayDateKeyLocal(): string {
  return toDateKeyLocal(new Date());
}

export function parseDateKeyLocal(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function parseDateKeyUtc(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function toDateKeyUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getRecentDateKeys(count: number, fromDate: Date = new Date()): string[] {
  const start = new Date(fromDate);
  start.setHours(0, 0, 0, 0);

  return Array.from({ length: count }, (_, index) => toDateKeyLocal(addDays(start, -index)));
}

const shortDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
});

export function formatShortDateLabel(dateKey: string): string {
  return shortDateFormatter.format(parseDateKeyLocal(dateKey));
}
