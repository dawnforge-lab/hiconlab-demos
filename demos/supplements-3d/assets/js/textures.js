// Canvas textures: the printed tube label (one per flavour), the tablet face and its
// debossed mark, the brushed aluminium and the foam on the water.
import * as THREE from 'three';
import { FLAVOURS, PANEL } from './data.js';

const DISPLAY = '"Mona Sans", "Arial Narrow", sans-serif';
const MONO = '"Spline Sans Mono", ui-monospace, monospace';

// The label wraps the whole tube. Width = circumference (9.42 cm), height = 9.0 cm.
// u = 0.75 faces the front, u = 0.25 faces the back.
export const LABEL_W = 2048;
export const LABEL_H = 1956;

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function font(ctx, weight, size, stretch = 100, family = DISPLAY) {
  // Canvas has no font-stretch shorthand in every browser; fontStretch is the property.
  ctx.font = `${weight} ${size}px ${family}`;
  if ('fontStretch' in ctx) {
    const map = { 75: 'condensed', 87.5: 'semi-condensed', 100: 'normal', 112.5: 'semi-expanded', 125: 'expanded' };
    ctx.fontStretch = map[stretch] || 'normal';
  }
}

// An isometric cube: the salt-crystal mark.
export function drawCube(ctx, x, y, s, fill, line) {
  const h = s * 0.5, w = s * 0.866;
  ctx.save();
  ctx.translate(x, y);
  ctx.lineJoin = 'round';
  ctx.lineWidth = s * 0.07;
  ctx.strokeStyle = line;
  // top face
  ctx.beginPath();
  ctx.moveTo(0, -s); ctx.lineTo(w, -h); ctx.lineTo(0, 0); ctx.lineTo(-w, -h); ctx.closePath();
  ctx.fillStyle = fill; ctx.fill(); ctx.stroke();
  // left and right faces
  ctx.beginPath();
  ctx.moveTo(-w, -h); ctx.lineTo(0, 0); ctx.lineTo(0, s); ctx.lineTo(-w, h); ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w, -h); ctx.lineTo(0, 0); ctx.lineTo(0, s); ctx.lineTo(w, h); ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Deterministic noise so the label and tablets look the same every load.
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

