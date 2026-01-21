'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Film, Utensils, MessageCircle } from 'lucide-react';
import type { Client, TabKey } from '@/lib/client-page/types';
import { cx } from '@/lib/ui';
import { JSX } from 'react';

export function ClientHeader({
  client,
  tabs,
  activeTab,
  onTabChangeAction,
  onAssignVideosAction,
  onAssignMealsAction,
  onMessageAction,
}: {
  client: Client;
  tabs: Array<{ key: TabKey; label: string; icon: JSX.Element }>;
  activeTab: TabKey;
  onTabChangeAction: (key: TabKey) => void;
  onAssignVideosAction: () => void;
  onAssignMealsAction: () => void;
  onMessageAction: () => void;
}) {
  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        borderColor: 'var(--color-border)',
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/admin/clients"
              className="shrink-0 p-2 -ml-2 rounded-full transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <ChevronLeft size={22} />
            </Link>

            <div className="flex items-center gap-3 min-w-0">
              <div
                className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border shrink-0"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <Image
                  src={
                    client.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=3B82F6&color=fff&size=64`
                  }
                  alt={client.name}
                  className="object-cover"
                  fill
                  sizes="56px"
                />
              </div>

              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                  {client.name}
                </h1>
                <p className="text-sm truncate" style={{ color: 'var(--color-text-muted)' }}>
                  {client.email}
                </p>

                <div className="mt-1">
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium"
                    style={{
                      background: client.status === 'ACTIVE' ? 'var(--color-accent-muted)' : 'var(--color-bg-alt)',
                      color: client.status === 'ACTIVE' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    {client.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto">
            <button
              onClick={onAssignVideosAction}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition active:scale-[0.99]"
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              <Film size={18} />
              Assign Videos
            </button>

            <button
              onClick={onAssignMealsAction}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition active:scale-[0.99]"
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              <Utensils size={18} />
              Assign Meals
            </button>

            <button
              onClick={onMessageAction}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition active:scale-[0.99]"
              style={{
                background: 'var(--color-accent)',
                color: 'var(--color-text)',
              }}
            >
              <MessageCircle size={16} />
              Message
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div
            className="w-full inline-flex gap-1 p-1 rounded-2xl border overflow-x-auto no-scrollbar"
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderColor: 'var(--color-border)',
            }}
          >
            {tabs.map(t => {
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => onTabChangeAction(t.key)}
                  className={cx(
                    'shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition active:scale-[0.99]',
                    isActive ? 'shadow-sm' : 'opacity-80 hover:opacity-100'
                  )}
                  style={{
                    background: isActive ? 'rgba(255,255,255,0.10)' : 'transparent',
                    color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
                    border: isActive ? '1px solid var(--color-border)' : '1px solid transparent',
                  }}
                >
                  <span style={{ color: isActive ? 'var(--color-accent)' : 'currentColor' }}>{t.icon}</span>
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
