/* Bibi Quizz — logique de jeu pure.
 * Aucun accès au DOM ni à Firebase : testé tel quel sous Node (scripts/test-game.mjs).
 *
 * Déroulé d'une émission (fidèle à l'émission télé dont le jeu s'inspire) :
 *   1. Neuf points gagnants — buzzer. Une bonne réponse vaut 1 point tant qu'il reste
 *      4 candidats ou plus en lice, 2 points à 3, 3 points à 2. À 9 points : qualifié.
 *   2. 4 à la suite — chacun son thème, 60 s, une erreur remet la série à zéro.
 *      On retient la meilleure série ; égalité : le plus rapide à l'atteindre.
 *   3. Face-à-face — énigmes à indices, 4/3/2/1 points selon l'indice, premier à 12.
 */
import { BUZZ, THEMES, FAF, CATEGORIES, ereDe } from './data/questions.js';
import { RULES } from './config.js';

/* ═══════════════ Correction des réponses tapées ═══════════════ */

const ARTICLES = new Set(['le', 'la', 'les', 'l', 'un', 'une', 'des', 'du', 'de', 'd', 'the', 'a', 'au', 'aux']);

/** Minuscule, sans accents ni ponctuation, espaces normalisés. */
export function normaliser(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/œ/g, 'oe').replace(/æ/g, 'ae').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[-−](?=\d)/g, ' moins ')
    .replace(/&/g, ' et ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim().replace(/\s+/g, ' ');
}

/** Normalise puis retire les articles (« la Joconde » = « Joconde »). */
export function cle(s) {
  const mots = normaliser(s).split(' ').filter(Boolean);
  const utiles = mots.filter(m => !ARTICLES.has(m));
  return (utiles.length ? utiles : mots).join(' ');
}

export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/** Fautes tolérées selon la longueur de la réponse attendue. Courte = exacte
 *  (« Lyon » ≠ « Lion », « Mars » ≠ « Mers »). */
export function tolerance(n) {
  if (n <= 4) return 0;
  if (n <= 7) return 1;
  if (n <= 12) return 2;
  return 3;
}

/** Deux lettres voisines inversées (« Pairs » pour « Paris ») : faute de frappe typique. */
function inversion(a, b) {
  if (a.length !== b.length) return false;
  const d = [];
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d.push(i);
  return d.length === 2 && d[1] === d[0] + 1 && a[d[0]] === b[d[1]] && a[d[1]] === b[d[0]];
}

/**
 * Proche à la faute de frappe près. Sur les mots courts (≤ 7 lettres), on refuse la
 * simple SUBSTITUTION d'une lettre : c'est elle qui transforme un nom en un autre
 * (Monet/Manet, Nancy/Sancy). Lettre oubliée, en trop ou inversée : acceptée.
 */
function proche(t, a) {
  if (t === a) return true;
  const tol = tolerance(a.length);
  if (tol === 0) return false;
  if (inversion(t, a)) return true;
  const d = levenshtein(t, a);
  if (d > tol) return false;
  if (tol === 1 && t.length === a.length) return false;
  return true;
}

const ROMAIN = /^m{0,3}(cm|cd|d?c{0,3})(xc|xl|l?x{0,3})(ix|iv|v?i{0,3})$/;
function romainVersNombre(r) {
  const v = { i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000 };
  let n = 0;
  for (let i = 0; i < r.length; i++) n += v[r[i]] < (v[r[i + 1]] || 0) ? -v[r[i]] : v[r[i]];
  return n;
}
/** Nombres d'une réponse (chiffres, ou chiffres romains après le premier mot : « Louis XIV »). */
function nombres(mots) {
  return mots.map((m, i) => /^\d+$/.test(m) ? String(Number(m))
    : (i > 0 && m.length <= 7 && ROMAIN.test(m)) ? String(romainVersNombre(m)) : null).filter(Boolean);
}

