/* Scarth catalogue: 74 products, all fictional.
 * Every product has the same core fields so filters and ranking compare like with like:
 *   id, cat, name, brand, g (m | w | u), price (£ inc VAT), colour, fam (colour family),
 *   weight (grams; boots and shoes are per pair), rating, reviews, stock (0 = out of stock),
 *   back (working days until back in stock), sizes, out (sizes sold out), uses, plus
 *   category attributes. `img` is the file stem in assets/img/products/.
 */
(function () {
  'use strict';

  function halves(a, b) { var out = []; for (var n = a; n <= b; n += 0.5) out.push(n); return out; }
  var MEN_BOOT = halves(6, 13);     // UK sizes, half sizes included
  var WOMEN_BOOT = halves(3, 8);
  var UNI_BOOT = halves(4, 12);
  var MEN_CLOTH = ['S', 'M', 'L', 'XL', 'XXL'];
  var WOMEN_CLOTH = ['XS', 'S', 'M', 'L', 'XL'];
  var UNI_CLOTH = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  var SOCK = ['S', 'M', 'L', 'XL']; // S 3–5, M 6–8, L 9–11, XL 12–14

  var CATEGORIES = [
    { id: 'boots', name: 'Walking boots', short: 'Boots', group: 'footwear' },
    { id: 'shoes', name: 'Walking shoes', short: 'Shoes', group: 'footwear' },
    { id: 'shells', name: 'Waterproof jackets', short: 'Waterproofs', group: 'jackets' },
    { id: 'insulated', name: 'Insulated jackets', short: 'Insulation', group: 'jackets' },
    { id: 'packs', name: 'Rucksacks', short: 'Rucksacks', group: 'packs' },
    { id: 'base', name: 'Base layers', short: 'Base layers', group: 'base' },
    { id: 'socks', name: 'Socks', short: 'Socks', group: 'socks' },
  ];

  function boot(o) {
    o.sizes = o.g === 'w' ? WOMEN_BOOT : o.g === 'm' ? MEN_BOOT : UNI_BOOT;
    return o;
  }
  function cloth(o) {
    o.sizes = o.g === 'w' ? WOMEN_CLOTH : o.g === 'm' ? MEN_CLOTH : UNI_CLOTH;
    return o;
  }

  var P = [
    // ---- Walking boots (16) ------------------------------------------------
    boot({ id: 'b01', cat: 'boots', name: 'Ashgill Mid Waterproof Wide', brand: 'Garron', g: 'm', price: 109, colour: 'Moss green', fam: 'green', weight: 1140, upper: 'synthetic', wp: true, fit: 'wide', crampon: 'B0', rating: 4.6, reviews: 212, stock: 14, out: [], uses: ['hill', 'day'],
      img: 'b01', subject: 'a single mid-height synthetic walking boot with suede overlays in moss green, dark grey chunky lugged rubber sole, dark green laces, padded collar' }),
    boot({ id: 'b02', cat: 'boots', name: 'Ashgill Mid Waterproof Wide', brand: 'Garron', g: 'w', price: 109, colour: 'Slate blue', fam: 'blue', weight: 980, upper: 'synthetic', wp: true, fit: 'wide', crampon: 'B0', rating: 4.5, reviews: 164, stock: 9, out: [3], uses: ['hill', 'day'],
      img: 'b02', subject: "a single women's mid-height synthetic walking boot with suede overlays in slate blue, dark grey lugged rubber sole, light grey laces, padded collar" }),
    boot({ id: 'b03', cat: 'boots', name: 'Tarnside Leather Waterproof Wide', brand: 'Garron', g: 'm', price: 135, colour: 'Chestnut', fam: 'brown', weight: 1380, upper: 'leather', wp: true, fit: 'wide', crampon: 'B1', rating: 4.8, reviews: 301, stock: 11, out: [], uses: ['hill', 'winter', 'backpacking'],
      img: 'b03', subject: 'a single classic full-grain leather hillwalking boot in chestnut brown, one-piece leather upper, black rubber rand, stiff black lugged sole, red-brown round laces through metal hooks' }),
    boot({ id: 'b04', cat: 'boots', name: 'Fellwalker Waterproof Wide', brand: 'Scarth', g: 'm', price: 89, colour: 'Charcoal', fam: 'grey', weight: 1220, upper: 'synthetic', wp: true, fit: 'wide', crampon: 'B0', rating: 4.4, reviews: 388, stock: 22, out: [], uses: ['day', 'hill'],
      img: 'b04', subject: 'a single mid-height synthetic walking boot in charcoal grey fabric with black overlays, black lugged rubber sole, grey laces' }),
    boot({ id: 'b05', cat: 'boots', name: 'Fellwalker Waterproof Wide', brand: 'Scarth', g: 'w', price: 89, colour: 'Heather', fam: 'purple', weight: 1040, upper: 'synthetic', wp: true, fit: 'wide', crampon: 'B0', rating: 4.4, reviews: 276, stock: 3, out: [], uses: ['day', 'hill'],
      img: 'b05', subject: "a single women's mid-height synthetic walking boot in muted heather purple fabric with grey overlays, grey lugged rubber sole, purple laces" }),
    boot({ id: 'b06', cat: 'boots', name: 'Langstrath Waterproof Wide', brand: 'Garron', g: 'm', price: 129, colour: 'Fern green', fam: 'green', weight: 1060, upper: 'synthetic', wp: true, fit: 'wide', crampon: 'B0', rating: 4.8, reviews: 268, stock: 8, out: [], uses: ['hill', 'day', 'backpacking'],
      img: 'b06', subject: 'a single lightweight modern mid-height hiking boot in fern green knit-look synthetic fabric with black welded overlays, black and grey lugged sole, black laces' }),
    boot({ id: 'b07', cat: 'boots', name: 'Ridgeback Leather Wide', brand: 'Garron', g: 'm', price: 119, colour: 'Walnut', fam: 'brown', weight: 1300, upper: 'leather', wp: true, fit: 'wide', crampon: 'B1', rating: 4.7, reviews: 233, stock: 6, out: [11], uses: ['hill', 'winter'],
      img: 'b07', subject: 'a single nubuck leather hillwalking boot in walnut brown, tan stitching, black rubber toe cap, black lugged sole, tan laces through metal hooks' }),
    boot({ id: 'b08', cat: 'boots', name: 'Crinkle Mid Waterproof', brand: 'Garron', g: 'm', price: 99, colour: 'Black', fam: 'black', weight: 1100, upper: 'synthetic', wp: true, fit: 'standard', crampon: 'B0', rating: 4.5, reviews: 190, stock: 17, out: [], uses: ['hill', 'day'],
      img: 'b08', subject: 'a single mid-height synthetic walking boot in black with dark grey mesh panels, black lugged rubber sole, black laces' }),
    boot({ id: 'b09', cat: 'boots', name: 'Crinkle Mid Waterproof', brand: 'Garron', g: 'w', price: 99, colour: 'Teal', fam: 'blue', weight: 940, upper: 'synthetic', wp: true, fit: 'standard', crampon: 'B0', rating: 4.5, reviews: 158, stock: 12, out: [], uses: ['hill', 'day'],
      img: 'b09', subject: "a single women's mid-height synthetic walking boot in deep teal with grey mesh panels, grey lugged rubber sole, teal laces" }),
    boot({ id: 'b10', cat: 'boots', name: 'Kirkfell Leather Waterproof', brand: 'Scarth', g: 'm', price: 149, colour: 'Brown', fam: 'brown', weight: 1420, upper: 'leather', wp: true, fit: 'standard', crampon: 'B1', rating: 4.6, reviews: 122, stock: 7, out: [], uses: ['hill', 'winter', 'backpacking'],
      img: 'b10', subject: 'a single traditional dark brown full-grain leather walking boot with a padded leather collar, brown rubber rand, black lugged sole, brown laces' }),
    boot({ id: 'b11', cat: 'boots', name: 'Coniston Pro Waterproof', brand: 'Garron', g: 'm', price: 189, colour: 'Graphite', fam: 'grey', weight: 1560, upper: 'leather', wp: true, fit: 'standard', crampon: 'B2', rating: 4.8, reviews: 97, stock: 5, out: [], uses: ['winter', 'hill', 'scrambling'],
      img: 'b11', subject: 'a single stiff high-cut winter mountain boot in graphite grey leather with a black rubber rand all round, heel welt for crampons, deep black lugged sole, black laces' }),
    boot({ id: 'b12', cat: 'boots', name: 'Coniston Pro Waterproof', brand: 'Garron', g: 'w', price: 189, colour: 'Dark grey', fam: 'grey', weight: 1380, upper: 'leather', wp: true, fit: 'standard', crampon: 'B2', rating: 4.7, reviews: 64, stock: 0, back: 8, out: [], uses: ['winter', 'hill', 'scrambling'],
      img: 'b12', subject: "a single women's stiff high-cut winter mountain boot in dark grey leather with a dark red rubber rand, heel welt for crampons, black lugged sole, grey laces" }),
    boot({ id: 'b13', cat: 'boots', name: 'Pennine Lite Waterproof Narrow', brand: 'Scarth', g: 'w', price: 79, colour: 'Olive', fam: 'green', weight: 860, upper: 'synthetic', wp: true, fit: 'narrow', crampon: 'B0', rating: 4.3, reviews: 141, stock: 15, out: [], uses: ['day'],
      img: 'b13', subject: "a single slim women's lightweight walking boot in olive green synthetic fabric, light grey midsole, dark lugged sole, olive laces" }),
    boot({ id: 'b14', cat: 'boots', name: 'Dales Suede Mid Wide', brand: 'Scarth', g: 'm', price: 65, colour: 'Tan', fam: 'brown', weight: 1050, upper: 'suede', wp: false, fit: 'wide', crampon: 'B0', rating: 4.2, reviews: 219, stock: 20, out: [], uses: ['day'],
      img: 'b14', subject: 'a single casual mid-height suede walking boot in tan, cream stitching, brown rubber sole, tan laces' }),
    boot({ id: 'b15', cat: 'boots', name: 'Dales Suede Mid', brand: 'Scarth', g: 'w', price: 65, colour: 'Sage', fam: 'green', weight: 900, upper: 'suede', wp: false, fit: 'standard', crampon: 'B0', rating: 4.2, reviews: 173, stock: 18, out: [], uses: ['day'],
      img: 'b15', subject: "a single women's casual mid-height suede walking boot in pale sage green, cream stitching, light brown rubber sole, cream laces" }),
    boot({ id: 'b16', cat: 'boots', name: 'Summer Mid Vent', brand: 'Garron', g: 'm', price: 85, colour: 'Stone', fam: 'neutral', weight: 820, upper: 'synthetic', wp: false, fit: 'standard', crampon: 'B0', rating: 4.4, reviews: 88, stock: 10, out: [], uses: ['day', 'travel'],
      img: 'b16', subject: 'a single lightweight breathable mesh hiking boot in stone beige with light grey overlays, beige and grey lugged sole, beige laces' }),

    // ---- Walking shoes (6) -------------------------------------------------
    boot({ id: 's01', cat: 'shoes', name: 'Trailhead Low Waterproof', brand: 'Scarth', g: 'm', price: 75, colour: 'Grey and orange', fam: 'grey', weight: 760, upper: 'synthetic', wp: true, fit: 'standard', crampon: 'B0', rating: 4.4, reviews: 254, stock: 19, out: [], uses: ['day', 'travel'],
      img: 's01', subject: 'a single low-cut walking shoe in mid grey synthetic mesh with orange accents, black lugged sole, grey laces' }),
    boot({ id: 's02', cat: 'shoes', name: 'Trailhead Low Waterproof', brand: 'Scarth', g: 'w', price: 75, colour: 'Blue', fam: 'blue', weight: 640, upper: 'synthetic', wp: true, fit: 'standard', crampon: 'B0', rating: 4.5, reviews: 231, stock: 16, out: [], uses: ['day', 'travel'],
      img: 's02', subject: "a single women's low-cut walking shoe in mid blue synthetic mesh with light grey overlays, grey lugged sole, blue laces" }),
    boot({ id: 's03', cat: 'shoes', name: 'Scree Approach', brand: 'Garron', g: 'u', price: 110, colour: 'Orange', fam: 'orange', weight: 820, upper: 'suede', wp: false, fit: 'standard', crampon: 'B0', rating: 4.6, reviews: 77, stock: 6, out: [], uses: ['scrambling', 'hill'],
      img: 's03', subject: 'a single low-cut approach shoe in burnt orange suede with a sticky black rubber rand wrapping the toe, flat climbing-zone toe, black sole, lacing to the toe' }),
    boot({ id: 's04', cat: 'shoes', name: 'Wayfarer Low Waterproof Wide', brand: 'Garron', g: 'm', price: 95, colour: 'Olive', fam: 'green', weight: 800, upper: 'synthetic', wp: true, fit: 'wide', crampon: 'B0', rating: 4.5, reviews: 109, stock: 9, out: [], uses: ['day', 'travel'],
      img: 's04', subject: 'a single wide low-cut walking shoe in olive green synthetic fabric with black overlays, black lugged sole, black laces' }),
    boot({ id: 's05', cat: 'shoes', name: 'Ramble Low', brand: 'Scarth', g: 'w', price: 55, colour: 'Plum', fam: 'purple', weight: 600, upper: 'synthetic', wp: false, fit: 'standard', crampon: 'B0', rating: 4.1, reviews: 192, stock: 25, out: [], uses: ['day', 'travel'],
      img: 's05', subject: "a single women's lightweight low walking shoe in plum purple mesh, white midsole, grey lugged sole, plum laces" }),
    boot({ id: 's06', cat: 'shoes', name: 'Hyke Leather Low Waterproof', brand: 'Garron', g: 'm', price: 99, colour: 'Brown', fam: 'brown', weight: 900, upper: 'leather', wp: true, fit: 'standard', crampon: 'B0', rating: 4.3, reviews: 85, stock: 0, back: 6, out: [], uses: ['day', 'travel'],
      img: 's06', subject: 'a single low-cut leather walking shoe in dark brown smooth leather, brown rubber sole with lugs, brown waxed laces' }),

    // ---- Waterproof jackets (14) -------------------------------------------
    cloth({ id: 'j01', cat: 'shells', name: 'Bowfell 3L Jacket', brand: 'Corrie', g: 'm', price: 220, colour: 'Tarn blue', fam: 'blue', weight: 420, hh: 28000, layers: '3-layer', wp: true, packable: false, helmet: true, pitZips: true, pfcFree: true, rating: 4.7, reviews: 156, stock: 8, out: ['XXL'], uses: ['hill', 'winter', 'scrambling'],
      img: 'j01', subject: "a men's technical three-layer waterproof mountain jacket in deep lake blue, large hood, chest pockets, underarm zips, full front zip closed" }),
    cloth({ id: 'j02', cat: 'shells', name: 'Bowfell 3L Jacket', brand: 'Corrie', g: 'w', price: 220, colour: 'Rust', fam: 'orange', weight: 380, hh: 28000, layers: '3-layer', wp: true, packable: false, helmet: true, pitZips: true, pfcFree: true, rating: 4.8, reviews: 121, stock: 6, out: [], uses: ['hill', 'winter', 'scrambling'],
      img: 'j02', subject: "a women's technical three-layer waterproof mountain jacket in rust orange, large hood, chest pockets, underarm zips, full front zip closed" }),
    cloth({ id: 'j03', cat: 'shells', name: 'Flyweight 2.5L Jacket', brand: 'Corrie', g: 'm', price: 119, colour: 'Moss', fam: 'green', weight: 210, hh: 15000, layers: '2.5-layer', wp: true, packable: true, helmet: false, pitZips: false, pfcFree: true, rating: 4.4, reviews: 203, stock: 21, out: [], uses: ['hill', 'day', 'travel', 'running'],
      img: 'j03', subject: "a men's ultralight minimalist packable rain jacket in moss green thin crinkly fabric, slim fitted hood, one chest pocket, full front zip closed" }),
    cloth({ id: 'j04', cat: 'shells', name: 'Flyweight 2.5L Jacket', brand: 'Corrie', g: 'w', price: 119, colour: 'Glacier blue', fam: 'blue', weight: 190, hh: 15000, layers: '2.5-layer', wp: true, packable: true, helmet: false, pitZips: false, pfcFree: true, rating: 4.5, reviews: 187, stock: 18, out: [], uses: ['hill', 'day', 'travel', 'running'],
      img: 'j04', subject: "a women's ultralight minimalist packable rain jacket in pale glacier blue thin fabric, slim fitted hood, one chest pocket, full front zip closed" }),
    cloth({ id: 'j05', cat: 'shells', name: 'Daywalker Waterproof Jacket', brand: 'Scarth', g: 'm', price: 79, colour: 'Black', fam: 'black', weight: 380, hh: 10000, layers: '2.5-layer', wp: true, packable: false, helmet: false, pitZips: false, pfcFree: false, rating: 4.3, reviews: 412, stock: 30, out: [], uses: ['day', 'travel'],
      img: 'j05', subject: "a men's simple everyday waterproof walking jacket in black, hood, two hand pockets with storm flaps, full front zip closed" }),
    cloth({ id: 'j06', cat: 'shells', name: 'Daywalker Waterproof Jacket', brand: 'Scarth', g: 'w', price: 79, colour: 'Berry', fam: 'red', weight: 340, hh: 10000, layers: '2.5-layer', wp: true, packable: false, helmet: false, pitZips: false, pfcFree: false, rating: 4.3, reviews: 367, stock: 27, out: [], uses: ['day', 'travel'],
      img: 'j06', subject: "a women's simple everyday waterproof walking jacket in deep berry red, hood, two hand pockets with storm flaps, full front zip closed" }),
    cloth({ id: 'j07', cat: 'shells', name: 'Cloudburst Long Jacket', brand: 'Scarth', g: 'w', price: 135, colour: 'Forest green', fam: 'green', weight: 520, hh: 20000, layers: '2.5-layer', wp: true, packable: false, helmet: false, pitZips: false, pfcFree: true, rating: 4.6, reviews: 144, stock: 10, out: [], uses: ['day', 'travel'],
      img: 'j07', subject: "a women's longer-length thigh-length waterproof walking coat in dark forest green, hood, drawcord waist, two lower pockets, full front zip closed" }),
    cloth({ id: 'j08', cat: 'shells', name: 'Winter Ridge 3L Jacket', brand: 'Corrie', g: 'm', price: 295, colour: 'Red', fam: 'red', weight: 560, hh: 30000, layers: '3-layer', wp: true, packable: false, helmet: true, pitZips: true, pfcFree: true, rating: 4.9, reviews: 73, stock: 4, out: [], uses: ['winter', 'hill', 'scrambling'],
      img: 'j08', subject: "a men's heavy-duty three-layer winter mountain shell jacket in bright red with dark grey reinforced shoulders, big stiff-peaked hood, chest pockets, underarm zips, full front zip closed" }),
    cloth({ id: 'j09', cat: 'shells', name: 'Winter Ridge 3L Jacket', brand: 'Corrie', g: 'w', price: 295, colour: 'Deep teal', fam: 'blue', weight: 500, hh: 30000, layers: '3-layer', wp: true, packable: false, helmet: true, pitZips: true, pfcFree: true, rating: 4.8, reviews: 58, stock: 3, out: ['XS'], uses: ['winter', 'hill', 'scrambling'],
      img: 'j09', subject: "a women's heavy-duty three-layer winter mountain shell jacket in deep teal with charcoal reinforced shoulders, big stiff-peaked hood, chest pockets, underarm zips, full front zip closed" }),
    cloth({ id: 'j10', cat: 'shells', name: 'Packaway Cagoule', brand: 'Scarth', g: 'u', price: 45, colour: 'Yellow', fam: 'yellow', weight: 280, hh: 5000, layers: '2-layer', wp: true, packable: true, helmet: false, pitZips: false, pfcFree: false, rating: 4.0, reviews: 508, stock: 40, out: [], uses: ['day', 'travel'],
      img: 'j10', subject: 'a simple lightweight pull-on cagoule rain jacket in sunshine yellow, half-length front zip, hood, one large front kangaroo pocket' }),
    cloth({ id: 'j11', cat: 'shells', name: 'Tarn 2.5L Jacket', brand: 'Corrie', g: 'm', price: 149, colour: 'Olive', fam: 'green', weight: 330, hh: 20000, layers: '2.5-layer', wp: true, packable: true, helmet: false, pitZips: true, pfcFree: true, rating: 4.6, reviews: 132, stock: 12, out: [], uses: ['hill', 'day', 'backpacking'],
      img: 'j11', subject: "a men's lightweight waterproof hiking jacket in olive green, adjustable hood, two chest pockets, underarm zips, full front zip closed" }),
    cloth({ id: 'j12', cat: 'shells', name: 'Tarn 2.5L Jacket', brand: 'Corrie', g: 'w', price: 149, colour: 'Lavender', fam: 'purple', weight: 300, hh: 20000, layers: '2.5-layer', wp: true, packable: true, helmet: false, pitZips: true, pfcFree: true, rating: 4.6, reviews: 118, stock: 11, out: [], uses: ['hill', 'day', 'backpacking'],
      img: 'j12', subject: "a women's lightweight waterproof hiking jacket in soft lavender purple, adjustable hood, two chest pockets, underarm zips, full front zip closed" }),
    cloth({ id: 'j13', cat: 'shells', name: 'Fellrunner Smock', brand: 'Scarth', g: 'u', price: 99, colour: 'Orange', fam: 'orange', weight: 160, hh: 10000, layers: '2.5-layer', wp: true, packable: true, helmet: false, pitZips: false, pfcFree: true, rating: 4.5, reviews: 96, stock: 9, out: [], uses: ['running', 'hill'],
      img: 'j13', subject: 'a featherweight running waterproof smock in bright orange, short chest zip, close-fitting hood, no pockets, thin taped fabric' }),
    cloth({ id: 'j14', cat: 'shells', name: 'Haweswater Insulated Waterproof', brand: 'Corrie', g: 'm', price: 189, colour: 'Charcoal', fam: 'grey', weight: 720, hh: 15000, layers: '2-layer', wp: true, packable: false, helmet: false, pitZips: false, pfcFree: false, warmth: 3, rating: 4.5, reviews: 102, stock: 7, out: [], uses: ['day', 'winter', 'travel'],
      img: 'j14', subject: "a men's padded insulated waterproof jacket in charcoal grey, quilted look, fleece-lined collar, hood, two large lower pockets, full front zip closed" }),

    // ---- Insulated jackets (10) --------------------------------------------
    cloth({ id: 'i01', cat: 'insulated', name: 'Glenmore Down Hoody', brand: 'Smoor', g: 'm', price: 180, colour: 'Black', fam: 'black', weight: 380, fill: 'down', fp: 800, warmth: 4, packable: true, hood: true, rating: 4.7, reviews: 188, stock: 13, out: [], uses: ['hill', 'winter', 'travel'],
      img: 'i01', subject: "a men's lightweight down puffer jacket with hood in matte black, narrow horizontal baffles, full front zip closed" }),
    cloth({ id: 'i02', cat: 'insulated', name: 'Glenmore Down Hoody', brand: 'Smoor', g: 'w', price: 180, colour: 'Plum', fam: 'purple', weight: 340, fill: 'down', fp: 800, warmth: 4, packable: true, hood: true, rating: 4.8, reviews: 171, stock: 10, out: [], uses: ['hill', 'winter', 'travel'],
      img: 'i02', subject: "a women's lightweight down puffer jacket with hood in deep plum, narrow horizontal baffles, full front zip closed" }),
    cloth({ id: 'i03', cat: 'insulated', name: 'Strath Synthetic Jacket', brand: 'Smoor', g: 'm', price: 120, colour: 'Olive', fam: 'green', weight: 420, fill: 'synthetic', fp: 0, warmth: 3, packable: true, hood: false, rating: 4.5, reviews: 145, stock: 16, out: [], uses: ['hill', 'day'],
      img: 'i03', subject: "a men's synthetic insulated jacket without hood in olive green, wide quilted baffles in an offset pattern, stand-up collar, full front zip closed" }),
    cloth({ id: 'i04', cat: 'insulated', name: 'Strath Synthetic Jacket', brand: 'Smoor', g: 'w', price: 120, colour: 'Teal', fam: 'blue', weight: 380, fill: 'synthetic', fp: 0, warmth: 3, packable: true, hood: false, rating: 4.5, reviews: 129, stock: 14, out: [], uses: ['hill', 'day'],
      img: 'i04', subject: "a women's synthetic insulated jacket without hood in teal, wide quilted baffles in an offset pattern, stand-up collar, full front zip closed" }),
    cloth({ id: 'i05', cat: 'insulated', name: 'Bothy Down Parka', brand: 'Smoor', g: 'm', price: 260, colour: 'Navy', fam: 'blue', weight: 820, fill: 'down', fp: 700, warmth: 5, packable: false, hood: true, rating: 4.7, reviews: 84, stock: 0, back: 10, out: [], uses: ['winter', 'travel'],
      img: 'i05', subject: "a men's thick hip-length down parka in navy, big puffy hood, deep baffles, two large lower pockets, full front zip closed" }),
    cloth({ id: 'i06', cat: 'insulated', name: 'Bothy Down Parka', brand: 'Smoor', g: 'w', price: 260, colour: 'Burnt orange', fam: 'orange', weight: 760, fill: 'down', fp: 700, warmth: 5, packable: false, hood: true, rating: 4.8, reviews: 91, stock: 5, out: [], uses: ['winter', 'travel'],
      img: 'i06', subject: "a women's thick hip-length down parka in burnt orange, big puffy hood, deep baffles, two large lower pockets, full front zip closed" }),
    cloth({ id: 'i07', cat: 'insulated', name: 'Micro Puffer Jacket', brand: 'Scarth', g: 'u', price: 65, colour: 'Red', fam: 'red', weight: 310, fill: 'synthetic', fp: 0, warmth: 2, packable: true, hood: false, rating: 4.2, reviews: 333, stock: 28, out: [], uses: ['day', 'travel'],
      img: 'i07', subject: 'a thin lightweight synthetic puffer jacket in bright red, slim horizontal baffles, no hood, small collar, full front zip closed' }),
    cloth({ id: 'i08', cat: 'insulated', name: 'Micro Puffer Gilet', brand: 'Scarth', g: 'u', price: 49, colour: 'Grey', fam: 'grey', weight: 220, fill: 'synthetic', fp: 0, warmth: 2, packable: true, hood: false, gilet: true, rating: 4.3, reviews: 241, stock: 24, out: [], uses: ['day', 'travel'],
      img: 'i08', subject: 'a sleeveless synthetic puffer gilet vest in mid grey, slim horizontal baffles, small collar, full front zip closed' }),
    cloth({ id: 'i09', cat: 'insulated', name: 'Cairngorm Belay Jacket', brand: 'Smoor', g: 'u', price: 210, colour: 'Yellow', fam: 'yellow', weight: 690, fill: 'synthetic', fp: 0, warmth: 5, packable: false, hood: true, rating: 4.7, reviews: 66, stock: 6, out: [], uses: ['winter', 'scrambling'],
      img: 'i09', subject: 'a big warm synthetic belay jacket in mustard yellow, oversized insulated hood, large boxy baffles, two-way front zip closed' }),
    cloth({ id: 'i10', cat: 'insulated', name: 'Lightline Down Jacket', brand: 'Scarth', g: 'w', price: 99, colour: 'Sage', fam: 'green', weight: 260, fill: 'down', fp: 650, warmth: 3, packable: true, hood: false, rating: 4.4, reviews: 152, stock: 12, out: [], uses: ['day', 'travel'],
      img: 'i10', subject: "a women's light down jacket in pale sage green, narrow horizontal baffles, no hood, small round collar, full front zip closed" }),

    // ---- Rucksacks (12) ----------------------------------------------------
    { id: 'r01', cat: 'packs', name: 'Daytrip 20', brand: 'Larig', g: 'u', price: 55, colour: 'Green', fam: 'green', weight: 640, litres: 20, raincover: true, vent: false, hydration: true, wp: false, rating: 4.4, reviews: 219, stock: 18, sizes: [], out: [], uses: ['day', 'travel'],
      img: 'r01', subject: 'a small 20 litre hiking daypack in forest green, zipped front pocket, mesh side bottle pockets, padded shoulder straps' },
    { id: 'r02', cat: 'packs', name: 'Daytrip 28', brand: 'Larig', g: 'u', price: 70, colour: 'Blue', fam: 'blue', weight: 820, litres: 28, raincover: true, vent: true, hydration: true, wp: false, rating: 4.6, reviews: 287, stock: 15, sizes: [], out: [], uses: ['day', 'hill'],
      img: 'r02', subject: 'a 28 litre hiking daypack in cobalt blue, zipped lid, front stretch pocket, mesh side pockets, padded hip belt, curved back' },
    { id: 'r03', cat: 'packs', name: 'Daytrip 26', brand: 'Larig', g: 'w', price: 70, colour: 'Raspberry', fam: 'red', weight: 790, litres: 26, raincover: true, vent: true, hydration: true, wp: false, rating: 4.6, reviews: 198, stock: 11, sizes: [], out: [], uses: ['day', 'hill'],
      img: 'r03', subject: 'a 26 litre hiking daypack in raspberry red, zipped lid, front stretch pocket, mesh side pockets, padded hip belt, curved back' },
    { id: 'r04', cat: 'packs', name: 'Ridge 35', brand: 'Larig', g: 'u', price: 95, colour: 'Black', fam: 'black', weight: 1150, litres: 35, raincover: true, vent: true, hydration: true, wp: false, rating: 4.7, reviews: 176, stock: 9, sizes: [], out: [], uses: ['hill', 'winter'],
      img: 'r04', subject: 'a 35 litre mountain rucksack in black, top lid, ice axe loop, side compression straps, padded hip belt' },
    { id: 'r05', cat: 'packs', name: 'Ridge 33', brand: 'Larig', g: 'w', price: 95, colour: 'Teal', fam: 'blue', weight: 1100, litres: 33, raincover: true, vent: true, hydration: true, wp: false, rating: 4.7, reviews: 133, stock: 7, sizes: [], out: [], uses: ['hill', 'winter'],
      img: 'r05', subject: 'a 33 litre mountain rucksack in teal, top lid, ice axe loop, side compression straps, padded hip belt' },
    { id: 'r06', cat: 'packs', name: 'Traverse 45', brand: 'Larig', g: 'u', price: 140, colour: 'Grey', fam: 'grey', weight: 1500, litres: 45, raincover: true, vent: true, hydration: true, wp: false, rating: 4.5, reviews: 92, stock: 6, sizes: [], out: [], uses: ['backpacking', 'hill'],
      img: 'r06', subject: 'a 45 litre trekking rucksack in mid grey, top lid, front stretch pocket, sleeping bag compartment zip, padded hip belt' },
    { id: 'r07', cat: 'packs', name: 'Traverse 65+10', brand: 'Larig', g: 'u', price: 185, colour: 'Olive', fam: 'green', weight: 2100, litres: 65, raincover: true, vent: true, hydration: true, wp: false, rating: 4.6, reviews: 104, stock: 5, sizes: [], out: [], uses: ['backpacking'],
      img: 'r07', subject: 'a large 65 litre backpacking rucksack in olive green, extendable top lid, front stretch pocket, sleeping bag compartment, thick padded hip belt' },
    { id: 'r08', cat: 'packs', name: 'Traverse 60+10', brand: 'Larig', g: 'w', price: 185, colour: 'Plum', fam: 'purple', weight: 2000, litres: 60, raincover: true, vent: true, hydration: true, wp: false, rating: 4.7, reviews: 71, stock: 0, back: 9, sizes: [], out: [], uses: ['backpacking'],
      img: 'r08', subject: 'a large 60 litre backpacking rucksack in plum purple, extendable top lid, front stretch pocket, sleeping bag compartment, thick padded hip belt' },
    { id: 'r09', cat: 'packs', name: 'Fastpack 25', brand: 'Scarth', g: 'u', price: 85, colour: 'Orange', fam: 'orange', weight: 480, litres: 25, raincover: false, vent: false, hydration: true, wp: false, rating: 4.5, reviews: 88, stock: 10, sizes: [], out: [], uses: ['running', 'hill'],
      img: 'r09', subject: 'a slim lightweight 25 litre fastpacking rucksack in bright orange ripstop, roll-top closure, vest-style shoulder straps with front bottle pockets' },
    { id: 'r10', cat: 'packs', name: 'Hip Pack 5', brand: 'Scarth', g: 'u', price: 30, colour: 'Black', fam: 'black', weight: 180, litres: 5, raincover: false, vent: false, hydration: false, wp: false, rating: 4.3, reviews: 260, stock: 33, sizes: [], out: [], uses: ['day', 'travel', 'running'],
      img: 'r10', subject: 'a small 5 litre hip pack bum bag in black, curved zipped main pocket, waist strap with buckle' },
    { id: 'r11', cat: 'packs', name: 'Rolltop 30 Waterproof', brand: 'Scarth', g: 'u', price: 75, colour: 'Yellow', fam: 'yellow', weight: 900, litres: 30, raincover: false, vent: false, hydration: false, wp: true, rating: 4.4, reviews: 147, stock: 14, sizes: [], out: [], uses: ['day', 'travel'],
      img: 'r11', subject: 'a 30 litre fully waterproof roll-top rucksack in yellow coated fabric, rolled top with buckle, welded seams, simple shoulder straps' },
    { id: 'r12', cat: 'packs', name: 'Scramble 22', brand: 'Larig', g: 'u', price: 60, colour: 'Red', fam: 'red', weight: 520, litres: 22, raincover: false, vent: false, hydration: true, wp: false, rating: 4.4, reviews: 95, stock: 12, sizes: [], out: [], uses: ['scrambling', 'hill'],
      img: 'r12', subject: 'a slim 22 litre climbing daypack in red, clean narrow profile, top drawcord closure with lid, gear loops on the hip belt' },

    // ---- Base layers (8) ---------------------------------------------------
    cloth({ id: 'l01', cat: 'base', name: 'Merino 200 Crew', brand: 'Scarth', g: 'm', price: 65, colour: 'Charcoal', fam: 'grey', weight: 230, material: 'merino', gsm: 200, sleeve: 'long', zip: false, warmth: 3, rating: 4.7, reviews: 266, stock: 20, out: [], uses: ['hill', 'winter', 'day'],
      img: 'l01', subject: "a men's long-sleeve merino wool base layer top with crew neck in charcoal grey, fine knit" }),
    cloth({ id: 'l02', cat: 'base', name: 'Merino 200 Crew', brand: 'Scarth', g: 'w', price: 65, colour: 'Heather', fam: 'purple', weight: 200, material: 'merino', gsm: 200, sleeve: 'long', zip: false, warmth: 3, rating: 4.7, reviews: 241, stock: 17, out: [], uses: ['hill', 'winter', 'day'],
      img: 'l02', subject: "a women's long-sleeve merino wool base layer top with crew neck in heather purple, fine knit, fitted shape" }),
    cloth({ id: 'l03', cat: 'base', name: 'Merino 150 Tee', brand: 'Scarth', g: 'm', price: 50, colour: 'Blue', fam: 'blue', weight: 150, material: 'merino', gsm: 150, sleeve: 'short', zip: false, warmth: 1, rating: 4.5, reviews: 198, stock: 23, out: [], uses: ['day', 'travel', 'hill'],
      img: 'l03', subject: "a men's short-sleeve merino wool t-shirt in mid blue, crew neck, fine knit" }),
    cloth({ id: 'l04', cat: 'base', name: 'Merino 150 Tee', brand: 'Scarth', g: 'w', price: 50, colour: 'Sage', fam: 'green', weight: 130, material: 'merino', gsm: 150, sleeve: 'short', zip: false, warmth: 1, rating: 4.5, reviews: 175, stock: 19, out: [], uses: ['day', 'travel', 'hill'],
      img: 'l04', subject: "a women's short-sleeve merino wool t-shirt in pale sage green, crew neck, fine knit, fitted shape" }),
    cloth({ id: 'l05', cat: 'base', name: 'Merino 260 Zip Neck', brand: 'Scarth', g: 'm', price: 80, colour: 'Black', fam: 'black', weight: 300, material: 'merino', gsm: 260, sleeve: 'long', zip: true, warmth: 4, rating: 4.8, reviews: 134, stock: 11, out: [], uses: ['winter', 'hill'],
      img: 'l05', subject: "a men's thick long-sleeve merino wool base layer with a quarter-length zip neck in black, zip closed" }),
    cloth({ id: 'l06', cat: 'base', name: 'Merino 260 Zip Neck', brand: 'Scarth', g: 'w', price: 80, colour: 'Burgundy', fam: 'red', weight: 270, material: 'merino', gsm: 260, sleeve: 'long', zip: true, warmth: 4, rating: 4.8, reviews: 119, stock: 9, out: [], uses: ['winter', 'hill'],
      img: 'l06', subject: "a women's thick long-sleeve merino wool base layer with a quarter-length zip neck in burgundy, zip closed, fitted shape" }),
    cloth({ id: 'l07', cat: 'base', name: 'Active Synthetic Crew', brand: 'Scarth', g: 'm', price: 28, colour: 'Orange', fam: 'orange', weight: 160, material: 'synthetic', gsm: 140, sleeve: 'long', zip: false, warmth: 2, rating: 4.2, reviews: 301, stock: 35, out: [], uses: ['running', 'day', 'hill'],
      img: 'l07', subject: "a men's long-sleeve synthetic technical base layer top in bright orange, smooth sporty fabric, crew neck, flatlock seams" }),
    cloth({ id: 'l08', cat: 'base', name: 'Active Synthetic Crew', brand: 'Scarth', g: 'w', price: 28, colour: 'Teal', fam: 'blue', weight: 140, material: 'synthetic', gsm: 140, sleeve: 'long', zip: false, warmth: 2, rating: 4.2, reviews: 277, stock: 31, out: [], uses: ['running', 'day', 'hill'],
      img: 'l08', subject: "a women's long-sleeve synthetic technical base layer top in teal, smooth sporty fabric, crew neck, flatlock seams, fitted shape" }),

    // ---- Socks (8) ---------------------------------------------------------
    { id: 'k01', cat: 'socks', name: 'Hillwalker Merino Sock', brand: 'Scarth', g: 'u', price: 18, colour: 'Grey', fam: 'grey', weight: 90, material: 'merino', cushion: 'mid', height: 'boot', wp: false, warmth: 3, rating: 4.7, reviews: 522, stock: 60, sizes: SOCK, out: [], uses: ['hill', 'day'],
      img: 'k01', subject: 'a pair of mid-calf merino walking socks in heather grey with a darker grey heel and toe, cushioned sole' },
    { id: 'k02', cat: 'socks', name: 'Hillwalker Merino Sock', brand: 'Scarth', g: 'w', price: 18, colour: 'Purple', fam: 'purple', weight: 80, material: 'merino', cushion: 'mid', height: 'boot', wp: false, warmth: 3, rating: 4.7, reviews: 448, stock: 52, sizes: SOCK, out: [], uses: ['hill', 'day'],
      img: 'k02', subject: 'a pair of mid-calf merino walking socks in muted purple with a darker plum heel and toe, cushioned sole' },
    { id: 'k03', cat: 'socks', name: 'Winter Trek Sock', brand: 'Scarth', g: 'u', price: 22, colour: 'Red', fam: 'red', weight: 120, material: 'merino', cushion: 'heavy', height: 'boot', wp: false, warmth: 5, rating: 4.8, reviews: 213, stock: 34, sizes: SOCK, out: [], uses: ['winter', 'hill'],
      img: 'k03', subject: 'a pair of thick heavy mid-calf wool winter socks in brick red with a cream heel and toe, chunky knit' },
    { id: 'k04', cat: 'socks', name: 'Liner Sock 2-pack', brand: 'Scarth', g: 'u', price: 14, colour: 'Black', fam: 'black', weight: 50, material: 'synthetic', cushion: 'light', height: 'boot', wp: false, warmth: 1, rating: 4.3, reviews: 187, stock: 45, sizes: SOCK, out: [], uses: ['hill', 'backpacking'],
      img: 'k04', subject: 'two pairs of thin black liner socks, mid-calf, smooth fine knit, laid neatly side by side' },
    { id: 'k05', cat: 'socks', name: 'Trail Ankle Sock', brand: 'Scarth', g: 'u', price: 14, colour: 'Blue', fam: 'blue', weight: 50, material: 'merino', cushion: 'light', height: 'ankle', wp: false, warmth: 1, rating: 4.4, reviews: 239, stock: 41, sizes: SOCK, out: [], uses: ['day', 'running', 'travel'],
      img: 'k05', subject: 'a pair of short ankle trail socks in bright blue with a navy heel and toe' },
    { id: 'k06', cat: 'socks', name: 'Waterproof Sock', brand: 'Scarth', g: 'u', price: 35, colour: 'Olive', fam: 'green', weight: 110, material: 'merino', cushion: 'mid', height: 'boot', wp: true, warmth: 3, rating: 4.4, reviews: 156, stock: 22, sizes: SOCK, out: ['XL'], uses: ['day', 'hill'],
      img: 'k06', subject: 'a pair of mid-calf waterproof membrane socks in olive green with a black cuff, slightly technical smooth outer knit' },
    { id: 'k07', cat: 'socks', name: 'Lightweight Hiker Sock', brand: 'Scarth', g: 'u', price: 16, colour: 'Green', fam: 'green', weight: 70, material: 'merino', cushion: 'light', height: 'crew', wp: false, warmth: 2, rating: 4.5, reviews: 204, stock: 38, sizes: SOCK, out: [], uses: ['day', 'hill', 'travel'],
      img: 'k07', subject: 'a pair of light crew-length merino hiking socks in bright grass green with a grey heel and toe' },
    { id: 'k08', cat: 'socks', name: 'Expedition Sock', brand: 'Scarth', g: 'u', price: 26, colour: 'Orange', fam: 'orange', weight: 140, material: 'merino', cushion: 'heavy', height: 'knee', wp: false, warmth: 5, rating: 4.6, reviews: 98, stock: 20, sizes: SOCK, out: [], uses: ['winter', 'backpacking'],
      img: 'k08', subject: 'a pair of thick knee-length expedition wool socks in burnt orange with charcoal heel, toe and cuff' },
  ];

  // Popularity, used as the last ranking signal: reviews weighted by rating.
  var maxPop = 0;
  P.forEach(function (p) {
    p.pop = p.rating * Math.log(1 + p.reviews);
    if (p.pop > maxPop) maxPop = p.pop;
  });
  P.forEach(function (p) { p.popN = p.pop / maxPop; });

  // Product photos that are in assets/img/products/ (the rest show a drawn placeholder until shot).
  var PHOTOS = 'b01 b02 b03 b04 b05 b06 b07 b08 b10 b11 b12 b14 b15 b16 s03 s04 s05 s06 j02'.split(' ');
  P.forEach(function (p) { p.photo = PHOTOS.indexOf(p.img) >= 0; });

  window.SCARTH = {
    categories: CATEGORIES,
    products: P,
    sockSizes: { S: [3, 5.5], M: [6, 8.5], L: [9, 11.5], XL: [12, 14.5] },
  };
})();
