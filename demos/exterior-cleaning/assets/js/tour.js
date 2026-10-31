/* Hollis & Daughter: the scripted tour (about 40 s at 1920×1080).
   “Today” is pinned to Monday 9 November, 10:15 in tour mode (see app.js and data.js).
   Settled hero → drag the squeegee across a driveway, then a render front (poster) →
   a guide price for windows, gutters and render on a 3-bed semi in BS4, every 4 weeks →
   book a free visit on the Wednesday round → booked, with the ticket stamped. */
HiconTour.ready(async function () {
  var imgs = [document.querySelector('.hero-photo img')].concat([].slice.call(document.querySelectorAll('.ba-img')));
  await Promise.all(imgs.map(function (img) {
    if (!img) return null;
    img.loading = 'eager';
    if (img.complete) return null;
    return new Promise(function (r) { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); });
  }));
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
});

HiconTour.define(async function (t) {
  await t.wait(1300);

  // Before & after: the squeegee does the selling.
  await t.caption('Customers see real results before they ring');
  await t.moveToPoint(window.innerWidth * 0.5, window.innerHeight * 0.7, 600);
  await t.scrollTo('#results', { offset: 76, duration: 1500 });
  await t.wait(300);
  await t.drag('[data-ba-handle]', '[data-ba-frame]', { toOpts: { at: [0.84, 0.55] }, after: 600 });
  await t.click('.ba-tab[data-scene="render"]', { after: 300 });
  await t.run(function () { document.activeElement && document.activeElement.blur(); });
  await t.wait(350);
  await t.drag('[data-ba-handle]', '[data-ba-frame]', { toOpts: { at: [0.5, 0.5] }, after: 300 });
  await t.moveToPoint(window.innerWidth * 0.95, window.innerHeight * 0.62, 500);
  await t.poster();
  await t.wait(700);

  // The guide price.
  await t.caption('A fair guide price in under a minute');
  await t.scrollTo('.quote-grid', { offset: 84, duration: 1500 });
  await t.click('.svc:has(input[value="windows"])', { after: 320 });
  await t.click('.svc:has(input[value="gutters"])', { after: 320 });
  await t.click('.svc:has(input[value="render"])', { after: 450 });
  await t.click('[data-q-next]', { after: 450 });
  await t.type('#q-postcode', 'BS4 2RT', { cps: 9 });
  await t.waitFor('.postcode-result.is-round', 3000);
  await t.wait(600);
  await t.click('[data-q-next]', { after: 450 });
  await t.click('.sched-opt:has(input[value="4"])', { after: 600 });

  await t.caption('Every line adds up, with the VAT shown');
  await t.hover('.t-total', { hold: 1200 });
  await t.hover('[data-ticket-round]', { hold: 700 });
  await t.click('[data-q-next]', { after: 450 });

  // Book a free visit on the round day.
  await t.caption('Then they book a free visit on their round day');
  await t.click('.day[data-date="2026-11-11"]', { after: 350 });
  await t.click('.slot[data-slot="10"]', { after: 350 });
  await t.type('#q-name', 'Priya Shah', { cps: 15 });
  await t.type('#q-phone', '07700 900318', { cps: 15 });
  await t.type('#q-address', '14 Cotswold Road', { cps: 17 });
  await t.click('[data-q-next]', { after: 200 });
  await t.waitFor('.q-done:not([hidden])', 6000);
  await t.wait(400);
  await t.moveToPoint(window.innerWidth * 0.6, window.innerHeight * 0.55, 700);
  await t.wait(2400);
});
