// Stage for the Upwich tube: renderer, light, scroll poses, the fizz, flavour changes.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildProduct } from './product.js';
import { FLAVOURS } from './data.js';

const UP = window.Upwich;
const params = new URLSearchParams(location.search);
const STILL = params.get('still'); // hero | label | inside | fizz: renders a fallback still
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TAU = Math.PI * 2;

// One pose per section. Tube and glass x/z in cm, ry in radians, cam = camera distance,
// camY = camera height, lookY = height it looks at, spin = auto-rotation weight.
const POSES = {
  hero:     { tx: 6.0, tz: 0, ry: -0.42, gx: 3.5, gy: -14, gz: 0, gs: 1, gon: 0, open: 0, fan: 0, cam: 42, camY: 8.2, lookY: 5.8, spin: 1 },
  label:    { tx: -4.8, tz: 0, ry: Math.PI + 0.02, gx: 3.5, gy: -14, gz: 0, gs: 1, gon: 0, open: 0, fan: 0, cam: 38.5, camY: 7, lookY: 6.2, spin: 0 },
  inside:   { tx: 5.0, tz: 0, ry: -0.18, gx: 3.5, gy: -14, gz: 0, gs: 1, gon: 0, open: 1, fan: 1, cam: 60, camY: 13.5, lookY: 9.6, spin: 0 },
  fizz:     { tx: 10.8, tz: -2.4, ry: -0.3, gx: 3.4, gy: 0, gz: 0, gs: 1, gon: 1, open: 0, fan: 0, cam: 44, camY: 10.5, lookY: 5.6, spin: 0 },
  flavours: { tx: 5.8, tz: 1.6, ry: -0.38, gx: 2.0, gy: 0, gz: -4.6, gs: 0.7, gon: 1, open: 0, fan: 0, cam: 43, camY: 8.6, lookY: 6.1, spin: 0 },
  buy:      { tx: -6.4, tz: 1.6, ry: -0.45, gx: -10.4, gy: 0, gz: -4.6, gs: 0.7, gon: 1, open: 0, fan: 0, cam: 45, camY: 8.8, lookY: 6.1, spin: 0.35 },
};
const KEYS = ['tx', 'tz', 'ry', 'gx', 'gy', 'gz', 'gs', 'gon', 'open', 'fan', 'cam', 'camY', 'lookY', 'spin'];

function hasWebGL() {
  if (params.get('nowebgl') === '1') return false;
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
  } catch { return false; }
}
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// Morning light: a bright room with a window to the left and a long softbox above.
function daylightEnvironment(renderer) {
  const room = new RoomEnvironment();
  const panel = (w, h, x, y, z, ry, rx, intensity, tint = [1, 0.99, 0.96]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(...tint).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, 0);
    room.add(m);
  };
  panel(5, 9, -10, 5, 3, Math.PI / 2.4, 0, 3.4);            // window, left
  panel(1.4, 12, 9, 5, 5, -Math.PI / 3, 0, 1.8, [0.95, 0.98, 1]); // cool strip, right
  panel(12, 2, 0, 13, 0, 0, Math.PI / 2, 2.2);              // softbox above
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(room, 0.03).texture;
  pmrem.dispose();
  room.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  return env;
}

function blobShadow(size, core = 0.34) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 6, 64, 64, 64);
  g.addColorStop(0, `rgba(19,35,45,${core})`);
  g.addColorStop(0.3, `rgba(19,35,45,${core * 0.62})`);
  g.addColorStop(0.62, `rgba(19,35,45,${core * 0.16})`);
  g.addColorStop(1, 'rgba(19,35,45,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }));
  m.position.y = 0.01;
  m.renderOrder = 1;
  return m;
}

