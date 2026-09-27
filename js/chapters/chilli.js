// Chapter 4: chilli heat and minty cool. Not tastes but touch and pain: on the tips of pain and
// temperature nerve fibres in the tongue (from the trigeminal nerve, via the lingual nerve) sit
// TRPV1 channels, which open above about 43 °C and also when capsaicin binds, and TRPM8 channels,
// which open in the cold and with menthol. So chilli "feels" hot and mint "feels" cold.
// Capsaicin is oily: it slips into the membrane and binds TRPV1 from inside it (the vanilloid
// pocket; Cao, Liao, Cheng & Julius, Nature 504:113, 2013; Yang et al., Nat Chem Biol 11:518, 2015).
// Numbers and sources: taste.js (Scoville values, TRPV1/TRPM8 thresholds, milk vs water).
import { THREE, M, clamp, lerp, approach } from '../kit.js';
import { compactReadout, fitNarrow, tint, board, boardBg, rng, pathOf, smoothPts, pulses } from '../tongue.js';
import { membrane, clearHole, receptor, molecule } from '../cells.js';
import { CHILLIES, CHILLI, SHU_PER_PPM, PURE_CAPSAICIN_SHU, burnOf, pV1, pM8, TRPV1_T, TRPM8_T, WASH } from '../taste.js';

const fmt = (n) => Math.round(n).toLocaleString('en-US');
const feel = (h, c) => (h > 0.75 ? 'burning hot' : h > 0.4 ? 'hot' : h > 0.12 ? 'warm, tingly' : c > 0.6 ? 'icy cold' : c > 0.25 ? 'cool' : 'nothing much');

function drawScale(g, w, h, s) {
  boardBg(g, w, h, 'The Scoville scale (log)');
  const L = 60, R = w - 40, Y = h - 110;
  const X = (v) => L + ((Math.log10(Math.max(1, v)) - 1) / (Math.log10(PURE_CAPSAICIN_SHU) - 1)) * (R - L);
  const grd = g.createLinearGradient(L, 0, R, 0); grd.addColorStop(0, '#6fbf5a'); grd.addColorStop(0.45, '#ffb547'); grd.addColorStop(0.8, '#ff5a3c'); grd.addColorStop(1, '#b0142a');
  g.fillStyle = grd; g.fillRect(L, Y, R - L, 16);
  g.font = '17px sans-serif'; g.fillStyle = 'rgba(255,255,255,.55)';
  for (let e = 1; e <= 7; e++) { const x = X(10 ** e); g.fillRect(x - 1, Y + 16, 2, 8); g.fillText(e < 3 ? String(10 ** e) : e < 6 ? `${10 ** (e - 3)}k` : `${10 ** (e - 6)}M`, x - 12, Y + 44); }
  g.fillText('Scoville heat units (SHU)', L, h - 24);
  const pts = [...CHILLIES.filter((c) => c.shu > 0), { id: 'pure', name: 'Pure capsaicin', shu: PURE_CAPSAICIN_SHU }];
  pts.forEach((c, i) => {
    const x = X(c.shu), on = c.id === s.chilli, y = Y - 28 - (i % 3) * 46;
    g.fillStyle = on ? '#ffffff' : 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(x, Y + 8, on ? 11 : 6, 0, 7); g.fill();
    g.strokeStyle = on ? '#ffffff' : 'rgba(255,255,255,.25)'; g.lineWidth = on ? 2.5 : 1; g.beginPath(); g.moveTo(x, Y); g.lineTo(x, y + 6); g.stroke();
    g.font = on ? 'bold 25px sans-serif' : '21px sans-serif'; const tw = g.measureText(c.name).width;
    g.fillText(c.name, clamp(x - tw / 2, 12, w - tw - 12), y);
  });
  if (s.chilli === 'bell') { g.fillStyle = '#6fbf5a'; g.font = 'bold 21px sans-serif'; g.fillText('Bell pepper: 0 SHU (no capsaicin at all)', L, 86); }
}

