/* Kingfield Gym: classes, coaches, the weekly timetable, prices and opening hours.
   Everything here is fictional. */
window.KG_DATA = (function () {
  'use strict';

  // Class types use the international weight-plate colours.
  var types = {
    strength:    { label: 'Strength',    plate: '25', colour: 'red' },
    kettlebells: { label: 'Kettlebells', plate: '20', colour: 'blue' },
    circuits:    { label: 'Circuits',    plate: '15', colour: 'yellow' },
    boxing:      { label: 'Boxing',      plate: '10', colour: 'green' },
    mobility:    { label: 'Mobility',    plate: '5',  colour: 'white' }
  };

  var coaches = {
    nadia: { name: 'Nadia Parekh', first: 'Nadia', img: 'coach-nadia' },
    tom:   { name: 'Tom Rennie', first: 'Tom', img: 'coach-tom' },
    grace: { name: 'Grace Okafor', first: 'Grace', img: 'coach-grace' },
    dele:  { name: 'Dele Adeyemi', first: 'Dele', img: 'coach-dele' },
    kuba:  { name: 'Kuba Zieliński', first: 'Kuba', img: 'coach-kuba' }
  };

  // first: a good first session for someone who has never trained.
  var classes = {
    barbell:     { name: 'Barbell Club', type: 'strength', mins: 60, cap: 9, first: false,
                   blurb: 'Squat, bench, deadlift and press on the platforms, in threes.' },
    foundations: { name: 'Lifting Foundations', type: 'strength', mins: 60, cap: 6, first: true,
                   blurb: 'Learn to squat, deadlift and press, starting with an empty bar.' },
    womens:      { name: 'Women’s Lifting Club', type: 'strength', mins: 60, cap: 8, first: true,
                   blurb: 'Barbell lifting for women, at every level from first timer up.' },
    sixty:       { name: 'Strong at Sixty', type: 'strength', mins: 45, cap: 10, first: true,
                   blurb: 'Strength and balance for over-60s. Chairs and boxes, no floor work.' },
    kettlebells: { name: 'Kettlebells', type: 'kettlebells', mins: 45, cap: 12, first: false,
                   blurb: 'Swings, cleans, carries and squats. You’ll know the swing already.' },
    kbbasics:    { name: 'Kettlebell Basics', type: 'kettlebells', mins: 45, cap: 8, first: true,
                   blurb: 'The swing, the goblet squat and the carry, taught slowly.' },
    circuits:    { name: 'Circuits', type: 'circuits', mins: 45, cap: 16, first: true,
                   blurb: 'Ten stations, music on. Every station has an easier version.' },
    boxfit:      { name: 'Boxfit', type: 'boxing', mins: 45, cap: 12, first: true,
                   blurb: 'Pads, bags and skipping. No sparring, nobody hits you back.' },
    technique:   { name: 'Boxing Technique', type: 'boxing', mins: 60, cap: 10, first: false,
                   blurb: 'Footwork, combinations and defence on the pads with Dele.' },
    mobility:    { name: 'Mobility & Stretch', type: 'mobility', mins: 45, cap: 14, first: true,
                   blurb: 'Slow work for stiff hips, backs and shoulders.' }
  };

  // The weekly timetable. Days: 1 = Monday … 7 = Sunday.
  var week = {
    1: [['06:30', 'barbell', 'tom'], ['12:30', 'circuits', 'tom'], ['17:30', 'kettlebells', 'kuba'], ['18:30', 'foundations', 'nadia'], ['19:30', 'boxfit', 'dele']],
    2: [['06:30', 'kettlebells', 'grace'], ['10:00', 'sixty', 'grace'], ['12:30', 'circuits', 'tom'], ['18:00', 'technique', 'dele'], ['19:00', 'barbell', 'nadia'], ['20:00', 'mobility', 'kuba']],
    3: [['07:00', 'mobility', 'kuba'], ['12:30', 'circuits', 'tom'], ['17:30', 'kbbasics', 'grace'], ['18:30', 'womens', 'nadia'], ['19:30', 'boxfit', 'dele']],
    4: [['06:30', 'barbell', 'tom'], ['10:00', 'sixty', 'grace'], ['12:30', 'circuits', 'kuba'], ['18:00', 'foundations', 'nadia'], ['19:00', 'boxfit', 'dele'], ['20:00', 'kettlebells', 'kuba']],
    5: [['06:30', 'kettlebells', 'grace'], ['12:30', 'circuits', 'tom'], ['17:30', 'barbell', 'nadia'], ['18:30', 'technique', 'dele']],
    6: [['08:30', 'circuits', 'tom'], ['09:30', 'foundations', 'nadia'], ['10:30', 'boxfit', 'dele'], ['11:30', 'sixty', 'grace']],
    7: [['09:00', 'mobility', 'kuba'], ['10:00', 'kbbasics', 'grace'], ['11:00', 'barbell', 'tom']]
  };

  // Staffed hours (a coach on the desk). Members can come in with their fob 05:30–23:00.
  var staffed = {
    1: ['06:15', '21:00'], 2: ['06:15', '21:00'], 3: ['06:15', '21:00'], 4: ['06:15', '21:00'], 5: ['06:15', '21:00'],
    6: ['08:00', '13:00'], 7: ['08:45', '12:30']
  };

  // Christmas closures, and bank holidays that run the Sunday timetable (England).
  var closed = { '2026-12-25': 'Closed for Christmas Day', '2026-12-26': 'Closed for Boxing Day', '2027-01-01': 'Closed for New Year’s Day', '2027-12-25': 'Closed for Christmas Day', '2027-12-26': 'Closed for Boxing Day' };
  var bankHolidays = ['2026-12-28', '2027-03-26', '2027-03-29', '2027-05-03', '2027-05-31', '2027-08-30', '2027-12-27', '2027-12-28'];

  var prices = {
    gym:     { any: 29, off: 22, anyConc: 22, offConc: 17 },
    classes: { any: 45, off: 36, anyConc: 34, offConc: 27 },
    dropIn: 9, dayPass: 7, tenClass: 75
  };

  return { types: types, coaches: coaches, classes: classes, week: week, staffed: staffed, closed: closed, bankHolidays: bankHolidays, prices: prices };
})();
