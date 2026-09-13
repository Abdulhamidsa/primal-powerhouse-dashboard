export default function UserMyPlanLoading() {
  return (
    <div className="px-4 pb-6 pt-4 md:px-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="h-16 animate-pulse rounded-3xl bg-card/60" />
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-72 animate-pulse rounded-[30px] border border-border bg-card/60" />
        ))}
      </div>
    </div>
  );
}
