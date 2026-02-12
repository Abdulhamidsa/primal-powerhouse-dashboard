'use client';

import Link from 'next/link';
import Image from 'next/image';
import { JSX, useMemo } from 'react';
import { ChevronLeft, Film, Utensils, MessageCircle } from 'lucide-react';
import type { Client, TabKey } from '@/lib/client-page/types';
import { cx } from '@/lib/ui';

function formatStatus(status: string) {
  const s = status?.toLowerCase?.() ?? '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getStatusTone(status: string) {
  const s = (status || '').toUpperCase();
  if (s === 'ACTIVE') return 'active';
  if (s === 'PAUSED') return 'paused';
  if (s === 'INACTIVE') return 'inactive';
  return 'default';
}

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
  const statusTone = useMemo(() => getStatusTone(client.status), [client.status]);

  const statusStyles = useMemo(() => {
    const base = {
      border: '1px solid var(--color-border)',
      background: 'rgba(255,255,255,0.05)',
      color: 'var(--color-text-muted)',
    };

    if (statusTone === 'active') {
      return {
        ...base,
        background: 'rgba(34,197,94,0.10)',
        color: 'rgba(34,197,94,0.95)',
        border: '1px solid rgba(34,197,94,0.25)',
      };
    }

    if (statusTone === 'paused') {
      return {
        ...base,
        background: 'rgba(245,158,11,0.10)',
        color: 'rgba(245,158,11,0.95)',
        border: '1px solid rgba(245,158,11,0.25)',
      };
    }

    if (statusTone === 'inactive') {
      return {
        ...base,
        background: 'rgba(148,163,184,0.10)',
        color: 'rgba(148,163,184,0.95)',
        border: '1px solid rgba(148,163,184,0.25)',
      };
    }

    return base;
  }, [statusTone]);

  const avatarSrc =
    client.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=111827&color=fff&size=96`;

  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur-sm rounded-lg"
      style={{
        borderColor: 'var(--color-border)',
        background: 'rgba(20,20,20,0.62)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 ">
        {/* Top row */}
        <div className="flex items-start gap-3">
          {/* Back */}
          <Link
            href="/admin/clients"
            aria-label="Back to clients"
            className="shrink-0 -ml-1 mt-0.5 p-2 rounded-full transition active:scale-[0.98]"
            style={{
              color: 'var(--color-text-muted)',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--color-border)',
            }}
          >
            <ChevronLeft size={20} />
          </Link>

          {/* Identity */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="relative w-11 h-11 sm:w-14 sm:h-14 rounded-full overflow-hidden shrink-0"
              style={{
                border: '1px solid var(--color-border)',
                background: 'rgba(255,255,255,0.04)',
              }}
            >
              <Image src={avatarSrc} alt={client.name} fill className="object-cover" sizes="56px" priority />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <h1 className=" sm:text-lg font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                  {client.name}
                </h1>

                <span
                  className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                  style={statusStyles}
                >
                  {formatStatus(client.status)}
                </span>
              </div>

              <p className="text-[12px] sm:text-sm truncate" style={{ color: 'var(--color-text-muted)' }}>
                {client.email}
              </p>
            </div>
          </div>
        </div>

        {/* Actions (mobile-first, iOS pill buttons) */}
        <div className="mt-3 sm:mt-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={onAssignVideosAction}
              className="inline-flex w-fit items-center justify-center gap-2 px-3 py-2.5 rounded-2xl border text-[12px] sm:text-sm font-medium transition active:scale-[0.99]"
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              <Film size={16} className="opacity-90" />
              <span className="hidden sm:inline">Assign Videos</span>
              <span className="sm:hidden ">Videos</span>
            </button>

            <button
              onClick={onAssignMealsAction}
              className="inline-flex w-fit items-center justify-center gap-2 px-3 py-2.5 rounded-2xl border text-[12px] sm:text-sm font-medium transition active:scale-[0.99]"
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              <Utensils size={16} className="opacity-90" />
              <span className="hidden sm:inline">Assign Meals</span>
              <span className="sm:hidden">Meals</span>
            </button>

            <button
              onClick={onMessageAction}
              className="inline-flex w-fit items-center justify-center gap-2 px-3 py-2.5 rounded-2xl text-[12px] sm:text-sm font-semibold transition active:scale-[0.99]"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.06))',
                border: '1px solid rgba(255,255,255,0.14)',
                color: 'var(--color-text)',
              }}
            >
              <MessageCircle size={16} />
              <span className="hidden sm:inline">Message</span>
              <span className="sm:hidden">Msg</span>
            </button>
          </div>
        </div>

        {/* Tabs (iOS segmented control) */}
        <div className="mt-3 sm:mt-4 w-full">
          <div
            className="w-full p-1 rounded-2xl border"
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex items-center justify-around gap-1 overflow-x-auto no-scrollbar py-1 px-1">
              {tabs.map(t => {
                const isActive = activeTab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => onTabChangeAction(t.key)}
                    className={cx(
                      'flex items-center justify-center gap-2 p-4 rounded-lg sm:text-sm font-medium transition active:scale-[0.99]',
                      isActive ? 'shadow-sm' : 'opacity-80 hover:opacity-100'
                    )}
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.10)' : 'transparent',
                      color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
                      border: isActive ? '1px solid var(--color-border)' : '1px solid transparent',
                    }}
                  >
                    <span style={{ color: isActive ? 'var(--color-accent)' : 'currentColor' }}>{t.icon}</span>
                    <span className="hidden sm:inline">{t.label}</span>
                    <span className="sm:hidden text-sm">
                      {t.key === 'overview'
                        ? 'Home'
                        : t.key === 'videos'
                          ? 'Vid'
                          : t.key === 'meals'
                            ? 'Meals'
                            : 'Prog'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </header>
  );
}
