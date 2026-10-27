import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowUp, ExternalLink, ImagePlus, Images, Loader2, Pencil, RefreshCcw, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TextArea, TextField, buttonClass } from '@/components/ui';
import { HeroSlider } from '@/components/HeroSlider';
import { HERO } from '@/data/img';
import { cx } from '@/lib/format';
import { MAX_SLIDES, buildSlides } from '@/services/content';
import type { ImageAsset } from '@/types';
import { useAdminMeta } from '../components';
import { Card, ConfirmDialog, LoadError, PageHeader, Toggle, dbError, useToast } from '../ui';
import { IMAGE_TYPES, checkImage, imageSize, pathFromPublicUrl, publicUrl, removeFiles, storagePathFor, uploadWithProgress } from '../storage';

/** A slide as stored in the "items" list of the home.hero section. Unknown keys are kept when saving. */
export interface RawSlide {
  id: string; image_url: string; image_small_url: string | null; image_alt: string; image_width: number | null; image_height: number | null;
  title: string; description: string; enabled: boolean; [extra: string]: unknown;
}
interface Hero { id: string; updated_at: string; image_url: string | null; image_small_url: string | null; image_alt: string }

const newId = () => (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`).slice(0, 36);
const toRaw = (items: unknown): RawSlide[] =>
  (Array.isArray(items) ? items : [])
    .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === 'object' && typeof (x as Record<string, unknown>).image_url === 'string')
    .map((x) => ({
      ...x,
      id: typeof x.id === 'string' && x.id ? x.id : newId(),
      image_url: x.image_url as string,
      image_small_url: typeof x.image_small_url === 'string' ? x.image_small_url : null,
      image_alt: typeof x.image_alt === 'string' ? x.image_alt : '',
      image_width: typeof x.image_width === 'number' ? x.image_width : null,
      image_height: typeof x.image_height === 'number' ? x.image_height : null,
      title: typeof x.title === 'string' ? x.title : '',
      description: typeof x.description === 'string' ? x.description : '',
      enabled: x.enabled === true,
    }));

export function validateSlide(s: Pick<RawSlide, 'title' | 'description' | 'image_alt'>) {
  const e: { title?: string; description?: string; image_alt?: string } = {};
  if (s.title.length > 80) e.title = 'Keep the title to 80 characters.';
  if (s.description.length > 200) e.description = 'Keep the description to 200 characters.';
  if (s.image_alt.length > 200) e.image_alt = 'Keep the image description to 200 characters.';
  return e;
}

export function AdminHeroSlides() {
  useAdminMeta('Hero image slider');
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [hero, setHero] = useState<Hero | null>(null);
  const [slides, setSlides] = useState<RawSlide[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [upload, setUpload] = useState<{ name: string; pct: number; n: number; of: number } | null>(null);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [editing, setEditing] = useState<RawSlide | null>(null);
  const [deleting, setDeleting] = useState<RawSlide | null>(null);
  const [withHidden, setWithHidden] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoadError(null);
    const { data, error } = await supabase.from('sd_page_sections').select('id,updated_at,image_url,image_small_url,image_alt,items').eq('key', 'home.hero').maybeSingle();
    setLoading(false);
    if (error) return setLoadError('The slider could not be loaded. ' + dbError(error));
    if (!data) return setLoadError('The homepage’s top section is not in the database. Run supabase/02_sd_seed.sql to add it.');
    setHero({ id: data.id, updated_at: data.updated_at, image_url: data.image_url, image_small_url: data.image_small_url, image_alt: data.image_alt ?? '' });
    setSlides(toRaw(data.items));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  /**
   * Saves the whole list. It only succeeds if nobody else changed the section since it was loaded;
   * otherwise the latest version is loaded instead of overwriting their change.
   */
  const save = async (next: RawSlide[]): Promise<boolean> => {
    if (!supabase || !hero) return false;
    setBusy(true);
    const { data, error } = await supabase.from('sd_page_sections').update({ items: next }).eq('id', hero.id).eq('updated_at', hero.updated_at).select('updated_at,items').maybeSingle();
    setBusy(false);
    if (error) {
      toast('error', dbError(error, 'slider'));
      return false;
    }
    if (!data) {
      toast('error', 'Someone else changed the slider since you opened this page. The latest version is now shown; make your change again.');
      await load();
      return false;
    }
    setHero((h) => (h ? { ...h, updated_at: data.updated_at } : h));
    setSlides(toRaw(data.items));
    return true;
  };

  /** A file is only deleted when no other slide (and not the main image) still uses it. */
  const removeIfUnused = async (url: string, remaining: RawSlide[]) => {
    if (remaining.some((s) => s.image_url === url) || hero?.image_url === url) return;
    await removeFiles([pathFromPublicUrl(url)]);
  };

  const uploadFiles = async (list: FileList | null) => {
    if (!list || !hero) return;
    const files = Array.from(list);
    if (input.current) input.current.value = '';
    const room = MAX_SLIDES - slides.length;
    const problems: string[] = [];
    if (files.length > room) problems.push(`The slider holds up to ${MAX_SLIDES} slides, so only the first ${Math.max(room, 0)} of the ${files.length} files can be added.`);
    const added: RawSlide[] = [];
    const paths: string[] = [];
    const take = files.slice(0, Math.max(room, 0));
    for (const [k, file] of take.entries()) {
      const bad = checkImage(file);
      if (bad) {
        problems.push(bad);
        continue;
      }
      try {
        setUpload({ name: file.name, pct: 0, n: k + 1, of: take.length });
        const size = await imageSize(file);
        const path = storagePathFor(`sections/${hero.id}/slides`, file);
        await uploadWithProgress(path, file, (pct) => setUpload((u) => (u ? { ...u, pct } : u)));
        paths.push(path);
        added.push({ id: newId(), image_url: publicUrl(path), image_small_url: null, image_alt: '', image_width: size.width, image_height: size.height, title: '', description: '', enabled: false });
      } catch (e) {
        problems.push(`“${file.name}”: ${(e as Error).message}`);
      }
    }
    setUpload(null);
    setUploadErrors(problems);
    if (!added.length) return;
    const ok = await save([...slides, ...added]);
    if (!ok) {
      await removeFiles(paths);
      return;
    }
    setWithHidden(true);
    toast('success', `${added.length} ${added.length === 1 ? 'slide was' : 'slides were'} added as hidden. Check ${added.length === 1 ? 'it' : 'them'} in the preview, then switch ${added.length === 1 ? 'it' : 'them'} on.`);
  };

  const startFromMain = async () => {
    if (!hero) return;
    const main = hero.image_url ?? HERO.team.src;
    const ok = await save([{ id: newId(), image_url: main, image_small_url: hero.image_url ? hero.image_small_url : main.replace(/\.webp$/, '-sm.webp'), image_alt: hero.image_alt || HERO.team.alt, image_width: hero.image_url ? null : HERO.team.width, image_height: hero.image_url ? null : HERO.team.height, title: '', description: '', enabled: true }]);
    if (ok) toast('success', 'The current main image is now the first slide. Add more images to start the slideshow.');
  };

  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (!slides[j]) return;
    const next = [...slides];
    [next[i], next[j]] = [next[j], next[i]];
    if (await save(next)) toast('success', `Slide moved ${dir < 0 ? 'up' : 'down'}.`);
  };

  const toggle = async (s: RawSlide, enabled: boolean) => {
    if (await save(slides.map((x) => (x.id === s.id ? { ...x, enabled } : x)))) toast('success', enabled ? 'The slide is shown on the homepage.' : 'The slide is hidden from the homepage.');
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const next = slides.filter((x) => x.id !== deleting.id);
    if (await save(next)) {
      await removeIfUnused(deleting.image_url, next);
      toast('success', 'The slide was deleted.');
    }
    setDeleting(null);
  };

  const shown = slides.filter((s) => s.enabled).length;
  const mainImage: ImageAsset = hero?.image_url ? { src: hero.image_url, alt: hero.image_alt, width: 1600, height: 1000, ...(hero.image_small_url ? { smallSrc: hero.image_small_url, smallWidth: 800 } : {}) } : HERO.team;
  const preview = useMemo(() => buildSlides(withHidden ? slides.map((s) => ({ ...s, enabled: true })) : slides), [slides, withHidden]);

  if (loading) return <p role="status" className="mx-auto max-w-5xl text-slate">Loading the slider…</p>;
  if (loadError) return <div className="mx-auto max-w-5xl"><LoadError message={loadError} onRetry={load} /></div>;

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/admin/homepage" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All homepage sections
      </Link>
      <PageHeader
        title="Hero image slider"
        description="The pictures at the top of the homepage. Each one is shown whole and changes every few seconds. Changes appear on the website the next time the homepage loads."
        actions={
          <a href="/" target="_blank" rel="noreferrer" className={buttonClass('outline', 'md')}>
            <ExternalLink className="h-4 w-4" aria-hidden /> View homepage
          </a>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <Card title="Preview" id="preview">
          <div className="mx-auto max-w-[480px]" data-testid="slider-preview">
            <HeroSlider key={preview.map((p) => p.id).join()} slides={preview} fallback={mainImage} label="Slider preview" />
          </div>
          <div className="mt-5 space-y-3 border-t border-line pt-4">
            <p className="text-sm text-slate" aria-live="polite">
              {shown === 0
                ? 'No slides are switched on, so visitors see the main image from “Top of the page”.'
                : shown === 1
                  ? 'One slide is switched on, so visitors see a single image without arrows.'
                  : `${shown} slides are switched on. Visitors see them in this order, changing every 4.5 seconds.`}
            </p>
            {slides.some((s) => !s.enabled) && (
              <label className="flex items-center gap-2.5 text-[15px] text-ink">
                <input type="checkbox" checked={withHidden} onChange={(e) => setWithHidden(e.target.checked)} className="h-5 w-5 rounded border-line accent-teal" />
                Include hidden slides in the preview
              </label>
            )}
          </div>
        </Card>

        <Card title={`Slides (${slides.length} of ${MAX_SLIDES})`} id="slides">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input ref={input} type="file" multiple accept={IMAGE_TYPES.join(',')} className="sr-only" tabIndex={-1} aria-hidden data-testid="slides-input" onChange={(e) => uploadFiles(e.target.files)} />
            <button type="button" disabled={busy || Boolean(upload) || slides.length >= MAX_SLIDES} onClick={() => input.current?.click()} className={buttonClass('primary', 'md')}>
              <ImagePlus className="h-4 w-4" aria-hidden /> Upload images
            </button>
            <p className="text-sm text-slate">{slides.length >= MAX_SLIDES ? `The slider is full. Delete a slide to add another.` : 'Landscape images work best, ideally 1600 × 1200 px. JPEG, PNG, WebP or AVIF up to 5 MB each. You can choose several at once.'}</p>
          </div>
          {upload && (
            <div className="mb-4" role="status">
              <p className="text-sm text-ink">
                Uploading {upload.n} of {upload.of}: {upload.name}
              </p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-mist" role="progressbar" aria-label="Upload progress" aria-valuenow={upload.pct} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full bg-teal transition-[width] motion-reduce:transition-none" style={{ width: `${upload.pct}%` }} />
              </div>
            </div>
          )}
          {uploadErrors.length > 0 && (
            <div role="alert" className="mb-4 rounded-xl bg-coral/10 p-3 text-sm text-ink ring-1 ring-coral/40">
              <ul className="list-disc space-y-1 pl-5">
                {uploadErrors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {slides.length === 0 ? (
            <div className="rounded-xl bg-mist p-5 text-center">
              <Images className="mx-auto h-7 w-7 text-teal" aria-hidden />
              <p className="mt-2 font-semibold text-ink">No slides yet</p>
              <p className="mt-1 text-sm text-slate">Upload images, or start with the image the homepage shows now.</p>
              <button type="button" disabled={busy} onClick={startFromMain} className={buttonClass('outline', 'sm', 'mt-4')}>
                Start with the current main image
              </button>
            </div>
          ) : (
            <ol className="divide-y divide-line rounded-xl ring-1 ring-line">
              {slides.map((s, i) => (
                <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3 sm:flex-nowrap" data-testid="slide-row">
                  <div className="flex flex-col">
                    <button type="button" onClick={() => move(i, -1)} disabled={busy || i === 0} aria-label={`Move slide ${i + 1} up`} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-mist disabled:opacity-30">
                      <ArrowUp className="h-4 w-4" aria-hidden />
                    </button>
                    <button type="button" onClick={() => move(i, 1)} disabled={busy || i === slides.length - 1} aria-label={`Move slide ${i + 1} down`} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-mist disabled:opacity-30">
                      <ArrowDown className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                  <div className="h-14 w-[84px] shrink-0 overflow-hidden rounded-lg bg-mist ring-1 ring-line">
                    <img src={s.image_small_url || s.image_url} alt="" className="h-full w-full object-contain" loading="lazy" />
                  </div>
                  <div className="min-w-0 flex-1 basis-32">
                    <p className="line-clamp-2 font-semibold leading-snug text-ink">
                      {i + 1}. {s.title || <span className="font-normal italic text-slate">No title</span>}
                    </p>
                    <p className="line-clamp-2 text-sm text-slate">{s.description || (s.image_alt ? `Image: ${s.image_alt}` : 'No description')}</p>
                  </div>
                  <div className="w-28">
                    <Toggle checked={s.enabled} disabled={busy} onChange={(v) => toggle(s, v)} label={s.enabled ? 'Shown' : 'Hidden'} />
                  </div>
                  <div className="ml-auto flex gap-1">
                    <button type="button" onClick={() => setEditing(s)} aria-label={`Edit slide ${i + 1}`} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-mist">
                      <Pencil className="h-[18px] w-[18px]" aria-hidden />
                    </button>
                    <button type="button" onClick={() => setDeleting(s)} aria-label={`Delete slide ${i + 1}`} className="flex h-10 w-10 items-center justify-center rounded-full text-[#B3261E] hover:bg-[#B3261E]/10">
                      <Trash2 className="h-[18px] w-[18px]" aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-4 text-sm text-slate">
            The main image used when no slide is switched on is edited in <Link to="/admin/homepage/home.hero" className="font-semibold text-teal-700 underline underline-offset-2">Top of the page</Link>.
          </p>
        </Card>
      </div>

      {editing && hero && (
        <SlideDialog
          slide={editing}
          number={slides.findIndex((s) => s.id === editing.id) + 1}
          heroId={hero.id}
          onClose={() => setEditing(null)}
          onSave={async (next, oldUrl) => {
            const list = slides.map((x) => (x.id === next.id ? next : x));
            const ok = await save(list);
            if (ok) {
              if (oldUrl && oldUrl !== next.image_url) await removeIfUnused(oldUrl, list);
              toast('success', 'Slide saved.');
              setEditing(null);
            }
            return ok;
          }}
        />
      )}
      <ConfirmDialog open={Boolean(deleting)} title="Delete this slide?" confirmLabel="Delete slide" busy={busy} onConfirm={confirmDelete} onCancel={() => setDeleting(null)}>
        It is removed from the homepage, and its uploaded image is deleted. To take it away for now, switch it to Hidden instead.
      </ConfirmDialog>
    </div>
  );
}

function SlideDialog({ slide, number, heroId, onClose, onSave }: { slide: RawSlide; number: number; heroId: string; onClose: () => void; onSave: (s: RawSlide, oldUrl: string) => Promise<boolean> }) {
  const [d, setD] = useState(slide);
  const [errors, setErrors] = useState<ReturnType<typeof validateSlide> & { image?: string }>({});
  const [saving, setSaving] = useState(false);
  const [pct, setPct] = useState<number | null>(null);
  const [uploaded, setUploaded] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const dirty = JSON.stringify(d) !== JSON.stringify(slide);

  const close = useCallback(async () => {
    // an image uploaded here but never saved is not needed
    if (uploaded) await removeFiles([pathFromPublicUrl(uploaded)]);
    onClose();
  }, [uploaded, onClose]);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && pct === null && !saving && close();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [close, pct, saving]);

  const replace = async (file: File | undefined) => {
    if (!file) return;
    if (input.current) input.current.value = '';
    const bad = checkImage(file);
    if (bad) return setErrors((e) => ({ ...e, image: bad }));
    try {
      setErrors((e) => ({ ...e, image: undefined }));
      setPct(0);
      const size = await imageSize(file);
      const path = storagePathFor(`sections/${heroId}/slides`, file);
      await uploadWithProgress(path, file, setPct);
      if (uploaded) await removeFiles([pathFromPublicUrl(uploaded)]);
      const url = publicUrl(path);
      setUploaded(url);
      setD((x) => ({ ...x, image_url: url, image_small_url: null, image_width: size.width, image_height: size.height }));
    } catch (e) {
      setErrors((x) => ({ ...x, image: (e as Error).message }));
    } finally {
      setPct(null);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const err = validateSlide(d);
    setErrors(err);
    if (Object.keys(err).length) return;
    setSaving(true);
    const ok = await onSave({ ...d, title: d.title.trim(), description: d.description.trim(), image_alt: d.image_alt.trim() }, slide.image_url);
    setSaving(false);
    if (ok) setUploaded(null);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center overflow-y-auto bg-ink/50 p-4 sm:items-center">
      <form role="dialog" aria-modal="true" aria-labelledby="slide-title" onSubmit={submit} noValidate className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-lift">
        <div className="flex items-start justify-between gap-4">
          <h2 id="slide-title" className="font-display text-xl font-semibold text-ink">
            Edit slide {number}
          </h2>
          <button ref={closeRef} type="button" onClick={close} disabled={pct !== null || saving} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-mist">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="mt-4 grid gap-5 sm:grid-cols-[1fr_1.1fr]">
          <div>
            <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-aqua-50 via-white to-mist p-2 ring-1 ring-line">
              <img src={d.image_small_url || d.image_url} alt="" className="h-full w-full object-contain" data-testid="slide-dialog-image" />
            </div>
            <p className="mt-2 text-xs text-slate">{d.image_width && d.image_height ? `${d.image_width} × ${d.image_height} px. Shown whole, never cropped.` : 'Shown whole, never cropped.'}</p>
            {pct !== null && (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-mist" role="progressbar" aria-label="Uploading image" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full bg-teal" style={{ width: `${pct}%` }} />
              </div>
            )}
            {errors.image && <p role="alert" className="mt-2 text-sm font-medium text-[#B3261E]">{errors.image}</p>}
            <input ref={input} type="file" accept={IMAGE_TYPES.join(',')} className="sr-only" tabIndex={-1} aria-hidden data-testid="slide-replace-input" onChange={(e) => replace(e.target.files?.[0])} />
            <button type="button" disabled={pct !== null} onClick={() => input.current?.click()} className={buttonClass('outline', 'sm', 'mt-3')}>
              <RefreshCcw className="h-4 w-4" aria-hidden /> Replace image
            </button>
          </div>
          <div className="space-y-4">
            <TextField id="sl-title" label="Title" optional maxLength={80} value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} error={errors.title} hint={`Shown under the image. ${d.title.length}/80`} />
            <TextArea id="sl-desc" label="Description" optional rows={3} maxLength={200} value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} error={errors.description} hint={`${d.description.length}/200`} />
            <TextField id="sl-alt" label="Image description" optional maxLength={200} value={d.image_alt} onChange={(e) => setD({ ...d, image_alt: e.target.value })} error={errors.image_alt} hint="What the image shows, for people using screen readers. The title is used if this is empty." />
            <Toggle checked={d.enabled} onChange={(v) => setD({ ...d, enabled: v })} label="Shown on the homepage" />
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={close} disabled={pct !== null || saving} className={buttonClass('outline', 'md')}>
            Cancel
          </button>
          <button type="submit" disabled={!dirty || saving || pct !== null} className={cx(buttonClass('primary', 'md'))}>
            {saving && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />}
            Save slide
          </button>
        </div>
      </form>
    </div>
  );
}
