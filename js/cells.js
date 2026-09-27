// TongueClear's small-scale models: a taste bud cut open, the four kinds of papillae, a patch of
// cell membrane with taste receptors and ion channels in it, and ball-and-stick taste molecules.
//
// Taste bud (Chandrashekar et al., Nature 444:288, 2006; Roper & Chaudhari, Nat Rev Neurosci
// 18:485, 2017; Wikipedia "Taste bud"): an onion-shaped cluster of about 50–150 elongated cells,
// 20–40 µm wide and ~60–80 µm tall, sunk in the surface lining with a small opening, the taste pore.
// The cells' tips carry microvilli that poke into the pore, where they meet dissolved chemicals.
//  - type I (about half): support cells, like glue
//  - type II (about a third): receptor cells for sweet, umami or bitter, one kind per cell
//  - type III (a few percent): sour cells, which also make true synapses onto nerve fibres
//  - basal cells (type IV): stem cells at the bottom that become new taste cells
// Salt (ENaC) cells are a separate small group (Chandrashekar et al., Nature 464:297, 2010; Nomura
// et al., Neuron 106:816, 2020). Nerve fibres enter at the base. Model: 1 unit ≈ 20 µm.
import { THREE, M, tube, clamp, lerp, smooth } from './kit.js';
import { inst, sweep, rng, pathOf, smoothPts, pulses } from './tongue.js';
import { TASTE } from './taste.js';

export const CELL = { I: 0xb7aecf, sweet: TASTE.sweet.hex, umami: TASTE.umami.hex, bitter: TASTE.bitter.hex, sour: TASTE.sour.hex, salty: TASTE.salty.hex, basal: 0x9a8fb8 };
const circle = (r, n = 10) => Array.from({ length: n }, (_, i) => [r * Math.cos((i / n) * Math.PI * 2), r * Math.sin((i / n) * Math.PI * 2)]);

// Bud outline: radius at height y (base −2.2, pore +2.0).
export const budR = (y) => 1.55 * Math.max(0.05, Math.sin(Math.PI * clamp((y + 2.3) / 4.45, 0, 1))) ** 0.75;
const BUD_BOT = -2.2, BUD_TOP = 1.95;

