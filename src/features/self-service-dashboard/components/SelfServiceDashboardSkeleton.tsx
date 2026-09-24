export function SelfServiceDashboardSkeleton() {
  return (
    <div className="space-y-3">
      <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="h-2.5 w-24 animate-pulse rounded-full bg-[var(--color-bg-alt)]" />
        <div className="mt-4 h-8 w-52 animate-pulse rounded-full bg-[var(--color-bg-alt)]" />
        <div className="mt-3 h-4 w-40 animate-pulse rounded-full bg-[var(--color-bg-alt)]" />
        <div className="mt-6 h-12 w-full animate-pulse rounded-2xl bg-[var(--color-bg-alt)]" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map(item => <div key={item} className="h-40 animate-pulse rounded-[26px] border border-[var(--color-border)] bg-[var(--color-surface)]" />)}
      </div>
      <div className="h-24 animate-pulse rounded-[26px] border border-[var(--color-border)] bg-[var(--color-surface)]" />
    </div>
  );
}
