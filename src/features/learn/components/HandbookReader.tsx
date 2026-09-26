'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { BookOpenText, ChevronLeft, ChevronRight, List, X } from 'lucide-react';
import { HANDBOOK_PAGES } from '@/features/learn/data/handbook';
import { getHandbookProgress } from '@/features/learn/lib/handbook';
import { HandbookPage } from '@/features/learn/components/HandbookPage';

type Props = {
  isOpen: boolean;
  pageIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onNavigate: (pageId: string) => void;
};

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function HandbookReader({ isOpen, pageIndex, onClose, onNext, onPrevious, onNavigate }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const previousIndexRef = useRef(pageIndex);
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();
  const page = HANDBOOK_PAGES[pageIndex];
  const direction = pageIndex >= previousIndexRef.current ? 1 : -1;
  const progress = getHandbookProgress(pageIndex);

  useEffect(() => setMounted(true), []);
  useEffect(() => { previousIndexRef.current = pageIndex; }, [pageIndex]);

  useEffect(() => {
    if (!isOpen) return;
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const appScroller = document.querySelector<HTMLElement>('[data-app-scroll-main]');
    const previousOverflow = appScroller?.style.overflow ?? '';
    if (appScroller) appScroller.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => dialogRef.current?.focus(), 0);

    return () => {
      window.clearTimeout(focusTimer);
      if (appScroller) appScroller.style.overflow = previousOverflow;
      returnFocusRef.current?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
      if (event.key === 'ArrowRight') { event.preventDefault(); onNext(); return; }
      if (event.key === 'ArrowLeft') { event.preventDefault(); onPrevious(); return; }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!focusable.length) { event.preventDefault(); dialogRef.current.focus(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNext, onPrevious]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="The Primal Handbook reader"
          tabIndex={-1}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
          transition={{ duration: reduceMotion ? 0.1 : 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#090806] text-white"
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_5%,rgba(193,122,93,0.12),transparent_30%),#070706]" />
          <header className="relative z-20 flex min-h-14 items-center gap-3 border-b border-white/10 px-4 sm:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <BookOpenText size={18} className="shrink-0 text-[#c17a5d]" />
              <div className="min-w-0"><p className="truncate text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">Chapter {page.chapterNumber ?? '—'}</p><p className="truncate text-sm font-semibold">{page.chapterLabel}</p></div>
            </div>
            <button type="button" onClick={() => onNavigate('contents')} aria-label="Open table of contents" className="grid h-11 w-11 place-items-center rounded-full border border-white/10 text-white/65 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c17a5d]"><List size={18} /></button>
            <button type="button" onClick={onClose} aria-label="Close handbook" className="grid h-11 w-11 place-items-center rounded-full border border-white/10 text-white/65 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c17a5d]"><X size={18} /></button>
          </header>

          <div
            className="relative z-10 flex min-h-0 flex-1 overflow-hidden"
            onTouchStart={event => { const touch = event.touches[0]; touchStartRef.current = { x: touch.clientX, y: touch.clientY }; }}
            onTouchEnd={event => {
              const start = touchStartRef.current;
              const touch = event.changedTouches[0];
              touchStartRef.current = null;
              if (!start) return;
              const dx = touch.clientX - start.x;
              const dy = touch.clientY - start.y;
              if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
              if (dx < 0) onNext(); else onPrevious();
            }}
          >
            <div className="relative h-full w-full max-w-[780px]">
              <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                  key={page.id}
                  custom={direction}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction * 42, rotateY: direction * -3 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction * -42, rotateY: direction * 3 }}
                  transition={{ duration: reduceMotion ? 0.08 : 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 overflow-y-auto"
                >
                  <HandbookPage page={page} displayNumber={pageIndex + 1} onNavigate={onNavigate} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <footer className="relative z-20 border-t border-white/10 px-4 pb-2 pt-2 sm:px-6">
            <div className="mx-auto flex max-w-[780px] items-center gap-3">
              <button type="button" onClick={onPrevious} disabled={pageIndex === 0} aria-label="Previous page" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 text-white/70 transition-colors enabled:hover:text-white disabled:opacity-25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c17a5d]"><ChevronLeft size={20} /></button>
              <div className="min-w-0 flex-1">
                <div className="h-px overflow-hidden bg-white/15"><div className="h-full bg-[#c17a5d] transition-[width] duration-300" style={{ width: `${progress}%` }} /></div>
                <div className="mt-2 flex justify-between text-[9px] font-bold uppercase tracking-[0.18em] text-white/40"><span>{progress}% read</span><span>{pageIndex + 1} / {HANDBOOK_PAGES.length}</span></div>
              </div>
              <button type="button" onClick={onNext} disabled={pageIndex === HANDBOOK_PAGES.length - 1} aria-label="Next page" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 text-white/70 transition-colors enabled:hover:text-white disabled:opacity-25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c17a5d]"><ChevronRight size={20} /></button>
            </div>
          </footer>
          <p className="sr-only" aria-live="polite">Page {pageIndex + 1} of {HANDBOOK_PAGES.length}: {page.title}</p>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
