export type CommandCenterSeverity = 'critical' | 'warning' | 'watch';

export type CommandCenterActionKind =
  | 'quick_message'
  | 'mark_checkin_reviewed'
  | 'assign_meal'
  | 'assign_workout'
  | 'open_client';

export interface CommandCenterAction {
  kind: CommandCenterActionKind;
  label: string;
  clientId: string;
  href?: string;
  checkInId?: string;
  messageTemplate?: string;
}

export interface CommandCenterIssue {
  id: string;
  severity: CommandCenterSeverity;
  title: string;
  detail: string;
  occurredAt: string;
}

export interface CommandCenterAttentionItem {
  id: string;
  severity: CommandCenterSeverity;
  clientId: string;
  clientName: string;
  title: string;
  detail: string;
  occurredAt: string;
  issueCount: number;
  issues: CommandCenterIssue[];
  actions: CommandCenterAction[];
}

export interface CommandCenterAttentionGroup {
  severity: CommandCenterSeverity;
  label: string;
  items: CommandCenterAttentionItem[];
}

export interface CommandCenterTodayAction {
  id: string;
  title: string;
  detail: string;
  clientId: string;
  clientName: string;
  dueAt: string;
  actions: CommandCenterAction[];
}

export interface CommandCenterMomentumItem {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  detail: string;
  occurredAt: string;
}

export interface CommandCenterRecentChange {
  id: string;
  clientId: string;
  clientName: string;
  category: 'message' | 'check_in' | 'workout' | 'nutrition';
  text: string;
  occurredAt: string;
  actions: CommandCenterAction[];
}

export interface CommandCenterCompactMetrics {
  clientsNeedingAttention: number;
  quickRepliesPending: number;
  sessionsToday: number;
}

export interface AdminCommandCenterResponse {
  generatedAt: string;
  attention: CommandCenterAttentionGroup[];
  todayActions: CommandCenterTodayAction[];
  momentum: CommandCenterMomentumItem[];
  recentChanges: CommandCenterRecentChange[];
  compactMetrics: CommandCenterCompactMetrics;
}
