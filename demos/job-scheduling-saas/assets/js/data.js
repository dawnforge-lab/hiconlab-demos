/*
 * Stampwell demo data for Hartwell & Lowe Heating, Stroud.
 * Everything is fictional. Money is in pence, times are minutes after midnight,
 * dates are ISO strings. "Today" is Thursday 5 November 2026, 10:12.
 */
(function () {
  'use strict';

  var TODAY = '2026-11-05';
  var NOW = 10 * 60 + 12;

  var company = {
    name: 'Hartwell & Lowe Heating',
    short: 'Hartwell & Lowe',
    mark: 'H&L',
    address: ['Unit 6, Dyehouse Yard', 'Stroud GL5 3JR'],
    phone: '01632 960274',
    email: 'office@hartwell-lowe.example',
    terms: 14,
    vat: 'GB 284 6170 52',
  };

  var user = { name: 'Jo Lowe', first: 'Jo', initials: 'JL', role: 'Office' };

  // Rates are what the client is charged per hour.
  var team = [
    { id: 'tom', name: 'Tom Hartwell', first: 'Tom', initials: 'TH', role: 'Owner · Gas Safe', lane: 'Owner · Gas Safe', rate: 6000, gas: true },
    { id: 'dan', name: 'Dan Pryce', first: 'Dan', initials: 'DP', role: 'Heating engineer · Gas Safe', lane: 'Heating · Gas Safe', rate: 5500, gas: true },
    { id: 'priya', name: 'Priya Shah', first: 'Priya', initials: 'PS', role: 'Heating engineer · Gas Safe', lane: 'Heating · Gas Safe', rate: 5500, gas: true },
    { id: 'kieran', name: 'Kieran Doyle', first: 'Kieran', initials: 'KD', role: 'Plumber', lane: 'Plumber', rate: 4800, gas: false },
    { id: 'megan', name: 'Megan Ellis', first: 'Megan', initials: 'ME', role: 'Plumber', lane: 'Plumber', rate: 4800, gas: false },
    { id: 'alfie', name: 'Alfie Cole', first: 'Alfie', initials: 'AC', role: 'Apprentice', lane: 'Apprentice', rate: 2800, gas: false },
  ];

  // x/y are rough miles from Stroud town centre, used for travel times.
  var clients = [
    { id: 'barnard', name: 'Helen & Mark Barnard', short: 'the Barnards', contact: 'Helen Barnard', addr: '17 Weavers Row, Stroud', pc: 'GL5 3QT', area: 'Stroud', x: 0.4, y: -0.6, phone: '07700 900412', email: 'helen.barnard@example.co.uk' },
    { id: 'okafor', name: 'Grace Okafor', short: 'Mrs Okafor', contact: 'Grace Okafor', addr: '4 Kestrel Rise, Cainscross', pc: 'GL5 4LP', area: 'Cainscross', x: -1.8, y: 0.3, phone: '07700 900687', email: 'grace.okafor@example.co.uk' },
    { id: 'fivemills', name: 'Five Mills Lettings', short: 'Five Mills', contact: 'Owen Price', addr: 'Office 3, 21 Kendrick Street, Stroud', pc: 'GL5 1AA', area: 'Stroud', x: 0.1, y: 0.1, phone: '01632 960518', email: 'owen@fivemills.example', company: true },
    { id: 'penney', name: 'Ruth Penney', short: 'Mrs Penney', contact: 'Ruth Penney', addr: '8 Cotswold Mead, Painswick', pc: 'GL6 6XT', area: 'Painswick', x: 1.5, y: 4, phone: '07700 900233', email: 'ruth.penney@example.co.uk' },
    { id: 'grant', name: 'Oliver Grant', short: 'Mr Grant', contact: 'Oliver Grant', addr: '31 Quarry View, Brimscombe', pc: 'GL5 2RE', area: 'Brimscombe', x: 2.5, y: -1.5, phone: '07700 900951', email: 'oliver.grant@example.co.uk' },
    { id: 'mehta', name: 'Arjun & Claire Mehta', short: 'the Mehtas', contact: 'Claire Mehta', addr: 'Hillcrest, Common Road, Minchinhampton', pc: 'GL6 9DS', area: 'Minchinhampton', x: 3, y: -3, phone: '07700 900764', email: 'claire.mehta@example.co.uk' },
    { id: 'dairy', name: 'The Old Dairy Café', short: 'the Old Dairy', contact: 'Bea Russell', addr: 'Fountain Yard, Nailsworth', pc: 'GL6 0BL', area: 'Nailsworth', x: 1.5, y: -4.5, phone: '01632 960733', email: 'hello@olddairycafe.example', company: true },
    { id: 'lake', name: 'Fiona Lake', short: 'Ms Lake', contact: 'Fiona Lake', addr: '12 Mill Leat, Stonehouse', pc: 'GL10 2NF', area: 'Stonehouse', x: -3.5, y: 0.5, phone: '07700 900118', email: 'fiona.lake@example.co.uk' },
    { id: 'whitlock', name: 'Sam Whitlock', short: 'Sam Whitlock', contact: 'Sam Whitlock', addr: '5 Orchard Close, Whiteshill', pc: 'GL6 6AJ', area: 'Whiteshill', x: 0, y: 2.2, phone: '07700 900540', email: 'sam.whitlock@example.co.uk' },
    { id: 'gould', name: 'Peter & Anne Gould', short: 'the Goulds', contact: 'Anne Gould', addr: 'Rose Cottage, Slad Road, Stroud', pc: 'GL5 1RN', area: 'Slad Road', x: 0.8, y: 1, phone: '07700 900372', email: 'anne.gould@example.co.uk' },
    { id: 'brooks', name: 'Nadia Brooks', short: 'Ms Brooks', contact: 'Nadia Brooks', addr: 'Flat 2, 9 Gloucester Terrace, Stroud', pc: 'GL5 1JP', area: 'Stroud', x: 0, y: 0.2, phone: '07700 900826', email: 'nadia.brooks@example.co.uk' },
    { id: 'hale', name: 'Dominic Hale', short: 'Mr Hale', contact: 'Dominic Hale', addr: '22 Weyhouse Close, Stroud', pc: 'GL5 4EH', area: 'Stroud', x: -0.6, y: -0.2, phone: '07700 900609', email: 'dom.hale@example.co.uk' },
    { id: 'fenwick', name: 'Lucy Fenwick', short: 'Ms Fenwick', contact: 'Lucy Fenwick', addr: '2 Toadsmoor Row, Chalford', pc: 'GL6 8QW', area: 'Chalford', x: 4.5, y: -1.5, phone: '07700 900287', email: 'lucy.fenwick@example.co.uk' },
    { id: 'ferris', name: 'Ferris & Webb Joinery', short: 'Ferris & Webb', contact: 'Gary Webb', addr: 'Unit 2, Bourne Mills Yard, Thrupp', pc: 'GL5 2BU', area: 'Thrupp', x: 1.8, y: -0.9, phone: '01632 960941', email: 'gary@ferrisandwebb.example', company: true },
    { id: 'ashe', name: 'Martin Ashe', short: 'Mr Ashe', contact: 'Martin Ashe', addr: '6 Lock Keeper’s Row, Stroud', pc: 'GL5 2HF', area: 'Stroud', x: 0.9, y: -0.5, phone: '07700 900465', email: 'martin.ashe@example.co.uk' },
    { id: 'kemp', name: 'Rosa Kemp', short: 'Ms Kemp', contact: 'Rosa Kemp', addr: '14 Field Road, Whiteshill', pc: 'GL6 6AQ', area: 'Whiteshill', x: -0.2, y: 2.4, phone: '07700 900191', email: 'rosa.kemp@example.co.uk' },
    { id: 'rudd', name: 'James Rudd', short: 'Mr Rudd', contact: 'James Rudd', addr: '3 Vicarage Close, Rodborough', pc: 'GL5 3TH', area: 'Rodborough', x: 0.2, y: -1.2, phone: '07700 900358', email: 'james.rudd@example.co.uk' },
    { id: 'wilde', name: 'Hannah Wilde', short: 'Ms Wilde', contact: 'Hannah Wilde', addr: '19 Uplands Road, Stroud', pc: 'GL5 1TE', area: 'Uplands', x: 0.6, y: 1.4, phone: '07700 900702', email: 'hannah.wilde@example.co.uk' },
    { id: 'okoro', name: 'Ben Okoro', short: 'Mr Okoro', contact: 'Ben Okoro', addr: '40 Bisley Old Lane, Stroud', pc: 'GL5 1NL', area: 'Stroud', x: 1.2, y: 0.6, phone: '07700 900944', email: 'ben.okoro@example.co.uk' },
    { id: 'tait', name: 'Elaine Tait', short: 'Mrs Tait', contact: 'Elaine Tait', addr: 'Box Cottage, The Cross, Amberley', pc: 'GL5 5AB', area: 'Amberley', x: 1.6, y: -3.4, phone: '07700 900815', email: 'elaine.tait@example.co.uk' },
    { id: 'patel', name: 'Anil & Meera Patel', short: 'the Patels', contact: 'Meera Patel', addr: '7 Beeches Green, Stroud', pc: 'GL5 4AB', area: 'Stroud', x: -0.4, y: 0.6, phone: '07700 900133', email: 'meera.patel@example.co.uk' },
    { id: 'oconnor', name: 'Siobhan O’Connor', short: 'Ms O’Connor', contact: 'Siobhan O’Connor', addr: '23 Middle Hill, Chalford', pc: 'GL6 8BD', area: 'Chalford', x: 4.2, y: -1.2, phone: '07700 900248', email: 'siobhan.oconnor@example.co.uk' },
    { id: 'hughes', name: 'Gareth Hughes', short: 'Mr Hughes', contact: 'Gareth Hughes', addr: '4 Bowbridge Lane, Stroud', pc: 'GL5 2JW', area: 'Bowbridge', x: 1.0, y: -0.9, phone: '07700 900571', email: 'gareth.hughes@example.co.uk' },
    { id: 'carter', name: 'Jenny Carter', short: 'Ms Carter', contact: 'Jenny Carter', addr: '11 Horns Road, Stroud', pc: 'GL5 1EB', area: 'Stroud', x: 0.5, y: 0.4, phone: '07700 900319', email: 'jenny.carter@example.co.uk' },
    { id: 'novak', name: 'Tomasz Novak', short: 'Mr Novak', contact: 'Tomasz Novak', addr: '2 Park Road, Stonehouse', pc: 'GL10 2DD', area: 'Stonehouse', x: -3.2, y: 0.2, phone: '07700 900684', email: 'tomasz.novak@example.co.uk' },
    { id: 'baker', name: 'Margaret Baker', short: 'Mrs Baker', contact: 'Margaret Baker', addr: '15 Spring Lane, Nailsworth', pc: 'GL6 0LX', area: 'Nailsworth', x: 1.3, y: -4.2, phone: '07700 900726', email: 'margaret.baker@example.co.uk' },
    { id: 'lewis', name: 'Callum Lewis', short: 'Mr Lewis', contact: 'Callum Lewis', addr: '9 Kingscourt Lane, Rodborough', pc: 'GL5 3PX', area: 'Rodborough', x: 0.0, y: -1.5, phone: '07700 900497', email: 'callum.lewis@example.co.uk' },
    { id: 'ward', name: 'Natalie Ward', short: 'Ms Ward', contact: 'Natalie Ward', addr: '30 Summer Street, Stroud', pc: 'GL5 1NY', area: 'Stroud', x: 0.3, y: 0.0, phone: '07700 900852', email: 'natalie.ward@example.co.uk' },
    { id: 'ellwood', name: 'Pete Ellwood', short: 'Mr Ellwood', contact: 'Pete Ellwood', addr: 'Orchard House, Randwick', pc: 'GL6 6HL', area: 'Randwick', x: -1.4, y: 2.0, phone: '07700 900163', email: 'pete.ellwood@example.co.uk' },
    { id: 'begum', name: 'Shabana Begum', short: 'Mrs Begum', contact: 'Shabana Begum', addr: '18 Cashes Green Road, Cainscross', pc: 'GL5 4JU', area: 'Cainscross', x: -1.6, y: 0.6, phone: '07700 900938', email: 'shabana.begum@example.co.uk' },
    { id: 'morris', name: 'Dave & Sue Morris', short: 'the Morrises', contact: 'Sue Morris', addr: '3 Rodborough Avenue, Stroud', pc: 'GL5 3RS', area: 'Rodborough', x: 0.1, y: -0.9, phone: '07700 900205', email: 'sue.morris@example.co.uk' },
    { id: 'king', name: 'Harriet King', short: 'Ms King', contact: 'Harriet King', addr: '12 Selsley Road, North Woodchester', pc: 'GL5 5NN', area: 'Woodchester', x: 0.4, y: -2.6, phone: '07700 900377', email: 'harriet.king@example.co.uk' },
    { id: 'fox', name: 'Michael Fox', short: 'Mr Fox', contact: 'Michael Fox', addr: 'Flat 6, Lansdown Court, Stroud', pc: 'GL5 1BB', area: 'Stroud', x: 0.2, y: 0.3, phone: '07700 900519', email: 'michael.fox@example.co.uk' },
    { id: 'reid', name: 'Alison Reid', short: 'Ms Reid', contact: 'Alison Reid', addr: '5 Bisley Road, Stroud', pc: 'GL5 1HF', area: 'Stroud', x: 0.9, y: 0.7, phone: '07700 900662', email: 'alison.reid@example.co.uk' },
    { id: 'singh', name: 'Harpreet Singh', short: 'Mr Singh', contact: 'Harpreet Singh', addr: '26 Paganhill Lane, Stroud', pc: 'GL5 4JS', area: 'Paganhill', x: -1.0, y: 0.8, phone: '07700 900781', email: 'harpreet.singh@example.co.uk' },
    { id: 'dunn', name: 'Laura Dunn', short: 'Ms Dunn', contact: 'Laura Dunn', addr: '8 Thrupp Lane, Thrupp', pc: 'GL5 2DQ', area: 'Thrupp', x: 1.9, y: -1.1, phone: '07700 900426', email: 'laura.dunn@example.co.uk' },
    { id: 'grey', name: 'Stuart Grey', short: 'Mr Grey', contact: 'Stuart Grey', addr: '41 Cainscross Road, Stroud', pc: 'GL5 4HB', area: 'Stroud', x: -0.8, y: 0.4, phone: '07700 900594', email: 'stuart.grey@example.co.uk' },
    { id: 'adeyemi', name: 'Bola Adeyemi', short: 'Mrs Adeyemi', contact: 'Bola Adeyemi', addr: '6 Uplands Road, Stroud', pc: 'GL5 1TF', area: 'Uplands', x: 0.7, y: 1.3, phone: '07700 900817', email: 'bola.adeyemi@example.co.uk' },
    { id: 'hall', name: 'Eleanor Hall', short: 'Ms Hall', contact: 'Eleanor Hall', addr: 'The Old Forge, Sheepscombe', pc: 'GL6 7RL', area: 'Sheepscombe', x: 2.6, y: 4.6, phone: '07700 900352', email: 'eleanor.hall@example.co.uk' },
    { id: 'quinn', name: 'Rob Quinn', short: 'Mr Quinn', contact: 'Rob Quinn', addr: '14 Rodborough Hill, Stroud', pc: 'GL5 3SS', area: 'Rodborough', x: 0.2, y: -0.7, phone: '07700 900276', email: 'rob.quinn@example.co.uk' },
  ];

  // Job types drive the coloured tab on cards.
  var types = {
    heating: { label: 'Heating' },
    gas: { label: 'Gas safety' },
    plumbing: { label: 'Plumbing' },
    bathroom: { label: 'Bathroom' },
    visit: { label: 'Quote visit' },
  };

  function hm(s) { var p = s.split(':'); return +p[0] * 60 + +p[1]; }

  /*
   * The diary for the week. Each row: [person, day, start, end, jobKey].
   * Jobs are defined once below and can span several rows (crew, multi-day).
   */
  var jobsSeed = {
    // Thursday 5 Nov (today)
    whitlockService: { title: 'Annual boiler service', client: 'whitlock', type: 'heating', gas: true, created: '2026-10-19', est: 8500 },
    fivemillsCp12: { title: 'Landlord gas safety checks, flats 1 and 2', client: 'fivemills', type: 'gas', gas: true, created: '2026-10-27', est: 14000 },
    mehtaVisit: { title: 'Quote visit: new bathroom and boiler move', client: 'mehta', type: 'visit', created: '2026-11-02', est: 0 },
    fenwickService: { title: 'Annual boiler service', client: 'fenwick', type: 'heating', gas: true, created: '2026-10-22', est: 8500 },
    lakeService: { title: 'Annual boiler service', client: 'lake', type: 'heating', gas: true, created: '2026-10-20', est: 8500 },
    gouldRads: { title: 'Lounge radiator swap and TRVs', client: 'gould', type: 'heating', created: '2026-10-28', est: 56040 },
    haleFlush: { title: 'Power flush and magnetic filter', client: 'hale', type: 'heating', created: '2026-10-26', est: 61800 },
    brooksBreakdown: { title: 'Breakdown: boiler losing pressure', client: 'brooks', type: 'heating', gas: true, created: '2026-11-05', est: 18000, urgent: true },
    ferrisService: { title: 'Workshop boiler service', client: 'ferris', type: 'heating', gas: true, created: '2026-10-23', est: 9500 },
    fivemillsFlat4: { title: 'Gas safety check, flat 4', client: 'fivemills', type: 'gas', gas: true, created: '2026-10-27', est: 7000 },
    grantBathroom: { title: 'Bathroom refit', days: 5, client: 'grant', type: 'bathroom', created: '2026-10-09', est: 486000 },
    penneyStopcock: { title: 'Replace seized stopcock', client: 'penney', type: 'plumbing', created: '2026-11-03', est: 12000 },
    dairyTap: { title: 'Kitchen tap and isolating valves', client: 'dairy', type: 'plumbing', created: '2026-10-30', est: 19500 },
    ashCistern: { title: 'Leaking WC cistern and outside tap', client: 'tait', type: 'plumbing', created: '2026-11-02', est: 16000 },
    // Friday 6 Nov
    okoroCombi: { title: 'Combi boiler replacement (day 1 of 2)', client: 'okoro', type: 'heating', gas: true, created: '2026-10-14', est: 312000 },
    wildeVisit: { title: 'Quote visit: underfloor heating', client: 'wilde', type: 'visit', created: '2026-11-04', est: 0 },
    rudd2: { title: 'Check pressure after PRV swap', client: 'rudd', type: 'heating', gas: true, created: '2026-11-04', est: 0 },
    kempValves: { title: 'Replace radiator valves, two rooms', client: 'kemp', type: 'heating', created: '2026-11-02', est: 21000 },
    // Mon to Wed (done)
    barnardRads: { title: 'Replace two bedroom radiators, fit TRVs', client: 'barnard', type: 'heating', created: '2026-10-29', est: 82020 },
    kempTap: { title: 'Replace kitchen mixer tap and isolating valves', client: 'kemp', type: 'plumbing', created: '2026-10-30', est: 20400 },
    ruddPressure: { title: 'Boiler losing pressure: new PRV', client: 'rudd', type: 'heating', gas: true, created: '2026-11-03', est: 18000 },
    fivemillsCp12b: { title: 'Landlord gas safety checks, 3 flats', client: 'fivemills', type: 'gas', gas: true, created: '2026-10-20', est: 21000 },
    fenwickCistern: { title: 'Replace leaking WC fill valve', client: 'fenwick', type: 'plumbing', created: '2026-10-30', est: 7500 },
    grantBathroom1: null,
  };
  delete jobsSeed.grantBathroom1;

  var diary = [
    // Thursday 5 November
    ['tom', TODAY, '08:00', '09:15', 'whitlockService'],
    ['tom', TODAY, '09:45', '11:45', 'fivemillsCp12'],
    ['tom', TODAY, '13:30', '14:30', 'mehtaVisit'],
    ['tom', TODAY, '15:15', '16:15', 'fenwickService'],
    ['dan', TODAY, '08:00', '09:30', 'lakeService'],
    ['dan', TODAY, '10:00', '12:30', 'gouldRads'],
    ['dan', TODAY, '13:30', '16:30', 'haleFlush'],
    ['priya', TODAY, '08:30', '10:30', 'brooksBreakdown'],
    ['priya', TODAY, '13:30', '14:30', 'ferrisService'],
    ['priya', TODAY, '15:00', '15:45', 'fivemillsFlat4'],
    ['kieran', TODAY, '08:00', '16:30', 'grantBathroom'],
    ['alfie', TODAY, '08:00', '16:30', 'grantBathroom'],
    ['megan', TODAY, '08:30', '10:00', 'penneyStopcock'],
    ['megan', TODAY, '10:30', '12:00', 'dairyTap'],
    ['megan', TODAY, '13:00', '15:00', 'ashCistern'],
    // Friday 6 November
    ['tom', '2026-11-06', '08:00', '17:00', 'okoroCombi'],
    ['dan', '2026-11-06', '08:00', '17:00', 'okoroCombi'],
    ['priya', '2026-11-06', '08:30', '09:15', 'rudd2'],
    ['priya', '2026-11-06', '10:00', '12:30', 'kempValves'],
    ['priya', '2026-11-06', '13:00', '13:45', 'wildeVisit'],
    ['kieran', '2026-11-06', '08:00', '16:30', 'grantBathroom'],
    ['alfie', '2026-11-06', '08:00', '16:30', 'grantBathroom'],
    // Wednesday 4 November
    ['dan', '2026-11-04', '08:00', '13:00', 'barnardRads'],
    ['alfie', '2026-11-04', '08:00', '13:00', 'barnardRads'],
    ['megan', '2026-11-04', '09:00', '10:30', 'kempTap'],
    ['priya', '2026-11-04', '13:00', '15:00', 'ruddPressure'],
    ['kieran', '2026-11-04', '08:00', '16:30', 'grantBathroom'],
    // Tuesday 3 November
    ['tom', '2026-11-03', '09:00', '11:30', 'fivemillsCp12b'],
    ['kieran', '2026-11-03', '14:00', '15:00', 'fenwickCistern'],
    ['kieran', '2026-11-03', '08:00', '13:00', 'grantBathroom'],
    ['alfie', '2026-11-03', '08:00', '16:30', 'grantBathroom'],
    // Monday 2 November
    ['kieran', '2026-11-02', '08:00', '16:30', 'grantBathroom'],
    ['alfie', '2026-11-02', '08:00', '16:30', 'grantBathroom'],
  ];

  // Time off and training. They show on the lane and no booking can go over them.
  var absences = [
    { person: 'megan', day: TODAY, start: '15:30', end: '17:30', label: 'Holiday', note: 'Afternoon off' },
    { person: 'priya', day: '2026-11-06', start: '14:30', end: '17:30', label: 'Training', note: 'Gas reassessment, Gloucester' },
    { person: 'alfie', day: '2026-11-04', start: '13:30', end: '17:30', label: 'College', note: 'Plumbing NVQ, afternoon' },
  ];

  // Who leads a shared job (the others are crew).
  var leads = { grantBathroom: 'kieran', barnardRads: 'dan', okoroCombi: 'tom' };

  // Status of today's work at 10:12.
  var todayStatus = {
    whitlockService: 'COMPLETED', lakeService: 'COMPLETED', penneyStopcock: 'COMPLETED',
    fivemillsCp12: 'IN_PROGRESS', gouldRads: 'IN_PROGRESS', brooksBreakdown: 'IN_PROGRESS', grantBathroom: 'IN_PROGRESS',
  };

  // Jobs waiting to be scheduled (the tray).
  var tray = [
    { key: 'okaforCallout', title: 'No heating or hot water', client: 'okafor', type: 'heating', gas: true, mins: 90, urgent: true, note: 'Rang at 09:58. Boiler won’t fire, two young children at home.', created: TODAY, est: 18000 },
    { key: 'asheOverflow', title: 'Dripping overflow from loft tank', client: 'ashe', type: 'plumbing', mins: 60, note: 'Any day this week, works from home.', created: '2026-11-04', est: 12000 },
    { key: 'wildeService', title: 'Annual boiler service', client: 'wilde', type: 'heating', gas: true, mins: 60, note: 'Mornings only, dog in the kitchen.', created: '2026-11-03', est: 8500 },
    { key: 'ferrisHeaters', title: 'Quote visit: workshop heaters', client: 'ferris', type: 'visit', mins: 45, note: 'Gary would like it before the end of the month.', created: '2026-11-02', est: 0 },
  ];

  /*
   * Job sheets. 0415–0417 came in last night and wait for the office.
   */
  var sheets = [
    {
      no: '0417', job: 'barnardRads', date: '2026-11-04', status: 'COMPLETED', submitted: 'Wed 4 Nov, 14:06',
      crew: [{ id: 'dan', lead: true }, { id: 'alfie' }],
      work: 'Took out the single-panel radiators in the front and back bedrooms. Fitted 600 × 1000 double panels on new brackets, TRVs on the flow and lockshields on the return. The back bedroom tail was old 10 mm microbore and kinked, so we ran a new 15 mm tail along the skirting (told Helen before doing it, she was happy). Refilled, bled, added inhibitor, checked for leaks. Both rooms hot within 20 minutes.',
      parts: [
        ['Double panel radiator 600 × 1000 mm', 2, 11800],
        ['TRV and lockshield set, 15 mm', 2, 2450],
        ['Copper pipe 15 mm × 3 m', 1, 1500],
        ['Central heating inhibitor 1 L', 1, 1800],
        ['Fittings and sundries', 1, 1250],
      ],
      labour: [
        { id: 'dan', from: '08:15', to: '13:45', brk: 30 },
        { id: 'alfie', from: '08:15', to: '13:45', brk: 30 },
      ],
      photos: [
        { src: 'before', label: 'Before', caption: 'Back bedroom, old radiator' },
        { src: 'after', label: 'After', caption: 'Back bedroom, new double panel' },
        { src: 'pipe-run', label: 'Extra', caption: 'New 15 mm tail along the skirting' },
      ],
      signoff: { name: 'Helen Barnard', at: '13:52, Wed 4 Nov', note: 'Lovely job, thank you both. Much warmer already.' },
      planned: { mins: 300, parts: 31000, labour: 37350 },
      plannedNote: 'Extra 15 mm pipe run in the back bedroom: agreed with the customer on site.',
    },
    {
      no: '0416', job: 'kempTap', date: '2026-11-04', status: 'COMPLETED', submitted: 'Wed 4 Nov, 10:41',
      crew: [{ id: 'megan', lead: true }],
      work: 'Swapped the dripping kitchen mixer for a new monobloc. Old isolating valves were seized, so cut them out and fitted new ones on both hot and cold. Ran both for a few minutes, no leaks.',
      parts: [
        ['Kitchen sink mixer tap', 1, 8500],
        ['Isolating valve 15 mm', 2, 650],
      ],
      labour: [{ id: 'megan', from: '09:05', to: '10:35', brk: 0 }],
      photos: [],
      signoff: { name: 'Rosa Kemp', at: '10:38, Wed 4 Nov', note: '' },
      planned: { mins: 90, parts: 9800, labour: 7200 },
      plannedNote: '',
    },
    {
      no: '0415', job: 'ruddPressure', date: '2026-11-04', status: 'COMPLETED', submitted: 'Wed 4 Nov, 15:22',
      crew: [{ id: 'priya', lead: true }],
      work: 'Boiler dropping to 0.5 bar overnight. Pressure relief valve was letting by. Replaced the PRV, recharged the expansion vessel to 1 bar, repressurised to 1.3 bar. Booked a check for Friday morning.',
      parts: [
        ['Pressure relief valve', 1, 3800],
        ['Fittings and sundries', 1, 600],
      ],
      labour: [{ id: 'priya', from: '13:05', to: '15:05', brk: 0 }],
      photos: [],
      signoff: { name: 'James Rudd', at: '15:09, Wed 4 Nov', note: '' },
      planned: { mins: 120, parts: 4400, labour: 11000 },
      plannedNote: '',
    },
    {
      no: '0414', job: 'fivemillsCp12b', date: '2026-11-03', status: 'APPROVED', submitted: 'Tue 3 Nov, 11:48', approvedBy: 'Jo Lowe', approvedAt: 'Tue 3 Nov, 16:20',
      crew: [{ id: 'tom', lead: true }],
      work: 'Landlord gas safety checks on flats 1, 2 and 3. All appliances passed. Certificates emailed to Five Mills.',
      parts: [],
      fixed: [['Landlord gas safety certificate', 3, 7000]],
      labour: [{ id: 'tom', from: '09:00', to: '11:30', brk: 0 }],
      photos: [],
      signoff: { name: 'Owen Price', at: '11:40, Tue 3 Nov', note: '' },
      planned: { mins: 150, parts: 0, labour: 21000 },
      plannedNote: '',
    },
    {
      no: '0413', job: 'fenwickCistern', date: '2026-11-03', status: 'APPROVED', submitted: 'Tue 3 Nov, 15:12', approvedBy: 'Jo Lowe', approvedAt: 'Tue 3 Nov, 16:22',
      crew: [{ id: 'kieran', lead: true }],
      work: 'WC kept running. Fitted a new bottom-entry fill valve and adjusted the float.',
      parts: [['Bottom-entry fill valve', 1, 1450]],
      labour: [{ id: 'kieran', from: '14:00', to: '15:00', brk: 0 }],
      photos: [],
      signoff: { name: 'Lucy Fenwick', at: '15:05, Tue 3 Nov', note: '' },
      planned: { mins: 60, parts: 1450, labour: 4800 },
      plannedNote: '',
    },
    {
      no: '0411', job: null, title: 'Bathroom refit (day 1 of 5)', client: 'grant', date: '2026-11-02', status: 'REJECTED', submitted: 'Mon 2 Nov, 17:02',
      rejectReason: 'Missing Alfie’s hours. Please add them and send it back.',
      crew: [{ id: 'kieran', lead: true }, { id: 'alfie' }],
      work: 'Stripped out the old suite and tiles, capped off, first fix for the new shower valve.',
      parts: [], labour: [{ id: 'kieran', from: '08:00', to: '16:30', brk: 30 }], photos: [],
      signoff: null, planned: { mins: 480, parts: 0, labour: 0 }, plannedNote: '',
    },
  ];

  /*
   * Invoice history, generated from a fixed seed so every recording matches.
   * October is mostly paid, a few are still out, two are overdue.
   */
  function mulberry(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var rnd = mulberry(20261105);
  function pick(list) { return list[Math.floor(rnd() * list.length)]; }

  var kinds = [
    { title: 'Annual boiler service', who: ['tom', 'dan', 'priya'], lines: function () { return [['Annual boiler service (fixed price)', 1, 8500]]; } },
    { title: 'Landlord gas safety certificate', who: ['tom', 'priya'], lines: function () { var n = 1 + Math.floor(rnd() * 3); return [['Landlord gas safety certificate', n, 7000]]; } },
    { title: 'Boiler breakdown repair', who: ['dan', 'priya', 'tom'], lines: function (w) { var h = 1 + Math.floor(rnd() * 4) * 0.5; return [['Labour: ' + w.name, h, w.rate], [pick(['Diverter valve', 'Fan assembly', 'Ignition electrode', 'Pressure relief valve', 'Pump head']), 1, pick([3800, 6400, 9200, 12600, 14800])]]; } },
    { title: 'Radiator replacement', who: ['dan', 'priya'], lines: function (w) { var n = 1 + Math.floor(rnd() * 2); return [['Labour: ' + w.name, 2 + n, w.rate], ['Double panel radiator', n, pick([9600, 11800, 13400])], ['TRV and lockshield set, 15 mm', n, 2450]]; } },
    { title: 'Power flush and magnetic filter', who: ['dan', 'priya'], lines: function () { return [['Power flush, up to 10 radiators (fixed price)', 1, 42000], ['Magnetic system filter 22 mm', 1, 9500]]; } },
    { title: 'Leak repair', who: ['kieran', 'megan', 'megan'], lines: function (w) { return [['Labour: ' + w.name, pick([1, 1.5, 2]), w.rate], ['Fittings and sundries', 1, pick([850, 1450, 2200])]]; } },
    { title: 'Outside tap fitted', who: ['megan', 'kieran'], lines: function (w) { return [['Labour: ' + w.name, 1.5, w.rate], ['Outside tap kit with double check valve', 1, 3500]]; } },
    { title: 'Unvented cylinder service', who: ['tom', 'dan'], lines: function () { return [['Unvented cylinder service (fixed price)', 1, 14000]]; } },
  ];
  var histClients = ['lake', 'whitlock', 'penney', 'hale', 'fenwick', 'ashe', 'kemp', 'rudd', 'wilde', 'okoro', 'tait', 'gould', 'mehta', 'fivemills', 'dairy', 'ferris', 'brooks'];

  function addDays(iso, n) {
    var d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }
  function weekday(iso) { return new Date(iso + 'T12:00:00Z').getUTCDay(); }

  var history = [];
  var rota = ['dan', 'megan', 'priya', 'tom', 'dan', 'megan', 'priya'];
  var rotaAt = 0;
  var weekPool = ['patel', 'oconnor', 'hughes', 'carter', 'novak', 'baker', 'lewis', 'ward', 'ellwood', 'begum', 'morris', 'king', 'fox', 'reid', 'singh', 'dunn', 'grey', 'adeyemi', 'hall', 'quinn'];
  var weekUsed = ['kemp', 'rudd', 'barnard', 'fivemills', 'fenwick', 'grant', 'okafor', 'brooks', 'gould', 'hale', 'lake', 'whitlock', 'penney', 'dairy', 'tait', 'mehta', 'ferris', 'wilde', 'okoro', 'ashe'];
  var day = '2026-10-01';
  while (day < TODAY) {
    var wd = weekday(day);
    if (wd !== 0 && wd !== 6) {
      var thisWeek = day >= '2026-11-01';
      var count = !thisWeek ? 1 + Math.floor(rnd() * 3) : day === '2026-11-04' ? 4 : 7;
      for (var i = 0; i < count; i++) {
        var k, wid;
        if (thisWeek) {
          // Spread this week's finished work across the team so each day looks like a real day.
          wid = rota[rotaAt++ % rota.length];
          var fits = kinds.filter(function (kk) { return kk.who.indexOf(wid) >= 0; });
          k = pick(fits);
        } else {
          k = pick(kinds);
          wid = pick(k.who);
        }
        var w = team.find(function (t) { return t.id === wid; });
        var cl = pick(histClients);
        if (day >= '2026-11-01') {
          // This week: nobody gets two visits, and nobody already in the diary above.
          var free = weekPool.filter(function (c) { return weekUsed.indexOf(c) < 0; });
          cl = pick(free);
          weekUsed.push(cl);
        }
        history.push({ date: day, kind: k, worker: w, client: cl, lines: k.lines(w) });
      }
    }
    day = addDays(day, 1);
  }
  // A big one: the Okoro boiler deposit and a bathroom stage payment.
  history.push({ date: '2026-10-14', kind: { title: 'Combi boiler replacement: deposit' }, worker: team[0], client: 'okoro', lines: [['Deposit, 30% of quote QUO-20261008-002', 1, 78000]] });
  history.push({ date: '2026-10-09', kind: { title: 'Bathroom refit: first stage payment' }, worker: team[3], client: 'grant', lines: [['Stage payment 1 of 3, quote QUO-20260928-001', 1, 135000]] });
  history.sort(function (a, b) { return a.date < b.date ? -1 : 1; });

  // Which of them are not paid yet: the latest few, plus two overdue from early October.
  var methods = ['Bank transfer', 'Bank transfer', 'Bank transfer', 'Bank transfer', 'Bank transfer', 'Bank transfer', 'Bank transfer', 'Card', 'Card', 'Card', 'Card', 'Cash'];
  var invoices = [];
  var perDay = {};
  history.forEach(function (h, idx) {
    var d = h.date.replace(/-/g, '');
    perDay[d] = (perDay[d] || 0) + 1;
    var ref = 'INV-' + d + '-' + String(perDay[d]).padStart(3, '0');
    var due = addDays(h.date, company.terms);
    var inv = {
      ref: ref, client: h.client, title: h.kind.title, issued: h.date, due: due, lines: h.lines.map(function (l) { return { d: l[0], q: l[1], u: l[2] }; }),
      worker: h.worker.id, status: 'PAID', paid: null, method: null, sent: h.date,
    };
    var age = (Date.parse(TODAY) - Date.parse(h.date)) / 864e5;
    if (age <= 9 && rnd() < 0.85) inv.status = 'SENT';
    else {
      var lag = 1 + Math.floor(rnd() * 12);
      var paid = addDays(h.date, lag);
      if (weekday(paid) === 0) paid = addDays(paid, 1);
      if (weekday(paid) === 6) paid = addDays(paid, 2);
      if (paid >= TODAY) paid = addDays(TODAY, -1 - Math.floor(rnd() * 3));
      if (paid < h.date) paid = h.date;
      inv.paid = paid; inv.method = pick(methods);
    }
    invoices.push(inv);
  });
  // Two overdue ones (chased once already).
  ['lake', 'tait'].forEach(function (c, i) {
    var inv = invoices.filter(function (v) { return v.status === 'PAID' && v.issued < '2026-10-16'; })[3 + i * 4];
    if (inv) { inv.status = 'SENT'; inv.paid = null; inv.method = null; inv.client = c; inv.chased = '2026-11-02'; }
  });
  // One paid this morning, so the activity feed has it.
  var morning = invoices.filter(function (v) { return v.status === 'SENT' && v.issued >= '2026-10-20'; })[0];
  if (morning) { morning.status = 'PAID'; morning.paid = TODAY; morning.method = 'Bank transfer'; morning.paidAt = '09:40'; morning.client = 'fivemills'; morning.title = 'Landlord gas safety certificate'; morning.lines = [{ d: 'Landlord gas safety certificate', q: 2, u: 7000 }]; }

  var quotes = [
    { ref: 'QUO-20261104-001', client: 'wilde', title: 'Underfloor heating, kitchen extension', status: 'DRAFT', date: '2026-11-04', net: 284000 },
    { ref: 'QUO-20261102-002', client: 'mehta', title: 'New bathroom and boiler move', status: 'DRAFT', date: '2026-11-02', net: 0 },
    { ref: 'QUO-20261028-001', client: 'gould', title: 'Lounge radiator swap and TRVs', status: 'ACCEPTED', date: '2026-10-28', net: 46700 },
    { ref: 'QUO-20261027-002', client: 'barnard', title: 'Replace two bedroom radiators, fit TRVs', status: 'CONVERTED', date: '2026-10-27', net: 68350 },
    { ref: 'QUO-20261026-002', client: 'hale', title: 'Power flush and magnetic filter', status: 'CONVERTED', date: '2026-10-26', net: 51500 },
    { ref: 'QUO-20261026-001', client: 'dairy', title: 'Replace water heater under the counter', status: 'VIEWED', date: '2026-10-26', net: 61200 },
    { ref: 'QUO-20261021-002', client: 'tait', title: 'System boiler and unvented cylinder', status: 'SENT', date: '2026-10-21', net: 418000 },
    { ref: 'QUO-20261008-002', client: 'okoro', title: 'Combi boiler replacement', status: 'CONVERTED', date: '2026-10-08', net: 260000 },
    { ref: 'QUO-20260928-001', client: 'grant', title: 'Bathroom refit', status: 'CONVERTED', date: '2026-09-28', net: 405000 },
    { ref: 'QUO-20261001-004', client: 'brooks', title: 'Move radiator in the hallway', status: 'REJECTED', date: '2026-10-01', net: 38500 },
    { ref: 'QUO-20260915-002', client: 'whitlock', title: 'Smart thermostat and zone valves', status: 'EXPIRED', date: '2026-09-15', net: 54000 },
  ];

  var activity = [
    { t: '07:52', who: 'kieran', text: 'clocked on at Mr Grant’s bathroom, Brimscombe' },
    { t: '08:04', who: 'dan', text: 'started the boiler service at Ms Lake’s' },
    { t: '08:37', who: 'priya', text: 'on site at Ms Brooks’s: boiler losing pressure' },
    { t: '09:16', who: 'tom', text: 'finished the boiler service in Whiteshill' },
    { t: '09:40', who: null, text: 'Five Mills Lettings paid £168.00 by bank transfer', kind: 'money' },
    { t: '09:58', who: null, text: 'Grace Okafor rang: no heating or hot water', kind: 'alert' },
    { t: '10:05', who: 'dan', text: 'on site at the Goulds’: lounge radiator swap' },
  ];

  window.StampwellData = {
    TODAY: TODAY, NOW: NOW, company: company, user: user, team: team, clients: clients, types: types,
    jobsSeed: jobsSeed, diary: diary, leads: leads, todayStatus: todayStatus, tray: tray, sheets: sheets,
    invoices: invoices, quotes: quotes, activity: activity, absences: absences, hm: hm, addDays: addDays, weekday: weekday,
  };
})();
