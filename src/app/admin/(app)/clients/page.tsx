'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSWRConfig } from 'swr';
import { ArchiveIcon as Archive, CalculatorIcon as Calculator, ClipboardTextIcon as ClipboardList, BarbellIcon as Dumbbell, EnvelopeSimpleIcon as Mail, ChatTextIcon as MessageSquare, NotebookIcon as NotebookText, MagnifyingGlassIcon as Search, GearSixIcon as Settings2, TrashIcon as Trash2, ArrowCounterClockwiseIcon as Undo2, UserCircleGearIcon as UserPen, UsersIcon as Users, XIcon as X } from '@phosphor-icons/react';
import AssignContentModal from '@/components/AssignContentModal';
import HealthMetricsModal from '@/components/HealthMetricsModal';
import NewAddClientModal from '@/components/NewAddClientModal';
import { ClientProfileEditModal } from '@/features/client-profile-edit/components/ClientProfileEditModal';
import { useClientMeals } from '@/hooks/useClientMeals';
import {
  useAdminClientDailyCheckIns,
  useAdminDailyCheckInActions,
} from '@/features/daily-checkin/hooks/useAdminDailyCheckIns';
import {
  useAdminClientWeeklyCheckIns,
  useAdminWeeklyCheckInActions,
} from '@/features/weekly-checkin/hooks/useAdminWeeklyCheckIns';
import {
  archiveClient,
  deleteMealAssignment,
  getClientVideoAssignments,
  unarchiveClient,
  updateClientAccessMode,
  buildClientVideoAssignmentsUrl,
  requestAdminClientDeletion,
} from '@/features/admin-clients-dashboard/api/adminClientsDashboard.api';
import { useAdminClientsList } from '@/features/admin-clients-dashboard/hooks/useAdminClientsList';
import { useSelectedClientDashboard } from '@/features/admin-clients-dashboard/hooks/useSelectedClientDashboard';
import {
  useClientVideoAssignments,
  useClientVideoAssignmentActions,
} from '@/features/admin-clients-dashboard/hooks/useClientVideoAssignments';
import { useClientNotes } from '@/features/admin-clients-dashboard/hooks/useClientNotes';
import { getAdminClientDailyCheckIns } from '@/features/daily-checkin/api/adminDailyCheckIn.api';
import { getAdminClientWeeklyCheckIns } from '@/features/weekly-checkin/api/adminWeeklyCheckIn.api';
import {
  buildClientFeatureVisibilityUrl,
  getClientFeatureVisibility,
} from '@/features/client-feature-visibility/api/clientFeatureVisibility.api';
import { ClientListPane } from '@/features/admin-clients-dashboard/components/ClientListPane';
import { ClientNotesPane } from '@/features/admin-clients-dashboard/components/ClientNotesPane';
import { ClientScopedChatPanel } from '@/features/client-coach-messaging/components/ClientScopedChatPanel';
import { ClientDetailTabs } from '@/features/admin-clients-dashboard/components/ClientDetailTabs';
import { SummaryTabContent } from '@/features/admin-clients-dashboard/components/SummaryTabContent';
import { NutritionTabContent } from '@/features/admin-clients-dashboard/components/NutritionTabContent';
import { AssignmentsTabContent } from '@/features/admin-clients-dashboard/components/AssignmentsTabContent';
import { CheckInsTabContent } from '@/features/admin-clients-dashboard/components/CheckInsTabContent';
import TrainingTabContent from '@/features/admin-clients-dashboard/components/TrainingTabContent';
import { ClientFeatureVisibilityTab } from '@/features/client-feature-visibility/components/ClientFeatureVisibilityTab';
import { AdminPage, AdminPageHeader, AdminPanel } from '@/features/admin-shell/components/AdminPage';
import type { HealthMetricsOutput } from '@/lib/health/calculators';
import type { AdminClientDetail, DashboardTabKey } from '@/features/admin-clients-dashboard/types/adminClientsDashboard.types';
import { getWorkoutPlans } from '@/features/workout-plans/api/workoutPlan.api';
import { getAdminClientWorkoutSessions } from '@/features/workout-session/api/adminWorkoutSession.api';
import { httpClient } from '@/lib/http/client';

const DASHBOARD_TAB_ORDER: DashboardTabKey[] = [
  'summary',
  'nutrition',
  'assignments',
  'check-ins',
  'training',
  'feature-visibility',
];

type CoachRailTab = 'chat' | 'notes' | 'actions';

