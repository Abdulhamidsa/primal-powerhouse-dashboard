export default function UserChatLoading() {
  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--color-bg)]">
      <div
        className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="h-11 w-11 animate-pulse rounded-full bg-[var(--color-bg-alt)]" />
        <div className="h-4 w-28 animate-pulse rounded-full bg-[var(--color-bg-alt)]" />
      </div>
      <div className="flex flex-1 flex-col justify-end gap-4 px-4 py-5">
        <div className="h-14 w-[70%] animate-pulse rounded-[24px] bg-[var(--color-surface)]" />
        <div className="ml-auto h-14 w-[56%] animate-pulse rounded-[24px] bg-[var(--color-surface)]" />
        <div className="h-14 w-[64%] animate-pulse rounded-[24px] bg-[var(--color-surface)]" />
      </div>
      <div className="border-t border-[var(--color-border)] p-2">
        <div className="h-16 animate-pulse rounded-[30px] bg-[var(--color-surface)]" />
      </div>
    </div>
  );
}
