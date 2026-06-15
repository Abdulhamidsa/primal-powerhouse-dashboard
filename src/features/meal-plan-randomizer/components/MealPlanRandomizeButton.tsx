'use client';

import { Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type MealPlanRandomizeButtonProps = {
  onClick: () => void;
  confirmOpen: boolean;
  onConfirmOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isRandomizing: boolean;
  hasExistingSelection: boolean;
  errorMessage: string | null;
  disabled?: boolean;
};

export function MealPlanRandomizeButton({
  onClick,
  confirmOpen,
  onConfirmOpenChange,
  onConfirm,
  isRandomizing,
  hasExistingSelection,
  errorMessage,
  disabled = false,
}: MealPlanRandomizeButtonProps) {
  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={onClick}
        disabled={isRandomizing || disabled}
        className="h-10 rounded-full border-border bg-card px-4 text-sm font-medium text-foreground shadow-sm"
      >
        <Shuffle size={14} />
        Randomize
      </Button>

      {errorMessage ? <p className="mt-2 text-xs text-destructive">{errorMessage}</p> : null}

      <Dialog open={confirmOpen} onOpenChange={onConfirmOpenChange}>
        <DialogContent className="rounded-[28px] border-border bg-card p-5 sm:max-w-md">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="text-[20px] tracking-tight">Randomize meals?</DialogTitle>
            <DialogDescription className="text-sm leading-6 text-muted-foreground">
              {hasExistingSelection
                ? 'This will replace your current selection with a new random plan.'
                : 'We will pick a random breakfast, lunch, dinner, and snacks for you.'}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-border bg-muted/20 px-4 py-3 text-sm leading-6 text-foreground">
            {hasExistingSelection
              ? 'Your current selection will be removed before we build the new plan.'
              : 'You can still review and swap any meal after randomizing.'}
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => onConfirmOpenChange(false)}
              className="h-10 rounded-full px-4"
            >
              Cancel
            </Button>

            <Button type="button" onClick={onConfirm} disabled={isRandomizing} className="h-10 rounded-full px-4">
              {isRandomizing ? 'Randomizing...' : 'Continue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
