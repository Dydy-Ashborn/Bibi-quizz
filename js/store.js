/* Bibi Quizz — couche d'accès Firestore. Aucun composant UI ici.
 * Modèle :
 *   games/{code}                  config + tirage + état de reprise + broadcast — écrit par l'hôte seul
 *   games/{code}/players/{uid}    prénom, couleur de pupitre, son de buzzer — écrit par le joueur
 *   games/{code}/buzz/{uid}       { seq, tour, at } — lisible par tous (rien de secret)
 *   games/{code}/inputs/{uid}     { seq, tour, kind, value } — lisible par son auteur et l'hôte
 *   hosts/{uid}                   { premium } — écrit par le webhook Stripe seul
 */
import {
  doc, collection, setDoc, updateDoc, getDoc, getDocs, onSnapshot,
  serverTimestamp, deleteDoc, runTransaction, writeBatch, arrayRemove
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { db, uid } from './firebase.js';
import { makeCode, ls } from './util.js';
import { tirerSoiree } from './game.js';
import { pools, maxJoueurs, guard } from './plan.js';

const gameRef    = code => doc(db, 'games', code);
const subRef     = (code, sub) => collection(db, 'games', code, sub);
const subDoc     = (code, sub, u) => doc(db, 'games', code, sub, u);

/* ── Mémoire locale de l'hôte ──────────────────────────────────────────── */
const LS_GAMES = 'bq.host.games';
const LS_USED  = 'bq.host.used';

export function hostGames() {
  try { return JSON.parse(ls.get(LS_GAMES, '[]')); } catch { return []; }
}
function rememberGame(entry) {
  const list = hostGames().filter(g => g.code !== entry.code);
  list.unshift(entry);
  ls.set(LS_GAMES, JSON.stringify(list.slice(0, 10)));
}
export function forgetGame(code) {
  ls.set(LS_GAMES, JSON.stringify(hostGames().filter(g => g.code !== code)));
}
export function usedQuestions() {
  try { return JSON.parse(ls.get(LS_USED, '[]')); } catch { return []; }
}
/** Mémorise les questions réellement posées (repoussées en fin de tirage la prochaine fois). */
export function markUsed(ids) {
  if (!ids || !ids.length) return;
  const all = Array.from(new Set([...usedQuestions(), ...ids]));
  ls.set(LS_USED, JSON.stringify(all.slice(-1500)));
}

/* ── Création / lecture ────────────────────────────────────────────────── */

/** Nouveau tirage pour une soirée (création ou « rejouer »). */
export function nouveauTirage(ton) {
  return tirerSoiree({ ton, exclude: usedQuestions(), pools: pools() });
}

/** @param {{format:string, ton:string}} cfg */
export async function createGame(cfg) {
  for (const feature of ['format','ton']) {
    const access = guard(feature, cfg[feature]);
    if (!access.ok) throw new Error(access.why);
  }
  let code = makeCode();
  for (let tries = 0; tries < 5; tries++) {
    const snap = await getDoc(gameRef(code));
    if (!snap.exists()) break;
    code = makeCode();
  }
  const data = {
    code, hostUid: uid(), createdAt: serverTimestamp(),
    status: 'lobby', format: cfg.format, ton: cfg.ton, reponses: cfg.reponses || 'oral',
    // Figé à la création depuis le plan de l'HÔTE : c'est lui qui paie, les invités
    // en profitent. Relire le plan chez l'invité donnerait la limite gratuite à tous.
    maxJoueurs: maxJoueurs(),
    tirage: nouveauTirage(cfg.ton),
    members: [],
    etat: null,
    bc: null
  };
  await runTransaction(db, async tx => {
    if ((await tx.get(gameRef(code))).exists()) throw new Error('Code déjà utilisé, réessaie.');
    tx.set(gameRef(code), data);
  });
  rememberGame({ code, createdAt: Date.now(), format: cfg.format });
  return data;
}

export async function loadGame(code) {
  const snap = await getDoc(gameRef(code));
  return snap.exists() ? snap.data() : null;
}

export function watchGame(code, cb) {
  return onSnapshot(gameRef(code), s => cb(s.exists() ? s.data() : null),
    err => { console.warn('[bibi-quizz] watchGame', err); cb(null, err); });
}

const liste = s => s.docs.map(d => ({ uid: d.id, ...d.data() }));

export function watchPlayers(code, cb) {
  return onSnapshot(subRef(code, 'players'), s => cb(liste(s)),
    err => console.warn('[bibi-quizz] watchPlayers', err));
}

export async function patchGame(code, patch) {
  await updateDoc(gameRef(code), patch);
}

export async function kickPlayer(code, u) {
  const batch = writeBatch(db);
  batch.delete(subDoc(code, 'players', u));
  batch.update(gameRef(code), { members: arrayRemove(u) });
  await batch.commit();
}

export async function deleteGame(code) {
  const subs = await Promise.all(['players', 'buzz', 'inputs'].map(s => getDocs(subRef(code, s))));
  await Promise.all(subs.flatMap(s => s.docs).map(d => deleteDoc(d.ref)));
  await deleteDoc(gameRef(code));
  forgetGame(code);
}

/* ── Côté joueur ───────────────────────────────────────────────────────── */

export async function joinGame(code, { name, color, son }) {
  await runTransaction(db, async tx => {
    const game = await tx.get(gameRef(code));
    if (!game.exists() || game.data().status === 'fini') throw new Error('Partie terminée ou introuvable.');
    const data = game.data();
    if (!Array.isArray(data.members)) throw new Error('L’animateur doit rouvrir le salon pour mettre cette partie à jour.');
    if (!data.members.includes(uid())) {
      if (data.members.length >= data.maxJoueurs) throw new Error('La partie est complète.');
      tx.update(gameRef(code), { members: [...data.members, uid()] });
    }
    tx.set(subDoc(code, 'players', uid()), { name, color, son, joinedAt: serverTimestamp() }, { merge: true });
  });
  return uid();
}

export async function myPlayer(code) {
  const s = await getDoc(subDoc(code, 'players', uid()));
  return s.exists() ? { uid: uid(), ...s.data() } : null;
}

/** Buzz : l'heure du SERVEUR départage les quasi-simultanés (jamais les horloges des téléphones). */
export async function sendBuzz(code, { seq, tour }) {
  await setDoc(subDoc(code, 'buzz', uid()), { seq, tour, at: serverTimestamp() });
}

/** Réponse tapée, choix de thème, main prise/laissée, pronostic. */
export async function sendInput(code, { seq, tour = 0, kind, value }) {
  await setDoc(subDoc(code, 'inputs', uid()), { seq, tour, kind, value: String(value ?? '').slice(0, 80), at: serverTimestamp() });
}

/* ── Côté hôte ─────────────────────────────────────────────────────────── */

export function watchBuzz(code, cb) {
  return onSnapshot(subRef(code, 'buzz'), s => cb(liste(s)),
    err => console.warn('[bibi-quizz] watchBuzz', err));
}

export function watchInputs(code, cb) {
  return onSnapshot(subRef(code, 'inputs'), s => cb(liste(s)),
    err => console.warn('[bibi-quizz] watchInputs', err));
}

export { uid };
