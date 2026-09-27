// Chapter 3: the tongue-map myth. The old textbook map (sweet on the tip, salty and sour on the
// sides, bitter at the back) against the truth: every part of the tongue that has taste buds can
// sense all five tastes. What varies from place to place is how many buds there are, and slightly,
// the weakest amount you can notice.
// History: D. P. Hänig, "Zur Psychophysik des Geschmackssinnes", Philosophische Studien 17:576–623
// (1901), measured small differences in threshold round the edge of the tongue. E. G. Boring's
// "Sensation and Perception in the History of Experimental Psychology" (1942) replotted his data
// in a way that was later read as "each taste only in its own zone". V. B. Collings,
// Perception & Psychophysics 16:169 (1974), re-tested and found all tastes everywhere, with small
// threshold differences; later work showed "threshold may differ, intensity does not" (Wikipedia
// "Tongue map"; Smithsonian Magazine "The tongue map: tasteless myth debunked", 2014).
// Taste-bud density model: tongue.js budDensity(). Small regional biases below are illustrative,
// in the direction Collings reported (tip a little keener on sweet, back on bitter, sides on sour).
import { THREE, M, clamp, lerp, smooth } from '../kit.js';
import { makeTongue, dorsum, dorsumNormal, budDensity, vLine, compactReadout, fitNarrow, tint, board, boardBg, TONGUE_PINK } from '../tongue.js';
import { TASTES, TASTE } from '../taste.js';

// The myth's zones.
export function mythZone(a, u) {
  const au = Math.abs(u);
  if (a < vLine(u) + 0.08 && a > 0.3) return 'bitter';
  if (a > 0.86) return 'sweet';
  if (au > 0.55 && a > 0.62) return 'salty';
  if (au > 0.55 && a > 0.4) return 'sour';
  return null;
}
const BIAS = { sweet: (a) => 1 + 0.15 * smooth((a - 0.75) / 0.2), bitter: (a) => 1 + 0.15 * (1 - smooth((a - 0.4) / 0.2)), sour: (a, u) => 1 + 0.12 * smooth((Math.abs(u) - 0.5) / 0.4), salty: (a, u) => 1 + 0.1 * smooth((Math.abs(u) - 0.4) / 0.4), umami: () => 1 };
export const sens = (t, a, u) => clamp(budDensity(a, u) * BIAS[t](a, u), 0, 1);
const word = (d) => (d > 0.6 ? 'lots' : d > 0.3 ? 'some' : d > 0.1 ? 'a few' : 'hardly any');
const SPOTS = { tip: [0.96, 0], side: [0.66, 0.93], back: [0.37, 0.25], middle: [0.62, 0.0] };

function drawBoard(g, w, h, s) {
  boardBg(g, w, h, 'At the cotton bud');
  const zone = mythZone(s.along, s.across);
  const L = 40, T = 110, bw = (w - 2 * L) / 5, H = h - T - 110;
  g.font = '20px sans-serif'; g.fillStyle = 'rgba(255,255,255,.6)';
  g.fillText('dim bar: what the myth says   ·   bright bar: what really happens', 28, 82);
  TASTES.forEach((t, i) => {
    const x = L + i * bw + 10, myth = zone === t.id ? 1 : 0, real = sens(t.id, s.along, s.across);
    g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(x, T, bw - 20, H);
    g.globalAlpha = 0.35; g.fillStyle = t.css; g.fillRect(x, T + H * (1 - myth), (bw - 20) / 2 - 3, H * myth);
    g.globalAlpha = 1; g.fillRect(x + (bw - 20) / 2 + 3, T + H * (1 - real), (bw - 20) / 2 - 3, H * real);
    g.font = `bold 22px sans-serif`; g.fillStyle = t.css; g.fillText(t.name, x, T + H + 32);
    if (t.id === s.taste) { g.strokeStyle = t.css; g.lineWidth = 3; g.strokeRect(x - 5, T - 5, bw - 10, H + 46); }
  });
  g.font = '18px sans-serif'; g.fillStyle = 'rgba(255,255,255,.5)'; g.fillText('Myth: Hänig 1901, misread after Boring 1942. Truth: Collings 1974 and later studies.', 28, h - 22);
}

