'use client';

import { useMotivationNotification } from '@/hooks/useMotivationNotification';
import { useUserData } from '@/hooks/useUserData';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Flame, MessageSquare, Moon, Sun, Utensils } from 'lucide-react';
import { SkeletonDashboard } from '@/components/Skeletons';
import { useDailyCheckInInsights, useDailyCheckInToday } from '@/features/daily-checkin/hooks/useDailyCheckIn';
import { useWeeklyCheckInCurrentWeek } from '@/features/weekly-checkin/hooks/useWeeklyCheckIn';
import { useMealAdherenceToday } from '@/features/adherence/hooks/useMealAdherence';
import { useChatUnread } from '@/features/client-coach-messaging/hooks/useChatUnread';
import { TodayMissionCard, useTodayMission } from '@/features/today-mission';

export default function UserDashboardPage() {
  const { user, error, isLoading } = useUserData();
  const [greeting, setGreeting] = useState({ text: '', icon: null as React.ReactNode });

  const { entry: dailyEntry } = useDailyCheckInToday();
  const { summary: insightsSummary } = useDailyCheckInInsights();
  const { status: weeklyStatus } = useWeeklyCheckInCurrentWeek();
  const { summary: adherenceSummary } = useMealAdherenceToday();
  const { unreadTotal } = useChatUnread();
  const { summary: todayMission, isLoading: todayMissionLoading, error: todayMissionError } = useTodayMission();

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

  const coachMessage = user?.motivationalMessage || 'No coach message yet. Check back after your next review.';
  const streakCount = insightsSummary?.streakCount ?? 0;

  const isDailyDone = dailyEntry?.isComplete === true;
  const completedMeals = adherenceSummary?.completion.completedCount ?? 0;
  const totalMeals = adherenceSummary?.completion.totalSelectedCount ?? 0;
  const isMealsDone = totalMeals > 0 && completedMeals === totalMeals;

  const todayActions = [
    {
      key: 'daily',
      title: 'Daily Check-In',
      description: isDailyDone ? 'Done' : 'Due',
      href: '/user/check-ins',
      icon: isDailyDone ? CheckCircle2 : ClipboardCheck,
      iconBg: isDailyDone ? 'bg-[var(--color-success-muted)]' : 'bg-[var(--color-warning-muted)]',
      iconColor: isDailyDone ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]',
      badge: isDailyDone ? 'Done' : 'Due',
      badgeClass: isDailyDone
        ? 'text-[var(--color-success)] bg-[var(--color-success-muted)]'
        : 'text-[var(--color-warning)] bg-[var(--color-warning-muted)]',
      done: isDailyDone,
    },
    {
      key: 'weekly',
      title: 'Weekly Check-In',
      description: weeklyStatus === 'completed' ? 'Done' : weeklyStatus === 'overdue' ? 'Overdue' : 'Due',
      href: '/user/check-ins',
      icon: weeklyStatus === 'completed' ? CheckCircle2 : ClipboardCheck,
      iconBg:
        weeklyStatus === 'completed'
          ? 'bg-[var(--color-success-muted)]'
          : weeklyStatus === 'overdue'
            ? 'bg-[var(--color-danger-muted)]'
            : 'bg-[var(--color-warning-muted)]',
      iconColor:
        weeklyStatus === 'completed'
          ? 'text-[var(--color-success)]'
          : weeklyStatus === 'overdue'
            ? 'text-[var(--color-danger)]'
            : 'text-[var(--color-warning)]',
      badge: weeklyStatus === 'completed' ? 'Done' : weeklyStatus === 'overdue' ? 'Overdue' : 'Due',
      badgeClass:
        weeklyStatus === 'completed'
          ? 'text-[var(--color-success)] bg-[var(--color-success-muted)]'
          : weeklyStatus === 'overdue'
            ? 'text-[var(--color-danger)] bg-[var(--color-danger-muted)]'
            : 'text-[var(--color-warning)] bg-[var(--color-warning-muted)]',
      done: weeklyStatus === 'completed',
    },
    {
      key: 'meals',
      title: "Today's Meals",
      description: totalMeals > 0 ? `${completedMeals}/${totalMeals}` : 'None',
      href: '/user/my-plan',
      icon: isMealsDone ? CheckCircle2 : Utensils,
      iconBg: isMealsDone ? 'bg-[var(--color-success-muted)]' : 'bg-[var(--color-warning-muted)]',
      iconColor: isMealsDone ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]',
      badge: totalMeals > 0 ? `${completedMeals}/${totalMeals}` : '—',
      badgeClass: isMealsDone
        ? 'text-[var(--color-success)] bg-[var(--color-success-muted)]'
        : 'text-[var(--color-warning)] bg-[var(--color-warning-muted)]',
      done: isMealsDone,
    },
    {
      key: 'chat',
      title: 'Message Coach',
      description: unreadTotal > 0 ? `${unreadTotal} new` : 'Open',
      href: '/user/chat',
      icon: MessageSquare,
      iconBg: unreadTotal > 0 ? 'bg-[var(--color-accent-translucent)]' : 'bg-[var(--color-bg-alt)]',
      iconColor: unreadTotal > 0 ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]',
      badge: unreadTotal > 0 ? `${unreadTotal} new` : null,
      badgeClass: 'text-[var(--color-accent)] bg-[var(--color-accent-translucent)]',
      done: false,
    },
  ];

  const primaryActions = todayActions.slice(0, 4);

  return (
    <div className="px-4 pb-6 md:px-5">
      <div className="mx-auto w-full max-w-xl space-y-5">
        {/* Full-bleed gradient greeting header */}
        <section
          className="-mx-4 px-4 pt-5 pb-6"
          style={{
            background: 'radial-gradient(ellipse 150% 110% at 50% 0%, var(--color-accent-muted) 0%, transparent 72%)',
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                {todayLabel}
              </p>

              <h1 className="mt-2 text-[30px] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--color-text)] sm:text-[34px]">
                {greeting.text},
                <br />
                {firstName}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {streakCount > 0 && (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent-translucent)] px-2.5 py-1">
                    <Flame size={12} className="text-[var(--color-accent)]" />
                    <span className="text-[11px] font-semibold text-[var(--color-accent)]">
                      {streakCount} day streak
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-3 max-w-[42ch] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/75 px-3 py-2.5 backdrop-blur-[2px]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Coach</p>
                <p className="mt-1 text-[12px] leading-5 text-[var(--color-text)]">{coachMessage}</p>
              </div>
            </div>

            {greeting.icon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] text-[var(--color-text-muted)]">
                {greeting.icon}
              </div>
            )}
          </div>
        </section>

        <section>
          <TodayMissionCard
            summary={todayMission}
            isLoading={todayMissionLoading}
            errorMessage={todayMissionError?.message ?? null}
          />
        </section>

        <section className="space-y-3">
          <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max gap-2">
              {primaryActions.map(action => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.key}
                    href={action.href}
                    className="group min-w-[116px] rounded-[26px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition-transform duration-150 active:scale-[0.98]"
                    title={`${action.title} ${action.description}`}
                  >
                    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${action.iconBg}`}>
                      <Icon size={17} className={action.iconColor} />
                    </div>

                    <p className="mt-3 text-[12px] font-semibold leading-4 text-[var(--color-text)]">{action.title}</p>
                    <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">
                      {action.badge ?? action.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// export default function UserDashboardPage() {
//   const { user, error, isLoading } = useUserData();
//   const [greeting, setGreeting] = useState({ text: '', icon: null as React.ReactNode });

//   useMotivationNotification(user?.motivationalMessage);

//   useEffect(() => {
//     const denmarkTime = new Date().toLocaleString('en-US', { timeZone: 'Europe/Copenhagen' });
//     const hour = new Date(denmarkTime).getHours();

//     if (hour >= 5 && hour < 12) {
//       setGreeting({ text: 'Good Morning', icon: <Sun size={18} /> });
//     } else if (hour >= 12 && hour < 18) {
//       setGreeting({ text: 'Good Afternoon', icon: <Sun size={18} /> });
//     } else {
//       setGreeting({ text: 'Good Evening', icon: <Moon size={18} /> });
//     }
//   }, []);

//   if (isLoading) {
//     return <SkeletonDashboard />;
//   }

//   if (error) {
//     return (
//       <div className="px-4 py-6">
//         <div className="rounded-[28px] border border-destructive/20 bg-destructive/5 p-5">
//           <p className="text-sm font-semibold text-destructive">Error loading dashboard</p>
//           <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
//         </div>
//       </div>
//     );
//   }

//   const firstName = user?.name?.split(' ')[0] || 'Member';
//   const todayLabel = new Date().toLocaleDateString(undefined, {
//     weekday: 'long',
//     month: 'short',
//     day: 'numeric',
//   });

//   const coachMessage = user?.motivationalMessage || 'No coach message yet. Check back after your next review.';

//   const todayActions = [
//     {
//       title: 'Complete check-ins',
//       description: 'Log your daily and weekly update.',
//       href: '/user/check-ins',
//       icon: ClipboardCheck,
//       cta: 'Open',
//       badge: 'Due',
//     },
//     {
//       title: 'Message your coach',
//       description: 'Share progress or ask for an adjustment.',
//       href: '/user/chat',
//       icon: MessageSquare,
//       cta: 'Open',
//       badge: 'New',
//     },
//     {
//       title: "Review today's meals",
//       description: 'See your current meal plan.',
//       href: '/user/program?tab=meals',
//       icon: Utensils,
//       cta: 'Open',
//       badge: 'Plan',
//     },
//     {
//       title: 'Start training block',
//       description: 'Open your next planned workout.',
//       href: '/user/program?tab=training',
//       icon: Flame,
//       cta: 'Open',
//       badge: 'Today',
//     },
//   ] as const;

//   const iosCardClass =
//     'rounded-[20px] border border-white/10 bg-card/85 shadow-[0_8px_24px_-14px_rgba(0,0,0,0.55)] backdrop-blur-xl';

//   return (
//     <div className="px-4 pb-6 pt-3 md:px-5">
//       <div className="mx-auto w-full max-w-xl space-y-4">
//         <section className={`${iosCardClass} overflow-hidden`}>
//           <div className="p-4 md:p-5">
//             <div className="flex items-start justify-between gap-4">
//               <div className="min-w-0">
//                 <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
//                   {todayLabel}
//                 </p>

//                 <h1 className="mt-2 text-[30px] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[34px]">
//                   {greeting.text},
//                   <br />
//                   {firstName}
//                 </h1>

//                 <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-background/55 px-2.5 py-1">
//                   <span className="h-2 w-2 rounded-full bg-accent" />
//                   <span className="text-[11px] font-medium text-muted-foreground">Momentum is steady today</span>
//                 </div>
//               </div>

//               {greeting.icon && (
//                 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-background/65 text-muted-foreground">
//                   {greeting.icon}
//                 </div>
//               )}
//             </div>

//             <div className="mt-4 rounded-2xl border border-white/10 bg-background/45 p-3.5">
//               <div className="flex items-start gap-3">
//                 <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
//                   <MessageSquare size={16} />
//                 </div>

//                 <div className="min-w-0">
//                   <div className="flex items-center gap-2">
//                     <p className="text-sm font-semibold text-foreground">Coach message</p>
//                     <span className="rounded-full border border-white/10 bg-background/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
//                       Latest
//                     </span>
//                   </div>

//                   <p className="mt-1.5 text-[13px] leading-5 text-foreground/85">{coachMessage}</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>

//         <section className="space-y-2.5">
//           <div className="px-1">
//             <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Today</p>
//             <h2 className="mt-1 text-[17px] font-semibold tracking-tight text-foreground">Needs attention</h2>
//           </div>

//           <div className="grid grid-cols-1 gap-3">
//             {todayActions.map(action => {
//               const Icon = action.icon;

//               return (
//                 <article
//                   key={action.href}
//                   className={`${iosCardClass} group p-3.5 transition-transform duration-150 active:scale-[0.99]`}
//                 >
//                   <div className="flex items-start gap-3">
//                     <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted/75 text-muted-foreground">
//                       <Icon size={16} />
//                     </div>

//                     <div className="min-w-0 flex-1">
//                       <div className="flex items-center justify-between gap-3">
//                         <h3 className="text-sm font-semibold text-foreground">{action.title}</h3>
//                         <span className="rounded-full border border-white/10 bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
//                           {action.badge}
//                         </span>
//                       </div>
//                       <p className="mt-1 text-[13px] text-muted-foreground">{action.description}</p>

//                       <div className="mt-2.5">
//                         <Button asChild size="sm" className="h-7 rounded-lg px-2.5 text-[11px]">
//                           <Link href={action.href} className="inline-flex items-center gap-1.5">
//                             <span>{action.cta}</span>
//                             <ArrowRight size={12} />
//                           </Link>
//                         </Button>
//                       </div>
//                     </div>
//                   </div>
//                 </article>
//               );
//             })}
//           </div>
//         </section>
//       </div>
//     </div>
//   );
// }
