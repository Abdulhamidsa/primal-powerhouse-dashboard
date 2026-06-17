export function UserDashboardSkeleton() {
  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[30px] border border-black/5 bg-white/70 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200/80" />

        <div className="mt-4 flex items-start gap-3">
          <div className="h-12 w-12 animate-pulse rounded-full bg-slate-200/80" />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-8 w-3/5 animate-pulse rounded-full bg-slate-200/80" />
            <div className="h-4 w-4/5 animate-pulse rounded-full bg-slate-200/80" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <div className="h-8 w-28 animate-pulse rounded-full bg-slate-200/80" />
          <div className="h-8 w-44 animate-pulse rounded-full bg-slate-200/80" />
        </div>

        <div className="mt-4 rounded-[24px] border border-black/5 bg-slate-50/80 p-4">
          <div className="h-3 w-20 animate-pulse rounded-full bg-slate-200/80" />
          <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-slate-200/80" />
          <div className="mt-2 h-4 w-4/5 animate-pulse rounded-full bg-slate-200/80" />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(index => (
          <div
            key={index}
            className="rounded-[22px] border border-black/5 bg-white/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
          >
            <div className="h-10 w-10 animate-pulse rounded-2xl bg-slate-200/80" />
            <div className="mt-4 h-4 w-20 animate-pulse rounded-full bg-slate-200/80" />
            <div className="mt-2 h-3 w-28 animate-pulse rounded-full bg-slate-200/80" />
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-[30px] border border-black/5 bg-white/70 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200/80" />
        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-8 w-2/3 animate-pulse rounded-full bg-slate-200/80" />
            <div className="h-4 w-11/12 animate-pulse rounded-full bg-slate-200/80" />
          </div>
          <div className="h-8 w-16 animate-pulse rounded-full bg-slate-200/80" />
        </div>
        <div className="mt-5 h-2 rounded-full bg-slate-200/80" />
        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          {[1, 2, 3].map(index => (
            <div key={index} className="rounded-[18px] border border-black/5 bg-slate-50/80 px-3 py-2.5">
              <div className="h-3 w-14 animate-pulse rounded-full bg-slate-200/80" />
              <div className="mt-2 h-4 w-20 animate-pulse rounded-full bg-slate-200/80" />
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="h-11 animate-pulse rounded-full bg-slate-200/80" />
          <div className="h-11 w-full animate-pulse rounded-full bg-slate-200/80 sm:w-28" />
        </div>
      </section>
    </div>
  );
}
