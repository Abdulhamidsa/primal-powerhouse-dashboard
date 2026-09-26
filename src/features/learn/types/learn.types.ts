export type HandbookChapterId = 'foundation' | 'train' | 'fuel' | 'recover' | 'track' | 'adapt';

export type HandbookPageVariant =
  | 'contents'
  | 'chapter'
  | 'article'
  | 'principle'
  | 'diagram'
  | 'stat'
  | 'checklist'
  | 'photo'
  | 'timeline'
  | 'chart'
  | 'comparison'
  | 'case-study'
  | 'reflection'
  | 'transition';

export type HandbookMedia = {
  src: string;
  alt: string;
  caption?: string;
  date?: string;
  weight?: string;
};

export type HandbookChart = {
  label: string;
  points: Array<{ label: string; value: number }>;
  annotations?: Array<{ label: string; pointIndex: number }>;
};

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
  media?: HandbookMedia;
  mediaItems?: HandbookMedia[];
  chart?: HandbookChart;
  callouts?: string[];
};

export type HandbookChapter = {
  id: HandbookChapterId;
  number: string;
  label: string;
  firstPageId: string;
};

export type FaqEntry = {
  id: string;
  question: string;
  answer: string;
};
