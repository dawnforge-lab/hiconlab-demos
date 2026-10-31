// Canvas-made textures for the P39: dial printing, sunburst, movement finishing,
// caseback engraving and leather. Everything is drawn at load, nothing is fetched.
import * as THREE from 'three';

const DISPLAY = '"Bodoni Moda", "Bodoni 72", Didot, serif';
const SANS = '"Instrument Sans", "Helvetica Neue", Arial, sans-serif';

function canvas(w, h = w) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function tex(c, { srgb = true, repeat = false, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = aniso;
  t.needsUpdate = true;
  return t;
}

// Small seeded random so every load draws the same grain.
function rng(seed = 7) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// Draws text along a circle, centred on an angle (radians, 0 = 12 o'clock, clockwise).
function arcText(ctx, text, cx, cy, r, centre, { inward = false, spacing = 0 } = {}) {
  const widths = [...text].map((ch) => ctx.measureText(ch).width + spacing);
  const total = widths.reduce((a, b) => a + b, 0) - spacing;
  let a = centre + (inward ? total / 2 / r : -total / 2 / r);
  [...text].forEach((ch, i) => {
    const w = widths[i] - spacing;
    const mid = inward ? a - w / 2 / r : a + w / 2 / r;
    ctx.save();
    ctx.translate(cx + Math.sin(mid) * r, cy - Math.cos(mid) * r);
    ctx.rotate(inward ? mid + Math.PI : mid);
    ctx.fillText(ch, -w / 2, 0);
    ctx.restore();
    a += (inward ? -1 : 1) * widths[i] / r;
  });
}

// ---- Dial ------------------------------------------------------------------
// Dial is 32 mm across; the canvas maps 1 mm to 64 px.
export function dialPrint() {
  const S = 2048, mm = 64, c = canvas(S), ctx = c.getContext('2d');
  const cx = S / 2, cy = S / 2;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#fff';

  // Railway minute track
  ctx.lineWidth = 0.055 * mm;
  [14.35, 15.0].forEach((r) => { ctx.beginPath(); ctx.arc(cx, cy, r * mm, 0, Math.PI * 2); ctx.stroke(); });
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const five = i % 5 === 0;
    const r0 = (five ? 13.95 : 14.35) * mm, r1 = 15.0 * mm;
    ctx.lineWidth = (five ? 0.16 : 0.07) * mm;
    ctx.beginPath();
    ctx.moveTo(cx + Math.sin(a) * r0, cy - Math.cos(a) * r0);
    ctx.lineTo(cx + Math.sin(a) * r1, cy - Math.cos(a) * r1);
    ctx.stroke();
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  // Wordmark
  ctx.font = `600 ${1.62 * mm}px ${DISPLAY}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${0.34 * mm}px`;
  ctx.fillText('FENWRIGHT', cx + 0.17 * mm, cy - 5.6 * mm);
  ctx.font = `600 ${0.7 * mm}px ${SANS}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${0.3 * mm}px`;
  ctx.fillText('PRESCOT', cx + 0.15 * mm, cy - 4.3 * mm);
  // Lower text
  ctx.font = `600 ${0.7 * mm}px ${SANS}`;
  ctx.fillText('AUTOMATIC', cx + 0.16 * mm, cy + 5.2 * mm);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ctx.font = `italic 600 ${1.02 * mm}px ${DISPLAY}`;
  ctx.fillText('Calibre FW-1', cx, cy + 6.6 * mm);
  // "Made in England" split either side of six, inside the track
  ctx.font = `600 ${0.55 * mm}px ${SANS}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${0.12 * mm}px`;
  arcText(ctx, 'MADE IN', cx, cy, 13.3 * mm, Math.PI + 0.24, { inward: true });
  arcText(ctx, 'ENGLAND', cx, cy, 13.3 * mm, Math.PI - 0.24, { inward: true });
  return tex(c, { aniso: 16 });
}

// Fumé falloff for the dial base colour: a touch darker at the edge.
export function dialFume() {
  const S = 512, c = canvas(S), ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.55, '#f2f2f2');
  g.addColorStop(0.9, '#bdbdbd');
  g.addColorStop(1, '#9a9a9a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return tex(c);
}

// Anisotropy direction map: radial brushing for the sunburst.
export function sunburstDirection() {
  const S = 256, c = canvas(S), ctx = c.getContext('2d');
  const img = ctx.createImageData(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = x + 0.5 - S / 2, dy = -(y + 0.5 - S / 2);
      const l = Math.hypot(dx, dy) || 1;
      const i = (y * S + x) * 4;
      img.data[i] = (dx / l) * 127.5 + 127.5;
      img.data[i + 1] = (dy / l) * 127.5 + 127.5;
      img.data[i + 2] = 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = tex(c, { srgb: false });
  t.generateMipmaps = false;
  t.minFilter = THREE.LinearFilter;
  return t;
}

// ---- Movement --------------------------------------------------------------
// Frosted gilt three-quarter plate with engraving. World mm are mapped to UV by
// ExtrudeGeometry (x, y), so the texture covers -14..14 mm with repeat/offset.
export function plateTextures() {
  const S = 2048, mm = S / 28, c = canvas(S), ctx = c.getContext('2d');
  const b = canvas(S), bx = b.getContext('2d');
  const r = rng(11);
  // Frosting: fine noise
  const base = ctx.createImageData(S, S), bump = bx.createImageData(S, S);
  for (let i = 0; i < S * S; i++) {
    const n = r();
    const v = 218 + n * 32;
    base.data[i * 4] = v; base.data[i * 4 + 1] = v; base.data[i * 4 + 2] = v; base.data[i * 4 + 3] = 255;
    const bv = 120 + n * 40;
    bump.data[i * 4] = bump.data[i * 4 + 1] = bump.data[i * 4 + 2] = bv; bump.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(base, 0, 0);
  bx.putImageData(bump, 0, 0);

  const P = (x, y) => [S / 2 + x * mm, S / 2 - y * mm];
  const cut = (draw) => {
    // Engraving: dark fill on the colour map, deep cut on the bump map.
    ctx.save(); ctx.fillStyle = '#3a3026'; ctx.strokeStyle = '#3a3026'; draw(ctx); ctx.restore();
    bx.save(); bx.fillStyle = '#000'; bx.strokeStyle = '#000'; draw(bx); bx.restore();
  };
  cut((g) => {
    // Engraved border following the plate edge
    g.lineWidth = 0.09 * mm;
    g.beginPath(); g.arc(S / 2, S / 2, 12.55 * mm, 0, Math.PI * 2); g.stroke();
  });
  const map = tex(c), bumpMap = tex(b, { srgb: false });
  [map, bumpMap].forEach((t) => { t.repeat.set(1 / 28, 1 / 28); t.offset.set(0.5, 0.5); });
  return { map, bumpMap };
}

// Perlage (overlapping circular graining) for the pillar plate.
export function perlage() {
  const S = 1024, c = canvas(S), ctx = c.getContext('2d');
  ctx.fillStyle = '#b8b8b4';
  ctx.fillRect(0, 0, S, S);
  const step = 46, rad = 34;
  for (let y = -rad; y < S + rad; y += step * 0.8) {
    for (let x = -rad; x < S + rad; x += step) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, '#e8e8e4');
      g.addColorStop(0.55, '#9c9c98');
      g.addColorStop(0.85, '#d4d4d0');
      g.addColorStop(1, 'rgba(200,200,196,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
    }
  }
  const t = tex(c, { repeat: true });
  t.repeat.set(1 / 10, 1 / 10);
  return t;
}

// Prescot stripes (Côtes-style bands) for the rotor, with the name engraved
// along the arc. Covers -13.5..13.5 mm in rotor space.
export function rotorTexture() {
  const S = 2048, mm = S / 27, c = canvas(S), ctx = c.getContext('2d');
  ctx.save();
  ctx.translate(S / 2, S / 2);
  ctx.rotate(-Math.PI / 5);
  const band = 0.95 * mm;
  for (let y = -S; y < S; y += band) {
    const g = ctx.createLinearGradient(0, y, 0, y + band);
    g.addColorStop(0, '#c6c9cb');
    g.addColorStop(0.45, '#eceeee');
    g.addColorStop(0.7, '#d8dbdc');
    g.addColorStop(1, '#c2c5c7');
    ctx.fillStyle = g;
    ctx.fillRect(-S, y, S * 2, band);
  }
  ctx.restore();
  ctx.fillStyle = '#9a7a3e';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${0.95 * mm}px ${DISPLAY}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${0.3 * mm}px`;
  arcText(ctx, 'FENWRIGHT · PRESCOT', S / 2, S / 2, 9.65 * mm, Math.PI, { inward: true });
  const t = tex(c);
  t.repeat.set(1 / 27, 1 / 27);
  t.offset.set(0.5, 0.5);
  return t;
}

// Snailing (circular graining) for the ratchet and crown wheels.
export function snailing() {
  const S = 512, c = canvas(S), ctx = c.getContext('2d');
  ctx.fillStyle = '#d8d8d6';
  ctx.fillRect(0, 0, S, S);
  ctx.translate(S / 2, S / 2);
  for (let i = 0; i < 360; i++) {
    ctx.rotate((Math.PI * 2) / 360);
    ctx.strokeStyle = i % 2 ? 'rgba(255,255,255,.7)' : 'rgba(40,44,46,.45)';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(S * 0.18, S * 0.18, S * 0.02, S * 0.5); ctx.stroke();
  }
  return tex(c);
}

// ---- Caseback engraving ring (r 11.6–16 mm), drawn for a RingGeometry -------
export function casebackRing() {
  const S = 2048, mm = S / 32, c = canvas(S), ctx = c.getContext('2d');
  const cx = S / 2, cy = S / 2;
  ctx.fillStyle = '#8c8f91';
  ctx.fillRect(0, 0, S, S);
  // Fine circular brushing
  const r = rng(3);
  for (let i = 0; i < 900; i++) {
    const rr = (12.9 + r() * 3.3) * mm;
    ctx.strokeStyle = r() > 0.5 ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)';
    ctx.lineWidth = 1 + r() * 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.fillStyle = '#2b2d2e';
  ctx.textBaseline = 'middle';
  ctx.font = `500 ${0.7 * mm}px ${SANS}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${0.2 * mm}px`;
  arcText(ctx, 'FENWRIGHT · PRESCOT · ENGLAND', cx, cy, 14.5 * mm, 0);
  arcText(ctx, 'STEEL · SAPPHIRE · 100 M', cx, cy, 14.5 * mm, Math.PI, { inward: true });
  ctx.font = `italic 500 ${0.9 * mm}px ${DISPLAY}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  arcText(ctx, 'No. 017 of 150', cx, cy, 14.5 * mm, Math.PI / 2 + 0.05);
  arcText(ctx, 'P39', cx, cy, 14.5 * mm, -Math.PI / 2);
  ctx.strokeStyle = 'rgba(30,30,30,.6)';
  ctx.lineWidth = 0.05 * mm;
  [13.4, 15.6].forEach((rr) => { ctx.beginPath(); ctx.arc(cx, cy, rr * mm, 0, Math.PI * 2); ctx.stroke(); });
  return tex(c);
}

// ---- Leather -----------------------------------------------------------------
// u runs across the strap (0..1), v along it. Grain is shared; colour per strap.
let grainCanvas = null;
function grain(W, H) {
  if (grainCanvas) return grainCanvas;
  const c = canvas(W, H), ctx = c.getContext('2d');
  const r = rng(29);
  const img = ctx.createImageData(W, H);
  for (let i = 0; i < W * H; i++) {
    const v = 128 + (r() - 0.5) * 50;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  // Pores and creases
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.12 + r() * 0.2})`;
    ctx.beginPath();
    ctx.ellipse(r() * W, r() * H, 1 + r() * 2.2, 0.8 + r() * 1.6, r() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.filter = 'blur(0.6px)';
  ctx.drawImage(c, 0, 0);
  ctx.filter = 'none';
  grainCanvas = c;
  return c;
}

// length in mm; holes: positions (mm from start) of buckle holes
function stitchesAndHoles(ctx, W, H, length, holes, colour, tip) {
  const pxPerMm = H / length;
  // Edge stitching, both sides, stopping short of the ends
  ctx.strokeStyle = colour;
  ctx.lineCap = 'round';
  ctx.lineWidth = W * 0.016;
  const dash = 2.2 * pxPerMm, gap = 0.9 * pxPerMm;
  [0.085, 0.915].forEach((u) => {
    for (let y = 2.5 * pxPerMm; y < H - (tip ? 6 : 3.5) * pxPerMm; y += dash + gap) {
      ctx.beginPath();
      ctx.moveTo(u * W, H - y);
      ctx.lineTo(u * W, H - (y + dash));
      ctx.stroke();
    }
  });
  // Holes
  holes.forEach((mmPos) => {
    const y = H - mmPos * pxPerMm;
    ctx.fillStyle = 'rgba(8,6,5,.95)';
    ctx.beginPath(); ctx.ellipse(W / 2, y, W * 0.055, W * 0.055 * 0.95, 0, 0, Math.PI * 2); ctx.fill();
  });
}

export function leather({ colour, stitch, length, holes = [], tip = false }) {
  const W = 512, H = 2048, c = canvas(W, H), ctx = c.getContext('2d');
  ctx.fillStyle = colour;
  ctx.fillRect(0, 0, W, H);
  // Grain, multiplied in softly
  ctx.globalAlpha = 0.5;
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(grain(W, H), 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  // Painted edges
  const edge = ctx.createLinearGradient(0, 0, W, 0);
  edge.addColorStop(0, 'rgba(10,8,7,.85)');
  edge.addColorStop(0.035, 'rgba(10,8,7,0)');
  edge.addColorStop(0.965, 'rgba(10,8,7,0)');
  edge.addColorStop(1, 'rgba(10,8,7,.85)');
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, W, H);
  stitchesAndHoles(ctx, W, H, length, holes, stitch, tip);
  return tex(c);
}

export function leatherBump({ length, holes = [], tip = false }) {
  const W = 512, H = 2048, c = canvas(W, H), ctx = c.getContext('2d');
  ctx.drawImage(grain(W, H), 0, 0);
  // Stitch thread raised, with a groove either side
  stitchesAndHoles(ctx, W, H, length, [], '#ffffff', tip);
  ctx.globalAlpha = 1;
  holes.forEach((mmPos) => {
    const y = H - mmPos * (H / length);
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(W / 2, y, W * 0.06, W * 0.058, 0, 0, Math.PI * 2); ctx.fill();
  });
  return tex(c, { srgb: false });
}

// Small "F" monogram for the crown end.
export function crownMonogram() {
  const S = 256, c = canvas(S), ctx = c.getContext('2d');
  ctx.fillStyle = '#9a9c9e';
  ctx.fillRect(0, 0, S, S);
  ctx.fillStyle = '#f1f2f2';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${S * 0.56}px ${DISPLAY}`;
  ctx.fillText('F', S / 2, S / 2 + S * 0.03);
  ctx.strokeStyle = '#f1f2f2';
  ctx.lineWidth = S * 0.025;
  ctx.beginPath(); ctx.arc(S / 2, S / 2, S * 0.42, 0, Math.PI * 2); ctx.stroke();
  return tex(c);
}
