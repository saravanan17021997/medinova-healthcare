import { useRef, useState } from 'react';
import { ImageOff, ImagePlus, RefreshCcw, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { buttonClass } from '@/components/ui';
import { ConfirmDialog, dbError, useToast } from './ui';
import { IMAGE_TYPES, checkImage, imageSize, pathFromPublicUrl, publicUrl, removeFiles, storagePathFor, uploadWithProgress } from './storage';

interface Props {
  table: 'sd_doctors' | 'sd_specialties';
  id: string;
  /** Column prefix: photo_url / photo_width … or image_url / image_width … */
  prefix: 'photo' | 'image';
  folder: string;
  url: string | null;
  smallUrl: string | null;
  label: string;
  hint: string;
  aspect?: string;
  onChange: (next: { url: string | null; smallUrl: string | null }) => void;
}

/** One image stored on a row (doctor photo, specialty image): upload, replace or remove. */
export function PhotoField({ table, id, prefix, folder, url, smallUrl, label, hint, aspect = 'aspect-[4/5]', onChange }: Props) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File | undefined) => {
    if (!file || !supabase) return;
    if (input.current) input.current.value = '';
    setError(null);
    const problem = checkImage(file);
    if (problem) return setError(problem);
    try {
      setPct(0);
      const size = await imageSize(file);
      const path = storagePathFor(`${folder}/${id}`, file);
      await uploadWithProgress(path, file, setPct);
      const next = publicUrl(path);
      const { error: e } = await supabase
        .from(table)
        .update({ [`${prefix}_url`]: next, [`${prefix}_small_url`]: null, [`${prefix}_width`]: size.width, [`${prefix}_height`]: size.height })
        .eq('id', id)
        .select('id')
        .single();
      if (e) {
        await removeFiles([path]);
        throw new Error(dbError(e));
      }
      await removeFiles([pathFromPublicUrl(url)]);
      onChange({ url: next, smallUrl: null });
      toast('success', url ? 'Image replaced.' : 'Image added.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPct(null);
    }
  };

  const remove = async () => {
    if (!supabase) return;
    setBusy(true);
    const { error: e } = await supabase
      .from(table)
      .update({ [`${prefix}_url`]: null, [`${prefix}_small_url`]: null, [`${prefix}_width`]: null, [`${prefix}_height`]: null })
      .eq('id', id)
      .select('id')
      .single();
    setBusy(false);
    setConfirm(false);
    if (e) return toast('error', dbError(e));
    await removeFiles([pathFromPublicUrl(url)]);
    onChange({ url: null, smallUrl: null });
    toast('success', 'Image removed.');
  };

  return (
    <div>
      <p className="text-sm font-semibold text-ink">{label}</p>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className={`${aspect} w-40 shrink-0 overflow-hidden rounded-2xl bg-mist ring-1 ring-line`}>
          {url ? <img src={smallUrl || url} alt="" className="h-full w-full object-cover" data-testid="photo-preview" /> : <ImageOff className="m-auto mt-12 h-8 w-8 text-slate/50" aria-label="No image" />}
        </div>
        <div className="space-y-3">
          <p className="max-w-sm text-sm text-slate">{hint}</p>
          {pct !== null && (
            <div className="h-1.5 w-56 overflow-hidden rounded-full bg-mist" role="progressbar" aria-label="Uploading image" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full bg-teal transition-[width] motion-reduce:transition-none" style={{ width: `${pct}%` }} />
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm font-medium text-[#B3261E]">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <input ref={input} type="file" accept={IMAGE_TYPES.join(',')} className="sr-only" tabIndex={-1} aria-hidden data-testid={`${prefix}-input`} onChange={(e) => upload(e.target.files?.[0])} />
            <button type="button" disabled={pct !== null} onClick={() => input.current?.click()} className={buttonClass('outline', 'sm')}>
              {url ? <RefreshCcw className="h-4 w-4" aria-hidden /> : <ImagePlus className="h-4 w-4" aria-hidden />}
              {url ? 'Replace image' : 'Upload image'}
            </button>
            {url && (
              <button type="button" disabled={pct !== null} onClick={() => setConfirm(true)} className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-[#B3261E] hover:bg-[#B3261E]/10">
                <Trash2 className="h-4 w-4" aria-hidden /> Remove
              </button>
            )}
          </div>
        </div>
      </div>
      <ConfirmDialog open={confirm} title="Remove this image?" confirmLabel="Remove image" busy={busy} onConfirm={remove} onCancel={() => setConfirm(false)}>
        The website will show a placeholder until you add a new one.
      </ConfirmDialog>
    </div>
  );
}