export default {
  id: 'map',
  short: 'The map myth',
  title: 'The tongue map is a myth',
  subtitle: 'Every part of the tongue with taste buds tastes all five.',
  view: { pos: [-1.2, 17.5, 8.5], target: [-3.4, 1.4, 1.2] },
  learn: `<p>You may have seen a <b>tongue map</b> in a school book: sweet on the tip, salty and sour on the sides, bitter at the back. It is <b>wrong</b>. Try it: dab a little sugar water on the back of your tongue and you will taste sweet.</p>
    <p>The myth began with a careful German study in <b>1901</b>. <b>David Hänig</b> dripped tastes on the edges of people's tongues and found that some spots needed a <b>slightly</b> weaker or stronger solution before people noticed it. In <b>1942</b> the psychologist <b>Edwin Boring</b> redrew his results as a graph without units. Later writers read it as "each taste lives only in one zone", and the map spread into textbooks.</p>
    <p>In <b>1974</b> <b>Virginia Collings</b> tested it again and found every taste everywhere. Today we know why: <b>every taste bud</b> holds cells for all five tastes. What really changes across the tongue is <b>how many taste buds</b> there are. The tip, the edges and the V at the back have lots. The middle of the top has few, because it is mostly covered by filiform papillae, which have none.</p>
    <p class="tip"><b>Try it:</b> switch between the old map and the truth, then move the cotton bud around the tongue, and try the middle.</p>`,
  terms: [
    { t: 'Tongue map', d: 'A false diagram showing each taste sensed only in one zone of the tongue.' },
    { t: 'Threshold', d: 'The weakest strength of a taste that a person can just notice.' },
    { t: 'Taste-bud density', d: 'How many taste buds there are in one patch of tongue. It is highest on the tip, edges and back.' },
  ],
  defaults: { mode: 'myth', taste: 'sweet', along: 0.4, across: 0.2, labels: true },
  controls: [
    { key: 'mode', type: 'seg', label: 'Show', options: [{ v: 'myth', label: 'The old map' }, { v: 'truth', label: 'The truth' }] },
    { key: 'taste', type: 'seg', label: 'On the cotton bud', options: TASTES.map((t) => ({ v: t.id, label: t.name })) },
    { key: 'along', type: 'range', label: 'Cotton bud: back to tip', min: 0.34, max: 0.98, step: 0.005, ends: ['back', 'tip'] },
    { key: 'across', type: 'range', label: 'Cotton bud: side to side', min: -0.95, max: 0.95, step: 0.01, ends: ['right edge', 'left edge'] },
    { key: 'spot', type: 'buttons', label: 'Jump to', items: [{ label: 'Tip', act: (s) => { [s.along, s.across] = SPOTS.tip; } }, { label: 'Side', act: (s) => { [s.along, s.across] = SPOTS.side; } }, { label: 'Back V', act: (s) => { [s.along, s.across] = SPOTS.back; } }, { label: 'Middle', act: (s) => { [s.along, s.across] = SPOTS.middle; } }] },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'Can you taste sweet on the back of your tongue?', options: ['No, only on the tip', 'Yes: every area with taste buds senses all five tastes', 'Only if it is very sweet', 'Only in children'], answer: 1, why: 'Each taste bud has cells for all five tastes, so sweet, sour, salty, bitter and umami are sensed wherever there are buds.' },
    { q: 'Where did the tongue-map myth come from?', options: ['Ancient Greek doctors', 'A 1901 study of small threshold differences, redrawn in 1942 and misread', 'A 1990s advert', 'Measurements with modern scanners'], answer: 1, why: 'Hänig found small differences in sensitivity. Boring’s redrawn graph was later read as all-or-nothing zones.' },
    { q: 'Why is the middle of the top of your tongue less sensitive?', options: ['It has no nerves', 'It has few taste buds: it is mostly filiform papillae', 'It is covered in saliva', 'It only tastes bitter'], answer: 1, why: 'Filiform papillae, which have no taste buds, dominate the middle. The tip, edges and back have many more buds.' },
  ],
  reel: [
    { ms: 5600, caption: 'The famous tongue map is a myth: every part with taste buds tastes all five.', set: { mode: 'myth', taste: 'sweet', along: 0.38, across: 0.3, labels: false }, anim: { mode: ['myth', 'truth'], along: [0.38, 0.9] }, view: { pos: [0.6, 13.5, 7.5], target: [0, 2.0, 0.8] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); root.position.set(0, 2.2, 0); stage.root.add(root);
    const tg = makeTongue(stage); root.add(tg.root);
    tg.fil.visible = false;          // hide the filiform spikes so the colours show
    // colours
    const pink = new THREE.Color(TONGUE_PINK), cT = Object.fromEntries(TASTES.map((t) => [t.id, new THREE.Color(t.hex)])), gold = new THREE.Color(0xfff0b8), col = new THREE.Color();
    const paintMyth = () => tg.paint((a, u) => { const z = mythZone(a, u); return z ? col.copy(pink).lerp(cT[z], 0.95) : col.copy(pink); });
    const paintTruth = () => tg.paint((a, u) => col.copy(pink).lerp(gold, 0.85 * budDensity(a, u)));
    // cotton bud
    const probe = new THREE.Group(); root.add(probe);
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.2, 10), M.plastic(0xf4f4f4)); stick.position.y = 2.35; probe.add(stick);
    const cotton = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 14), M.matte(0xffffff)); cotton.scale.set(1, 1.35, 1); cotton.position.y = 0.3; probe.add(cotton);
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), M.glow(0xffffff)); drop.position.y = 0.08; drop.scale.set(1.3, 0.5, 1.3); probe.add(drop);
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.62, 40), M.ghost(0xffffff, 0.6)); halo.rotation.x = -Math.PI / 2; probe.add(halo);
    // board
    const bd = board(stage.root, 6.8, 4.1, 820, (g, w, h) => drawBoard(g, w, h, stage._s || this.defaults));
    bd.mesh.position.set(-7.4, 1.6, 4.2); bd.mesh.rotation.x = -1.0;
    // labels
    const L = {
      tip: stage.label('Tip', [0, 0.7, 5.6], root), back: stage.label('Back', [0, 0.4, -4.7], root),
      myth: [tint(stage.label('“Sweet”', [0, 1.3, 4.3], root), TASTE.sweet.css), tint(stage.label('“Salty”', [-2.3, 1.4, 2.4], root), TASTE.salty.css), tint(stage.label('“Sour”', [-2.6, 1.6, -0.4], root), TASTE.sour.css), tint(stage.label('“Bitter”', [0, 1.5, -2.9], root), TASTE.bitter.css)],
      truth: [tint(stage.label('Lots of buds on the tip and edges', [2.3, 1.5, 3.2], root), 'gold'), stage.label('Few in the middle', [0, 1.9, 0.6], root), tint(stage.label('The V: lots of buds', [0, 1.4, -3.2], root), 'gold')],
    };
    let lastMode = null, tick = 0;
    const fit = fitNarrow(stage, { pos: [0.6, 20, 12], target: [0, 1.5, 0.5] });
    const P = new THREE.Vector3();
    return compactReadout(stage, {
      update(dt, s, time) {
        dt = Math.max(0, dt); stage._s = s;
        const narrow = fit();
        if (s.mode !== lastMode) { lastMode = s.mode; s.mode === 'myth' ? paintMyth() : paintTruth(); }
        dorsum(s.along, s.across, undefined, P); const n = dorsumNormal(s.along, s.across);
        probe.position.copy(P); probe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n.clone().lerp(new THREE.Vector3(0, 1, 0.4).normalize(), 0.5).normalize());
        const c = TASTE[s.taste].hex; drop.material.color.set(c);
        const k = s.mode === 'myth' ? (mythZone(s.along, s.across) === s.taste ? 1 : 0) : sens(s.taste, s.along, s.across);
        halo.material.color.set(c); halo.material.opacity = 0.15 + 0.75 * k * (0.7 + 0.3 * Math.sin(time * 6)); halo.scale.setScalar(1 + 0.5 * k);
        L.tip.visible = L.back.visible = s.labels && !narrow;
        L.myth.forEach((l) => { l.visible = s.labels && s.mode === 'myth'; });
        L.truth.forEach((l) => { l.visible = s.labels && s.mode === 'truth' && !narrow; });
        if ((tick += dt) > 0.12) { tick = 0; bd.redraw(); }
      },
      readout: (s) => {
        const z = mythZone(s.along, s.across), d = budDensity(s.along, s.across), t = TASTE[s.taste];
        const ok = d > 0.1;
        return `<div class="big">${s.mode === 'myth' ? (z === s.taste ? `The map says: ${t.name.toLowerCase()} here` : `The map says: no ${t.name.toLowerCase()} here`) : ok ? `Yes, ${t.name.toLowerCase()} is tasted here` : 'Barely tasted here'}</div>
          <div class="row"><span>Taste buds at this spot</span><b>${word(d)}</b></div>
          <div class="row"><span>Old map’s zone</span><b>${z ? TASTE[z].name.toLowerCase() : 'none'}</b></div>
          <div class="row"><span>Tastes really sensed here</span><b>${ok ? 'all five' : 'all five, but faintly'}</b></div>
          <small>Sensitivity differs a little from place to place, but no area is blind to any taste. The middle feels weaker only because it has few taste buds.</small>`;
      },
    });
  },
};
