'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, X, Check } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
}

export function FeedbackModal({ isOpen, onCloseAction }: FeedbackModalProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseAction();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onCloseAction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

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

      const t = window.setTimeout(() => {
        setIsSuccess(false);
        onCloseAction();
      }, 1800);

      return () => window.clearTimeout(t);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close feedback modal"
        onClick={onCloseAction}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
      />

      {/* Centered modal */}
      <div className="relative flex min-h-full items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Send feedback"
          className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-xl animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl border border-border bg-muted/40">
                  <MessageSquare className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Send Feedback</h2>
                  <p className="text-xs text-muted-foreground">Share ideas, bugs, or improvements</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onCloseAction}
                className="grid h-9 w-9 place-items-center rounded-2xl border border-border bg-muted/40 text-muted-foreground transition-colors hover:bg-muted/60 active:bg-muted/70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isSuccess ? (
              <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted/30">
                  <Check className="h-8 w-8 text-foreground" />
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">Thank you</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your feedback has been sent.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Your message
                  </label>

                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what you think... (max 1000 characters)"
                    rows={5}
                    maxLength={1000}
                    disabled={isLoading}
                    className={[
                      'w-full resize-none rounded-2xl border border-border bg-card-hover px-4 py-3 text-sm text-foreground',
                      'placeholder:text-muted-foreground',
                      'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
                      'disabled:opacity-60',
                    ].join(' ')}
                  />

                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Be specific so we can act on it.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {message.length}/1000
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onCloseAction}
                    disabled={isLoading}
                    className="flex-1 rounded-2xl border border-border bg-card-hover px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/40 active:bg-muted/60 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={!message.trim() || isLoading}
                    className="flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-95 active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* iOS-like bottom safe spacing */}
          <div className="h-2 bg-card" />
        </div>
      </div>
    </div>
  );
}
