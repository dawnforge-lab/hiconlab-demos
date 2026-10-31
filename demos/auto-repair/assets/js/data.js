/* Ten to Two Garage: the garage's own data. Everything here is fictional.
   Prices are held in pence, ex VAT. Services add VAT at 20%; MOT fees carry no VAT. */
window.TT_DATA = {
  garage: {
    name: 'Ten to Two Garage',
    phone: '01632 960 482',
    phoneHref: 'tel:+441632960482',
    email: 'hello@tentotwogarage.example',
    address: ['The Old Coachworks', 'Tanner’s Yard, Coton Hill', 'Shrewsbury SY1 2ZZ'],
  },

  // Opening hours, by JS day (0 = Sunday). Times are minutes after midnight.
  hours: {
    0: null,
    1: [465, 1050], 2: [465, 1050], 3: [465, 1050], 4: [465, 1050], 5: [465, 1050],
    6: [480, 750],
  },

  vat: 0.2,
  mot: { max: 5485, alone: 4500, withService: 3500 },

  bands: [
    { id: 'small', label: 'Up to 1.4 litres', short: 'up to 1.4 litre' },
    { id: 'mid', label: '1.5–2.0 litres', short: '1.5–2.0 litre' },
    { id: 'large', label: 'Over 2.0 litres', short: 'over 2.0 litre' },
  ],

  services: {
    interim: {
      name: 'Interim service',
      every: 'Every 6 months or 6,000 miles',
      time: 'About 1½ hours',
      minutes: 90,
      price: { small: 11250, mid: 12500, large: 14500 },
    },
    full: {
      name: 'Full service',
      every: 'Every 12 months or 12,000 miles',
      time: 'About 3 hours',
      minutes: 180,
      price: { small: 18750, mid: 21250, large: 24500 },
    },
  },

  // Obviously fictional plates: ZQ is a memory tag the DVLA never issues.
  // motDays: days from "today" until the MOT runs out (negative = already expired).
  vehicles: {
    ZQ19QTW: { make: 'Volkswagen', model: 'Golf 1.5 TSI Match', fuel: 'Petrol', litres: 1.5, year: 2019, colour: 'Silver', motDays: 14 },
    ZQ66IBX: { make: 'Ford', model: 'Fiesta 1.0 EcoBoost Zetec', fuel: 'Petrol', litres: 1.0, year: 2016, colour: 'Blue', motDays: 96 },
    ZQ21HYQ: { make: 'Toyota', model: 'Yaris 1.5 Hybrid Icon', fuel: 'Hybrid', litres: 1.5, year: 2021, colour: 'Red', motDays: 123 },
    ZQ14DQS: { make: 'Škoda', model: 'Octavia 2.0 TDI SE estate', fuel: 'Diesel', litres: 2.0, year: 2014, colour: 'Grey', motDays: -10 },
    ZQ12VQX: { make: 'Volvo', model: 'V70 2.4 D5 SE', fuel: 'Diesel', litres: 2.4, year: 2012, colour: 'Black', motDays: 41 },
  },

  dropOff: ['07:45', '08:00', '08:15', '08:30', '08:45', '09:00'],
  wait: ['08:00', '09:30', '11:00', '13:30', '15:00'],
  waitSat: ['08:00', '09:30', '11:00'],

  // The tour pins its own today, plate and free slots so every recording matches.
  tour: {
    now: [2026, 10, 12, 8, 35], // Thursday 12 November, 08:35 (month is 0-based)
    plate: 'ZQ19 QTW',
    keepFree: ['2026-11-17 08:15'],
  },
};
