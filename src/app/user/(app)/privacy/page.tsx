import { PrivacyDataCenter } from '@/features/privacy/components/PrivacyDataCenter';

export default function UserPrivacyPage() {
  return (
    <div className="px-4 py-6 md:px-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Privacy & Data</h1>
          <p className="text-sm text-muted-foreground">
            Manage your data export, deletion requests, consent settings, and active sessions.
          </p>
        </div>
        <PrivacyDataCenter />
      </div>
    </div>
  );
}
