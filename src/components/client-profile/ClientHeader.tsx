'use client';

import Link from 'next/link';
import Image from 'next/image';
import { JSX, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CaretLeftIcon as ChevronLeft, FilmSlateIcon as Film, ForkKnifeIcon as Utensils, ChatCircleIcon as MessageCircle } from '@phosphor-icons/react';
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
  const tabsWrapRef = useRef<HTMLDivElement | null>(null);
  const tabButtonRefs = useRef(new Map<TabKey, HTMLButtonElement | null>());
  const [indicator, setIndicator] = useState({ x: 0, width: 0, ready: false });

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

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const wrap = tabsWrapRef.current;
      const activeButton = tabButtonRefs.current.get(activeTab);

      if (!wrap || !activeButton) return;

      const wrapRect = wrap.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();

      setIndicator({
        x: buttonRect.left - wrapRect.left,
        width: buttonRect.width,
        ready: true,
      });
    };

    updateIndicator();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateIndicator);

      return () => {
        window.removeEventListener('resize', updateIndicator);
      };
    }

    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(updateIndicator);
    });

    const wrap = tabsWrapRef.current;
    if (wrap) {
      resizeObserver.observe(wrap);
    }

    tabButtonRefs.current.forEach(button => {
      if (button) resizeObserver.observe(button);
    });

    window.addEventListener('resize', updateIndicator);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeTab, tabs]);

  const avatarSrc =
    client.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=111827&color=fff&size=96`;

  return (
    <header
      className=" z-40 border-b backdrop-blur-sm rounded-lg"
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
          <div className="flex items-center flex-row gap-2 overflow-x-auto no-scrollbar py-1">
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
            <div
              ref={tabsWrapRef}
              className="relative flex items-center justify-around gap-1 overflow-x-auto no-scrollbar py-1 px-1"
            >
              <div
                aria-hidden="true"
                className="absolute top-1 bottom-1 rounded-lg border transition-[transform,width,opacity] duration-700"
                style={{
                  left: 0,
                  width: indicator.width,
                  transform: `translate3d(${indicator.x}px, 0, 0) scale(1.04)`,
                  opacity: indicator.ready ? 1 : 0,
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.20), rgba(255,255,255,0.08))',
                  borderColor: 'rgba(255,255,255,0.12)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.10)',
                  transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                  willChange: 'transform, width, opacity',
                }}
              />
              <div
                aria-hidden="true"
                className="absolute top-1 bottom-1 rounded-lg blur-md transition-[transform,width,opacity] duration-700"
                style={{
                  left: 0,
                  width: indicator.width,
                  transform: `translate3d(${indicator.x}px, 0, 0) scale(1.12)`,
                  opacity: indicator.ready ? 0.55 : 0,
                  background:
                    'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.18), rgba(255,255,255,0.05) 70%, transparent 100%)',
                  transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                  willChange: 'transform, width, opacity',
                }}
              />
              {tabs.map(t => {
                const isActive = activeTab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => onTabChangeAction(t.key)}
                    ref={node => {
                      tabButtonRefs.current.set(t.key, node);
                    }}
                    className={cx(
                      'relative z-10 flex items-center flex-wrap justify-center gap-2 p-2 rounded-lg sm:text-sm font-medium transition-[color,transform,opacity] duration-300 ease-out active:scale-[0.99]',
                      isActive
                        ? 'shadow-sm text-[var(--color-text)] -translate-y-[1px]'
                        : 'text-[var(--color-text-muted)] opacity-85 hover:opacity-100',
                    )}
                    style={{
                      background: 'transparent',
                      border: '1px solid transparent',
                    }}
                  >
                    <span
                      className="transition-transform duration-300 ease-out"
                      style={{
                        color: isActive ? 'var(--color-accent)' : 'currentColor',
                        transform: isActive ? 'scale(1.1) translateY(-0.5px)' : 'scale(1)',
                      }}
                    >
                      {t.icon}
                    </span>
                    <span className="hidden sm:inline">{t.label}</span>
                    <span className="sm:hidden text-sm">
                      {t.key === 'overview'
                        ? 'Home'
                        : t.key === 'videos'
                          ? 'Vid'
                          : t.key === 'meals'
                            ? 'Meals'
                            : t.key === 'client-health'
                              ? 'Health'
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
