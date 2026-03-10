import { MealsTab } from '@/components/client-profile/MealsTab';
import { VideosTab } from '@/components/client-profile/VideosTab';
import type { ActiveMealPlanSummary, MealAssignment } from '@/lib/client-page/types';
import type { VideoAssignment } from '@/types/video';

export function AssignmentsTabContent({
  clientId,
  mealAssignments,
  videoAssignments,
  activeMealPlan,
  currentGoalCalories,
  onAssignMealsAction,
  onAssignVideosAction,
  onRemoveMealAssignmentAction,
  onRemoveVideoAssignmentAction,
  onRefreshMealsAction,
}: {
  clientId: string;
  mealAssignments: MealAssignment[];
  videoAssignments: VideoAssignment[];
  activeMealPlan: ActiveMealPlanSummary | null;
  currentGoalCalories: number | null;
  onAssignMealsAction: () => void;
  onAssignVideosAction: () => void;
  onRemoveMealAssignmentAction: (assignmentId: string) => Promise<void>;
  onRemoveVideoAssignmentAction: (assignmentId: string) => Promise<void>;
  onRefreshMealsAction: () => Promise<void>;
}) {
  return (
    <div className="space-y-4">
      <VideosTab
        assignments={videoAssignments}
        onAssign={onAssignVideosAction}
        onRemove={onRemoveVideoAssignmentAction}
      />

      <MealsTab
        assignments={mealAssignments}
        clientId={clientId}
        activeMealPlan={activeMealPlan}
        currentGoalCalories={currentGoalCalories}
        onAssign={onAssignMealsAction}
        onRemove={onRemoveMealAssignmentAction}
        onMealUpdated={onRefreshMealsAction}
      />
    </div>
  );
}
