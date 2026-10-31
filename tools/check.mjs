// Automated part of the quality bar. For each demo it:
//   - loads every page listed for the demo at 375px and 1440px with all non-local requests blocked
//   - takes full-page and first-screen screenshots into .checks/<id>/
//   - reports external requests, console errors, broken local files and horizontal overflow
//   - runs axe-core (WCAG 2 A/AA) and reports serious and critical issues
//   - flags links that point to real websites
//   - reloads with prefers-reduced-motion and lists animations still looping
//   - with --tour, runs the scripted tour at 3x speed and checks it finishes cleanly
//
//   npm run check -- <demo-id> [more ids] [--all] [--tour]
//
// Writes .checks/<id>/report.json and exits non-zero when anything fails.
// Screenshots are for the critic to look at; this script cannot judge design.
import { chromium, devices } from 'playwright';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, startServer } from './serve.mjs';

const args = process.argv.slice(2);
const manifest = JSON.parse(readFileSync(join(ROOT, 'demos', 'demos.json'), 'utf8'));
let ids = args.filter((a) => !a.startsWith('--'));
if (args.includes('--all')) ids = manifest.demos.filter((d) => d.status !== 'planned').map((d) => d.id);
if (args.includes('--index')) ids.unshift('__index');
if (!ids.length) {
  console.error('Usage: npm run check -- <demo-id> [--all] [--index] [--tour]');
  process.exit(1);
}
const runTour = args.includes('--tour');
const axeSource = readFileSync(join(ROOT, 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');

const VIEWPORTS = [
  { name: '375', options: { ...devices['iPhone 13'], viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 } },
  { name: '1440', options: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } },
];

const server = await startServer(0);
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ args: ['--ignore-gpu-blocklist', '--hide-scrollbars'] });
let headedBrowser = null;

let failedDemos = 0;
for (const id of ids) {
  const entry = id === '__index'
    ? { id: 'index', title: 'Index', pages: [''] }
    : manifest.demos.find((d) => d.id === id);
  if (!entry) { console.error(`check: no demo "${id}" in demos/demos.json`); failedDemos++; continue; }
  const report = await checkDemo(entry);
  const failures = report.failures.length;
  if (failures) failedDemos++;
  console.log(`\n${entry.id}: ${failures ? `FAIL (${failures})` : 'pass'}${report.warnings.length ? `, ${report.warnings.length} warning(s)` : ''}`);
  for (const f of report.failures) console.log(`  x ${f}`);
  for (const w of report.warnings) console.log(`  ! ${w}`);
  console.log(`  screenshots: .checks/${entry.id}/`);
}
await browser.close();
if (headedBrowser) await headedBrowser.close();
server.close();
process.exit(failedDemos ? 1 : 0);

function pagesOf(entry) {
  if (entry.pages && entry.pages.length) return entry.pages;
  return [`demos/${entry.id}/`];
}

function slug(p) {
  return (p.replace(/^demos\/[^/]+\/?/, '').replace(/[/?.=&]+/g, '-').replace(/^-|-$/g, '') || 'home');
}

async function newContext(options, extra = {}, useHeaded = false) {
  // 3D demos run their tour in a real window: headless Chromium only has software WebGL.
  if (useHeaded) headedBrowser ??= await chromium.launch({ headless: false, args: ['--ignore-gpu-blocklist', '--hide-scrollbars'] });
  const context = await (useHeaded ? headedBrowser : browser).newContext({ ...options, locale: 'en-GB', timezoneId: 'Europe/London', ...extra });
  const blocked = [];
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (['data:', 'blob:'].includes(url.protocol) || ['127.0.0.1', 'localhost'].includes(url.hostname)) return route.continue();
    blocked.push(url.href);
    return route.abort('blockedbyclient');
  });
  return { context, blocked };
}

