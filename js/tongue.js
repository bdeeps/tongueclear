// TongueClear's 3D mouth: a stylised but anatomically placed human tongue with its four kinds of
// papillae, the muscles that move it, its taste and movement nerves, the teeth, palate, epiglottis,
// hyoid bone and the three pairs of salivary glands. Also small shared helpers (labels, boards,
// readouts on phones, instanced dots running along paths).
//
// Axes: the person faces +z (towards you in the first view), +y is up, +x is the person's LEFT
// (so, facing them, their left is on your right, as a doctor sees it). One model unit is about
// 1 cm: the tongue is about 10 cm from tip to the V of circumvallate papillae plus its root.
// Anatomy: Gray's Anatomy (41st ed.), "Oral cavity"; NCBI StatPearls "Anatomy, Head and Neck,
// Tongue" (Sanders & Mu), "Salivary glands"; NIDCD "Taste disorders".
//  - The dorsum is split by a V-shaped groove, the sulcus terminalis, whose point (foramen caecum)
//    faces the throat. The 8–12 circumvallate papillae sit in a row just in front of it.
//  - In front of the V (the oral two-thirds): filiform papillae everywhere (touch, no taste buds),
//    fungiform papillae scattered most thickly on the tip and edges, foliate folds at the back of
//    the sides. Behind it (the pharyngeal third): the bumps of the lingual tonsil.
//  - Taste: facial nerve VII (chorda tympani, riding with the lingual nerve) for the front
//    two-thirds; glossopharyngeal IX for the back third and circumvallate papillae; vagus X for the
//    epiglottis and throat. Movement: hypoglossal XII for all tongue muscles but palatoglossus (X).
//  - Four extrinsic muscles move the tongue as a whole (genioglossus from the chin, hyoglossus from
//    the hyoid, styloglossus from the skull's styloid process, palatoglossus from the soft palate);
//    four intrinsic ones (superior and inferior longitudinal, transverse, vertical) change its shape.
//  - Salivary glands: the parotid in front of the ear drains by Stensen's duct opposite the upper
//    second molar; the submandibular under the jaw by Wharton's duct beside the frenulum under the
//    tongue; the sublingual under the floor of the mouth by many small ducts.
import { THREE, M, tube, clamp, lerp, smooth } from './kit.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// ---------------------------------------------------------------- small helpers
export const rng = (seed = 1) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const TINT = { gold: '#ffd166', green: '#7ef0b0', violet: '#c9a5ff', blue: '#8fb0ff', red: '#ff8a94', pink: '#ff9ec0', side: '#8ef0ff', gland: '#f3cf7a', orange: '#ffb547', yellow: '#ffe08a' };
export function tint(l, cls) { const c = TINT[cls] || cls; if (c && c.startsWith?.('#')) { l.element.style.borderColor = c; l.element.style.color = c; } return l; }

// On phones the readout covers the model, so keep only its headline and two rows (as HeartClear).
export function compactReadout(stage, api) {
  const full = api.readout; if (!full) return api;
  api.readout = (s) => {
    const html = full(s);
    if (stage.host.clientWidth >= 560 || !html) return html;
    let rows = 0;
    return html.replace(/<small>[\s\S]*?<\/small>/g, '').replace(/<div class="row">[\s\S]*?<\/div>/g, (m) => (++rows <= 2 ? m : ''));
  };
  return api;
}
export function fitNarrow(stage, view) {
  let done = false;
  return () => {
    const narrow = stage.host.clientWidth < 560;
    if (narrow && view && !done && !stage.moved && !document.body.classList.contains('gb-reel')) { stage.setView(view.pos, view.target, 0.01); done = true; }
    return narrow;
  };
}

// A flat board with a live canvas chart.
export function board(parent, w, h, px, draw) {
  const c = document.createElement('canvas'); c.width = px; c.height = Math.round((px * h) / w);
  const g = c.getContext('2d'), tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
  parent.add(mesh);
  const redraw = (...a) => { draw(g, c.width, c.height, ...a); tex.needsUpdate = true; };
  return { mesh, redraw, canvas: c };
}
export const boardBg = (g, w, h, title) => {
  g.clearRect(0, 0, w, h);
  g.fillStyle = 'rgba(10,12,18,.92)'; g.beginPath(); g.roundRect(0, 0, w, h, 22); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 2; g.stroke();
  if (title) { g.fillStyle = '#e8eef8'; g.font = 'bold 30px sans-serif'; g.fillText(title, 28, 48); }
};

// A polyline sampled by arc length.
export function pathOf(points) {
  const P = points.map((p) => (p.isVector3 ? p.clone() : new THREE.Vector3(...p)));
  const L = [0];
  for (let i = 1; i < P.length; i++) L.push(L[i - 1] + P[i].distanceTo(P[i - 1]));
  const total = L[L.length - 1];
  return {
    points: P, total,
    at(u, out = new THREE.Vector3()) {
      const d = clamp(u, 0, 1) * total;
      let lo = 0, hi = L.length - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m] <= d) lo = m; else hi = m; }
      return out.copy(P[lo]).lerp(P[hi], (d - L[lo]) / Math.max(1e-9, L[hi] - L[lo]));
    },
  };
}
export const smoothPts = (pts, n = 48) => new THREE.CatmullRomCurve3(pts.map((p) => (p.isVector3 ? p.clone() : new THREE.Vector3(...p)))).getPoints(n);

