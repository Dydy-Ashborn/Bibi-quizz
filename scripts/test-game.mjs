/* Tests de la logique pure + contrôle des banques. Lancer : node scripts/test-game.mjs */
import assert from 'node:assert/strict';
import { BUZZ, THEMES, FAF, CATEGORIES, byId, themeById, fafById } from '../js/data/questions.js';
import { juger, cle, tirerSoiree, prendre, cibleQualifies, r1Elimine, valeurR1, r1Bonne, r1Fini,
         r1Cloture, r2Reponse, r2Classement, valeurFaf, fafVainqueur, classementSoiree,
         grandeFinale, etoiler, trophees, nbEmissions } from '../js/game.js';

let ok = 0;
const t = (nom, fn) => { fn(); ok++; console.log('✓', nom); };
const avert = [];

t('banque buzzer : champs, ids uniques, catégories connues', () => {
  const ids = new Set();
  for (const q of BUZZ) {
    assert.ok(q.id && !ids.has(q.id), 'id dupliqué ' + q.id); ids.add(q.id);
    assert.ok(CATEGORIES[q.c], `${q.id} catégorie inconnue ${q.c}`);
    assert.ok(q.q.trim().endsWith('?'), q.id + ' sans ?');
    assert.ok(q.r && q.r.length <= 40, q.id + ' réponse vide ou trop longue');
    assert.ok([1, 2, 3].includes(q.d), q.id + ' difficulté');
  }
  const parCat = {};
  BUZZ.forEach(q => { parCat[q.c] = (parCat[q.c] || 0) + 1; });
  for (const c of Object.keys(CATEGORIES)) assert.ok(parCat[c] >= 10, `catégorie ${c} trop maigre`);
  console.log(`   ${BUZZ.length} questions buzzer, ${Object.keys(CATEGORIES).length} catégories`);
});

t('banque thèmes et face-à-face : structure', () => {
  for (const th of THEMES) {
    assert.ok(th.id && th.titre && th.questions.length >= 12, th.id + ' incomplet');
    for (const q of th.questions) assert.ok(q.q.trim().endsWith('?') && q.r, th.id + ' ' + q.q);
  }
  for (const f of FAF) {
    assert.equal(f.indices.length, 4, f.id + ' doit avoir 4 indices');
    assert.ok(f.theme && f.r, f.id);
  }
  console.log(`   ${THEMES.length} thèmes (${THEMES.reduce((n, x) => n + x.questions.length, 0)} q.), ${FAF.length} énigmes`);
});

t('correction : chaque réponse et variante de la banque est acceptée', () => {
  const toutes = [...BUZZ, ...THEMES.flatMap(x => x.questions), ...FAF];
  for (const q of toutes) {
    assert.ok(juger(q.r, q), 'réponse refusée : ' + q.r);
    for (const a of q.alt || []) assert.ok(juger(a, q), `variante refusée : ${a} (${q.r})`);
  }
});

t('correction : tolérance raisonnable', () => {
  const q = { r: 'Victor Hugo', alt: ['Hugo'] };
  assert.ok(juger('victor hugo', q));
  assert.ok(juger('Victor Hugoo', q));
  assert.ok(juger('hugo', q));
  assert.ok(juger("c'est Victor Hugo", q));
  assert.ok(!juger('Zola', q));
  assert.ok(!juger('', q));
  assert.ok(juger('la joconde', { r: 'Joconde' }));
  assert.ok(juger('Leonard de Vinci', { r: 'Léonard de Vinci' }));
  assert.ok(juger('tik tok', { r: 'TikTok' }));
  assert.ok(!juger('Lion', { r: 'Lyon' }));
  assert.ok(!juger('1798', { r: '1789' }));
  assert.ok(juger('1789', { r: '1789' }));
  assert.ok(juger('Mbape', { r: 'Kylian Mbappé', alt: ['Mbappé'] }));
  assert.ok(!juger('Mars', { r: 'Mercure' }));
});

