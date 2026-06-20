import type { UserDashboardSummary } from '@/features/user-dashboard/types/userDashboard.types';

type SummarySource = Omit<
  UserDashboardSummary,
  'nextAction' | 'resumeRoute' | 'todayCompletionState' | 'pendingAttention'
>;

type DashboardActionKind = 'daily-checkin' | 'weekly-checkin' | 'meals' | 'training' | 'messages';

type DashboardAction = {
  key: string;
  kind: DashboardActionKind;
  title: string;
  description: string;
  href: string;
  isPending: boolean;
};

function buildAction(summary: SummarySource, action: Omit<DashboardAction, 'isPending'>): DashboardAction {
  return {
    ...action,
    isPending:
      action.kind === 'daily-checkin'
        ? summary.featureVisibility.dailyCheckinsEnabled && !summary.dailyCheckIn.isComplete
        : action.kind === 'weekly-checkin'
          ? summary.featureVisibility.weeklyCheckinsEnabled && summary.weeklyCheckIn.status !== 'completed'
          : action.kind === 'meals'
            ? summary.featureVisibility.nutritionTrackingEnabled &&
              !(summary.adherence.completion.totalSelectedCount > 0 &&
                summary.adherence.completion.completedCount === summary.adherence.completion.totalSelectedCount)
            : action.kind === 'training'
              ? summary.featureVisibility.workoutTrackingEnabled && summary.training.activeAssignmentCount > 0
              : summary.unreadTotal > 0,
  };
}

function buildActions(summary: SummarySource): DashboardAction[] {
  const actions: DashboardAction[] = [];

  if (summary.featureVisibility.dailyCheckinsEnabled) {
    actions.push(
      buildAction(summary, {
        key: 'daily-checkin',
        kind: 'daily-checkin',
        title: "Finish today's check-in",
        description: 'Log energy, hunger, sleep, nutrition, and training before the day slips away.',
        href: '/user/check-ins',
      }),
    );
  }

  if (summary.featureVisibility.weeklyCheckinsEnabled) {
    actions.push(
      buildAction(summary, {
        key: 'weekly-checkin',
        kind: 'weekly-checkin',
        title: 'Submit weekly check-in',
        description:
          summary.weeklyCheckIn.status === 'overdue'
            ? 'Your weekly update needs attention today.'
            : 'Keep your coach updated on your week.',
        href: '/user/check-ins',
      }),
    );
  }

  if (summary.featureVisibility.nutritionTrackingEnabled) {
    const completion = summary.adherence.completion;
    actions.push(
      buildAction(summary, {
        key: 'meals',
        kind: 'meals',
        title: completion.totalSelectedCount > 0 ? 'Continue meal plan' : 'Set your meal plan',
        description:
          completion.totalSelectedCount > 0
            ? `${completion.completedCount}/${completion.totalSelectedCount} selected meals are done today.`
            : 'Select your meals so the day has a clear nutrition target.',
        href: '/user/my-plan',
      }),
    );
  }

  if (summary.featureVisibility.workoutTrackingEnabled) {
    actions.push(
      buildAction(summary, {
        key: 'training',
        kind: 'training',
        title:
          summary.training.activeSessionId || summary.training.activeAssignmentCount > 0
            ? 'Continue workout'
            : 'Open training',
        description: summary.training.activePlanName
          ? `${summary.training.activePlanName} is ready for your next session.`
          : 'Browse your workout plan and keep momentum going.',
        href: summary.training.activeAssignmentId
          ? `/user/workout/${encodeURIComponent(summary.training.activeAssignmentId)}`
          : '/user/training',
      }),
    );
  }

  actions.push(
    buildAction(summary, {
      key: 'messages',
      kind: 'messages',
      title:
        summary.unreadTotal === 1 ? 'Read coach message' : summary.unreadTotal > 1 ? 'Read coach messages' : 'Message coach',
      description:
        summary.unreadTotal === 1
          ? 'There is 1 unread message waiting.'
          : summary.unreadTotal > 1
            ? `${summary.unreadTotal} unread messages are waiting.`
            : 'Open the coach chat and keep the conversation moving.',
      href: '/user/chat',
    }),
  );

  return actions;
}

export function deriveUserDashboardSnapshot(summary: SummarySource): UserDashboardSummary {
  const actions = buildActions(summary);
  const pendingAttention = actions.filter(action => action.isPending);
  const completedCount = actions.length - pendingAttention.length;
  const totalCount = actions.length;

  const nextAction =
    pendingAttention[0] ??
    actions.find(action => action.kind === 'training') ?? {
      key: 'training',
      kind: 'training',
      title: 'Open training',
      description: 'Browse your workout plan and keep the routine moving.',
      href: '/user/training',
      isPending: false,
    };

  const resumeRoute =
    nextAction.kind === 'training' && summary.training.activeAssignmentId
      ? {
          href: `/user/workout/${encodeURIComponent(summary.training.activeAssignmentId)}`,
          label: 'Resume workout',
          description: summary.training.activePlanName
            ? `Pick up ${summary.training.activePlanName} where you left off.`
            : 'Continue your current workout session.',
        }
      : {
          href: nextAction.href,
          label: 'Resume where you left off',
          description: nextAction.description,
        };

  const isComplete = totalCount === 0 || pendingAttention.length === 0;

  return {
    ...summary,
    nextAction: {
      key: nextAction.key,
      kind: nextAction.kind,
      title: nextAction.title,
      description: nextAction.description,
      href: nextAction.href,
    },
    resumeRoute,
    todayCompletionState: {
      completedCount,
      totalCount,
      isComplete,
      label: isComplete ? 'All caught up' : `${completedCount}/${totalCount} complete`,
      description: isComplete
        ? 'Everything important for today is already handled.'
        : `${pendingAttention.length} item${pendingAttention.length === 1 ? '' : 's'} still need attention.`,
    },
    pendingAttention: {
      count: pendingAttention.length,
      items: pendingAttention.map(action => ({
        key: action.key,
        kind: action.kind,
        title: action.title,
        description: action.description,
        href: action.href,
      })),
    },
  };
}
