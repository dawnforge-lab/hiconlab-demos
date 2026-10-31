/*
 * The scripted story (about 40 s at 1920×1080):
 * a car arrives, goes onto Ramp 3 with a mechanic, then the Ready car is
 * priced, invoiced, emailed, paid and handed over, and the board settles.
 */
HiconTour.define(async function (t) {
  // A settled first frame: the busy board.
  await t.wait(1600);
  await t.hover('.alert[data-alert="invoice"]', { hold: 900, at: [0.3, 0.5] });

  // LK19 XRT turns up.
  await t.click('[data-action="arrived"][data-id="lk19"]', { after: 1100 });

  // Drag it to In progress: the start-work picker asks who and where.
  await t.drag('.card[data-id="lk19"] .card-title', '#col-in_progress .col-body', { after: 300 });
  await t.waitFor('.dialog input[name="mech"]', 4000);
  await t.wait(700);
  await t.click('.dialog .choice:has(input[name="mech"][value="josh"])', { after: 450 });
  await t.click('.dialog .choice:has(input[name="ramp"][value="3"])', { after: 500 });
  await t.click('.dialog [data-start]', { after: 300 });

  // Ramp 3 fills.
  await t.waitFor('.ramp[data-ramp="3"]', 3000);
  await t.scrollTo(0, { duration: 600 });
  await t.hover('.ramp[data-ramp="3"]', { hold: 900, at: [0.35, 0.5] });
  await t.run(function () { LB.clearToasts(); });
  await t.wait(150);
  await t.poster();
  await t.wait(900);

  // Open the car that's waiting for its invoice.
  await t.click('.card[data-id="sf18"] .card-title', { after: 300 });
  await t.waitFor('#invoice', 4000);
  await t.wait(1100);

  // Price the workshop's line: cost £58 + 25% = £72.50 a tyre.
  await t.click('[data-action="set-price"][data-line="sf18-2"]', { after: 350 });
  await t.type('#price-cost', '58', { cps: 6, after: 700 });
  await t.click('.price-form button[type="submit"]', { after: 1300 });

  // Create the invoice.
  await t.click('[data-action="create-invoice"]', { after: 300 });
  await t.waitFor('.dialog [data-ok]', 3000);
  await t.wait(900);
  await t.click('.dialog [data-ok]', { after: 900 });

  // Send it, take payment, hand the car over.
  await t.click('[data-action="send-invoice"]', { after: 200 });
  await t.waitFor(function () { return document.querySelector('.inv-trail .ok'); }, 4000);
  await t.wait(900);
  await t.click('[data-action="pay"][data-id="sf18"]', { after: 300 });
  await t.waitFor('.dialog [data-ok]', 3000);
  await t.wait(700);
  await t.click('.dialog [data-ok]', { after: 1000 });
  await t.click('[data-action="deliver"][data-id="sf18"]', { after: 1200 });

  // Back to the board: SF18 UVC in Delivered, the invoice banner gone.
  await t.click('#nav a[data-nav="board"]', { after: 300 });
  await t.waitFor('.card[data-id="sf18"][data-status="delivered"]', 3000);
  await t.wait(600);
  await t.hover('.card[data-id="sf18"]', { hold: 2600, at: [0.5, 0.35] });
});
