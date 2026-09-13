export default function UserDashboardLoading() {
  return (
    <div className="px-4 pb-6 pt-4 md:px-5">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div className="h-40 animate-pulse rounded-[30px] border border-border bg-card/70" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-28 animate-pulse rounded-[26px] border border-border bg-card/60" />
          <div className="h-28 animate-pulse rounded-[26px] border border-border bg-card/60" />
        </div>
        <div className="h-52 animate-pulse rounded-[30px] border border-border bg-card/60" />
      </div>
    </div>
  );
}
