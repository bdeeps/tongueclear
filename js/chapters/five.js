// Chapter 2: the five tastes and their receptors. Five receptor cells side by side, each with one
// kind of receptor in its tip membrane: T1R2+T1R3 (sweet), T1R1+T1R3 (umami), a T2R (bitter),
// OTOP1 (sour, lets H⁺ in) and ENaC (salty, lets Na⁺ in). Pick a food and its molecules dock or
// pass through, the cell lights up and sends signals down its nerve fibre.
// Receptors and sources: taste.js. Thresholds: Guyton & Hall (see taste.js).
import { THREE, M, clamp, lerp, approach } from '../kit.js';
import { compactReadout, fitNarrow, tint, board, boardBg, rng, pathOf, smoothPts, pulses } from '../tongue.js';
import { membrane, clearHole, receptor, molecule, CELL } from '../cells.js';
import { TASTES, FOOD, FOODS, LEVEL, THRESHOLD_M, fmtMolar, REF } from '../taste.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const X = [-5.6, -2.8, 0, 2.8, 5.6];     // one column per taste, in TASTES order
const MEM_Y = 2.0;

function drawBoard(g, w, h, s, act) {
  const f = FOOD[s.food];
  boardBg(g, w, h, `${f.name}: what the brain hears`);
  const L = 40, T = 86, bw = (w - 2 * L) / 5;
  TASTES.forEach((t, i) => {
    const x = L + i * bw + 14, v = clamp(act[t.id] || 0, 0, 1), H = h - T - 80;
    g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(x, T, bw - 28, H);
    g.fillStyle = t.css; g.fillRect(x, T + H * (1 - v), bw - 28, H * v);
    g.font = 'bold 24px sans-serif'; g.fillStyle = t.css; g.fillText(t.name, x, h - 48);
    g.font = '18px sans-serif'; g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText(LEVEL[f.level[t.id] || 0], x, h - 20);
  });
  if (f.heat) { g.fillStyle = 'rgba(10,12,18,.85)'; g.fillRect(40, h / 2 - 50, w - 80, 90); g.fillStyle = '#ff8a5c'; g.font = 'bold 26px sans-serif'; g.fillText('No taste receptor fires. The burn is pain,', 60, h / 2 - 12); g.fillText('not taste: see the chilli chapter.', 60, h / 2 + 22); }
}

