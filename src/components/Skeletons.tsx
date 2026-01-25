/**
 * Skeleton/Placeholder components that flash while loading
 * These give visual feedback about what content is coming
 */

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-3xl border border-border bg-card p-6 animate-pulse ${className}`}>
      <div className="space-y-3">
        <div className="h-6 w-32 bg-muted/50 rounded-lg" />
        <div className="h-4 w-full bg-muted/50 rounded-lg" />
        <div className="h-4 w-3/4 bg-muted/50 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonMealCard() {
  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card animate-pulse">
      {/* Image placeholder */}
      <div className="h-40 bg-muted/50" />
      {/* Content placeholder */}
      <div className="p-4 space-y-3">
        <div className="h-5 w-2/3 bg-muted/50 rounded-lg" />
        <div className="h-4 w-full bg-muted/50 rounded-lg" />
        <div className="flex gap-2 pt-2">
          <div className="h-3 w-12 bg-muted/50 rounded-lg" />
          <div className="h-3 w-12 bg-muted/50 rounded-lg" />
          <div className="h-3 w-12 bg-muted/50 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonUserProfile() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-md px-4 pb-10 pt-8 animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center gap-4 px-1 pb-6">
          <div className="h-16 w-16 rounded-2xl bg-muted/50 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-32 bg-muted/50 rounded-lg" />
            <div className="h-4 w-48 bg-muted/50 rounded-lg" />
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="flex gap-3 mb-6 px-1">
          <div className="flex-1 h-12 bg-muted/50 rounded-2xl" />
          <div className="flex-1 h-12 bg-muted/50 rounded-2xl" />
        </div>

        {/* Content area skeleton */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-3 w-20 bg-muted/50 rounded-lg" />
            <div className="overflow-hidden rounded-2xl border border-border bg-card space-y-3 p-4">
              <div className="h-4 w-full bg-muted/50 rounded-lg" />
              <div className="h-4 w-full bg-muted/50 rounded-lg" />
              <div className="h-4 w-3/4 bg-muted/50 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="px-4 py-6 md:px-6 animate-pulse">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header skeleton */}
        <div className="space-y-3">
          <div className="h-8 w-48 bg-muted/50 rounded-lg" />
          <div className="h-4 w-64 bg-muted/50 rounded-lg" />
        </div>

        {/* Quote card skeleton */}
        <div className="rounded-3xl border border-border bg-card p-6 space-y-3">
          <div className="h-4 w-32 bg-muted/50 rounded-lg" />
          <div className="h-6 w-full bg-muted/50 rounded-lg" />
          <div className="h-6 w-5/6 bg-muted/50 rounded-lg" />
        </div>

        {/* Coach message skeleton */}
        <div className="rounded-3xl border border-border bg-card p-6 space-y-3">
          <div className="h-4 w-40 bg-muted/50 rounded-lg" />
          <div className="h-4 w-full bg-muted/50 rounded-lg" />
          <div className="h-4 w-4/5 bg-muted/50 rounded-lg" />
        </div>

        {/* Cards grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-3xl border border-border bg-card p-6 space-y-3">
              <div className="h-6 w-20 bg-muted/50 rounded-lg" />
              <div className="h-4 w-full bg-muted/50 rounded-lg" />
              <div className="h-3 w-3/4 bg-muted/50 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Banner skeleton */}
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="h-4 w-full bg-muted/50 rounded-lg" />
          <div className="h-4 w-4/5 bg-muted/50 rounded-lg mt-2" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonMealGrid() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <SkeletonMealCard key={i} />
        ))}
      </div>
    </div>
  );
}