// Glowing dots that run along a set of paths (nerve signals). dir +1 runs from the first point.
export function pulses(parent, paths, { color = 0xffffff, size = 0.09, per = 4, speed = 0.35 } = {}) {
  const n = paths.length * per;
  const m = new THREE.InstancedMesh(new THREE.SphereGeometry(size, 8, 6), M.glow(color), n);
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; parent.add(m);
  const o = new THREE.Object3D(), p = new THREE.Vector3();
  m.tick = (time, rate = 1, dir = 1) => {
    let i = 0;
    paths.forEach((path, pi) => {
      for (let k = 0; k < per; k++) {
        let u = ((time * speed + k / per + pi * 0.37) % 1);
        if (dir < 0) u = 1 - u;
        path.at(u, p); o.position.copy(p);
        o.scale.setScalar(rate > 0 ? clamp(rate, 0.2, 1.4) : 0); o.updateMatrix(); m.setMatrixAt(i++, o.matrix);
      }
    });
    m.instanceMatrix.needsUpdate = true;
  };
  return m;
}

// Instanced mesh with a place(i, position, quaternion, scaleVec) helper.
export function inst(geo, mat, n) {
  const m = new THREE.InstancedMesh(geo, mat, n);
  m.castShadow = true; m.receiveShadow = true;
  const o = new THREE.Object3D();
  m.put = (i, pos, quat, sc) => { o.position.copy(pos); if (quat) o.quaternion.copy(quat); else o.quaternion.identity(); if (sc) o.scale.copy(sc); else o.scale.set(1, 1, 1); o.updateMatrix(); m.setMatrixAt(i, o.matrix); };
  return m;
}
const UP = new THREE.Vector3(0, 1, 0);
const qUp = (n) => new THREE.Quaternion().setFromUnitVectors(UP, n.clone().normalize());

