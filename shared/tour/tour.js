/*
 * Hiconlab demo tour engine.
 *
 * A demo describes its story once, as an async script:
 *
 *   HiconTour.define(async (t) => {
 *     await t.wait(600);
 *     await t.type('#search', 'waterproof boots');
 *     await t.click('[data-chip="size-9"]');
 *     await t.scrollTo('#reviews');
 *     await t.poster();            // the frame used for the poster image
 *     await t.wait(1200);
 *   });
 *
 * The tour only runs when the page URL has ?tour=1 (viewer mode: stops as soon
 * as a real person touches the page and hands control over) or ?tour=record
 * (used by tools/record.mjs: never stops, hides nothing). Without the flag the
 * script is never called and the demo is a normal interactive page.
 *
 * Classic script, no dependencies. Load it with a plain <script src> before
 * the demo's own script.
 */
(function () {
  'use strict';

  var params = new URLSearchParams(location.search);
  var mode = params.get('tour'); // '1' | 'record' | null
  var speed = Math.max(0.25, Math.min(4, Number(params.get('speed')) || 1));
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var script = null;
  var readyHooks = [];
  var state = { running: false, stopped: false };
  var cursor = null;
  var pos = { x: -40, y: -40 };
  var hovered = null;

  function Stopped() { this.name = 'TourStopped'; }

  function sleep(ms) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () { state.stopped ? reject(new Stopped()) : resolve(); }, ms / speed);
    });
  }

  function frame() {
    return new Promise(function (resolve) { requestAnimationFrame(resolve); });
  }

  function check() {
    if (state.stopped) throw new Stopped();
  }

  function el(target) {
    if (!target) throw new Error('Tour: no target given');
    if (typeof target !== 'string') return target;
    var found = document.querySelector(target);
    if (!found) throw new Error('Tour: nothing matches ' + target);
    return found;
  }

  function ease(p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }

  // ---- Cursor -------------------------------------------------------------

  function buildCursor() {
    var style = document.createElement('style');
    style.textContent = [
      'html.tour-active, html.tour-active * { cursor: none !important; }',
      '.tour-cursor { position: fixed; left: 0; top: 0; width: 28px; height: 28px; z-index: 2147483647;',
      '  pointer-events: none; transform: translate3d(-40px,-40px,0); will-change: transform; }',
      '.tour-cursor svg { display: block; width: 28px; height: 28px; transform-origin: 4px 3px;',
      '  transition: transform 120ms ease; filter: drop-shadow(0 2px 3px rgba(0,0,0,.35)); }',
      '.tour-cursor.is-down svg { transform: scale(.86); }',
      '.tour-ripple { position: fixed; z-index: 2147483646; pointer-events: none; width: 44px; height: 44px;',
      '  margin: -22px 0 0 -22px; border-radius: 50%; border: 2px solid rgba(255,255,255,.95);',
      '  box-shadow: 0 0 0 1px rgba(0,0,0,.25); animation: tour-ripple 520ms ease-out forwards; }',
      '@keyframes tour-ripple { from { transform: scale(.3); opacity: 1; } to { transform: scale(1.25); opacity: 0; } }',
      // One caption style for every demo, so the set reads as one portfolio. It sits
      // above any brand styling and never takes pointer events.
      '.tour-caption { position: fixed; left: 50%; bottom: 36px; z-index: 2147483645; pointer-events: none;',
      '  display: flex; align-items: center; gap: 12px; transform: translate(-50%, 10px); opacity: 0;',
      '  transition: opacity 280ms ease, transform 280ms ease;',
      '  max-width: min(760px, calc(100vw - 32px)); padding: 11px 22px 11px 16px; border-radius: 999px;',
      '  background: rgba(10,12,16,.86); color: #fff; box-shadow: 0 6px 24px rgba(0,0,0,.28);',
      '  font: 500 18px/1.3 system-ui, -apple-system, "Segoe UI", sans-serif; letter-spacing: -0.005em;',
      '  -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); }',
      '.tour-caption::before { content: ""; flex: none; width: 8px; height: 8px; border-radius: 50%; background: #67e8f9; }',
      '.tour-caption.is-top { top: 28px; bottom: auto; transform: translate(-50%, -10px); }',
      '.tour-caption.is-on { opacity: 1; transform: translate(-50%, 0); }',
      '.tour-caption.is-hidden { visibility: hidden; }',
      '@media (prefers-reduced-motion: reduce) { .tour-caption, .tour-caption.is-top { transform: translate(-50%, 0); } }',
    ].join('\n');
    document.head.appendChild(style);

    cursor = document.createElement('div');
    cursor.className = 'tour-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML =
      '<svg viewBox="0 0 28 28"><path d="M4 3 L4 22 L9.2 17.4 L12.6 25 L16 23.5 L12.7 16 L19.5 16 Z" ' +
      'fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.body.appendChild(cursor);
    document.documentElement.classList.add('tour-active');
  }

  function placeCursor(x, y) {
    pos.x = x; pos.y = y;
    if (cursor) cursor.style.transform = 'translate3d(' + (x - 4) + 'px,' + (y - 3) + 'px,0)';
    updateHover(x, y);
  }

  // Synthetic events cannot trigger CSS :hover, so the element under the
  // cursor gets .is-tour-hover. Demos style ":hover, .is-tour-hover" together.
  function updateHover(x, y) {
    var under = document.elementFromPoint(x, y);
    var target = under && under.closest('a, button, [role="button"], label, input, select, textarea, summary, [data-hover]');
    if (target === hovered) return;
    if (hovered) {
      hovered.classList.remove('is-tour-hover');
      hovered.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
      hovered.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
    }
    hovered = target;
    if (hovered) {
      hovered.classList.add('is-tour-hover');
      hovered.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
      hovered.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    }
  }

  function pointFor(target, opts) {
    var r = el(target).getBoundingClientRect();
    var ox = opts && opts.offset ? opts.offset[0] : 0;
    var oy = opts && opts.offset ? opts.offset[1] : 0;
    var ax = opts && opts.at ? opts.at[0] : 0.5;
    var ay = opts && opts.at ? opts.at[1] : 0.5;
    return { x: r.left + r.width * ax + ox, y: r.top + r.height * ay + oy };
  }

  async function moveTo(x, y, duration) {
    var sx = pos.x, sy = pos.y;
    if (sx < 0 || sy < 0) { sx = window.innerWidth * 0.62; sy = window.innerHeight * 1.05; }
    var dist = Math.hypot(x - sx, y - sy);
    var ms = duration != null ? duration : Math.min(1100, Math.max(320, 260 + dist * 0.55));
    if (reducedMotion && mode !== 'record') ms = Math.min(ms, 160);
    ms = ms / speed;
    // A slight arc reads as a hand, not a robot.
    var bend = Math.min(80, dist * 0.12);
    var nx = -(y - sy) / (dist || 1), ny = (x - sx) / (dist || 1);
    var cx = (sx + x) / 2 + nx * bend, cy = (sy + y) / 2 + ny * bend;
    var start = performance.now();
    for (;;) {
      check();
      var p = Math.min(1, (performance.now() - start) / ms);
      var e = ease(p);
      var qx = (1 - e) * (1 - e) * sx + 2 * (1 - e) * e * cx + e * e * x;
      var qy = (1 - e) * (1 - e) * sy + 2 * (1 - e) * e * cy + e * e * y;
      placeCursor(qx, qy);
      if (p >= 1) break;
      await frame();
    }
  }

  function ripple(x, y) {
    var r = document.createElement('div');
    r.className = 'tour-ripple';
    r.style.left = x + 'px';
    r.style.top = y + 'px';
    document.body.appendChild(r);
    setTimeout(function () { r.remove(); }, 600);
  }

  function pointerEvent(type, node, x, y) {
    var init = { bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, button: 0, pointerId: 1, pointerType: 'mouse', isPrimary: true, view: window };
    var Ctor = type.indexOf('pointer') === 0 && window.PointerEvent ? PointerEvent : MouseEvent;
    node.dispatchEvent(new Ctor(type, init));
  }

  // ---- Scrolling ----------------------------------------------------------

  function scrollerOf(node) {
    for (var n = node.parentElement; n && n !== document.body; n = n.parentElement) {
      var s = getComputedStyle(n);
      if (/(auto|scroll)/.test(s.overflowY) && n.scrollHeight > n.clientHeight + 1) return n;
    }
    return document.scrollingElement || document.documentElement;
  }

  async function animateScroll(scroller, toY, duration) {
    var isRoot = scroller === document.scrollingElement || scroller === document.documentElement;
    var from = isRoot ? window.scrollY : scroller.scrollTop;
    var max = (isRoot ? document.documentElement.scrollHeight - window.innerHeight : scroller.scrollHeight - scroller.clientHeight);
    toY = Math.max(0, Math.min(max, toY));
    var dist = Math.abs(toY - from);
    if (dist < 2) return;
    var ms = duration != null ? duration : Math.min(2600, Math.max(500, dist * 0.9));
    if (reducedMotion && mode !== 'record') ms = Math.min(ms, 200);
    ms = ms / speed;
    var start = performance.now();
    for (;;) {
      check();
      var p = Math.min(1, (performance.now() - start) / ms);
      var y = from + (toY - from) * ease(p);
      if (isRoot) window.scrollTo(0, y); else scroller.scrollTop = y;
      if (p >= 1) break;
      await frame();
    }
    updateHover(pos.x, pos.y);
  }

  async function ensureVisible(node) {
    var r = node.getBoundingClientRect();
    var margin = 96;
    var scroller = scrollerOf(node);
    var isRoot = scroller === document.scrollingElement || scroller === document.documentElement;
    var top = isRoot ? 0 : scroller.getBoundingClientRect().top;
    var bottom = isRoot ? window.innerHeight : scroller.getBoundingClientRect().bottom;
    if (r.top >= top + margin * 0.5 && r.bottom <= bottom - margin * 0.5) return;
    var current = isRoot ? window.scrollY : scroller.scrollTop;
    var target = current + (r.top - top) - (bottom - top) * 0.35;
    await animateScroll(scroller, target);
  }

  // ---- Public API given to the tour script --------------------------------

  var api = {
    mode: mode,
    speed: speed,
    reducedMotion: reducedMotion,

    wait: function (ms) { return sleep(ms); },

    waitFor: async function (test, timeout) {
      var limit = performance.now() + (timeout || 8000);
      for (;;) {
        check();
        var ok = typeof test === 'string' ? document.querySelector(test) : test();
        if (ok) return ok;
        if (performance.now() > limit) throw new Error('Tour: timed out waiting for ' + test);
        await sleep(50);
      }
    },

    move: async function (target, opts) {
      var node = el(target);
      if (!opts || opts.scroll !== false) await ensureVisible(node);
      var p = pointFor(node, opts);
      await moveTo(p.x, p.y, opts && opts.duration);
    },

    moveToPoint: function (x, y, duration) { return moveTo(x, y, duration); },

    hover: async function (target, opts) {
      await api.move(target, opts);
      await sleep((opts && opts.hold) || 500);
    },

    click: async function (target, opts) {
      var node = el(target);
      await api.move(node, opts);
      await sleep(120);
      var p = pointFor(node, opts);
      cursor && cursor.classList.add('is-down');
      pointerEvent('pointerdown', node, p.x, p.y);
      pointerEvent('mousedown', node, p.x, p.y);
      if (typeof node.focus === 'function') node.focus({ preventScroll: true });
      await sleep(90);
      cursor && cursor.classList.remove('is-down');
      pointerEvent('pointerup', node, p.x, p.y);
      pointerEvent('mouseup', node, p.x, p.y);
      ripple(p.x, p.y);
      node.click();
      await sleep((opts && opts.after) || 260);
    },

    // Types like a person: varied rhythm, short pauses at spaces and punctuation.
    type: async function (target, text, opts) {
      var node = el(target);
      opts = opts || {};
      if (document.activeElement !== node) await api.click(node, { after: 160 });
      if (opts.clear) { setValue(node, ''); }
      var base = opts.cps ? 1000 / opts.cps : 62;
      for (var i = 0; i < text.length; i++) {
        check();
        var ch = text[i];
        node.dispatchEvent(new KeyboardEvent('keydown', { key: ch, bubbles: true }));
        setValue(node, node.value + ch);
        node.dispatchEvent(new KeyboardEvent('keyup', { key: ch, bubbles: true }));
        var delay = base * (0.55 + Math.random() * 0.9);
        if (ch === ' ') delay += base * 0.6;
        if (/[,.?!]/.test(ch)) delay += base * 2.2;
        await sleep(delay);
      }
      await sleep(opts.after || 220);
    },

    press: async function (key, target) {
      var node = target ? el(target) : document.activeElement || document.body;
      var down = new KeyboardEvent('keydown', { key: key, bubbles: true, cancelable: true });
      var allowed = node.dispatchEvent(down);
      if (allowed && key === 'Enter' && node.form && node.tagName !== 'TEXTAREA') node.form.requestSubmit();
      node.dispatchEvent(new KeyboardEvent('keyup', { key: key, bubbles: true }));
      await sleep(200);
    },

    select: async function (target, value) {
      var node = el(target);
      await api.click(node, { after: 200 });
      node.value = value;
      node.dispatchEvent(new Event('input', { bubbles: true }));
      node.dispatchEvent(new Event('change', { bubbles: true }));
      await sleep(240);
    },

    // Scroll the page (or the element's own scroll container) to a target
    // element, a pixel offset, or "bottom". Options: { duration, offset, within }.
    scrollTo: async function (target, opts) {
      opts = opts || {};
      var scroller = opts.within ? el(opts.within) : null;
      var toY;
      if (typeof target === 'number') {
        toY = target;
      } else if (target === 'bottom') {
        scroller = scroller || document.scrollingElement;
        toY = scroller.scrollHeight;
      } else {
        var node = el(target);
        scroller = scroller || scrollerOf(node);
        var isRoot = scroller === document.scrollingElement || scroller === document.documentElement;
        var base = isRoot ? window.scrollY : scroller.scrollTop - scroller.getBoundingClientRect().top;
        toY = base + node.getBoundingClientRect().top - (opts.offset != null ? opts.offset : 80);
      }
      await animateScroll(scroller || document.scrollingElement, toY, opts.duration);
    },

    // Drag from one element to another (for kanban boards and sliders). The demo
    // listens for the tour's "tour:drop" event or for real pointer events.
    drag: async function (from, to, opts) {
      var a = el(from), b = el(to);
      await api.move(a, opts);
      var pa = pointFor(a);
      cursor && cursor.classList.add('is-down');
      pointerEvent('pointerdown', a, pa.x, pa.y);
      await sleep(160);
      await ensureVisible(b);
      var pb = pointFor(b, opts && opts.toOpts);
      var steps = 24, sx = pos.x, sy = pos.y;
      var ms = Math.min(1200, Math.max(500, Math.hypot(pb.x - sx, pb.y - sy) * 0.9)) / speed;
      for (var i = 1; i <= steps; i++) {
        check();
        var e = ease(i / steps);
        var x = sx + (pb.x - sx) * e, y = sy + (pb.y - sy) * e;
        placeCursor(x, y);
        pointerEvent('pointermove', document.elementFromPoint(x, y) || b, x, y);
        await sleep(ms / steps);
      }
      pointerEvent('pointerup', b, pb.x, pb.y);
      cursor && cursor.classList.remove('is-down');
      a.dispatchEvent(new CustomEvent('tour:drop', { bubbles: true, detail: { target: b } }));
      await sleep((opts && opts.after) || 320);
    },

    // A short caption that explains what the viewer is seeing. It stays up while the
    // tour carries on, until the next caption replaces it (with a cross-fade) or
    // t.caption(null) clears it. opts: a number of ms to hold it and then clear it
    // (awaited), or { ms, place: 'bottom' | 'top' } when the action is at the bottom.
    caption: async function (text, opts) {
      if (typeof opts === 'number') opts = { ms: opts };
      opts = opts || {};
      var c = document.querySelector('.tour-caption');
      if (!c) {
        c = document.createElement('div');
        c.className = 'tour-caption';
        c.setAttribute('aria-hidden', 'true');
        document.body.appendChild(c);
      }
      if (c.classList.contains('is-on')) {
        c.classList.remove('is-on');
        await sleep(280);
      }
      if (!text) return;
      c.textContent = text;
      c.classList.toggle('is-top', opts.place === 'top');
      void c.offsetWidth;
      c.classList.add('is-on');
      if (opts.ms) {
        await sleep(opts.ms);
        c.classList.remove('is-on');
        await sleep(280);
      }
    },

    // Marks the poster frame. The recorder takes a full-quality still here,
    // without the cursor or caption, so the poster shows only the demo.
    poster: async function () {
      if (typeof window.__tourPoster === 'function') {
        var cap = document.querySelector('.tour-caption');
        if (cursor) cursor.style.visibility = 'hidden';
        if (cap) cap.classList.add('is-hidden');
        await window.__tourPoster();
        if (cursor) cursor.style.visibility = '';
        if (cap) cap.classList.remove('is-hidden');
      }
    },

    // Calls demo code directly, for state that a cursor cannot reach.
    run: async function (fn) { check(); return fn(); },
  };

  function setValue(node, value) {
    var proto = node.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    var setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    setter.call(node, value);
    node.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // ---- Lifecycle ----------------------------------------------------------

  function handOver(e) {
    if (!e.isTrusted || !state.running || mode === 'record') return;
    state.stopped = true;
    finish('stopped');
  }

  function finish(result) {
    state.running = false;
    document.documentElement.classList.remove('tour-active');
    document.documentElement.dataset.tour = result;
    if (cursor) cursor.remove();
    if (hovered) hovered.classList.remove('is-tour-hover');
    var cap = document.querySelector('.tour-caption');
    if (cap) cap.remove();
    window.dispatchEvent(new CustomEvent('tour:end', { detail: { result: result } }));
  }

  async function start() {
    if (!script || state.running) return;
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    for (var i = 0; i < readyHooks.length; i++) await readyHooks[i]();
    buildCursor();
    // The recorder starts capturing only once the page is fully ready.
    if (typeof window.__tourBegin === 'function') await window.__tourBegin();
    state.running = true;
    state.stopped = false;
    document.documentElement.dataset.tour = 'running';
    ['pointerdown', 'wheel', 'keydown', 'touchstart'].forEach(function (type) {
      window.addEventListener(type, handOver, { capture: true, passive: true });
    });
    window.dispatchEvent(new CustomEvent('tour:start'));
    try {
      await script(api);
      finish('done');
    } catch (err) {
      if (err instanceof Stopped) return;
      console.error(err);
      finish('error');
    }
  }

  window.HiconTour = {
    mode: mode,
    active: mode === '1' || mode === 'record',
    define: function (fn) {
      script = fn;
      if (!this.active) return;
      if (document.readyState === 'complete') setTimeout(start, 0);
      else window.addEventListener('load', function () { setTimeout(start, 0); }, { once: true });
    },
    // Lets a demo delay the tour until its own assets (models, images) are ready.
    ready: function (fn) { readyHooks.push(fn); },
    start: function () { if (script) { mode = mode || '1'; start(); } },
  };
})();
