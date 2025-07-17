"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import AddClientModal from "@/components/AddClientModal";
import AssignMealsModal from "@/components/AssignMealsModal";
import { DataService, Client } from "@/services/dataService";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignMealsModal, setShowAssignMealsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const fetchClients = async () => {
    try {
      setLoading(true);
      const clientsData = await DataService.getClients();
      setClients(clientsData);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = statusFilter === "ALL" ? clients : clients.filter((client) => client.status === statusFilter);

  const getStatusColor = (status: string) => {
    return status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";
  };

  const getActivityLevelColor = (level: string) => {
    switch (level) {
      case "LOW":
        return "bg-yellow-100 text-yellow-800";
      case "MODERATE":
        return "bg-blue-100 text-blue-800";
      case "HIGH":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateBMI = (weight: number, height: number) => {
    const heightInM = height / 100;
    const bmi = weight / (heightInM * heightInM);
    return bmi.toFixed(1);
  };

  const getWeightProgress = (current: number, target: number) => {
    const difference = current - target;
    if (Math.abs(difference) < 2) return "On Target";
    return difference > 0 ? `${Math.abs(difference).toFixed(1)} lbs to lose` : `${Math.abs(difference).toFixed(1)} lbs to gain`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Client Management</h1>
              <p className="text-gray-600">Manage your clients and track their fitness journey</p>
            </div>
            <button onClick={() => setShowAddModal(true)} className="mt-4 sm:mt-0 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2 shadow-lg hover:shadow-xl">
              <span className="text-xl">+</span>
              Add New Client
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {["ALL", "ACTIVE", "INACTIVE"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${statusFilter === status ? "bg-blue-500 text-white shadow-lg" : "bg-white text-gray-600 hover:bg-blue-50 border border-gray-200"}`}
              >
                {status === "ALL" ? "All Clients" : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Clients</h3>
                <p className="text-3xl font-bold text-gray-900">{loading ? "..." : clients.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Active Clients</h3>
                <p className="text-3xl font-bold text-gray-900">{loading ? "..." : clients.filter((c) => c.status === "ACTIVE").length}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🔥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Avg Age</h3>
                <p className="text-3xl font-bold text-gray-900">{loading ? "..." : clients.length > 0 ? Math.round(clients.reduce((sum, client) => sum + client.age, 0) / clients.length) : 0}</p>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Filtered</h3>
                <p className="text-3xl font-bold text-gray-900">{filteredClients.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clients Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse mr-4"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <div key={client.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <img src={client.avatar} alt={client.name} className="w-16 h-16 rounded-full object-cover mr-4" />
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{client.name}</h3>
                        <p className="text-gray-600 text-sm">{client.email}</p>
                        <p className="text-gray-500 text-sm">{client.phone}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>{client.status}</span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Age</p>
                      <p className="text-lg font-semibold text-gray-900">{client.age}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">BMI</p>
                      <p className="text-lg font-semibold text-gray-900">{calculateBMI(client.currentWeight, client.height)}</p>
                    </div>
                  </div>

                  {/* Weight Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Current: {client.currentWeight} lbs</span>
                      <span>Target: {client.targetWeight} lbs</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(10, (client.currentWeight / client.targetWeight) * 100))}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 text-center">{getWeightProgress(client.currentWeight, client.targetWeight)}</p>
                  </div>

                  {/* Activity Level */}
                  <div className="mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActivityLevelColor(client.activityLevel)}`}>{client.activityLevel} Activity</span>
                  </div>

                  {/* Goals */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Goals:</p>
                    <div className="flex flex-wrap gap-1">
                      {client.goals.slice(0, 2).map((goal, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                          {goal.replace("-", " ")}
                        </span>
                      ))}
                      {client.goals.length > 2 && <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">+{client.goals.length - 2} more</span>}
                    </div>
                  </div>

                  {/* Sessions */}
                  <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                    <span>Sessions: {client.sessionsCompleted}</span>
                    <span>Joined: {new Date(client.joinDate).toLocaleDateString()}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedClient(client);
                        setShowAssignMealsModal(true);
                      }}
                      className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <span>🍽️</span>
                      Assign Meals
                    </button>
                    <Link href={`/clients/${client.id}/meal-plans`} className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium text-center">
                      View Meal Plans
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No clients found</h3>
            <p className="text-gray-600 mb-6">{statusFilter === "ALL" ? "Start building your client base by adding your first client!" : `No ${statusFilter.toLowerCase()} clients found.`}</p>
            <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
              Add Your First Client
            </button>
          </div>
        )}
      </main>

      {/* Add Client Modal */}
      <AddClientModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onClientAdded={fetchClients} />

      {/* Assign Meals Modal */}
      {selectedClient && (
        <AssignMealsModal
          isOpen={showAssignMealsModal}
          onClose={() => {
            setShowAssignMealsModal(false);
            setSelectedClient(null);
          }}
          clientId={selectedClient.id}
          clientName={selectedClient.name}
          onMealPlanCreated={() => {
            setShowAssignMealsModal(false);
            setSelectedClient(null);
            // Optionally refresh client data to show updated meal plan info
            fetchClients();
          }}
        />
      )}
    </div>
  );
}
