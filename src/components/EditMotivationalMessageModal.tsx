'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface EditMotivationalMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: {
    id: string;
    name: string;
    motivationalMessage?: string;
  };
  onSuccess: () => void;
}

export default function EditMotivationalMessageModal({
  isOpen,
  onClose,
  client,
  onSuccess,
}: EditMotivationalMessageModalProps) {
  const [message, setMessage] = useState(client.motivationalMessage || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/clients/motivational-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: client.id,
          motivationalMessage: message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update message');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError('Failed to update motivational message');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-foreground">
            Edit Motivational Message
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Client: {client.name}
            </label>
            <p className="text-sm text-muted-foreground mb-4">
              This message will appear on the client's dashboard and they'll receive a browser notification when you update it.
            </p>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
              Motivational Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter a motivational message for your client..."
              required
            />
            <p className="text-xs text-muted-foreground mt-2">
              {message.length} characters
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
