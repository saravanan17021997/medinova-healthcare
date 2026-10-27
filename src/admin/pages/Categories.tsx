import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SelectField, TextArea, TextField, buttonClass } from '@/components/ui';
import { useAdminMeta } from '../components';
import { ConfirmDialog, LoadError, PageHeader, SLUG_RE, Toggle, dbError, slugify, useToast } from '../ui';

interface Cat { id: string; slug: string; name: string; description: string; icon_url: string | null; sort_order: number; published: boolean; products: number }
interface Form { id?: string; name: string; slug: string; description: string; icon_url: string; published: boolean }

const ICONS = [
  ['', 'No icon'],
  ['/images/icons/category-monitoring.svg', 'Monitoring'],
  ['/images/icons/category-first-aid.svg', 'First aid'],
  ['/images/icons/category-protective.svg', 'Protective'],
  ['/images/icons/category-diagnostic.svg', 'Diagnostic'],
  ['/images/icons/category-storage.svg', 'Storage'],
  ['/images/icons/category-mobility.svg', 'Mobility'],
];

function CategoryDialog({ initial, onClose, onSaved }: { initial: Form; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [f, setF] = useState<Form>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const firstRef = useRef<HTMLDivElement>(null);
  const isNew = !initial.id;

  useEffect(() => {
    firstRef.current?.querySelector('input')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !saving && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    const err: typeof errors = {};
    if (!f.name.trim() || f.name.trim().length > 80) err.name = 'Enter a name (up to 80 characters).';
    if (!SLUG_RE.test(f.slug)) err.slug = 'Use lowercase letters, numbers and single hyphens.';
    if (f.description.length > 500) err.description = 'Keep it to 500 characters.';
    setErrors(err);
    if (Object.keys(err).length) return;
    setSaving(true);
    const payload = { name: f.name.trim(), slug: f.slug, description: f.description.trim(), icon_url: f.icon_url || null, published: f.published };
    let res;
    if (isNew) {
      const max = await supabase.from('sd_categories').select('sort_order').order('sort_order', { ascending: false }).limit(1);
      res = await supabase.from('sd_categories').insert({ ...payload, sort_order: (max.data?.[0]?.sort_order ?? 0) + 1 }).select('id').single();
    } else {
      res = await supabase.from('sd_categories').update(payload).eq('id', initial.id!).select('id').single();
    }
    setSaving(false);
    if (res.error) {
      const msg = dbError(res.error, 'category');
      if (/slug/.test(msg)) setErrors({ slug: msg });
      return toast('error', msg);
    }
    toast('success', isNew ? `Category “${payload.name}” created.` : 'Category saved.');
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-end justify-center bg-ink/50 p-4 sm:items-center">
      <form onSubmit={submit} noValidate role="dialog" aria-modal="true" aria-labelledby="cat-dialog-title" className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-lift">
        <div className="flex items-start justify-between gap-4">
          <h2 id="cat-dialog-title" className="font-display text-2xl font-semibold text-ink">
            {isNew ? 'Add category' : 'Edit category'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full hover:bg-mist">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div ref={firstRef} className="mt-5 space-y-5">
          <TextField
            id="cf-name"
            label="Name"
            value={f.name}
            maxLength={80}
            error={errors.name}
            onChange={(e) => {
              const name = e.target.value;
              setF((x) => ({ ...x, name, slug: slugTouched ? x.slug : slugify(name) }));
            }}
          />
          <TextField
            id="cf-slug"
            label="Web address (slug)"
            hint={`Used in /store?category=${f.slug || 'your-category'}`}
            value={f.slug}
            error={errors.slug}
            onChange={(e) => {
              setSlugTouched(true);
              setF((x) => ({ ...x, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }));
            }}
          />
          <TextArea id="cf-desc" label="Description" optional rows={3} value={f.description} error={errors.description} onChange={(e) => setF((x) => ({ ...x, description: e.target.value }))} />
          <div className="grid items-end gap-4 sm:grid-cols-[1fr_auto]">
            <SelectField id="cf-icon" label="Icon" value={f.icon_url} onChange={(e) => setF((x) => ({ ...x, icon_url: e.target.value }))}>
              {ICONS.map(([v, l]) => (
                <option key={l} value={v}>
                  {l}
                </option>
              ))}
            </SelectField>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-mist">{f.icon_url && <img src={f.icon_url} alt="" width={40} height={40} className="h-10 w-10" />}</div>
          </div>
          <Toggle checked={f.published} onChange={(v) => setF((x) => ({ ...x, published: v }))} label="Shown in the store" />
        </div>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={saving} className={buttonClass('outline', 'md')}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={buttonClass('primary', 'md')}>
            {saving && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />}
            {isNew ? 'Create category' : 'Save category'}
          </button>
        </div>
      </form>
    </div>
  );
}

export function AdminCategories() {
  useAdminMeta('Categories');
  const toast = useToast();
  const [rows, setRows] = useState<Cat[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Form | null>(null);
  const [deleting, setDeleting] = useState<Cat | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    setError(null);
    const { data, error: e } = await supabase.from('sd_categories').select('id,slug,name,description,icon_url,sort_order,published,sd_products(count)').order('sort_order').order('name');
    if (e) return setError('Categories could not be loaded. ' + dbError(e));
    setRows(
      (data as (Omit<Cat, 'products'> & { sd_products: { count: number }[] })[]).map((c) => ({ ...c, description: c.description ?? '', products: c.sd_products?.[0]?.count ?? 0 })),
    );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const move = async (index: number, dir: -1 | 1) => {
    if (!rows || !supabase) return;
    const a = rows[index];
    const b = rows[index + dir];
    if (!a || !b) return;
    // give neighbours distinct positions even if they were equal before
    const ao = index + dir + 1;
    const bo = index + 1;
    const next = [...rows];
    next[index] = { ...b, sort_order: bo };
    next[index + dir] = { ...a, sort_order: ao };
    setRows(next);
    const r1 = await supabase.from('sd_categories').update({ sort_order: ao }).eq('id', a.id);
    const r2 = await supabase.from('sd_categories').update({ sort_order: bo }).eq('id', b.id);
    if (r1.error || r2.error) toast('error', dbError(r1.error ?? r2.error, 'category'));
    load();
  };

  const toggle = async (c: Cat, published: boolean) => {
    if (!supabase) return;
    const { error: e } = await supabase.from('sd_categories').update({ published }).eq('id', c.id).select('id').single();
    if (e) return toast('error', dbError(e, 'category'));
    setRows((rs) => rs?.map((x) => (x.id === c.id ? { ...x, published } : x)) ?? null);
    toast('success', published ? `“${c.name}” is shown in the store.` : `“${c.name}” and its ${c.products} products are hidden from the store.`);
  };

  const confirmDelete = async () => {
    if (!supabase || !deleting) return;
    setBusy(true);
    const { error: e } = await supabase.from('sd_categories').delete().eq('id', deleting.id).select('id').single();
    setBusy(false);
    if (e) return toast('error', e.code === '23503' ? `“${deleting.name}” still has products. Move them to another category first.` : dbError(e, 'category'));
    toast('success', `Category “${deleting.name}” deleted.`);
    setDeleting(null);
    load();
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Categories"
        description="Group products in the store. Hiding a category hides all of its products too."
        actions={
          <button type="button" onClick={() => setEditing({ name: '', slug: '', description: '', icon_url: '', published: true })} className={buttonClass('primary', 'md')}>
            <Plus className="h-5 w-5" aria-hidden /> Add category
          </button>
        }
      />
      {error ? (
        <LoadError message={error} onRetry={load} />
      ) : !rows ? (
        <p role="status" className="text-slate">
          Loading categories…
        </p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-card ring-1 ring-line/70">
          <p className="font-semibold text-ink">No categories yet</p>
          <p className="mt-1 text-[15px] text-slate">Products need a category. Add one to get started.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-line/70">
          {rows.map((c, i) => (
            <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:flex-nowrap sm:px-5" data-testid="category-row">
              <div className="flex flex-col">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${c.name} up`} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-mist disabled:opacity-30">
                  <ArrowUp className="h-4 w-4" aria-hidden />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label={`Move ${c.name} down`} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-mist disabled:opacity-30">
                  <ArrowDown className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mist">{c.icon_url && <img src={c.icon_url} alt="" width={36} height={36} className="h-9 w-9" />}</div>
              <div className="min-w-0 flex-1 basis-40">
                <p className="font-semibold text-ink">{c.name}</p>
                <p className="truncate text-sm text-slate">
                  /{c.slug} · {c.products} {c.products === 1 ? 'product' : 'products'}
                </p>
              </div>
              <Toggle checked={c.published} onChange={(v) => toggle(c, v)} label={c.published ? 'Shown' : 'Hidden'} />
              <div className="ml-auto flex gap-1">
                <button type="button" onClick={() => setEditing({ id: c.id, name: c.name, slug: c.slug, description: c.description, icon_url: c.icon_url ?? '', published: c.published })} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-mist" aria-label={`Edit ${c.name}`}>
                  <Pencil className="h-[18px] w-[18px]" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => (c.products > 0 ? toast('error', `“${c.name}” has ${c.products} ${c.products === 1 ? 'product' : 'products'}. Move them to another category first, or hide this category instead.`) : setDeleting(c))}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-[#B3261E] hover:bg-[#B3261E]/10"
                  aria-label={`Delete ${c.name}`}
                >
                  <Trash2 className="h-[18px] w-[18px]" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <CategoryDialog
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete “${deleting?.name}”?`}
        confirmLabel="Delete category"
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      >
        It has no products. This cannot be undone.
      </ConfirmDialog>
    </div>
  );
}
