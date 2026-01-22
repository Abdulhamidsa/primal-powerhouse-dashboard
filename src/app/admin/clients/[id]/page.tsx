'use client';

import { useState, useEffect, JSX } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import AssignContentModal from '@/components/AssignContentModal';
import { VideoAssignment } from '@/types/video';
import {
  Users,
  Activity,
  ChevronLeft,
  Film,
  Utensils,
  BarChart,
  PlusCircle,
  Trash2,
  Clock,
  Target,
  CalendarDays,
  Info,
  Scale,
  FileText,
  AlertTriangle,
  Flame,
  Coffee,
  Salad,
  Apple,
  MessageCircle,
} from 'lucide-react';
import EditMotivationalMessageModal from '@/components/EditMotivationalMessageModal';
import { Client, MealAssignment, TabKey } from '@/lib/client-page/types';
import { calculateAge, calculateBMI, formatDuration } from '@/helpers';
import { ClientHeader } from '@/components/client-profile/ClientHeader';
import { ClientQuickStats } from '@/components/client-profile/ClientQuickStats';
import { VideosTab } from '@/components/client-profile/VideosTab';

const cx = (...classes: Array<string | false | undefined | null>) => classes.filter(Boolean).join(' ');

export default function ClientProfilePage() {
  const params = useParams();
  const clientId = params.id as string;

  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [client, setClient] = useState<Client | null>(null);
  const [videoAssignments, setVideoAssignments] = useState<VideoAssignment[]>([]);
  const [mealAssignments, setMealAssignments] = useState<MealAssignment[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignModalType, setAssignModalType] = useState<'videos' | 'meals'>('videos');

  const fetchClientData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clients/${clientId}`);
      if (response.ok) {
        const clientData = await response.json();
        setClient(clientData);
        setSelectedClient(clientData);
      }
    } catch (error) {
      console.error('Error fetching client:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVideoAssignments = async () => {
    try {
      const response = await fetch(`/api/video-assignments?clientId=${clientId}`);
      if (response.ok) {
        const assignments = await response.json();
        setVideoAssignments(assignments);
      }
    } catch (error) {
      console.error('Error fetching video assignments:', error);
    }
  };

  const fetchMealAssignments = async () => {
    try {
      const response = await fetch(`/api/meal-plans?clientId=${clientId}`);
      if (response.ok) {
        const mealPlans = await response.json();
        const allAssignments: MealAssignment[] = [];

        mealPlans.forEach(
          (plan: {
            startDate: string;
            endDate?: string;
            mealAssignments?: {
              id: string;
              mealId: string;
              notes?: string;
              meal: MealAssignment['meal'];
            }[];
          }) => {
            plan.mealAssignments?.forEach(
              (assignment: { id: string; mealId: string; notes?: string; meal: MealAssignment['meal'] }) => {
                allAssignments.push({
                  id: assignment.id,
                  mealId: assignment.mealId,
                  clientId: clientId,
                  assignedDate: new Date(plan.startDate),
                  dueDate: plan.endDate ? new Date(plan.endDate) : undefined,
                  status: 'assigned',
                  notes: assignment.notes,
                  meal: assignment.meal,
                });
              }
            );
          }
        );

        setMealAssignments(allAssignments);
      }
    } catch (error) {
      console.error('Error fetching meal assignments:', error);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchClientData();
      fetchVideoAssignments();
      fetchMealAssignments();
    }
  }, [clientId]);

  const tabs: Array<{ key: TabKey; label: string; icon: JSX.Element }> = [
    { key: 'overview', label: 'Overview', icon: <Info size={16} /> },
    { key: 'videos', label: 'Videos', icon: <Film size={16} /> },
    { key: 'meals', label: 'Meals', icon: <Utensils size={16} /> },
    { key: 'progress', label: 'Progress', icon: <BarChart size={16} /> },
  ];

  if (!client) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-center">
            <Users size={44} style={{ margin: '0 auto', color: 'var(--color-text-muted)' }} className="mb-4" />
            <p className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
              Client not found
            </p>
            <Link
              href="/clients"
              className="mt-4 inline-flex items-center gap-1 text-sm"
              style={{ color: 'var(--color-accent)' }}
            >
              <ChevronLeft size={16} /> Back to Clients
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const iosPanel = 'rounded-2xl border shadow-sm';
  const iosPanelStyle = {
    background: 'var(--color-surface)',
    borderColor: 'var(--color-border)',
  } as const;

  const iosCardStyle = {
    background: 'var(--color-bg-alt)',
    borderColor: 'var(--color-border)',
  } as const;

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
          bmi={calculateBMI(client.height, client.currentWeight)}
          sessions={client.sessionsCompleted || 0}
        />

        {activeTab === 'overview' && (
          <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            OverviewTab goes here.
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
          <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            MealsTab goes here.
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            ProgressTab goes here.
          </div>
        )}
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
            else fetchMealAssignments();
          }}
        />
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