export function makeBud(stage, { cut = 1.6, cells: N = 72, seed = 5 } = {}) {
  const root = new THREE.Group(), r = rng(seed);
  // surface lining (stratified epithelium) with a hole the bud sits in, cut open towards +z
  const prof = [];
  prof.push([BUD_BOT - 0.9, 4.2], [BUD_TOP + 0.35, 4.2], [BUD_TOP + 0.35, 0.28]);
  for (let y = BUD_TOP; y >= BUD_BOT; y -= 0.2) prof.push([y, budR(y) + 0.08]);
  prof.push([BUD_BOT - 0.05, 0.3], [BUD_BOT - 0.05, 0.001]);
  prof.push([BUD_BOT - 0.9, 0.001], [BUD_BOT - 0.9, 4.2]);
  const epiMat = new THREE.MeshStandardMaterial({ color: 0xe9a3a8, roughness: 0.6, side: THREE.DoubleSide, transparent: true, opacity: 1 });
  const phiStart = cut / 2;             // lathe angles: x = r·sin φ, z = r·cos φ, so the gap faces +z
  const lg = new THREE.LatheGeometry(prof.map(([y, rr]) => new THREE.Vector2(rr, y)), 72, phiStart, Math.PI * 2 - cut);
  const epi = new THREE.Mesh(lg, epiMat); epi.receiveShadow = true; root.add(epi);
  const top = new THREE.Mesh(new THREE.RingGeometry(0.3, 4.2, 72, 1, phiStart - Math.PI / 2, Math.PI * 2 - cut), M.matte(0xf6d3d3)); top.rotation.x = -Math.PI / 2; top.rotation.z = 0; top.position.y = BUD_TOP + 0.36; root.add(top);
  // cut faces, so the cut looks solid
  const faceMat = new THREE.MeshStandardMaterial({ color: 0xf2bdbd, roughness: 0.7, side: THREE.DoubleSide, transparent: true, opacity: 1 });
  [phiStart, phiStart + Math.PI * 2 - cut].forEach((phi) => {
    const sh = new THREE.Shape(); prof.forEach(([y, rr], i) => (i ? sh.lineTo(rr, y) : sh.moveTo(rr, y)));
    const f = new THREE.Mesh(new THREE.ShapeGeometry(sh), faceMat); f.rotation.y = phi - Math.PI / 2; root.add(f);
  });
  // lamina (basement membrane) and connective tissue below
  const lam = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 0.08, 72, 1, false, phiStart, Math.PI * 2 - cut), M.matte(0xf4e1c7)); lam.position.y = BUD_BOT - 0.95; root.add(lam);

  // the cells: spindles bent along the onion
  const cells = [];
  const inCut = (phi) => { const d = Math.atan2(Math.sin(phi - Math.PI / 2), Math.cos(phi - Math.PI / 2)); return Math.abs(d) < cut / 2 * 0.92; };
  // type mix: ~50% type I, ~33% type II (sweet/umami/bitter), a few sour and salt cells
  const types = []; for (let i = 0; i < N; i++) { const x = r(); types.push(x < 0.48 ? 'I' : x < 0.6 ? 'sweet' : x < 0.7 ? 'umami' : x < 0.82 ? 'bitter' : x < 0.92 ? 'sour' : 'salty'); }
  for (let i = 0; i < N; i++) {
    const layer = i < N * 0.62 ? 0.88 : i < N * 0.9 ? 0.55 : 0.2;
    const phi = (i * 2.39996) % (Math.PI * 2), rho = layer * (0.93 + r() * 0.1);
    if (inCut(phi) && rho > 0.3) { cells.push(null); continue; }
    const pts = [];
    for (let k = 0; k <= 8; k++) { const y = lerp(BUD_BOT + 0.05, BUD_TOP - 0.05, k / 8), R = budR(y) * rho * 0.92; pts.push(new THREE.Vector3(Math.cos(phi) * R, y, Math.sin(phi) * R)); }
    const sp = smoothPts(pts, 16), w = 0.2 + r() * 0.05;
    const mat = new THREE.MeshStandardMaterial({ color: CELL[types[i]], roughness: 0.5, emissive: CELL[types[i]], emissiveIntensity: 0, transparent: true, opacity: 1 });
    const m = sweep(sp, (t) => circle(w * (Math.sin(Math.PI * clamp(t, 0.04, 0.96)) ** 0.55) + 0.02, 8), mat);
    root.add(m);
    // microvilli at the tip
    const tip = sp[sp.length - 1];
    const mv = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 5), M.glow(types[i] === 'I' ? 0xd9d2ee : CELL[types[i]]));
    mv.position.copy(tip).add(new THREE.Vector3(0, 0.12, 0)); root.add(mv);
    cells.push({ mesh: m, mat, type: types[i], phi, rho, tip, mv, base: sp[0] });
  }
  // basal (stem) cells at the bottom
  const basal = inst(new THREE.SphereGeometry(0.2, 12, 10), M.matte(CELL.basal), 14);
  for (let i = 0; i < 14; i++) { const phi = i * 0.45 + 0.3; if (inCut(phi)) { basal.put(i, new THREE.Vector3(0, -99, 0)); continue; } const R = budR(BUD_BOT + 0.25) * 0.75; basal.put(i, new THREE.Vector3(Math.cos(phi) * R, BUD_BOT + 0.1, Math.sin(phi) * R)); }
  root.add(basal);
  // nerve fibres entering from below, ending on receptor cells
  const nerveMat = new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffd166, emissiveIntensity: 0.3, roughness: 0.4 });
  const nPaths = [];
  cells.filter((c) => c && c.type !== 'I').forEach((c, k) => {
    const end = c.base.clone().lerp(new THREE.Vector3(0, BUD_BOT, 0), 0.2).add(new THREE.Vector3(0, 0.35, 0));
    const pts = smoothPts([[Math.cos(k * 1.3) * 0.25 + 0.6, BUD_BOT - 2.1, Math.sin(k * 1.3) * 0.25 - 0.4], [Math.cos(k * 1.3) * 0.5, BUD_BOT - 0.9, Math.sin(k * 1.3) * 0.5], end], 20);
    root.add(tube(pts, 0.045, nerveMat, false, 24)); const p = pathOf(pts); p.type = c.type; nPaths.push(p);
  });
  const sig = pulses(root, nPaths, { color: 0xfff1b0, size: 0.07, per: 2, speed: 0.5 });

  return {
    root, cells: cells.filter(Boolean), basal, epi, epiMat, sig, nPaths,
    // light up the cells of one taste (0–1) and send signals down their fibres
    glow(levels, time) {
      this.cells.forEach((c) => { c.mat.emissiveIntensity = c.type === 'I' ? 0 : 0.8 * (levels[c.type] || 0) * (0.6 + 0.4 * Math.sin(time * 9 + c.phi * 3)); });
      const any = Math.max(0, ...Object.values(levels));
      sig.tick(time, any > 0.05 ? 1 : 0, -1);
    },
  };
}

