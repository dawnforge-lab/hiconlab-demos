// Stage for the P39: renderer, light, contact shadow, scroll choreography,
// exploded-view callouts and the dial/strap changes.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildWatch } from './watch.js';
import { PARTS } from './data.js';

const FW = window.Fenwright;
const params = new URLSearchParams(location.search);
const STILL = params.get('still'); // renders a fallback still: front | back | exploded
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TAU = Math.PI * 2;

// Poses, one per section. x/y in mm, rotations in radians, cam = camera distance.
const POSES = {
  hero: { x: 19, y: -2, rx: 0.02, ry: -0.5, rz: 0, cam: 236, explode: 0, away: 0, idle: 1 },
  back: { x: -16, y: 0, rx: 0.1, ry: -Math.PI + 0.42, rz: 0.2, cam: 172, explode: 0, away: 1, idle: 0.25 },
  exploded: { x: 0, y: -6, rx: 0.14, ry: -0.82, rz: 0.04, cam: 400, explode: 1, away: 1, idle: 0.22 },
  colour: { x: -22, y: -1, rx: 0.02, ry: -0.24, rz: 0, cam: 222, explode: 0, away: 0, idle: 0.45 },
  specs: { x: -26, y: -1, rx: 0.12, ry: 0.68, rz: -0.06, cam: 262, explode: 0, away: 0, idle: 0.35 },
  reserve: { x: 26, y: -1, rx: 0.02, ry: -0.32, rz: 0, cam: 250, explode: 0, away: 0, idle: 0.5 },
};
const KEYS = ['x', 'y', 'rx', 'ry', 'rz', 'cam', 'explode', 'away', 'idle'];

function hasWebGL() {
  if (params.get('nowebgl') === '1') return false;
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
  } catch { return false; }
}

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

// ---- Contact shadow (rendered from below, blurred) --------------------------------
class ContactShadow {
  constructor(renderer, { width = 140, height = 140, far = 26, res = 512, darkness = 1.6, opacity = 0.85 } = {}) {
    this.renderer = renderer;
    this.group = new THREE.Group();
    this.rt = new THREE.WebGLRenderTarget(res, res);
    this.rt.texture.generateMipmaps = false;
    this.rtBlur = new THREE.WebGLRenderTarget(res, res);
    this.rtBlur.texture.generateMipmaps = false;
    const geo = new THREE.PlaneGeometry(width, height).rotateX(Math.PI / 2);
    this.plane = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: this.rt.texture, opacity, transparent: true, depthWrite: false, toneMapped: false }));
    this.plane.renderOrder = 1;
    this.plane.scale.y = -1;
    this.group.add(this.plane);
    this.blurPlane = new THREE.Mesh(geo);
    this.blurPlane.visible = false;
    this.group.add(this.blurPlane);
    this.camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0, far);
    this.camera.rotation.x = Math.PI / 2;
    this.group.add(this.camera);
    this.depth = new THREE.MeshDepthMaterial();
    this.depth.userData.darkness = { value: darkness };
    this.depth.onBeforeCompile = (shader) => {
      shader.uniforms.darkness = this.depth.userData.darkness;
      shader.fragmentShader = /* glsl */ `uniform float darkness;\n${shader.fragmentShader.replace(
        'gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );',
        'gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * darkness );',
      )}`;
    };
    this.depth.depthTest = false;
    this.depth.depthWrite = false;
    const blur = (horizontal) => new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: null }, amount: { value: 1 / 256 } },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }',
      fragmentShader: `uniform sampler2D tDiffuse; uniform float amount; varying vec2 vUv;
        void main() {
          vec4 sum = vec4( 0.0 );
          vec2 d = ${horizontal ? 'vec2( amount, 0.0 )' : 'vec2( 0.0, amount )'};
          sum += texture2D( tDiffuse, vUv - 4.0 * d ) * 0.051;
          sum += texture2D( tDiffuse, vUv - 3.0 * d ) * 0.0918;
          sum += texture2D( tDiffuse, vUv - 2.0 * d ) * 0.12245;
          sum += texture2D( tDiffuse, vUv - 1.0 * d ) * 0.1531;
          sum += texture2D( tDiffuse, vUv ) * 0.1633;
          sum += texture2D( tDiffuse, vUv + 1.0 * d ) * 0.1531;
          sum += texture2D( tDiffuse, vUv + 2.0 * d ) * 0.12245;
          sum += texture2D( tDiffuse, vUv + 3.0 * d ) * 0.0918;
          sum += texture2D( tDiffuse, vUv + 4.0 * d ) * 0.051;
          gl_FragColor = sum;
        }`,
      depthTest: false,
    });
    this.hBlur = blur(true);
    this.vBlur = blur(false);
  }

  blur(amount) {
    const r = this.renderer;
    this.blurPlane.visible = true;
    this.blurPlane.material = this.hBlur;
    this.hBlur.uniforms.tDiffuse.value = this.rt.texture;
    this.hBlur.uniforms.amount.value = amount / 256;
    r.setRenderTarget(this.rtBlur);
    r.render(this.blurPlane, this.camera);
    this.blurPlane.material = this.vBlur;
    this.vBlur.uniforms.tDiffuse.value = this.rtBlur.texture;
    this.vBlur.uniforms.amount.value = amount / 256;
    r.setRenderTarget(this.rt);
    r.render(this.blurPlane, this.camera);
    this.blurPlane.visible = false;
  }

  render(scene, hide = []) {
    const r = this.renderer;
    const prevAlpha = r.getClearAlpha();
    hide.forEach((o) => { o.userData.wasVisible = o.visible; o.visible = false; });
    this.plane.visible = false;
    scene.overrideMaterial = this.depth;
    r.setClearAlpha(0);
    r.setRenderTarget(this.rt);
    r.clear();
    r.render(scene, this.camera);
    scene.overrideMaterial = null;
    this.blur(2.2);
    this.blur(0.8);
    r.setRenderTarget(null);
    r.setClearAlpha(prevAlpha);
    this.plane.visible = true;
    hide.forEach((o) => { o.visible = o.userData.wasVisible; });
  }
}

