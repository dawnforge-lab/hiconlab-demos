/*
 * The scripted story (about 34 s at 1920×1080):
 * a calm storefront, a job typed into the search with the suggestions reacting,
 * "Ask the counter", lookups, a streamed answer with cards, a follow-up chip,
 * a second answer, two items into the basket, and a held resolved state.
 */
HiconTour.define(async function (t) {
  await t.wait(1300);
  // Top, so it clears the suggestions list as it grows.
  await t.caption('Customers describe the job in their own words', { place: 'top' });

  await t.type('#q', 'fix a heavy bracket into concrete', { after: 650 });
  await t.hover('#opt-ask', { hold: 650 });
  await t.click('#opt-ask', { after: 200 });
  await t.caption('It checks the real catalogue, stock and lead times');

  await t.waitFor('.turn.is-complete', 40000);
  await t.wait(400);
  await t.poster();
  await t.caption('Answers name the right parts, never made-up specs');
  await t.wait(2600);
  await t.caption('One tap asks the obvious next question');

  await t.click('.turn:last-child .chip[data-to="concreteKit"]', { after: 300 });
  await t.waitFor(function () { return document.querySelectorAll('.turn.is-complete').length === 2; }, 40000);
  await t.wait(900);
  await t.caption('Straight into the basket, ready to order');

  await t.click('.turn:last-child [data-add="FT-CG-HD"]', { after: 1100 });
  await t.click('.turn:last-child [data-add="TR-SD-12"]', { after: 400 });
  await t.move('.turn:last-child .answer', { at: [0.55, 0.4], duration: 900 });
  // End on the settled state: both buttons back to "1 in basket".
  await t.waitFor(function () { return !document.querySelector('.btn-add.is-added'); }, 5000);
  await t.wait(2200);
});
