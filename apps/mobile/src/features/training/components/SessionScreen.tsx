import { useLocalSearchParams } from 'expo-router';
import { Button, Card, Choices, Copy, Field, Label, Screen, Status } from '@/components/ui';
import { VideoPlayer } from '@/features/media/components/VideoPlayer';
import { useSet, useTrainingSession } from '../hooks/useTraining';
import type { TrainingSet } from '../types/training.types';
function SetEditor({ sessionId, set, restSeconds }: { sessionId: string; set: TrainingSet; restSeconds: number }) {
  const m = useSet(sessionId, set, restSeconds);
  return (
    <Card>
      <Label>
        Set {set.setNumber}
        {set.completed ? ' · saved ' : set.skipped ? ' · skipped' : ''}
      </Label>
      <Field
        label="Reps"
        numeric
        value={m.draft.value.reps}
        onChange={v => m.draft.setValue(old => ({ ...old, reps: v }))}
      />
      <Field
        label="Weight (kg)"
        numeric
        value={m.draft.value.weight}
        onChange={v => m.draft.setValue(old => ({ ...old, weight: v }))}
      />
      <Field
        label="Set feedback"
        value={m.draft.value.feedback}
        onChange={v => m.draft.setValue(old => ({ ...old, feedback: v }))}
      />
      <Status error={m.action.error} />
      <>
        <>
          <Button
            title="Save set"
            onPress={() => m.save()}
            disabled={!m.draft.ready || m.offline || m.action.pending}
          />
          <Button
            secondary
            title="Skip set"
            onPress={() => m.save(true)}
            disabled={!m.draft.ready || m.offline || m.action.pending}
          />
        </>
      </>
      {m.remaining ? (
        <>
          <Copy>Rest · {m.remaining}s</Copy>
          <Button secondary title="Skip rest" onPress={m.skipRest} />
        </>
      ) : null}
    </Card>
  );
}
export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const m = useTrainingSession(id);
  const session = m.session.data;
  return (
    <Screen title={session?.planDay.title || 'Workout session'} onRefresh={m.session.refresh}>
      <Status loading={m.session.isLoading} error={m.session.error || m.action.error} notice={m.action.notice} />
      {session?.exercises.map(e => (
        <Card key={e.id}>
          <Copy>{e.exerciseNameSnapshot}</Copy>
          <Copy muted>{e.notesSnapshot}</Copy>
          {e.exercise?.videoUrl ? <VideoPlayer url={e.exercise.videoUrl} /> : null}
          <Copy muted>{e.exercise?.instructions}</Copy>
          {e.sets.map(s =>
            session.status === 'IN_PROGRESS' ? (
              <SetEditor key={s.id} sessionId={id} set={s} restSeconds={e.plannedRestSeconds} />
            ) : (
              <Card key={s.id}>
                <Label>
                  Set {s.setNumber} · {s.completed ? 'Completed' : s.skipped ? 'Skipped' : 'Not completed'}
                </Label>
                <Copy>Reps · {s.actualReps ?? 'Not recorded'}</Copy>
                <Copy>Weight (kg) · {s.actualWeightKg ?? 'Not recorded'}</Copy>
                {s.feedback ? <Copy>{s.feedback}</Copy> : null}
              </Card>
            ),
          )}
        </Card>
      ))}
      {session?.status === 'IN_PROGRESS' ? (
        <Card>
          <Choices
            label="How did it feel?"
            options={['EASY', 'GOOD', 'HARD', 'VERY_HARD']}
            value={m.draft.value.perceivedDifficulty}
            onChange={v => m.draft.setValue(old => ({ ...old, perceivedDifficulty: v }))}
          />
          <Field
            label="Overall feedback"
            multiline
            value={m.draft.value.overallFeedback}
            onChange={v => m.draft.setValue(old => ({ ...old, overallFeedback: v }))}
          />
          <Button
            title="Complete workout"
            onPress={() => m.finish('COMPLETED')}
            disabled={!m.draft.ready || m.offline || m.action.pending}
          />
          <Button
            secondary
            title="End without completing"
            onPress={() => m.finish('ABANDONED')}
            disabled={!m.draft.ready || m.offline || m.action.pending}
          />
        </Card>
      ) : session ? (
        <Card>
          <Label>{session.status.replaceAll('_', ' ')}</Label>
          {session.perceivedDifficulty ? (
            <Copy>Difficulty · {session.perceivedDifficulty.replaceAll('_', ' ')}</Copy>
          ) : null}
          {session.overallFeedback ? <Copy>{session.overallFeedback}</Copy> : null}
        </Card>
      ) : null}
    </Screen>
  );
}
