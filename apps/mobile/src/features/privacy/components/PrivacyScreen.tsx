import { Linking } from 'react-native';
import { Button, Card, Copy, Field, Label, Screen, Status } from '@/components/ui';
import { usePrivacy } from '../hooks/usePrivacy';

const legalLinks = [
  ['Privacy Policy', 'privacy'],
  ['Terms of Service', 'terms'],
  ['Health disclaimer', 'health-disclaimer'],
  ['AI disclosure', 'ai-disclosure'],
  ['Storage notice', 'storage'],
] as const;

export default function PrivacyScreen() {
  const m = usePrivacy();

  return (
    <Screen title="Privacy & data" onRefresh={m.query.refresh} refreshing={m.query.isValidating}>
      <Status loading={m.query.isLoading} error={m.query.error || m.action.error} notice={m.action.notice} />
      {m.push.message ? <Copy muted>{m.push.message}</Copy> : null}
      {m.query.data ? (
        <>
          <Card>
            <Label>Your choices</Label>
            <Button
              secondary
              title={`${m.query.data.notificationPreferences.coachMessagePushEnabled ? 'Enabled' : 'Disabled'} · Coach message push`}
              onPress={() => m.toggle()}
              disabled={m.offline || m.action.pending}
            />
            <Copy muted>Analytics, marketing, and optional tracking are not active features in this app.</Copy>
          </Card>
          <Card>
            <Label>Legal & transparency</Label>
            {legalLinks.map(([label, slug]) => (
              <Button key={slug} secondary title={label} onPress={() => Linking.openURL(`${process.env.EXPO_PUBLIC_WEB_URL || process.env.EXPO_PUBLIC_API_URL}/legal/${slug}`)} />
            ))}
            <Copy muted>{m.query.data.disclosures.retention.localPostgresBackups}</Copy>
            <Copy muted>{m.query.data.disclosures.retention.offServerDisasterRecovery}</Copy>
            <Copy muted>{m.query.data.disclosures.retention.providerRetention}</Copy>
            <Copy muted>{m.query.data.disclosures.reviewNotice}</Copy>
            <Label>Service purposes</Label>
            {m.query.data.disclosures.providers.map(provider => (
              <Copy key={provider.name} muted>{provider.name}: {provider.purpose}</Copy>
            ))}
            {m.query.data.legalDocuments.length ? m.query.data.legalDocuments.map(document => (
              <Copy key={`${document.type}:${document.version}`} muted>
                {document.title} · v{document.version}
              </Copy>
            )) : <Copy muted>No approved legal versions are active yet.</Copy>}
            {m.query.data.pendingPolicyAcknowledgements.length ? (
              <>
                <Copy>Please review and acknowledge the current approved policies.</Copy>
                {m.query.data.pendingPolicyAcknowledgements.map(document => (
                  <Button
                    key={`${document.type}:${document.version}`}
                    title={`Acknowledge ${document.title}`}
                    onPress={() => m.acknowledgePolicy({ type: document.type as 'TERMS' | 'PRIVACY_POLICY' | 'AI_DISCLOSURE', version: document.version })}
                    disabled={m.offline || m.action.pending}
                  />
                ))}
              </>
            ) : null}
          </Card>
          {m.query.data.exportJobs.length ? (
            <Card>
              <Label>Recent exports</Label>
              {m.query.data.exportJobs.map(job => (
                <Copy key={job.id} muted>
                  {new Date(job.requestedAt).toLocaleString()} · {job.status}
                  {job.downloadCount
                    ? ` · downloaded ${job.downloadCount} time${job.downloadCount === 1 ? '' : 's'}`
                    : ''}
                </Copy>
              ))}
            </Card>
          ) : null}
          <Card>
            <Label>Current session</Label>
            <Copy>Signed in on this device</Copy>
            {m.query.data.activeSession.issuedAt ? (
              <Copy muted>Started · {new Date(m.query.data.activeSession.issuedAt).toLocaleString()}</Copy>
            ) : null}
            {m.query.data.activeSession.expiresAt ? (
              <Copy muted>Access refresh due · {new Date(m.query.data.activeSession.expiresAt).toLocaleString()}</Copy>
            ) : null}
          </Card>
        </>
      ) : null}
      <Card>
        <Label>Export your data</Label>
        <Copy muted>Enter your password to confirm it is you. Your password is not saved on this screen.</Copy>
        <Field label="Password" secure value={m.password} onChange={m.setPassword} />
        <Button
          title="Export and share my data"
          onPress={m.export}
          disabled={m.offline || m.action.pending || !m.password}
        />
      </Card>
      <Card>
        <Label>Sessions</Label>
        <Button secondary title="Sign out on all devices" onPress={m.revoke} disabled={m.offline || m.action.pending} />
      </Card>
      <Card>
        <Label>Delete account</Label>
        <Copy>
          Access is removed immediately. Your account is scheduled for permanent deletion after 30 days. This deletion
          cannot be cancelled. Enter your password above and type DELETE MY ACCOUNT to confirm.
        </Copy>
        {m.query.data?.activeDeletionRequest ? (
          <>
            <Copy>Deletion status · {m.query.data.activeDeletionRequest.status}</Copy>
            <Copy muted>Requested · {new Date(m.query.data.activeDeletionRequest.requestedAt).toLocaleString()}</Copy>
            <Copy muted>
              Scheduled deletion ·{' '}
              {new Date(m.query.data.activeDeletionRequest.scheduledHardDeleteAt).toLocaleDateString()}
            </Copy>
            <Copy muted>This deletion cannot be cancelled.</Copy>
          </>
        ) : (
          <>
            <Field label="Confirmation" value={m.confirmation} onChange={m.setConfirmation} />
            <Button
              secondary
              title="Delete my account"
              onPress={m.delete}
              disabled={m.offline || m.action.pending || !m.password || m.confirmation !== 'DELETE MY ACCOUNT'}
            />
          </>
        )}
      </Card>
    </Screen>
  );
}
