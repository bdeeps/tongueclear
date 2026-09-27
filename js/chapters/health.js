// Chapter 6: keeping the tongue healthy and what can go wrong. General facts only, never advice.
// Scene 1, renewal: taste cells live about 10 days on average, some much longer, and basal stem
// cells replace them (Beidler & Smallman, J Cell Biol 27:263, 1965; Perea-Martinez et al., PLoS
// One 8:e56494, 2013, who found an average near 8 days with some cells surviving 3 weeks or more).
// A scald from very hot tea damages the lining and taste cells; they regrow from the stem cells,
// so taste usually returns as it heals. Our timings are illustrative within that range.
// Scene 2, movement: the tongue is a "muscular hydrostat" (Kier & Smith, Zool J Linn Soc 83:307,
// 1985): muscle with no bone that keeps its volume, so squeezing one way makes it longer another.
// Its shapes make speech sounds and push food back when swallowing (StatPearls "Physiology,
// Swallowing"; Ladefoged, "A Course in Phonetics").
// Things that change taste (NHS "Loss of taste or smell"; NIDCD "Taste disorders"; WHO/CDC on
// COVID-19): ageing, smoking, colds and COVID-19 (mostly via smell), some medicines, dry mouth,
// mouth infections and dental problems, burns. NIDCD: over 200,000 people a year in the US visit a
// doctor for a chemosensory problem.
import { THREE, M, clamp, lerp, smooth, approach } from '../kit.js';
import { compactReadout, fitNarrow, tint, board, boardBg } from '../tongue.js';
import { makeBud } from '../cells.js';
import { makeHead } from '../head.js';
import { REF } from '../taste.js';

const VIEWS = { renew: { pos: [2.6, 6.2, 15.5], target: [-2.6, 2.4, 0] }, move: { pos: [28, 15.5, 10.5], target: [0, 12.2, 4.6] } };
const SOUNDS = {
  rest: { pose: {}, say: 'Resting: the tongue lies on the floor of the mouth.' },
  t: { pose: { tip: 1 }, say: '“t” and “d”: the tip presses on the ridge behind the upper teeth.' },
  k: { pose: { back: 1 }, say: '“k” and “g”: the back rises to the soft palate.' },
  ee: { pose: { front: 1 }, say: '“ee”: the front arches up close to the hard palate.' },
  aa: { pose: { low: 1 }, say: '“aa”: the tongue drops low and flat.' },
  swallow: { pose: {}, say: 'Swallowing: a squeeze runs from tip to back and pushes food into the throat.' },
};
const CHANGERS = [
  ['Getting older', 'fewer taste cells and weaker smell, often from the 60s'],
  ['Smoking', 'dulls taste and smell'],
  ['Colds, flu, COVID-19', 'mostly by blocking or harming smell'],
  ['Some medicines, dry mouth', 'less saliva, odd tastes'],
  ['Burns from hot tea', 'heal in days as cells renew'],
];
function drawBoard(g, w, h) {
  boardBg(g, w, h, 'Things that can change taste');
  CHANGERS.forEach(([a, b], i) => { const y = 100 + i * 62; g.fillStyle = '#ffd166'; g.font = 'bold 24px sans-serif'; g.fillText(a, 30, y); g.fillStyle = 'rgba(255,255,255,.72)'; g.font = '20px sans-serif'; g.fillText(b, 30, y + 26); });
  g.fillStyle = '#8ef0ff'; g.font = 'bold 21px sans-serif'; g.fillText('Taste changed suddenly, or not back after a few weeks?', 30, h - 56); g.fillText('See a doctor or dentist.', 30, h - 26);
}

