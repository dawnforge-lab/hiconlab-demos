/* Fankle, Leith: salon data. Everything on the site and in booking reads from here.
   Prices are stylist-level prices; each stylist's level scales them (see levels). */
window.FANKLE = {
  salon: {
    name: 'Fankle',
    street: '11 Chandlers Wynd',
    area: 'Leith, Edinburgh',
    postcode: 'EH6 6ZZ',
    phone: '0131 496 0582',
    phoneHref: '+441314960582',
    email: 'hello@fanklehair.example',
  },

  // 0 = Sunday … 6 = Saturday. null = closed.
  hours: {
    0: null,
    1: null,
    2: ['09:30', '18:00'],
    3: ['09:30', '18:00'],
    4: ['10:00', '20:00'],
    5: ['09:00', '18:00'],
    6: ['08:30', '16:30'],
  },

  levels: {
    graduate: { label: 'Graduate', factor: 0.8 },
    stylist: { label: 'Stylist', factor: 1 },
    senior: { label: 'Senior', factor: 1.15 },
    director: { label: 'Director', factor: 1.3 },
  },

  lengths: [
    { id: 'short', label: 'Short', hint: 'Above the chin' },
    { id: 'shoulder', label: 'Shoulder', hint: 'Chin to shoulders' },
    { id: 'long', label: 'Long', hint: 'Past the shoulders' },
  ],

  team: [
    {
      id: 'morven', name: 'Morven Laird', first: 'Morven', level: 'director', role: 'Owner',
      days: [2, 3, 4, 6], img: 'morven',
      goodFor: 'Precision cuts, big restyles and going grey on purpose',
      line: 'Fifteen years in the West End, then her own chairs on the Shore. Will talk you out of a fringe if it won’t suit you.',
    },
    {
      id: 'kasia', name: 'Kasia Wróbel', first: 'Kasia', level: 'senior', role: 'Senior colourist',
      days: [3, 4, 5, 6], img: 'kasia',
      goodFor: 'Balayage, blondes and fixing colour that went wrong elsewhere',
      line: 'Colour only, and properly: skin test, strand test, and a toner that suits your skin rather than the photo.',
    },
    {
      id: 'femi', name: 'Femi Adeyemi', first: 'Femi', level: 'stylist', role: 'Stylist, curls',
      days: [2, 4, 5, 6], img: 'femi',
      goodFor: 'Curly and coily hair, dry cutting, silk presses',
      line: 'Cuts curls dry, one at a time, so you can see the shape before it’s washed. Will show you how to do it at home.',
    },
    {
      id: 'ross', name: 'Ross Dunbar', first: 'Ross', level: 'stylist', role: 'Stylist, short hair',
      days: [2, 3, 5, 6], img: 'ross',
      goodFor: 'Skin fades, short crops, beards and kids who won’t sit still',
      line: 'Trained as a barber in Glasgow. Short hair, done sharp, with a proper neck shave if you want one.',
    },
    {
      id: 'isla', name: 'Isla Mackay', first: 'Isla', level: 'graduate', role: 'Graduate stylist',
      days: [2, 3, 4, 5], img: 'isla',
      goodFor: 'Cuts and blow-dries at graduate prices',
      line: 'Finished her training with Morven last spring. Morven or Femi checks every cut before you leave, and it costs a fifth less.',
    },
  ],

  categories: [
    { id: 'cut', label: 'Cuts' },
    { id: 'colour', label: 'Colour' },
    { id: 'finish', label: 'Curls & finishing' },
  ],

  // mins / price: by hair length, or a single number when length doesn't change it.
  // flat: the price is the same whoever you see.
  services: [
    { id: 'cut', cat: 'cut', name: 'Cut and blow-dry', blurb: 'Wash, cut and a proper blow-dry. Bring photos if you have them.',
      mins: { short: 45, shoulder: 60, long: 75 }, price: { short: 46, shoulder: 52, long: 58 }, who: ['morven', 'femi', 'ross', 'isla'], home: true },
    { id: 'restyle', cat: 'cut', name: 'Restyle', blurb: 'A big change. Extra time to talk it through before the scissors come out.',
      mins: { short: 75, shoulder: 90, long: 105 }, price: { short: 58, shoulder: 66, long: 74 }, who: ['morven', 'femi', 'ross'], home: true },
    { id: 'cutgo', cat: 'cut', name: 'Cut and go', blurb: 'Cut dry, no blow-dry. In and out.',
      mins: { short: 30, shoulder: 30, long: 45 }, price: { short: 32, shoulder: 36, long: 40 }, who: ['morven', 'femi', 'ross', 'isla'] },
    { id: 'fade', cat: 'cut', name: 'Skin fade or short back and sides', blurb: 'Clippers, scissors and a clean neckline.',
      mins: 45, price: 30, who: ['ross', 'morven', 'isla'], shortOnly: true, home: true },
    { id: 'kids', cat: 'cut', name: 'Under-12s cut', blurb: 'Same chair, same care, a booster seat if needed.',
      mins: 30, price: 20, flat: true, who: ['ross', 'isla', 'femi'] },
    { id: 'fringe', cat: 'cut', name: 'Fringe tidy', blurb: 'Free within six weeks of a cut with us.',
      mins: 15, price: 10, flat: true, who: ['morven', 'femi', 'ross', 'isla'] },

    { id: 'roots', cat: 'colour', name: 'Root colour', blurb: 'Regrowth up to 2 cm, finished with a blow-dry.',
      mins: { short: 90, shoulder: 90, long: 105 }, price: { short: 62, shoulder: 66, long: 72 }, who: ['kasia', 'morven', 'isla'], colour: true, home: true },
    { id: 'foils', cat: 'colour', name: 'Half head of foils', blurb: 'Brightness around the face and parting, with a blow-dry.',
      mins: { short: 120, shoulder: 135, long: 150 }, price: { short: 82, shoulder: 94, long: 106 }, who: ['kasia', 'morven'], colour: true, home: true },
    { id: 'balayage', cat: 'colour', name: 'Balayage', blurb: 'Hand-painted, grows out softly. Toner and blow-dry included.',
      mins: { short: 150, shoulder: 180, long: 210 }, price: { short: 120, shoulder: 145, long: 170 }, who: ['kasia', 'morven'], colour: true, home: true },
    { id: 'gloss', cat: 'colour', name: 'Toner and gloss', blurb: 'Takes the brass out of blonde and puts the shine back.',
      mins: { short: 45, shoulder: 45, long: 60 }, price: { short: 36, shoulder: 42, long: 48 }, who: ['kasia', 'morven', 'isla'], colour: true },

    { id: 'curly', cat: 'finish', name: 'Curly cut', blurb: 'Cut dry, curl by curl, then washed, defined and diffused.',
      mins: { short: 75, shoulder: 90, long: 120 }, price: { short: 58, shoulder: 64, long: 72 }, who: ['femi', 'morven'], home: true },
    { id: 'refresh', cat: 'finish', name: 'Curl refresh', blurb: 'Wash, condition, define and diffuse. No cut.',
      mins: { short: 45, shoulder: 60, long: 75 }, price: { short: 34, shoulder: 38, long: 44 }, who: ['femi', 'isla'] },
    { id: 'silk', cat: 'finish', name: 'Silk press', blurb: 'Straight and swingy on natural hair, without the heat damage.',
      mins: { short: 90, shoulder: 105, long: 120 }, price: { short: 62, shoulder: 72, long: 84 }, who: ['femi'], home: true },
    { id: 'blowdry', cat: 'finish', name: 'Blow-dry', blurb: 'Wash and blow-dry, smooth or with volume.',
      mins: { short: 30, shoulder: 45, long: 60 }, price: { short: 28, shoulder: 32, long: 38 }, who: ['morven', 'femi', 'isla'], home: true },
    { id: 'upstyle', cat: 'finish', name: 'Hair up for an occasion', blurb: 'Weddings, parties, the lot. Trial runs at the same price.',
      mins: { short: 60, shoulder: 60, long: 75 }, price: { short: 55, shoulder: 60, long: 68 }, who: ['morven', 'isla'] },

    { id: 'consult', cat: 'none', name: 'Free consultation', blurb: 'Fifteen minutes to talk it through. No obligation.',
      mins: 15, price: 0, flat: true, who: ['morven', 'kasia', 'femi', 'ross', 'isla'] },
  ],

  reviews: [
    { quote: 'Femi is the first person in Edinburgh who has cut my curls without wanting to straighten them first. I left with a shape I can actually do myself.', who: 'Adaeze, Leith Walk' },
    { quote: 'Kasia sorted three years of box dye in two visits and told me the price before she started. No surprises at the till.', who: 'Ailsa, Trinity' },
    { quote: 'Ross does my fade every three weeks. In and out in forty minutes and he remembers how I like the neckline.', who: 'Calum, Newhaven' },
  ],
};