async function init() {
  const canvas = document.getElementById('scene');
  if (!hasWebGL()) { UP.useFallback(); return; }

  UP.progress(0.1);
  if (document.fonts) {
    await Promise.all([
      document.fonts.load('900 64px "Mona Sans"'),
      document.fonts.load('600 32px "Spline Sans Mono"'),
    ]).catch(() => {});
  }
  UP.progress(0.22);
  await nextFrame();

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!STILL });
  } catch (err) {
    console.warn('WebGL unavailable, showing still images instead.', err);
    UP.useFallback();
    return;
  }
  const maxDpr = STILL ? 2 : 1.75;
  let dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(22, 16 / 9, 1, 400);
  scene.environment = daylightEnvironment(renderer);
  scene.environmentIntensity = 0.95;
  UP.progress(0.4);
  await nextFrame();

  const startFlavour = (STILL && params.get('flavour')) || UP.flavour();
  const product = buildProduct(startFlavour);
  scene.add(product.root);
  const tubeShadow = blobShadow(7.4, 0.46);
  product.tube.add(tubeShadow);
  UP.progress(0.7);
  await nextFrame();

  const key = new THREE.DirectionalLight('#fffaf0', 1.7);
  key.position.set(-30, 40, 34);
  const rim = new THREE.DirectionalLight('#e6f0ff', 0.9);
  rim.position.set(36, 18, -30);
  scene.add(key, rim);

  // ---- Poses and scroll ----------------------------------------------------------
  const sections = [...document.querySelectorAll('[data-pose]')];
  const progress = sections.map(() => 0);
  const fizzSection = document.getElementById('fizz');
  let fizzQ = 0;
  const stage = canvas.parentElement;
  const stageSize = () => ({ w: stage.clientWidth || window.innerWidth, h: stage.clientHeight || window.innerHeight });
  const portrait = () => { const { w, h } = stageSize(); return window.innerWidth < 761 || w / h < 1.15; };

  const adapt = (p) => {
    const { w, h } = stageSize();
    const aspect = w / h;
    const T = Math.tan(THREE.MathUtils.degToRad(11));
    if (!portrait()) {
      // Poses are set at 16:9. On squarer screens pull back and keep the same share of the width.
      const k = Math.max(1, Math.pow(1.778 / aspect, 1.15));
      const cam = p.cam * k;
      const s = (cam * aspect) / (p.cam * 1.778);
      return { ...p, cam, tx: p.tx * s, gx: p.gx * s };
    }
    // Phones: the stage is the top of the screen. Centre what is on show and fit it.
    const g = p.gon;
    const cx = (p.tx + p.gx * g) / (1 + g);
    const ext = Math.max(Math.abs(p.tx - cx) + 2.2 + p.fan * 2.4, g ? Math.abs(p.gx - cx) + 3.4 * p.gs : 0);
    const top = 11.8 + p.fan * 5.6;
    const camW = (ext + 0.8) / (T * aspect);
    const camH = (top / 2 + 1.2) / T;
    const cam = Math.max(camW, camH) * (p.ry > 3 ? 0.9 : 1);
    return { ...p, tx: p.tx - cx, gx: p.gx - cx, cam, lookY: top / 2 - 0.4, camY: top / 2 + 2.2 };
  };
  const poseOf = (el) => POSES[el.dataset.pose] || POSES.hero;

  if (window.gsap && window.ScrollTrigger && !STILL) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.ticker.lagSmoothing(0);
    sections.forEach((el, i) => {
      if (i === 0) return;
      ScrollTrigger.create({
        trigger: el, start: 'top bottom', end: 'top 35%',
        onUpdate: (self) => { progress[i] = self.progress; },
        onRefresh: (self) => { progress[i] = self.progress; },
      });
    });
    if (fizzSection) {
      ScrollTrigger.create({
        trigger: fizzSection, start: 'top 15%', end: 'bottom bottom',
        onUpdate: (self) => { fizzQ = self.progress; },
        onRefresh: (self) => { fizzQ = self.progress; },
      });
    }
  }

  const target = {}, current = {};
  function computeTarget() {
    let p = adapt(poseOf(sections[0]));
    KEYS.forEach((k) => { target[k] = p[k]; });
    for (let i = 1; i < sections.length; i++) {
      const t = progress[i];
      if (t <= 0) break;
      // Ease out: the product leaves its old place early, before the new copy arrives.
      const e = 1 - Math.pow(1 - t, 3);
      p = adapt(poseOf(sections[i]));
      KEYS.forEach((k) => { target[k] += (p[k] - target[k]) * e; });
    }
  }
  function steppedIndex() {
    let idx = 0;
    for (let i = 1; i < sections.length; i++) if (progress[i] >= 0.55) idx = i;
    return idx;
  }

  // The drop and the fizz follow the reader through the fizz section.
  // Linear in scroll, so the clock runs evenly: the drop takes the first 22%, the fizz 24–86%.
  const fizzOf = (q) => ({ drop: clamp01(q / 0.22), fizz: clamp01((q - 0.24) / 0.62) });
  const fizzStepped = (q) => (q < 0.02 ? { drop: 0, fizz: 0 } : q < 0.55 ? { drop: 1, fizz: 0.32 } : { drop: 1, fizz: 1 });

  if (STILL) {
    const p = { ...POSES[STILL] || POSES.hero };
    p.tx = STILL === 'fizz' ? 4.4 : 0; p.gx = STILL === 'fizz' ? -3.6 : 0; p.tz = STILL === 'fizz' ? -2.4 : 0; p.spin = 0;
    if (STILL === 'hero') { p.ry = -0.32; p.cam = 36; p.camY = 7.4; p.lookY = 5.9; }
    if (STILL === 'label') { p.cam = 36; p.camY = 7; p.lookY = 5.9; }
    if (STILL === 'inside') { p.cam = 46; p.lookY = 8.9; }
    if (STILL === 'fizz') { p.cam = 40; p.ry = -0.35; }
    KEYS.forEach((k) => { target[k] = current[k] = p[k]; });
    const f = STILL === 'fizz' ? { drop: 1, fizz: 0.42 } : { drop: 0, fizz: 0 };
    Object.assign(product.state, f);
  } else {
    computeTarget();
    KEYS.forEach((k) => { current[k] = target[k]; });
  }

  // Intro: the tube rises into the light with a quarter turn.
  const intro = { turn: reduced || STILL ? 0 : -1.2, lift: reduced || STILL ? 0 : -2.4 };
  let spinAngle = 0;

  function applyPose(t, dt) {
    const idle = reduced || STILL ? 0 : 1;
    // Auto-rotation in the hero; elsewhere the spin settles back to the nearest full turn.
    if (idle && current.spin > 0.01) spinAngle += dt * 0.34 * current.spin;
    else {
      const home = Math.round(spinAngle / TAU) * TAU;
      spinAngle += (home - spinAngle) * (1 - Math.exp(-dt * 3.2));
    }
    const sway = idle ? Math.sin(t * 0.4) * 0.06 * (1 - current.spin) : 0;
    product.tube.position.set(current.tx, intro.lift, current.tz);
    product.tube.rotation.set(0, current.ry + spinAngle + sway + intro.turn, 0);
    // The lifted cap keeps its open side to the camera whichever way the tube is turned.
    product.state.capYaw = 0.5 - product.tube.rotation.y;
    product.glass.position.set(current.gx, current.gy, current.gz);
    product.glass.scale.setScalar(current.gs);
    product.glass.rotation.y = 0.3;
    product.setGlassOn(current.gon);
    product.state.open = current.open;
    product.state.fan = current.fan;
    camera.position.set(0, current.camY, current.cam);
    camera.lookAt(0, current.lookY, 0);
  }

  // ---- Flavour changes ----------------------------------------------------------
  let flavour = startFlavour;
  const wipe = { p: 0 };
  let wipeTween = null;
  window.addEventListener('upwich:flavour', (ev) => {
    const to = ev.detail.key;
    if (to === flavour || !FLAVOURS[to]) return;
    if (wipeTween) { wipeTween.progress(1); wipeTween = null; }
    const from = flavour;
    flavour = to;
    product.state.flavour = to;
    const toTint = new THREE.Color(FLAVOURS[to].water);
    const toAlpha = FLAVOURS[to].waterAlpha;
    if (reduced || !window.gsap) {
      product.setFlavourInstant(to);
      product.state.tint.copy(toTint);
      product.state.alpha = toAlpha;
      return;
    }
    const fromAlpha = product.state.alpha;
    product.beginFlavour(to);
    const fromTint = product.state.tint.clone();
    let swapped = false;
    wipe.p = 0;
    wipeTween = gsap.to(wipe, {
      p: 1, duration: 1.35, ease: 'power2.inOut',
      onUpdate: () => {
        product.setWipe(wipe.p, from, to);
        product.state.tint.copy(fromTint).lerp(toTint, wipe.p);
        product.state.alpha = fromAlpha + (toAlpha - fromAlpha) * wipe.p;
        if (!swapped && wipe.p > 0.45) { swapped = true; product.setTablets(to); }
      },
      onComplete: () => { product.setWipe(1, from, to); wipeTween = null; },
    });
  });

  // ---- Resize, visibility -------------------------------------------------------------
  function resize() {
    const { w, h } = stageSize();
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // ---- First frame and reveal ----------------------------------------------------------
  applyPose(0, 0);
  product.update(0, false);
  if (renderer.compileAsync) await renderer.compileAsync(scene, camera).catch(() => {});
  UP.progress(0.92);
  renderer.render(scene, camera);
  await nextFrame();
  UP.progress(1);

  if (STILL) {
    document.documentElement.classList.add('is-still');
    applyPose(0, 0);
    product.update(0.016, false);
    renderer.render(scene, camera);
    window.__stillReady = true;
    return;
  }

  UP.loaded();
  if (!reduced) {
    gsap.to(intro, { turn: 0, duration: 3.2, ease: 'power3.out' });
    gsap.to(intro, { lift: 0, duration: 2.4, ease: 'power3.out' });
    setTimeout(() => UP.resolveReady(), 1500);
  } else {
    UP.resolveReady();
  }

  // ---- Loop ---------------------------------------------------------------------------
  let last = performance.now();
  let stepped = steppedIndex();
  let fizzStep = fizzStepped(fizzQ);
  let fading = false;
  let slow = 0, frames = 0;
  let lastFizzShown = -1;

  // The soft flavour wash on the page follows the product across the screen.
  let washX = -1;
  const wv = new THREE.Vector3();
  function updateWash() {
    const g = current.gon;
    wv.set((current.tx + current.gx * g) / (1 + g), 5, 0).project(camera);
    const x = Math.round((wv.x * 0.5 + 0.5) * 1000) / 10;
    if (Math.abs(x - washX) > 0.3) { washX = x; stage.style.setProperty('--wash-x', x + '%'); }
  }

  function stepTo(idx) {
    fading = true;
    stage.classList.add('is-fading');
    setTimeout(() => {
      const p = adapt(poseOf(sections[idx]));
      KEYS.forEach((k) => { current[k] = p[k]; });
      Object.assign(product.state, fizzStep);
      stage.classList.remove('is-fading');
      fading = false;
    }, 240);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (document.hidden) return;
    const t = now / 1000;
    if (reduced) {
      const idx = steppedIndex();
      const fs = fizzStepped(fizzQ);
      if ((idx !== stepped || fs.fizz !== fizzStep.fizz || fs.drop !== fizzStep.drop) && !fading) {
        stepped = idx; fizzStep = fs; stepTo(idx);
      }
      if (!fading) {
        const p = adapt(poseOf(sections[stepped]));
        KEYS.forEach((k) => { current[k] = p[k]; });
      }
      applyPose(t, 0);
      product.update(0, false);
    } else {
      computeTarget();
      const k = 1 - Math.exp(-dt * 4.4);
      KEYS.forEach((key) => { current[key] += (target[key] - current[key]) * k; });
      const f = fizzOf(fizzQ);
      product.state.drop += (f.drop - product.state.drop) * (1 - Math.exp(-dt * 7));
      product.state.fizz += (f.fizz - product.state.fizz) * (1 - Math.exp(-dt * 6));
      applyPose(t, dt);
      product.update(dt, true);
    }
    const shown = Math.round(product.state.fizz * 120) + (product.state.drop >= 0.5 ? 1000 : 0);
    if (shown !== lastFizzShown) { lastFizzShown = shown; UP.fizz(product.state.drop, product.state.fizz); }
    renderer.render(scene, camera);
    updateWash();

    // Keep it smooth on slower machines: drop the pixel ratio if frames run long.
    frames++;
    if (dt > 0.024) slow++;
    if (frames >= 90) {
      if (slow > 45 && dpr > 1) { dpr = dpr > 1.5 ? 1.5 : Math.max(1, dpr - 0.25); resize(); }
      frames = 0; slow = 0;
    }
  }
  requestAnimationFrame(frame);
}

init().catch((err) => {
  console.error(err);
  UP.useFallback();
});
