import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SelectField, TextArea, TextField, buttonClass } from '@/components/ui';
import { cx } from '@/lib/format';
import { useAdminMeta } from '../components';
import { Card, ConfirmDialog, LoadError, SLUG_RE, Toggle, dbError, slugify, useToast } from '../ui';
import { removeFiles } from '../storage';
import { ProductImages } from './ProductImages';

interface Form {
  name: string; slug: string; sku: string; category_id: string;
  price: string; discount_price: string; stock: string; low_stock_threshold: string;
  summary: string; description: string; features: string; in_the_box: string;
  featured: boolean; published: boolean;
}
type Errors = Partial<Record<keyof Form, string>>;

const EMPTY: Form = { name: '', slug: '', sku: '', category_id: '', price: '', discount_price: '', stock: '0', low_stock_threshold: '5', summary: '', description: '', features: '', in_the_box: '', featured: false, published: false };
const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);
const money = /^\d{1,7}(\.\d{1,2})?$/;
const whole = /^\d{1,6}$/;

function validate(f: Form): Errors {
  const e: Errors = {};
  if (!f.name.trim()) e.name = 'Enter the product name.';
  else if (f.name.trim().length > 120) e.name = 'Keep the name to 120 characters or fewer.';
  if (!SLUG_RE.test(f.slug)) e.slug = 'Use lowercase letters, numbers and single hyphens, e.g. digital-thermometer.';
  if (!/^[A-Z0-9][A-Z0-9-]{1,39}$/.test(f.sku)) e.sku = 'Use 2–40 capital letters, numbers or hyphens, e.g. SD-MON-001.';
  if (!f.category_id) e.category_id = 'Choose a category.';
  if (!money.test(f.price.trim())) e.price = 'Enter a price in rupees, e.g. 1499 or 1499.50.';
  else if (Number(f.price) > 1000000) e.price = 'The price cannot be more than ₹10,00,000.';
  if (f.discount_price.trim()) {
    if (!money.test(f.discount_price.trim())) e.discount_price = 'Enter a sale price in rupees, or leave it empty.';
    else if (!e.price && Number(f.discount_price) >= Number(f.price)) e.discount_price = 'The sale price must be lower than the price.';
  }
  if (!whole.test(f.stock.trim())) e.stock = 'Enter a whole number, 0 or more.';
  if (!whole.test(f.low_stock_threshold.trim())) e.low_stock_threshold = 'Enter a whole number, 0 or more.';
  if (f.summary.length > 200) e.summary = `Keep the summary to 200 characters (now ${f.summary.length}).`;
  if (f.description.length > 4000) e.description = `Keep the description to 4000 characters (now ${f.description.length}).`;
  if (lines(f.features).length > 20) e.features = 'Use 20 lines or fewer.';
  if (lines(f.in_the_box).length > 20) e.in_the_box = 'Use 20 lines or fewer.';
  return e;
}

const toPayload = (f: Form) => ({
  name: f.name.trim(),
  slug: f.slug,
  sku: f.sku,
  category_id: f.category_id,
  price: Number(f.price),
  discount_price: f.discount_price.trim() ? Number(f.discount_price) : null,
  stock: Number(f.stock),
  low_stock_threshold: Number(f.low_stock_threshold),
  summary: f.summary.trim(),
  description: f.description.trim(),
  features: lines(f.features),
  in_the_box: lines(f.in_the_box),
  featured: f.featured,
  published: f.published,
});

