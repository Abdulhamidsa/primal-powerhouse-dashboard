'use client';

import { HandbookCover } from '@/features/learn/components/HandbookCover';
import { HandbookReader } from '@/features/learn/components/HandbookReader';
import { MethodSystem } from '@/features/learn/components/MethodSystem';
import { PrimalFaq } from '@/features/learn/components/PrimalFaq';
import { useHandbookReader } from '@/features/learn/hooks/useHandbookReader';

export function LearnExperience() {
  const reader = useHandbookReader();

  return (
    <div className="overflow-x-clip bg-[var(--color-bg)] pb-32 text-[var(--color-text)]">
      <HandbookCover onOpen={() => reader.open()} />
      <MethodSystem />
      <PrimalFaq onOpenHandbook={reader.open} />
      <HandbookReader isOpen={reader.isOpen} pageIndex={reader.pageIndex} onClose={reader.close} onNext={reader.next} onPrevious={reader.previous} onNavigate={reader.goToPage} />
    </div>
  );
}
