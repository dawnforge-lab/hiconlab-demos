/* Scarth search UI: combobox, reading chips, the decision strip, filters, grid, close misses. */
(function () {
  'use strict';

  var D = window.SCARTH, R = window.ScarthReader, X = window.ScarthDecide;
  var ALL = D.products;
  var BYID = {};
  ALL.forEach(function (p) { BYID[p.id] = p; });
  var CAT = {};
  D.categories.forEach(function (c) { CAT[c.id] = c; });
  var FOOT = ['boots', 'shoes'];
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touring = window.HiconTour && window.HiconTour.active;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function icon(id, cls) { return '<svg class="ic' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; }
  function later(fn, ms) { return reduce ? fn() : setTimeout(fn, ms); }

  var el = {
    body: document.body, q: $('#q'), form: $('#searchForm'), suggestWrap: $('#suggestWrap'), suggest: $('#suggest'), clear: $('#qClear'),
    reading: $('#reading'), chips: $('#chips'), notes: $('#readingNotes'), home: $('#home'), results: $('#results'),
    strip: $('#strip'), pickedNote: $('#pickedNote'), grid: $('#grid'), foundH: $('#foundH'), foundSort: $('#foundSort'),
    nomatch: $('#nomatch'), nearly: $('#nearly'), nearlyList: $('#nearlyList'), filters: $('#filters'), filtersD: $('#filtersD'),
    more: $('#more'), moreWrap: $('#moreWrap'), pop: $('#pop'), toast: $('#toast'), announce: $('#announce'),
    basket: $('#basket'), basketN: $('#basketN'), shelves: $('#shelves'),
  };

  var state = { text: '', read: null, overrides: {}, res: null, crits: null, shown: 12, basket: 0, added: {} };

  // ---- Pictures ---------------------------------------------------------------
  var CATICON = { boots: 'boot', shoes: 'boot', shells: 'jacket', insulated: 'jacket', packs: 'pack', base: 'top', socks: 'sock' };
  function altOf(p) { return p.brand + ' ' + p.name + ' in ' + p.colour.toLowerCase(); }
  function photo(p, sizes, eager) {
    if (!p.photo) return '<svg class="ph" role="img" aria-label="' + esc(altOf(p)) + ' (photo coming soon)"><use href="#i-' + CATICON[p.cat] + '"/></svg>';
    var base = 'assets/img/products/' + p.img;
    return '<img src="' + base + '-480.webp" srcset="' + base + '-480.webp 480w, ' + base + '-960.webp 960w" sizes="' + sizes + '" width="480" height="480" alt="' + esc(altOf(p)) + '"' + (eager || touring ? '' : ' loading="lazy"') + ' decoding="async">';
  }
  function genderText(p) { return p.g === 'm' ? 'Men’s' : p.g === 'w' ? 'Women’s' : 'Unisex'; }

  // ---- Home shelves ---------------------------------------------------------------
  var SHELF_PICK = { boots: 'b06', shoes: 's04', shells: 'j02', insulated: 'i02', packs: 'r02', base: 'l01', socks: 'k01' };
  var SHELF_Q = { boots: 'walking boots', shoes: 'walking shoes', shells: 'waterproof jackets', insulated: 'insulated jackets', packs: 'rucksacks', base: 'base layers', socks: 'socks' };
  el.shelves.innerHTML = D.categories.map(function (c) {
    var n = ALL.filter(function (p) { return p.cat === c.id; }).length;
    var p = BYID[SHELF_PICK[c.id]];
    return '<li><button type="button" class="shelf" data-search="' + SHELF_Q[c.id] + '"><span class="shelf__img">' + photo(p, '(max-width: 720px) 45vw, 200px') +
      '</span><span class="shelf__body"><span class="shelf__name">' + esc(c.name) + '</span><span class="shelf__n">' + n + '</span></span></button></li>';
  }).join('');

  // ---- Search entry points --------------------------------------------------------
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-search]');
    if (!b) return;
    el.q.value = b.getAttribute('data-search');
    syncClear();
    submit(el.q.value, { fresh: true });
  });
  el.form.addEventListener('submit', function (e) {
    e.preventDefault();
    var active = activeOption();
    if (active && active.dataset.act && active.dataset.act !== 'read') { choose(active); return; }
    submit(el.q.value);
  });
  el.clear.addEventListener('click', function () { el.q.value = ''; syncClear(); closeSuggest(); el.q.focus(); });
  function syncClear() { el.clear.hidden = !el.q.value; }

  function keptOverrides(text, read) {
    var prevText = state.text, prevRead = state.read;
    if (!prevRead || text.toLowerCase().indexOf(prevText.toLowerCase().slice(0, Math.min(prevText.length, 14))) !== 0) return {};
    var kept = Object.assign({}, state.overrides);
    var before = {};
    prevRead.specs.forEach(function (s) { before[R.specId(s)] = JSON.stringify([s.value, s.mode]); });
    read.specs.forEach(function (s) { var id = R.specId(s); if (before[id] !== JSON.stringify([s.value, s.mode])) delete kept[id]; });
    if (read.specs.some(function (s) { return s.key === 'cat' && !s.implied; })) delete kept.cat;
    return kept;
  }
  function submit(text, opts) {
    opts = opts || {};
    text = String(text || '').trim();
    closeSuggest();
    if (!text) { el.q.focus(); return; }
    var read = R.read(text);
    state.overrides = opts.fresh ? {} : keptOverrides(text, read);
    var first = !el.body.classList.contains('is-results');
    state.text = text; state.read = read; state.shown = 12;
    el.q.value = text; syncClear();
    apply({ first: first, source: 'text' });
    if (first) window.scrollTo({ top: 0, behavior: reduce || touring ? 'auto' : 'smooth' });
  }

  // ---- Apply: criteria → decision → everything on screen ---------------------------
  function apply(opts) {
    opts = opts || {};
    var crits = X.criteriaFrom(state.read.specs, state.overrides);
    var res = X.run(crits);
    var prev = state.res, prevCrits = state.crits;
    state.res = res; state.crits = crits;
    if (opts.first) {
      el.body.classList.add('is-results');
      ['#hero', '#tryFold'].forEach(function (sel) { var n = $(sel); n.setAttribute('inert', ''); n.setAttribute('aria-hidden', 'true'); });
      el.home.hidden = true; el.results.hidden = false; el.reading.hidden = false;
    }
    renderChips(crits, prevCrits, opts);
    var stripMs = renderStrip(res, opts.first ? null : prev, opts);
    renderFilters(res, opts);
    renderResults(res, opts.first ? null : prev, opts, stripMs);
    renderNearly(res);
    renderNoMatch(res);
    markNav(res);
    var n = res.results.length;
    el.announce.textContent = (n ? n + ' ' + noun(res, n) + ' ' + (n === 1 ? 'fits' : 'fit') : 'Nothing fits all of that') + '. Read as: ' +
      crits.map(function (c) { return c.label; }).join(', ') + '.';
  }

  function markNav(res) {
    var q = res.cat && res.cat.value.length === 1 ? SHELF_Q[res.cat.value[0]] : null;
    $$('.sections button').forEach(function (b) { b.setAttribute('aria-current', String(b.getAttribute('data-search') === q)); });
  }

  var SINGULAR = { boots: 'walking boot', shoes: 'walking shoe', shells: 'waterproof jacket', insulated: 'insulated jacket', packs: 'rucksack', base: 'base layer', socks: 'pair of socks' };
  var PLURAL = { boots: 'walking boots', shoes: 'walking shoes', shells: 'waterproof jackets', insulated: 'insulated jackets', packs: 'rucksacks', base: 'base layers', socks: 'pairs of socks' };
  function noun(res, n) {
    if (res.cat && res.cat.value.length === 1) return n === 1 ? SINGULAR[res.cat.value[0]] : PLURAL[res.cat.value[0]];
    if (res.cat && res.cat.label === 'Jackets') return n === 1 ? 'jacket' : 'jackets';
    if (res.cat && res.cat.label === 'Boots and shoes') return n === 1 ? 'boot or shoe' : 'boots and shoes';
    return n === 1 ? 'product' : 'products';
  }

  // ---- Chips: understood as ---------------------------------------------------------
  var KINDTEXT = { what: 'What', must: 'Must', budget: 'Budget', for: 'For', prefer: 'Prefer' };
  function sig(c) { return c.id + '|' + JSON.stringify(c.value) + '|' + c.mode; }
  function orderCrits(crits) {
    var cat = crits.filter(function (c) { return c.key === 'cat'; });
    var musts = crits.filter(function (c) { return c.key !== 'cat' && c.mode === 'must'; }).sort(function (a, b) { return a.pos - b.pos; });
    var prefs = crits.filter(function (c) { return c.mode === 'prefer'; }).sort(function (a, b) { return a.pos - b.pos; });
    return cat.concat(musts, prefs);
  }
  function renderChips(crits, prevCrits, opts) {
    var prevSig = {}, prevIds = {};
    (prevCrits || []).forEach(function (c) { prevSig[sig(c)] = true; prevIds[c.id] = true; });
    var html = '', i = 0;
    orderCrits(crits).forEach(function (c) {
      var kind = c.kind === 'for' && c.mode === 'prefer' ? 'prefer' : c.kind;
      var kindText = c.key === 'cat' && c.altFor ? 'Instead' : c.key === 'cat' && c.implied ? 'Guessed' : c.kind === 'for' ? 'For' : KINDTEXT[kind];
      var cls = 'chip chip--' + kind;
      var style = '';
      if (prevCrits && prevSig[sig(c)]) cls += ' is-static';
      else if (prevCrits && prevIds[c.id]) cls += ' is-static is-changed';
      else { style = ' style="--d:' + (opts.first ? 260 + i * 110 : i * 0) + 'ms"'; i++; }
      html += '<li class="' + cls + '"' + style + ' data-id="' + esc(c.id) + '">' +
        '<button type="button" class="chip__btn" aria-haspopup="dialog" aria-expanded="false" data-edit="' + esc(c.id) + '" aria-label="' + esc(kindText + ': ' + c.label + '. Change') + '">' +
        '<span class="chip__kind" aria-hidden="true">' + kindText + '</span><span>' + esc(c.label) + '</span></button>' +
        '<button type="button" class="chip__x" data-remove="' + esc(c.id) + '" aria-label="Remove ' + esc(c.label.toLowerCase()) + '">' + icon('x') + '</button></li>';
    });
    var read = state.read;
    if (read.unused.length) {
      html += '<li class="chip chip--unused' + (prevCrits ? ' is-static' : '') + '" style="--d:' + (opts.first ? 260 + i * 110 : 0) + 'ms"><span class="chip__kind">Didn’t use</span>' +
        read.unused.map(function (w) { return '<s>' + esc(w) + '</s>'; }).join(' ') + '</li>';
    }
    el.chips.innerHTML = html;

    var notes = [];
    read.corrections.forEach(function (c) { notes.push('Read <q>' + esc(c.from) + '</q> as <q>' + esc(c.to) + '</q>.'); });
    (read.notes || []).forEach(function (n) { notes.push(esc(n)); });
    var guessed = crits.filter(function (c) { return c.key === 'cat' && c.implied; })[0];
    var main = null;
    read.notStocked.forEach(function (n) {
      if (main) return;
      if (n.msg) main = n.msg;
      else if (n.alt && guessed && guessed.altFor === n.name) main = 'We don’t sell ' + n.name + ', so here’s the nearest we do: ' + (n.alt.label || guessed.label.toLowerCase()) + '.';
      else main = 'We don’t sell ' + n.name + (crits.length ? '.' : ', so here’s what walkers buy most.');
    });
    if (!main && guessed && !guessed.altFor) main = 'You didn’t say what, so we went with ' + guessed.label.toLowerCase() + '. Tap it to change.';
    if (!main && !crits.length) main = 'Nothing in that we could search on, so here’s what walkers buy most.';
    if (main) notes.push(esc(main));
    el.notes.innerHTML = notes.join(' ');
  }

  el.chips.addEventListener('click', function (e) {
    var rm = e.target.closest('[data-remove]');
    if (rm) {
      var id = rm.getAttribute('data-remove');
      state.overrides[id] = null;
      closePop();
      apply({ changed: id });
      var next = $('.chip__btn', el.chips) || el.q;
      next.focus();
      return;
    }
    var ed = e.target.closest('[data-edit]');
    if (ed) openPop(ed.getAttribute('data-edit'), ed);
  });

  // ---- Chip editor (non-modal dialog) -----------------------------------------------
  var popFor = null;
  var SHOE_SIZES = [];
  for (var sz = 3; sz <= 13; sz += 0.5) SHOE_SIZES.push(sz);
  var CLOTH_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  var FAMS = [['green', '#5E7F4A'], ['blue', '#2F5F8A'], ['black', '#1C1F22'], ['grey', '#7D8589'], ['brown', '#7A4A2A'], ['red', '#A8323A'], ['orange', '#D9632A'], ['yellow', '#D9B03A'], ['purple', '#6E4E7E']];

  function critById(id) { return (state.crits || []).filter(function (c) { return c.id === id; })[0]; }
  function setSpec(id, spec) { state.overrides[id] = spec; }

  function openPop(id, anchor) {
    var c = critById(id);
    if (!c) return;
    if (popFor === id && !el.pop.hidden) { closePop(); return; }
    closePop(true);
    popFor = id;
    var HEAD = { cat: 'What you’re after', budget: 'Your budget', size: 'Size', fit: 'Fit', gender: 'Who it’s for', colour: 'Colour', notcolour: 'Leave out a colour', use: c.label };
    var h = '<h3 class="pop__h" id="popH">' + esc(HEAD[c.key] || c.label) + '</h3>';
    if (c.key === 'cat') {
      h += '<p class="pop__p">What are you after?</p><div class="pop__opts">' + D.categories.map(function (cat) {
        var on = c.value.length === 1 && c.value[0] === cat.id;
        return '<button type="button" data-cat="' + cat.id + '" aria-pressed="' + on + '">' + esc(cat.name) + '</button>';
      }).join('') + '</div>';
    } else if (c.key === 'budget') {
      var max = c.value.max || 300;
      h += '<p class="pop__p">Move the slider to change your budget.</p><div class="pop__range"><output id="popOut">' + (max >= 300 ? 'Any price' : 'Under £' + max) + '</output>' +
        '<input type="range" id="popRange" min="20" max="300" step="5" value="' + max + '" aria-label="Most you want to spend"></div>';
    } else if (c.key === 'size') {
      var isShoe = typeof c.value === 'number';
      h += '<p class="pop__p">' + (isShoe ? 'UK shoe size' : 'Clothing size') + '</p><div class="pop__opts">' + (isShoe ? SHOE_SIZES : CLOTH_SIZES).map(function (s) {
        return '<button type="button" data-size="' + s + '" aria-pressed="' + (s === c.value) + '">' + String(s).replace('.5', '½') + '</button>';
      }).join('') + '</div>';
    } else if (c.key === 'fit') {
      h += '<div class="pop__opts">' + ['wide', 'standard', 'narrow'].map(function (f) { return '<button type="button" data-fit="' + f + '" aria-pressed="' + (f === c.value) + '">' + f.charAt(0).toUpperCase() + f.slice(1) + ' fit</button>'; }).join('') + '</div>';
    } else if (c.key === 'gender') {
      h += '<div class="pop__opts">' + [['m', 'Men’s'], ['w', 'Women’s']].map(function (g) { return '<button type="button" data-gender="' + g[0] + '" aria-pressed="' + (g[0] === c.value) + '">' + g[1] + '</button>'; }).join('') + '</div>';
    } else if (c.key === 'colour' || c.key === 'notcolour') {
      h += '<p class="pop__p">' + (c.key === 'colour' ? 'Which colour would you like?' : 'Which colour should we leave out?') + '</p><div class="swatches pop__opts">' + FAMS.map(function (f) {
        return '<button type="button" class="sw" data-fam="' + f[0] + '" style="background:' + f[1] + '" aria-pressed="' + (f[0] === c.value) + '" aria-label="' + f[0] + '"></button>';
      }).join('') + '</div>';
    } else if (c.key === 'use') {
      var cats = state.res.cat ? state.res.cat.value : null;
      var means = X.DEF.use.means(c.value, cats);
      h += means ? '<p class="pop__means">For ' + esc(c.label.toLowerCase()) + ' we look for ' + esc(means) + '.</p>' : '<p class="pop__means">We look for kit our staff tag as made for ' + esc(c.label.toLowerCase()) + '.</p>';
    } else if (c.from) {
      h += '<p class="pop__p">From <q>' + esc(c.from) + '</q> in your search.</p>';
    }
    if (c.key !== 'cat') {
      h += '<div class="seg" role="group" aria-label="How much it matters">' +
        '<button type="button" data-mode="must" aria-pressed="' + (c.mode === 'must') + '">Must have</button>' +
        '<button type="button" data-mode="prefer" aria-pressed="' + (c.mode === 'prefer') + '">Nice to have</button></div>';
    }
    h += '<div class="pop__foot"><button type="button" class="btn btn--text" data-pop="remove">' + icon('x') + 'Remove</button><button type="button" class="btn btn--ink" data-pop="close">Done</button></div>';
    el.pop.innerHTML = h;
    el.pop.hidden = false;
    anchor.setAttribute('aria-expanded', 'true');
    placePop(anchor);
    var first = $('[aria-pressed="true"]', el.pop) || $('input, button', el.pop);
    if (first) first.focus();
    var range = $('#popRange', el.pop);
    if (range) {
      range.addEventListener('input', function () { $('#popOut').textContent = +range.value >= 300 ? 'Any price' : 'Under £' + range.value; });
      range.addEventListener('change', function () {
        if (+range.value >= 300) setSpec('budget', null);
        else setSpec('budget', { key: 'budget', value: { max: +range.value }, mode: 'must' });
        apply({ changed: 'budget' });
        reanchor('budget');
      });
    }
  }
  function placePop(anchor) {
    var r = anchor.getBoundingClientRect();
    var w = el.pop.offsetWidth;
    var left = Math.max(16, Math.min(r.left + window.scrollX, window.scrollX + document.documentElement.clientWidth - w - 16));
    el.pop.style.left = left + 'px';
    el.pop.style.top = (r.bottom + window.scrollY + 12) + 'px';
    el.pop.style.setProperty('--ax', Math.max(14, Math.min(w - 28, r.left + window.scrollX - left + 18)) + 'px');
  }
  function reanchor(id) {
    var b = $('.chip[data-id="' + id + '"] .chip__btn', el.chips);
    if (b && !el.pop.hidden) { b.setAttribute('aria-expanded', 'true'); placePop(b); popFor = id; }
    else closePop();
  }
  function closePop(silent) {
    if (el.pop.hidden) return;
    el.pop.hidden = true;
    var b = popFor && $('.chip[data-id="' + popFor + '"] .chip__btn', el.chips);
    $$('.chip__btn[aria-expanded="true"]').forEach(function (x) { x.setAttribute('aria-expanded', 'false'); });
    if (b && !silent) b.focus();
    popFor = null;
  }
  el.pop.addEventListener('click', function (e) {
    var c = critById(popFor);
    if (!c) return closePop();
    var t = e.target.closest('button');
    if (!t) return;
    var id = c.id, spec = { key: c.key, value: c.value, mode: c.mode, pos: c.pos };
    if (t.dataset.pop === 'close') return closePop();
    if (t.dataset.pop === 'remove') { setSpec(id, null); closePop(true); apply({ changed: id }); (($('.chip__btn', el.chips)) || el.q).focus(); return; }
    if (t.dataset.cat) { setSpec('cat', { key: 'cat', value: [t.dataset.cat], mode: 'must' }); apply({ changed: 'cat' }); return reanchorFresh('cat'); }
    if (t.dataset.size) { spec.value = /^[\d.]+$/.test(t.dataset.size) ? +t.dataset.size : t.dataset.size; }
    if (t.dataset.fit) spec.value = t.dataset.fit;
    if (t.dataset.gender) spec.value = t.dataset.gender;
    if (t.dataset.mode) spec.mode = t.dataset.mode;
    if (t.dataset.fam) {
      setSpec(id, null);
      var nid = c.key + ':' + t.dataset.fam;
      spec.value = t.dataset.fam;
      setSpec(nid, spec);
      apply({ changed: nid });
      return reanchorFresh(nid);
    }
    setSpec(id, spec);
    apply({ changed: id });
    reanchorFresh(id);
  });
  function reanchorFresh(id) { var keepOpen = !el.pop.hidden; closePop(true); if (keepOpen) { var b = $('.chip[data-id="' + id + '"] .chip__btn', el.chips); if (b) openPop(id, b); } }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !el.pop.hidden) { e.preventDefault(); closePop(); } });
  document.addEventListener('pointerdown', function (e) { if (!el.pop.hidden && !el.pop.contains(e.target) && !e.target.closest('.chip__btn')) closePop(true); });
  window.addEventListener('resize', function () { closePop(true); });

  // ---- The strip: how we picked these ------------------------------------------------
  var DOTS = ALL.map(function (p) { return p.id; });
  function stageKind(s) {
    if (s.key === 'all') return 'Start';
    var c = s.crit;
    if (c.key === 'cat') return c.altFor ? 'Instead' : c.implied ? 'What, guessed' : 'What';
    return c.kind === 'budget' ? 'Budget' : c.kind === 'for' ? 'For' : 'Must';
  }
  function dotsHtml(ids) {
    var set = {};
    ids.forEach(function (id) { set[id] = 1; });
    return DOTS.map(function (id, j) { return '<i' + (set[id] ? '' : ' class="is-out"') + ' style="--dd:' + ((j % 19) * 9) + 'ms"></i>'; }).join('');
  }
  function setDots(li, ids) {
    var set = {};
    ids.forEach(function (id) { set[id] = 1; });
    $$('.dots i', li).forEach(function (d, j) { d.classList.toggle('is-out', !set[DOTS[j]]); });
  }
  function tween(node, from, to, ms) {
    if (reduce || from === to) { node.textContent = to; return; }
    var start = performance.now();
    (function step(now) {
      var p = Math.min(1, (now - start) / ms);
      var e = 1 - Math.pow(1 - p, 3);
      node.textContent = Math.round(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }
  function renderStrip(res, prev, opts) {
    var prevMap = {};
    if (prev) prev.steps.forEach(function (s) { prevMap[s.key] = s; });
    var last = res.steps.length - 1;
    var html = res.steps.map(function (s, i) {
      var delta = i ? s.ids.length - res.steps[i - 1].ids.length : 0;
      var final = i === last && last > 0;
      return '<li class="stage' + (final ? ' stage--final' : '') + '" data-key="' + esc(s.key) + '">' +
        '<p class="stage__kind">' + stageKind(s) + '</p><p class="stage__label">' + esc(s.label) + '</p>' +
        '<p class="stage__n"><span class="num">' + s.ids.length + '</span>' + (final ? '<span class="stage__fit">' + (s.ids.length === 1 ? 'fits' : 'fit') + '</span>' : '') +
        (i ? '<span class="stage__delta">' + (delta ? '−' + Math.abs(delta) : '±0') + '</span>' : '<span class="stage__delta">in the shop</span>') + '</p>' +
        '<span class="sr-only">' + s.ids.length + ' products' + (i ? ', ' + Math.abs(delta) + ' fewer' : '') + '.</span>' +
        '<div class="dots" aria-hidden="true">' + dotsHtml(s.ids) + '</div></li>';
    }).join('');
    html += rankStage(res, prev);
    el.strip.innerHTML = html;
    el.pickedNote.textContent = res.steps.length > 1 ? 'Must-haves narrow the shop. Nice-to-haves only change the order.' : 'Nothing to narrow on yet, so everything is in, ranked.';

    // Animate: each stage starts from where it (or the stage before it) was, then settles.
    var stages = $$('.stage[data-key]', el.strip);
    var total = 0;
    stages.forEach(function (li, i) {
      var s = res.steps[i];
      var was = prevMap[s.key] ? prevMap[s.key].ids : (i ? (prev ? (prevMap[res.steps[i - 1].key] || res.steps[i - 1]).ids : res.steps[i - 1].ids) : s.ids);
      var same = prevMap[s.key] && was.length === s.ids.length && was.join() === s.ids.join();
      if (same || reduce) return;
      var num = $('.num', li);
      var final = li.classList.contains('stage--final');
      var delay = opts.first ? 180 + i * 420 : 80;
      total = Math.max(total, delay + 520);
      setDots(li, was);
      num.textContent = was.length;
      if (opts.first) { li.classList.add('is-pending'); if (final) li.classList.remove('stage--final'); }
      setTimeout(function () {
        li.classList.remove('is-pending');
        if (opts.first) li.classList.add('is-in');
        setTimeout(function () {
          setDots(li, s.ids);
          tween(num, was.length, s.ids.length, 480);
          if (final) setTimeout(function () { li.classList.add('stage--final'); }, opts.first ? 260 : 0);
        }, opts.first ? 160 : 0);
      }, delay);
    });
    var rank = $('.stage--rank', el.strip);
    if (opts.first && rank && !reduce) {
      rank.classList.add('is-pending');
      setTimeout(function () { rank.classList.remove('is-pending'); rank.classList.add('is-in'); }, 180 + stages.length * 420);
      total = 180 + stages.length * 420 + 200;
    }
    // Phones show the strip as a swipeable row: bring the final count into view once it has settled.
    if (window.matchMedia('(max-width: 720px)').matches) {
      later(function () { el.strip.scrollTo({ left: el.strip.scrollWidth, behavior: reduce ? 'auto' : 'smooth' }); }, total);
    }
    return reduce ? 0 : total;
  }
  function rankStage(res, prev) {
    var had = {};
    if (prev) prev.prefers.forEach(function (c) { had[c.id] = 1; });
    var items = ['<li><span class="rk">1</span>In stock first</li>'];
    res.prefers.forEach(function (c, i) {
      items.push('<li class="is-pref' + (prev && !had[c.id] ? ' is-new' : '') + '"><span class="rk">' + (i + 2) + '</span>' + icon('leaf') + esc(c.label) + '</li>');
    });
    items.push('<li><span class="rk">' + (res.prefers.length + 2) + '</span>Reviews from walkers</li>');
    return '<li class="stage stage--rank"><p class="stage__kind">Then ranked by</p><ol class="rank__list">' + items.join('') + '</ol></li>';
  }

  // ---- Results grid (with a smooth reorder) ------------------------------------------
  var cards = {};
  function stockText(p, res) {
    if (p.stock === 0) return '<span class="stock stock--out">Back in ' + p.back + ' days</span>';
    var size = res.musts.filter(function (c) { return c.key === 'size'; })[0];
    if (size) return '<span class="stock">Size ' + X.sizeOf(p, size.value) + ' in stock</span>';
    if (p.stock <= 3) return '<span class="stock stock--low">Only ' + p.stock + ' left</span>';
    return '<span class="stock">In stock</span>';
  }
  function whyHtml(r) {
    return r.why.map(function (w) {
      return '<span class="w w-' + w.type + '">' + (w.type === 'prefer' ? icon('leaf') : '') + esc(w.text) + '</span>';
    }).join(' ');
  }
  function cardBody(r, res, rank) {
    var p = r.p;
    return '<div class="card__body"><p class="card__brand">' + esc(p.brand) + ' · ' + genderText(p) + '</p>' +
      '<h3 class="card__name">' + esc(p.name) + '</h3>' +
      '<p class="why"><span class="sr-only">Why it fits: </span><span class="why__in">' + whyHtml(r) + '</span></p>' +
      '<div class="card__foot"><span class="card__price">£' + p.price + '</span>' + stockText(p, res) +
      '<button type="button" class="add' + (state.added[p.id] ? ' is-added' : '') + '" data-add="' + p.id + '" aria-label="' + (state.added[p.id] ? 'In your basket: ' : 'Add to basket: ') + esc(p.brand + ' ' + p.name) + '">' + icon(state.added[p.id] ? 'check' : 'plus') + '</button></div></div>';
  }
  function makeCard(r, res) {
    var li = document.createElement('li');
    li.className = 'card';
    li.dataset.id = r.p.id;
    li.setAttribute('data-hover', '');
    li.innerHTML = '<div class="card__img"><span class="card__rank"></span>' + photo(r.p, '(max-width: 720px) 132px, (max-width: 1360px) 30vw, 300px') + '</div>' + cardBody(r, res);
    return li;
  }
  function renderResults(res, prev, opts, stripMs) {
    var n = res.results.length;
    el.foundH.innerHTML = n ? '<span class="num">' + n + '</span> ' + esc(noun(res, n)) + ' ' + (n === 1 ? 'fits' : 'fit') : 'Nothing fits all of that';
    if (!res.musts.length && !res.cat && n) el.foundH.innerHTML = res.prefers.length ? 'Everything, best match first' : 'What walkers buy most';
    el.foundSort.textContent = n > 1 ? 'Best fit first: in stock, then ' + (res.prefers.length ? res.prefers.map(function (c) { return c.label.toLowerCase(); }).join(', ') + ', then ' : '') + 'reviews.' : '';

    var list = res.results.slice(0, Math.max(state.shown, 1));
    el.moreWrap.hidden = n <= state.shown;
    el.more.textContent = 'Show all ' + n;

    // FLIP: remember where cards were
    var before = {};
    Object.keys(cards).forEach(function (id) { if (cards[id].isConnected) before[id] = cards[id].getBoundingClientRect(); });
    var keep = {};
    var frag = document.createDocumentFragment();
    var enterDelay = opts.first ? stripMs + 450 : 120;
    var k = 0;
    list.forEach(function (r, i) {
      var c = cards[r.p.id];
      if (!c || !before[r.p.id]) {
        c = makeCard(r, res);
        cards[r.p.id] = c;
        if (!reduce) { c.classList.add('is-enter'); c.style.setProperty('--d', (enterDelay + k * 90) + 'ms'); k++; }
      } else {
        c.classList.remove('is-enter');
        c.replaceChild(range(cardBody(r, res)), $('.card__body', c));
      }
      $('.card__rank', c).textContent = i + 1;
      var flag = $('.card__flag', c);
      if (flag) flag.remove();
      if (opts.joined && opts.joined.indexOf(r.p.id) >= 0) {
        c.classList.add('is-joined');
        $('.card__img', c).insertAdjacentHTML('beforeend', '<span class="card__flag card__flag--new">Now in</span>');
      } else c.classList.remove('is-joined');
      keep[r.p.id] = 1;
      frag.appendChild(c);
    });
    el.grid.innerHTML = '';
    el.grid.appendChild(frag);
    if (reduce) return;
    list.forEach(function (r) {
      var c = cards[r.p.id], b = before[r.p.id];
      if (!b || !keep[r.p.id]) return;
      var a = c.getBoundingClientRect();
      var dx = b.left - a.left, dy = b.top - a.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      c.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 720, easing: 'cubic-bezier(.2,.7,.2,1)' });
    });
  }
  function range(html) { var t = document.createElement('template'); t.innerHTML = html; return t.content.firstChild; }
  el.more.addEventListener('click', function () { state.shown = 999; renderResults(state.res, state.res, {}, 0); });

  el.grid.addEventListener('click', function (e) {
    var b = e.target.closest('[data-add]');
    if (!b) return;
    var p = BYID[b.dataset.add];
    if (state.added[p.id]) { toast(p.brand + ' ' + p.name + ' is already in your basket.'); return; }
    state.added[p.id] = 1;
    state.basket++;
    el.basketN.textContent = state.basket;
    $('#basketSr').textContent = state.basket === 1 ? ' item' : ' items';
    el.basket.classList.remove('is-bump'); void el.basket.offsetWidth; el.basket.classList.add('is-bump');
    b.classList.add('is-added'); b.innerHTML = icon('check'); b.setAttribute('aria-label', 'In your basket: ' + p.brand + ' ' + p.name);
    toast('Added ' + p.brand + ' ' + p.name + ' · £' + p.price + '. We’ll ask your size at the till.');
  });
  var toastT;
  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { el.toast.classList.remove('is-on'); }, 3200);
  }

  // ---- Nearly ---------------------------------------------------------------------------
  function renderNearly(res) {
    el.nearly.hidden = !res.nearly.length;
    el.nearlyList.innerHTML = res.nearly.map(function (n, i) {
      var p = n.p;
      return '<li class="near" data-id="' + p.id + '"><div class="near__img">' + photo(p, '104px') + '</div><div>' +
        '<p class="near__name">' + esc(p.brand + ' ' + p.name) + '</p><p class="near__meta">' + genderText(p) + ' · ' + esc(p.colour) + ' · £' + p.price + '</p>' +
        '<p class="near__miss">' + icon('miss') + esc(n.miss) + '</p>' +
        '<p class="near__act"><button type="button" class="btn btn--ghost" data-relax="' + i + '">' + esc(n.relax.label) + '</button></p></div></li>';
    }).join('');
  }
  el.nearlyList.addEventListener('click', function (e) {
    var b = e.target.closest('[data-relax]');
    if (!b) return;
    var n = state.res.nearly[+b.dataset.relax];
    relax(n.relax, [n.p.id]);
  });
  function relax(r, joined) {
    if (r.clearMusts) { state.res.musts.forEach(function (c) { state.overrides[c.id] = null; }); }
    else state.overrides[r.id] = r.remove ? null : r.spec;
    apply({ changed: r.id, joined: joined });
    var top = $('.layout');
    if (top && !touring) top.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  // ---- No match: say what to relax ------------------------------------------------------
  function renderNoMatch(res) {
    if (res.results.length) { el.nomatch.hidden = true; el.nomatch.innerHTML = ''; return; }
    el.nomatch.hidden = false;
    var acts = res.relaxations.map(function (r, i) {
      return '<button type="button" class="btn ' + (i ? 'btn--ghost' : 'btn--rescue') + '" data-norelax="' + i + '">' + esc(r.label) + ' <small>· ' + r.count + ' ' + esc(r.count === 1 ? 'fits' : 'fit') + '</small></button>';
    }).join('');
    el.nomatch.innerHTML = '<h3>' + esc(X.nothingLine(res)) + '</h3>' +
      '<p>' + (res.relaxations.length ? 'Loosen one thing and these would show up:' : 'Try taking a tag off, or start a new search.') + '</p>' +
      '<div class="nomatch__acts">' + acts + '</div>';
  }
  el.nomatch.addEventListener('click', function (e) {
    var b = e.target.closest('[data-norelax]');
    if (!b) return;
    relax(state.res.relaxations[+b.dataset.norelax]);
  });

  // ---- Filters (in step with the chips) ---------------------------------------------------
  var MUSTS = [
    { key: 'wp', value: true, label: 'Waterproof', cats: ['boots', 'shoes', 'shells', 'packs', 'socks'] },
    { key: 'fit', value: 'wide', label: 'Wide fit', cats: FOOT },
    { key: 'noleather', value: true, label: 'No leather', cats: FOOT },
    { key: 'crampon', value: 'B1', label: 'Takes crampons', cats: ['boots'] },
    { key: 'pitzips', value: true, label: 'Pit zips', cats: ['shells'] },
    { key: 'helmet', value: true, label: 'Helmet-size hood', cats: ['shells'] },
    { key: 'fill', value: 'synthetic', label: 'No down', cats: ['insulated'] },
    { key: 'raincover', value: true, label: 'Rain cover', cats: ['packs'] },
    { key: 'merino', value: true, label: 'Merino wool', cats: ['base', 'socks'] },
    { key: 'instock', value: true, label: 'In stock now', cats: null },
  ];
  // How many products would fit if this one constraint were set, keeping every other must-have.
  function countWith(key, test, catOverride) {
    var cats = catOverride !== undefined ? catOverride : (state.res.cat ? state.res.cat.value : null);
    return ALL.filter(function (p) {
      if (cats && cats.indexOf(p.cat) < 0) return false;
      for (var i = 0; i < state.res.musts.length; i++) {
        var c = state.res.musts[i];
        if (c.key === key) continue;
        if ((c.cats && c.cats.indexOf(p.cat) < 0) || !c.def.test(p, c.value)) return false;
      }
      return test(p);
    }).length;
  }
  function renderFilters(res, opts) {
    var cats = res.cat ? res.cat.value : null;
    var crits = state.crits;
    function has(key, value) { return crits.filter(function (c) { return c.key === key && c.mode === 'must' && (value === undefined || JSON.stringify(c.value) === JSON.stringify(value)); })[0]; }
    var catOne = cats && cats.length === 1 ? cats[0] : null;
    var h = '<fieldset class="fgroup"><legend>What</legend>' +
      '<label class="fopt" data-sync="cat"><input type="radio" name="fcat" value=""' + (!cats ? ' checked' : '') + '> Anything</label>' +
      D.categories.map(function (c) {
        var n = countWith('cat', function () { return true; }, [c.id]);
        return '<label class="fopt" data-sync="cat"><input type="radio" name="fcat" value="' + c.id + '"' + (catOne === c.id ? ' checked' : '') + '> ' + esc(c.name) + '<span class="n">' + n + '</span></label>';
      }).join('') + '</fieldset>';
    var pool = ALL.filter(function (p) { return !cats || cats.indexOf(p.cat) >= 0; });
    var mustOpts = MUSTS.filter(function (m) { return !m.cats || !cats || cats.some(function (c) { return m.cats.indexOf(c) >= 0; }); });
    h += '<fieldset class="fgroup"><legend>Must have</legend>' + mustOpts.map(function (m) {
      var on = !!has(m.key, m.value);
      var def = X.DEF[m.key];
      var n = countWith(m.key, function (p) { return (!m.cats || m.cats.indexOf(p.cat) >= 0) && def.test(p, m.value); });
      return '<label class="fopt" data-sync="' + m.key + '"><input type="checkbox" data-must="' + m.key + '"' + (on ? ' checked' : '') + '> ' + esc(m.label) + '<span class="n">' + n + '</span></label>';
    }).join('') + '</fieldset>';
    var budget = has('budget');
    var max = budget && budget.value.max ? budget.value.max : 300;
    h += '<div class="fgroup frange" data-sync="budget"><div class="frange__row"><label class="fgroup__h" for="fBudget">Budget</label><output id="fBudgetOut">' + (max >= 300 ? 'Any' : 'Under £' + max) + '</output></div>' +
      '<input type="range" id="fBudget" min="20" max="300" step="5" value="' + max + '" aria-label="Most you want to spend"></div>';
    var footish = !cats || cats.some(function (c) { return FOOT.indexOf(c) >= 0 || c === 'socks'; });
    var clothish = cats && cats.some(function (c) { return ['shells', 'insulated', 'base'].indexOf(c) >= 0; });
    var size = has('size');
    if (footish || clothish) {
      var sizes = footish ? SHOE_SIZES : CLOTH_SIZES;
      h += '<div class="fgroup" data-sync="size"><label class="fgroup__h" for="fSize">' + (footish ? 'UK shoe size' : 'Size') + '</label><select class="fselect" id="fSize"><option value="">Any size</option>' +
        sizes.map(function (s) { return '<option value="' + s + '"' + (size && String(size.value) === String(s) ? ' selected' : '') + '>' + String(s).replace('.5', '½') + '</option>'; }).join('') + '</select></div>';
    }
    var g = has('gender');
    h += '<fieldset class="fgroup"><legend>Who for</legend>' + [['', 'Anyone'], ['m', 'Men’s and unisex'], ['w', 'Women’s and unisex']].map(function (o) {
      return '<label class="fopt" data-sync="gender"><input type="radio" name="fg" value="' + o[0] + '"' + ((g ? g.value : '') === o[0] ? ' checked' : '') + '> ' + o[1] + '</label>';
    }).join('') + '</fieldset>';
    var prefCol = {};
    crits.forEach(function (c) { if (c.key === 'colour') prefCol[c.value] = 1; });
    h += '<div class="fgroup" data-sync="colour"><p class="fgroup__h">Nice to have: colour</p><div class="swatches">' + FAMS.map(function (f) {
      return '<button type="button" class="sw" data-fcol="' + f[0] + '" style="background:' + f[1] + '" aria-pressed="' + !!prefCol[f[0]] + '" aria-label="Prefer ' + f[0] + '"></button>';
    }).join('') + '</div></div>';
    el.filters.innerHTML = h;
    if (opts.changed) {
      var key = String(opts.changed).split(':')[0];
      $$('[data-sync="' + key + '"]', el.filters).forEach(function (n) {
        if (n.matches('.fopt') && !$('input:checked', n) && key !== 'cat' && key !== 'gender') return;
        if (n.matches('.fopt') && (key === 'cat' || key === 'gender') && !$('input:checked', n)) return;
        n.classList.add('is-synced');
      });
    }
  }
  el.filters.addEventListener('change', function (e) {
    var t = e.target;
    if (t.name === 'fcat') {
      if (t.value) state.overrides.cat = { key: 'cat', value: [t.value], mode: 'must' }; else state.overrides.cat = null;
      return apply({ changed: 'cat' });
    }
    if (t.dataset.must) {
      var m = MUSTS.filter(function (x) { return x.key === t.dataset.must; })[0];
      state.overrides[m.key] = t.checked ? { key: m.key, value: m.value, mode: 'must' } : null;
      return apply({ changed: m.key });
    }
    if (t.id === 'fBudget') {
      state.overrides.budget = +t.value >= 300 ? null : { key: 'budget', value: { max: +t.value }, mode: 'must' };
      return apply({ changed: 'budget' });
    }
    if (t.id === 'fSize') {
      state.overrides.size = t.value ? { key: 'size', value: /^[\d.]+$/.test(t.value) ? +t.value : t.value, mode: 'must' } : null;
      return apply({ changed: 'size' });
    }
    if (t.name === 'fg') {
      state.overrides.gender = t.value ? { key: 'gender', value: t.value, mode: 'must' } : null;
      return apply({ changed: 'gender' });
    }
  });
  el.filters.addEventListener('input', function (e) {
    if (e.target.id === 'fBudget') $('#fBudgetOut').textContent = +e.target.value >= 300 ? 'Any' : 'Under £' + e.target.value;
  });
  el.filters.addEventListener('click', function (e) {
    var b = e.target.closest('[data-fcol]');
    if (!b) return;
    var id = 'colour:' + b.dataset.fcol;
    var on = b.getAttribute('aria-pressed') === 'true';
    state.overrides[id] = on ? null : { key: 'colour', value: b.dataset.fcol, mode: 'prefer' };
    apply({ changed: 'colour' });
    var again = $('[data-fcol="' + b.dataset.fcol + '"]', el.filters);
    if (again) again.focus();
  });
  if (window.matchMedia('(max-width: 1100px)').matches) el.filtersD.open = false;
  $('.filters__s').addEventListener('click', function (e) { if (!window.matchMedia('(max-width: 1100px)').matches) e.preventDefault(); });

  // ---- Autocomplete (ARIA combobox) ---------------------------------------------------------
  var NEEDS = [
    'waterproof walking boots for wide feet', 'waterproof walking boots for wide feet under £120', 'waterproof walking boots for winter',
    'lightweight walking boots for summer', 'vegan walking boots', 'walking boots that take crampons', 'leather walking boots for the fells',
    'walking shoes for travel', 'wide fit walking shoes', 'women’s waterproof jacket under £150', 'packable waterproof jacket for running',
    'cheap waterproof jacket', 'warm jacket for winter hillwalking', 'down jacket that packs small', 'insulated jacket, no down',
    'waterproof jacket with pit zips', '30 litre daypack with a rain cover', 'rucksack for wild camping', 'women’s rucksack under £100',
    'merino base layer for winter', 'thick socks for winter walking', 'walking socks for size 9', 'waterproof socks',
    'bright waterproof jacket for the hills', 'something warm for my dad under £100',
  ];
  var CATWORDS = {
    boots: 'walking boots hiking boots', shoes: 'walking shoes trail shoes approach', shells: 'waterproof jackets rain jackets cagoules shells smocks',
    insulated: 'insulated jackets puffer down jackets parka gilet', packs: 'rucksacks backpacks daypacks bags', base: 'base layers thermals merino tops tees', socks: 'socks liners',
  };
  var activeIdx = -1;
  function tokens(q) { return R.normalise(q).split(/\s+/).filter(Boolean); }
  // Every typed word must start a word in the text (the last one may be half typed). Returns marked-up HTML or null.
  function matchMark(text, toks) {
    if (!toks.length) return null;
    var lower = text.toLowerCase().replace(/’/g, "'");
    var spans = [];
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i], re = new RegExp('(^|[^a-z0-9£])(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'g'), m, found = false;
      while ((m = re.exec(lower))) {
        var s = m.index + m[1].length;
        if (!spans.some(function (sp) { return s < sp[1] && s + t.length > sp[0]; })) { spans.push([s, s + t.length]); found = true; break; }
      }
      if (!found) return null;
    }
    spans.sort(function (a, b) { return a[0] - b[0]; });
    var out = '', at = 0;
    spans.forEach(function (sp) { out += esc(text.slice(at, sp[0])) + '<mark>' + esc(text.slice(sp[0], sp[1])) + '</mark>'; at = sp[1]; });
    return out + esc(text.slice(at));
  }
  var lastMini = {};
  function renderSuggest() {
    var q = el.q.value;
    var toks = tokens(q);
    if (q.trim().length < 2 || !toks.length) { closeSuggest(); return; }
    var read = R.read(q);
    var crits = X.criteriaFrom(read.specs, keptOverrides(q.trim(), read));
    var res = X.run(crits);
    var html = '', idx = 0;
    function opt(act, inner, extra, cls) {
      var id = 'opt-' + idx++;
      return '<li class="opt' + (cls ? ' ' + cls : '') + '" role="option" id="' + id + '" aria-selected="false" data-act="' + act + '"' + (extra || '') + '>' + inner + '</li>';
    }
    if (crits.length) {
      var seen = {};
      var mini = orderCrits(crits).map(function (c) {
        var k = c.id + c.label;
        seen[k] = 1;
        var kind = c.key === 'cat' ? 'is-what' : c.mode === 'prefer' ? 'is-prefer' : '';
        return '<li class="' + kind + (lastMini[k] ? '' : ' is-new') + '">' + esc(c.label) + '</li>';
      }).concat(read.unused.map(function (w) { return '<li class="is-unused">' + esc(w) + '</li>'; })).join('');
      lastMini = seen;
      var n = res.results.length;
      html += opt('read', '<span class="opt__top"><span>Reads as</span><span class="opt__count">' + (n ? n + ' ' + (n === 1 ? 'fits' : 'fit') : 'none yet, we’ll say what to relax') + '</span></span><ul class="mini" aria-hidden="true">' + mini + '</ul>',
        ' aria-label="Search: ' + esc(q) + '. Reads as ' + esc(crits.map(function (c) { return c.label; }).join(', ')) + '. ' + n + ' fit."', 'opt--read');
    } else {
      lastMini = {};
      html += opt('read', icon('search', 'opt__ic') + '<span>Search for <strong>' + esc(q) + '</strong></span>');
    }
    var needs = [];
    NEEDS.forEach(function (n) { if (n.toLowerCase() !== q.trim().toLowerCase()) { var m = matchMark(n, toks); if (m) needs.push({ text: n, html: m }); } });
    if (needs.length) {
      html += '<li class="suggest__group" role="presentation">Searches</li>';
      needs.slice(0, 3).forEach(function (n) { html += opt('need', icon('search', 'opt__ic') + '<span>' + n.html + '</span>', ' data-text="' + esc(n.text) + '"'); });
    }
    var cats = [];
    D.categories.forEach(function (c) {
      var m = matchMark(c.name, toks.slice(-1)) || (toks.length === 1 && matchMark(CATWORDS[c.id], toks) ? esc(c.name) : null);
      if (m && !(res.cat && res.cat.value.length === 1 && res.cat.value[0] === c.id && toks.length > 2)) cats.push({ c: c, html: m });
    });
    if (cats.length && toks.length <= 3) {
      html += '<li class="suggest__group" role="presentation">Sections</li>';
      cats.slice(0, 2).forEach(function (c) {
        var n = ALL.filter(function (p) { return p.cat === c.c.id; }).length;
        html += opt('cat', icon('chev', 'opt__ic') + '<span>' + c.html + '</span><span class="opt__count">' + n + '</span>', ' data-text="' + esc(SHELF_Q[c.c.id]) + '"');
      });
    }
    var prods;
    if (res.cat || res.musts.length) {
      prods = res.results.slice(0, 3).map(function (r) { return { p: r.p, html: esc(r.p.name) }; });
      if (prods.length) html += '<li class="suggest__group" role="presentation">Top matches</li>';
    } else {
      prods = [];
      ALL.forEach(function (p) { var m = matchMark(p.brand + ' ' + p.name + ' ' + p.colour, toks); if (m && prods.length < 3) prods.push({ p: p, html: esc(p.name) }); });
      if (prods.length) html += '<li class="suggest__group" role="presentation">Products</li>';
    }
    prods.forEach(function (x) {
      var p = x.p;
      html += opt('product', '<span class="opt__thumb">' + photo(p, '44px', true) + '</span><span><span class="opt__name">' + x.html + '</span><span class="opt__meta">' + esc(p.brand) + ' · ' + genderText(p) + ' · ' + esc(p.colour) + '</span></span><span class="opt__price">£' + p.price + '</span>', ' data-id="' + p.id + '"');
    });
    el.suggest.innerHTML = html;
    el.suggestWrap.hidden = false;
    el.q.setAttribute('aria-expanded', 'true');
    setActive(-1);
  }
  function options() { return $$('.opt', el.suggest); }
  function activeOption() { return el.suggestWrap.hidden ? null : options()[activeIdx] || null; }
  function setActive(i) {
    var opts = options();
    activeIdx = i;
    opts.forEach(function (o, j) { o.setAttribute('aria-selected', String(j === i)); });
    if (opts[i]) { el.q.setAttribute('aria-activedescendant', opts[i].id); opts[i].scrollIntoView({ block: 'nearest' }); }
    else el.q.removeAttribute('aria-activedescendant');
  }
  function closeSuggest() {
    el.suggestWrap.hidden = true;
    el.q.setAttribute('aria-expanded', 'false');
    el.q.removeAttribute('aria-activedescendant');
    activeIdx = -1;
    lastMini = {};
  }
  function choose(o) {
    var act = o.dataset.act;
    if (act === 'read') return submit(el.q.value);
    if (act === 'need' || act === 'cat') { el.q.value = o.dataset.text; syncClear(); return submit(o.dataset.text, { fresh: act === 'cat' }); }
    if (act === 'product') {
      var p = BYID[o.dataset.id];
      var q = el.q.value;
      var r = R.read(q);
      if (!r.specs.length) { q = SHELF_Q[p.cat]; el.q.value = q; }
      submit(q);
      later(function () {
        var c = cards[p.id];
        if (!c) return;
        c.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        c.classList.add('is-joined');
        setTimeout(function () { c.classList.remove('is-joined'); }, 2200);
      }, 900);
    }
  }
  el.q.addEventListener('input', function () { syncClear(); renderSuggest(); });
  el.q.addEventListener('keydown', function (e) {
    var opts = options();
    var open = !el.suggestWrap.hidden;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) { renderSuggest(); return; }
      setActive(activeIdx + 1 >= opts.length ? 0 : activeIdx + 1);
    } else if (e.key === 'ArrowUp') {
      if (!open) return;
      e.preventDefault();
      setActive(activeIdx <= 0 ? opts.length - 1 : activeIdx - 1);
    } else if ((e.key === 'Home' || e.key === 'End') && open && activeIdx >= 0) {
      e.preventDefault();
      setActive(e.key === 'Home' ? 0 : opts.length - 1);
    } else if (e.key === 'Escape') {
      if (open) { e.preventDefault(); closeSuggest(); }
      else if (el.q.value && !el.body.classList.contains('is-results')) { el.q.value = ''; syncClear(); }
    } else if (e.key === 'Tab') {
      closeSuggest();
    }
  });
  el.suggest.addEventListener('mousedown', function (e) { e.preventDefault(); });
  el.suggest.addEventListener('click', function (e) { var o = e.target.closest('.opt'); if (o) choose(o); });
  el.suggest.addEventListener('mousemove', function (e) { var o = e.target.closest('.opt'); if (o) { var i = options().indexOf(o); if (i !== activeIdx) setActive(i); } });
  el.q.addEventListener('blur', function () { setTimeout(function () { if (document.activeElement !== el.q) closeSuggest(); }, 120); });
  document.addEventListener('pointerdown', function (e) { if (!el.form.contains(e.target)) closeSuggest(); });

  // Tour hooks and a small API for the scripted story.
  window.ScarthApp = { submit: submit, state: state };
})();
