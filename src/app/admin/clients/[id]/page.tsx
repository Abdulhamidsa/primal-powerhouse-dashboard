'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
// import Navigation from '@/components/Navigation';
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
} from 'lucide-react';

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

export default function ClientProfilePage() {
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [videoAssignments, setVideoAssignments] = useState<VideoAssignment[]>([]);
  const [mealAssignments, setMealAssignments] = useState<MealAssignment[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'videos' | 'meals' | 'progress'>('overview');
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
        // Extract meal assignments from meal plans and format them
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

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
        {/* <Navigation /> */}
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div
              className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
              style={{ borderColor: 'var(--color-accent)' }}
            ></div>
            <p style={{ color: 'var(--color-text-muted)' }}>Loading client profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
        {/* <Navigation /> */}
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Users size={48} style={{ margin: '0 auto', color: 'var(--color-text-muted)' }} className="mb-4" />
            <p className="text-xl" style={{ color: 'var(--color-text)' }}>
              Client not found
            </p>
            <Link
              href="/clients"
              className="mt-4 inline-flex items-center gap-1"
              style={{ color: 'var(--color-accent)' }}
            >
              <ChevronLeft size={16} /> Back to Clients
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* <Navigation /> */}

      {/* Header */}
      <header
        className="sticky top-16 z-40 border-b"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-6">
              <Link href="/admin/clients" className="transition-colors" style={{ color: 'var(--color-text-muted)' }}>
                <ChevronLeft size={24} />
              </Link>

              <div className="flex items-center gap-4">
                <div
                  className="relative w-16 h-16 rounded-full overflow-hidden shadow-sm border"
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
                    sizes="64px"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                    {client.name}
                  </h1>
                  <p style={{ color: 'var(--color-text-muted)' }}>{client.email}</p>
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-medium mt-1"
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

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setAssignModalType('videos');
                  setShowAssignModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium"
                style={{ background: 'var(--color-accent)', color: 'var(--color-text)' }}
              >
                <Film size={18} />
                Assign Videos
              </button>

              <button
                onClick={() => {
                  setAssignModalType('meals');
                  setShowAssignModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium"
                style={{ background: 'var(--color-accent)', color: 'var(--color-text)' }}
              >
                <Utensils size={18} />
                Assign Meals
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div
            className="rounded-xl p-6 shadow-sm border"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  Assigned Videos
                </h3>
                <p className="text-3xl font-bold" style={{ color: 'var(--color-accent)' }}>
                  {videoAssignments.length}
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-bg-alt)' }}
              >
                <Film size={24} style={{ color: 'var(--color-accent)' }} />
              </div>
            </div>
          </div>

          <div
            className="rounded-xl p-6 shadow-sm border"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  Assigned Meals
                </h3>
                <p className="text-3xl font-bold" style={{ color: 'var(--color-accent)' }}>
                  {mealAssignments.length}
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-bg-alt)' }}
              >
                <Utensils size={24} style={{ color: 'var(--color-accent)' }} />
              </div>
            </div>
          </div>

          <div
            className="rounded-xl p-6 shadow-sm border"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  BMI
                </h3>
                <p className="text-3xl font-bold" style={{ color: 'var(--color-accent)' }}>
                  {calculateBMI(client.height, client.currentWeight)}
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-bg-alt)' }}
              >
                <BarChart size={24} style={{ color: 'var(--color-accent)' }} />
              </div>
            </div>
          </div>

          <div
            className="rounded-xl p-6 shadow-sm border"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  Sessions
                </h3>
                <p className="text-3xl font-bold" style={{ color: 'var(--color-accent)' }}>
                  {client.sessionsCompleted || 0}
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-bg-alt)' }}
              >
                <Activity size={24} style={{ color: 'var(--color-accent)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          className="rounded-xl border mb-8"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'overview', label: 'Overview', icon: <Info size={16} /> },
              { key: 'videos', label: 'Assigned Videos', icon: <Film size={16} /> },
              { key: 'meals', label: 'Assigned Meals', icon: <Utensils size={16} /> },
              { key: 'progress', label: 'Progress', icon: <BarChart size={16} /> },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'overview' | 'videos' | 'meals' | 'progress')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-transform flex items-center gap-2 ${activeTab === tab.key ? 'bg-white text-background' : 'border-white'}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Physical Stats */}
            <div
              className="rounded-xl border p-6"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            >
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                <Scale size={20} style={{ color: 'var(--color-accent)' }} />
                Physical Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Age:</span>
                  <span style={{ color: 'var(--color-text)' }}>{calculateAge(client.dateOfBirth)} years</span>
                </div>
                <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Height:</span>
                  <span style={{ color: 'var(--color-text)' }}>{client.height ? `${client.height} cm` : 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Current Weight:</span>
                  <span style={{ color: 'var(--color-text)' }}>
                    {client.currentWeight ? `${client.currentWeight} kg` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Target Weight:</span>
                  <span style={{ color: 'var(--color-text)' }}>
                    {client.targetWeight ? `${client.targetWeight} kg` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span style={{ color: 'var(--color-text-muted)' }}>Activity Level:</span>
                  <span style={{ color: 'var(--color-text)' }}>{client.activityLevel?.replace('_', ' ') || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Goals & Preferences */}
            <div
              className="rounded-xl border p-6"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            >
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                <Target size={20} style={{ color: 'var(--color-accent)' }} />
                Goals & Preferences
              </h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--color-text)' }}>
                    Goals:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {client.goals && client.goals.length > 0 ? (
                      client.goals.map((goal, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 text-sm rounded-full font-medium"
                          style={{
                            background: 'var(--color-accent-muted)',
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
                  <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--color-text)' }}>
                    Preferences:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {client.preferences && client.preferences.length > 0 ? (
                      client.preferences.map((pref, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 text-sm rounded-full font-medium"
                          style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text)' }}
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
            </div>

            {/* Dietary Information */}
            <div
              className="rounded-xl border p-6"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            >
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                <Utensils size={20} style={{ color: 'var(--color-accent)' }} />
                Dietary Information
              </h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--color-text)' }}>
                    Restrictions:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {client.dietaryRestrictions && client.dietaryRestrictions.length > 0 ? (
                      client.dietaryRestrictions.map((restriction, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 text-sm rounded-full font-medium"
                          style={{
                            background: 'var(--color-accent-muted)',
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
                  <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--color-text)' }}>
                    Allergies:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {client.allergies && client.allergies.length > 0 ? (
                      client.allergies.map((allergy, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 text-sm rounded-full font-medium flex items-center gap-1"
                          style={{
                            background: 'var(--color-accent-muted)',
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
                <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <h4
                    className="text-sm font-medium mb-3 flex items-center gap-1"
                    style={{ color: 'var(--color-text)' }}
                  >
                    <FileText size={14} style={{ color: 'var(--color-accent)' }} /> Coach Notes:
                  </h4>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                    {client.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'videos' && (
          <div
            className="rounded-xl border p-6"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
                Assigned Videos
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setAssignModalType('videos');
                    setShowAssignModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium"
                  style={{ background: 'var(--color-accent)', color: 'var(--color-text)' }}
                >
                  <PlusCircle size={18} />
                  Assign Videos
                </button>
              </div>
            </div>

            {videoAssignments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videoAssignments.map(assignment => {
                  if (!assignment.video) return null;
                  return (
                    <div
                      key={assignment.id}
                      className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                      style={{
                        background: 'var(--color-bg-alt)',
                        borderColor: 'var(--color-border)',
                      }}
                    >
                      <div className="flex items-start gap-4">
                        {assignment.video.thumbnailUrl ? (
                          <div className="relative w-20 h-16 rounded-lg overflow-hidden flex-shrink-0">
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
                            className="w-20 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: 'var(--color-bg)' }}
                          >
                            <Film className="w-8 h-8" style={{ color: 'var(--color-accent)' }} />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate mb-1" style={{ color: 'var(--color-text)' }}>
                            {assignment.video.title}
                          </h4>
                          <div
                            className="flex items-center gap-3 text-sm mb-2"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            <span className="flex items-center gap-1">
                              <Clock size={12} /> {formatDuration(assignment.video.duration)}
                            </span>
                            <span>•</span>
                            <span className="capitalize">{assignment.video.difficulty}</span>
                            <span>•</span>
                            <span className="capitalize">{assignment.video.category}</span>
                          </div>
                          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            <span className="flex items-center gap-1">
                              <CalendarDays size={10} /> Assigned:{' '}
                              {new Date(assignment.assignedDate).toLocaleDateString()}
                            </span>
                          </div>
                          {assignment.notes && (
                            <div
                              className="text-xs mt-1 p-2 rounded flex items-start gap-1"
                              style={{
                                background: 'var(--color-accent-muted)',
                                color: 'var(--color-accent)',
                              }}
                            >
                              <FileText size={10} className="mt-0.5" />
                              {assignment.notes}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={async () => {
                            if (confirm('Remove this video assignment?')) {
                              try {
                                await fetch(`/api/video-assignments/${assignment.id}`, {
                                  method: 'DELETE',
                                });
                                fetchVideoAssignments();
                              } catch (error) {
                                console.error('Error removing assignment:', error);
                              }
                            }
                          }}
                          className="p-1 rounded transition-colors"
                          style={{ color: 'var(--color-accent)' }}
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
                <Film size={64} style={{ margin: '0 auto', color: 'var(--color-text-muted)' }} className="mb-4" />
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                  No Videos Assigned
                </h3>
                <p className="mb-6" style={{ color: 'var(--color-text-muted)' }}>
                  This client doesn&apos;t have any assigned videos yet.
                </p>
                <button
                  onClick={() => {
                    setAssignModalType('videos');
                    setShowAssignModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg transition-colors font-medium"
                  style={{ background: 'var(--color-accent)', color: 'var(--color-text)' }}
                >
                  <PlusCircle size={18} />
                  Assign First Video
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'meals' && (
          <div
            className="rounded-xl border p-6"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
                Assigned Meals
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setAssignModalType('meals');
                    setShowAssignModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium"
                  style={{ background: 'var(--color-accent)', color: 'var(--color-text)' }}
                >
                  <PlusCircle size={18} />
                  Assign Meals
                </button>
              </div>
            </div>

            {mealAssignments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mealAssignments.map(assignment => (
                  <div
                    key={assignment.id}
                    className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                    style={{
                      background: 'var(--color-bg-alt)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--color-bg)' }}
                      >
                        {assignment.meal.type === 'BREAKFAST' ? (
                          <Coffee size={24} style={{ color: 'var(--color-accent)' }} />
                        ) : assignment.meal.type === 'LUNCH' ? (
                          <Salad size={24} style={{ color: 'var(--color-accent)' }} />
                        ) : assignment.meal.type === 'DINNER' ? (
                          <Utensils size={24} style={{ color: 'var(--color-accent)' }} />
                        ) : (
                          <Apple size={24} style={{ color: 'var(--color-accent)' }} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate mb-1" style={{ color: 'var(--color-text)' }}>
                          {assignment.meal.name}
                        </h4>
                        <div
                          className="flex items-center gap-3 text-sm mb-2"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          <span className="flex items-center gap-1">
                            <Flame size={12} /> {assignment.meal.calories} cal
                          </span>
                          <span>•</span>
                          <span>{assignment.meal.protein}g protein</span>
                          <span>•</span>
                          <span className="capitalize">{assignment.meal.type.toLowerCase()}</span>
                        </div>
                        <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          <span className="flex items-center gap-1">
                            <CalendarDays size={10} /> Assigned: {assignment.assignedDate.toLocaleDateString()}
                          </span>
                        </div>
                        {assignment.notes && (
                          <div
                            className="text-xs mt-1 p-2 rounded flex items-start gap-1"
                            style={{
                              background: 'var(--color-accent-muted)',
                              color: 'var(--color-accent)',
                            }}
                          >
                            <FileText size={10} className="mt-0.5" />
                            {assignment.notes}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={async () => {
                          if (confirm('Remove this meal assignment?')) {
                            try {
                              await fetch(`/api/meal-assignments/${assignment.id}`, {
                                method: 'DELETE',
                              });
                              fetchMealAssignments();
                            } catch (error) {
                              console.error('Error removing assignment:', error);
                            }
                          }
                        }}
                        className="p-1 rounded transition-colors"
                        style={{ color: 'var(--color-accent)' }}
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
                <Utensils size={64} style={{ margin: '0 auto', color: 'var(--color-text-muted)' }} className="mb-4" />
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                  No Meals Assigned
                </h3>
                <p className="mb-6" style={{ color: 'var(--color-text-muted)' }}>
                  This client doesn&apos;t have any assigned meals yet.
                </p>
                <button
                  onClick={() => {
                    setAssignModalType('meals');
                    setShowAssignModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg transition-colors font-medium"
                  style={{ background: 'var(--color-accent)', color: 'var(--color-text)' }}
                >
                  <PlusCircle size={18} />
                  Assign First Meal
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'progress' && (
          <div
            className="rounded-xl border p-6"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--color-text)' }}>
              Progress Tracking
            </h3>
            <div className="text-center py-12">
              <BarChart size={64} style={{ margin: '0 auto', color: 'var(--color-text-muted)' }} className="mb-4" />
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                Progress Tracking
              </h3>
              <p style={{ color: 'var(--color-text-muted)' }}>
                Progress tracking features will be available once the client starts following their assigned program.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Assignment Modal */}
      {client && (
        <AssignContentModal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          clientId={clientId}
          clientName={client.name}
          type={assignModalType}
          onAssignmentComplete={() => {
            if (assignModalType === 'videos') {
              fetchVideoAssignments();
            } else {
              fetchMealAssignments();
            }
          }}
        />
      )}
    </div>
  );
}
