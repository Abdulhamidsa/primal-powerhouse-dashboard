import { useAction, useDraft, useResource } from '@/features/resources/hooks/useResource';
import { useMedia } from '@/features/media/hooks/useMedia';
import { uploadPhoto } from '@/features/media/api/media.api';
import { useLogout } from '@/features/auth/hooks/useAuth';
import { usePushRegistration } from '@/features/chat/hooks/useNativeLifecycle';
import { useConnection } from '@/features/resources/hooks/useConnection';
import { avatarSchema, feedbackSchema } from '../schemas/profile.schema';
import { privacyConsentSchema } from '@/features/privacy/schemas/privacy.schema';
import * as privacyApi from '@/features/privacy/api/privacy.api';
import * as api from '../api/profile.api';
export function useProfile() {
  const { offline } = useConnection();
  const profile = useResource('/api/auth/me', api.getProfile); const privacy = useResource('/api/privacy/center', privacyApi.getPrivacy, false); const action = useAction(['/api/auth/me', '/api/user/coach', '/api/privacy']); const media = useMedia(); const logout = useLogout(); const push = usePushRegistration(); const feedback = useDraft('feedback', '');
  return { profile, privacy, action, media, logout, push, feedback, offline,
    avatar: () => action.run(async () => { const file = await media.pick(); if (!file) return; const url = await uploadPhoto(file, 'profile-avatars'); return api.saveAvatar(avatarSchema.parse({ avatar: url })); }),
    removeAvatar: () => action.run(() => api.saveAvatar(avatarSchema.parse({ avatar: null }))),
    sendFeedback: () => action.run(async () => { const result = await api.sendFeedback(feedbackSchema.parse({ message: feedback.value })); feedback.setValue(''); return result; }),
    enableNotifications: () => action.run(async () => {
      if (!privacy.data) throw new Error('Privacy settings are still loading.');
      await push.enable();
      return privacyApi.updateConsent(privacyConsentSchema.parse({ ...privacy.data.consents, messageNotifications: true }));
    }),
  };
}
