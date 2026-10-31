/*
 * The CMS, the website pane and the publish path.
 *
 * Model (as in Strapi 5 Draft & Publish): `form` is what is on screen, `draft` the saved draft,
 * `published` the live version. The website pane never reads `published` directly: it reads a
 * cache entry, the way Next.js serves a "use cache" + cacheTag query until revalidateTag marks
 * it stale. With the "max" profile the next request still gets the stale copy and starts a
 * background refresh; the request after that gets the fresh page.
 */
(function () {
  'use strict';

  var D = window.CB_DATA;
  var params = new URLSearchParams(location.search);
  var TOUR = !!(window.HiconTour && window.HiconTour.active);
  var SPEED = TOUR ? Math.max(0.25, Math.min(4, Number(params.get('speed')) || 1)) : 1;
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var same = function (a, b) { return JSON.stringify(a) === JSON.stringify(b); };
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, REDUCED && !TOUR ? Math.min(ms, 60) : ms / SPEED); }); };
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function icon(id, cls) { return '<svg class="i' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; }

  // ---- Clock: pinned in tour mode so every recording matches -----------------
  var t0 = performance.now();
  var PINNED = new Date(2026, 9, 27, 9, 14, 6); // a Tuesday morning
  function now() { return TOUR ? new Date(PINNED.getTime() + (performance.now() - t0) * SPEED) : new Date(); }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  function hm(d) { return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function hms(d) { return hm(d) + ':' + pad(d.getSeconds()); }
  function day(d) { return d.getDate() + ' ' + MONTHS[d.getMonth()] + ', ' + hm(d); }

  // ---- State ---------------------------------------------------------------------
  var S = {
    published: clone(D.HOME),
    draft: clone(D.HOME),
    form: clone(D.HOME),
    version: 'draft',
    openComp: { hero: true, seo: true },
    openBlocks: {},
    openItems: {},
    errors: {},
    errorMode: null,
    nextId: 100,
    // The website side
    cache: { doc: clone(D.HOME), state: 'fresh' }, // fresh | marked (stale, nobody has asked yet) | refreshing
    liveShown: clone(D.HOME),
    liveChip: ['fresh', 'Cache HIT · fresh'],
    tab: 'live',
    previewOpen: false,
    siteWin: null,
    run: 0,
    lastEvent: null,
    waitingVisits: false,
  };

  var editor = $('#editor');
  var frame = $('#site-frame');

  // ---- Path helpers ------------------------------------------------------------
  function getAt(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }
  function setAt(obj, path, value) {
    var keys = path.split('.');
    var last = keys.pop();
    var target = keys.reduce(function (o, k) { return o[k]; }, obj);
    target[last] = value;
  }
  function idOf(path) { return 'f-' + path.replace(/\./g, '-'); }

  // =============================================================================
  // Editor rendering
  // =============================================================================
  function counterText(f, len) {
    if (f.min && f.max) return len + ' / ' + f.min + '–' + f.max;
    return len + ' / ' + f.max;
  }
  function counterClass(f, len) {
    if (f.max && len > f.max) return ' is-over';
    if (f.min && len > 0 && len < f.min) return ' is-over';
    if (f.max && len > f.max * 0.9) return ' is-near';
    return '';
  }

  function fieldHTML(f, base, obj, ro) {
    var path = base ? base + '.' + f.k : f.k;
    var v = obj ? obj[f.k] : undefined;
    var id = idOf(path);
    var dis = ro ? ' disabled' : '';
    var err = '<p class="f__err" data-err-for="' + path + '" id="' + id + '-err"' + (S.errors[path] ? '' : ' hidden') + '>' + icon('x') + '<span>' + esc(S.errors[path] || '') + '</span></p>';
    var described = ' aria-describedby="' + id + '-err' + (f.hint ? ' ' + id + '-hint' : '') + '"';
    var invalid = S.errors[path] ? ' aria-invalid="true"' : '';
    var hint = f.hint ? '<p class="f__hint" id="' + id + '-hint">' + esc(f.hint) + '</p>' : '';
    var reqMark = f.req ? '<span class="f__req" aria-hidden="true">*</span>' : '';
    var top, input;

    switch (f.t) {
      case 'string':
      case 'text':
      case 'json':
      case 'blocks': {
        var val = v == null ? '' : String(v);
        var count = f.max ? '<span class="f__count' + counterClass(f, val.length) + '" data-count-for="' + path + '" aria-hidden="true">' + counterText(f, val.length) + '</span>' : '';
        top = '<div class="f__top"><label class="f__label" for="' + id + '">' + f.k + reqMark + '</label>' + count + '</div>';
        var attrs = ' class="inp' + (f.t === 'json' ? ' mono' : '') + '" id="' + id + '" data-path="' + path + '"' + (f.req ? ' aria-required="true"' : '') + described + invalid + dis;
        if (f.t === 'string') input = '<input type="text"' + attrs + ' value="' + esc(val) + '" autocomplete="off" spellcheck="true">';
        else input = '<textarea' + attrs + ' rows="' + (f.t === 'blocks' ? 5 : f.t === 'json' ? 3 : 4) + '"' + (f.t === 'json' ? ' placeholder="{ }"' : '') + '>' + esc(val) + '</textarea>';
        break;
      }
      case 'int':
        top = '<div class="f__top"><label class="f__label" for="' + id + '">' + f.k + reqMark + '</label><span class="f__count" aria-hidden="true">' + f.min + '–' + f.max + '</span></div>';
        input = '<input type="number" class="inp" id="' + id + '" data-path="' + path + '" data-num min="' + f.min + '" max="' + f.max + '" value="' + esc(v == null ? '' : v) + '"' + described + invalid + dis + '>';
        break;
      case 'enum':
        top = '<div class="f__top"><label class="f__label" for="' + id + '">' + f.k + reqMark + '</label></div>';
        input = '<select class="inp" id="' + id + '" data-path="' + path + '"' + described + dis + '>' + f.options.map(function (o) { return '<option' + (o === v ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select>';
        break;
      case 'bool':
        top = '<div class="f__top"><span class="f__label" id="' + id + '-l">' + f.k + '</span></div>';
        input = '<div class="toggle" role="group" aria-labelledby="' + id + '-l">' +
          '<button type="button" data-bool="' + path + '" data-val="false" aria-pressed="' + (!v) + '"' + dis + '>False</button>' +
          '<button type="button" data-bool="' + path + '" data-val="true" aria-pressed="' + (!!v) + '"' + dis + '>True</button></div>';
        break;
      case 'link': {
        var l = v || { label: '', href: '' };
        top = '<div class="f__top"><span class="f__label" id="' + id + '-l">' + f.k + '</span><span class="f__count" aria-hidden="true">label / href</span></div>';
        input = '<div class="duo" role="group" aria-labelledby="' + id + '-l">' +
          '<input type="text" class="inp" data-path="' + path + '.label" id="' + id + '-label" aria-label="' + f.k + ' label" value="' + esc(l.label) + '" maxlength="40"' + dis + '>' +
          '<input type="text" class="inp mono" data-path="' + path + '.href" id="' + id + '-href" aria-label="' + f.k + ' href" value="' + esc(l.href) + '"' + dis + '></div>';
        err = '<p class="f__err" data-err-for="' + path + '.href"' + (S.errors[path + '.href'] ? '' : ' hidden') + '>' + icon('x') + '<span>' + esc(S.errors[path + '.href'] || '') + '</span></p>';
        break;
      }
      case 'media': {
        var m = v ? D.MEDIA[v] : null;
        top = '<div class="f__top"><span class="f__label">' + f.k + '</span></div>';
        input = m
          ? '<div class="media"><img src="assets/img/hero-960.webp" width="72" height="48" alt=""><span class="media__meta"><b>' + esc(m.file) + '</b><span>' + esc(m.size) + ' · media.cowlandbrush.example.co.uk</span></span></div>'
          : '<div class="media media--empty">No image. Falls back to the hero photo.</div>';
        if (f.k === 'ogImage') hint = '<p class="f__hint">' + esc(f.hint) + '</p>';
        break;
      }
      case 'relation': {
        var list = f.target === 'service' ? D.SERVICES.map(function (x) { return [x.id, x.name]; })
          : f.target === 'project' ? D.PROJECTS.map(function (x) { return [x.id, x.title]; })
          : D.CATEGORIES.map(function (x) { return [x.id, x.name]; });
        top = '<div class="f__top"><span class="f__label" id="' + id + '-l">' + f.k + '</span><span class="f__count" aria-hidden="true">relation</span></div>';
        if (f.single) {
          input = '<select class="inp" id="' + id + '" data-path="' + path + '" data-num aria-labelledby="' + id + '-l"' + dis + '><option value="">Any category</option>' + list.map(function (o) { return '<option value="' + o[0] + '"' + (v === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
        } else {
          var sel = v || [];
          input = '<div class="rel" role="group" aria-labelledby="' + id + '-l">' + list.map(function (o) {
            return '<label><input type="checkbox" data-rel="' + path + '" value="' + o[0] + '"' + (sel.indexOf(o[0]) > -1 ? ' checked' : '') + dis + '>' + esc(o[1]) + '</label>';
          }).join('') + '</div>';
          if (!hint && f.target === 'service') hint = '<p class="f__hint">None ticked shows every main service in order.</p>';
        }
        break;
      }
      case 'rep':
        return repHTML(f, path, v || [], ro);
    }
    return '<div class="f' + (S.errors[path] ? ' is-error' : '') + '" data-field="' + path + '">' + top + input + hint + err + '</div>';
  }

  function itemTitle(def, item, i) {
    var first = def.fields.filter(function (x) { return x.t === 'string' || x.t === 'text'; });
    var name = '';
    for (var k = 0; k < first.length && !name; k++) name = item[first[k].k];
    if (def === D.ELEMENTS['elements.process-step'] && item.title) name = item.rev + ' · ' + item.title;
    if (def === D.ELEMENTS['elements.fact'] && item.value) name = item.label + ': ' + item.value;
    return name ? String(name) : def.name + ' ' + (i + 1);
  }

  function repHTML(f, path, arr, ro) {
    var def = D.ELEMENTS[f.of];
    var id = idOf(path);
    var items = arr.map(function (item, i) {
      var ip = path + '.' + i;
      var open = !!S.openItems[ip];
      return '<div class="rep__item" data-item="' + ip + '">' +
        '<div class="rep__head"><button type="button" class="rep__title" data-toggle-item="' + ip + '" aria-expanded="' + open + '" aria-controls="' + idOf(ip) + '-body">' + esc(itemTitle(def, item, i)) + '</button>' +
        (ro ? '' : '<button type="button" class="rep__x" data-del-item="' + ip + '" aria-label="Delete ' + esc(def.name.toLowerCase()) + ' ' + (i + 1) + '">' + icon('trash') + '</button>') + '</div>' +
        '<div class="rep__body" id="' + idOf(ip) + '-body"' + (open ? '' : ' hidden') + '>' + def.fields.map(function (sf) { return fieldHTML(sf, ip, item, ro); }).join('') + '</div></div>';
    }).join('');
    var range = (f.min ? f.min : 0) + '–' + f.max;
    return '<div class="f' + (S.errors[path] ? ' is-error' : '') + '" data-field="' + path + '">' +
      '<div class="f__top"><span class="f__label" id="' + id + '-l">' + f.k + (f.req ? '<span class="f__req" aria-hidden="true">*</span>' : '') + ' <span class="f__hint" style="display:inline">(' + arr.length + ')</span></span><span class="f__count" aria-hidden="true">' + range + ' entries</span></div>' +
      '<div class="rep" role="group" aria-labelledby="' + id + '-l">' + items + '</div>' +
      (ro || arr.length >= f.max ? '' : '<button type="button" class="btn btn--ghost rep__add" data-add-item="' + path + '">' + icon('plus') + 'Add an entry</button>') +
      '<p class="f__err" data-err-for="' + path + '"' + (S.errors[path] ? '' : ' hidden') + '>' + icon('x') + '<span>' + esc(S.errors[path] || '') + '</span></p></div>';
  }

  function compHTML(key, def, obj, ro) {
    var open = !!S.openComp[key];
    return '<div class="comp' + (open ? ' is-open' : '') + '" data-comp="' + key + '">' +
      '<button type="button" class="comp__head" data-toggle-comp="' + key + '" aria-expanded="' + open + '"><span class="comp__ico">' + icon(def.icon) + '</span><span class="comp__name">' + def.name + '</span><span class="comp__key">shared.' + key + '</span>' + icon('chev', 'comp__chev') + '</button>' +
      '<div class="comp__body"><p class="comp__desc">' + esc(def.desc) + '</p><div class="fields">' + def.fields.map(function (f) {
        // The search preview sits right under the two fields it shows.
        return fieldHTML(f, key, obj, ro) + (key === 'seo' && f.k === 'metaDescription' ? serpHTML(obj) : '');
      }).join('') + '</div></div></div>';
  }

  function blockSummary(b) {
    if (b.heading) return b.heading;
    if (b.label) return b.label;
    if (b.facts) return b.facts.length + ' facts';
    return 'Empty';
  }
  function hasErrorUnder(prefix) {
    return Object.keys(S.errors).some(function (p) { return p === prefix || p.indexOf(prefix + '.') === 0; });
  }

  function blockHTML(b, i, n, ro) {
    var def = D.BLOCKS[b.__component];
    var base = 'sections.' + i;
    var open = !!S.openBlocks[b.id];
    var name = def.name;
    return '<div class="blk' + (open ? ' is-open' : '') + (hasErrorUnder(base) ? ' is-error' : '') + '" data-row="' + b.id + '">' +
      '<div class="blk__head">' +
        (ro ? '' : '<button type="button" class="blk__handle" data-handle="' + b.id + '" aria-label="Reorder ' + esc(name) + ', position ' + (i + 1) + ' of ' + n + '. Press the up or down arrow to move it." aria-describedby="dz-help">' + icon('drag') + '</button>') +
        '<button type="button" class="blk__open" data-toggle-block="' + b.id + '" aria-expanded="' + open + '" aria-controls="blk-' + b.id + '-body"><span class="comp__ico">' + icon(def.icon) + '</span><span class="blk__txt"><span class="blk__name">' + esc(name) + '</span><span class="blk__sum" data-sum="' + b.id + '">' + esc(blockSummary(b)) + '</span></span>' + icon('chev', 'blk__chev') + '</button>' +
        (ro ? '' : '<div class="menu"><button type="button" class="btn btn--icon" data-menu aria-haspopup="true" aria-expanded="false" aria-label="More actions for ' + esc(name) + '">' + icon('more') + '</button>' +
          '<div class="menu__list" role="menu" hidden>' +
            '<button type="button" role="menuitem" data-act="up" data-id="' + b.id + '"' + (i === 0 ? ' disabled' : '') + '>' + icon('up') + 'Move up</button>' +
            '<button type="button" role="menuitem" data-act="down" data-id="' + b.id + '"' + (i === n - 1 ? ' disabled' : '') + '>' + icon('down') + 'Move down</button>' +
            '<button type="button" role="menuitem" data-act="dup" data-id="' + b.id + '">' + icon('copy') + 'Duplicate</button>' +
            '<button type="button" role="menuitem" class="is-danger" data-act="del" data-id="' + b.id + '">' + icon('trash') + 'Delete</button>' +
          '</div></div>') +
      '</div>' +
      '<div class="blk__body" id="blk-' + b.id + '-body"><p class="blk__desc"><code>' + b.__component + '</code>' + (def.desc ? ' · ' + esc(def.desc) : '') + '</p><div class="fields">' +
        def.fields.map(function (f) { return fieldHTML(f, base, b, ro); }).join('') + '</div></div></div>';
  }

  // Google cuts desktop titles at about 600px of 20px Arial. Measure, and add the ellipsis only past that.
  var measureCtx = document.createElement('canvas').getContext('2d');
  function googleTitle(t) {
    measureCtx.font = '20px Arial';
    if (measureCtx.measureText(t).width <= 600) return t;
    var cut = t;
    while (cut.length && measureCtx.measureText(cut.replace(/\s+$/, '') + ' …').width > 600) cut = cut.slice(0, -1);
    return cut.replace(/\s+$/, '') + ' …';
  }

  function serpHTML(seo) {
    var title = googleTitle(seo.metaTitle || 'Cowl & Brush');
    var desc = seo.metaDescription || '';
    var shown = desc.length > 158 ? desc.slice(0, 155).replace(/\s+\S*$/, '') + ' …' : desc;
    var flags = [];
    if (seo.noIndex) flags.push('noIndex is on: search engines will drop this page.');
    if (desc.length && desc.length < 50) flags.push('Too short: Google may write its own snippet instead.');
    return '<div class="serp" id="serp" aria-label="Search result preview"><p class="serp__label">' + icon('search') + 'Search result preview</p>' +
      '<div class="serp__site"><span class="serp__fav"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M9 34V17h8v17M23 34V12h8v22M4 34h32" fill="none" stroke="#1F1B18" stroke-width="3"/></svg></span><span><span class="serp__name">Cowl &amp; Brush</span><br><span class="serp__url">https://www.cowlandbrush.example.co.uk</span></span></div>' +
      '<p class="serp__title" id="serp-title">' + esc(title) + '</p><p class="serp__desc" id="serp-desc">' + esc(shown) + '</p>' +
      '<p class="serp__flag" id="serp-flag"' + (flags.length ? '' : ' hidden') + '>' + esc(flags.join(' ')) + '</p></div>';
  }

  function renderEditor() {
    var ro = S.version === 'published';
    var doc = ro ? S.published : S.form;
    var scroll = editor.scrollTop;
    var n = doc.sections.length;
    var html = '';
    if (ro) html += '<p class="readonly-note">This is the live version. Switch to Draft to change it.</p>';
    html += '<div class="fields">' + fieldHTML(D.PAGE.fields[0], '', doc, ro) + '</div>';
    html += '<div class="group-h"><h3>hero</h3><span>component</span></div>' + compHTML('hero', D.HERO, doc.hero, ro);
    html += '<div class="group-h"><h3>sections <span class="f__hint" style="display:inline">(' + n + ')</span></h3><span>dynamic zone · top to bottom on the page</span></div>';
    html += '<p class="sr-only" id="dz-help">Blocks render on the page in this order.</p>';
    html += '<div class="dz" id="dz">' + doc.sections.map(function (b, i) { return blockHTML(b, i, n, ro); }).join('') + '</div>';
    if (!ro) html += '<button type="button" class="dz__add" id="btn-add-block" style="margin-top:8px">' + icon('plus') + 'Add a component to sections</button>';
    html += '<div class="group-h"><h3>seo</h3><span>component</span></div>' + compHTML('seo', D.SEO, doc.seo, ro);
    editor.innerHTML = html;
    editor.classList.toggle('is-readonly', ro);
    editor.scrollTop = scroll;
  }

  // =============================================================================
  // Validation (the publish-time rules; drafts skip "required" and minimums)
  // =============================================================================
  function validate(doc, publish) {
    var errs = {};
    function check(defs, obj, base) {
      defs.forEach(function (f) {
        var p = base ? base + '.' + f.k : f.k;
        var v = obj ? obj[f.k] : undefined;
        if (f.t === 'string' || f.t === 'text') {
          var len = (v || '').length;
          if (publish && f.req && !String(v || '').trim()) errs[p] = 'This value is required.';
          else if (f.max && len > f.max) errs[p] = 'Too long: ' + len + ' characters, the limit is ' + f.max + '.';
          else if (publish && f.min && len < f.min) errs[p] = 'Too short: ' + len + ' characters, at least ' + f.min + '.';
          else if (f.regex && len && !new RegExp(f.regex).test(v)) errs[p] = 'Must start with https://';
        } else if (f.t === 'rep') {
          var arr = v || [];
          if (publish && f.min && arr.length < f.min) errs[p] = 'Add at least ' + f.min + (f.min === 1 ? ' entry.' : ' entries.');
          arr.forEach(function (it, i) { check(D.ELEMENTS[f.of].fields, it, p + '.' + i); });
        } else if (f.t === 'link') {
          if (v && String(v.label || '').length > 40) errs[p + '.href'] = 'The label is too long: the limit is 40 characters.';
          else if (publish && v && String(v.label || '').trim() && !String(v.href || '').trim()) errs[p + '.href'] = 'Add where this link goes.';
        } else if (f.t === 'int') {
          if (publish && f.req && (v === '' || v == null)) errs[p] = 'This value is required.';
          else if (v !== '' && v != null && (v < f.min || v > f.max)) errs[p] = 'Between ' + f.min + ' and ' + f.max + '.';
        } else if (f.t === 'blocks') {
          if (publish && f.req && !String(v || '').trim()) errs[p] = 'This value is required.';
        } else if (f.t === 'json') {
          if (v && String(v).trim()) { try { JSON.parse(v); } catch (e) { errs[p] = 'This is not valid JSON.'; } }
        }
      });
    }
    check(D.PAGE.fields, doc, '');
    check(D.HERO.fields, doc.hero, 'hero');
    doc.sections.forEach(function (b, i) { check(D.BLOCKS[b.__component].fields, b, 'sections.' + i); });
    check(D.SEO.fields, doc.seo, 'seo');
    return errs;
  }

  function showErrors(errs) {
    S.errors = errs;
    var paths = Object.keys(errs);
    paths.forEach(function (p) {
      var m = p.match(/^sections\.(\d+)/);
      if (m) S.openBlocks[S.form.sections[+m[1]].id] = true;
      var keys = p.split('.');
      for (var k = 2; k < keys.length; k++) if (/^\d+$/.test(keys[k])) S.openItems[keys.slice(0, k + 1).join('.')] = true;
      if (p.indexOf('hero.') === 0) S.openComp.hero = true;
      if (p.indexOf('seo.') === 0) S.openComp.seo = true;
    });
    renderEditor();
    var first = paths.length && document.querySelector('[data-field="' + paths[0] + '"] .inp, [data-field="' + paths[0] + '"] button, [data-field="' + paths[0].replace(/\.href$/, '') + '"] .inp');
    if (first) { first.focus({ preventScroll: true }); first.scrollIntoView({ block: 'center', behavior: REDUCED ? 'auto' : 'smooth' }); }
  }

  // Re-check after each keystroke once errors are showing, without re-rendering.
  function refreshErrors() {
    if (!S.errorMode) return;
    var errs = validate(S.form, S.errorMode === 'publish');
    $$('[data-err-for]', editor).forEach(function (n) {
      var p = n.getAttribute('data-err-for');
      n.hidden = !errs[p];
      n.querySelector('span').textContent = errs[p] || '';
      var f = n.closest('.f');
      if (f) f.classList.toggle('is-error', !!errs[p]);
      var inp = f && f.querySelector('.inp');
      if (inp) { if (errs[p]) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid'); }
    });
    S.errors = errs;
    $$('.blk', editor).forEach(function (row, i) { row.classList.toggle('is-error', hasErrorUnder('sections.' + i)); });
    if (!Object.keys(errs).length) S.errorMode = null;
  }

  // =============================================================================
  // Status, toasts, announcements
  // =============================================================================
  var badge = $('#status-badge');
  var btnSave = $('#btn-save');
  var btnPublish = $('#btn-publish');
  var statusLine = $('#status-line');

  function updateStatus() {
    var unsaved = !same(S.form, S.draft);
    var modified = !same(S.draft, S.published);
    var st = modified ? 'modified' : 'published';
    badge.dataset.status = st;
    badge.textContent = st === 'modified' ? 'Modified' : 'Published';
    statusLine.textContent = unsaved ? 'Unsaved changes.' : modified ? 'Draft saved. The live site still shows the published version.' : 'Published. No changes since.';
    var ro = S.version !== 'draft';
    btnSave.disabled = ro || !unsaved;
    btnPublish.disabled = ro || (!unsaved && !modified);
    $('#btn-discard').disabled = !unsaved;
  }

  var toastEl = $('#toast');
  var toastTimer;
  function toast(msg, isError) {
    toastEl.innerHTML = icon(isError ? 'x' : 'check') + '<span>' + esc(msg) + '</span>';
    toastEl.classList.toggle('is-error', !!isError);
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2600 / SPEED);
  }
  var live = $('#live');
  function announce(msg) { live.textContent = ''; setTimeout(function () { live.textContent = msg; }, 30); }

  // =============================================================================
  // Editor events
  // =============================================================================
  editor.addEventListener('input', function (e) {
    var t = e.target;
    var path = t.getAttribute('data-path');
    if (!path || S.version !== 'draft') return;
    var val = t.value;
    if (t.hasAttribute('data-num')) val = val === '' ? (t.tagName === 'SELECT' ? null : '') : Number(val);
    setAt(S.form, path, val);
    var counter = editor.querySelector('[data-count-for="' + path + '"]');
    if (counter) {
      var f = defFor(path);
      counter.textContent = counterText(f, String(val).length);
      counter.className = 'f__count' + counterClass(f, String(val).length);
    }
    // Keep collapsed titles and block summaries in step with what is typed.
    var m = path.match(/^(sections\.\d+)\.(heading|label)$/);
    if (m) { var b = getAt(S.form, m[1]); var sum = editor.querySelector('[data-sum="' + b.id + '"]'); if (sum) sum.textContent = blockSummary(b); }
    var im = path.match(/^(.*\.\d+)\.[^.]+$/);
    if (im) {
      var titleBtn = editor.querySelector('[data-toggle-item="' + im[1] + '"]');
      if (titleBtn) { var arrPath = im[1].replace(/\.\d+$/, ''); var idx = +im[1].split('.').pop(); titleBtn.textContent = itemTitle(D.ELEMENTS[defFor(arrPath).of], getAt(S.form, im[1]), idx); }
    }
    if (path.indexOf('seo.') === 0) updateSerp();
    refreshErrors();
    updateStatus();
  });
  editor.addEventListener('change', function (e) {
    var t = e.target;
    if (t.hasAttribute('data-rel')) {
      var path = t.getAttribute('data-rel');
      var ids = $$('[data-rel="' + path + '"]', editor).filter(function (c) { return c.checked; }).map(function (c) { return Number(c.value); });
      setAt(S.form, path, ids);
      updateStatus();
    }
  });
  editor.addEventListener('submit', function (e) { e.preventDefault(); });

  function defFor(path) {
    var keys = path.split('.');
    var defs, i = 0;
    if (keys[0] === 'hero') { defs = D.HERO.fields; i = 1; }
    else if (keys[0] === 'seo') { defs = D.SEO.fields; i = 1; }
    else if (keys[0] === 'sections') { defs = D.BLOCKS[S.form.sections[+keys[1]].__component].fields; i = 2; }
    else defs = D.PAGE.fields;
    var f = null;
    for (; i < keys.length; i++) {
      if (/^\d+$/.test(keys[i])) { defs = D.ELEMENTS[f.of].fields; continue; }
      f = defs.filter(function (x) { return x.k === keys[i]; })[0] || f;
      if (f && f.t === 'link' && i < keys.length - 1) return { k: keys[i + 1], t: 'string', max: 40 };
    }
    return f;
  }

  function updateSerp() {
    var serp = $('#serp');
    if (!serp) return;
    var holder = document.createElement('div');
    holder.innerHTML = serpHTML(S.form.seo);
    serp.replaceWith(holder.firstChild);
  }

  function closeMenus(except) {
    $$('.menu__list').forEach(function (m) {
      if (m === except) return;
      m.hidden = true;
      var b = m.previousElementSibling;
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  }

  editor.addEventListener('click', function (e) {
    var t = e.target.closest('button');
    if (!t) return;
    if (t.hasAttribute('data-toggle-comp')) {
      var k = t.getAttribute('data-toggle-comp');
      S.openComp[k] = !S.openComp[k];
      t.closest('.comp').classList.toggle('is-open', S.openComp[k]);
      t.setAttribute('aria-expanded', String(S.openComp[k]));
      return;
    }
    if (t.hasAttribute('data-toggle-block')) {
      var id = t.getAttribute('data-toggle-block');
      S.openBlocks[id] = !S.openBlocks[id];
      t.closest('.blk').classList.toggle('is-open', S.openBlocks[id]);
      t.setAttribute('aria-expanded', String(S.openBlocks[id]));
      return;
    }
    if (t.hasAttribute('data-toggle-item')) {
      var ip = t.getAttribute('data-toggle-item');
      S.openItems[ip] = !S.openItems[ip];
      t.setAttribute('aria-expanded', String(S.openItems[ip]));
      document.getElementById(idOf(ip) + '-body').hidden = !S.openItems[ip];
      return;
    }
    if (S.version !== 'draft') return;
    if (t.hasAttribute('data-bool')) {
      setAt(S.form, t.getAttribute('data-bool'), t.getAttribute('data-val') === 'true');
      $$('[data-bool="' + t.getAttribute('data-bool') + '"]', editor).forEach(function (b) { b.setAttribute('aria-pressed', String(b === t)); });
      if (t.getAttribute('data-bool').indexOf('seo.') === 0) updateSerp();
      updateStatus();
      return;
    }
    if (t.hasAttribute('data-add-item')) {
      var ap = t.getAttribute('data-add-item');
      var arr = getAt(S.form, ap);
      var def = D.ELEMENTS[defFor(ap).of];
      arr.push(blankFrom(def.fields));
      S.openItems[ap + '.' + (arr.length - 1)] = true;
      renderEditor(); updateStatus();
      var first = document.getElementById(idOf(ap + '.' + (arr.length - 1) + '.' + def.fields[0].k));
      if (first) first.focus();
      return;
    }
    if (t.hasAttribute('data-del-item')) {
      var dp = t.getAttribute('data-del-item');
      var parts = dp.split('.'); var di = +parts.pop(); var arrP = parts.join('.');
      getAt(S.form, arrP).splice(di, 1);
      Object.keys(S.openItems).forEach(function (key) { if (key.indexOf(arrP + '.') === 0) delete S.openItems[key]; });
      renderEditor(); refreshErrors(); updateStatus();
      announce('Entry deleted.');
      var addBtn = editor.querySelector('[data-add-item="' + arrP + '"]');
      if (addBtn) addBtn.focus();
      return;
    }
    if (t.hasAttribute('data-menu')) {
      var list = t.nextElementSibling;
      var open = list.hidden;
      closeMenus(list);
      list.hidden = !open;
      t.setAttribute('aria-expanded', String(open));
      if (open) { var firstItem = list.querySelector('button:not(:disabled)'); if (firstItem) firstItem.focus(); }
      return;
    }
    if (t.hasAttribute('data-act')) {
      blockAction(t.getAttribute('data-act'), Number(t.getAttribute('data-id')));
      return;
    }
    if (t.id === 'btn-add-block') { openPicker(); }
  });

  editor.addEventListener('keydown', function (e) {
    var h = e.target.closest('.blk__handle');
    if (h && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      blockAction(e.key === 'ArrowUp' ? 'up' : 'down', Number(h.getAttribute('data-handle')), true);
    }
    var menu = e.target.closest('.menu__list');
    if (menu && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      var items = $$('button:not(:disabled)', menu);
      var i = items.indexOf(document.activeElement);
      items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
    }
    if (e.key === 'Escape' && menu) { menu.hidden = true; menu.previousElementSibling.setAttribute('aria-expanded', 'false'); menu.previousElementSibling.focus(); }
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.menu')) closeMenus(); });

  function blankFrom(fields) {
    var o = {};
    fields.forEach(function (f) {
      if (f.t === 'rep' || (f.t === 'relation' && !f.single)) o[f.k] = [];
      else if (f.t === 'relation') o[f.k] = null;
      else if (f.t === 'link') o[f.k] = { label: '', href: '' };
      else if (f.t === 'bool') o[f.k] = !!f.def;
      else if (f.t === 'int') o[f.k] = f.def != null ? f.def : '';
      else if (f.t === 'enum') o[f.k] = f.def || f.options[0];
      else o[f.k] = '';
    });
    return o;
  }

  function blockAction(act, id, fromKeyboard) {
    var list = S.form.sections;
    var i = list.findIndex(function (b) { return b.id === id; });
    if (i < 0) return;
    var name = D.BLOCKS[list[i].__component].name;
    var focusId = id;
    if (act === 'up' || act === 'down') {
      var j = act === 'up' ? i - 1 : i + 1;
      if (j < 0 || j >= list.length) return;
      list.splice(j, 0, list.splice(i, 1)[0]);
      announce(name + ' moved to position ' + (j + 1) + ' of ' + list.length + '.');
    } else if (act === 'dup') {
      var copy = clone(list[i]);
      copy.id = S.nextId++;
      list.splice(i + 1, 0, copy);
      focusId = copy.id;
      announce(name + ' duplicated.');
    } else if (act === 'del') {
      list.splice(i, 1);
      announce(name + ' deleted.');
      focusId = null;
    }
    clearErrorsOnStructure();
    renderEditor();
    updateStatus();
    if (focusId != null) {
      var row = editor.querySelector('[data-row="' + focusId + '"]');
      if (row) {
        flash(row);
        var target = fromKeyboard ? row.querySelector('.blk__handle') : row.querySelector('.blk__open');
        if (target) target.focus({ preventScroll: true });
        row.scrollIntoView({ block: 'nearest', behavior: REDUCED ? 'auto' : 'smooth' });
      }
    } else {
      var add = $('#btn-add-block'); if (add) add.focus({ preventScroll: true });
    }
  }
  function clearErrorsOnStructure() { if (S.errorMode) { S.errors = validate(S.form, S.errorMode === 'publish'); if (!Object.keys(S.errors).length) S.errorMode = null; } }
  function flash(node) { node.classList.remove('is-flash'); void node.offsetWidth; node.classList.add('is-flash'); }

  // ---- Drag to reorder (pointer). The keyboard path is the arrow keys on the handle. ----
  editor.addEventListener('pointerdown', function (e) {
    var handle = e.target.closest('.blk__handle');
    if (!handle || S.version !== 'draft' || e.button !== 0) return;
    e.preventDefault();
    var dz = $('#dz');
    var rows = $$('.blk', dz);
    var row = handle.closest('.blk');
    var from = rows.indexOf(row);
    var rects = rows.map(function (r) { return r.getBoundingClientRect(); });
    var startY = e.clientY;
    var shift = rects[from].height + 8;
    var to = from;
    row.classList.add('is-dragging');
    function move(ev) {
      var dy = ev.clientY - startY;
      row.style.transform = 'translateY(' + dy + 'px)';
      var idx = 0;
      rects.forEach(function (r, k) { if (k !== from && ev.clientY > r.top + r.height / 2) idx++; });
      to = idx;
      rows.forEach(function (r, k) {
        if (k === from) return;
        var y = 0;
        if (to > from && k > from && k <= to) y = -shift;
        if (to < from && k >= to && k < from) y = shift;
        r.style.transform = y ? 'translateY(' + y + 'px)' : '';
      });
    }
    function up() {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointercancel', up);
      rows.forEach(function (r) { r.style.transform = ''; });
      row.classList.remove('is-dragging');
      if (to !== from) {
        var list = S.form.sections;
        var moved = list.splice(from, 1)[0];
        list.splice(to, 0, moved);
        renderEditor();
        updateStatus();
        var nr = editor.querySelector('[data-row="' + moved.id + '"]');
        if (nr) flash(nr);
        announce(D.BLOCKS[moved.__component].name + ' moved to position ' + (to + 1) + ' of ' + list.length + '.');
      }
    }
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', up);
  });

  // ---- Block picker ----
  var picker = $('#picker');
  $('#picker-grid').innerHTML = D.ZONE.map(function (key) {
    var def = D.BLOCKS[key];
    return '<button type="button" class="pick" data-pick="' + key + '"><span class="comp__ico">' + icon(def.icon) + '</span>' + def.name + '<small>' + key + '</small></button>';
  }).join('');
  function openPicker() { picker.showModal(); var f = picker.querySelector('.pick'); if (f) f.focus(); }
  picker.addEventListener('click', function (e) {
    if (e.target === picker || e.target.closest('[data-close]')) { picker.close(); return; }
    var p = e.target.closest('[data-pick]');
    if (!p) return;
    var key = p.getAttribute('data-pick');
    var b = Object.assign({ id: S.nextId++, __component: key }, blankFrom(D.BLOCKS[key].fields));
    S.form.sections.push(b);
    S.openBlocks[b.id] = true;
    picker.close();
    renderEditor();
    updateStatus();
    var row = editor.querySelector('[data-row="' + b.id + '"]');
    if (row) { flash(row); row.scrollIntoView({ block: 'center', behavior: REDUCED ? 'auto' : 'smooth' }); var inp = row.querySelector('.inp'); if (inp) inp.focus({ preventScroll: true }); }
    announce(D.BLOCKS[key].name + ' added at the end of sections.');
  });
  picker.addEventListener('close', function () { var a = $('#btn-add-block'); if (a && !editor.contains(document.activeElement)) a.focus(); });

  // ---- Draft / Published tabs ----
  $$('.ed__tab').forEach(function (tab) {
    tab.addEventListener('click', function () { setVersion(tab.getAttribute('data-ver')); });
    tab.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { var other = tab.id === 'ver-draft' ? $('#ver-published') : $('#ver-draft'); other.focus(); setVersion(other.getAttribute('data-ver')); }
    });
  });
  function setVersion(v) {
    S.version = v;
    $$('.ed__tab').forEach(function (t) { var on = t.getAttribute('data-ver') === v; t.classList.toggle('is-on', on); t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
    renderEditor();
    updateStatus();
  }

  // ---- Not-in-this-demo buttons ----
  $$('[data-off]').forEach(function (b) {
    b.addEventListener('click', function () {
      var note = $('#sub-note');
      note.textContent = 'This demo opens the Home page only.';
      toast('This demo opens the Home page only.');
    });
  });

  // ---- More menu in the Entry panel ----
  var more = $('#btn-more');
  more.addEventListener('click', function (e) {
    e.stopPropagation();
    var list = more.nextElementSibling;
    var open = list.hidden;
    closeMenus(list);
    list.hidden = !open;
    more.setAttribute('aria-expanded', String(open));
    if (open && !$('#btn-discard').disabled) $('#btn-discard').focus();
  });
  more.parentElement.addEventListener('keydown', function (e) { if (e.key === 'Escape') { more.nextElementSibling.hidden = true; more.setAttribute('aria-expanded', 'false'); more.focus(); } });
  $('#btn-discard').addEventListener('click', function () {
    S.form = clone(S.draft);
    S.errors = {}; S.errorMode = null;
    closeMenus();
    renderEditor(); updateStatus();
    toast('Changes discarded');
  });

  // =============================================================================
  // Save, Publish, Preview
  // =============================================================================
  function busy(btn, on) { btn.classList.toggle('is-busy', on); btn.setAttribute('aria-busy', String(on)); }

  btnSave.addEventListener('click', save);
  async function save() {
    var errs = validate(S.form, false);
    if (Object.keys(errs).length) { S.errorMode = 'draft'; showErrors(errs); toast('Some fields need a look before saving', true); return; }
    S.errors = {}; S.errorMode = null;
    busy(btnSave, true);
    await wait(420);
    S.draft = clone(S.form);
    busy(btnSave, false);
    $('#info-updated').textContent = day(now());
    renderEditor();
    updateStatus();
    toast('Saved document');
    announce('Draft saved.');
    // Strapi fires entry.update for the draft save. The route revalidates home-page; the cached
    // page refetches the published version, which has not changed.
    S.lastEvent = 'entry.update';
    S.cache.state = S.cache.state === 'fresh' ? 'marked' : S.cache.state;
    if (!S.waitingVisits) setPathState('entry.update at ' + hms(now()) + ' · 200 · draft saved, live page unchanged until you publish.');
    // The preview tab listens for strapiUpdate and refreshes itself.
    if (S.previewOpen && S.tab === 'preview') previewRequest(false);
  }

  btnPublish.addEventListener('click', publish);
  async function publish() {
    var errs = validate(S.form, true);
    if (Object.keys(errs).length) {
      S.errorMode = 'publish';
      showErrors(errs);
      var n = Object.keys(errs).length;
      toast(n === 1 ? 'One field needs a look before publishing' : n + ' fields need a look before publishing', true);
      return;
    }
    S.errors = {}; S.errorMode = null;
    busy(btnPublish, true);
    await wait(520);
    S.draft = clone(S.form);
    S.published = clone(S.form);
    busy(btnPublish, false);
    var at = now();
    S.publishedAt = at;
    $('#info-updated').textContent = day(at);
    renderEditor();
    updateStatus();
    toast('Published document');
    announce('Published. The webhook is on its way to the website.');
    if (isPhone()) showRegion('path');
    runPath(at);
  }

  $('#btn-preview').addEventListener('click', openPreview);
  async function openPreview() {
    if (!same(S.form, S.draft)) toast('Preview shows the saved draft. Save to include your latest changes.');
    var isNew = !S.previewOpen;
    S.previewOpen = true;
    var tab = $('#btab-preview');
    tab.hidden = false;
    if (isNew) { tab.classList.remove('is-new'); void tab.offsetWidth; tab.classList.add('is-new'); }
    if (isPhone()) showRegion('site');
    selectTab('preview', true);
    await previewRequest(true);
  }
  async function previewRequest(viaDraftRoute) {
    if (viaDraftRoute) {
      setUrl('www.cowlandbrush.example.co.uk/api/draft?url=%2F&secret=••••••&status=draft');
      chip('loading', '307 · Draft Mode on');
      loadingBar();
      await wait(650);
      if (S.tab !== 'preview') return;
    } else {
      chip('loading', 'Refreshing…');
      loadingBar();
      await wait(300);
    }
    setUrl('www.cowlandbrush.example.co.uk/');
    siteRender(S.draft, { draft: true });
    chip('draft', 'Draft Mode · not cached');
  }
  function exitPreview() {
    S.previewOpen = false;
    $('#btab-preview').hidden = true;
    selectTab('live');
    $('#btab-live').focus();
  }

  // =============================================================================
  // Website pane
  // =============================================================================
  var pendingRender = null;
  window.CMS_DEMO = {
    siteReady: function (win) { S.siteWin = win; var p = pendingRender || [S.liveShown, {}]; pendingRender = null; win.CB.render(p[0], p[1]); },
    exitPreview: exitPreview,
    state: S,
  };
  function siteRender(doc, opts) {
    if (S.siteWin && S.siteWin.CB) {
      var y = 0;
      try { y = S.siteWin.scrollY; } catch (e) { y = 0; }
      S.siteWin.CB.render(clone(doc), Object.assign({ scroll: y }, opts || {}));
    } else pendingRender = [clone(doc), opts || {}];
  }
  function setUrl(t) { $('#url-text').textContent = t; }
  function chip(state, text) { var c = $('#cache-chip'); c.dataset.state = state; $('#cache-text').textContent = text; }
  function loadingBar() { var b = $('#browser-load'); b.classList.remove('is-on'); void b.offsetWidth; b.classList.add('is-on'); setTimeout(function () { b.classList.remove('is-on'); }, 600 / SPEED); }

  function selectTab(which, skipRender) {
    S.tab = which;
    $$('.btab').forEach(function (b) { var on = b.getAttribute('data-tab') === which; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    if (skipRender) return;
    if (which === 'live') {
      setUrl('www.cowlandbrush.example.co.uk/');
      siteRender(S.liveShown, {});
      if (S.cache.state === 'marked') chip('marked', 'Cached copy marked stale');
      else chip(S.liveChip[0], S.liveChip[1]);
    }
    else { setUrl('www.cowlandbrush.example.co.uk/'); siteRender(S.draft, { draft: true }); chip('draft', 'Draft Mode · not cached'); }
  }
  $$('.btab').forEach(function (b) {
    b.addEventListener('click', function () { selectTab(b.getAttribute('data-tab')); });
    b.addEventListener('keydown', function (e) {
      if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && S.previewOpen) { var other = b.getAttribute('data-tab') === 'live' ? $('#btab-preview') : $('#btab-live'); other.focus(); other.click(); }
    });
  });

  function changedKeys(a, b) {
    var keys = [];
    if (a.hero.statusLabel !== b.hero.statusLabel) keys.push('statusLabel');
    var ha = clone(a.hero), hb = clone(b.hero); delete ha.statusLabel; delete hb.statusLabel;
    if (!same(ha, hb)) keys.push('hero');
    b.sections.forEach(function (blk, i) {
      var old = a.sections.filter(function (x) { return x.id === blk.id; })[0];
      var oldIndex = a.sections.indexOf(old);
      if (!old || !same(old, blk)) keys.push(String(blk.id));
      else if (oldIndex !== i && oldIndex > i) keys.push(String(blk.id)); // moved up
    });
    return keys;
  }

  $('#btn-reload').addEventListener('click', visit);
  async function visit() {
    var btn = $('#btn-reload');
    btn.classList.remove('is-spin'); void btn.offsetWidth; btn.classList.add('is-spin');
    if (S.tab === 'preview') { await previewRequest(false); return; }
    chip('loading', 'Requesting…');
    loadingBar();
    await wait(300);
    var c = S.cache;
    var at = now();
    if (c.state === 'fresh') {
      serve(c.doc, ['fresh', 'Cache HIT · fresh']);
      if (S.waitingVisits) logVisit('fresh', at);
    } else {
      serve(c.doc, ['stale', 'Cache HIT · stale, refreshing']);
      var wasMarked = c.state === 'marked';
      c.state = 'refreshing';
      if (S.waitingVisits && wasMarked) logVisit('stale', at);
      if (wasMarked) {
        await wait(900);
        c.doc = clone(S.published);
        c.state = 'fresh';
        if (S.waitingVisits) logVisit('rebuilt', now());
      }
    }
  }
  function serve(doc, chipState) {
    var keys = changedKeys(S.liveShown, doc);
    S.liveShown = clone(doc);
    S.liveChip = chipState;
    if (S.tab === 'live') { siteRender(doc, { changed: keys }); chip(chipState[0], chipState[1]); }
  }

  // =============================================================================
  // Publish path
  // =============================================================================
  var stations = $$('.st');
  var fill = $('#wire-fill');
  var pulse = $('#wire-pulse');
  var IDLE = stations.map(function (s) { return s.querySelector('[data-body]').innerHTML; });
  function setPathState(text, isLive) { var p = $('#path-state'); p.textContent = text; p.classList.toggle('is-live', !!isLive); }
  function stBody(i, html) { var b = stations[i].querySelector('[data-body]'); b.innerHTML = html; $$('p, div', b).forEach(function (n) { n.classList.add('fadein'); }); }
  function stTime(i, t) { stations[i].querySelector('[data-t]').textContent = t || ''; }
  function stState(i, st) { stations[i].classList.remove('is-active', 'is-done', 'is-waiting'); if (st) stations[i].classList.add('is-' + st); }
  var ok = '<svg class="i" style="width:12px;height:12px;vertical-align:-2px" aria-hidden="true"><use href="#i-check"/></svg>';

  function wireTo(k, ms) {
    var pct = (k / 4) * 100;
    var dur = REDUCED ? 0 : ms / SPEED;
    fill.style.transition = 'width ' + dur + 'ms cubic-bezier(.5,0,.3,1)';
    pulse.style.transition = 'left ' + dur + 'ms cubic-bezier(.5,0,.3,1), opacity .2s';
    fill.style.width = pct + '%';
    pulse.style.left = pct + '%';
    pulse.style.opacity = REDUCED ? '0' : '1';
    return wait(ms);
  }

  async function runPath(at) {
    var run = ++S.run;
    var alive = function () { return run === S.run; };
    S.lastEvent = 'entry.publish';
    S.waitingVisits = false;
    stations.forEach(function (s, i) { stState(i, null); stTime(i, ''); s.querySelector('[data-body]').innerHTML = IDLE[i]; });
    fill.style.transition = 'none'; fill.style.width = '0'; pulse.style.transition = 'none'; pulse.style.left = '0';
    setPathState('entry.publish at ' + hms(at) + ' · sending…', true);

    stState(0, 'active');
    stTime(0, '184 ms');
    stBody(0, '<p class="row"><b>event</b><code>entry.publish</code></p><p class="row"><b>uid</b><code>api::home-page.home-page</code></p><p>Draft and published versions now match.</p>');
    await wait(900); if (!alive()) return;
    stState(0, 'done');

    await wireTo(1, 520); if (!alive()) return;
    stState(1, 'active');
    var hook = '<p><code>POST /api/revalidate</code></p><p><code>Authorization: Bearer ••••••</code></p>';
    stBody(1, hook + '<p>Waiting for the response…</p>');
    await wait(1000); if (!alive()) return;
    stState(1, 'done');

    await wireTo(2, 520); if (!alive()) return;
    stState(2, 'active');
    stTime(2, '1.4 ms');
    stBody(2, '<p class="ok">' + ok + ' secret matches <span style="color:var(--s-muted)">(constant-time)</span></p>');
    await wait(380); if (!alive()) return;
    stBody(2, '<p class="ok">' + ok + ' secret matches <span style="color:var(--s-muted)">(constant-time)</span></p><p class="ok">' + ok + ' payload valid <span style="color:var(--s-muted)">(zod)</span></p>');
    await wait(380); if (!alive()) return;
    stBody(2, '<p class="ok">' + ok + ' secret matches <span style="color:var(--s-muted)">(constant-time)</span></p><p class="ok">' + ok + ' payload valid <span style="color:var(--s-muted)">(zod)</span></p>' +
      '<p>tags <span class="tagchip">home-page</span></p><p class="rule">Skipped for a single type: <code>page:&lt;slug&gt;</code>, <code>sitemap</code></p>');
    await wait(700); if (!alive()) return;
    stState(2, 'done');
    // The route's response closes the webhook delivery.
    stTime(1, '63 ms');
    stBody(1, hook + '<p class="ok">' + ok + ' 200 <code style="color:inherit">{"revalidated":["home-page"]}</code></p>');
    await wait(300); if (!alive()) return;

    await wireTo(3, 520); if (!alive()) return;
    stState(3, 'active');
    stTime(3, '0.3 ms');
    stBody(3, '<p><code>revalidateTag("home-page", "max")</code></p><p class="row"><b>hit</b><code>getSinglePage("home-page"), getSitemapEntries()</code></p><p class="warn">Marked stale. The next visit gets this copy and starts the refresh.</p>');
    S.cache.state = S.cache.state === 'refreshing' ? 'refreshing' : 'marked';
    S.waitingVisits = true;
    S.visits = [];
    // Show the visitor what they are about to get: nothing changes until someone asks.
    if (S.tab === 'live') chip('marked', 'Cached copy marked stale');
    await wait(900); if (!alive()) return;
    stState(3, 'done');

    await wireTo(4, 520); if (!alive()) return;
    pulse.style.opacity = '0';
    // Someone may have visited while the animation (slowed down) was still on its way.
    if (S.visits.length) { stBody(4, S.visits.slice(-3).join('')); stState(4, S.waitingVisits ? 'active' : 'done'); return; }
    stState(4, 'waiting');
    stBody(4, '<p class="warn">Waiting for the next visit…</p><p>No rebuild, no deploy.</p>');
    setPathState('entry.publish at ' + hms(at) + ' · webhook 200 · home-page marked stale. Waiting for the next visit.', true);
  }

  function logVisit(kind, at) {
    var rows = S.visits || (S.visits = []);
    if (kind === 'stale') rows.push('<div class="visit fadein"><span class="visit__k warn">' + hms(at) + '</span><span class="visit__d">Stale copy, refresh started</span><span class="visit__t">38 ms</span></div>');
    if (kind === 'rebuilt') rows.push('<div class="visit fadein"><span class="visit__k ok">+212 ms</span><span class="visit__d">Rebuilt in the background</span><span class="visit__t"></span></div>');
    if (kind === 'fresh') rows.push('<div class="visit fadein"><span class="visit__k ok">' + hms(at) + '</span><span class="visit__d">New page, from cache</span><span class="visit__t">31 ms</span></div>');
    var body = stations[4].querySelector('[data-body]');
    body.innerHTML = rows.slice(-3).join('');
    if (kind === 'stale') { stState(4, 'active'); stTime(4, ''); }
    if (kind === 'rebuilt') setPathState('Rebuilt at ' + hms(at) + '. Every visitor from now on gets the new page.', true);
    if (kind === 'fresh') {
      stState(4, 'done');
      stTime(4, '31 ms');
      S.waitingVisits = false;
      setPathState('Live. Published ' + hms(S.publishedAt || at) + ', served fresh from ' + hms(at) + '. No rebuild, no deploy.', true);
    }
  }

  // =============================================================================
  // Payload and route code
  // =============================================================================
  var codeDlg = $('#code');
  $('#btn-code').addEventListener('click', function () { fillCode(); codeDlg.showModal(); });
  codeDlg.addEventListener('click', function (e) { if (e.target === codeDlg || e.target.closest('[data-close]')) codeDlg.close(); });
  $$('.ctab').forEach(function (t) {
    t.addEventListener('click', function () { showCodeTab(t); });
    t.addEventListener('keydown', function (e) {
      var tabs = $$('.ctab'); var i = tabs.indexOf(t);
      if (e.key === 'ArrowRight') { tabs[(i + 1) % tabs.length].focus(); showCodeTab(tabs[(i + 1) % tabs.length]); }
      if (e.key === 'ArrowLeft') { tabs[(i + tabs.length - 1) % tabs.length].focus(); showCodeTab(tabs[(i + tabs.length - 1) % tabs.length]); }
    });
  });
  function showCodeTab(t) {
    $$('.ctab').forEach(function (x) { var on = x === t; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; document.getElementById(x.getAttribute('aria-controls')).hidden = !on; });
  }
  function hl(s) {
    return esc(s)
      .replace(/(\/\/[^\n]*)/g, '<span class="c">$1</span>')
      .replace(/(&quot;[^&\n]*?&quot;)/g, '<span class="s">$1</span>')
      .replace(/\b(import|from|const|return|export|async|function|if|for|of|new|await|as)\b/g, '<span class="k">$1</span>');
  }
  function fillCode() {
    var doc = S.published;
    var ev = S.lastEvent || 'entry.publish';
    var payload = {
      event: ev,
      createdAt: '…T' + hms(now()) + '.218Z',
      model: 'home-page',
      uid: 'api::home-page.home-page',
      entry: {
        id: ev === 'entry.publish' ? 41 : 40,
        documentId: 'h2k9qv7c1m0x8r5t3w6y4n2b',
        title: doc.title,
        hero: { statusLabel: (ev === 'entry.update' ? S.draft : doc).hero.statusLabel, heading: doc.hero.heading, '…': '…' },
        sections: doc.sections.map(function (b) { return { id: b.id, __component: b.__component, '…': '…' }; }),
        seo: { metaTitle: doc.seo.metaTitle, '…': '…' },
        publishedAt: ev === 'entry.publish' ? '…T' + hms(now()) + '.207Z' : null,
      },
    };
    var head = 'POST https://www.cowlandbrush.example.co.uk/api/revalidate\nAuthorization: Bearer ••••••\nContent-Type: application/json\n\n';
    $('#code-payload').innerHTML = '<span class="c">' + esc(head) + '</span>' + esc(JSON.stringify(payload, null, 2)).replace(/(&quot;[^&]*?&quot;)(:)/g, '<span class="k">$1</span>$2').replace(/: (&quot;[^&]*?&quot;)/g, ': <span class="s">$1</span>').replace(/: (\d+)/g, ': <span class="n">$1</span>');
    $('#code-route').innerHTML = hl(ROUTE);
    $('#code-tags').innerHTML =
      '<table class="tagtable"><thead><tr><th scope="col">Query</th><th scope="col">cacheTag(…)</th><th scope="col">Refreshed when</th></tr></thead><tbody>' +
      '<tr><td><code>getGlobal()</code></td><td><code>strapi</code> <code>global</code></td><td>Navigation or footer changes</td></tr>' +
      '<tr><td><code>getSinglePage("home-page")</code></td><td><code>strapi</code> <code>home-page</code> <code>service</code> <code>project</code> <code>category</code></td><td>The home page, or a service or job its grids show</td></tr>' +
      '<tr><td><code>getPage(slug)</code></td><td><code>strapi</code> <code>page:&lt;slug&gt;</code> <code>service</code> <code>project</code> <code>category</code></td><td>That page</td></tr>' +
      '<tr><td><code>getSitemapEntries()</code></td><td><code>strapi</code> <code>sitemap</code> <code>home-page</code> <code>contact-page</code> (every single type)</td><td>A page, service, job or article is published, unpublished or deleted, or a single page changes</td></tr>' +
      '</tbody></table>' +
      '<table class="tagtable" style="margin-top:14px"><thead><tr><th scope="col">Webhook event</th><th scope="col">Tags revalidated</th></tr></thead><tbody>' +
      '<tr><td><code>entry.publish</code> · home-page</td><td><code>home-page</code></td></tr>' +
      '<tr><td><code>entry.publish</code> · page “areas-we-cover”</td><td><code>page</code> <code>page:areas-we-cover</code> <code>sitemap</code></td></tr>' +
      '<tr><td><code>entry.update</code> · service “stove-fitting”</td><td><code>service</code> <code>service:stove-fitting</code></td></tr>' +
      '<tr><td><code>media.update</code></td><td><code>strapi</code> (a replaced photo can sit on any page)</td></tr>' +
      '</tbody></table>' +
      '<p>Every query is <code>"use cache"</code> with <code>cacheLife("max")</code>. Pages are served from the cache until one of their tags is revalidated; the long expiry of “max” is only a backstop. A broken CMS throws instead of returning nothing, so an empty page is never cached.</p>';
  }
  var ROUTE = [
    'import { revalidateTag } from "next/cache";',
    'import { z } from "zod";',
    'import { env } from "@/lib/env";',
    'import { safeEqual } from "@/lib/secrets";',
    '',
    '// Target of the CMS webhook "website revalidate" (header Authorization: Bearer <REVALIDATE_SECRET>).',
    'const ROUTABLE = new Set(["page", "service", "project", "article", "category"]); // types with their own URL',
    'const PROFILE = "max" as const; // stale-while-revalidate: the next visitor triggers the refresh',
    '',
    'const payloadSchema = z.union([',
    '  z.object({ tags: z.array(z.string().max(256)).min(1).max(50) }),',
    '  z.looseObject({',
    '    event: z.string(),',
    '    model: z.string().optional(),',
    '    uid: z.string().optional(),',
    '    entry: z.looseObject({ slug: z.string().nullish() }).optional(),',
    '  }),',
    ']);',
    '',
    'function tagsFor(body: z.infer<typeof payloadSchema>): string[] {',
    '  if (!("event" in body)) return body.tags;',
    '  const { event, model, uid, entry } = body;',
    '  if (event.startsWith("media.")) return event === "media.create" ? [] : ["strapi"];',
    '  if (!event.startsWith("entry.") || !model || !uid?.startsWith("api::")) return [];',
    '  if (model === "redirect") return ["redirect"];',
    '  const tags = [model];',
    '  if (entry?.slug) tags.push(`${model}:${entry.slug}`);',
    '  if (ROUTABLE.has(model) && /^entry\\.(publish|unpublish|delete)$/.test(event)) tags.push("sitemap");',
    '  return tags;',
    '}',
    '',
    'export async function POST(request: Request) {',
    '  if (!safeEqual(request.headers.get("authorization") ?? "", `Bearer ${env.REVALIDATE_SECRET}`)) {',
    '    return Response.json({ error: "unauthorized" }, { status: 401 });',
    '  }',
    '  const parsed = payloadSchema.safeParse(await request.json().catch(() => null));',
    '  if (!parsed.success) return Response.json({ error: "bad payload" }, { status: 400 });',
    '',
    '  const tags = [...new Set(tagsFor(parsed.data))];',
    '  for (const tag of tags) revalidateTag(tag, PROFILE);',
    '  return Response.json({ revalidated: tags, now: Date.now() });',
    '}',
  ].join('\n');

  // =============================================================================
  // Phone layout: Editor / Website / Publish path
  // =============================================================================
  var regions = { cms: $('#pane-cms'), site: $('#pane-site'), path: $('#path') };
  var switchBtns = { cms: $('#tab-cms'), site: $('#tab-site'), path: $('#tab-path') };
  function isPhone() { return window.matchMedia('(max-width: 1099px)').matches; }
  function showRegion(key) {
    Object.keys(regions).forEach(function (k) {
      var on = k === key;
      regions[k].classList.toggle('is-shown', on);
      switchBtns[k].setAttribute('aria-selected', String(on));
      switchBtns[k].tabIndex = on ? 0 : -1;
    });
  }
  Object.keys(switchBtns).forEach(function (k, i, keys) {
    switchBtns[k].addEventListener('click', function () { showRegion(k); });
    switchBtns[k].addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      var next = keys[(i + d + keys.length) % keys.length];
      switchBtns[next].focus(); showRegion(next);
    });
  });
  // Desktop shows all three regions; the tab panel roles only matter on phones.
  function syncRoles() {
    var phone = isPhone();
    Object.keys(regions).forEach(function (k) {
      if (phone) { regions[k].setAttribute('role', 'tabpanel'); regions[k].setAttribute('aria-labelledby', switchBtns[k].id); }
      else { regions[k].removeAttribute('role'); regions[k].removeAttribute('aria-labelledby'); }
    });
  }
  window.matchMedia('(max-width: 1099px)').addEventListener('change', syncRoles);
  syncRoles();

  // ---- Start ----
  renderEditor();
  updateStatus();
  // The frame may have finished before this script ran.
  try { if (frame.contentWindow && frame.contentWindow.CB) window.CMS_DEMO.siteReady(frame.contentWindow); } catch (e) { /* ignore */ }
  frame.addEventListener('load', function () {
    // site.html calls siteReady itself; this covers a reload of the frame.
    try { if (frame.contentWindow.CB && !S.siteWin) window.CMS_DEMO.siteReady(frame.contentWindow); } catch (e) { /* ignore */ }
  });
  if (window.HiconTour) {
    window.HiconTour.ready(function () {
      return new Promise(function (resolve) {
        (function check() {
          var w = S.siteWin;
          var img = w && w.document.querySelector('.hero__img img');
          if (img && img.complete) resolve(); else setTimeout(check, 80);
        })();
      });
    });
  }
})();
