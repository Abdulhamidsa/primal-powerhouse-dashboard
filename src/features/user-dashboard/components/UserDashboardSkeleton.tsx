export function UserDashboardSkeleton() {
  return (
    <div className="space-y-3 md:space-y-4">
      <section
        className="relative overflow-hidden rounded-[30px] border p-5 shadow-sm backdrop-blur-xl"
        style={{
          background:
            'radial-gradient(circle at top left, color-mix(in srgb, var(--color-accent) 18%, transparent), transparent 42%), linear-gradient(135deg, var(--color-surface), var(--color-bg-alt))',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/40 to-transparent" />
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-2xl" style={{ background: 'var(--color-bg-alt)' }} />
          <div className="min-w-0 flex-1">
            <div className="h-3 w-14 animate-pulse rounded-full" style={{ background: 'var(--color-bg-alt)' }} />
            <div className="mt-3 h-8 w-56 max-w-[78%] animate-pulse rounded-full" style={{ background: 'var(--color-bg-alt)' }} />
            <div className="mt-3 h-4 w-40 animate-pulse rounded-full" style={{ background: 'var(--color-bg-alt)' }} />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {[1, 2, 3].map(index => (
            <div
              key={index}
              className="rounded-2xl border px-3 py-2"
              style={{ background: 'color-mix(in srgb, var(--color-bg-alt) 76%, transparent)', borderColor: 'var(--color-border)' }}
            >
              <div className="h-2.5 w-10 animate-pulse rounded-full" style={{ background: 'var(--color-surface)' }} />
              <div className="mt-2 h-3.5 w-14 animate-pulse rounded-full" style={{ background: 'var(--color-surface)' }} />
            </div>
          ))}
        </div>

        <div className="mt-4 h-7 w-28 animate-pulse rounded-full" style={{ background: 'var(--color-bg-alt)' }} />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map(index => (
          <div
            key={index}
            className="relative overflow-hidden rounded-[26px] border p-4 shadow-sm"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/25 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-2xl" style={{ background: 'var(--color-bg-alt)' }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="h-4 w-20 animate-pulse rounded-full" style={{ background: 'var(--color-bg-alt)' }} />
                  <div className="h-5 w-11 animate-pulse rounded-full" style={{ background: 'var(--color-bg-alt)' }} />
                </div>
                <div className="mt-3 h-3 w-full animate-pulse rounded-full" style={{ background: 'var(--color-bg-alt)' }} />
                <div className="mt-2 h-3 w-4/5 animate-pulse rounded-full" style={{ background: 'var(--color-bg-alt)' }} />
                <div className="mt-4 h-3 w-16 animate-pulse rounded-full" style={{ background: 'var(--color-bg-alt)' }} />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section
        className="rounded-[26px] border px-4 py-3.5 shadow-sm"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-8 w-8 shrink-0 animate-pulse rounded-full" style={{ background: 'var(--color-bg-alt)' }} />
          <div className="min-w-0 flex-1">
            <div className="h-2.5 w-24 animate-pulse rounded-full" style={{ background: 'var(--color-bg-alt)' }} />
            <div className="mt-3 h-4 w-full animate-pulse rounded-full" style={{ background: 'var(--color-bg-alt)' }} />
            <div className="mt-2 h-4 w-2/3 animate-pulse rounded-full" style={{ background: 'var(--color-bg-alt)' }} />
          </div>
          <div className="h-4 w-9 shrink-0 animate-pulse rounded-full" style={{ background: 'var(--color-bg-alt)' }} />
        </div>
      </section>
    </div>
  );
}
