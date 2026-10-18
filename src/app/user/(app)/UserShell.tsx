import Navigation from '@/components/Navigation';
import MessageNotificationBanner from '@/features/client-coach-messaging/components/MessageNotificationBanner';
import { OfflineProvider } from '@/features/offline/components/OfflineProvider';
import { OfflineStatusBanner } from '@/features/offline/components/OfflineStatusBanner';
import { PolicyUpdatePrompt } from '@/features/legal/components/PolicyUpdatePrompt';
import { WelcomeOnboardingDialog } from '@/features/user-onboarding/components/WelcomeOnboardingDialog';

export default function UserShell({ userId, accessMode, showWelcomeOnboarding, children }: { userId: string; accessMode: 'SELF_SERVICE' | 'COACHING'; showWelcomeOnboarding: boolean; children: React.ReactNode }) {
  return (
    <OfflineProvider userId={userId}>
      <Navigation userType="user" userId={userId}>
        <OfflineStatusBanner />
        <PolicyUpdatePrompt />
        <WelcomeOnboardingDialog initialOpen={showWelcomeOnboarding} />
        {children}
        {accessMode === 'COACHING' ? <MessageNotificationBanner userId={userId} chatPath="/user/chat" /> : null}
      </Navigation>
    </OfflineProvider>
  );
}
