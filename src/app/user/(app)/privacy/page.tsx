import { PageHeader } from '@/components/PageHeader';
import { PrivacyDataCenter } from '@/features/privacy/components/PrivacyDataCenter';

export default function UserPrivacyPage() {
  return (
    <div className="px-4 pb-8 md:px-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <PageHeader
          title="Privacy & Data"
          description="Manage your data export, deletion requests, consent settings, and active sessions."
        />
        <PrivacyDataCenter />
      </div>
    </div>
  );
}
