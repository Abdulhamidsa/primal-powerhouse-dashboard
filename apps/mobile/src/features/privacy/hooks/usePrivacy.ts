import { useState } from 'react';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAction, useResource } from '@/features/resources/hooks/useResource';
import { useConnection } from '@/features/resources/hooks/useConnection';
import { reauthenticate } from '@/features/auth/api/auth.api';
import { getAuthState, saveSession } from '@/features/auth/api/sessionStore';
import { privacyDeleteRequestSchema } from '../schemas/privacy.schema';
import * as api from '../api/privacy.api';
import { usePushRegistration } from '@/features/chat/hooks/useNativeLifecycle';
import { clearMobileClientData } from '../api/clientCleanup';
export function usePrivacy() {
  const { offline } = useConnection();
  const push = usePushRegistration();
  const query = useResource('/api/privacy/center', api.getPrivacy, false); const action = useAction(['/api/privacy']); const [password, setPassword] = useState(''); const [confirmation, setConfirmation] = useState('');
  async function verify() { await reauthenticate(password); setPassword(''); }
  return { query, action, password, setPassword, confirmation, setConfirmation, offline, push,
    toggle: () => action.run(async () => {
      const next = !query.data!.notificationPreferences.coachMessagePushEnabled;
      if (next) await push.enable();
      return api.updateNotificationPreference({ coachMessagePushEnabled: next });
    }),
    acknowledgePolicy: (input: { type: 'TERMS' | 'PRIVACY_POLICY'; version: string }) =>
      action.run(async () => {
        const result = await api.acknowledgePolicy(input);
        await query.refresh();
        return result;
      }),
    export: () => action.run(async () => { await verify(); const job = await api.requestExport(); const data = await api.downloadExport(job.downloadUrl); const file = new File(Paths.cache, `primal-export-${Date.now()}.json`); file.create(); file.write(typeof data === 'string' ? data : JSON.stringify(data, null, 2)); try { if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'application/json' }); else throw new Error('Sharing is unavailable on this device.'); } finally { file.delete(); } return job; }),
    delete: () => action.run(async () => { const input = privacyDeleteRequestSchema.parse({ confirmText: confirmation }); await verify(); const clientId = getAuthState().session?.user.id; const result = await api.deleteAccount(input); await clearMobileClientData(clientId); await saveSession(null); return result; }),
    revoke: () => action.run(async () => { const result = await api.revokeSessions(); await saveSession(null); return result; }),
  };
}
