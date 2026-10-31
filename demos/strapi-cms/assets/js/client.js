/*
 * The Cowl & Brush website. Renders a Home page document the way the Next.js BlockRenderer does:
 * the hero, then each dynamic-zone block by its __component. Inside the demo the CMS calls
 * CB.render(doc, opts) for every request; opened on its own it shows the published page.
 */
(function () {
  'use strict';

  var D = window.CB_DATA;
  var main = document.getElementById('main');
  var bar = document.querySelector('.preview-bar');
  function getHost() { try { return window.parent !== window ? window.parent.CMS_DEMO : null; } catch (e) { return null; } }
  var host = getHost();

  var IMG = {
    hero: { src: 'assets/img/hero-1600.webp', srcset: 'assets/img/hero-960.webp 960w, assets/img/hero-1600.webp 1600w', w: 1600, h: 1067 },
    sweeping: { src: 'assets/img/sweeping-800.webp', srcset: 'assets/img/sweeping-480.webp 480w, assets/img/sweeping-800.webp 800w', w: 800, h: 600 },
    stoves: { src: 'assets/img/stoves-800.webp', srcset: 'assets/img/stoves-480.webp 480w, assets/img/stoves-800.webp 800w', w: 800, h: 600 },
    cowls: { src: 'assets/img/cowls-800.webp', srcset: 'assets/img/cowls-480.webp 480w, assets/img/cowls-800.webp 800w', w: 800, h: 600 },
  };

  var ICONS = {
    flame: '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.4-5.4 3.6-8.3.5 1.8 1.5 2.9 2.6 3.4.2-2.6 1.4-4.9 3.3-6.4-.2 2.6.8 4.4 2.1 6.1 1.1 1.5 1.9 3.1 1.9 5.2C19 18.4 16.1 21 12 21z"/>',
    brush: '<path d="M12 3v9M8 12h8l1 3H7zM7 15l-1 6M10 15l-.5 6M14 15l.5 6M17 15l1 6"/>',
    shield: '<path d="M12 3l7 3v5c0 4.6-3 8.3-7 10-4-1.7-7-5.4-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
    camera: '<rect x="3" y="7" width="18" height="12" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 7l1.5-3h5L16 7"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  };
  function icon(name) {
    return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || ICONS.check) + '</svg>';
  }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function has(v) { return v != null && String(v).trim() !== ''; }
  // Internal paths live on the real site; inside the demo they jump to the matching section.
  function href(h) {
    if (!has(h)) return '#main';
    if (/^(tel:|mailto:)/.test(h)) return h;
    if (h === '/book') return '#book';
    if (h.indexOf('/services') === 0) return '#services';
    return '#main';
  }
  function linkBtn(l, cls) {
    if (!l || !has(l.label)) return '';
    return '<a class="btn ' + (cls || '') + '" href="' + esc(href(l.href)) + '">' + esc(l.label) + '</a>';
  }
  function head(b, id) {
    var out = '';
    if (has(b.label)) out += '<p class="eyebrow">' + esc(b.label) + '</p>';
    out += '<h2 class="sec__h" id="' + id + '-h">' + esc(b.heading) + '</h2>';
    if (has(b.intro)) out += '<p class="sec__intro">' + esc(b.intro) + '</p>';
    return out;
  }
  function section(b, inner, extra) {
    var id = 'b' + b.id;
    var anchorAttr = has(b.anchorId) ? ' id="' + esc(b.anchorId) + '"' : '';
    var labelled = has(b.heading) ? ' aria-labelledby="' + id + '-h"' : '';
    return '<section class="sec sec--' + b.__component.split('.')[1] + (b.width === 'half' ? ' sec--half' : '') + (extra ? ' ' + extra : '') + '" data-block="' + b.id + '"' + anchorAttr + labelled + '><div class="sec__in">' + inner.replace(/\{id\}/g, id) + '</div></section>';
  }

  // ---- Blocks ---------------------------------------------------------------
  var R = {};
  R['blocks.key-facts'] = function (b) {
    var facts = (b.facts || []).filter(function (f) { return has(f.label) || has(f.value); });
    if (!facts.length) return '';
    return '<section class="sec sec--facts" data-block="' + b.id + '" aria-label="Key facts"' + (has(b.anchorId) ? ' id="' + esc(b.anchorId) + '"' : '') + '><div class="sec__in"><dl class="ledger">' +
      facts.map(function (f) { return '<div class="ledger__cell"><dt>' + esc(f.label) + '</dt><dd><span class="ledger__v">' + esc(f.value) + '</span>' + (has(f.note) ? '<span class="ledger__n">' + esc(f.note) + '</span>' : '') + '</dd></div>'; }).join('') +
      '</dl></div></section>';
  };
  R['blocks.services-grid'] = function (b) {
    var list = (b.services && b.services.length) ? D.SERVICES.filter(function (s) { return b.services.indexOf(s.id) > -1; }) : D.SERVICES;
    return section(b, head(b, '{id}') + '<ul class="cards">' + list.map(function (s) {
      var im = IMG[s.img];
      return '<li class="card"><figure class="card__img"><img src="' + im.src + '" srcset="' + im.srcset + '" sizes="(min-width: 900px) 30vw, 90vw" width="' + im.w + '" height="' + im.h + '" alt="' + esc(s.alt) + '" loading="lazy" decoding="async"></figure>' +
        '<div class="card__body"><h3 class="card__h">' + esc(s.name) + '</h3><p class="card__price">' + esc(s.price) + '</p><p>' + esc(s.blurb) + '</p></div></li>';
    }).join('') + '</ul>');
  };
  R['blocks.process'] = function (b) {
    return section(b, head(b, '{id}') + '<ol class="steps">' + (b.steps || []).map(function (st) {
      return '<li class="step' + (st.current ? ' is-current' : '') + '"><span class="step__n" aria-hidden="true">' + esc(st.rev) + '</span><div>' + (has(st.when) ? '<p class="step__when">' + esc(st.when) + '</p>' : '') + '<h3 class="step__h">' + esc(st.title) + '</h3>' + (has(st.text) ? '<p>' + esc(st.text) + '</p>' : '') + '</div></li>';
    }).join('') + '</ol>');
  };
  R['blocks.faq'] = function (b) {
    return section(b, head(b, '{id}') + '<div class="faq">' + (b.items || []).filter(function (i) { return has(i.question); }).map(function (i, n) {
      return '<details class="faq__item"' + (n === 0 ? ' open' : '') + '><summary><span>' + esc(i.question) + '</span><svg class="faq__plus" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12M10 4v12"/></svg></summary><p>' + esc(i.answer) + '</p></details>';
    }).join('') + '</div>');
  };
  R['blocks.cta'] = function (b) {
    var form = b.form === 'enquiry'
      ? '<form class="enq" novalidate><div class="enq__grid"><label class="fld"><span>Your name</span><input name="name" autocomplete="name" required></label><label class="fld"><span>Phone</span><input name="phone" type="tel" autocomplete="tel" required></label><label class="fld"><span>Postcode</span><input name="postcode" autocomplete="postal-code" required></label><label class="fld"><span>What do you burn?</span><select name="fuel"><option>Logs</option><option>Smokeless coal</option><option>Both</option><option>Not sure yet</option></select></label></div><div class="enq__row"><button class="btn btn--light" type="submit">Ask for a call back</button>' + linkBtn(b.primaryLink, 'btn--ghost-light') + linkBtn(b.secondaryLink, 'btn--ghost-light') + '</div><p class="enq__ok" role="status" aria-live="polite"></p></form>'
      : '';
    return section(b, '<div class="cta">' + (has(b.label) ? '<p class="eyebrow eyebrow--light">' + esc(b.label) + '</p>' : '') + '<h2 class="cta__h" id="{id}-h">' + esc(b.heading) + '</h2>' + (has(b.text) ? '<p class="cta__t">' + esc(b.text) + '</p>' : '') + form +
      (b.form === 'enquiry' ? '' : '<div class="cta__links">' + linkBtn(b.primaryLink, 'btn--light') + linkBtn(b.secondaryLink, 'btn--ghost-light') + '</div>') + '</div>');
  };
  R['blocks.feature-points'] = function (b) {
    return section(b, head(b, '{id}') + '<ul class="points">' + (b.points || []).map(function (p) {
      return '<li>' + icon(p.icon) + '<h3>' + esc(p.title) + '</h3>' + (has(p.description) ? '<p>' + esc(p.description) + '</p>' : '') + '</li>';
    }).join('') + '</ul>');
  };
  R['blocks.included-items'] = function (b) {
    return section(b, head(b, '{id}') + '<ol class="incl">' + (b.items || []).map(function (i) {
      return '<li><span class="incl__n">' + esc(i.number) + '</span><div><h3>' + esc(i.title) + '</h3>' + (has(i.description) ? '<p>' + esc(i.description) + '</p>' : '') + '</div></li>';
    }).join('') + '</ol>');
  };
  R['blocks.targets'] = function (b) {
    return section(b, head(b, '{id}') + '<dl class="targets">' + (b.rows || []).map(function (r) {
      return '<div><dt>' + esc(r.label) + '</dt><dd>' + esc(r.value) + '</dd></div>';
    }).join('') + '</dl>');
  };
  R['blocks.notes'] = function (b) {
    return section(b, head(b, '{id}') + '<ul class="notes">' + (b.notes || []).map(function (n) { return '<li>' + esc(n.text) + '</li>'; }).join('') + '</ul>');
  };
  R['blocks.portfolio-grid'] = function (b) {
    var list = (b.projects && b.projects.length) ? D.PROJECTS.filter(function (p) { return b.projects.indexOf(p.id) > -1; }) : D.PROJECTS.filter(function (p) { return b.kind === 'all' || !b.kind || p.kind === b.kind; });
    list = list.slice(0, b.limit || 3);
    return section(b, head(b, '{id}') + '<ul class="jobs">' + list.map(function (p) {
      return '<li><p class="jobs__when">' + esc(p.when) + '</p><h3>' + esc(p.title) + '</h3><p>' + esc(p.note) + '</p></li>';
    }).join('') + '</ul>');
  };
  R['blocks.latest-articles'] = function (b) {
    var cat = b.category && D.CATEGORIES.filter(function (c) { return c.id === b.category; })[0];
    var list = D.ARTICLES.filter(function (a) { return !cat || a.cat === cat.name; }).slice(0, b.limit || 3);
    return section(b, head(b, '{id}') + '<ul class="posts">' + list.map(function (a) {
      return '<li><a href="#main"><span class="posts__meta">' + esc(a.date) + ' · ' + esc(a.cat) + '</span><span class="posts__t">' + esc(a.title) + '</span></a></li>';
    }).join('') + '</ul>');
  };
  R['blocks.rich-text'] = function (b) {
    var paras = String(b.body || '').split(/\n{2,}/).filter(has);
    return section(b, (has(b.heading) ? head(b, '{id}') : '') + '<div class="prose">' + paras.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>');
  };

  function hero(h) {
    var im = IMG[h.image] || IMG.hero;
    var facts = (h.facts || []).filter(function (f) { return has(f.value); });
    return '<section class="hero" data-block="hero" aria-labelledby="hero-h"><div class="hero__in">' +
      '<div class="hero__text">' +
        (has(h.statusLabel) ? '<p class="sign" data-field="statusLabel"><span>' + esc(h.statusLabel) + '</span></p>' : '') +
        '<h1 class="hero__h" id="hero-h">' + esc(h.heading) + (has(h.headingAccent) ? ' <span class="hero__accent">' + esc(h.headingAccent) + '</span>' : '') + '</h1>' +
        (has(h.lead) ? '<p class="hero__lead">' + esc(h.lead) + '</p>' : '') +
        '<div class="hero__links">' + linkBtn(h.primaryLink, '') + linkBtn(h.secondaryLink, 'btn--ghost') + '</div>' +
        (facts.length ? '<dl class="hero__facts">' + facts.map(function (f) { return '<div><dt>' + esc(f.label) + '</dt><dd>' + esc(f.value) + '</dd></div>'; }).join('') + '</dl>' : '') +
      '</div>' +
      '<figure class="hero__img"><img src="' + im.src + '" srcset="' + im.srcset + '" sizes="(min-width: 900px) 50vw, 100vw" width="' + im.w + '" height="' + im.h + '" alt="' + esc(D.MEDIA.hero.alt) + '" fetchpriority="high"></figure>' +
    '</div></section>';
  }

  function render(doc, opts) {
    opts = opts || {};
    var html = hero(doc.hero || {});
    (doc.sections || []).forEach(function (b) {
      var fn = R[b.__component];
      if (!fn) return;
      // Like the real renderer, a block missing its required heading is skipped rather than breaking the page.
      var def = D.BLOCKS[b.__component];
      var needsHeading = def.fields.some(function (f) { return f.k === 'heading' && f.req; });
      if (needsHeading && !has(b.heading)) return;
      html += fn(b);
    });
    main.innerHTML = html;
    document.title = (doc.seo && has(doc.seo.metaTitle)) ? doc.seo.metaTitle : 'Cowl & Brush';
    bar.hidden = !opts.draft;
    document.body.classList.toggle('is-draft', !!opts.draft);
    document.body.classList.remove('is-waiting');
    if (opts.changed && opts.changed.length) {
      opts.changed.forEach(function (key) {
        var node = key === 'statusLabel' ? main.querySelector('.sign') : main.querySelector('[data-block="' + key + '"]');
        if (node) node.classList.add('is-changed');
      });
    }
    if (typeof opts.scroll === 'number') window.scrollTo(0, opts.scroll);
  }

  // ---- Page behaviour ------------------------------------------------------
  var toggle = document.querySelector('.nav__toggle');
  toggle.addEventListener('click', function () {
    var open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    document.querySelector('.nav').classList.toggle('is-open', open);
  });
  document.querySelector('.nav__list').addEventListener('click', function (e) {
    if (e.target.closest('a')) { toggle.setAttribute('aria-expanded', 'false'); document.querySelector('.nav').classList.remove('is-open'); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { toggle.click(); toggle.focus(); }
  });

  main.addEventListener('submit', function (e) {
    var form = e.target.closest('.enq');
    if (!form) return;
    e.preventDefault();
    var missing = [].filter.call(form.querySelectorAll('[required]'), function (i) { return !i.value.trim(); });
    [].forEach.call(form.querySelectorAll('[required]'), function (i) { i.setAttribute('aria-invalid', String(missing.indexOf(i) > -1)); });
    var ok = form.querySelector('.enq__ok');
    if (missing.length) { ok.textContent = 'Please add your name, phone and postcode so we can ring you back.'; missing[0].focus(); return; }
    var name = form.querySelector('[name="name"]').value.trim().split(/\s+/)[0];
    form.classList.add('is-sent');
    ok.textContent = 'Thanks, ' + name + '. Rhian will ring you back within a working day. (Demo: nothing was sent.)';
  });

  bar.addEventListener('submit', function (e) {
    e.preventDefault();
    var h = getHost();
    if (h && h.exitPreview) h.exitPreview();
    else { bar.hidden = true; document.body.classList.remove('is-draft'); }
  });

  window.CB = { render: render };

  if (host) {
    document.body.classList.add('is-waiting', 'is-embedded');
    if (host.siteReady) host.siteReady(window);
  } else {
    render(D.HOME);
  }
})();