t("correction : la réponse d'une autre question de la même catégorie n'est jamais acceptée", () => {
  const parCat = {};
  BUZZ.forEach(q => (parCat[q.c] = parCat[q.c] || []).push(q));
  for (const list of Object.values(parCat)) {
    for (const a of list) for (const b of list) {
      if (a === b || cle(a.r) === cle(b.r)) continue;
      if ([b.r, ...(b.alt || [])].some(x => [a.r, ...(a.alt || [])].some(y => cle(x) === cle(y)))) continue;
      if (juger(b.r, a)) avert.push(`« ${b.r} » accepté pour « ${a.r} »`);
    }
  }
  assert.ok(avert.length <= 3, 'correction trop laxiste :\n' + avert.join('\n'));
});

t('correction : pas de confusion entre réponses d\'un même thème ni entre énigmes', () => {
  const meme = (a, b) => [a.r, ...(a.alt || [])].some(x => [b.r, ...(b.alt || [])].some(y => cle(x) === cle(y)));
  const conf = [];
  for (const th of THEMES) for (const a of th.questions) for (const b of th.questions)
    if (a !== b && !meme(a, b) && juger(b.r, a)) conf.push(`${th.titre} : ${b.r} → ${a.r}`);
  for (const a of FAF) for (const b of FAF) if (a !== b && !meme(a, b) && juger(b.r, a)) conf.push(`${b.r} → ${a.r}`);
  assert.deepEqual(conf, []);
  assert.ok(!juger('Louis XVI', { r: 'Louis XIV' }) && juger('Louis 14', { r: 'Louis XIV' }));
  assert.ok(!juger('Mont-Saint-Michel', { r: 'Claude Monet', alt: ['Monet'] }));
  assert.ok(!juger('Manet', { r: 'Monet' }) && juger('Pairs', { r: 'Paris' }) && juger('en 1789', { r: '1789' }));
});

t("face-à-face : la réponse n'apparaît pas en toutes lettres dans les indices", () => {
  const fuites = [];
  for (const f of FAF) {
    const r = cle(f.r);
    if (r.length < 4) continue;
    f.indices.forEach((ind, i) => { if ((' ' + cle(ind) + ' ').includes(' ' + r + ' ')) fuites.push(`${f.id} indice ${i + 1} : ${f.r}`); });
  }
  if (fuites.length) console.log('   fuites :', fuites.join(' | '));
  assert.ok(fuites.length === 0, 'réponse visible dans un indice');
});

t('tirage : complet, sans doublon, ton respecté, déjà-vues en fin', () => {
  const s = tirerSoiree({ ton: 'mix' });
  assert.equal(new Set(s.r1).size, BUZZ.length);
  assert.equal(new Set(s.r2).size, THEMES.length);
  assert.equal(new Set(s.faf).size, FAF.length);
  const m = tirerSoiree({ ton: 'moderne' });
  assert.ok(m.r1.every(id => CATEGORIES[byId[id].c].ere === 'moderne'));
  assert.ok(m.r2.every(id => themeById[id].ere === 'moderne'));
  assert.ok(m.faf.every(id => fafById[id].ere === 'moderne'));
  const vues = s.r1.slice(0, 100);
  const s2 = tirerSoiree({ ton: 'mix', exclude: vues });
  // Tri par paquets de 40 : seul le paquet à la frontière frais/déjà-vus peut les mélanger.
  assert.ok(s2.r1.slice(0, BUZZ.length - 140).every(id => !vues.includes(id)));
  // En « mix », les thèmes proposés par lot de 4 sont panachés.
  const lot = s.r2.slice(0, 4).map(id => themeById[id].ere);
  assert.ok(lot.includes('moderne') && lot.includes('classique'));
});

t('tirage : jamais deux catégories identiques de suite quand c\'est évitable', () => {
  const s = tirerSoiree({ ton: 'mix' });
  let doubles = 0;
  for (let i = 1; i < 120; i++) if (byId[s.r1[i]].c === byId[s.r1[i - 1]].c) doubles++;
  assert.ok(doubles <= 2, 'doublons de catégorie : ' + doubles);
});

t('prendre : pointeur et bouclage', () => {
  assert.deepEqual(prendre(['a', 'b', 'c'], 2, 2), { ids: ['c', 'a'], ptr: 4 });
});

