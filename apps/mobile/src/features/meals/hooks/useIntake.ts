import { useToday } from '@/features/today/hooks/useToday';
import { useAction, useDraft } from '@/features/resources/hooks/useResource';
import { dailyIntakeOverrideSchema } from '../schemas/meals.schema';
import { saveIntake, resetIntake } from '../api/meals.api';
export function useIntake() {
  const today = useToday();
  const dayDate = today.data?.dailyCheckIn.dayDate;
  const draft = useDraft(`intake:${dayDate}`, { calories: '', protein: '', carbs: '', fat: '', note: '' });
  const action = useAction(['/api/user/daily-intake', '/api/user/adherence', '/api/user/meals/summary']);
  return {
    today,
    draft,
    action,
    save: () =>
      action.run(() =>
        saveIntake(
          dailyIntakeOverrideSchema.parse({
            dayDate,
            calories: Number(draft.value.calories),
            protein: Number(draft.value.protein),
            carbs: Number(draft.value.carbs),
            fat: Number(draft.value.fat),
            note: draft.value.note,
          }),
        ),
      ),
    reset: () => action.run(() => resetIntake(dayDate!)),
  };
}