function ClientStatusPill({ status }: { status: string }) {
  const isActive = status === 'ACTIVE';
  const isArchived = status === 'ARCHIVED';

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
        isActive
          ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200'
          : isArchived
            ? 'border-slate-300/15 bg-slate-400/10 text-slate-300'
            : 'border-amber-400/25 bg-amber-500/10 text-amber-200',
      ].join(' ')}
    >
      <span className={['h-1.5 w-1.5 rounded-full', isActive ? 'bg-emerald-400' : isArchived ? 'bg-slate-400' : 'bg-amber-400'].join(' ')} />
      {status}
    </span>
  );
}

function ClientMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ClientCommandHeader({
  client,
  summaryWeightKg,
  onEditProfileAction,
  onArchiveClientAction,
  onOpenHealthMetricsAction,
  onAccessModeChangeAction,
}: {
  client: AdminClientDetail;
  summaryWeightKg: number | null;
  onEditProfileAction: () => void;
  onArchiveClientAction: () => void;
  onOpenHealthMetricsAction: () => void;
  onAccessModeChangeAction: (mode: 'SELF_SERVICE' | 'COACHING') => void;
}) {
  return (
    <div className="border-b border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018))] p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
            <Image
              src={client.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}`}
              alt={client.name}
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-2xl font-semibold tracking-[-0.03em] text-foreground">{client.name}</h2>
              <ClientStatusPill status={client.status} />
              {client.isSystemTemplate ? <span className="rounded-full border border-violet-300/30 bg-violet-400/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-violet-200">System template</span> : null}
            </div>
            <p className="mt-1 flex items-center gap-2 truncate text-sm text-muted-foreground">
              <Mail aria-hidden="true" focusable="false" size={14} />
              {client.email}
            </p>
            {client.status === 'INACTIVE' && client.deletionScheduledFor ? (
              <p className="mt-2 text-xs text-amber-200/80">
                Access removed · deletion scheduled {new Date(client.deletionScheduledFor).toLocaleDateString()}
              </p>
            ) : null}
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <ClientMetric label="Current weight" value={summaryWeightKg == null ? 'N/A' : `${summaryWeightKg} kg`} />
              <ClientMetric label="Target weight" value={client.targetWeight == null ? 'N/A' : `${client.targetWeight} kg`} />
              <ClientMetric label="Calories" value={client.goalCalories == null ? 'N/A' : `${client.goalCalories} kcal`} />
              <ClientMetric label="Sessions" value={`${client.sessionsCompleted ?? 0}`} />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
         {!client.isSystemTemplate && client.status === 'ACTIVE' ? <button
            type="button"
            onClick={onEditProfileAction}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-foreground transition-colors hover:bg-white/[0.07]"
          >
            <UserPen aria-hidden="true" focusable="false" size={15} />
            Edit profile
          </button> : null}
           {!client.isSystemTemplate && client.status === 'ACTIVE' ? <button
            type="button"
            onClick={onOpenHealthMetricsAction}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-foreground transition-colors hover:bg-white/[0.07]"
          >
            <Calculator aria-hidden="true" focusable="false" size={15} />
            Health metrics
          </button> : null}
           {!client.isSystemTemplate && client.status !== 'INACTIVE' ? <button
            type="button"
            onClick={onArchiveClientAction}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
          >
            {client.status === 'ARCHIVED' ? <Undo2 aria-hidden="true" focusable="false" size={15} /> : <Archive aria-hidden="true" focusable="false" size={15} />}
            {client.status === 'ARCHIVED' ? 'Restore' : 'Archive'}
          </button> : null}
        </div>
      </div>
      {!client.isSystemTemplate ? <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-3">
        <span className="text-xs font-medium text-muted-foreground">Access mode</span>
        <div className="flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
          {(['COACHING', 'SELF_SERVICE'] as const).map(mode => (
            <button key={mode} type="button" onClick={() => onAccessModeChangeAction(mode)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${client.accessMode === mode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {mode === 'COACHING' ? 'Coaching' : 'Self-service'}
            </button>
          ))}
        </div>
      </div> : <p className="mt-4 border-t border-white/10 pt-3 text-xs text-violet-200/80">Template source is protected from login, activation, archive, and deletion.</p>}
    </div>
  );
}

export default function ClientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutate: globalMutate } = useSWRConfig();
  const [isTabTransitionPending, startTabTransition] = useTransition();
  const leftPaneRef = useRef<HTMLElement | null>(null);
  const detailPanelRef = useRef<HTMLElement | null>(null);
  const preloadedTabsRef = useRef<{ clientId: string | null; tabs: Set<DashboardTabKey> }>({
    clientId: null,
    tabs: new Set(),
  });

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTabKey>('summary');
  const [activeRailTab, setActiveRailTab] = useState<CoachRailTab>('chat');
  const [mountedTabs, setMountedTabs] = useState<DashboardTabKey[]>(['summary']);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [assignModalType, setAssignModalType] = useState<'videos' | 'meals'>('videos');
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [showHealthMetricsModal, setShowHealthMetricsModal] = useState(false);
  const [healthMetricsResults, setHealthMetricsResults] = useState<HealthMetricsOutput | null>(null);
  const [showChangeUserDrawer, setShowChangeUserDrawer] = useState(false);
  const [showCommunicationDrawer, setShowCommunicationDrawer] = useState(false);
  const [showDeleteClientDialog, setShowDeleteClientDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteClientError, setDeleteClientError] = useState<string | null>(null);
  const [isDeletingClient, setIsDeletingClient] = useState(false);
  const [changeUserSearch, setChangeUserSearch] = useState('');

  const {
    filteredClients,
    search,
    setSearch,
    viewMode,
    setViewMode,
    counts: clientCounts,
    isLoading: isClientsLoading,
    error: clientsError,
    refresh: refreshClients,
  } = useAdminClientsList();

  const selectedClientFromList = useMemo(
    () => filteredClients.find(client => client.id === selectedClientId) ?? null,
    [filteredClients, selectedClientId],
  );

  const changeUserCandidates = useMemo(() => {
    const normalized = changeUserSearch.trim().toLowerCase();
    if (!normalized) return filteredClients;
    return filteredClients.filter(client => {
      return client.name.toLowerCase().includes(normalized) || client.email.toLowerCase().includes(normalized);
    });
  }, [changeUserSearch, filteredClients]);

  const {
    client,
    isLoading: isClientLoading,
    error: selectedClientError,
    refresh: refreshClient,
  } = useSelectedClientDashboard(selectedClientId);

  const {
    entries,
    draft,
    setDraft,
    addNote,
    isSaving: isSavingNote,
    error: noteError,
  } = useClientNotes(selectedClientId, client?.notes ?? selectedClientFromList?.notes ?? null, 'Coach');

  const { meals: mealAssignments, activeMealPlan, refresh: refreshMeals } = useClientMeals(
    activeTab === 'nutrition' || activeTab === 'assignments' ? selectedClientId : null,
  );

  const { assignments: videoAssignments, refresh: refreshVideoAssignments } =
    useClientVideoAssignments(activeTab === 'assignments' ? selectedClientId : null);
  const { removeAssignment: removeVideoAssignment } = useClientVideoAssignmentActions(selectedClientId);

  const {
    data: weeklyCheckIns,
    isLoading: isWeeklyCheckInsLoading,
    error: weeklyCheckInsError,
  } = useAdminClientWeeklyCheckIns(activeTab === 'check-ins' ? selectedClientId ?? '' : '');
  const {
    data: dailyCheckIns,
    isLoading: isDailyCheckInsLoading,
    error: dailyCheckInsError,
  } = useAdminClientDailyCheckIns(activeTab === 'check-ins' ? selectedClientId ?? '' : '');

  const { deleteCheckIn, resetAll } = useAdminWeeklyCheckInActions(selectedClientId ?? '');
  const { markReviewed: markDailyReviewed } = useAdminDailyCheckInActions(selectedClientId ?? '');

  useEffect(() => {
    setActiveTab('summary');
    setMountedTabs(['summary']);
  }, [selectedClientId]);

  useEffect(() => {
    preloadedTabsRef.current = {
      clientId: selectedClientId,
      tabs: new Set(),
    };
  }, [selectedClientId]);

  useEffect(() => {
    setMountedTabs(prev => (prev.includes(activeTab) ? prev : [...prev, activeTab]));
  }, [activeTab]);

  const summaryWeightKg = useMemo(() => {
    if (!weeklyCheckIns?.checkIns?.length) return client?.currentWeight ?? null;
    const withWeight = weeklyCheckIns.checkIns
      .filter(ci => ci.weightKg != null)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    return withWeight[0]?.weightKg ?? client?.currentWeight ?? null;
  }, [weeklyCheckIns, client?.currentWeight]);

  useEffect(() => {
    if (!filteredClients.length) return;

    const queryClientId = searchParams.get('clientId');
    const preferredId =
      queryClientId && filteredClients.some(clientItem => clientItem.id === queryClientId)
        ? queryClientId
        : filteredClients[0].id;

    if (preferredId !== selectedClientId) {
      setSelectedClientId(preferredId);
    }
  }, [filteredClients, searchParams, selectedClientId]);

  useEffect(() => {
    setShowHealthMetricsModal(false);
    setHealthMetricsResults(null);
  }, [selectedClientId]);

  const prefetchDashboardTab = (tab: DashboardTabKey) => {
    if (!selectedClientId) return;

    const current = preloadedTabsRef.current;
    if (current.clientId !== selectedClientId) {
      current.clientId = selectedClientId;
      current.tabs = new Set();
    }

    if (current.tabs.has(tab)) {
      return;
    }

    current.tabs.add(tab);

    switch (tab) {
      case 'nutrition':
        void globalMutate(
          `/api/meal-plans?clientId=${encodeURIComponent(selectedClientId)}`,
          httpClient.get(`/api/meal-plans?clientId=${encodeURIComponent(selectedClientId)}`),
          { revalidate: false, populateCache: true },
        );
        break;
      case 'assignments':
        void Promise.allSettled([
          globalMutate(buildClientVideoAssignmentsUrl(selectedClientId), getClientVideoAssignments(selectedClientId), {
            revalidate: false,
            populateCache: true,
          }),
          globalMutate(
            `/api/meal-plans?clientId=${encodeURIComponent(selectedClientId)}`,
            httpClient.get(`/api/meal-plans?clientId=${encodeURIComponent(selectedClientId)}`),
            { revalidate: false, populateCache: true },
          ),
        ]);
        break;
      case 'check-ins':
        void Promise.allSettled([
          globalMutate(
            `/api/admin/clients/${encodeURIComponent(selectedClientId)}/weekly-checkins`,
            getAdminClientWeeklyCheckIns(selectedClientId),
            { revalidate: false, populateCache: true },
          ),
          globalMutate(
            `/api/admin/clients/${encodeURIComponent(selectedClientId)}/daily-checkins`,
            getAdminClientDailyCheckIns(selectedClientId),
            { revalidate: false, populateCache: true },
          ),
        ]);
        break;
      case 'training':
        void Promise.allSettled([
          globalMutate(
            `/api/admin/clients/${encodeURIComponent(selectedClientId)}/workout-sessions`,
            getAdminClientWorkoutSessions(selectedClientId),
            { revalidate: false, populateCache: true },
          ),
          globalMutate('/api/admin/workout-plans', getWorkoutPlans(), { revalidate: false, populateCache: true }),
        ]);
        break;
      case 'feature-visibility':
        void globalMutate(
          buildClientFeatureVisibilityUrl(selectedClientId),
          getClientFeatureVisibility(selectedClientId),
          { revalidate: false, populateCache: true },
        );
        break;
      case 'summary':
      default:
        break;
    }
  };

  useEffect(() => {
    if (!selectedClientId) return;

    const action = searchParams.get('action');
    if (action !== 'assign-meal' && action !== 'assign-workout') return;

    setActiveTab('assignments');
    setAssignModalType(action === 'assign-meal' ? 'meals' : 'videos');
    setShowAssignModal(true);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete('action');

    router.replace(`/admin/clients?${nextParams.toString()}`, { scroll: false });
  }, [selectedClientId, searchParams, router]);

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setActiveRailTab('chat');
    setShowChangeUserDrawer(false);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set('clientId', clientId);
    router.replace(`/admin/clients?${nextParams.toString()}`, { scroll: false });

    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      window.requestAnimationFrame(() => {
        detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  const handleBackToChat = () => {
    setActiveRailTab('chat');
  };

  const handleRemoveVideoAssignment = async (assignmentId: string) => {
    const confirmed = window.confirm('Remove this video assignment?');
    if (!confirmed) return;

    await removeVideoAssignment(assignmentId);
  };

  const handleRemoveMealAssignment = async (assignmentId: string) => {
    const confirmed = window.confirm('Delete this meal assignment for this client?');
    if (!confirmed) return;

    await deleteMealAssignment(assignmentId);
    await refreshMeals();
  };

  const handleArchiveClient = async () => {
    if (!selectedClientId || !client) return;
    const isArchived = client.status === 'ARCHIVED';
    const confirmed = window.confirm(
      isArchived
        ? 'Restore this client? They will be able to log in again.'
        : 'Archive this client? They will be blocked from logging in.',
    );
    if (!confirmed) return;

    try {
      if (isArchived) {
        await unarchiveClient(selectedClientId);
      } else {
        await archiveClient(selectedClientId);
      }
      await refreshClient();
      await refreshClients();
    } catch {
      window.alert('Failed to update client status.');
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClientId || !client || deleteConfirmation !== 'DELETE') return;
    setIsDeletingClient(true);
    setDeleteClientError(null);

    try {
      await requestAdminClientDeletion(selectedClientId, 'DELETE');
      setShowDeleteClientDialog(false);
      setDeleteConfirmation('');
      setShowCommunicationDrawer(false);
      await refreshClients();
      setSelectedClientId(null);
    } catch (error) {
      setDeleteClientError(error instanceof Error ? error.message : 'Failed to delete client.');
    } finally {
      setIsDeletingClient(false);
    }
  };

  const handleAccessModeChange = async (mode: 'SELF_SERVICE' | 'COACHING') => {
    if (!selectedClientId || !client || client.accessMode === mode) return;
    try {
      await updateClientAccessMode(selectedClientId, mode);
      await Promise.all([refreshClient(), refreshClients()]);
    } catch {
      window.alert('Failed to update access mode.');
    }
  };

  const handleDeleteCheckIn = async (checkInId: string) => {
    await deleteCheckIn(checkInId);
  };

  const handleResetCheckIns = async () => {
    await resetAll();
  };

  const renderDashboardTabContent = (tab: DashboardTabKey) => {
    if (!client) return null;

    switch (tab) {
      case 'summary':
        return (
          <SummaryTabContent
            client={client}
            summaryWeightKg={summaryWeightKg}
            weeklyWeightHistory={weeklyCheckIns?.checkIns ?? []}
            onEditProfileAction={() => setShowProfileEditModal(true)}
            healthMetricsResult={healthMetricsResults}
            onOpenHealthMetricsAction={() => setShowHealthMetricsModal(true)}
            onCloseHealthMetricsResultsAction={() => {}}
            onHealthMetricsNotesSavedAction={() => {
              void refreshClient();
            }}
            onArchiveClientAction={handleArchiveClient}
            onRefreshClientAction={() => {
              void refreshClient();
            }}
          />
        );
      case 'nutrition':
        return <NutritionTabContent clientId={client.id} mealAssignments={mealAssignments} />;
      case 'assignments':
        return (
          <AssignmentsTabContent
            clientId={client.id}
            mealAssignments={mealAssignments}
            videoAssignments={videoAssignments}
            activeMealPlan={activeMealPlan}
            currentGoalCalories={client.goalCalories}
            onAssignMealsAction={() => {
              setAssignModalType('meals');
              setShowAssignModal(true);
            }}
            onAssignVideosAction={() => {
              setAssignModalType('videos');
              setShowAssignModal(true);
            }}
            onRemoveMealAssignmentAction={handleRemoveMealAssignment}
            onRemoveVideoAssignmentAction={handleRemoveVideoAssignment}
            onRefreshMealsAction={async () => {
              await refreshMeals();
            }}
          />
        );
      case 'check-ins':
        return (
          <CheckInsTabContent
            weeklyData={weeklyCheckIns}
            dailyData={dailyCheckIns}
            isWeeklyLoading={isWeeklyCheckInsLoading}
            isDailyLoading={isDailyCheckInsLoading}
            isWeeklyError={Boolean(weeklyCheckInsError)}
            isDailyError={Boolean(dailyCheckInsError)}
            onDeleteWeeklyAction={handleDeleteCheckIn}
            onResetWeeklyAction={handleResetCheckIns}
            onMarkDailyReviewedAction={markDailyReviewed}
          />
        );
      case 'training':
        return <TrainingTabContent clientId={client.id} />;
      case 'feature-visibility':
        return <ClientFeatureVisibilityTab clientId={client.id} />;
      default:
        return null;
    }
  };

  return (
    <AdminPage className="max-w-none gap-5">
      <AdminPageHeader
        eyebrow="Client operations"
        title="Clients Workbench"
        description="Review client progress, handle coaching tasks, and keep chat and notes close while you work."
         actions={
           <button
            type="button"
            onClick={() => setShowAddClientModal(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--color-accent)] px-3 text-sm font-semibold text-[var(--color-text-on-accent)] transition-opacity hover:opacity-90"
          >
            <Users aria-hidden="true" focusable="false" size={15} />
            Add client
          </button>
        }
      />

      <section className="grid min-h-[calc(100dvh-220px)] gap-5 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] 2xl:grid-cols-[340px_minmax(0,1fr)]">
        <AdminPanel className="min-h-[420px] overflow-hidden lg:sticky lg:top-4 lg:h-[calc(100dvh-170px)]">
          <aside ref={leftPaneRef} className="h-full">
            {isClientsLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading clients...</div>
            ) : clientsError ? (
              <div className="h-full space-y-3 p-4">
                <p className="text-sm text-red-200">Failed to load clients.</p>
                <button
                  type="button"
                  onClick={refreshClients}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-foreground"
                >
                  Retry
                </button>
              </div>
            ) : (
              <ClientListPane
                clients={filteredClients}
                selectedClientId={selectedClientId}
                search={search}
                viewMode={viewMode}
                counts={clientCounts}
                onAddClientAction={() => setShowAddClientModal(true)}
                onSearchChangeAction={setSearch}
                onSelectClientAction={handleSelectClient}
                onViewModeChangeAction={setViewMode}
              />
            )}
          </aside>
        </AdminPanel>

        <AdminPanel className="min-h-[640px] overflow-hidden">
          <main ref={detailPanelRef} className="flex h-full min-h-0 flex-col">
            {isClientLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Select a client to load details.
              </div>
            ) : selectedClientError ? (
              <div className="h-full space-y-3 p-5">
                <p className="text-sm text-red-200">Failed to load selected client.</p>
                <button
                  type="button"
                  onClick={refreshClient}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-foreground"
                >
                  Retry
                </button>
              </div>
            ) : client ? (
              <>
                <ClientCommandHeader
                  client={client}
                  summaryWeightKg={summaryWeightKg}
                  onEditProfileAction={() => setShowProfileEditModal(true)}
                  onArchiveClientAction={handleArchiveClient}
                  onOpenHealthMetricsAction={() => setShowHealthMetricsModal(true)}
                  onAccessModeChangeAction={handleAccessModeChange}
                />

                <div className="border-b border-white/10 px-5 py-3">
                  <ClientDetailTabs
                    activeTab={activeTab}
                    onTabChangeAction={tab => {
                      startTabTransition(() => {
                        setActiveTab(tab);
                      });
                    }}
                    onTabPrefetchAction={prefetchDashboardTab}
                    actions={
                      <>
                        {!client.isSystemTemplate ? <button
                          type="button"
                          onClick={() => { setActiveRailTab('chat'); setShowCommunicationDrawer(true); }}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-white/[0.06]"
                        >
                          <MessageSquare aria-hidden="true" focusable="false" size={14} />
                          Chat
                        </button> : null}
                        {!client.isSystemTemplate ? <button
                          type="button"
                          onClick={() => { setActiveRailTab('notes'); setShowCommunicationDrawer(true); }}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-white/[0.06]"
                        >
                          <NotebookText aria-hidden="true" focusable="false" size={14} />
                          Notes
                        </button> : null}
                        {!client.isSystemTemplate ? <button
                          type="button"
                          onClick={() => { setActiveRailTab('actions'); setShowCommunicationDrawer(true); }}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-white/[0.06]"
                        >
                          <Settings2 aria-hidden="true" focusable="false" size={14} />
                          Actions
                        </button> : null}
                        <button
                          type="button"
                          onClick={() => setShowChangeUserDrawer(true)}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-white/[0.06]"
                        >
                          <Search aria-hidden="true" focusable="false" size={14} />
                          Change client
                        </button>
                      </>
                    }
                  />
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-5" aria-busy={isTabTransitionPending}>
                  {renderDashboardTabContent(activeTab)}
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                <div className="space-y-2 text-center">
                  <Users aria-hidden="true" focusable="false" size={22} className="mx-auto" />
                  <p>Select a client to view details.</p>
                </div>
              </div>
            )}
          </main>
        </AdminPanel>

        {client && showCommunicationDrawer && !client.isSystemTemplate ? (
          <div className="fixed inset-0 z-40 bg-black/60 lg:bg-black/30" onClick={() => setShowCommunicationDrawer(false)}>
            <aside className="absolute right-0 top-0 flex h-full w-full max-w-[440px] min-h-0 flex-col border-l border-white/10 bg-[rgba(16,16,18,0.98)] shadow-2xl" onClick={event => event.stopPropagation()}>
              <div className="border-b border-white/10 p-3">
                <div className="mb-3 flex items-center justify-between px-1">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Coach workspace</p>
                    <p className="text-xs text-muted-foreground">{client.name}</p>
                  </div>
                  <button type="button" aria-label="Close coach workspace" onClick={() => setShowCommunicationDrawer(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"><X aria-hidden="true" focusable="false" size={17} /></button>
                </div>
                <div className="grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
                  {[
                    { key: 'chat' as const, label: 'Chat', icon: MessageSquare },
                    { key: 'notes' as const, label: 'Notes', icon: NotebookText },
                    { key: 'actions' as const, label: 'Actions', icon: Settings2 },
                  ].map(item => {
                    const Icon = item.icon;
                    const active = activeRailTab === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                          onClick={() => setActiveRailTab(item.key)}
                        className={[
                          'inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold transition-colors',
                          active
                            ? 'bg-[var(--color-accent)] text-[var(--color-text-on-accent)]'
                            : 'text-muted-foreground hover:text-foreground',
                        ].join(' ')}
                      >
                        <Icon size={13} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="min-h-0 flex-1">
                {activeRailTab === 'chat' ? (
                  <ClientScopedChatPanel clientId={client.id} />
                ) : activeRailTab === 'notes' ? (
                  <ClientNotesPane
                    clientName={client.name}
                    entries={entries}
                    draft={draft}
                    error={noteError}
                    isSaving={isSavingNote}
                    onDraftChangeAction={setDraft}
                    onBackAction={handleBackToChat}
                    onAddNoteAction={addNote}
                    showBackButton={false}
                  />
                ) : (
                  <div className="space-y-3 p-4">
                    <p className="text-sm font-semibold text-foreground">Quick actions</p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      Common actions for {client.name}. These use the existing modals and refresh behavior.
                    </p>
                    {client.status === 'ACTIVE' ? <>
                    <button
                      type="button"
                      onClick={() => {
                        setAssignModalType('meals');
                        setShowAssignModal(true);
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-3 text-left text-sm text-foreground transition-colors hover:bg-white/[0.06]"
                    >
                      <ClipboardList aria-hidden="true" focusable="false" size={16} className="text-[var(--color-accent)]" />
                      Assign meals
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAssignModalType('videos');
                        setShowAssignModal(true);
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-3 text-left text-sm text-foreground transition-colors hover:bg-white/[0.06]"
                    >
                      <Dumbbell aria-hidden="true" focusable="false" size={16} className="text-[var(--color-accent)]" />
                      Assign videos
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowProfileEditModal(true)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-3 text-left text-sm text-foreground transition-colors hover:bg-white/[0.06]"
                    >
                      <UserPen aria-hidden="true" focusable="false" size={16} className="text-[var(--color-accent)]" />
                      Edit profile
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowHealthMetricsModal(true)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-3 text-left text-sm text-foreground transition-colors hover:bg-white/[0.06]"
                    >
                      <Calculator aria-hidden="true" focusable="false" size={16} className="text-[var(--color-accent)]" />
                      Update health metrics
                    </button>
                    </> : null}
                    {client.status !== 'INACTIVE' ? <button
                      type="button"
                      onClick={handleArchiveClient}
                      className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-3 text-left text-sm text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
                    >
                      {client.status === 'ARCHIVED' ? <Undo2 aria-hidden="true" focusable="false" size={16} /> : <Archive aria-hidden="true" focusable="false" size={16} />}
                      {client.status === 'ARCHIVED' ? 'Restore client' : 'Archive client'}
                    </button> : null}
                     {client.status === 'ACTIVE' ? (
                       <button
                         type="button"
                         onClick={() => {
                           setDeleteClientError(null);
                           setDeleteConfirmation('');
                           setShowDeleteClientDialog(true);
                         }}
                         className="flex w-full items-center gap-3 rounded-2xl border border-red-400/20 bg-red-500/[0.04] px-3 py-3 text-left text-sm text-red-200 transition-colors hover:bg-red-500/[0.09]"
                       >
                         <Trash2 aria-hidden="true" focusable="false" size={16} />
                         Delete client
                       </button>
                     ) : null}
                  </div>
                )}
              </div>
            </aside>
          </div>
        ) : null}
      </section>

      {client ? (
        <ClientProfileEditModal
          isOpen={showProfileEditModal}
          clientId={client.id}
          initialValues={{
            name: client.name,
            age: client.age ?? null,
            gender: (client as { gender?: 'MALE' | 'FEMALE' | null }).gender ?? null,
            activityLevel: (client.activityLevel as 'LOW' | 'MODERATE' | 'HIGH' | null) ?? null,
            height: client.height ?? null,
            currentWeight: client.currentWeight ?? null,
            targetWeight: client.targetWeight ?? null,
          }}
          onCloseAction={() => setShowProfileEditModal(false)}
          onSavedAction={async () => {
            setShowProfileEditModal(false);
            await refreshClient();
            await refreshClients();
          }}
        />
      ) : null}

      <NewAddClientModal
        isOpen={showAddClientModal}
        onCloseAction={() => setShowAddClientModal(false)}
        onClientAddedAction={async () => {
          await refreshClients();
        }}
      />

      {client ? (
        <AssignContentModal
          isOpen={showAssignModal}
          onCloseAction={() => setShowAssignModal(false)}
          clientId={client.id}
          clientName={client.name}
          type={assignModalType}
          onAssignmentCompleteAction={async () => {
            if (assignModalType === 'videos') {
              await refreshVideoAssignments();
            } else {
              await refreshMeals();
            }
          }}
        />
      ) : null}

      {client ? (
        <HealthMetricsModal
          isOpen={showHealthMetricsModal}
          onCloseAction={() => setShowHealthMetricsModal(false)}
          clientId={client.id}
          clientName={client.name}
          clientData={{
            currentWeight: client.currentWeight,
            height: client.height,
            age: client.age,
            gender: client.gender,
            activityLevel: client.activityLevel,
          }}
          onSuccess={async metrics => {
            setHealthMetricsResults(metrics);
            setShowHealthMetricsModal(false);
            await refreshClient();
            await refreshClients();
          }}
        />
      ) : null}

      {showChangeUserDrawer ? (
        <div className="fixed inset-0 z-50 bg-black/60 p-4 lg:p-8">
          <div
            className="mx-auto w-full max-w-xl rounded-2xl border"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
          >
            <div
              className="flex items-center justify-between gap-3 border-b px-4 py-3"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                Change Client
              </h3>
              <button
                type="button"
                onClick={() => setShowChangeUserDrawer(false)}
                className="rounded-lg border p-1.5"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                aria-label="Close user picker"
              >
                <X aria-hidden="true" focusable="false" size={14} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <input
                value={changeUserSearch}
                onChange={event => setChangeUserSearch(event.target.value)}
                placeholder="Search by name or email"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-bg-alt)',
                  color: 'var(--color-text)',
                }}
              />
              <div className="max-h-[50vh] overflow-y-auto space-y-1">
                {changeUserCandidates.map(candidate => (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => handleSelectClient(candidate.id)}
                    className="w-full rounded-lg border px-3 py-2 text-left"
                    style={{
                      borderColor: candidate.id === selectedClientId ? 'var(--color-accent)' : 'var(--color-border)',
                      background:
                        candidate.id === selectedClientId ? 'var(--color-accent-muted)' : 'var(--color-surface)',
                    }}
                  >
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                      {candidate.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {candidate.email}
                    </p>
                  </button>
                ))}
                {changeUserCandidates.length === 0 ? (
                  <p className="text-sm px-2 py-3" style={{ color: 'var(--color-text-muted)' }}>
                    No matching clients.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {client && showDeleteClientDialog ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-client-title">
          <div className="w-full max-w-md rounded-3xl border border-red-400/20 bg-[rgba(22,16,18,0.98)] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300">Danger zone</p>
                <h2 id="delete-client-title" className="mt-2 text-xl font-semibold text-foreground">Delete {client.name}?</h2>
              </div>
              <button type="button" aria-label="Close delete dialog" onClick={() => setShowDeleteClientDialog(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"><X aria-hidden="true" focusable="false" size={17} /></button>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              This immediately removes access and anonymizes the client. Permanent deletion will be scheduled using the existing privacy grace period.
            </p>
            <label className="mt-5 block text-xs font-semibold text-foreground" htmlFor="delete-client-confirmation">
              Type DELETE to confirm
            </label>
            <input
              id="delete-client-confirmation"
              autoFocus
              value={deleteConfirmation}
              onChange={event => setDeleteConfirmation(event.target.value)}
              placeholder="DELETE"
              className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-foreground outline-none focus:border-red-300/60"
            />
            {deleteClientError ? <p className="mt-3 text-sm text-red-300">{deleteClientError}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowDeleteClientDialog(false)} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button
                type="button"
                onClick={handleDeleteClient}
                disabled={isDeletingClient || deleteConfirmation !== 'DELETE'}
                className="rounded-xl bg-red-500 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeletingClient ? 'Deleting…' : 'Delete client'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminPage>
  );
}