function correspond(tape, attendu) {
  if (!tape || !attendu) return false;
  if (tape === attendu) return true;
  const motsA = attendu.split(' '), motsT = tape.split(' ');
  // Les nombres doivent être exacts, jamais « presque » : 1789 ≠ 1798, Louis XIV ≠ Louis XVI.
  // Louis 14 = Louis XIV.
  const nA = nombres(motsA), nT = nombres(motsT);
  if (nA.length || nT.length) {
    if (nA.join(' ') !== nT.join(' ')) return false;
    const sansNb = m => m.filter((x, i) => !(/^\d+$/.test(x) || (i > 0 && x.length <= 7 && ROMAIN.test(x)))).join('');
    const a = sansNb(motsA), t = sansNb(motsT);
    return a === t || (a === '' && ['','en'].includes(t)) || proche(t, a);   // réponse purement numérique : « en 1789 » passe
  }
  const sa = attendu.replace(/ /g, ''), st = tape.replace(/ /g, '');
  if (st === sa) return true;                                   // « tik tok » = « tiktok »
  if (proche(st, sa)) return true;
  // Réponse noyée dans une phrase courte : « c'est booba », « je dirais Paris ».
  // Exacte pour les réponses courtes (sinon « Mont » passerait pour « Monet »).
  if (motsT.length > motsA.length && motsT.length <= motsA.length + 3) {
    for (let i = 0; i + motsA.length <= motsT.length; i++) {
      const bout = motsT.slice(i, i + motsA.length).join('');
      if (bout === sa || (sa.length > 7 && proche(bout, sa))) return true;
    }
  }
  return false;
}

/**
 * Juge une réponse tapée.
 * @param {string} texte   ce que le joueur a tapé
 * @param {{r:string, alt?:string[]}} q
 * @returns {boolean}
 */
export function juger(texte, q) {
  const t = cle(texte);
  if (t.length < 1 || !q) return false;
  const attendus = [q.r, ...(q.alt || [])].map(cle).filter(Boolean);
  return attendus.some(a => correspond(t, a));
}

/* ═══════════════ Tirages ═══════════════ */

export function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const garderEre = ton => e => ton === 'mix' || !ton || e === ton;

/** Réordonne pour éviter deux catégories identiques consécutives (glouton). */
export function alternerCategories(list) {
  const reste = list.slice();
  const out = [];
  while (reste.length) {
    const prev = out.length ? out[out.length - 1].c : null;
    const prev2 = out.length > 1 ? out[out.length - 2].c : null;
    let k = reste.findIndex(q => q.c !== prev && q.c !== prev2);
    if (k < 0) k = reste.findIndex(q => q.c !== prev);
    if (k < 0) k = 0;
    out.push(reste.splice(k, 1)[0]);
  }
  return out;
}

/**
 * Tire l'ordre complet des questions d'une soirée (consommé au fil des émissions).
 * Les questions déjà jouées sur cet appareil (`exclude`) passent en fin de liste :
 * si la banque s'épuise, on rejoue plutôt que de s'arrêter.
 *
 * @param {{ton?:string, exclude?:string[], pools?:{buzz,themes,faf}, rng?:Function}} o
 * @returns {{ r1:string[], r2:string[], faf:string[] }}
 */
export function tirerSoiree({ ton = 'mix', exclude = [], pools = {}, rng = Math.random } = {}) {
  const vu = new Set(exclude);
  const buzz = (pools.buzz || BUZZ).filter(q => garderEre(ton)(ereDe(q)));
  const themes = (pools.themes || THEMES).filter(t => garderEre(ton)(t.ere));
  const faf = (pools.faf || FAF).filter(q => garderEre(ton)(q.ere));
  const fraisPuisVus = list => [...shuffle(list.filter(x => !vu.has(x.id)), rng),
                                ...shuffle(list.filter(x => vu.has(x.id)), rng)];

  // Buzzer : faciles et moyennes d'abord dans chaque paquet de 40, difficiles glissées ensuite.
  const b = fraisPuisVus(buzz);
  const r1 = [];
  for (let i = 0; i < b.length; i += 40) {
    // Clé tirée une fois par question : un comparateur aléatoire rendrait le tri incohérent.
    const paquet = b.slice(i, i + 40).map(q => ({ q, k: (q.d || 2) + rng() * 1.6 }))
      .sort((x, y) => x.k - y.k).map(x => x.q);
    r1.push(...alternerCategories(paquet));
  }

  // Thèmes : alternance classique / moderne pour que chaque lot de 4 soit panaché en « mix ».
  let r2 = fraisPuisVus(themes);
  if (ton === 'mix') {
    const cl = r2.filter(t => t.ere === 'classique'), mo = r2.filter(t => t.ere !== 'classique');
    r2 = [];
    while (cl.length || mo.length) { if (mo.length) r2.push(mo.shift()); if (cl.length) r2.push(cl.shift()); }
  }
  return { r1: r1.map(q => q.id), r2: r2.map(t => t.id), faf: fraisPuisVus(faf).map(q => q.id) };
}

