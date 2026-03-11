'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users } from 'lucide-react';
import AssignContentModal from '@/components/AssignContentModal';
import HealthMetricsModal from '@/components/HealthMetricsModal';
import { ClientProfileEditModal } from '@/features/client-profile-edit/components/ClientProfileEditModal';
import { useClientMeals } from '@/hooks/useClientMeals';
import {
  useAdminClientWeeklyCheckIns,
  useAdminWeeklyCheckInActions,
} from '@/features/weekly-checkin/hooks/useAdminWeeklyCheckIns';
import { deleteMealAssignment } from '@/features/admin-clients-dashboard/api/adminClientsDashboard.api';
import { useAdminClientsList } from '@/features/admin-clients-dashboard/hooks/useAdminClientsList';
import { useSelectedClientDashboard } from '@/features/admin-clients-dashboard/hooks/useSelectedClientDashboard';
import {
  useClientVideoAssignments,
  useClientVideoAssignmentActions,
} from '@/features/admin-clients-dashboard/hooks/useClientVideoAssignments';
import { useClientNotes } from '@/features/admin-clients-dashboard/hooks/useClientNotes';
import { ClientListPane } from '@/features/admin-clients-dashboard/components/ClientListPane';
import { ClientNotesPane } from '@/features/admin-clients-dashboard/components/ClientNotesPane';
import { ClientChatPane } from '@/features/client-coach-messaging/components/ClientChatPane';
import { ClientDetailTabs } from '@/features/admin-clients-dashboard/components/ClientDetailTabs';
import { SummaryTabContent } from '@/features/admin-clients-dashboard/components/SummaryTabContent';
import { NutritionTabContent } from '@/features/admin-clients-dashboard/components/NutritionTabContent';
import { AssignmentsTabContent } from '@/features/admin-clients-dashboard/components/AssignmentsTabContent';
import { CheckInsTabContent } from '@/features/admin-clients-dashboard/components/CheckInsTabContent';
import type { HealthMetricsOutput } from '@/lib/health/calculators';
import type {
  DashboardTabKey,
  LeftPaneMode,
} from '@/features/admin-clients-dashboard/types/adminClientsDashboard.types';

const DASHBOARD_PANE_WIDTH_STORAGE_KEY = 'admin-clients-left-pane-width';
const DASHBOARD_PANE_MIN = 320;
const DASHBOARD_PANE_MAX = 620;

function clampDashboardPaneWidth(nextWidth: number): number {
  return Math.min(DASHBOARD_PANE_MAX, Math.max(DASHBOARD_PANE_MIN, Math.round(nextWidth)));
}

