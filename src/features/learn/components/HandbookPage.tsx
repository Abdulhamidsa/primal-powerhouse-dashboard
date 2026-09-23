'use client';

import { ArrowDown, Check, MoveRight } from 'lucide-react';
import { HANDBOOK_CHAPTERS } from '@/features/learn/data/handbook';
import type { HandbookPage as HandbookPageType } from '@/features/learn/types/learn.types';
import styles from './learn.module.css';

type Props = {
  page: HandbookPageType;
  displayNumber: number;
  onNavigate: (pageId: string) => void;
};

function PageChrome({ page, displayNumber, children }: Props & { children: React.ReactNode }) {
  return (
    <article className={`${styles.paper} relative min-h-full overflow-hidden px-6 pb-14 pt-7 sm:px-10 sm:pb-16 sm:pt-9`}>
      <div className="relative z-10 flex min-h-full flex-col">
        <header className="flex items-center justify-between border-b border-[#30291f]/15 pb-3 text-[9px] font-bold uppercase tracking-[0.22em] text-[#6e6252]">
          <span>The Primal Handbook</span>
          <span>{page.chapterLabel}</span>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
        <footer className="absolute inset-x-0 bottom-[-2.1rem] flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.2em] text-[#756958]">
          <span>Primal Power · Vol. 01</span><span>{String(displayNumber).padStart(2, '0')}</span>
        </footer>
      </div>
    </article>
  );
}

export function HandbookPage({ page, displayNumber, onNavigate }: Props) {
  if (page.variant === 'contents') {
    return (
      <PageChrome page={page} displayNumber={displayNumber} onNavigate={onNavigate}>
        <div className="pb-5 pt-8 sm:pt-12">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#9b583e]">{page.eyebrow}</p>
          <h2 className="mt-3 font-serif text-5xl leading-none tracking-[-0.045em] text-[#201d19] sm:text-6xl">{page.title}</h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-[#675c4e]">{page.deck}</p>
        </div>
        <div className="mt-auto divide-y divide-[#30291f]/15 border-y border-[#30291f]/20">
          {HANDBOOK_CHAPTERS.map(chapter => (
            <button key={chapter.id} type="button" onClick={() => onNavigate(chapter.firstPageId)} className="group flex min-h-12 w-full items-center gap-4 py-3 text-left transition-colors hover:text-[#9b583e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9b583e]">
              <span className="font-mono text-[10px] font-bold text-[#9b583e]">{chapter.number}</span>
              <span className="flex-1 text-sm font-bold uppercase tracking-[0.16em]">{chapter.label}</span>
              <MoveRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          ))}
        </div>
      </PageChrome>
    );
  }

  if (page.variant === 'chapter') {
    return (
      <PageChrome page={page} displayNumber={displayNumber} onNavigate={onNavigate}>
        <div className="relative flex flex-1 flex-col justify-between py-8 sm:py-12">
          <div className="absolute right-[-1rem] top-0 font-serif text-[11rem] font-black leading-none text-[#9b583e]/[0.08] sm:text-[15rem]">{page.chapterNumber}</div>
          <div className="relative">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#9b583e]">Chapter {page.chapterNumber} · {page.eyebrow}</p>
            <p className="mt-5 font-serif text-7xl leading-none tracking-[-0.07em] text-[#2a251f] sm:text-8xl">{page.chapterLabel}</p>
          </div>
          <div className="relative max-w-lg">
            <ArrowDown size={24} className="mb-5 text-[#9b583e]" />
            <h2 className="font-serif text-4xl leading-[0.98] tracking-[-0.045em] sm:text-5xl">{page.title}</h2>
            <p className="mt-5 max-w-md border-l-2 border-[#9b583e] pl-4 text-sm leading-6 text-[#675c4e]">{page.deck}</p>
          </div>
        </div>
      </PageChrome>
    );
  }

  return (
    <PageChrome page={page} displayNumber={displayNumber} onNavigate={onNavigate}>
      <div className="flex flex-1 flex-col py-7 sm:py-10">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#9b583e]">{page.eyebrow}</p>
          <h2 className="mt-3 max-w-[18ch] font-serif text-3xl leading-[1.02] tracking-[-0.04em] sm:text-5xl">{page.title}</h2>
        </div>

        {page.variant === 'stat' ? (
          <div className="my-auto py-7">
            <p className="font-serif text-[6.8rem] font-bold leading-[0.75] tracking-[-0.08em] text-[#9b583e] sm:text-[9rem]">{page.stat}</p>
            <p className="mt-4 max-w-[18rem] border-t border-[#30291f]/20 pt-3 text-xs font-bold uppercase tracking-[0.18em] text-[#675c4e]">{page.statLabel}</p>
          </div>
        ) : null}

        {page.variant === 'principle' ? (
          <blockquote className="my-auto border-y border-[#30291f]/20 py-7 font-serif text-4xl leading-[1.02] tracking-[-0.04em] text-[#9b583e] sm:text-5xl">“{page.quote}”</blockquote>
        ) : null}

        {(page.variant === 'diagram' || page.variant === 'checklist') && page.items ? (
          <div className={`my-auto grid gap-2 py-5 ${page.variant === 'diagram' ? 'sm:grid-cols-2' : ''}`}>
            {page.items.map((item, index) => (
              <div key={item.title} className="flex gap-3 border border-[#30291f]/15 bg-[#f8f2e7]/55 p-3.5">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#9b583e]/45 text-[9px] font-bold text-[#9b583e]">
                  {page.variant === 'checklist' ? <Check size={12} strokeWidth={2.5} /> : String(index + 1).padStart(2, '0')}
                </span>
                <div><h3 className="text-xs font-extrabold uppercase tracking-[0.12em]">{item.title}</h3><p className="mt-1 text-[12px] leading-5 text-[#675c4e]">{item.detail}</p></div>
              </div>
            ))}
          </div>
        ) : null}

        {page.body ? (
          <div className={`space-y-3 text-[13px] leading-6 text-[#51483d] ${page.variant === 'article' ? 'my-auto py-7 sm:columns-2 sm:gap-8' : 'mt-5'}`}>
            {page.body.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          </div>
        ) : null}

        {page.note ? <aside className="mt-auto border-l-2 border-[#9b583e] bg-[#9b583e]/[0.07] px-4 py-3 text-[11px] font-semibold leading-5 text-[#5d5041]">{page.note}</aside> : null}
      </div>
    </PageChrome>
  );
}
