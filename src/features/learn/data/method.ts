import { Dumbbell, Fuel, MoonStar, RefreshCw, ScanLine } from 'lucide-react';
import type { MethodStage } from '@/features/learn/types/learn.types';

export const METHOD_STAGES: MethodStage[] = [
  {
    id: 'train', number: '01', label: 'Train', icon: Dumbbell,
    statement: 'Create a signal worth adapting to.',
    detail: 'Progressive, technically sound training gives the body a clear reason to become stronger.',
    concepts: ['Stimulus', 'Progression', 'Technique', 'Performance'],
  },
  {
    id: 'fuel', number: '02', label: 'Fuel', icon: Fuel,
    statement: 'Supply the work and the rebuild.',
    detail: 'Energy and nutrients support output in the session and repair after it.',
    concepts: ['Calories', 'Protein', 'Carbs', 'Hydration'],
  },
  {
    id: 'recover', number: '03', label: 'Recover', icon: MoonStar,
    statement: 'Make space for adaptation.',
    detail: 'Sleep, lower stress, and planned rest turn training stress into usable progress.',
    concepts: ['Sleep', 'Fatigue', 'Rest', 'Stress'],
  },
  {
    id: 'track', number: '04', label: 'Track', icon: ScanLine,
    statement: 'Replace assumptions with evidence.',
    detail: 'Consistent observations reveal whether the plan is creating the result it promised.',
    concepts: ['Weight', 'Photos', 'Measurements', 'Performance', 'Adherence'],
  },
  {
    id: 'adapt', number: '05', label: 'Adapt', icon: RefreshCw,
    statement: 'Change the plan before you get stuck.',
    detail: 'Review the evidence, adjust the smallest useful lever, and begin the loop again.',
    concepts: ['Review', 'Adjust', 'Progress', 'Repeat'],
  },
];