// Sweep a closed 2D profile along a path. profile(t) returns [[x, y], ...] in the path's local
// frame, where x is sideways (horizontal, perpendicular to the path) and y is up.
export function sweep(path, profile, mat) {
  const n = path.length, ring = profile(0).length, pos = [], idx = [];
  for (let i = 0; i < n; i++) {
    const a = path[Math.max(0, i - 1)], b = path[Math.min(n - 1, i + 1)];
    const T = b.clone().sub(a).normalize(), S = new THREE.Vector3().crossVectors(T, UP).normalize();
    if (S.lengthSq() < 1e-6) S.set(1, 0, 0);
    const U = new THREE.Vector3().crossVectors(S, T).normalize();
    profile(i / (n - 1)).forEach(([x, y]) => { const p = path[i].clone().addScaledVector(S, x).addScaledVector(U, y); pos.push(p.x, p.y, p.z); });
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < ring; j++) {
    const a = i * ring + j, b = i * ring + ((j + 1) % ring), c = a + ring, d = b + ring;
    idx.push(a, c, b, b, c, d);
  }
  // cap both ends with a fan
  [0, n - 1].forEach((i, e) => {
    const c = new THREE.Vector3(); for (let j = 0; j < ring; j++) c.add(new THREE.Vector3(pos[(i * ring + j) * 3], pos[(i * ring + j) * 3 + 1], pos[(i * ring + j) * 3 + 2]));
    c.multiplyScalar(1 / ring); const ci = pos.length / 3; pos.push(c.x, c.y, c.z);
    for (let j = 0; j < ring; j++) { const a = i * ring + j, b = i * ring + ((j + 1) % ring); e ? idx.push(ci, a, b) : idx.push(ci, b, a); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true;
  return m;
}
// A rounded-rectangle profile, w wide and h tall, centred at [0, cy].
export const rrect = (w, h, cy = 0, k = 10) => { const pts = []; for (let i = 0; i < k * 4; i++) { const t = (i / (k * 4)) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t); pts.push([(w / 2) * Math.sign(c) * Math.abs(c) ** 0.45, cy + (h / 2) * Math.sign(s) * Math.abs(s) ** 0.45]); } return pts; };

// Sample a parabola-shaped dental arch z = z0 − k·x², x from −xe to xe, at y.
export const arch = (z0, k, xe, y, n = 40) => { const pts = []; for (let i = 0; i <= n; i++) { const x = -xe + (2 * xe * i) / n; pts.push(new THREE.Vector3(x, y, z0 - k * x * x)); } return pts; };

// Lumpy lobes for a gland: lots of small spheres packed into an ellipsoid.
function gland(center, size, n, mat, seed) {
  const r = rng(seed), m = inst(new THREE.IcosahedronGeometry(1, 2), mat, n);
  for (let i = 0; i < n; i++) {
    let v; do { v = new THREE.Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1); } while (v.lengthSq() > 1);
    const s = (0.32 + r() * 0.2) * Math.min(size[0], size[1], size[2]) * 1.15;
    m.put(i, new THREE.Vector3(v.x * size[0] * 0.78, v.y * size[1] * 0.78, v.z * size[2] * 0.78), null, new THREE.Vector3(s, s, s));
  }
  m.position.set(...center);
  return m;
}

// ---------------------------------------------------------------- the tongue surface
// A centre line from the root (deep in the throat) to the tip, and a cross-section that changes
// along it. a runs 0 (root) → 1 (tip); θ runs around the cross-section; u (−1…1) runs across the
// top from the person's right edge to the left edge.
const CL = new THREE.CatmullRomCurve3([[0, -3.7, -4.25], [0, -2.4, -4.35], [0, -1.1, -3.85], [0, -0.2, -2.75], [0, 0.22, -1.1], [0, 0.32, 0.9], [0, 0.2, 2.9], [0, 0.0, 4.5]].map((p) => new THREE.Vector3(...p)));
const NA = 120, NT = 56;
const BASE = []; for (let i = 0; i <= NA; i++) { const a = i / NA, T = CL.getTangentAt(a); BASE.push({ a, C: CL.getPointAt(a), N: new THREE.Vector3().crossVectors(T, new THREE.Vector3(1, 0, 0)).normalize() }); }
export const V_APEX = 0.33;                        // the point of the sulcus terminalis (foramen caecum)
export const vLine = (u) => V_APEX + 0.11 * Math.abs(u); // the V: its arms run forwards and outwards
const sgnpow = (v, p) => Math.sign(v) * Math.abs(v) ** p;

export function section(a) {
  const tip = clamp((1 - a) / 0.13, 0, 1), root = clamp(a / 0.1, 0, 1);
  const rt = Math.sqrt(1 - (1 - tip) ** 2), rr = Math.sqrt(1 - (1 - root) ** 2);
  const W = (a < 0.42 ? lerp(1.5, 2.05, smooth(a / 0.42)) : lerp(2.05, 1.3, smooth((a - 0.42) / 0.5))) * rt * rr;
  const H = lerp(0.95, 0.45, smooth((a - 0.55) / 0.45)) * rt * rr;
  const D = lerp(1.6, 0.42, smooth((a - 0.3) / 0.62)) * rt * rr;
  return { W, H, D };
}
// Pose: how the tongue is bent for speech and swallowing. All 0 = resting.
//  tip: tip curled up to the ridge behind the upper teeth (t, d, l); front: front raised (ee);
//  back: back raised to the soft palate (k, g); low: lowered and flat (aa); wave: 0–1 position of
//  a squeeze that travels from tip to back (swallowing).
export const REST = { tip: 0, front: 0, back: 0, low: 0, wave: -1 };
const bump = (a, c, w) => Math.exp(-(((a - c) / w) ** 2));
function lift(a, p) {
  let y = p.tip * smooth((a - 0.72) / 0.22) * 2.0 + p.front * bump(a, 0.72, 0.13) * 1.7 + p.back * bump(a, 0.45, 0.1) * 2.3 - p.low * smooth((a - 0.35) / 0.35) * 1.0;
  if (p.wave >= 0) { const c = lerp(0.92, 0.3, p.wave); y += bump(a, c, 0.09) * 2.0 * Math.sin(Math.PI * clamp(p.wave * 1.2, 0, 1)) - 0.5 * smooth((c - a) / 0.2) * (1 - p.wave); }
  return y;
}
const tmp = new THREE.Vector3();
export function tonguePoint(a, th, p = REST, f = 1, out = new THREE.Vector3()) {
  const i = clamp(a, 0, 1) * NA, i0 = Math.min(NA - 1, Math.floor(i)), k = i - i0, b0 = BASE[i0], b1 = BASE[i0 + 1];
  const C = tmp.copy(b0.C).lerp(b1.C, k), N = b0.N.clone().lerp(b1.N, k).normalize();
  const { W, H, D } = section(a);
  const X = W * sgnpow(Math.cos(th), 0.7) * f, s = Math.sin(th);
  let Y = s >= 0 ? H * s ** 0.45 : -D * (-s) ** 0.85;
  if (s > 0) Y -= 0.12 * Math.exp(-((X / 0.3) ** 2)) * smooth((a - 0.34) / 0.1) * (1 - smooth((a - 0.86) / 0.1));
  Y = Y * f + lift(a, p);
  return out.set(C.x + X, C.y, C.z).addScaledVector(N, Y);
}
export const thOf = (u) => Math.PI / 2 - u * 1.42;
export function dorsum(a, u, p = REST, out = new THREE.Vector3()) { return tonguePoint(a, thOf(u), p, 1, out); }
export function dorsumNormal(a, u, p = REST) {
  const e = 0.004, A = dorsum(a - e, u, p), B = dorsum(a + e, u, p), L = dorsum(a, u - e * 3, p), R = dorsum(a, u + e * 3, p);
  return new THREE.Vector3().crossVectors(R.sub(L), B.sub(A)).normalize().multiplyScalar(-1);
}

export const TONGUE_PINK = 0xd9737c;

// Taste-bud density across the top, 0–1, for the map chapter: many on the tip and edges
// (fungiform), a lot along the V (circumvallate) and on the side folds (foliate), few in the middle
// of the top (only filiform there: the "central area of low sensitivity"), and a few behind the V.
export function budDensity(a, u) {
  const au = Math.abs(u);
  if (a < V_APEX - 0.02) return 0.08;
  const fung = a > vLine(u) ? (0.14 + 0.86 * smooth((a - 0.55) / 0.42) * (0.45 + 0.55 * au ** 1.5) + 0.6 * smooth((au - 0.7) / 0.3)) * (1 - 0.55 * Math.exp(-((u / 0.35) ** 2)) * bump(a, 0.62, 0.16)) : 0;
  const circ = Math.exp(-(((a - vLine(u) - 0.02) / 0.025) ** 2)) * (au < 0.8 ? 1 : 0);
  const fol = smooth((au - 0.82) / 0.14) * bump(a, 0.4, 0.06);
  return clamp(Math.max(fung * 0.8, circ, fol), 0, 1);
}

export function makeTongue(stage, opts = {}) {
  const o = { papillae: true, tonsil: true, ...opts };
  const root = new THREE.Group();
  // mesh
  const g = new THREE.BufferGeometry(), cols = NT + 1;
  const pos = new Float32Array((NA + 1) * cols * 3), col = new Float32Array((NA + 1) * cols * 3), uvA = new Float32Array((NA + 1) * cols * 2), idx = [];
  for (let i = 0; i < NA; i++) for (let j = 0; j < NT; j++) { const a = i * cols + j, b = a + 1, c = a + cols, d = c + 1; idx.push(a, b, c, b, d, c); }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uvA, 2)); g.setIndex(idx);
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.55, clearcoat: 0.5, clearcoatRoughness: 0.45, sheen: 0.15, sheenColor: new THREE.Color(0xffc0c8), transparent: true, opacity: 1 });
  const mesh = new THREE.Mesh(g, mat); mesh.castShadow = true; mesh.receiveShadow = true; root.add(mesh);
  let pose = { ...REST };
  const setShape = (p = pose) => {
    pose = { ...REST, ...p };
    const v = new THREE.Vector3();
    for (let i = 0; i <= NA; i++) for (let j = 0; j <= NT; j++) {
      const th = -Math.PI / 2 + (2 * Math.PI * j) / NT, a = i / NA;
      tonguePoint(a, th, pose, 1, v); const k = (i * cols + j);
      pos[k * 3] = v.x; pos[k * 3 + 1] = v.y; pos[k * 3 + 2] = v.z;
      uvA[k * 2] = a; uvA[k * 2 + 1] = th;
    }
    g.attributes.position.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere();
    placePapillae();
  };
  // colour every vertex with fn(a, u, isTop) → THREE.Color
  const base = new THREE.Color(TONGUE_PINK), under = new THREE.Color(0xc0606e);
  const paint = (fn) => {
    const c = new THREE.Color();
    for (let k = 0; k < (NA + 1) * cols; k++) {
      const a = uvA[k * 2], th = uvA[k * 2 + 1], s = Math.sin(th), top = s > 0.1;
      const u = clamp((Math.PI / 2 - th) / 1.42, -1.2, 1.2);
      if (fn && top) c.copy(fn(a, u)); else c.copy(top ? base : under.clone().lerp(base, clamp(s + 0.6, 0, 1)));
      col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
    }
    g.attributes.color.needsUpdate = true;
  };

  // papillae
  const r = rng(11), pap = new THREE.Group(); root.add(pap);
  const filiformN = o.papillae ? 2600 : 0, fungN = o.papillae ? 230 : 0;
  const fil = inst(new THREE.ConeGeometry(0.028, 0.1, 5).translate(0, 0.04, 0), M.matte(0xeab2b3), Math.max(1, filiformN));
  const fung = inst(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshStandardMaterial({ color: 0xe0414f, roughness: 0.45 }), Math.max(1, fungN));
  const circMat = new THREE.MeshStandardMaterial({ color: 0xcf5563, roughness: 0.5 });
  const moatMat = M.matte(0x6e2530);
  const circ = inst(new THREE.CylinderGeometry(0.2, 0.23, 0.14, 20), circMat, 9), moat = inst(new THREE.TorusGeometry(0.29, 0.045, 8, 24).rotateX(Math.PI / 2), moatMat, 9);
  const fol = inst(new THREE.BoxGeometry(0.05, 0.22, 0.34), M.matte(0xc9505e), 12);
  const ton = inst(new THREE.SphereGeometry(1, 12, 8), M.matte(0xc86a74), 22);
  pap.add(fil, fung, circ, moat, fol, ton);
  fil.visible = fung.visible = circ.visible = moat.visible = fol.visible = o.papillae; ton.visible = o.papillae && o.tonsil;
  const filAU = [], fungAU = [], circU = [0, -0.18, 0.18, -0.36, 0.36, -0.54, 0.54, -0.72, 0.72];
  for (let i = 0; i < filiformN; i++) { let a, u; do { a = 0.34 + r() * 0.645; u = (r() * 2 - 1) * 0.92; } while (a < vLine(u) + 0.035 || (a > 0.975 && Math.abs(u) > 0.6)); filAU.push([a, u, 0.7 + r() * 0.6]); }
  for (let i = 0; i < fungN; i++) {
    let a, u, ok;
    do { a = 0.42 + (1 - r() ** 1.6) * 0.565; u = (r() * 2 - 1) * 0.93; ok = r() < 0.25 + 0.75 * Math.max(Math.abs(u) ** 1.4, smooth((a - 0.85) / 0.12)); } while (!ok || a < vLine(u) + 0.05);
    fungAU.push([a, u, 0.045 + r() * 0.025]);
  }
  const tonAU = []; for (let i = 0; i < 22; i++) tonAU.push([0.12 + r() * 0.17, (r() * 2 - 1) * 0.75, 0.13 + r() * 0.1]);
  function placePapillae() {
    if (!o.papillae) return;
    const P = new THREE.Vector3();
    filAU.forEach(([a, u, s], i) => { dorsum(a, u, pose, P); const n = dorsumNormal(a, u, pose); fil.put(i, P, qUp(n), new THREE.Vector3(s, s, s)); });
    fungAU.forEach(([a, u, s], i) => { dorsum(a, u, pose, P); const n = dorsumNormal(a, u, pose); P.addScaledVector(n, s * 0.35); fung.put(i, P, qUp(n), new THREE.Vector3(s, s * 0.6, s)); });
    circU.forEach((u, i) => { const a = vLine(u) + 0.022; dorsum(a, u, pose, P); const n = dorsumNormal(a, u, pose); circ.put(i, P.clone().addScaledVector(n, 0.03), qUp(n)); moat.put(i, P.clone().addScaledVector(n, 0.005), qUp(n)); });
    for (let side = 0; side < 2; side++) for (let k = 0; k < 6; k++) { const u = side ? 0.985 : -0.985, a = 0.36 + k * 0.016; dorsum(a, u, pose, P); const n = dorsumNormal(a, u, pose); const q = qUp(n); fol.put(side * 6 + k, P.clone().addScaledVector(n, -0.02), q); }
    tonAU.forEach(([a, u, s], i) => { dorsum(a, u, pose, P); const n = dorsumNormal(a, u, pose); ton.put(i, P, qUp(n), new THREE.Vector3(s, s * 0.55, s)); });
    [fil, fung, circ, moat, fol, ton].forEach((m) => { m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere?.(); });
  }
  // the V groove (sulcus terminalis)
  const vPts = []; for (let k = 0; k <= 30; k++) { const u = -0.82 + (1.64 * k) / 30; vPts.push(dorsum(vLine(u) - 0.008, u).addScaledVector(dorsumNormal(vLine(u), u), 0.01)); }
  const vGroove = tube(vPts, 0.035, M.matte(0x7a2b35), false, 60); pap.add(vGroove); vGroove.visible = o.papillae;

  paint(null); setShape(REST);
  const setOpacity = (k) => { mat.opacity = k; mat.depthWrite = k > 0.6; [fil, fung, circ, moat, fol, ton].forEach((m) => { m.material.transparent = k < 1; m.material.opacity = k; m.material.depthWrite = k > 0.6; }); vGroove.material.transparent = k < 1; vGroove.material.opacity = k; };
  return { root, mesh, mat, pap, fil, fung, circ, fol, ton, setShape, paint, setOpacity, get pose() { return pose; }, filAU, fungAU };
}

