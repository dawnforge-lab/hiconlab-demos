/*
 * The scripted story (?tour=1). Recorded at 1536x864.
 * An urgent call-out is placed past a clash, yesterday's sheet is approved and invoiced,
 * the customer pays from the email a few minutes later, and Today catches up.
 */
HiconTour.define(async (t) => {
  await t.wait(1300);

  // 1. An urgent call-out goes onto Dan's day.
  await t.caption('Urgent call-outs go straight into someone’s day');
  await t.hover('[data-tray="okaforCallout"] .tcard__title', { hold: 800 });
  await t.drag('[data-tray="okaforCallout"] .tcard__title', '.lane[data-person="dan"] .lane__track', { toOpts: { at: [0.35, 0.5] }, after: 200 });

  // 2. Dan is busy: the clash is caught, with real options.
  await t.waitFor('.dlg--clash .opt--best', 4000);
  await t.wait(600);
  await t.caption('Clashes are caught before anyone’s double-booked');
  await t.hover('.dlg--clash .clash__why', { hold: 1300 });
  await t.hover('[data-resolve="give"]', { hold: 1000 });
  await t.click('[data-resolve="give"]', { after: 400 });
  await t.waitFor('.lane[data-person="priya"] .blk.is-urgent', 4000);
  await t.move('.lane[data-person="priya"] .blk.is-urgent', { offset: [24, 34] });
  await t.waitFor(() => !document.querySelector('.toast'), 6000);
  await t.wait(300);
  await t.poster();

  // 3. Yesterday's job sheet, checked from the office.
  await t.caption(null);
  await t.click('[data-nav="sheets"]', { after: 300 });
  await t.waitFor('.paper--sheet', 4000);
  await t.caption('Yesterday’s job sheets, checked from the office', { place: 'top' });
  await t.wait(1000);
  await t.scrollTo('.sheet__sec:nth-of-type(3)', { offset: 150, duration: 1400 });
  await t.wait(400);
  await t.scrollTo('.photos', { offset: 170, duration: 1200 });
  await t.hover('.photo:nth-child(2)', { hold: 800 });
  await t.scrollTo('.office', { offset: 470, duration: 1200 });
  await t.wait(500);
  await t.click('[data-action="approve"]', { after: 300 });
  await t.waitFor('.stamp--ok', 3000);
  await t.wait(1500);

  // 4. Straight to an invoice, and it goes out.
  await t.caption('Approved work becomes an invoice in one click', { place: 'top' });
  await t.click('[data-action="create-invoice"]', { after: 300 });
  await t.waitFor('.paper--invoice', 4000);
  await t.wait(800);
  await t.hover('.inv__tot .is-grand', { hold: 900 });
  await t.click('[data-action="send"]', { after: 300 });
  await t.wait(1500);

  // 5. A few minutes later the customer pays from the email, and Today keeps up.
  await t.caption(null);
  await t.click('[data-nav="today"]', { after: 300 });
  await t.waitFor('.page--today', 3000);
  await t.wait(700);
  await t.caption('Customers pay from the email, and the figures keep up');
  await t.wait(1300);
  await t.run(() => window.App.payByLink(window.App.S.invoices[window.App.S.invoices.length - 1].ref));
  await t.waitFor('.fig[data-fig="paid"].is-changed', 3000);
  await t.move('.fig[data-fig="paid"]', { at: [0.92, 0.9] });
  await t.wait(3400);
});
