import { Card, Copy, Label, Screen, Button, Status } from '@/components/ui';
import { useToday } from '../hooks/useToday';

export default function TodayScreen() {
  const query = useToday();
  const data = query.data;

  return (
    <Screen
      title={data ? `Hello, ${data.user.name.split(' ')[0]}` : 'Today'}
      subtitle="One clear step at a time."
      onRefresh={query.refresh}
      refreshing={query.isValidating}
    >
      <Status loading={query.isLoading} error={query.error} cachedAt={query.cachedAt} />
      {data ? (
        <>
          <Card>
            <Label>
              Today’s focus
              {data.streakCount > 0 ? ` · ${data.streakCount} day streak` : ''}
            </Label>
            <Copy>{data.nextAction.title}</Copy>
            <Copy muted>{data.nextAction.description}</Copy>
            <Button title={data.nextAction.title} onPress={query.openNext} />
          </Card>
          <Card>
            <Label>Your progress</Label>
            <Copy>{data.todayCompletionState.label}</Copy>
            {data.featureVisibility.nutritionTrackingEnabled ? (
              <Copy>
                Meals · {data.adherence.completion.completedCount}/{data.adherence.completion.totalSelectedCount}
              </Copy>
            ) : null}
            {data.featureVisibility.dailyCheckinsEnabled ? (
              <Copy>Daily check-in · {data.dailyCheckIn.isComplete ? 'Complete' : 'Due'}</Copy>
            ) : null}
            {data.featureVisibility.weeklyCheckinsEnabled ? (
              <Copy>Weekly check-in · {data.weeklyCheckIn.status}</Copy>
            ) : null}
            {data.featureVisibility.workoutTrackingEnabled ? (
              <Copy>
                Training ·{' '}
                {data.training.activeSessionId
                  ? 'In progress'
                  : data.training.activeAssignmentCount > 0
                    ? `${data.training.activeAssignmentCount} ready`
                    : 'No session assigned'}
              </Copy>
            ) : null}
            <Copy>Coach · {data.unreadTotal ? `${data.unreadTotal} unread` : 'All clear'}</Copy>
          </Card>
          <Card>
            <Label>Coach note</Label>
            <Copy>{data.user.motivationalMessage || 'No coach note yet. Check back after your next review.'}</Copy>
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