export default {
  id: 'health',
  short: 'Healthy tongue',
  title: 'Keeping it healthy, and what changes it',
  subtitle: 'Taste cells renew every week or two; the tongue muscle talks and swallows.',
  view: VIEWS.renew,
  learn: `<p>This chapter shares general facts only. If your sense of taste changes, or your tongue is sore, <b>talk to a doctor or dentist</b>.</p>
    <p><b>Always renewing.</b> Taste cells wear out fast. On average they last about <b>10 days</b>, though some live for weeks, and <b>stem cells</b> at the base of each bud keep making new ones. That is why a tongue scalded by very hot <b>tea</b> usually tastes normally again once it heals, often within days to a couple of weeks.</p>
    <p><b>What can change taste.</b> Taste and smell often fade slowly with <b>age</b>. <b>Smoking</b> dulls both. A <b>cold</b> or <b>COVID-19</b> can take away smell, and with it most flavour; for most people it comes back within weeks, but for some it takes much longer. Some <b>medicines</b>, a <b>dry mouth</b> and mouth or tooth problems can change taste too. Brushing your teeth and gently cleaning your tongue keep the mouth healthy.</p>
    <p><b>A clever muscle.</b> The tongue is a <b>muscular hydrostat</b>, like an octopus arm or an elephant's trunk: muscle with no bone that keeps the same volume, so squeezing it one way makes it longer another way. Its shapes make the sounds of speech, and when you <b>swallow</b> it squeezes food back into the throat while the soft palate and epiglottis close off the nose and windpipe. Food then heads down to the stomach: see <a href="/stomachclear/">StomachClear</a>.</p>
    <p class="tip"><b>Try it:</b> let the days run and watch taste cells being replaced, then scald the tongue with hot tea. Then switch to “Moving” and try each sound.</p>`,
  terms: [
    { t: 'Stem cell', d: 'A cell that can divide to make new cells of other kinds, like new taste cells.' },
    { t: 'Muscular hydrostat', d: 'A body part made of muscle with no bone that keeps its volume, like the tongue or an elephant’s trunk.' },
    { t: 'Dry mouth', d: 'Too little saliva, which can make tasting and swallowing harder. Doctors call it xerostomia.' },
    { t: 'Swallowing', d: 'The tongue pushes food back; the soft palate seals the nose and the epiglottis covers the windpipe.' },
  ],
  defaults: { topic: 'renew', run: true, day: 0, burn: -99, sound: 'rest', labels: true },
  controls: [
    { key: 'topic', type: 'seg', label: 'Show', options: [{ v: 'renew', label: 'Renewing taste cells' }, { v: 'move', label: 'Moving' }] },
    { key: 'run', type: 'toggle', label: 'Let the days run' },
    { key: 'day', type: 'range', label: 'Day', min: 0, max: 40, step: 0.1, ends: ['day 0', 'day 40'], fmt: (v) => 'day ' + Math.floor(v) },
    { key: 'tea', type: 'buttons', label: 'Oops', items: [{ label: 'Scald it with hot tea', act: (s) => { s.burn = s.day; } }, { label: 'Start again', act: (s) => { s.burn = -99; s.day = 0; } }] },
    { key: 'sound', type: 'seg', label: 'Moving: say or do', options: [{ v: 'rest', label: 'Rest' }, { v: 't', label: 't' }, { v: 'k', label: 'k' }, { v: 'ee', label: 'ee' }, { v: 'aa', label: 'aa' }, { v: 'swallow', label: 'Swallow' }] },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'About how long does a taste cell usually last?', options: ['A day', 'About 10 days, some longer', 'A year', 'For life'], answer: 1, why: 'Most taste cells are replaced within a week or two by stem cells at the base of the bud.' },
    { q: 'Why does food taste flat with a heavy cold or COVID-19?', options: ['Taste buds fall off', 'Mostly because smell is blocked or harmed, and flavour depends on smell', 'The tongue gets colder', 'Saliva stops completely'], answer: 1, why: 'Much of flavour is smell. When the nose is blocked or its sensors are harmed, food seems bland.' },
    { q: 'What kind of structure is the tongue?', options: ['A bone with muscle on it', 'A muscular hydrostat: muscle with no bone', 'A gland', 'A hollow bag of air'], answer: 1, why: 'Like an elephant’s trunk, it is all muscle and keeps its volume, so it can stretch, curl and bunch up.' },
  ],
  reel: [
    { ms: 5400, caption: 'Taste cells are replaced about every 10 days, so a tongue scalded by hot tea usually recovers.', set: { topic: 'renew', run: true, day: 2, burn: 4.5, labels: false }, view: { pos: [1.2, 4.8, 10.5], target: [0, 2.2, 0] }, spin: 0.25 },
    { ms: 5000, caption: 'All muscle and no bone, the tongue reshapes itself for every sound you speak.', set: { topic: 'move', sound: 't', labels: false }, anim: { sound: ['t', 'k'] }, view: { pos: [27, 15, 5], target: [0, 13.2, 0.6] }, spin: 0 },
  ],

  build({ stage }) {
    // ---------- renewal scene
    const bud = makeBud(stage, { cells: 72, seed: 8 }); bud.root.position.set(0, 2.3, 0); stage.root.add(bud.root);
    const n = bud.cells.length;
    const life = bud.cells.map((c, i) => 7 + ((i * 37) % 11) * 0.7 + (i % 9 === 0 ? 12 : 0));   // ~7–14 days, a few much longer
    const born = bud.cells.map((c, i) => -((i * 0.618) % 1) * life[i]);
    const base = bud.cells.map((c) => c.mat.color.clone()), white = new THREE.Color(0xffffff);
    const topMat = bud.root.children.find((m) => m.geometry?.type === 'RingGeometry').material, topCol = topMat.color.clone(), burnCol = new THREE.Color(0xa02a2a);
    const bd = board(stage.root, 6.4, 5.2, 760, (g, w, h) => drawBoard(g, w, h)); bd.mesh.position.set(-7.6, 0.6, 3.0); bd.mesh.rotation.y = 0.3; bd.redraw();
    const rL = [tint(stage.label('New cells from stem cells at the base', [2.6, -2.4, 1.2], bud.root), 'side'), tint(stage.label('Old cells fade and are shed', [-2.9, 1.6, 1.2], bud.root), '')];
    const burnL = tint(stage.label('Scalded: lining and taste cells damaged', [0, 3.3, 0.6], bud.root), 'red');
    // ---------- movement scene
    const head = makeHead(stage); head.root.position.set(0, 11, 0); stage.root.add(head.root); head.clip.visible = false;
    const bolus = new THREE.Mesh(new THREE.SphereGeometry(0.6, 18, 12), M.plastic(0xd9a066, { roughness: 0.6 })); bolus.scale.set(1.3, 0.7, 1); head.root.add(bolus);
    const sayL = tint(stage.label('', [0.6, -4.8, 3.5], head.root), 'side');
    let last = null, shown = null, t = 0, pose = { tip: 0, front: 0, back: 0, low: 0, wave: -1 }, dayShown = -1;
    const fit = fitNarrow(stage, null);
    const tg = head.tongue;
    return compactReadout(stage, {
      update(dt, s, time) {
        dt = Math.max(0, dt); t += dt;
        const narrow = fit();
        if (s.topic !== last) { if (last !== null && !document.body.classList.contains('gb-reel')) stage.setView(VIEWS[s.topic].pos, VIEWS[s.topic].target, 0.9); last = s.topic; }
        const renew = s.topic === 'renew';
        bud.root.visible = bd.mesh.visible = renew; head.root.visible = !renew;
        if (renew) {
          if (s.run) s.day = (s.day + dt * 1.2) % 40;     // about a day per second
          const d = s.day, since = d - s.burn;
          bud.cells.forEach((c, i) => {
            const age = ((d - born[i]) % life[i] + life[i]) % life[i], L = life[i];
            let op = age < 1 ? age : age > L - 1 ? L - age : 1, fresh = clamp(1 - age / 2, 0, 1);
            if (since >= 0 && since < 14) { const regrow = 0.8 + (i / n) * 9; if (since < regrow) op = 0.08; else { fresh = clamp(1 - (since - regrow) / 2, 0, 1); op = Math.min(op, clamp(since - regrow, 0, 1)); } }
            c.mat.opacity = 0.12 + 0.88 * op; c.mat.depthWrite = op > 0.5;
            c.mat.color.copy(base[i]).lerp(white, 0.55 * fresh);
            c.mv.visible = op > 0.5;
          });
          const burnK = since >= 0 ? clamp(1 - since / 7, 0, 1) : 0;
          topMat.color.copy(topCol).lerp(burnCol, burnK);
          bud.glow({}, time);
          rL.forEach((l) => { l.visible = s.labels && !narrow; }); burnL.visible = s.labels && burnK > 0.2;
        } else {
          rL.forEach((l) => { l.visible = false; }); burnL.visible = false;
          const snd = SOUNDS[s.sound], target = { tip: 0, front: 0, back: 0, low: 0, ...snd.pose };
          let changed = false;
          ['tip', 'front', 'back', 'low'].forEach((k) => { const v = approach(pose[k], target[k], 7, dt); if (Math.abs(v - pose[k]) > 1e-3) changed = true; pose[k] = v; });
          if (s.sound === 'swallow') { pose.wave = (t * 0.55) % 1.25; if (pose.wave > 1) pose.wave = -1; changed = true; } else if (pose.wave !== -1) { pose.wave = -1; changed = true; }
          if (changed || shown !== s.sound) { tg.setShape(pose); shown = s.sound; }
          // food ball: rides the squeeze back, then drops down the throat
          bolus.visible = s.sound === 'swallow';
          if (bolus.visible) {
            const w = pose.wave < 0 ? 1.2 : pose.wave;
            const z = lerp(3.2, -4.6, clamp(w / 0.85, 0, 1)), y = w < 0.85 ? 2.0 - 0.3 * w : lerp(1.4, -5.5, clamp((w - 0.85) / 0.35, 0, 1));
            bolus.position.set(0.5, y, w < 0.85 ? z : -5.1);
          }
          // soft palate lifts and epiglottis tips down while swallowing
          const sw = s.sound === 'swallow' && pose.wave > 0.6 ? 1 : 0;
          head.soft.rotation.x = approach(head.soft.rotation.x, -0.12 * sw, 8, dt);
          head.epi.rotation.x = approach(head.epi.rotation.x, 0.25 * sw, 8, dt);
          head.showLabels(s.labels, narrow);
          sayL.visible = s.labels; sayL.element.innerHTML = `<b>${snd.say}</b>`;
        }
      },
      readout: (s) => {
        if (s.topic === 'move') return `<div class="big">${s.sound === 'swallow' ? 'Swallowing' : s.sound === 'rest' ? 'At rest' : `Saying “${s.sound}”`}</div>
          <div class="row"><span>Muscles</span><b>4 extrinsic + 4 intrinsic, each side</b></div>
          <div class="row"><span>Bones inside</span><b>none: a muscular hydrostat</b></div>
          <div class="row"><span>Nerve that moves it</span><b>hypoglossal (XII)</b></div>
          <small>${SOUNDS[s.sound].say}</small>`;
        const since = s.day - s.burn;
        return `<div class="big">Day ${Math.floor(s.day)}${since >= 0 && since < 14 ? `: ${since < 3 ? 'scalded' : since < 10 ? 'healing' : 'nearly healed'}` : ''}</div>
          <div class="row"><span>Average taste-cell life</span><b>${REF.cellLife}, some weeks</b></div>
          <div class="row"><span>New cells come from</span><b>stem cells at the base</b></div>
          <div class="row"><span>Taste buds in an adult</span><b>${REF.buds}</b></div>
          <small>General facts only. If taste changes suddenly, or does not come back after a few weeks, see a doctor or dentist.</small>`;
      },
    });
  },
};