// ---------------------------------------------------------------- the four papillae
// Each stands on a small block of tongue surface, 1 unit ≈ 0.25 mm.
//  - filiform: pointed, with a hard (keratin) tip. Touch and texture only, no taste buds.
//  - fungiform: mushroom-shaped, red (blood vessels show through), a few taste buds on top.
//  - foliate: folds at the back of the tongue's sides, buds in the walls of the clefts.
//  - circumvallate: big, flat, sunk in a moat; hundreds of buds in the moat walls, and von Ebner's
//    glands that rinse the moat (Gray's Anatomy; Wikipedia "Lingual papillae").
export function makePapillae(stage) {
  const root = new THREE.Group();
  const surf = new THREE.MeshStandardMaterial({ color: 0xd9737c, roughness: 0.6 });
  const budMat = new THREE.MeshStandardMaterial({ color: 0xc9b8f0, roughness: 0.4, emissive: 0x6a55a8, emissiveIntensity: 0.35 });
  const blocks = {};
  const mkBlock = (x) => { const g = new THREE.Group(); g.position.x = x; const b = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.2, 3.2), surf); b.position.y = -0.6; b.receiveShadow = b.castShadow = true; g.add(b); root.add(g); return g; };
  const bud = (pos, n) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), budMat); m.scale.set(0.13, 0.22, 0.13); m.position.copy(pos); if (n) m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n); return m; };
  // filiform
  const fi = blocks.filiform = mkBlock(-5.4);
  [[-0.7, -0.5], [0.6, -0.7], [0, 0.4], [-0.9, 0.9], [0.95, 0.7]].forEach(([x, z], i) => {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.5 + (i % 2) * 0.3, 12), M.matte(0xf1c8c8)); c.position.set(x, 0.75, z); c.rotation.x = -0.25; c.castShadow = true; fi.add(c);
    const k = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.45, 8), M.matte(0xfbf4e6)); k.position.set(x, 1.55 + (i % 2) * 0.15, z - 0.2); k.rotation.x = -0.25; fi.add(k);
  });
  // fungiform
  const fu = blocks.fungiform = mkBlock(-1.8);
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 0.8, 24), new THREE.MeshStandardMaterial({ color: 0xd8505c, roughness: 0.5 })); stalk.position.y = 0.4; fu.add(stalk);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xe0414f, roughness: 0.45 })); cap.scale.set(1.05, 0.6, 1.05); cap.position.y = 0.75; cap.castShadow = true; fu.add(cap);
  [[0, 0], [0.45, 0.2], [-0.4, 0.3], [0.1, -0.45]].forEach(([x, z]) => { const y = 0.75 + 0.6 * Math.sqrt(Math.max(0, 1 - (x * x + z * z) / 1.1)); fu.add(bud(new THREE.Vector3(x, y - 0.1, z))); });
  // foliate
  const fo = blocks.foliate = mkBlock(1.8);
  [-0.95, 0, 0.95].forEach((x) => {
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.2, 2.8), new THREE.MeshStandardMaterial({ color: 0xcf5a66, roughness: 0.55 })); ridge.position.set(x, 0.6, 0); ridge.castShadow = true; fo.add(ridge);
    [-0.8, 0, 0.8].forEach((z) => [-1, 1].forEach((s) => { if (Math.abs(x + s * 0.31) > 1.5) return; fo.add(bud(new THREE.Vector3(x + s * 0.3, 0.55, z), new THREE.Vector3(s, 0.2, 0).normalize())); }));
  });
  // circumvallate
  const cv = blocks.circumvallate = mkBlock(5.4);
  const moat = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.2, 10, 40), M.matte(0x5e1f29)); moat.rotation.x = Math.PI / 2; moat.position.y = 0.02; cv.add(moat);
  const dome = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.95, 0.5, 40), new THREE.MeshStandardMaterial({ color: 0xcf5563, roughness: 0.5 })); dome.position.y = 0.2; dome.castShadow = true; cv.add(dome);
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; cv.add(bud(new THREE.Vector3(Math.cos(a) * 0.93, 0.12, Math.sin(a) * 0.93), new THREE.Vector3(Math.cos(a), 0.15, Math.sin(a)).normalize())); }
  const gl = inst(new THREE.SphereGeometry(0.16, 10, 8), M.matte(0xf0c46a), 10);
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + 0.2; gl.put(i, new THREE.Vector3(Math.cos(a) * 1.15, -0.55, Math.sin(a) * 1.15)); } cv.add(gl);
  return { root, blocks };
}