/** Prend `n` éléments d'une liste à partir d'un pointeur, en bouclant si besoin. */
export function prendre(list, ptr, n = 1) {
  const out = [];
  if (!list.length) return { ids: out, ptr };
  for (let i = 0; i < n; i++) out.push(list[(ptr + i) % list.length]);
  return { ids: out, ptr: ptr + n };
}

/* ═══════════════ Manche 1 — Neuf points gagnants ═══════════════ */

/** Nombre de qualifiés visé : 3 à partir de 4 joueurs (règle télé), sinon N-1. */
export function cibleQualifies(n) {
  return n >= 4 ? RULES.QUALIFIES_R1 : Math.max(1, n - 1);
}

/** À 3 joueurs ou moins, personne n'est éliminé au buzzer (sinon plus de 4 à la suite). */
export function r1Elimine(n) { return n >= 4; }

/** Valeur d'une bonne réponse selon le nombre de candidats encore en lice. */
export function valeurR1(enLice) {
  if (enLice >= 4) return 1;
  if (enLice === 3) return 2;
  return 3;
}

/**
 * Applique une bonne réponse. Renvoie un nouvel état r1 { scores, qualifies }.
 * @param {{scores:Record<string,number>, qualifies:string[]}} r1
 * @param {string[]} inscrits  joueurs de l'émission
 */
export function r1Bonne(r1, u, inscrits) {
  const enLice = inscrits.filter(x => !r1.qualifies.includes(x)).length;
  const pts = valeurR1(enLice);
  const scores = { ...r1.scores, [u]: (r1.scores[u] || 0) + pts };
  const qualifies = r1.qualifies.slice();
  if (scores[u] >= RULES.POINTS_R1 && !qualifies.includes(u)) qualifies.push(u);
  return { scores, qualifies, pts };
}

/** La manche est-elle finie ? */
export function r1Fini(r1, inscrits) {
  return r1.qualifies.length >= cibleQualifies(inscrits.length);
}

/**
 * Clôture forcée (questions épuisées, bouton « Terminer la manche ») :
 * complète les qualifiés au score, puis par ordre d'arrivée.
 * @returns {{qualifies:string[], elimines:string[]}}
 */
export function r1Cloture(r1, inscrits) {
  const cible = cibleQualifies(inscrits.length);
  const qualifies = r1.qualifies.slice();
  const reste = inscrits.filter(u => !qualifies.includes(u))
    .sort((a, b) => (r1.scores[b] || 0) - (r1.scores[a] || 0));
  while (qualifies.length < cible && reste.length) qualifies.push(reste.shift());
  if (!r1Elimine(inscrits.length)) { qualifies.push(...reste); return { qualifies, elimines: [] }; }
  return { qualifies, elimines: reste };
}

/* ═══════════════ Manche 2 — 4 à la suite ═══════════════ */

/**
 * Applique une réponse dans le tour en cours.
 * @param {{serie:number, best:number, tBest:number}} tour
 * @param {boolean} ok
 * @param {number} ms  temps écoulé depuis le début du tour
 */
export function r2Reponse(tour, ok, ms) {
  const serie = ok ? tour.serie + 1 : 0;
  let { best, tBest } = tour;
  if (serie > best) { best = serie; tBest = ms; }
  return { serie, best, tBest, fini: serie >= RULES.SERIE_R2 };
}

/**
 * Classement de la manche : meilleure série, puis rapidité pour l'atteindre.
 * @param {Record<string,{best:number,tBest:number}>} res
 */
export function r2Classement(res, joueurs) {
  return joueurs.slice().sort((a, b) => {
    const A = res[a] || { best: 0, tBest: Infinity }, B = res[b] || { best: 0, tBest: Infinity };
    return (B.best - A.best) || ((A.tBest ?? Infinity) - (B.tBest ?? Infinity));
  });
}

/* ═══════════════ Manche 3 — Face-à-face ═══════════════ */

/** Points selon le nombre d'indices déjà affichés (1 → 4 pts … 4+ → 1 pt). */
export function valeurFaf(indicesVus) {
  return Math.max(1, RULES.FAF_POINTS_MAX + 1 - Math.max(1, indicesVus));
}

