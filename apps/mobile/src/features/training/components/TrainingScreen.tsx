import { Button, Card, Copy, Label, Screen, Status } from '@/components/ui';
import { Image } from 'react-native';
import { useTraining } from '../hooks/useTraining';
export default function TrainingScreen() {
  const m = useTraining();
  return (
    <Screen
      title="Training"
      subtitle="Your next session, one set at a time."
      onRefresh={m.refresh}
      refreshing={m.refreshing}
    >
      <Status
        loading={m.plan.isLoading || m.assignments.isLoading}
        error={m.plan.error || m.assignments.error || m.action.error}
        notice={m.action.notice}
      />
      {m.plan.data ? (
        <>
          <Label>Training plan · {m.plan.data.name}</Label>
          {m.plan.data.days.map(day => (
            <Card key={day.id}>
              <Label>
                {day.date.slice(0, 10)} · {day.status}
              </Label>
              <Copy>{day.title || day.workoutTemplate?.name || day.type}</Copy>
              <Copy muted>{day.note}</Copy>
              {day.workoutTemplate?.exercises.map(e => (
                <Copy key={e.id}>
                  {e.exercise.name} · {e.sets} × {e.reps}
                </Copy>
              ))}
              {day.workoutTemplate && day.status !== 'COMPLETED' ? (
                <>
                  <Button
                    title={day.latestSession?.status === 'IN_PROGRESS' ? 'Continue workout' : 'Start workout'}
                    onPress={() => m.start(day.id)}
                    disabled={m.offline || m.action.pending}
                  />
                  <Button
                    secondary
                    title="Skip day"
                    onPress={() => m.skip(day.id)}
                    disabled={m.offline || m.action.pending}
                  />
                </>
              ) : null}
            </Card>
          ))}
        </>
      ) : null}
      {m.assignments.data?.length ? <Label>Workout assignments</Label> : null}
      {m.assignments.data?.map(a => (
        <Card key={a.id}>
          <Copy>{a.workoutPlan.name}</Copy>
          <Copy muted>{a.workoutPlan.exercises.length} exercises</Copy>
          <Button title="Open workout" onPress={() => m.openWorkout(a.id)} />
        </Card>
      ))}
      {!m.plan.isLoading && !m.plan.data && !m.assignments.data?.length ? (
        <Copy muted>No workout assigned yet. Your coach will add your next plan here.</Copy>
      ) : null}
      <Button
        secondary
        title={m.showVideos ? 'Hide exercise videos' : 'Exercise videos'}
        onPress={() => m.setShowVideos(!m.showVideos)}
      />
      {m.showVideos ? <Status loading={m.videos.isLoading} error={m.videos.error} cachedAt={m.videos.cachedAt} /> : null}
      {m.showVideos && !m.videos.isLoading && !m.videos.error && m.videos.data?.length === 0 ? <Copy muted>No videos assigned yet.</Copy> : null}
      {m.showVideos
        ? m.videos.data?.map(v => (
            <Card key={v.id}>
              <Copy>{v.video.title}</Copy>
              {v.video.thumbnailUrl ? <Image accessibilityLabel={`${v.video.title} thumbnail`} source={{ uri: v.video.thumbnailUrl }} style={{ width: '100%', height: 180, borderRadius: 16 }} /> : null}
              <Copy muted>{v.video.description}</Copy>
              <Button secondary title="Open video" onPress={() => m.openVideo(v.id)} />
              <Button
                title={v.isCompleted ? 'Completed' : 'Mark complete'}
                disabled={m.offline || v.isCompleted || m.action.pending}
                onPress={() => m.completeVideo(v.id)}
              />
            </Card>
          ))
        : null}
      <Button
        secondary
        title={m.showHistory ? 'Hide history' : 'Training history'}
        onPress={() => m.setShowHistory(!m.showHistory)}
      />
      {m.showHistory ? <Status loading={m.history.isLoading} error={m.history.error} cachedAt={m.history.cachedAt} /> : null}
      {m.showHistory && !m.history.isLoading && !m.history.error && m.history.data?.length === 0 ? <Copy muted>No training sessions yet.</Copy> : null}
      {m.showHistory
        ? m.history.data?.map(s => (
            <Button
              key={s.id}
              secondary
              title={`${s.startedAt.slice(0, 10)} · ${s.status}`}
              onPress={() => m.openSession(s.id)}
            />
          ))
        : null}
    </Screen>
  );
}
