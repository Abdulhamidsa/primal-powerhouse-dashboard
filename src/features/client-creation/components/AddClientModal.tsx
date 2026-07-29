'use client';

import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  Copy,
  FileText,
  Mail,
  Phone,
  Plus,
  Ruler,
  Scale,
  Target,
  User,
  UtensilsCrossed,
  X,
  Activity,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createClientSchema } from '@/features/client-creation/schemas/clientCreation.schema';
import { useAddClient } from '@/features/client-creation/hooks/useAddClient';
import type { CreateClientGender, CreateClientResponse } from '@/features/client-creation/types/clientCreation.types';

type FormState = {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  gender: '' | CreateClientGender;
  currentWeight: string;
  targetWeight: string;
  height: string;
  age: string;
  activityLevel: 'LOW' | 'MODERATE' | 'HIGH';
  dietaryRestrictions: string[];
  goals: string[];
  notes: string;
};

interface AddClientModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onClientAddedAction: () => void;
  prefillData?: { name?: string; email?: string; phone?: string };
  onCredentialsCreated?: (credentials: { email: string; password: string }) => void;
}

interface Credentials {
  email: string;
  password: string;
  clientName: string;
}

const EMPTY_FORM_STATE: FormState = {
  name: '',
  email: '',
  phone: '',
  avatar: '',
  gender: '',
  currentWeight: '',
  targetWeight: '',
  height: '',
  age: '',
  activityLevel: 'MODERATE',
  dietaryRestrictions: [''],
  goals: [''],
  notes: '',
};

function buildAvatarUrl(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3B82F6&color=fff&size=150`;
}

function parseNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export default function AddClientModal({
  isOpen,
  onCloseAction,
  onClientAddedAction,
  prefillData,
  onCredentialsCreated,
}: AddClientModalProps) {
  const { addClient, isLoading, error: submissionError } = useAddClient();
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>({
    ...EMPTY_FORM_STATE,
    name: prefillData?.name ?? '',
    email: prefillData?.email ?? '',
    phone: prefillData?.phone ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      ...EMPTY_FORM_STATE,
      name: prefillData?.name ?? '',
      email: prefillData?.email ?? '',
      phone: prefillData?.phone ?? '',
    });
    setErrors({});
    setCredentials(null);
  }, [isOpen, prefillData]);

  const resetForm = () => {
    setFormData({
      ...EMPTY_FORM_STATE,
      name: prefillData?.name ?? '',
      email: prefillData?.email ?? '',
      phone: prefillData?.phone ?? '',
    });
    setErrors({});
  };

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value } as FormState));
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

  const validateForm = () => {
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      avatar: formData.avatar.trim(),
      gender: formData.gender || null,
      currentWeight: parseNumber(formData.currentWeight),
      targetWeight: parseNumber(formData.targetWeight),
      height: parseNumber(formData.height),
      age: parseNumber(formData.age),
      activityLevel: formData.activityLevel,
      dietaryRestrictions: formData.dietaryRestrictions.map(item => item.trim()).filter(Boolean),
      goals: formData.goals.map(item => item.trim()).filter(Boolean),
      notes: formData.notes.trim(),
      status: 'ACTIVE',
      sessionsCompleted: 0,
      progressPhotos: [],
    };

    const parsed = createClientSchema.safeParse(payload);
    if (parsed.success) {
      setErrors({});
      return parsed.data;
    }

    const nextErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === 'string' && !nextErrors[field]) {
        nextErrors[field] = issue.message;
      }
    }
    if (payload.goals.length === 0) nextErrors.goals = 'At least one goal is required';
    setErrors(nextErrors);
    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validated = validateForm();
    if (!validated) return;

    try {
      const response: CreateClientResponse = await addClient({
        ...validated,
        avatar:
          validated.avatar && validated.avatar.trim()
            ? validated.avatar.trim()
            : buildAvatarUrl(validated.name),
      });

      if (response?.credentials?.email && response?.credentials?.password) {
        setCredentials({
          email: response.credentials.email,
          password: response.credentials.password,
          clientName: response.client.name,
        });
        onCredentialsCreated?.({
          email: response.credentials.email,
          password: response.credentials.password,
        });
        onClientAddedAction();
      } else {
        onClientAddedAction();
        onCloseAction();
        resetForm();
      }
    } catch (err: any) {
      setErrors({
        general: submissionError || `Failed to create client: ${err?.message || 'Unknown error occurred'}`,
      });
    }
  };

  if (!isOpen && !credentials) return null;

  return (
    <>
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
                  {errors.name && <p className="mt-1 text-sm" style={{ color: 'var(--color-accent)' }}>{errors.name}</p>}
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
                  {errors.email && <p className="mt-1 text-sm" style={{ color: 'var(--color-accent)' }}>{errors.email}</p>}
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
                  {errors.phone && <p className="mt-1 text-sm" style={{ color: 'var(--color-accent)' }}>{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Gender
                    </div>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={e => handleInputChange('gender', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 focus:ring-red-500 focus:border-transparent"
                    style={{
                      background: 'var(--color-bg-alt)',
                      color: 'var(--color-text)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    <option value="">Select gender (optional)...</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
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
                    max="350"
                  />
                  {errors.currentWeight && (
                    <p className="mt-1 text-sm" style={{ color: 'var(--color-accent)' }}>
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
                    max="350"
                  />
                  {errors.targetWeight && (
                    <p className="mt-1 text-sm" style={{ color: 'var(--color-accent)' }}>
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
                    max="260"
                  />
                  {errors.height && (
                    <p className="mt-1 text-sm" style={{ color: 'var(--color-accent)' }}>
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
                    min="10"
                    max="120"
                  />
                  {errors.age && (
                    <p className="mt-1 text-sm" style={{ color: 'var(--color-accent)' }}>
                      {errors.age}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Activity Level
                </div>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: 'LOW', label: 'Low Activity', description: 'Sedentary lifestyle, desk job' },
                  { value: 'MODERATE', label: 'Moderate Activity', description: 'Light exercise 1-3 times/week' },
                  { value: 'HIGH', label: 'High Activity', description: 'Regular intense exercise 4+ times/week' },
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
                <p className="mt-1 text-sm" style={{ color: 'var(--color-accent)' }}>
                  {errors.goals}
                </p>
              )}
            </div>

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
                  disabled={isLoading}
                  className="px-6 py-3 rounded-lg disabled:opacity-50"
                  style={{
                    background: 'var(--color-accent)',
                    color: 'var(--color-text)',
                  }}
                >
                  {isLoading ? 'Creating...' : 'Create Client'}
                </button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