export default {
  id: 'chilli',
  short: 'Chilli heat',
  title: 'Chilli heat is pain, not taste',
  subtitle: 'Capsaicin tricks a heat sensor; menthol tricks a cold one.',
  view: { pos: [0.4, 9.2, 19.5], target: [-0.6, 5.0, 0] },
  learn: `<p>The burn of a <b>chilli</b> is not one of the five tastes. It is a feeling of <b>heat and pain</b>, sensed not by taste buds but by the bare tips of nerve fibres all over your mouth (and your skin: that is why chilli on your fingers stings your eyes).</p>
    <p>On those nerve endings sits a tiny channel called <b>TRPV1</b>. Its real job is to warn you about burning heat: it opens above about <b>43 °C</b>. <b>Capsaicin</b>, the molecule that makes chillies hot, fits into TRPV1 and opens it too. So your brain gets the same message as from a hot pan: <b>fire!</b> Your face flushes and you sweat, even though nothing is actually hot. <b>David Julius</b> found TRPV1 in <b>1997</b> using capsaicin, and shared the <b>2021 Nobel Prize</b> with <b>Ardem Patapoutian</b>, who found touch sensors.</p>
    <p>Mint works the other way round. <b>Menthol</b> opens <b>TRPM8</b>, a sensor for cold, so mint chutney feels cool at room temperature.</p>
    <p>Heat is measured in <b>Scoville heat units</b> (SHU). A bell pepper has none, a <b>Kashmiri</b> chilli about 1,000 to 2,000 and a Guntur chilli tens of thousands. In <b>2007</b> the <b>bhut jolokia</b> from north-east India became the first chilli certified above a <b>million</b>. Capsaicin is oily, so <b>water</b> barely washes it off. <b>Milk</b> and <b>curd</b> work much better: their protein, <b>casein</b>, and fat carry it away. The spices themselves are ground in <a href="/mixerclear/">MixerClear</a>.</p>
    <p class="tip"><b>Try it:</b> pick a chilli, take a bite, then sip water and compare with milk. Then warm the food up, or add mint.</p>`,
  terms: [
    { t: 'Capsaicin', d: 'The oily molecule in chillies that opens TRPV1 and makes them feel hot.' },
    { t: 'TRPV1', d: 'An ion channel on pain nerve endings that opens above about 43 °C, and with capsaicin.' },
    { t: 'TRPM8', d: 'An ion channel on nerve endings that opens in the cold, and with menthol.' },
    { t: 'Scoville heat unit (SHU)', d: 'A measure of chilli heat: how many times an extract must be diluted before the heat can no longer be felt.' },
    { t: 'Casein', d: 'The main protein in milk and curd. It helps carry capsaicin away.' },
  ],
  defaults: { chilli: 'guntur', temp: 30, drink: 'none', menthol: false, cap: burnOf(37500), labels: true },
  onChange(s, key) { if (key === 'chilli' || key === null) s.cap = s.chilli ? burnOf(CHILLI[s.chilli].shu) : 0; },
  controls: [
    { key: 'chilli', type: 'seg', label: 'Chilli', options: CHILLIES.map((c) => ({ v: c.id, label: c.name.replace(' (capsicum)', '') })), fmt: (v) => `${CHILLI[v].range} SHU` },
    { key: 'bite', type: 'buttons', label: 'Eat', items: [{ label: 'Take a bite', act: (s) => { s.cap = Math.max(s.cap, burnOf(CHILLI[s.chilli].shu)); } }] },
    { key: 'drink', type: 'seg', label: 'Then have', options: [{ v: 'none', label: 'Nothing' }, { v: 'water', label: 'Water' }, { v: 'milk', label: 'Milk' }, { v: 'curd', label: 'Curd' }] },
    { key: 'temp', type: 'range', label: 'Food temperature', min: 5, max: 65, step: 0.5, ends: ['ice cold', 'scalding'], fmt: (v) => v.toFixed(0) + ' °C' },
    { key: 'menthol', type: 'toggle', label: 'Add mint (menthol)' },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'Which sensor does capsaicin switch on?', options: ['The sweet receptor', 'TRPV1, a heat and pain sensor', 'OTOP1, the sour channel', 'TRPM8, the cold sensor'], answer: 1, why: 'Capsaicin opens TRPV1, which normally opens above about 43 °C, so the brain reads chilli as heat.' },
    { q: 'Why does milk calm chilli burn better than water?', options: ['Milk is colder', 'Capsaicin is oily, and milk’s protein and fat carry it away', 'Water makes it spicier', 'Milk blocks taste buds'], answer: 1, why: 'Capsaicin barely dissolves in water. Casein and fat in milk and curd pull it off the nerve endings.' },
    { q: 'Why does mint feel cool?', options: ['It is always kept in the fridge', 'Menthol opens TRPM8, the cold sensor', 'It lowers the tongue’s temperature by 10 °C', 'It is a sixth taste'], answer: 1, why: 'Menthol switches on TRPM8, so the nerve reports "cold" even at room temperature.' },
  ],
  reel: [
    { ms: 5400, caption: 'Chilli is not a taste: capsaicin opens TRPV1, the same sensor that feels burning heat.', set: { chilli: 'guntur', temp: 30, drink: 'none', menthol: false, labels: false }, view: { pos: [-0.4, 6.8, 13.5], target: [-0.9, 3.4, 0] }, spin: 0 },
    { ms: 5600, caption: 'Bhut jolokia topped a million Scoville units in 2007. Milk washes capsaicin off far better than water.', set: { chilli: 'bhut', temp: 30, drink: 'milk', menthol: false, labels: false }, view: { pos: [2.2, 8.2, 17], target: [1.2, 4.6, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); root.position.x = 0.6; root.scale.setScalar(1.12); stage.root.add(root);
    const MY = 2.6, XV = -2.4, XM = 2.4;
    const mem = membrane(10, 3.4, { color: 0xf0c6a0 }); mem.position.y = MY; root.add(mem);
    // inside of the nerve ending, below the membrane
    const axo = new THREE.Mesh(new THREE.BoxGeometry(10, 1.8, 3.4), new THREE.MeshStandardMaterial({ color: 0xffe3a8, roughness: 0.6, transparent: true, opacity: 0.35, depthWrite: false })); axo.position.y = MY - 1.3; root.add(axo);
    const v1 = receptor('trp', [0xff5a3c]); v1.position.set(XV, MY, 0); root.add(v1);
    const m8 = receptor('trp', [0x6fc8ff]); m8.position.set(XM, MY, 0); root.add(m8);
    clearHole(mem, XV, 0, 1.0); clearHole(mem, XM, 0, 1.0);
    // nerve fibre to the brain with two kinds of signal
    const nerveMat = new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffd166, emissiveIntensity: 0.25 });
    const pv = pathOf(smoothPts([[XV, MY - 1.4, 0], [XV + 0.5, MY - 2.8, 0.4], [3.2, MY - 3.3, 0.8], [6.0, MY - 3.4, 1.0]], 30));
    const pm = pathOf(smoothPts([[XM, MY - 1.4, 0], [XM + 0.4, MY - 2.8, 0.4], [4.2, MY - 3.3, 0.8], [6.0, MY - 3.4, 1.0]], 30));
    [pv, pm].forEach((p) => root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p.points), 40, 0.09, 8), nerveMat)));
    const sigV = pulses(root, [pv], { color: 0xff7a5c, size: 0.14, per: 6, speed: 0.7 }), sigM = pulses(root, [pm], { color: 0x9fe0ff, size: 0.14, per: 6, speed: 0.7 });
    // capsaicin sits in the membrane (it is oily); menthol near TRPM8
    const r = rng(9), NC = 14, caps = [], ments = [];
    for (let i = 0; i < NC; i++) { const m = molecule('capsaicin'); m.scale.setScalar(1.4); root.add(m); const a = r() * Math.PI * 2, R = 0.95 + r() * 2.2; caps.push({ m, home: new THREE.Vector3(XV + Math.cos(a) * R, MY + 0.05, Math.sin(a) * R * 0.6), bound: i < 4, a: (i / 4) * Math.PI * 2 + 0.4, ph: r() * 9, out: new THREE.Vector3(XV + (r() - 0.5) * 6, MY + 3 + r() * 2, (r() - 0.5) * 2) }); }
    for (let i = 0; i < 8; i++) { const m = molecule('menthol'); m.scale.setScalar(1.5); root.add(m); ments.push({ m, bound: i < 4, a: (i / 4) * Math.PI * 2, ph: r() * 9, home: new THREE.Vector3(XM + (r() - 0.5) * 3, MY + 0.9 + r() * 2.2, (r() - 0.5) * 2) }); }
    // ions rushing in through open channels (Na⁺ and Ca²⁺)
    const NI = 40, ions = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 8, 6), M.glow(0xffffff), NI * 2); ions.frustumCulled = false; root.add(ions);
    const o = new THREE.Object3D();
    // thermometer: the food's temperature
    const th = new THREE.Group(); th.position.set(-6.4, MY + 0.2, 0.6); root.add(th);
    th.add(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 4.4, 20, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, roughness: 0.05, side: THREE.DoubleSide, depthWrite: false })));
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 14), M.glow(0xff5a3c)); bulb.position.y = -2.4; th.add(bulb);
    const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1, 14), M.glow(0xff5a3c)); th.add(fill);
    [[TRPV1_T, 'TRPV1 opens'], [TRPM8_T, 'TRPM8 opens']].forEach(([T]) => { const tick = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.04), M.glow(T > 30 ? 0xff9a7a : 0x9fe0ff)); tick.position.y = -2.2 + ((T - 0) / 70) * 4.4; th.add(tick); });
    // Scoville board
    const bd = board(root, 8.4, 3.9, 900, (g, w, h) => drawScale(g, w, h, stage._s || this.defaults)); bd.mesh.position.set(4.9, 7.4, -2.8);
    // labels
    const labs = [
      tint(stage.label('TRPV1: heat above 43 °C, and capsaicin', [XV, MY + 2.4, 0.4], root), '#ff9a7a'),
      tint(stage.label('TRPM8: cold, and menthol', [XM, MY + 2.4, 0.4], root), '#9fe0ff'),
      stage.label('Membrane of a pain nerve ending', [-5.4, MY - 0.9, 1.8], root),
      tint(stage.label('To the brain', [6.2, MY - 2.8, 1.0], root), 'gold'),
      stage.label('Food temperature', [-6.4, MY + 3.0, 0.6], root),
    ];
    const capL = tint(stage.label('Capsaicin', [XV - 2.4, MY + 0.9, 1.6], root), '#ff8a5c');
    let open1 = 0, open8 = 0, t = 0, tick = 0;
    const fit = fitNarrow(stage, { pos: [0, 9, 23], target: [0, 3.6, 0] });
    return compactReadout(stage, {
      update(dt, s, time) {
        dt = Math.max(0, dt); t += dt; stage._s = s;
        const narrow = fit();
        s.cap = Math.max(0, s.cap - s.cap * WASH[s.drink] * dt);
        open1 = approach(open1, pV1(s.temp, s.cap), 6, dt); open8 = approach(open8, pM8(s.temp, s.menthol ? 1 : 0), 6, dt);
        v1.active(open1); m8.active(open8);
        // capsaicin: the number present follows the load; four sit in TRPV1's pockets
        const n = Math.round(s.cap * NC);
        caps.forEach((c, i) => {
          c.m.visible = i < n;
          if (!c.m.visible) return;
          if (c.bound && i < 4) { const R = 0.62; c.m.position.set(XV + Math.cos(c.a) * R * 1.4, MY + 0.05, Math.sin(c.a) * R * 1.4); c.m.rotation.set(0, -c.a, 0); }
          else { c.m.position.copy(c.home); c.m.position.x += Math.sin(t * 0.8 + c.ph) * 0.12; c.m.rotation.set(0, t * 0.3 + c.ph, 0); }
          // while drinking milk or curd, some capsaicin leaves upwards, carried off
          if (s.drink === 'milk' || s.drink === 'curd') { const k = (t * 0.6 + c.ph) % 1; c.m.position.lerp(c.out, k * 0.8); }
        });
        ments.forEach((c, i) => {
          c.m.visible = s.menthol;
          if (!c.m.visible) return;
          if (c.bound) c.m.position.set(XM + Math.cos(c.a) * 0.85, MY + 0.3, Math.sin(c.a) * 0.85); else c.m.position.set(c.home.x + Math.sin(t + c.ph) * 0.3, c.home.y + Math.sin(t * 0.7 + c.ph) * 0.3, c.home.z);
          c.m.rotation.set(t * 0.5 + c.ph, t * 0.4, 0);
        });
        // ions
        for (let i = 0; i < NI * 2; i++) {
          const heat = i < NI, k = heat ? open1 : open8, x0 = heat ? XV : XM;
          const u = ((t * 0.9 + i * 0.137) % 1), on = (i % NI) / NI < k;
          o.position.set(x0 + Math.sin(i * 2.1) * 0.12, MY + 1.6 - u * 3.2, Math.cos(i * 2.1) * 0.12);
          o.scale.setScalar(on ? 1 : 0); o.updateMatrix(); ions.setMatrixAt(i, o.matrix);
        }
        ions.instanceMatrix.needsUpdate = true;
        sigV.tick(time, open1 > 0.1 ? open1 * 1.2 : 0, 1); sigM.tick(time, open8 > 0.1 ? open8 * 1.2 : 0, 1);
        const k = clamp(s.temp / 70, 0, 1); fill.scale.y = 4.4 * k; fill.position.y = -2.2 + 2.2 * k;
        const col = s.temp > TRPV1_T ? 0xff5a3c : s.temp < TRPM8_T ? 0x6fc8ff : 0xffb547; fill.material.color.set(col); bulb.material.color.set(col);
        labs.forEach((l) => { l.visible = s.labels && !narrow; });
        capL.visible = s.labels && n > 0 && !narrow;
        if ((tick += dt) > 0.2) { tick = 0; bd.redraw(); }
      },
      readout: (s) => {
        const c = CHILLI[s.chilli], ppm = c.shu / SHU_PER_PPM;
        return `<div class="big">Brain feels: ${feel(pV1(s.temp, s.cap), pM8(s.temp, s.menthol ? 1 : 0))}</div>
          <div class="row"><span>${c.name}</span><b>${c.range} SHU</b></div>
          <div class="row"><span>Capsaicin (1 ppm ≈ 16 SHU)</span><b>${c.shu ? `≈ ${fmt(ppm)} ppm${ppm > 1000 ? ` (${(ppm / 10000).toFixed(1)}%)` : ''}` : 'none'}</b></div>
          <div class="row"><span>Burn strength (log scale)</span><b>${Math.round(s.cap * 100)}%</b></div>
          <div class="row"><span>Heat sensor · cold sensor</span><b>${pV1(s.temp, s.cap) > 0.5 ? 'open' : 'shut'} · ${pM8(s.temp, s.menthol ? 1 : 0) > 0.5 ? 'open' : 'shut'}</b></div>
          <small>Capsaicin also lowers TRPV1’s 43 °C threshold, so hot tea after chilli hurts more. Wash-off speeds are illustrative.</small>`;
      },
    });
  },
};