// ---------------------------------------------------------------- the mouth
const BONE = 0xece2cc, TOOTH = 0xf7f3ea, GUM = 0xd7848c, MUSCLE = 0xa8404c, GLAND = 0xf0c46a;
export const NERVE = { VII: 0xffd166, IX: 0x7ef0b0, X: 0xc9a5ff, XII: 0x8fb0ff };

// One tooth: incisors are chisel-shaped, canines pointed, premolars and molars blocky.
function toothGeo(kind) {
  if (kind === 'molar') return new RoundedBoxGeometry(0.95, 0.72, 0.95, 3, 0.2);
  if (kind === 'premolar') return new RoundedBoxGeometry(0.72, 0.8, 0.75, 3, 0.2);
  if (kind === 'canine') { const g = new THREE.ConeGeometry(0.34, 1.0, 10); return g; }
  return new RoundedBoxGeometry(0.62, 0.9, 0.28, 2, 0.1);
}
const TEETH = ['incisor', 'incisor', 'canine', 'premolar', 'premolar', 'molar', 'molar', 'molar'];
function teethRow(z0, k, xe, yGum, dir, mat) {
  // place 8 teeth per side along the arch by arc length, from the midline outwards
  const g = new THREE.Group();
  const pts = arch(z0, k, xe, 0, 200).filter((p) => p.x >= 0), L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const W = [0.55, 0.65, 0.75, 0.75, 0.75, 1.05, 1.0, 0.95], tot = W.reduce((a, b) => a + b), sc = L[L.length - 1] / tot;
  let d = 0;
  TEETH.forEach((kind, i) => {
    const mid = (d + W[i] / 2) * sc; d += W[i];
    let j = 0; while (j < L.length - 1 && L[j] < mid) j++;
    const p = pts[j], t = pts[Math.min(pts.length - 1, j + 1)].clone().sub(pts[Math.max(0, j - 1)]).normalize();
    [1, -1].forEach((sx) => {
      const m = new THREE.Mesh(toothGeo(kind), mat); m.castShadow = true;
      const h = kind === 'canine' ? 1.0 : kind === 'incisor' ? 0.9 : kind === 'premolar' ? 0.8 : 0.72;
      m.position.set(p.x * sx, yGum + dir * h / 2, p.z);
      m.rotation.y = Math.atan2(t.x * sx, t.z);
      if (kind === 'canine' && dir < 0) m.rotation.x = Math.PI;
      m.scale.x = (W[i] * sc) / (kind === 'molar' ? 0.95 : kind === 'premolar' ? 0.72 : kind === 'canine' ? 0.68 : 0.62) * 0.92;
      m.userData.kind = kind;
      g.add(m);
    });
  });
  return g;
}

