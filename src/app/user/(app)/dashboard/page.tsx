'use client';

import { useMotivationNotification } from '@/hooks/useMotivationNotification';
import { useUserData } from '@/hooks/useUserData';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { ArrowRight, ClipboardCheck, Flame, MessageSquare, Moon, Sun, Utensils } from 'lucide-react';
import { SkeletonDashboard } from '@/components/Skeletons';
import { Button } from '@/components/ui/button';

export default function UserDashboardPage() {
  const { user, error, isLoading } = useUserData();
  const [greeting, setGreeting] = useState({ text: '', icon: null as React.ReactNode });

  useMotivationNotification(user?.motivationalMessage);

  useEffect(() => {
    const denmarkTime = new Date().toLocaleString('en-US', { timeZone: 'Europe/Copenhagen' });
    const hour = new Date(denmarkTime).getHours();

    if (hour >= 5 && hour < 12) {
      setGreeting({ text: 'Good Morning', icon: <Sun size={18} /> });
    } else if (hour >= 12 && hour < 18) {
      setGreeting({ text: 'Good Afternoon', icon: <Sun size={18} /> });
    } else {
      setGreeting({ text: 'Good Evening', icon: <Moon size={18} /> });
    }
  }, []);

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  if (error) {
    return (
      <div className="px-4 py-6">
        <div className="rounded-[28px] border border-destructive/20 bg-destructive/5 p-5">
          <p className="text-sm font-semibold text-destructive">Error loading dashboard</p>
          <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  const firstName = user?.name?.split(' ')[0] || 'Member';
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const coachMessage =
    user?.motivationalMessage || 'No coach message yet. Check back after your next review.';

  const todayActions = [
    {
      title: 'Complete check-ins',
      description: 'Log your daily and weekly update.',
      href: '/user/check-ins',
      icon: ClipboardCheck,
      cta: 'Open',
      badge: 'Due',
    },
    {
      title: 'Message your coach',
      description: 'Share progress or ask for an adjustment.',
      href: '/user/chat',
      icon: MessageSquare,
      cta: 'Open',
      badge: 'New',
    },
    {
      title: 'Review today\'s meals',
      description: 'See your current meal plan.',
      href: '/user/program?tab=meals',
      icon: Utensils,
      cta: 'Open',
      badge: 'Plan',
    },
    {
      title: 'Start training block',
      description: 'Open your next planned workout.',
      href: '/user/program?tab=training',
      icon: Flame,
      cta: 'Open',
      badge: 'Today',
    },
  ] as const;

  const iosCardClass =
    'rounded-[20px] border border-white/10 bg-card/85 shadow-[0_8px_24px_-14px_rgba(0,0,0,0.55)] backdrop-blur-xl';

  return (
    <div className="px-4 pb-6 pt-3 md:px-5">
      <div className="mx-auto w-full max-w-xl space-y-4">
        <section className={`${iosCardClass} overflow-hidden`}>
          <div className="p-4 md:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {todayLabel}
                </p>

                <h1 className="mt-2 text-[30px] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[34px]">
                  {greeting.text},
                  <br />
                  {firstName}
                </h1>

                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-background/55 px-2.5 py-1">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  <span className="text-[11px] font-medium text-muted-foreground">Momentum is steady today</span>
                </div>
              </div>

              {greeting.icon && (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-background/65 text-muted-foreground">
                  {greeting.icon}
                </div>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-background/45 p-3.5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
                  <MessageSquare size={16} />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">Coach message</p>
                    <span className="rounded-full border border-white/10 bg-background/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Latest
                    </span>
                  </div>

                  <p className="mt-1.5 text-[13px] leading-5 text-foreground/85">{coachMessage}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-2.5">
          <div className="px-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Today</p>
            <h2 className="mt-1 text-[17px] font-semibold tracking-tight text-foreground">Needs attention</h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {todayActions.map(action => {
              const Icon = action.icon;

              return (
                <article
                  key={action.href}
                  className={`${iosCardClass} group p-3.5 transition-transform duration-150 active:scale-[0.99]`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted/75 text-muted-foreground">
                      <Icon size={16} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-foreground">{action.title}</h3>
                        <span className="rounded-full border border-white/10 bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {action.badge}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] text-muted-foreground">{action.description}</p>

                      <div className="mt-2.5">
                        <Button asChild size="sm" className="h-7 rounded-lg px-2.5 text-[11px]">
                          <Link href={action.href} className="inline-flex items-center gap-1.5">
                            <span>{action.cta}</span>
                            <ArrowRight size={12} />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}