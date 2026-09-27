// TongueClear's side view of the head, cut down the middle (a sagittal section), as in an anatomy
// atlas: the nose and nasal cavity, the mouth with the 3D tongue in it, the hard and soft palate,
// the throat (pharynx), the epiglottis, the olfactory patch in the roof of the nose and the brain.
// Used by the flavour chapter (smell from the back of the mouth, "retronasal" smell) and the health
// chapter (how the tongue moves for speech and swallowing).
// Layout (cm, person faces +z, up is +y): the tongue sits as in tongue.js; the hard palate is just
// above it, the nasal cavity above the palate, and the throat behind. Olfactory epithelium: a patch
// of a few cm² in the roof of the nasal cavity (NIDCD "Smell disorders"; Gray's Anatomy).
// Retronasal smell: when you breathe out while chewing, air carries aroma from the back of the
// mouth up into the nose (Rozin, Percept Psychophys 31:397, 1982; Shepherd, Nature 444:316, 2006).
import { THREE, M, clamp, lerp } from './kit.js';
import { makeTongue, pathOf, smoothPts, tint } from './tongue.js';

const shape = (pts) => { const s = new THREE.Shape(); pts.forEach(([z, y], i) => (i ? s.lineTo(z, y) : s.moveTo(z, y))); return s; };
// Extrude a (z, y) outline into a slab from x = x0 to x = x0 + depth.
function slab(pts, depth, x0, mat, curve = true) {
  const sh = curve ? shape(new THREE.SplineCurve(pts.map(([z, y]) => new THREE.Vector2(z, y))).getPoints(pts.length * 6).map((v) => [v.x, v.y])) : shape(pts);
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 16 });
  g.rotateY(-Math.PI / 2); g.translate(x0 + depth, 0, 0);
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; return m;
}

const HEAD = [[-7, -11], [1.6, -11], [2.1, -5.6], [5.0, -3.7], [7.2, -2.7], [7.8, -1.3], [8.0, 0.2], [7.5, 0.95], [8.1, 1.6], [8.0, 2.6], [8.5, 3.1], [10.1, 3.9], [9.5, 5.3], [7.7, 8.0], [8.1, 9.6], [7.4, 12.0], [5.0, 14.3], [0, 15.6], [-5, 15.1], [-9.5, 12.2], [-11, 8], [-10.6, 4], [-8.6, 0.5], [-7.2, -3], [-7, -11]];
const NASAL = [[8.4, 3.25], [9.2, 3.95], [7.6, 5.1], [5.6, 6.5], [3.0, 7.3], [0.5, 7.3], [-2.2, 6.6], [-4.1, 5.2], [-5.4, 4.3], [-5.0, 3.3], [-3.9, 3.05], [-1.3, 3.2], [3.0, 3.1], [6.2, 3.0]];
const PHARYNX = [[-4.2, 4.9], [-5.9, 4.4], [-6.1, 1.2], [-6.0, -3.0], [-5.6, -6.2], [-5.4, -11], [-4.3, -11], [-4.4, -6.2], [-4.9, -3.2], [-4.8, -0.6], [-4.3, 1.4], [-4.1, 3.1]];
const MOUTH = [[6.3, 2.35], [3.0, 2.5], [-1.2, 2.55], [-4.1, 1.6], [-4.8, -0.6], [-4.5, -3.4], [-2.5, -2.4], [0.5, -1.6], [3.5, -1.2], [5.3, -0.7], [6.6, 0.3], [7.2, 1.2]];
const BRAIN = [[6.2, 10.2], [5.4, 12.8], [2, 14.3], [-3, 14.3], [-7.6, 12.6], [-9.4, 9.4], [-8.6, 6.4], [-5.4, 6.2], [-2.4, 7.8], [1.4, 7.9], [4.6, 8.3]];

