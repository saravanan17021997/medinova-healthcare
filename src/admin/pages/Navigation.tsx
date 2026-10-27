import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, ExternalLink, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TextField, buttonClass } from '@/components/ui';
import { SITE_PAGES, checkLink } from '@/lib/links';
import { useAdminMeta } from '../components';
import { Card, ConfirmDialog, LoadError, PageHeader, Toggle, dbError, useToast } from '../ui';

type Location = 'header' | 'footer_explore' | 'footer_social';
interface Row { id: string; location: Location; label: string; href: string; new_tab: boolean; sort_order: number; published: boolean }

/** The three menus, with how many links each can show without breaking the layout. */
export const MENUS: { location: Location; title: string; about: string; max: number; webOnly: boolean }[] = [
  { location: 'header', title: 'Header menu', about: 'Across the top of every page, and in the menu on phones.', max: 7, webOnly: false },
  { location: 'footer_explore', title: 'Footer links', about: 'The “Explore” column in the footer.', max: 8, webOnly: false },
  { location: 'footer_social', title: 'Social media', about: 'Buttons in the footer, such as Instagram or Facebook. They open in a new tab.', max: 6, webOnly: true },
];

interface Draft { id?: string; location: Location; label: string; href: string; new_tab: boolean; published: boolean }

export function AdminNavigation() {
  useAdminMeta('Navigation');
  const toast = useToast();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    setError(null);
    const { data, error: e } = await supabase.from('sd_nav_links').select('id,location,label,href,new_tab,sort_order,published').order('sort_order');
    if (e) return setError('Menus could not be loaded. ' + dbError(e));
    setRows(data as Row[]);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const inMenu = (loc: Location) => (rows ?? []).filter((r) => r.location === loc).sort((a, b) => a.sort_order - b.sort_order);
  const shownCount = (loc: Location, except?: string) => inMenu(loc).filter((r) => r.published && r.id !== except).length;
  const menu = (loc: Location) => MENUS.find((m) => m.location === loc)!;

  const move = async (loc: Location, i: number, dir: -1 | 1) => {
    if (!supabase) return;
    const list = inMenu(loc);
    const j = i + dir;
    if (!list[j]) return;
    [list[i], list[j]] = [list[j], list[i]];
    setBusy(true);
    const results = await Promise.all(list.map((r, k) => (r.sort_order === k + 1 ? null : supabase!.from('sd_nav_links').update({ sort_order: k + 1 }).eq('id', r.id))).filter(Boolean));
    setBusy(false);
    const failed = results.find((x) => x?.error);
    if (failed?.error) toast('error', dbError(failed.error, 'link'));
    load();
  };

  const toggle = async (r: Row, published: boolean) => {
    if (!supabase) return;
    const m = menu(r.location);
    if (published && shownCount(r.location) >= m.max) return toast('error', `The ${m.title.toLowerCase()} can show up to ${m.max} links. Hide another link first.`);
    const { error: e } = await supabase.from('sd_nav_links').update({ published }).eq('id', r.id).select('id').single();
    if (e) return toast('error', dbError(e, 'link'));
    setRows((rs) => rs?.map((x) => (x.id === r.id ? { ...x, published } : x)) ?? null);
    toast('success', published ? `“${r.label}” is shown.` : `“${r.label}” is hidden.`);
  };

  const confirmDelete = async () => {
    if (!supabase || !deleting) return;
    setBusy(true);
    const { error: e } = await supabase.from('sd_nav_links').delete().eq('id', deleting.id).select('id').single();
    setBusy(false);
    if (e) return toast('error', dbError(e, 'link'));
    toast('success', `“${deleting.label}” was deleted.`);
    setDeleting(null);
    load();
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Navigation"
        description="The links in the header and footer. Changes appear on the website the next time a page loads."
        actions={
          <a href="/" target="_blank" rel="noreferrer" className={buttonClass('outline', 'md')}>
            <ExternalLink className="h-4 w-4" aria-hidden /> View website
          </a>
        }
      />
      {error ? (
        <LoadError message={error} onRetry={load} />
      ) : !rows ? (
        <p role="status" className="text-slate">Loading menus…</p>
      ) : (
        <div className="space-y-6">
          {MENUS.map((m) => {
            const list = inMenu(m.location);
            return (
              <Card key={m.location} title={m.title} id={`menu-${m.location}`}>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[15px] text-slate">
                    {m.about} {shownCount(m.location)} of up to {m.max} shown.
                  </p>
                  <button type="button" onClick={() => setDraft({ location: m.location, label: '', href: m.webOnly ? 'https://' : '', new_tab: m.webOnly, published: shownCount(m.location) < m.max })} className={buttonClass('outline', 'sm', 'shrink-0')}>
                    <Plus className="h-4 w-4" aria-hidden /> Add link
                  </button>
                </div>
                {list.length === 0 ? (
                  <p className="rounded-xl bg-mist p-4 text-[15px] text-slate">{m.webOnly ? 'No social media links yet. Add one to show it in the footer.' : 'No links. The website shows this menu empty.'}</p>
                ) : (
                  <ul className="divide-y divide-line rounded-xl ring-1 ring-line" data-testid={`menu-${m.location}`}>
                    {list.map((r, i) => (
                      <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5 sm:flex-nowrap" data-testid="nav-row">
                        <div className="flex flex-col">
                          <button type="button" onClick={() => move(m.location, i, -1)} disabled={busy || i === 0} aria-label={`Move ${r.label} up`} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-mist disabled:opacity-30">
                            <ArrowUp className="h-4 w-4" aria-hidden />
                          </button>
                          <button type="button" onClick={() => move(m.location, i, 1)} disabled={busy || i === list.length - 1} aria-label={`Move ${r.label} down`} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-mist disabled:opacity-30">
                            <ArrowDown className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                        <div className="min-w-0 flex-1 basis-40">
                          <p className="font-semibold text-ink">{r.label}</p>
                          <p className="truncate text-sm text-slate">
                            {r.href}
                            {r.new_tab && !m.webOnly && ' · opens in a new tab'}
                          </p>
                        </div>
                        <div className="w-28">
                          <Toggle checked={r.published} onChange={(v) => toggle(r, v)} label={r.published ? 'Shown' : 'Hidden'} />
                        </div>
                        <div className="ml-auto flex gap-1">
                          <button type="button" onClick={() => setDraft({ id: r.id, location: r.location, label: r.label, href: r.href, new_tab: r.new_tab, published: r.published })} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-mist" aria-label={`Edit ${r.label}`}>
                            <Pencil className="h-[18px] w-[18px]" aria-hidden />
                          </button>
                          <button type="button" onClick={() => setDeleting(r)} className="flex h-10 w-10 items-center justify-center rounded-full text-[#B3261E] hover:bg-[#B3261E]/10" aria-label={`Delete ${r.label}`}>
                            <Trash2 className="h-[18px] w-[18px]" aria-hidden />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      )}
      {draft && (
        <LinkDialog
          draft={draft}
          maxReached={draft.published && shownCount(draft.location, draft.id) >= menu(draft.location).max}
          nextOrder={inMenu(draft.location).length + 1}
          onClose={() => setDraft(null)}
          onSaved={(label, isNew) => {
            toast('success', isNew ? `“${label}” was added.` : 'Link saved.');
            setDraft(null);
            load();
          }}
        />
      )}
      <ConfirmDialog open={Boolean(deleting)} title={`Delete “${deleting?.label}”?`} confirmLabel="Delete link" busy={busy} onConfirm={confirmDelete} onCancel={() => setDeleting(null)}>
        It is removed from the menu on the website. To take it away for now, switch it to Hidden instead.
      </ConfirmDialog>
    </div>
  );
}

export function validateLink(d: Pick<Draft, 'label' | 'href' | 'location'>): { label?: string; href?: string } {
  const e: { label?: string; href?: string } = {};
  const max = d.location === 'header' ? 24 : 40;
  if (!d.label.trim()) e.label = 'Enter the text visitors see.';
  else if (d.label.trim().length > max) e.label = `Keep the text to ${max} characters so the menu fits.`;
  const p = checkLink(d.href, { webOnly: d.location === 'footer_social' });
  if (p) e.href = p;
  return e;
}

function LinkDialog({ draft, maxReached, nextOrder, onClose, onSaved }: { draft: Draft; maxReached: boolean; nextOrder: number; onClose: () => void; onSaved: (label: string, isNew: boolean) => void }) {
  const [d, setD] = useState(draft);
  const [errors, setErrors] = useState<{ label?: string; href?: string; form?: string }>({});
  const [saving, setSaving] = useState(false);
  const first = useRef<HTMLInputElement>(null);
  const m = MENUS.find((x) => x.location === d.location)!;
  const isNew = !d.id;

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [onClose]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    const err = validateLink(d);
    if (d.published && maxReached) Object.assign(err, { form: `The ${m.title.toLowerCase()} already shows ${m.max} links. Save this one as hidden, or hide another link first.` });
    setErrors(err);
    if (Object.keys(err).length) return;
    const payload = { label: d.label.trim(), href: d.href.trim(), new_tab: m.webOnly ? true : d.new_tab, published: d.published };
    setSaving(true);
    const res = isNew
      ? await supabase.from('sd_nav_links').insert({ ...payload, location: d.location, sort_order: nextOrder }).select('id').single()
      : await supabase.from('sd_nav_links').update(payload).eq('id', d.id!).select('id').single();
    setSaving(false);
    if (res.error) return setErrors({ form: dbError(res.error, 'link') });
    onSaved(payload.label, isNew);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/50 p-4 sm:items-center">
      <form role="dialog" aria-modal="true" aria-labelledby="link-title" onSubmit={submit} noValidate className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-lift">
        <h2 id="link-title" className="font-display text-xl font-semibold text-ink">
          {isNew ? `Add a link to the ${m.title.toLowerCase()}` : 'Edit link'}
        </h2>
        <datalist id="nav-pages">
          {SITE_PAGES.map((p) => (
            <option key={p.path} value={p.path}>{p.label}</option>
          ))}
        </datalist>
        <div className="mt-5 space-y-4">
          <TextField ref={first} id="nl-label" label="Text" value={d.label} maxLength={d.location === 'header' ? 24 : 40} onChange={(e) => setD({ ...d, label: e.target.value })} error={errors.label} hint={m.webOnly ? 'For example Instagram' : 'For example Doctors'} />
          <TextField
            id="nl-href" label={m.webOnly ? 'Web address' : 'Goes to'} value={d.href} list={m.webOnly ? undefined : 'nav-pages'} inputMode="url"
            onChange={(e) => {
              const href = e.target.value;
              setD((x) => ({ ...x, href, new_tab: x.id || m.webOnly ? x.new_tab : href.startsWith('https://') }));
            }}
            error={errors.href}
            hint={m.webOnly ? 'The full address of your page, starting with https://' : 'Choose a page from the list, or enter a full https:// address.'}
          />
          {!m.webOnly && (
            <label className="flex items-center gap-2.5 text-[15px] text-ink">
              <input type="checkbox" checked={d.new_tab} onChange={(e) => setD({ ...d, new_tab: e.target.checked })} className="h-5 w-5 rounded border-line accent-teal" />
              Open in a new tab
            </label>
          )}
          <Toggle checked={d.published} onChange={(v) => setD({ ...d, published: v })} label="Shown on the website" />
          {errors.form && (
            <p role="alert" className="text-sm font-medium text-[#B3261E]">{errors.form}</p>
          )}
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={saving} className={buttonClass('outline', 'md')}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={buttonClass('primary', 'md')}>
            {saving && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />}
            {isNew ? 'Add link' : 'Save link'}
          </button>
        </div>
      </form>
    </div>
  );
}
