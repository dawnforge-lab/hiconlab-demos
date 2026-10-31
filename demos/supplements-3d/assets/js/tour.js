/* The Upwich tour: the tube turns, shows its label, opens, a tablet fizzes in a glass,
   the flavour changes live, and two tubes go in the basket. About 39 seconds. */

// Scroll through the fizz section at an even pace, so the drop and the clock read evenly.
function scrollFizz(t, ms) {
  return t.run(() => new Promise((done) => {
    const el = document.getElementById('fizz');
    const top = el.getBoundingClientRect().top + window.scrollY;
    const y0 = top - window.innerHeight * 0.15;
    const y1 = top + el.offsetHeight - window.innerHeight;
    const D = ms / (t.speed || 1);
    const t0 = performance.now();
    (function step() {
      const k = Math.min(1, (performance.now() - t0) / D);
      window.scrollTo(0, y0 + (y1 - y0) * k);
      if (k < 1) requestAnimationFrame(step); else done();
    })();
  }));
}

HiconTour.define(async (t) => {
  await t.wait(1200);                                   // settled hero, the tube turning slowly
  await t.caption('A product launch page you can turn in your hand');
  await t.wait(3000);
  await t.caption('Shoppers read the real label before they buy');
  await t.scrollTo('#label', { offset: 0, duration: 2300 });
  await t.wait(1500);
  await t.caption('Open it up and show what’s inside');
  await t.scrollTo('#inside', { offset: 0, duration: 2300 });
  await t.wait(1500);
  await t.poster();
  await t.wait(500);
  await t.scrollTo('#fizz', { offset: window.innerHeight * 0.15, duration: 1900 });
  await t.caption('Customers see exactly how it dissolves');
  await scrollFizz(t, 6400);                            // drop about 1.4 s, then an even run to 2:00
  await t.wait(800);
  await t.caption('Try each flavour, then add it to the basket');
  await t.scrollTo('#flavours', { offset: 0, duration: 1900 });
  await t.wait(200);
  await t.click('label.flavour-card[data-flavour="blackcurrant"]', { after: 1700 });
  await t.click('label.flavour-card[data-flavour="orange"]', { after: 1400 });
  await t.scrollTo('#buy', { offset: 0, duration: 1900 });
  await t.wait(200);
  await t.click('label.plan[data-plan="sub"]', { after: 400 });
  await t.click('#qty-plus', { after: 500 });
  await t.click('#add', { after: 300 });
  await t.waitFor('#basket.is-open', 4000);
  await t.wait(2100);                                   // hold the basket
});