async function checkDemo(entry) {
  const dir = join(ROOT, '.checks', entry.id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const report = { id: entry.id, checkedAt: new Date().toISOString(), failures: [], warnings: [], pages: [] };

  for (const pagePath of pagesOf(entry)) {
    for (const vp of VIEWPORTS) {
      const label = `${slug(pagePath)}@${vp.name}`;
      const { context, blocked } = await newContext(vp.options);
      const page = await context.newPage();
      const errors = [];
      const missing = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error' && !/ERR_BLOCKED_BY_CLIENT/.test(m.text())) errors.push(m.text()); });
      page.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(base)) missing.push(`${r.status()} ${r.url().slice(base.length)}`); });

      await page.goto(`${base}/${pagePath}`, { waitUntil: 'load' });
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(900);

      const facts = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const wide = [];
        if (document.documentElement.scrollWidth > vw + 1) {
          for (const el of document.querySelectorAll('body *')) {
            const r = el.getBoundingClientRect();
            if (r.width && r.right > vw + 1 && getComputedStyle(el).position !== 'fixed') {
              wide.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''} (right ${Math.round(r.right)}px)`);
              if (wide.length > 6) break;
            }
          }
        }
        const external = [...document.querySelectorAll('a[href], area[href], form[action]')]
          .map((a) => a.getAttribute('href') || a.getAttribute('action'))
          .filter((h) => /^(https?:)?\/\//i.test(h) && !/^(https?:)?\/\/(localhost|127\.0\.0\.1)/i.test(h));
        return {
          title: document.title,
          lang: document.documentElement.lang,
          overflow: document.documentElement.scrollWidth > vw + 1,
          wide,
          external: [...new Set(external)],
          h1: document.querySelectorAll('h1').length,
          metaViewport: !!document.querySelector('meta[name="viewport"]'),
        };
      });

      await page.screenshot({ path: join(dir, `${label}-fold.png`) });
      await page.screenshot({ path: join(dir, `${label}-full.png`), fullPage: true });

      await page.addScriptTag({ content: axeSource });
      const axe = await page.evaluate(async () => {
        const res = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }, resultTypes: ['violations'] });
        return res.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, sample: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) }));
      });
      await context.close();

      const where = `[${label}]`;
      if (blocked.length) report.failures.push(`${where} external requests: ${[...new Set(blocked)].slice(0, 5).join(', ')}`);
      if (missing.length) report.failures.push(`${where} missing files: ${[...new Set(missing)].slice(0, 5).join(', ')}`);
      if (errors.length) report.failures.push(`${where} console errors: ${[...new Set(errors)].slice(0, 3).join(' | ')}`);
      if (facts.overflow) report.failures.push(`${where} horizontal overflow: ${facts.wide.join(', ')}`);
      if (facts.external.length) report.failures.push(`${where} links to real sites: ${facts.external.slice(0, 5).join(', ')}`);
      if (!facts.title) report.failures.push(`${where} missing <title>`);
      if (facts.lang !== 'en-GB') report.warnings.push(`${where} <html lang> is "${facts.lang}", expected "en-GB"`);
      if (!facts.metaViewport) report.failures.push(`${where} missing viewport meta`);
      if (facts.h1 !== 1) report.warnings.push(`${where} ${facts.h1} <h1> elements`);
      for (const v of axe) {
        const line = `${where} axe ${v.impact} ${v.id}: ${v.help} (${v.nodes}x, e.g. ${v.sample.join(' ; ')})`;
        if (v.impact === 'serious' || v.impact === 'critical') report.failures.push(line);
        else report.warnings.push(line);
      }
      report.pages.push({ page: pagePath, viewport: vp.name, ...facts, axe });
    }

    // Reduced motion: nothing should keep looping, and the page should still be usable.
    const { context } = await newContext(VIEWPORTS[1].options, { reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(`${base}/${pagePath}`, { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const looping = await page.evaluate(() => document.getAnimations()
      .filter((a) => a.playState === 'running' && a.effect && a.effect.getComputedTiming().iterations === Infinity)
      .map((a) => (a.effect.target ? a.effect.target.tagName.toLowerCase() + (a.effect.target.className && typeof a.effect.target.className === 'string' ? '.' + a.effect.target.className.trim().split(/\s+/)[0] : '') : 'unknown') + ' ' + (a.animationName || a.constructor.name)));
    await page.screenshot({ path: join(dir, `${slug(pagePath)}@reduced-motion.png`) });
    await context.close();
    if (looping.length) report.failures.push(`[${slug(pagePath)}] still looping with reduced motion: ${[...new Set(looping)].slice(0, 5).join(', ')}`);
  }

  if (runTour && entry.id !== 'index') {
    const [tw, th] = (entry.record?.viewport || '1920x1080').split('x').map(Number);
    const { context, blocked } = await newContext({ viewport: { width: tw, height: th } }, {}, entry.record?.headed === true);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const path = pagesOf(entry)[0];
    const sep = path.includes('?') ? '&' : '?';
    const started = Date.now();
    await page.goto(`${base}/${path}${sep}tour=record&speed=3`, { waitUntil: 'load' });
    let result = 'timeout';
    try {
      await page.waitForFunction(() => ['done', 'error'].includes(document.documentElement.dataset.tour), null, { timeout: 60000, polling: 250 });
      result = await page.evaluate(() => document.documentElement.dataset.tour);
    } catch { /* timeout */ }
    const seconds = ((Date.now() - started) / 1000) * 3;
    await page.screenshot({ path: join(dir, 'tour-end.png') });
    await context.close();
    if (result !== 'done') report.failures.push(`tour ended with "${result}"${errors.length ? ': ' + errors.join(' | ') : ''}`);
    if (blocked.length) report.failures.push(`tour made external requests: ${[...new Set(blocked)].slice(0, 5).join(', ')}`);
    report.tour = { result, approxSeconds: Math.round(seconds) };
    if (result === 'done' && (seconds < 18 || seconds > 50)) report.warnings.push(`tour runs about ${Math.round(seconds)} s at normal speed; target 20–45 s`);
  }

  writeFileSync(join(dir, 'report.json'), JSON.stringify(report, null, 2));
  return report;
}
