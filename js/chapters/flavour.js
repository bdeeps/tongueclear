// Chapter 5: flavour = taste + smell + touch + temperature. When you chew and breathe out, air
// carries aroma from the back of the mouth up into the nose ("retronasal" smell), where the
// olfactory patch picks it up. Block the nose and the airflow stops, so a mango shrinks to "sweet
// and a bit sour". Taste also needs saliva: molecules must dissolve to reach the taste pores.
// Sources: Rozin, "Taste–smell confusions and the duality of the olfactory sense", Percept
// Psychophys 31:397 (1982); Shepherd, "Smell images and the flavour system", Nature 444:316 (2006);
// Spence, "Just how much of what we taste derives from the sense of smell?", Flavour 4:30 (2015)
// (the popular "80%" figure has no firm basis; it is simply "a lot").
// Supertasters: Bartoshuk, Duffy & Miller, Physiol Behav 56:1165 (1994), about 25% of people in
// US samples find PROP intensely bitter, 25% can hardly taste it; linked to TAS2R38 and to the
// number of fungiform papillae. Kokumi: calcium-sensing receptor (Ohsu et al., J Biol Chem
// 285:1016, 2010). Fat: CD36 and GPR120 on taste cells; "oleogustus" proposed by Running, Craig &
// Mattes, Chem Senses 40:507 (2015). Both are still debated as basic tastes.
import { THREE, M, clamp, lerp, approach } from '../kit.js';
import { compactReadout, fitNarrow, tint, board, boardBg, pathOf, smoothPts, pulses } from '../tongue.js';
import { makeHead, stream } from '../head.js';
import { TASTES, TASTE } from '../taste.js';

// Foods: which tastes (0–3), what the nose adds, and what touch adds.
const FOODS = {
  mango: { name: 'Mango', taste: { sweet: 3, sour: 1 }, smell: 'ripe mango: fruity, flowery', touch: 'soft and juicy', color: 0xffb547 },
  chai: { name: 'Masala chai', taste: { sweet: 2, bitter: 1 }, smell: 'tea, ginger, cardamom', touch: 'hot; ginger adds a warm bite', color: 0xd9a066 },
  coffee: { name: 'Coffee', taste: { bitter: 3, sour: 1 }, smell: 'roasted coffee', touch: 'hot', color: 0x9b6a45 },
  pudina: { name: 'Mint chutney', taste: { sour: 2, salty: 2 }, smell: 'mint, coriander', touch: 'cool (menthol opens TRPM8)', color: 0x7ee08a },
};
const TASTER = { non: 0.55, medium: 1, super: 1.5 };

function drawBoard(g, w, h, s) {
  const f = FOODS[s.food], wet = s.saliva;
  boardBg(g, w, h, 'What you notice');
  const rows = [
    ...TASTES.map((t) => ({ name: t.name, col: t.css, v: wet ? clamp(((f.taste[t.id] || 0) / 3) * (t.id === 'bitter' ? TASTER[s.taster] : 1), 0, 1) : 0.04 * (f.taste[t.id] ? 1 : 0) })),
    { name: 'Smell', col: '#ffe08a', v: s.nose ? 0.04 : 1, note: s.nose ? 'blocked: no air flows up the nose' : f.smell },
    { name: 'Touch, heat', col: '#8ef0ff', v: 0.6, note: f.touch },
  ];
  const L = 190, T = 78, rh = (h - T - 70) / rows.length;
  rows.forEach((r, i) => {
    const y = T + i * rh;
    g.font = 'bold 22px sans-serif'; g.fillStyle = r.col; g.fillText(r.name, 28, y + rh * 0.62);
    g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(L, y + rh * 0.18, w - L - 30, rh * 0.62);
    g.fillStyle = r.col; g.fillRect(L, y + rh * 0.18, (w - L - 30) * r.v, rh * 0.62);
    if (r.note) { g.font = '19px sans-serif'; g.fillStyle = '#0b0d12'; if (r.v < 0.5) g.fillStyle = 'rgba(255,255,255,.8)'; g.fillText(r.note, L + 12, y + rh * 0.6); }
  });
  const tastes = TASTES.filter((t) => (f.taste[t.id] || 0) >= 1).map((t) => t.name.toLowerCase());
  g.font = 'bold 25px sans-serif'; g.fillStyle = '#e8eef8';
  g.fillText(!wet ? 'Dry tongue: hardly any taste at all' : s.nose ? `Flavour: just ${tastes.join(' and ')}` : `Flavour: ${f.name.toLowerCase()}!`, 28, h - 26);
}