export default {
  id: 'five',
  short: 'Five tastes',
  title: 'Five tastes, five kinds of receptor',
  subtitle: 'Sweet, sour, salty, bitter and umami, each caught by its own receptor.',
  view: { pos: [0.2, 7.2, 21.5], target: [-1.6, 3.9, 0] },
  learn: `<p>Taste cells can tell apart five basic tastes. Each receptor cell carries only one kind of <b>receptor</b>, a protein in its skin that catches one kind of chemical.</p>
    <p><b>Sweet</b> is caught by a pair of receptors, <b>T1R2 + T1R3</b>, that clamp shut on sugars like the sucrose in <b>jaggery</b>. It tells you "energy". <b>Umami</b>, the savoury taste of <b>tomato</b>, dal, broth and cheese, uses <b>T1R1 + T1R3</b>, which grips <b>glutamate</b>, a sign of protein.</p>
    <p><b>Bitter</b> is a warning sense. Many poisons made by plants are bitter, so we have about <b>25 kinds</b> of bitter receptor, the <b>T2Rs</b>, between them catching thousands of chemicals, like those in <b>karela</b>. You can taste bitter at far weaker strengths than sugar.</p>
    <p><b>Sour</b> and <b>salty</b> work differently: they are <b>channels</b>, tiny doors that let charged particles into the cell. Acids, like the tartaric acid in <b>tamarind</b>, release protons (H⁺) that flow in through <b>OTOP1</b>. Salt releases sodium (Na⁺), which flows in through <b>ENaC</b>.</p>
    <p>Either way, the cell becomes active and signals a nerve fibre. The brain reads the <b>pattern</b> across all five, so tamarind comes out "sour and sweet" at once.</p>
    <p class="tip"><b>Try it:</b> pick each food and watch which receptors light up. Then try the green chilli.</p>`,
  terms: [
    { t: 'Receptor', d: 'A protein on a cell that catches one kind of chemical and switches the cell on.' },
    { t: 'Umami', d: 'The savoury taste of glutamate, found in tomatoes, dal, broth, cheese and soy sauce.' },
    { t: 'T1R and T2R', d: 'Families of taste receptors: T1Rs pair up for sweet and umami; about 25 T2Rs catch bitter.' },
    { t: 'Ion channel', d: 'A protein doorway through a cell’s skin that lets charged particles through.' },
    { t: 'OTOP1', d: 'The channel for sour taste. It lets protons (H⁺) from acids into sour cells.' },
    { t: 'ENaC', d: 'The epithelial sodium channel. It lets sodium from salt into salt-sensing cells.' },
  ],
  defaults: { food: 'jaggery', labels: true },
  controls: [
    { key: 'food', type: 'seg', label: 'Put on the tongue', options: FOODS.map((f) => ({ v: f.id, label: f.name })), fmt: (v) => FOOD[v].note },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'Which receptor catches the sugar in jaggery?', options: ['ENaC', 'T1R2 + T1R3', 'OTOP1', 'A T2R'], answer: 1, why: 'Sweet is sensed by the pair T1R2 + T1R3, which clamps onto sugars.' },
    { q: 'Why do we have about 25 kinds of bitter receptor but only one sweet receptor?', options: ['Bitter foods are more common', 'Bitter warns of many different poisons, so it must catch many chemicals', 'Sweet is not important', 'They are left over from fish'], answer: 1, why: 'Plant poisons come in thousands of shapes. Many bitter receptors between them catch most of them.' },
    { q: 'How does sour taste work?', options: ['Acid molecules dock on a sweet receptor', 'Protons (H⁺) from acids flow into sour cells through the OTOP1 channel', 'It is really a smell', 'Sour is sensed only at the back of the tongue'], answer: 1, why: 'OTOP1 is a proton channel. When H⁺ flows in, the sour cell switches on.' },
  ],
  reel: [
    { ms: 5600, caption: 'Five tastes, five receptors: sugar from jaggery docks on sweet, glutamate from tomato dal on umami.', set: { food: 'jaggery', labels: false }, anim: { food: ['jaggery', 'dal'] }, view: { pos: [0.5, 7.8, 16.5], target: [0, 3.0, 0] }, spin: 0 },
    { ms: 5200, caption: 'Bitter gets about 25 receptors of its own, because bitter often means poison.', set: { food: 'karela', labels: false }, view: { pos: [2.5, 6.6, 12.5], target: [0, 2.6, 0] }, spin: 0.15 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    // cells under the membrane
    const cellMats = [];
    TASTES.forEach((t, i) => {
      const m = new THREE.MeshStandardMaterial({ color: CELL[t.id], roughness: 0.45, emissive: CELL[t.id], emissiveIntensity: 0, transparent: true, opacity: 0.92 });
      const c = new THREE.Mesh(new RoundedBoxGeometry(2.5, 3.2, 2.6, 4, 0.5), m); c.position.set(X[i], MEM_Y - 1.95, 0); root.add(c); cellMats.push(m);
    });
    // the tips of all five cells share one stretch of membrane in this model
    const mem = membrane(14.6, 3.0); mem.position.y = MEM_Y; root.add(mem);
    const recs = TASTES.map((t, i) => {
      const r = t.id === 'sweet' ? receptor('pair', [0xff9ec0, 0xd7b4ff]) : t.id === 'umami' ? receptor('pair', [0xffb547, 0xd7b4ff]) : t.id === 'bitter' ? receptor('t2r', [0x7ef0b0]) : t.id === 'sour' ? receptor('otop', [0xffe08a]) : receptor('enac', [0x8fb0ff]);
      r.position.set(X[i], MEM_Y, 0); root.add(r); clearHole(mem, X[i], 0, t.id === 'sweet' || t.id === 'umami' ? 1.15 : 0.75);
      return r;
    });
    // nerve fibres from each cell into one bundle heading to the brain
    const nerveMat = new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffd166, emissiveIntensity: 0.25, roughness: 0.4 });
    const paths = X.map((x) => { const pts = smoothPts([[x, MEM_Y - 3.5, 0], [x, MEM_Y - 4.6, 0.2], [x * 0.35 + 3.5, MEM_Y - 5.6, 0.6], [9.5, MEM_Y - 5.8, 0.8]], 30); root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.07, 6), nerveMat)); return pathOf(pts); });
    const sig = paths.map((p) => pulses(root, [p], { color: 0xfff1b0, size: 0.11, per: 4, speed: 0.55 }));
    // molecules
    const r = rng(21), POOL = 9, mols = [];
    TASTES.forEach((t, i) => {
      for (let k = 0; k < POOL; k++) {
        const m = molecule(t.id); m.scale.setScalar(t.id === 'sour' || t.id === 'salty' ? 1.6 : 1.5); m.visible = false; root.add(m);
        mols.push({ m, t: t.id, i, st: 'off', age: 0, from: new THREE.Vector3(), spin: new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(3) });
      }
    });
    // chloride ions stay outside (the Na⁺ goes in); capsaicin molecules drift past, touching nothing
    const extras = [];
    for (let k = 0; k < 8; k++) { const m = molecule('cl'); m.visible = false; root.add(m); extras.push({ m, kind: 'cl', ph: r() * 10, x: X[4] + (r() - 0.5) * 2.2, z: (r() - 0.5) * 2 }); }
    for (let k = 0; k < 10; k++) { const m = molecule('capsaicin'); m.scale.setScalar(1.5); m.visible = false; root.add(m); extras.push({ m, kind: 'cap', ph: r() * 10, x: (r() - 0.5) * 12, z: (r() - 0.5) * 2 }); }
    // board
    const act = { sweet: 0, umami: 0, bitter: 0, sour: 0, salty: 0 };
    const bd = board(root, 7.4, 3.1, 900, (g, w, h) => drawBoard(g, w, h, stage._s || { food: 'jaggery' }, act)); bd.mesh.position.set(5.9, 7.7, -3.2);
    // labels
    const labs = TASTES.map((t, i) => tint(stage.label(`<b>${t.name}</b> · ${t.receptor}`, [X[i], MEM_Y - 3.9 - (i % 2) * 0.75, 1.5], root), t.css));
    const saliva = stage.label('Saliva with dissolved food molecules', [-4.2, 5.3, 0], root);
    const memL = stage.label('Tip of each taste cell', [-8.6, MEM_Y + 0.2, 0.8], root);
    const brain = tint(stage.label('To the brain', [9.6, MEM_Y - 5.2, 0.8], root), 'gold');

    const bound = [0, 0, 0, 0, 0];
    let t = 0, lastFood = null, tick = 0;
    const fit = fitNarrow(stage, { pos: [1.2, 9, 24], target: [0, 2.6, 0] });
    return compactReadout(stage, {
      update(dt, s, time) {
        dt = Math.max(0, dt); t += dt; stage._s = s;
        const f = FOOD[s.food], narrow = fit();
        if (s.food !== lastFood) { lastFood = s.food; mols.forEach((o) => { o.st = 'off'; o.m.visible = false; }); }
        bound.fill(0);
        mols.forEach((o) => {
          const lvl = f.level[o.t] || 0, idx = mols.filter((q) => q.t === o.t).indexOf(o);
          const site = recs[o.i].site.clone().add(recs[o.i].position);
          if (o.st === 'off') {
            if (idx < lvl * 3 && r() < dt * 1.2) { o.st = 'fall'; o.age = 0; o.from.set(X[o.i] + (r() - 0.5) * 2.4, 7.5 + r() * 1.5, (r() - 0.5) * 2.2); o.m.position.copy(o.from); o.m.visible = true; }
            return;
          }
          o.age += dt;
          o.m.rotation.x += o.spin.x * dt; o.m.rotation.y += o.spin.y * dt;
          if (o.st === 'fall') {
            const k = clamp(o.age / 2.2, 0, 1), e = k * k * (3 - 2 * k);
            o.m.position.lerpVectors(o.from, site, e); o.m.position.x += Math.sin(o.age * 3 + o.from.z * 5) * 0.25 * (1 - e);
            if (k >= 1) { o.st = 'bound'; o.age = 0; }
          } else if (o.st === 'bound') {
            bound[o.i]++; o.m.position.copy(site);
            if (o.age > 1.0) { o.st = 'leave'; o.age = 0; }
          } else if (o.st === 'leave') {
            const channel = o.t === 'sour' || o.t === 'salty';
            if (channel) { o.m.position.copy(site).add(new THREE.Vector3(0, -o.age * 2.2, 0)); if (o.age < 1.1) bound[o.i] += 0.5; }
            else o.m.position.copy(site).add(new THREE.Vector3((r() - 0.5) * 0.02, o.age * 2.4, o.age * 0.8));
            if (o.age > 1.3) { o.st = 'off'; o.m.visible = false; }
          }
        });
        TASTES.forEach((tt, i) => {
          act[tt.id] = approach(act[tt.id], clamp(bound[i] / 2.5, 0, 1), 3, dt);
          recs[i].active(act[tt.id]); cellMats[i].emissiveIntensity = 0.6 * act[tt.id];
          sig[i].tick(time, act[tt.id] > 0.08 ? 1 : 0, 1);
        });
        extras.forEach((e) => {
          const on = e.kind === 'cl' ? (f.level.salty || 0) > 0 : !!f.heat;
          e.m.visible = on; if (!on) return;
          e.m.position.set(e.x + Math.sin(t * 0.7 + e.ph) * 0.6, MEM_Y + 1.6 + ((t * 0.5 + e.ph) % 5), e.z + Math.cos(t * 0.5 + e.ph) * 0.4);
          e.m.rotation.set(t * 0.8 + e.ph, t * 0.5, 0);
        });
        labs.forEach((l) => { l.visible = s.labels && !narrow; });
        saliva.visible = memL.visible = brain.visible = s.labels && !narrow;
        if ((tick += dt) > 0.1) { tick = 0; bd.redraw(); }
      },
      readout: (s) => {
        const f = FOOD[s.food];
        if (f.heat) return `<div class="big">Chilli: no taste at all</div>
          <div class="row"><span>Molecule</span><b>capsaicin</b></div>
          <div class="row"><span>Taste receptors it opens</span><b>none</b></div>
          <div class="row"><span>What it does open</span><b>TRPV1, a heat-pain sensor</b></div>
          <small>The burn of chilli is pain and heat on nerve endings, not one of the five tastes. The chilli chapter shows how.</small>`;
        const on = TASTES.filter((t) => (f.level[t.id] || 0) >= 2).sort((a, b) => f.level[b.id] - f.level[a.id]), main = on[0] || TASTES.find((t) => f.level[t.id]);
        return `<div class="big">${f.name}: ${on.map((t) => t.name.toLowerCase()).join(' + ') || 'faint'}</div>
          <div class="row"><span>Main molecule</span><b>${f.mols[main.id] || f.note}</b></div>
          <div class="row"><span>Receptor</span><b>${main.receptor}</b></div>
          <div class="row"><span>Weakest you can taste</span><b>${main.id === 'bitter' ? 'quinine' : main.id === 'sweet' ? 'sucrose' : main.id === 'salty' ? 'salt' : main.id === 'sour' ? 'acid' : 'MSG'} ≈ ${fmtMolar(THRESHOLD_M[main.id])}</b></div>
          <small>Bitter quinine can be noticed at about 8 µM, over 1,000 times weaker than sugar (10 mM): a sign that bitter is a warning. Textbook averages; people vary a lot.</small>`;
      },
    });
  },
};
