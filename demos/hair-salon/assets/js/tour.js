/* Fankle: the scripted tour (about 40 s at 1920×1080).
   The clock is pinned to Wednesday 11 November, 10:40 in tour mode (see app.js).
   Settled hero → prices change with hair length → the team → book a curly cut
   with Femi, the strand untangling step by step → booked, shown on the hero (poster). */
HiconTour.ready(async function () {
  var img = document.querySelector('.hero-photo img');
  if (img && !img.complete) await new Promise(function (r) { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); });
});

HiconTour.define(async function (t) {
  await t.wait(1000);
  await t.caption('A website with as much character as the salon');
  await t.moveToPoint(window.innerWidth * 0.3, window.innerHeight * 0.72, 900);
  await t.wait(1500);

  // Prices for your hair length.
  await t.scrollTo('#prices', { offset: 60, duration: 1300 });
  await t.caption('Clear prices for every hair length, up front');
  await t.click('#prices [data-len="long"]', { after: 700 });
  await t.move('.price-col:nth-child(2) .price-row:nth-child(4) .price-amt', { at: [0.3, 0.4], scroll: false });
  await t.wait(1400);

  // The team: rest on Femi, then book with her.
  await t.scrollTo('#team', { offset: 40, duration: 1200 });
  await t.caption('Clients book the right stylist in a minute');
  await t.hover('.team-card:nth-child(3) .team-photo', { hold: 500 });
  await t.click('.team-card:nth-child(3) .team-book', { after: 600 });
  await t.click('.sheet [data-bk-len="shoulder"]', { after: 300 });
  await t.click('.sheet [data-svc="curly"]', { after: 400 });
  await t.click('.sheet [data-next]', { scroll: false, after: 800 });
  await t.click('.sheet [data-next]', { scroll: false, after: 800 });

  var day = document.querySelector('.sheet [data-day="2026-11-12"]:not([disabled])') || document.querySelector('.sheet .day:not([disabled])');
  await t.click(day, { after: 400 });
  var slot = document.querySelector('.sheet [data-time="14:30"]') || document.querySelector('.sheet .slot');
  await t.click(slot, { after: 400 });
  await t.click('.sheet [data-next]', { scroll: false, after: 700 });

  await t.type('#bk-first', 'Aisha', { cps: 18 });
  await t.type('#bk-last', 'Rahman', { cps: 18 });
  await t.type('#bk-mobile', '07700 900318', { cps: 22 });
  await t.type('#bk-email', 'aisha.rahman@example.com', { cps: 30 });
  await t.click('.sheet input[name="visit"][value="back"] + span', { after: 300 });
  await t.click('.sheet [data-next]', { scroll: false });
  await t.waitFor('.done-h', 8000);
  await t.caption('Booked, with a reminder text the day before');
  await t.move('.ticket', { at: [0.7, 0.3], scroll: false });
  await t.wait(2300);
  await t.click('.sheet [data-done]', { scroll: false, after: 400 });

  // The hero now shows the booking.
  await t.caption(null);
  await t.scrollTo(0, { duration: 1100 });
  await t.waitFor('[data-ticket]:not([hidden])', 4000);
  await t.moveToPoint(window.innerWidth * 0.86, window.innerHeight * 0.92, 600);
  await t.wait(1900);
  await t.poster();
  await t.wait(1800);
});
