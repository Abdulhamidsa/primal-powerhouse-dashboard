'use client';

import { ArrowDownIcon as ArrowDown, CheckIcon as Check, ArrowRightIcon as MoveRight } from '@phosphor-icons/react';
import { HANDBOOK_CHAPTERS } from '@/features/learn/data/handbook';
import type { HandbookPage as HandbookPageType } from '@/features/learn/types/learn.types';

type Props = { page: HandbookPageType; displayNumber: number; onNavigate: (pageId: string) => void };

function PublicationFrame({ page, displayNumber, children }: Props & { children: React.ReactNode }) {
  return (
    <article className="relative flex min-h-full flex-col overflow-hidden bg-[#0a0908] px-6 pb-10 pt-6 text-[#f4efe8] sm:px-10 sm:pb-12 sm:pt-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_8%,rgba(193,122,93,0.13),transparent_27%),linear-gradient(180deg,rgba(255,255,255,0.018),transparent_45%)]" />
      <header className="relative flex items-center justify-between border-b border-white/10 pb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-white/42"><span>Primal Power · Vol. 01</span><span>{page.chapterLabel}</span></header>
      <div className="relative flex flex-1 flex-col">{children}</div>
      <footer className="relative mt-8 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.2em] text-white/35"><span>The Primal Handbook</span><span>{String(displayNumber).padStart(2, '0')}</span></footer>
    </article>
  );
}

function ContentsSpread({ page, displayNumber, onNavigate }: Props) {
  return <PublicationFrame page={page} displayNumber={displayNumber} onNavigate={onNavigate}>
    <div className="pb-8 pt-10"><p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#c17a5d]">{page.eyebrow}</p><h2 className="mt-3 font-serif text-5xl leading-none tracking-[-0.055em] sm:text-6xl">{page.title}</h2><p className="mt-4 max-w-sm text-sm leading-6 text-white/60">{page.deck}</p></div>
    <div className="mt-auto border-y border-white/10">{HANDBOOK_CHAPTERS.map(chapter => <button key={chapter.id} type="button" onClick={() => onNavigate(chapter.firstPageId)} className="group flex min-h-14 w-full items-center gap-4 border-b border-white/10 text-left last:border-b-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c17a5d]"><span className="font-mono text-[10px] font-bold text-[#c17a5d]">{chapter.number}</span><span className="flex-1 text-sm font-bold uppercase tracking-[0.15em]">{chapter.label}</span><MoveRight size={16} className="text-white/45 transition-transform group-hover:translate-x-1 group-hover:text-[#c17a5d]" /></button>)}</div>
  </PublicationFrame>;
}

function ChapterSpread({ page, displayNumber, onNavigate }: Props) {
  return <PublicationFrame page={page} displayNumber={displayNumber} onNavigate={onNavigate}>
    <div className="relative flex flex-1 flex-col justify-between py-10"><span className="absolute -right-3 -top-3 font-serif text-[12rem] font-bold leading-none text-[#c17a5d]/10">{page.chapterNumber}</span><div className="relative"><p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#c17a5d]">Chapter {page.chapterNumber} · {page.eyebrow}</p><h2 className="mt-6 font-serif text-7xl leading-[0.82] tracking-[-0.08em] sm:text-8xl">{page.chapterLabel}</h2></div><div className="relative max-w-md"><ArrowDown size={23} className="mb-5 text-[#c17a5d]" /><h3 className="font-serif text-4xl leading-[0.98] tracking-[-0.05em] sm:text-5xl">{page.title}</h3><p className="mt-5 border-l border-[#c17a5d] pl-4 text-sm leading-6 text-white/64">{page.deck}</p></div></div>
  </PublicationFrame>;
}

function EditorialSpread({ page, displayNumber, onNavigate }: Props) {
  const structured = (page.variant === 'diagram' || page.variant === 'checklist') && page.items;
  return <PublicationFrame page={page} displayNumber={displayNumber} onNavigate={onNavigate}>
    <div className="flex flex-1 flex-col py-8"><div><p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#c17a5d]">{page.eyebrow}</p><h2 className="mt-3 max-w-[18ch] font-serif text-4xl leading-[0.98] tracking-[-0.055em] sm:text-5xl">{page.title}</h2></div>
      {page.variant === 'stat' ? <div className="my-auto py-9"><p className="font-serif text-[7rem] font-bold leading-[0.72] tracking-[-0.09em] text-[#c17a5d] sm:text-[9rem]">{page.stat}</p><p className="mt-5 max-w-[17rem] border-t border-white/15 pt-3 text-[10px] font-bold uppercase tracking-[0.17em] text-white/55">{page.statLabel}</p></div> : null}
      {page.variant === 'principle' ? <blockquote className="my-auto border-y border-white/15 py-8 font-serif text-4xl leading-[1] tracking-[-0.05em] text-[#dfb29f] sm:text-5xl">“{page.quote}”</blockquote> : null}
      {structured ? <div className="my-auto divide-y divide-white/10 border-y border-white/10 py-1">{page.items!.map((item, index) => <div key={item.title} className="flex gap-3 py-4"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#c17a5d]/60 text-[9px] font-bold text-[#c17a5d]">{page.variant === 'checklist' ? <Check size={12} /> : String(index + 1).padStart(2, '0')}</span><div><h3 className="text-xs font-bold uppercase tracking-[0.13em]">{item.title}</h3><p className="mt-1 text-[13px] leading-5 text-white/60">{item.detail}</p></div></div>)}</div> : null}
      {page.body ? <div className={`space-y-4 text-[15px] leading-7 text-white/70 ${page.variant === 'article' ? 'my-auto py-8' : 'mt-6'}`}>{page.body.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div> : null}
      {page.note ? <aside className="mt-auto border-l border-[#c17a5d] pl-4 pt-1 text-[12px] font-medium leading-5 text-white/55">{page.note}</aside> : null}
    </div>
  </PublicationFrame>;
}

export function HandbookPage(props: Props) {
  if (props.page.variant === 'contents') return <ContentsSpread {...props} />;
  if (props.page.variant === 'chapter') return <ChapterSpread {...props} />;
  return <EditorialSpread {...props} />;
}
