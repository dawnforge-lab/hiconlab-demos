/* The scripted story, recorded at 1536×864. */
HiconTour.define(async function (t) {
  var S = window.CMS_DEMO.state;
  var stations = function (i) { return document.querySelectorAll('.st')[i]; };

  // A calm first frame: the CMS on Home page, the live site, the publish path idle.
  await t.wait(1500);
  await t.caption('Rhian edits her own page in plain fields');
  await t.type('#f-hero-statusLabel', 'Now booking November sweeps', { clear: true, cps: 15 });
  await t.wait(500);

  // Reorder the dynamic zone: FAQ above "How a sweep goes".
  await t.scrollTo('#dz', { within: '#editor', offset: 70, duration: 800 });
  await t.wait(250);
  await t.drag('[data-handle="14"]', '[data-row="13"]', { toOpts: { at: [0.5, 0.2] }, after: 600 });

  // SEO with its counter and search preview.
  await t.caption('See how the page will look in Google');
  await t.scrollTo('[data-field="seo.metaDescription"]', { within: '#editor', offset: 30, duration: 1000 });
  await t.wait(200);
  await t.click('#f-seo-metaDescription', { at: [0.85, 0.8], after: 150 });
  await t.run(function () { var n = document.getElementById('f-seo-metaDescription'); n.setSelectionRange(n.value.length, n.value.length); });
  await t.type('#f-seo-metaDescription', ' Now booking November.', { cps: 15 });
  await t.wait(900);
  await t.click('#btn-save', { after: 300 });
  await t.waitFor(function () { return document.getElementById('status-badge').dataset.status === 'modified'; }, 6000);
  await t.wait(700);

  // Draft Mode preview on the real site.
  await t.caption('Check the draft on the real site first');
  await t.click('#btn-preview');
  await t.waitFor(function () { return document.getElementById('cache-chip').dataset.state === 'draft'; }, 8000);
  await t.wait(1900);

  // Publish → webhook → route → revalidateTag.
  await t.caption('Publish, and the live site updates itself', { place: 'top' });
  await t.click('#btn-publish');
  await t.waitFor(function () { return stations(4).classList.contains('is-waiting'); }, 20000);
  await t.wait(700);

  // The next visitors: a stale hit that starts the refresh, then the fresh page.
  await t.caption('Visitors see the change seconds later, no rebuild', { place: 'top' });
  await t.click('#btab-live', { after: 700 });
  await t.click('#btn-reload');
  await t.run(function () { document.activeElement.blur(); });
  await t.waitFor(function () { return S.cache.state === 'fresh'; }, 8000);
  await t.wait(1300);
  await t.click('#btn-reload');
  await t.run(function () { document.activeElement.blur(); });
  await t.waitFor(function () { return stations(4).classList.contains('is-done'); }, 8000);
  await t.wait(900);
  await t.poster();
  await t.moveToPoint(window.innerWidth * 0.79, window.innerHeight * 0.48, 700);
  await t.wait(2200);
});
