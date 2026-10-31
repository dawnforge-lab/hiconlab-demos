// The product, built in code: a printed aluminium tube of twenty tablets with a ribbed
// cap and spring, and a glass of water for one tablet to fizz away in.
// Units are centimetres. Both groups stand on y = 0.
import * as THREE from 'three';
import { FLAVOURS } from './data.js';
import { drawLabel, drawTablet, tabletBump, brushed, foam } from './textures.js';

const R = 1.5;                 // tube radius
const LABEL_Y0 = 0.35, LABEL_H = 9.0;
const TOP = 10.2;              // top of the tube's lip
const T = 0.45, RT = 1.3;      // tablet thickness and radius
const FLOOR = 0.3;             // inside floor of the tube
const COUNT = 20, FAN = 7;
const GLASS_H = 11, WATER = 8.4, GLASS_BASE = 0.72;

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a, b, t) => a + (b - a) * t;

function lathe(points, segments = 96) {
  return new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), segments);
}

// Rounded corner helper: points along a quarter arc.
function arc(cx, cy, r, a0, a1, n = 6) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * (i / n);
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return out;
}

export function buildProduct(initial = 'lemon') {
  const root = new THREE.Group();
  const state = { flavour: initial, open: 0, fan: 0, drop: 0, fizz: 0, time: 0, tint: new THREE.Color(FLAVOURS[initial].water), alpha: FLAVOURS[initial].waterAlpha };

  // ---- Materials --------------------------------------------------------------
  const labels = {};
  const labelTex = (k) => (labels[k] ||= drawLabel(k));
  const wipe = { uWipe: { value: 0 }, map2: { value: labelTex(initial) }, uTime: { value: 0 } };
  const printed = new THREE.MeshPhysicalMaterial({
    map: labelTex(initial), roughness: 0.34, metalness: 0.12,
    clearcoat: 0.85, clearcoatRoughness: 0.09,
  });
  printed.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, wipe);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D map2;\nuniform float uWipe;\nuniform float uTime;')
      .replace('#include <map_fragment>', `
        #ifdef USE_MAP
          vec4 texA = texture2D( map, vMapUv );
          vec4 texB = texture2D( map2, vMapUv );
          // New colour rises from the bottom like water filling the tube, with a soft wavy edge.
          float edge = uWipe * 1.12 - 0.06 + 0.014 * sin( vMapUv.x * 6.2831853 * 3.0 + uTime * 2.4 );
          float m = 1.0 - smoothstep( edge - 0.006, edge + 0.006, vMapUv.y );
          diffuseColor *= mix( texA, texB, m );
        #endif`);
  };
  printed.customProgramCacheKey = () => 'upwich-label';

  const brush = brushed();
  brush.repeat.set(1, 1);
  const alu = new THREE.MeshStandardMaterial({ color: '#d9dcdd', metalness: 1, roughness: 0.3, roughnessMap: brush });
  const aluInner = new THREE.MeshStandardMaterial({ color: '#b9bcbd', metalness: 1, roughness: 0.45, side: THREE.DoubleSide });
  const capMat = new THREE.MeshPhysicalMaterial({ color: '#f5f4ef', roughness: 0.48, metalness: 0, sheen: 0.4, sheenRoughness: 0.6, sheenColor: new THREE.Color('#ffffff') });
  const springMat = new THREE.MeshStandardMaterial({ color: '#e9ecee', metalness: 1, roughness: 0.22 });

  const tabletTex = drawTablet(initial);
  const bump = tabletBump();
  const tabletMat = new THREE.MeshStandardMaterial({ map: tabletTex, bumpMap: bump, bumpScale: 3, roughness: 0.9, metalness: 0, envMapIntensity: 0.55 });

  // ---- Tube ---------------------------------------------------------------------
  const tube = new THREE.Group();
  tube.name = 'tube';
  root.add(tube);

  const labelGeo = new THREE.CylinderGeometry(R, R, LABEL_H, 128, 1, true, Math.PI / 2);
  const label = new THREE.Mesh(labelGeo, printed);
  label.position.y = LABEL_Y0 + LABEL_H / 2;
  tube.add(label);

  // Bottom: a rolled base, drawn in plain aluminium.
  const base = lathe([[0, 0.02], ...arc(R - 0.22, 0.22, 0.22, -Math.PI / 2, 0, 8), [R, LABEL_Y0 + 0.001]], 96);
  tube.add(new THREE.Mesh(base, alu));

  // Top band and rolled lip, then down the inside to the floor.
  const top = lathe([
    [R, LABEL_Y0 + LABEL_H - 0.001], [R, TOP - 0.1],
    ...arc(R - 0.05, TOP - 0.1, 0.05, 0, Math.PI / 2, 4),
    ...arc(R - 0.08, TOP - 0.06, 0.03, Math.PI / 2, Math.PI, 3),
  ], 96);
  tube.add(new THREE.Mesh(top, alu));
  const inner = lathe([[R - 0.11, TOP - 0.06], [R - 0.11, FLOOR], [0, FLOOR]], 64);
  tube.add(new THREE.Mesh(inner, aluInner));

  // ---- Cap ----------------------------------------------------------------------
  const cap = new THREE.Group();
  cap.name = 'cap';
  tube.add(cap);
  const capProfile = [
    [0, -0.92], [1.3, -0.92], ...arc(1.3, -0.84, 0.08, -Math.PI / 2, 0, 3), [1.38, -0.12], [1.42, -0.05], [1.44, 0],
    [1.62, 0], [1.64, 0.06], [1.64, 1.38], ...arc(1.5, 1.38, 0.14, 0, Math.PI / 2, 6), [0.9, 1.56], [0, 1.6],
  ];
  const capGeo = lathe(capProfile, 240);
  // Grip ribs round the skirt.
  const pos = capGeo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const r = Math.hypot(v.x, v.z);
    if (r > 1.6 && v.y > 0.16 && v.y < 1.3) {
      const a = Math.atan2(v.x, v.z);
      const band = smooth(0.16, 0.3, v.y) * (1 - smooth(1.16, 1.3, v.y));
      const rib = Math.pow(0.5 + 0.5 * Math.cos(a * 60), 3);
      const k = (r + 0.05 * rib * band) / r;
      pos.setXYZ(i, v.x * k, v.y, v.z * k);
    }
  }
  capGeo.computeVertexNormals();
  const capMesh = new THREE.Mesh(capGeo, capMat);
  cap.add(capMesh);

  // Spring under the cap, which stretches out as the cap comes off.
  const helix = [];
  const turns = 6;
  for (let i = 0; i <= turns * 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    helix.push(new THREE.Vector3(Math.cos(a) * 0.82, -(i / (turns * 32)), Math.sin(a) * 0.82));
  }
  const springGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helix), turns * 48, 0.05, 6, false);
  const spring = new THREE.Mesh(springGeo, springMat);
  spring.position.y = -0.9;
  cap.add(spring);

  // ---- Tablets in the tube ---------------------------------------------------------
  const tabletGeo = lathe([
    [0, -T / 2], [RT - 0.14, -T / 2 + 0.008], ...arc(RT - 0.1, -T / 2 + 0.1, 0.1, -Math.PI / 2, 0, 5),
    [RT, T / 2 - 0.1], ...arc(RT - 0.1, T / 2 - 0.1, 0.1, 0, Math.PI / 2, 5), [RT - 0.14, T / 2 - 0.008], [0, T / 2],
  ], 64);
  // Planar UVs, so the face texture and the debossed mark sit flat on both faces.
  const tp = tabletGeo.attributes.position, tuv = tabletGeo.attributes.uv;
  for (let i = 0; i < tp.count; i++) tuv.setXY(i, tp.getX(i) / (RT * 2) + 0.5, tp.getZ(i) / (RT * 2) + 0.5);

  const tablets = [];
  for (let i = 0; i < COUNT; i++) {
    const m = new THREE.Mesh(tabletGeo, tabletMat);
    const y = FLOOR + T / 2 + i * T;
    m.position.y = y;
    m.rotation.y = i * 1.7;
    tube.add(m);
    tablets.push({ mesh: m, y, spin: i * 1.7 });
  }

  // ---- Glass of water ------------------------------------------------------------
  const glass = new THREE.Group();
  glass.name = 'glass';
  root.add(glass);
  const rIn = (y) => lerp(2.62, 3.08, (y - 0.85) / (GLASS_H - 0.85));
  const glassProfile = [
    [0, 0], [2.6, 0], ...arc(2.62, 0.14, 0.14, -Math.PI / 2, 0, 4), [3.2, GLASS_H - 0.04],
    ...arc(3.14, GLASS_H - 0.04, 0.06, 0, Math.PI, 5), [rIn(GLASS_H - 0.1), GLASS_H - 0.1], [rIn(0.86), 0.86],
    ...arc(rIn(0.86) - 0.14, 0.86, 0.14, 0, -Math.PI / 2, 4), [0, GLASS_BASE],
  ];
  const glassGeo = lathe(glassProfile, 96);

  // Clear glass on a light page: mostly reflection, with darker, denser edges.
  function glassMaterial(side) {
    const m = new THREE.MeshPhysicalMaterial({
      color: '#ffffff', metalness: 0, roughness: 0.03, transparent: true, opacity: 0.035,
      envMapIntensity: 0.9, side, depthWrite: false, specularIntensity: 1, ior: 1.5,
    });
    m.userData.on = { value: 1 };
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uOn = m.userData.on;
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uOn;')
        .replace('#include <opaque_fragment>', `
          float fres = pow( 1.0 - saturate( abs( dot( normalize( normal ), normalize( vViewPosition ) ) ) ), 2.2 );
          vec3 edgeTint = vec3( 0.36, 0.46, 0.48 );
          outgoingLight = mix( outgoingLight, edgeTint, fres * 0.7 );
          float a = mix( diffuseColor.a, 0.7, fres * fres ) * uOn;
          gl_FragColor = vec4( outgoingLight, a );`);
    };
    m.customProgramCacheKey = () => 'upwich-glass-' + side;
    return m;
  }
  const glassBack = new THREE.Mesh(glassGeo, glassMaterial(THREE.BackSide));
  glassBack.renderOrder = 2;
  const glassFront = new THREE.Mesh(glassGeo, glassMaterial(THREE.FrontSide));
  glassFront.renderOrder = 6;
  glass.add(glassBack, glassFront);

  const waterGeo = lathe([[0, GLASS_BASE + 0.01], [rIn(0.86) - 0.12, GLASS_BASE + 0.01], [rIn(0.95) - 0.02, 0.95], [rIn(WATER) - 0.02, WATER], [0, WATER]], 96);
  const clearWater = new THREE.Color('#c6dfe2');
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: clearWater.clone(), roughness: 0.06, metalness: 0, transparent: true, opacity: 0.16,
    depthWrite: false, envMapIntensity: 0.35, side: THREE.FrontSide,
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.renderOrder = 4;
  glass.add(water);
  const waterBackMat = waterMat.clone();
  waterBackMat.side = THREE.BackSide;
  const waterBack = new THREE.Mesh(waterGeo, waterBackMat);
  waterBack.renderOrder = 3;
  glass.add(waterBack);

  const foamMat = new THREE.MeshBasicMaterial({ map: foam(), transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const foamMesh = new THREE.Mesh(new THREE.CircleGeometry(rIn(WATER) - 0.04, 64).rotateX(-Math.PI / 2), foamMat);
  foamMesh.position.y = WATER + 0.01;
  foamMesh.renderOrder = 5;
  glass.add(foamMesh);

  // The tablet that drops in. Its own material so it can fade as it goes.
  const looseMat = tabletMat.clone();
  const loose = new THREE.Mesh(tabletGeo, looseMat);
  loose.visible = false;
  glass.add(loose);

  // Bubbles: instanced spheres rising from the tablet.
  const NB = 240;
  const bubbleMat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.02, metalness: 0, transparent: true, opacity: 0.7, envMapIntensity: 2.2, depthWrite: false });
  const bubbles = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), bubbleMat, NB);
  bubbles.renderOrder = 5;
  bubbles.frustumCulled = false;
  glass.add(bubbles);
  let seed = 17;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const B = Array.from({ length: NB }, (_, i) => ({
    a: rnd() * Math.PI * 2, r: Math.sqrt(rnd()), speed: 2.2 + rnd() * 3.4,
    size: 0.025 + Math.pow(rnd(), 2.4) * 0.1, phase: rnd(), wob: 0.4 + rnd() * 1.2, rank: i / NB,
  }));
  const dummy = new THREE.Object3D();

  // Simple blob shadow for the glass (the contact shadow skips transparent things).
  const blobC = document.createElement('canvas');
  blobC.width = blobC.height = 128;
  const bctx = blobC.getContext('2d');
  const g = bctx.createRadialGradient(64, 64, 20, 64, 64, 64);
  g.addColorStop(0, 'rgba(19,35,45,.32)'); g.addColorStop(0.62, 'rgba(19,35,45,.14)'); g.addColorStop(1, 'rgba(19,35,45,0)');
  bctx.fillStyle = g; bctx.fillRect(0, 0, 128, 128);
  const blobMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(blobC), transparent: true, depthWrite: false, toneMapped: false });
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 8.4).rotateX(-Math.PI / 2), blobMat);
  blob.position.y = 0.01;
  blob.renderOrder = 1;
  glass.add(blob);

  // ---- State setters -------------------------------------------------------------------
  const capHome = new THREE.Vector3(0, TOP, 0);
  const capAway = new THREE.Vector3(-3.1, 12.6, 1.4);

  function layoutTube() {
    const o = smoother(Math.min(1, Math.max(0, state.open)));
    cap.position.lerpVectors(capHome, capAway, o);
    cap.position.y += Math.sin(o * Math.PI) * 1.6;            // a lift before it swings away
    cap.rotation.order = 'YXZ';
    cap.rotation.set(-1.15 * o, (state.capYaw || 0) * o, 0.42 * o);
    spring.scale.y = lerp(0.08, 1.15, smooth(0.05, 0.5, o));
    spring.visible = o > 0.01;

    // Tablets only come out once the cap is clear.
    const f = Math.min(Math.max(0, state.fan), smooth(0.3, 0.85, state.open));
    tablets.forEach((t, i) => {
      const j = i - (COUNT - FAN);                              // 0..6 for the fanned ones
      if (j < 0) { t.mesh.position.set(0, t.y, 0); t.mesh.rotation.set(0, t.spin, 0); return; }
      // Top tablets leave first.
      const p = smoother(smooth((FAN - 1 - j) * 0.06, (FAN - 1 - j) * 0.06 + 0.62, f));
      const up = smooth(0, 0.45, p), out = smooth(0.25, 1, p);
      const ty = TOP + 0.85 + j * 0.8;
      const tx = Math.sin(j * 0.55 + 0.35) * 1.6 + 0.7;
      const tz = 0.5 + j * 0.12;
      // First the column slides up until the lowest fanned tablet clears the lip,
      // then each one swings out to its place in the fan.
      const lift = TOP + 0.55 - (FLOOR + T / 2 + (COUNT - FAN) * T);
      t.mesh.position.set(tx * out, lerp(t.y + lift * up, ty, out), tz * out);
      t.mesh.rotation.set(0.98 * out, t.spin + j * 0.25 * out, (-0.32 + j * 0.09) * out);
    });
  }

  function layoutGlass(dt, live) {
    if (live) state.time += dt;
    const d = Math.min(1, Math.max(0, state.drop));
    const z = Math.min(1, Math.max(0, state.fizz));
    // Falling: accelerate in air, slow in the water, settle on the base.
    const air = smooth(0, 0.55, d), wet = smooth(0.55, 1, d);
    const yAir = lerp(17.5, WATER, air * air);
    const y = d < 0.55 ? yAir : lerp(WATER, GLASS_BASE + T / 2 + 0.02, 1 - Math.pow(1 - wet, 2));
    const dissolve = smooth(0, 1, z);
    loose.visible = d > 0.001 && dissolve < 0.985;
    loose.position.set(0.35 * (1 - wet), y, -0.2 * wet);
    loose.rotation.set(lerp(1.1, 0.06, wet) + (1 - d) * 2.4, d * 3.2, lerp(-0.5, 0.04, wet));
    const s = 1 - 0.86 * dissolve;
    loose.scale.set(s, Math.max(0.12, 1 - dissolve), s);
    looseMat.opacity = 1;

    // Water takes on the flavour as the tablet dissolves.
    waterMat.color.copy(clearWater).lerp(state.tint, dissolve);
    waterMat.opacity = lerp(0.16, state.alpha, dissolve);
    waterBackMat.color.copy(waterMat.color);
    waterBackMat.opacity = waterMat.opacity * 0.85;

    // Fizz activity: starts when the tablet hits the water, peaks, then thins out.
    const hit = smooth(0.5, 0.62, d);
    const act = hit * (0.25 + 0.75 * (1 - smooth(0.15, 1, z))) * (z > 0.995 ? 0.15 : 1) + hit * 0.04;
    foamMat.opacity = hit * 0.85 * (1 - smooth(0.55, 1, z)) * (0.6 + 0.4 * (1 - z));
    const tr = RT * s * 0.9;
    const t = state.time;
    for (let i = 0; i < NB; i++) {
      const b = B[i];
      const on = b.rank < act;
      if (!on) { dummy.scale.setScalar(0); dummy.position.set(0, -10, 0); dummy.updateMatrix(); bubbles.setMatrixAt(i, dummy.matrix); continue; }
      const span = WATER - (GLASS_BASE + 0.3);
      const k = ((t * b.speed) / span + b.phase) % 1;
      const yy = GLASS_BASE + 0.3 + k * span;
      const spread = tr * b.r + k * 1.4 * b.r;
      const wob = Math.sin(t * 6 * b.wob + b.phase * 20) * 0.08 * k;
      const lim = rIn(yy) - 0.25;
      const rr = Math.min(spread + wob, lim);
      dummy.position.set(Math.cos(b.a) * rr + loose.position.x * (1 - k), yy, Math.sin(b.a) * rr + loose.position.z * (1 - k));
      const grow = b.size * (0.6 + 0.6 * k);
      dummy.scale.setScalar(grow);
      dummy.updateMatrix();
      bubbles.setMatrixAt(i, dummy.matrix);
    }
    bubbles.instanceMatrix.needsUpdate = true;
  }

  function setGlassOn(on) {
    const o = Math.min(1, Math.max(0, on));
    glass.visible = o > 0.003;
    glassBack.material.userData.on.value = o;
    glassFront.material.userData.on.value = o;
    blobMat.opacity = o;
  }

  // ---- Flavour change: the tube fills with the new colour from the bottom ------------
  let pending = null;
  function beginFlavour(to) {
    pending = to;
    wipe.map2.value = labelTex(to);
  }
  function setWipe(p, from, to) {
    wipe.uWipe.value = p;
    if (p >= 1) {
      printed.map = labelTex(to);
      wipe.map2.value = printed.map;
      wipe.uWipe.value = 0;
      pending = null;
    }
  }
  function setFlavourInstant(key) {
    state.flavour = key;
    printed.map = labelTex(key);
    wipe.map2.value = printed.map;
    wipe.uWipe.value = 0;
    drawTablet(key, tabletTex);
    looseMat.map = tabletTex;
    state.tint.set(FLAVOURS[key].water);
    state.alpha = FLAVOURS[key].waterAlpha;
  }
  function setTablets(key) {
    drawTablet(key, tabletTex);
  }

  // Pre-draw the other labels so a change never stalls.
  Object.keys(FLAVOURS).forEach(labelTex);

  layoutTube();
  layoutGlass(0, false);

  return {
    root, tube, cap, glass, tablets, bubbles, glassParts: [glassBack, glassFront, water, waterBack, foamMesh, bubbles, blob],
    state, labels,
    update(dt, live) {
      wipe.uTime.value += live ? dt : 0;
      layoutTube();
      layoutGlass(dt, live);
    },
    setGlassOn, beginFlavour, setWipe, setFlavourInstant, setTablets,
    get pending() { return pending; },
  };
}
