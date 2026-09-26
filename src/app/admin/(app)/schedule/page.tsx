'use client';

import { CalendarIcon as Calendar } from '@phosphor-icons/react';

export default function SchedulePage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <header
        className="z-40 border-b"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              Schedule
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div
          className="rounded-xl border p-12 text-center"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <Calendar size={64} style={{ margin: '0 auto', color: 'var(--color-text-muted)' }} className="mb-4" />
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            Schedule Coming Soon
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Appointment scheduling and calendar features will be available soon.
          </p>
        </div>
      </main>
    </div>
  );
}
