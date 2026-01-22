'use client';

import { useState } from 'react';
import { MessageSquare, X, Check } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/user/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit feedback');
      }

      setIsSuccess(true);
      setMessage('');

      // Auto close after 2 seconds
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end">
        <div
          className="w-full max-w-md rounded-t-3xl border border-t border-border bg-card p-6 shadow-xl animate-in slide-in-from-bottom-3 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted/50">
                <MessageSquare className="h-5 w-5 text-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Send Feedback</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted active:bg-muted/70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {isSuccess ? (
            // Success State
            <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">Thank You!</p>
                <p className="text-sm text-muted-foreground">Your feedback has been sent to our team</p>
              </div>
            </div>
          ) : (
            // Form State
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Your Feedback
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you think... (max 1000 characters)"
                  className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  rows={5}
                  maxLength={1000}
                  disabled={isLoading}
                />
                <p className="mt-2 text-xs text-muted-foreground text-right">
                  {message.length}/1000
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted/50 active:bg-muted/70 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!message.trim() || isLoading}
                  className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Send Feedback'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