/** Les zones 4/2 appartiennent au premier joueur, les zones 3/1 à son adversaire. */
export function fafJoueurZone(premier, adversaire, indicesVus) {
  return Math.max(1, indicesVus) % 2 === 1 ? premier : adversaire;
}

export function fafVainqueur(scores, joueurs) {
  return joueurs.find(u => (scores[u] || 0) >= RULES.POINTS_FAF) || null;
}

/* ═══════════════ Soirée ═══════════════ */

export const FORMATS = {
  emission: { emissions: 1, label: 'Une émission', duree: '≈ 30 min' },
  soiree:   { emissions: 2, label: 'La soirée', duree: '45 min – 1 h' },
  marathon: { emissions: 3, label: 'Le marathon', duree: '≈ 1 h 30' }
};

export function nbEmissions(format) {
  return (FORMATS[format] || FORMATS.soiree).emissions;
}

/** Ajoute des étoiles de soirée. */
export function etoiler(etoiles, uids, n = 1) {
  const out = { ...(etoiles || {}) };
  for (const u of uids) out[u] = (out[u] || 0) + n;
  return out;
}

/**
 * Classement de soirée : victoires, puis étoiles, puis nom. Rangs partagés.
 * @param {{victoires:Record<string,number>, etoiles:Record<string,number>}} soiree
 * @param {{uid:string,name:string}[]} joueurs
 */
export function classementSoiree(soiree, joueurs) {
  const v = soiree.victoires || {}, e = soiree.etoiles || {};
  const lignes = joueurs.map(j => ({ ...j, victoires: v[j.uid] || 0, etoiles: e[j.uid] || 0 }))
    .sort((a, b) => (b.victoires - a.victoires) || (b.etoiles - a.etoiles) || a.name.localeCompare(b.name, 'fr'));
  let rang = 0, prec = null;
  lignes.forEach((l, i) => {
    const k = l.victoires + '/' + l.etoiles;
    if (k !== prec) { rang = i + 1; prec = k; }
    l.rang = rang;
  });
  return lignes;
}

/**
 * Faut-il une Grande Finale ? Oui si plusieurs émissions et que personne n'a
 * strictement plus de victoires que les autres. Renvoie les 2 finalistes ou null.
 */
export function grandeFinale(soiree, joueurs, emissions) {
  if (emissions < 2) return null;
  const c = classementSoiree(soiree, joueurs);
  if (c.length < 2) return null;
  if (c[0].victoires > c[1].victoires) return null;
  return [c[0].uid, c[1].uid];
}

/**
 * Trophées de fin de soirée, calculés à partir des statistiques accumulées.
 * @param {{bonnes:Record<string,number>, reflexes:Record<string,number>, series:Record<string,number>,
 *          cats:Record<string,Record<string,number>>}} st
 * @returns {{icone:string,titre:string,uid:string,detail:string}[]}
 */
export function trophees(st, joueurs) {
  const out = [];
  const noms = new Set(joueurs.map(j => j.uid));
  const max = (obj, inverse = false) => {
    let best = null, val = null;
    for (const [u, v] of Object.entries(obj || {})) {
      if (!noms.has(u) || !Number.isFinite(v)) continue;
      if (val === null || (inverse ? v < val : v > val)) { best = u; val = v; }
    }
    return best ? { uid: best, val } : null;
  };
  const b = max(st.bonnes);
  if (b && b.val > 0) out.push({ icone: 'brain', titre: 'Encyclopédie vivante', uid: b.uid, detail: `${b.val} bonnes réponses` });
  const r = max(st.reflexes, true);
  if (r) out.push({ icone: 'bolt', titre: 'Main la plus rapide', uid: r.uid, detail: `buzz en ${(r.val / 1000).toFixed(1)} s` });
  const s = max(st.series);
  if (s && s.val > 0) out.push({ icone: 'fire', titre: 'Meilleure série', uid: s.uid, detail: `${s.val} à la suite` });
  // Spécialiste : la catégorie où quelqu'un a le plus brillé.
  let spec = null;
  for (const [u, parCat] of Object.entries(st.cats || {})) {
    if (!noms.has(u)) continue;
    for (const [c, n] of Object.entries(parCat)) if (!spec || n > spec.n) spec = { uid: u, c, n };
  }
  if (spec && spec.n >= 2) out.push({ icone: 'graduation-cap', titre: 'Spécialiste', uid: spec.uid,
    detail: `${CATEGORIES[spec.c]?.l || spec.c} (${spec.n})` });
  return out;
}
