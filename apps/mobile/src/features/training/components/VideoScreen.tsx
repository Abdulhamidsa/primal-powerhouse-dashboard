import { Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Button, Card, Copy, Label, Screen, Status } from '@/components/ui';
import { VideoPlayer } from '@/features/media/components/VideoPlayer';
import { useAssignedVideo } from '../hooks/useTraining';

function isImage(url: string) {
  return /\.(gif|webp|png|jpe?g)(?:\?.*)?$/i.test(url);
}

export default function VideoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const m = useAssignedVideo(id);
  const assignment = m.video.data;

  return (
    <Screen title={assignment?.video.title ?? 'Exercise video'} onRefresh={m.video.refresh} refreshing={m.video.isValidating}>
      <Status loading={m.video.isLoading} error={m.video.error || m.action.error} notice={m.action.notice} cachedAt={m.video.cachedAt} />
      {assignment ? (
        <>
          <Card>
            {isImage(assignment.video.videoUrl) ? (
              <Image accessibilityLabel={assignment.video.title} resizeMode="contain" source={{ uri: assignment.video.videoUrl }} style={{ width: '100%', height: 320 }} />
            ) : (
              <VideoPlayer url={assignment.video.videoUrl} />
            )}
            <Copy>{assignment.video.description}</Copy>
            <Copy>Duration · {Math.max(1, Math.floor(assignment.video.duration / 60))} min</Copy>
            <Copy>Difficulty · {assignment.video.difficulty.replaceAll('_', ' ')}</Copy>
            {assignment.notes ? <Copy>Coach note · {assignment.notes}</Copy> : null}
            <Button title={assignment.isCompleted ? 'Completed' : 'Mark complete'} onPress={m.complete} disabled={m.offline || assignment.isCompleted || m.action.pending} />
          </Card>
          {assignment.video.instructions.length ? (
            <Card>
              <Label>Instructions</Label>
              {assignment.video.instructions.map((step, index) => <Copy key={`${index}-${step}`}>{index + 1}. {step}</Copy>)}
            </Card>
          ) : null}
          {assignment.video.tips.length ? (
            <Card>
              <Label>Tips</Label>
              {assignment.video.tips.map((tip, index) => <Copy key={`${index}-${tip}`}>• {tip}</Copy>)}
            </Card>
          ) : null}
          {assignment.video.equipment.length ? <Card><Label>Equipment</Label><Copy>{assignment.video.equipment.join(' · ')}</Copy></Card> : null}
          {assignment.video.muscleGroups.length ? <Card><Label>Muscle groups</Label><Copy>{assignment.video.muscleGroups.join(' · ')}</Copy></Card> : null}
        </>
      ) : null}
    </Screen>
  );
}
