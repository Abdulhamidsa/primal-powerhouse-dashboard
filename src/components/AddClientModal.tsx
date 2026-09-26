'use client';


import { XIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { DataService } from '@/services/dataService';
import { WarningCircleIcon as AlertCircle, CheckIcon as Check, CopyIcon as Copy } from '@phosphor-icons/react';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientAdded: () => void;
}

interface ClientCredentials {
  email: string;
  password: string;
  clientName: string;
}

export default function AddClientModal({ isOpen, onClose, onClientAdded }: AddClientModalProps) {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<ClientCredentials | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
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

  if (!isOpen) return null;

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
      const clientData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password.trim(),
        phone: formData.phone.trim(),
        avatar:
          formData.avatar ||
          `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'women' : 'men'}/${Math.floor(Math.random() * 99)}.jpg`,
        status: 'ACTIVE',
        currentWeight: Number(formData.currentWeight),
        targetWeight: Number(formData.targetWeight),
        height: Number(formData.height),
        age: Number(formData.age),
        activityLevel: formData.activityLevel as 'LOW' | 'MODERATE' | 'HIGH',
        dietaryRestrictions: formData.dietaryRestrictions.filter(restriction => restriction.trim()),
        goals: formData.goals.filter(goal => goal.trim()),
        notes: formData.notes.trim(),
        sessionsCompleted: 0,
        progressPhotos: [],
      };

      const result = await DataService.createClient(clientData);
      const creds = result?.credentials;
      if (creds?.email && creds?.password) {
        setCredentials({
          email: creds.email,
          password: creds.password,
          clientName: clientData.name,
        });
      } else {
        onClose();
        resetForm();
      }
      onClientAdded();
    } catch (error) {
      console.error('Error creating client:', error);
      setErrors({ general: 'Failed to create client. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
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

  const handleCopy = (value: string, field: 'email' | 'password') => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleCredentialsClose = () => {
    setCredentials(null);
    onClose();
    resetForm();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Add New Client</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <span className="text-2xl">&times;</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{errors.general}</div>
          )}

          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="e.g., John Smith"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="john.smith@email.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Initial Password (optional)</label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={e => handleInputChange('password', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Leave empty to auto-generate"
                />
                <p className="text-gray-500 text-xs mt-1">
                  If left empty, a secure password will be generated and shown after creation.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="+1 (555) 123-4567"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture URL (optional)</label>
                <input
                  type="url"
                  value={formData.avatar}
                  onChange={e => handleInputChange('avatar', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://images.unsplash.com/photo-..."
                />
              </div>
            </div>
          </div>

          {/* Physical Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Physical Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Weight (lbs) *</label>
                <input
                  type="number"
                  value={formData.currentWeight}
                  onChange={e => handleInputChange('currentWeight', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.currentWeight ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="160"
                  min="50"
                  max="500"
                />
                {errors.currentWeight && <p className="text-red-500 text-sm mt-1">{errors.currentWeight}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Weight (lbs) *</label>
                <input
                  type="number"
                  value={formData.targetWeight}
                  onChange={e => handleInputChange('targetWeight', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.targetWeight ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="150"
                  min="50"
                  max="500"
                />
                {errors.targetWeight && <p className="text-red-500 text-sm mt-1">{errors.targetWeight}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm) *</label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={e => handleInputChange('height', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.height ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="170"
                  min="100"
                  max="250"
                />
                {errors.height && <p className="text-red-500 text-sm mt-1">{errors.height}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age *</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={e => handleInputChange('age', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.age ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="30"
                  min="16"
                  max="100"
                />
                {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
              </div>
            </div>
          </div>

          {/* Activity Level */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Level</h3>
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
                  className={`relative p-4 border rounded-lg cursor-pointer transition-all ${formData.activityLevel === level.value ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
                >
                  <input
                    type="radio"
                    name="activityLevel"
                    value={level.value}
                    checked={formData.activityLevel === level.value}
                    onChange={e => handleInputChange('activityLevel', e.target.value)}
                    className="sr-only"
                  />
                  <div className="text-sm font-medium text-gray-900 mb-1">{level.label}</div>
                  <div className="text-xs text-gray-600">{level.description}</div>
                </label>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Fitness Goals *</h3>
              <button
                type="button"
                onClick={() => addArrayItem('goals')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                + Add Goal
              </button>
            </div>
            <div className="space-y-2">
              {formData.goals.map((goal, index) => (
                <div key={index} className="flex gap-2">
                  <select
                    value={goal}
                    onChange={e => handleArrayChange('goals', index, e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="px-3 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    ><XIcon className="h-4 w-4" aria-hidden="true" /></button>
                  )}
                </div>
              ))}
            </div>
            {errors.goals && <p className="text-red-500 text-sm mt-1">{errors.goals}</p>}
          </div>

          {/* Dietary Restrictions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Dietary Restrictions</h3>
              <button
                type="button"
                onClick={() => addArrayItem('dietaryRestrictions')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                + Add Restriction
              </button>
            </div>
            <div className="space-y-2">
              {formData.dietaryRestrictions.map((restriction, index) => (
                <div key={index} className="flex gap-2">
                  <select
                    value={restriction}
                    onChange={e => handleArrayChange('dietaryRestrictions', index, e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="px-3 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    ><XIcon className="h-4 w-4" aria-hidden="true" /></button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
            <textarea
              value={formData.notes}
              onChange={e => handleInputChange('notes', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any additional information about the client, preferences, medical conditions, etc."
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Client'}
            </button>
          </div>
        </form>

        {credentials ? (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-gray-200">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <AlertCircle aria-hidden="true" focusable="false" size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Client Credentials</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Client &quot;{credentials.clientName}&quot; created successfully.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
                  Save these credentials now. The password will not be shown again.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Email</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={credentials.email}
                      readOnly
                      className="flex-1 px-3 py-2 rounded-md border border-gray-300 bg-white text-sm text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(credentials.email, 'email')}
                      className="p-2 rounded-md border border-gray-300 bg-white hover:bg-gray-100 text-gray-700"
                      title="Copy email"
                    >
                      {copiedField === 'email' ? <Check aria-hidden="true" focusable="false" size={16} /> : <Copy aria-hidden="true" focusable="false" size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Password</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={credentials.password}
                      readOnly
                      className="flex-1 px-3 py-2 rounded-md border border-gray-300 bg-white text-sm text-gray-900 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(credentials.password, 'password')}
                      className="p-2 rounded-md border border-gray-300 bg-white hover:bg-gray-100 text-gray-700"
                      title="Copy password"
                    >
                      {copiedField === 'password' ? <Check aria-hidden="true" focusable="false" size={16} /> : <Copy aria-hidden="true" focusable="false" size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-5">
                <button
                  type="button"
                  onClick={handleCredentialsClose}
                  className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