t('manche 1 : barème télé 1/2/3 points et qualification à 9', () => {
  assert.equal(valeurR1(5), 1); assert.equal(valeurR1(4), 1);
  assert.equal(valeurR1(3), 2); assert.equal(valeurR1(2), 3);
  assert.equal(cibleQualifies(4), 3); assert.equal(cibleQualifies(8), 3);
  assert.equal(cibleQualifies(3), 2); assert.equal(cibleQualifies(2), 1);
  assert.ok(r1Elimine(4) && !r1Elimine(3));
  const ins = ['a', 'b', 'c', 'd'];
  let r1 = { scores: {}, qualifies: [] };
  for (let i = 0; i < 9; i++) r1 = { ...r1, ...r1Bonne(r1, 'a', ins) };
  assert.deepEqual(r1.qualifies, ['a']);
  const r = r1Bonne(r1, 'b', ins);        // 3 candidats en lice → 2 points
  assert.equal(r.pts, 2);
  assert.ok(!r1Fini(r1, ins));
  const clo = r1Cloture({ scores: { a: 9, b: 6, c: 2, d: 4 }, qualifies: ['a'] }, ins);
  assert.deepEqual(clo.qualifies, ['a', 'b', 'd']); assert.deepEqual(clo.elimines, ['c']);
  const clo3 = r1Cloture({ scores: { a: 9 }, qualifies: ['a'] }, ['a', 'b', 'c']);
  assert.equal(clo3.elimines.length, 0); assert.equal(clo3.qualifies.length, 3);
});

t('manche 2 : rafale, points acquis, poursuite après quatre et classement', () => {
  let tr = { serie: 0, best: 0, tBest: null };
  tr = r2Reponse(tr, true, 3000); tr = r2Reponse(tr, true, 6000);
  tr = r2Reponse(tr, false, 9000);
  assert.equal(tr.serie, 2); assert.equal(tr.best, 2); assert.equal(tr.tBest, 6000);
  for (let i = 0; i < 4; i++) tr = r2Reponse(tr, true, 20000 + i);
  assert.equal(tr.fini, false); assert.equal(tr.best, 6);
  const cl = r2Classement({ a: { best: 2, tBest: 9000 }, b: { best: 3, tBest: 30000 }, c: { best: 2, tBest: 5000 } }, ['a', 'b', 'c']);
  assert.deepEqual(cl, ['b', 'c', 'a']);
});

t('face-à-face : 4/3/2/1 points, premier à 12', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(valeurFaf), [4, 3, 2, 1, 1]);
  assert.equal(fafVainqueur({ a: 11, b: 12 }, ['a', 'b']), 'b');
  assert.equal(fafVainqueur({ a: 11 }, ['a', 'b']), null);
});

t('soirée : classement, grande finale, trophées', () => {
  const j = [{ uid: 'a', name: 'Ash' }, { uid: 'b', name: 'Bea' }, { uid: 'c', name: 'Cy' }];
  assert.equal(nbEmissions('soiree'), 2);
  let s = { victoires: { a: 1, b: 1 }, etoiles: etoiler({ a: 4 }, ['b'], 5) };
  assert.deepEqual(grandeFinale(s, j, 2), ['b', 'a']);
  assert.equal(grandeFinale({ victoires: { a: 2 }, etoiles: {} }, j, 2), null);
  assert.equal(grandeFinale(s, j, 1), null);
  const c = classementSoiree(s, j);
  assert.deepEqual(c.map(l => [l.uid, l.rang]), [['b', 1], ['a', 2], ['c', 3]]);
  const tr = trophees({ bonnes: { a: 5, b: 2 }, reflexes: { a: 3000, b: 1200 }, series: { c: 4 }, cats: { a: { rap: 3 } } }, j);
  assert.deepEqual(tr.map(x => x.uid), ['a', 'b', 'c', 'a']);
});

if (avert.length) console.log('\nÀ surveiller :\n  ' + avert.join('\n  '));
console.log(`\n${ok} tests OK`);
