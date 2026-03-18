'use client';

import { UserTrainingAssignments } from '@/features/training/components/UserTrainingAssignments';

export default function UserTrainingPage() {
  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <UserTrainingAssignments showHeader />
      </div>
    </div>
  );
}