// ---------------------------------------------------------------- membrane, receptors, molecules
// A patch of lipid bilayer lying flat, top at y = 0.35, bottom at y = −0.35.
export function membrane(w, d, { color = 0xf2d9a6, seed = 3 } = {}) {
  const g = new THREE.Group();
  const nx = Math.round(w / 0.28), nz = Math.round(d / 0.28), n = nx * nz;
  const heads = inst(new THREE.SphereGeometry(0.13, 8, 6), M.plastic(color, { roughness: 0.4 }), n * 2);
  let i = 0; const r = rng(seed);
  for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) { const x = -w / 2 + (a + 0.5) * (w / nx) + (r() - 0.5) * 0.05, z = -d / 2 + (b + 0.5) * (d / nz) + (r() - 0.5) * 0.05; heads.put(i++, new THREE.Vector3(x, 0.3, z)); heads.put(i++, new THREE.Vector3(x, -0.3, z)); }
  g.add(heads);
  const core = new THREE.Mesh(new THREE.BoxGeometry(w, 0.44, d), new THREE.MeshStandardMaterial({ color: 0xe6c27a, roughness: 0.8, transparent: true, opacity: 0.55 })); g.add(core);
  g.heads = heads;
  return g;
}
// Clear a round hole in a membrane for a protein at (x, z) by moving heads out of the way.
export function clearHole(mem, x, z, r) {
  const m = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
  for (let i = 0; i < mem.heads.count; i++) { mem.heads.getMatrixAt(i, m); m.decompose(p, q, s); if (Math.hypot(p.x - x, p.z - z) < r) { s.setScalar(0); m.compose(p, q, s); mem.heads.setMatrixAt(i, m); } }
  mem.heads.instanceMatrix.needsUpdate = true;
}

