'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import NewAddClientModal from '@/components/NewAddClientModal';
import { DataService, Client } from '@/services/dataService';
import { Users, Flame, BarChart, Target, Activity, Clock, Mail, Phone, Scale, Calendar } from 'lucide-react';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchClients = async () => {
    try {
      setLoading(true);
      const clientsData = await DataService.getClients();
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = statusFilter === 'ALL' ? clients : clients.filter(client => client.status === statusFilter);

  const calculateBMI = (weight: number, height: number) => {
    const heightInM = height / 100;
    const bmi = weight / (heightInM * heightInM);
    return bmi.toFixed(1);
  };

  const getWeightProgress = (current: number, target: number) => {
    const difference = current - target;
    if (Math.abs(difference) < 2) return 'On Target';
    return difference > 0
      ? `${Math.abs(difference).toFixed(1)} kg to lose`
      : `${Math.abs(difference).toFixed(1)} kg to gain`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-foreground">Client Management</h1>
            <p className="text-muted-foreground">Manage your clients and track their fitness journey</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 sm:mt-0 px-6 py-3 rounded-lg flex items-center gap-2 font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Users size={20} />
              Add New Client
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {['ALL', 'ACTIVE', 'INACTIVE'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
    ${statusFilter === status ? 'btn-active' : 'btn-inactive'}
  `}
              >
                {status === 'ALL' ? 'All Clients' : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div
            className="rounded-xl p-6 shadow-sm border"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  Total Clients
                </h3>
                <p className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
                  {loading ? '...' : clients.length}
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-bg-alt)' }}
              >
                <Users size={24} />
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
                  Active Clients
                </h3>
                <p className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
                  {loading ? '...' : clients.filter(c => c.status === 'ACTIVE').length}
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-bg-alt)' }}
              >
                <Flame size={24} />
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
                  Avg Age
                </h3>
                <p className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
                  {loading
                    ? '...'
                    : clients.length > 0
                      ? Math.round(clients.reduce((sum, client) => sum + client.age, 0) / clients.length)
                      : 0}
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-bg-alt)' }}
              >
                <BarChart size={24} />
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
                  Filtered
                </h3>
                <p className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
                  {filteredClients.length}
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-bg-alt)' }}
              >
                <Target size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Clients Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="rounded-xl shadow-sm border overflow-hidden"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div
                      className="w-16 h-16 rounded-full animate-pulse mr-4"
                      style={{ background: 'var(--color-bg-alt)' }}
                    ></div>
                    <div className="flex-1">
                      <div
                        className="h-5 rounded animate-pulse mb-2"
                        style={{ background: 'var(--color-bg-alt)' }}
                      ></div>
                      <div
                        className="h-4 rounded animate-pulse w-3/4"
                        style={{ background: 'var(--color-bg-alt)' }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 rounded animate-pulse" style={{ background: 'var(--color-bg-alt)' }}></div>
                    <div
                      className="h-4 rounded animate-pulse w-5/6"
                      style={{ background: 'var(--color-bg-alt)' }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map(client => (
              <div
                key={client.id}
                className="rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-all duration-300 group"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden mr-4">
                        <Image
                          src={client.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(client.name)}
                          alt={client.name}
                          className="object-cover"
                          fill
                          sizes="64px"
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                          {client.name}
                        </h3>
                        <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                          <Mail size={16} />
                          {client.email}
                        </div>
                        <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                          <Phone size={16} />
                          {client.phone}
                        </div>
                      </div>
                    </div>
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

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 rounded-lg" style={{ background: 'var(--color-bg-alt)' }}>
                      <div
                        className="flex items-center justify-center gap-1 text-sm"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        <Clock size={16} />
                        Age
                      </div>
                      <p className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                        {client.age}
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-lg" style={{ background: 'var(--color-bg-alt)' }}>
                      <div
                        className="flex items-center justify-center gap-1 text-sm"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        <Scale size={16} />
                        BMI
                      </div>
                      <p className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                        {calculateBMI(client.height, client.currentWeight)}
                      </p>
                    </div>
                  </div>

                  {/* Weight Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
                      <span>Current: {client.currentWeight} kg</span>
                      <span>Target: {client.targetWeight} kg</span>
                    </div>
                    <div className="w-full rounded-full h-2" style={{ background: 'var(--color-bg-alt)' }}>
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(10, (client.currentWeight / client.targetWeight) * 100))}%`,
                          background: 'var(--color-accent)',
                        }}
                      ></div>
                    </div>
                    <p className="text-xs mt-1 text-center" style={{ color: 'var(--color-text-muted)' }}>
                      {getWeightProgress(client.currentWeight, client.targetWeight)}
                    </p>
                  </div>

                  {/* Activity Level */}
                  <div className="mb-4">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit"
                      style={{
                        background: 'var(--color-accent-muted)',
                        color: 'var(--color-accent)',
                      }}
                    >
                      <Activity size={16} />
                      {client.activityLevel} Activity
                    </span>
                  </div>

                  {/* Goals */}
                  <div className="mb-4">
                    <div className="flex items-center gap-1 text-sm mb-2" style={{ color: 'var(--color-text)' }}>
                      <Target size={16} />
                      Goals:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {client.goals.slice(0, 2).map((goal, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs rounded-full"
                          style={{
                            background: 'var(--color-accent-muted)',
                            color: 'var(--color-accent)',
                          }}
                        >
                          {goal.replace('-', ' ')}
                        </span>
                      ))}
                      {client.goals.length > 2 && (
                        <span
                          className="px-2 py-1 text-xs rounded-full"
                          style={{
                            background: 'var(--color-bg-alt)',
                            color: 'var(--color-text-muted)',
                          }}
                        >
                          +{client.goals.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sessions */}
                  <div
                    className="flex justify-between items-center text-sm mb-4"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <div className="flex items-center gap-1">
                      <Activity size={16} />
                      Sessions: {client.sessionsCompleted}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      Joined: {new Date(client.joinDate).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="flex-1 px-4 py-2 rounded-lg text-center font-medium flex items-center justify-center gap-1 btn-inactive"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="text-center py-16 rounded-xl border"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="mb-4">
              <Users size={48} />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              No clients found
            </h3>
            <p className="mb-6" style={{ color: 'var(--color-text-muted)' }}>
              {statusFilter === 'ALL'
                ? 'Start building your client base by adding your first client!'
                : `No ${statusFilter.toLowerCase()} clients found.`}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2 btn-inactive"
            >
              <Users size={16} />
              Add Your First Client
            </button>
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      <NewAddClientModal
        isOpen={showAddModal}
        onCloseAction={() => setShowAddModal(false)}
        onClientAddedAction={fetchClients}
      />

      {/* Edit Motivational Message Modal */}
    </div>
  );
}
