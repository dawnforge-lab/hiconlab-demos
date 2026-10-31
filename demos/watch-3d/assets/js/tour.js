/* The P39 tour: reveal, turn it over, take it apart, change the dial and strap,
   the numbers, then reserve one. About 40 seconds at 1920×1080. */
HiconTour.define(async (t) => {
  await t.wait(2100);                                   // settled hero, slow turn and light sweep
  await t.scrollTo('#movement', { offset: 0, duration: 2600 });
  await t.wait(2300);                                   // the movement working through the back
  await t.scrollTo('#parts', { offset: 0, duration: 2700 });
  await t.wait(1800);                                   // parts separate, leader lines draw in
  await t.poster();
  await t.wait(1300);
  await t.scrollTo('#dial', { offset: 0, duration: 2600 });
  await t.wait(500);
  await t.click('label[data-dial="fell"]', { after: 1500 });
  await t.click('label[data-strap="oxblood"]', { after: 1500 });
  await t.scrollTo('#specification', { offset: 0, duration: 2400 });
  await t.wait(1500);
  await t.scrollTo('#reserve', { offset: 0, duration: 2400 });
  await t.wait(300);
  await t.type('#r-name', 'Harriet Ainsworth', { cps: 18 });
  await t.type('#r-email', 'harriet@example.co.uk', { cps: 20 });
  await t.click('#reserve-form button[type="submit"]', { after: 300 });
  await t.waitFor('#reserved:not([hidden])', 3000);
  await t.wait(2400);                                   // hold the confirmation
});
