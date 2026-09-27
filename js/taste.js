// TongueClear's science: the five tastes and their receptors, the foods used in the chapters,
// the chilli heat scale, and reference numbers with their sources. No 3D here (see tongue.js
// and cells.js).
//
// Receptors (Chandrashekar, Hoon, Ryba & Zuker, "The receptors and cells for mammalian taste",
// Nature 444:288, 2006; Liman lab and Zuker lab papers on OTOP1, below):
//  - sweet:  T1R2 + T1R3, a pair of G-protein-coupled receptors (Nelson et al., Cell 106:381, 2001)
//  - umami:  T1R1 + T1R3, tuned to L-glutamate (Nelson et al., Nature 416:199, 2002)
//  - bitter: about 25 T2Rs in humans (Adler et al., Cell 100:693, 2000; Matsunami et al.,
//            Nature 404:601, 2000). Many bitter cells carry several T2Rs, so one cell answers
//            to many bitter chemicals: good for a warning sense.
//  - sour:   OTOP1, a proton (H⁺) channel in type III taste cells (Tu et al., Science 359:1047,
//            2018; Teng et al., Curr Biol 29:3647, 2019; Zhang et al., Cell 179:392, 2019)
//  - salty:  ENaC, the epithelial sodium channel, for pleasant low salt (Chandrashekar et al.,
//            Nature 464:297, 2010). Very salty food also recruits the bitter and sour cells,
//            which is why it tastes unpleasant (Oka et al., Nature 494:472, 2013).
// Sweet, umami and bitter receptors sit on type II cells, which release ATP onto the nerve;
// sour cells (type III) make real synapses. One receptor cell carries one kind of taste receptor.

export const TASTES = [
  { id: 'sweet', name: 'Sweet', css: '#ff9ec0', hex: 0xff9ec0, receptor: 'T1R2 + T1R3', kind: 'a pair of receptors that clamp onto sugars', what: 'sugars: a sign of energy', cell: 'type II' },
  { id: 'umami', name: 'Umami', css: '#ffb547', hex: 0xffb547, receptor: 'T1R1 + T1R3', kind: 'a pair of receptors that clamp onto glutamate', what: 'glutamate: a sign of protein', cell: 'type II' },
  { id: 'bitter', name: 'Bitter', css: '#7ef0b0', hex: 0x7ef0b0, receptor: '~25 kinds of T2R', kind: 'about 25 receptor types, each catching many chemicals', what: 'many plant poisons: a warning', cell: 'type II' },
  { id: 'sour', name: 'Sour', css: '#ffe08a', hex: 0xffe08a, receptor: 'OTOP1', kind: 'a channel that lets protons (H⁺) in', what: 'acids: unripe or spoiled food', cell: 'type III' },
  { id: 'salty', name: 'Salty', css: '#8fb0ff', hex: 0x8fb0ff, receptor: 'ENaC', kind: 'a channel that lets sodium ions (Na⁺) in', what: 'sodium: a mineral we need', cell: 'its own salt cells' },
];
export const TASTE = Object.fromEntries(TASTES.map((t) => [t.id, t]));

// Detection thresholds, the weakest solution most people can notice (Guyton & Hall, Textbook of
// Medical Physiology, "The chemical senses": HCl 0.0009 N, NaCl 0.01 M, sucrose 0.01 M, quinine
// 0.000008 M). Umami: MSG about 0.012 g per 100 mL ≈ 0.7 mM (Yamaguchi, Physiol Behav 49:833, 1991).
// Thresholds vary a lot between people and studies; these are classic textbook values.
export const THRESHOLD_M = { sweet: 0.01, salty: 0.01, sour: 0.0009, umami: 0.0007, bitter: 0.000008 };
export const fmtMolar = (m) => (m >= 0.001 ? `${+(m * 1000).toPrecision(2)} mM` : `${+(m * 1e6).toPrecision(2)} µM`);

