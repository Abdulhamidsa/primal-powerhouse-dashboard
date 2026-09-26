import { Button, Card, Copy, Field, Label, Screen, Status } from '@/components/ui';
import { usePrivacy } from '../hooks/usePrivacy';

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
            {(['analytics', 'marketingNotifications', 'optionalTracking', 'messageNotifications'] as const).map(key => (
              <Button
                secondary
                key={key}
                title={`${m.query.data!.consents[key] ? 'Enabled' : 'Disabled'} · ${key.replace(/([A-Z])/g, ' $1')}`}
                onPress={() => m.toggle(key)}
                disabled={m.offline || m.action.pending}
              />
            ))}
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
          This will deactivate your account and start the existing deletion process. Enter your password above and type
          DELETE MY ACCOUNT to confirm.
        </Copy>
        {m.query.data?.activeDeletionRequest ? (
          <>
            <Copy>Deletion status · {m.query.data.activeDeletionRequest.status}</Copy>
            <Copy muted>Requested · {new Date(m.query.data.activeDeletionRequest.requestedAt).toLocaleString()}</Copy>
            <Copy muted>
              Scheduled deletion ·{' '}
              {new Date(m.query.data.activeDeletionRequest.scheduledHardDeleteAt).toLocaleDateString()}
            </Copy>
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
