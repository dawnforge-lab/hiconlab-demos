/* Fanlight Dental: the scripted tour (about 42 s at 1920×1080).
   The clock is pinned to Tuesday 10 November, 09:20 in tour mode (see app.js).
   Settled hero → treatments → the clear aligners feature → the fee card and plan →
   back to the hero → book the advertised check-up → booked, shown on the hero (poster). */
HiconTour.ready(async function () {
  var img = document.querySelector('.hero-figure img');
  if (img && !img.complete) await new Promise(function (r) { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); });
});

HiconTour.define(async function (t) {
  await t.wait(1200);
  await t.caption('A calm, clear website for an independent practice');
  await t.moveToPoint(window.innerWidth * 0.44, window.innerHeight * 0.62, 900);
  await t.wait(1800);

  // Treatments, with the clear aligners row.
  await t.caption('Every treatment explained in plain English');
  await t.scrollTo('#treatments', { offset: 96, duration: 1500 });
  await t.hover('.treat-row[href="treatment.html"]', { hold: 700 });

  // The aligners feature: the photo, the facts, and the way into the treatment page.
  await t.scrollTo('.feature', { offset: 40, duration: 1200 });
  await t.wait(500);
  await t.hover('.feature .btn--light', { hold: 1800 });
  await t.wait(300);

  // Prices on the wall: take a moment on the fee card, then the plan.
  await t.caption('Fees shown up front, so patients know the cost');
  await t.scrollTo('#fees', { offset: 92, duration: 1500 });
  await t.move('.fee-card', { at: [0.55, 0.25], scroll: false });
  await t.moveToPoint(window.innerWidth * 0.42, window.innerHeight * 0.72, 1000);
  await t.wait(300);
  await t.hover('.plan-tier--main', { hold: 800 });

  // Back to the top and book the check-up the hero card advertises.
  await t.caption('New patients book online in a few steps');
  await t.scrollTo(0, { duration: 1300 });
  var advert = document.querySelector('[data-next-checkup]');
  await t.hover(advert, { hold: 500 });
  await t.click('.hero-note .link-arrow', { after: 450 });
  await t.click(document.querySelector('input[name="bk-patient"][value="new"]').closest('.choice'), { after: 550 });
  await t.click('[data-bk-next]', { after: 400 });

  // The same day and time as the hero card.
  var day = document.querySelector('.day[data-date="' + advert.dataset.date + '"]') || document.querySelector('.day:not([disabled])');
  await t.click(day, { after: 350 });
  var pick = document.querySelector('.slot[data-time="' + advert.dataset.time + '"]:not([disabled])') || document.querySelector('.slot:not([disabled])');
  await t.click(pick, { after: 450 });
  await t.click('[data-bk-next]', { after: 350 });

  await t.type('#bk-first', 'Hannah', { cps: 17 });
  await t.type('#bk-last', 'Pryce', { cps: 17 });
  await t.type('#bk-dob', '14031991', { cps: 16 });
  await t.type('#bk-mobile', '07700 900 461', { cps: 20 });
  await t.type('#bk-email', 'hannah@example.com', { cps: 22 });
  await t.click('[data-bk-next]');

  await t.waitFor('#bk-done-title', 8000);
  await t.wait(1200);
  await t.click('[data-bk-next]', { after: 300 });

  // The hero now shows the booking.
  await t.caption('Booked, with the appointment shown on the homepage');
  await t.waitFor('.hero-note.is-booked', 4000);
  await t.moveToPoint(window.innerWidth * 0.86, window.innerHeight * 0.88, 800);
  await t.wait(500);
  await t.poster();
  await t.wait(2000);
});
