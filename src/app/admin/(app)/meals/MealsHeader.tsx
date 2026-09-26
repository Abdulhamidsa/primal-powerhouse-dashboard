import React from 'react';
import { PlusIcon as Plus, ChefHatIcon as ChefHat } from '@phosphor-icons/react/ssr';
import { Button } from '@/components/ui/button';

type MealsHeaderProps = {
  onCreateManual: () => void;
  onOpenBuilder: () => void;
};

export const MealsHeader = ({ onCreateManual, onOpenBuilder }: MealsHeaderProps) => {
  return (
    <header className="mb-6">
      <div className="card-base bg-[var(--color-surface)] px-5 py-5 rounded-2xl border border-[var(--color-border)]">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2 max-w-xl">
            <h1 className="text-foreground">Meal Management</h1>

            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
              Create and manage structured meals and templates for your clients.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={onCreateManual}
              className="flex items-center gap-2 bg-[var(--color-accent)] text-[var(--color-text-on-accent)] hover:opacity-90"
            >
              <Plus size={18} />
              Create Manually
            </Button>

            <Button variant="secondary" onClick={onOpenBuilder} className="flex items-center gap-2">
              <ChefHat size={18} />
              Add Meal Template
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
