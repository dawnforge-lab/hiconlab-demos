/* The reader: turns a plain-English request into criteria.
 * Deterministic rules, no network. Each rule matches a phrase, emits one or more
 * criterion specs ({ key, value, mode }) and blanks the phrase out so words are
 * never read twice. Whatever is left is either filler or shown as "Didn't use".
 */
(function () {
  'use strict';

  var COLOURS = {
    green: 'green', olive: 'green', khaki: 'green', sage: 'green', moss: 'green', forest: 'green', fern: 'green', lime: 'green',
    blue: 'blue', navy: 'blue', teal: 'blue', turquoise: 'blue', cobalt: 'blue',
    black: 'black',
    grey: 'grey', gray: 'grey', charcoal: 'grey', graphite: 'grey',
    brown: 'brown', tan: 'brown', chestnut: 'brown', walnut: 'brown',
    red: 'red', burgundy: 'red', berry: 'red', maroon: 'red', raspberry: 'red', pink: 'red',
    orange: 'orange', rust: 'orange',
    yellow: 'yellow', mustard: 'yellow',
    purple: 'purple', plum: 'purple', lavender: 'purple', lilac: 'purple', violet: 'purple',
    beige: 'neutral', stone: 'neutral', cream: 'neutral', sand: 'neutral',
  };
  var COLOUR_WORDS = Object.keys(COLOURS).join('|');

  var STOP = ('i im i\'m a an the for my me we our us some any need needs needing want wants wanted looking look ' +
    'after please pair pairs of with and or to in on at that which is are be will would can could should something ' +
    'anything thing things one ones it its this these those good nice new really very quite just also too get buy got ' +
    'have has what whats recommend suggest help find show kit gear stuff clothing clothes equipment so but if like as by ' +
    'from up out about mostly mainly plus both either go going heading use used using wear wearing ideal perfect suitable ' +
    'ok hi hello thanks cheers there here he she they them his her their you your yours mine set been when where how ' +
    'do does doing did not no don\'t dont isn\'t much more less fairly pretty bit little lot lots all every each other another ' +
    'item items product products option options type types kind sort decent take takes taking ,').split(/\s+/);
  var STOPSET = {};
  STOP.forEach(function (w) { STOPSET[w] = true; });

  // Kit we don't sell. `alt` is the nearest thing we do sell, shown instead of a dead end.
  var NOT_STOCKED = [
    [/\b(?:fleeces?|fleecy|fleece jackets?|mid[\s-]?layers?)\b/, { name: 'fleeces', alt: { cats: ['insulated', 'base'] } }],
    [/\b(?:tents?)\b/, { name: 'tents' }], [/\b(?:sleeping ?bags?)\b/, { name: 'sleeping bags' }],
    [/\b(?:(?:walking |trekking |hiking )?poles)\b/, { name: 'walking poles' }],
    [/\b(?:(?:waterproof |walking )?(?:over)?trousers|pants)\b/, { name: 'trousers' }],
    [/\b(?:gloves|mitts|mittens)\b/, { name: 'gloves' }], [/\b(?:hats?|beanies?|caps?)\b/, { name: 'hats' }],
    [/\b(?:gaiters)\b/, { name: 'gaiters', alt: { label: 'waterproof socks', cats: ['socks'], specs: [{ key: 'wp', value: true, mode: 'must' }] } }],
    [/\b(?:stoves?)\b/, { name: 'stoves' }], [/\b(?:maps?|compass(?:es)?)\b/, { name: 'maps' }], [/\b(?:head ?torch(?:es)?)\b/, { name: 'head torches' }],
    [/\b(?:shorts|leggings|tights)\b/, { name: 'shorts or leggings' }], [/\b(?:sunglasses|sunnies)\b/, { name: 'sunglasses' }],
    [/\b(?:kids?|kiddies|children'?s?|childrens|child'?s?|junior|juniors|toddlers?|boys'?|girls'?)\b/, { name: 'children’s sizes', msg: 'We don’t stock children’s sizes. The smallest we have are women’s UK 3 boots and XS clothing.' }],
  ];
  var NUMS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19 };
  var TENS = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
  var UNIT_RE = Object.keys(NUMS).join('|'), TENS_RE = Object.keys(TENS).join('|');

  // "a hundred and fifty quid" → "150 quid", "size ten" → "size 10".
  function numberWords(t) {
    t = t.replace(/\b(?:a\s+)?tenners?\b/g, '10 quid').replace(/\b(?:a\s+)?fivers?\b/g, '5 quid').replace(/\b(?:a\s+)?(?:score|twenty)\s+quid\b/g, '20 quid');
    var small = '(?:(' + TENS_RE + ')(?:[\\s-](' + UNIT_RE + '))?|(' + UNIT_RE + '))';
    t = t.replace(new RegExp('\\b(?:(a|one|two|three)\\s+)?hundred(?:\\s+(?:and\\s+)?' + small + ')?\\b', 'g'), function (m, h, tn, u1, u2) {
      var n = ({ a: 1, one: 1, two: 2, three: 3 }[h] || 1) * 100;
      if (tn) n += TENS[tn] + (u1 ? NUMS[u1] : 0); else if (u2) n += NUMS[u2];
      return String(n);
    });
    t = t.replace(new RegExp('\\b(' + TENS_RE + ')(?:[\\s-](' + UNIT_RE + '))?\\b', 'g'), function (m, tn, u) { return String(TENS[tn] + (u ? NUMS[u] : 0)); });
    t = t.replace(new RegExp('\\b(size|uk)\\s+(' + UNIT_RE + ')\\b', 'g'), function (m, w, u) { return w + ' ' + NUMS[u]; });
    return t;
  }

  // Words the reader knows, for typo correction. Built from the rules below plus extras.
  var VOCAB_EXTRA = ('waterproof walking boots boot shoes shoe jacket jackets coat coats rucksack rucksacks backpack backpacks ' +
    'daypack socks sock base layer layers thermal thermals merino leather suede synthetic insulated insulation puffer parka ' +
    'gilet cagoule smock shell lightweight lighter lightest heavy warm warmer warmest winter hillwalking hiking trekking ' +
    'mountain mountains scrambling backpacking camping travel running cheap cheaper cheapest budget affordable under below ' +
    'between around about less than wide narrow fit feet size womens mens ladies crampon crampons breathable packable ' +
    'hood helmet comfortable comfy cushioned cushioning ankle sleeve sleeves capacity litres colour colours bright dark ' +
    'vegan without rainy muddy boggy stock weekend reviewed rated popular hydration bladder fleece trousers gaiters gloves ' + Object.keys(COLOURS).join(' ')).split(/\s+/);

  function rules() {
    var R = [];
    function rule(re, fn) { R.push({ re: new RegExp(re.source, 'g'), fn: fn }); }
    function spec(key, value, mode, extra) { var s = { key: key, value: value, mode: mode || 'must' }; if (extra) for (var k in extra) s[k] = extra[k]; return s; }

    // --- negations first -------------------------------------------------------
    // "not", "isn't", "except", "anything but", "don't want" … followed by the thing to leave out.
    var NEG = "\\b(?:not|no|non|nor|neither|without|avoid|anything but|nothing|except|but not|other than|apart from|isn'?t|aren'?t|wasn'?t|doesn'?t|don'?t|won'?t|can'?t|shouldn'?t|never|nothing in|hate|rather not)";
    var GAP = "[\\s-]*(?:(?:want|like|need|have|has|having|got|use|uses|using|be|being|made|of|from|with|contain|contains|containing|it|real|natural|in|a|an|any|too|very|that|so|overly|anything|something|either)\\s+)*";
    // A negation carries across a list: "no black or grey", "not leather, suede or nubuck".
    var LIST = "(?:\\s*(?:,|or|and|nor|&|/)\\s*(?:in\\s+)?)";
    function neg(words) { return new RegExp(NEG + GAP + '(?:' + words + ')(?:' + LIST + '(?:' + words + '))*\\b'); }
    rule(neg('leather|suede|animal(?: products)?'), function () { return [spec('noleather', true)]; });
    rule(/\b(?:leather|animal)[\s-]*free\b|\bvegan\b/, function () { return [spec('noleather', true)]; });
    rule(neg('(?:duck |goose )?(?:down|feathers?)'), function () { return [spec('fill', 'synthetic')]; });
    rule(/\b(?:down|feather)[\s-]*free\b/, function () { return [spec('fill', 'synthetic')]; });
    rule(neg('synthetics?|polyester|plastic'), function () { return [spec('nosynth', true)]; });
    rule(neg('merino|wool|woolly|woollen|itchy'), function () { return [spec('synthetic', true)]; });
    var COL = '(?:(?:light|dark|pale|bright)\\s+)?(?:' + COLOUR_WORDS + ')(?:s|ish)?';
    rule(new RegExp(NEG + GAP + COL + '(?:' + LIST + COL + ')*\\b'), function (m) {
      var seen = {}, out = [];
      (m[0].match(new RegExp('\\b(' + COLOUR_WORDS + ')', 'g')) || []).forEach(function (w) { var f = COLOURS[w]; if (!seen[f]) { seen[f] = 1; out.push(spec('notcolour', f)); } });
      return out;
    });
    rule(neg('heavy|bulky|chunky|clunky|weighty'), function () { return [spec('light', true, 'prefer')]; });
    rule(neg('expensive|pricey|dear|spendy|costly'), function () { return [spec('cheap', true, 'prefer')]; });
    rule(neg('warm|hot|sweaty|stuffy'), function () { return [spec('breathable', true, 'prefer')]; });
    rule(neg('hood(?:ed|s)?'), function () { return [spec('nohood', true)]; });
    rule(neg('bright|loud|garish|flashy|hi[\\s-]?vis'), function () { return [spec('dark', true, 'prefer')]; });

    // --- kit we don't sell -----------------------------------------------------
    NOT_STOCKED.forEach(function (n) { rule(n[0], function () { return [{ notStocked: n[1] }]; }); });
    rule(/\b(?:cold|freezing|chilly|frozen|icy) (?:feet|toes)\b/, function () { return [spec('cat', ['socks']), spec('warm', true, 'prefer')]; });
    rule(/\b(?:wet|soggy|damp) (?:feet|toes)\b/, function () { return [spec('wp', true)]; });
    rule(/\b(?:sore|aching|achy|tired|bad) (?:feet|knees|ankles)\b/, function () { return [spec('rated', 'comfort', 'prefer'), spec('cushion', 'cushioned', 'prefer')]; });

    // --- numbers with units come before money, so "300g" is never £30 ------------
    // One comparator family for weight, volume and price. "no more than", "not heavier than",
    // "no bigger than" flip to a maximum; "no less than", "not lighter than" flip to a minimum.
    var CMP = "(?:(no|not|never)\\s+)?(under|below|less than|fewer than|lighter than|smaller than|shorter than|cheaper than|lower than|up to|at most|max(?:imum)?|more than|heavier than|bigger than|larger than|longer than|dearer than|higher than|over|above|at least|min(?:imum)?|<|>)";
    var UPPER = /^(?:under|below|less than|fewer than|lighter than|smaller than|shorter than|cheaper than|lower than|up to|at most|max(?:imum)?|<)$/;
    function bound(neg, word) { var upper = UPPER.test(word); if (neg) upper = !upper; return upper ? 'max' : 'min'; }
    function grams(n, unit) { return /^k/.test(unit) ? Math.round(n * 1000) : Math.round(n); }
    var WUNIT = '(kg|kgs|kilos?|kilograms?|g|gr|grams?|gms?)\\b(?!\\s*/\\s*m)';
    var LUNIT = '(?:l|lt|ltr|litres?|liters?)\\b';
    var NUM = '(\\d+(?:\\.\\d+)?)';
    rule(new RegExp('\\b(?:merino\\s+)?(\\d{2,3})\\s*(?:gsm|g/m2|g/m²|g per square metre|weight merino)\\b|\\bmerino\\s+(\\d{3})\\b|\\b(\\d{3})\\s+merino\\b'), function (m) { var n = +(m[1] || m[2] || m[3]); var out = [spec('gsm', n), spec('cat', ['base'], 'must', { implied: true })]; if (/merino/.test(m[0])) out.push(spec('merino', true)); return out; });
    // ranges first: "1kg to 1.2kg", "between 20 and 30 litres"
    rule(new RegExp('\\b(?:between\\s+|from\\s+)?' + NUM + '\\s*(kg|kgs|kilos?|g|grams?)?\\s*(?:-|to|and)\\s*' + NUM + '\\s*' + WUNIT), function (m) { var u = m[4]; var a = grams(+m[1], m[2] || u), b = grams(+m[3], u); return [spec('weightmin', Math.min(a, b)), spec('weightmax', Math.max(a, b))]; });
    rule(new RegExp('\\b(?:between\\s+|from\\s+)?(\\d{1,2})\\s*(?:l|litres?)?\\s*(?:-|to|and)\\s*(\\d{1,2})\\s*' + LUNIT), function (m) { var a = +m[1], b = +m[2]; return [spec('capacity', { min: Math.min(a, b), max: Math.max(a, b) }), spec('cat', ['packs'], 'must', { implied: true })]; });
    rule(new RegExp('\\b' + CMP + '\\s*(?:about |around )?' + NUM + '\\s*' + WUNIT), function (m) { var g = grams(+m[3], m[4]); return [spec(bound(m[1], m[2]) === 'max' ? 'weightmax' : 'weightmin', g)]; });
    rule(new RegExp('\\b(?:around|about|roughly|weighs?|weighing)?\\s*' + NUM + '\\s*' + WUNIT), function (m) { var g = grams(+m[1], m[2]); if (/around|about|roughly/.test(m[0])) g = Math.round(g * 1.1); return [spec('weightmax', g)]; });
    rule(new RegExp('\\b' + CMP + '\\s*(\\d{1,2})\\s*' + LUNIT), function (m) { var n = +m[3]; return [spec('capacity', bound(m[1], m[2]) === 'max' ? { max: n } : { min: n }), spec('cat', ['packs'], 'must', { implied: true })]; });
    rule(/\b(?:at least |over |more than |min(?:imum)? )?(\d{4,6})\s*mm\b(?:\s*(?:hydrostatic head|hh|waterproof(?:ing|ness)?|rating))?|\b(?:hydrostatic head|hh)\s*(?:of\s*)?(\d{4,6})\b/, function (m) { return [spec('hh', +(m[1] || m[2])), spec('cat', ['shells'], 'must', { implied: true })]; });

    // --- money -----------------------------------------------------------------
    rule(new RegExp('\\b' + CMP + '\\s*(?:a |about |around )?£\\s*(\\d{1,4})(?![\\d.,])(?:\\s*(?:quid|pounds?))?|\\b' + CMP + '\\s*(?:a |about |around )?(\\d{1,4})\\s*(?:quid|pounds?|squid)\\b'), function (m) {
      var neg = m[1] || m[4], word = m[2] || m[5], n = +(m[3] || m[6]);
      return [spec('budget', bound(neg, word) === 'max' ? { max: n } : { min: n })];
    });
    var Q = '(?:\\s*(?:quid|pounds?|gbp|squid))?';
    var NOTUNIT = '(?![\\d.,])(?!\\s*(?:kg|kgs|kilos?|g|gr|grams?|gms?|gsm|mm|l|lt|ltr|litres?|liters?)\\b)';
    rule(new RegExp('\\b(?:between|from)\\s*£?\\s*(\\d{1,4})' + Q + '\\s*(?:and|to|-)\\s*£?\\s*(\\d{1,4})' + Q + NOTUNIT), function (m) { return [spec('budget', range(+m[1], +m[2]))]; });
    rule(new RegExp('£\\s*(\\d{1,4})\\s*(?:-|to)\\s*£?\\s*(\\d{1,4})' + Q), function (m) { return [spec('budget', range(+m[1], +m[2]))]; });
    rule(new RegExp('\\b(?:under|below|less than|max(?:imum)?|up to|upto|no more than|not more than|cheaper than|within|at most|beneath|no over|not over|lower than)\\s*(?:a |about |around )?£?\\s*(\\d{1,4})(?:\\.\\d\\d)?' + Q + NOTUNIT), function (m) { return [spec('budget', { max: +m[1] })]; });
    rule(new RegExp('<\\s*£?\\s*(\\d{1,4})' + Q + NOTUNIT), function (m) { return [spec('budget', { max: +m[1] })]; });
    rule(new RegExp('\\b(?:around|about|roughly|approx(?:imately)?|circa|ish|~)\\s*£\\s*(\\d{1,4})' + Q + '|\\b(?:around|about|roughly)\\s*(\\d{1,4})\\s*(?:quid|pounds?)\\b|£\\s*(\\d{1,4})\\s*(?:ish|or so)\\b'), function (m) { var n = +(m[1] || m[2] || m[3]); return [spec('budget', { min: Math.round(n * 0.85), max: Math.round(n * 1.15), around: n })]; });
    rule(new RegExp('\\b(?:over|above|more than|at least|minimum|min)\\s*£\\s*(\\d{1,4})' + Q), function (m) { return [spec('budget', { min: +m[1] })]; });
    rule(new RegExp('£\\s*(\\d{1,4})(?:\\.\\d\\d)?' + Q + '(?:\\s*(?:or less|or under|or below|max|tops|maximum|budget|limit))?'), function (m) { return [spec('budget', { max: +m[1] })]; });
    rule(/\b(\d{1,4})\s*(?:quid|pounds?|squid)\b(?:\s*(?:or less|max|tops|maximum))?/, function (m) { return [spec('budget', { max: +m[1] })]; });
    // Bare numbers next to money words: "budget 80", "spend about 100", "for 100", "around 90", "100 max".
    var NOTDIST = '(?!\\s*(?:miles?|km|metres?|m|days?|nights?|hours?|people|years?)\\b)';
    rule(new RegExp('\\b(?:budget(?: of| is)?|to spend|spend(?:ing)?|pay(?:ing)?|price(?:d at)?|costing|costs?)\\s*(around |about |roughly |up to |under |max |maximum |no more than )?£?\\s*(\\d{2,4})\\b' + NOTUNIT), function (m) { var n = +m[2]; return [/around|about|roughly/.test(m[1] || '') ? spec('budget', { min: Math.round(n * 0.85), max: Math.round(n * 1.15), around: n }) : spec('budget', { max: n })]; });
    rule(new RegExp('\\b(?:around|about|roughly|approx(?:imately)?|circa)\\s*(\\d{2,4})\\b' + NOTUNIT + NOTDIST), function (m) { var n = +m[1]; return n < 20 ? [] : [spec('budget', { min: Math.round(n * 0.85), max: Math.round(n * 1.15), around: n })]; });
    rule(new RegExp('\\bfor\\s*(?:about |around |under |up to )?(\\d{2,4})\\b' + NOTUNIT + NOTDIST), function (m) { var n = +m[1]; return n < 20 ? [] : [spec('budget', { max: n })]; });
    rule(new RegExp('\\b(\\d{2,4})\\s*(?:max|maximum|tops|or less|or under|or below|budget)\\b'), function (m) { return [spec('budget', { max: +m[1] })]; });
    rule(/\b(?:cheap|cheaper|cheapest|budget|affordable|inexpensive|bargain|low[\s-]?cost|value|on a budget|economical)\b/, function () { return [spec('cheap', true, 'prefer')]; });

    // --- weight and capacity ---------------------------------------------------
    rule(/\b(?:under|below|less than|lighter than|max(?:imum)?|up to|no more than)\s*(\d+(?:\.\d+)?)\s*(kg|kilos?|g|grams?)\b/, function (m) { var g = /^k/.test(m[2]) ? +m[1] * 1000 : +m[1]; return [spec('weightmax', Math.round(g))]; });
    rule(/\b(?:under|below|less than|max(?:imum)?|up to|no more than)\s*(\d{1,2})\s*(?:l|lt|ltr|litres?|liters?)\b/, function (m) { return [spec('capacity', { max: +m[1] }), spec('cat', ['packs'], 'must', { implied: true })]; });
    rule(/\b(?:over|more than|at least|minimum)\s*(\d{1,2})\s*(?:l|lt|ltr|litres?|liters?)\b/, function (m) { return [spec('capacity', { min: +m[1] }), spec('cat', ['packs'], 'must', { implied: true })]; });
    rule(/\b(?:about |around |roughly )?(\d{1,2})\s*(?:\+\s*\d{1,2}\s*)?(?:l|lt|ltr|litres?|liters?)\b/, function (m) { var n = +m[1]; return [spec('capacity', { min: n - 5, max: n + 5, around: n }), spec('cat', ['packs'], 'must', { implied: true })]; });
    rule(/\b(?:day[\s-]?packs?|day[\s-]?sacks?|day rucksacks?|day bags?)\b/, function () { return [spec('cat', ['packs']), spec('capacity', { max: 35, day: true })]; });
    rule(/\b(?:big|large|huge|bigger|larger|massive)\s+(?:rucksacks?|backpacks?|packs?|bags?)\b/, function () { return [spec('cat', ['packs']), spec('capacity', { min: 45 })]; });
    rule(/\b(?:small|little|smaller|compact)\s+(?:rucksacks?|backpacks?|packs?|bags?)\b/, function () { return [spec('cat', ['packs']), spec('capacity', { max: 25 })]; });
    rule(/\b(?:light|lighter)\s+cushion(?:ing|ed)?\b/, function () { return [spec('cushion', 'light')]; });
    rule(/\b(?:heavy|thick|chunky|heavier|thicker|extra)\s*(?:cushion(?:ing|ed)?|socks?)\b/, function (m) { var out = [spec('cushion', 'heavy')]; if (/sock/.test(m[0])) out.push(spec('cat', ['socks'])); return out; });
    rule(/\b(?:cushioned|cushion(?:ing|y)?|padded socks?|squishy)\b/, function () { return [spec('cushion', 'cushioned', 'prefer')]; });

    // --- colours (with or without a shade word) --------------------------------
    rule(/\b(?:bright|brightly)[\s-]*colou?r(?:ed|s|ful)?\b|\bcolou?rful\b|\bhi[\s-]?vis\b|\bhigh[\s-]?vis(?:ibility)?\b|\b(?:easy to see|stand out|visible)\b/, function () { return [spec('bright', true, 'prefer')]; });
    rule(/\b(?:dark|muted|subtle|plain|dull|neutral)[\s-]*colou?r(?:ed|s)?\b|\bdon'?t want to stand out\b|\bnot too bright\b/, function () { return [spec('dark', true, 'prefer')]; });
    rule(new RegExp('\\b(?:in\\s+)?(?:a\\s+)?(?:light|pale|dark|deep|bright|nice|lovely|muted)?[\\s-]*(' + COLOUR_WORDS + ')(?:ish|s)?(?:\\s+(?:colou?r(?:ed|way)?|one))?\\b'), function (m) { return [spec('colour', COLOURS[m[1]], 'prefer')]; });

    // --- sizes, fit, who it's for ----------------------------------------------
    rule(/\b(?:size|uk|sz|a)\s*(\d{1,2})(\.5|½| and a half)?(?![\d.])(?!\s*(?:l|litres?|kg|g)\b)/, function (m) { var n = +m[1] + (m[2] ? 0.5 : 0); return /^a\s/.test(m[0]) && (n > 14 || n < 2) ? [] : [spec('size', n)]; });
    rule(/\b(?:size\s*)?(xxl|2xl|xl|xs|extra[\s-]large|extra[\s-]small)\b/, function (m) { var v = m[1].replace(/[\s-]/g, ''); v = { xxl: 'XXL', '2xl': 'XXL', xl: 'XL', xs: 'XS', extralarge: 'XL', extrasmall: 'XS' }[v]; return [spec('size', v)]; });
    rule(/\bsize\s*(s|m|l|small|medium|large)\b|\b(medium|large)\b(?!\s*(?:rucksack|pack|bag))/, function (m) { var v = (m[1] || m[2]); v = { s: 'S', small: 'S', m: 'M', medium: 'M', l: 'L', large: 'L' }[v]; return [spec('size', v)]; });
    rule(/\b(?:wide|broad|wider|chunky|fat|big|large)\s+(?:feet|foot|toes?|toe ?box)\b|\bwide[\s-]*(?:fit(?:ting)?|toe ?box|width|e{2,4})\b|\b(?:bunions?|high instep|high[\s-]volume feet)\b|\bwide\b/, function () { return [spec('fit', 'wide')]; });
    rule(/\b(?:narrow|slim|skinny|thin)\s+(?:feet|foot|heels?|fit)\b|\bnarrow\b/, function () { return [spec('fit', 'narrow')]; });
    rule(/\b(?:women'?s?|womens|woman|ladies'?|lady|female|for her|for (?:my )?(?:wife|girlfriend|mum|mother|daughter|sister|gran|grandma|nan))\b/, function () { return [spec('gender', 'w')]; });
    rule(/\b(?:men'?s?|mens|man|male|gents?'?|for him|for (?:my )?(?:husband|boyfriend|dad|father|son|brother|grandad|grandpa))\b/, function () { return [spec('gender', 'm')]; });

    // --- sleeves and necks (also say "base layer") -----------------------------
    rule(/\bshort[\s-]?sleeve[sd]?\b|\bt[\s-]?shirts?\b|\btees?\b/, function () { return [spec('cat', ['base']), spec('sleeve', 'short')]; });
    rule(/\blong[\s-]?sleeve[sd]?\b/, function () { return [spec('cat', ['base']), spec('sleeve', 'long')]; });
    rule(/\b(?:zip[\s-]?neck|quarter[\s-]?zip|half[\s-]?zip|1\/4 zip)\b/, function () { return [spec('cat', ['base']), spec('zipneck', true)]; });

    // --- categories ------------------------------------------------------------
    rule(/\bfootwear\b|\bboots? (?:and|or|&) shoes?\b|\bshoes? (?:and|or|&) boots?\b/, function () { return [spec('cat', ['boots', 'shoes'])]; });
    rule(/\b(?:waterproof|rain|wet[\s-]?weather|water[\s-]?proof)\s*(?:jackets?|coats?|shells?)\b|\b(?:waterproofs|rain ?coats?|cagoules?|kagools?|cags?|hard[\s-]?shells?|shell jackets?|shells?|smocks?|anoraks?|rain ?gear|rain ?wear)\b/, function () { return [spec('cat', ['shells'])]; });
    rule(/\b(?:down|feather)\s*(?:jackets?|coats?|hood(?:y|ie)s?|puffers?)\b/, function () { return [spec('cat', ['insulated']), spec('fill', 'down')]; });
    rule(/\bsynthetic\s*(?:jackets?|coats?|puffers?|insulation|fill)\b/, function () { return [spec('cat', ['insulated']), spec('fill', 'synthetic')]; });
    rule(/\b(?:warm|warmer|warmest|cosy|cozy)\s*(?:jackets?|coats?)\b/, function () { return [spec('cat', ['insulated']), spec('warm', true, 'prefer')]; });
    rule(/\b(?:winter)\s*(?:jackets?|coats?)\b/, function () { return [spec('cat', ['shells', 'insulated']), spec('use', 'winter')]; });
    rule(/\b(?:insulated|padded|puffer|puffa|quilted|belay)\s*(?:jackets?|coats?|hood(?:y|ie)s?)\b|\b(?:puffers?|puffas?|parkas?|insulated|insulation|duvet jackets?)\b/, function () { return [spec('cat', ['insulated'])]; });
    rule(/\b(?:gilets?|body ?warmers?|sleeveless)\b/, function () { return [spec('cat', ['insulated']), spec('gilet', true)]; });
    rule(/\b(?:jackets?|coats?)\b/, function () { return [spec('cat', ['shells', 'insulated'])]; });
    rule(/\b(?:(?:walking|hiking|hill[\s-]?walking|trekking|mountain|fell|trail|leather|winter)\s+)?boots?\b/, function (m) { var out = [spec('cat', ['boots'])]; if (/leather/.test(m[0])) out.push(spec('leather', true)); if (/winter/.test(m[0])) out.push(spec('use', 'winter')); return out; });
    rule(/\b(?:(?:walking|hiking|trail|approach|low)\s+)?(?:shoes?|trainers?|low[\s-]?cuts?|approach)\b/, function () { return [spec('cat', ['shoes'])]; });
    rule(/\b(?:rucksacks?|ruck ?sacks?|backpacks?|back ?packs?|packs?|bags?|bum ?bags?|hip ?packs?|waist ?packs?|fanny packs?)\b/, function () { return [spec('cat', ['packs'])]; });
    rule(/\b(?:base[\s-]?layers?|baselayers?|thermals?|thermal (?:tops?|vests?)|merino (?:tops?|tees?)|tops?|vests?|undershirts?)\b/, function (m) { var out = [spec('cat', ['base'])]; if (/merino/.test(m[0])) out.push(spec('merino', true)); return out; });
    rule(/\b(?:socks?|sock liners?|liners?)\b/, function () { return [spec('cat', ['socks'])]; });
    rule(/\b(?:feet|foot|toes)\b/, function () { return [spec('cat', ['boots', 'shoes'], 'must', { implied: true, fromFeet: true })]; });

    // --- features --------------------------------------------------------------
    rule(/\bpacks? (?:down |away )?(?:really |very )?small\b|\bpackable\b|\bpack ?away\b|\bpackaway\b|\bstuffs? (?:into|in) (?:its|a) pocket\b|\bcompressible\b|\bfits? in (?:my |a )?(?:bag|pocket)\b/, function () { return [spec('packable', true, 'prefer')]; });
    rule(/\b(?:pit[\s-]?zips?|underarm (?:vents?|zips?)|arm ?pit vents?|vents?)\b/, function () { return [spec('pitzips', true), spec('cat', ['shells'], 'must', { implied: true })]; });
    rule(/\bhelmet(?:[\s-]compatible)?(?: hood)?\b/, function () { return [spec('helmet', true), spec('cat', ['shells'], 'must', { implied: true })]; });
    rule(/\b(?:with (?:a )?)?hood(?:ed|y|ie|s)?\b/, function () { return [spec('hood', true)]; });
    rule(/\b(?:pfc[\s-]?free|pfas[\s-]?free|fluorocarbon[\s-]?free|eco[\s-]?friendly|eco|sustainable|environmentally friendly|planet friendly|green(?:er)? choice)\b/, function () { return [spec('pfc', true), spec('cat', ['shells'], 'must', { implied: true })]; });
    rule(/\b(?:(?:b[123]\s+)?crampons?(?:[\s-]?(?:compatible|ready|friendly))?|b[123])\b/, function (m) { return [spec('crampon', /b2|b3/.test(m[0]) ? 'B2' : 'B1'), spec('cat', ['boots'], 'must', { implied: true })]; });
    rule(/\brain ?covers?\b/, function () { return [spec('raincover', true), spec('cat', ['packs'], 'must', { implied: true })]; });
    rule(/\b(?:hydration|bladder|water reservoir|reservoir|drinking tube)\b/, function () { return [spec('hydration', true), spec('cat', ['packs'], 'must', { implied: true })]; });
    rule(/\b(?:merino|wool|woolly|woollen|woolen)\b/, function () { return [spec('merino', true)]; });
    rule(/\b(?:leather|full[\s-]?grain|nubuck)\b/, function () { return [spec('leather', true)]; });
    rule(/\bsuede\b/, function () { return [spec('suede', true)]; });
    rule(/\b(?:down|duck down|goose down)\b/, function () { return [spec('fill', 'down')]; });
    rule(/\bsynthetics?\b/, function () { return [spec('synthetic', true)]; });
    rule(/\b(?:water[\s-]?resistant|shower[\s-]?proof|splash[\s-]?proof)\b/, function () { return [spec('wp', true, 'prefer')]; });
    rule(/\b(?:waterproof(?:ed)?|water[\s-]?proof|gore[\s-]?tex|goretex|gtx|membrane|watertight|keeps? (?:my |your |the )?feet dry|dry feet|wet[\s-]?proof)\b/, function () { return [spec('wp', true)]; });
    rule(/\b(?:breathable|breathes|breathe|sweaty|hot feet|airy|ventilated|mesh|summer|hot weather|warm weather|heatwave)\b/, function () { return [spec('breathable', true, 'prefer')]; });
    rule(/\b(?:ultra[\s-]*light(?:weight)?|super[\s-]?light|light[\s-]*weight|lighter|lightest|light|featherweight|weighs? (?:next to )?nothing|minimal(?:ist)?|fast and light)\b/, function () { return [spec('light', true, 'prefer')]; });
    rule(/\b(?:warm|warmer|warmest|cosy|cozy|toasty|thermal|cold|freezing|chilly|cold weather|nippy|baltic)\b/, function () { return [spec('warm', true, 'prefer')]; });
    rule(/\b(?:comfy|comfortable|comfort)\b/, function () { return [spec('rated', 'comfort', 'prefer')]; });
    rule(/\b(?:best|top|highly|well)[\s-]*(?:rated|reviewed)\b|\bbest[\s-]?sellers?\b|\bbest\b|\bpopular\b|\brecommended\b|\bfavourites?\b|\bmost loved\b/, function () { return [spec('rated', true, 'prefer')]; });
    rule(/\b(?:in stock|available (?:now|today)|today|tomorrow|this weekend|for (?:the|this) weekend|asap|quickly|next day|urgent(?:ly)?|right now)\b/, function () { return [spec('instock', true)]; });
    rule(/\bankle\b/, function () { return [spec('height', 'ankle')]; });
    rule(/\b(?:knee[\s-]?(?:high|length)|long socks)\b/, function () { return [spec('height', 'knee')]; });

    // --- uses ------------------------------------------------------------------
    rule(/\bwinter (?:hill ?walking|hillwalking|walking|hiking|hills|mountains?|munros?|climbing|conditions|skills|mountaineering)\b|\b(?:winter|snow|snowy|ice|icy|frozen|ben nevis|cairngorms?|mountaineering|alpine)\b/, function () { return [spec('use', 'winter')]; });
    rule(/\b(?:backpacking|multi[\s-]?day|wild[\s-]?camping|camping|trek(?:king)?|thru[\s-]?hik(?:e|ing)|long[\s-]?distance|coast to coast|pennine way|dales way|west highland way|cape wrath|overnight|bothy|bothies)\b/, function () { return [spec('use', 'backpacking')]; });
    rule(/\b(?:scrambl(?:e|es|ing)|via ferrata|climbing|rock|grade (?:1|one|2|two) scrambles?)\b/, function () { return [spec('use', 'scrambling')]; });
    rule(/\b(?:fell[\s-]?running|trail[\s-]?running|running|run|jog(?:ging)?)\b/, function () { return [spec('use', 'running')]; });
    rule(/\b(?:hill[\s-]?walking|hillwalking|hills?|fells?|fell[\s-]?walking|mountains?|munros?|peaks?|three peaks|scafell(?: pike)?|snowdon|helvellyn|pen[\s-]?y[\s-]?ghent|ingleborough|whernside|ridges?|summits?|upland|dales)\b/, function () { return [spec('use', 'hill', 'prefer')]; });
    rule(/\b(?:travel(?:ling)?|holidays?|city|cities|commut(?:e|ing)|everyday|town|festivals?)\b/, function () { return [spec('use', 'travel', 'prefer')]; });
    rule(/\b(?:day[\s-]?walks?|day[\s-]?hikes?|dog[\s-]?walk(?:ing|s)?|walking the dog|walks?|walking|hiking|rambl(?:e|es|ing)|strolls?|countryside|the park|easy walks?|low[\s-]?level|coastal paths?|coast)\b/, function () { return [spec('use', 'day', 'prefer')]; });
    rule(/\b(?:rain|rainy|wet|bog(?:s|gy)?|mud(?:dy)?|puddles?|downpours?|soggy|lake district|lakes|scotland|wales|welsh|drizzle|streams?|rivers?|river crossings?|showers?|damp)\b/, function () { return [spec('wp', true, 'must', { fromWeather: true })]; });
    return R;
  }

  var RULES = rules();
  var VOCAB = buildVocab();

  function buildVocab() {
    var words = {};
    VOCAB_EXTRA.forEach(function (w) { words[w] = true; });
    RULES.forEach(function (r) {
      (r.re.source.match(/[a-z]{4,}/g) || []).forEach(function (w) { words[w] = true; });
    });
    STOP.forEach(function (w) { delete words[w]; });
    return Object.keys(words);
  }

  function range(a, b) { return { min: Math.min(a, b), max: Math.max(a, b) }; }

  // Optimal string alignment distance: insertions, deletions, substitutions and swapped neighbours ("wdie" → "wide").
  function lev(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var d = [];
    for (var i = 0; i <= a.length; i++) d[i] = [i];
    for (var j = 0; j <= b.length; j++) d[0][j] = j;
    for (i = 1; i <= a.length; i++) {
      var rowMin = Infinity;
      for (j = 1; j <= b.length; j++) {
        var cost = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        if (d[i][j] < rowMin) rowMin = d[i][j];
      }
      if (rowMin > max) return max + 1;
    }
    return d[a.length][b.length];
  }

  var NEGWORDS = /^(?:not|no|nor|non|neither|never|without|except|isnt|arent|wasnt|doesnt|dont|wont|cant|shouldnt|didnt|hasnt|havent|aint)$/;
  function correct(word) {
    if (NEGWORDS.test(word)) return null;
    if (word.length < 4 || /\d/.test(word) || /'/.test(word) || STOPSET[word] || VOCAB.indexOf(word) >= 0) return null;
    // Plurals and singulars of words we know are not typos.
    if (VOCAB.indexOf(word + 's') >= 0 || VOCAB.indexOf(word.replace(/e?s$/, '')) >= 0) return null;
    var max = word.length >= 8 ? 2 : 1, best = null, bestD = max + 1;
    var short = word.length < 5;   // four-letter words: only swapped letters ("wdie"), never other edits
    var sorted = word.split('').sort().join('');
    for (var i = 0; i < VOCAB.length; i++) {
      var v = VOCAB[i];
      if (v.length < 4) continue;
      if (short && (v.length !== word.length || v.split('').sort().join('') !== sorted)) continue;
      var d = lev(word, v, max);
      if (d < bestD || (d === bestD && best && v.length < best.length)) { bestD = d; best = v; }
    }
    return bestD <= max ? best : null;
  }

  function normalise(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[‘’`´]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[–—]/g, '-')
      .replace(/(\d),(\d{3})(?!\d)/g, '$1$2')
      .replace(/[^a-z0-9£'\-+.½/&<~,²\s]/g, ' ')
      .replace(/,(?!\d)/g, ' , ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function prepare(text) { return numberWords(normalise(text)); }

  // Read a request. Returns { specs, unused, notStocked, corrections, text }.
  function read(text) {
    var norm = prepare(text);
    var corrections = [];
    norm = norm.replace(/[a-z']+/g, function (w) {
      var fixed = correct(w);
      if (fixed && fixed !== w) { corrections.push({ from: w, to: fixed }); return fixed; }
      return w;
    });
    var work = ' ' + norm + ' ';
    var specs = [], notStocked = [], notes = [];
    RULES.forEach(function (r) {
      r.re.lastIndex = 0;
      var m, found = [];
      while ((m = r.re.exec(work)) !== null) {
        if (!m[0].trim()) { r.re.lastIndex++; continue; }
        found.push({ index: m.index, m: m });
      }
      found.forEach(function (f) {
        var out = r.fn(f.m) || [];
        out.forEach(function (s) {
          if (s.notStocked) {
            if (!notStocked.some(function (n) { return n.name === s.notStocked.name; })) {
              notStocked.push(s.notStocked);
              var alt = s.notStocked.alt;
              if (alt) {
                specs.push({ key: 'cat', value: alt.cats, mode: 'must', implied: true, altFor: s.notStocked.name, pos: f.index, from: f.m[0].trim() });
                (alt.specs || []).forEach(function (a) { specs.push(Object.assign({ pos: f.index, from: f.m[0].trim() }, a)); });
              }
            }
            return;
          }
          if (s.key === 'budget' && ((s.value.max !== undefined && s.value.max < 5) || (s.value.min && s.value.max && s.value.min > s.value.max))) {
            notes.push('We read “' + f.m[0].trim() + '”, but that would rule out everything, so we left the budget off.');
            return;
          }
          s.pos = f.index;
          s.from = f.m[0].trim();
          specs.push(s);
        });
        work = work.slice(0, f.index) + f.m[0].replace(/./g, ' ') + work.slice(f.index + f.m[0].length);
      });
    });

    // Leftover words: filler is dropped, anything else is shown as unused.
    var unused = [];
    work.split(/\s+/).forEach(function (w) {
      w = w.replace(/^['\-.+/&]+|['\-.+/&]+$/g, '');
      if (!w || STOPSET[w] || /^[^a-z0-9£]+$/.test(w)) return;
      if (unused.indexOf(w) < 0) unused.push(w);
    });

    var merged = merge(specs);
    // A bare "waterproof" with nothing else to go on is the jacket, as in "a cheap waterproof".
    var hasCat = merged.some(function (s) { return s.key === 'cat' && !s.fromFeet; });
    var wp = merged.filter(function (s) { return s.key === 'wp' && s.mode === 'must' && /^waterproofs?$/.test(s.from || ''); })[0];
    var footy = merged.some(function (s) { return ['fit', 'crampon', 'leather', 'suede', 'noleather', 'capacity', 'raincover', 'hydration', 'merino', 'cushion', 'height', 'sleeve', 'zipneck'].indexOf(s.key) >= 0 || (s.key === 'size' && typeof s.value === 'number' && (s.value % 2 || s.value < 8)) || s.fromFeet; });
    if (!hasCat && wp && !footy) merged.splice(merged.indexOf(wp), 1, { key: 'cat', value: ['shells'], mode: 'must', pos: wp.pos, from: wp.from });
    return { text: text, specs: merged, unused: unused, notStocked: notStocked, notes: notes, corrections: corrections };
  }

  // Later mentions win, except colours (several can be preferred) and categories (explicit beats implied).
  function merge(specs) {
    var out = [];
    specs.sort(function (a, b) { return a.pos - b.pos; });
    specs.forEach(function (s) {
      var id = specId(s);
      if (s.key === 'cat') {
        var cur = out.filter(function (o) { return o.key === 'cat'; })[0];
        if (cur) {
          if (s.implied && !cur.implied) return;
          if (!s.implied && cur.implied) { out.splice(out.indexOf(cur), 1); out.push(s); return; }
          // two explicit categories: "boots and socks" → both
          if (!s.implied && !cur.implied) { cur.value = uniq(cur.value.concat(s.value)); return; }
          cur.value = intersect(cur.value, s.value).length ? intersect(cur.value, s.value) : cur.value;
          return;
        }
        out.push(s);
        return;
      }
      var existing = out.filter(function (o) { return specId(o) === id; })[0];
      if (existing) {
        // A must beats a preference for the same thing ("waterproof ... showerproof").
        if (existing.mode === 'must' && s.mode === 'prefer') return;
        out.splice(out.indexOf(existing), 1, Object.assign({}, s, { pos: existing.pos }));
        return;
      }
      out.push(s);
    });
    return out;
  }

  function specId(s) {
    if (s.key === 'colour' || s.key === 'notcolour') return s.key + ':' + s.value;
    if (s.key === 'use') return 'use:' + s.value;
    return s.key;
  }
  function uniq(a) { return a.filter(function (v, i) { return a.indexOf(v) === i; }); }
  function intersect(a, b) { return a.filter(function (v) { return b.indexOf(v) >= 0; }); }

  window.ScarthReader = { read: read, normalise: normalise, prepare: prepare, specId: specId, COLOURS: COLOURS };
})();
