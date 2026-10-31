/*
 * Fettle Trade Supply: search, autocomplete, "Ask the counter" and basket.
 * Plain JavaScript, no dependencies. Everything is scripted: no network calls.
 */
(function () {
  'use strict';

  var D = window.FETTLE;
  var A = window.FETTLE_ANSWERS;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var params = new URLSearchParams(location.search);
  var inTour = !!params.get('tour');
  var SPEED = inTour ? Math.max(0.25, Math.min(4, Number(params.get('speed')) || 1)) : 1;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms / SPEED); }); }
  function isPhone() { return window.matchMedia('(max-width: 640px)').matches; }

  // Seeded random numbers, so the same answer always streams the same way (tours must be repeatable).
  function seeded(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    return function () {
      h = (h + 0x6D2B79F5) | 0;
      var t = Math.imul(h ^ (h >>> 15), h | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var bySku = {};
  D.products.forEach(function (p) { bySku[p.sku] = p; });
  var sectionById = {};
  D.sections.forEach(function (s) { sectionById[s.id] = s; });

  // ---------------------------------------------------------------- Helpers

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) {
    return '£' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function incVat(n) { return Math.round(n * (1 + D.vatRate) * 100) / 100; }
  function img(id, size) { return 'assets/img/products/' + id + '-' + size + '.webp'; }
  function icon(id, cls) { return '<svg class="ic ' + (cls || '') + '" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; }

  function stockInfo(p) {
    if (!p.inStock) return { cls: 'is-out', text: 'Out of stock · ' + p.leadTimeDays + ' working days', short: 'Out of stock' };
    if (p.stock < 30) return { cls: 'is-low', text: 'Low stock · ' + p.stock + ' left', short: p.stock + ' left' };
    return { cls: 'is-in', text: 'In stock · ' + p.stock, short: p.stock + ' in stock' };
  }

  // ---------------------------------------------------------------- Search

  var STOP = new Set('a an the to into in on onto for of my me i im i\'m need needs want some and with it is are what which do does how can could you your got any have has be about long get round around through from at by this that there use using should would will just like looking something thing things size sizes much many how whats what\'s best good ok okay right kind type sort price prices cost costs inc incl including vat ex exc sell sells stock stocked buy order please thanks thank cheers hi hello there'.split(' '));

  function normalise(s) {
    return String(s || '').toLowerCase()
      .replace(/[’‘]/g, "'").replace(/[“”]/g, '"')
      .replace(/×/g, 'x')
      .replace(/(\d)\s*x\s*(\d)/g, '$1x$2')
      .replace(/(\d)\.0(?=[a-z²])/g, '$1') // "5.0Ah" and "5Ah" are the same thing
      .replace(/[^a-z0-9&.\-/'²\s]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }

  var SYN = D.synonyms.slice().sort(function (a, b) { return b.from.length - a.from.length; });
  function applySynonyms(q) {
    var used = [];
    SYN.forEach(function (s) {
      var re = new RegExp('(^|\\s)' + s.from.replace(/[.*+?^${}()|[\]\\&]/g, '\\$&') + '(?=\\s|$)', 'g');
      if (re.test(q)) {
        q = q.replace(re, '$1' + s.to);
        if (!used.some(function (u) { return u.to === s.to; })) used.push(s);
      }
    });
    return { q: q, used: used };
  }

  function tokensOf(q) {
    return q.split(/[\s/]+/).map(function (t) { return t.replace(/^[.\-']+|[.\-']+$/g, ''); })
      .filter(function (t) { return t && !STOP.has(t) && (t.length > 1 || /\d/.test(t)); });
  }

  function words(s) { return normalise(s).split(/[\s/,()]+/).filter(Boolean); }

  // Index once.
  D.products.forEach(function (p) {
    var specText = Object.keys(p.specs).map(function (k) { return p.specs[k]; }).join(' ');
    p._idx = {
      name: words(p.name),
      kw: words(p.keywords.join(' ')),
      kwPhrases: p.keywords.map(normalise),
      meta: words(p.brand + ' ' + p.subcategory + ' ' + sectionById[p.category].name),
      spec: words(specText),
      sku: p.sku.toLowerCase(),
    };
  });

  function wordHit(list, t) {
    for (var i = 0; i < list.length; i++) {
      var w = list[i];
      if (w.indexOf(t) === 0) return true;
      if (t.length > 3 && w.length >= 4 && t.indexOf(w) === 0) return true; // "bolts" finds "bolt"
    }
    return false;
  }

  function scoreProduct(p, toks, phrase) {
    var ix = p._idx, matched = 0, score = 0;
    toks.forEach(function (t) {
      var s = 0;
      if (ix.sku.indexOf(t) === 0 || ix.sku === t) s = 6;
      else if (wordHit(ix.name, t)) s = 4;
      else if (wordHit(ix.kw, t)) s = 2.5;
      else if (wordHit(ix.meta, t)) s = 1.5;
      else if (wordHit(ix.spec, t)) s = 1;
      if (s) { matched++; score += s; }
    });
    ix.kwPhrases.forEach(function (k) { if (k.indexOf(' ') > 0 && phrase.indexOf(k) >= 0) score += 3; });
    return { matched: matched, score: score };
  }

  function search(raw, opts) {
    opts = opts || {};
    var n = normalise(raw);
    var syn = applySynonyms(n);
    var toks = tokensOf(syn.q);
    if (!toks.length) return { items: [], toks: [], used: syn.used };
    var need = opts.strict ? Math.max(1, Math.ceil(toks.length * 0.6)) : 1;
    var synToks = [];
    syn.used.forEach(function (u) { tokensOf(normalise(u.to)).forEach(function (t) { synToks.push(t); }); });
    var out = [];
    D.products.forEach(function (p) {
      if (synToks.length && scoreProduct(p, synToks, syn.q).matched < synToks.length) return;
      var r = scoreProduct(p, toks, syn.q);
      if (r.matched >= need) out.push({ p: p, matched: r.matched, score: r.score });
    });
    out.sort(function (a, b) {
      return (b.matched - a.matched) || (b.score - a.score) ||
        ((b.p.inStock ? 1 : 0) - (a.p.inStock ? 1 : 0)) || (b.p.popularity - a.p.popularity);
    });
    return { items: out.map(function (o) { return o.p; }), toks: toks, used: syn.used, q: syn.q };
  }

  function exactMatches(raw) {
    var syn = applySynonyms(normalise(raw));
    var toks = tokensOf(syn.q);
    if (!toks.length) return [];
    return D.products.filter(function (p) { return scoreProduct(p, toks, syn.q).matched === toks.length; })
      .sort(function (a, b) { return b.popularity - a.popularity; });
  }

  function stockSentence(p) {
    return p.inStock
      ? 'the **' + p.name + '** (' + p.sku + ') is in stock, ' + p.stock + ' at ' + money(p.price) + ' ex VAT (' + money(incVat(p.price)) + ' inc VAT), ' + p.unit + '.'
      : 'the **' + p.name + '** (' + p.sku + ', ' + money(p.price) + ' ex VAT, ' + p.unit + ') is out of stock at the moment, back in about ' + p.leadTimeDays + ' working days. You can order it now and it’ll go out as soon as it lands.';
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function highlight(text, toks) {
    var safe = esc(text);
    if (!toks || !toks.length) return safe;
    var parts = toks.filter(function (t) { return t.length > 1 || /\d/.test(t); })
      .map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); })
      .sort(function (a, b) { return b.length - a.length; });
    if (!parts.length) return safe;
    var re = new RegExp('(^|[\\s(×\\-])(' + parts.join('|') + ')', 'gi');
    return safe.replace(re, '$1<mark>$2</mark>');
  }

  function looksLikeQuestion(raw) {
    var q = normalise(raw);
    if (!q) return false;
    if (/\?\s*$/.test(raw)) return true;
    if (/^(how|what|which|can|could|do|does|is|are|will|should|would|why|when|where|who|have you|got any|any good|i need|i'm|im|i am|i want|need|looking for|best)\b/.test(q)) return true;
    if (/\b(fix|fixing|fit|fitting|run|running|seal|sealing|mount|mounting|hang|hanging|connect|connecting|wire|wiring|replace|replacing|install|installing|join|joining|repair|attach)\b/.test(q)) return true;
    // Anything the counter has a scripted answer for counts as a question once it is more than a product name.
    var known = A.match(raw);
    if (known === 'hello' || (known && q.split(' ').length >= 3)) return true;
    return q.split(' ').length >= 5;
  }

  function sectionMatches(toks, items) {
    var seen = {}, out = [];
    // Subcategories named in the query first, then the subcategories of the top products.
    D.products.forEach(function (p) {
      var key = p.category + '|' + p.subcategory;
      if (seen[key]) return;
      var sub = words(p.subcategory);
      if (toks.some(function (t) { return wordHit(sub, t); })) { seen[key] = 1; out.push({ section: p.category, sub: p.subcategory }); }
    });
    items.slice(0, 4).forEach(function (p) {
      var key = p.category + '|' + p.subcategory;
      if (!seen[key]) { seen[key] = 1; out.push({ section: p.category, sub: p.subcategory }); }
    });
    return out.slice(0, 2);
  }

  function countIn(section, sub) {
    return D.products.filter(function (p) { return p.category === section && (!sub || p.subcategory === sub); }).length;
  }

  // ---------------------------------------------------------------- Elements

  var input = $('#q');
  var form = $('#search-form');
  var ac = $('#ac');
  var acList = $('#ac-list');
  var acNote = $('#ac-note');
  var acStatus = $('#ac-status');
  var stage = $('#stage');
  var home = $('#home');
  var results = $('#results');
  var thread = $('#thread');
  var listing = $('#listing');

  // ---------------------------------------------------------------- Static renders

  function renderNav() {
    $('#nav-list').innerHTML = D.sections.map(function (s) {
      return '<li><a href="#' + s.id + '" data-section="' + s.id + '">' + esc(s.short) + '</a></li>';
    }).join('');
    $('#index').innerHTML = D.sections.map(function (s) {
      return '<li><a class="index-item" href="#' + s.id + '" data-section="' + s.id + '">' +
        '<span class="index-no">' + s.no + '</span>' +
        '<span class="index-name">' + esc(s.name) + '</span>' +
        '<span class="index-blurb">' + esc(s.blurb) + '</span>' +
        '<span class="index-count">' + countIn(s.id) + ' lines</span>' +
        '<img class="index-img" src="' + img(s.img, 240) + '" width="240" height="240" alt="" loading="lazy">' +
        '</a></li>';
    }).join('');
  }

  function productCard(p, toks) {
    var st = stockInfo(p);
    var specs = Object.keys(p.specs).slice(0, 2).map(function (k) { return '<li>' + esc(p.specs[k]) + '</li>'; }).join('');
    var buy = buyButton(p);
    return '<article class="pcard" data-sku="' + p.sku + '">' +
      '<div class="pcard-img"><img src="' + img(p.img, 640) + '" srcset="' + img(p.img, 240) + ' 240w, ' + img(p.img, 640) + ' 640w" sizes="(max-width: 600px) 45vw, 260px" width="640" height="640" alt="" loading="lazy"></div>' +
      '<div class="pcard-body">' +
      '<p class="pcard-brand">' + esc(p.brand) + (p.tradeOnly ? ' <span class="badge">Trade only</span>' : '') + '</p>' +
      '<h3 class="pcard-name">' + highlight(p.name, toks) + '</h3>' +
      '<p class="sku">' + p.sku + '</p>' +
      '<ul class="pcard-specs">' + specs + '</ul>' +
      '<p class="stock ' + st.cls + '">' + st.text + '</p>' +
      '<div class="pcard-buy"><p class="price"><span class="price-n">' + money(p.price) + '</span><span class="price-u">ex VAT · ' + esc(p.unit) + '</span><span class="price-inc">' + money(incVat(p.price)) + ' inc VAT</span></p>' + buy + '</div>' +
      '</div></article>';
  }

  function addLabel(p) {
    var l = lineOf(p.sku);
    if (l) return icon('tick') + l.qty + ' in basket<span class="sr-only">. Add another ' + esc(p.name) + '</span>';
    if (!p.inStock) return 'Order · ' + p.leadTimeDays + ' days<span class="sr-only">: ' + esc(p.name) + ', dispatches in about ' + p.leadTimeDays + ' working days</span>';
    return 'Add<span class="sr-only"> ' + esc(p.name) + ' to basket</span>';
  }
  function buyButton(p) {
    if (p.tradeOnly) return '<button class="btn-trade" type="button" data-ask="How do I open a trade account?">' + icon('lock') + 'Trade account</button>';
    return '<button class="btn-add' + (lineOf(p.sku) ? ' is-in' : '') + '" type="button" data-add="' + p.sku + '">' + addLabel(p) + '</button>';
  }
  function refreshAddButtons() {
    $$('.btn-add').forEach(function (b) {
      if (b.classList.contains('is-added')) return;
      var p = bySku[b.dataset.add];
      b.classList.toggle('is-in', !!lineOf(p.sku));
      b.innerHTML = addLabel(p);
    });
  }

  function renderPopular() {
    var seenImg = {};
    var top = D.products.slice().sort(function (a, b) { return b.popularity - a.popularity; })
      .filter(function (p) {
        if (p.tradeOnly || seenImg[p.img]) return false;
        seenImg[p.img] = 1; return true;
      }).slice(0, 8);
    $('#popular').innerHTML = top.map(function (p) { return productCard(p); }).join('');
  }

  // ---------------------------------------------------------------- Autocomplete

  var options = [];
  var active = -1;
  var lastQuery = '';

  var POPULAR_QS = [
    'I need something to fix a heavy bracket into concrete',
    'I’m running 15mm PEX to a radiator, which fittings do I need?',
    'Is delivery free and when would I get it?',
  ];

  function openAc() {
    if (!options.length) return closeAc();
    ac.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    $('#search-field').classList.add('is-open');
  }
  function closeAc() {
    ac.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    $('#search-field').classList.remove('is-open');
    active = -1;
  }

  function setActive(i) {
    options.forEach(function (o) { o.el.classList.remove('is-active'); o.el.setAttribute('aria-selected', 'false'); });
    active = i;
    if (i < 0) { input.removeAttribute('aria-activedescendant'); return; }
    var o = options[i];
    o.el.classList.add('is-active');
    o.el.setAttribute('aria-selected', 'true');
    input.setAttribute('aria-activedescendant', o.el.id);
    var box = acList, r = o.el.offsetTop, h = o.el.offsetHeight;
    if (r < box.scrollTop) box.scrollTop = r;
    else if (r + h > box.scrollTop + box.clientHeight) box.scrollTop = r + h - box.clientHeight;
  }

  function askRow(q, id, label) {
    return '<div class="ac-opt ac-ask" role="option" id="' + id + '" aria-selected="false" data-kind="ask" data-q="' + esc(q) + '">' +
      '<span class="ac-ask-ic">' + icon('counter') + '</span>' +
      '<span class="ac-ask-txt"><span class="ac-ask-k">' + (label || 'Ask the counter') + '</span><span class="ac-ask-q">“' + esc(q) + '”</span></span>' +
      '<span class="ac-ask-go">' + icon('arrow') + '</span></div>';
  }

  function renderAc(raw) {
    var q = raw.trim();
    lastQuery = q;
    var html = '';
    var note = '';
    if (!q) {
      html = '<div class="ac-group" role="group" aria-labelledby="ac-h-pop"><div class="ac-head" id="ac-h-pop" role="presentation">Ask the counter</div>' +
        POPULAR_QS.map(function (pq, i) { return askRow(pq, 'opt-pop-' + i, 'Popular question'); }).join('') + '</div>';
    } else {
      var res = search(q);
      var isQ = looksLikeQuestion(q);
      var items = res.items.slice(0, isQ ? 4 : 5);
      if (isQ) html += askRow(q, 'opt-ask');
      if (res.used.length) {
        note = res.used.map(function (u) { return 'Showing <b>' + esc(u.to) + '</b> for “' + esc(u.from) + '”'; }).join(' · ');
      }
      if (items.length) {
        html += '<div class="ac-group" role="group" aria-labelledby="ac-h-prod"><div class="ac-head" id="ac-h-prod" role="presentation">Products</div>' +
          items.map(function (p, i) {
            var st = stockInfo(p);
            return '<div class="ac-opt ac-prod" role="option" id="opt-p-' + i + '" aria-selected="false" data-kind="product" data-sku="' + p.sku + '">' +
              '<img class="ac-thumb" src="' + img(p.img, 240) + '" width="56" height="56" alt="">' +
              '<span class="ac-prod-txt"><span class="ac-prod-name">' + highlight(p.name, res.toks) + '</span>' +
              '<span class="ac-prod-meta">' + esc(p.brand) + ' · <span class="sku">' + p.sku + '</span></span></span>' +
              '<span class="ac-prod-side"><span class="ac-price">' + money(p.price) + '</span><span class="stock ' + st.cls + '">' + st.short + '</span></span></div>';
          }).join('') + '</div>';
        var secs = sectionMatches(res.toks, res.items);
        if (secs.length) {
          html += '<div class="ac-group" role="group" aria-labelledby="ac-h-sec"><div class="ac-head" id="ac-h-sec" role="presentation">Sections</div>' +
            secs.map(function (s, i) {
              return '<div class="ac-opt ac-sec" role="option" id="opt-s-' + i + '" aria-selected="false" data-kind="section" data-section="' + s.section + '" data-sub="' + esc(s.sub) + '">' +
                icon('section', 'ac-sec-ic') + '<span><b>' + highlight(s.sub, res.toks) + '</b> in ' + esc(sectionById[s.section].name) + '</span><span class="ac-count">' + countIn(s.section, s.sub) + '</span></div>';
            }).join('') + '</div>';
        }
        html += '<div class="ac-opt ac-all" role="option" id="opt-all" aria-selected="false" data-kind="all" data-q="' + esc(q) + '">See all results for “' + esc(q) + '”' + icon('arrow') + '</div>';
      } else if (!isQ) {
        html += askRow(q, 'opt-ask', 'No products match. Ask the counter');
      }
    }
    acList.innerHTML = html;
    acNote.innerHTML = note;
    acNote.hidden = !note;
    options = $$('.ac-opt', acList).map(function (el) { return { el: el }; });
    active = -1;
    input.removeAttribute('aria-activedescendant');
    var n = $$('.ac-prod', acList).length;
    acStatus.textContent = q ? (n ? n + (n === 1 ? ' product suggestion' : ' product suggestions') : 'No product suggestions') + ($('#opt-ask') ? ', ask the counter available' : '') : '';
    openAc();
  }

  function choose(el) {
    var kind = el.dataset.kind;
    closeAc();
    if (kind === 'ask') { var q = el.dataset.q; input.value = q; ask(q); }
    else if (kind === 'product') { var p = bySku[el.dataset.sku]; input.value = p.name; showListing(p.name, { focusSku: p.sku }); }
    else if (kind === 'section') showSection(el.dataset.section, el.dataset.sub);
    else showListing(el.dataset.q);
  }

  var acTimer = 0;
  input.addEventListener('input', function () {
    clearTimeout(acTimer);
    acTimer = setTimeout(function () { renderAc(input.value); }, 40);
  });
  input.addEventListener('focus', function () {
    // On a phone, lift the search to the top so the suggestions have room.
    if (window.matchMedia('(max-width: 640px)').matches && !stage.classList.contains('is-compact')) {
      var y = form.getBoundingClientRect().top + window.scrollY - 12;
      if (Math.abs(window.scrollY - y) > 40) window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
    } if (!input.value.trim() || lastQuery !== input.value.trim()) renderAc(input.value); else openAc(); });
  input.addEventListener('click', function () { if (ac.hidden) renderAc(input.value); });
  input.addEventListener('blur', function () { setTimeout(function () { if (document.activeElement !== input) closeAc(); }, 150); });

  input.addEventListener('keydown', function (e) {
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && lastQuery !== input.value.trim()) {
      // Typing outran the debounce: catch the list up before moving through it.
      clearTimeout(acTimer);
      renderAc(input.value);
    }
    if (e.key === 'Enter' && lastQuery !== input.value.trim()) { clearTimeout(acTimer); active = -1; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (ac.hidden) { renderAc(input.value); return; }
      setActive(active + 1 >= options.length ? 0 : active + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (ac.hidden) { renderAc(input.value); return; }
      setActive(active - 1 < 0 ? options.length - 1 : active - 1);
    } else if (e.key === 'Enter') {
      if (!ac.hidden && active >= 0) { e.preventDefault(); choose(options[active].el); }
    } else if (e.key === 'Escape') {
      if (!ac.hidden) { e.preventDefault(); closeAc(); }
      else if (input.value) { e.preventDefault(); input.value = ''; }
    } else if (e.key === 'Tab') {
      closeAc();
    }
  });

  acList.addEventListener('mousedown', function (e) { e.preventDefault(); });
  acList.addEventListener('click', function (e) {
    var el = e.target.closest('.ac-opt');
    if (el) choose(el);
  });
  acList.addEventListener('mousemove', function (e) {
    var el = e.target.closest('.ac-opt');
    if (!el) return;
    var i = options.findIndex(function (o) { return o.el === el; });
    if (i !== active) setActive(i);
  });
  document.addEventListener('mousedown', function (e) {
    if (!e.target.closest('#search-field')) closeAc();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var q = input.value.trim();
    closeAc();
    if (!q) { input.focus(); return; }
    if (looksLikeQuestion(q)) ask(q); else showListing(q);
  });

  // ---------------------------------------------------------------- Views

  function settleInput() {
    if (isPhone() && document.activeElement === input) input.blur();
    requestAnimationFrame(function () { try { input.setSelectionRange(0, 0); } catch (e) {} input.scrollLeft = 0; });
  }

  function enterResults(mode) {
    settleInput();
    results.classList.toggle('is-list', mode === 'list');
    stage.classList.add('is-compact');
    home.hidden = true;
    results.hidden = false;
  }

  function goHome() {
    stage.classList.remove('is-compact');
    home.hidden = false;
    results.hidden = true;
    thread.innerHTML = '';
    listing.innerHTML = '';
    input.value = '';
    runId++;
    window.scrollTo(0, 0);
  }

  function scrollToEl(el, offset) {
    var y = el.getBoundingClientRect().top + window.scrollY - (offset || 16);
    window.scrollTo({ top: Math.max(0, y), behavior: reduced ? 'auto' : 'smooth' });
  }

  // ---- Keyword listing

  var listState = null;

  function showListing(q, opts) {
    opts = opts || {};
    runId++;
    enterResults('list');
    thread.innerHTML = '';
    var res = search(q, { strict: true });
    if (!res.items.length) res = search(q);
    listState = { title: q, items: res.items, toks: res.toks, used: res.used, filter: 'all', sort: 'relevance', focusSku: opts.focusSku, isQ: looksLikeQuestion(q), q: q };
    renderListing();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function showSection(id, sub) {
    runId++;
    enterResults('list');
    thread.innerHTML = '';
    var s = sectionById[id];
    var items = D.products.filter(function (p) { return p.category === id && (!sub || p.subcategory === sub); })
      .sort(function (a, b) { return ((b.inStock ? 1 : 0) - (a.inStock ? 1 : 0)) || (b.popularity - a.popularity); });
    input.value = '';
    listState = { title: sub ? sub : s.name, section: s, sub: sub, items: items, toks: [], used: [], filter: 'all', sort: 'relevance' };
    renderListing();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function renderListing() {
    var st = listState;
    var cats = [];
    st.items.forEach(function (p) { if (cats.indexOf(p.category) < 0) cats.push(p.category); });
    var items = st.items.filter(function (p) { return st.filter === 'all' || p.category === st.filter; });
    if (st.sort === 'price') items = items.slice().sort(function (a, b) { return a.price - b.price; });
    if (st.sort === 'stock') items = items.slice().sort(function (a, b) { return (b.inStock ? 1 : 0) - (a.inStock ? 1 : 0) || b.popularity - a.popularity; });
    if (st.focusSku) items = items.slice().sort(function (a, b) { return (b.sku === st.focusSku) - (a.sku === st.focusSku); });

    var head = st.section
      ? '<p class="kicker">' + esc(st.section.no) + ' · ' + esc(st.section.name) + '</p><h2 class="list-h">' + esc(st.title) + '</h2>'
      : '<p class="kicker">Search results</p><h2 class="list-h">' + st.items.length + (st.items.length === 1 ? ' product' : ' products') + ' for “' + esc(st.title) + '”</h2>';
    var note = st.used && st.used.length
      ? '<p class="list-note">' + icon('swap') + st.used.map(function (u) { return 'Showing <b>' + esc(u.to) + '</b> for “' + esc(u.from) + '”'; }).join(' · ') + '</p>' : '';
    var askLink = st.q ? '<button class="ask-link" type="button" data-ask="' + esc(st.q) + '">' + icon('counter') + 'Ask the counter about “' + esc(st.q) + '”</button>' : '';

    var filters = cats.length > 1
      ? '<div class="filters" role="group" aria-label="Filter by section">' +
        '<button type="button" class="filter" data-filter="all" aria-pressed="' + (st.filter === 'all') + '">All <span>' + st.items.length + '</span></button>' +
        cats.map(function (c) {
          var n = st.items.filter(function (p) { return p.category === c; }).length;
          return '<button type="button" class="filter" data-filter="' + c + '" aria-pressed="' + (st.filter === c) + '">' + esc(sectionById[c].short) + ' <span>' + n + '</span></button>';
        }).join('') + '</div>' : '<div></div>';
    var sort = '<label class="sort"><span>Sort</span><select id="sort">' +
      '<option value="relevance"' + (st.sort === 'relevance' ? ' selected' : '') + '>Best match</option>' +
      '<option value="price"' + (st.sort === 'price' ? ' selected' : '') + '>Price, low to high</option>' +
      '<option value="stock"' + (st.sort === 'stock' ? ' selected' : '') + '>In stock first</option></select></label>';

    var body = items.length
      ? '<div class="grid">' + items.map(function (p) { return productCard(p, st.toks); }).join('') + '</div>'
      : '<div class="empty"><p class="empty-h">Nothing in the catalogue matches “' + esc(st.title) + '”.</p><p>Try a product name, a size such as “15mm” or “M10”, or a SKU. Or describe the job and the counter will have a go.</p>' + askLink + '</div>';

    listing.innerHTML = '<div class="list-head"><div>' + head + note + '</div>' + (items.length ? askLink : '') + '</div>' +
      (items.length ? '<div class="list-tools">' + filters + sort + '</div>' : '') + body;
  }

  listing.addEventListener('click', function (e) {
    var f = e.target.closest('.filter');
    if (f) { listState.filter = f.dataset.filter; renderListing(); $('.filter[data-filter="' + listState.filter + '"]', listing).focus(); }
  });
  listing.addEventListener('change', function (e) {
    if (e.target.id === 'sort') { listState.sort = e.target.value; renderListing(); $('#sort').focus(); }
  });

  // ---- Ask the counter

  var runId = 0;

  function ask(q) {
    runId++;
    enterResults('ask');
    listing.innerHTML = '';
    thread.innerHTML = '';
    input.value = q;
    var id = A.match(q);
    var turn = addTurn(q);
    turn.classList.add('is-latest');
    window.scrollTo({ top: 0, behavior: 'auto' });
    settleInput();
    var myRun = runId;
    setTimeout(function () { if (myRun === runId) scrollToEl(turn, headerOffset()); }, 380 / SPEED);
    playTurn(turn, id, q, runId);
  }

  function headerOffset() {
    var top = $('.top');
    return getComputedStyle(top).position === 'sticky' ? top.offsetHeight + 18 : 16;
  }

  function followUp(label, to) {
    $$('.chips', thread).forEach(function (c) { c.classList.add('is-used'); });
    $$('.turn.is-latest', thread).forEach(function (t) { t.classList.remove('is-latest'); });
    var turn = addTurn(label);
    turn.classList.add('is-latest');
    var myRun = runId;
    // Let the new turn exist, then bring it to the top of the view, under the sticky header.
    requestAnimationFrame(function () { scrollToEl(turn, headerOffset()); });
    playTurn(turn, to, label, myRun);
  }

  var turnNo = 0;
  function addTurn(q) {
    turnNo++;
    var first = !thread.children.length;
    var el = document.createElement('article');
    el.className = 'turn';
    el.setAttribute('aria-labelledby', 'turn-q-' + turnNo);
    el.innerHTML =
      '<header class="turn-q"><p class="kicker">' + (first ? 'You asked' : 'Then you asked') + '</p><h3 class="turn-h" id="turn-q-' + turnNo + '">“' + esc(q) + '”</h3></header>' +
      '<ol class="docket" aria-label="What the counter looked up"></ol>' +
      '<div class="answer" aria-live="polite" aria-busy="true"></div>' +
      '<div class="cards" role="group" aria-label="Products in this answer"></div>' +
      '<div class="chips-wrap"></div>';
    thread.appendChild(el);
    return el;
  }

  function fallbackAnswer(q) {
    // An exact SKU gets a straight stock answer.
    var skuMatch = q.toUpperCase().match(/\b[A-Z]{2}-[A-Z0-9]+(?:-[A-Z0-9]+)*\b/);
    if (skuMatch && bySku[skuMatch[0]]) {
      var p = bySku[skuMatch[0]];
      var st = p.inStock ? 'Yes, **' + p.stock + ' in stock** at ' + money(p.price) + ' ex VAT, ' + p.unit + '.'
        : 'It’s **out of stock** at the moment, back in about ' + p.leadTimeDays + ' working days. It’s ' + money(p.price) + ' ex VAT, ' + p.unit + '.';
      return { lookups: ['Looking up ' + p.sku, 'Checking stock'], text: p.sku + ' is the ' + p.name + '. ' + st, cards: [p.sku], why: {}, chips: [{ label: 'Delivery to site?', to: 'delivery' }] };
    }
    var flat = q.replace(/[’]/g, "'");
    var price = flat.match(/(?:how much (?:is|are|for|does|do)?|what(?:'s| is| does)? (?:the )?(?:price|cost)(?: of)?|price (?:of|for)|cost of)\s+(?:a |an |the |your )?(.+?)[?.!]*$/i);
    if (price) {
      var what = price[1].replace(/\b(inc(luding)?|ex(cluding)?|plus|with)\s*vat\b/ig, '').replace(/\b(cost|costs|come to)\b/ig, '').trim();
      var exact = exactMatches(what);
      var pick = exact.length ? exact : search(what, { strict: true }).items;
      if (!pick.length) pick = search(what).items.slice(0, 1);
      if (pick.length) {
        var pp = pick[0];
        var others = pick.length > 1 ? '\n\n' + (pick.length - 1 === 1 ? 'There’s one other close match' : 'There are ' + (pick.length - 1) + ' other close matches') + ' in the cards.' : '';
        return {
          lookups: ['Looking up price · “' + what + '”', 'Checking stock'],
          text: 'The **' + pp.name + '** (' + pp.sku + ') is **' + money(pp.price) + ' ex VAT**, which is **' + money(incVat(pp.price)) + ' inc VAT** at 20%, ' + pp.unit + '. ' +
            (pp.inStock ? 'It’s in stock: ' + pp.stock + ' at the counter.' : 'It’s out of stock at the moment, back in about ' + pp.leadTimeDays + ' working days.') + others,
          cards: pick.slice(0, 3).map(function (x) { return x.sku; }), why: {},
          chips: [{ label: 'Is delivery free?', to: 'delivery' }],
        };
      }
    }
    var sell = q.replace(/[’]/g, "'").match(/(?:do you|d'you|you)\s+(?:sell|stock|have|carry|do)\s+(?:any\s+)?(.+?)[?.!]*$/i) ||
      q.replace(/[’]/g, "'").match(/(?:have you got|got any|any)\s+(.+?)[?.!]*$/i);
    if (sell) {
      var term = sell[1].trim();
      var spot = exactMatches(term);
      if (spot.length && spot.length <= 3) {
        return {
          lookups: ['Searching catalogue · “' + term + '”', 'Checking stock'],
          text: spot.length === 1
            ? cap(stockSentence(spot[0]).replace(/^the /, 'Yes, the ').replace(/^Yes, the (.*) is out of stock/, 'We do list it: the $1 is out of stock'))
            : 'We list ' + spot.length + ' that match:\n\n' + spot.map(function (x) { return '- ' + cap(stockSentence(x)); }).join('\n'),
          cards: spot.map(function (x) { return x.sku; }), why: {},
          chips: [{ label: 'Delivery to site?', to: 'delivery' }],
        };
      }
      var found = search(term, { strict: true });
      if (found.items.length) {
        return {
          lookups: ['Searching catalogue · “' + term + '”', 'Checking stock'],
          text: found.items.length === 1 ? 'Yes, we stock one line for “' + term + '”: the **' + found.items[0].name + '** (' + found.items[0].sku + ', ' + money(found.items[0].price) + ' ex VAT).'
            : 'Yes, we stock ' + found.items.length + ' lines for “' + term + '”.' + (found.items.length > 3 ? ' Here are the three most ordered; search for “' + term + '” to see them all.' : ''),
          cards: found.items.slice(0, 3).map(function (x) { return x.sku; }), why: {},
          chips: [{ label: 'Delivery to site?', to: 'delivery' }],
        };
      }
      return {
        lookups: ['Searching catalogue · “' + term + '”'],
        text: 'No, we don’t sell ' + term + '. Our range is fixings, plumbing, electrical, sealants and adhesives, PPE and tools for the trades.\n\nIf it’s for a job, tell me what you’re doing and I’ll check what you need from us.',
        cards: [], why: {},
        chips: [
          { label: 'Fix a heavy bracket into concrete', to: 'concrete' },
          { label: 'Seal round a shower tray', to: 'shower' },
        ],
      };
    }
    var res = search(q, { strict: true });
    var partial = false;
    if (!res.items.length) { res = search(q); partial = res.items.length > 0; }
    var hits = res.items.slice(0, 3);
    var text = !hits.length
      ? 'I couldn’t match that to anything in our catalogue, and I’d rather not guess. Try naming the material, size or job, for example “15mm push-fit” or “seal round a shower tray”. Or ring the counter on ' + A.phone + ' and someone will help.'
      : partial
        ? 'I couldn’t find an exact match for that, and I’d rather not guess. These match some of your words, so one of them might be what you need.\n\nIf not, tell me the material, size or job, or ring the counter on ' + A.phone + '.'
        : 'I’m not confident I’ve understood that one, and I’d rather not guess. A plain search for your words found these, which might be close.\n\nIf they’re not right, tell me the material, size or job (for example “seal round a shower tray”), or ring the counter on ' + A.phone + '.';
    return {
      lookups: ['Searching catalogue · “' + (q.length > 40 ? q.slice(0, 38) + '…' : q) + '”'],
      text: text,
      cards: hits.map(function (p) { return p.sku; }),
      why: {},
      chips: [
        { label: 'Fix a heavy bracket into concrete', to: 'concrete' },
        { label: 'Seal round a shower tray', to: 'shower' },
      ],
    };
  }

  async function playTurn(turn, id, q, myRun) {
    var ans = id ? A.answers[id] : fallbackAnswer(q);
    var alive = function () { return myRun === runId && turn.isConnected; };
    var docket = $('.docket', turn);
    var answer = $('.answer', turn);

    await wait(260);
    for (var i = 0; i < ans.lookups.length; i++) {
      if (!alive()) return;
      var li = document.createElement('li');
      li.className = 'is-running';
      li.innerHTML = '<span class="docket-ic">' + icon('search') + icon('tick', 'tick') + '</span><span class="docket-t">' + esc(ans.lookups[i]) + '</span>';
      docket.appendChild(li);
      await wait(reduced ? 250 : 660);
      li.className = 'is-done';
    }
    if (!alive()) return;
    answer.innerHTML = '<p class="typing"><span class="sr-only">The counter is typing</span><i></i><i></i><i></i></p>';
    await wait(reduced ? 200 : 500);
    if (!alive()) return;
    answer.innerHTML = '';
    var list = (ans.cards || []).slice(0, 3);
    var cardsEl = $('.cards', turn);
    var shown = {};
    function showCard(sku) {
      if (shown[sku] || list.indexOf(sku) < 0) return;
      if (!cardsEl.children.length) cardsEl.innerHTML = '<p class="cards-k">Parts for this job <span>' + list.length + '</span></p>';
      shown[sku] = true;
      cardsEl.insertAdjacentHTML('beforeend', answerCard(bySku[sku], (ans.why || {})[sku], 0));
    }
    await streamText(answer, ans.text, alive, showCard);
    if (!alive()) return;
    answer.setAttribute('aria-busy', 'false');
    var late = list.filter(function (sku) { return !shown[sku]; });
    late.forEach(showCard);
    if (late.length) await wait(reduced ? 0 : 420);
    if (!alive()) return;
    if (ans.chips && ans.chips.length) {
      $('.chips-wrap', turn).innerHTML = '<p class="chips-k">Ask next</p><div class="chips" role="group" aria-label="Follow-up questions">' +
        ans.chips.map(function (c) { return '<button type="button" class="chip" data-to="' + c.to + '">' + esc(c.label) + '</button>'; }).join('') + '</div>';
    }
    turn.classList.add('is-complete');
  }

  function parseBlocks(text) {
    return text.split(/\n\n+/).map(function (block) {
      var lines = block.split('\n');
      if (lines.every(function (l) { return /^- /.test(l); })) return { type: 'ul', items: lines.map(function (l) { return inline(l.slice(2)); }) };
      return { type: 'p', items: [inline(block)] };
    });
  }
  function inline(s) {
    var segs = [];
    s.split('**').forEach(function (part, i) {
      if (!part) return;
      part.split(/(\b[A-Z]{2}-[A-Z0-9]+(?:-[A-Z0-9]+)*\b)/).forEach(function (bit) {
        if (!bit) return;
        segs.push({ t: bit, b: i % 2 === 1, sku: /^[A-Z]{2}-[A-Z0-9]/.test(bit) && !!bySku[bit] });
      });
    });
    return segs;
  }

  async function streamText(host, text, alive, onSku) {
    var blocks = parseBlocks(text);
    var rnd = seeded(text);
    var base = inTour ? 52 : 40;
    var caret = document.createElement('span');
    caret.className = 'caret';
    caret.setAttribute('aria-hidden', 'true');
    for (var b = 0; b < blocks.length; b++) {
      var block = blocks[b];
      var el = document.createElement(block.type);
      host.appendChild(el);
      for (var it = 0; it < block.items.length; it++) {
        var line = block.type === 'ul' ? el.appendChild(document.createElement('li')) : el;
        for (var s = 0; s < block.items[it].length; s++) {
          var seg = block.items[it][s];
          var node = document.createElement(seg.sku ? 'span' : seg.b ? 'strong' : 'span');
          if (seg.sku) node.className = 'sku';
          if (seg.b && seg.sku) node.className = 'sku is-b';
          line.appendChild(node);
          line.appendChild(caret);
          if (seg.sku) { node.textContent = seg.t; if (onSku) onSku(seg.t); await wait(reduced ? 0 : 90); continue; }
          var parts = seg.t.match(/\S+\s*|\s+/g) || [];
          var i = 0;
          while (i < parts.length) {
            if (!alive()) return;
            var take = reduced ? parts.length : 1 + (rnd() < 0.45 ? 1 : 0);
            var chunk = parts.slice(i, i + take).join('');
            node.textContent += chunk;
            i += take;
            if (reduced) break;
            var d = base + rnd() * 30;
            if (/[.:!?]\s*$/.test(chunk)) d += 130;
            else if (/[,;]\s*$/.test(chunk)) d += 60;
            await wait(d);
          }
        }
        if (block.type === 'ul') await wait(reduced ? 0 : 90);
      }
      await wait(reduced ? 0 : 120);
    }
    caret.remove();
  }

  function answerCard(p, why, n) {
    var st = stockInfo(p);
    var buy = buyButton(p);
    return '<article class="acard" style="--n:' + n + '">' +
      '<div class="acard-img"><img src="' + img(p.img, 240) + '" width="240" height="240" alt=""></div>' +
      '<div class="acard-body">' +
      '<p class="acard-brand">' + esc(p.brand) + ' · <span class="sku">' + p.sku + '</span>' + (p.tradeOnly ? ' <span class="badge">Trade only</span>' : '') + '</p>' +
      '<h4 class="acard-name">' + esc(p.name) + '</h4>' +
      (why ? '<p class="acard-why">' + esc(why) + '</p>' : '') +
      '<p class="stock ' + st.cls + '">' + st.text + '</p>' +
      '<div class="acard-buy"><p class="price"><span class="price-n">' + money(p.price) + '</span><span class="price-u">ex VAT · ' + esc(p.unit) + '</span></p>' + buy + '</div>' +
      '</div></article>';
  }

  thread.addEventListener('click', function (e) {
    var chip = e.target.closest('.chip');
    if (chip && !chip.closest('.is-used')) { if (chip === pointerTarget) chip.blur(); followUp(chip.textContent, chip.dataset.to); }
  });

  // ---------------------------------------------------------------- Basket

  var basket = []; // [{sku, qty}]
  var dlg = $('#basket');

  function lineOf(sku) { return basket.find(function (l) { return l.sku === sku; }); }
  function totals() {
    var sub = basket.reduce(function (s, l) { return s + bySku[l.sku].price * l.qty; }, 0);
    sub = Math.round(sub * 100) / 100;
    var del = !basket.length ? 0 : (sub > D.freeDeliveryOver ? 0 : D.deliveryCharge);
    var vat = Math.round((sub + del) * D.vatRate * 100) / 100;
    return { sub: sub, del: del, vat: vat, total: Math.round((sub + del + vat) * 100) / 100, count: basket.reduce(function (n, l) { return n + l.qty; }, 0) };
  }

  function addToBasket(sku, btn) {
    var p = bySku[sku];
    var l = lineOf(sku);
    if (l) l.qty++; else basket.push({ sku: sku, qty: 1 });
    renderBasket();
    var c = $('#basket-count');
    c.classList.remove('is-bump'); void c.offsetWidth; c.classList.add('is-bump');
    $$('.btn-add[data-add="' + sku + '"]').forEach(function (b) {
      b.classList.add('is-added');
      b.innerHTML = icon('tick') + 'Added<span class="sr-only"> ' + esc(p.name) + '</span>';
      clearTimeout(b._t);
      b._t = setTimeout(function () { b.classList.remove('is-added'); refreshAddButtons(); }, 1400);
    });
    // A mouse click should not leave a keyboard focus ring behind.
    if (btn && btn === pointerTarget) btn.blur();
    toast(p, l ? l.qty : 1);
  }

  var toastTimer = 0;
  var toastEl = $('#toast');
  function toast(p, qty) {
    var t = totals();
    toastEl.innerHTML = '<img src="' + img(p.img, 240) + '" width="48" height="48" alt="">' +
      '<div class="toast-txt"><p class="toast-k">' + icon('tick') + 'Added to your basket</p><p class="toast-n">' + (qty > 1 ? qty + ' × ' : '') + esc(p.name) + '</p>' +
      '<p class="toast-s">' + t.count + (t.count === 1 ? ' item' : ' items') + ' · ' + money(t.sub) + ' ex VAT</p></div>' +
      '<button type="button" class="toast-btn" data-open-basket>View basket</button>';
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, isPhone() ? 2600 : 4200);
  }
  toastEl.addEventListener('mouseenter', function () { clearTimeout(toastTimer); });
  toastEl.addEventListener('mouseleave', function () { toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2000); });

  function renderBasket() {
    var t = totals();
    refreshAddButtons();
    $('#basket-count').textContent = t.count;
    $('#basket-btn').classList.toggle('has-items', t.count > 0);
    $('#basket-sr').textContent = t.count ? ', ' + t.count + (t.count === 1 ? ' item' : ' items') + ', ' + money(t.sub) + ' ex VAT' : ', empty';
    var body = $('#basket-body'), foot = $('#basket-foot');
    if (!basket.length) {
      body.innerHTML = '<div class="basket-empty">' + icon('basket') + '<p>Your basket is empty.</p><p class="muted">Search above, or ask the counter what the job needs.</p></div>';
      foot.innerHTML = '';
      return;
    }
    body.innerHTML = '<ul class="lines">' + basket.map(function (l) {
      var p = bySku[l.sku];
      var st = p.inStock ? '' : '<p class="line-note">Dispatches when back in stock, about ' + p.leadTimeDays + ' working days</p>';
      return '<li class="line"><img src="' + img(p.img, 240) + '" width="64" height="64" alt="">' +
        '<div class="line-main"><p class="line-name">' + esc(p.name) + '</p><p class="sku">' + p.sku + ' · ' + esc(p.unit) + '</p>' + st +
        '<div class="qty" role="group" aria-label="Quantity of ' + esc(p.name) + '">' +
        '<button type="button" class="qty-btn" data-dec="' + p.sku + '" aria-label="One fewer">' + icon('minus') + '</button>' +
        '<span class="qty-n" aria-live="polite">' + l.qty + '</span>' +
        '<button type="button" class="qty-btn" data-inc="' + p.sku + '" aria-label="One more">' + icon('plus') + '</button>' +
        '<button type="button" class="link-btn line-rm" data-rm="' + p.sku + '">Remove<span class="sr-only"> ' + esc(p.name) + '</span></button></div></div>' +
        '<p class="line-price">' + money(p.price * l.qty) + '</p></li>';
    }).join('') + '</ul>';
    var short = Math.max(0, D.freeDeliveryOver - t.sub);
    foot.innerHTML =
      (t.del ? '<p class="free-bar"><span style="width:' + Math.min(100, t.sub / D.freeDeliveryOver * 100).toFixed(1) + '%"></span></p><p class="free-note">Free delivery on orders over £75 ex VAT. ' + (short > 0 ? 'You’re ' + money(short) + ' short.' : 'Add a little more to qualify.') + '</p>'
        : '<p class="free-note is-free">' + icon('tick') + 'Free delivery on this order.</p>') +
      '<dl class="sums"><div><dt>Subtotal ex VAT</dt><dd>' + money(t.sub) + '</dd></div>' +
      '<div><dt>Delivery ex VAT</dt><dd>' + (t.del ? money(t.del) : 'Free') + '</dd></div>' +
      '<div><dt>VAT at 20%</dt><dd>' + money(t.vat) + '</dd></div>' +
      '<div class="sums-total"><dt>Total inc VAT</dt><dd>' + money(t.total) + '</dd></div></dl>' +
      '<button type="button" class="btn-primary" id="checkout">Go to checkout</button>' +
      '<p class="muted small" id="checkout-note" hidden>Checkout is switched off in this demo.</p>';
  }

  dlg.addEventListener('click', function (e) {
    if (e.target === dlg) { dlg.close(); return; }
    var b;
    if ((b = e.target.closest('[data-inc]'))) { lineOf(b.dataset.inc).qty++; renderBasket(); focusAfter('[data-inc="' + b.dataset.inc + '"]'); }
    else if ((b = e.target.closest('[data-dec]'))) {
      var l = lineOf(b.dataset.dec); l.qty--;
      if (l.qty <= 0) { basket = basket.filter(function (x) { return x !== l; }); renderBasket(); $('#basket-close').focus(); }
      else { renderBasket(); focusAfter('[data-dec="' + b.dataset.dec + '"]'); }
    } else if ((b = e.target.closest('[data-rm]'))) { basket = basket.filter(function (x) { return x.sku !== b.dataset.rm; }); renderBasket(); $('#basket-close').focus(); }
    else if (e.target.closest('#checkout')) { $('#checkout-note').hidden = false; }
  });
  function focusAfter(sel) { var el = $(sel, dlg); if (el) el.focus(); }

  function openBasket() {
    renderBasket();
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    $('#basket-close').focus();
  }
  $('#basket-btn').addEventListener('click', openBasket);
  $('#basket-close').addEventListener('click', function () { dlg.close(); });

  // ---------------------------------------------------------------- Global clicks

  var pointerTarget = null;
  document.addEventListener('pointerdown', function (e) {
    pointerTarget = e.target.closest && e.target.closest('.btn-add, .chip');
    setTimeout(function () { pointerTarget = null; }, 800);
  }, true);

  document.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-add]'))) { addToBasket(t.dataset.add, t); return; }
    if ((t = e.target.closest('[data-open-basket]'))) { toastEl.classList.remove('is-on'); openBasket(); return; }
    if ((t = e.target.closest('[data-ask]'))) {
      e.preventDefault();
      if (dlg.open) dlg.close();
      if (t.closest('.turn') && thread.contains(t)) followUp(t.dataset.ask, A.match(t.dataset.ask));
      else ask(t.dataset.ask);
      return;
    }
    if ((t = e.target.closest('[data-section]')) && !t.closest('.ac')) { e.preventDefault(); showSection(t.dataset.section); return; }
    if ((t = e.target.closest('[data-home]'))) { e.preventDefault(); goHome(); }
  });

  // ---------------------------------------------------------------- Start

  if (isPhone()) input.placeholder = 'What do you need?';
  renderNav();
  renderPopular();
  renderBasket();

  // The tour waits until the photos it shows are decoded.
  if (window.HiconTour) {
    window.HiconTour.ready(function () {
      var imgs = $$('img').filter(function (i) { return !i.loading || i.loading !== 'lazy'; });
      return Promise.all(imgs.map(function (i) { return i.decode ? i.decode().catch(function () {}) : null; }));
    });
  }

  window.FettleApp = { ask: ask, showListing: showListing, goHome: goHome };
})();
