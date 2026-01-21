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

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  dateOfBirth?: Date;
  gender?: string;
  height?: number;
  currentWeight?: number;
  targetWeight?: number;
  activityLevel?: string;
  goals?: string[];
  dietaryRestrictions?: string[];
  allergies?: string[];
  preferences?: string[];
  joinDate: Date;
  lastActive?: Date;
  status: string;
  notes?: string;
  sessionsCompleted?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface MealAssignment {
  id: string;
  mealId: string;
  clientId: string;
  assignedDate: Date;
  dueDate?: Date;
  status: string;
  notes?: string;
  meal: {
    id: string;
    name: string;
    type: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    description?: string;
  };
}

type TabKey = 'overview' | 'videos' | 'meals' | 'progress';

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

  const calculateAge = (birthDate?: Date) => {
    if (!birthDate) return 'N/A';
    const today = new Date();
    return today.getFullYear() - birthDate.getFullYear();
  };

  const calculateBMI = (height?: number, weight?: number) => {
    if (!height || !weight) return 'N/A';
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${remainingMinutes}min`;
  };

  const tabs: Array<{ key: TabKey; label: string; icon: JSX.Element }> = [
    { key: 'overview', label: 'Overview', icon: <Info size={16} /> },
    { key: 'videos', label: 'Videos', icon: <Film size={16} /> },
    { key: 'meals', label: 'Meals', icon: <Utensils size={16} /> },
    { key: 'progress', label: 'Progress', icon: <BarChart size={16} /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-center">
            <div
              className="w-14 h-14 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
              style={{ borderColor: 'var(--color-accent)' }}
            />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Loading client profile...
            </p>
          </div>
        </div>
      </div>
    );
  }

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
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          borderColor: 'var(--color-border)',
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href="/admin/clients"
                className="shrink-0 p-2 -ml-2 rounded-full transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <ChevronLeft size={22} />
              </Link>

              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border shrink-0"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <Image
                    src={
                      client.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=3B82F6&color=fff&size=64`
                    }
                    alt={client.name}
                    className="object-cover"
                    fill
                    sizes="56px"
                  />
                </div>

                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                    {client.name}
                  </h1>
                  <p className="text-sm truncate" style={{ color: 'var(--color-text-muted)' }}>
                    {client.email}
                  </p>
                  <div className="mt-1">
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium"
                      style={{
                        background: client.status === 'ACTIVE' ? 'var(--color-accent-muted)' : 'var(--color-bg-alt)',
                        color: client.status === 'ACTIVE' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      {client.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto">
              <button
                onClick={() => {
                  setAssignModalType('videos');
                  setShowAssignModal(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition active:scale-[0.99]"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              >
                <Film size={18} />
                Assign Videos
              </button>

              <button
                onClick={() => {
                  setAssignModalType('meals');
                  setShowAssignModal(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition active:scale-[0.99]"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              >
                <Utensils size={18} />
                Assign Meals
              </button>

              <button
                onClick={() => {
                  setSelectedClient(client);
                  setShowMessageModal(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition active:scale-[0.99]"
                style={{
                  background: 'var(--color-accent)',
                  color: 'var(--color-text)',
                }}
              >
                <MessageCircle size={16} />
                Message
              </button>
            </div>
          </div>

          <div className="mt-4">
            <div
              className="w-full inline-flex gap-1 p-1 rounded-2xl border overflow-x-auto no-scrollbar"
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderColor: 'var(--color-border)',
              }}
            >
              {tabs.map(t => {
                const isActive = activeTab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={cx(
                      'shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition active:scale-[0.99]',
                      isActive ? 'shadow-sm' : 'opacity-80 hover:opacity-100'
                    )}
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.10)' : 'transparent',
                      color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
                      border: isActive ? '1px solid var(--color-border)' : '1px solid transparent',
                    }}
                  >
                    <span style={{ color: isActive ? 'var(--color-accent)' : 'currentColor' }}>{t.icon}</span>
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:pb-0">
            <div className={cx(iosPanel, 'p-5 min-w-[220px] md:min-w-0')} style={iosPanelStyle}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    Assigned Videos
                  </p>
                  <p className="text-3xl font-semibold" style={{ color: 'var(--color-accent)' }}>
                    {videoAssignments.length}
                  </p>
                </div>
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{ background: 'var(--color-bg-alt)' }}
                >
                  <Film size={22} style={{ color: 'var(--color-accent)' }} />
                </div>
              </div>
            </div>

            <div className={cx(iosPanel, 'p-5 min-w-[220px] md:min-w-0')} style={iosPanelStyle}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    Assigned Meals
                  </p>
                  <p className="text-3xl font-semibold" style={{ color: 'var(--color-accent)' }}>
                    {mealAssignments.length}
                  </p>
                </div>
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{ background: 'var(--color-bg-alt)' }}
                >
                  <Utensils size={22} style={{ color: 'var(--color-accent)' }} />
                </div>
              </div>
            </div>

            <div className={cx(iosPanel, 'p-5 min-w-[220px] md:min-w-0')} style={iosPanelStyle}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    BMI
                  </p>
                  <p className="text-3xl font-semibold" style={{ color: 'var(--color-accent)' }}>
                    {calculateBMI(client.height, client.currentWeight)}
                  </p>
                </div>
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{ background: 'var(--color-bg-alt)' }}
                >
                  <BarChart size={22} style={{ color: 'var(--color-accent)' }} />
                </div>
              </div>
            </div>

            <div className={cx(iosPanel, 'p-5 min-w-[220px] md:min-w-0')} style={iosPanelStyle}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    Sessions
                  </p>
                  <p className="text-3xl font-semibold" style={{ color: 'var(--color-accent)' }}>
                    {client.sessionsCompleted || 0}
                  </p>
                </div>
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{ background: 'var(--color-bg-alt)' }}
                >
                  <Activity size={22} style={{ color: 'var(--color-accent)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <section className={cx(iosPanel, 'p-5 sm:p-6')} style={iosPanelStyle}>
              <h3
                className="text-base sm:text-lg font-semibold mb-5 flex items-center gap-2"
                style={{ color: 'var(--color-text)' }}
              >
                <Scale size={20} style={{ color: 'var(--color-accent)' }} />
                Physical Stats
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Age</span>
                  <span style={{ color: 'var(--color-text)' }}>{calculateAge(client.dateOfBirth)} years</span>
                </div>
                <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Height</span>
                  <span style={{ color: 'var(--color-text)' }}>{client.height ? `${client.height} cm` : 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Current Weight</span>
                  <span style={{ color: 'var(--color-text)' }}>
                    {client.currentWeight ? `${client.currentWeight} kg` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Target Weight</span>
                  <span style={{ color: 'var(--color-text)' }}>
                    {client.targetWeight ? `${client.targetWeight} kg` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span style={{ color: 'var(--color-text-muted)' }}>Activity Level</span>
                  <span style={{ color: 'var(--color-text)' }}>{client.activityLevel?.replace('_', ' ') || 'N/A'}</span>
                </div>
              </div>
            </section>

            <section className={cx(iosPanel, 'p-5 sm:p-6')} style={iosPanelStyle}>
              <h3
                className="text-base sm:text-lg font-semibold mb-5 flex items-center gap-2"
                style={{ color: 'var(--color-text)' }}
              >
                <Target size={20} style={{ color: 'var(--color-accent)' }} />
                Goals & Preferences
              </h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                    Goals
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {client.goals && client.goals.length > 0 ? (
                      client.goals.map((goal, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 text-xs sm:text-sm rounded-full font-medium border"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-accent)',
                          }}
                        >
                          {goal.replace('_', ' ')}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)' }} className="text-sm">
                        No goals set
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs sm:text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                    Preferences
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {client.preferences && client.preferences.length > 0 ? (
                      client.preferences.map((pref, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 text-xs sm:text-sm rounded-full font-medium border"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-text)',
                          }}
                        >
                          {pref.replace('_', ' ')}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)' }} className="text-sm">
                        No preferences set
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className={cx(iosPanel, 'p-5 sm:p-6')} style={iosPanelStyle}>
              <h3
                className="text-base sm:text-lg font-semibold mb-5 flex items-center gap-2"
                style={{ color: 'var(--color-text)' }}
              >
                <Utensils size={20} style={{ color: 'var(--color-accent)' }} />
                Dietary Information
              </h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                    Restrictions
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {client.dietaryRestrictions && client.dietaryRestrictions.length > 0 ? (
                      client.dietaryRestrictions.map((restriction, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 text-xs sm:text-sm rounded-full font-medium border"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-accent)',
                          }}
                        >
                          {restriction}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)' }} className="text-sm">
                        None
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs sm:text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                    Allergies
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {client.allergies && client.allergies.length > 0 ? (
                      client.allergies.map((allergy, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 text-xs sm:text-sm rounded-full font-medium flex items-center gap-1 border"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-accent)',
                          }}
                        >
                          <AlertTriangle size={12} /> {allergy}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)' }} className="text-sm">
                        None reported
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {client.notes && (
                <div className="mt-6 pt-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <h4
                    className="text-xs sm:text-sm font-semibold mb-3 flex items-center gap-2"
                    style={{ color: 'var(--color-text)' }}
                  >
                    <FileText size={14} style={{ color: 'var(--color-accent)' }} /> Coach Notes
                  </h4>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                    {client.notes}
                  </p>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'videos' && (
          <section className={cx(iosPanel, 'p-5 sm:p-6')} style={iosPanelStyle}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <h3 className="text-lg sm:text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
                Assigned Videos
              </h3>

              <button
                onClick={() => {
                  setAssignModalType('videos');
                  setShowAssignModal(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition active:scale-[0.99]"
                style={{ background: 'var(--color-accent)', color: 'var(--color-text)' }}
              >
                <PlusCircle size={18} />
                Assign Videos
              </button>
            </div>

            {videoAssignments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                {videoAssignments.map(assignment => {
                  if (!assignment.video) return null;

                  return (
                    <div
                      key={assignment.id}
                      className="border rounded-2xl p-4 transition shadow-sm"
                      style={iosCardStyle}
                    >
                      <div className="flex items-start gap-3">
                        {assignment.video.thumbnailUrl ? (
                          <div
                            className="relative w-20 h-16 rounded-xl overflow-hidden flex-shrink-0 border"
                            style={{ borderColor: 'var(--color-border)' }}
                          >
                            <Image
                              src={assignment.video.thumbnailUrl}
                              alt={assignment.video.title}
                              className="object-cover"
                              fill
                              sizes="80px"
                            />
                          </div>
                        ) : (
                          <div
                            className="w-20 h-16 rounded-xl flex items-center justify-center flex-shrink-0 border"
                            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                          >
                            <Film className="w-8 h-8" style={{ color: 'var(--color-accent)' }} />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                            {assignment.video.title}
                          </h4>

                          <div
                            className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            <span className="inline-flex items-center gap-1">
                              <Clock size={12} /> {formatDuration(assignment.video.duration)}
                            </span>
                            <span>•</span>
                            <span className="capitalize">{assignment.video.difficulty}</span>
                            <span>•</span>
                            <span className="capitalize">{assignment.video.category}</span>
                          </div>

                          <div className="mt-2 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays size={10} /> Assigned:{' '}
                              {new Date(assignment.assignedDate).toLocaleDateString()}
                            </span>
                          </div>

                          {assignment.notes && (
                            <div
                              className="mt-2 text-[11px] p-2 rounded-xl border"
                              style={{
                                background: 'rgba(255,255,255,0.04)',
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-accent)',
                              }}
                            >
                              <div className="flex items-start gap-2">
                                <FileText size={12} className="mt-[2px]" />
                                <span className="leading-snug">{assignment.notes}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={async () => {
                            if (confirm('Remove this video assignment?')) {
                              try {
                                await fetch(`/api/video-assignments/${assignment.id}`, { method: 'DELETE' });
                                fetchVideoAssignments();
                              } catch (error) {
                                console.error('Error removing assignment:', error);
                              }
                            }
                          }}
                          className="p-2 rounded-xl border transition active:scale-[0.99]"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-accent)',
                          }}
                          title="Remove assignment"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Film size={56} style={{ margin: '0 auto', color: 'var(--color-text-muted)' }} className="mb-4" />
                <h3 className="text-base sm:text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                  No Videos Assigned
                </h3>
                <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
                  This client does not have any assigned videos yet.
                </p>
                <button
                  onClick={() => {
                    setAssignModalType('videos');
                    setShowAssignModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition active:scale-[0.99]"
                  style={{ background: 'var(--color-accent)', color: 'var(--color-text)' }}
                >
                  <PlusCircle size={18} />
                  Assign First Video
                </button>
              </div>
            )}
          </section>
        )}

        {activeTab === 'meals' && (
          <section className={cx(iosPanel, 'p-5 sm:p-6')} style={iosPanelStyle}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <h3 className="text-lg sm:text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
                Assigned Meals
              </h3>

              <button
                onClick={() => {
                  setAssignModalType('meals');
                  setShowAssignModal(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition active:scale-[0.99]"
                style={{ background: 'var(--color-accent)', color: 'var(--color-text)' }}
              >
                <PlusCircle size={18} />
                Assign Meals
              </button>
            </div>

            {mealAssignments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                {mealAssignments.map(assignment => (
                  <div key={assignment.id} className="border rounded-2xl p-4 transition shadow-sm" style={iosCardStyle}>
                    <div className="flex items-start gap-3">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border"
                        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                      >
                        {assignment.meal.type === 'BREAKFAST' ? (
                          <Coffee size={22} style={{ color: 'var(--color-accent)' }} />
                        ) : assignment.meal.type === 'LUNCH' ? (
                          <Salad size={22} style={{ color: 'var(--color-accent)' }} />
                        ) : assignment.meal.type === 'DINNER' ? (
                          <Utensils size={22} style={{ color: 'var(--color-accent)' }} />
                        ) : (
                          <Apple size={22} style={{ color: 'var(--color-accent)' }} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                          {assignment.meal.name}
                        </h4>

                        <div
                          className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          <span className="inline-flex items-center gap-1">
                            <Flame size={12} /> {assignment.meal.calories} cal
                          </span>
                          <span>•</span>
                          <span>{assignment.meal.protein}g protein</span>
                          <span>•</span>
                          <span className="capitalize">{assignment.meal.type.toLowerCase()}</span>
                        </div>

                        <div className="mt-2 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays size={10} /> Assigned: {assignment.assignedDate.toLocaleDateString()}
                          </span>
                        </div>

                        {assignment.notes && (
                          <div
                            className="mt-2 text-[11px] p-2 rounded-xl border"
                            style={{
                              background: 'rgba(255,255,255,0.04)',
                              borderColor: 'var(--color-border)',
                              color: 'var(--color-accent)',
                            }}
                          >
                            <div className="flex items-start gap-2">
                              <FileText size={12} className="mt-[2px]" />
                              <span className="leading-snug">{assignment.notes}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={async () => {
                          if (confirm('Remove this meal assignment?')) {
                            try {
                              await fetch(`/api/meal-assignments/${assignment.id}`, { method: 'DELETE' });
                              fetchMealAssignments();
                            } catch (error) {
                              console.error('Error removing assignment:', error);
                            }
                          }
                        }}
                        className="p-2 rounded-xl border transition active:scale-[0.99]"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-accent)',
                        }}
                        title="Remove assignment"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Utensils size={56} style={{ margin: '0 auto', color: 'var(--color-text-muted)' }} className="mb-4" />
                <h3 className="text-base sm:text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                  No Meals Assigned
                </h3>
                <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
                  This client does not have any assigned meals yet.
                </p>
                <button
                  onClick={() => {
                    setAssignModalType('meals');
                    setShowAssignModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition active:scale-[0.99]"
                  style={{ background: 'var(--color-accent)', color: 'var(--color-text)' }}
                >
                  <PlusCircle size={18} />
                  Assign First Meal
                </button>
              </div>
            )}
          </section>
        )}

        {activeTab === 'progress' && (
          <section className={cx(iosPanel, 'p-5 sm:p-6')} style={iosPanelStyle}>
            <h3 className="text-lg sm:text-xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              Progress Tracking
            </h3>
            <div className="text-center py-12">
              <BarChart size={56} style={{ margin: '0 auto', color: 'var(--color-text-muted)' }} className="mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                Coming soon
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Progress tracking will be available once the client starts following the assigned program.
              </p>
            </div>
          </section>
        )}
      </main>

      {selectedClient && (
        <EditMotivationalMessageModal
          isOpen={showMessageModal}
          onClose={() => {
            setShowMessageModal(false);
            setSelectedClient(null);
          }}
          client={selectedClient}
        />
      )}

      {client && (
        <AssignContentModal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          clientId={clientId}
          clientName={client.name}
          type={assignModalType}
          onAssignmentComplete={() => {
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
