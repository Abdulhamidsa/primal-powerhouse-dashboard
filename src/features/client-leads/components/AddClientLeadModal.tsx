'use client';

import { useState } from 'react';
import { User, Mail, Phone, CreditCard, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAddClientLead } from '@/features/client-leads/hooks/useAddClientLead';
import { addClientLeadSchema } from '@/features/client-leads/schemas/clientLead.schemas';

type Props = {
  isOpen: boolean;
  onCloseAction: () => void;
  onLeadAddedAction: () => void;
};

const EMPTY_FORM = { name: '', email: '', phone: '', subscriptionType: '', notes: '' };

export function AddClientLeadModal({ isOpen, onCloseAction, onLeadAddedAction }: Props) {
  const { addLead, isLoading } = useAddClientLead();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleChange(field: keyof typeof EMPTY_FORM, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = addClientLeadSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const [field, msgs] of Object.entries(result.error.flatten().fieldErrors)) {
        if (msgs?.[0]) fieldErrors[field] = msgs[0];
      }
      setErrors(fieldErrors);
      return;
    }

    const ok = await addLead({
      name: result.data.name,
      email: result.data.email,
      phone: result.data.phone || undefined,
      subscriptionType: result.data.subscriptionType || undefined,
      notes: result.data.notes || undefined,
    });

    if (ok) {
      setFormData(EMPTY_FORM);
      setErrors({});
      onLeadAddedAction();
      onCloseAction();
    }
  }

  function handleClose() {
    setFormData(EMPTY_FORM);
    setErrors({});
    onCloseAction();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-lg p-0 overflow-hidden"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
      >
        <div className="p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
              Add New Lead
            </DialogTitle>
            <DialogDescription style={{ color: 'var(--color-text-muted)' }}>
              Track a new prospect in your pipeline.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              <span className="flex items-center gap-1.5">
                <User size={14} />
                Full Name *
              </span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border text-sm"
              style={{
                background: 'var(--color-bg-alt)',
                color: 'var(--color-text)',
                borderColor: errors.name ? 'var(--color-accent)' : 'var(--color-border)',
              }}
              placeholder="John Smith"
            />
            {errors.name && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-accent)' }}>
                {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              <span className="flex items-center gap-1.5">
                <Mail size={14} />
                Email Address *
              </span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={e => handleChange('email', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border text-sm"
              style={{
                background: 'var(--color-bg-alt)',
                color: 'var(--color-text)',
                borderColor: errors.email ? 'var(--color-accent)' : 'var(--color-border)',
              }}
              placeholder="john@example.com"
            />
            {errors.email && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-accent)' }}>
                {errors.email}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              <span className="flex items-center gap-1.5">
                <Phone size={14} />
                Phone
              </span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => handleChange('phone', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border text-sm"
              style={{
                background: 'var(--color-bg-alt)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)',
              }}
              placeholder="+1 555 123 4567"
            />
          </div>

          {/* Subscription Type */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              <span className="flex items-center gap-1.5">
                <CreditCard size={14} />
                Subscription Type
              </span>
            </label>
            <input
              type="text"
              value={formData.subscriptionType}
              onChange={e => handleChange('subscriptionType', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border text-sm"
              style={{
                background: 'var(--color-bg-alt)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)',
              }}
              placeholder="e.g. 3-month coaching, Online plan"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              <span className="flex items-center gap-1.5">
                <FileText size={14} />
                Notes
              </span>
            </label>
            <textarea
              value={formData.notes}
              onChange={e => handleChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border text-sm resize-none"
              style={{
                background: 'var(--color-bg-alt)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)',
              }}
              placeholder="Any relevant notes about this lead..."
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: 'var(--color-bg-alt)',
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
              style={{ background: 'var(--color-accent)', color: 'var(--color-text)' }}
            >
              {isLoading ? 'Adding...' : 'Add Lead'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
