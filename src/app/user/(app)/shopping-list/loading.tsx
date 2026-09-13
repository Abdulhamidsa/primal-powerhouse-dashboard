export default function UserShoppingListLoading() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto w-full max-w-xl space-y-4 px-4 pb-10 pt-4">
        <div className="h-44 animate-pulse rounded-[32px] border border-border bg-card/70" />
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-48 animate-pulse rounded-[28px] border border-border bg-card/60" />
        ))}
      </div>
    </div>
  );
}
