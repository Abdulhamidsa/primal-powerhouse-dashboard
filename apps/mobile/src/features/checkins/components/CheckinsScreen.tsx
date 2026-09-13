import { Image } from 'react-native';
import { Button, Card, Choices, Copy, Field, Label, Screen, Status } from '@/components/ui';
import { useCheckins } from '../hooks/useCheckins';
import { WeightChart } from './WeightChart';

const photoFields = [
  ['progressPhotoFrontUrl', 'front'],
  ['progressPhotoSideUrl', 'side'],
  ['progressPhotoBackUrl', 'back'],
] as const;

export default function CheckinsScreen() {
  const m = useCheckins();
  const refreshing = m.today.isValidating || m.daily.isValidating || m.weekly.isValidating || m.insights.isValidating;

  return (
    <Screen
      title="Check-ins"
      subtitle="Share how you are doing so your coach can guide your next step."
      onRefresh={m.refresh}
      refreshing={refreshing}
    >
      <Status
        loading={m.today.isLoading}
        error={m.today.error || m.action.error || m.media.error}
        notice={m.action.notice}
      />
      {m.flags && !m.flags.dailyCheckinsEnabled && !m.flags.weeklyCheckinsEnabled ? (
        <Copy>Check-ins are not enabled. Contact your coach.</Copy>
      ) : null}

      {m.flags?.dailyCheckinsEnabled ? (
        <Card>
          <Label>Daily check-in</Label>
          <Status loading={m.daily.isLoading} error={m.daily.error} cachedAt={m.daily.cachedAt} />
          {m.daily.data?.entry ? <Copy muted>Today’s check-in · {m.daily.data.entry.completionPercentage}% complete</Copy> : <Copy muted>No check-in submitted today.</Copy>}
          {m.flags.dailyWeightEnabled ? (
            <Field
              label="Weight (kg)"
              numeric
              value={m.d.value.weightKg}
              onChange={value => m.d.setValue(old => ({ ...old, weightKg: value }))}
            />
          ) : null}
          <Choices label="Energy" options={['LOW', 'NORMAL', 'HIGH']} value={m.d.value.energy} onChange={value => m.d.setValue(old => ({ ...old, energy: value }))} />
          <Choices label="Hunger" options={['SATISFIED', 'MODERATE', 'HUNGRY']} value={m.d.value.hunger} onChange={value => m.d.setValue(old => ({ ...old, hunger: value }))} />
          <Choices label="Sleep" options={['POOR', 'OKAY', 'GOOD', 'GREAT']} value={m.d.value.sleep} onChange={value => m.d.setValue(old => ({ ...old, sleep: value }))} />
          {m.flags.nutritionTrackingEnabled ? (
            <Choices label="Nutrition today" options={['ON_PLAN', 'PARTIAL', 'OFF_PLAN']} value={m.daily.data?.entry?.nutritionStatus ?? ''} onChange={m.nutritionStatus} disabled={m.offline || m.action.pending || !m.daily.data} />
          ) : null}
          {m.flags.workoutTrackingEnabled ? (
            <Choices label="Training today" options={['DONE', 'PARTIAL', 'MISSED']} value={m.daily.data?.entry?.trainingStatus ?? ''} onChange={m.trainingStatus} disabled={m.offline || m.action.pending || !m.daily.data} />
          ) : null}
          <Field label="Note" multiline value={m.d.value.note} onChange={value => m.d.setValue(old => ({ ...old, note: value }))} />
          <Button title="Save daily check-in" disabled={m.offline || !m.d.ready || m.action.pending || !m.daily.data} onPress={m.saveDaily} />
        </Card>
      ) : null}

      {m.flags?.weeklyCheckinsEnabled ? (
        <Card>
          <Label>Weekly check-in</Label>
          <Status loading={m.weekly.isLoading} error={m.weekly.error} cachedAt={m.weekly.cachedAt} />
          {m.weekly.data?.checkIn ? <Copy muted>Submitted · {new Date(m.weekly.data.checkIn.submittedAt).toLocaleString()}</Copy> : <Copy muted>No weekly check-in submitted yet.</Copy>}
          {m.flags.weightChartEnabled ? (
            <Field label="Weight (kg)" numeric value={m.w.value.weightKg} onChange={value => m.w.setValue(old => ({ ...old, weightKg: value }))} />
          ) : null}
          <Field label="Strength update" multiline value={m.w.value.strengthUpdate} onChange={value => m.w.setValue(old => ({ ...old, strengthUpdate: value }))} />
          <Field label="What got in the way?" multiline value={m.w.value.blockerText} onChange={value => m.w.setValue(old => ({ ...old, blockerText: value }))} />
          <Field label="Notes" multiline value={m.w.value.notes} onChange={value => m.w.setValue(old => ({ ...old, notes: value }))} />
          {m.flags.progressPhotosEnabled
            ? photoFields.map(([field, label]) => (
                <Card key={field}>
                  {m.w.value[field] ? <Image accessibilityLabel={`${label} progress photo`} source={{ uri: m.w.value[field] }} style={{ height: 180, width: '100%', borderRadius: 16 }} /> : null}
                  <Button secondary title={`Choose ${label} photo`} onPress={() => m.photo(field)} disabled={m.offline || !m.w.ready || m.action.pending} />
                </Card>
              ))
            : null}
          <Button title="Save weekly check-in" disabled={m.offline || !m.w.ready || m.action.pending || !m.weekly.data} onPress={m.saveWeekly} />
        </Card>
      ) : null}

      {m.insights.data ? (
        <Card>
          <Label>Weight progress</Label>
          <Copy>{m.insights.data.summary.supportiveInsight}</Copy>
          <Copy>7-day average: {m.insights.data.summary.currentSevenDayAverage ?? '—'} kg</Copy>
          <Copy muted>Trend · {m.insights.data.summary.trendDirection}{m.insights.data.summary.trendDeltaKg === null ? '' : ` · ${Math.abs(m.insights.data.summary.trendDeltaKg).toFixed(1)} kg`}</Copy>
          <Copy muted>Weekly completion · {m.insights.data.summary.weeklyCompliancePercentage}% · {m.insights.data.summary.streakCount} day streak</Copy>
          {m.weightChart ? <WeightChart model={m.weightChart} /> : <Copy muted>Add weight to your daily check-ins to see a progress chart.</Copy>}
          {m.insights.data.history.filter(item => item.weightKg !== null).slice(-5).map(item => <Copy key={item.dayDate}>{item.dayDate} · {item.weightKg} kg</Copy>)}
        </Card>
      ) : null}
      {m.flags?.weightChartEnabled && m.flags.dailyWeightEnabled ? <Status loading={m.insights.isLoading} error={m.insights.error} cachedAt={m.insights.cachedAt} /> : null}
    </Screen>
  );
}
