/* Colour & Style recreation: the scripted tour (about 40 s at 1920×1080).
   Settled hero (poster) → services → about → how it works → reviews carousel →
   an FAQ answer → Services menu to the Colour Analysis page → price card →
   a booking request from the price card, held on the success state. */
HiconTour.ready(async function () {
  var img = document.querySelector('.hero-photo img');
  if (img && !img.complete) {
    await new Promise(function (r) { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); });
  }
});

HiconTour.define(async function (t) {
  var W = window.innerWidth, H = window.innerHeight;

  // A calm first frame: the hero as a visitor first sees it.
  await t.wait(1100);
  await t.poster();
  await t.wait(300);
  await t.caption('Clients meet Anastasiia and her colours straight away');
  await t.moveToPoint(W * 0.36, H * 0.62, 1100);
  await t.hover('.hero-actions .btn--outline', { hold: 900 });

  // The six services, one card at a time.
  await t.caption('Every service explained, with a clear next step');
  await t.scrollTo('#services', { offset: 0, duration: 1500 });
  await t.hover('[data-card="colour-analysis"]', { at: [0.5, 0.45], hold: 1400 });
  await t.scrollTo('.about', { offset: 40, duration: 1300 });
  await t.wait(700);
  await t.scrollTo('.panel-teal', { offset: 70, duration: 1100 });
  await t.wait(500);

  // Reviews and answers before anyone has to ask.
  await t.caption('Real Google reviews build trust before booking');
  await t.scrollTo('#reviews', { offset: 110, duration: 1100 });
  await t.click('[data-next]', { after: 900 });
  await t.click('[data-next]', { after: 1000 });
  await t.scrollTo('.faq', { offset: 30, duration: 1000 });
  await t.click('#faq-q5', { after: 1300 });

  // Into the service page through the Services menu.
  await t.caption(null);
  await t.scrollTo(0, { duration: 1400 });
  await t.click('.nav-link--services', { after: 600 });
  await t.click('.dropdown .menu-link[href="colour-analysis.html"]', { after: 200 });
  await t.waitFor(function () { return document.body.dataset.page === 'service'; }, 6000);
  await t.caption('Each service has its own page, price and process');
  await t.moveToPoint(W * 0.42, H * 0.7, 800);
  await t.wait(500);
  await t.scrollTo('.feature-grid', { offset: 260, duration: 1200 });
  await t.wait(400);
  await t.scrollTo('#price', { offset: 150, duration: 1400 });
  await t.hover('#price .btn', { hold: 500 });

  // A booking request from the price card.
  await t.caption('Booking requests arrive with the service chosen');
  await t.click('#price .btn', { after: 1400 });
  await t.type('.booking-form [name="name"]', 'Rachel Hughes', { cps: 18 });
  await t.type('.booking-form [name="phone"]', '07700 900461', { cps: 22 });
  await t.type('.booking-form [name="email"]', 'rachel@example.co.uk', { cps: 26 });
  // A Thursday a fortnight out; the success panel shows it without the year.
  await t.click('.booking-form [name="date"]', { after: 300 });
  await t.run(function () {
    var d = document.querySelector('.booking-form [name="date"]');
    d.value = '2026-11-12';
    d.dispatchEvent(new Event('input', { bubbles: true }));
    d.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await t.wait(500);
  await t.click('.booking-form .submit');
  await t.waitFor(function () { var s = document.querySelector('.success'); return s && !s.hidden; }, 5000);
  await t.moveToPoint(W * 0.8, H * 0.5, 800);
  await t.wait(900);
  await t.caption(null);
  await t.wait(2000);
});
