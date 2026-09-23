import { CHRISTMAS_POOL } from './data/christmas.js';
/* Bibi Quizz — point de contrôle unique du plan (gratuit / complet).
 *
 * Même modèle que Bibi Love et Attention à l'escalier : achat unique, attaché à
 * l'uid anonyme du MAÎTRE DU JEU (`hosts/{uid}.premium`), les joueurs n'achètent
 * jamais rien. Toute limitation passe par `guard()` ; ajouter une restriction =
 * une entrée ici, jamais un `if` dans une vue.
 *
 * Découverte : pack fixe de 140 questions, une émission en Mix, 4 candidats.
 * Complet : toute la banque, tous les tons, soirée et marathon, 8 candidats.
 */
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { db, uid } from './firebase.js';
import { BUZZ, THEMES, FAF } from './data/questions.js';
import { DISCOVERY } from './discovery.js';
import { RULES } from './config.js';
import { ls } from './util.js';

export const PRIX = '4,99 €';

/**
 * Stripe Payment Link, mode `payment` (achat unique, jamais `subscription`).
 * Vide = bouton d'achat désactivé proprement (« Bientôt disponible »).
 */
export const LIEN_PAIEMENT = 'https://buy.stripe.com/aFa00j4EG4aX3PEgkr8so01';

/** URL de paiement portant l'identité de l'acheteur (`client_reference_id` → webhook). */
export function urlPaiement() {
  if (!LIEN_PAIEMENT) return '';
  const ref = String(uid() || '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (!ref) return '';
  const sep = LIEN_PAIEMENT.includes('?') ? '&' : '?';
  return `${LIEN_PAIEMENT}${sep}client_reference_id=${encodeURIComponent(ref)}`;
}

export const GRATUIT = {
  formats: ['emission'],
  maxJoueurs: 4
};

const LS = 'bq.premium';
let cache = false;

export function isPremium() { return cache; }

let dernierDiag = { etat: 'jamais', message: '' };
export function diagPremium() { return dernierDiag; }

/**
 * Relit `hosts/{uid}.premium`. Le localStorage n'est qu'un cache anti-clignotement.
 * Comparaison STRICTE à `true` : la console Firebase propose le type « chaîne » par
 * défaut et `"true"` passait pour vrai (piège vécu sur Bibi Love).
 */
export async function refreshPremium() {
  if (!db || !uid()) return false;
  try {
    const snap = await getDoc(doc(db, 'hosts', uid()));
    const brut = snap.exists() ? snap.data().premium : undefined;
    cache = brut === true;
    if (!snap.exists()) {
      dernierDiag = { etat: 'absent',
        message: "Aucun document hosts/ à cet identifiant. Vérifie que l'ID du document est exactement celui affiché ci-dessus." };
    } else if (cache) {
      dernierDiag = { etat: 'ok', message: '' };
    } else if (typeof brut === 'string') {
      dernierDiag = { etat: 'mauvais-type',
        message: `Le champ premium vaut la chaîne « ${brut} », pas le booléen true. Dans la console Firebase, choisis le type « booléen ».` };
    } else {
      dernierDiag = { etat: 'sans-premium',
        message: "Le document existe mais son champ premium n'est pas à true (type booléen attendu)." };
    }
  } catch (e) {
    cache = false;
    dernierDiag = { etat: 'refus', message: 'Lecture refusée par Firestore : ' + (e.code || e.message) +
      ". Le plus souvent, les règles n'ont pas encore été déployées (firebase deploy --only firestore:rules)." };
    console.warn('[bibi-quizz] lecture de hosts/' + uid() + ' impossible :', e);
  }
  ls.set(LS, cache ? '1' : '0');
  return cache;
}

/** Au retour de Stripe, le webhook peut mettre quelques secondes : on réessaie. */
export async function attendrePaiement({ essais = 8, delai = 2000 } = {}) {
  for (let i = 0; i < essais; i++) {
    if (await refreshPremium()) return true;
    if (i < essais - 1) await new Promise(r => setTimeout(r, delai));
  }
  return false;
}

/**
 * Point de contrôle unique.
 * @returns {{ok:boolean, why?:string}} `why` est le texte affiché dans le paywall.
 */
export function guard(feature, value) {
  if (cache) return { ok: true };
  switch (feature) {
    case 'event':
      return value === 'standard' ? { ok: true } : { ok: false, why: 'Le Quiz de Noël est inclus dans la version complète, sans supplément. Seul l’organisateur achète.' };
    case 'format':
      return GRATUIT.formats.includes(value)
        ? { ok: true }
        : { ok: false, why: 'Les soirées de 45 min–1 h et le marathon font partie de la version complète. La découverte permet de jouer une émission avec les trois manches.' };
    case 'ton':
      return value === 'mix' ? { ok: true } : { ok: false, why: 'La découverte propose un pack Mix. Débloque tous les tons et toute la banque avec la version complète.' };
    case 'joueurs':
      return Number(value) <= GRATUIT.maxJoueurs
        ? { ok: true }
        : { ok: false, why: `La version gratuite accueille ${GRATUIT.maxJoueurs} candidats. Au-delà, c'est la version complète (jusqu'à ${RULES.MAX_JOUEURS}).` };
    default:
      return { ok: true };
  }
}

/** Nombre de joueurs autorisé par le plan de l'HÔTE — figé dans le doc de partie. */
export function maxJoueurs() {
  return cache ? RULES.MAX_JOUEURS : GRATUIT.maxJoueurs;
}

/** Le même pack découverte est utilisé à chaque partie gratuite. */
export function pools(event = 'standard') {
  if (event === 'noel') {
    if (!cache) throw new Error('Le Quiz de Noël nécessite la version complète.');
    return CHRISTMAS_POOL;
  }
  return cache ? { buzz: BUZZ, themes: THEMES, faf: FAF } : DISCOVERY;
}

export function totalQuestions(p = { buzz: BUZZ, themes: THEMES, faf: FAF }) {
  return p.buzz.length + p.themes.reduce((n, t) => n + t.questions.length, 0) + p.faf.length;
}

export function resume() {
  if (cache) return { titre: 'Version complète',
    ligne: `${totalQuestions()} questions, soirée ou marathon, jusqu'à ${RULES.MAX_JOUEURS} candidats.` };
  return { titre: 'Version gratuite',
    ligne: `${totalQuestions(pools())} questions fixes · 1 émission en Mix · ${GRATUIT.maxJoueurs} candidats max.` };
}