export function AdminProductForm() {
  const { id } = useParams();
  const isNew = !id;
  useAdminMeta(isNew ? 'Add product' : 'Edit product');
  const navigate = useNavigate();
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const [form, setForm] = useState<Form>(EMPTY);
  const [saved, setSaved] = useState<Form>(EMPTY);
  const [cats, setCats] = useState<{ id: string; name: string; published: boolean }[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [deleting, setDeleting] = useState(false);
  const [busyDelete, setBusyDelete] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setLoadError(null);
    const c = await supabase.from('sd_categories').select('id,name,published').order('sort_order');
    if (c.error) {
      setLoadError('Categories could not be loaded. ' + dbError(c.error));
      setLoading(false);
      return;
    }
    setCats(c.data);
    if (id) {
      const { data, error } = await supabase.from('sd_products').select('*').eq('id', id).maybeSingle();
      if (error || !data) {
        setLoadError(error ? 'The product could not be loaded. ' + dbError(error) : 'This product does not exist. It may have been deleted.');
        setLoading(false);
        return;
      }
      const f: Form = {
        name: data.name, slug: data.slug, sku: data.sku, category_id: data.category_id,
        price: String(Number(data.price)), discount_price: data.discount_price === null ? '' : String(Number(data.discount_price)),
        stock: String(data.stock), low_stock_threshold: String(data.low_stock_threshold),
        summary: data.summary ?? '', description: data.description ?? '',
        features: (data.features ?? []).join('\n'), in_the_box: (data.in_the_box ?? []).join('\n'),
        featured: data.featured, published: data.published,
      };
      setForm(f);
      setSaved(f);
    } else {
      setForm((f) => ({ ...f, category_id: c.data[0]?.id ?? '' }));
      setSaved((f) => ({ ...f, category_id: c.data[0]?.id ?? '' }));
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === 'name' && !slugTouched) next.slug = slugify(String(v));
      return next;
    });
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    const err = validate(form);
    setErrors(err);
    if (Object.keys(err).length) {
      toast('error', 'Check the highlighted fields.');
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setSaving(true);
    const payload = toPayload(form);
    const res = isNew
      ? await supabase.from('sd_products').insert(payload).select('id').single()
      : await supabase.from('sd_products').update(payload).eq('id', id!).select('id').single();
    setSaving(false);
    if (res.error) {
      const msg = dbError(res.error, 'product');
      if (/slug/.test(msg)) setErrors({ slug: msg });
      if (/SKU/.test(msg)) setErrors({ sku: msg });
      return toast('error', msg);
    }
    setSaved(form);
    if (isNew) {
      toast('success', `“${payload.name}” was created. Add its images below.`);
      navigate(`/admin/products/${res.data.id}`, { replace: true });
    } else {
      toast('success', 'Changes saved.');
    }
  };

  const confirmDelete = async () => {
    if (!supabase || !id) return;
    setBusyDelete(true);
    const imgs = await supabase.from('sd_product_images').select('storage_path').eq('product_id', id);
    const { error } = await supabase.from('sd_products').delete().eq('id', id).select('id').single();
    if (error) {
      setBusyDelete(false);
      return toast('error', dbError(error, 'product'));
    }
    await removeFiles((imgs.data ?? []).map((i) => i.storage_path));
    toast('success', `“${saved.name}” was deleted.`);
    setSaved(form); // nothing left to protect
    navigate('/admin/products', { replace: true });
  };

  if (loading) return <div role="status" className="mx-auto max-w-5xl text-slate">Loading…</div>;
  if (loadError)
    return (
      <div className="mx-auto max-w-5xl">
        <LoadError message={loadError} onRetry={load} />
        <Link to="/admin/products" className="mt-4 inline-block font-semibold text-teal-700 underline">
          Back to products
        </Link>
      </div>
    );

  const category = cats.find((c) => c.id === form.category_id);

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/admin/products" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All products
      </Link>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl font-semibold text-ink">{isNew ? 'Add product' : saved.name || 'Edit product'}</h1>
        {!isNew && saved.published && (
          <a href={`/store/${saved.slug}`} target="_blank" rel="noreferrer" className={buttonClass('outline', 'sm')}>
            <ExternalLink className="h-4 w-4" aria-hidden /> View in store
          </a>
        )}
      </div>

      <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-6">
        <Card title="Basics" id="basics">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextField id="pf-name" label="Product name" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} maxLength={120} />
            </div>
            <TextField
              id="pf-slug"
              label="Web address (slug)"
              hint={`Shown as /store/${form.slug || 'your-product'}. Changing it breaks old links.`}
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'));
              }}
              error={errors.slug}
              maxLength={80}
            />
            <TextField id="pf-sku" label="SKU" hint="Your stock code, e.g. SD-MON-001" value={form.sku} onChange={(e) => set('sku', e.target.value.toUpperCase().replace(/\s+/g, '-'))} error={errors.sku} maxLength={40} />
            <SelectField id="pf-category" label="Category" value={form.category_id} onChange={(e) => set('category_id', e.target.value)} error={errors.category_id} hint={category && !category.published ? 'This category is hidden, so its products are hidden too.' : undefined}>
              {cats.length === 0 && <option value="">Create a category first</option>}
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.published ? '' : ' (hidden)'}
                </option>
              ))}
            </SelectField>
          </div>
        </Card>

        <Card title="Price and stock" id="pricing">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <TextField id="pf-price" label="Price (₹)" inputMode="decimal" value={form.price} onChange={(e) => set('price', e.target.value.replace(/[^\d.]/g, ''))} error={errors.price} />
            <TextField id="pf-discount" label="Sale price (₹)" optional inputMode="decimal" hint="Lower than the price" value={form.discount_price} onChange={(e) => set('discount_price', e.target.value.replace(/[^\d.]/g, ''))} error={errors.discount_price} />
            <TextField id="pf-stock" label="In stock" inputMode="numeric" hint="0 = out of stock" value={form.stock} onChange={(e) => set('stock', e.target.value.replace(/\D/g, ''))} error={errors.stock} />
            <TextField id="pf-threshold" label="Low-stock alert at" inputMode="numeric" hint="Shown on the dashboard" value={form.low_stock_threshold} onChange={(e) => set('low_stock_threshold', e.target.value.replace(/\D/g, ''))} error={errors.low_stock_threshold} />
          </div>
        </Card>

        <Card title="Description" id="description">
          <div className="grid gap-5">
            <TextField id="pf-summary" label="Short summary" hint={`Shown on product cards. ${form.summary.length}/200`} value={form.summary} onChange={(e) => set('summary', e.target.value)} error={errors.summary} />
            <TextArea id="pf-description" label="Full description" rows={5} value={form.description} onChange={(e) => set('description', e.target.value)} error={errors.description} hint={`${form.description.length}/4000`} />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextArea id="pf-features" label="Features" optional rows={5} hint="One per line" value={form.features} onChange={(e) => set('features', e.target.value)} error={errors.features} />
              <TextArea id="pf-box" label="In the box" optional rows={5} hint="One per line" value={form.in_the_box} onChange={(e) => set('in_the_box', e.target.value)} error={errors.in_the_box} />
            </div>
          </div>
        </Card>

        <Card title="Visibility" id="visibility">
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-10">
            <div>
              <Toggle checked={form.published} onChange={(v) => set('published', v)} label="Published in the store" />
              <p className="mt-1 pl-[54px] text-sm text-slate">Off = hidden from visitors and cannot be ordered.</p>
            </div>
            <div>
              <Toggle checked={form.featured} onChange={(v) => set('featured', v)} label="Featured" />
              <p className="mt-1 pl-[54px] text-sm text-slate">Shown first, including on the home page.</p>
            </div>
          </div>
        </Card>

        <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-5">
          <button type="submit" disabled={saving || (!isNew && !dirty)} className={buttonClass('primary', 'md')}>
            {saving && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />}
            {isNew ? 'Create product' : 'Save changes'}
          </button>
          <span className={cx('text-sm', dirty ? 'font-medium text-ink' : 'text-slate')} aria-live="polite">
            {dirty ? 'You have unsaved changes.' : isNew ? '' : 'All changes saved.'}
          </span>
          {!isNew && (
            <button type="button" onClick={() => setDeleting(true)} className="ml-auto inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-[#B3261E] hover:bg-[#B3261E]/10">
              <Trash2 className="h-4 w-4" aria-hidden /> Delete product
            </button>
          )}
        </div>
      </form>

      <div className="mt-6">
        {isNew ? (
          <Card title="Images" id="images">
            <p className="text-[15px] text-slate">Create the product first, then you can add its images here.</p>
          </Card>
        ) : (
          <ProductImages productId={id!} productName={saved.name} />
        )}
      </div>

      <ConfirmDialog open={deleting} title={`Delete “${saved.name}”?`} confirmLabel="Delete product" busy={busyDelete} onConfirm={confirmDelete} onCancel={() => setDeleting(false)}>
        This removes the product and its images. Past orders keep their own copy of the name and price. This cannot be undone.
      </ConfirmDialog>
    </div>
  );
}
