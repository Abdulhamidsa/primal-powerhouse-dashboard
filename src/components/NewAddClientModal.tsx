'use client';

import { useState } from 'react';
import { DataService } from '@/services/dataService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  User,
  Mail,
  Phone,
  Scale,
  Ruler,
  Calendar,
  Activity,
  Target,
  UtensilsCrossed,
  FileText,
  X,
  Plus,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';

interface AddClientModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onClientAddedAction: () => void;
}

interface Credentials {
  email: string;
  password: string;
  clientName: string;
}

export default function NewAddClientModal({ isOpen, onCloseAction, onClientAddedAction }: AddClientModalProps) {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: '',
    currentWeight: '',
    targetWeight: '',
    height: '',
    age: '',
    activityLevel: 'MODERATE',
    dietaryRestrictions: [''],
    goals: [''],
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.currentWeight || isNaN(Number(formData.currentWeight)))
      newErrors.currentWeight = 'Valid current weight required';
    if (!formData.targetWeight || isNaN(Number(formData.targetWeight)))
      newErrors.targetWeight = 'Valid target weight required';
    if (!formData.height || isNaN(Number(formData.height))) newErrors.height = 'Valid height required';
    if (!formData.age || isNaN(Number(formData.age))) newErrors.age = 'Valid age required';
    if (formData.goals.filter(goal => goal.trim()).length === 0) newErrors.goals = 'At least one goal is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      // Filter out empty values
      const filteredGoals = formData.goals.filter(goal => goal.trim());
      const filteredDietaryRestrictions = formData.dietaryRestrictions.filter(restriction => restriction.trim());

      const clientData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        avatar:
          formData.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name.trim())}&background=3B82F6&color=fff&size=150`,
        status: 'ACTIVE',
        currentWeight: parseFloat(formData.currentWeight),
        targetWeight: parseFloat(formData.targetWeight),
        height: parseFloat(formData.height),
        age: parseInt(formData.age), // Use age directly instead of dateOfBirth
        activityLevel: formData.activityLevel as 'LOW' | 'MODERATE' | 'HIGH',
        dietaryRestrictions: filteredDietaryRestrictions,
        goals: filteredGoals,
        notes: formData.notes.trim(),
        sessionsCompleted: 0,
        progressPhotos: [],
      };

      // Remove any undefined values
      Object.entries(clientData).forEach(([key, value]) => {
        if (value === undefined) {
          delete clientData[key as keyof typeof clientData];
        }
      });

      console.log('Creating client with data:', clientData);
      const response = await DataService.createClient(clientData);

      // Store credentials for display
      if (response.credentials) {
        setCredentials({
          email: response.credentials.email,
          password: response.credentials.password,
          clientName: clientData.name,
        });
      }

      onClientAddedAction();
    } catch (error: any) {
      console.error('Error creating client:', error);
      setErrors({
        general: `Failed to create client: ${error?.message || 'Unknown error occurred'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCredentialsClose = () => {
    setCredentials(null);
    onCloseAction();
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      avatar: '',
      currentWeight: '',
      targetWeight: '',
      height: '',
      age: '',
      activityLevel: 'MODERATE',
      dietaryRestrictions: [''],
      goals: [''],
      notes: '',
    });
    setErrors({});
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleArrayChange = (field: 'dietaryRestrictions' | 'goals', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const addArrayItem = (field: 'dietaryRestrictions' | 'goals') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const removeArrayItem = (field: 'dietaryRestrictions' | 'goals', index: number) => {
    if (formData[field].length > 1) {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index),
      }));
    }
  };

  return (
    <>
      {/* Credentials Display Modal */}
      {credentials && (
        <Dialog open={!!credentials} onOpenChange={handleCredentialsClose}>
          <DialogContent
            className="max-w-md p-0 overflow-hidden"
            style={{
              background: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
          >
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-lg" style={{ background: 'var(--color-accent-muted)' }}>
                  <AlertCircle style={{ color: 'var(--color-accent)', width: 20, height: 20 }} />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                    Client Credentials
                  </DialogTitle>
                  <DialogDescription style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                    Client &quot;{credentials.clientName}&quot; has been created successfully
                  </DialogDescription>
                </div>
              </div>

              <div
                className="p-4 rounded-lg border mb-6"
                style={{
                  background: 'var(--color-bg-alt)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-4 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Save these credentials securely. The password will not be shown again. Share safely with your
                    client.
                  </span>
                </p>

                {/* Email */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    Email Address
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={credentials.email}
                      readOnly
                      className="flex-1 px-3 py-2 rounded text-sm"
                      style={{
                        background: 'var(--color-surface)',
                        color: 'var(--color-text)',
                        borderColor: 'var(--color-border)',
                        border: '1px solid',
                      }}
                    />
                    <button
                      onClick={() => handleCopy(credentials.email, 'email')}
                      className="p-2 rounded transition-colors"
                      style={{
                        background: copiedField === 'email' ? 'var(--color-accent-muted)' : 'var(--color-bg-alt)',
                        color: copiedField === 'email' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                      }}
                      title="Copy email"
                    >
                      {copiedField === 'email' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    Password
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={credentials.password}
                      readOnly
                      className="flex-1 px-3 py-2 rounded text-sm font-mono"
                      style={{
                        background: 'var(--color-surface)',
                        color: 'var(--color-text)',
                        borderColor: 'var(--color-border)',
                        border: '1px solid',
                      }}
                    />
                    <button
                      onClick={() => handleCopy(credentials.password, 'password')}
                      className="p-2 rounded transition-colors"
                      style={{
                        background: copiedField === 'password' ? 'var(--color-accent-muted)' : 'var(--color-bg-alt)',
                        color: copiedField === 'password' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                      }}
                      title="Copy password"
                    >
                      {copiedField === 'password' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCredentialsClose}
                  className="flex-1 px-4 py-2 rounded-lg font-medium"
                  style={{
                    background: 'var(--color-accent)',
                    color: 'var(--color-text)',
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Main Add Client Modal */}
      <Dialog open={isOpen && !credentials} onOpenChange={onCloseAction}>
        <DialogContent
          className="max-w-4xl p-0 overflow-hidden"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
            maxHeight: '90vh',
            overflow: 'auto',
          }}
        >
          <div className="p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                Add New Client
              </DialogTitle>
              <DialogDescription style={{ color: 'var(--color-text-muted)' }}>
                Create a new client profile with their personal information and goals.
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {errors.general && (
              <div
                className="p-4 rounded-lg border"
                style={{
                  background: 'var(--color-accent-muted)',
                  borderColor: 'var(--color-accent)',
                  color: 'var(--color-accent)',
                }}
              >
                {errors.general}
              </div>
            )}

            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Full Name *
                    </div>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 focus:ring-red-500 focus:border-transparent"
                    style={{
                      background: 'var(--color-bg-alt)',
                      color: 'var(--color-text)',
                      borderColor: errors.name ? 'var(--color-accent)' : 'var(--color-border)',
                    }}
                    placeholder="e.g., John Smith"
                  />
                  {errors.name && (
                    <p
                      style={{
                        color: 'var(--color-accent)',
                        fontSize: '0.875rem',
                        marginTop: '0.25rem',
                      }}
                    >
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address *
                    </div>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 focus:ring-red-500 focus:border-transparent"
                    style={{
                      background: 'var(--color-bg-alt)',
                      color: 'var(--color-text)',
                      borderColor: errors.email ? 'var(--color-accent)' : 'var(--color-border)',
                    }}
                    placeholder="john.smith@email.com"
                  />
                  {errors.email && (
                    <p
                      style={{
                        color: 'var(--color-accent)',
                        fontSize: '0.875rem',
                        marginTop: '0.25rem',
                      }}
                    >
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number *
                    </div>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 focus:ring-red-500 focus:border-transparent"
                    style={{
                      background: 'var(--color-bg-alt)',
                      color: 'var(--color-text)',
                      borderColor: errors.phone ? 'var(--color-accent)' : 'var(--color-border)',
                    }}
                    placeholder="+1 (555) 123-4567"
                  />
                  {errors.phone && (
                    <p
                      style={{
                        color: 'var(--color-accent)',
                        fontSize: '0.875rem',
                        marginTop: '0.25rem',
                      }}
                    >
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Profile Picture URL (optional)
                    </div>
                  </label>
                  <input
                    type="url"
                    value={formData.avatar}
                    onChange={e => handleInputChange('avatar', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 focus:ring-red-500 focus:border-transparent"
                    style={{
                      background: 'var(--color-bg-alt)',
                      color: 'var(--color-text)',
                      borderColor: 'var(--color-border)',
                    }}
                    placeholder="https://images.unsplash.com/photo-..."
                  />
                </div>
              </div>
            </div>

            {/* Physical Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                Physical Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4" />
                      Current Weight (kg) *
                    </div>
                  </label>
                  <input
                    type="number"
                    value={formData.currentWeight}
                    onChange={e => handleInputChange('currentWeight', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 focus:ring-red-500 focus:border-transparent"
                    style={{
                      background: 'var(--color-bg-alt)',
                      color: 'var(--color-text)',
                      borderColor: errors.currentWeight ? 'var(--color-accent)' : 'var(--color-border)',
                    }}
                    placeholder="73"
                    min="20"
                    max="250"
                  />
                  {errors.currentWeight && (
                    <p
                      style={{
                        color: 'var(--color-accent)',
                        fontSize: '0.875rem',
                        marginTop: '0.25rem',
                      }}
                    >
                      {errors.currentWeight}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4" />
                      Target Weight (kg) *
                    </div>
                  </label>
                  <input
                    type="number"
                    value={formData.targetWeight}
                    onChange={e => handleInputChange('targetWeight', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 focus:ring-red-500 focus:border-transparent"
                    style={{
                      background: 'var(--color-bg-alt)',
                      color: 'var(--color-text)',
                      borderColor: errors.targetWeight ? 'var(--color-accent)' : 'var(--color-border)',
                    }}
                    placeholder="68"
                    min="20"
                    max="250"
                  />
                  {errors.targetWeight && (
                    <p
                      style={{
                        color: 'var(--color-accent)',
                        fontSize: '0.875rem',
                        marginTop: '0.25rem',
                      }}
                    >
                      {errors.targetWeight}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4" />
                      Height (cm) *
                    </div>
                  </label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={e => handleInputChange('height', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 focus:ring-red-500 focus:border-transparent"
                    style={{
                      background: 'var(--color-bg-alt)',
                      color: 'var(--color-text)',
                      borderColor: errors.height ? 'var(--color-accent)' : 'var(--color-border)',
                    }}
                    placeholder="170"
                    min="100"
                    max="250"
                  />
                  {errors.height && (
                    <p
                      style={{
                        color: 'var(--color-accent)',
                        fontSize: '0.875rem',
                        marginTop: '0.25rem',
                      }}
                    >
                      {errors.height}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Age *
                    </div>
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={e => handleInputChange('age', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 focus:ring-red-500 focus:border-transparent"
                    style={{
                      background: 'var(--color-bg-alt)',
                      color: 'var(--color-text)',
                      borderColor: errors.age ? 'var(--color-accent)' : 'var(--color-border)',
                    }}
                    placeholder="30"
                    min="16"
                    max="100"
                  />
                  {errors.age && (
                    <p
                      style={{
                        color: 'var(--color-accent)',
                        fontSize: '0.875rem',
                        marginTop: '0.25rem',
                      }}
                    >
                      {errors.age}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Activity Level */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Activity Level
                </div>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    value: 'LOW',
                    label: 'Low Activity',
                    description: 'Sedentary lifestyle, desk job',
                  },
                  {
                    value: 'MODERATE',
                    label: 'Moderate Activity',
                    description: 'Light exercise 1-3 times/week',
                  },
                  {
                    value: 'HIGH',
                    label: 'High Activity',
                    description: 'Regular intense exercise 4+ times/week',
                  },
                ].map(level => (
                  <label
                    key={level.value}
                    className="relative p-4 border rounded-lg cursor-pointer transition-all"
                    style={{
                      background:
                        formData.activityLevel === level.value ? 'var(--color-accent-muted)' : 'var(--color-bg-alt)',
                      borderColor:
                        formData.activityLevel === level.value ? 'var(--color-accent)' : 'var(--color-border)',
                    }}
                  >
                    <input
                      type="radio"
                      name="activityLevel"
                      value={level.value}
                      checked={formData.activityLevel === level.value}
                      onChange={e => handleInputChange('activityLevel', e.target.value)}
                      className="sr-only"
                    />
                    <div
                      className="text-sm font-medium mb-1"
                      style={{
                        color: formData.activityLevel === level.value ? 'var(--color-accent)' : 'var(--color-text)',
                      }}
                    >
                      {level.label}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {level.description}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Goals */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Fitness Goals *
                  </div>
                </h3>
                <button
                  type="button"
                  onClick={() => addArrayItem('goals')}
                  className="px-3 py-1 rounded-lg flex items-center gap-1 text-sm"
                  style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
                >
                  <Plus className="w-4 h-4" /> Add Goal
                </button>
              </div>
              <div className="space-y-2">
                {formData.goals.map((goal, index) => (
                  <div key={index} className="flex gap-2">
                    <select
                      value={goal}
                      onChange={e => handleArrayChange('goals', index, e.target.value)}
                      className="flex-1 px-4 py-3 rounded-lg border"
                      style={{
                        background: 'var(--color-bg-alt)',
                        color: 'var(--color-text)',
                        borderColor: errors.goals ? 'var(--color-accent)' : 'var(--color-border)',
                      }}
                    >
                      <option value="">Select a goal...</option>
                      <option value="weight-loss">Weight Loss</option>
                      <option value="muscle-gain">Muscle Gain</option>
                      <option value="strength">Strength Building</option>
                      <option value="endurance">Endurance</option>
                      <option value="flexibility">Flexibility</option>
                      <option value="general-fitness">General Fitness</option>
                      <option value="sports-performance">Sports Performance</option>
                      <option value="rehabilitation">Rehabilitation</option>
                    </select>
                    {formData.goals.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('goals', index)}
                        className="px-3 py-3 rounded-lg transition-colors"
                        style={{ color: 'var(--color-accent)' }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {errors.goals && (
                <p style={{ color: 'var(--color-accent)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {errors.goals}
                </p>
              )}
            </div>

            {/* Dietary Restrictions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="w-5 h-5" />
                    Dietary Restrictions
                  </div>
                </h3>
                <button
                  type="button"
                  onClick={() => addArrayItem('dietaryRestrictions')}
                  className="px-3 py-1 rounded-lg flex items-center gap-1 text-sm"
                  style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
                >
                  <Plus className="w-4 h-4" /> Add Restriction
                </button>
              </div>
              <div className="space-y-2">
                {formData.dietaryRestrictions.map((restriction, index) => (
                  <div key={index} className="flex gap-2">
                    <select
                      value={restriction}
                      onChange={e => handleArrayChange('dietaryRestrictions', index, e.target.value)}
                      className="flex-1 px-4 py-3 rounded-lg border"
                      style={{
                        background: 'var(--color-bg-alt)',
                        color: 'var(--color-text)',
                        borderColor: 'var(--color-border)',
                      }}
                    >
                      <option value="">Select restriction (optional)...</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="gluten-free">Gluten-Free</option>
                      <option value="dairy-free">Dairy-Free</option>
                      <option value="nut-allergy">Nut Allergy</option>
                      <option value="shellfish-allergy">Shellfish Allergy</option>
                      <option value="keto">Ketogenic</option>
                      <option value="paleo">Paleo</option>
                      <option value="low-carb">Low-Carb</option>
                      <option value="low-sodium">Low-Sodium</option>
                    </select>
                    {formData.dietaryRestrictions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('dietaryRestrictions', index)}
                        className="px-3 py-3 rounded-lg transition-colors"
                        style={{ color: 'var(--color-accent)' }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Additional Notes
                </div>
              </label>
              <textarea
                value={formData.notes}
                onChange={e => handleInputChange('notes', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 focus:ring-red-500 focus:border-transparent"
                style={{
                  background: 'var(--color-bg-alt)',
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-border)',
                }}
                placeholder="Any additional information about the client, preferences, medical conditions, etc."
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onCloseAction}
                  className="px-6 py-3 border rounded-lg"
                  style={{
                    background: 'var(--color-bg-alt)',
                    color: 'var(--color-text-muted)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-lg disabled:opacity-50"
                  style={{
                    background: 'var(--color-accent)',
                    color: 'var(--color-text)',
                  }}
                >
                  {loading ? 'Creating...' : 'Create Client'}
                </button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