export function drawLabel(key) {
  const f = FLAVOURS[key];
  const [c, ctx] = canvas(LABEL_W, LABEL_H);
  const W = LABEL_W, H = LABEL_H;

  // Ground: the flavour colour, a faint grid of salt crystals.
  ctx.fillStyle = f.tube;
  ctx.fillRect(0, 0, W, H);
  const r = rng(7);
  ctx.globalAlpha = 0.11;
  for (let y = 70; y < H; y += 120) {
    for (let x = (y / 120) % 2 ? 60 : 0; x < W; x += 120) {
      if (r() < 0.55) continue;
      drawCube(ctx, x, y, 16, 'transparent', f.print);
    }
  }
  ctx.globalAlpha = 1;

  // Bottom band, all the way round: tablets count and town.
  ctx.fillStyle = f.print;
  ctx.fillRect(0, H - 150, W, 150);
  ctx.fillStyle = f.tube;
  font(ctx, 700, 52, 125);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  const band = '20 EFFERVESCENT TABLETS  ·  MADE IN DROITWICH SPA  ·  ';
  const bw = ctx.measureText(band).width;
  for (let x = -bw / 2 + 120; x < W + bw; x += bw) ctx.fillText(band, x, H - 75);

  // ---- Front (centred on x = 1536) ----
  const FX = 1536;
  // Vertical wordmark, reading bottom to top.
  ctx.save();
  ctx.translate(FX - 70, H - 240);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = f.print;
  let size = 300;
  font(ctx, 900, size, 125);
  const avail = H - 240 - 90;
  const mw = ctx.measureText('UPWICH').width;
  if (mw > avail) { size = Math.floor(size * avail / mw); font(ctx, 900, size, 125); }
  ctx.fillText('UPWICH', 0, 0);
  ctx.restore();

  // Info column to the right of the wordmark.
  const ix = FX - 10;
  const IW = 450;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  drawCube(ctx, ix + 70, 200, 62, f.accent, f.print);
  ctx.fillStyle = f.print;
  font(ctx, 600, 50, 100, MONO);
  ctx.fillText('ELECTROLYTE', ix, 360);
  ctx.fillText('TABLETS WITH', ix, 414);
  ctx.fillText('SWEETENERS', ix, 468);

  // Flavour name, big, broken onto lines.
  font(ctx, 800, 108, 100);
  const words = f.name === 'Lemon & lime' ? ['Lemon', '& lime'] : f.name === 'Blood orange' ? ['Blood', 'orange'] : ['Black-', 'currant'];
  words.forEach((w, i) => ctx.fillText(w, ix - 4, 640 + i * 114));

  // Mineral strip.
  const sy = 1000;
  ctx.strokeStyle = f.print;
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(ix, sy); ctx.lineTo(ix + IW, sy); ctx.stroke();
  const rows = [['Sodium', '500 mg'], ['Potassium', '300 mg'], ['Magnesium', '60 mg']];
  rows.forEach(([n, v], i) => {
    const y = sy + 92 + i * 96;
    font(ctx, 500, 38, 100, MONO);
    ctx.fillText(n, ix, y);
    font(ctx, 800, 50, 100);
    ctx.textAlign = 'right';
    ctx.fillText(v, ix + IW, y + 2);
    ctx.textAlign = 'left';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ix, y + 32); ctx.lineTo(ix + IW, y + 32); ctx.stroke();
  });
  font(ctx, 500, 40, 100, MONO);
  ctx.fillText('per tablet', ix, sy + 400);
  font(ctx, 600, 46, 100, MONO);
  ctx.fillText('0 g sugar · 6 kcal', ix, sy + 470);

  // Food supplement line under the wordmark side.
  font(ctx, 500, 38, 100, MONO);
  ctx.fillText('FOOD SUPPLEMENT', ix, H - 210);

  // ---- Back (centred on x = 512): the panel on a salt-white card ----
  const PX = 512 - 420, PW = 840;
  const py = 120;
  const C1 = PX + 470, C2 = PX + 700, C3 = PX + PW - 36;   // right edges of the value columns
  ctx.fillStyle = '#f6f4ee';
  roundRect(ctx, PX, py, PW, 1040, 28);
  ctx.fill();
  ctx.fillStyle = '#13232d';
  ctx.textAlign = 'left';
  font(ctx, 800, 64, 112.5);
  ctx.fillText('Nutrition', PX + 40, py + 100);
  font(ctx, 500, 28, 100, MONO);
  ctx.textAlign = 'right';
  ctx.fillText('1 TABLET', C1, py + 152);
  ctx.fillText('2 TABLETS', C2, py + 152);
  ctx.fillText('%NRV*', C3, py + 152);
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#13232d';
  ctx.beginPath(); ctx.moveTo(PX + 40, py + 180); ctx.lineTo(PX + PW - 36, py + 180); ctx.stroke();
  PANEL.forEach(([n, v1, v2, nrv], i) => {
    const y = py + 252 + i * 84;
    const indent = n.startsWith('  ');
    ctx.textAlign = 'left';
    font(ctx, indent ? 400 : 600, 40, 100);
    ctx.fillText(n.trim(), PX + 40 + (indent ? 28 : 0), y);
    ctx.textAlign = 'right';
    font(ctx, 500, i === 0 ? 27 : 36, 100, MONO);
    ctx.fillText(v1, C1, y);
    ctx.fillText(v2, C2, y);
    ctx.fillText(nrv, C3, y);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(PX + 40, y + 28); ctx.lineTo(PX + PW - 36, y + 28); ctx.stroke();
  });
  ctx.textAlign = 'left';
  font(ctx, 400, 28, 100, MONO);
  ctx.fillText('*Nutrient reference value, for 2 tablets', PX + 40, py + 252 + PANEL.length * 84 + 6);
  ctx.fillText('Fat 0 g · Sugars 0 g · Protein 0 g', PX + 40, py + 252 + PANEL.length * 84 + 48);

  // Directions under the card.
  ctx.fillStyle = f.print;
  font(ctx, 800, 56, 112.5);
  ctx.fillText('Drop one in 500 ml', PX + 6, py + 1150);
  font(ctx, 500, 38, 100);
  const dir = ['of water and let it fizz for about', 'two minutes. Up to two tablets a day.', 'Do not exceed the stated dose.'];
  dir.forEach((l, i) => ctx.fillText(l, PX + 6, py + 1216 + i * 50));

  // Barcode near the seam on the right of the back.
  const bx = 1000, by = H - 520;
  ctx.fillStyle = '#f6f4ee';
  ctx.fillRect(bx - 20, by - 20, 300, 200);
  ctx.fillStyle = '#13232d';
  const br = rng(42);
  for (let x = bx; x < bx + 260;) {
    const w = 3 + Math.floor(br() * 3) * 3;
    if (br() > 0.42) ctx.fillRect(x, by, w, 130);
    x += w + 3;
  }
  font(ctx, 500, 26, 100, MONO);
  ctx.fillText('5 060912 340187', bx + 10, by + 168);

  // Batch and best before, stamped near the top seam.
  ctx.fillStyle = f.print;
  font(ctx, 500, 30, 100, MONO);
  ctx.fillText('LOT UW2210 · BEST BEFORE: SEE BASE', 960, 120);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// Tablet face: off-white compressed powder with flavour specks. Planar UVs.
