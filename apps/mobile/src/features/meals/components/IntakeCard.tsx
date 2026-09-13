import { Button, Card, Copy, Field, Label, Status } from '@/components/ui';
import { useIntake } from '../hooks/useIntake';
export function IntakeCard() {
  const m = useIntake();
  if (!m.today.data?.featureVisibility.nutritionTrackingEnabled) return null;
  return (
    <Card>
      <Label>Daily nutrition</Label>
      <Copy>
        {Math.round(m.today.data.adherence.actualTotals.calories)} /{' '}
        {Math.round(m.today.data.adherence.targetTotals.calories)} kcal
      </Copy>
      <Copy muted>Record actual intake when it differs from your completed meals.</Copy>
      {(['calories', 'protein', 'carbs', 'fat', 'note'] as const).map(key => (
        <Field
          key={key}
          label={key}
          numeric={key !== 'note'}
          value={m.draft.value[key]}
          onChange={v => m.draft.setValue(old => ({ ...old, [key]: v }))}
        />
      ))}
      <Status error={m.action.error} notice={m.action.notice} />
      <Button title="Save actual intake" onPress={m.save} disabled={m.action.pending || !m.draft.value.calories} />
      <Button secondary title="Use completed meal totals" onPress={m.reset} disabled={m.action.pending} />
    </Card>
  );
}
