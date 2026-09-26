'use client';

import { HandbookReader } from '@/features/learn/components/HandbookReader';
import { MethodLanding } from '@/features/learn/components/MethodLanding';
import { PrimalFaq } from '@/features/learn/components/PrimalFaq';
import { useHandbookReader } from '@/features/learn/hooks/useHandbookReader';

export function LearnExperience() {
  const reader = useHandbookReader();

  return (
    <div className="overflow-x-clip bg-[var(--color-bg)] text-[var(--color-text)]">
      <MethodLanding pageIndex={reader.pageIndex} onOpen={reader.open} />
      <PrimalFaq />
      <HandbookReader isOpen={reader.isOpen} pageIndex={reader.pageIndex} onClose={reader.close} onNext={reader.next} onPrevious={reader.previous} onNavigate={reader.goToPage} />
    </div>
  );
}
