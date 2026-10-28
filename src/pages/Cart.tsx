import { useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Loader2, MessageCircle, Trash2 } from 'lucide-react';
import { ILLUSTRATION } from '@/data/img';
import { Img } from '@/components/Img';
import { Breadcrumbs } from '@/components/PageHeader';
import { EmptyState, LinkButton, Notice, QuantityStepper, TextField, buttonClass } from '@/components/ui';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useCart, type CartLine } from '@/state/cart';
import { formatPrice } from '@/lib/format';
import { isBlank, isEmail, isPhone, isPinCode, type Errors } from '@/lib/validation';
import { ordersSource, placeOrder } from '@/services/orders';
import { whatsappUrl } from '@/services/contact';
import { hello } from '@/config/live';
import { useCatalog } from '@/state/catalog';
import { CatalogError, ProductGridSkeleton } from '@/components/store';

/** Loading / error states shared by the cart and checkout. */
function useCartGate() {
  const { status } = useCatalog(true);
  if (status === 'loading' || status === 'idle') return <ProductGridSkeleton count={2} />;
  if (status === 'error') return <CatalogError className="mt-6" />;
  return null;
}

function Summary({ subtotal, count, children }: { subtotal: number; count: number; children?: React.ReactNode }) {
  return (
    <div className="surface rounded-[28px] p-6">
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
          <dd className="text-slate">{ordersSource === 'database' ? 'Agreed when the team calls' : 'Not available in demo'}</dd>
        </div>
        <div className="flex justify-between border-t border-line/70 pt-3 text-lg">
          <dt className="font-semibold">{ordersSource === 'database' ? 'Total' : 'Total (demo)'}</dt>
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
  const { lines, missing, hasProblems, count, subtotal, setQty, remove } = useCart();
  const gate = useCartGate();

  return (
    <section className="container-x py-10">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Store', to: '/store' }, { label: 'Cart' }]} />
      <h1 className="font-display text-4xl font-semibold text-ink">Your cart</h1>
      {gate ?? (lines.length === 0 && missing.length === 0 ? (
        <EmptyState image={ILLUSTRATION.emptyCart} title="Your cart is empty" body="Browse the store and add the essentials you need. Items stay in your cart on this device." action={<LinkButton to="/store">Browse the store</LinkButton>} />
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <ul className="glass-panel divide-y divide-line/70 rounded-[28px] px-5 sm:px-7">
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
                    <p className="text-sm text-slate">{formatPrice(l.unitPrice)} each</p>
                    {l.issue && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-[#B3261E]" data-testid="line-issue">
                        <AlertTriangle className="h-4 w-4" aria-hidden />
                        {l.issue === 'out-of-stock' ? 'Out of stock. Remove it to continue.' : `Only ${l.maxQty} available. Lower the quantity to continue.`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {l.issue !== 'out-of-stock' && <QuantityStepper value={l.qty} onChange={(n) => setQty(l.product.slug, n)} max={Math.max(1, l.maxQty)} label={`Quantity of ${l.product.name}`} />}
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
            {missing.map((m) => (
              <li key={m.slug} className="flex items-center justify-between gap-4 py-5" data-testid="cart-missing">
                <p className="flex items-center gap-2 text-[15px] text-ink">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-[#B3261E]" aria-hidden />
                  An item in your cart is no longer available.
                </p>
                <button type="button" onClick={() => remove(m.slug)} className={buttonClass('outline', 'sm')}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-4">
            <Summary subtotal={subtotal} count={count}>
              {hasProblems ? (
                <p role="alert" className="mt-6 rounded-2xl bg-[#B3261E]/10 p-4 text-sm font-medium text-ink">
                  Fix the items marked in your cart before checking out.
                </p>
              ) : (
                <LinkButton to="/checkout" size="lg" className="mt-6 w-full">
                  Continue to demo checkout
                </LinkButton>
              )}
            </Summary>
            <Notice>Demo store: prices are illustrative and no order will be fulfilled.</Notice>
          </div>
        </div>
      ))}
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
  const live = ordersSource === 'database';
  usePageMeta(live ? { title: 'Checkout', description: 'Send your order. No payment details are collected online.' } : { title: 'Demo checkout', description: 'A simulated checkout. No payment details are collected.' });
  const { lines, missing, hasProblems, count, subtotal, clear } = useCart();
  const { reload } = useCatalog();
  const gate = useCartGate();
  const navigate = useNavigate();
  const [d, setD] = useState<Details>({ name: '', phone: '', email: '', address: '', city: '', pin: '' });
  const [errors, setErrors] = useState<Errors<Details>>({});
  const [serverError, setServerError] = useState<{ message: string; stock: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [trap, setTrap] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  if (gate) return <section className="container-x py-10">{gate}</section>;
  if (lines.length === 0 && missing.length === 0) {
    return (
      <section className="container-x py-10">
        <EmptyState image={ILLUSTRATION.emptyCart} title="There’s nothing to check out" body="Your cart is empty. Add something from the store first." action={<LinkButton to="/store">Browse the store</LinkButton>} />
      </section>
    );
  }
  // Never let an unavailable or over-stock item through to an order.
  if (hasProblems) {
    return (
      <section className="container-x py-10">
        <EmptyState image={ILLUSTRATION.emptyCart} title="Some items in your cart need attention" body="A product is out of stock, no longer sold, or you asked for more than is available. Review your cart to continue." action={<LinkButton to="/cart">Review your cart</LinkButton>} />
      </section>
    );
  }

  const set = (k: keyof Details, v: string) => {
    setD((x) => ({ ...x, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const err: Errors<Details> = {};
    if (isBlank(d.name) || d.name.trim().length < 2) err.name = 'Enter your full name.';
    if (!isPhone(d.phone)) err.phone = 'Enter a 10-digit mobile number, or an international number starting with +.';
    if (!isBlank(d.email) && !isEmail(d.email)) err.email = 'Enter an email address like name@example.com, or leave it empty.';
    if (isBlank(d.address) || d.address.trim().length < 3) err.address = 'Enter a delivery address.';
    else if (d.address.length > 300) err.address = 'Keep the address to 300 characters.';
    if (isBlank(d.city) || d.city.trim().length < 2) err.city = 'Enter a town or city.';
    if (!isPinCode(d.pin)) err.pin = 'Enter a 6-digit PIN code.';
    setErrors(err);
    setServerError(null);
    if (Object.keys(err).length) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    if (hasProblems) return;
    const snapshot: CartLine[] = lines.map((l) => ({ ...l }));
    // a filled-in hidden field means an automated form filler: pretend it worked, send nothing
    if (trap) {
      clear();
      navigate('/order-confirmation', { replace: true, state: { reference: 'ORD-RECEIVED', name: d.name, phone: d.phone, lines: snapshot, subtotal, live } });
      return;
    }
    setBusy(true);
    const res = await placeOrder({ ...d, name: d.name.trim(), items: snapshot.map((l) => ({ slug: l.product.slug, qty: l.qty })) });
    setBusy(false);
    if (res.mode === 'error') {
      // Stock is reloaded when they go back to the cart: reloading here would replace this message.
      setServerError({ message: res.message, stock: res.stock });
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    clear();
    const total = res.mode === 'saved' ? res.subtotal : subtotal;
    navigate('/order-confirmation', { replace: true, state: { reference: res.reference, name: d.name.trim(), phone: d.phone, lines: snapshot, subtotal: total, pricesChanged: res.mode === 'saved' && Math.abs(res.subtotal - subtotal) > 0.009, live: res.mode === 'saved' } });
  };

  return (
    <section className="container-x py-10">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Cart', to: '/cart' }, { label: live ? 'Checkout' : 'Demo checkout' }]} />
      <h1 className="font-display text-4xl font-semibold text-ink">{live ? 'Checkout' : 'Demo checkout'}</h1>
      <Notice className="mt-5 max-w-3xl">
        {live
          ? 'No payment is taken online and no card details are requested. After you send the order, the team calls you to confirm it and arrange payment and delivery.'
          : 'This checkout is simulated. No payment is taken and no card details are requested. Placing the order shows a demo confirmation only.'}
      </Notice>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <form ref={formRef} noValidate onSubmit={onSubmit} className="glass-panel rounded-[28px] p-6 sm:p-9">
          {serverError && (
            <div ref={errorRef} tabIndex={-1} role="alert" id="order-error" className="mb-6 flex gap-3 rounded-2xl bg-coral/10 p-4 text-[15px] text-ink outline-none ring-1 ring-coral/40">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-coral" aria-hidden />
              <div>
                <p className="font-semibold">Your order was not sent</p>
                <p className="mt-1">{serverError.message}</p>
                {serverError.stock && (
                  <Link to="/cart" onClick={reload} className="mt-2 inline-block font-semibold text-teal-700 underline underline-offset-2">
                    Review your cart
                  </Link>
                )}
              </div>
            </div>
          )}
          <h2 className="font-display text-2xl font-semibold text-ink">Contact and delivery</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextField id="co-name" label="Full name" autoComplete="name" maxLength={100} value={d.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
            </div>
            <TextField id="co-phone" label="Mobile number" type="tel" inputMode="tel" autoComplete="tel" value={d.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} hint={live ? 'The team calls this number to confirm your order.' : undefined} />
            <TextField id="co-email" label="Email" type="email" autoComplete="email" optional value={d.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
            <div className="sm:col-span-2">
              <TextField id="co-address" label="Address" autoComplete="street-address" maxLength={300} value={d.address} onChange={(e) => set('address', e.target.value)} error={errors.address} />
            </div>
            <TextField id="co-city" label="Town or city" autoComplete="address-level2" maxLength={80} value={d.city} onChange={(e) => set('city', e.target.value)} error={errors.city} />
            <TextField id="co-pin" label="PIN code" inputMode="numeric" autoComplete="postal-code" maxLength={6} value={d.pin} onChange={(e) => set('pin', e.target.value)} error={errors.pin} />
            <div className="sr-only" aria-hidden="true">
              <label htmlFor="co-website">Leave this empty</label>
              <input id="co-website" name="website" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
            </div>
          </div>
          <div className="mt-8 rounded-2xl bg-mist p-5">
            <h2 className="font-semibold text-ink">Payment</h2>
            <p className="mt-1 text-[15px] text-slate">
              {live ? 'Nothing is charged now. The team confirms the total with you on the phone and explains how to pay.' : 'Not collected in this demo. A live store would hand over to a certified payment provider at this step.'}
            </p>
          </div>
          <button type="submit" disabled={busy} className={buttonClass('primary', 'lg', 'mt-8 w-full sm:w-auto')}>
            {busy && <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden />}
            {live ? (busy ? 'Sending your order…' : 'Send order') : 'Place demo order'}
          </button>
          {live && <p className="mt-3 text-sm text-slate">Prices and stock are checked again when you send the order.</p>}
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
  phone?: string;
  lines: CartLine[];
  subtotal: number;
  pricesChanged?: boolean;
  live?: boolean;
}

export function OrderConfirmation() {
  const state = useLocation().state as ConfirmationState | null;
  const live = Boolean(state?.live);
  usePageMeta(live ? { title: 'Order received', description: 'Your order has been received.' } : { title: 'Demo order confirmation', description: 'A simulated order confirmation.' });

  if (!state) {
    return (
      <section className="container-x py-10">
        <EmptyState image={ILLUSTRATION.emptyCart} title={ordersSource === 'database' ? 'No order to show' : 'No demo order to show'} body={ordersSource === 'database' ? 'Confirmations appear here right after you send an order.' : 'Confirmations appear here right after you place a demo order.'} action={<LinkButton to="/store">Go to the store</LinkButton>} />
      </section>
    );
  }

  return (
    <section className="container-x py-12">
      <div className="glass-panel mx-auto max-w-2xl rounded-[28px] p-7 text-center sm:p-10">
        <img src={ILLUSTRATION.orderPlaced} alt="" width={480} height={360} className="mx-auto h-auto w-56" />
        {!live && <p className="mt-4 inline-flex rounded-full bg-signal/25 px-3 py-1 text-sm font-semibold text-ink">Simulated order</p>}
        <h1 className="mt-3 font-display text-4xl font-semibold text-ink">{live ? 'Order received' : 'Demo order placed'}</h1>
        <p className="mx-auto mt-3 max-w-md text-slate">
          {live
            ? `Thanks, ${state.name}. The team will call you${state.phone ? ` on ${state.phone}` : ''} to confirm your order and arrange payment and delivery. Nothing has been charged.`
            : `Thanks, ${state.name}. This confirmation is simulated: nothing will be delivered and no payment was taken.`}
        </p>
        <p className="mt-5 text-sm text-slate">
          {live ? 'Order reference' : 'Demo reference'} <span className="font-semibold text-ink" data-testid="order-ref">{state.reference}</span>
        </p>
        <ul className="mx-auto mt-6 max-w-md space-y-2 rounded-2xl bg-mist p-5 text-left text-[15px]">
          {state.lines.map((l) => (
            <li key={l.product.slug} className="flex justify-between gap-3">
              <span className="text-slate">
                {l.product.name} × {l.qty}
              </span>
              {!state.pricesChanged && <span className="font-medium">{formatPrice(l.lineTotal)}</span>}
            </li>
          ))}
          <li className="flex justify-between border-t border-line/70 pt-2 font-semibold">
            <span>{live ? 'Total' : 'Total (demo)'}</span>
            <span data-testid="confirm-total">{formatPrice(state.subtotal)}</span>
          </li>
        </ul>
        {state.pricesChanged && <p className="mx-auto mt-3 max-w-md text-sm text-slate">A price changed while you were shopping, so the total above is the current one. The team will confirm it with you.</p>}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <LinkButton to="/store">Continue browsing</LinkButton>
          {live && (
            <a href={whatsappUrl(`${hello()}, I have a question about my order ${state.reference}.`)} target="_blank" rel="noreferrer" className={buttonClass('outline', 'md')}>
              <MessageCircle className="h-4 w-4" aria-hidden /> Ask about this order
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
