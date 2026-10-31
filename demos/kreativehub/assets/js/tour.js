/* KreativeHub recreation: the scripted tour (about 38 s at 1920×1080).
   Settled hero (poster) → services grid → proof cards → the FAQ opens an answer →
   Services in the sticky nav swaps to the SEO page → its sub-disciplines and the
   technical SEO illustration → held end. Nothing here is random, so every take matches. */
HiconTour.ready(async function () {
  var logo = document.querySelector('.kh-nav__logo img');
  if (logo && !logo.complete) await new Promise(function (r) { logo.addEventListener('load', r, { once: true }); logo.addEventListener('error', r, { once: true }); });
});

HiconTour.define(async function (t) {
  var W = window.innerWidth, H = window.innerHeight;

  // A settled hero, then the poster.
  await t.wait(900);
  await t.moveToPoint(W * 0.62, H * 0.56, 1100);
  await t.wait(500);
  await t.poster();
  await t.caption('KreativeHub’s own website, recreated as it’s built');
  await t.wait(1200);
  await t.hover('.hero-grid .btn--solid', { hold: 1200 });

  // The five services.
  await t.scrollTo('.svc-grid', { offset: 150, duration: 1800 });
  await t.caption('Five services, each with a clear next step');
  await t.hover('.svc[href="seo.html"]', { at: [0.5, 0.42], hold: 1300 });
  await t.hover('.svc-grid .svc:nth-child(4)', { at: [0.5, 0.45], hold: 1000, scroll: false });

  // Proof from client work.
  await t.scrollTo('.work-grid', { offset: 330, duration: 1700 });
  await t.caption('Results from real client work, shown up front');
  await t.hover('.work-grid .case:nth-child(2)', { at: [0.5, 0.5], hold: 2000 });

  // Straight answers: open one.
  await t.scrollTo('.faq', { offset: 300, duration: 1900 });
  await t.caption('Straight answers before anyone books a call');
  await t.click('.faq__item:nth-child(2) .faq__q', { at: [0.3, 0.5], after: 400 });
  await t.waitFor(function () { return document.querySelector('.faq__item:nth-child(2)').dataset.open === 'true'; }, 3000);
  await t.moveToPoint(W * 0.55, H * 0.6, 900);
  await t.wait(1600);

  // Over to the SEO page through the sticky nav. The FAQ caption goes before the swap,
  // and the SEO page caption only stays up over its hero.
  await t.caption(null);
  await t.click('.kh-nav__c a[href="seo.html"]', { after: 200, scroll: false });
  await t.waitFor('.kh-crumbs', 6000);
  await t.wait(300);
  await t.caption('Every service gets its own page in the same style');
  await t.moveToPoint(W * 0.6, H * 0.5, 900);
  await t.wait(2200);
  await t.caption(null);

  await t.scrollTo('.subsvc', { offset: 170, duration: 2200 });
  await t.hover('.subsvc__cell:nth-child(1)', { at: [0.5, 0.5], hold: 1100 });

  // The technical SEO capability with its illustration, held as the end.
  await t.scrollTo('.feature-row-grid', { offset: 180, duration: 2000 });
  await t.moveToPoint(W * 0.7, H * 0.62, 1000);
  await t.wait(2600);
});
