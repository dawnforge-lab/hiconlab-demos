// Page behaviour that does not need WebGL: loader, flavour choice, the fizz clock,
// the buy form, the basket and the still-image fallback. scene.js talks to this
// file through window.Upwich and the "upwich:flavour" event.
import { FLAVOURS, WEIGHTS, PRICES } from './data.js';

const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const money = (n) => '£' + n.toFixed(2);
const state = { flavour: 'lemon', plan: 'once', qty: 1, basket: [], fallback: false };

// ---- Ready promise for the tour ----------------------------------------------------
let resolveReady;
const ready = new Promise((r) => { resolveReady = r; });
if (window.HiconTour) window.HiconTour.ready(() => ready);

// ---- Loader ------------------------------------------------------------------------------
const loader = $('#loader');
const pct = $('.loader__pct', loader);
function progress(p) {
  pct.textContent = Math.round(p * 100) + '%';
  loader.style.setProperty('--fill', p.toFixed(3));
}
function loaded() {
  root.classList.add('is-loaded');
  $('.loader__label', loader).textContent = 'Ready';
  pct.textContent = '';
  setTimeout(() => { loader.hidden = true; }, reduced ? 50 : 900);
}

// ---- Fallback: stills rendered from the same scene -------------------------------------
const still = $('#still');
let currentPose = 'hero';
function stillFor(pose) {
  const name = FLAVOURS[state.flavour].name;
  if (pose === 'label') return { src: 'assets/img/still-label.webp', alt: 'The back of the Upwich tube, with the nutrition panel and directions' };
  if (pose === 'inside') return { src: 'assets/img/still-inside.webp', alt: 'The Upwich tube open, its cap and spring lifted off and the top tablets fanned out above it' };
  if (pose === 'fizz') return { src: 'assets/img/still-fizz.webp', alt: 'An Upwich tablet fizzing at the bottom of a glass of water, next to the tube' };
  return { src: `assets/img/still-hero-${state.flavour}.webp`, alt: `A tube of Upwich ${name} electrolyte tablets` };
}
function showStill() {
  if (!state.fallback) return;
  const s = stillFor(currentPose);
  if (still.getAttribute('src') !== s.src) still.src = s.src;
  still.alt = s.alt;
  root.dataset.pose = currentPose;
}
function useFallback() {
  state.fallback = true;
  root.classList.add('no-webgl', 'is-loaded');
  loader.hidden = true;
  still.hidden = false;
  showStill();
  fizz(1, 1);
  resolveReady();
}

// ---- Ingredients by weight -----------------------------------------------------------------
const weights = $('#weights');
const maxW = WEIGHTS[0][1];
weights.innerHTML = WEIGHTS.map(([n, g]) => `
  <tr><th scope="row">${n === 'Natural flavouring' ? `Natural flavouring <span class="weights__fl" data-flavouring></span>` : n}</th>
  <td class="weights__bar"><span style="--w:${(g / maxW).toFixed(3)}"></span></td><td>${g.toFixed(2)}</td></tr>`).join('');
const total = WEIGHTS.reduce((a, [, g]) => a + g, 0);
if (Math.abs(total - 5) > 0.001) console.warn('Tablet weights do not add up to 5.00 g:', total);

// ---- Scroll: active section, header, copy fades -------------------------------------------
const sections = $$('[data-pose]');
const phone = matchMedia('(max-width: 760px), (orientation: portrait) and (max-width: 1024px)');
const faders = sections.map((s) => ({ section: s, els: $$('.copy', s) }));
// On wide screens copy fades out only once most of it has left the screen: any block
// with 40% or more of itself in view stays fully opaque, so every stop is readable.
const masthead = $('.masthead');
function fadeCopy() {
  const vh = innerHeight;
  const top = masthead.offsetHeight;
  faders.forEach((f) => {
    f.els.forEach((el) => {
      let o = 1;
      if (!phone.matches && !state.fallback) {
        const r = el.getBoundingClientRect();
        const seen = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, top));
        const frac = seen / Math.max(1, Math.min(r.height, vh - top));
        o = Math.min(1, Math.max(0, (frac - 0.08) / 0.32));
      }
      el.style.setProperty('--copy-o', o.toFixed(3));
    });
  });
}
// The fixed stage scrolls up with the footer, so the footer never cuts through the product.
const stageEl = $('#stage'), footer = $('.footer');
function liftStage() {
  const lift = phone.matches ? 0 : Math.max(0, innerHeight - footer.getBoundingClientRect().top);
  stageEl.style.transform = lift ? `translate3d(0, ${-lift}px, 0)` : '';
}
function onScroll() {
  fadeCopy();
  liftStage();
  const mid = innerHeight * 0.5;
  let active = sections[0];
  sections.forEach((s) => { if (s.getBoundingClientRect().top <= mid) active = s; });
  root.classList.toggle('is-scrolled', scrollY > 30);
  $$('.masthead__nav a').forEach((a) => {
    const on = a.getAttribute('href') === '#' + active.id;
    a.classList.toggle('is-active', on);
    if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
  });
  if (active.dataset.pose !== currentPose) { currentPose = active.dataset.pose; showStill(); }
  if (state.fallback) {
    const r = $('#fizz').getBoundingClientRect();
    const q = Math.min(1, Math.max(0, (innerHeight * 0.15 - r.top) / Math.max(1, r.height - innerHeight)));
    fizz(q > 0.05 ? 1 : 0, Math.min(1, Math.max(0, (q - 0.3) / 0.6)));
  }
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll);

