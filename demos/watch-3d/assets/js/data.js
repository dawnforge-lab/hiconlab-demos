// Product data for the P39: colourways, straps and the parts named in the exploded view.

export const DIALS = {
  mersey: {
    name: 'Mersey',
    note: 'Deep blue sunburst, darker at the edge',
    base: '#1d3d66',
    flange: '#16263b',
    print: '#f1ece0',
    metal: '#e4e6e8', // rhodium hands and indices
    metalness: 0.62,
    roughness: 0.3,
  },
  fell: {
    name: 'Fell',
    note: 'Moss green sunburst, the colour of the hills above Rivington',
    base: '#26402f',
    flange: '#1b2a20',
    print: '#efe9da',
    metal: '#e4e6e8',
    metalness: 0.6,
    roughness: 0.3,
  },
  salt: {
    name: 'Salt',
    note: 'Silvered grey with gilt hands and indices',
    base: '#d4d7d6',
    flange: '#b3b7b7',
    print: '#15171c',
    metal: '#e2bf7e',
    metalness: 0.62,
    roughness: 0.26,
  },
};

export const STRAPS = {
  chestnut: { name: 'Chestnut calf', colour: '#4e2711', stitch: '#e6d8bb', roughness: 0.7, clearcoat: 0.08 },
  black: { name: 'Black calf', colour: '#0f0e0d', stitch: '#cfc9bc', roughness: 0.6, clearcoat: 0.12 },
  oxblood: { name: 'Oxblood cordovan', colour: '#3a0d11', stitch: '#55191d', roughness: 0.5, clearcoat: 0.14 },
};

// Parts in the exploded view. "anchor" is a point on the part in watch space (mm).
export const PARTS = [
  { id: 'crystal', side: 'left', title: 'Domed sapphire crystal', detail: 'Anti-reflective on the inside only, so the coating can’t wear off' },
  { id: 'bezel', side: 'left', title: 'Polished bezel', detail: 'Hand-polished, pressed onto the case' },
  { id: 'hands', side: 'left', title: 'Dauphine hands', detail: 'Faceted and diamond-cut, with a brass seconds hand' },
  { id: 'dial', side: 'left', title: 'Sunburst dial', detail: 'Brass, lacquered, with twelve applied indices' },
  { id: 'crown', side: 'right', title: 'Screw-down crown', detail: 'Signed, with two gaskets for 100 metres' },
  { id: 'movement', side: 'right', title: 'Calibre FW-1', detail: 'Frosted gilt three-quarter plate, made in Prescot' },
  { id: 'rotor', side: 'right', title: 'Skeleton rotor', detail: 'Prescot stripes, with a gold weight' },
  { id: 'caseback', side: 'right', title: 'Sapphire display back', detail: 'Screwed down, engraved with your watch’s number' },
  { id: 'case', side: 'right', title: '39 mm steel case', detail: 'Brushed flanks, polished chamfers, 11.4 mm thick' },
];
