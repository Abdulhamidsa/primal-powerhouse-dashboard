'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';

const PROGRAM_MEAL_CARDS = [
  {
    key: 'breakfast',
    title: 'Breakfast',
    href: '/user/program/breakfast',
    image: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=1400&q=80',
  },
  {
    key: 'lunch',
    title: 'Lunch',
    href: '/user/program/lunch',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1400&q=80',
  },
  {
    key: 'dinner',
    title: 'Dinner',
    href: '/user/program/dinner',
    image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=1400&q=80',
  },
  {
    key: 'snack',
    title: 'Snacks',
    href: '/user/program/snack',
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1400&q=80',
  },
  {
    key: 'sides',
    title: 'Sides',
    href: '/user/program/sides',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=80',
  },
] as const;

const TRAINING_CARDS = [
  {
    key: 'assigned',
    title: 'Assigned Workouts',
    href: '/user/training',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1400&q=80',
  },
  {
    key: 'videos',
    title: 'Exercise Videos',
    href: '/user/training/videos',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1400&q=80',
  },
  {
    key: 'mobility',
    title: 'Mobility',
    href: '/user/training/mobility',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1400&q=80',
  },
  {
    key: 'recovery',
    title: 'Recovery',
    href: '/user/training/recovery',
    image: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=1400&q=80',
  },
] as const;

type ProgramTab = 'meals' | 'training';

export default function UserProgramPage() {
  const [activeTab, setActiveTab] = useState<ProgramTab>('meals');

  const cards = activeTab === 'meals' ? PROGRAM_MEAL_CARDS : TRAINING_CARDS;

  return (
    <div className="px-4 pb-8 md:px-5">
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <PageHeader
          title="Program"
          description={
            activeTab === 'meals'
              ? 'Pick a meal type to view options and assign your meals.'
              : 'Browse your training sections and video-based workouts.'
          }
        />

        {/* Tabs */}
        <div className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('meals')}
              className={`rounded-[18px] px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'meals'
                  ? 'bg-[var(--color-bg-alt)] text-[var(--color-text)]'
                  : 'text-[var(--color-text-muted)]'
              }`}
            >
              Meals
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('training')}
              className={`rounded-[18px] px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'training'
                  ? 'bg-[var(--color-bg-alt)] text-[var(--color-text)]'
                  : 'text-[var(--color-text-muted)]'
              }`}
            >
              Training
            </button>
          </div>
        </div>

        {/* Grid */}
        <section className="grid gap-3 sm:grid-cols-2">
          {cards.map(card => (
            <Link
              key={card.key}
              href={card.href}
              className="group relative overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)]"
            >
              <div
                className="h-40 w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.02] sm:h-44"
                style={{ backgroundImage: `url(${card.image})` }}
              />

              <div className="absolute inset-0 bg-black/35 transition-colors duration-300 group-hover:bg-black/40" />

              <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
                <span className="rounded-full border border-white/20 bg-black/35 px-5 py-2 text-sm font-semibold text-white backdrop-blur-sm sm:text-base">
                  {card.title}
                </span>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
