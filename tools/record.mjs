// Records a demo's scripted tour to MP4 plus a poster image.
//
//   npm run record -- <demo-id> [more ids] [--all] [--headed] [--size 1920x1080] [--scale 1] [--fps 30]
//
// How it works: the demo is opened with ?tour=record. The tour engine waits for
// window.__tourBegin() before it starts, so capture begins on a fully loaded page.
// Playwright's screencast hands over JPEG frames with timestamps; ffmpeg turns
// them into a constant-frame-rate H.264 file. The tour's t.poster() call takes a
// full-quality still for the poster. Every request that is not to this local
// server is blocked and reported, so a recording proves the demo works offline.
//
// Output: media/<id>.mp4, media/<id>-poster.jpg, media/<id>-poster.webp, and an entry in media/media.json
import { chromium } from 'playwright';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, startServer } from './serve.mjs';

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const optValues = new Set(['size', 'scale', 'fps', 'timeout'].map((n) => opt(n)).filter(Boolean));
const manifest = JSON.parse(readFileSync(join(ROOT, 'demos', 'demos.json'), 'utf8'));
let ids = args.filter((a) => !a.startsWith('--') && !optValues.has(a));
if (flag('all')) ids = manifest.demos.filter((d) => d.status !== 'planned').map((d) => d.id);
if (!ids.length) {
  console.error('Usage: npm run record -- <demo-id> [--all] [--headed] [--size 1920x1080] [--scale 1] [--fps 30]');
  process.exit(1);
}

const [vw, vh] = opt('size', '1920x1080').split('x').map(Number);
const scale = Number(opt('scale', '1'));
const fps = Number(opt('fps', '30'));
const timeoutMs = Number(opt('timeout', '120')) * 1000;
const outW = Math.round((vw * scale) / 2) * 2;
const outH = Math.round((vh * scale) / 2) * 2;

const server = await startServer(0);
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  headless: !flag('headed'),
  // GPU flags help WebGL demos render at full speed; harmless elsewhere.
  args: ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-zero-copy', '--hide-scrollbars', '--force-color-profile=srgb'],
});

let failed = 0;
for (const id of ids) {
  const entry = manifest.demos.find((d) => d.id === id);
  if (!entry) { console.error(`record: no demo "${id}" in demos/demos.json`); failed++; continue; }
  try {
    await recordOne(entry);
  } catch (err) {
    failed++;
    console.error(`record ${id}: ${err.message}`);
  }
}
await browser.close();
server.close();
process.exit(failed ? 1 : 0);

