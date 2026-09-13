import { Image } from 'react-native';
import { Link } from 'expo-router';
import { Button, Card, Copy, Field, Label, Screen, Status } from '@/components/ui';
import { useTheme } from '@/features/theme/hooks/useTheme';
import { useProfile } from '../hooks/useProfile';

export default function ProfileScreen() {
  const theme = useTheme();
  const m = useProfile();
  const user = m.profile.data?.user;

  return (
    <Screen title="Profile" onRefresh={m.profile.refresh} refreshing={m.profile.isValidating}>
      <Status loading={m.profile.isLoading} error={m.profile.error || m.action.error || m.media.error || m.logout.error} notice={m.action.notice} cachedAt={m.profile.cachedAt} />
      {user ? (
        <>
          <Card>
            {user.avatar ? <Image accessibilityLabel={`${user.name} profile photo`} source={{ uri: user.avatar }} style={{ width: 90, height: 90, borderRadius: 45 }} /> : null}
            <Copy>{user.name}</Copy>
            <Copy muted>{user.email}</Copy>
            <Copy>Age · {user.age ?? '—'}</Copy>
            <Copy>Height · {user.height ?? '—'} cm</Copy>
            <Copy>Weight · {user.currentWeight ?? '—'} kg</Copy>
            <Copy>Goal weight · {user.targetWeight ?? '—'} kg</Copy>
            <Button secondary title="Change photo" disabled={m.offline || m.action.pending} onPress={m.avatar} />
            <Button secondary title="Remove photo" disabled={m.offline || m.action.pending || !user.avatar} onPress={m.removeAvatar} />
          </Card>
          <Card>
            <Label>Your coach</Label>
            <Copy>{user.coach?.name ?? 'Your coach'}</Copy>
            <Copy muted>{user.coach?.email}</Copy>
            <Link href="/chat" style={{ color: theme.colors.accent, padding: 12 }}>Message your coach</Link>
          </Card>
        </>
      ) : null}
      <Card>
        <Label>Theme</Label>
        {theme.options.map(name => <Button key={name} secondary={name !== theme.name} title={name} onPress={() => theme.select(name)} />)}
      </Card>
      <Card>
        <Label>Notifications</Label>
        <Button title={m.privacy.data?.consents.messageNotifications ? 'Chat notifications enabled' : 'Enable chat notifications'} onPress={m.enableNotifications} disabled={m.offline || m.action.pending || !m.privacy.data || Boolean(m.privacy.data.consents.messageNotifications)} />
        <Copy muted>{m.push.message || (m.privacy.data?.consents.messageNotifications ? 'Coach message alerts are enabled for this account.' : '')}</Copy>
        <Link href="/privacy" style={{ color: theme.colors.accent, padding: 12 }}>Privacy, notification consent & account deletion</Link>
      </Card>
      <Card>
        <Label>Feedback</Label>
        <Field label="Tell us what could be better" multiline value={m.feedback.value} onChange={m.feedback.setValue} />
        <Button title="Send feedback" onPress={m.sendFeedback} disabled={m.offline || !m.feedback.ready || m.action.pending || !m.feedback.value.trim()} />
      </Card>
      <Button secondary title="Sign out" onPress={m.logout.logout} disabled={m.offline} />
    </Screen>
  );
}
