export default function UserCheckInsLoading() {
  return (
    <div className="px-4 pb-8 pt-4 md:px-5">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <div className="h-16 animate-pulse rounded-3xl bg-card/60" />
        <div className="h-72 animate-pulse rounded-[30px] border border-border bg-card/60" />
        <div className="h-56 animate-pulse rounded-[30px] border border-border bg-card/50" />
      </div>
    </div>
  );
}