async function recordOne(entry) {
  const id = entry.id;
  const work = join(ROOT, '.rec', id);
  rmSync(work, { recursive: true, force: true });
  mkdirSync(join(work, 'frames'), { recursive: true });
  mkdirSync(join(ROOT, 'media'), { recursive: true });

  const context = await browser.newContext({
    viewport: { width: vw, height: vh },
    deviceScaleFactor: scale,
    reducedMotion: 'no-preference',
    colorScheme: 'light',
    locale: 'en-GB',
    timezoneId: 'Europe/London',
  });
  const blocked = [];
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.protocol === 'data:' || url.protocol === 'blob:' || url.hostname === '127.0.0.1' || url.hostname === 'localhost') return route.continue();
    blocked.push(url.href);
    return route.abort('blockedbyclient');
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  const frames = [];
  let posterTaken = false;
  await page.exposeFunction('__tourBegin', async () => {
    await page.screencast.start({
      size: { width: outW, height: outH },
      quality: 92,
      onFrame: ({ data, timestamp }) => frames.push({ data, timestamp }),
    });
    // Give the compositor a moment so the first frame is the settled page.
    await new Promise((r) => setTimeout(r, 120));
  });
  await page.exposeFunction('__tourPoster', async () => {
    await page.screenshot({ path: join(work, 'poster.png'), type: 'png' });
    posterTaken = true;
  });

  const path = (entry.path || `demos/${id}/`).replace(/^\//, '');
  const sep = path.includes('?') ? '&' : '?';
  console.log(`record ${id}: ${base}/${path}${sep}tour=record at ${vw}x${vh} @${scale}x -> ${outW}x${outH}`);
  await page.goto(`${base}/${path}${sep}tour=record`, { waitUntil: 'load' });
  await page.waitForFunction(() => ['done', 'error'].includes(document.documentElement.dataset.tour), null, { timeout: timeoutMs, polling: 250 });
  const result = await page.evaluate(() => document.documentElement.dataset.tour);
  await new Promise((r) => setTimeout(r, 400));
  await page.screencast.stop();
  if (!posterTaken) await page.screenshot({ path: join(work, 'poster.png'), type: 'png' });
  await context.close();

  if (result !== 'done') throw new Error(`tour ended with "${result}". ${errors.join(' | ')}`);
  if (blocked.length) throw new Error(`blocked ${blocked.length} external request(s): ${[...new Set(blocked)].slice(0, 5).join(', ')}`);
  if (frames.length < 10) throw new Error(`only ${frames.length} frames captured`);

  // Frames arrive only when the page changes, so each one is held until the next.
  const lines = [];
  frames.forEach((f, i) => {
    const name = `f${String(i).padStart(6, '0')}.jpg`;
    writeFileSync(join(work, 'frames', name), f.data);
    const next = frames[i + 1];
    const dur = next ? Math.max(0.001, (next.timestamp - f.timestamp) / 1000) : 0.6;
    lines.push(`file 'frames/${name}'`, `duration ${dur.toFixed(4)}`);
  });
  lines.push(`file 'frames/f${String(frames.length - 1).padStart(6, '0')}.jpg'`);
  writeFileSync(join(work, 'frames.txt'), lines.join('\n'));

  const mp4 = join(ROOT, 'media', `${id}.mp4`);
  ffmpeg(['-f', 'concat', '-safe', '0', '-i', 'frames.txt',
    '-vf', `fps=${fps},scale=${outW}:${outH}:flags=lanczos,format=yuv420p`,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-profile:v', 'high', '-tune', 'animation',
    '-movflags', '+faststart', '-an', mp4], work);
  ffmpeg(['-i', 'poster.png', '-vf', `scale=${outW}:${outH}:flags=lanczos`, '-q:v', '2', join(ROOT, 'media', `${id}-poster.jpg`)], work);
  ffmpeg(['-i', 'poster.png', '-vf', `scale=${outW}:${outH}:flags=lanczos`, '-c:v', 'libwebp', '-quality', '86', join(ROOT, 'media', `${id}-poster.webp`)], work);

  const seconds = (frames.at(-1).timestamp - frames[0].timestamp) / 1000 + 0.6;
  const note = seconds < 20 || seconds > 45 ? '  <-- outside the 20–45 s target' : '';
  console.log(`record ${id}: ${frames.length} frames, ${seconds.toFixed(1)} s -> media/${id}.mp4${note}`);
  if (errors.length) console.warn(`record ${id}: console errors: ${errors.join(' | ')}`);
  if (!flag('keep')) rmSync(work, { recursive: true, force: true });
  updateMediaManifest(id, { video: `${id}.mp4`, posterWebp: `${id}-poster.webp`, posterJpg: `${id}-poster.jpg`, width: outW, height: outH, seconds: Math.round(seconds * 10) / 10, recordedAt: new Date().toISOString() });
}

// media/media.json tells the index which demos have a video, so it never probes for missing files.
function updateMediaManifest(id, info) {
  const file = join(ROOT, 'media', 'media.json');
  const data = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { media: {} };
  data.media[id] = info;
  data.media = Object.fromEntries(Object.entries(data.media).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

function ffmpeg(argv, cwd) {
  const res = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...argv], { cwd, stdio: ['ignore', 'inherit', 'inherit'] });
  if (res.status !== 0) throw new Error(`ffmpeg failed: ffmpeg ${argv.join(' ')}`);
}
