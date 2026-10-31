// Shared data for the page and the 3D scene: flavours, prices and the label panel.
// Every number here is the same as on the page and on the back of the tube.
export const FLAVOURS = {
  lemon: {
    name: 'Lemon & lime',
    short: 'Lemon',
    tube: '#dfe04e', tubeDeep: '#c9cb36', ink: '#16241a', print: '#13232d', accent: '#ffffff',
    wash: '#f1f0c4',
    water: '#dcdc5e', waterDeep: '#d4d76a', waterAlpha: 0.58,
    tablet: '#f5f2da', speck: '#c2c93a',
    flavouring: 'natural lemon and lime flavouring',
  },
  blackcurrant: {
    name: 'Blackcurrant',
    short: 'Blackcurrant',
    tube: '#4a1f4f', tubeDeep: '#3a163e', ink: '#f6eef3', print: '#f6eef3', accent: '#e9b7d8',
    wash: '#ecdeea',
    water: '#4f0e2e', waterDeep: '#3a0a22', waterAlpha: 0.74,
    tablet: '#eadbe6', speck: '#6a2b62',
    flavouring: 'natural blackcurrant flavouring',
  },
  orange: {
    name: 'Blood orange',
    short: 'Blood orange',
    tube: '#e8622f', tubeDeep: '#cf4f20', ink: '#1d120c', print: '#1d120c', accent: '#fff3ea',
    wash: '#f8e0d2',
    water: '#ee8448', waterDeep: '#e5763f', waterAlpha: 0.6,
    tablet: '#f7e6da', speck: '#d9542a',
    flavouring: 'natural blood orange flavouring',
  },
};

export const ORDER = ['lemon', 'blackcurrant', 'orange'];

// Per tablet (5 g) and per daily dose (2 tablets), as printed on the back of the tube.
// %NRV is for the daily dose of two tablets.
export const PANEL = [
  ['Energy', '26 kJ/6 kcal', '52 kJ/12 kcal', ''],
  ['Carbohydrate', '1.0 g', '2.0 g', ''],
  ['  of which polyols', '1.0 g', '2.0 g', ''],
  ['Salt', '1.25 g', '2.5 g', ''],
  ['Sodium', '500 mg', '1,000 mg', ''],
  ['Potassium', '300 mg', '600 mg', '30%'],
  ['Magnesium', '60 mg', '120 mg', '32%'],
  ['Chloride', '350 mg', '700 mg', '88%'],
];

// One 5.00 g tablet, by weight, in descending order (as on the ingredients list).
export const WEIGHTS = [
  ['Citric acid', 1.24],
  ['Sodium bicarbonate', 1.00],
  ['Sorbitol (sweetener)', 1.00],
  ['Potassium bicarbonate', 0.77],
  ['Droitwich brine salt', 0.58],
  ['Magnesium carbonate', 0.21],
  ['Natural flavouring', 0.18],
  ['Steviol glycosides (sweetener)', 0.02],
];

export const PRICES = { once: 7.5, sub: 6.0, delivery: 2.95, freeFrom: 15 };
