import { useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { ILLUSTRATION } from '@/data/img';
import { Img } from '@/components/Img';
import { Breadcrumbs } from '@/components/PageHeader';
import { EmptyState, LinkButton, Notice, QuantityStepper, TextField, buttonClass } from '@/components/ui';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useCart, type CartLine } from '@/state/cart';
import { formatPrice } from '@/lib/format';
import { isBlank, isEmail, isPhone, isPinCode, type Errors } from '@/lib/validation';
import { submitEnquiry } from '@/services/enquiry';

function Summary({ subtotal, count, children }: { subtotal: number; count: number; children?: React.ReactNode }) {
  return (
    <div className="rounded-[28px] bg-white p-6 shadow-card ring-1 ring-line/60">
      <h2 className="font-display text-2xl font-semibold text-ink">Order summary</h2>
      <dl className="mt-5 space-y-2.5 text-[15px]">
        <div className="flex justify-between">
          <dt className="text-slate">
            Items ({count})
          </dt>
          <dd className="font-medium" data-testid="subtotal">
            {formatPrice(subtotal)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate">Delivery</dt>
          <dd className="text-slate">Not available in demo</dd>
        </div>
        <div className="flex justify-between border-t border-line/70 pt-3 text-lg">
          <dt className="font-semibold">Total (demo)</dt>
          <dd className="font-semibold" data-testid="total">
            {formatPrice(subtotal)}
          </dd>
        </div>
      </dl>
      {children}
    </div>
  );
}

export function Cart() {
  usePageMeta({ title: 'Your cart', description: 'Review the items in your demo cart.' });
  const { lines, count, subtotal, setQty, remove } = useCart();

  return (
    <section className="container-x py-10">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Store', to: '/store' }, { label: 'Cart' }]} />
      <h1 className="font-display text-4xl font-semibold text-ink">Your cart</h1>
      {lines.length === 0 ? (
        <EmptyState image={ILLUSTRATION.emptyCart} title="Your cart is empty" body="Browse the store and add the essentials you need. Items stay in your cart on this device." action={<LinkButton to="/store">Browse the store</LinkButton>} />
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <ul className="divide-y divide-line/70 rounded-[28px] bg-white px-5 shadow-card ring-1 ring-line/60 sm:px-7">
            {lines.map((l) => (
              <li key={l.product.slug} className="flex gap-4 py-5" data-testid="cart-line">
                <Link to={`/store/${l.product.slug}`} className="shrink-0 overflow-hidden rounded-2xl bg-mist">
                  <Img image={l.product.images[0]} sizes="112px" className="h-24 w-24 object-cover sm:h-28 sm:w-28" />
                </Link>
                <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Link to={`/store/${l.product.slug}`} className="font-semibold text-ink hover:underline">
                      {l.product.name}
                    </Link>
                    <p className="text-sm text-slate">{formatPrice(l.product.price)} each</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <QuantityStepper value={l.qty} onChange={(n) => setQty(l.product.slug, n)} label={`Quantity of ${l.product.name}`} />
                    <p className="w-20 text-right font-semibold" data-testid="line-total">
                      {formatPrice(l.lineTotal)}
                    </p>
                    <button type="button" onClick={() => remove(l.product.slug)} className="flex h-10 w-10 items-center justify-center rounded-full text-slate hover:bg-mist hover:text-ink" aria-label={`Remove ${l.product.name}`}>
                      <Trash2 className="h-5 w-5" aria-hidden />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-4">
            <Summary subtotal={subtotal} count={count}>
              <LinkButton to="/checkout" size="lg" className="mt-6 w-full">
                Continue to demo checkout
              </LinkButton>
            </Summary>
            <Notice>Demo store: prices are illustrative and no order will be fulfilled.</Notice>
          </div>
        </div>
      )}
    </section>
  );
}

interface Details {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  pin: string;
}

export function Checkout() {
  usePageMeta({ title: 'Demo checkout', description: 'A simulated checkout. No payment details are collected.' });
  const { lines, count, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const [d, setD] = useState<Details>({ name: '', phone: '', email: '', address: '', city: '', pin: '' });
  const [errors, setErrors] = useState<Errors<Details>>({});
  const formRef = useRef<HTMLFormElement>(null);

  if (lines.length === 0) {
    return (
      <section className="container-x py-10">
        <EmptyState image={ILLUSTRATION.emptyCart} title="There’s nothing to check out" body="Your cart is empty. Add something from the store first." action={<LinkButton to="/store">Browse the store</LinkButton>} />
      </section>
    );
  }

  const set = (k: keyof Details, v: string) => {
    setD((x) => ({ ...x, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const err: Errors<Details> = {};
    if (isBlank(d.name)) err.name = 'Enter your full name.';
    if (!isPhone(d.phone)) err.phone = 'Enter a 10-digit mobile number, or an international number starting with +.';
    if (!isBlank(d.email) && !isEmail(d.email)) err.email = 'Enter an email address like name@example.com, or leave it empty.';
    if (isBlank(d.address)) err.address = 'Enter a delivery address.';
    if (isBlank(d.city)) err.city = 'Enter a town or city.';
    if (!isPinCode(d.pin)) err.pin = 'Enter a 6-digit PIN code.';
    setErrors(err);
    if (Object.keys(err).length) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    const reference = `DEMO-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    const snapshot: CartLine[] = lines.map((l) => ({ ...l }));
    await submitEnquiry('order', { reference, customer: d, lines: snapshot.map((l) => ({ slug: l.product.slug, qty: l.qty, lineTotal: l.lineTotal })), subtotal });
    clear();
    navigate('/order-confirmation', { replace: true, state: { reference, name: d.name, lines: snapshot, subtotal } });
  };

  return (
    <section className="container-x py-10">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Cart', to: '/cart' }, { label: 'Demo checkout' }]} />
      <h1 className="font-display text-4xl font-semibold text-ink">Demo checkout</h1>
      <Notice className="mt-5 max-w-3xl">This checkout is simulated. No payment is taken and no card details are requested. Placing the order shows a demo confirmation only.</Notice>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <form ref={formRef} noValidate onSubmit={onSubmit} className="rounded-[28px] bg-white p-6 shadow-card ring-1 ring-line/60 sm:p-9">
          <h2 className="font-display text-2xl font-semibold text-ink">Contact and delivery</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextField id="co-name" label="Full name" autoComplete="name" value={d.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
            </div>
            <TextField id="co-phone" label="Mobile number" type="tel" inputMode="tel" autoComplete="tel" value={d.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} />
            <TextField id="co-email" label="Email" type="email" autoComplete="email" optional value={d.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
            <div className="sm:col-span-2">
              <TextField id="co-address" label="Address" autoComplete="street-address" value={d.address} onChange={(e) => set('address', e.target.value)} error={errors.address} />
            </div>
            <TextField id="co-city" label="Town or city" autoComplete="address-level2" value={d.city} onChange={(e) => set('city', e.target.value)} error={errors.city} />
            <TextField id="co-pin" label="PIN code" inputMode="numeric" autoComplete="postal-code" maxLength={6} value={d.pin} onChange={(e) => set('pin', e.target.value)} error={errors.pin} />
          </div>
          <div className="mt-8 rounded-2xl bg-mist p-5">
            <h2 className="font-semibold text-ink">Payment</h2>
            <p className="mt-1 text-[15px] text-slate">Not collected in this demo. A live store would hand over to a certified payment provider at this step.</p>
          </div>
          <button type="submit" className={buttonClass('primary', 'lg', 'mt-8 w-full sm:w-auto')}>
            Place demo order
          </button>
        </form>
        <Summary subtotal={subtotal} count={count}>
          <ul className="mt-5 space-y-3 border-t border-line/70 pt-4">
            {lines.map((l) => (
              <li key={l.product.slug} className="flex justify-between gap-3 text-[15px]">
                <span className="text-slate">
                  {l.product.name} × {l.qty}
                </span>
                <span className="font-medium">{formatPrice(l.lineTotal)}</span>
              </li>
            ))}
          </ul>
        </Summary>
      </div>
    </section>
  );
}

interface ConfirmationState {
  reference: string;
  name: string;
  lines: CartLine[];
  subtotal: number;
}

export function OrderConfirmation() {
  usePageMeta({ title: 'Demo order confirmation', description: 'A simulated order confirmation.' });
  const state = useLocation().state as ConfirmationState | null;

  if (!state) {
    return (
      <section className="container-x py-10">
        <EmptyState image={ILLUSTRATION.emptyCart} title="No demo order to show" body="Confirmations appear here right after you place a demo order." action={<LinkButton to="/store">Go to the store</LinkButton>} />
      </section>
    );
  }

  return (
    <section className="container-x py-12">
      <div className="mx-auto max-w-2xl rounded-[28px] bg-white p-7 text-center shadow-card ring-1 ring-line/60 sm:p-10">
        <img src={ILLUSTRATION.orderPlaced} alt="" width={480} height={360} className="mx-auto h-auto w-56" />
        <p className="mt-4 inline-flex rounded-full bg-signal/25 px-3 py-1 text-sm font-semibold text-ink">Simulated order</p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-ink">Demo order placed</h1>
        <p className="mx-auto mt-3 max-w-md text-slate">Thanks, {state.name}. This confirmation is simulated: nothing will be delivered and no payment was taken.</p>
        <p className="mt-5 text-sm text-slate">
          Demo reference <span className="font-semibold text-ink" data-testid="order-ref">{state.reference}</span>
        </p>
        <ul className="mx-auto mt-6 max-w-md space-y-2 rounded-2xl bg-mist p-5 text-left text-[15px]">
          {state.lines.map((l) => (
            <li key={l.product.slug} className="flex justify-between gap-3">
              <span className="text-slate">
                {l.product.name} × {l.qty}
              </span>
              <span className="font-medium">{formatPrice(l.lineTotal)}</span>
            </li>
          ))}
          <li className="flex justify-between border-t border-line/70 pt-2 font-semibold">
            <span>Total (demo)</span>
            <span data-testid="confirm-total">{formatPrice(state.subtotal)}</span>
          </li>
        </ul>
        <LinkButton to="/store" className="mt-8">
          Continue browsing
        </LinkButton>
      </div>
    </section>
  );
}