// A 7-helix bundle (a G-protein-coupled receptor's body in the membrane).
function sevenTM(color) {
  const g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, emissive: color, emissiveIntensity: 0 });
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; const h = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1.25, 12), mat); h.position.set(Math.cos(a) * 0.36, 0, Math.sin(a) * 0.36); h.rotation.z = 0.18 * Math.cos(a * 2); g.add(h); }
  g.mat = mat; return g;
}
// A "Venus flytrap" domain above the membrane: two lobes that close on the taste molecule.
function flytrap(color) {
  const g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, emissive: color, emissiveIntensity: 0 });
  const lobeGeo = new THREE.SphereGeometry(0.5, 20, 14, 0, Math.PI);
  const a = new THREE.Mesh(lobeGeo, mat), b = new THREE.Mesh(lobeGeo, mat);
  const ha = new THREE.Group(), hb = new THREE.Group(); ha.add(a); hb.add(b);
  a.rotation.y = Math.PI / 2; b.rotation.y = -Math.PI / 2; a.position.y = 0.45; b.position.y = 0.45; a.scale.set(1, 1, 0.6); b.scale.set(1, 1, 0.6);
  g.add(ha, hb);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.55, 10), mat); stem.position.y = -0.2; g.add(stem);
  g.setClosed = (k) => { ha.rotation.z = lerp(0.55, 0.08, k); hb.rotation.z = -lerp(0.55, 0.08, k); };
  g.setClosed(0); g.mat = mat;
  return g;
}
// Receptors. Every one has .site (world-ish local position where a molecule docks), .active(k).
export function receptor(kind, colors) {
  const g = new THREE.Group();
  if (kind === 'pair') {        // T1R2+T1R3 (sweet) or T1R1+T1R3 (umami)
    const [ca, cb] = colors;
    const tmA = sevenTM(ca), tmB = sevenTM(cb); tmA.position.x = -0.5; tmB.position.x = 0.5; g.add(tmA, tmB);
    const fA = flytrap(ca), fB = flytrap(cb); fA.position.set(-0.55, 1.15, 0); fB.position.set(0.55, 1.15, 0); g.add(fA, fB);
    g.site = new THREE.Vector3(-0.55, 1.62, 0);
    g.active = (k) => { fA.setClosed(k); [tmA, tmB, fA, fB].forEach((p) => { p.mat.emissiveIntensity = 0.55 * k; }); };
  } else if (kind === 't2r') {  // a bitter receptor: one 7-helix bundle with a pocket on top
    const tm = sevenTM(colors[0]); g.add(tm);
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.09, 8, 20), tm.mat); loop.rotation.x = Math.PI / 2; loop.position.y = 0.7; g.add(loop);
    g.site = new THREE.Vector3(0, 0.78, 0);
    g.active = (k) => { tm.mat.emissiveIntensity = 0.6 * k; loop.scale.setScalar(1 - 0.15 * k); };
  } else {                      // an ion channel: n subunits around a pore (OTOP1: 2, ENaC: 3, TRP: 4)
    const n = kind === 'otop' ? 2 : kind === 'enac' ? 3 : 4;
    const mat = new THREE.MeshStandardMaterial({ color: colors[0], roughness: 0.35, emissive: colors[0], emissiveIntensity: 0 });
    const subs = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.PI / 4, s = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(n === 2 ? 0.42 : 0.3, 0.8, 6, 14), mat); s.add(body);
      if (kind === 'enac') { const hand = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), mat); hand.position.set(0, 1.05, 0); hand.scale.set(1, 0.8, 1); s.add(hand); }
      if (kind === 'trp') { const ank = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), mat); ank.position.set(0, -0.9, 0); ank.scale.set(1.2, 0.7, 1.2); s.add(ank); }
      s.userData.a = a; s.position.set(Math.cos(a) * 0.52, 0, Math.sin(a) * 0.52); g.add(s); subs.push(s);
    }
    g.site = new THREE.Vector3(0, 0.9, 0);
    g.active = (k) => { mat.emissiveIntensity = 0.55 * k; subs.forEach((s) => { const R = lerp(0.5, 0.66, k); s.position.set(Math.cos(s.userData.a) * R, 0, Math.sin(s.userData.a) * R); }); };
    g.pore = true;
  }
  g.active(0);
  return g;
}

