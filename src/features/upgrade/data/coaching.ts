import {
  ChartLineUpIcon as ChartNoAxesCombined,
  ClipboardTextIcon as ClipboardCheck,
  BarbellIcon as Dumbbell,
  ForkKnifeIcon as UtensilsCrossed,
} from '@phosphor-icons/react/ssr';
import type { CoachingDifference } from '@/features/upgrade/types/upgrade.types';

export const SELF_GUIDED_ITEMS = [
  'Starter training',
  'Starter nutrition',
  'Self check-ins',
  'General education',
  'You make adjustments',
];

export const COACHED_ITEMS = [
  'Training built for you',
  'Nutrition built for you',
  'Coach-reviewed check-ins',
  'Direct guidance',
  'Plan adjustments',
  'Progress reviews',
  'Accountability',
];

export const COACHING_DIFFERENCES: CoachingDifference[] = [
  {
    number: '01',
    eyebrow: 'Your training',
    title: 'Stops being generic.',
    copy: 'Exercise selection, volume, intensity, and progression are shaped around your body, schedule, equipment, and performance.',
    signal: 'Built around the athlete',
    icon: Dumbbell,
  },
  {
    number: '02',
    eyebrow: 'Your nutrition',
    title: 'Moves with your goal.',
    copy: 'Targets and meal structure respond to your progress, preferences, training demand, and the realities of your week.',
    signal: 'Adjusted with context',
    icon: UtensilsCrossed,
  },
  {
    number: '03',
    eyebrow: 'Your progress',
    title: 'Gets reviewed by someone.',
    copy: 'Check-ins become a conversation. The numbers, photos, performance, and adherence are interpreted together.',
    signal: 'Evidence gets reviewed',
    icon: ClipboardCheck,
  },
  {
    number: '04',
    eyebrow: 'Your plan',
    title: 'Changes before you get stuck.',
    copy: 'A coach identifies the smallest useful adjustment and keeps the system moving without rebuilding it on every difficult week.',
    signal: 'Adjust before guessing',
    icon: ChartNoAxesCombined,
  },
];
