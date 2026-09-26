import { useLocalSearchParams } from 'expo-router';
import { Button, Card, Copy, Field, Label, Screen, Status } from '@/components/ui';
import { VideoPlayer } from '@/features/media/components/VideoPlayer';
import { useWorkout } from '../hooks/useTraining';

export default function WorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const m = useWorkout(id);
  return (
    <Screen title={m.assignment?.workoutPlan.name ?? 'Workout'}>
      <Status
        loading={m.assignments.isLoading}
        error={m.assignments.error || m.action.error}
        notice={m.action.notice}
      />
      <Button
        title={m.draft.value.sessionId ? 'Resume saved session' : 'Start session'}
        disabled={m.offline || m.action.pending || !m.assignment || !m.draft.ready}
        onPress={() => m.start()}
      />
      {m.assignment?.sessions?.some(s => s.status === 'COMPLETED') ? (
        <Button
          secondary
          title="Start again (keep previous history)"
          disabled={m.offline || m.action.pending}
          onPress={() => m.start(true)}
        />
      ) : null}
      {m.rest.remaining > 0 ? (
        <Card>
          <Label>Rest</Label>
          <Copy>{m.rest.remaining}s remaining</Copy>
          <Button secondary title="Skip rest" onPress={m.rest.skip} />
        </Card>
      ) : null}
      {m.assignment?.workoutPlan.exercises.map(e => (
        <Card key={e.id}>
          <Copy>{e.video.title}</Copy>
          <Copy muted>
            {e.targetSets} sets · {e.minReps}–{e.maxReps} reps · rest {e.restSeconds}s
          </Copy>
          <Copy muted>{e.notes}</Copy>
          {e.video.videoUrl ? <VideoPlayer url={e.video.videoUrl} /> : null}
          {m.draft.value.logs[e.id]?.sets.map((s, i) => (
            <Card key={i}>
              <Label>Set {i + 1}</Label>
              <Field label="Reps" numeric value={String(s.reps)} onChange={v => m.setNumber(e.id, i, 'reps', v)} />
              <Field
                label="Weight (kg)"
                numeric
                value={String(s.weightKg)}
                onChange={v => m.setNumber(e.id, i, 'weightKg', v)}
              />
              <Button
                secondary
                title={s.completed ? 'Done — undo' : 'Mark set done'}
                disabled={m.action.pending || !m.draft.ready}
                onPress={() => m.toggleSet(e.id, i)}
              />
            </Card>
          ))}
          {m.draft.value.logs[e.id] ? (
            <Field
              label="Exercise feedback"
              value={m.draft.value.logs[e.id].feedbackNote ?? ''}
              onChange={v => m.setFeedback(e.id, v)}
            />
          ) : null}
        </Card>
      ))}
      {m.draft.value.sessionId ? (
        <>
          <Copy muted>Entries are saved as a draft on this phone until you submit the session.</Copy>
          <Button
            title="Submit completed workout"
            disabled={m.offline || m.action.pending}
            onPress={() => m.finish('COMPLETED')}
          />
          <Button
            secondary
            title="End without completing"
            disabled={m.offline || m.action.pending}
            onPress={() => m.finish('ABANDONED')}
          />
        </>
      ) : null}
    </Screen>
  );
}
