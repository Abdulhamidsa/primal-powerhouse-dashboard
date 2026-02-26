'use client';

import { useState, useEffect, JSX } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AssignContentModal from '@/components/AssignContentModal';
import { VideoAssignment } from '@/types/video';
import { Users, ChevronLeft, Film, Utensils, BarChart, Info, Activity } from 'lucide-react';
import EditMotivationalMessageModal from '@/components/EditMotivationalMessageModal';
import { Client, TabKey } from '@/lib/client-page/types';
import { calculateBMI } from '@/lib/health/calculators';
import { ClientHeader } from '@/components/client-profile/ClientHeader';
import { ClientQuickStats } from '@/components/client-profile/ClientQuickStats';
import { VideosTab } from '@/components/client-profile/VideosTab';
import { MealsTab } from '@/components/client-profile/MealsTab';
import { NutritionAnalytics } from '@/components/client-profile/NutritionAnalytics';
import { ClientHealthTab } from '@/features/client-health/components/ClientHealthTab';
import { HealthMetricsWidget } from '@/components/client-profile/HealthMetricsWidget';
import HealthMetricsModal from '@/components/HealthMetricsModal';
import { HealthMetricsResults } from '@/components/HealthMetricsResults';
import { useClientMeals } from '@/hooks/useClientMeals';
import type { HealthMetricsOutput } from '@/lib/health/calculators';
import {
  useAdminClientWeeklyCheckIns,
  useAdminWeeklyCheckInActions,
} from '@/features/weekly-checkin/hooks/useAdminWeeklyCheckIns';

