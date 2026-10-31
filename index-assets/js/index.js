// Hiconlab demos index: reads demos/demos.json, draws a card per demo, filters by service,
// reads media/media.json (written by the recorder) for videos and posters, and plays videos in an accessible dialog.
(() => {
  'use strict';

  const MANIFEST = 'demos/demos.json';
  const MEDIA = 'media/';
  const MEDIA_LIST = 'media/media.json';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const SERVICES = {
    'ecommerce': { label: 'Ecommerce', icon: 'ecommerce' },
    'web-design': { label: 'Web design', icon: 'website' },
    'web-development': { label: 'Web development', icon: 'api' },
    'ai-workflows': { label: 'AI workflows', icon: 'workflow' },
    'ai-enablement': { label: 'AI enablement', icon: 'enablement' },
  };
  const SERVICE_ORDER = Object.keys(SERVICES);

  const KINDS = {
    'ai-ecommerce': { label: 'AI shopping', art: 'chat' },
    'saas': { label: 'SaaS', art: 'saas' },
    'website-recreation': { label: 'Design recreation', art: 'recreation' },
    'website': { label: 'Website', art: 'website' },
    'cms': { label: 'Headless CMS', art: 'cms' },
    '3d': { label: '3D', art: 'model' },
  };

  const NUMBER_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty'];

  // Line icons from the design system (assets/Icons), drawn in currentColor.
  const ICONS = {
    ecommerce: '<path d="M3 5h3.2l2.6 12.1a2 2 0 0 0 2 1.6h9.4a2 2 0 0 0 1.9-1.4L24.5 10H7.3"/><circle cx="11" cy="23" r="1.6"/><circle cx="20.5" cy="23" r="1.6"/>',
    website: '<rect x="3" y="5" width="22" height="18" rx="3"/><path d="M3 10h22M7 7.5h.01M10 7.5h.01"/>',
    api: '<circle cx="14" cy="14" r="4"/><path d="M14 3v7M14 18v7M3 14h7M18 14h7"/>',
    workflow: '<circle cx="6" cy="7" r="3"/><circle cx="22" cy="7" r="3"/><circle cx="14" cy="21" r="3"/><path d="M9 7h10M7.6 9.6l4.8 8.8M20.4 9.6l-4.8 8.8"/>',
    enablement: '<path d="M3 9l11-5 11 5-11 5z"/><path d="M8 11.5V17c0 2 2.7 3.5 6 3.5s6-1.5 6-3.5v-5.5"/>',
    arrow: '<path d="M5 14h18M16 7l7 7-7 7"/>',
    play: '<path d="M10 7.5v13l11-6.5z"/>',
  };
  const icon = (name, size = 28, stroke = 1.5) =>
    `<svg class="hl-icon" width="${size}" height="${size}" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

  // Placeholder schematics, one per kind of demo, drawn on a 320 × 180 sheet.
  const ART = {
    website: `
      <path class="ln ln--faint" d="M76 26v-6M244 26v-6M76 23h168"/>
      <rect class="ln" x="76" y="34" width="168" height="108" rx="8"/>
      <path class="ln" d="M76 50h168"/>
      <path class="ln ln--faint" d="M86 42h.01M93 42h.01M100 42h.01"/>
      <path class="ln" d="M90 66h60M90 76h44"/>
      <path class="ln ln--faint" d="M90 86h52"/>
      <rect class="ln" x="90" y="94" width="34" height="11" rx="5.5"/>
      <rect class="ln ln--faint" x="162" y="60" width="68" height="46" rx="4"/>
      <path class="ln ln--faint ln--dash" d="M162 60l68 46M230 60l-68 46"/>
      <rect class="ln ln--faint" x="90" y="116" width="42" height="16" rx="3"/>
      <rect class="ln ln--faint" x="139" y="116" width="42" height="16" rx="3"/>
      <rect class="ln ln--faint" x="188" y="116" width="42" height="16" rx="3"/>`,
    recreation: `
      <rect class="ln ln--faint ln--dash" x="88" y="28" width="168" height="108" rx="8"/>
      <path class="ln ln--faint ln--dash" d="M88 44h168"/>
      <rect class="fill--soft" x="68" y="40" width="168" height="108" rx="8"/>
      <rect class="ln" x="68" y="40" width="168" height="108" rx="8"/>
      <path class="ln" d="M68 56h168"/>
      <path class="ln" d="M84 76h70M84 86h52"/>
      <rect class="ln ln--faint" x="84" y="100" width="136" height="34" rx="4"/>
      <path class="ln ln--faint ln--dash" d="M84 100l136 34M220 100l-136 34"/>
      <path class="ln" d="M252 28v14M245 35h14"/>
      <path class="ln" d="M68 154v6M236 154v6M68 157h168"/>`,
    saas: `
      <rect class="ln" x="64" y="32" width="192" height="112" rx="8"/>
      <path class="ln" d="M104 32v112M104 48h152"/>
      <path class="ln ln--faint" d="M74 44h20M74 60h18M74 70h22M74 80h16M74 90h20"/>
      <rect class="fill" x="72" y="56" width="26" height="8" rx="4" opacity="0.5"/>
      <path class="ln ln--faint" d="M114 40h40"/>
      <rect class="ln ln--faint" x="114" y="58" width="40" height="78" rx="4"/>
      <rect class="ln ln--faint" x="160" y="58" width="40" height="78" rx="4"/>
      <rect class="ln ln--faint" x="206" y="58" width="40" height="78" rx="4"/>
      <rect class="ln" x="118" y="64" width="32" height="16" rx="3"/>
      <rect class="ln" x="118" y="85" width="32" height="16" rx="3"/>
      <rect class="ln" x="164" y="64" width="32" height="16" rx="3"/>
      <rect class="ln ln--dash" x="164" y="85" width="32" height="16" rx="3"/>
      <rect class="ln" x="210" y="64" width="32" height="16" rx="3"/>
      <path class="ln ln--dash" d="M150 93c6 0 8 0 14 0" />`,
    chat: `
      <rect class="ln" x="92" y="30" width="136" height="118" rx="10"/>
      <path class="ln" d="M92 46h136"/>
      <path class="ln ln--faint" d="M102 38h30"/>
      <rect class="ln" x="102" y="54" width="72" height="15" rx="7.5"/>
      <rect class="fill--soft" x="146" y="76" width="72" height="15" rx="7.5"/>
      <rect class="ln" x="146" y="76" width="72" height="15" rx="7.5"/>
      <path class="ln ln--faint" d="M154 83.5h44"/>
      <path class="ln" d="M112 61.5h.01M120 61.5h.01M128 61.5h.01"/>
      <rect class="ln ln--faint" x="102" y="98" width="54" height="30" rx="4"/>
      <rect class="ln ln--faint" x="164" y="98" width="54" height="30" rx="4"/>
      <path class="ln ln--faint" d="M108 120h22M170 120h22"/>
      <rect class="ln" x="102" y="134" width="116" height="8" rx="4"/>`,
    cms: `
      <rect class="ln" x="36" y="50" width="78" height="76" rx="6"/>
      <path class="ln" d="M36 64h78"/>
      <rect class="ln ln--faint" x="44" y="72" width="62" height="12" rx="3"/>
      <rect class="ln ln--faint" x="44" y="89" width="62" height="12" rx="3"/>
      <rect class="ln ln--dash" x="44" y="106" width="62" height="12" rx="3"/>
      <path class="ln ln--dash" d="M118 88h24"/>
      <circle class="ln" cx="160" cy="88" r="15"/>
      <path class="ln" d="M153 88h12M161 83l5 5-5 5"/>
      <path class="ln ln--dash" d="M178 88h24"/>
      <rect class="ln" x="206" y="50" width="78" height="76" rx="6"/>
      <path class="ln" d="M206 64h78"/>
      <path class="ln ln--faint" d="M216 78h44M216 88h30"/>
      <rect class="ln ln--faint" x="216" y="98" width="58" height="20" rx="3"/>
      <path class="ln ln--faint" d="M36 140v6M284 140v6M36 143h248"/>`,
    model: `
      <path class="ln ln--faint" d="M96 46v108M92 46h8M92 154h8"/>
      <path class="ln" d="M160 46l40 16-40 16-40-16z"/>
      <path class="ln" d="M120 62v8l40 16 40-16v-8M160 78v8"/>
      <path class="ln ln--faint ln--dash" d="M120 70v46M200 70v46M160 86v30"/>
      <path class="fill--soft" d="M160 100l40 16-40 16-40-16z"/>
      <path class="ln" d="M160 100l40 16-40 16-40-16z"/>
      <path class="ln" d="M120 116v22l40 16 40-16v-22M160 132v22"/>
      <path class="ln ln--faint" d="M214 58a52 22 0 0 1 10 42"/>
      <path class="ln ln--faint" d="M219 94l5 6 3-7"/>`,
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const grid = $('#demo-grid');
  const filtersEl = $('.filters');
  const results = $('#results');

  const pad = (n) => String(n).padStart(2, '0');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const serviceOf = (d) => SERVICES[d.service] || { label: d.service, icon: 'website' };
  const kindOf = (d) => KINDS[d.kind] || { label: d.kind, art: 'website' };
  const isBuilt = (d) => d.status && d.status !== 'planned';
  const isRecreation = (d) => d.kind === 'website-recreation';
  const countWord = (n) => NUMBER_WORDS[n] || String(n);

  // media/media.json is written by the recorder, so the page only asks for files that exist.
  async function loadMediaList() {
    try {
      const res = await fetch(MEDIA_LIST, { cache: 'no-store' });
      return res.ok ? (await res.json()).media || {} : {};
    } catch {
      return {};
    }
  }

  function mediaFor(demo, list) {
    const m = list[demo.id];
    if (!isBuilt(demo) || !m || !m.video) return { video: null, poster: null };
    const poster = m.posterWebp || m.posterJpg;
    return { video: MEDIA + m.video, poster: poster ? MEDIA + poster : null };
  }

  function placeholder(demo, note) {
    const kind = kindOf(demo);
    return `
      <div class="blueprint" aria-hidden="true">
        <svg class="blueprint__art" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid meet" focusable="false">${ART[kind.art] || ART.website}</svg>
        <span class="blueprint__crop blueprint__crop--tl"></span><span class="blueprint__crop blueprint__crop--tr"></span>
        <span class="blueprint__crop blueprint__crop--bl"></span><span class="blueprint__crop blueprint__crop--br"></span>
        <span class="blueprint__tag blueprint__tag--tl">Fig. ${pad(demo.number)} — ${esc(kind.label)}</span>
        <span class="blueprint__tag blueprint__tag--br">${esc(note)}</span>
      </div>`;
  }

  function cardHTML(demo) {
    const service = serviceOf(demo);
    const kind = kindOf(demo);
    const titleId = `demo-${esc(demo.id)}-title`;
    return `
      <article class="demo-card" aria-labelledby="${titleId}">
        <div class="demo-media" data-media>${placeholder(demo, isBuilt(demo) ? 'Video to follow' : 'In progress')}</div>
        <div class="demo-body">
          <div class="demo-top">
            <span class="demo-num"><span class="visually-hidden">Demo </span>No. ${pad(demo.number)}</span>
            <span class="demo-icon">${icon(service.icon, 24)}</span>
          </div>
          <h3 class="demo-title" id="${titleId}">${esc(demo.title)}</h3>
          <p class="demo-summary">${esc(demo.summary)}</p>
          ${isRecreation(demo) ? '<p class="demo-recreation">Design recreation for portfolio purposes</p>' : ''}
          <div class="demo-chips">
            <span class="hl-chip"><span class="visually-hidden">Service: </span>${esc(service.label)}</span>
            <span class="hl-chip"><span class="visually-hidden">Kind: </span>${esc(kind.label)}</span>
          </div>
          <div class="demo-foot" data-foot>${pendingHTML(demo)}</div>
        </div>
      </article>`;
  }

  function pendingHTML(demo) {
    if (!isBuilt(demo)) {
      return `<span class="demo-pending"><span class="demo-pending__dot" aria-hidden="true"></span><span><strong>In progress.</strong> Video and demo to follow.</span></span>`;
    }
    return `<span class="demo-pending"><span class="demo-pending__dot" aria-hidden="true"></span><span>Checking for the video…</span></span>`;
  }

  function tryHref(demo) {
    return `demos/${encodeURIComponent(demo.id)}/`;
  }

  function applyMedia(li, demo, media) {
    const mediaEl = $('[data-media]', li);
    const foot = $('[data-foot]', li);
    const canTry = demo.tryIt === true && isBuilt(demo);

    if (media.poster) {
      mediaEl.innerHTML = `<img class="demo-media__poster" src="${esc(media.poster)}" alt="" width="1920" height="1080" loading="lazy" decoding="async">`;
      // A broken poster falls back to the drawing rather than a broken image.
      $('img', mediaEl).addEventListener('error', () => {
        mediaEl.innerHTML = placeholder(demo, media.video ? 'Poster to follow' : 'Video to follow');
        if (media.video) addPlayOverlay();
      }, { once: true });
    } else if (isBuilt(demo)) {
      mediaEl.innerHTML = placeholder(demo, media.video ? 'Poster to follow' : 'Video to follow');
    }

    function addPlayOverlay() {
      // A large target for pointers; keyboard and screen-reader users get the Watch button in the card foot.
      const overlay = document.createElement('button');
      overlay.type = 'button';
      overlay.className = 'demo-media__play';
      overlay.tabIndex = -1;
      overlay.setAttribute('aria-hidden', 'true');
      overlay.innerHTML = `<span class="demo-media__play-badge">${icon('play', 26, 1.6)}</span>`;
      overlay.addEventListener('click', () => openPlayer(demo, media, $('.demo-watch', li)));
      mediaEl.appendChild(overlay);
    }

    if (!isBuilt(demo)) return;

    const parts = [];
    if (media.video) {
      parts.push(`<button type="button" class="hl-btn hl-btn--ghost demo-watch">Watch<span class="visually-hidden"> the ${esc(demo.title)} video</span> ${icon('play', 14, 1.8)}</button>`);
    }
    if (canTry) {
      parts.push(`<a class="hl-action" href="${tryHref(demo)}">Try it<span class="visually-hidden">: ${esc(demo.title)}</span> ${icon('arrow', 16, 2)}</a>`);
    }
    if (!parts.length) {
      foot.innerHTML = `<span class="demo-pending"><span class="demo-pending__dot" aria-hidden="true"></span><span><strong>Built.</strong> Video to follow.</span></span>`;
      return;
    }
    if (media.video && !canTry) {
      parts.push('<span class="demo-pending">Video only</span>');
    }
    foot.innerHTML = parts.join('');
    if (media.video) {
      const watch = $('.demo-watch', foot);
      watch.addEventListener('click', () => openPlayer(demo, media, watch));
      addPlayOverlay();
    }
  }

  // ---------- Filters ----------
  let activeFilter = 'all';
  let items = [];

  function renderFilters(demos) {
    const counts = {};
    for (const d of demos) counts[d.service] = (counts[d.service] || 0) + 1;
    const present = SERVICE_ORDER.filter((s) => counts[s]).concat(Object.keys(counts).filter((s) => !SERVICES[s]));
    const buttons = [{ key: 'all', label: 'All', count: demos.length }]
      .concat(present.map((s) => ({ key: s, label: (SERVICES[s] || { label: s }).label, count: counts[s] })));
    filtersEl.innerHTML = buttons.map((b) =>
      `<button type="button" class="filter" data-filter="${esc(b.key)}" aria-pressed="${b.key === activeFilter}">${esc(b.label)} <span class="filter__count" aria-hidden="true">${b.count}</span><span class="visually-hidden">(${b.count})</span></button>`
    ).join('');
    filtersEl.hidden = false;
    filtersEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      setFilter(btn.dataset.filter);
    });
  }

  function setFilter(key) {
    activeFilter = key;
    for (const btn of filtersEl.querySelectorAll('[data-filter]')) btn.setAttribute('aria-pressed', String(btn.dataset.filter === key));
    let shown = 0;
    for (const { li, demo } of items) {
      const show = key === 'all' || demo.service === key;
      li.hidden = !show;
      if (show) shown++;
    }
    const label = key === 'all' ? '' : ` in ${(SERVICES[key] || { label: key }).label.toLowerCase().replace(/^ai /, 'AI ')}`;
    results.textContent = key === 'all'
      ? `Showing all ${items.length} demos`
      : `Showing ${shown} of ${items.length} demos${label}`;
  }

  // ---------- Facts ----------
  function renderFacts(demos) {
    const built = demos.filter(isBuilt).length;
    const services = new Set(demos.map((d) => d.service)).size;
    const set = (k, v) => { const el = $(`[data-fact="${k}"]`); if (el) el.textContent = v; };
    set('total', String(demos.length));
    set('services', `Across ${countWord(services).toLowerCase()} services`);
    set('built', String(built));
    set('planned', String(demos.length - built));
  }

  // ---------- Video dialog ----------
  const player = $('#player');
  const video = $('#player-video');
  const playerError = $('#player-error');
  let returnFocus = null;

  function openPlayer(demo, media, opener) {
    returnFocus = opener || document.activeElement;
    $('#player-label').textContent = `Fig. ${pad(demo.number)} — Recording · ${serviceOf(demo).label}`;
    $('#player-title').textContent = demo.title;
    $('#player-desc').textContent = isRecreation(demo)
      ? 'Design recreation for portfolio purposes. Recorded with a scripted cursor. No sound.'
      : 'Recorded from the working demo with a scripted cursor. No sound.';
    const tryLink = $('#player-try');
    const canTry = demo.tryIt === true && isBuilt(demo);
    tryLink.hidden = !canTry;
    if (canTry) {
      tryLink.href = tryHref(demo);
    } else {
      tryLink.removeAttribute('href');
    }
    playerError.hidden = true;
    if (media.poster) video.poster = media.poster; else video.removeAttribute('poster');
    video.src = media.video;
    video.setAttribute('aria-label', `${demo.title}, demo video`);
    player.showModal();
    $('[data-close]', player).focus();
    if (!reduceMotion.matches) {
      video.muted = true;
      video.play().catch(() => { /* autoplay refused: the controls are there */ });
    }
  }

  function closePlayer() {
    if (player.open) player.close();
  }

  player.addEventListener('close', () => {
    video.pause();
    video.removeAttribute('src');
    video.load();
    if (returnFocus && document.contains(returnFocus)) returnFocus.focus();
    returnFocus = null;
  });
  $('[data-close]', player).addEventListener('click', closePlayer);
  // Keep Tab inside the dialog (a modal dialog would otherwise let focus out to the browser's own controls).
  player.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusable = [...player.querySelectorAll('button, a[href], video[controls]')]
      .filter((el) => !el.hidden && !el.closest('[hidden]') && el.getClientRects().length);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  // A click on the backdrop (outside the panel) closes it too.
  player.addEventListener('click', (e) => {
    if (e.target !== player) return;
    const r = player.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) closePlayer();
  });
  video.addEventListener('error', () => {
    if (video.getAttribute('src')) playerError.hidden = false;
  });

  // ---------- Boot ----------
  async function boot() {
    let demos;
    try {
      const res = await fetch(MANIFEST, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      demos = (data.demos || []).slice().sort((a, b) => (a.number || 0) - (b.number || 0));
    } catch {
      $('#grid-message').textContent = 'The demo list didn’t load. If you opened this file directly, serve the folder over HTTP instead (npm run serve), then reload.';
      return;
    }

    renderFacts(demos);
    $('#demos-title').textContent = `${countWord(demos.length)} demos, sorted by service.`;
    grid.innerHTML = '';
    items = demos.map((demo) => {
      const li = document.createElement('li');
      li.className = 'demo';
      li.dataset.service = demo.service;
      li.dataset.id = demo.id;
      li.innerHTML = cardHTML(demo);
      grid.appendChild(li);
      return { li, demo };
    });
    renderFilters(demos);
    setFilter('all');

    const mediaList = await loadMediaList();
    items.forEach(({ li, demo }) => applyMedia(li, demo, mediaFor(demo, mediaList)));
    document.documentElement.dataset.ready = 'true';
  }

  boot();
})();
