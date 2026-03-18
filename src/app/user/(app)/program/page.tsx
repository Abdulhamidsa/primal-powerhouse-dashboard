'use client';

import Link from 'next/link';
import { Flame, Utensils } from 'lucide-react';

const PROGRAM_MEAL_CARDS = [
  {
    key: 'breakfast',
    title: 'Breakfast',
    href: '/user/program/breakfast',
    image:
      'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=1400&q=80',
  },
  {
    key: 'lunch',
    title: 'Lunch',
    href: '/user/program/lunch',
    image:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1400&q=80',
  },
  {
    key: 'dinner',
    title: 'Dinner',
    href: '/user/program/dinner',
    image:
      'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=1400&q=80',
  },
  {
    key: 'snack',
    title: 'Snacks',
    href: '/user/program/snack',
    image:
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1400&q=80',
  },
] as const;

export default function UserProgramPage() {
  return (
    <div className="px-4 pb-8 pt-4 md:px-5">
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <section className="relative overflow-hidden rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div
            className="pointer-events-none absolute -left-12 -top-12 h-36 w-36 rounded-full blur-3xl"
            style={{ background: 'var(--color-accent-translucent)' }}
          />

          <div className="relative flex items-start gap-3">
            <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent-translucent)] text-[var(--color-accent)]">
              <Utensils size={18} />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">Program</h1>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Pick a meal type to view options and assign your meals.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {PROGRAM_MEAL_CARDS.map(card => (
            <Link
              key={card.key}
              href={card.href}
              className="group relative overflow-hidden rounded-3xl border border-[var(--color-border)] transition-colors hover:border-[var(--color-accent-muted)]"
            >
              <div
                className="h-44 w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.02]"
                style={{ backgroundImage: `url(${card.image})` }}
              />
              <div className="absolute inset-0 bg-black/35" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="rounded-full border border-white/50 bg-black/35 px-5 py-2 text-base font-semibold text-white backdrop-blur-sm">
                  {card.title}
                </span>
              </div>
            </Link>
          ))}

          <Link
            href="/user/training"
            className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-accent-muted)]"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-accent-translucent)] text-[var(--color-accent)]">
              <Flame size={16} />
            </div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Training</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">Browse your training assignments.</p>
          </Link>
        </section>
      </div>
    </div>
  );
}