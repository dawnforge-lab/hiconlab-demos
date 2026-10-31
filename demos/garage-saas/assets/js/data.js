/*
 * Liftbay demo data for Calder & Price Motors, Kendal.
 * Everything here is fictional. The board's cars are written by hand; October's
 * history and the bookings ahead are generated from a fixed seed so the
 * reports, invoices, vehicles and calendar all agree with each other.
 */
(function () {
  'use strict';

  var TODAY = '2026-10-29'; // Thursday
  var CLOCK_START = 10 * 60 + 41; // 10:41

  // ---- Seeded randomness ---------------------------------------------------
  var seed = 290126;
  function rnd() {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function pick(list) { return list[Math.floor(rnd() * list.length)]; }
  function int(a, b) { return a + Math.floor(rnd() * (b - a + 1)); }
  function weighted(pairs) {
    var total = pairs.reduce(function (s, p) { return s + p[1]; }, 0), r = rnd() * total;
    for (var i = 0; i < pairs.length; i++) { r -= pairs[i][1]; if (r <= 0) return pairs[i][0]; }
    return pairs[pairs.length - 1][0];
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function addDays(s, n) { var d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); }
  function dow(s) { return new Date(s + 'T12:00:00').getDay(); }
  function hm(min) { return pad(Math.floor(min / 60)) + ':' + pad(min % 60); }
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function shortDay(s) { var d = new Date(s + 'T12:00:00'); return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()]; }

  // ---- The garage ----------------------------------------------------------
  var company = {
    name: 'Calder & Price Motors',
    short: 'Calder & Price',
    town: 'Kendal',
    address: ['Unit 3, Fellgate Yard', 'Kendal', 'LA9 6QZ'],
    phone: '01632 960418',
    email: 'workshop@calderprice.example',
    vatNumber: 'GB 294 6610 27',
    companyNumber: '08814402',
    invoiceFooter: 'Thank you for choosing Calder & Price. Payment is due on collection unless agreed otherwise.',
    defaultMarkup: 25,
    vatRate: 20,
    openFrom: '08:00',
    openTo: '16:00',
    hoursPerDay: 8,
    ramps: 3,
    bookAhead: 42,
    onlineBookings: true,
    liftbaySince: '2026-10-01',
  };

  var team = [
    { id: 'ruth', name: 'Ruth Calder', role: 'Owner', email: 'ruth@calderprice.example', phone: '07700 900118' },
    { id: 'gareth', name: 'Gareth Price', role: 'Manager', email: 'gareth@calderprice.example', phone: '07700 900127' },
    { id: 'liam', name: 'Liam Hartley', role: 'Mechanic', email: 'liam@calderprice.example', phone: '07700 900143', mechanic: true },
    { id: 'kasia', name: 'Kasia Nowak', role: 'Mechanic', email: 'kasia@calderprice.example', phone: '07700 900156', mechanic: true },
    { id: 'josh', name: 'Josh Bell', role: 'Mechanic', email: 'josh@calderprice.example', phone: '07700 900162', mechanic: true },
  ];

  // Labour is priced as sold; parts are cost + markup.
  var services = [
    { name: 'General service', hours: 2, from: 120 },
    { name: 'Oil & filter', hours: 0.5, from: 45 },
    { name: 'Brakes', hours: 2, from: 60 },
    { name: 'Diagnostics', hours: 1, from: 60 },
    { name: 'Clutch & gearbox', hours: 6, from: 380 },
    { name: 'Cam belt', hours: 4, from: 220 },
    { name: 'Suspension', hours: 3, from: 90 },
    { name: 'Tyres & bearings', hours: 1, from: 30 },
    { name: 'AC & heating', hours: 1, from: 75 },
    { name: 'Electrical & battery', hours: 1.5, from: 60 },
    { name: 'Commercial van', hours: 3, from: 180 },
    { name: 'Seasonal check', hours: 0.5, from: 25 },
  ];
  function hoursOf(name) { var s = services.find(function (x) { return x.name === name; }); return s ? s.hours : 1; }

  var waitReasons = ['Waiting for parts', "Owner's decision", "Waiting for the client's OK", 'Waiting for another job'];

  // ---- Clients and vehicles on today's board (written by hand) -------------
  var clients = {};
  var vehicles = {};
  function client(id, c) { c.id = id; clients[id] = c; return id; }
  function vehicle(v) { vehicles[v.plate] = v; return v.plate; }

  client('c-keogh', { name: 'Martin Keogh', phone: '07700 900211', email: 'martin.keogh@example.co.uk', type: 'private' });
  client('c-wainwright', { name: 'Sophie Wainwright', phone: '07700 900224', email: 'sophie.w@example.co.uk', type: 'private', noShows: 1 });
  client('c-robson', { name: 'Ellie Robson', phone: '07700 900237', email: '', type: 'private' });
  client('c-hendry', { name: 'Paul Hendry', phone: '07700 900248', email: 'paul.hendry@example.co.uk', type: 'private' });
  client('c-fothergill', { name: 'Dave Fothergill', phone: '07700 900259', email: 'dave.fothergill@example.co.uk', type: 'private' });
  client('c-northfell', { name: 'Rob Allonby', company: 'Northfell Plumbing Ltd', phone: '01632 960733', email: 'accounts@northfellplumbing.example', type: 'business', termsDays: 30, vatNumber: 'GB 318 2204 61', address: ['14 Station Yard', 'Burneside', 'LA9 6QA'] });
  client('c-tyson', { name: 'Graham Tyson', phone: '07700 900263', email: 'g.tyson@example.co.uk', type: 'private' });
  client('c-dixon', { name: 'Carol Dixon', phone: '07700 900271', email: 'carol.dixon@example.co.uk', type: 'private' });
  client('c-marsh', { name: 'Helen Marsh', phone: '07700 900412', email: 'helen.marsh@example.co.uk', emails: ['helen.marsh@example.co.uk', 'h.marsh.work@example.co.uk'], type: 'private' });
  client('c-qureshi', { name: 'Imran Qureshi', phone: '07700 900286', email: 'imran.q@example.co.uk', type: 'private' });
  client('c-bland', { name: 'Stuart Bland', phone: '07700 900295', email: 'stuart.bland@example.co.uk', type: 'private' });
  client('c-lister', { name: 'Joanne Lister', phone: '07700 900304', email: 'jo.lister@example.co.uk', type: 'private' });
  client('c-kentdale', { name: 'Nina Moss', company: 'Kentdale Couriers Ltd', phone: '01632 960781', email: 'office@kentdalecouriers.example', type: 'business', termsDays: 14, vatNumber: 'GB 402 7719 08', address: ['Unit 9, Riverside Works', 'Kendal', 'LA9 7DH'] });

  vehicle({ plate: 'LK19 XRT', make: 'Skoda', model: 'Octavia Estate', year: 2019, colour: 'Moon white', mileage: 58210, vin: 'TMBJG7NE4K0187342', motDue: '2027-03-14', serviceDue: '2026-11-20', clientId: 'c-keogh',
    history: [{ date: '2025-11-06', service: 'General service', mileage: 49870, total: 228.6, note: 'Rear wiper blade replaced' }, { date: '2024-11-12', service: 'General service', mileage: 41020, total: 216.0 }] });
  vehicle({ plate: 'YD21 HBN', make: 'Hyundai', model: 'Tucson', year: 2021, colour: 'Phantom black', mileage: 33480, vin: 'TMAJ381AAMJ104529', motDue: '2027-04-02', serviceDue: '2027-01-15', clientId: 'c-wainwright',
    history: [{ date: '2026-09-17', service: 'Diagnostics', mileage: 33120, total: 0, note: 'No-show' }] });
  vehicle({ plate: 'KM14 OWD', make: 'Fiat', model: '500 Lounge', year: 2014, colour: 'Pastel blue', mileage: 71950, vin: 'ZFA31200000941867', motDue: '2027-01-21', serviceDue: '2026-12-01', clientId: 'c-robson', history: [] });
  vehicle({ plate: 'FJ70 KDN', make: 'Mazda', model: 'CX-5', year: 2020, colour: 'Soul red', mileage: 28770, vin: 'JMZKF6W1A00835721', motDue: '2027-09-30', serviceDue: '2027-02-10', clientId: 'c-hendry', history: [] });
  vehicle({ plate: 'MA17 PLV', make: 'Ford', model: 'Focus Zetec', year: 2017, colour: 'Magnetic grey', mileage: 68400, vin: 'WF05XXGCC5HK61839', motDue: '2027-05-09', serviceDue: '2027-02-28', clientId: 'c-fothergill',
    history: [{ date: '2026-02-26', service: 'Interim service', mileage: 64950, total: 85.0 }, { date: '2025-05-02', service: 'Brakes', mileage: 59310, total: 196.5, note: 'Front pads' }] });
  vehicle({ plate: 'BV20 KTE', make: 'Volkswagen', model: 'Golf Life', year: 2020, colour: 'Indium grey', mileage: 41200, vin: 'WVWZZZCDZLW062713', motDue: '2027-06-18', serviceDue: '2026-10-29', clientId: 'c-northfell',
    history: [{ date: '2025-10-23', service: 'General service', mileage: 30960, total: 187.5 }] });
  vehicle({ plate: 'WR16 ZNA', make: 'Vauxhall', model: 'Astra SRi', year: 2016, colour: 'Sovereign silver', mileage: 92800, vin: 'W0LBF6EC6GG048173', motDue: '2027-01-08', serviceDue: '2026-12-15', clientId: 'c-tyson',
    history: [{ date: '2026-01-14', service: 'Cam belt', mileage: 88140, total: 365.0, note: 'Belt kit and water pump' }] });
  vehicle({ plate: 'HN13 BXU', make: 'Land Rover', model: 'Freelander 2', year: 2013, colour: 'Fuji white', mileage: 118650, vin: 'SALFA2BB4DH318406', motDue: '2027-02-27', serviceDue: '2026-11-30', clientId: 'c-dixon',
    history: [{ date: '2026-04-09', service: 'General service', mileage: 113200, total: 241.8 }, { date: '2025-03-20', service: 'Brakes', mileage: 106480, total: 312.0, note: 'Discs and pads, front' }] });
  vehicle({ plate: 'SF18 UVC', make: 'Toyota', model: 'Yaris Icon', year: 2018, colour: 'Tokyo red', mileage: 38410, vin: 'VNKKG3D370A274186', motDue: '2027-03-29', serviceDue: '2027-03-12', clientId: 'c-marsh',
    history: [{ date: '2026-03-12', service: 'Interim service', mileage: 35020, total: 85.0 }, { date: '2025-03-04', service: 'Brakes', mileage: 30660, total: 186.0, note: 'Rear shoes and drums' }] });
  vehicle({ plate: 'DA66 RFK', make: 'Kia', model: "Cee'd 2", year: 2016, colour: 'Graphite', mileage: 77320, vin: 'U5YHN516AHL390561', motDue: '2027-08-11', serviceDue: '2027-04-29', clientId: 'c-qureshi',
    history: [{ date: '2025-10-30', service: 'Oil & filter', mileage: 69850, total: 89.0 }] });
  vehicle({ plate: 'NX15 FJD', make: 'BMW', model: '320d SE', year: 2015, colour: 'Alpine white', mileage: 121000, vin: 'WBA8E51060K382915', motDue: '2027-06-03', serviceDue: '2027-01-20', clientId: 'c-bland',
    history: [{ date: '2024-08-22', service: 'Cam belt', mileage: 104300, total: 365.0, note: 'Timing chain inspected' }] });
  vehicle({ plate: 'PE68 RXA', make: 'Nissan', model: 'Qashqai N-Connecta', year: 2018, colour: 'Pearl white', mileage: 52640, vin: 'SJNFAAJ11U2563408', motDue: '2027-09-14', serviceDue: '2027-05-01', clientId: 'c-lister',
    history: [{ date: '2026-05-21', service: 'General service', mileage: 49300, total: 204.5 }] });
  vehicle({ plate: 'PO22 CVW', make: 'Ford', model: 'Transit Custom', year: 2022, colour: 'Frozen white', mileage: 48820, vin: 'WF0YXXTTGYNR52817', motDue: '2027-04-30', serviceDue: '2027-01-05', clientId: 'c-kentdale', history: [] });

  function line(id, title, cat, qty, cost, markup, extra) {
    var l = { id: id, title: title, cat: cat, qty: qty, cost: cost, markup: markup == null ? (cat === 'part' ? 25 : 0) : markup, invoiceId: null };
    if (extra) for (var k in extra) l[k] = extra[k];
    return l;
  }

  // ---- Today's board -------------------------------------------------------
  var jobs = [
    { id: 'lk19', plate: 'LK19 XRT', service: 'Brakes', status: 'new', date: TODAY, time: '10:30', estHours: 2, mechanic: null,
      problem: 'Front brakes squeal when slowing down, worse in the wet. Pedal feels normal.', createdAt: '2026-10-22',
      items: [], parts: [], notes: [], officeNotes: [{ by: 'gareth', at: '2026-10-22T14:12', text: 'Booked by phone. Happy to wait in reception, wants it back by 1.' }] },
    { id: 'yd21', plate: 'YD21 HBN', service: 'Diagnostics', status: 'new', date: TODAY, time: '13:00', estHours: 1, mechanic: null,
      problem: 'Engine warning light came on at the weekend. Feels a bit flat going up Shap.', createdAt: '2026-10-26',
      items: [], parts: [], notes: [], officeNotes: [{ by: 'gareth', at: '2026-10-26T09:40', text: 'Missed her slot in September. Rang to confirm this one: she will be here.' }] },
    { id: 'km14', plate: 'KM14 OWD', service: 'Electrical & battery', status: 'new', date: TODAY, time: null, estHours: 1.5, mechanic: null, walkIn: true,
      arrivedAt: TODAY + 'T09:40', problem: "Wouldn't start this morning, needed a jump from a neighbour. Dashboard flickers.", createdAt: TODAY,
      items: [], parts: [], notes: [], officeNotes: [{ by: 'gareth', at: TODAY + 'T09:42', text: 'Walk-in. Told her we’d fit it in after the 10:30 brakes job. She’s happy to wait in town.' }] },
    { id: 'fj70', plate: 'FJ70 KDN', service: 'Seasonal check', status: 'new', date: TODAY, time: '14:30', estHours: 0.5, mechanic: null, online: true,
      reviewNote: 'Booked online: the mileage given (8,770) is lower than at the last visit. Check with the client.',
      problem: 'Winter check before we drive to Scotland at Christmas.', createdAt: '2026-10-27',
      items: [], parts: [], notes: [], officeNotes: [] },

    { id: 'ma17', plate: 'MA17 PLV', service: 'Electrical & battery', status: 'in_progress', date: TODAY, time: '09:00', estHours: 1.5,
      mechanic: 'liam', ramp: 1, onRamp: true, rampStartedAt: TODAY + 'T09:05', arrivedAt: TODAY + 'T08:47',
      problem: 'Battery goes flat if the car sits for a couple of days. Fine when driven daily.', createdAt: '2026-10-20',
      items: [line('ma17-1', 'Diagnostic time: battery drain test', 'labour', 1, 60)],
      parts: [{ id: 'p-ma17-1', name: 'Battery 70Ah (096)', qty: 1, note: 'Old one tests at 58% health', status: 'requested', requestedBy: 'liam', at: TODAY + 'T10:24' }],
      notes: [{ by: 'liam', at: TODAY + 'T10:20', text: 'Draw of about 120 mA with everything off, traced to the radio circuit. Pulling the fuse brings it to 20 mA. Battery is weak too.' }],
      officeNotes: [] },
    { id: 'bv20', plate: 'BV20 KTE', service: 'General service', status: 'in_progress', date: TODAY, time: '09:30', estHours: 2,
      mechanic: 'kasia', ramp: 2, onRamp: true, rampStartedAt: TODAY + 'T09:34', arrivedAt: TODAY + 'T09:22',
      problem: 'Annual service on the company car. The driver says it pulls slightly to the left.', createdAt: '2026-10-15',
      items: [line('bv20-1', 'General service', 'labour', 1, 120), line('bv20-2', 'Oil filter', 'part', 1, 8.4), line('bv20-3', '5W-30 engine oil, 1 litre', 'part', 5, 7.2), line('bv20-4', 'Air filter', 'part', 1, 12)],
      parts: [], notes: [{ by: 'kasia', at: TODAY + 'T10:05', text: 'Tracking slightly out on the nearside. Checking tyre wear before quoting an alignment.' }], officeNotes: [{ by: 'gareth', at: '2026-10-15T11:02', text: 'Northfell account, 30-day terms. Send the invoice to accounts.' }] },

    { id: 'wr16', plate: 'WR16 ZNA', service: 'Suspension', status: 'waiting_parts', date: '2026-10-27', time: '08:30', estHours: 3,
      mechanic: 'liam', ramp: null, onRamp: false, arrivedAt: '2026-10-27T08:24', waitReason: '2 parts on order',
      problem: 'Clunk from the back over speed bumps, getting louder.', createdAt: '2026-10-21',
      items: [line('wr16-1', 'Replace rear shock absorbers (pair)', 'labour', 1, 90), line('wr16-2', 'Rear shock absorber', 'part', 2, 42)],
      parts: [{ id: 'p-wr16-1', name: 'Rear shock absorber', qty: 2, note: 'Ordered from Lakeland Motor Factors, due Fri 30 Oct', status: 'ordered', requestedBy: 'liam', at: '2026-10-27T10:10', eta: 'Fri 30 Oct' }],
      notes: [{ by: 'liam', at: '2026-10-27T10:05', text: 'Both rear shocks leaking. Top mounts are fine.' }], officeNotes: [] },
    { id: 'hn13', plate: 'HN13 BXU', service: 'Clutch & gearbox', status: 'waiting_parts', date: '2026-10-23', time: '08:00', estHours: 6,
      mechanic: 'kasia', ramp: null, onRamp: false, arrivedAt: '2026-10-23T07:58', waitReason: "Waiting for the client's OK",
      problem: 'Clutch slipping on hills, smell of burning after the school run.', createdAt: '2026-10-19',
      items: [line('hn13-1', 'Inspection and quote: clutch', 'labour', 1, 60)],
      parts: [], notes: [{ by: 'kasia', at: '2026-10-23T12:30', text: 'Clutch worn to the rivets, flywheel scored. Quote: clutch kit with DMF £525 + labour £380. Mrs Dixon to call back.' }],
      officeNotes: [{ by: 'gareth', at: '2026-10-26T16:20', text: 'Left a voicemail with the quote. She is checking with her son.' }] },

    { id: 'sf18', plate: 'SF18 UVC', service: 'Tyres & bearings', status: 'ready', date: TODAY, time: '08:30', estHours: 1,
      mechanic: 'josh', ramp: null, onRamp: false, arrivedAt: TODAY + 'T08:26', readyAt: TODAY + 'T09:58',
      problem: 'Both front tyres near the limit. Wants the same make as the rears if possible.', createdAt: '2026-10-23',
      items: [line('sf18-1', 'Tyre fitting and balancing', 'labour', 2, 30), line('sf18-2', 'Tyre 185/65 R15 88H (Falken)', 'part', 2, null, 25, { needsPrice: true, addedBy: 'josh' })],
      parts: [{ id: 'p-sf18-1', name: 'Tyre 185/65 R15 88H', qty: 2, note: 'From stock', status: 'arrived', requestedBy: 'josh', at: '2026-10-27T15:10' }],
      notes: [{ by: 'josh', at: TODAY + 'T09:55', text: 'Fitted two Falkens from stock, balanced, pressures set to 33 psi. Rears have 5 mm left.' }], officeNotes: [] },
    { id: 'da66', plate: 'DA66 RFK', service: 'Oil & filter', status: 'ready', date: TODAY, time: '08:00', estHours: 0.5,
      mechanic: 'kasia', ramp: null, onRamp: false, arrivedAt: TODAY + 'T07:55', readyAt: TODAY + 'T09:05',
      problem: 'Oil and filter before a long drive to Cardiff.', createdAt: '2026-10-26',
      items: [line('da66-1', 'Oil and filter service', 'labour', 1, 45), line('da66-2', 'Oil filter', 'part', 1, 8), line('da66-3', '5W-30 engine oil, 1 litre', 'part', 4, 7.2)],
      parts: [], notes: [], officeNotes: [] },

    { id: 'nx15', plate: 'NX15 FJD', service: 'Brakes', status: 'delivered', date: '2026-10-28', time: '08:00', estHours: 2,
      mechanic: 'liam', ramp: null, onRamp: false, arrivedAt: '2026-10-28T07:52', readyAt: '2026-10-28T15:40', deliveredAt: TODAY + 'T09:20',
      problem: 'Brake pedal feels soft and goes nearly to the floor.', createdAt: '2026-10-23',
      items: [line('nx15-1', 'Replace front discs and pads, bleed system', 'labour', 1, 110), line('nx15-2', 'Front brake discs (pair)', 'part', 1, 64), line('nx15-3', 'Front brake pads (set)', 'part', 1, 32)],
      parts: [], notes: [{ by: 'liam', at: '2026-10-28T13:15', text: 'Fluid was dark and full of moisture. Pedal firm after bleeding.' }], officeNotes: [] },
    { id: 'pe68', plate: 'PE68 RXA', service: 'AC & heating', status: 'delivered', date: TODAY, time: '08:00', estHours: 1,
      mechanic: 'josh', ramp: null, onRamp: false, arrivedAt: TODAY + 'T08:02', readyAt: TODAY + 'T09:30', deliveredAt: TODAY + 'T10:05',
      problem: 'Air con blowing warm and the windscreen mists up.', createdAt: '2026-10-21',
      items: [line('pe68-1', 'Air con regas and leak test', 'labour', 1, 75), line('pe68-2', 'Cabin pollen filter', 'part', 1, 14)],
      parts: [], notes: [], officeNotes: [] },
  ];

  function weekendOnline(j) { var w = dow(j.createdAt); if ((w === 0 || w === 6) && !j.walkIn) j.online = true; }
  jobs.forEach(function (j) {
    weekendOnline(j);
    var v = vehicles[j.plate];
    j.clientId = v.clientId;
    j.mileage = v.mileage;
    j.ramp = j.ramp || null; j.onRamp = !!j.onRamp;
    j.walkIn = !!j.walkIn; j.fitIn = !!j.fitIn; j.noCharge = false;
    j.arrivedAt = j.arrivedAt || null; j.deliveredAt = j.deliveredAt || null;
    j.invoiceIds = [];
  });

  // ---- October history (generated) ----------------------------------------
  var FIRST = ['Andrew', 'Sarah', 'Ian', 'Claire', 'Mark', 'Rachel', 'Peter', 'Emma', 'Neil', 'Jane', 'Chris', 'Laura', 'Simon', 'Kate', 'Steven', 'Hannah', 'Paul', 'Lucy', 'Gary', 'Amy', 'Adam', 'Zoe', 'Mohammed', 'Aisha', 'Tomasz', 'Agnieszka', 'Rhys', 'Fiona', 'Callum', 'Bethan', 'Dean', 'Nicola', 'Alan', 'Gemma', 'Kevin', 'Margaret', 'Phil', 'Sian', 'Karl', 'Ruby'];
  var LAST = ['Atkinson', 'Bainbridge', 'Birkett', 'Brockbank', 'Gaskell', 'Harrison', 'Hodgson', 'Holme', 'Jackson', 'Kirkby', 'Lowther', 'Metcalfe', 'Nicholson', 'Postlethwaite', 'Raine', 'Robinson', 'Sharp', 'Steele', 'Thwaites', 'Walker', 'Wilson', 'Kowalski', 'Ahmed', 'Patel', 'Hughes', 'Carr', 'Proctor', 'Airey', 'Benson', 'Fleming', 'Gibson', 'Mason', 'Park', 'Rigg', 'Slater', 'Wren'];
  var CARS = [
    ['Ford', 'Fiesta', 2012, 2021], ['Ford', 'Focus', 2013, 2021], ['Ford', 'Kuga', 2015, 2022], ['Vauxhall', 'Corsa', 2011, 2021], ['Vauxhall', 'Astra', 2012, 2020],
    ['Volkswagen', 'Golf', 2012, 2022], ['Volkswagen', 'Polo', 2013, 2021], ['Toyota', 'Yaris', 2012, 2022], ['Toyota', 'RAV4', 2014, 2021], ['Toyota', 'Auris', 2013, 2018],
    ['Nissan', 'Qashqai', 2014, 2022], ['Nissan', 'Juke', 2013, 2020], ['Kia', 'Sportage', 2014, 2022], ['Kia', 'Picanto', 2013, 2021], ['Hyundai', 'i30', 2013, 2021],
    ['Hyundai', 'i10', 2014, 2021], ['Skoda', 'Octavia', 2013, 2022], ['Skoda', 'Fabia', 2012, 2021], ['Peugeot', '208', 2013, 2022], ['Peugeot', '3008', 2016, 2022],
    ['Citroën', 'C3', 2013, 2021], ['Renault', 'Clio', 2013, 2021], ['Honda', 'Jazz', 2011, 2020], ['Honda', 'CR-V', 2013, 2020], ['Mazda', '3', 2014, 2021],
    ['BMW', '1 Series', 2013, 2020], ['Audi', 'A3', 2013, 2021], ['Mercedes-Benz', 'A-Class', 2014, 2021], ['Mini', 'Cooper', 2012, 2021], ['Volvo', 'XC60', 2014, 2021],
    ['Dacia', 'Duster', 2015, 2022], ['Subaru', 'Forester', 2012, 2020], ['Subaru', 'Outback', 2013, 2019], ['Suzuki', 'Swift', 2013, 2021],
  ];
  var VANS = [['Ford', 'Transit Custom', 2016, 2022], ['Volkswagen', 'Transporter', 2015, 2021], ['Vauxhall', 'Vivaro', 2016, 2021]];
  var COLOURS = ['Grey', 'Silver', 'Black', 'White', 'Blue', 'Red', 'Dark green', 'Bronze'];
  var AREA = [['PN', 4], ['PO', 4], ['PK', 3], ['PF', 3], ['PX', 3], ['PY', 2], ['PE', 2], ['MA', 2], ['MW', 1], ['NA', 1], ['YH', 1], ['LR', 1], ['SN', 1], ['DK', 1]];
  var LETTERS = 'ABCDEFGHJKLMNOPRSTUVWXY';
  var usedPlates = {}; Object.keys(vehicles).forEach(function (p) { usedPlates[p] = 1; });
  var phoneN = 320;

  function makePlate(year) {
    for (;;) {
      var half = rnd() < 0.5 ? 0 : 50;
      var age = pad((year - 2000 + half) % 100);
      var p = weighted(AREA) + age + ' ' + pick(LETTERS) + pick(LETTERS) + pick(LETTERS);
      if (!usedPlates[p]) { usedPlates[p] = 1; return p; }
    }
  }
  function vin() { var c = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789', s = ''; for (var i = 0; i < 17; i++) s += c[int(0, c.length - 1)]; return s; }
  function futureDate(minDays, maxDays) { return addDays(TODAY, int(minDays, maxDays)); }

  var businessPool = ['c-northfell', 'c-kentdale'];
  function newClientAndVehicle(isVan) {
    var cid;
    if (isVan) {
      cid = pick(businessPool);
    } else {
      var f = pick(FIRST), l = pick(LAST);
      cid = 'c-g' + Object.keys(clients).length;
      clients[cid] = { id: cid, name: f + ' ' + l, phone: '07700 900' + String(phoneN++).padStart(3, '0'), email: (f + '.' + l).toLowerCase() + '@example.co.uk', type: 'private' };
    }
    var car = isVan ? pick(VANS) : pick(CARS);
    var year = int(car[2], car[3]);
    var miles = Math.round(((2026 - year) * int(6800, 10400) + int(0, 4000)) / 10) * 10;
    var hist = [];
    if (rnd() < 0.55) hist.push({ date: addDays('2025-10-15', -int(0, 300)), service: pick(['General service', 'Oil & filter', 'Brakes', 'Tyres & bearings']), mileage: miles - int(5000, 9000), total: pick([85, 89, 186.5, 204.5, 196, 145]) });
    var v = { plate: makePlate(year), make: car[0], model: car[1], year: year, colour: pick(COLOURS), mileage: miles, vin: vin(), motDue: futureDate(30, 330), serviceDue: futureDate(10, 300), clientId: cid, history: hist };
    vehicles[v.plate] = v;
    return v;
  }

  // Each service's invoice lines. Labour: [title, 'labour', qty, price]; parts: [title, 'part', qty, cost].
  var TEMPLATES = {
    'General service': [[['General service', 'labour', 1, 120], ['Oil filter', 'part', 1, 8.4], ['5W-30 engine oil, 1 litre', 'part', 5, 7.2], ['Air filter', 'part', 1, 12]],
                        [['General service', 'labour', 1, 120], ['Oil filter', 'part', 1, 8.4], ['5W-30 engine oil, 1 litre', 'part', 5, 7.2], ['Air filter', 'part', 1, 12], ['Wiper blades (pair)', 'part', 1, 16]]],
    'Oil & filter': [[['Oil and filter service', 'labour', 1, 45], ['Oil filter', 'part', 1, 8], ['5W-30 engine oil, 1 litre', 'part', 4, 7.2]]],
    'Brakes': [[['Replace front discs and pads', 'labour', 1, 110], ['Front brake discs (pair)', 'part', 1, 64], ['Front brake pads (set)', 'part', 1, 32]],
               [['Replace rear pads', 'labour', 1, 60], ['Rear brake pads (set)', 'part', 1, 28]],
               [['Brake fluid change', 'labour', 1, 55], ['DOT 4 brake fluid, 1 litre', 'part', 1, 9.6]]],
    'Diagnostics': [[['Diagnostic time', 'labour', 1, 60]], [['Diagnostic time', 'labour', 1, 60], ['Ignition coil pack', 'part', 1, 38], ['Fit coil pack', 'labour', 1, 30]]],
    'Clutch & gearbox': [[['Replace clutch and flywheel', 'labour', 1, 380], ['Clutch kit with dual-mass flywheel', 'part', 1, 420]]],
    'Cam belt': [[['Replace cam belt and water pump', 'labour', 1, 220], ['Cam belt kit with water pump', 'part', 1, 145]]],
    'Suspension': [[['Replace rear shock absorbers (pair)', 'labour', 1, 90], ['Rear shock absorber', 'part', 2, 42]], [['Replace front coil spring', 'labour', 1, 85], ['Front coil spring', 'part', 1, 36]]],
    'Tyres & bearings': [[['Tyre fitting and balancing', 'labour', 2, 30], ['Tyre 205/55 R16', 'part', 2, 61]], [['Tyre fitting and balancing', 'labour', 4, 30], ['Tyre 195/65 R15', 'part', 4, 54]], [['Replace front wheel bearing', 'labour', 1, 95], ['Wheel bearing kit', 'part', 1, 44]]],
    'AC & heating': [[['Air con regas and leak test', 'labour', 1, 75], ['Cabin pollen filter', 'part', 1, 14]]],
    'Electrical & battery': [[['Battery test and fit', 'labour', 1, 30], ['Battery 60Ah (075)', 'part', 1, 82]], [['Diagnostic time', 'labour', 1, 60], ['Alternator (reconditioned)', 'part', 1, 128], ['Fit alternator', 'labour', 1, 90]]],
    'Commercial van': [[['Van service', 'labour', 1, 180], ['Oil filter', 'part', 1, 11], ['5W-30 engine oil, 1 litre', 'part', 7, 7.2], ['Fuel filter', 'part', 1, 24]]],
    'Seasonal check': [[['Winter check', 'labour', 1, 25]]],
  };
  var SERVICE_MIX = [['General service', 22], ['Oil & filter', 14], ['Brakes', 14], ['Diagnostics', 10], ['Tyres & bearings', 12], ['Suspension', 6], ['Electrical & battery', 7], ['AC & heating', 4], ['Cam belt', 4], ['Clutch & gearbox', 2], ['Commercial van', 3], ['Seasonal check', 4]];
  var PROBLEMS = {
    'General service': ['Annual service, due by the book.', 'Service and a look at the wipers.', 'Service before the MOT next month.'],
    'Oil & filter': ['Oil and filter, nothing else wrong.', 'Oil change between services.'],
    'Brakes': ['Grinding from the front when braking.', 'Brake warning light on the dash.', 'Squeal from the back wheels.'],
    'Diagnostics': ['Engine light on, car feels lumpy at idle.', 'Judders when pulling away.', 'Warning light came on on the motorway.'],
    'Clutch & gearbox': ['Clutch biting very high, hard to get into gear.'],
    'Cam belt': ['Cam belt due by mileage.'],
    'Suspension': ['Knocking over bumps on the passenger side.', 'Car rolls a lot on corners.'],
    'Tyres & bearings': ['Two tyres near the limit.', 'Humming noise that gets louder with speed.', 'Puncture that keeps going down.'],
    'AC & heating': ['Air con not cold.', 'Heater only blows cold air.'],
    'Electrical & battery': ["Slow to start on cold mornings.", 'Battery light flickering when driving.'],
    'Commercial van': ['Van service, it does a lot of short runs.'],
    'Seasonal check': ['Winter check before the cold sets in.'],
  };

  var invoices = [];
  var history = []; // finished, no-show and cancelled jobs from October
  var invNo = 0;
  function round2(n) { return Math.round(n * 100 + 1e-9) / 100; }
  function unitPrice(l) { return l.cost == null ? null : round2(l.cost * (1 + (l.markup || 0) / 100)); }
  function lineTotal(l) { var u = unitPrice(l); return u == null ? null : round2(u * l.qty); }
  function totalsOf(lines) {
    var sub = round2(lines.reduce(function (s, l) { return s + (lineTotal(l) || 0); }, 0));
    var vat = round2(sub * 0.2);
    return { sub: sub, vat: vat, total: round2(sub + vat) };
  }

  function issueInvoice(job, at, opts) {
    invNo++;
    var number = 'INV-2026-' + String(invNo).padStart(4, '0');
    var lines = job.items.filter(function (l) { return !l.invoiceId; });
    var t = totalsOf(lines);
    var cl = clients[job.clientId];
    var inv = { id: 'inv-' + invNo, number: number, jobId: job.id, plate: job.plate, clientId: job.clientId, issuedAt: at,
      lines: lines.map(function (l) { return { title: l.title, cat: l.cat, qty: l.qty, unit: unitPrice(l), total: lineTotal(l) }; }),
      sub: t.sub, vat: t.vat, total: t.total, sends: [], paidAt: null, paidBy: null, dueDate: null };
    lines.forEach(function (l) { l.invoiceId = inv.id; });
    if (cl.email && opts.email !== false) inv.sends.push({ to: cl.email, at: opts.emailAt || at });
    if (cl.type === 'business' && cl.termsDays) inv.dueDate = addDays(at.slice(0, 10), cl.termsDays);
    if (opts.paidAt) { inv.paidAt = opts.paidAt; inv.paidBy = opts.paidBy || 'Card'; }
    invoices.push(inv);
    job.invoiceIds.push(inv.id);
    return inv;
  }

  var octDays = [];
  for (var d = '2026-10-01'; d < TODAY; d = addDays(d, 1)) { var w = dow(d); if (w > 0 && w < 6) octDays.push(d); }
  // 89 invoices across 20 working days: nine days of five jobs, eleven of four.
  var fives = octDays.slice().sort(function () { return rnd() - 0.5; }).slice(0, 9);
  var noShowDays = ['2026-10-06', '2026-10-15', '2026-10-21'];
  var cancelDays = ['2026-10-02', '2026-10-09', '2026-10-19', '2026-10-26'];
  var mechanics = ['liam', 'kasia', 'josh'];
  var slots = [480, 480, 510, 540, 570, 600, 660, 720, 780, 840];
  var hj = 0;

  octDays.forEach(function (day) {
    var n = fives.indexOf(day) >= 0 ? 5 : 4;
    var times = slots.slice().sort(function () { return rnd() - 0.5; }).slice(0, n).sort(function (a, b) { return a - b; });
    for (var i = 0; i < n; i++) {
      var service = weighted(SERVICE_MIX);
      var forced = day === '2026-10-08' && i === 0; // Kentdale's van: on 14-day terms and now overdue
      if (forced) service = 'Commercial van';
      var isVan = service === 'Commercial van';
      var v = forced ? vehicles['PO22 CVW'] : (rnd() < 0.12 && history.length > 6) ? vehicles[pick(history).plate] : newClientAndVehicle(isVan);
      if (isVan && clients[v.clientId].type !== 'business') v = newClientAndVehicle(true);
      var tpl = pick(TEMPLATES[service]);
      var start = times[i];
      var est = hoursOf(service);
      var finish = Math.min(start + Math.round(est * 60) + int(5, 70), 16 * 60 + 20);
      var mech = mechanics[(hj + i) % 3];
      if (rnd() < 0.25) mech = pick(mechanics);
      var job = { id: 'h' + (++hj), plate: v.plate, clientId: v.clientId, service: service, status: 'delivered', date: day, time: hm(start),
        estHours: est, mechanic: mech, ramp: 1 + ((hj + i) % 3), onRamp: false, mileage: v.mileage - int(0, 400),
        arrivedAt: day + 'T' + hm(start - int(2, 12)), deliveredAt: day + 'T' + hm(Math.min(finish + int(20, 90), 17 * 60 + 15)), readyAt: day + 'T' + hm(finish),
        problem: pick(PROBLEMS[service]), createdAt: addDays(day, -int(1, 12)), walkIn: rnd() < 0.08, fitIn: false, noCharge: false,
        items: tpl.map(function (t, k) { return line('h' + hj + '-' + k, t[0], t[1], t[2], t[3]); }), parts: [], notes: [], officeNotes: [], invoiceIds: [], rampHours: round2((finish - start) / 60) };
      var cl = clients[v.clientId];
      var paid = forced ? false : cl.type === 'business' ? (day < '2026-10-14' ? (rnd() < 0.5) : false) : true;
      issueInvoice(job, job.readyAt, { emailAt: day + 'T' + hm(finish + 2), paidAt: paid ? (cl.type === 'business' ? addDays(day, int(6, 13)) + 'T10:15' : job.deliveredAt) : null, paidBy: cl.type === 'business' ? 'Bank transfer' : weighted([['Card', 8], ['Cash', 1], ['Bank transfer', 1]]) });
      history.push(job);
    }
    if (noShowDays.indexOf(day) >= 0 || cancelDays.indexOf(day) >= 0) {
      var nv = newClientAndVehicle(false);
      var ns = noShowDays.indexOf(day) >= 0;
      var svc = weighted(SERVICE_MIX);
      history.push({ id: 'h' + (++hj), plate: nv.plate, clientId: nv.clientId, service: svc, status: ns ? 'no_show' : 'cancelled', date: day, time: hm(pick([540, 600, 780])), estHours: hoursOf(svc),
        mechanic: null, ramp: null, onRamp: false, mileage: nv.mileage, problem: pick(PROBLEMS[svc]), createdAt: addDays(day, -int(2, 9)), items: [], parts: [], notes: [], officeNotes: [], invoiceIds: [] });
      if (ns) clients[nv.clientId].noShows = 1;
    }
  });

  // Today's and yesterday's invoices on the board (0090 – 0092).
  var nx = jobs.find(function (j) { return j.id === 'nx15'; });
  issueInvoice(nx, '2026-10-28T15:46', { emailAt: '2026-10-28T15:47', paidAt: TODAY + 'T09:18', paidBy: 'Card' });
  var pe = jobs.find(function (j) { return j.id === 'pe68'; });
  issueInvoice(pe, TODAY + 'T09:34', { emailAt: TODAY + 'T09:35', paidAt: TODAY + 'T10:03', paidBy: 'Card' });
  var da = jobs.find(function (j) { return j.id === 'da66'; });
  issueInvoice(da, TODAY + 'T09:12', { emailAt: TODAY + 'T09:13' });

  // ---- Bookings ahead (generated) -----------------------------------------
  var upcoming = [];
  var fillPlan = {}; // a few named days so the calendar has character
  fillPlan['2026-10-30'] = 0.96; fillPlan['2026-11-02'] = 1.1; fillPlan['2026-11-03'] = 0.9; fillPlan['2026-11-06'] = 0.82;
  var ahead = addDays(TODAY, company.bookAhead);
  for (var day2 = addDays(TODAY, 1); day2 <= ahead; day2 = addDays(day2, 1)) {
    var wd = dow(day2);
    if (wd === 0 || wd === 6) continue;
    var daysOut = (new Date(day2) - new Date(TODAY)) / 864e5;
    var target = 24 * (fillPlan[day2] != null ? fillPlan[day2] : Math.max(0.06, 0.85 - daysOut * 0.021 + (rnd() - 0.5) * 0.22));
    var booked = 0, used = {};
    while (booked < target - 0.4) {
      var s2 = weighted(SERVICE_MIX);
      var h = hoursOf(s2);
      if (booked + h > target + 1.6 && booked > 0) break;
      var v2 = rnd() < 0.2 && history.length ? vehicles[pick(history).plate] : newClientAndVehicle(s2 === 'Commercial van');
      var t2; do { t2 = pick(slots); } while (used[t2] > 2); used[t2] = (used[t2] || 0) + 1;
      upcoming.push({ id: 'b' + (++hj), plate: v2.plate, clientId: v2.clientId, service: s2, status: 'booked', date: day2, time: hm(t2), estHours: h,
        mechanic: null, ramp: null, onRamp: false, mileage: v2.mileage, problem: pick(PROBLEMS[s2]), createdAt: addDays(TODAY, -int(0, 14)), online: rnd() < 0.3,
        items: [], parts: [], notes: [], officeNotes: [], invoiceIds: [] });
      booked += h;
    }
  }
  upcoming.sort(function (a, b) { return (a.date + a.time).localeCompare(b.date + b.time); });
  history.forEach(weekendOnline); upcoming.forEach(weekendOnline);

  // ---- Outbox --------------------------------------------------------------
  var outbox = [];
  invoices.slice(-9).forEach(function (inv) {
    inv.sends.forEach(function (s) {
      outbox.push({ id: 'm-' + inv.id, kind: 'invoice', to: s.to, subject: 'Invoice ' + inv.number + ' for ' + inv.plate, at: s.at, attachment: inv.number + '.pdf', status: 'Delivered', invoiceId: inv.id, jobId: inv.jobId });
    });
  });
  history.slice(-6).forEach(function (j) {
    var c = clients[j.clientId];
    if (j.status === 'delivered' && c.email) outbox.push({ id: 'm-r-' + j.id, kind: 'ready', to: c.email, subject: 'Your vehicle ' + j.plate + ' is ready to collect', at: j.readyAt, status: 'Opened', jobId: j.id });
  });
  outbox.push({ id: 'm-r-da66', kind: 'ready', to: clients['c-qureshi'].email, subject: 'Your vehicle DA66 RFK is ready to collect', at: TODAY + 'T09:06', status: 'Opened', jobId: 'da66' });
  upcoming.filter(function (b) { return b.createdAt >= addDays(TODAY, -1); }).slice(0, 5).forEach(function (b) {
    var c = clients[b.clientId];
    if (c.email) outbox.push({ id: 'm-b-' + b.id, kind: 'booking', to: c.email, subject: "You're booked in: " + b.plate + ' on ' + shortDay(b.date), at: b.createdAt + 'T' + hm(b.createdAt === TODAY ? int(495, 630) : int(560, 1100)), status: 'Delivered', jobId: b.id });
  });
  outbox.push({ id: 'm-b-fj70', kind: 'booking', to: clients['c-hendry'].email, subject: "You're booked in: FJ70 KDN on Thu 29 Oct", at: '2026-10-27T19:42', status: 'Opened', jobId: 'fj70' });
  outbox.sort(function (a, b) { return b.at.localeCompare(a.at); });

  window.LB_DATA = {
    TODAY: TODAY, CLOCK_START: CLOCK_START, company: company, team: team, services: services, waitReasons: waitReasons,
    clients: clients, vehicles: vehicles, jobs: jobs, history: history, upcoming: upcoming, invoices: invoices, outbox: outbox,
    nextInvoiceNo: invNo + 1,
    util: { addDays: addDays, dow: dow, hm: hm, pad: pad, round2: round2, unitPrice: unitPrice, lineTotal: lineTotal, totalsOf: totalsOf, hoursOf: hoursOf },
  };
})();
