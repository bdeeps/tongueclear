// Chapter 1: the tongue and mouth. The tongue's shape and its four kinds of papillae, the muscles
// that move and shape it, its nerves, the teeth, palate and epiglottis, the salivary glands, then
// the papillae up close and a taste bud cut open.
// Facts: NCBI StatPearls "Anatomy, Head and Neck, Tongue"; Gray's Anatomy; NIDCD "Taste disorders";
// NCBI InformedHealth "How does our sense of taste work?"; Chandrashekar et al., Nature 444:288, 2006.
// Saliva: about 0.5–1.5 litres a day (Iorgulescu, J Med Life 2:303, 2009; StatPearls "Physiology,
// Salivation"), roughly two-thirds of the resting flow from the submandibular glands.
import { THREE } from '../kit.js';
import { makeMouth, compactReadout, fitNarrow, tint } from '../tongue.js';
import { makeBud, makePapillae } from '../cells.js';
import { REF } from '../taste.js';

const VIEWS = {
  mouth: { pos: [2.6, 14.4, 17.5], target: [-2.6, 0.9, 1.0] },
  papillae: { pos: [0.6, 8.2, 16.5], target: [-2.4, 1.0, 0] },
  bud: { pos: [2.2, 5.6, 14.5], target: [-2.6, 1.8, 0] },
};

