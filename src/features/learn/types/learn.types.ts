import type { LucideIcon } from 'lucide-react';

export type HandbookChapterId = 'foundation' | 'train' | 'fuel' | 'recover' | 'track' | 'adapt';

export type HandbookPageVariant = 'contents' | 'chapter' | 'article' | 'principle' | 'diagram' | 'stat' | 'checklist';

export type HandbookPage = {
  id: string;
  chapter: HandbookChapterId | 'contents';
  chapterNumber?: string;
  chapterLabel: string;
  variant: HandbookPageVariant;
  eyebrow?: string;
  title: string;
  deck?: string;
  body?: string[];
  quote?: string;
  stat?: string;
  statLabel?: string;
  items?: Array<{ title: string; detail: string }>;
  note?: string;
};

export type HandbookChapter = {
  id: HandbookChapterId;
  number: string;
  label: string;
  firstPageId: string;
};

export type MethodStage = {
  id: HandbookChapterId;
  number: string;
  label: string;
  statement: string;
  detail: string;
  concepts: string[];
  icon: LucideIcon;
};

export type FaqEntry = {
  id: string;
  question: string;
  answer: string;
  handbookPageId?: string;
  handbookLabel?: string;
};
