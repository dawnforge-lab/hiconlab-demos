// The Fenwright P39, built from code. Units are millimetres.
// Watch space: dial faces +Z, 12 o'clock is +Y, the crown is at +X (3 o'clock).
import * as THREE from 'three';
import { mergeGeometries as mergeRaw } from 'three/addons/utils/BufferGeometryUtils.js';
import * as T from './textures.js';
import { DIALS, STRAPS } from './data.js';

const TAU = Math.PI * 2;

// Merge geometries even when some are indexed and some are not, keeping the
// attributes they all share.
function mergeGeometries(geos) {
  const flat = geos.some((g) => !g.index);
  const shared = Object.keys(geos[0].attributes).filter((n) => geos.every((g) => g.attributes[n]));
  return mergeRaw(geos.map((g) => {
    const x = flat && g.index ? g.toNonIndexed() : g;
    Object.keys(x.attributes).forEach((n) => { if (!shared.includes(n)) x.deleteAttribute(n); });
    return x;
  }));
}
const V2 = (x, y) => new THREE.Vector2(x, y);

// ---- Geometry helpers --------------------------------------------------------

// Lathe a profile of [radius, height] pairs and stand it on the Z axis.
function lathe(points, segments = 160) {
  const g = new THREE.LatheGeometry(points.map(([r, h]) => V2(r, h)), segments);
  g.rotateX(Math.PI / 2);
  return g;
}

// Several smooth runs merged, so the edges between runs stay crisp.
function latheRuns(runs, segments) {
  return mergeGeometries(runs.map((r) => lathe(r, segments)));
}

// Sample a quadratic curve between two [r, h] points.
function curve(a, ctrl, b, n = 8) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([u * u * a[0] + 2 * u * t * ctrl[0] + t * t * b[0], u * u * a[1] + 2 * u * t * ctrl[1] + t * t * b[1]]);
  }
  return out;
}

function extrude(shape, depth, bevel = 0, segs = 2) {
  return new THREE.ExtrudeGeometry(shape, {
    depth, curveSegments: 48, steps: 1,
    bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: segs,
  });
}

function circleShape(r, x = 0, y = 0) {
  const s = new THREE.Shape();
  s.absarc(x, y, r, 0, TAU, false);
  return s;
}

function gearShape({ teeth, outer, root, hub = 0.5, spokes = 0, rim = 0.5, tooth = 0.5 }) {
  const s = new THREE.Shape();
  const step = TAU / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const w = step * tooth * 0.5;
    const pts = [
      [root, a - step * 0.5 + 0.0001], [root, a - w * 1.15], [outer, a - w * 0.55], [outer, a + w * 0.55], [root, a + w * 1.15],
    ];
    pts.forEach(([r, ang], j) => {
      const x = Math.cos(ang) * r, y = Math.sin(ang) * r;
      if (i === 0 && j === 0) s.moveTo(x, y); else s.lineTo(x, y);
    });
  }
  s.closePath();
  if (spokes) {
    const rIn = hub + 0.25, rOut = root - rim;
    const half = (TAU / spokes) * 0.16;
    for (let k = 0; k < spokes; k++) {
      const a0 = (k / spokes) * TAU + half, a1 = ((k + 1) / spokes) * TAU - half;
      const h = new THREE.Path();
      h.absarc(0, 0, rOut, a0, a1, false);
      h.absarc(0, 0, rIn, a1, a0, true);
      h.closePath();
      s.holes.push(h);
    }
  }
  const centre = new THREE.Path();
  centre.absarc(0, 0, hub * 0.45, 0, TAU, true);
  s.holes.push(centre);
  return s;
}

// Convex hull of two circles, as a Shape (used for the balance cock).
function stadium(c1, r1, c2, r2, n = 40) {
  const d = c1.distanceTo(c2);
  const u = c2.clone().sub(c1).normalize();
  const base = Math.atan2(u.y, u.x);
  const th = Math.acos((r1 - r2) / d);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = base + th + (i / n) * (TAU - 2 * th);
    pts.push(V2(c1.x + Math.cos(a) * r1, c1.y + Math.sin(a) * r1));
  }
  for (let i = 0; i <= n; i++) {
    const a = base - th + (i / n) * (2 * th);
    pts.push(V2(c2.x + Math.cos(a) * r2, c2.y + Math.sin(a) * r2));
  }
  return new THREE.Shape(pts);
}