export default {
  id: 'anatomy',
  short: 'Inside the mouth',
  title: 'The tongue and mouth',
  subtitle: 'A bundle of muscle, carpeted with bumps that hide thousands of taste buds.',
  view: VIEWS.mouth,
  learn: `<p>Your tongue is almost all <b>muscle</b>, about 10 cm long, wrapped in a moist pink lining. Four muscles on each side, the <b>extrinsic</b> muscles, tie it to the chin, the hyoid bone, the skull and the soft palate and move it around. Four more inside it, the <b>intrinsic</b> muscles, run lengthwise, across and up and down, and change its shape: long and thin, short and fat, curled or flat. It has no bone at all.</p>
    <p>The top is covered in tiny bumps, the <b>papillae</b>. There are four kinds. <b>Filiform</b> papillae are the most common: little spikes that feel texture but have <b>no taste buds</b>. <b>Fungiform</b> papillae are the red dots, thickest on the tip and edges. <b>Foliate</b> papillae are folds at the back of the sides. And a row of 8 to 12 big <b>circumvallate</b> papillae forms a <b>V</b> near the back, each sunk in its own moat.</p>
    <p>The taste buds hide in the fungiform, foliate and circumvallate papillae, with a few more on the soft palate and throat. An adult has about <b>${REF.buds}</b> of them. Each is an onion-shaped cluster of about <b>${REF.cellsPerBud} cells</b> with a tiny opening, the <b>taste pore</b>, where chemicals dissolved in spit reach the cells' tips.</p>
    <p>Three nerves carry taste to the brain: the <b>facial nerve (VII)</b> from the front two-thirds, the <b>glossopharyngeal (IX)</b> from the back third, and the <b>vagus (X)</b> from the throat. A fourth, the <b>hypoglossal (XII)</b>, moves the tongue. Three pairs of <b>salivary glands</b>, the parotid, submandibular and sublingual, make ${REF.saliva} of saliva. See where taste ends up in the brain in <a href="/brainclear/#map">BrainClear</a>.</p>
    <p class="tip"><b>Try it:</b> switch on X-ray to see the muscles and nerves, pull the mouth apart, then look at the papillae and a taste bud up close.</p>`,
  terms: [
    { t: 'Papillae', d: 'The small bumps on the top of the tongue. Three of the four kinds carry taste buds.' },
    { t: 'Taste bud', d: 'An onion-shaped cluster of about 50–150 cells that detect taste chemicals.' },
    { t: 'Taste pore', d: 'The tiny opening at the top of a taste bud where dissolved chemicals meet the cells.' },
    { t: 'Circumvallate papillae', d: 'The 8–12 large papillae in a V at the back of the tongue, each in its own moat.' },
    { t: 'Filiform papillae', d: 'The most common papillae: tiny spikes for touch and texture, with no taste buds.' },
    { t: 'Salivary glands', d: 'Glands that make saliva: the parotid, submandibular and sublingual pairs.' },
    { t: 'Hypoglossal nerve', d: 'Cranial nerve XII, which moves the tongue’s muscles.' },
  ],
  defaults: { show: 'mouth', explode: 0.4, xray: false, jaw: true, glands: true, labels: true },
  controls: [
    { key: 'show', type: 'seg', label: 'Look at', options: [{ v: 'mouth', label: 'Mouth' }, { v: 'papillae', label: 'Papillae' }, { v: 'bud', label: 'Taste bud' }] },
    { key: 'explode', type: 'range', label: 'Open it up', min: 0, max: 1, step: 0.01, ends: ['together', 'apart'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'xray', type: 'toggle', label: 'X-ray: muscles and nerves' },
    { key: 'jaw', type: 'toggle', label: 'Jaws, teeth and palate' },
    { key: 'glands', type: 'toggle', label: 'Salivary glands' },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'Which papillae have no taste buds at all?', options: ['Fungiform', 'Filiform', 'Circumvallate', 'Foliate'], answer: 1, why: 'Filiform papillae are tiny spikes that sense touch and texture. The other three kinds carry taste buds.' },
    { q: 'Where are the big circumvallate papillae?', options: ['On the tip', 'In a V near the back', 'Under the tongue', 'On the lips'], answer: 1, why: 'About 8 to 12 of them form a V just in front of the back third of the tongue.' },
    { q: 'What moves the tongue so it can change shape?', options: ['A bone inside it', 'Eight pairs of muscles', 'Air pressure', 'The teeth'], answer: 1, why: 'Four extrinsic and four intrinsic muscles on each side. There is no bone, so it works like an elephant’s trunk.' },
  ],
  reel: [
    { ms: 5200, caption: 'Your tongue is a bundle of muscle covered in thousands of tiny bumps called papillae.', set: { show: 'mouth', explode: 0.4, xray: false, jaw: true, glands: true, labels: false }, view: { pos: [6, 13.5, 13], target: [0, 1.0, -0.3] }, spin: 0.4 },
    { ms: 5400, caption: 'Hidden in them are 2,000 to 4,000 taste buds, each an onion of 50 to 150 cells.', set: { show: 'bud', labels: false }, view: { pos: [3.2, 4.2, 9.6], target: [0, 2.0, 0] }, spin: 0.3 },
  ],

  build({ stage }) {
    // --- mouth
    const mouth = makeMouth(stage); mouth.root.position.set(0, 1.6, 0); stage.root.add(mouth.root);
    const front = tint(stage.label('Facing you: their left is on your right', [0, -3.2, 7.2], mouth.root), 'side');
    // --- papillae
    const pap = makePapillae(stage); pap.root.position.set(0, 1.0, 0); stage.root.add(pap.root);
    const papL = [
      stage.label('Filiform: touch only, no buds', [-5.4, 2.6, 0.4], pap.root),
      tint(stage.label('Fungiform: a few buds on top', [-1.8, 2.5, 0.4], pap.root), 'red'),
      stage.label('Foliate: buds in the folds', [1.8, 2.3, 0.4], pap.root),
      tint(stage.label('Circumvallate: buds in the moat wall', [5.4, 1.6, 0.8], pap.root), 'violet'),
    ];
    const notScale = stage.label('Not to scale: a circumvallate papilla is 1–2 mm wide', [0, -1.2, 2.4], pap.root);
    // --- taste bud
    const bud = makeBud(stage); bud.root.position.set(0, 2.3, 0); stage.root.add(bud.root);
    const budL = [
      tint(stage.label('Taste pore', [0, 2.95, 0.4], bud.root), 'gold'),
      tint(stage.label('Receptor cells: sweet, umami, bitter', [2.4, 0.9, 1.6], bud.root), 'pink'),
      tint(stage.label('Sour cells', [-2.4, 0.6, 1.4], bud.root), 'yellow'),
      stage.label('Support cells', [-2.6, -1.2, 1.2], bud.root),
      tint(stage.label('Nerve fibres to the brain', [1.6, -4.3, 0.8], bud.root), 'gold'),
      stage.label('Lining of the tongue', [3.6, 2.6, -1.5], bud.root),
    ];

    let xr = 0, last = null, t = 0;
    const fit = fitNarrow(stage, { pos: [7, 19.5, 15.5], target: [0, 3.6, -0.5] });
    return compactReadout(stage, {
      update(dt, s, time) {
        dt = Math.max(0, dt); t += dt;
        if (s.show !== last) { if (last !== null && !document.body.classList.contains('gb-reel')) stage.setView(VIEWS[s.show].pos, VIEWS[s.show].target, 0.9); last = s.show; }
        const narrow = fit();
        mouth.root.visible = s.show === 'mouth'; pap.root.visible = s.show === 'papillae'; bud.root.visible = s.show === 'bud';
        xr += ((s.xray ? 1 : 0) - xr) * Math.min(1, dt * 5);
        mouth.setXray(xr); mouth.setExplode(s.explode); mouth.showJaw(s.jaw); mouth.showGlands(s.glands);
        mouth.showLabels(s.labels && mouth.root.visible, narrow);
        front.visible = s.labels && mouth.root.visible && !narrow;
        if (mouth.nerves.visible) mouth.tickSignals(time, 1);
        papL.forEach((l) => { l.visible = s.labels && pap.root.visible; }); notScale.visible = s.labels && pap.root.visible && !narrow;
        budL.forEach((l, i) => { l.visible = s.labels && bud.root.visible && (!narrow || i === 0 || i === 1); });
        if (bud.root.visible) bud.glow({ sweet: 0.5, umami: 0.5, bitter: 0.5, sour: 0.5, salty: 0.5 }, time);
      },
      readout: (s) => {
        if (s.show === 'bud') return `<div class="big">One taste bud</div>
          <div class="row"><span>Cells in a bud</span><b>about ${REF.cellsPerBud}</b></div>
          <div class="row"><span>Size</span><b>about 50–80 µm tall</b></div>
          <div class="row"><span>Cell life</span><b>${REF.cellLife}, then replaced</b></div>
          <small>Each receptor cell carries one kind of receptor. About half the cells are support cells; stem cells at the base make new ones.</small>`;
        if (s.show === 'papillae') return `<div class="big">Four kinds of papillae</div>
          <div class="row"><span>With taste buds</span><b>fungiform, foliate, circumvallate</b></div>
          <div class="row"><span>Without</span><b>filiform (touch, texture)</b></div>
          <div class="row"><span>Circumvallate</span><b>${REF.circumvallate}, each with hundreds of buds</b></div>
          <small>A fungiform papilla has only a few buds, but there are hundreds of them on the tip and edges.</small>`;
        return `<div class="big">About ${REF.buds} taste buds</div>
          <div class="row"><span>Tongue muscles</span><b>4 extrinsic + 4 intrinsic, each side</b></div>
          <div class="row"><span>Taste nerves</span><b>VII front, IX back, X throat</b></div>
          <div class="row"><span>Saliva</span><b>${REF.saliva}</b></div>
          <small>${s.xray ? 'Gold: facial nerve VII. Green: glossopharyngeal IX. Violet: vagus X. Blue: hypoglossal XII, which moves the tongue.' : 'The papillae make the top of the tongue rough. The red dots are fungiform papillae.'}</small>`;
      },
    });
  },
};
