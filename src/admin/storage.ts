import { supabase } from '@/lib/supabase';
import { SUPABASE_KEY, SUPABASE_URL } from '@/lib/supabaseConfig';

// Image uploads to the "sd-media" bucket. The bucket only accepts these types
// and sizes, and only admins may write to it (enforced by Storage policies).
export const BUCKET = 'sd-media';
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' };

export function checkImage(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return `“${file.name}” is not a JPEG, PNG, WebP or AVIF image.`;
  if (file.size > MAX_IMAGE_BYTES) return `“${file.name}” is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 5 MB.`;
  if (file.size === 0) return `“${file.name}” is empty.`;
  return null;
}

export function imageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      resolve({ width: im.naturalWidth, height: im.naturalHeight });
      URL.revokeObjectURL(url);
    };
    im.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`“${file.name}” could not be read as an image.`));
    };
    im.src = url;
  });
}

export const storagePathFor = (folder: string, file: File) =>
  `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${EXT[file.type] ?? 'bin'}`;

export const publicUrl = (path: string) => `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`;

/** Uploads with progress (supabase-js has no progress events). Uses the signed-in admin's session. */
export async function uploadWithProgress(path: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  const token = (await supabase!.auth.getSession()).data.session?.access_token;
  if (!token) throw new Error('Your session has ended. Sign in again.');
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('apikey', SUPABASE_KEY);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.setRequestHeader('cache-control', 'max-age=3600');
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let msg = `Upload failed (error ${xhr.status}).`;
      try {
        const body = JSON.parse(xhr.responseText);
        if (/row-level security|unauthori[sz]ed/i.test(body.message ?? '')) msg = 'Your account is not allowed to upload images.';
        else if (/mime|type/i.test(body.message ?? '')) msg = 'This file type is not allowed.';
        else if (/size|too large|exceeded/i.test(body.message ?? '')) msg = 'This file is larger than 5 MB.';
        else if (body.message) msg = `Upload failed: ${body.message}`;
      } catch {
        /* keep the generic message */
      }
      reject(new Error(msg));
    };
    xhr.onerror = () => reject(new Error('Upload failed: the connection was lost.'));
    xhr.send(file);
  });
}

/** Best-effort removal of uploaded files (a leftover file is harmless). */
export async function removeFiles(paths: (string | null | undefined)[]) {
  const list = paths.filter((p): p is string => Boolean(p));
  if (!list.length || !supabase) return;
  await supabase.storage.from(BUCKET).remove(list).catch(() => undefined);
}

/** The storage path of a file in our bucket, or null for the built-in images that ship with the site. */
export function pathFromPublicUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length).split('/').map(decodeURIComponent).join('/');
}