// A faceted dauphine hand: four flat facets meeting at a central ridge.
function dauphine(L, w, tail, h) {
  const yb = L * 0.13;
  const P = {
    A: [0, -tail, h * 0.45], Bl: [-w / 2, yb, 0], C: [0, L, 0], Br: [w / 2, yb, 0], M: [0, yb, h],
  };
  const under = -0.1;
  const pos = [];
  const face = (a, b, c, up) => {
    const ab = new THREE.Vector3(...b).sub(new THREE.Vector3(...a));
    const ac = new THREE.Vector3(...c).sub(new THREE.Vector3(...a));
    const n = ab.cross(ac);
    if ((up && n.z < 0) || (!up && n.z > 0)) [b, c] = [c, b];
    pos.push(...a, ...b, ...c);
  };
  face(P.A, P.Bl, P.M, true);
  face(P.Bl, P.C, P.M, true);
  face(P.M, P.C, P.Br, true);
  face(P.A, P.M, P.Br, true);
  // Thin side walls
  const ring = [P.A, P.Bl, P.C, P.Br];
  for (let i = 0; i < 4; i++) {
    const a = ring[i], b = ring[(i + 1) % 4];
    const a2 = [a[0], a[1], under], b2 = [b[0], b[1], under];
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const out = [mid[0], mid[1] - yb * 0.3];
    // Make the wall face away from the hand's centre line
    const ab = [b[0] - a[0], b[1] - a[1]];
    const nx = ab[1], ny = -ab[0];
    if (nx * out[0] + ny * out[1] >= 0) { pos.push(...a, ...a2, ...b, ...b, ...a2, ...b2); } else { pos.push(...a, ...b, ...a2, ...b, ...b2, ...a2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

// Leather strap swept along a path in the YZ plane.
// path: array of [y, z] points (dense). Returns geometry with u across, v along.
function strapGeometry(path, { widthAt, thickAt, flip = false, ringN = 28, offset = 0, crown = 0.2 }) {
  // Resample by arc length
  const pts = path.map(([y, z]) => new THREE.Vector3(0, y, z));
  const lens = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const L = lens[lens.length - 1];
  const N = 140;
  const samples = [];
  let j = 0;
  for (let i = 0; i <= N; i++) {
    const s = (i / N) * L;
    while (j < lens.length - 2 && lens[j + 1] < s) j++;
    const t = (s - lens[j]) / (lens[j + 1] - lens[j] || 1);
    samples.push({ s, p: pts[j].clone().lerp(pts[j + 1], t) });
  }
  const X = new THREE.Vector3(1, 0, 0);
  const pos = [], uv = [], idx = [];
  samples.forEach((smp, i) => {
    const a = samples[Math.max(0, i - 1)].p, b = samples[Math.min(N, i + 1)].p;
    const Tn = b.clone().sub(a).normalize();
    const Nn = new THREE.Vector3().crossVectors(X, Tn).normalize();
    if (flip) Nn.negate();
    const f = smp.s / L;
    const w = widthAt(f, smp.s, L);
    // Rolled start where the leather folds round the spring bar
    const roll = smp.s < 1.8 ? 0.45 + 0.55 * Math.sqrt(smp.s / 1.8) : 1;
    const th = thickAt(f, smp.s, L) * roll;
    const crownH = th * crown;
    const r = Math.min(th * 0.48, w * 0.5 - 0.001);
    // Rounded rectangle cross-section, counter-clockwise seen along +T
    const sec = [];
    const corners = [
      [w / 2 - r, th / 2 - r, 0], [-w / 2 + r, th / 2 - r, Math.PI / 2],
      [-w / 2 + r, -th / 2 + r, Math.PI], [w / 2 - r, -th / 2 + r, Math.PI * 1.5],
    ];
    const per = ringN / 4;
    corners.forEach(([cx, cy, a0]) => {
      for (let k = 0; k < per; k++) {
        const a = a0 + (k / (per - 1)) * (Math.PI / 2);
        sec.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
    });
    sec.forEach(([cx, cy]) => {
      // Padded ("bombé") top: the middle stands proud of the edges
      const lift = cy > 0 ? crownH * Math.max(0, 1 - Math.pow((2 * cx) / w, 2)) : 0;
      const p = smp.p.clone().addScaledVector(X, cx).addScaledVector(Nn, cy + lift + offset);
      pos.push(p.x, p.y, p.z);
      uv.push(0.5 + cx / Math.max(w, 0.001) * 0.98, 1 - f);
    });
  });
  const R = ringN;
  for (let i = 0; i < N; i++) {
    for (let k = 0; k < R; k++) {
      const a = i * R + k, b = i * R + ((k + 1) % R), c = (i + 1) * R + k, d = (i + 1) * R + ((k + 1) % R);
      if (flip) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d);
    }
  }
  // End caps
  [0, N].forEach((ring, e) => {
    const centre = new THREE.Vector3();
    for (let k = 0; k < R; k++) centre.add(new THREE.Vector3(pos[(ring * R + k) * 3], pos[(ring * R + k) * 3 + 1], pos[(ring * R + k) * 3 + 2]));
    centre.divideScalar(R);
    const ci = pos.length / 3;
    pos.push(centre.x, centre.y, centre.z);
    uv.push(0.5, e ? 0 : 1);
    for (let k = 0; k < R; k++) {
      const a = ring * R + k, b = ring * R + ((k + 1) % R);
      const startCap = e === 0;
      if (startCap !== flip) idx.push(ci, a, b); else idx.push(ci, b, a);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return { geometry: g, length: L, end: samples[N].p, endT: samples[N].p.clone().sub(samples[N - 1].p).normalize(), samples };
}

// Path for a strap piece: leaves the lugs in a straight line, meets the wrist
// (an ellipse in the YZ plane) at a tangent, then follows it round to phiEnd.
// sign +1 is the 12 o'clock piece, -1 the 6 o'clock piece (mirrored in Y).
const WRIST = { a: 29.2, b: 24.2, zc: -27.6 };
function strapPath(sign, phiEnd, grow = 0) {
  const a = WRIST.a + grow, b = WRIST.b + grow, zc = WRIST.zc;
  const P0 = [17.6, -1.45];
  const E = (phi) => [a * Math.cos(phi), zc + b * Math.sin(phi)];
  const D = (phi) => [a * Math.sin(phi), -b * Math.cos(phi)]; // direction of travel (phi decreasing)
  let phiT = Math.PI / 2, best = Infinity;
  for (let phi = Math.PI / 2; phi > -Math.PI / 2; phi -= 0.0005) {
    const e = E(phi), d = D(phi);
    const v = [e[0] - P0[0], e[1] - P0[1]];
    if (v[0] * d[0] + v[1] * d[1] <= 0) continue; // must be ahead of us
    const cross = Math.abs(v[0] * d[1] - v[1] * d[0]) / (Math.hypot(...v) * Math.hypot(...d));
    if (cross < best) { best = cross; phiT = phi; }
  }
  const out = [];
  const eT = E(phiT);
  const n = Math.ceil(Math.hypot(eT[0] - P0[0], eT[1] - P0[1]) / 0.3);
  for (let i = 0; i < n; i++) out.push([P0[0] + (eT[0] - P0[0]) * (i / n), P0[1] + (eT[1] - P0[1]) * (i / n)]);
  for (let phi = phiT; phi >= phiEnd; phi -= 0.006) out.push(E(phi));
  return out.map(([y, z]) => [y * sign, z]);
}

// A lug lofted along its length with a faceted section: flat top, a wide polished
// chamfer on the outside, a small one inside. It is widest where it grows out of
// the case and falls away towards the tip. Built for the +x, +y lug.
function lugGeometry() {
  const n = 48, t0 = 14.0, t1 = 23.4;
  const sections = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    const t = t0 + (t1 - t0) * s;
    let top = 3.3 - 3.2 * Math.pow(s, 1.55);
    let bot = -3.2 + 0.85 * Math.pow(s, 2.2);
    const w = 2.45 + 1.7 * Math.pow(1 - s, 2.2);
    // Round the nose over the last millimetre
    if (s > 0.9) { const k = (s - 0.9) / 0.1; const mid = (top + bot) / 2; top = mid + (top - mid) * Math.sqrt(1 - 0.55 * k * k); bot = mid + (bot - mid) * Math.sqrt(1 - 0.3 * k * k); }
    const c = Math.min(0.85, (top - bot) * 0.32);
    sections.push({ t, pts: [[0, bot], [w, bot], [w, top - c], [w - c * 1.25, top], [0.28, top], [0, top - 0.28]] });
  }
  const strips = [];
  const corners = sections[0].pts.length;
  for (let j = 0; j < corners; j++) {
    const k = (j + 1) % corners;
    const pos = [], idx = [];
    sections.forEach(({ t, pts }) => {
      pos.push(10 + pts[j][0], t, pts[j][1], 10 + pts[k][0], t, pts[k][1]);
    });
    for (let i = 0; i < n; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    strips.push(g);
  }
  // Tip cap
  const last = sections[n];
  const cap = new THREE.BufferGeometry();
  const cpos = [];
  for (let j = 1; j < corners - 1; j++) [0, j, j + 1].forEach((q) => cpos.push(10 + last.pts[q][0], last.t, last.pts[q][1]));
  cap.setAttribute('position', new THREE.Float32BufferAttribute(cpos, 3));
  cap.computeVertexNormals();
  return mergeGeometries([...strips.map((g) => g.toNonIndexed()), cap]);
}

// ---- Materials -----------------------------------------------------------------

function makeMaterials() {
  const steel = '#c9ccd0';
  return {
    polished: new THREE.MeshPhysicalMaterial({ color: steel, metalness: 1, roughness: 0.07 }),
    brushed: new THREE.MeshPhysicalMaterial({ color: '#c2c5c9', metalness: 1, roughness: 0.3, anisotropy: 0.75 }),
    satin: new THREE.MeshPhysicalMaterial({ color: steel, metalness: 1, roughness: 0.2 }),
    dark: new THREE.MeshStandardMaterial({ color: '#2a2c2e', metalness: 0.7, roughness: 0.55 }),
    // Sapphire: a black, glossy surface added on top of what is behind it, so only
    // its reflections show (stronger at the edges, as with real glass). The alpha
    // channel is left alone so the page background shows through the canvas.
    sapphire: new THREE.MeshPhysicalMaterial({
      color: '#161b1d', metalness: 0, roughness: 0.03, ior: 1.77, specularIntensity: 1, envMapIntensity: 0.85,
      iridescence: 0.12, iridescenceIOR: 1.38, iridescenceThicknessMinimum: 220, iridescenceThicknessMaximum: 380,
      transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    }),
    glassEdge: new THREE.MeshPhysicalMaterial({ color: '#c8d0d4', metalness: 0, roughness: 0.12, transparent: true, opacity: 0.28, depthWrite: false }),
    inner: new THREE.MeshStandardMaterial({ color: '#3a3d40', metalness: 0.85, roughness: 0.42 }),
    gilt: new THREE.MeshPhysicalMaterial({ color: '#e0bf7c', metalness: 1, roughness: 0.42 }),
    giltPolished: new THREE.MeshPhysicalMaterial({ color: '#e7c98c', metalness: 1, roughness: 0.14 }),
    brass: new THREE.MeshPhysicalMaterial({ color: '#d1a865', metalness: 1, roughness: 0.22 }),
    blued: new THREE.MeshPhysicalMaterial({ color: '#1d3a94', metalness: 1, roughness: 0.16, clearcoat: 0.7, clearcoatRoughness: 0.08 }),
    ruby: new THREE.MeshPhysicalMaterial({ color: '#b0102c', metalness: 0, roughness: 0.04, clearcoat: 1, sheen: 0, emissive: '#3a0008', ior: 1.76, specularIntensity: 1 }),
    rhodium: new THREE.MeshPhysicalMaterial({ color: '#d6d8da', metalness: 1, roughness: 0.18 }),
    hairspring: new THREE.MeshStandardMaterial({ color: '#c9d2e0', metalness: 1, roughness: 0.25 }),
  };
}

// Leather material that can cross-fade between two colour maps.
function leatherMaterial(map, bumpMap) {
  const m = new THREE.MeshPhysicalMaterial({ map, bumpMap, bumpScale: 0.7, roughness: 0.6, metalness: 0, clearcoat: 0.1, clearcoatRoughness: 0.45, sheen: 0.12, sheenRoughness: 0.8, sheenColor: new THREE.Color('#4a3428') });
  m.userData.mix = { value: 0 };
  m.userData.mapB = { value: map };
  m.onBeforeCompile = (shader) => {
    shader.uniforms.mixT = m.userData.mix;
    shader.uniforms.mapB = m.userData.mapB;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float mixT;\nuniform sampler2D mapB;')
      .replace('#include <map_fragment>', `#ifdef USE_MAP
        vec4 sampledDiffuseColor = mix( texture2D( map, vMapUv ), texture2D( mapB, vMapUv ), mixT );
        diffuseColor *= sampledDiffuseColor;
      #endif`);
  };
  m.customProgramCacheKey = () => 'leather-mix';
  return m;
}

// ---- Build ---------------------------------------------------------------------

export function buildWatch() {
  const M = makeMaterials();
  const root = new THREE.Group();
  root.name = 'P39';
  const parts = {};
  const group = (name) => { const g = new THREE.Group(); g.name = name; root.add(g); parts[name] = g; return g; };
  const add = (g, geo, mat) => { const m = new THREE.Mesh(geo, mat); g.add(m); return m; };

  // Case middle -------------------------------------------------------------------
  const caseG = group('case');
  add(caseG, latheRuns([
    [[16.2, -3.4], [18.0, -3.4]],
    [[16.2, 3.6], [16.2, -3.4]],
  ], 128), M.inner);
  add(caseG, latheRuns([
    [[18.0, -3.4], ...curve([18.0, -3.4], [19.5, -3.3], [19.6, -1.9], 8).slice(1)],
    [[19.6, 2.1], ...curve([19.6, 2.1], [19.55, 3.55], [18.5, 3.6], 8).slice(1)],
  ], 192), M.polished);
  add(caseG, latheRuns([
    [[19.6, -1.9], [19.6, 2.1]],
    [[18.5, 3.6], [16.2, 3.6]],
  ], 192), M.brushed);
  // Movement holder ring, seen through the back
  add(caseG, latheRuns([[[13.7, -3.3], [16.2, -3.3]], [[13.7, -0.4], [13.7, -3.3]]], 96), M.dark);

  // Lugs: lofted and faceted, flowing out of the case flank
  const lugGeo = lugGeometry();
  // Mirror for the 9 o'clock side, then restore the winding so faces still point out
  const lugMirror = lugGeo.clone().scale(-1, 1, 1);
  ['position', 'normal'].forEach((name) => {
    const at = lugMirror.attributes[name];
    for (let i = 0; i < at.count; i += 3) {
      for (let c = 0; c < 3; c++) { const t = at.getComponent(i + 1, c); at.setComponent(i + 1, c, at.getComponent(i + 2, c)); at.setComponent(i + 2, c, t); }
    }
  });
  const lugMat = M.satin.clone();
  lugMat.side = THREE.DoubleSide;
  const lugs = [lugGeo, lugMirror, lugGeo.clone().rotateZ(Math.PI), lugMirror.clone().rotateZ(Math.PI)];
  add(caseG, mergeGeometries(lugs), lugMat);
  // Spring bars between the lugs (hidden in the strap until the straps come off)
  const springBars = add(caseG, mergeGeometries([1, -1].map((sy) => new THREE.CylinderGeometry(0.72, 0.72, 20.4, 20).rotateZ(Math.PI / 2).translate(0, 21.7 * sy, -1.35))), M.polished);
  springBars.visible = false;
  parts.springBars = springBars;

  // Bezel ---------------------------------------------------------------------------
  const bezelG = group('bezel');
  add(bezelG, latheRuns([
    [[15.9, 3.6], [18.55, 3.6]],
    [[18.55, 3.6], [18.55, 3.95], ...curve([18.55, 3.95], [18.35, 4.85], [16.7, 5.2], 10).slice(1), [16.05, 5.15]],
    [[16.05, 5.15], [15.85, 4.7], [15.85, 3.6]],
  ], 192), M.polished);

  // Crystal: domed sapphire --------------------------------------------------------
  const crystalG = group('crystal');
  const dome = (r0, h0, apex, n = 24) => {
    const pts = [];
    for (let i = 0; i <= n; i++) { const t = i / n; pts.push([r0 * t, apex - (apex - h0) * t * t]); }
    return pts;
  };
  const inner = dome(15.9, 4.45, 5.15);
  const outer = dome(15.95, 5.0, 6.0).reverse();
  add(crystalG, latheRuns([inner, outer], 128), M.sapphire);
  add(crystalG, latheRuns([[[15.9, 4.45], [15.95, 5.0]]], 128), M.glassEdge);

  // Dial ---------------------------------------------------------------------------------
  const dialG = group('dial');
  const dialMat = new THREE.MeshPhysicalMaterial({
    color: DIALS.mersey.base, map: T.dialFume(), metalness: 0.62, roughness: 0.3,
    anisotropy: 0.85, anisotropyMap: T.sunburstDirection(), clearcoat: 0.6, clearcoatRoughness: 0.12,
  });
  const dialDisc = add(dialG, new THREE.CircleGeometry(16.0, 128), dialMat);
  dialDisc.position.z = 1.6;
  const flangeMat = new THREE.MeshPhysicalMaterial({ color: DIALS.mersey.flange, metalness: 0.5, roughness: 0.4 });
  add(dialG, latheRuns([[[15.2, 1.62], [16.0, 3.55]]], 128), flangeMat);
  const printMat = new THREE.MeshStandardMaterial({
    color: DIALS.mersey.print, map: T.dialPrint(), alphaToCoverage: true, alphaTest: 0.02, roughness: 0.5, metalness: 0,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
  const print = add(dialG, new THREE.CircleGeometry(16.0, 128), printMat);
  print.position.z = 1.61;
  // Applied indices
  const metalMat = new THREE.MeshPhysicalMaterial({ color: DIALS.mersey.metal, metalness: 1, roughness: 0.14 });
  const idx = [];
  const indexShape = (w, l) => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, -l / 2); s.lineTo(w / 2, -l / 2); s.lineTo(w / 2, l / 2); s.lineTo(-w / 2, l / 2); s.closePath();
    return s;
  };
  for (let h = 0; h < 12; h++) {
    const a = (h / 12) * TAU;
    const big = h % 3 === 0;
    const l = big ? 3.5 : 2.9, w = big ? 1.0 : 0.85;
    const offsets = h === 0 ? [-0.72, 0.72] : [0];
    offsets.forEach((ox) => {
      const g = extrude(indexShape(w * (h === 0 ? 0.8 : 1), l), 0.12, 0.2, 1);
      g.translate(ox, 0, 0);
      g.translate(0, 13.55 - l / 2, 1.82);
      g.rotateZ(-a);
      idx.push(g);
    });
  }
  add(dialG, mergeGeometries(idx), metalMat);

  // Hands ------------------------------------------------------------------------------
  const handsG = group('hands');
  const hour = new THREE.Group(), minute = new THREE.Group(), seconds = new THREE.Group();
  handsG.add(hour, minute, seconds);
  const hourGeo = mergeGeometries([dauphine(9.4, 1.75, 1.7, 0.42), new THREE.CylinderGeometry(0.82, 0.82, 0.12, 40).rotateX(Math.PI / 2)]);
  const hourMesh = add(hour, hourGeo, metalMat); hourMesh.position.z = 2.35;
  const minGeo = mergeGeometries([dauphine(14.1, 1.35, 1.9, 0.38), new THREE.CylinderGeometry(0.62, 0.62, 0.12, 40).rotateX(Math.PI / 2)]);
  const minMesh = add(minute, minGeo, metalMat); minMesh.position.z = 2.85;
  const secGeo = mergeGeometries([
    new THREE.BoxGeometry(0.17, 18.4, 0.07).translate(0, 14.8 - 9.2, 0),
    new THREE.CylinderGeometry(0.75, 0.75, 0.08, 32).rotateX(Math.PI / 2).translate(0, -2.6, 0),
    new THREE.CylinderGeometry(0.42, 0.42, 0.42, 32).rotateX(Math.PI / 2).translate(0, 0, -0.17),
  ]);
  const secMesh = add(seconds, secGeo, M.brass); secMesh.position.z = 3.3;
  const capMesh = add(seconds, new THREE.SphereGeometry(0.34, 24, 12, 0, TAU, 0, Math.PI / 2).rotateX(Math.PI / 2), M.brass);
  capMesh.position.z = 3.36;

  // Crown -------------------------------------------------------------------------------
  const crownG = group('crown');
  const crownLathe = (pts, segs) => {
    const g = new THREE.LatheGeometry(pts.map(([r, h]) => V2(r, h)), segs);
    g.rotateZ(-Math.PI / 2);
    return g;
  };
  const flank = crownLathe([[3.1, 21.2], [3.1, 21.9], [3.1, 22.6], [3.1, 23.3]], 192);
  // Fluting: push the flank in along 24 grooves
  const p = flank.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), z = p.getZ(i);
    const a = Math.atan2(z, y);
    const k = 1 - 0.07 * Math.pow(Math.abs(Math.sin(a * 12)), 0.7);
    p.setY(i, y * k); p.setZ(i, z * k);
  }
  flank.computeVertexNormals();
  add(crownG, flank, M.polished);
  add(crownG, mergeGeometries([
    crownLathe([[1.5, 19.0], [1.5, 20.8]], 64),
    crownLathe([[1.5, 20.8], [2.6, 20.8], [3.1, 21.2]], 96),
    crownLathe([[3.1, 23.3], [2.9, 23.75], [2.3, 23.95]], 96),
  ]), M.polished);
  const mono = new THREE.Mesh(new THREE.CircleGeometry(2.3, 48), new THREE.MeshPhysicalMaterial({ map: T.crownMonogram(), metalness: 1, roughness: 0.25 }));
  mono.rotation.y = Math.PI / 2;
  mono.position.x = 23.96;
  crownG.add(mono);

  // Movement (Calibre FW-1) ---------------------------------------------------------
  // Built in its own frame: +z points out of the caseback. Flipped into place.
  const movement = group('movement');
  const mv = new THREE.Group();
  mv.rotation.y = Math.PI;
  mv.position.z = 1.0;
  movement.add(mv);
  const MR = 13.6;
  // Pillar plate with perlage
  const pillar = new THREE.Mesh(extrude(circleShape(MR), 1.0, 0.12, 1), new THREE.MeshPhysicalMaterial({ color: '#d6b26c', map: T.perlage(), metalness: 1, roughness: 0.34 }));
  mv.add(pillar);
  // Three-quarter plate with the balance cut-out
  const B = V2(6.4, 5.7), br = 5.5, PR = 13.2;
  const d = B.length(), a = (PR * PR - br * br + d * d) / (2 * d), hh = Math.sqrt(PR * PR - a * a);
  const angB = Math.atan2(B.y, B.x), delta = Math.atan2(hh, a);
  const plateShape = new THREE.Shape();
  const outerPts = [];
  for (let i = 0; i <= 120; i++) {
    const ang = angB + delta + (i / 120) * (TAU - 2 * delta);
    outerPts.push(V2(Math.cos(ang) * PR, Math.sin(ang) * PR));
  }
  const pEnd = outerPts[outerPts.length - 1], pStart = outerPts[0];
  const b2 = Math.atan2(pEnd.y - B.y, pEnd.x - B.x), b1 = Math.atan2(pStart.y - B.y, pStart.x - B.x);
  let span = b1 - b2;
  // go the way that passes nearest the centre
  const towards = angB + Math.PI;
  const norm = (x) => Math.atan2(Math.sin(x), Math.cos(x));
  const midA = b2 + span / 2;
  if (Math.cos(norm(midA - towards)) < 0) span = span > 0 ? span - TAU : span + TAU;
  const innerPts = [];
  for (let i = 1; i < 60; i++) {
    const ang = b2 + (i / 60) * span;
    innerPts.push(V2(B.x + Math.cos(ang) * br, B.y + Math.sin(ang) * br));
  }
  plateShape.setFromPoints([...outerPts, ...innerPts]);
  // Recesses for the keyless wheels, so they sit below the plate surface
  [[-4.6, 4.9, 4.55], [-10.4, 0.2, 2.55]].forEach(([x, y, r]) => {
    const h = new THREE.Path();
    h.absarc(x, y, r, 0, TAU, true);
    plateShape.holes.push(h);
  });
  const plateTex = T.plateTextures();
  const plateMat = new THREE.MeshPhysicalMaterial({ color: '#e8c47e', map: plateTex.map, bumpMap: plateTex.bumpMap, bumpScale: 0.9, metalness: 1, roughness: 0.3 });
  const plateGeo = extrude(plateShape, 1.0, 0.18, 2);
  const plate = new THREE.Mesh(plateGeo, [plateMat, M.giltPolished]);
  plate.position.z = 1.9;
  mv.add(plate);

  // Escape wheel and a peek of the fourth wheel in the cut-out
  const towardCentre = B.clone().normalize().multiplyScalar(-1);
  const esc = new THREE.Mesh(extrude(gearShape({ teeth: 15, outer: 1.9, root: 1.5, hub: 0.4, spokes: 4, rim: 0.3, tooth: 0.35 }), 0.12, 0.03, 1), M.rhodium);
  const escPos = B.clone().addScaledVector(towardCentre, 4.6);
  esc.position.set(escPos.x, escPos.y, 1.25);
  mv.add(esc);
  const fourth = new THREE.Mesh(extrude(gearShape({ teeth: 72, outer: 3.7, root: 3.48, hub: 0.6, spokes: 4, rim: 0.45 }), 0.14, 0.03, 1), M.giltPolished);
  const fourthPos = B.clone().addScaledVector(towardCentre, 7.3).add(V2(-1.6, 1.3));
  fourth.position.set(fourthPos.x, fourthPos.y, 1.3);
  mv.add(fourth);

  // Balance wheel with hairspring
  const balance = new THREE.Group();
  balance.position.set(B.x, B.y, 2.25);
  mv.add(balance);
  const balMat = new THREE.MeshPhysicalMaterial({ color: '#d7b878', metalness: 1, roughness: 0.2 });
  balance.add(new THREE.Mesh(new THREE.TorusGeometry(4.25, 0.3, 12, 120), balMat));
  const arms = [];
  for (let k = 0; k < 3; k++) arms.push(new THREE.BoxGeometry(0.42, 4.1, 0.22).translate(0, 2.1, 0).rotateZ((k / 3) * TAU));
  arms.push(new THREE.CylinderGeometry(0.55, 0.55, 0.5, 24).rotateX(Math.PI / 2));
  for (let k = 0; k < 4; k++) arms.push(new THREE.CylinderGeometry(0.36, 0.36, 0.5, 16).rotateX(Math.PI / 2).translate(4.25, 0, 0).rotateZ((k / 4) * TAU + 0.4));
  balance.add(new THREE.Mesh(mergeGeometries(arms), balMat));
  const spiral = [];
  for (let i = 0; i <= 900; i++) {
    const t = i / 900, ang = t * 13 * TAU, r = 0.75 + t * 2.45;
    spiral.push(new THREE.Vector3(Math.cos(ang) * r, Math.sin(ang) * r, 0.42));
  }
  const spring = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spiral), 1400, 0.032, 3), M.hairspring);
  balance.add(spring);

  // Balance cock: gilt, polished edge, with jewel
  const cockEnd = B.clone().normalize().multiplyScalar(11.4);
  const cock = new THREE.Mesh(extrude(stadium(B, 1.9, cockEnd, 2.4), 0.6, 0.16, 2), [plateMat, M.giltPolished]);
  cock.position.z = 3.05;
  mv.add(cock);

  // Keyless works: ratchet and crown wheels with snailing
  const snail = T.snailing();
  const wheelMat = new THREE.MeshPhysicalMaterial({ color: '#ecc985', map: snail, metalness: 1, roughness: 0.16 });
  const ratchet = new THREE.Mesh(extrude(gearShape({ teeth: 60, outer: 4.3, root: 4.02, hub: 0.9, tooth: 0.55 }), 0.2, 0.12, 2), [wheelMat, M.giltPolished]);
  ratchet.position.set(-4.6, 4.9, 1.75);
  mv.add(ratchet);
  const crownWheel = new THREE.Mesh(extrude(gearShape({ teeth: 34, outer: 2.35, root: 2.1, hub: 0.6, tooth: 0.55 }), 0.2, 0.12, 2), [wheelMat, M.giltPolished]);
  crownWheel.position.set(-10.4, 0.2, 1.75);
  mv.add(crownWheel);

  // Jewels in gilt chatons, with blued screws
  const jewelSpots = [
    [B.x, B.y, 3.85, 0.95], [0.4, 6.6, 3.0, 0.9], [-1.6, 10.6, 3.0, 0.8], [7.2, -4.6, 3.0, 0.9], [-7.4, -5.6, 3.0, 0.85], [-11.0, -2.4, 3.0, 0.75],
  ];
  const chatons = [], screws = [], slots = [], rubies = [];
  // A screw: domed head with a slot cut across it
  const screw = (x, y, z, r, ang) => {
    const h = r * 0.55;
    screws.push(lathe([[0, 0], [r, 0], [r, h * 0.35], [r * 0.78, h * 0.85], [r * 0.4, h], [0, h]], 32).translate(x, y, z));
    slots.push(new THREE.BoxGeometry(r * 2.05, r * 0.26, h * 0.7).rotateZ(ang).translate(x, y, z + h * 0.8));
  };
  jewelSpots.forEach(([x, y, z, r], i) => {
    if (i > 0) chatons.push(lathe([[0.45, 0.0], [r, 0.0], [r, 0.18], [r * 0.82, 0.32], [0.45, 0.3]], 48).translate(x, y, z));
    rubies.push(new THREE.SphereGeometry(0.42, 24, 12, 0, TAU, 0, Math.PI / 2).rotateX(Math.PI / 2).scale(1, 1, 0.55).translate(x, y, z + (i ? 0.18 : 0.62)));
    if (i > 0) {
      for (let k = 0; k < 2; k++) {
        const ang = k * Math.PI + 0.7;
        const sx = x + Math.cos(ang) * (r + 0.35), sy = y + Math.sin(ang) * (r + 0.35);
        screw(sx, sy, z, 0.3, ang + 0.6);
      }
    }
  });
  // Plate screws round the edge, plus wheel screws
  [[0.1, 12.0], [1.75, 12.0], [2.55, 12.0], [3.55, 12.0], [4.7, 12.0], [5.4, 12.0]].forEach(([ang, r]) => {
    const x = Math.cos(ang) * r, y = Math.sin(ang) * r;
    screw(x, y, 2.95, 0.48, ang * 2.3);
  });
  [[-4.6, 4.9, 0.78], [-10.4, 0.2, 0.52], [cockEnd.x, cockEnd.y, 0.5]].forEach(([x, y, r], i) => {
    screw(x, y, i === 2 ? 3.75 : 2.15, r, 0.5 + i);
  });
  mv.add(new THREE.Mesh(mergeGeometries(chatons), M.giltPolished));
  mv.add(new THREE.Mesh(mergeGeometries(screws), M.blued));
  mv.add(new THREE.Mesh(mergeGeometries(slots), new THREE.MeshStandardMaterial({ color: '#070a14', roughness: 0.8 })));
  mv.add(new THREE.Mesh(mergeGeometries(rubies), M.ruby));
  // Regulator index over the balance cock
  const reg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 5.6, 0.12).translate(0, 2.8, 0), M.rhodium);
  reg.position.set(B.x, B.y, 3.95);
  reg.rotation.z = -angB - Math.PI / 2 + 0.55;
  mv.add(reg);

  // Rotor: skeleton, striped, with a gold weight. Pivots at the centre.
  const rotor = new THREE.Group();
  rotor.position.z = 3.85;
  mv.add(rotor);
  const rotorParts = [];
  const sector = (r0, r1, a0, a1) => {
    const s = new THREE.Shape();
    s.absarc(0, 0, r1, a0, a1, false);
    s.absarc(0, 0, r0, a1, a0, true);
    s.closePath();
    return s;
  };
  const span2 = 1.35;
  const a0 = -Math.PI / 2 - span2, a1 = -Math.PI / 2 + span2;
  const rotorShape = new THREE.Shape();
  rotorShape.absarc(0, 0, 11.2, a0, a1, false);
  rotorShape.absarc(0, 0, 2.1, a1, a0 + TAU, false);
  rotorShape.closePath();
  [[a0 + 0.16, -Math.PI / 2 - 0.1], [-Math.PI / 2 + 0.1, a1 - 0.16]].forEach(([w0, w1]) => {
    const h = new THREE.Path();
    h.absarc(0, 0, 8.3, w0, w1, false);
    h.absarc(0, 0, 3.7, w1, w0, true);
    h.closePath();
    rotorShape.holes.push(h);
  });
  rotorParts.push(extrude(rotorShape, 0.32, 0.07, 2));
  const rotorMat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', map: T.rotorTexture(), metalness: 1, roughness: 0.17 });
  rotor.add(new THREE.Mesh(mergeGeometries(rotorParts), rotorMat));
  const weight = new THREE.Mesh(extrude(sector(11.0, 12.9, -Math.PI / 2 - span2, -Math.PI / 2 + span2), 0.7, 0.1, 2), M.giltPolished);
  weight.position.z = -0.25;
  rotor.add(weight);
  const hubScrew = new THREE.Mesh(lathe([[0, 0], [0.75, 0], [0.75, 0.14], [0.58, 0.34], [0, 0.42]], 32).translate(0, 0, 0.4), M.blued);
  rotor.add(hubScrew);
  rotor.add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.2, 0.3).translate(0, 0, 0.78), new THREE.MeshStandardMaterial({ color: '#070a14', roughness: 0.8 })));
  parts.rotor = rotor;

  // Caseback --------------------------------------------------------------------------
  const backG = group('caseback');
  add(backG, latheRuns([
    [[17.7, -3.4], ...curve([17.7, -3.4], [17.6, -4.6], [16.1, -5.0], 10).slice(1)],
    [[13.0, -5.05], [12.45, -4.7], [12.45, -3.6]],
  ], 160), M.polished);
  const ring = new THREE.Mesh(new THREE.RingGeometry(13.0, 16.1, 160, 1), new THREE.MeshPhysicalMaterial({ map: T.casebackRing(), metalness: 1, roughness: 0.32 }));
  ring.rotation.y = Math.PI;
  ring.position.z = -5.05;
  backG.add(ring);
  // Display window
  add(backG, latheRuns([
    [[0, -4.0], [12.6, -4.0]],
    [[12.6, -5.2], [6, -5.34], [0, -5.38]],
  ], 96), M.sapphire);
  add(backG, latheRuns([[[12.6, -4.0], [12.6, -5.2]]], 96), M.glassEdge);

  // Strap ------------------------------------------------------------------------------
  // A closed loop round an imaginary wrist: the 12 o'clock piece carries the buckle,
  // the 6 o'clock piece runs under the wrist, over the buckle piece and through it.
  const topPath = strapPath(1, -Math.PI + 0.08);
  const tailPath = strapPath(-1, -0.9, 2.6);
  const lengthOf = (path) => path.reduce((acc, p, i) => (i ? acc + Math.hypot(p[0] - path[i - 1][0], p[1] - path[i - 1][1]) : 0), 0);
  const strapLen = { top: lengthOf(topPath), tail: lengthOf(tailPath) };
  // Holes sit where the tail crosses the buckle (y close to 0 at the back of the wrist).
  let sAcc = 0, sBuckle = strapLen.tail * 0.8;
  for (let i = 1; i < tailPath.length; i++) {
    sAcc += Math.hypot(tailPath[i][0] - tailPath[i - 1][0], tailPath[i][1] - tailPath[i - 1][1]);
    if (tailPath[i][1] < WRIST.zc + 1.5) { sBuckle = sAcc; break; }
  }
  const holes = [-14, -7, 0, 7, 14].map((o) => sBuckle + o).filter((s) => s < strapLen.tail - 10);
  const maps = {};
  Object.entries(STRAPS).forEach(([key, s]) => {
    maps[key] = {
      top: T.leather({ colour: s.colour, stitch: s.stitch, length: strapLen.top }),
      tail: T.leather({ colour: s.colour, stitch: s.stitch, length: strapLen.tail, holes, tip: true }),
    };
  });
  const bumps = { top: T.leatherBump({ length: strapLen.top }), tail: T.leatherBump({ length: strapLen.tail, holes, tip: true }) };
  const leatherTop = leatherMaterial(maps.chestnut.top, bumps.top);
  const leatherTail = leatherMaterial(maps.chestnut.tail, bumps.tail);
  const thick = (f, s) => 3.1 - 0.9 * Math.min(1, s / 22);

  const strapTop = group('strapTop');
  const top = strapGeometry(topPath, { widthAt: (f) => 20 - 4 * Math.min(1, f * 1.3), thickAt: thick });
  add(strapTop, top.geometry, leatherTop);
  const strapTail = group('strapTail');
  const tail = strapGeometry(tailPath, {
    widthAt: (f, s, L) => {
      const w = 20 - 4 * Math.min(1, f * 1.3);
      const tipLen = 8;
      if (s < L - tipLen) return w;
      const k = (s - (L - tipLen)) / tipLen;
      return Math.max(0.8, w * Math.sqrt(Math.max(0, 1 - k * k)));
    },
    thickAt: (f, s, L) => thick(f, s) - (s > L - 8 ? 0.4 * ((s - (L - 8)) / 8) : 0),
    flip: true,
  });
  add(strapTail, tail.geometry, leatherTail);
  // Two keepers on the buckle side, wide enough to hold both layers
  const keeperSlice = (from, to) => {
    let acc = 0; const out = [];
    for (let i = 0; i < topPath.length; i++) {
      if (i) acc += Math.hypot(topPath[i][0] - topPath[i - 1][0], topPath[i][1] - topPath[i - 1][1]);
      if (acc >= strapLen.top - from && acc <= strapLen.top - to) out.push(topPath[i]);
    }
    return out;
  };
  [[17, 13.8]].forEach(([from, to]) => {
    const keeper = strapGeometry(keeperSlice(from, to), { widthAt: () => 17.6, thickAt: () => 6.4, offset: 1.6, crown: 0 });
    add(strapTop, keeper.geometry, leatherTop);
  });
  // Pin buckle at the end of the top piece, under the wrist where it rests on the
  // table: the tail runs through it, so it is out of sight from above.
  const buckle = new THREE.Group();
  const bw = 6.8, bl = 5.8, rr = 2.2;
  const bpts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(bw, 0, 0)];
  [[bw - rr, bl - rr, 0], [-bw + rr, bl - rr, Math.PI / 2]].forEach(([cx, cy, a0]) => {
    for (let k = 0; k <= 12; k++) {
      const ang = a0 + (k / 12) * (Math.PI / 2);
      bpts.push(new THREE.Vector3(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr, 0));
    }
  });
  bpts.push(new THREE.Vector3(-bw, 0, 0));
  const loop = new THREE.CatmullRomCurve3(bpts, true, 'centripetal');
  const buckleMat = M.polished.clone();
  buckle.add(new THREE.Mesh(new THREE.TubeGeometry(loop, 200, 0.7, 16, true), buckleMat));
  const tongue = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.42, bl + 0.4, 16).translate(0, (bl + 0.4) / 2, 0), buckleMat);
  tongue.position.z = 1.1;
  tongue.rotation.x = 0.08;
  buckle.add(tongue);
  {
    const Tn = top.endT, X = new THREE.Vector3(1, 0, 0);
    const Nn = new THREE.Vector3().crossVectors(X, Tn).normalize();
    const m = new THREE.Matrix4().makeBasis(X, Tn, Nn);
    buckle.quaternion.setFromRotationMatrix(m);
    buckle.position.copy(top.end).addScaledVector(Tn, 0.6).addScaledVector(Nn, 2.4);
  }
  strapTop.add(buckle);

  // ---- Explode directions (watch space) and callout anchors ------------------------
  const explodeDir = {
    crystal: [0, 0, 46], bezel: [0, 0, 34], dial: [0, 0, 11], movement: [0, 0, -20], caseback: [0, 0, -54],
    crown: [8, 23, 3], case: [0, 0, 0], hands: [-4, 6, 24],
  };
  const handSpread = { hour: 0, minute: 4.5, seconds: 9.0 };
  const anchors = {
    crystal: { obj: crystalG, at: new THREE.Vector3(-1.0, 15.7, 5.2) },
    bezel: { obj: bezelG, at: new THREE.Vector3(-16.5, 6.5, 4.9) },
    hands: { obj: minMesh, at: new THREE.Vector3(0, 4.0, 0.3) },
    dial: { obj: dialG, at: new THREE.Vector3(-6.0, -13.5, 1.7) },
    case: { obj: caseG, at: new THREE.Vector3(12.6, -21.0, 0.6) },
    crown: { obj: crownG, at: new THREE.Vector3(23.9, 1.2, 1.2) },
    movement: { obj: mv, at: new THREE.Vector3(-8.0, 8.0, 3.3) },
    rotor: { obj: rotor, at: new THREE.Vector3(0, -6.0, 0.4) },
    caseback: { obj: backG, at: new THREE.Vector3(0, -16.6, -5.0) },
  };

  const strapMats = [leatherTop, leatherTail, buckleMat];

  // ---- State ----------------------------------------------------------------------
  const state = {
    dial: 'mersey', strap: 'chestnut', explode: 0,
    rotorAngle: 0, rotorVel: 0, ratchet: 0,
  };
  const colours = (key) => {
    const d = DIALS[key];
    return { base: new THREE.Color(d.base), flange: new THREE.Color(d.flange), print: new THREE.Color(d.print), metal: new THREE.Color(d.metal), metalness: d.metalness, roughness: d.roughness };
  };
  let dialFrom = colours('mersey'), dialTo = dialFrom;

  function setDialMix(fromKey, toKey, t) {
    dialFrom = colours(fromKey); dialTo = colours(toKey);
    dialMat.color.lerpColors(dialFrom.base, dialTo.base, t);
    flangeMat.color.lerpColors(dialFrom.flange, dialTo.flange, t);
    printMat.color.lerpColors(dialFrom.print, dialTo.print, t);
    metalMat.color.lerpColors(dialFrom.metal, dialTo.metal, t);
    dialMat.metalness = THREE.MathUtils.lerp(dialFrom.metalness, dialTo.metalness, t);
    dialMat.roughness = THREE.MathUtils.lerp(dialFrom.roughness, dialTo.roughness, t);
  }

  function setStrapMix(fromKey, toKey, t) {
    [[leatherTop, 'top'], [leatherTail, 'tail']].forEach(([m, piece]) => {
      m.map = maps[fromKey][piece];
      m.userData.mapB.value = maps[toKey][piece];
      m.userData.mix.value = t;
      m.roughness = THREE.MathUtils.lerp(STRAPS[fromKey].roughness, STRAPS[toKey].roughness, t);
      m.clearcoat = THREE.MathUtils.lerp(STRAPS[fromKey].clearcoat, STRAPS[toKey].clearcoat, t);
    });
  }

  function setExplode(e, away = state.away || 0) {
    state.explode = e;
    state.away = away;
    // Straps stay off until the parts are back together, then slide in from just
    // outside the lugs and fade up.
    const awRaw = Math.max(away, THREE.MathUtils.clamp(e / 0.1, 0, 1));
    const aw = awRaw * awRaw * (3 - 2 * awRaw);
    state.strapsAway = aw;
    parts.strapTop.position.set(0, 12 * aw, 0);
    parts.strapTail.position.set(0, -12 * aw, 0);
    const op = 1 - THREE.MathUtils.clamp(aw * 1.25, 0, 1);
    strapMats.forEach((m) => { m.opacity = op; const tr = op < 0.999; if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; } });
    parts.strapTop.visible = parts.strapTail.visible = op > 0.005;
    parts.springBars.visible = aw > 0.25;
    const ease = (x) => x * x * (3 - 2 * x);
    Object.entries(explodeDir).forEach(([name, [x, y, z]]) => {
      const g = parts[name];
      if (!g) return;
      // Stagger: outer parts move first
      const order = { crystal: 0, bezel: 0.05, hands: 0.12, dial: 0.18, crown: 0.08, movement: 0.1, caseback: 0, case: 0 }[name] || 0;
      const k = ease(THREE.MathUtils.clamp((e - order) / (1 - order), 0, 1));
      g.position.set(x * k, y * k, z * k);
    });
    const k = ease(THREE.MathUtils.clamp((e - 0.12) / 0.88, 0, 1));
    minute.position.z = handSpread.minute * k;
    seconds.position.z = handSpread.seconds * k;
    // The movement turns round as it comes out, so its finished side faces you,
    // and the rotor lifts off it.
    const km = ease(THREE.MathUtils.clamp((e - 0.1) / 0.9, 0, 1));
    parts.movement.rotation.y = Math.PI * km;
    // it moves out behind the turned movement so both can be seen
    rotor.position.z = 3.85 - 19 * ease(THREE.MathUtils.clamp((e - 0.3) / 0.7, 0, 1));
  }

  // Time: starts at 10:10:xx like a catalogue photo, then runs.
  const t0 = performance.now();
  const startSec = new Date().getSeconds();
  const gWorld = new THREE.Vector3();
  const qInv = new THREE.Quaternion();

  function update(now, dt, { live = true } = {}) {
    const elapsed = (now - t0) / 1000;
    const secs = live ? startSec + Math.floor(elapsed * 8) / 8 : 0;
    const totalMin = 10 * 60 + 10 + secs / 60;
    seconds.rotation.z = -(secs / 60) * TAU;
    minute.rotation.z = -((totalMin % 60) / 60) * TAU;
    hour.rotation.z = -((totalMin / 60) % 12 / 12) * TAU;
    if (live) {
      balance.rotation.z = Math.sin(elapsed * TAU * 4) * 2.4;
      esc.rotation.z = -Math.floor(elapsed * 8) * (TAU / 30);
    }
    // Rotor: a weighted pendulum that settles under gravity.
    mv.updateWorldMatrix(true, false);
    mv.getWorldQuaternion(qInv).invert();
    gWorld.set(0, -1, 0).applyQuaternion(qInv);
    const inPlane = Math.hypot(gWorld.x, gWorld.y);
    const target = Math.atan2(gWorld.y, gWorld.x) + Math.PI / 2; // weight centre sits at -90°
    if (live) {
      const diff = Math.atan2(Math.sin(target - state.rotorAngle), Math.cos(target - state.rotorAngle));
      const step = Math.min(dt, 0.05);
      state.rotorVel += (diff * 26 * inPlane - state.rotorVel * 2.2) * step;
      state.rotorAngle += state.rotorVel * step;
      state.ratchet += Math.abs(state.rotorVel) * step * 0.08;
    } else {
      state.rotorAngle = target; state.rotorVel = 0;
    }
    rotor.rotation.z = state.rotorAngle;
    ratchet.rotation.z = -state.ratchet;
    crownWheel.rotation.z = state.ratchet * (4.3 / 2.35);
  }

  setDialMix('mersey', 'mersey', 1);
  setStrapMix('chestnut', 'chestnut', 0);
  setExplode(0);

  // Everything that needs to sit in the transmission pass
  const materials = M;
  return { root, parts, anchors, state, setDialMix, setStrapMix, setExplode, update, materials };
}