export default function ClientProfilePage() {
  const params = useParams();
  const clientId = params.id as string;

  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showHealthMetricsModal, setShowHealthMetricsModal] = useState(false);
  const [healthMetricsResults, setHealthMetricsResults] = useState<HealthMetricsOutput | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [client, setClient] = useState<Client | null>(null);
  const [videoAssignments, setVideoAssignments] = useState<VideoAssignment[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignModalType, setAssignModalType] = useState<'videos' | 'meals'>('videos');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetText, setResetText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [deletingCheckInId, setDeletingCheckInId] = useState<string | null>(null);

  // Use custom hook for meal assignments
  const { meals: mealAssignments, refresh: refreshMeals } = useClientMeals(clientId);
  const {
    data: weeklyCheckInData,
    isLoading: isWeeklyCheckInsLoading,
    error: weeklyCheckInError,
  } = useAdminClientWeeklyCheckIns(clientId);
  const { deleteCheckIn, resetAll } = useAdminWeeklyCheckInActions(clientId);

  const fetchClientData = async () => {
    try {
      setFetchError(null);
      const response = await fetch(`/api/clients/${clientId}`);
      if (response.ok) {
        const clientData = await response.json();
        setClient(clientData);
        setSelectedClient(clientData);
      } else {
        console.error('Failed to fetch client:', response.status);
        setFetchError(`Failed to fetch client data (${response.status})`);
      }
    } catch (error) {
      console.error('Error fetching client:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        setFetchError('Server connection failed. Please restart your development server.');
      } else {
        setFetchError('Failed to load client data');
      }
    }
  };

  const fetchVideoAssignments = async () => {
    try {
      setFetchError(null);
      const response = await fetch(`/api/video-assignments?clientId=${clientId}`);
      if (response.ok) {
        const assignments = await response.json();
        setVideoAssignments(assignments);
      }
    } catch (error) {
      console.error('Error fetching video assignments:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        setFetchError('Server connection failed. Please restart your development server.');
      }
    }
  };

  const fetchLatestHealthMetrics = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}/health-metrics?limit=1`);
      if (response.ok) {
        const metrics = await response.json();
        if (metrics && metrics.length > 0) {
          const latest = metrics[0];
          setHealthMetricsResults({
            bmi: latest.bmi,
            bmr: latest.bmr,
            tdee: latest.tdee,
            recommendedCalories: latest.recommendedCals,
            bmiCategory: latest.bmiCategory,
            macros: JSON.parse(latest.macros),
            notes: latest.notes ? latest.notes.split('\n').filter((n: string) => n.trim()) : [],
            isSafeToDeficit: latest.isSafeToDeficit,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching health metrics:', error);
    }
  };

  useEffect(() => {
    if (clientId && !fetchError) {
      fetchClientData();
      fetchVideoAssignments();
      fetchLatestHealthMetrics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]); // Only run when clientId changes

  const handleRetry = () => {
    setFetchError(null);
    setIsRetrying(true);
    fetchClientData();
    fetchVideoAssignments();
    refreshMeals(); // Use the hook's refresh function
    setTimeout(() => setIsRetrying(false), 1000);
  };

  const tabs: Array<{ key: TabKey; label: string; icon: JSX.Element }> = [
    { key: 'overview', label: 'Overview', icon: <Info size={16} /> },
    { key: 'videos', label: 'Videos', icon: <Film size={16} /> },
    { key: 'meals', label: 'Meals', icon: <Utensils size={16} /> },
    { key: 'client-health', label: 'Health', icon: <Activity size={16} /> },
    { key: 'progress', label: 'Progress', icon: <BarChart size={16} /> },
  ];

  const getWeeklyStatusStyles = (status: 'completed' | 'due' | 'overdue') => {
    if (status === 'completed') {
      return {
        bg: 'var(--color-accent-muted)',
        color: 'var(--color-accent)',
        label: 'Completed',
      };
    }

    if (status === 'overdue') {
      return {
        bg: 'var(--color-danger-muted, var(--color-bg-alt))',
        color: 'var(--color-danger)',
        label: 'Overdue',
      };
    }

    return {
      bg: 'var(--color-bg-alt)',
      color: 'var(--color-text-muted)',
      label: 'Due',
    };
  };

  const handleDeleteCheckIn = async (checkInId: string) => {
    const confirmed = window.confirm('Delete this weekly check-in entry? This cannot be undone.');
    if (!confirmed) return;

    try {
      setDeletingCheckInId(checkInId);
      await deleteCheckIn(checkInId);
    } catch (error) {
      console.error('Failed to delete weekly check-in:', error);
      window.alert('Failed to delete weekly check-in. Please try again.');
    } finally {
      setDeletingCheckInId(null);
    }
  };

  const handleResetAllCheckIns = async () => {
    if (resetText !== 'RESET') {
      window.alert('Please type RESET exactly to confirm.');
      return;
    }

    try {
      setIsResetting(true);
      const result = await resetAll();
      setShowResetModal(false);
      setResetText('');
      window.alert(`Reset complete. Deleted ${result.deletedCount} weekly check-in entries.`);
    } catch (error) {
      console.error('Failed to reset weekly check-ins:', error);
      window.alert('Failed to reset weekly check-ins. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  if (!client) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-center max-w-md">
            {fetchError ? (
              <div
                className="p-6 rounded-lg border"
                style={{
                  background: 'var(--color-surface)',
                  borderColor: 'var(--color-danger)',
                }}
              >
                <div className="text-4xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-danger)' }}>
                  Connection Error
                </h2>
                <p className="mb-4" style={{ color: 'var(--color-text-muted)' }}>
                  {fetchError}
                </p>
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="px-6 py-2 rounded-lg font-medium mb-4"
                  style={{
                    background: 'var(--color-accent)',
                    color: 'var(--color-text-on-accent)',
                    opacity: isRetrying ? 0.5 : 1,
                  }}
                >
                  {isRetrying ? 'Retrying...' : '🔄 Retry Connection'}
                </button>
                <div
                  className="text-xs text-left p-4 rounded"
                  style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text-muted)' }}
                >
                  <p className="font-semibold mb-2">Troubleshooting:</p>
                  <ol className="space-y-1 list-decimal list-inside">
                    <li>Check if dev server is running on port 3000</li>
                    <li>Verify DATABASE_URL has pooling params</li>
                    <li>
                      Restart: <code className="bg-gray-800 px-1 rounded">npm run dev</code>
                    </li>
                  </ol>
                </div>
              </div>
            ) : (
              <>
                <Users size={44} style={{ margin: '0 auto', color: 'var(--color-text-muted)' }} className="mb-4" />
                <p className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
                  Loading client...
                </p>
              </>
            )}
            {!fetchError && (
              <Link
                href="/clients"
                className="mt-4 inline-flex items-center gap-1 text-sm"
                style={{ color: 'var(--color-accent)' }}
              >
                <ChevronLeft size={16} /> Back to Clients
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <ClientHeader
        client={client}
        tabs={tabs}
        activeTab={activeTab}
        onTabChangeAction={setActiveTab}
        onAssignVideosAction={() => {
          setAssignModalType('videos');
          setShowAssignModal(true);
        }}
        onAssignMealsAction={() => {
          setAssignModalType('meals');
          setShowAssignModal(true);
        }}
        onMessageAction={() => {
          setSelectedClient(client);
          setShowMessageModal(true);
        }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <ClientQuickStats
          videosCount={videoAssignments.length}
          mealsCount={mealAssignments.length}
          bmi={
            client.currentWeight && client.height ? calculateBMI(client.currentWeight, client.height).toString() : 'N/A'
          }
          sessions={client.sessionsCompleted || 0}
        />

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 w-full md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="rounded-2xl border shadow-sm p-6 bg-card">
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                Personal Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-muted)' }}>Name</span>
                  <span style={{ color: 'var(--color-text)' }} className="font-medium">
                    {client.name}
                  </span>
                </div>
                <div className="flex justify-between border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Email</span>
                  <span style={{ color: 'var(--color-text)' }} className="font-medium">
                    {client.email}
                  </span>
                </div>
                <div className="flex justify-between border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Phone</span>
                  <span style={{ color: 'var(--color-text)' }} className="font-medium">
                    {client.phone || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Age</span>
                  <span style={{ color: 'var(--color-text)' }} className="font-medium">
                    {client.age} years
                  </span>
                </div>
                <div className="flex justify-between border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Status</span>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: client.status === 'ACTIVE' ? 'var(--color-accent-muted)' : 'var(--color-bg-alt)',
                      color: client.status === 'ACTIVE' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    }}
                  >
                    {client.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Physical Metrics */}
            <div className="rounded-2xl border shadow-sm p-6 bg-card">
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                Physical Metrics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Height</span>
                  <span style={{ color: 'var(--color-text)' }} className="font-medium">
                    {client.height ? `${client.height} cm` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Current Weight</span>
                  <span style={{ color: 'var(--color-text)' }} className="font-medium">
                    {client.currentWeight ? `${client.currentWeight} kg` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Target Weight</span>
                  <span style={{ color: 'var(--color-text)' }} className="font-medium">
                    {client.targetWeight ? `${client.targetWeight} kg` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>BMI</span>
                  <span style={{ color: 'var(--color-text)' }} className="font-medium">
                    {client.currentWeight && client.height ? calculateBMI(client.currentWeight, client.height) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Weight Progress</span>
                  <span style={{ color: 'var(--color-text)' }} className="font-medium text-sm">
                    {client.currentWeight && client.targetWeight
                      ? Math.abs(client.currentWeight - client.targetWeight).toFixed(1)
                      : 'N/A'}{' '}
                    kg to{' '}
                    {client.currentWeight && client.targetWeight
                      ? client.currentWeight > client.targetWeight
                        ? 'lose'
                        : 'gain'
                      : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Activity & Lifestyle */}
            <div className="rounded-2xl border shadow-sm p-6 bg-card">
              <h3 className="text-lg font-semibold mb-4">Activity & Lifestyle</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-muted)' }}>Activity Level</span>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: 'var(--color-accent-muted)',
                      color: 'var(--color-accent)',
                    }}
                  >
                    {client.activityLevel}
                  </span>
                </div>
                <div className="flex justify-between border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Sessions Completed</span>
                  <span style={{ color: 'var(--color-text)' }} className="font-medium">
                    {client.sessionsCompleted || 0}
                  </span>
                </div>
                <div className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <p style={{ color: 'var(--color-text-muted)' }} className="text-sm mb-2 pt-3">
                    Goals
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {client.goals && client.goals.length > 0 ? (
                      client.goals.map((goal, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{
                            background: 'var(--color-accent-muted)',
                            color: 'var(--color-accent)',
                          }}
                        >
                          {goal}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)' }}>No goals set</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Dietary Information */}
            <div
              className="rounded-2xl border shadow-sm p-6"
              style={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                Dietary Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p style={{ color: 'var(--color-text-muted)' }} className="text-sm mb-2">
                    Dietary Restrictions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {client.dietaryRestrictions && client.dietaryRestrictions.length > 0 ? (
                      client.dietaryRestrictions.map((restriction, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{
                            background: 'var(--color-bg-alt)',
                            color: 'var(--color-text)',
                          }}
                        >
                          {restriction}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)' }}>No restrictions</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {client.notes && (
              <div
                className="rounded-2xl border shadow-sm p-6 md:col-span-2"
                style={{
                  background: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                  Notes
                </h3>
                <p style={{ color: 'var(--color-text)' }} className="text-sm leading-relaxed">
                  {client.notes}
                </p>
              </div>
            )}

            {/* Health Metrics */}
            <div className="md:col-span-2">
              <HealthMetricsWidget
                bmi={client.currentWeight && client.height ? calculateBMI(client.currentWeight, client.height) : null}
                goalCalories={client.goalCalories ?? null}
                goalMacros={client.goalMacros ? JSON.parse(client.goalMacros) : null}
                bmiCategory={
                  client.currentWeight && client.height
                    ? (() => {
                        const bmi = calculateBMI(client.currentWeight, client.height);
                        if (bmi < 18.5) return 'underweight';
                        if (bmi < 25) return 'normal';
                        if (bmi < 30) return 'overweight';
                        return 'obese';
                      })()
                    : 'unknown'
                }
                onUpdate={() => setShowHealthMetricsModal(true)}
              />
            </div>

            {/* Health Metrics Results */}
            {healthMetricsResults && (
              <HealthMetricsResults
                clientId={clientId}
                metrics={healthMetricsResults}
                onCloseAction={() => setHealthMetricsResults(null)}
                onSaveNotesAction={() => {
                  fetchClientData();
                }}
              />
            )}

            <div
              className="rounded-2xl border shadow-sm p-6 md:col-span-2"
              style={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                  Weekly Check-Ins
                </h3>
                {weeklyCheckInData?.currentWeek ? (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: getWeeklyStatusStyles(weeklyCheckInData.currentWeek.status).bg,
                      color: getWeeklyStatusStyles(weeklyCheckInData.currentWeek.status).color,
                    }}
                  >
                    {getWeeklyStatusStyles(weeklyCheckInData.currentWeek.status).label}
                  </span>
                ) : null}
              </div>

              <div
                className="flex items-center justify-between text-sm mb-4"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <span>
                  Current week:{' '}
                  {weeklyCheckInData?.currentWeek?.weekStartDate
                    ? new Date(weeklyCheckInData.currentWeek.weekStartDate).toLocaleDateString()
                    : 'N/A'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  disabled={isWeeklyCheckInsLoading || !weeklyCheckInData?.checkIns?.length}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity"
                  style={{
                    background: 'var(--color-bg-alt)',
                    color: 'var(--color-danger)',
                    opacity: isWeeklyCheckInsLoading || !weeklyCheckInData?.checkIns?.length ? 0.5 : 1,
                  }}
                >
                  Reset All
                </button>
              </div>

              {isWeeklyCheckInsLoading ? (
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Loading weekly check-ins...
                </p>
              ) : weeklyCheckInError ? (
                <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
                  Failed to load weekly check-ins.
                </p>
              ) : weeklyCheckInData?.checkIns?.length ? (
                <div className="space-y-2">
                  {weeklyCheckInData.checkIns.map(checkIn => (
                    <div
                      key={checkIn.id}
                      className="rounded-lg border p-3 flex items-center justify-between gap-3"
                      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                          Week of {new Date(checkIn.weekStartDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          Submitted {new Date(checkIn.submittedAt).toLocaleDateString()} • Energy {checkIn.energyRating}
                          /5 • Training {checkIn.trainingAdherence}%
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCheckIn(checkIn.id)}
                        disabled={deletingCheckInId === checkIn.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity"
                        style={{
                          background: 'var(--color-surface)',
                          color: 'var(--color-danger)',
                          opacity: deletingCheckInId === checkIn.id ? 0.5 : 1,
                        }}
                      >
                        {deletingCheckInId === checkIn.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  No weekly check-ins found for this client yet.
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'videos' && (
          <VideosTab
            assignments={videoAssignments}
            onAssign={() => {
              setAssignModalType('videos');
              setShowAssignModal(true);
            }}
            onRemove={async assignmentId => {
              if (!confirm('Remove this video assignment?')) return;
              try {
                await fetch(`/api/video-assignments/${assignmentId}`, { method: 'DELETE' });
                fetchVideoAssignments();
              } catch (error) {
                console.error('Error removing assignment:', error);
              }
            }}
          />
        )}

        {activeTab === 'meals' && (
          <MealsTab
            assignments={mealAssignments}
            onAssign={() => {
              setAssignModalType('meals');
              setShowAssignModal(true);
            }}
            onRemove={async assignmentId => {
              if (!confirm('Delete this meal assignment for this client?')) return;
              try {
                await fetch(`/api/meal-assignments/${assignmentId}`, { method: 'DELETE' });
                await refreshMeals();
              } catch (error) {
                console.error('Error removing meal assignment:', error);
              }
            }}
            onMealUpdated={async () => {
              await refreshMeals();
            }}
          />
        )}

        {activeTab === 'progress' && <NutritionAnalytics assignments={mealAssignments} />}

        {activeTab === 'client-health' && <ClientHealthTab clientId={clientId} />}
      </main>

      {selectedClient && (
        <EditMotivationalMessageModal
          isOpen={showMessageModal}
          onCloseAction={() => {
            setShowMessageModal(false);
            setSelectedClient(null);
          }}
          client={selectedClient}
        />
      )}

      {client && (
        <AssignContentModal
          isOpen={showAssignModal}
          onCloseAction={() => setShowAssignModal(false)}
          clientId={clientId}
          clientName={client.name}
          type={assignModalType}
          onAssignmentCompleteAction={() => {
            if (assignModalType === 'videos') fetchVideoAssignments();
            else refreshMeals(); // Use the hook's refresh function
          }}
        />
      )}

      {client && (
        <HealthMetricsModal
          isOpen={showHealthMetricsModal}
          onCloseAction={() => setShowHealthMetricsModal(false)}
          clientId={clientId}
          clientName={client.name}
          clientData={{
            currentWeight: client.currentWeight ?? null,
            height: client.height ?? null,
            age: client.age ?? null,
            gender: client.gender ?? null,
            activityLevel: client.activityLevel ?? null,
          }}
          onSuccess={metrics => {
            setHealthMetricsResults(metrics);
            fetchClientData();
            fetchLatestHealthMetrics();
            setShowHealthMetricsModal(false);
          }}
        />
      )}

      {showResetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
        >
          <div
            className="w-full max-w-md rounded-2xl border p-6"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              Reset Weekly Check-Ins
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
              This will permanently delete all weekly check-in entries for this client. Type RESET to confirm.
            </p>
            <input
              type="text"
              value={resetText}
              onChange={event => setResetText(event.target.value)}
              placeholder="Type RESET"
              className="w-full rounded-lg px-3 py-2 mb-4 border"
              style={{
                background: 'var(--color-bg-alt)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false);
                  setResetText('');
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetAllCheckIns}
                disabled={isResetting}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: 'var(--color-danger)',
                  color: 'var(--color-text-on-accent)',
                  opacity: isResetting ? 0.6 : 1,
                }}
              >
                {isResetting ? 'Resetting...' : 'Reset All'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
