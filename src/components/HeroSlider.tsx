import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import type { ImageAsset } from '@/types';
import type { Slide } from '@/services/content';
import { Img } from './Img';
import { cx } from '@/lib/format';

interface Props {
  slides: Slide[];
  /** Shown on its own when there are no slides (the section's main image). */
  fallback: ImageAsset;
  /** Time each slide stays up, in milliseconds. */
  interval?: number;
  /** The first image is the largest thing on the homepage, so it loads first. */
  priority?: boolean;
  label?: string;
}

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * The homepage image slider. One image at a time, shown whole (never cropped or
 * stretched) inside a fixed frame so the page does not jump between slides.
 * Changes every few seconds with a cross-fade; pauses while the pointer or
 * keyboard focus is on it, while the tab is hidden, and when the visitor presses
 * Pause. With "reduce motion" switched on it does not move by itself.
 */
export function HeroSlider({ slides, fallback, interval = 4500, priority = false, label = 'Featured images' }: Props) {
  const list: Slide[] = slides.length ? slides : [{ id: 'main', image: fallback, title: '', description: '' }];
  const n = list.length;
  // The frame takes the shape of the first image (kept between 5:4 and about 16:9), so the usual
  // wide photos fill it; any other shape is still shown whole, with soft space around it.
  const first = list[0].image;
  const ratio = Math.min(1.8, Math.max(1.25, first.width && first.height ? first.width / first.height : 4 / 3));
  const [index, setIndex] = useState(0);
  const [stopped, setStopped] = useState(prefersReducedMotion);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const current = Math.min(index, n - 1);
  const playing = n > 1 && !stopped && !hovered && !focused && !hidden;

  const go = useCallback((i: number) => setIndex(((i % n) + n) % n), [n]);

  // keep the position valid when slides are added or removed
  useEffect(() => {
    if (index > n - 1) setIndex(0);
  }, [index, n]);

  useEffect(() => {
    const onVis = () => setHidden(document.visibilityState === 'hidden');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => go(current + 1), interval);
    return () => window.clearTimeout(t);
  }, [playing, current, interval, go]);

  const onKey = (e: KeyboardEvent) => {
    if (n < 2) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(current + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(current - 1);
    }
  };
  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') start.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: PointerEvent) => {
    const s = start.current;
    start.current = null;
    if (!s || n < 2) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - s.y)) go(current + (dx < 0 ? 1 : -1));
  };
  const hasCaptions = list.some((s) => s.title || s.description);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      data-testid="hero-slider"
      onKeyDown={onKey}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      // pause for keyboard focus only: a mouse click on an arrow should not stop the slideshow
      onFocus={(e) => (e.target as HTMLElement).matches?.(':focus-visible') && setFocused(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setFocused(false)}
      className="w-full"
    >
      <div
        className="relative w-full touch-pan-y select-none overflow-hidden rounded-[24px] bg-gradient-to-br from-aqua-50 via-white to-mist ring-1 ring-white/80"
        style={{ aspectRatio: String(ratio) }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (start.current = null)}
      >
        <div aria-live={playing ? 'off' : 'polite'} className="absolute inset-0">
          {list.map((s, i) => {
            const active = i === current;
            return (
              <div
                key={s.id}
                role={n > 1 ? 'group' : undefined}
                aria-roledescription={n > 1 ? 'slide' : undefined}
                aria-label={n > 1 ? `${i + 1} of ${n}${s.title ? `: ${s.title}` : ''}` : undefined}
                aria-hidden={!active}
                data-active={active || undefined}
                data-testid="hero-slide"
                className={cx('absolute inset-0 p-1.5 transition-opacity duration-700 ease-out motion-reduce:transition-none', active ? 'opacity-100' : 'pointer-events-none opacity-0')}
              >
                <Img image={s.image} priority={priority && i === 0} draggable={false} sizes="(min-width: 1024px) 46vw, 92vw" className="h-full w-full rounded-[18px] object-contain" />
              </div>
            );
          })}
        </div>
        {n > 1 && (
          <>
            <button type="button" onClick={() => go(current - 1)} aria-label="Previous slide" className="glass absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-ink transition-colors hover:bg-white hover:text-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal">
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button type="button" onClick={() => go(current + 1)} aria-label="Next slide" className="glass absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-ink transition-colors hover:bg-white hover:text-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal">
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </>
        )}
      </div>

      {hasCaptions && (
        // every caption shares one grid cell, so the box is as tall as the longest and never jumps
        <div className="mt-4 grid px-2" data-testid="hero-caption">
          {list.map((s, i) => (
            <div key={s.id} aria-hidden={i !== current} className={cx('[grid-area:1/1] transition-opacity duration-500 motion-reduce:transition-none', i === current ? 'opacity-100' : 'pointer-events-none opacity-0')}>
              {s.title && <p className="font-semibold text-ink">{s.title}</p>}
              {s.description && <p className="mt-0.5 text-[15px] leading-relaxed text-slate">{s.description}</p>}
            </div>
          ))}
        </div>
      )}

      {n > 1 && (
        <div className="mt-3 flex items-center justify-center gap-3">
          <div className="flex items-center gap-1" role="group" aria-label="Choose a slide">
            {list.map((s, i) => (
              <button key={s.id} type="button" onClick={() => go(i)} aria-label={`Show slide ${i + 1} of ${n}`} aria-current={i === current ? 'true' : undefined} className="group flex h-8 w-8 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal">
                <span className={cx('block h-2.5 rounded-full transition-all motion-reduce:transition-none', i === current ? 'w-6 bg-teal' : 'w-2.5 bg-slate/35 group-hover:bg-slate/60')} />
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setStopped((v) => !v)} aria-label={stopped ? 'Play slideshow' : 'Pause slideshow'} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-ink ring-1 ring-ink/10 transition-colors hover:bg-white hover:text-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal">
            {stopped ? <Play className="h-3.5 w-3.5" aria-hidden /> : <Pause className="h-3.5 w-3.5" aria-hidden />}
          </button>
        </div>
      )}
    </section>
  );
}
