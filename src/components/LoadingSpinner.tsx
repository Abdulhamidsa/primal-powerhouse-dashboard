import { CircleNotchIcon as Loader2 } from '@phosphor-icons/react/ssr';

export function LoadingSpinner({ message = 'Loading…' }: { message?: string } = {}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="rounded-full bg-muted p-4">
        <Loader2 aria-hidden="true" focusable="false" className="h-6 w-6 animate-spin text-accent" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
