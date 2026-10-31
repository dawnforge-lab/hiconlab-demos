/* The scripted story for the video and ?tour=1. "Today" is pinned in app.js (Thu 12 Nov, 08:35). */
HiconTour.define(async function (t) {
  await t.wait(1400);                                        // settled hero
  await t.caption('Customers start with their reg, nothing else');
  await t.click('#hero-reg', { at: [0.93, 0.78], after: 200 });   // keep the cursor clear of the letters
  await t.type('#hero-reg', 'ZQ19 QTW', { cps: 7, after: 500 });
  await t.run(function () { document.getElementById('hero-reg').blur(); });
  await t.wait(700);
  await t.poster();                                          // hero with a real reg in the plate
  await t.wait(500);
  await t.click('#hero-form .tag__go', { after: 400 });
  await t.waitFor('#vehicle.is-found', 6000);
  await t.caption('Their car and MOT date come up straight away', { place: 'top' });
  await t.wait(700);
  await t.hover('#vehicle .mot-badge', { at: [0.5, 1.9], hold: 1700 });   // rest just below the badge
  await t.click('[data-confirm-car]', { after: 600 });

  await t.caption('Prices for their engine size, VAT and all', { place: 'top' });
  await t.click('.choice[data-work="mot"]', { after: 800 });
  await t.click('.choice[data-work="full"]', { after: 900 });
  await t.hover('[data-jc="total"]', { hold: 1500 });
  await t.click('[data-next="2"]', { after: 600 });

  await t.caption('They choose a drop-off time that suits them', { place: 'top' });
  await t.click('.day[data-day="2026-11-17"]', { after: 600 });
  await t.click('.time[data-time="08:15"]', { after: 1300 });
  await t.click('[data-next="3"]', { after: 500 });

  await t.caption(null);
  await t.type('#d-name', 'Sam Bryant', { cps: 11 });
  await t.type('#d-mobile', '07700 900461', { cps: 11, after: 400 });
  await t.click('#book-it');
  await t.waitFor('#jobcard.is-stamped', 4000);
  await t.wait(500);
  await t.caption('Booked in online, without a phone call', { place: 'top' });
  await t.move('#jobcard', { at: [0.3, 0.86], scroll: false });
  await t.wait(3400);                                        // held final state
});