// ---- Fizz clock --------------------------------------------------------------------------
const clockTime = $('#clock-time'), clockState = $('#clock-state'), clockFill = $('#clock-fill');
function fizz(drop, z) {
  const s = Math.round(z * 120);
  clockTime.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  clockFill.style.setProperty('--p', z.toFixed(3));
  clockState.textContent = drop < 0.5 ? 'Scroll to drop it in' : z < 0.985 ? 'Fizzing' : 'Ready to drink';
  $('.clock').classList.toggle('is-done', z >= 0.985);
}

// ---- Flavour ---------------------------------------------------------------------------------
const showing = $('#showing');
function setFlavour(key, from) {
  if (!FLAVOURS[key]) return;
  const f = FLAVOURS[key];
  state.flavour = key;
  $$(`input[name="flavour"][value="${key}"], input[name="buy-flavour"][value="${key}"]`).forEach((r) => { r.checked = true; });
  showing.textContent = f.name;
  root.style.setProperty('--fl', f.tube);
  root.style.setProperty('--fl-wash', f.wash);
  root.style.setProperty('--fl-deep', f.tubeDeep);
  root.dataset.flavour = key;
  $$('[data-flavouring]').forEach((el) => { el.textContent = f.name.toLowerCase().replace('&', 'and'); });
  updateBuy();
  showStill();
  window.dispatchEvent(new CustomEvent('upwich:flavour', { detail: { key, from } }));
}
$$('input[name="flavour"]').forEach((r) => r.addEventListener('change', () => r.checked && setFlavour(r.value, 'cards')));
$$('input[name="buy-flavour"]').forEach((r) => r.addEventListener('change', () => r.checked && setFlavour(r.value, 'buy')));

// ---- Buy form ---------------------------------------------------------------------------------
const qtyOut = $('#qty'), sum = $('#buy-sum'), addText = $('#add-text'), addBtn = $('#add');
function linePrice(plan, qty) { return PRICES[plan] * qty; }
function updateBuy() {
  const price = linePrice(state.plan, state.qty);
  qtyOut.value = qtyOut.textContent = String(state.qty);
  sum.textContent = `${state.qty * 20} tablets · ${money(price)}${state.plan === 'sub' ? ' every 4 weeks' : ''}`;
  addText.textContent = `Add to basket · ${money(price)}`;
  $('#qty-minus').disabled = state.qty <= 1;
  $('#qty-plus').disabled = state.qty >= 6;
}
$$('input[name="plan"]').forEach((r) => r.addEventListener('change', () => { if (r.checked) { state.plan = r.value; updateBuy(); } }));
$('#qty-minus').addEventListener('click', () => { state.qty = Math.max(1, state.qty - 1); updateBuy(); });
$('#qty-plus').addEventListener('click', () => { state.qty = Math.min(6, state.qty + 1); updateBuy(); });

let addedTimer = 0;
$('#buy-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const line = state.basket.find((l) => l.flavour === state.flavour && l.plan === state.plan);
  if (line) line.qty = Math.min(12, line.qty + state.qty);
  else state.basket.push({ flavour: state.flavour, plan: state.plan, qty: state.qty });
  renderBasket();
  addBtn.classList.add('is-added');
  clearTimeout(addedTimer);
  addedTimer = setTimeout(() => addBtn.classList.remove('is-added'), 2400);
  const count = $('#basket-count');
  count.classList.remove('is-bump');
  void count.offsetWidth;
  count.classList.add('is-bump');
  setTimeout(() => openBasket(addBtn), reduced ? 0 : 650);
});

