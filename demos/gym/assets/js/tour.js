/* Dryside: the scripted tour (about 36 s at 1920×1080).
   "Today" is pinned to Tuesday 3 November, 11:20 in tour mode (see common.js).
   Settled hero → this week: Thursday, Strength, Nadia → book Lifting Foundations as a
   first-timer → confirmation → back to the hero, which now shows the booking (poster). */
HiconTour.ready(async function () {
  var img = document.querySelector('.hero-photo img');
  if (img && !img.complete) await new Promise(function (r) { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); });
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
});

HiconTour.define(async function (t) {
  await t.wait(1200);
  await t.caption('Newcomers see a real gym and a free first session');
  await t.moveToPoint(window.innerWidth * 0.5, window.innerHeight * 0.4, 1000);
  await t.wait(700);
  await t.hover('[data-today] .today-list li', { at: [0.4, 0.5], hold: 1300 });

  // This week: Thursday, Strength, Nadia.
  await t.caption('Find a class by day, type or coach in seconds');
  await t.scrollTo('[data-tt]', { offset: 108, duration: 1500 });
  await t.wait(250);
  await t.click('#day-2', { after: 650 });
  await t.click('[data-type="strength"]', { after: 650 });
  await t.click('[data-coach="nadia"]', { after: 700 });
  await t.hover('.tt-list .row .row-spaces', { at: [0.3, 0.5], hold: 1000 });

  // Book it as a first-timer.
  await t.caption('Book a free first session in under a minute');
  await t.click('.tt-list .row [data-book]', { after: 600 });
  await t.click(document.querySelector('input[name="bk-kind"][value="first"]').closest('.choice'), { after: 450 });
  await t.click('[data-bk-next]', { after: 450 });
  await t.type('#bk-first', 'Amira', { cps: 16 });
  await t.type('#bk-last', 'Shah', { cps: 16 });
  await t.type('#bk-mobile', '07700 900318', { cps: 18 });
  await t.type('#bk-email', 'amira.shah@example.com', { cps: 24 });
  await t.click(document.querySelector('#bk-age').closest('.check'), { after: 400 });
  await t.click('[data-bk-next]');

  await t.waitFor('#bk-done-title', 6000);
  await t.caption('Booked, with what to bring and who to ask for');
  await t.move('.ticket', { at: [0.7, 0.55] });
  await t.wait(2200);
  await t.click('[data-bk-done]', { after: 700 });

  // The row now says booked, and the homepage remembers it.
  await t.hover('.tt-list .row .booked-tag', { hold: 1100 });
  await t.caption(null);
  await t.scrollTo(0, { duration: 1400 });
  await t.waitFor('.board.is-booked', 3000);
  await t.moveToPoint(window.innerWidth * 0.86, window.innerHeight * 0.32, 900);
  await t.run(function () { if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); });
  await t.wait(500);
  await t.poster();
  await t.wait(2200);
});