export function drawTablet(key, tex) {
  const f = FLAVOURS[key];
  const S = 512;
  const c = tex ? tex.image : canvas(S, S)[0];
  const ctx = c.getContext('2d');
  ctx.fillStyle = f.tablet;
  ctx.fillRect(0, 0, S, S);
  const r = rng(3);
  for (let i = 0; i < 4200; i++) {
    const x = r() * S, y = r() * S;
    const v = r();
    ctx.fillStyle = v < 0.16 ? f.speck : v < 0.5 ? 'rgba(255,255,255,.6)' : 'rgba(0,0,0,.05)';
    const s = v < 0.16 ? 1.4 + r() * 2.8 : 0.8 + r() * 1.8;
    ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill();
  }
  if (tex) { tex.needsUpdate = true; return tex; }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// Bump: a debossed cube mark and a score line, grain everywhere.
export function tabletBump() {
  const S = 512;
  const [c, ctx] = canvas(S, S);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, S, S);
  const r = rng(11);
  for (let i = 0; i < 9000; i++) {
    const g = 110 + Math.floor(r() * 50);
    ctx.fillStyle = `rgb(${g},${g},${g})`;
    ctx.fillRect(r() * S, r() * S, 2, 2);
  }
  ctx.filter = 'blur(2px)';
  // Debossed: darker = lower.
  ctx.strokeStyle = '#3a3a3a';
  ctx.lineWidth = 9;
  ctx.lineJoin = 'round';
  const cx = S / 2, cy = S / 2 + 6, s = 70, h = s * 0.5, w = s * 0.866;
  ctx.beginPath();
  ctx.moveTo(cx, cy - s); ctx.lineTo(cx + w, cy - h); ctx.lineTo(cx + w, cy + h); ctx.lineTo(cx, cy + s); ctx.lineTo(cx - w, cy + h); ctx.lineTo(cx - w, cy - h); ctx.closePath();
  ctx.moveTo(cx - w, cy - h); ctx.lineTo(cx, cy); ctx.lineTo(cx + w, cy - h);
  ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + s);
  ctx.stroke();
  ctx.filter = 'none';
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

// Brushed aluminium for the bare top and bottom of the tube: fine horizontal lines.
export function brushed() {
  const W = 64, H = 512;
  const [c, ctx] = canvas(W, H);
  const r = rng(5);
  for (let y = 0; y < H; y++) {
    const g = 150 + Math.floor(r() * 70);
    ctx.fillStyle = `rgb(${g},${g},${g})`;
    ctx.fillRect(0, y, W, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// Foam ring on the water surface while it fizzes.
export function foam() {
  const S = 256;
  const [c, ctx] = canvas(S, S);
  const r = rng(9);
  ctx.clearRect(0, 0, S, S);
  for (let i = 0; i < 900; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * 0.5;
    const ring = Math.pow(d / 0.5, 2.2);
    if (r() > ring * 0.9 + 0.08) continue;
    const x = S / 2 + Math.cos(a) * d * S, y = S / 2 + Math.sin(a) * d * S;
    const s = 0.6 + r() * 2.6;
    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
