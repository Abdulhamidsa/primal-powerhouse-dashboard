'use client';

interface Props {
  onContinue: () => void;
  onExit: () => void;
  isLoading: boolean;
}

export default function MobileExitConfirmation({ onContinue, onExit, isLoading }: Props) {
  function handleClose() {
    setTimeout(onContinue, 250);
  }

  return (
    <div className="absolute inset-0 z-50 flex h-screen w-screen items-center justify-center bg-black/60">
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl p-5 pt-4 transition-transform duration-300 ease-out bg-background "
      >
        {/* Drag handle (iOS-style) */}
        <div className="flex justify-center mb-4">
          <div className="w-9 h-1 rounded-full bg-muted" />
        </div>

        <h3 className="text-lg font-bold text-foreground">Leave workout?</h3>
        <p className="mt-1 text-sm text-muted-foreground">Your progress will be saved up to here.</p>

        <div className="mt-5 flex flex-col gap-2">
          <button
            disabled={isLoading}
            onClick={onExit}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white active:scale-[0.98] transition-transform disabled:opacity-60"
            style={{ background: 'var(--color-accent)' }}
          >
            {isLoading ? 'Saving…' : 'Exit & save'}
          </button>
          <button
            onClick={handleClose}
            className="w-full py-3.5 rounded-2xl text-sm font-medium text-foreground bg-muted/60 hover:bg-muted active:scale-[0.98] transition-all"
          >
            Continue workout
          </button>
        </div>
      </div>
    </div>
  );
}
