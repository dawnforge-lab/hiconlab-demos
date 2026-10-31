/* The decision: criteria in, ranked products out, with the narrowing that got there.
 * Must-haves filter in the order the shopper said them (that order is the strip),
 * preferences rank by a weighted sum, so the same request always gives the same order.
 */
(function () {
  'use strict';

  var D = window.SCARTH;
  var ALL = D.products;
  var CAT = {};
  D.categories.forEach(function (c) { CAT[c.id] = c; });
  var FOOT = ['boots', 'shoes'];
  var CLOTH = ['shells', 'insulated', 'base'];

  function isFoot(p) { return p.cat === 'boots' || p.cat === 'shoes'; }
  function kg(g) { return g >= 1000 ? (Math.round(g / 100) / 10).toFixed(1).replace(/\.0$/, '') + ' kg' : g + ' g'; }
  function weightText(p) { return isFoot(p) ? kg(p.weight) + ' a pair' : kg(p.weight); }
  function money(n) { return '£' + n; }
  function mm(n) { return n.toLocaleString('en-GB') + ' mm'; }
  var CRAMPON = { B0: 0, B1: 1, B2: 2, B3: 3 };
  var COLOURNAME = { green: 'green', blue: 'blue', black: 'black', grey: 'grey', brown: 'brown', red: 'red', orange: 'orange', yellow: 'yellow', purple: 'purple', neutral: 'stone or beige' };

  // Per-category medians and ranges, so "lighter" means lighter than the other boots, not lighter than a sock.
  var STATS = {};
  D.categories.forEach(function (c) {
    var items = ALL.filter(function (p) { return p.cat === c.id; });
    var w = items.map(function (p) { return p.weight; }).sort(function (a, b) { return a - b; });
    STATS[c.id] = { wMed: w[Math.floor(w.length / 2)] };
  });

  function sockSizeFor(n) {
    var map = D.sockSizes;
    for (var k in map) if (n >= map[k][0] && n <= map[k][1]) return k;
    return null;
  }

  function sizeOf(p, v) {
    // Returns the product's own size label for the requested size, or null if it has no such size.
    if (typeof v === 'number') {
      if (isFoot(p)) return p.sizes.indexOf(v) >= 0 ? v : null;
      if (p.cat === 'socks') { var s = sockSizeFor(v); return s && p.sizes.indexOf(s) >= 0 ? s : null; }
      // UK dress sizes on clothing: 8 XS, 10 S, 12 M, 14 L, 16 XL, 18 XXL.
      var dress = { 8: 'XS', 10: 'S', 12: 'M', 14: 'L', 16: 'XL', 18: 'XXL' }[v];
      if (dress && CLOTH.indexOf(p.cat) >= 0) return p.sizes.indexOf(dress) >= 0 ? dress : null;
      return null;
    }
    if (CLOTH.indexOf(p.cat) >= 0) return p.sizes.indexOf(v) >= 0 ? v : null;
    return null;
  }

  function useLabel(v) {
    return { winter: 'Winter hillwalking', hill: 'Hillwalking', day: 'Day walks', backpacking: 'Backpacking', travel: 'Travel', running: 'Running', scrambling: 'Scrambling' }[v] || v;
  }

  // ---- Criterion definitions ------------------------------------------------
  // cats: categories where the criterion means something (null = all).
  // test(p, v) → passes; score(p, v, ctx) → 0..1 for ranking; why(p, v) → reason text; miss(p, v) → what it misses.
  var DEF = {
    cat: {
      kind: 'what',
      label: function (v) {
        if (v.length === 2 && v.indexOf('boots') >= 0 && v.indexOf('shoes') >= 0) return 'Boots and shoes';
        if (v.length === 2 && v.indexOf('shells') >= 0 && v.indexOf('insulated') >= 0) return 'Jackets';
        if (v.length <= 2) return v.map(function (c, i) { return i ? CAT[c].name.toLowerCase() : CAT[c].name; }).join(' and ');
        // Many sections: name the groups ("Footwear, jackets and socks").
        var G = { boots: 'footwear', shoes: 'footwear', shells: 'jackets', insulated: 'jackets', packs: 'rucksacks', base: 'base layers', socks: 'socks' };
        var g = [];
        v.forEach(function (c) { if (g.indexOf(G[c]) < 0) g.push(G[c]); });
        var t = g.length < 2 ? g[0] : g.slice(0, -1).join(', ') + ' and ' + g[g.length - 1];
        return t.charAt(0).toUpperCase() + t.slice(1);
      },
      step: function (v) { return DEF.cat.label(v); },
      test: function (p, v) { return v.indexOf(p.cat) >= 0; },
    },
    wp: {
      label: function () { return 'Waterproof'; }, adj: 'waterproof',
      cats: ['boots', 'shoes', 'shells', 'packs', 'socks'],
      test: function (p) { return p.cat === 'packs' ? !!(p.wp || p.raincover) : !!p.wp; },
      why: function (p) {
        if (isFoot(p) || p.cat === 'socks') return 'Waterproof membrane';
        if (p.cat === 'shells') return mm(p.hh) + ' waterproof';
        if (p.cat === 'packs') return p.wp ? 'Fully waterproof' : 'Rain cover included';
        return 'Waterproof';
      },
      miss: function (p) { return isFoot(p) && p.upper === 'suede' ? 'Not waterproof (suede)' : 'Not waterproof'; },
    },
    fit: {
      label: function (v) { return v === 'wide' ? 'Wide fit' : v === 'narrow' ? 'Narrow fit' : 'Standard fit'; },
      adj: function (v) { return v + ' fit'; },
      cats: FOOT,
      test: function (p, v) { return p.fit === v; },
      why: function (p, v) { return v === 'wide' ? 'Wide fit' : 'Narrow fit'; },
      miss: function (p, v) { return v === 'wide' ? (p.fit === 'narrow' ? 'Narrow fit, no wide' : 'Standard fit, no wide') : 'No narrow fit'; },
    },
    size: {
      label: function (v) { return 'Size ' + v; },
      cats: function (v) { return typeof v === 'number' ? (v % 2 === 0 && v >= 8 && v <= 18 ? ['boots', 'shoes', 'socks'].concat(CLOTH) : ['boots', 'shoes', 'socks']) : CLOTH; },
      test: function (p, v) { var s = sizeOf(p, v); return s !== null && p.out.indexOf(s) < 0; },
      why: function (p, v) { var s = sizeOf(p, v); return p.cat === 'socks' && typeof v === 'number' ? 'Size ' + s + ' fits a ' + v : s !== v ? 'Size ' + s + ' (a ' + v + ') in stock' : 'Size ' + s + ' in stock'; },
      miss: function (p, v) { var s = sizeOf(p, v); return s === null ? 'No size ' + v : 'Size ' + s + ' sold out'; },
    },
    gender: {
      label: function (v) { return v === 'w' ? 'Women’s' : 'Men’s'; },
      test: function (p, v) { return p.g === v || p.g === 'u'; },
      miss: function (p) { return p.g === 'w' ? 'Women’s fit' : 'Men’s fit'; },
    },
    budget: {
      kind: 'budget',
      label: function (v) {
        if (v.around) return 'Around £' + v.around;
        if (v.min && v.max) return '£' + v.min + '–£' + v.max;
        if (v.min) return 'Over £' + v.min;
        return 'Under £' + v.max;
      },
      test: function (p, v) { return (!v.max || p.price <= v.max) && (!v.min || p.price >= v.min); },
      why: function (p) { return money(p.price); },
      miss: function (p, v) { return v.max && p.price > v.max ? '£' + (p.price - v.max) + ' over budget' : '£' + (v.min - p.price) + ' under your range'; },
      close: function (p, v) { return v.max && p.price > v.max ? 1 - (p.price - v.max) / v.max * 3 : 0.3; },
    },
    weightmin: {
      label: function (v) { return 'Over ' + kg(v); },
      test: function (p, v) { return p.weight >= v; },
      why: function (p) { return weightText(p); },
      miss: function (p) { return weightText(p); },
    },
    gsm: {
      label: function (v) { return 'About ' + v + ' g/m²'; }, cats: ['base'],
      test: function (p, v) { return Math.abs(p.gsm - v) <= 40; },
      why: function (p) { return p.gsm + ' g/m² ' + p.material; },
      miss: function (p) { return p.gsm + ' g/m²'; },
    },
    hh: {
      label: function (v) { return mm(v) + ' or more'; }, cats: ['shells'],
      test: function (p, v) { return p.hh >= v; },
      why: function (p) { return mm(p.hh) + ' waterproof'; },
      miss: function (p) { return 'Only ' + mm(p.hh); },
    },
    weightmax: {
      label: function (v) { return 'Under ' + kg(v); },
      test: function (p, v) { return p.weight <= v; },
      why: function (p) { return weightText(p); },
      miss: function (p) { return weightText(p); },
    },
    light: {
      label: function () { return 'Lightweight'; }, adj: 'lightweight',
      test: function (p) { return p.weight <= STATS[p.cat].wMed; },
      score: function (p, v, ctx) { var r = ctx.range(p.cat, 'weight'); return r.max === r.min ? 0.5 : 1 - (p.weight - r.min) / (r.max - r.min); },
      why: function (p) { return weightText(p); },
      miss: function (p) { return 'Heavier: ' + weightText(p); },
    },
    warm: {
      label: function () { return 'Warm'; }, adj: 'warm',
      cats: ['insulated', 'base', 'socks', 'shells'],
      test: function (p) { return (p.warmth || 0) >= 3; },
      score: function (p) { return (p.warmth || 0) / 5; },
      why: function (p) {
        if (p.cat === 'insulated') return 'Warmth ' + p.warmth + ' of 5';
        if (p.cat === 'base') return p.gsm + ' g/m² merino'.replace(' merino', p.material === 'merino' ? ' merino' : ' fabric');
        if (p.cat === 'socks') return (p.cushion === 'heavy' ? 'Thick' : 'Mid-weight') + ' wool';
        return 'Insulated';
      },
      miss: function () { return 'Not very warm'; },
    },
    colour: {
      kind: 'colour',
      label: function (v) { return COLOURNAME[v].charAt(0).toUpperCase() + COLOURNAME[v].slice(1); },
      test: function (p, v) { return p.fam === v; },
      why: function (p) { return p.colour; },
      miss: function (p) { return 'Only in ' + p.colour.toLowerCase(); },
    },
    notcolour: {
      label: function (v) { return 'Not ' + COLOURNAME[v]; },
      test: function (p, v) { return p.fam !== v; },
      why: function (p) { return p.colour; },
      miss: function (p) { return 'Only in ' + p.colour.toLowerCase(); },
    },
    bright: {
      label: function () { return 'Bright colour'; },
      test: function (p) { return ['orange', 'yellow', 'red'].indexOf(p.fam) >= 0; },
      why: function (p) { return p.colour; },
      miss: function (p) { return p.colour; },
    },
    dark: {
      label: function () { return 'Dark colour'; },
      test: function (p) { return ['black', 'grey', 'blue', 'brown'].indexOf(p.fam) >= 0 && !/glacier|slate|cobalt|^blue$/i.test(p.colour); },
      why: function (p) { return p.colour; },
      miss: function (p) { return p.colour; },
    },
    leather: {
      label: function () { return 'Leather'; }, adj: 'leather', cats: FOOT,
      test: function (p) { return p.upper === 'leather'; },
      why: function () { return 'Leather upper'; },
      miss: function (p) { return p.upper === 'suede' ? 'Suede upper' : 'Synthetic upper'; },
    },
    suede: {
      label: function () { return 'Suede'; }, cats: FOOT,
      test: function (p) { return p.upper === 'suede'; },
      why: function () { return 'Suede upper'; },
      miss: function (p) { return p.upper === 'leather' ? 'Smooth leather' : 'Synthetic upper'; },
    },
    noleather: {
      label: function () { return 'No leather'; }, adj: 'leather-free', cats: FOOT,
      test: function (p) { return p.upper !== 'leather' && p.upper !== 'suede'; },
      why: function () { return 'No leather'; },
      miss: function (p) { return p.upper === 'suede' ? 'Suede upper' : 'Leather upper'; },
    },
    nosynth: {
      label: function () { return 'Not synthetic'; }, cats: ['boots', 'shoes', 'insulated', 'base', 'socks'],
      test: function (p) { return isFoot(p) ? p.upper !== 'synthetic' : p.cat === 'insulated' ? p.fill === 'down' : p.material === 'merino'; },
      why: function (p) { return isFoot(p) ? (p.upper === 'leather' ? 'Leather upper' : 'Suede upper') : p.cat === 'insulated' ? 'Down fill' : 'Merino wool'; },
      miss: function () { return 'Synthetic'; },
    },
    synthetic: {
      label: function () { return 'Synthetic'; }, cats: ['boots', 'shoes', 'insulated', 'base', 'socks'],
      test: function (p) { return isFoot(p) ? p.upper === 'synthetic' : p.cat === 'insulated' ? p.fill === 'synthetic' : p.material === 'synthetic'; },
      why: function (p) { return isFoot(p) ? 'Synthetic upper' : p.cat === 'insulated' ? 'Synthetic fill, fine when damp' : 'Synthetic fabric'; },
      miss: function (p) { return isFoot(p) ? 'Leather or suede' : p.cat === 'insulated' ? 'Down fill' : 'Merino'; },
    },
    merino: {
      label: function () { return 'Merino wool'; }, adj: 'merino', cats: ['base', 'socks'],
      test: function (p) { return p.material === 'merino'; },
      why: function (p) { return p.cat === 'base' ? p.gsm + ' g/m² merino' : 'Merino wool'; },
      miss: function () { return 'Synthetic, not wool'; },
    },
    fill: {
      label: function (v) { return v === 'down' ? 'Down fill' : 'No down'; }, cats: ['insulated'],
      test: function (p, v) { return p.fill === v; },
      why: function (p) { return p.fill === 'down' ? p.fp + ' fill down' : 'Synthetic fill, fine when damp'; },
      miss: function (p) { return p.fill === 'down' ? 'Down fill' : 'Synthetic fill'; },
    },
    packable: {
      label: function () { return 'Packs small'; }, cats: ['shells', 'insulated'],
      test: function (p) { return !!p.packable; },
      why: function () { return 'Packs into its own pocket'; },
      miss: function () { return 'Doesn’t pack small'; },
    },
    hood: {
      label: function () { return 'Hood'; }, cats: ['shells', 'insulated'],
      test: function (p) { return p.cat === 'shells' || !!p.hood; },
      why: function () { return 'Hooded'; },
      miss: function () { return 'No hood'; },
    },
    nohood: {
      label: function () { return 'No hood'; }, cats: ['insulated', 'base'],
      test: function (p) { return !p.hood; },
      why: function () { return 'No hood'; },
      miss: function () { return 'Has a hood'; },
    },
    helmet: {
      label: function () { return 'Helmet-size hood'; }, cats: ['shells'],
      test: function (p) { return !!p.helmet; },
      why: function () { return 'Hood fits over a helmet'; },
      miss: function () { return 'Hood won’t fit a helmet'; },
    },
    pitzips: {
      label: function () { return 'Pit zips'; }, cats: ['shells'],
      test: function (p) { return !!p.pitZips; },
      why: function () { return 'Underarm vents'; },
      miss: function () { return 'No pit zips'; },
    },
    pfc: {
      label: function () { return 'PFC-free'; }, cats: ['shells'],
      test: function (p) { return !!p.pfcFree; },
      why: function () { return 'PFC-free proofing'; },
      miss: function () { return 'Not PFC-free'; },
    },
    crampon: {
      label: function (v) { return 'Takes ' + v + ' crampons'; }, cats: FOOT,
      test: function (p, v) { return CRAMPON[p.crampon] >= CRAMPON[v]; },
      why: function (p) { return p.crampon + ' crampon-ready'; },
      miss: function () { return 'Won’t take crampons'; },
    },
    raincover: {
      label: function () { return 'Rain cover'; }, cats: ['packs'],
      test: function (p) { return !!p.raincover; },
      why: function () { return 'Rain cover included'; },
      miss: function () { return 'No rain cover'; },
    },
    hydration: {
      label: function () { return 'Fits a water bladder'; }, cats: ['packs'],
      test: function (p) { return !!p.hydration; },
      why: function () { return 'Bladder sleeve'; },
      miss: function () { return 'No bladder sleeve'; },
    },
    capacity: {
      label: function (v) {
        if (v.day) return 'Day-sized, up to 35 L';
        if (v.around) return 'About ' + v.around + ' litres';
        if (v.min && v.max) return v.min + '–' + v.max + ' litres';
        if (v.min) return v.min + ' litres or more';
        return 'Up to ' + v.max + ' litres';
      },
      cats: ['packs'],
      test: function (p, v) { return (!v.max || p.litres <= v.max) && (!v.min || p.litres >= v.min); },
      why: function (p) { return p.litres + ' litres'; },
      miss: function (p) { return p.litres + ' litres'; },
    },
    cushion: {
      label: function (v) { return v === 'heavy' ? 'Thick cushioning' : v === 'light' ? 'Light cushioning' : 'Cushioned'; }, cats: ['socks'],
      test: function (p, v) { return v === 'cushioned' ? p.cushion !== 'light' : p.cushion === v; },
      score: function (p) { return { light: 0.2, mid: 0.7, heavy: 1 }[p.cushion] || 0; },
      why: function (p) { return { light: 'Light cushioning', mid: 'Mid cushioning', heavy: 'Thick cushioning' }[p.cushion]; },
      miss: function (p) { return { light: 'Light cushioning', mid: 'Mid cushioning', heavy: 'Thick cushioning' }[p.cushion]; },
    },
    height: {
      label: function (v) { return v === 'ankle' ? 'Ankle length' : 'Knee length'; }, cats: ['socks'],
      test: function (p, v) { return p.height === v; },
      why: function (p, v) { return v === 'ankle' ? 'Ankle length' : 'Knee length'; },
      miss: function (p) { return p.height === 'boot' ? 'Mid-calf length' : p.height + ' length'; },
    },
    sleeve: {
      label: function (v) { return v === 'short' ? 'Short sleeve' : 'Long sleeve'; }, cats: ['base'],
      test: function (p, v) { return p.sleeve === v; },
      why: function (p) { return p.sleeve === 'short' ? 'Short sleeve' : 'Long sleeve'; },
      miss: function (p) { return p.sleeve === 'short' ? 'Short sleeve' : 'Long sleeve'; },
    },
    zipneck: {
      label: function () { return 'Zip neck'; }, cats: ['base'],
      test: function (p) { return !!p.zip; },
      why: function () { return 'Zip neck'; },
      miss: function () { return 'Crew neck'; },
    },
    gilet: {
      label: function () { return 'Gilet'; }, cats: ['insulated'],
      test: function (p) { return !!p.gilet; },
      why: function () { return 'Sleeveless'; },
      miss: function () { return 'Has sleeves'; },
    },
    breathable: {
      label: function () { return 'Breathable'; }, cats: ['boots', 'shoes', 'shells', 'base', 'socks'],
      test: function (p) { return DEF.breathable.score(p) >= 0.6; },
      score: function (p) {
        if (isFoot(p)) return p.wp ? 0.2 : 1;
        if (p.cat === 'shells') return (p.layers === '3-layer' ? 0.6 : 0.3) + (p.pitZips ? 0.4 : 0);
        if (p.cat === 'base' || p.cat === 'socks') return p.material === 'merino' ? 0.8 : 0.6;
        return 0;
      },
      why: function (p) { return isFoot(p) ? 'Mesh, no membrane' : p.cat === 'shells' ? (p.pitZips ? 'Underarm vents' : p.layers) : 'Breathable merino'; },
      miss: function () { return 'Less breathable'; },
    },
    rated: {
      label: function (v) { return v === 'comfort' ? 'Comfort, by reviews' : 'Best reviewed'; },
      test: function (p) { return p.rating >= 4.6; },
      score: function (p) { return (p.rating - 4) / 1 * 0.8 + p.popN * 0.2; },
      why: function (p) { return 'Rated ' + p.rating.toFixed(1) + ' by ' + p.reviews + ' walkers'; },
      miss: function (p) { return 'Rated ' + p.rating.toFixed(1); },
    },
    cheap: {
      label: function () { return 'Lower price'; },
      test: function (p) { return p.price <= ctxFallback.median(p.cat); },
      score: function (p, v, ctx) { var r = ctx.range(p.cat, 'price'); return r.max === r.min ? 0.5 : 1 - (p.price - r.min) / (r.max - r.min); },
      why: function () { return ''; },
      miss: function (p) { return money(p.price); },
    },
    instock: {
      label: function () { return 'In stock now'; },
      test: function (p) { return p.stock > 0; },
      why: function () { return 'In stock'; },
      miss: function (p) { return 'Back in ' + p.back + ' days'; },
    },
    use: {
      kind: 'for',
      label: function (v) { return useLabel(v); },
      means: function (v, cats) {
        var m = USE[v] || {};
        var parts = [];
        (cats || Object.keys(m.text || {})).forEach(function (c) { if (m.text && m.text[c] && parts.indexOf(m.text[c]) < 0) parts.push(m.text[c]); });
        return parts.join('; ');
      },
      test: function (p, v) { var m = USE[v]; return m && m.test ? m.test(p) : p.uses.indexOf(v) >= 0; },
      why: function (p, v) { var m = USE[v]; return m && m.why ? m.why(p) : 'Made for ' + useLabel(v).toLowerCase(); },
      miss: function (p, v) { var m = USE[v]; return m && m.miss ? m.miss(p) : 'Not made for ' + useLabel(v).toLowerCase(); },
    },
  };

  var ctxFallback = {
    median: function (cat) {
      var prices = ALL.filter(function (p) { return p.cat === cat; }).map(function (p) { return p.price; }).sort(function (a, b) { return a - b; });
      return prices[Math.floor(prices.length / 2)];
    },
  };

  // What a use means, category by category.
  var USE = {
    winter: {
      text: { boots: 'boots: waterproof and take B1 crampons', shoes: 'shoes: waterproof and take B1 crampons', shells: 'waterproofs: 20,000 mm or more', insulated: 'insulation: warmth 4 of 5 or more', packs: 'rucksacks: 30 litres or more', base: 'base layers: 200 g/m² or heavier', socks: 'socks: mid or thick cushioning' },
      test: function (p) {
        if (isFoot(p)) return p.wp && CRAMPON[p.crampon] >= 1;
        if (p.cat === 'shells') return p.hh >= 20000;
        if (p.cat === 'insulated') return p.warmth >= 4;
        if (p.cat === 'packs') return p.litres >= 30;
        if (p.cat === 'base') return p.gsm >= 200;
        if (p.cat === 'socks') return p.cushion !== 'light';
        return false;
      },
      why: function (p) {
        if (isFoot(p)) return p.crampon + ' crampon-ready';
        if (p.cat === 'shells') return mm(p.hh) + ' waterproof';
        if (p.cat === 'insulated') return 'Warmth ' + p.warmth + ' of 5';
        if (p.cat === 'packs') return p.litres + ' litres';
        if (p.cat === 'base') return p.gsm + ' g/m² ' + p.material;
        return (p.cushion === 'heavy' ? 'Thick' : 'Mid') + ' cushioning';
      },
      miss: function (p) {
        if (isFoot(p)) return !p.wp ? 'Not waterproof' : 'Won’t take crampons';
        if (p.cat === 'shells') return 'Only ' + mm(p.hh);
        if (p.cat === 'insulated') return 'Warmth ' + p.warmth + '/5';
        if (p.cat === 'packs') return 'Only ' + p.litres + ' litres';
        if (p.cat === 'base') return 'Only ' + p.gsm + ' g/m²';
        return 'Light cushioning';
      },
    },
    backpacking: {
      text: { packs: 'rucksacks: 45 litres or more', boots: 'boots made for multi-day walks' },
      test: function (p) { return p.cat === 'packs' ? p.litres >= 45 : p.uses.indexOf('backpacking') >= 0 || p.uses.indexOf('hill') >= 0; },
      why: function (p) { return p.cat === 'packs' ? p.litres + ' litres' : 'Made for long days'; },
      miss: function (p) { return p.cat === 'packs' ? 'Only ' + p.litres + ' litres' : 'Not made for multi-day'; },
    },
  };

  // "Something for the Three Peaks": start from the kit that use is really about.
  var USECATS = {
    hill: ['boots', 'shells', 'packs'], winter: ['boots', 'shells', 'insulated'], backpacking: ['packs', 'boots'],
    day: ['boots', 'shoes', 'shells'], travel: ['shoes', 'shells', 'insulated'], running: ['shells', 'packs'], scrambling: ['shoes', 'boots', 'packs'],
  };
  function catsOf(def, v) { return typeof def.cats === 'function' ? def.cats(v) : def.cats || null; }

  // ---- Build criteria from specs --------------------------------------------
  function materialise(spec) {
    var def = DEF[spec.key];
    if (!def) return null;
    return {
      key: spec.key, value: spec.value, mode: spec.mode || 'must', pos: spec.pos || 0, from: spec.from, implied: spec.implied, altFor: spec.altFor,
      id: window.ScarthReader.specId(spec),
      kind: spec.key === 'cat' ? 'what' : def.kind === 'budget' ? 'budget' : def.kind === 'for' ? 'for' : spec.mode === 'prefer' ? 'prefer' : 'must',
      label: def.label(spec.value),
      cats: catsOf(def, spec.value),
      def: def,
    };
  }

  // Specs plus the shopper's own edits (overrides keyed by spec id: a spec, or null for removed).
  function criteriaFrom(specs, overrides) {
    var list = specs.slice();
    overrides = overrides || {};
    Object.keys(overrides).forEach(function (id) {
      var idx = -1;
      list.forEach(function (s, i) { if (window.ScarthReader.specId(s) === id) idx = i; });
      var o = overrides[id];
      if (o === null) { if (idx >= 0) list.splice(idx, 1); return; }
      if (idx >= 0) list[idx] = Object.assign({}, list[idx], o, { pos: list[idx].pos });
      else list.push(Object.assign({ pos: 9999 }, o));
    });
    var crits = list.map(materialise).filter(Boolean);
    // No category said? Infer one from must-haves that only make sense in some categories.
    var cat = crits.filter(function (c) { return c.key === 'cat'; })[0];
    if (!cat && overrides.cat !== null) {
      var inter = null;
      crits.forEach(function (c) {
        if (c.mode !== 'must' || !c.cats || c.key === 'use') return;
        inter = inter ? inter.filter(function (x) { return c.cats.indexOf(x) >= 0; }) : c.cats.slice();
      });
      var use = crits.filter(function (c) { return c.key === 'use'; })[0];
      if (!inter && use && USECATS[use.value]) inter = USECATS[use.value].slice();
      if (inter && inter.length) {
        cat = materialise({ key: 'cat', value: inter, mode: 'must', pos: -1, implied: true });
        crits.unshift(cat);
      }
    }
    return crits;
  }

  // ---- Run --------------------------------------------------------------------
  function run(crits) {
    var cat = crits.filter(function (c) { return c.key === 'cat'; })[0] || null;
    var musts = crits.filter(function (c) { return c.key !== 'cat' && c.mode === 'must'; }).sort(function (a, b) { return a.pos - b.pos; });
    var prefers = crits.filter(function (c) { return c.mode === 'prefer'; }).sort(function (a, b) { return a.pos - b.pos; });

    function passes(c, p) {
      if (c.cats && c.cats.indexOf(p.cat) < 0) return false;
      return c.def.test(p, c.value);
    }

    // The strip: whole shop → category → each must-have in the order it was said.
    var steps = [{ label: 'Whole shop', key: 'all', ids: ALL.map(function (p) { return p.id; }) }];
    var pool = ALL;
    if (cat) {
      pool = pool.filter(function (p) { return cat.def.test(p, cat.value); });
      steps.push({ label: cat.label, key: cat.id, crit: cat, ids: pool.map(function (p) { return p.id; }) });
    }
    var catPool = pool;
    musts.forEach(function (c) {
      c.byCategory = !!cat && catPool.length > 0 && catPool.every(function (p) { return passes(c, p); });
      pool = pool.filter(function (p) { return passes(c, p); });
      if (c.byCategory) return;
      steps.push({ label: c.label, key: c.id, crit: c, ids: pool.map(function (p) { return p.id; }) });
    });

    var ctx = makeCtx(pool.length ? pool : catPool);
    var ranked = pool.map(function (p) { return { p: p, score: score(p, prefers, ctx) }; })
      .sort(function (a, b) { return b.score - a.score || (a.p.id < b.p.id ? -1 : 1); });

    var results = ranked.map(function (r) { return { p: r.p, score: r.score, why: reasons(r.p, musts, prefers, ctx), prefs: prefHits(r.p, prefers) }; });

    // Close misses: in the category, fail exactly one must-have.
    var nearly = [];
    if (musts.length) {
      catPool.forEach(function (p) {
        var failed = musts.filter(function (c) { return !passes(c, p); });
        if (failed.length !== 1) return;
        var c = failed[0];
        if (c.cats && c.cats.indexOf(p.cat) < 0) return;
        var close = c.def.close ? c.def.close(p, c.value) : c.key === 'size' ? 0.75 : 0.55;
        if (close < 0.2) return;
        nearly.push({ p: p, crit: c, miss: c.def.miss(p, c.value), close: close + score(p, prefers, ctx) / 1000 * 0.01 + p.popN * 0.05, relax: relaxFor(c, p) });
      });
      nearly.sort(function (a, b) { return b.close - a.close || (a.p.id < b.p.id ? -1 : 1); });
    }

    var relaxations = results.length ? [] : relaxAll(crits, cat, musts);
    return { cat: cat, musts: musts, prefers: prefers, steps: steps, results: results, nearly: nearly.slice(0, 3), relaxations: relaxations, crits: crits };
  }

  function makeCtx(pool) {
    var cache = {};
    return {
      range: function (cat, field) {
        var k = cat + field;
        if (!cache[k]) {
          var vals = pool.filter(function (p) { return p.cat === cat; }).map(function (p) { return p[field]; });
          if (!vals.length) vals = ALL.filter(function (p) { return p.cat === cat; }).map(function (p) { return p[field]; });
          cache[k] = { min: Math.min.apply(null, vals), max: Math.max.apply(null, vals) };
        }
        return cache[k];
      },
    };
  }

  function prefScore(c, p, ctx) {
    if (c.cats && c.cats.indexOf(p.cat) < 0) return 0;
    return c.def.score ? Math.max(0, Math.min(1, c.def.score(p, c.value, ctx))) : c.def.test(p, c.value) ? 1 : 0;
  }

  // In stock first, then each preference (10 points each), then reviews.
  function score(p, prefers, ctx) {
    var s = p.stock > 0 ? 1000 : 0;
    prefers.forEach(function (c) { s += 10 * prefScore(c, p, ctx); });
    return s + 3 * p.popN;
  }

  function prefHits(p, prefers) {
    return prefers.map(function (c) { return { crit: c, hit: (!c.cats || c.cats.indexOf(p.cat) >= 0) && c.def.test(p, c.value) }; });
  }

  // One line: the must-haves it meets, the preferences it meets, then one useful fact.
  function reasons(p, musts, prefers) {
    var out = [];
    function add(text, type) {
      if (!text) return;
      var t = text.toLowerCase();
      if (out.some(function (o) { var u = o.text.toLowerCase(); return u === t || u.indexOf(t) >= 0 || t.indexOf(u) >= 0; })) return;
      out.push({ text: text, type: type });
    }
    musts.forEach(function (c) { if (c.def.why && c.key !== 'budget' && c.key !== 'gender' && c.key !== 'instock' && c.key !== 'size') add(c.def.why(p, c.value), 'must'); });
    prefers.forEach(function (c) {
      if ((!c.cats || c.cats.indexOf(p.cat) >= 0) && c.def.why && c.def.test(p, c.value)) add(c.def.why(p, c.value), 'prefer');
    });
    var extra = { boots: weightText(p), shoes: weightText(p), shells: p.hh ? mm(p.hh) + ' waterproof' : null, insulated: p.fill === 'down' ? p.fp + ' fill down' : 'Synthetic fill', packs: p.litres + ' litres', base: p.gsm + ' g/m² ' + p.material, socks: (p.cushion === 'heavy' ? 'Thick' : p.cushion === 'mid' ? 'Mid' : 'Light') + ' cushioning' }[p.cat];
    if (out.length < 4) add(extra, 'fact');
    return out.slice(0, 5);
  }

  function relaxFor(c, p) {
    if (c.key === 'budget') {
      if (c.value.max && p.price > c.value.max) {
        var to = Math.ceil(p.price / 10) * 10;
        return { label: 'Show up to £' + to, spec: { key: 'budget', value: { max: to, min: c.value.min }, mode: 'must' }, id: 'budget' };
      }
      return { label: 'Drop the minimum', spec: { key: 'budget', value: { max: c.value.max }, mode: 'must' }, id: 'budget' };
    }
    if (c.key === 'size') return { label: 'Show other sizes', spec: null, id: c.id };
    return { label: 'Make ‘' + c.label + '’ optional', spec: { key: c.key, value: c.value, mode: 'prefer' }, id: c.id };
  }

  // Nothing fits: try loosening each must-have in turn and say what each would give.
  function relaxAll(crits, cat, musts) {
    var out = [];
    var budget = musts.filter(function (c) { return c.key === 'budget'; })[0];
    var others = musts.filter(function (c) { return c !== budget; });
    function poolWithout(skip) {
      var pool = ALL;
      if (cat) pool = pool.filter(function (p) { return cat.def.test(p, cat.value); });
      musts.forEach(function (c) {
        if (c === skip) return;
        pool = pool.filter(function (p) { return (!c.cats || c.cats.indexOf(p.cat) >= 0) && c.def.test(p, c.value); });
      });
      return pool;
    }
    if (budget && budget.value.max) {
      var pool = poolWithout(budget).filter(function (p) { return !budget.value.min || p.price >= budget.value.min; });
      if (pool.length) {
        var cheapest = Math.min.apply(null, pool.map(function (p) { return p.price; }));
        var to = Math.max(Math.ceil(cheapest / 10) * 10, budget.value.max + 10);
        var n = pool.filter(function (p) { return p.price <= to; }).length;
        out.push({ label: 'Show up to £' + to, count: n, spec: { key: 'budget', value: { max: to, min: budget.value.min }, mode: 'must' }, id: 'budget', kind: 'budget', to: to });
      }
    }
    others.forEach(function (c) {
      var n = poolWithout(c).length;
      if (n) out.push({ label: c.key === 'size' || c.key === 'gender' ? 'Drop ‘' + c.label + '’' : 'Make ‘' + c.label + '’ optional', count: n, spec: { key: c.key, value: c.value, mode: c.key === 'size' || c.key === 'gender' ? 'must' : 'prefer' }, remove: c.key === 'size' || c.key === 'gender', id: c.id, crit: c });
    });
    if (!out.length && cat) {
      out.push({ label: 'Search all of ' + cat.label.toLowerCase(), count: ALL.filter(function (p) { return cat.def.test(p, cat.value); }).length, clearMusts: true });
    }
    out.sort(function (a, b) { return (a.kind === 'budget' ? -1 : 0) - (b.kind === 'budget' ? -1 : 0) || b.count - a.count; });
    return out.slice(0, 3);
  }

  // "Nothing waterproof and wide fit in walking boots under £40"
  function nothingLine(res) {
    var adjs = res.musts.filter(function (c) { return c.key !== 'budget' && c.key !== 'size' && c.key !== 'gender'; }).map(function (c) {
      var a = c.def.adj; return typeof a === 'function' ? a(c.value) : a || c.label.toLowerCase();
    });
    var size = res.musts.filter(function (c) { return c.key === 'size'; })[0];
    var gender = res.musts.filter(function (c) { return c.key === 'gender'; })[0];
    var budget = res.musts.filter(function (c) { return c.key === 'budget'; })[0];
    var line;
    if (res.cat) line = 'No ' + (gender ? gender.label.toLowerCase() + ' ' : '') + (adjs.length ? joinAnd(adjs) + ' ' : '') + res.cat.label.toLowerCase();
    else line = 'Nothing' + (gender ? ' ' + gender.label.toLowerCase() : '') + (adjs.length ? ' ' + joinAnd(adjs) : '');
    if (size) line += ' in size ' + size.value;
    if (budget) line += ' ' + budget.label.charAt(0).toLowerCase() + budget.label.slice(1);
    return line + '.';
  }
  function joinAnd(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }

  window.ScarthDecide = {
    DEF: DEF, USE: USE, criteriaFrom: criteriaFrom, run: run, materialise: materialise, nothingLine: nothingLine,
    weightText: weightText, sizeOf: sizeOf, isFoot: isFoot, useLabel: useLabel,
  };
})();
