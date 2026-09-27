import { useEffect, useState } from 'react';
import { Button, Card, Copy, Field, Label, Screen, Status } from '@/components/ui';
import { hasVerifiedRecoveryEmail } from '@/lib/auth/recovery-status';
import { useProfile } from '../hooks/useProfile';

export default function AccountInfoScreen() {
  const m = useProfile();
  const user = m.profile.data?.user;
  const [name, setName] = useState('');

  useEffect(() => {
    setName(user?.name ?? '');
  }, [user?.name]);

  return (
    <Screen title="Account Info" subtitle="Manage the identity details connected to your account." onRefresh={m.profile.refresh} refreshing={m.profile.isValidating}>
      <Status loading={m.profile.isLoading} error={m.profile.error || m.action.error} notice={m.action.notice} cachedAt={m.profile.cachedAt} />
      {user ? (
        <Card>
          <Field label="Display name" value={name} onChange={setName} />
          <Button
            secondary
            title={m.action.pending ? 'Saving…' : 'Save display name'}
            disabled={m.offline || m.action.pending}
            onPress={async () => {
              await m.updateName(name);
              await m.profile.refresh();
            }}
          />
          <Label>Username</Label>
          <Copy muted>{user.username ? `@${user.username}` : 'Not set'}</Copy>
          <Label>Email</Label>
          <Copy muted>{user.email ?? 'Not added'}</Copy>
          <Label>Recovery</Label>
          <Copy muted>{hasVerifiedRecoveryEmail(user) ? 'Enabled' : 'Not set up'}</Copy>
        </Card>
      ) : null}
    </Screen>
  );
}