export default function ClientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const layoutRef = useRef<HTMLElement | null>(null);

  const [leftPaneMode, setLeftPaneMode] = useState<LeftPaneMode>('list');
  const [leftPaneWidth, setLeftPaneWidth] = useState<number | null>(null);
  const [isResizingPane, setIsResizingPane] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTabKey>('summary');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignModalType, setAssignModalType] = useState<'videos' | 'meals'>('videos');
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [showHealthMetricsModal, setShowHealthMetricsModal] = useState(false);
  const [healthMetricsResults, setHealthMetricsResults] = useState<HealthMetricsOutput | null>(null);

  const {
    filteredClients,
    search,
    setSearch,
    isLoading: isClientsLoading,
    error: clientsError,
    refresh: refreshClients,
  } = useAdminClientsList();

  const selectedClientFromList = useMemo(
    () => filteredClients.find(client => client.id === selectedClientId) ?? null,
    [filteredClients, selectedClientId]
  );

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

  const { meals: mealAssignments, activeMealPlan, refresh: refreshMeals } = useClientMeals(selectedClientId);

  const { assignments: videoAssignments, refresh: refreshVideoAssignments } =
    useClientVideoAssignments(selectedClientId);
  const { removeAssignment: removeVideoAssignment } = useClientVideoAssignmentActions(selectedClientId);

  const {
    data: weeklyCheckIns,
    isLoading: isWeeklyCheckInsLoading,
    error: weeklyCheckInsError,
  } = useAdminClientWeeklyCheckIns(selectedClientId ?? '');

  const { deleteCheckIn, resetAll } = useAdminWeeklyCheckInActions(selectedClientId ?? '');

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

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setLeftPaneMode('chat');

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set('clientId', clientId);
    router.replace(`/admin/clients?${nextParams.toString()}`, { scroll: false });
  };

  const handleBackToList = () => {
    setLeftPaneMode('list');
  };

  const handleOpenNotes = () => {
    setLeftPaneMode('notes');
  };

  const handleBackToChat = () => {
    setLeftPaneMode('chat');
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

  const handleDeleteCheckIn = async (checkInId: string) => {
    await deleteCheckIn(checkInId);
  };

  const handleResetCheckIns = async () => {
    await resetAll();
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = window.localStorage.getItem(DASHBOARD_PANE_WIDTH_STORAGE_KEY);
    if (stored) {
      const parsed = Number(stored);
      if (Number.isFinite(parsed)) {
        setLeftPaneWidth(clampDashboardPaneWidth(parsed));
        return;
      }
    }

    const initial = layoutRef.current?.clientWidth;
    if (initial) {
      setLeftPaneWidth(clampDashboardPaneWidth(initial * 0.35));
    }
  }, []);

  useEffect(() => {
    if (!leftPaneWidth || typeof window === 'undefined') return;
    window.localStorage.setItem(DASHBOARD_PANE_WIDTH_STORAGE_KEY, String(leftPaneWidth));
  }, [leftPaneWidth]);

  const startPaneResize = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();

    const baseWidth = leftPaneWidth ?? clampDashboardPaneWidth((layoutRef.current?.clientWidth ?? 1000) * 0.35);
    const startX = event.clientX;

    setIsResizingPane(true);

    const onMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      setLeftPaneWidth(clampDashboardPaneWidth(baseWidth + delta));
    };

    const onUp = () => {
      setIsResizingPane(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div className="  max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
            Clients Dashboard
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Select a client to review their profile, progress, and notes.
          </p>
        </div>
      </header>

      <section ref={layoutRef} className="h-[calc(100vh-12rem)] min-h-[620px] flex flex-col gap-4 lg:flex-row lg:gap-0">
        <aside
          className="rounded-2xl border overflow-scroll shrink-0 lg:rounded-r-none lg:min-w-[320px] lg:max-w-[420px] lg:w-[var(--clients-left-pane-width)]"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-surface)',
            ['--clients-left-pane-width' as string]: leftPaneWidth ? `${leftPaneWidth}px` : undefined,
          }}
        >
          {isClientsLoading ? (
            <div
              className="h-full flex items-center justify-center text-sm"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Loading clients...
            </div>
          ) : clientsError ? (
            <div className="h-full p-4 space-y-3">
              <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
                Failed to load clients.
              </p>
              <button
                type="button"
                onClick={refreshClients}
                className="rounded-lg px-3 py-2 text-sm"
                style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text)' }}
              >
                Retry
              </button>
            </div>
          ) : leftPaneMode === 'list' || !client ? (
            <ClientListPane
              clients={filteredClients}
              selectedClientId={selectedClientId}
              search={search}
              onSearchChangeAction={setSearch}
              onSelectClientAction={handleSelectClient}
            />
          ) : leftPaneMode === 'chat' ? (
            <ClientChatPane
              clientId={client.id}
              clientName={client.name}
              onBackAction={handleBackToList}
              onOpenNotesAction={handleOpenNotes}
            />
          ) : (
            <ClientNotesPane
              clientName={client.name}
              entries={entries}
              draft={draft}
              error={noteError}
              isSaving={isSavingNote}
              onDraftChangeAction={setDraft}
              onBackAction={handleBackToChat}
              onAddNoteAction={addNote}
            />
          )}
        </aside>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize clients side panel"
          onMouseDown={startPaneResize}
          className={`hidden lg:block w-1 cursor-col-resize ${isResizingPane ? 'bg-[var(--color-accent)]' : 'bg-transparent'}`}
        />

        <main
          className="rounded-2xl border overflow-hidden flex flex-col flex-1 lg:rounded-l-none"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
        >
          {isClientLoading ? (
            <div
              className="h-full flex items-center justify-center text-sm"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Select a client to load details.
            </div>
          ) : selectedClientError ? (
            <div className="h-full p-4 space-y-3">
              <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
                Failed to load selected client.
              </p>
              <button
                type="button"
                onClick={refreshClient}
                className="rounded-lg px-3 py-2 text-sm"
                style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text)' }}
              >
                Retry
              </button>
            </div>
          ) : client ? (
            <>
              <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                      {client.name}
                    </h2>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {client.email}
                    </p>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: client.status === 'ACTIVE' ? 'var(--color-accent-muted)' : 'var(--color-bg-alt)',
                      color: client.status === 'ACTIVE' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    }}
                  >
                    {client.status}
                  </span>
                </div>
              </div>

              <div className="px-4 py-3">
                <ClientDetailTabs activeTab={activeTab} onTabChangeAction={setActiveTab} />
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-4">
                {activeTab === 'summary' ? (
                  <SummaryTabContent
                    client={client}
                    onEditProfileAction={() => setShowProfileEditModal(true)}
                    healthMetricsResult={healthMetricsResults}
                    onOpenHealthMetricsAction={() => setShowHealthMetricsModal(true)}
                    onCloseHealthMetricsResultsAction={() => setHealthMetricsResults(null)}
                    onHealthMetricsNotesSavedAction={() => {
                      void refreshClient();
                    }}
                  />
                ) : null}

                {activeTab === 'nutrition' ? (
                  <NutritionTabContent clientId={client.id} mealAssignments={mealAssignments} />
                ) : null}

                {activeTab === 'assignments' ? (
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
                ) : null}

                {activeTab === 'check-ins' ? (
                  <CheckInsTabContent
                    data={weeklyCheckIns}
                    isLoading={isWeeklyCheckInsLoading}
                    isError={Boolean(weeklyCheckInsError)}
                    onDeleteAction={handleDeleteCheckIn}
                    onResetAction={handleResetCheckIns}
                  />
                ) : null}
              </div>
            </>
          ) : (
            <div
              className="h-full flex items-center justify-center text-sm"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <div className="text-center space-y-2">
                <Users size={20} className="mx-auto" />
                <p>Select a client to view details.</p>
              </div>
            </div>
          )}
        </main>
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
    </div>
  );
}
