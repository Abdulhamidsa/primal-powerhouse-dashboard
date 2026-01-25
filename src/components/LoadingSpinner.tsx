import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ message = 'Loading…' }: { message?: string } = {}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="rounded-full bg-muted p-4">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
