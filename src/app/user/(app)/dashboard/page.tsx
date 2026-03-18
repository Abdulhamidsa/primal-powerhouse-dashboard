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
      title: 'Complete your check-ins',
      description: 'Log your weekly and daily updates so your coach can guide you better.',
      href: '/user/check-ins',
      icon: ClipboardCheck,
      cta: 'Open check-ins',
      badge: 'Priority',
    },
    {
      title: 'Send your coach a quick update',
      description: 'Share how today feels, ask a question, or request a plan adjustment.',
      href: '/user/chat',
      icon: MessageSquare,
      cta: 'Open chat',
      badge: 'Support',
    },
    {
      title: 'Check today\'s meals',
      description: 'Review your meal plan and stay on track with your nutrition targets.',
      href: '/user/meals',
      icon: Utensils,
      cta: 'Open meals',
      badge: 'Nutrition',
    },
    {
      title: 'Start your training block',
      description: 'Open your workout videos and complete the next planned session.',
      href: '/user/training',
      icon: Flame,
      cta: 'Open training',
      badge: 'Performance',
    },
  ] as const;

  return (
    <div className="px-4 pb-8 pt-4 md:px-5">
      <div className="mx-auto w-full max-w-xl space-y-6">
        <section className="relative overflow-hidden rounded-[30px] border border-border/70 bg-card/95 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.35)]">
          <div className="pointer-events-none absolute -left-20 -top-24 h-52 w-52 rounded-full bg-accent/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.09),transparent_42%)]" />

          <div className="relative p-5 md:p-6">
            <div className="relative flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/90">
                  {todayLabel}
                </p>

                <h1 className="mt-2 text-[34px] font-semibold leading-[1.02] tracking-[-0.05em] text-foreground sm:text-[38px]">
                  {greeting.text},
                  <br />
                  {firstName}
                </h1>

                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/55 px-3 py-1.5 backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  <span className="text-xs font-medium text-muted-foreground">You are building momentum today</span>
                </div>
              </div>

              {greeting.icon && (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/65 text-muted-foreground shadow-sm backdrop-blur">
                  {greeting.icon}
                </div>
              )}
            </div>

            <div className="relative mt-5 rounded-[24px] border border-border/60 bg-background/45 p-4 shadow-sm backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-accent/12 text-accent">
                  <MessageSquare size={16} />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">Coach message</p>
                    <span className="rounded-full border border-border/70 bg-background/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Latest
                    </span>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-foreground/85">{coachMessage}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="px-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Today</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">Next actions</h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {todayActions.map(action => {
              const Icon = action.icon;

              return (
                <article
                  key={action.href}
                  className="group rounded-[24px] border border-border/70 bg-card/95 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-muted/75 text-muted-foreground transition-colors group-hover:bg-accent/15 group-hover:text-accent">
                      <Icon size={16} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-foreground">{action.title}</h3>
                        <span className="rounded-full border border-border/70 bg-background px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                          {action.badge}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>

                      <div className="mt-3">
                        <Button asChild size="sm" className="h-8 rounded-xl px-3 text-xs transition-transform group-hover:translate-x-0.5">
                          <Link href={action.href} className="inline-flex items-center gap-1.5">
                            <span>{action.cta}</span>
                            <ArrowRight size={13} />
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