// Ball-and-stick molecules (stylised, right number of rings).
const atomMat = {}; const aMat = (c) => (atomMat[c] ||= new THREE.MeshStandardMaterial({ color: c, roughness: 0.35 }));
function ballStick(atoms, bonds, color, r = 0.1) {
  const g = new THREE.Group();
  atoms.forEach(([x, y, z, c]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(c === 'O' ? r * 1.15 : c === 'N' ? r * 1.1 : r, 10, 8), aMat(c === 'O' ? 0xff5a5a : c === 'N' ? 0x6f8bff : color)); m.position.set(x, y, z); g.add(m); });
  bonds.forEach(([i, j]) => { const A = new THREE.Vector3(...atoms[i]), B = new THREE.Vector3(...atoms[j]); const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.35, r * 0.35, A.distanceTo(B), 6), aMat(0xdfe6f0)); m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); g.add(m); });
  return g;
}
const ring = (n, R, cx, cy, off = 0) => Array.from({ length: n }, (_, i) => [cx + R * Math.cos(off + (i / n) * Math.PI * 2), cy + R * Math.sin(off + (i / n) * Math.PI * 2), 0]);
export function molecule(kind) {
  if (kind === 'sweet') {        // sucrose: a six-ring (glucose) joined through an oxygen to a five-ring (fructose)
    const a = [...ring(6, 0.22, -0.32, 0), ...ring(5, 0.19, 0.34, 0.05), [0.02, 0.02, 0]]; const at = a.map((p, i) => [...p, i === 5 || i === 10 ? 'O' : i === 11 ? 'O' : 'C']);
    const b = []; for (let i = 0; i < 6; i++) b.push([i, (i + 1) % 6]); for (let i = 0; i < 5; i++) b.push([6 + i, 6 + ((i + 1) % 5)]); b.push([0, 11], [11, 9]);
    return ballStick(at, b, 0xff9ec0, 0.07);
  }
  if (kind === 'umami') {        // glutamate: a five-carbon chain with an amine and two acid groups
    const at = [[-0.4, 0, 0, 'C'], [-0.2, 0.12, 0, 'C'], [0, 0, 0, 'C'], [0.2, 0.12, 0, 'C'], [0.4, 0, 0, 'C'], [-0.55, 0.1, 0, 'O'], [-0.42, -0.16, 0, 'O'], [0.55, 0.1, 0, 'O'], [0.42, -0.16, 0, 'O'], [-0.2, 0.3, 0, 'N']];
    return ballStick(at, [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [0, 6], [4, 7], [4, 8], [1, 9]], 0xffb547, 0.07);
  }
  if (kind === 'bitter') {       // a bulky four-ring molecule, like the triterpenoids in karela
    const R = 0.14, rows = [ring(6, R, -0.36, 0, Math.PI / 6), ring(6, R, -0.12, 0, Math.PI / 6), ring(6, R, 0.12, 0.13, Math.PI / 6), ring(5, R * 0.9, 0.34, 0.2)];
    const at = [], b = [];
    rows.forEach((rg) => { const s = at.length; rg.forEach((p) => at.push([...p, 'C'])); rg.forEach((_, i) => b.push([s + i, s + ((i + 1) % rg.length)])); });
    at.push([0.52, 0.35, 0, 'O']); b.push([at.length - 1, at.length - 3]);
    return ballStick(at, b, 0x7ef0b0, 0.055);
  }
  if (kind === 'capsaicin') {    // a ring head (vanillyl) and a long fatty tail
    const at = [...ring(6, 0.16, -0.6, 0).map((p) => [...p, 'C']), [-0.82, 0.18, 0, 'O'], [-0.75, -0.2, 0, 'O']];
    const b = []; for (let i = 0; i < 6; i++) b.push([i, (i + 1) % 6]); b.push([3, 6], [4, 7]);
    let prev = 0; for (let k = 0; k < 9; k++) { at.push([-0.4 + k * 0.14, (k % 2) * 0.1 - 0.05, 0, k === 1 ? 'N' : k === 2 ? 'C' : 'C']); b.push([prev, at.length - 1]); prev = at.length - 1; }
    at.push([-0.12, 0.25, 0, 'O']); b.push([at.length - 1, 9]);
    return ballStick(at, b, 0xff6b4a, 0.055);
  }
  if (kind === 'menthol') {      // a six-ring with an OH and two short branches
    const at = [...ring(6, 0.18, 0, 0).map((p) => [...p, 'C']), [0.34, 0.1, 0, 'O'], [-0.36, 0.1, 0, 'C'], [0, -0.36, 0, 'C']];
    const b = []; for (let i = 0; i < 6; i++) b.push([i, (i + 1) % 6]); b.push([0, 6], [3, 7], [4, 8]);
    return ballStick(at, b, 0x8ef0ff, 0.06);
  }
  // ions
  const col = { sour: 0xffe08a, salty: 0x9fb4ff, cl: 0x9be39b, ca: 0xffffff }[kind] || 0xffffff;
  const r = { sour: 0.07, salty: 0.13, cl: 0.17, ca: 0.12 }[kind] || 0.1;
  return new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), kind === 'cl' ? aMat(col) : M.glow(col));
}
