/* The scripted story (about 34 s at 1536×864).
 * Captions are timed so none sits over what is moving: each one is read while the
 * screen is still, then clears before the next thing happens underneath it. */
HiconTour.define(async function (t) {
  await t.wait(1400);                                   // a calm shop front
  await t.caption('Shoppers search the way they’d ask in the shop', { ms: 2800 });
  await t.type('#q', 'waterproof walking boots for wide feet under £120', { cps: 15 });
  await t.wait(1100);                                   // the live reading settles on "5 fit"
  await t.press('Enter', '#q');
  await t.caption('Shoppers see what it understood and ruled out', { ms: 2600 });
  await t.waitFor(function () { return document.querySelectorAll('#grid .card').length >= 5; }, 8000);
  await t.wait(1100);                                   // the five boots rise in
  await t.poster();
  await t.hover('#grid .card:first-child .why', { hold: 1700 });

  await t.move('#q', { at: [0.62, 0.5] });
  await t.caption('Add a detail and the results re-rank', { ms: 2600 });
  await t.type('#q', ' in green', { cps: 11 });
  await t.wait(600);
  await t.press('Enter', '#q');
  await t.wait(2300);                                   // the green boot glides to the top

  await t.scrollTo('#nearly', { offset: 330, duration: 1300 });
  await t.caption('Close misses say exactly what they miss');
  await t.hover('.near[data-id="b06"] .near__miss', { hold: 2400 });
  await t.hover('.near[data-id="b06"] [data-relax]', { hold: 300 });
  await t.caption('One click lets the close miss in', { ms: 2500 });
  await t.click('.near[data-id="b06"] [data-relax]', { after: 400 });
  await t.scrollTo('#reading', { offset: 48, duration: 1300 });   // chips, strip and the new top card in one view
  await t.wait(3000);                                   // hold the resolved state
});
