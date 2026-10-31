/* Hollis & Daughter: prices, rounds and copy used by the guide-price flow and the areas page.
   All prices are held in pence, ex VAT. VAT (20%) is added once, to the total, and rounded to the penny. */
window.HD_DATA = {
  vatRate: 0.2,
  sameVisitDiscount: 0.1, // 10% off one-off work when two or more jobs are done on the same visit

  propertyTypes: [
    { id: 'flat', label: 'Flat', note: 'Ground or first floor' },
    { id: 'terrace', label: 'Mid-terrace' },
    { id: 'end', label: 'End-terrace' },
    { id: 'semi', label: 'Semi-detached' },
    { id: 'detached', label: 'Detached' }
  ],

  services: {
    windows: {
      name: 'Windows',
      short: 'Windows',
      // Regular (every 4 weeks) visit, by property type, plus a step per bedroom over one.
      base: { flat: 1000, terrace: 1200, end: 1300, semi: 1400, detached: 1700 },
      perBed: 250,
      eightWeekly: 300,     // added to each visit when the round is every 8 weeks
      firstCleanFactor: 2   // a first (or one-off) clean is a full clean: frames, sills and doors scrubbed
    },
    gutters: {
      name: 'Gutters',
      short: 'Gutters',
      base: { flat: 4500, terrace: 6000, end: 6500, semi: 7000, detached: 9500 },
      perBedOver2: 800,
      fascias: { flat: 3000, terrace: 3500, end: 4000, semi: 4500, detached: 6500 }
    },
    driveway: {
      name: 'Driveway & paths',
      short: 'Driveway',
      surfaces: [
        { id: 'block', label: 'Block paving', rate: 430, note: 'Includes re-sanding the joints' },
        { id: 'concrete', label: 'Concrete or tarmac', rate: 320 },
        { id: 'stone', label: 'Natural stone', rate: 380, note: 'Soft washed' }
      ],
      min: 9000,
      size: { min: 10, max: 150, step: 5, value: 40 }
    },
    patio: {
      name: 'Patio',
      short: 'Patio',
      surfaces: [
        { id: 'sandstone', label: 'Indian sandstone', rate: 380, note: 'Soft washed' },
        { id: 'porcelain', label: 'Porcelain', rate: 320 },
        { id: 'slabs', label: 'Concrete slabs', rate: 300 }
      ],
      min: 8000,
      size: { min: 8, max: 100, step: 2, value: 24 }
    },
    render: {
      name: 'Render & roof',
      short: 'Render & roof',
      renderBase: { flat: 18000, terrace: 22000, end: 26000, semi: 26000, detached: 32000 },
      renderPerBedOver2: 2500,
      scopes: [
        { id: 'front', label: 'Front only', factor: 1 },
        { id: 'frontback', label: 'Front and back', factor: 1.8 },
        { id: 'all', label: 'All the way round', factor: 2.6, notFor: ['flat', 'terrace'] }
      ],
      roofBase: { flat: 0, terrace: 32000, end: 36000, semi: 38000, detached: 52000 },
      roofPerBedOver2: 4000
    },
    solar: {
      name: 'Solar panels',
      short: 'Solar panels',
      perPanel: 450,
      min: 4500,
      panels: { min: 4, max: 40, value: 12 }
    }
  },

  // Services that need someone to see them before we can fix the price.
  needsLook: ['driveway', 'patio', 'render'],

  // One round day per postcode district. Outward code only: we never need the full postcode to say this.
  rounds: [
    { day: 1, name: 'Monday', districts: ['BS13', 'BS14'], areas: 'Bedminster Down, Bishopsworth, Hengrove and Whitchurch', colour: 'lilac' },
    { day: 2, name: 'Tuesday', districts: ['BS3'], areas: 'Bedminster, Southville and Windmill Hill', colour: 'pink' },
    { day: 3, name: 'Wednesday', districts: ['BS4'], areas: 'Totterdown, Knowle and Brislington', colour: 'saffron' },
    { day: 4, name: 'Thursday', districts: ['BS1', 'BS8'], areas: 'Redcliffe, Harbourside, Clifton Wood and Hotwells', colour: 'mint' },
    { day: 5, name: 'Friday', districts: ['BS41'], areas: 'Long Ashton and Dundry', colour: 'duck' }
  ],
  // Nearby districts we’ll travel to for one-off jobs on a Saturday, but don’t run a round in.
  saturdayOnly: ['BS2', 'BS5', 'BS6', 'BS7', 'BS9', 'BS31', 'BS48'],

  // No bookings on bank holidays (England) or over Christmas.
  closed: ['2026-12-24', '2026-12-25', '2026-12-26', '2026-12-28', '2026-12-31', '2027-01-01', '2027-03-26', '2027-03-29', '2027-05-03', '2027-05-31', '2027-08-30', '2027-12-24', '2027-12-25', '2027-12-27', '2027-12-28', '2027-12-31', '2028-01-01', '2028-01-03'],

  // Arrival windows. Saturdays are mornings only.
  slots: [
    { id: '08', label: '08:00–10:00', from: 8 },
    { id: '10', label: '10:00–12:00', from: 10 },
    { id: '12', label: '12:00–14:00', from: 12 },
    { id: '14', label: '14:00–16:00', from: 14 }
  ],

  // Tour mode: a pinned “today” (a Monday morning) and the visit the story books.
  tour: {
    today: [2026, 10, 9, 10, 15], // Monday 9 November, 10:15 (month is zero-based)
    refSuffix: '4RT',
    bookDate: '2026-11-11',
    bookSlot: '10'
  },

  // Before & after: real jobs from the rounds (fictional, priced with the same numbers as the flow).
  jobs: {
    driveway: { place: 'Southville', what: '42 m² of block paving', did: 'Rotary-cleaned, weeds out, re-sanded', who: 'Dev', time: 'One morning', price: 21672, after: 'Photographed again a week later, once the new sand had settled' },
    render: { place: 'Totterdown', what: 'Mid-terrace, front only', did: 'Soft washed with a biocide, rinsed at low pressure, sills and gutter wiped', who: 'Jas', time: 'Half a day', price: 26400, after: 'Photographed again two weeks later, when the biocide had finished working' },
    patio: { place: 'Knowle', what: '28 m² of Indian sandstone', did: 'Soft washed, never jet-blasted, moss raked out of the joints', who: 'Dev', time: 'Two hours', price: 12768, after: 'Photographed the same afternoon, once the stone had dried' }
  }
};