// Foods for the picker: which receptors their main molecules reach. Levels are words, not
// measurements: strong / some / trace (3 / 2 / 1). The chemistry behind each:
//  - jaggery (gur): concentrated cane-sugar juice, mostly sucrose.
//  - tamarind (imli): tartaric acid is its main acid, with plenty of sugar too
//    (FAO / Kew "Tamarindus indica"; El-Siddig et al., Tamarind monograph, 2006).
//  - salt: sodium chloride.
//  - bitter gourd (karela): bitter cucurbitane triterpenoids such as momordicin
//    (Grover & Yadav, J Ethnopharmacol 93:123, 2004).
//  - tomato dal: ripe tomato has up to ~250 mg free glutamate per 100 g (Umami Information Center),
//    with citric acid; the dal is salted.
//  - amla (Indian gooseberry): strongly sour (ascorbic and other acids) with tannins that make it
//    bitter-astringent. Astringency is a dry, puckering touch feeling, not a taste.
//  - green chilli: capsaicin, which no taste receptor detects. It opens TRPV1 (chapter "chilli").
export const FOODS = [
  { id: 'jaggery', name: 'Jaggery', note: 'mostly sucrose', level: { sweet: 3, salty: 1 }, mols: { sweet: 'sucrose' } },
  { id: 'tamarind', name: 'Tamarind', note: 'tartaric acid and sugar', level: { sour: 3, sweet: 2 }, mols: { sour: 'H⁺ from tartaric acid', sweet: 'sugars' } },
  { id: 'salt', name: 'Salt', note: 'sodium chloride', level: { salty: 3 }, mols: { salty: 'Na⁺' } },
  { id: 'karela', name: 'Karela', note: 'bitter momordicins', level: { bitter: 3 }, mols: { bitter: 'momordicin' } },
  { id: 'dal', name: 'Tomato dal', note: 'glutamate, acid and salt', level: { umami: 3, salty: 2, sour: 2, sweet: 1 }, mols: { umami: 'glutamate', salty: 'Na⁺', sour: 'H⁺ from citric acid', sweet: 'sugars' } },
  { id: 'amla', name: 'Amla', note: 'acids and tannins', level: { sour: 3, bitter: 2 }, mols: { sour: 'H⁺', bitter: 'tannins' } },
  { id: 'chilli', name: 'Green chilli', note: 'capsaicin', level: {}, mols: {}, heat: true },
];
export const FOOD = Object.fromEntries(FOODS.map((f) => [f.id, f]));
export const LEVEL = ['none', 'trace', 'some', 'strong'];

// ---------------------------------------------------------------- chilli heat
// Scoville scale: Wilbur Scoville's 1912 dilution test (J Am Pharm Assoc 1:453, 1912); today
// capsaicinoids are measured by HPLC and 1 ppm (mg/kg) ≈ 16 SHU, so pure capsaicin ≈ 16,000,000
// SHU (ASTA method 21.3; Wikipedia "Scoville scale"). Ranges vary with variety, soil and weather.
//  - Kashmiri chilli ~1,000–2,000 SHU (pepperscale.com; Spices Board of India describes it as
//    mild and grown for colour).
//  - Guntur Sannam ~35,000–40,000 SHU (Wikipedia "Guntur Sannam", Spices Board of India).
//  - Bhut jolokia 1,001,304 SHU by HPLC at New Mexico State University; Guinness World Records
//    certified it as the hottest chilli in 2007 (Bosland & Baral, HortScience 42:222, 2007).
//  - Carolina Reaper 1,641,183 SHU average (Guinness, 2017); Pepper X 2,693,000 SHU (Guinness, 2023).
export const CHILLIES = [
  { id: 'bell', name: 'Bell pepper (capsicum)', shu: 0, range: '0' },
  { id: 'kashmiri', name: 'Kashmiri chilli', shu: 1500, range: '1,000–2,000' },
  { id: 'jalapeno', name: 'Jalapeño', shu: 5000, range: '2,500–8,000' },
  { id: 'guntur', name: 'Guntur Sannam', shu: 37500, range: '35,000–40,000' },
  { id: 'habanero', name: 'Habanero', shu: 200000, range: '100,000–350,000' },
  { id: 'bhut', name: 'Bhut jolokia', shu: 1001304, range: '1,001,304 (Guinness 2007)' },
  { id: 'reaper', name: 'Carolina Reaper', shu: 1641183, range: '1,641,183 (Guinness 2017)' },
];
export const CHILLI = Object.fromEntries(CHILLIES.map((c) => [c.id, c]));
export const SHU_PER_PPM = 16;
export const PURE_CAPSAICIN_SHU = 16e6;
// How strong the burn feels. Like most senses, felt intensity grows roughly with the logarithm of
// the dose (Weber–Fechner), so we map SHU on a log scale from ~100 (barely noticed) to ~3 million.
export const burnOf = (shu) => (shu <= 100 ? shu / 100 * 0.02 : Math.min(1, 0.02 + (0.98 * Math.log10(shu / 100)) / Math.log10(3e6 / 100)));