// ---- Environment: the RoomEnvironment plus long softboxes, as in a watch studio ---
function studioEnvironment(renderer) {
  const room = new RoomEnvironment();
  const strip = (w, h, x, y, z, ry, intensity) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.97, 0.92).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(x, y, z);
    m.rotation.y = ry;
    room.add(m);
  };
  strip(1.6, 14, -9, 6, 6, Math.PI / 3, 4.2);
  strip(1.2, 12, 10, 5, 4, -Math.PI / 3, 2.6);
  strip(10, 1.2, 0, 13.5, -6, 0, 2.8);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(room, 0.035).texture;
  pmrem.dispose();
  room.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  return env;
}

function glowTexture() {
  const S = 512, c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(58,62,52,1)');
  g.addColorStop(0.35, 'rgba(38,42,36,.75)');
  g.addColorStop(0.7, 'rgba(22,26,23,.3)');
  g.addColorStop(1, 'rgba(12,16,14,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---- Main ---------------------------------------------------------------------------
async function init() {
  const canvas = document.getElementById('scene');
  const list = document.getElementById('parts-list');
  if (list) list.innerHTML = PARTS.map((p) => `<li><span class="parts-list__title">${p.title}</span> <span class="parts-list__detail">${p.detail}</span></li>`).join('');
  if (!hasWebGL()) { FW.useFallback(); return; }

  FW.progress(0.08);
  if (document.fonts) {
    await Promise.all([
      document.fonts.load('600 64px "Bodoni Moda"'),
      document.fonts.load('italic 500 64px "Bodoni Moda"'),
      document.fonts.load('500 32px "Instrument Sans"'),
    ]).catch(() => {});
  }
  FW.progress(0.2);
  await nextFrame();

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!STILL });
  } catch (err) {
    console.warn('WebGL unavailable, showing the still image instead.', err);
    FW.useFallback();
    return;
  }
  const maxDpr = STILL ? 2 : 1.75;
  let dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  renderer.setPixelRatio(dpr);
  renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight, false);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const stageSize = () => ({ w: canvas.clientWidth || window.innerWidth, h: canvas.clientHeight || window.innerHeight });
  const camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 1, 2000);

  scene.environment = studioEnvironment(renderer);
  scene.environmentIntensity = 1;
  FW.progress(0.36);
  await nextFrame();

  const watch = buildWatch();
  scene.add(watch.root);
  FW.progress(0.66);
  await nextFrame();

  // Lights: a warm key from the upper left and a cool rim behind.
  const key = new THREE.DirectionalLight('#fff0dc', 1.5);
  key.position.set(-70, 90, 110);
  const rim = new THREE.DirectionalLight('#d6e4ff', 1.1);
  rim.position.set(90, 40, -100);
  scene.add(key, rim);

  // Floor: a pool of lamplight and the contact shadow.
  const floor = new THREE.Group();
  scene.add(floor);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(320, 320).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: glowTexture(), transparent: true, depthWrite: false, toneMapped: false }));
  glow.renderOrder = 0;
  floor.add(glow);
  const shadow = new ContactShadow(renderer);
  floor.add(shadow.group);
  if (STILL) glow.visible = false;

  // Points used to find the lowest part of the strap, so the floor sits under it.
  const lowSamples = [];
  ['strapTop', 'strapTail'].forEach((name) => {
    const geo = watch.parts[name].children[0].geometry;
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i += 37) lowSamples.push({ obj: watch.parts[name], v: new THREE.Vector3().fromBufferAttribute(pos, i) });
  });

  // ---- Poses and scroll -------------------------------------------------------------
  const sections = [...document.querySelectorAll('[data-pose]')];
  const progress = sections.map(() => 0);
  const portrait = () => window.innerWidth / window.innerHeight < 1.0;
  const adapt = (p) => {
    const aspect = window.innerWidth / window.innerHeight;
    if (!portrait()) {
      // Poses are designed at 16:9. On squarer screens the copy takes a larger share
      // of the width, so pull the camera back a little and keep the watch at the
      // same fraction of the screen width.
      const T10 = Math.tan(THREE.MathUtils.degToRad(10));
      const k = Math.max(1, Math.pow(1.778 / aspect, 1.3));
      const cam = p.cam * k;
      const fx = p.x / (T10 * p.cam * 1.778);
      return { ...p, cam, x: fx * T10 * cam * aspect };
    }
    // Phones: the stage is the top of the screen, the copy scrolls beneath it.
    const { w, h } = stageSize();
    const k = Math.max(1, 1.12 / (w / h)) * (p.explode > 0.5 ? 0.7 : 0.92);
    return { ...p, x: 0, cam: p.cam * k };
  };
  const poseOf = (el) => POSES[el.dataset.pose] || POSES.hero;

  if (window.gsap && window.ScrollTrigger && !STILL) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.ticker.lagSmoothing(0); // colour changes finish on time even if a frame stalls
    sections.forEach((el, i) => {
      if (i === 0) return;
      ScrollTrigger.create({
        trigger: el, start: 'top bottom', end: 'top 18%',
        onUpdate: (self) => { progress[i] = self.progress; },
        onRefresh: (self) => { progress[i] = self.progress; },
      });
    });
  }

  const target = {}, current = {};
  function computeTarget() {
    let p = adapt(poseOf(sections[0]));
    KEYS.forEach((k) => { target[k] = p[k]; });
    for (let i = 1; i < sections.length; i++) {
      const t = progress[i];
      if (t <= 0) break;
      const e = t * t * (3 - 2 * t);
      p = adapt(poseOf(sections[i]));
      KEYS.forEach((k) => { target[k] += (p[k] - target[k]) * e; });
    }
  }
  function steppedIndex() {
    let idx = 0;
    for (let i = 1; i < sections.length; i++) if (progress[i] >= 0.55) idx = i;
    return idx;
  }

  if (STILL) {
    const p = { ...POSES[STILL === 'back' ? 'back' : STILL === 'exploded' ? 'exploded' : 'hero'], x: 0, idle: 0 };
    if (STILL === 'front') Object.assign(p, { ry: -0.42, rx: 0.02, cam: 236 });
    KEYS.forEach((k) => { target[k] = current[k] = p[k]; });
  } else {
    computeTarget();
    KEYS.forEach((k) => { current[k] = target[k]; });
  }

  // Intro: a slow turn up from the dark.
  const intro = { turn: reduced || STILL ? 0 : -0.95, lift: reduced || STILL ? 0 : -3, sweep: reduced || STILL ? 0 : -1.5 };
  const extra = { sweep: 0 };

  let lastPoseSig = '';
  const tmp = new THREE.Vector3();
  function applyPose(now) {
    const t = now / 1000;
    const idle = reduced || STILL ? 0 : current.idle;
    const swayY = Math.sin(t * 0.33) * 0.17 * idle;
    const swayX = Math.sin(t * 0.21 + 1.3) * 0.035 * idle;
    watch.root.position.set(current.x, current.y + intro.lift, 0);
    watch.root.rotation.set(current.rx + swayX, current.ry + swayY + intro.turn, current.rz, 'YXZ');
    watch.setExplode(current.explode, current.away);
    camera.position.set(0, current.cam * 0.09, current.cam);
    camera.lookAt(0, -1.5, 0);
    scene.environmentRotation.y = intro.sweep + extra.sweep + (reduced || STILL ? 0 : Math.sin(t * 0.17) * 0.32);
    const sig = [current.x, current.y + intro.lift, current.rx + swayX, current.ry + swayY + intro.turn, current.rz, current.explode, current.away].map((v) => v.toFixed(3)).join('|');
    const changed = sig !== lastPoseSig;
    lastPoseSig = sig;
    if (changed) {
      watch.root.updateMatrixWorld(true);
      let low = Infinity;
      lowSamples.forEach(({ obj, v }) => { low = Math.min(low, tmp.copy(v).applyMatrix4(obj.matrixWorld).y); });
      const away = watch.state.strapsAway != null ? watch.state.strapsAway : current.away;
      floor.position.set(current.x, Math.min(low, -28) - 0.4, 0);
      shadow.plane.material.opacity = 0.85 * (1 - away);
      glow.material.opacity = 1 - 0.55 * away;
      if (away < 0.999) shadow.render(scene, [glow]);
    }
    return changed;
  }

  // ---- Callouts -------------------------------------------------------------------
  const calloutLayer = document.getElementById('callouts');
  const svg = calloutLayer.querySelector('svg');
  const labelsBox = calloutLayer.querySelector('.callouts__labels');
  const NS = 'http://www.w3.org/2000/svg';
  const callouts = PARTS.map((part, i) => {
    const line = document.createElementNS(NS, 'path');
    line.setAttribute('class', 'callouts__line');
    line.setAttribute('pathLength', '1');
    line.style.setProperty('--i', i);
    const dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('r', '3.5');
    dot.setAttribute('class', 'callouts__dot');
    const ring = document.createElementNS(NS, 'circle');
    ring.setAttribute('r', '9');
    ring.setAttribute('class', 'callouts__ring');
    const num = document.createElementNS(NS, 'text');
    num.setAttribute('class', 'callouts__num');
    num.textContent = String(i + 1);
    svg.append(line, ring, dot, num);
    const label = document.createElement('div');
    label.className = 'callout';
    label.style.setProperty('--i', i);
    label.innerHTML = `<span class="callout__no">${String(i + 1).padStart(2, '0')}</span><span class="callout__title">${part.title}</span><span class="callout__detail">${part.detail}</span>`;
    labelsBox.appendChild(label);
    return { part, line, dot, ring, num, label, anchor: watch.anchors[part.id], sx: 0, sy: 0 };
  });
  let calloutsOn = false;
  window.__fwCalloutData = () => callouts.map((co) => ({ id: co.part.id, x: Math.round(co.sx), y: Math.round(co.sy) }));
  function layoutCallouts() {
    const e = current.explode;
    const on = e > 0.86;
    if (on !== calloutsOn) {
      calloutsOn = on;
      calloutLayer.classList.toggle('is-on', on);
    }
    if (e < 0.4) return;
    const { w, h } = stageSize();
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const wide = w >= 1100 && !portrait();
    calloutLayer.classList.toggle('is-compact', !wide);
    watch.root.updateMatrixWorld(true);
    const c = tmp.copy(watch.root.position).project(camera);
    const cx = (c.x * 0.5 + 0.5) * w;
    callouts.forEach((co) => {
      const p = co.anchor.obj.localToWorld(co.anchor.at.clone()).project(camera);
      co.sx = (p.x * 0.5 + 0.5) * w;
      co.sy = (-p.y * 0.5 + 0.5) * h;
    });
    if (!wide) {
      callouts.forEach((co) => {
        co.line.setAttribute('d', '');
        co.dot.setAttribute('cx', co.sx); co.dot.setAttribute('cy', co.sy);
        co.ring.setAttribute('cx', co.sx); co.ring.setAttribute('cy', co.sy);
        co.num.setAttribute('x', co.sx); co.num.setAttribute('y', co.sy + 3.5);
      });
      return;
    }
    const spread = Math.min(430, w * 0.24);
    const cols = [
      { items: callouts.filter((co) => co.part.side === 'left'), x: cx - spread, side: 'left' },
      { items: callouts.filter((co) => co.part.side !== 'left'), x: cx + spread, side: 'right' },
    ];
    const top = h * 0.26, bottom = h - 56, gap = 74;
    cols.forEach((col) => {
      // Labels sit in an even column centred on their anchors, in reading order.
      const n = col.items.length;
      const mid = col.items.reduce((acc, co) => acc + co.sy, 0) / n;
      const start = Math.min(Math.max(top, mid - ((n - 1) * gap) / 2), bottom - (n - 1) * gap);
      const ys = col.items.map((co, i) => start + i * gap);
      col.items.forEach((co, i) => {
        const y = ys[i];
        const left = col.side === 'left';
        co.label.classList.toggle('is-left', left);
        co.label.style.transform = `translate(${left ? col.x - 268 : col.x}px, ${y - 14}px)`;
        const ex = left ? col.x + 14 : col.x - 14;
        const kx = left ? col.x + 44 : col.x - 44;
        co.line.setAttribute('d', `M${co.sx.toFixed(1)},${co.sy.toFixed(1)} L${kx.toFixed(1)},${y.toFixed(1)} L${ex.toFixed(1)},${y.toFixed(1)}`);
        co.dot.setAttribute('cx', co.sx); co.dot.setAttribute('cy', co.sy);
        co.ring.setAttribute('cx', co.sx); co.ring.setAttribute('cy', co.sy);
        co.num.setAttribute('x', -100); co.num.setAttribute('y', -100);
      });
    });
  }

  // ---- Dial and strap changes ---------------------------------------------------
  let dialKey = 'mersey', strapKey = 'chestnut';
  let dirty = true;
  const mix = { dial: 1, strap: 0 };
  window.addEventListener('fenwright:dial', (ev) => {
    const to = ev.detail.key;
    if (to === dialKey) return;
    const from = dialKey;
    dialKey = to;
    gsap.killTweensOf(mix, 'dial');
    mix.dial = 0;
    if (reduced) { watch.setDialMix(from, to, 1); dirty = true; return; }
    gsap.to(mix, { dial: 1, duration: 1.2, ease: 'power2.inOut', onUpdate: () => { watch.setDialMix(from, to, mix.dial); dirty = true; } });
    gsap.fromTo(extra, { sweep: 0.9 }, { sweep: 0, duration: 1.6, ease: 'power3.out' });
  });
  window.addEventListener('fenwright:strap', (ev) => {
    const to = ev.detail.key;
    if (to === strapKey) return;
    const from = strapKey;
    strapKey = to;
    gsap.killTweensOf(mix, 'strap');
    mix.strap = 0;
    if (reduced) { watch.setStrapMix(from, to, 1); dirty = true; return; }
    gsap.to(mix, { strap: 1, duration: 1.0, ease: 'power2.inOut', onUpdate: () => { watch.setStrapMix(from, to, mix.strap); dirty = true; } });
  });
  if (STILL && params.get('dial')) watch.setDialMix('mersey', params.get('dial'), 1);
  if (STILL && params.get('strap')) watch.setStrapMix('chestnut', params.get('strap'), 1);

  // ---- Resize, visibility ------------------------------------------------------------
  function resize() {
    const { w, h } = stageSize();
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    dirty = true;
  }
  window.addEventListener('resize', resize);
  resize();

  let visible = true;
  const main = document.querySelector('main');
  if ('IntersectionObserver' in window && main) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0 }).observe(main);
  }

  // ---- First render and reveal --------------------------------------------------
  applyPose(performance.now());
  watch.update(performance.now(), 0, { live: !reduced && !STILL });
  if (renderer.compileAsync) await renderer.compileAsync(scene, camera).catch(() => {});
  FW.progress(0.92);
  renderer.render(scene, camera);
  await nextFrame();
  FW.progress(1);

  if (STILL) {
    document.documentElement.classList.add('is-still');
    applyPose(performance.now());
    renderer.render(scene, camera);
    window.__stillReady = true;
    return;
  }

  FW.loaded();
  if (!reduced) {
    gsap.to(intro, { turn: 0, duration: 3.4, ease: 'power3.out' });
    gsap.to(intro, { lift: 0, duration: 2.6, ease: 'power3.out' });
    gsap.to(intro, { sweep: 0, duration: 3.6, ease: 'power2.inOut' });
    setTimeout(() => FW.resolveReady(), 1500);
  } else {
    FW.resolveReady();
  }

  // ---- Loop -----------------------------------------------------------------------
  let last = performance.now();
  let stepped = steppedIndex();
  let fading = false;
  let slow = 0, frames = 0;
  const stageEl = canvas.parentElement;

  function stepTo(idx) {
    // Reduced motion: fade out, change pose, fade back in.
    fading = true;
    stageEl.classList.add('is-fading');
    setTimeout(() => {
      const p = adapt(poseOf(sections[idx]));
      KEYS.forEach((k) => { current[k] = p[k]; });
      dirty = true;
      stageEl.classList.remove('is-fading');
      fading = false;
    }, 260);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!visible || document.hidden) return;
    if (reduced) {
      const idx = steppedIndex();
      if (idx !== stepped && !fading) { stepped = idx; stepTo(idx); }
      // Re-apply size-dependent pose values on resize
      if (dirty && !fading) {
        const p = adapt(poseOf(sections[stepped]));
        KEYS.forEach((k) => { current[k] = p[k]; });
      }
      if (!dirty) return;
      applyPose(now);
      watch.update(now, dt, { live: false });
      renderer.render(scene, camera);
      layoutCallouts();
      dirty = false;
      return;
    }
    computeTarget();
    const k = 1 - Math.exp(-dt * 4.2);
    KEYS.forEach((key) => { current[key] += (target[key] - current[key]) * k; });
    applyPose(now);
    watch.update(now, dt, { live: true });
    renderer.render(scene, camera);
    layoutCallouts();

    // Keep it smooth on slower machines: drop the pixel ratio if frames run long.
    frames++;
    if (dt > 0.024) slow++;
    if (frames >= 90) {
      // Integrated graphics: go straight to 1.5, then step down towards 1.
      if (slow > 45 && dpr > 1) { dpr = dpr > 1.5 ? 1.5 : Math.max(1, dpr - 0.25); resize(); }
      frames = 0; slow = 0;
    }
  }
  requestAnimationFrame(frame);
}

window.__fwCallouts = () => (window.__fwCalloutData ? window.__fwCalloutData() : []);

init().catch((err) => {
  console.error(err);
  FW.useFallback();
});