export default {
  id: 'flavour',
  short: 'Flavour',
  title: 'Flavour is taste plus smell, and more',
  subtitle: 'Hold your nose and most of a food’s flavour disappears.',
  view: { pos: [30, 15.8, 9.8], target: [0, 12.2, 3.4] },
  learn: `<p>Your tongue senses just five tastes, yet you can tell mango from papaya, and masala chai from plain tea. The difference is <b>smell</b>. As you chew and breathe out, air carries aroma molecules from the back of your mouth <b>up into your nose</b>, to a small patch of smell sensors in its roof. This is called <b>retronasal smell</b>, and the brain files it under "taste", so it feels as if it comes from your tongue. How smell sensors work is in <a href="/noseclear/">NoseClear</a>.</p>
    <p>Try it with a sweet: <b>hold your nose</b> and it tastes only sweet and a little sour. Let go, air flows again, and suddenly it tastes of strawberry or mango. That is why food seems dull when you have a cold.</p>
    <p><b>Flavour</b> is the brain's mix of taste, smell, <b>touch</b> (crunchy, creamy, the dry pucker of amla or strong tea), <b>temperature</b>, and chilli or mint on the pain and cold sensors. Scientists are still arguing about extra tastes: <b>kokumi</b>, a "rich, mouth-filling" feeling, and <b>fat</b>. Both have receptors on taste cells, but neither is yet agreed to be a sixth basic taste.</p>
    <p>Taste needs <b>saliva</b>. Molecules must dissolve to reach the taste pores, so a grain of dry salt on a dried tongue tastes of almost nothing. And people differ: about a quarter of people in studies are <b>supertasters</b>, who find some bitter chemicals (like PROP) very strong, and tend to have more fungiform papillae; about a quarter barely taste them.</p>
    <p class="tip"><b>Try it:</b> pick a food, then hold the nose. Then dry the tongue, and switch between taster types with coffee.</p>`,
  terms: [
    { t: 'Flavour', d: 'The brain’s blend of taste, smell, touch, temperature and chemical feelings like chilli heat.' },
    { t: 'Retronasal smell', d: 'Smelling food from inside the mouth, as air flows up from the throat into the nose.' },
    { t: 'Olfactory patch', d: 'The small area of smell sensors in the roof of the nose.' },
    { t: 'Kokumi', d: 'A proposed “richness” taste linked to a calcium-sensing receptor. Still debated.' },
    { t: 'Supertaster', d: 'A person who finds certain bitter chemicals, like PROP, very intense. About a quarter of people.' },
  ],
  defaults: { food: 'mango', nose: false, saliva: true, taster: 'medium', labels: true },
  controls: [
    { key: 'food', type: 'seg', label: 'Eat', options: Object.entries(FOODS).map(([v, f]) => ({ v, label: f.name })) },
    { key: 'nose', type: 'toggle', label: 'Hold your nose' },
    { key: 'saliva', type: 'toggle', label: 'Saliva on the tongue' },
    { key: 'taster', type: 'seg', label: 'Bitter taster type', options: [{ v: 'non', label: 'Non-taster' }, { v: 'medium', label: 'Medium' }, { v: 'super', label: 'Supertaster' }] },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'Why does food taste dull when you have a blocked nose?', options: ['The tongue stops working', 'Aroma can no longer flow up to the smell sensors in your nose', 'Taste buds are in the nose', 'Colds kill taste buds'], answer: 1, why: 'Most of what we call flavour is retronasal smell: air carrying aroma from the mouth up into the nose.' },
    { q: 'Why can’t you taste dry salt on a dried tongue?', options: ['Salt has no taste', 'Molecules must dissolve in saliva to reach the taste pores', 'The tongue is too cold', 'Salt is only tasted at the back'], answer: 1, why: 'Taste chemicals have to be dissolved to reach the receptor cells through the taste pores.' },
    { q: 'What is a supertaster?', options: ['Someone with a sixth taste', 'Someone who finds some bitter chemicals, like PROP, very strong', 'A chef', 'Someone with no sense of smell'], answer: 1, why: 'About a quarter of people in studies find PROP intensely bitter, often with more fungiform papillae.' },
  ],
  reel: [
    { ms: 5800, caption: 'Hold your nose and mango tastes of little more than sweet and sour. Most flavour is smell.', set: { food: 'mango', nose: false, saliva: true, taster: 'medium', labels: false }, anim: { nose: [false, true] }, view: { pos: [27, 15.5, 2.5], target: [0, 13.6, -1.2] }, spin: 0 },
  ],

  build({ stage }) {
    const head = makeHead(stage); head.root.position.set(0, 11, 0); stage.root.add(head.root);
    const f0 = FOODS.mango;
    const aroma = stream(head.root, 70, f0.color, 0.13), breath = stream(head.root, 40, 0xcfe8ff, 0.07);
    const food = new THREE.Mesh(new THREE.SphereGeometry(0.75, 20, 14), M.plastic(f0.color, { roughness: 0.5 })); food.scale.set(1.2, 0.6, 1); food.position.set(0.4, 1.95, 1.9); head.root.add(food);
    const tPath = pathOf(head.nT.geometry.parameters.path.getPoints(60)), sPath = pathOf(head.nS.geometry.parameters.path.getPoints(30));
    const sigT = pulses(head.root, [tPath], { color: 0xfff1b0, size: 0.13, per: 6, speed: 0.4 }), sigS = pulses(head.root, [sPath], { color: 0xffffff, size: 0.13, per: 3, speed: 0.6 });
    const bd = board(stage.root, 8.2, 6.7, 820, (g, w, h) => drawBoard(g, w, h, stage._s || this.defaults));
    bd.mesh.position.set(1.5, 5.6, 15.8); bd.mesh.rotation.y = Math.PI / 2 + 0.15;
    const holdL = tint(stage.label('Nose held: no air flows', [0.6, 5.2, 10.4], head.root), 'blue');
    const aromaL = tint(stage.label('Aroma rises from the back of the mouth', [0.6, 3.5, -7.4], head.root), 'yellow');
    let t = 0, tick = 0, air = 1;
    const fit = fitNarrow(stage, { pos: [30, 15, 0], target: [0, 13, -4] });
    return compactReadout(stage, {
      update(dt, s, time) {
        dt = Math.max(0, dt); t += dt; stage._s = s;
        const f = FOODS[s.food], narrow = fit();
        aroma.material.color.set(f.color); food.material.color.set(f.color);
        air = approach(air, s.nose ? 0 : 1, 3, dt);
        head.clip.visible = s.nose;
        aroma.tick(head.paths.retro, time, { speed: 0.12, reach: lerp(0.33, 1, air), jitter: 0.16 });
        breath.tick(head.paths.breathOut, time, { speed: 0.2, reach: lerp(0.3, 1, air), on: 1, jitter: 0.1 });
        sigT.tick(time, s.saliva ? 1 : 0, 1); sigS.tick(time, air > 0.5 ? 1 : 0, 1);
        head.olf.material.emissiveIntensity = 0.1 + 0.8 * air * (0.6 + 0.4 * Math.sin(time * 5));
        head.gust.material.emissiveIntensity = 0.2 + 0.6 * (s.saliva ? 1 : 0.1);
        head.showLabels(s.labels, narrow);
        holdL.visible = s.labels && s.nose; aromaL.visible = s.labels && !s.nose && !narrow;
        if ((tick += dt) > 0.15) { tick = 0; bd.redraw(); }
      },
      readout: (s) => {
        const f = FOODS[s.food], tastes = TASTES.filter((tt) => f.taste[tt.id]).map((tt) => tt.name.toLowerCase()).join(' + ');
        return `<div class="big">${!s.saliva ? 'Almost no taste' : s.nose ? `Just ${tastes}` : `Tastes of ${f.name.toLowerCase()}`}</div>
          <div class="row"><span>Tongue (taste)</span><b>${s.saliva ? tastes : 'nothing dissolves'}</b></div>
          <div class="row"><span>Nose (smell)</span><b>${s.nose ? 'blocked' : f.smell}</b></div>
          <div class="row"><span>Touch and temperature</span><b>${f.touch}</b></div>
          <small>${s.food === 'coffee' || s.food === 'chai' ? `Bitterness felt by a ${s.taster === 'super' ? 'supertaster: much stronger' : s.taster === 'non' ? 'non-taster: weaker' : 'medium taster'}. ` : ''}Smell adds a large share of flavour; the popular “80%” figure has no firm measurement behind it.</small>`;
      },
    });
  },
};