// ---- Basket -------------------------------------------------------------------------------------
const basket = $('#basket');
const panel = $('.basket__panel', basket);
let returnFocus = null;
function totals() {
  const sub = state.basket.reduce((a, l) => a + linePrice(l.plan, l.qty), 0);
  const del = sub === 0 || sub >= PRICES.freeFrom ? 0 : PRICES.delivery;
  const tot = sub + del;
  return { sub, del, tot, vat: Math.round((tot / 6) * 100) / 100 };
}
function renderBasket() {
  const lines = $('#basket-lines');
  const n = state.basket.reduce((a, l) => a + l.qty, 0);
  $('#basket-count').textContent = String(n);
  $('#basket-count-text').textContent = n ? `, ${n} ${n === 1 ? 'tube' : 'tubes'}` : ', empty';
  root.classList.toggle('has-basket', n > 0);
  lines.innerHTML = state.basket.map((l, i) => {
    const f = FLAVOURS[l.flavour];
    return `<li class="line">
      <span class="line__chip" style="--chip:${f.tube}"></span>
      <span class="line__main">
        <span class="line__name">${f.name}</span>
        <span class="line__meta">Electrolyte tablets with sweeteners<br>${l.qty} × tube of 20 · ${l.plan === 'sub' ? 'every 4 weeks' : 'one-off'}</span>
      </span>
      <span class="line__price">${money(linePrice(l.plan, l.qty))}</span>
      <button class="line__remove" type="button" data-remove="${i}">Remove<span class="visually-hidden"> ${f.name}</span></button>
    </li>`;
  }).join('');
  const t = totals();
  $('#basket-empty').hidden = n > 0;
  $('#basket-foot').hidden = n === 0;
  $('#t-sub').textContent = money(t.sub);
  $('#t-del').textContent = t.del ? money(t.del) : 'Free';
  $('#t-total').textContent = money(t.tot);
  $('#t-vat').textContent = `Includes ${money(t.vat)} VAT`;
  $('#t-subnote').hidden = !state.basket.some((l) => l.plan === 'sub');
  const nudge = $('#t-nudge');
  nudge.hidden = !t.del;
  if (t.del) nudge.textContent = `Spend ${money(PRICES.freeFrom - t.sub)} more and delivery is free.`;
  $('#checkout-note').hidden = true;
}
$('#basket-lines').addEventListener('click', (e) => {
  const b = e.target.closest('[data-remove]');
  if (!b) return;
  state.basket.splice(Number(b.dataset.remove), 1);
  renderBasket();
  (state.basket.length ? $('.line__remove') : $('.basket__close')).focus();
});
$('#checkout').addEventListener('click', () => { $('#checkout-note').hidden = false; });

function focusables() {
  return $$('button, [href], input, [tabindex]:not([tabindex="-1"])', panel).filter((el) => !el.disabled && el.offsetParent !== null);
}
function openBasket(from) {
  if (!basket.hidden) return;
  returnFocus = from || document.activeElement;
  basket.hidden = false;
  root.classList.add('basket-open');
  requestAnimationFrame(() => basket.classList.add('is-open'));
  $('#basket-open').setAttribute('aria-expanded', 'true');
  setTimeout(() => (focusables()[0] || panel).focus({ preventScroll: true }), 30);
}
function closeBasket() {
  if (basket.hidden) return;
  basket.classList.remove('is-open');
  root.classList.remove('basket-open');
  $('#basket-open').setAttribute('aria-expanded', 'false');
  setTimeout(() => { basket.hidden = true; }, reduced ? 0 : 320);
  if (returnFocus) returnFocus.focus({ preventScroll: true });
}
$('#basket-open').addEventListener('click', (e) => openBasket(e.currentTarget));
$('#basket-open').setAttribute('aria-expanded', 'false');
basket.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeBasket(); });
document.addEventListener('keydown', (e) => {
  if (basket.hidden) return;
  if (e.key === 'Escape') { e.preventDefault(); closeBasket(); return; }
  if (e.key === 'Tab') {
    const f = focusables();
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

// ---- Start ---------------------------------------------------------------------------------------
setFlavour('lemon', 'init');
renderBasket();
updateBuy();
fizz(0, 0);
onScroll();

window.Upwich = {
  progress, loaded, useFallback,
  resolveReady: () => resolveReady(),
  flavour: () => state.flavour,
  setFlavour, fizz,
  get fallback() { return state.fallback; },
};
