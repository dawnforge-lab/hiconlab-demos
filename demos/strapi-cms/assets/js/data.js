/*
 * Content model and seed content for the Cowl & Brush demo.
 * The block schemas mirror Hiconlab's Strapi 5 components (backend/src/components/blocks/*.json):
 * same field names, same limits. Three option lists are this client's own, not Hiconlab's:
 * the feature-point icons, cta.form (no "site-review") and portfolio-grid.kind (job types).
 * The hero also has a photo where Hiconlab's has a code-drawn figure.
 * Shared by the CMS (index.html) and the website (site.html).
 */
(function () {
  'use strict';

  // ---- Field helpers ------------------------------------------------------
  var s = function (k, max, extra) { return Object.assign({ k: k, t: 'string', max: max }, extra || {}); };
  var tx = function (k, max, extra) { return Object.assign({ k: k, t: 'text', max: max }, extra || {}); };
  var req = { req: true };
  var label = s('label', 60, { hint: 'Short label above the heading. Optional.' });
  var anchor = s('anchorId', 40, { hint: 'For links like /#faq. Letters, numbers and dashes.', advanced: true });
  var width = { k: 'width', t: 'enum', options: ['full', 'half'], req: true, def: 'full', advanced: true };
  var link = function (k) { return { k: k, t: 'link' }; };

  var ELEMENTS = {
    'elements.fact': { name: 'Fact', fields: [s('label', 40, req), s('value', 40, req), s('note', 120)] },
    'elements.faq-item': { name: 'FAQ item', fields: [s('question', 200, req), tx('answer', 1200, { req: true, hint: 'Plain text: the same words feed the FAQPage structured data.' })] },
    'elements.process-step': { name: 'Process step', fields: [s('rev', 8, req), s('when', 20), s('title', 60, req), tx('text', 300), { k: 'current', t: 'bool', def: false }] },
    'elements.included-item': { name: 'Included item', fields: [s('number', 8, req), s('title', 80, req), tx('description', 300)] },
    'elements.feature-point': { name: 'Feature point', fields: [{ k: 'icon', t: 'enum', options: ['flame', 'brush', 'shield', 'camera', 'clock', 'check'], req: true }, s('title', 80, req), tx('description', 300)] },
    'elements.target': { name: 'Target', fields: [s('label', 80, req), s('value', 30, req)] },
    'elements.note': { name: 'Note', fields: [tx('text', 400, req)] },
  };

  var BLOCKS = {
    'blocks.key-facts': { name: 'Key facts', icon: 'dashboard', fields: [anchor, { k: 'facts', t: 'rep', of: 'elements.fact', min: 2, max: 6, req: true }] },
    'blocks.services-grid': { name: 'Services grid', icon: 'grid', desc: 'Leave the services empty to show every main service in order.', fields: [label, anchor, s('heading', 120, req), tx('intro', 300), { k: 'services', t: 'relation', target: 'service' }] },
    'blocks.included-items': { name: 'Included items', icon: 'check', fields: [label, anchor, s('heading', 120, req), tx('intro', 300), { k: 'items', t: 'rep', of: 'elements.included-item', min: 2, max: 12, req: true }] },
    'blocks.feature-points': { name: 'Feature points', icon: 'star', fields: [label, anchor, width, s('heading', 120, req), { k: 'points', t: 'rep', of: 'elements.feature-point', min: 1, max: 6, req: true }] },
    'blocks.targets': { name: 'Targets', icon: 'list', fields: [label, anchor, width, s('heading', 120, req), { k: 'rows', t: 'rep', of: 'elements.target', min: 1, max: 8, req: true }] },
    'blocks.process': { name: 'Process', icon: 'clock', fields: [label, anchor, s('heading', 120, req), tx('intro', 300), { k: 'steps', t: 'rep', of: 'elements.process-step', min: 2, max: 6, req: true }] },
    'blocks.notes': { name: 'Notes', icon: 'feather', fields: [label, anchor, width, s('heading', 120, req), { k: 'notes', t: 'rep', of: 'elements.note', min: 1, max: 6, req: true }] },
    'blocks.faq': { name: 'FAQ', icon: 'question', fields: [label, anchor, width, s('heading', 120, req), { k: 'items', t: 'rep', of: 'elements.faq-item', min: 1, max: 20, req: true }] },
    'blocks.cta': { name: 'Call to action', icon: 'cursor', desc: 'Use it once per page.', fields: [label, anchor, width, s('heading', 90, req), tx('text', 240), { k: 'form', t: 'enum', options: ['none', 'enquiry'], req: true, def: 'none' }, link('primaryLink'), link('secondaryLink')] },
    'blocks.portfolio-grid': { name: 'Portfolio grid', icon: 'picture', desc: 'Pick jobs, or leave empty to show the latest of the chosen kind.', fields: [label, anchor, s('heading', 120, req), tx('intro', 300), { k: 'kind', t: 'enum', options: ['all', 'sweeping', 'stoves', 'cowls'], req: true, def: 'all' }, { k: 'limit', t: 'int', min: 1, max: 12, def: 3, req: true }, { k: 'projects', t: 'relation', target: 'project' }] },
    'blocks.latest-articles': { name: 'Latest articles', icon: 'feather', fields: [label, anchor, s('heading', 120, req), { k: 'limit', t: 'int', min: 1, max: 12, def: 3, req: true }, { k: 'category', t: 'relation', target: 'category', single: true }] },
    'blocks.rich-text': { name: 'Rich text', icon: 'paragraph', fields: [label, anchor, width, s('heading', 120), { k: 'body', t: 'blocks', req: true }] },
  };
  // Order of the home-page dynamic zone, as in home-page/schema.json.
  var ZONE = ['blocks.key-facts', 'blocks.services-grid', 'blocks.included-items', 'blocks.feature-points', 'blocks.targets', 'blocks.process', 'blocks.notes', 'blocks.faq', 'blocks.cta', 'blocks.portfolio-grid', 'blocks.latest-articles', 'blocks.rich-text'];

  var HERO = { name: 'Hero', icon: 'layout', desc: 'The top of the page. Its heading is the page’s only h1.', fields: [
    s('statusLabel', 80, { hint: 'The small sign above the heading.' }), s('heading', 120, req), s('headingAccent', 60, { hint: 'Second line of the heading, in brick red.' }), tx('lead', 320),
    { k: 'facts', t: 'rep', of: 'elements.fact', max: 4 }, link('primaryLink'), link('secondaryLink'), { k: 'image', t: 'media' },
  ] };

  var SEO = { name: 'SEO', icon: 'search', desc: 'Search and social metadata. Leave the canonical URL empty unless this page deliberately points elsewhere.', fields: [
    s('metaTitle', 60, req), tx('metaDescription', 160, { req: true, min: 50 }), s('canonicalUrl', null, { regex: '^https://', hint: 'Must start with https://' }),
    { k: 'noIndex', t: 'bool', def: false }, { k: 'ogImage', t: 'media', hint: 'Falls back to the hero photo, then the site default, then a generated /og image.' },
    { k: 'structuredData', t: 'json', hint: 'Leave empty: the LocalBusiness and FAQPage JSON-LD is generated in code.' },
  ] };

  var PAGE = { fields: [s('title', 90, req)] };

  // ---- Related collections ------------------------------------------------
  var SERVICES = [
    { id: 1, slug: 'chimney-sweeping', name: 'Chimney sweeping', price: 'from £75', blurb: 'Brushed and vacuumed, a camera up the flue, a smoke test and a certificate for your insurer.', img: 'sweeping', alt: 'A sweep’s brush, rods and soot bag on a dust sheet in front of a sealed Victorian fireplace' },
    { id: 2, slug: 'stove-fitting', name: 'Stove fitting', price: 'from £1,850', blurb: 'Survey, supply and fit: liner, register plate and hearth, signed off and registered with building control.', img: 'stoves', alt: 'A newly fitted black stove on a slate hearth in a red brick fireplace' },
    { id: 3, slug: 'cowls-and-bird-guards', name: 'Cowls and bird guards', price: 'from £95', blurb: 'Keep jackdaws and rain out of the flue. Fitted from the ladder, or a tower if the stack is tall.', img: 'cowls', alt: 'Old chimney pots, one with a new stainless steel bird guard, with a church tower behind' },
  ];
  var PROJECTS = [
    { id: 1, kind: 'stoves', title: 'Inglenook stove, Bromfield', note: '8 kW stove, new liner and slate hearth', when: 'Oct' },
    { id: 2, kind: 'cowls', title: 'Bird guards on a terrace, Broad Street', note: 'Four pots, one morning, no scaffold', when: 'Sep' },
    { id: 3, kind: 'sweeping', title: 'Farmhouse range flue, Clee Hill', note: 'Two years of tar cleared, camera survey', when: 'Sep' },
  ];
  var CATEGORIES = [{ id: 1, name: 'Stoves' }, { id: 2, name: 'Sweeping' }];
  var ARTICLES = [
    { title: 'Getting your stove ready for winter', date: '14 Oct', cat: 'Stoves' },
    { title: 'Jackdaws, nests and what a cowl does', date: '22 Sep', cat: 'Sweeping' },
    { title: 'What your sweep certificate is for', date: '2 Sep', cat: 'Sweeping' },
  ];
  var MEDIA = {
    hero: { file: 'hero-stove.webp', size: '1600 × 1067', alt: 'A lit wood burner in a limewashed stone inglenook, with a basket of logs and a leather armchair' },
  };

  // ---- The Home page, as published --------------------------------------
  var HOME = {
    title: 'Home page',
    hero: {
      statusLabel: 'Booking about two weeks ahead',
      heading: 'Chimneys swept and stoves fitted',
      headingAccent: 'around Ludlow since 2015',
      lead: 'Rhian and Tom sweep chimneys and fit wood burners across south Shropshire. Dust sheets down, a camera up the flue, and a certificate for your insurer before we leave.',
      facts: [
        { label: 'Covering', value: 'Ludlow, Tenbury, Craven Arms', note: '' },
        { label: 'Open', value: 'Mon–Sat, 8am–5pm', note: '' },
      ],
      primaryLink: { label: 'Book a sweep', href: '/book' },
      secondaryLink: { label: 'Stove fitting', href: '/services/stove-fitting' },
      image: 'hero',
    },
    sections: [
      { id: 11, __component: 'blocks.key-facts', anchorId: '', facts: [
        { label: 'Sweep, open fire or stove', value: 'from £75', note: 'Most homes take 45–60 minutes' },
        { label: 'Usually booked', value: '2 weeks ahead', note: 'Sooner if someone cancels' },
        { label: 'Stove fitting', value: 'from £1,850', note: 'Supply and fit, signed off' },
      ] },
      { id: 12, __component: 'blocks.services-grid', label: 'Services', anchorId: 'services', heading: 'What we do', intro: 'Most of our work is sweeping. Most of the rest is making sure a stove or open fire is safe to use.', services: [] },
      { id: 13, __component: 'blocks.process', label: 'On the day', anchorId: '', heading: 'How a sweep goes', intro: 'About an hour, start to finish, and you won’t be hoovering up after us.', steps: [
        { rev: '01', when: 'Day before', title: 'A text to confirm', text: 'We send a two-hour window. If you can, let a stove go cold overnight.', current: false },
        { rev: '02', when: 'Arrival', title: 'Sheets down, fire sealed', text: 'Dust sheets from the door to the hearth, and the opening sealed before a brush goes in.', current: false },
        { rev: '03', when: '45–60 min', title: 'Sweep and camera check', text: 'Brushed from below with the vacuum running, then a camera up the flue to check the liner.', current: false },
        { rev: '04', when: 'Before we go', title: 'Smoke test and certificate', text: 'A smoke test to prove the draw, and your certificate by email the same day.', current: false },
      ] },
      { id: 14, __component: 'blocks.faq', label: 'Questions', anchorId: 'faq', width: 'full', heading: 'Questions people ask', items: [
        { question: 'How often should my chimney be swept?', answer: 'Once a year for smokeless fuel, and twice a year if you burn wood: once before winter and once part way through. Your insurer may ask to see the certificate.' },
        { question: 'Is it messy?', answer: 'Hardly. We seal the opening, sheet the floor and vacuum as we sweep. Most people can’t tell we’ve been, apart from the fire drawing better.' },
        { question: 'Do I need to be in?', answer: 'Someone needs to let us in and be around at the end for the smoke test. It takes about an hour.' },
        { question: 'My stove won’t draw. Is it the chimney?', answer: 'Often it is: a blocked liner, a nest or a clogged cowl. We’ll check it on a sweep and tell you straight if it’s something else.' },
      ] },
      { id: 15, __component: 'blocks.cta', label: '', anchorId: 'book', width: 'full', heading: 'Book a sweep before the cold sets in', text: 'Tell us roughly where you are and what you burn. Rhian will ring you back within a working day.', form: 'enquiry', primaryLink: { label: 'Call 01632 960418', href: 'tel:+441632960418' }, secondaryLink: { label: '', href: '' } },
    ],
    seo: {
      metaTitle: 'Chimney sweep and stove fitter in Ludlow | Cowl & Brush',
      metaDescription: 'Chimney sweeping from £75 and wood burner fitting around Ludlow, Tenbury and Craven Arms. Dust sheets down, certificate before we leave.',
      canonicalUrl: '',
      noIndex: false,
      ogImage: null,
      structuredData: '',
    },
  };

  window.CB_DATA = {
    ELEMENTS: ELEMENTS, BLOCKS: BLOCKS, ZONE: ZONE, HERO: HERO, SEO: SEO, PAGE: PAGE,
    SERVICES: SERVICES, PROJECTS: PROJECTS, CATEGORIES: CATEGORIES, ARTICLES: ARTICLES, MEDIA: MEDIA,
    HOME: HOME,
    SITE: { name: 'Cowl & Brush', host: 'www.cowlandbrush.example.co.uk', cms: 'cms.cowlandbrush.example.co.uk', phone: '01632 960418', tel: '+441632960418', email: 'hello@cowlandbrush.example.co.uk', address: ['Unit 3, Corve Mill Yard', 'Ludlow SY8 2PG'] },
  };
})();