// A curved sheet over (x, z): half-width w(z), height y(x, z). Used for the palate.
function sheet(z0, z1, w, y, mat, nx = 24, nz = 30) {
  const pos = [], idx = [];
  for (let i = 0; i <= nz; i++) for (let j = 0; j <= nx; j++) { const z = lerp(z0, z1, i / nz), s = -1 + (2 * j) / nx, x = s * w(z); pos.push(x, y(s, z), z); }
  for (let i = 0; i < nz; i++) for (let j = 0; j < nx; j++) { const a = i * (nx + 1) + j, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m;
}

export function makeMouth(stage, opts = {}) {
  const o = { labels: true, ...opts };
  const root = new THREE.Group();
  const labels = [];
  const lab = (html, pos, parent, cls, when = 'both', short = false) => { const l = tint(stage.label(html, pos, parent), cls); l.userData = { when, short }; labels.push(l); return l; };

  // tongue
  const tg = makeTongue(stage); root.add(tg.root);

  // ---- lower jaw: mandible body along the arch, the two rami, and the lower teeth
  const low = new THREE.Group(); root.add(low);
  const boneMat = new THREE.MeshStandardMaterial({ color: BONE, roughness: 0.7, transparent: true, opacity: 1 });
  const bodyPath = arch(5.2, 0.86, 2.95, -0.75, 60);
  const mand = sweep(bodyPath, (t) => rrect(0.75 + 0.2 * Math.abs(t - 0.5), 2.1, 0, 8), boneMat); low.add(mand);
  [1, -1].forEach((sx) => {
    const ramus = sweep([new THREE.Vector3(2.98 * sx, -1.3, -2.35), new THREE.Vector3(3.15 * sx, 1.4, -2.9), new THREE.Vector3(3.3 * sx, 4.3, -3.4)], (t) => rrect(0.45, lerp(2.2, 1.3, t), 0, 6).map(([x, y]) => [y, x]), boneMat);
    low.add(ramus);
  });
  const gumMat = new THREE.MeshStandardMaterial({ color: GUM, roughness: 0.6, transparent: true, opacity: 1 });
  const lowGum = sweep(arch(5.0, 0.86, 2.7, 0.3, 50), () => rrect(0.95, 0.45, 0, 6), gumMat); low.add(lowGum);
  const toothMat = new THREE.MeshPhysicalMaterial({ color: TOOTH, roughness: 0.25, clearcoat: 0.8, transparent: true, opacity: 1 });
  const lowTeeth = teethRow(5.0, 0.86, 2.6, 0.45, 1, toothMat); low.add(lowTeeth);

  // ---- upper jaw: gum, teeth, hard palate, soft palate and uvula
  // the upper jaw hangs from a hinge near the jaw joints, so "opening up" swings it up and back
  const upPivot = new THREE.Group(); upPivot.position.set(0, 4.4, -3.6); root.add(upPivot);
  const up = new THREE.Group(); up.position.set(0, -4.4, 3.6); upPivot.add(up);
  const upGum = sweep(arch(5.3, 0.84, 2.8, 4.15, 50), () => rrect(1.0, 0.55, 0, 6), gumMat); up.add(upGum);
  const upTeeth = teethRow(5.3, 0.84, 2.7, 3.95, -1, toothMat); up.add(upTeeth);
  const palMat = new THREE.MeshPhysicalMaterial({ color: 0xe0949b, roughness: 0.5, clearcoat: 0.4, side: THREE.DoubleSide, transparent: true, opacity: 0.55, depthWrite: false });
  const wUp = (z) => Math.max(0.2, Math.sqrt(Math.max(0, (5.3 - z) / 0.84)) - 0.5);
  const hard = sheet(-1.25, 4.7, wUp, (s, z) => 4.35 + 1.15 * (1 - s * s) ** 0.8 * clamp((4.9 - z) / 2.6, 0, 1) ** 0.6, palMat); up.add(hard);
  const soft = sheet(-4.1, -1.25, (z) => lerp(1.25, wUp(-1.25), (z + 4.1) / 2.85), (s, z) => lerp(4.3, 5.5, smooth((z + 4.1) / 2.85)) - 0.55 * s * s, palMat); up.add(soft);
  const uvula = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.75, 6, 12), new THREE.MeshStandardMaterial({ color: 0xd9848c, roughness: 0.5 })); uvula.position.set(0, 3.8, -4.15); uvula.rotation.x = 0.15; up.add(uvula);

  // ---- throat: epiglottis and hyoid bone
  const thr = new THREE.Group(); root.add(thr);
  const epiMat = new THREE.MeshStandardMaterial({ color: 0xeaa7a0, roughness: 0.5, side: THREE.DoubleSide, transparent: true, opacity: 1 });
  const epi = sheet(0, 1, (t) => 0.9 * Math.sin(Math.PI * (0.12 + 0.85 * t)) ** 0.7 + 0.05, (s, t) => 0, epiMat, 16, 20);
  { const p = epi.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), t = p.getZ(i); p.setXYZ(i, x, -3.65 + 2.5 * t, -5.35 - 0.45 * t + 0.28 * x * x); } p.needsUpdate = true; epi.geometry.computeVertexNormals(); }
  thr.add(epi);
  const hyoid = sweep(arch(-3.2, 0.5, 1.9, -4.3, 30), () => rrect(0.32, 0.45, 0, 6), boneMat); thr.add(hyoid);

  // ---- salivary glands (both sides) and their ducts
  const glandMat = new THREE.MeshStandardMaterial({ color: GLAND, roughness: 0.55, transparent: true, opacity: 1 });
  const ductMat = new THREE.MeshStandardMaterial({ color: 0xf6dc9a, roughness: 0.4, transparent: true, opacity: 1 });
  const glands = { parotid: new THREE.Group(), submand: new THREE.Group(), subling: new THREE.Group() };
  Object.values(glands).forEach((gg) => root.add(gg));
  [1, -1].forEach((sx, si) => {
    glands.parotid.add(gland([4.05 * sx, 2.4, -3.7], [0.65, 1.5, 1.05], 46, glandMat, 3 + si));
    glands.parotid.add(tube([[3.95 * sx, 3.0, -2.8], [4.1 * sx, 3.35, -1.7], [3.7 * sx, 3.7, -0.8], [3.15 * sx, 3.75, -0.5]], 0.07, ductMat, false, 40));
    glands.submand.add(gland([2.15 * sx, -2.65, -1.9], [0.6, 0.65, 1.0], 36, glandMat, 7 + si));
    glands.submand.add(tube([[1.85 * sx, -2.2, -1.3], [1.45 * sx, -1.5, -0.2], [0.95 * sx, -1.05, 1.9], [0.38 * sx, -0.55, 3.7]], 0.06, ductMat, false, 40));
    glands.subling.add(gland([1.35 * sx, -1.4, 2.0], [0.42, 0.32, 1.05], 24, glandMat, 9 + si));
  });
  // little duct openings: opposite the upper second molar, and beside the frenulum
  const openMat = M.glow(0xffe7a8);
  [1, -1].forEach((sx) => { const a = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), openMat); a.position.set(3.1 * sx, 3.75, -0.5); glands.parotid.add(a); const b = a.clone(); b.position.set(0.36 * sx, -0.52, 3.72); glands.submand.add(b); });

  // ---- muscles: extrinsic (move the tongue) and intrinsic (change its shape)
  const musMat = new THREE.MeshStandardMaterial({ color: MUSCLE, roughness: 0.55, transparent: true, opacity: 0.9 });
  const ext = new THREE.Group(), intr = new THREE.Group(); root.add(ext); tg.root.add(intr);
  const inside = (a, u, depth) => { const top = dorsum(a, u), n = dorsumNormal(a, u); return top.addScaledVector(n, -depth); };
  const fibre = (pts, r, mat = musMat, parent = ext) => { const m = tube(pts, r, mat, false, 40); parent.add(m); return m; };
  const styl = [];
  [1, -1].forEach((sx) => {
    // genioglossus: fans from the inside of the chin up into the whole tongue
    [0.26, 0.38, 0.5, 0.62, 0.74, 0.86].forEach((a, k) => fibre([[0.28 * sx, -1.25, 4.35], [0.3 * sx, -1.0 + k * 0.05, lerp(3.3, 1.5, k / 5)], inside(a, 0.13 * sx, 0.35)], 0.075));
    fibre([[0.28 * sx, -1.35, 4.3], [0.3 * sx, -2.8, 0.5], [0.3 * sx, -4.1, -2.9]], 0.07);
    // hyoglossus: from the hyoid up into the side
    fibre([[1.35 * sx, -4.2, -3.95], [1.7 * sx, -2.2, -3.1], inside(0.4, 0.85 * sx, 0.5)], 0.085);
    fibre([[0.95 * sx, -4.25, -3.55], [1.55 * sx, -2.0, -2.5], inside(0.47, 0.85 * sx, 0.5)], 0.085);
    // styloglossus: from the styloid process of the skull, down and forwards into the side
    fibre([[2.65 * sx, 3.4, -4.4], [2.4 * sx, 1.0, -3.6], inside(0.36, 0.93 * sx, 0.3), inside(0.55, 0.95 * sx, 0.3), inside(0.75, 0.93 * sx, 0.28)], 0.085);
    const sp = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.3, 10), boneMat); sp.position.set(2.72 * sx, 3.95, -4.65); sp.rotation.x = 0.55; sp.rotation.z = -0.1 * sx; ext.add(sp); styl.push(sp);
    // palatoglossus: from the soft palate down to the side of the back of the tongue
    fibre([[1.0 * sx, 4.4, -3.3], [1.6 * sx, 2.5, -3.35], inside(0.36, 0.9 * sx, 0.2)], 0.075);
  });
  // intrinsic: superior and inferior longitudinal, transverse and vertical fibres (thin, inside)
  const inMat = new THREE.MeshStandardMaterial({ color: 0xd4505e, roughness: 0.5, transparent: true, opacity: 0.85 });
  const tp = (a, th, f) => tonguePoint(a, th, REST, f);
  for (let u = -0.6; u <= 0.61; u += 0.3) { const pts = []; for (let a = 0.3; a <= 0.95; a += 0.05) pts.push(tp(a, thOf(u), 0.86)); fibre(pts, 0.035, inMat, intr); }
  [-0.55, 0.55].forEach((c) => { const pts = []; for (let a = 0.3; a <= 0.93; a += 0.05) pts.push(tp(a, -Math.PI / 2 + c * 1.2, 0.7)); fibre(pts, 0.04, inMat, intr); });
  for (let a = 0.42; a <= 0.9; a += 0.08) { const pts = []; for (let k = -1; k <= 1.001; k += 0.25) pts.push(tp(a, k < 0 ? Math.PI : 0, Math.abs(k) * 0.82).lerp(tp(a, Math.PI / 2, 0.01), 0.45)); fibre(pts, 0.03, inMat, intr); }
  for (let a = 0.46; a <= 0.9; a += 0.11) [-0.4, 0.4].forEach((u) => { fibre([tp(a, thOf(u), 0.8), tp(a, -Math.PI / 2 + u * 0.9, 0.75)], 0.03, inMat, intr); });

  // ---- nerves (both sides), with signals running along them
  const nerves = new THREE.Group(); root.add(nerves);
  const nPaths = { VII: [], IX: [], X: [], XII: [] };
  const nMat = (c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.35, roughness: 0.4, transparent: true, opacity: 1 });
  const addNerve = (key, pts, r = 0.06) => { const sp = smoothPts(pts, 60); nerves.add(tube(sp, r, nMat(NERVE[key]), false, 60)); nPaths[key].push(pathOf(sp)); };
  [1, -1].forEach((sx) => {
    // VII taste fibres (chorda tympani) ride with the lingual nerve to the front two-thirds
    const lingual = [[2.9 * sx, 4.4, -4.6], [2.75 * sx, 1.6, -3.4], [2.3 * sx, -0.4, -2.7], inside(0.52, 0.88 * sx, 0.45), inside(0.72, 0.8 * sx, 0.4), inside(0.88, 0.55 * sx, 0.3)];
    addNerve('VII', lingual, 0.065);
    [[0.55, 0.88], [0.72, 0.8], [0.88, 0.55]].forEach(([a, u]) => addNerve('VII', [inside(a, u * sx, 0.42), inside(a + 0.04, (u - 0.25) * sx, 0.12), inside(a + 0.07, (u - 0.4) * sx, 0.04)], 0.035));
    // IX glossopharyngeal: back third and the circumvallate papillae
    addNerve('IX', [[2.25 * sx, 4.1, -6.7], [2.15 * sx, 0.9, -5.3], [1.75 * sx, -0.7, -4.3], inside(0.3, 0.55 * sx, 0.35), inside(0.36, 0.25 * sx, 0.12)], 0.06);
    addNerve('IX', [inside(0.3, 0.55 * sx, 0.35), inside(0.37, 0.6 * sx, 0.1)], 0.035);
    // X vagus (internal laryngeal branch): epiglottis and throat
    addNerve('X', [[1.6 * sx, 3.9, -7.1], [1.8 * sx, -0.8, -6.7], [1.2 * sx, -3.0, -6.0], [0.4 * sx, -2.7, -5.5]], 0.055);
    // XII hypoglossal: the motor nerve, loops under and runs forwards into the muscles
    addNerve('XII', [[1.35 * sx, 3.7, -6.9], [2.0 * sx, -1.2, -6.1], [2.1 * sx, -3.2, -4.4], [1.85 * sx, -3.0, -2.6], [1.3 * sx, -1.6, -0.3], inside(0.8, 0.35 * sx, 0.8)], 0.06);
  });
  const sig = {
    VII: pulses(nerves, nPaths.VII, { color: 0xfff1b0, per: 3, speed: 0.3 }), IX: pulses(nerves, nPaths.IX, { color: 0xd8ffe8, per: 3, speed: 0.3 }),
    X: pulses(nerves, nPaths.X, { color: 0xeee0ff, per: 3, speed: 0.3 }), XII: pulses(nerves, nPaths.XII, { color: 0xdfe8ff, per: 3, speed: 0.3 }),
  };

  // ---- labels
  if (o.labels) {
    lab('Tongue', [0, 1.9, 4.2], root, 'pink', 'both', true);
    lab('Circumvallate papillae: a V of 8–12', [0, 0.9, -3.9], root, '', 'out');
    lab('Fungiform papillae: the red dots', [1.8, 1.8, 3.0], root, 'red', 'out');
    lab('Filiform papillae: touch only', [-1.3, 1.95, 0.9], root, '', 'out');
    lab('Foliate papillae: side folds', [-2.9, 1.1, -2.7], root, '', 'out');
    lab('Front two-thirds: taste via nerve VII', [-2.4, 2.2, 2.4], root, 'gold', 'in');
    lab('Back third: nerve IX', [-2.2, 0.1, -4.6], root, 'green', 'in');
    lab('X: epiglottis and throat', [-2.3, -2.4, -6.3], root, 'violet', 'in');
    lab('XII: moves the tongue', [-2.6, -3.4, -3.2], root, 'blue', 'in');
    lab('Genioglossus', [0.9, -2.1, 3.0], root, 'red', 'in');
    lab('Styloglossus', [3.1, 2.6, -4.0], root, 'red', 'in');
    lab('Hyoglossus', [2.2, -3.1, -3.8], root, 'red', 'in');
    lab('Intrinsic muscles: change its shape', [1.6, 0.4, 1.4], root, 'red', 'in');
    lab('Hard palate', [0, 5.9, 1.6], up, '', 'jaw', true);
    lab('Soft palate and uvula', [0, 5.6, -3.9], up, '', 'jaw');
    lab('Teeth', [-2.2, 4.6, 3.2], up, '', 'jaw');
    lab('Lower jaw', [-2.4, -2.8, 3.6], low, '', 'jaw');
    lab('Epiglottis', [0, -0.9, -5.7], thr, '', 'jaw', true);
    lab('Hyoid bone', [0, -5.0, -3.4], thr, '', 'jaw');
    lab('Parotid gland', [4.3, 4.3, -3.8], glands.parotid, 'gland', 'gl');
    lab('Submandibular gland', [2.5, -3.7, -1.9], glands.submand, 'gland', 'gl');
    lab('Sublingual gland', [1.5, -2.1, 2.3], glands.subling, 'gland', 'gl');
  }

  // ---- explode
  const expl = [[upPivot, [0, 1.6, -0.6]], [low, [0, -2.4, 0.8]], [thr, [0, -1.6, -2.2]]];
  const glandOff = { parotid: [2.2, 0.8, 0], submand: [1.4, -2.2, 0], subling: [0.9, -2.0, 0.6] };
  expl.forEach(([g]) => { g.userData.home = g.position.clone(); });

  const st = { xray: 0, explode: 0, labels: true, narrow: false, jaw: true, glands: true };
  const opac = (mat, k) => { mat.opacity = k; mat.transparent = k < 1; mat.depthWrite = k > 0.6; };
  function apply() {
    const k = st.xray, e = smooth(st.explode);
    tg.setOpacity(lerp(1, 0.3, k));
    tg.pap.visible = k < 0.9;
    intr.visible = nerves.visible = k > 0.05;
    intr.children.forEach((m) => opac(m.material, k * 0.85));
    nerves.children.forEach((m) => { if (m.material?.emissive) opac(m.material, k); });
    ext.visible = k > 0.05 && e < 0.3;
    opac(musMat, k * 0.9 * (1 - e / 0.3));
    [boneMat, gumMat, toothMat, epiMat].forEach((m) => opac(m, lerp(1, 0.35, k)));
    opac(glandMat, lerp(1, 0.5, k)); opac(ductMat, lerp(1, 0.5, k));
    up.visible = low.visible = thr.visible = st.jaw;
    Object.values(glands).forEach((g) => { g.visible = st.glands; });
    expl.forEach(([g, off]) => g.position.copy(g.userData.home).add(new THREE.Vector3(...off).multiplyScalar(e)));
    upPivot.rotation.x = -0.85 * e;
    Object.entries(glandOff).forEach(([key, off]) => glands[key].children.forEach((c) => {
      c.position.copy(c.userData.home).add(new THREE.Vector3(off[0] * c.userData.side, off[1], off[2]).multiplyScalar(e));
    }));
    labels.forEach((l) => {
      const w = l.userData.when, inside = k > 0.5;
      let on = st.labels && (w === 'both' || (w === 'in' && inside) || (w === 'out' && !inside) || (w === 'jaw' && st.jaw && st.explode > 0.6) || (w === 'gl' && st.glands && !inside));
      if (st.narrow && !l.userData.short) on = false;
      l.visible = on;
    });
  }
  // Each gland part moves out to its own side: lobes and openings by their position, ducts (built
  // at the origin) by their bounding box.
  Object.values(glands).forEach((g) => g.children.forEach((c) => {
    c.userData.home = c.position.clone();
    if (c.position.x) c.userData.side = Math.sign(c.position.x);
    else { c.geometry.computeBoundingBox(); const bb = c.geometry.boundingBox; c.userData.side = Math.sign(bb.min.x + bb.max.x) || 1; }
  }));
  const applyAll = apply;
  const set = (patch) => { Object.assign(st, patch); applyAll(); };
  set({});
  return {
    root, tongue: tg, up, low, thr, glands, ext, intr, nerves, labels, sig, styl,
    setXray: (k) => set({ xray: k }), setExplode: (k) => set({ explode: k }),
    showLabels: (on, narrow = false) => { if (on !== st.labels || narrow !== st.narrow) set({ labels: on, narrow }); },
    showJaw: (on) => { if (on !== st.jaw) set({ jaw: on }); }, showGlands: (on) => { if (on !== st.glands) set({ glands: on }); },
    tickSignals(time, rate = 1) { sig.VII.tick(time, rate, -1); sig.IX.tick(time, rate, -1); sig.X.tick(time, rate, -1); sig.XII.tick(time, rate, 1); },
  };
}