// TRPV1 opens above about 43 °C (Caterina et al., Nature 389:816, 1997; Nobel Prize in Physiology
// or Medicine 2021, David Julius). Capsaicin lowers that threshold, so a chilli-coated tongue finds
// warm tea hotter. TRPM8 opens below about 25–28 °C and with menthol (McKemy, Neuhausser & Julius,
// Nature 416:52, 2002; Peier et al., Cell 108:705, 2002, Patapoutian lab).
export const TRPV1_T = 43, TRPM8_T = 26;
// Open probability, a smooth step of a few degrees (Boltzmann-like; heat-gated channels are very
// steep, Q10 > 10). `cap` (0–1) is capsaicin load, which shifts the heat threshold down by up to
// ~10 °C (Caterina 1997 reported capsaicin and heat sensitising each other).
export const pV1 = (T, cap = 0) => { const heat = 1 / (1 + Math.exp(-(T - (TRPV1_T - 10 * cap)) / 1.4)); return 1 - (1 - heat) * (1 - cap); };
export const pM8 = (T, menthol = 0) => { const cold = 1 / (1 + Math.exp((T - TRPM8_T) / 2.2)); return 1 - (1 - cold) * (1 - 0.9 * menthol); };

// Washing capsaicin off the nerve endings. Capsaicin is oily and hardly dissolves in water, but
// dissolves in fat and is carried off by milk proteins (casein). In a panel of 72 people, whole and
// skim milk cut the burn the most and water much less; skim did as well as whole, so the protein
// matters more than the fat (Nolden, Lenart & Hayes, "Putting out the fire", Physiol Behav
// 208:112557, 2019). Rates below are illustrative: milk and curd clear it several times faster.
export const WASH = { none: 0.02, water: 0.06, milk: 0.45, curd: 0.5 };

// ---------------------------------------------------------------- reference numbers
// Taste buds: about 2,000–4,000 in adults, some up to 8,000 (NCBI InformedHealth, "How does our
// sense of taste work?"; Wikipedia "Taste bud"). Each bud holds about 50–150 receptor cells
// (Chandrashekar et al. 2006). Taste cells last about 10 days on average, some much longer
// (Beidler & Smallman, J Cell Biol 27:263, 1965; Perea-Martinez et al., PLoS One 8:e56494, 2013).
// Circumvallate papillae: about 8–12 in a V (Gray's Anatomy; Wikipedia gives 10–14).
// Supertasters: about 25% of people in US studies, 50% medium tasters, 25% non-tasters of PROP;
// shares differ between populations (Bartoshuk, Duffy & Miller, Physiol Behav 56:1165, 1994).
// PTC non-tasters: about 30% worldwide, 2–42% depending on ancestry (Wikipedia "Phenylthiocarbamide").
export const REF = {
  buds: '2,000–4,000',
  cellsPerBud: '50–150',
  cellLife: 'about 10 days',
  circumvallate: '8–12',
  bitterReceptors: 'about 25',
  saliva: 'about 0.5–1.5 L a day',
};
