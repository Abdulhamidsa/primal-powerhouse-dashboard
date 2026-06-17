export function UserDashboardSkeleton() {
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-3 w-20 animate-pulse rounded-full bg-muted/40" />
            <div className="h-8 w-44 animate-pulse rounded-2xl bg-muted/40" />
            <div className="h-4 w-64 max-w-full animate-pulse rounded-full bg-muted/40" />
          </div>
          <div className="h-10 w-10 animate-pulse rounded-full bg-muted/40" />
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-muted/20 p-4">
          <div className="h-3 w-16 animate-pulse rounded-full bg-muted/40" />
          <div className="mt-2 h-4 w-full animate-pulse rounded-full bg-muted/40" />
          <div className="mt-2 h-4 w-4/5 animate-pulse rounded-full bg-muted/40" />
        </div>
      </section>

      <section className="space-y-3">
        <div className="h-4 w-28 animate-pulse rounded-full bg-muted/40" />
        <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-3">
            {[1, 2, 3, 4].map(index => (
              <div key={index} className="min-w-[128px] rounded-3xl border border-border bg-card p-4 shadow-sm">
                <div className="h-11 w-11 animate-pulse rounded-2xl bg-muted/40" />
                <div className="mt-4 h-4 w-20 animate-pulse rounded-full bg-muted/40" />
                <div className="mt-2 h-3 w-16 animate-pulse rounded-full bg-muted/40" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <div className="h-4 w-24 animate-pulse rounded-full bg-muted/40" />
        <div className="mt-3 h-6 w-2/3 animate-pulse rounded-full bg-muted/40" />
        <div className="mt-2 h-4 w-full animate-pulse rounded-full bg-muted/40" />
        <div className="mt-4 rounded-2xl border border-border bg-muted/20 p-4">
          <div className="h-2.5 w-full animate-pulse rounded-full bg-muted/40" />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="h-10 animate-pulse rounded-2xl bg-muted/40" />
            <div className="h-10 animate-pulse rounded-2xl bg-muted/40" />
          </div>
        </div>
      </section>
    </div>
  );
}