export function makeHead(stage, opts = {}) {
  const o = { labels: true, ...opts };
  const root = new THREE.Group();
  const flesh = new THREE.MeshStandardMaterial({ color: 0xd6978b, roughness: 0.7 });
  const cav = new THREE.MeshStandardMaterial({ color: 0x3d1419, roughness: 0.9 });
  const brainMat = new THREE.MeshStandardMaterial({ color: 0xe9b9c3, roughness: 0.6 });
  root.add(slab(HEAD, 1.2, -1.3, flesh));
  [NASAL, PHARYNX, MOUTH].forEach((p) => root.add(slab(p, 0.1, -0.08, cav)));
  root.add(slab(BRAIN, 0.2, -0.05, brainMat));
  // skull base line under the brain and the hard palate (bone), soft palate and uvula (soft tissue)
  const bone = new THREE.MeshStandardMaterial({ color: 0xd9ccb4, roughness: 0.7 });
  const pal = slab([[6.4, 2.35], [3, 2.45], [-1.3, 2.55], [-1.3, 3.1], [3, 3.05], [6.3, 2.95]], 0.9, -0.3, bone, false); root.add(pal);
  const soft = slab([[-1.2, 2.55], [-2.8, 2.25], [-4.1, 1.65], [-4.3, 2.3], [-2.9, 2.95], [-1.2, 3.1]], 0.8, -0.3, new THREE.MeshStandardMaterial({ color: 0xe0848d, roughness: 0.5 }), false); root.add(soft);
  const uvula = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.6, 6, 12), new THREE.MeshStandardMaterial({ color: 0xe0848d })); uvula.position.set(0, 1.35, -4.25); uvula.rotation.x = -0.35; root.add(uvula);
  const epi = slab([[-4.9, -3.0], [-5.0, -1.6], [-5.3, -0.4], [-5.05, -0.35], [-4.7, -1.6], [-4.6, -3.0]], 0.9, -0.3, new THREE.MeshStandardMaterial({ color: 0xeaa7a0 }), false); root.add(epi);
  const jaw = slab([[6.8, 0.2], [7.4, -1.3], [7.0, -2.5], [4.5, -3.2], [0.5, -3.4], [-3.2, -3.6], [-3.0, -2.6], [0.5, -2.4], [4.5, -1.8], [6.0, -0.6]], 0.9, -0.3, bone); root.add(jaw);
  const teeth = new THREE.MeshPhysicalMaterial({ color: 0xf7f3ea, roughness: 0.25, clearcoat: 0.8 });
  const upT = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.0, 0.45), teeth); upT.position.set(0, 1.85, 6.3); upT.rotation.x = 0.15; root.add(upT);
  const loT = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.0, 0.45), teeth); loT.position.set(0, 0.75, 6.05); loT.rotation.x = -0.2; root.add(loT);
  // olfactory epithelium, bulb and a path to the brain
  const olfMat = new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffd166, emissiveIntensity: 0.2, roughness: 0.5 });
  const olf = slab([[3.2, 7.25], [0.4, 7.25], [0.4, 6.85], [3.2, 6.9]], 0.8, -0.2, olfMat, false); root.add(olf);
  const bulb = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 1.6, 6, 12), olfMat); bulb.rotation.x = Math.PI / 2; bulb.position.set(0.2, 8.05, 1.8); root.add(bulb);
  const gust = new THREE.Mesh(new THREE.SphereGeometry(0.55, 20, 14), new THREE.MeshStandardMaterial({ color: 0xff9ec0, emissive: 0xff9ec0, emissiveIntensity: 0.3 })); gust.position.set(0.3, 10.3, -1.2); root.add(gust);
  // taste nerve to the brainstem and on to the taste cortex (insula), and smell path from the bulb
  const nerveT = smoothPts([[0.3, 1.2, 2.4], [0.3, 0.6, -1.5], [0.3, 0.8, -3.6], [0.3, 3.5, -6.3], [0.3, 6.5, -5.8], [0.3, 10.1, -1.4]], 60);
  const nerveS = smoothPts([[0.3, 8.1, 1.2], [0.3, 8.8, 0.2], [0.3, 10.0, -0.9]], 30);
  const tMat = new THREE.MeshStandardMaterial({ color: 0xffb547, emissive: 0xffb547, emissiveIntensity: 0.3 }), sMat = new THREE.MeshStandardMaterial({ color: 0xffe08a, emissive: 0xffe08a, emissiveIntensity: 0.3 });
  const nT = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(nerveT), 60, 0.08, 6), tMat), nS = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(nerveS), 20, 0.1, 6), sMat);
  root.add(nT, nS);
  // the tongue
  const tongue = makeTongue(stage, { tonsil: true }); tongue.root.position.set(0, 0.35, 0.3); tongue.root.scale.setScalar(0.92); root.add(tongue.root);
  tongue.fil.visible = false;
  // nose clip (for "hold your nose")
  const clip = new THREE.Group(); root.add(clip);
  const pad = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), M.plastic(0x8fb0ff)); pad.scale.set(0.6, 1, 1.2);
  const pa = pad.clone(), pb = pad.clone(); pa.position.set(1.0, 3.9, 9.0); pb.position.set(-1.0, 3.9, 9.0); clip.add(pa, pb);
  const bar = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.07, 8, 24, Math.PI), M.plastic(0x8fb0ff)); bar.position.set(0, 3.9, 9.3); bar.rotation.set(0, 0, 0); clip.add(bar);
  // airflow paths (x slightly in front of the section so they show)
  const X = 0.25;
  const P = (pts) => pathOf(smoothPts(pts.map(([z, y]) => [X, y, z]), 80));
  const paths = {
    retro: P([[1.6, 1.7], [-1.5, 1.95], [-3.6, 1.35], [-5.0, 1.0], [-5.2, 3.3], [-4.0, 4.8], [-1.8, 6.1], [0.8, 6.8], [2.0, 6.95]]),
    breathOut: P([[-5.0, -8], [-5.0, -3], [-5.3, 1.0], [-5.1, 3.6], [-3.5, 4.6], [0.5, 4.8], [4.5, 4.4], [7.5, 3.9], [9.5, 3.4], [11.5, 3.0]]),
    ortho: P([[12.5, 2.4], [10.0, 3.2], [8.2, 3.8], [6.0, 5.3], [3.8, 6.4], [2.0, 6.95]]),
  };
  const labels = [];
  const lab = (html, pos, cls, short = false) => { const l = tint(stage.label(html, pos, root), cls); l.userData.short = short; labels.push(l); return l; };
  if (o.labels) {
    lab('Smell sensors (olfactory patch)', [0.3, 7.7, 5.2], 'yellow', true);
    lab('Nasal cavity', [0.3, 5.6, 4.6], '');
    lab('Taste area of the brain', [0.3, 11.2, -1.2], 'pink');
    lab('Tongue', [0.3, 2.0, 2.6], 'pink', true);
    lab('Throat (pharynx)', [0.3, -1.5, -7.6], '');
    lab('Soft palate', [0.3, 2.9, -3.0], '');
  }
  return {
    root, tongue, clip, paths, labels, uvula, soft, epi, gust, olf, nT, nS,
    showLabels(on, narrow) { labels.forEach((l) => { l.visible = on && (!narrow || l.userData.short); }); },
  };
}

// Particles along a path: `count` dots spread along it, advancing with time. reach (0–1) limits how
// far they get (for a blocked nose they pile up and jiggle at the back of the throat).
export function stream(parent, count, color, size = 0.12) {
  const m = new THREE.InstancedMesh(new THREE.SphereGeometry(size, 8, 6), M.glow(color), count);
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; parent.add(m);
  const o = new THREE.Object3D(), p = new THREE.Vector3();
  m.tick = (path, time, { speed = 0.18, reach = 1, on = 1, jitter = 0.18 } = {}) => {
    for (let i = 0; i < count; i++) {
      let u = (time * speed + i / count) % 1;
      const shown = i / count < on;
      if (u > reach) u = reach - 0.04 * ((i * 7) % 5) / 5;
      path.at(u, p);
      o.position.set(p.x + Math.sin(i * 12.9 + time * 3) * jitter * 0.3, p.y + Math.sin(i * 3.1 + time * 2.3) * jitter, p.z + Math.cos(i * 5.7 + time * 2.1) * jitter);
      o.scale.setScalar(shown ? 1 : 0); o.updateMatrix(); m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  };
  return m;
}
