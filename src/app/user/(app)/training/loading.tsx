export default function UserTrainingLoading() {
  return (
    <div className="px-4 pb-8 pt-4 md:px-6">
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <div className="h-16 animate-pulse rounded-3xl bg-card/60" />
        <div className="h-56 animate-pulse rounded-[30px] border border-border bg-card/70" />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-2xl border border-border bg-card/50" />
          ))}
        </div>
      </div>
    </div>
  );
}
