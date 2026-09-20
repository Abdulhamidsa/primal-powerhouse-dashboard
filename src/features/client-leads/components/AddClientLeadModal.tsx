'use client';

import { useState } from 'react';
import { User, Mail, Phone, CreditCard, FileText, Wand2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAddClientLead } from '@/features/client-leads/hooks/useAddClientLead';
import { addClientLeadSchema } from '@/features/client-leads/schemas/clientLead.schemas';

type Props = {
  isOpen: boolean;
  onCloseAction: () => void;
  onLeadAddedAction: () => void;
};

const EMPTY_FORM = { name: '', email: '', phone: '', subscriptionType: '', notes: '' };

function generateEmailPreview(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .join('.');
  const suffix = String(Math.floor(1000 + Math.random() * 9000));
  return `${slug}.${suffix}@primalpowerhouse.com`;
}

export function AddClientLeadModal({ isOpen, onCloseAction, onLeadAddedAction }: Props) {
  const { addLead, isLoading } = useAddClientLead();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleChange(field: keyof typeof EMPTY_FORM, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  }

  function handleGenerateEmail() {
    if (formData.name.trim().length < 2) return;
    const generated = generateEmailPreview(formData.name.trim());
    setFormData(prev => ({ ...prev, email: generated }));
    if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
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
      email: result.data.email || undefined,
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
        className="max-w-lg overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950/95 p-0 text-foreground shadow-[0_30px_120px_rgba(0,0,0,0.55)]"
      >
        <div className="border-b border-white/10 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">Add New Lead</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Track a new prospect in your pipeline.
              </DialogDescription>
            </DialogHeader>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <User size={14} />
                Full Name *
              </span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              className={`w-full rounded-2xl border bg-black/20 px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--color-accent)]/45 ${errors.name ? 'border-red-500/60' : 'border-white/10'}`}
              placeholder="John Smith"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-300">
                {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Mail size={14} />
                Email Address
                <span className="text-xs font-normal opacity-60">(optional)</span>
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={formData.email}
                onChange={e => handleChange('email', e.target.value)}
                className={`min-w-0 flex-1 rounded-2xl border bg-black/20 px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--color-accent)]/45 ${errors.email ? 'border-red-500/60' : 'border-white/10'}`}
                placeholder="john@example.com"
              />
              <button
                type="button"
                onClick={handleGenerateEmail}
                disabled={formData.name.trim().length < 2}
                title="Generate @primalpowerhouse.com email from name"
                className="flex items-center gap-1.5 whitespace-nowrap rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground disabled:opacity-40"
              >
                <Wand2 size={13} />
                Generate
              </button>
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-300">
                {errors.email}
              </p>
            )}
            {formData.email.includes('@primalpowerhouse.com') && (
              <p className="mt-1 text-xs text-muted-foreground">
                Server will verify uniqueness and adjust if needed.
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Phone size={14} />
                Phone
                <span className="text-xs font-normal opacity-60">(optional)</span>
              </span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => handleChange('phone', e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--color-accent)]/45"
              placeholder="+1 555 123 4567"
            />
          </div>

          {/* Subscription Type */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CreditCard size={14} />
                Subscription Type
              </span>
            </label>
            <input
              type="text"
              value={formData.subscriptionType}
              onChange={e => handleChange('subscriptionType', e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--color-accent)]/45"
              placeholder="e.g. 3-month coaching, Online plan"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <FileText size={14} />
                Notes
              </span>
            </label>
            <textarea
              value={formData.notes}
              onChange={e => handleChange('notes', e.target.value)}
              rows={3}
              className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--color-accent)]/45"
              placeholder="Any relevant notes about this lead..."
            />
          </div>

          <div className="flex gap-3 border-t border-white/10 pt-5">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-2xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-[var(--color-text-on-accent)] transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isLoading ? 'Adding...' : 'Add Lead'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
