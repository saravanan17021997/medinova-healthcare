import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, RefreshCcw, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { buttonClass } from '@/components/ui';
import { Card, ConfirmDialog, LoadError, dbError, useToast } from '../ui';
import { IMAGE_TYPES, checkImage, imageSize, publicUrl, removeFiles, storagePathFor, uploadWithProgress } from '../storage';

interface ImageRow { id: string; url: string; small_url: string | null; storage_path: string | null; alt: string; width: number | null; height: number | null; sort_order: number }
interface Upload { key: string; name: string; pct: number; error?: string }

export function ProductImages({ productId, productName }: { productId: string; productName: string }) {
  const toast = useToast();
  const [rows, setRows] = useState<ImageRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [removing, setRemoving] = useState<ImageRow | null>(null);
  const [busy, setBusy] = useState(false);
  const addRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const replaceTarget = useRef<ImageRow | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setError(null);
    const { data, error: e } = await supabase.from('sd_product_images').select('id,url,small_url,storage_path,alt,width,height,sort_order').eq('product_id', productId).order('sort_order');
    if (e) return setError('Images could not be loaded. ' + dbError(e));
    setRows(data as ImageRow[]);
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  const progress = (key: string, patch: Partial<Upload>) => setUploads((u) => u.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  /** Uploads one file and returns its storage path and size, or null on failure. */
  const uploadOne = async (file: File, key: string) => {
    const problem = checkImage(file);
    if (problem) {
      progress(key, { error: problem });
      return null;
    }
    try {
      const size = await imageSize(file);
      const path = storagePathFor(`products/${productId}`, file);
      await uploadWithProgress(path, file, (pct) => progress(key, { pct }));
      return { path, ...size };
    } catch (e) {
      progress(key, { error: (e as Error).message });
      return null;
    }
  };

  const onAdd = async (files: FileList | null) => {
    if (!files?.length || !supabase || !rows) return;
    const list = Array.from(files).slice(0, 10);
    const batch = list.map((f, i) => ({ key: `${Date.now()}-${i}`, name: f.name, pct: 0 }));
    setUploads((u) => [...u, ...batch]);
    let order = rows.reduce((m, r) => Math.max(m, r.sort_order), 0);
    let added = 0;
    for (let i = 0; i < list.length; i++) {
      const up = await uploadOne(list[i], batch[i].key);
      if (!up) continue;
      order += 1;
      const { error: e } = await supabase
        .from('sd_product_images')
        .insert({ product_id: productId, url: publicUrl(up.path), storage_path: up.path, alt: productName, width: up.width, height: up.height, sort_order: order });
      if (e) {
        await removeFiles([up.path]);
        progress(batch[i].key, { error: dbError(e, 'image') });
        continue;
      }
      added++;
      setUploads((u) => u.filter((x) => x.key !== batch[i].key));
    }
    if (added) toast('success', added === 1 ? 'Image added.' : `${added} images added.`);
    if (addRef.current) addRef.current.value = '';
    load();
  };

  const onReplace = async (files: FileList | null) => {
    const target = replaceTarget.current;
    if (!files?.[0] || !target || !supabase) return;
    const key = `r-${Date.now()}`;
    setUploads((u) => [...u, { key, name: files[0].name, pct: 0 }]);
    const up = await uploadOne(files[0], key);
    if (replaceRef.current) replaceRef.current.value = '';
    if (!up) return;
    const { error: e } = await supabase
      .from('sd_product_images')
      .update({ url: publicUrl(up.path), small_url: null, storage_path: up.path, width: up.width, height: up.height })
      .eq('id', target.id)
      .select('id')
      .single();
    if (e) {
      await removeFiles([up.path]);
      return progress(key, { error: dbError(e, 'image') });
    }
    await removeFiles([target.storage_path]);
    setUploads((u) => u.filter((x) => x.key !== key));
    toast('success', 'Image replaced.');
    load();
  };

  const move = async (index: number, dir: -1 | 1) => {
    if (!rows || !supabase) return;
    const a = rows[index];
    const b = rows[index + dir];
    if (!a || !b) return;
    const next = [...rows];
    next[index] = { ...b, sort_order: a.sort_order };
    next[index + dir] = { ...a, sort_order: b.sort_order };
    setRows(next);
    const r1 = await supabase.from('sd_product_images').update({ sort_order: b.sort_order }).eq('id', a.id);
    const r2 = await supabase.from('sd_product_images').update({ sort_order: a.sort_order }).eq('id', b.id);
    if (r1.error || r2.error) {
      toast('error', dbError(r1.error ?? r2.error, 'image'));
      load();
    }
  };

  const saveAlt = async (row: ImageRow, alt: string) => {
    if (!supabase || alt.trim() === row.alt) return;
    const { error: e } = await supabase.from('sd_product_images').update({ alt: alt.trim().slice(0, 200) }).eq('id', row.id);
    if (e) return toast('error', dbError(e, 'image'));
    setRows((rs) => rs?.map((r) => (r.id === row.id ? { ...r, alt: alt.trim() } : r)) ?? null);
    toast('success', 'Description saved.');
  };

  const confirmRemove = async () => {
    if (!removing || !supabase) return;
    setBusy(true);
    const { error: e } = await supabase.from('sd_product_images').delete().eq('id', removing.id).select('id').single();
    if (e) {
      setBusy(false);
      return toast('error', dbError(e, 'image'));
    }
    await removeFiles([removing.storage_path]);
    setBusy(false);
    setRemoving(null);
    toast('success', 'Image removed.');
    load();
  };

  return (
    <Card title="Images" id="images">
      <p className="mb-4 text-[15px] text-slate">The first image is the main one on product cards. JPEG, PNG, WebP or AVIF, up to 5 MB each. Square images work best.</p>
      {error ? (
        <LoadError message={error} onRetry={load} />
      ) : !rows ? (
        <p role="status" className="text-slate">
          Loading images…
        </p>
      ) : (
        <>
          {rows.length === 0 && <p className="mb-4 rounded-2xl bg-mist p-4 text-[15px] text-ink">No images yet. The store shows a placeholder until you add one.</p>}
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r, i) => (
              <li key={r.id} className="overflow-hidden rounded-2xl ring-1 ring-line" data-testid="image-item">
                <div className="relative aspect-square bg-mist">
                  <img src={r.small_url || r.url} alt={r.alt} loading="lazy" className="h-full w-full object-cover" />
                  {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-white">Main image</span>}
                </div>
                <div className="space-y-2 p-3">
                  <label className="block text-xs font-semibold text-slate" htmlFor={`alt-${r.id}`}>
                    Description for screen readers
                  </label>
                  <input id={`alt-${r.id}`} defaultValue={r.alt} maxLength={200} onBlur={(e) => saveAlt(r, e.target.value)} className="h-10 w-full rounded-lg border border-line px-3 text-sm" />
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move image ${i + 1} earlier`} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-mist disabled:opacity-30">
                      <ArrowUp className="h-4 w-4" aria-hidden />
                    </button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label={`Move image ${i + 1} later`} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-mist disabled:opacity-30">
                      <ArrowDown className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        replaceTarget.current = r;
                        replaceRef.current?.click();
                      }}
                      className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-ink hover:bg-mist"
                      aria-label={`Replace image ${i + 1}`}
                    >
                      <RefreshCcw className="h-4 w-4" aria-hidden /> Replace
                    </button>
                    <button type="button" onClick={() => setRemoving(r)} className="flex h-9 w-9 items-center justify-center rounded-full text-[#B3261E] hover:bg-[#B3261E]/10" aria-label={`Remove image ${i + 1}`}>
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {uploads.length > 0 && (
            <ul className="mt-4 space-y-2" aria-label="Uploads">
              {uploads.map((u) => (
                <li key={u.key} className="rounded-xl bg-mist p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate font-medium text-ink">{u.name}</span>
                    {u.error ? (
                      <button type="button" onClick={() => setUploads((x) => x.filter((y) => y.key !== u.key))} className="text-xs font-semibold text-slate underline">
                        Dismiss
                      </button>
                    ) : (
                      <span className="tabular-nums text-slate">{u.pct}%</span>
                    )}
                  </div>
                  {u.error ? (
                    <p role="alert" className="mt-1 text-[#B3261E]">
                      {u.error}
                    </p>
                  ) : (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white" role="progressbar" aria-label={`Uploading ${u.name}`} aria-valuenow={u.pct} aria-valuemin={0} aria-valuemax={100}>
                      <div className="h-full bg-teal transition-[width] motion-reduce:transition-none" style={{ width: `${u.pct}%` }} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5">
            <input ref={addRef} id="add-images" type="file" accept={IMAGE_TYPES.join(',')} multiple className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => onAdd(e.target.files)} />
            <button type="button" onClick={() => addRef.current?.click()} className={buttonClass('outline', 'md')}>
              <ImagePlus className="h-5 w-5" aria-hidden /> Add images
            </button>
            <input ref={replaceRef} type="file" accept={IMAGE_TYPES.join(',')} className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => onReplace(e.target.files)} />
          </div>
        </>
      )}
      <ConfirmDialog open={Boolean(removing)} title="Remove this image?" confirmLabel="Remove image" busy={busy} onConfirm={confirmRemove} onCancel={() => setRemoving(null)}>
        It will disappear from the store straight away.
      </ConfirmDialog>
    </Card>
  );
}
