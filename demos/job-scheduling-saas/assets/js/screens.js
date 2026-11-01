/*
 * Stampwell demo: job sheets, invoices, jobs, quotes, clients and reports.
 */
(function () {
  'use strict';

  var A = window.App, D = A.D, S = A.S;
  var esc = A.esc, money = A.money, icon = A.icon, avatar = A.avatar, pill = A.pill, t2 = A.t2;
  var main = function () { return document.getElementById('main'); };

  // ================================================================ Job sheets
  var SHEET_TABS = [['COMPLETED', 'To check'], ['APPROVED', 'Approved'], ['REJECTED', 'Sent back'], ['ALL', 'All']];
  S.sheetTab = 'COMPLETED';

  function sheetTitle(sh) { return sh.job ? S.jobs[sh.job].title : sh.title; }
  function sheetClient(sh) { return sh.job ? S.jobs[sh.job].client : sh.client; }

  // A signature as it was drawn on the engineer's phone.
  var SIGNATURES = {
    'Helen Barnard': 'M8 50c3-14 6-30 11-40 1 14-1 30-3 46M11 33c8-2 16-3 23-4-2 8-3 17-1 24 3-8 9-15 15-13-4 4-6 10 0 12 6 0 10-8 12-14 0 8 0 13 4 13 4-4 6-10 10-12 0 6 0 10 4 12 4-2 8-8 12-10M100 49c2-15 6-31 10-37 14 2 15 15 2 19 18 0 19 17-5 22-4 0-7-2-7-4M134 41c-6-2-10 8-2 10 6 0 8-8 10-12 0 6 2 12 8 10 2-6 4-10 10-10-2 4-2 10 2 12 4-6 8-10 12-10 0 6 0 10 4 12 6-4 8-10 14-12-6 2-8 10-2 12 6 0 8-8 10-14 0-10 2-20 4-26-2 14-2 28 0 38M96 62c40-5 92-8 150-13',
    'Rosa Kemp': 'M10 52c2-14 4-28 8-38 14 0 16 14 2 18 10 6 14 14 18 20M40 44c-6-2-10 8-2 10 6 0 8-8 8-12-4 0-4 8 2 12 4-2 6-6 8-10M62 44c-6 0-6 6 0 8 6 2 6 8-2 8M76 46c-6-2-8 8-2 8 6 0 6-6 8-10 0 6 2 10 6 10M104 18c-2 12-4 24-4 34M100 38c8-8 14-14 18-18M106 36c6 6 10 12 16 16M128 46c6 0 10-4 6-6-6-2-8 8-2 10 6 0 8-4 10-6M148 52c0-6 2-12 4-12 2 4 0 10 2 10 2-4 4-10 6-10 2 4 0 10 2 10M168 54c0 8-2 16-2 16M168 46c6-6 14-4 10 4-4 4-10 4-10 2M90 64c34-4 72-6 108-10',
    'James Rudd': 'M24 14c0 18 0 30-6 38-4 4-10 2-10-4M44 44c-6-2-10 8-2 10 6 0 8-8 8-12 0 6 2 10 6 10M62 54c0-6 2-12 4-12 2 4 0 10 2 10 2-4 4-10 6-10 2 4 0 10 2 10M88 46c6 0 10-4 6-6-6-2-8 8-2 10 6 0 8-4 10-6M106 44c-6 0-6 6 0 8 6 2 6 8-2 8M126 52c2-14 4-28 8-38 14 0 16 14 2 18 10 6 14 14 18 20M154 42c0 6 0 12 6 12 4-2 6-8 6-12 0 6 2 12 6 12M188 42c-6-2-8 10-2 10 6 0 6-10 8-30-2 14-2 24 0 32M206 42c-6-2-8 10-2 10 6 0 6-10 8-30-2 14-2 24 0 32M110 66c40-4 80-6 110-12',
  };
  function signature(name) {
    var d = SIGNATURES[name] || SIGNATURES['Rosa Kemp'];
    return '<svg class="sig" viewBox="0 0 250 72" role="img" aria-label="Signature of ' + esc(name) + '"><path d="' + d + '"/></svg>';
  }

  function sheetPaper(sh) {
    var job = sh.job ? S.jobs[sh.job] : null;
    var c = S.clients[sheetClient(sh)];
    var tot = A.sheetTotals(sh);
    var inv = job && job.invoiceRef ? A.findInvoice(job.invoiceRef) : null;

    var meta = [
      ['Client', esc(c.name)],
      ['Site', esc(c.addr) + ', ' + esc(c.pc)],
      ['Work date', A.fmtDate(sh.date, 'long')],
      ['Job', job ? '<a class="ref" href="#/jobs/' + job.id + '">' + job.ref + '</a>' : '—'],
      ['Crew', sh.crew.map(function (m) { return esc(S.teamById[m.id].name) + (m.lead ? ' (lead)' : S.teamById[m.id].role === 'Apprentice' ? ' (apprentice)' : ''); }).join(', ')],
      ['Sent in', esc(sh.submitted)],
    ].map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('');

    var parts = (sh.parts || []).concat(sh.fixed || []);
    var partRows = parts.length ? parts.map(function (p) {
      return '<tr><td>' + esc(p[0]) + '</td><td class="num">' + p[1] + '</td><td class="num">' + money(p[2]) + '</td><td class="num">' + money(p[1] * p[2]) + '</td></tr>';
    }).join('') : '<tr><td colspan="4" class="muted">No parts used</td></tr>';

    var labourRows = (sh.labour || []).map(function (l) {
      var t = S.teamById[l.id], h = A.labourHours(l);
      return '<tr><td>' + avatar(l.id, 'avatar--xs') + esc(t.name) + '</td><td class="num">' + l.from + '–' + l.to + '</td><td class="num hide-s">' + (l.brk ? l.brk + ' min' : '—') + '</td><td class="num">' + A.hoursText(h) + ' h</td>' +
        (sh.fixed ? '<td class="num muted hide-s">fixed price</td><td class="num">—</td>' : '<td class="num hide-s">' + money(t.rate) + '</td><td class="num">' + money(Math.round(h * t.rate)) + '</td>') + '</tr>';
    }).join('');

    var photos = sh.photos.length ? '<div class="photos">' + sh.photos.map(function (p, i) {
      return '<button class="photo" type="button" data-action="photo" data-sheet="' + sh.no + '" data-i="' + i + '"><img src="assets/img/' + p.src + '-480.webp" srcset="assets/img/' + p.src + '-480.webp 480w, assets/img/' + p.src + '-1000.webp 1000w" sizes="(max-width: 700px) 45vw, 200px" width="480" height="360" alt="' + esc(p.caption) + '" loading="lazy">' +
        '<span class="photo__tag photo__tag--' + p.label.toLowerCase() + '">' + p.label + '</span><span class="photo__cap">' + esc(p.caption) + '</span></button>';
    }).join('') + '</div>' : '<p class="muted small">' + icon('camera') + ' No photos on this one.</p>';

    var sign = sh.signoff ? '<div class="signoff">' + signature(sh.signoff.name) + '<p class="signoff__who"><b>' + esc(sh.signoff.name) + '</b> signed ' + esc(sh.signoff.at) + '</p>' +
      (sh.signoff.note ? '<p class="signoff__note">“' + esc(sh.signoff.note) + '”</p>' : '') + '</div>' : '<p class="muted small">Not signed</p>';

    var pl = sh.planned;
    var pvaRows = [
      ['Time on site', pl.mins, tot.onSite, function (v) { return A.dur(v); }],
      ['Parts', pl.parts, tot.parts + tot.fixed, money],
      ['Labour', pl.labour, tot.labour, money],
    ];
    if (!sh.fixed) pvaRows.push(['Total ex VAT', pl.parts + pl.labour, tot.net, money]);
    var pva = pvaRows.filter(function (r) { return r[1] || r[2]; }).map(function (r) {
      var diff = r[2] - r[1];
      var dtxt = diff === 0 ? 'On plan' : (diff > 0 ? '+' : '−') + r[3](Math.abs(diff));
      return '<tr' + (r[0] === 'Total ex VAT' ? ' class="is-total"' : '') + '><td>' + r[0] + '</td><td class="num muted">' + r[3](r[1]) + '</td><td class="num">' + r[3](r[2]) + '</td><td class="num pva__d' + (diff > 0 ? ' is-over' : '') + '">' + dtxt + '</td></tr>';
    }).join('');

    var approved = sh.status === 'APPROVED';
    var note = approved ? '<p class="docnote docnote--ok">' + icon('check') + '<span>Approved by ' + esc(sh.approvedBy) + ', ' + esc(sh.approvedAt.replace('Today, ', 'today at ')) + (inv ? '. Invoiced as <a class="ref" href="#/invoices/' + inv.ref + '">' + inv.ref + '</a>' : '') + '.</span></p>'
      : sh.status === 'REJECTED' ? '<p class="docnote docnote--back">' + icon('undo') + '<span><b>Sent back:</b> ' + esc(sh.rejectReason) + '</span></p>' : '';

    return '<article class="paper paper--sheet' + (approved ? ' is-approved' : '') + '" aria-labelledby="sheet-h">' +
      '<header class="doc__head"><div><p class="eyebrow">Job sheet ' + sh.no + '</p><h2 class="doc__title" id="sheet-h">' + esc(sheetTitle(sh)) + '</h2></div>' + pill(sh.status) + '</header>' +
      note +
      '<dl class="sheet__meta">' + meta + '</dl>' +
      '<section class="sheet__sec"><h3>Work done</h3><p class="prose">' + esc(sh.work) + '</p></section>' +
      '<section class="sheet__sec"><h3>Parts used <span class="h-sum">' + money(tot.parts + tot.fixed) + '</span></h3><div class="tablewrap" tabindex="0" role="region" aria-label="Parts used table"><table class="ledger"><thead><tr><th>Item</th><th class="num">Qty</th><th class="num">Each</th><th class="num">Total</th></tr></thead><tbody>' + partRows + '</tbody></table></div></section>' +
      '<section class="sheet__sec"><h3>Labour <span class="h-sum">' + money(tot.labour) + '</span></h3><div class="tablewrap" tabindex="0" role="region" aria-label="Labour table"><table class="ledger"><thead><tr><th>Who</th><th class="num">On site</th><th class="num hide-s">Break</th><th class="num">Hours</th><th class="num hide-s">Rate</th><th class="num">Total</th></tr></thead><tbody>' + labourRows + '</tbody></table></div></section>' +
      '<section class="sheet__sec"><h3>Photos</h3>' + photos + '</section>' +
      '<div class="sheet__two"><section class="sheet__sec"><h3>Customer sign-off</h3>' + sign + '</section>' +
        '<section class="sheet__sec"><h3>Planned vs actual</h3><table class="ledger pva"><thead><tr><th><span class="sr">Measure</span></th><th class="num">Planned</th><th class="num">Actual</th><th class="num">Difference</th></tr></thead><tbody>' + pva + '</tbody></table>' + (sh.plannedNote ? '<p class="pva__note">' + esc(sh.plannedNote) + '</p>' : '') + '</section></div>' +
      '</article>';
  }
  function stampDate(s) {
    if (/^Today/.test(s)) return '5 NOV';
    var m = s.match(/(\d+) (\w{3})/);
    return m ? (m[1] + ' ' + m[2]).toUpperCase() : '';
  }

  function reviewBar(sh) {
    var job = sh.job ? S.jobs[sh.job] : null, tot = A.sheetTotals(sh);
    var totals = '<p class="rbar__tot"><span>Subtotal <b>' + money(tot.net) + '</b></span><span>VAT 20% <b>' + money(tot.vat) + '</b></span><span class="rbar__grand">Total <b>' + money(tot.gross) + '</b></span></p>';
    if (sh.status === 'COMPLETED') {
      return '<div class="rbar">' + totals + '<div class="rbar__act"><button class="btn btn--line" type="button" data-action="reject" data-no="' + sh.no + '">' + icon('undo') + 'Send back</button>' +
        '<button class="btn btn--primary btn--lg" type="button" data-action="approve" data-no="' + sh.no + '">' + icon('check') + 'Approve sheet</button></div></div>';
    }
    if (sh.status === 'APPROVED' && job && job.status === 'READY_TO_INVOICE') {
      return '<div class="rbar is-done"><p class="rbar__msg">' + icon('check') + '<span><b>Approved</b> by ' + esc(sh.approvedBy) + ', ' + esc(sh.approvedAt.replace('Today, ', '')) + '. Van stock updated, job ready to invoice.</span></p>' +
        '<div class="rbar__act"><span class="rbar__amt">' + money(tot.gross) + '</span><button class="btn btn--primary btn--lg" type="button" data-action="create-invoice" data-no="' + sh.no + '">' + icon('invoices') + 'Create invoice</button></div></div>';
    }
    if (sh.status === 'APPROVED' && job && job.invoiceRef) {
      var inv = A.findInvoice(job.invoiceRef);
      return '<div class="rbar is-done"><p class="rbar__msg">' + icon('check') + '<span>Invoiced on ' + A.fmtDate(inv.issued) + ' as <span class="ref">' + inv.ref + '</span></span></p><div class="rbar__act">' + pill(A.invStatus(inv)) + '<a class="btn btn--line" href="#/invoices/' + inv.ref + '">Open invoice ' + icon('arrow') + '</a></div></div>';
    }
    if (sh.status === 'REJECTED') {
      return '<div class="rbar is-back"><p class="rbar__msg">' + icon('undo') + '<span>Waiting for ' + esc(S.teamById[sh.crew[0].id].first) + ' to fix and resend it.</span></p></div>';
    }
    return '';
  }

  A.screens.sheets = {
    title: function (no) { return no ? 'Job sheet ' + no : 'Job sheets'; },
    render: function (no) {
      var tab = S.sheetTab;
      var list = S.sheets.filter(function (s) { return tab === 'ALL' || s.status === tab; });
      var wide = window.innerWidth >= 1100;
      var sel = no ? A.findSheet(no) : (wide ? list[0] : null);
      var tabs = SHEET_TABS.map(function (t) {
        var n = t[0] === 'ALL' ? S.sheets.length : S.sheets.filter(function (s) { return s.status === t[0]; }).length;
        return '<button class="seg__b' + (t[0] === tab ? ' is-active' : '') + '" type="button" data-action="sheet-tab" data-tab="' + t[0] + '" aria-pressed="' + (t[0] === tab) + '">' + t[1] + ' <span class="seg__n">' + n + '</span></button>';
      }).join('');
      var rows = list.length ? list.map(function (s) {
        var c = S.clients[sheetClient(s)];
        return '<li><a class="srow' + (sel && sel.no === s.no ? ' is-active' : '') + '" href="#/sheets/' + s.no + '"' + (sel && sel.no === s.no ? ' aria-current="true"' : '') + '>' +
          '<span class="srow__top"><span>Sheet ' + s.no + '</span>' + pill(s.status) + '</span>' +
          '<b class="srow__title">' + esc(sheetTitle(s)) + '</b>' +
          '<span class="srow__meta">' + s.crew.map(function (m) { return avatar(m.id, 'avatar--xs'); }).join('') + '<span>' + esc(c.name) + ' · ' + A.relDay(s.date) + '</span><span class="srow__val">' + money(A.sheetTotals(s).gross) + '</span></span></a></li>';
      }).join('') : '<li class="empty">' + icon('check') + 'Nothing here.</li>';

      return '<div class="page page--sheets' + (no ? ' has-detail' : '') + '">' +
        '<header class="phead phead--tight"><div><h1>Job sheets</h1><p class="phead__sub">Engineers fill in a sheet on their phone and send it at the end of the day. Check it here, then turn it into an invoice.</p></div></header>' +
        '<div class="sheets">' +
          '<aside class="sheets__list" aria-label="Job sheets"><div class="seg" role="group" aria-label="Show">' + tabs + '</div><ul class="slist">' + rows + '</ul></aside>' +
          '<div class="sheets__detail">' + (sel ? '<a class="backlink" href="#/sheets">' + icon('back') + 'All sheets</a>' + sheetPaper(sel) + reviewBar(sel) : '<div class="emptypaper"><p>Pick a sheet to check it.</p></div>') + '</div>' +
        '</div></div>';
    },
    mount: function (no) {
      // On a wide screen the first sheet opens by itself; keep it open after it is approved.
      var act = document.querySelector('.srow.is-active');
      if (!no && act) history.replaceState(null, '', act.getAttribute('href'));
      if (S.changed.stamp) {
        var st = document.querySelector('.stamp.is-landing');
        if (st) setTimeout(function () { st.classList.remove('is-landing'); }, 1200);
        S.changed.stamp = null;
      }
    },
  };

  A.actions['sheet-tab'] = function (b) { S.sheetTab = b.getAttribute('data-tab'); A.go('#/sheets'); };

  A.actions.photo = function (b) {
    var sh = A.findSheet(b.getAttribute('data-sheet')), p = sh.photos[+b.getAttribute('data-i')];
    A.openDialog({
      title: p.label + ': ' + esc(p.caption), className: 'dlg--photo',
      body: '<img src="assets/img/' + p.src + '-1000.webp" width="1000" height="750" alt="' + esc(p.caption) + '"><p class="dlg__cap">Sheet ' + sh.no + ' · taken by ' + esc(S.teamById[sh.crew[0].id].first) + ' on ' + A.fmtDate(sh.date, 'long') + '</p>',
    });
  };

  A.actions.approve = function (b) {
    var sh = A.findSheet(b.getAttribute('data-no')), job = S.jobs[sh.job];
    sh.status = 'APPROVED';
    sh.approvedBy = D.user.name;
    sh.approvedAt = 'Today, ' + t2(A.now());
    sh.approvedToday = true;
    job.status = 'READY_TO_INVOICE';
    job.log.push({ t: t2(A.now()), text: 'Job sheet ' + sh.no + ' approved by ' + D.user.first });
    A.log(null, 'Approved sheet ' + sh.no + ' for ' + S.clients[job.client].short);
    S.changed.stamp = sh.no;
    A.refresh();
    var nextBtn = document.querySelector('[data-action="create-invoice"]');
    if (nextBtn) nextBtn.focus({ preventScroll: true });
  };

  A.actions.reject = function (b) {
    var sh = A.findSheet(b.getAttribute('data-no')), lead = S.teamById[sh.crew[0].id];
    A.openDialog({
      title: 'Send sheet ' + sh.no + ' back to ' + esc(lead.first),
      body: '<form class="form"><label class="field"><span>What needs fixing?</span><textarea name="why" rows="3" required placeholder="For example: the parts list is missing the filter"></textarea></label>' +
        '<p class="form__lead">' + esc(lead.first) + ' gets a notification and the sheet goes back to them to edit.</p>' +
        '<div class="dlg__foot"><button type="button" class="btn btn--ghost" data-close>Cancel</button><button class="btn btn--primary" type="submit">' + icon('undo') + 'Send back</button></div></form>',
      mount: function (dlg, close) {
        dlg.querySelector('form').addEventListener('submit', function (e) {
          e.preventDefault();
          sh.status = 'REJECTED';
          sh.rejectReason = e.target.why.value.trim();
          S.jobs[sh.job].status = 'SHEET_BACK';
          A.log(null, 'Sent sheet ' + sh.no + ' back to ' + lead.first);
          close();
          A.refresh();
          A.toast('Sheet ' + sh.no + ' sent back to ' + esc(lead.first) + '.');
          setTimeout(function () {
            var bl = document.querySelector('.srow.is-active') || document.querySelector('.srow');
            if (bl) bl.focus({ preventScroll: true });
          }, 260);
        });
      },
    });
  };

  A.actions['create-invoice'] = function (b) {
    var sh = A.findSheet(b.getAttribute('data-no')), job = S.jobs[sh.job];
    var lines = [];
    (sh.labour || []).forEach(function (l) {
      if (sh.fixed) return;
      var t = S.teamById[l.id];
      lines.push({ d: 'Labour: ' + t.name + (t.role === 'Apprentice' ? ' (apprentice)' : ''), q: A.labourHours(l), u: t.rate, unit: 'h' });
    });
    (sh.fixed || []).concat(sh.parts || []).forEach(function (p) { lines.push({ d: p[0], q: p[1], u: p[2] }); });
    var inv = {
      ref: A.nextRef('INV', D.TODAY), client: job.client, title: job.title, issued: D.TODAY, due: D.addDays(D.TODAY, D.company.terms),
      lines: lines, worker: job.lead, status: 'DRAFT', job: job.id, sheet: sh.no, amountPaid: 0, payments: [], workDate: sh.date, createdAt: t2(A.now()),
    };
    S.invoices.push(inv);
    job.invoiceRef = inv.ref;
    job.status = 'INVOICED';
    job.log.push({ t: t2(A.now()), text: 'Invoice ' + inv.ref + ' created' });
    A.log(null, 'Created ' + inv.ref + ' for ' + S.clients[job.client].short + ', ' + money(A.invTotals(inv).gross));
    A.go('#/invoices/' + inv.ref);
    A.toast('Draft invoice ' + inv.ref + ' created from sheet ' + sh.no + '.');
  };

  // ================================================================ Invoices
  var INV_TABS = [['ALL', 'All'], ['DRAFT', 'Draft'], ['SENT', 'Sent'], ['OVERDUE', 'Overdue'], ['PAID', 'Paid']];
  S.invTab = 'ALL';

  function invoicePaper(inv) {
    var c = S.clients[inv.client], tot = A.invTotals(inv), job = S.jobs[inv.job];
    var rows = inv.lines.map(function (l) {
      var qty = l.unit === 'h' ? A.hoursText(l.q) + ' h' : l.q;
      return '<tr><td>' + esc(l.d) + '</td><td class="num">' + qty + '</td><td class="num">' + money(l.u) + '</td><td class="num">' + money(Math.round(l.q * l.u)) + '</td></tr>';
    }).join('');
    var paid = inv.status === 'PAID';
    return '<article class="paper paper--invoice" aria-labelledby="inv-h">' +
      '<header class="inv__head"><div class="inv__from"><div><b>' + esc(D.company.name) + '</b><span>' + D.company.address.join(', ') + '</span><span>' + D.company.phone + ' · ' + D.company.email + '</span><span>VAT reg. no. ' + D.company.vat + '</span></div></div>' +
        '<div class="inv__title"><h2 id="inv-h">Invoice</h2><p class="ref">' + inv.ref + '</p>' + (paid ? '<p class="inv__paid">' + pill('PAID', 'Paid ' + A.fmtDate(inv.paid)) + '</p>' : '') + '</div></header>' +
      '<dl class="inv__meta"><div><dt>Bill to</dt><dd><b>' + esc(c.name) + '</b><br>' + esc(c.addr) + '<br>' + esc(c.pc) + '</dd></div>' +
        '<div><dt>Issued</dt><dd>' + A.fmtDate(inv.issued, 'long') + '</dd><dt>Due</dt><dd>' + A.fmtDate(inv.due, 'long') + '</dd></div>' +
        '<div><dt>For</dt><dd>' + esc(inv.title) + (inv.workDate ? ', ' + A.fmtDate(inv.workDate, 'long') : '') + '</dd><dt>Job</dt><dd class="ref">' + (job ? job.ref : '') + '</dd></div></dl>' +
      '<div class="tablewrap" tabindex="0" role="region" aria-label="Invoice lines"><table class="ledger ledger--inv"><thead><tr><th>Description</th><th class="num">Qty</th><th class="num">Unit price</th><th class="num">Amount</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="inv__foot"><p class="inv__pay">Pay by bank transfer using the link in your email, or call the office on ' + D.company.phone + '. Payment due within ' + D.company.terms + ' days. Thank you for having us.</p>' +
        '<dl class="inv__tot"><div><dt>Subtotal</dt><dd>' + money(tot.net) + '</dd></div><div><dt>VAT at 20%</dt><dd>' + money(tot.vat) + '</dd></div><div class="is-grand"><dt>Total</dt><dd>' + money(tot.gross) + '</dd></div>' +
        (inv.amountPaid ? '<div><dt>Paid</dt><dd>−' + money(inv.amountPaid) + '</dd></div><div class="is-bal"><dt>Balance due</dt><dd>' + money(tot.gross - inv.amountPaid) + '</dd></div>' : '') + '</dl></div>' +
      '</article>';
  }

  function invSteps(inv) {
    var st = inv.status;
    var steps = [
      ['Draft', 'Created ' + (inv.issued === D.TODAY ? 'today' + (inv.createdAt ? ', ' + inv.createdAt : '') : A.fmtDate(inv.issued)), true],
      ['Sent', inv.sent ? 'Emailed ' + (inv.sent === D.TODAY ? 'today' + (inv.sentAt ? ', ' + inv.sentAt : '') : A.fmtDate(inv.sent)) + ' to ' + esc(S.clients[inv.client].email) : 'Not sent yet', st !== 'DRAFT'],
      ['Paid', inv.paid ? money(inv.amountPaid) + ' by ' + (inv.method || '').toLowerCase() + ', ' + (inv.paid === D.TODAY ? 'today' : A.fmtDate(inv.paid)) : st === 'PARTIAL' ? money(inv.amountPaid) + ' received so far' : 'Due ' + A.fmtDate(inv.due, 'long'), st === 'PAID'],
    ];
    return '<ol class="steps">' + steps.map(function (s, i) {
      var cur = !s[2] && (i === 0 || steps[i - 1][2]);
      return '<li class="step' + (s[2] ? ' is-done' : '') + (cur ? ' is-current' : '') + '"><span class="step__dot">' + (s[2] ? icon('check') : i + 1) + '</span><span><b>' + s[0] + '</b><small>' + s[1] + '</small></span></li>';
    }).join('') + '</ol>';
  }

  function invActions(inv) {
    var st = A.invStatus(inv);
    if (inv.status === 'DRAFT') return '<button class="btn btn--primary btn--block btn--lg" type="button" data-action="send" data-ref="' + inv.ref + '">' + icon('send') + 'Send to ' + esc(S.clients[inv.client].contact.split(' ')[0]) + '</button>';
    if (inv.status === 'SENT' || inv.status === 'PARTIAL') return '<button class="btn btn--primary btn--block btn--lg" type="button" data-action="record-payment" data-ref="' + inv.ref + '">' + icon('pound') + 'Record payment</button>' +
      '<button class="btn btn--line btn--block" type="button" data-action="chase" data-ref="' + inv.ref + '"' + (inv.chasedToday ? ' disabled' : '') + '>' + icon('mail') + (inv.chasedToday ? 'Reminder sent' : st === 'OVERDUE' ? 'Send a reminder' : 'Resend') + '</button>';
    return '<p class="paidnote" tabindex="-1">' + icon('check') + 'Paid in full. Nothing more to do.</p>';
  }

  A.screens.invoices = {
    title: function (ref) { return ref ? ref : 'Invoices'; },
    render: function (ref) {
      if (ref) {
        var inv = A.findInvoice(ref);
        if (!inv) return '<div class="page"><p class="empty">That invoice doesn’t exist. <a href="#/invoices">Back to invoices</a></p></div>';
        var c = S.clients[inv.client], job = S.jobs[inv.job];
        return '<div class="page page--invoice"><header class="phead phead--tight"><div><a class="backlink backlink--top" href="#/invoices">' + icon('back') + 'Invoices</a><p class="eyebrow">' + inv.ref + '</p><h1>' + esc(c.name) + '</h1></div>' +
          '<div class="phead__status">' + pill(A.invStatus(inv)) + '<span class="phead__amt">' + money(A.invTotals(inv).gross) + '</span></div></header>' +
          '<div class="invgrid"><div class="invdoc">' + invoicePaper(inv) + '</div>' +
          '<aside class="rail" aria-label="Invoice actions"><section class="panel"><h2 class="rail__h">Where it’s up to</h2>' + invSteps(inv) + '<div class="rail__act">' + invActions(inv) + '</div></section>' +
            '<section class="panel"><h2 class="rail__h">Customer</h2><p class="rail__p"><b>' + esc(c.contact) + '</b><br>' + esc(c.addr) + ', ' + esc(c.pc) + '</p><p class="rail__p"><a href="tel:' + c.phone.replace(/\s/g, '') + '">' + icon('phone') + c.phone + '</a><br><a href="mailto:' + c.email + '">' + icon('mail') + esc(c.email) + '</a></p></section>' +
            '<section class="panel"><h2 class="rail__h">Linked</h2><p class="rail__p"><a href="#/jobs/' + job.id + '">' + icon('jobs') + '<span class="ref">' + job.ref + '</span></a>' + (inv.sheet ? '<br><a href="#/sheets/' + inv.sheet + '">' + icon('sheets') + 'Job sheet ' + inv.sheet + '</a>' : '') + '</p>' +
              '<button class="btn btn--ghost btn--sm" type="button" data-action="print">' + icon('print') + 'Print or save as PDF</button></section></aside></div></div>';
      }
      var tab = S.invTab;
      var all = S.invoices.slice().sort(function (a, b) { return a.issued === b.issued ? (a.ref < b.ref ? 1 : -1) : a.issued < b.issued ? 1 : -1; });
      var inTab = function (v, tb) { var st = A.invStatus(v); return tb === 'ALL' || st === tb || (tb === 'SENT' && st === 'PARTIAL'); };
      var list = all.filter(function (v) { return inTab(v, tab); });
      var tabs = INV_TABS.map(function (t) {
        var n = all.filter(function (v) { return inTab(v, t[0]); }).length;
        return '<button class="seg__b' + (t[0] === tab ? ' is-active' : '') + '" type="button" data-action="inv-tab" data-tab="' + t[0] + '" aria-pressed="' + (t[0] === tab) + '">' + t[1] + ' <span class="seg__n">' + n + '</span></button>';
      }).join('');
      var k = A.kpis();
      var rows = list.map(function (v) {
        var s = A.invStatus(v);
        return '<tr class="' + (s === 'OVERDUE' ? 'is-late' : '') + '"><td class="hide-s"><a class="ref rowlink" href="#/invoices/' + v.ref + '">' + v.ref + '</a></td><td><a class="cell-link" href="#/invoices/' + v.ref + '"><span class="cell-title">' + esc(A.clientName(v.client)) + '</span><small class="show-s ref">' + v.ref + '</small></a></td><td class="hide-s">' + esc(v.title) + '</td><td class="num hide-s">' + A.fmtDate(v.issued) + '</td><td class="num hide-s">' + A.fmtDate(v.due) + '</td><td class="num"><b>' + money(A.invTotals(v).gross) + '</b></td><td>' + pill(s) + '</td></tr>';
      }).join('');
      var cards = list.map(function (v) {
        var st = A.invStatus(v);
        return '<li><a class="icard' + (st === 'OVERDUE' ? ' is-late' : '') + '" href="#/invoices/' + v.ref + '"><span class="icard__top"><b>' + esc(A.clientName(v.client)) + '</b><b class="icard__amt">' + money(A.invTotals(v).gross) + '</b></span>' +
          '<span class="icard__mid">' + esc(v.title) + '</span><span class="icard__bot"><span class="ref">' + v.ref + '</span>' + pill(st) + '</span>' +
          '<span class="icard__due">' + (st === 'PAID' ? 'Paid ' + A.fmtDate(v.paid) : 'Due ' + A.fmtDate(v.due)) + (v.status === 'PARTIAL' ? ' · ' + money(A.outstanding(v)) + ' left to pay' : '') + '</span></a></li>';
      }).join('');
      return '<div class="page page--list"><header class="phead phead--tight"><div><h1>Invoices</h1></div>' +
        '<dl class="minifigs"><div><dt>Waiting to be paid</dt><dd>' + money(k.waiting) + '</dd></div><div class="is-warn"><dt>Overdue</dt><dd>' + money(k.overdue) + '</dd></div><div><dt>Paid in November</dt><dd>' + money(k.paidNov) + '</dd></div></dl></header>' +
        '<div class="seg" role="group" aria-label="Show">' + tabs + '</div>' +
        '<div class="panel panel--table"><div class="tablewrap" tabindex="0" role="region" aria-label="Invoices"><table class="table"><thead><tr><th class="hide-s">Invoice</th><th>Client</th><th class="hide-s">For</th><th class="num hide-s">Issued</th><th class="num hide-s">Due</th><th class="num">Total</th><th>Status</th></tr></thead><tbody>' + (rows || '<tr><td colspan="7" class="empty">No invoices here.</td></tr>') + '</tbody></table></div></div>' +
        '<ul class="icards">' + (cards || '<li class="empty">No invoices here.</li>') + '</ul></div>';
    },
    mount: function () {
      if (S.changed.stampInv) {
        var st = document.querySelector('.stamp.is-landing');
        if (st) setTimeout(function () { st.classList.remove('is-landing'); }, 1200);
        S.changed.stampInv = null;
      }
    },
  };
  A.actions['inv-tab'] = function (b) { S.invTab = b.getAttribute('data-tab'); A.refresh(); };
  A.actions.print = function () { window.print(); };

  A.actions.send = function (b) {
    var inv = A.findInvoice(b.getAttribute('data-ref')), c = S.clients[inv.client];
    inv.status = 'SENT';
    inv.sent = D.TODAY;
    inv.sentAt = t2(A.now());
    A.log(null, 'Emailed ' + inv.ref + ' to ' + c.contact);
    A.refresh();
    A.toast('Emailed to ' + esc(c.email) + ' with a link to pay by bank transfer.');
    var nb = document.querySelector('[data-action="record-payment"]');
    if (nb) nb.focus({ preventScroll: true });
  };

  A.actions['record-payment'] = function (b) {
    var inv = A.findInvoice(b.getAttribute('data-ref')), due = A.outstanding(inv);
    var methods = ['Bank transfer', 'Card', 'Cash', 'Other'];
    A.openDialog({
      title: 'Record a payment',
      body: '<form class="form" id="pay-form"><p class="form__lead"><span class="ref">' + inv.ref + '</span> · ' + esc(A.clientName(inv.client)) + ' · ' + money(due) + ' to pay</p>' +
        '<div class="field-row"><label class="field"><span>Amount received</span><span class="money-in"><span aria-hidden="true">£</span><input name="amount" inputmode="decimal" value="' + (due / 100).toFixed(2) + '" required></span></label>' +
        '<label class="field"><span>Received</span><select name="date">' + [0, 1, 2, 3].map(function (n) { return D.addDays(D.TODAY, -n); }).filter(function (d) { return d >= inv.issued; }).map(function (d, i) { return '<option value="' + d + '">' + (i === 0 ? 'Today, ' + A.fmtDate(d) : A.relDay(d) + (A.relDay(d) === 'Yesterday' ? ', ' + A.fmtDate(d) : '')) + '</option>'; }).join('') + '</select></label></div>' +
        '<fieldset class="field"><legend>How they paid</legend><div class="radios">' + methods.map(function (m, i) { return '<label class="radio"><input type="radio" name="method" value="' + m + '"' + (i === 0 ? ' checked' : '') + '><span>' + m + '</span></label>'; }).join('') + '</div></fieldset>' +
        '<p class="form__check is-free" aria-live="polite">' + icon('check') + 'That clears the invoice and closes the job.</p>' +
        '<div class="dlg__foot"><button type="button" class="btn btn--ghost" data-close>Cancel</button><button class="btn btn--primary" type="submit" id="pay-confirm">' + icon('check') + 'Record ' + money(due) + '</button></div></form>',
      mount: function (dlg, close) {
        var f = dlg.querySelector('form'), out = dlg.querySelector('.form__check'), btn = dlg.querySelector('#pay-confirm');
        function amt() { var v = Math.round(parseFloat(String(f.amount.value).replace(/[£,\s]/g, '')) * 100); return isFinite(v) ? v : 0; }
        f.amount.addEventListener('input', function () {
          var v = amt();
          btn.innerHTML = icon('check') + 'Record ' + money(v);
          btn.disabled = v <= 0;
          out.className = 'form__check ' + (v >= due ? 'is-free' : 'is-clash');
          out.innerHTML = v >= due ? icon('check') + 'That clears the invoice and closes the job.' : v > 0 ? icon('alert') + 'Part payment: ' + money(due - v) + ' will still be owed.' : icon('alert') + 'Enter the amount you received.';
        });
        f.addEventListener('submit', function (e) {
          e.preventDefault();
          var v = Math.min(amt(), due);
          if (v <= 0) return;
          var when = f.date.value || D.TODAY;
          if (when < inv.issued) { out.className = 'form__check is-clash'; out.innerHTML = icon('alert') + 'A payment can’t be dated before the invoice (' + A.fmtDate(inv.issued) + ').'; return; }
          A.recordPayment(inv, v, f.method.value, when);
          close();
          A.refresh();
          A.toast(inv.status === 'PAID' ? money(v) + ' recorded. ' + inv.ref + ' is paid and the job is closed.' : money(v) + ' recorded. ' + money(A.outstanding(inv)) + ' still to come.');
          setTimeout(function () {
            var pn = document.querySelector('.paidnote') || document.querySelector('[data-action="record-payment"]');
            if (pn) pn.focus({ preventScroll: true });
          }, 260);
        });
      },
    });
  };

  // One way to take a payment, used by the dialog and by the pay link in the invoice email.
  A.recordPayment = function (inv, v, method, when) {
          S.changed.paidFrom = A.kpis().paidNov;
          inv.payments.push({ date: when, amount: v, method: method, at: t2(A.now()) });
          inv.amountPaid += v;
          inv.method = method;
          var job = S.jobs[inv.job];
          if (inv.amountPaid >= A.invTotals(inv).gross) {
            inv.status = 'PAID';
            inv.paid = when;
            if (job) { job.status = 'PAID'; job.log.push({ t: t2(A.now()), text: 'Paid in full by ' + inv.method.toLowerCase() }); }
            S.changed.stampInv = inv.ref;
          } else {
            inv.status = 'PARTIAL';
            inv.paid = null;
          }
          A.log(null, A.clientName(inv.client) + ' paid ' + money(v) + ' by ' + method.toLowerCase(), 'money');
  };

  // The customer pays from the link in the invoice email (the tour uses this; nobody clicks it in the office).
  A.payByLink = function (ref) {
    var inv = A.findInvoice(ref);
    if (!inv || inv.status === 'PAID') return;
    var v = A.outstanding(inv);
    A.recordPayment(inv, v, 'Bank transfer', D.TODAY);
    A.refresh();
    A.toast(esc(S.clients[inv.client].contact) + ' paid ' + money(v) + ' from the link in the email. ' + inv.ref + ' is paid.');
  };

  // ================================================================ Jobs
  var JOB_TABS_OLD = [['ACTIVE', 'Open'], ['PENDING', 'To schedule'], ['SCHEDULED', 'Booked'], ['IN_PROGRESS', 'On site'], ['COMPLETED', 'Sheet to check'], ['SHEET_BACK', 'Sheet sent back'], ['READY_TO_INVOICE', 'Ready to invoice'], ['INVOICED', 'Invoiced'], ['PAID', 'Paid']];
  var ORDER = ['PENDING', 'IN_PROGRESS', 'SCHEDULED', 'SHEET_BACK', 'COMPLETED', 'READY_TO_INVOICE', 'INVOICED', 'PAID'];
  // Five tabs, each a group of statuses; empty ones are hidden.
  var JOB_TABS = [
    ['ACTIVE', 'Open', ['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'SHEET_BACK', 'READY_TO_INVOICE']],
    ['PENDING', 'Unscheduled', ['PENDING']],
    ['SCHEDULED', 'Booked', ['SCHEDULED', 'IN_PROGRESS']],
    ['TO_INVOICE', 'To invoice', ['COMPLETED', 'SHEET_BACK', 'READY_TO_INVOICE']],
    ['DONE', 'Invoiced', ['INVOICED', 'PAID']],
  ];
  S.jobTab = 'ACTIVE';

  function jobPill(job) {
    if (job.status === 'COMPLETED' && !job.sheetNo) return pill('COMPLETED', 'Done, sheet tonight');
    if (job.status === 'SHEET_BACK') return pill('SHEET_BACK');
    return pill(job.status);
  }

  function jobWhen(job) {
    var es = S.entries.filter(function (e) { return e.job === job.id && !e.pending; }).sort(function (a, b) { return a.day === b.day ? a.start - b.start : a.day < b.day ? -1 : 1; });
    if (!es.length) return job.done ? A.fmtDate(job.done) : '<span class="muted">Not booked</span>';
    var up = es.filter(function (e) { return e.day >= D.TODAY; })[0] || es[es.length - 1];
    var rel = A.relDay(up.day);
    return '<span class="when' + (up.day === D.TODAY ? ' is-today' : '') + '">' + rel + '</span> ' + t2(up.start);
  }

  A.screens.jobs = {
    title: function (id) { return id && S.jobs[id] ? S.jobs[id].ref : 'Jobs'; },
    render: function (id) {
      if (id) return jobPage(S.jobs[id]);
      var all = Object.keys(S.jobs).map(function (k) { return S.jobs[k]; });
      var active = function (j) { return ['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'SHEET_BACK', 'READY_TO_INVOICE'].indexOf(j.status) >= 0; };
      var tab = S.jobTab;
      var inTab = function (j, id) { var t = JOB_TABS.filter(function (x) { return x[0] === id; })[0]; return t[2].indexOf(j.status) >= 0; };
      var list = all.filter(function (j) { return inTab(j, tab); })
        .sort(function (a, b) { var d = ORDER.indexOf(a.status) - ORDER.indexOf(b.status); return d || (a.ref < b.ref ? 1 : -1); });
      var tabs = JOB_TABS.map(function (t) {
        var n = all.filter(function (j) { return inTab(j, t[0]); }).length;
        if (!n && t[0] !== tab) return '';
        return '<button class="seg__b' + (t[0] === tab ? ' is-active' : '') + '" type="button" data-action="job-tab" data-tab="' + t[0] + '" aria-pressed="' + (t[0] === tab) + '">' + t[1] + ' <span class="seg__n">' + n + '</span></button>';
      }).join('');
      var rows = list.map(function (j) {
        return '<tr><td class="hide-s"><a class="ref rowlink" href="#/jobs/' + j.id + '">' + j.ref + '</a></td><td><a class="cell-link" href="#/jobs/' + j.id + '"><b class="cell-title">' + (j.urgent ? '<span class="blk__urgent">Urgent</span> ' : '') + esc(j.title) + '</b><small class="show-s">' + esc(A.clientName(j.client)) + ' · <span class="ref">' + j.ref + '</span></small></a></td><td class="hide-s">' + esc(A.clientName(j.client)) + '</td><td>' + jobPill(j) + '</td>' +
          '<td class="hide-s"><span class="avs">' + j.crew.map(function (p) { return avatar(p, 'avatar--xs'); }).join('') + '</span></td><td class="num hide-s">' + jobWhen(j) + '</td><td class="num hide-s">' + (A.jobValue(j) ? money(A.jobValue(j)) : '<span class="muted">—</span>') + '</td></tr>';
      }).join('');
      return '<div class="page page--list"><header class="phead phead--tight"><div><p class="eyebrow">' + all.filter(active).length + ' open</p><h1>Jobs</h1></div><div class="phead__actions"><button class="btn btn--primary" type="button" data-action="new-job">' + icon('plus') + 'New job</button></div></header>' +
        '<div class="seg seg--scroll" role="group" aria-label="Show">' + tabs + '</div>' +
        '<div class="panel panel--table"><div class="tablewrap" tabindex="0" role="region" aria-label="Jobs"><table class="table"><thead><tr><th class="hide-s">Ref</th><th>Job</th><th class="hide-s">Client</th><th>Status</th><th class="hide-s">Team</th><th class="num hide-s">When</th><th class="num hide-s">Value inc VAT</th></tr></thead><tbody>' + (rows || '<tr><td colspan="7" class="empty">No jobs here.</td></tr>') + '</tbody></table></div></div></div>';
    },
  };
  A.actions['job-tab'] = function (b) { S.jobTab = b.getAttribute('data-tab'); A.refresh(); };

  function jobPage(job) {
    if (!job) return '<div class="page"><p class="empty">That job doesn’t exist. <a href="#/jobs">Back to jobs</a></p></div>';
    var c = S.clients[job.client];
    var track = [['PENDING', 'Booked in'], ['SCHEDULED', 'Scheduled'], ['IN_PROGRESS', 'On site'], ['COMPLETED', 'Sheet in'], ['READY_TO_INVOICE', 'Checked'], ['INVOICED', 'Invoiced'], ['PAID', 'Paid']];
    var at = ORDER.indexOf(job.status), idx = ['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'READY_TO_INVOICE', 'INVOICED', 'PAID'].indexOf(job.status === 'SHEET_BACK' ? 'COMPLETED' : job.status);
    var steps = track.map(function (s, i) { return '<li class="jt' + (i < idx ? ' is-done' : i === idx ? ' is-current' : '') + '"><span>' + s[1] + '</span></li>'; }).join('');
    var visits = S.entries.filter(function (e) { return e.job === job.id && !e.pending; }).sort(function (a, b) { return a.day === b.day ? a.start - b.start : a.day < b.day ? -1 : 1; });
    var vRows = visits.length ? visits.map(function (e) {
      var st = A.entryState(e);
      return '<li class="visit is-' + st + '">' + avatar(e.person, 'avatar--sm') + '<span><b>' + A.relDay(e.day) + ', ' + A.range(e.start, e.end) + '</b><small>' + esc(S.teamById[e.person].name) + ' · ' + A.STATE_LABEL[st] + '</small></span>' +
        (st === 'booked' && !job.days && job.crew.length < 2 ? '<button class="btn btn--sm btn--line visit__move" type="button" data-action="move" data-entry="' + e.id + '">Move</button>' : '') + '</li>';
    }).join('') : '<li class="empty">Not on the schedule yet. <a href="#/schedule">Open the schedule</a></li>';
    var sh = job.sheetNo ? A.findSheet(job.sheetNo) : null;
    var inv = job.invoiceRef ? A.findInvoice(job.invoiceRef) : null;
    var logRows = (job.log || []).slice().reverse().map(function (l) { return '<li><span class="feed__t">' + l.t + '</span><span>' + esc(l.text) + '</span></li>'; }).join('');
    return '<div class="page page--job"><header class="phead phead--tight"><div><a class="backlink backlink--top" href="#/jobs">' + icon('back') + 'Jobs</a><p class="eyebrow ref">' + job.ref + '</p><h1>' + esc(job.title) + '</h1>' +
      '<p class="phead__sub">' + esc(c.name) + ' · ' + esc(c.area) + (job.gas ? ' · ' + icon('flame', 'i--gas') + 'Gas Safe job' : '') + '</p></div><div class="phead__status">' + jobPill(job) + (A.jobValue(job) ? '<span class="phead__amt">' + money(A.jobValue(job)) + '</span>' : '') + '</div></header>' +
      '<ol class="jtrack" aria-label="Progress" tabindex="0">' + steps + '</ol>' +
      '<div class="jobgrid"><div class="jobgrid__main">' +
        (job.note ? '<section class="panel"><h2 class="rail__h">From the office</h2><p class="rail__p">' + esc(job.note) + '</p></section>' : '') +
        '<section class="panel"><h2 class="rail__h">Visits</h2><ul class="visits">' + vRows + '</ul></section>' +
        '<section class="panel"><h2 class="rail__h">Paperwork</h2><ul class="paperlist">' +
          (sh ? '<li><a href="#/sheets/' + sh.no + '">' + icon('sheets') + '<span>Job sheet ' + sh.no + '</span>' + pill(sh.status) + '</a></li>' : '<li class="muted">' + icon('sheets') + 'No job sheet yet</li>') +
          (inv ? '<li><a href="#/invoices/' + inv.ref + '">' + icon('invoices') + '<span class="ref">' + inv.ref + '</span>' + pill(A.invStatus(inv)) + '</a></li>' : '<li class="muted">' + icon('invoices') + 'Not invoiced yet</li>') + '</ul></section>' +
        (logRows ? '<section class="panel"><h2 class="rail__h">Today</h2><ul class="joblog">' + logRows + '</ul></section>' : '') +
      '</div><aside class="jobgrid__side" aria-label="Site and team">' +
        '<section class="panel"><h2 class="rail__h">Site</h2><p class="rail__p">' + icon('pin') + esc(c.addr) + ', ' + esc(c.pc) + '</p><p class="rail__p"><b>' + esc(c.contact) + '</b><br><a href="tel:' + c.phone.replace(/\s/g, '') + '">' + icon('phone') + c.phone + '</a><br><a href="mailto:' + c.email + '">' + icon('mail') + esc(c.email) + '</a></p></section>' +
        '<section class="panel"><h2 class="rail__h">Team</h2><ul class="teamlist">' + (job.crew.length ? job.crew.map(function (p) { var t = S.teamById[p]; return '<li>' + avatar(p) + '<span><b>' + esc(t.name) + '</b><small>' + (p === job.lead ? 'Lead' : 'Crew') + ' · ' + esc(t.role) + '</small></span></li>'; }).join('') : '<li class="muted">Nobody yet</li>') + '</ul></section>' +
      '</aside></div></div>';
  }

  // ================================================================ Quotes
  A.screens.quotes = {
    title: 'Quotes',
    render: function () {
      var rows = S.quotes.map(function (q) {
        return '<tr><td class="ref">' + q.ref + '</td><td><b class="cell-title">' + esc(q.title) + '</b></td><td class="hide-s">' + esc(A.clientName(q.client)) + '</td><td class="num hide-s">' + A.fmtDate(q.date) + '</td><td class="num">' + (q.net ? money(Math.round(q.net * 1.2)) : '<span class="muted">Visit first</span>') + '</td><td>' + pill(q.status) + '</td></tr>';
      }).join('');
      var open = S.quotes.filter(function (q) { return ['SENT', 'VIEWED'].indexOf(q.status) >= 0; });
      return '<div class="page page--list"><header class="phead phead--tight"><div><p class="eyebrow">' + open.length + ' with customers</p><h1>Quotes</h1></div>' +
        '<dl class="minifigs"><div><dt>Out with customers</dt><dd>' + money(open.reduce(function (a, q) { return a + Math.round(q.net * 1.2); }, 0)) + '</dd></div><div><dt>Accepted in October</dt><dd>4</dd></div></dl></header>' +
        '<div class="panel panel--table"><div class="tablewrap" tabindex="0" role="region" aria-label="Quotes"><table class="table"><thead><tr><th>Ref</th><th>Quote for</th><th class="hide-s">Client</th><th class="num hide-s">Date</th><th class="num">Value inc VAT</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table></div></div></div>';
    },
  };

  // ================================================================ Clients
  A.screens.clients = {
    title: 'Clients',
    render: function () {
      var rows = D.clients.slice().sort(function (a, b) { return a.name < b.name ? -1 : 1; }).map(function (c) {
        var jobs = Object.keys(S.jobs).filter(function (k) { return S.jobs[k].client === c.id; }).length;
        var owed = S.invoices.filter(function (v) { return v.client === c.id && (v.status === 'SENT' || v.status === 'PARTIAL'); }).reduce(function (a, v) { return a + A.outstanding(v); }, 0);
        return '<tr><td><b class="cell-title">' + esc(c.name) + '</b>' + (c.company ? '<small class="muted"> · business</small>' : '') + '</td><td class="hide-s">' + esc(c.area) + ' ' + esc(c.pc) + '</td><td class="hide-s"><a href="tel:' + c.phone.replace(/\s/g, '') + '">' + c.phone + '</a></td><td class="num">' + jobs + '</td><td class="num">' + (owed ? '<b>' + money(owed) + '</b>' : '<span class="muted">—</span>') + '</td></tr>';
      }).join('');
      return '<div class="page page--list"><header class="phead phead--tight"><div><p class="eyebrow">' + D.clients.length + ' clients</p><h1>Clients</h1></div></header>' +
        '<div class="panel panel--table"><div class="tablewrap" tabindex="0" role="region" aria-label="Clients"><table class="table"><thead><tr><th>Name</th><th class="hide-s">Area</th><th class="hide-s">Phone</th><th class="num">Jobs</th><th class="num">Owed</th></tr></thead><tbody>' + rows + '</tbody></table></div></div></div>';
    },
  };

  // ================================================================ Reports
  S.reportDays = 30;
  A.screens.reports = {
    title: 'Reports',
    render: function () {
      var days = S.reportDays, from = days === 7 ? '2026-11-02' : '2026-10-12';
      var paid = [];
      S.invoices.forEach(function (v) { v.payments.forEach(function (p) { if (p.date >= from && p.date <= D.TODAY) paid.push({ paid: p.date, amountPaid: p.amount, method: p.method }); }); });
      var issued = S.invoices.filter(function (v) { return v.issued >= from; });
      var cash = paid.reduce(function (a, v) { return a + v.amountPaid; }, 0);
      var issuedVal = issued.reduce(function (a, v) { return a + A.invTotals(v).gross; }, 0);
      var avg = issued.length ? Math.round(issuedVal / issued.length) : 0;
      var hours = 0;
      issued.forEach(function (v) { v.lines.forEach(function (l) { if (/^Labour/.test(l.d)) hours += l.q; }); });

      var wk;
      if (days === 7) {
        wk = ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06'].map(function (d) { return { w: d, v: paid.filter(function (v) { return v.paid === d; }).reduce(function (a, v) { return a + v.amountPaid; }, 0), day: true }; });
      } else {
        wk = ['2026-10-12', '2026-10-19', '2026-10-26', '2026-11-02'].map(function (w) { var end = D.addDays(w, 6); return { w: w, v: paid.filter(function (v) { return v.paid >= w && v.paid <= end; }).reduce(function (a, v) { return a + v.amountPaid; }, 0) }; });
      }
      var max = Math.max.apply(null, wk.map(function (x) { return x.v; }).concat([1]));
      var nice = Math.ceil(max / 100000) * 100000;
      var gridl = [1, 0.5].map(function (f) { return '<span class="colchart__g" style="bottom:' + (f * 100) + '%"><em>' + money(f * nice, { round: true }) + '</em></span>'; }).join('');
      var cols = wk.map(function (x, i) {
        return '<div class="colchart__c' + ((x.day ? x.w === D.TODAY : i === wk.length - 1) ? ' is-now' : '') + (x.day && x.w > D.TODAY ? ' is-future' : '') + '"><div class="colchart__plot"><span class="colchart__bar" style="height:' + (x.v / nice * 100).toFixed(2) + '%"><em>' + money(x.v, { round: true }).replace(/\.\d\d$/, '') + '</em></span></div>' +
          '<span class="colchart__l">' + (x.day ? A.fmtDate(x.w, 'wd').slice(0, 3) : 'w/c ' + A.fmtDate(x.w)) + '</span></div>';
      }).join('');

      function hbars(map, fmt) {
        var arr = Object.keys(map).map(function (k) { return [k, map[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
        var m = Math.max.apply(null, arr.map(function (a) { return a[1]; }).concat([1]));
        return '<ul class="hbars">' + arr.map(function (a) { return '<li><span class="hbars__k">' + a[0] + '</span><span class="hbars__bar"><i style="width:' + (a[1] / m * 100) + '%"></i></span><span class="hbars__v">' + fmt(a[1]) + '</span></li>'; }).join('') + '</ul>';
      }
      var byMethod = {}; paid.forEach(function (v) { byMethod[v.method] = (byMethod[v.method] || 0) + v.amountPaid; });
      var byWho = {}; issued.forEach(function (v) { var n = S.teamById[v.worker] ? S.teamById[v.worker].name : 'Other'; byWho[n] = (byWho[n] || 0) + A.invTotals(v).gross; });
      var byClient = {}; issued.forEach(function (v) { var n = A.clientName(v.client); byClient[n] = (byClient[n] || 0) + A.invTotals(v).gross; });
      var topClients = {}; Object.keys(byClient).sort(function (a, b) { return byClient[b] - byClient[a]; }).slice(0, 5).forEach(function (k) { topClients[k] = byClient[k]; });

      return '<div class="page page--reports"><header class="phead phead--tight"><div><p class="eyebrow">' + A.fmtDate(from) + ' to ' + A.fmtDate(D.TODAY) + '</p><h1>Reports</h1></div>' +
        '<div class="seg" role="group" aria-label="Period"><button class="seg__b' + (days === 7 ? ' is-active' : '') + '" type="button" data-action="rep-days" data-days="7" aria-pressed="' + (days === 7) + '">This week</button><button class="seg__b' + (days === 30 ? ' is-active' : '') + '" type="button" data-action="rep-days" data-days="30" aria-pressed="' + (days === 30) + '">Last 4 weeks</button></div></header>' +
        '<section class="figures figures--4" aria-label="Summary">' +
          '<div class="fig"><p class="fig__label">Cash received</p><p class="fig__value">' + money(cash) + '</p><p class="fig__foot">' + paid.length + ' payments</p></div>' +
          '<div class="fig"><p class="fig__label">Invoiced</p><p class="fig__value">' + money(issuedVal) + '</p><p class="fig__foot">' + issued.length + ' invoices</p></div>' +
          '<div class="fig"><p class="fig__label">Average invoice</p><p class="fig__value">' + money(avg) + '</p><p class="fig__foot">Including VAT</p></div>' +
          '<div class="fig"><p class="fig__label">Labour charged</p><p class="fig__value">' + A.hoursText(hours) + '<small> h</small></p><p class="fig__foot">Hourly work only</p></div></section>' +
        '<div class="repgrid"><section class="panel panel--chart"><header class="panel__head"><h2>Cash received by ' + (days === 7 ? 'day' : 'week') + '</h2></header><div class="colchart" role="img" aria-label="Cash received by ' + (days === 7 ? 'day' : 'week') + ', highest ' + money(max) + '"><div class="colchart__grid" aria-hidden="true">' + gridl + '</div>' + cols + '</div></section>' +
          '<section class="panel"><header class="panel__head"><h2>How people paid</h2></header>' + hbars(byMethod, money) + '</section>' +
          '<section class="panel"><header class="panel__head"><h2>Invoiced by engineer</h2></header>' + hbars(byWho, money) + '</section>' +
          '<section class="panel"><header class="panel__head"><h2>Top clients</h2></header>' + hbars(topClients, money) + '</section></div></div>';
    },
  };
  A.actions['rep-days'] = function (b) { S.reportDays = +b.getAttribute('data-days'); A.refresh(); };

  A.start();
})();
