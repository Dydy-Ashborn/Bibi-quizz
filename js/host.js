/* Bibi Quizz — parcours du maître du jeu :
 * création → salon → plateau (écran partagé : télé, ordi) → podium de la soirée.
 *
 * L'écran maître est l'arbitre : il reçoit les buzz et les réponses des téléphones,
 * juge, compte les points et diffuse l'état (live.js). Les téléphones ne décident rien.
 *
 * Une soirée = 1 à 3 émissions, chacune en trois manches :
 *   Neuf points gagnants → 4 à la suite → Face-à-face (12 points).
 * Plusieurs émissions sans vainqueur net → Grande Finale (face-à-face).
 */
import { $, $$, el, icon, iconHtml, esc, showScreen, showConfirmModal, toast, sfx, burst,
         copy, initiale, shake, listeNoms, pluriel } from './util.js';
import { RULES } from './config.js';
import { uid } from './firebase.js';
import { createGame, loadGame, watchGame, watchPlayers, watchBuzz, watchInputs, patchGame,
         deleteGame, kickPlayer, hostGames, forgetGame, markUsed, nouveauTirage } from './store.js';
import { juger, prendre, cibleQualifies, r1Elimine, valeurR1, r1Bonne, r1Fini, r1Cloture,
         r2Reponse, r2Classement, valeurFaf, fafJoueurZone, fafVainqueur, FORMATS, nbEmissions, etoiler,
         classementSoiree, grandeFinale, trophees } from './game.js';
import { byId, themeById, fafById, CATEGORIES } from './data/questions.js';
import { PHASE, INPUT, broadcast } from './live.js';
import { guard, isPremium, resume as planResume, maxJoueurs, PRIX } from './plan.js';

/* ── État de la session hôte ──────────────────────────────────────── */
const S = {
  code: null, game: null, players: [],
  unsubs: [], timers: [],
  seq: 0, tour: 0,
  buzzes: {}, fenetre: null,
  vus: new Set(), inputsPrets: false,
  step: null,
  etat: null,           // état de reprise, sauvegardé dans games/{code}.etat
  auto: true, busy: false
};

function clearTimers() {
  S.timers.forEach(t => { clearTimeout(t); clearInterval(t); });
  S.timers = [];
  if (S.fenetre) { clearTimeout(S.fenetre); S.fenetre = null; }
}
const later = (fn, ms) => { const t = setTimeout(fn, ms); S.timers.push(t); return t; };
const every = (fn, ms) => { const t = setInterval(fn, ms); S.timers.push(t); return t; };

export function leaveHost() {
  S.unsubs.forEach(u => { try { u(); } catch {} });
  S.unsubs = [];
  clearTimers();
  S.step = null;
  S.vus = new Set(); S.inputsPrets = false;
}

/* ═══════════════ PAYWALL ═══════════════ */
export function openPaywall(why = '') {
  $('#paywallWhy').textContent = why;
  $('#paywallPrice').textContent = PRIX;
  $('#paywall').classList.add('is-open');
}
$('#paywallCancel')?.addEventListener('click', () => $('#paywall').classList.remove('is-open'));
$('#paywall')?.addEventListener('click', e => { if (e.target.id === 'paywall') e.target.classList.remove('is-open'); });

/* ═══════════════ ACCUEIL : historique ═══════════════ */
export function renderHistory() {
  const list = hostGames();
  const box = $('#homeHistoryList');
  $('#homeHistory').hidden = !list.length;
  box.innerHTML = '';
  list.slice(0, 5).forEach(g => {
    const date = new Date(g.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    box.append(el('div', { class: 'history-item' },
      el('span', { class: 'mono' }, g.code),
      el('span', { class: 'grow' }, `${date} · ${(FORMATS[g.format] || FORMATS.soiree).label}`),
      el('button', { class: 'btn btn-ghost btn-sm', onclick: () => { location.hash = '#/host/' + g.code; } }, 'Ouvrir'),
      el('button', { class: 'btn btn-ghost btn-sm', 'aria-label': 'Oublier', onclick: () => { forgetGame(g.code); renderHistory(); } }, icon('xmark'))
    ));
  });
}

/* ═══════════════ CRÉATION ═══════════════ */
const choix = { format: 'soiree', ton: 'mix', reponses: 'oral' };
const oral = () => S.game?.reponses === 'oral';
const secondesR2 = () => oral() ? 40 : RULES.SECONDES_R2;

export function enterCreate() {
  choix.format = isPremium() ? 'soiree' : 'emission'; choix.ton = 'mix'; choix.reponses = 'oral';
  $$('#createForm .choice-grid').forEach(grid => {
    const field = grid.dataset.field;
    $$('.choice', grid).forEach(c => {
      c.classList.toggle('is-on', c.dataset.value === choix[field]);
      c.querySelector('.choice-lock')?.remove();
      if (['format', 'ton'].includes(field) && !guard(field, c.dataset.value).ok) c.append(el('span', { class: 'choice-lock' }, icon('lock')));
    });
  });
  const r = planResume();
  $('#planBanner').hidden = isPremium();
  $('#planBannerTitle').textContent = r.titre;
  $('#planBannerLine').textContent = ' — ' + r.ligne;
  showScreen('screen-create');
}

$$('#createForm .choice-grid').forEach(grid => $$('.choice', grid).forEach(c => c.addEventListener('click', () => {
  const field = grid.dataset.field;
  if (['format', 'ton'].includes(field)) {
    const g = guard(field, c.dataset.value);
    if (!g.ok) { openPaywall(g.why); return; }
  }
  choix[field] = c.dataset.value;
  $$('.choice', grid).forEach(x => x.classList.toggle('is-on', x === c));
  sfx.tap();
})));
$('#btnPlanUpgrade')?.addEventListener('click', () => openPaywall(''));

$('#btnCreateGame')?.addEventListener('click', async () => {
  const btn = $('#btnCreateGame');
  btn.disabled = true;
  try {
    const g = await createGame({ format: choix.format, ton: choix.ton, reponses: choix.reponses });
    sfx.good();
    location.hash = '#/host/' + g.code;
  } catch (e) {
    console.error(e);
    toast('Impossible de créer la partie : ' + (e.code || e.message), 'err');
  } finally { btn.disabled = false; }
});

/* ═══════════════ SALON ═══════════════ */
function lienJoueur(code) {
  return `${location.origin}${location.pathname}#/j/${code}`;
}

export async function enterLobby(code) {
  leaveHost();
  let game;
  try { game = await loadGame(code); } catch { game = null; }
  if (!game) { toast('Partie introuvable.', 'err'); forgetGame(code); location.hash = '#/'; return; }
  if (game.hostUid !== uid()) { location.hash = '#/j/' + code; return; }   // appareil invité : manette
  S.code = code; S.game = game;
  S.seq = game.bc?.seq || 0;
  S.tour = 0;
  S.etat = game.etat || null;

  S.unsubs.push(watchGame(code, g => { if (g) S.game = g; }));
  S.unsubs.push(watchPlayers(code, ps => {
    S.players = ps.sort((a, b) => (a.joinedAt?.seconds || 0) - (b.joinedAt?.seconds || 0));
    if (!Array.isArray(S.game.members)) {
      S.game.members = ps.map(p => p.uid);
      patchGame(code, { members: S.game.members }).catch(() => toast('Mise à jour du salon impossible.', 'err'));
    }
    renderLobbyPlayers();
    if ($('#screen-live').classList.contains('is-active')) renderDesks();
  }));
  S.unsubs.push(watchBuzz(code, bs => {
    S.buzzes = Object.fromEntries(bs.map(b => [b.uid, b]));
    onBuzz();
  }));
  S.unsubs.push(watchInputs(code, onInputs));

  if (game.status === 'live' && S.etat) { enterLive(true); return; }
  if (game.status === 'fini' && S.etat) { showScreen('screen-podium'); later(() => showPodium(true), 700); return; }

  $('#lobbyUrl').textContent = `${location.host}${location.pathname.replace(/index\.html$/, '')}`;
  $('#lobbyCode').textContent = code;
  const url = lienJoueur(code);
  $('#btnLobbyCopy').onclick = async () => toast(await copy(url) ? 'Lien copié.' : url, 'ok');
  $('#btnLobbyShare').onclick = async () => {
    if (navigator.share) { try { await navigator.share({ title: 'Bibi Quizz', text: `Rejoins la partie ${code} !`, url }); } catch {} }
    else toast(await copy(url) ? 'Lien copié.' : url, 'ok');
  };
  const f = FORMATS[game.format] || FORMATS.soiree;
  $('#lobbyFormat').textContent = `${f.label} · ${f.duree} · ton ${({ mix: 'mix', classique: 'classique', moderne: '100 % moderne' })[game.ton] || 'mix'}`;
  publish({ phase: PHASE.ATTENTE });
  renderLobbyPlayers();
  showScreen('screen-lobby');
}

function renderLobbyPlayers() {
  const box = $('#lobbyList');
  if (!box) return;
  box.innerHTML = '';
  const max = S.game?.maxJoueurs || maxJoueurs();
  $('#lobbyCount').textContent = `${S.players.length} / ${max}`;
  $('#lobbyEmpty').hidden = S.players.length > 0;
  S.players.forEach(p => {
    box.append(el('span', { class: 'chip' }, pawn(p), p.name,
      el('button', { class: 'chip-x', 'aria-label': 'Retirer ' + p.name, onclick: () =>
        showConfirmModal(`Retirer ${p.name} de la partie ?`, () => kickPlayer(S.code, p.uid).catch(() => toast('Impossible de retirer ce joueur.', 'err')),
          { okLabel: 'Retirer', danger: true }) }, icon('xmark'))));
  });
  const n = S.players.length;
  $('#lobbyHint').textContent = n < RULES.MIN_JOUEURS ? `Il faut au moins ${RULES.MIN_JOUEURS} candidats.`
    : n < 4 ? `À ${n}, personne n'est éliminé au buzzer : tout le monde passe au 4 à la suite.`
    : 'Format télé complet : 3 qualifiés au buzzer, 2 finalistes au face-à-face.';
}

function pawn(p) {
  const s = el('span', { class: 'pawn', title: p?.name || '' }, initiale(p?.name));
  s.style.setProperty('--c', p?.color || '#ffb020');
  return s;
}

$('#btnStartLive')?.addEventListener('click', async () => {
  const n = S.players.length;
  if (n < RULES.MIN_JOUEURS) { toast(`Il faut au moins ${RULES.MIN_JOUEURS} candidats.`, 'err'); shake($('#lobbyList')); return; }
  const g = guard('joueurs', n);
  if (!g.ok) { openPaywall(g.why); return; }
  S.etat = etatInitial();
  try {
    await patchGame(S.code, { status: 'live', etat: S.etat });
    enterLive(false);
  } catch (e) { toast('Lancement impossible : ' + (e.code || e.message), 'err'); }
});

$('#btnDeleteGame')?.addEventListener('click', () => {
  showConfirmModal('Supprimer définitivement cette partie ? Les joueurs seront déconnectés.', async () => {
    try { await deleteGame(S.code); toast('Partie supprimée.', 'ok'); location.hash = '#/'; }
    catch (e) { toast('Suppression impossible : ' + (e.code || e.message), 'err'); }
  }, { okLabel: 'Supprimer', danger: true });
});

/* ═══════════════ ÉTAT DE SOIRÉE ═══════════════ */

function etatInitial() {
  return {
    emission: 0, nbEmissions: nbEmissions(S.game.format), manche: 'debut',
    inscrits: [], ptr: { r1: 0, r2: 0, faf: 0 },
    r1: null, r2: null, faf: null, elimines: [], pronos: {},
    soiree: { victoires: {}, etoiles: {}, champions: [] },
    stats: { bonnes: {}, reflexes: {}, series: {}, cats: {} }
  };
}

function persist() {
  return patchGame(S.code, { etat: S.etat }).catch(e => console.warn('[bibi-quizz] persist', e));
}

const E = () => S.etat;
const nomDe = u => S.players.find(p => p.uid === u)?.name || 'Un candidat';
const joueurDe = u => S.players.find(p => p.uid === u) || { uid: u, name: '?', color: '#888' };
const noms = uids => listeNoms(uids.map(nomDe));

/** Publie un broadcast. `seq` n'augmente qu'à chaque nouvelle question. */
function publish(fields) {
  const e = S.etat;
  $('#oralControls').hidden = !oral() || ![PHASE.R1_REPONSE, PHASE.R2_JEU, PHASE.FAF_REPONSE].includes(fields.phase);
  const bc = broadcast({
    seq: S.seq, tour: S.tour, reponses: S.game?.reponses || 'clavier',
    emission: e?.emission || 1, nbEmissions: e?.nbEmissions || nbEmissions(S.game?.format),
    manche: e?.manche || null,
    inscrits: e?.inscrits || [],
    qualifies: e?.manche === 'r1' ? (e.r1?.qualifies || []) : [],
    elimines: e?.elimines || [],
    ...fields
  });
  return patchGame(S.code, { bc }).catch(e2 => console.warn('[bibi-quizz] broadcast', e2));
}

function stat(key, u, n = 1) {
  const st = E().stats;
  st[key][u] = (st[key][u] || 0) + n;
}
function statCat(u, c) {
  const st = E().stats;
  st.cats[u] = st.cats[u] || {};
  st.cats[u][c] = (st.cats[u][c] || 0) + 1;
}

/* ═══════════════ PLATEAU : cadre ═══════════════ */

function enterLive(reprise) {
  showScreen('screen-live');
  majAuto();
  if (!reprise) { startEmission(1); return; }
  // Reprise après rafraîchissement : on repart du début de l'étape en cours.
  const e = E();
  toast('Partie reprise.', 'info');
  const suite = {
    debut: () => startEmission(1),
    r1: () => r1Next(),
    r2: () => r2Tour(),
    faf: () => fafNext(),
    finale: () => fafNext(),
    'fin-emission': () => finEmission(true),
    fini: () => terminer()
  }[e.manche] || (() => startEmission(Math.max(1, e.emission)));
  carton({ icone: 'circle-play', titre: 'On reprend !', sous: `Émission ${e.emission || 1} · ${libelleManche(e.manche)}` }, suite, 'Reprendre');
}

function libelleManche(m) {
  return ({ r1: 'Neuf points gagnants', r2: '4 à la suite', faf: 'Face-à-face', finale: 'Grande Finale',
            'fin-emission': "Fin d'émission", fini: 'Fin de soirée', debut: 'Générique' })[m] || '';
}

function header() {
  const e = E();
  $('#liveEmission').textContent = e.manche === 'finale' ? 'Grande Finale'
    : `Émission ${e.emission} / ${e.nbEmissions}`;
  $('#liveManche').textContent = libelleManche(e.manche);
  $('#btnCloreManche').hidden = e.manche !== 'r1';
}

/** Une seule zone visible sur la scène. */
function scene(id) {
  ['#stCarton', '#stR1', '#stR2', '#stFaf', '#stFin'].forEach(s => { $(s).hidden = s !== id; });
  const st = $(id);
  st.style.animation = 'none'; void st.offsetWidth; st.style.animation = '';
  $('#desks').hidden = !(id === '#stR1' || id === '#stR2');
  header();
}

/**
 * Carton plein écran. `suite` s'exécute au clic sur « Suivant » (le maître du jeu
 * garde la main sur le rythme entre les manches : c'est le moment d'expliquer).
 */
function carton({ icone, titre, sous, regles = null, prono = false }, suite, bouton = 'Continuer') {
  clearTimers();
  S.step = { kind: 'carton', suite };
  scene('#stCarton');
  $('#cartonIcon').innerHTML = iconHtml(icone);
  $('#cartonTitle').textContent = titre;
  $('#cartonSub').textContent = sous || '';
  const ul = $('#cartonRules');
  ul.innerHTML = '';
  ul.hidden = !regles;
  (regles || []).forEach(r => ul.append(el('li', {}, r)));
  $('#cartonProno').hidden = !prono;
  if (prono) renderPronos();
  setNext(bouton, 'arrow-right');
  publish({ phase: PHASE.CARTON, carton: { icone, titre, sous: sous || '' }, prono,
            faf: prono ? { joueurs: E().faf.joueurs } : null });
}

function setNext(label, ic, visible = true) {
  const b = $('#btnLiveNext');
  b.hidden = !visible;
  b.innerHTML = `${esc(label)} ${iconHtml(ic)}`;
}
function hint(txt) { $('#liveHint').textContent = txt || ''; }

/* ── Pupitres (manches 1 et 2) ──────────────────────────────────────── */
function renderDesks() {
  const box = $('#desks');
  if (!box || !S.etat) return;
  const e = E();
  box.innerHTML = '';
  const st = S.step || {};
  e.inscrits.forEach(u => {
    const p = joueurDe(u);
    let score = '', etat = '';
    if (e.manche === 'r1') {
      score = e.r1?.scores[u] || 0;
      if (e.r1?.qualifies.includes(u)) etat = 'is-qualif';
      else if (st.bloques?.includes(u)) etat = 'is-bloque';
      if (st.main === u) etat = 'is-buzz';
    } else if (e.manche === 'r2') {
      if (e.elimines.includes(u)) etat = 'is-elim';
      const res = e.r2?.res[u];
      score = res ? res.best : (st.joueur === u && st.kind === 'r2-jeu' ? st.best : '–');
      if (st.joueur === u) etat = 'is-actif';
    }
    const d = el('div', { class: 'desk ' + etat },
      el('div', { class: 'desk-name' }, p.name),
      el('div', { class: 'desk-score mono' }, String(score)),
      etat === 'is-qualif' ? el('div', { class: 'desk-tag' }, 'Qualifié') : null,
      etat === 'is-elim' ? el('div', { class: 'desk-tag' }, 'Éliminé') : null);
    d.style.setProperty('--c', p.color);
    d.dataset.uid = u;
    box.append(d);
  });
  const pub = S.players.filter(p => !e.inscrits.includes(p.uid)).map(p => p.name);
  if (pub.length) box.append(el('div', { class: 'desk-public' }, icon('eye'), ' Public : ', pub.join(', ')));
}

function flashDesk(u, cls) {
  const d = $(`#desks .desk[data-uid="${u}"]`);
  if (!d) return;
  d.classList.remove(cls); void d.offsetWidth; d.classList.add(cls);
}

/* ═══════════════ ÉMISSION ═══════════════ */

function startEmission(n) {
  const e = E();
  // Les retardataires du salon entrent à l'émission suivante ; plafond du plan de l'hôte.
  const max = S.game.maxJoueurs || maxJoueurs();
  e.emission = n;
  e.inscrits = S.players.slice(0, max).map(p => p.uid);
  e.manche = 'r1';
  e.r1 = { scores: {}, qualifies: [], nq: 0 };
  e.r2 = null; e.faf = null; e.elimines = []; e.pronos = {};
  persist();
  sfx.jingle();
  const N = e.inscrits.length;
  const cible = cibleQualifies(N);
  carton({
    icone: 'bolt',
    titre: e.nbEmissions > 1 ? `Émission ${n} — Neuf points gagnants` : 'Neuf points gagnants',
    sous: `${pluriel(N, 'candidat')} au buzzer. Premier à 9 points : qualifié !`,
    regles: [
      'La question s\'affiche au fil de l\'eau : buzzez dès que vous savez, même avant la fin.',
      `Le premier qui buzze ${oral() ? "répond à voix haute" : "tape sa réponse"} (${RULES.SECONDES_REPONSE} s). Une erreur : il ne peut plus buzzer sur cette question.`,
      'Une bonne réponse vaut 1 point, puis 2 points quand il ne reste que 3 candidats en lice, 3 points à 2.',
      r1Elimine(N) ? `Les ${cible} premiers à 9 points passent au 4 à la suite, le dernier est éliminé.`
                   : `À ${N}, personne n'est éliminé : l'ordre d'arrivée décide qui choisit son thème en premier.`
    ]
  }, () => r1Next(), 'Première question');
}

/* ═══════════════ MANCHE 1 — NEUF POINTS GAGNANTS ═══════════════ */

function r1Next() {
  clearTimers();
  const e = E();
  if (r1Fini(e.r1, e.inscrits)) { r1Close(false); return; }
  if (e.r1.nq >= RULES.MAX_QUESTIONS_R1) { r1Close(true); return; }
  const { ids, ptr } = prendre(S.game.tirage.r1, e.ptr.r1, 1);
  e.ptr.r1 = ptr;
  const q = byId[ids[0]];
  if (!q) { r1Close(true); return; }
  e.r1.nq += 1;
  markUsed([q.id]);
  S.seq += 1; S.tour = 0;
  S.buzzes = {};
  S.step = { kind: 'r1-lecture', qid: q.id, shown: 0, bloques: [], tentatives: [], main: null,
             t0: Date.now(), accordes: [] };
  scene('#stR1');
  const enLice = e.inscrits.filter(u => !e.r1.qualifies.includes(u)).length;
  S.step.valeur = valeurR1(enLice);
  $('#r1Cat').textContent = CATEGORIES[q.c]?.l || '';
  $('#r1Valeur').textContent = pluriel(S.step.valeur, 'point');
  $('#r1Num').textContent = `Question ${e.r1.nq}`;
  $('#r1Rev').hidden = true;
  $('#r1Box').classList.remove('is-reveal');
  hint('Buzzez sur vos téléphones !');
  setNext('Passer', 'forward', true);
  renderDesks();
  r1Lecture();
}

/** Lance (ou relance après une erreur) l'affichage progressif et la fenêtre de buzz. */
function r1Lecture() {
  const st = S.step;
  const q = byId[st.qid];
  st.kind = 'r1-lecture';
  st.main = null;
  const txt = $('#r1Texte');
  const draw = () => { txt.innerHTML = esc(q.q.slice(0, st.shown)) + (st.shown < q.q.length ? '<span class="caret"></span>' : ''); };
  draw();
  $('#r1Status').innerHTML = st.bloques.length ? `${iconHtml('bolt')} Le buzzer est rouvert !` : '';
  publish({ phase: PHASE.R1_LECTURE, q: { texte: q.q, cat: CATEGORIES[q.c]?.l || '', depuis: st.shown, cps: RULES.LECTURE_CPS },
            bloques: st.bloques, valeur: st.valeur, scores: E().r1.scores });
  const finLecture = () => {
    let reste = st.bloques.length ? 5 : RULES.SECONDES_APRES_LECTURE;
    const tic = () => { $('#r1Status').innerHTML = `${iconHtml('stopwatch')} Encore <strong>${reste}</strong> s pour buzzer`; };
    tic();
    every(() => { reste -= 1; if (reste <= 3 && reste > 0) sfx.tick(); tic(); if (reste <= 0) { clearTimers(); r1Reveal(); } }, 1000);
  };
  if (st.shown >= q.q.length) { finLecture(); return; }
  const pas = every(() => {
    st.shown = Math.min(q.q.length, st.shown + 1);
    draw();
    if (st.shown >= q.q.length) { clearInterval(pas); finLecture(); }
  }, 1000 / RULES.LECTURE_CPS);
  onBuzz();   // des buzz ont pu arriver pendant la relance
}

function eligiblesR1() {
  const e = E(), st = S.step;
  return e.inscrits.filter(u => !e.r1.qualifies.includes(u) && !st.bloques.includes(u));
}

/** Réception des buzz : on ouvre une courte fenêtre puis on donne la main au plus rapide (heure serveur). */
function onBuzz() {
  const st = S.step;
  if (!st || (st.kind !== 'r1-lecture' && st.kind !== 'faf-indices') || S.fenetre) return;
  const ok = st.kind === 'r1-lecture' ? new Set(eligiblesR1()) : new Set([st.joueur]);
  const valides = () => Object.values(S.buzzes).filter(b => b.seq === S.seq && b.tour === S.tour && b.at && ok.has(b.uid));
  if (!valides().length) return;
  S.fenetre = setTimeout(() => {
    S.fenetre = null;
    if (S.step !== st || (st.kind !== 'r1-lecture' && st.kind !== 'faf-indices')) return;
    const v = valides().sort((a, b) => a.at.toMillis() - b.at.toMillis());
    if (!v.length) return;
    if (st.kind === 'r1-lecture') r1Main(v[0].uid); else fafMainAuBuzz(v[0].uid);
  }, st.kind === 'r1-lecture' ? RULES.FENETRE_BUZZ_MS : 60);
}

function r1Main(u) {
  clearTimers();
  const st = S.step;
  st.kind = 'r1-reponse';
  st.main = u;
  const reflexe = Date.now() - st.t0;
  const rs = E().stats.reflexes;
  if (!st.bloques.length && (!(u in rs) || reflexe < rs[u])) rs[u] = reflexe;
  sfx.buzz(joueurDe(u).son);
  renderDesks();
  flashDesk(u, 'pulse');
  let reste = RULES.SECONDES_REPONSE;
  const q = byId[st.qid];
  $('#r1Texte').innerHTML = esc(q.q.slice(0, st.shown)) + (st.shown < q.q.length ? ' <span class="cut">…</span>' : '');
  const tic = () => { $('#r1Status').innerHTML = `${pawn(joueurDe(u)).outerHTML} <strong>${esc(nomDe(u))}</strong> a buzzé ! Réponse dans <strong>${reste}</strong> s`; };
  tic();
  publish({ phase: PHASE.R1_REPONSE, q: { texte: q.q, cat: CATEGORIES[q.c]?.l || '', depuis: st.shown, cps: 0 },
            main: u, bloques: st.bloques, valeur: st.valeur, secondes: reste, scores: E().r1.scores });
  every(() => {
    reste -= 1; tic();
    if (reste <= 3 && reste > 0) sfx.tick();
    if (reste <= 0) { clearTimers(); r1Juge(u, ''); }
  }, 1000);
}

function r1Juge(u, texte) {
  const st = S.step;
  if (st?.kind !== 'r1-reponse' || st.main !== u) return;
  clearTimers();
  const q = byId[st.qid];
  const ok = !!texte && juger(texte, q);
  st.tentatives.push({ uid: u, texte, ok });
  if (ok) {
    const e = E();
    const avant = e.r1.qualifies.length;
    const r = r1Bonne(e.r1, u, e.inscrits);
    e.r1 = { ...e.r1, scores: r.scores, qualifies: r.qualifies };
    stat('bonnes', u); statCat(u, q.c);
    sfx.good();
    r1Reveal({ uid: u, texte, pts: r.pts, qualif: r.qualifies.length > avant });
    return;
  }
  sfx.bad();
  st.bloques.push(u);
  st.kind = 'r1-pause';          // plus aucune réponse acceptée pendant la transition
  st.main = null;
  flashDesk(u, 'shake');
  $('#r1Status').innerHTML = `${iconHtml('circle-xmark')} ${esc(nomDe(u))} : « ${esc(texte || 'pas de réponse')} » — raté !`;
  if (!eligiblesR1().length) { later(() => { if (S.step === st) r1Reveal(); }, 1400); return; }
  S.tour += 1;
  renderDesks();
  later(() => { if (S.step === st && st.kind === 'r1-pause') r1Lecture(); }, 1300);
}

function r1Reveal(gain = null) {
  clearTimers();
  const st = S.step;
  if (!st || !st.qid) return;
  st.kind = 'r1-reveal';
  st.main = null;
  const q = byId[st.qid];
  const e = E();
  $('#r1Texte').textContent = q.q;
  $('#r1Box').classList.add('is-reveal');
  $('#r1Status').innerHTML = '';
  $('#r1Rev').hidden = false;
  $('#r1Reponse').textContent = q.r;
  const res = $('#r1Resultat');
  if (gain) {
    res.innerHTML = `${iconHtml('circle-check')} <strong>${esc(nomDe(gain.uid))}</strong> marque ${pluriel(gain.pts, 'point')}`
      + (gain.qualif ? ` <span class="tag-qualif">${iconHtml('star')} Qualifié !</span>` : '');
    flashDesk(gain.uid, 'glow');
    if (gain.qualif) { sfx.qualif(); burst(70); }
  } else {
    res.textContent = st.tentatives.length ? 'Personne n\'a trouvé.' : 'Personne n\'a buzzé.';
  }
  renderTentatives($('#r1Tentatives'), st, (u) => r1Accorder(u));
  renderDesks();
  persist();
  publish({ phase: PHASE.R1_REVEAL, q: { texte: q.q, cat: CATEGORIES[q.c]?.l || '', depuis: q.q.length, cps: 0 },
            reponse: { r: q.r, uid: gain?.uid || null, texte: gain?.texte || null, pts: gain?.pts || 0, qualif: !!gain?.qualif },
            valeur: st.valeur, scores: e.r1.scores });
  setNext(r1Fini(e.r1, e.inscrits) ? 'Fin de la manche' : 'Question suivante', 'arrow-right');
  hint('');
  autoSuite(() => r1Next());
}

/** Liste des réponses refusées, chacune avec un bouton « Accorder » (arbitrage humain). */
function renderTentatives(box, st, accorder) {
  box.innerHTML = '';
  st.tentatives.filter(t => !t.ok).forEach(t => {
    const deja = st.accordes.includes(t.uid);
    box.append(el('div', { class: 'tentative' + (deja ? ' is-ok' : '') },
      pawn(joueurDe(t.uid)),
      el('span', { class: 'grow' }, `${nomDe(t.uid)} : « ${t.texte || '—'} »`),
      t.texte && !deja ? el('button', { class: 'btn btn-ghost btn-sm', onclick: ev => { ev.currentTarget.disabled = true; accorder(t.uid); } },
        icon('check'), ' Accorder') : (deja ? el('span', { class: 'ok' }, icon('check'), ' accordé') : null)));
  });
}

/** Le maître du jeu accorde une réponse refusée par la correction automatique. */
function r1Accorder(u) {
  const st = S.step;
  if (st?.kind !== 'r1-reveal' || st.accordes.includes(u)) return;
  const e = E();
  const avant = e.r1.qualifies.length;
  const r = r1Bonne(e.r1, u, e.inscrits);
  e.r1 = { ...e.r1, scores: r.scores, qualifies: r.qualifies };
  st.accordes.push(u);
  stat('bonnes', u); statCat(u, byId[st.qid].c);
  sfx.good();
  toast(`${nomDe(u)} : +${pluriel(r.pts, 'point')}` + (r.qualifies.length > avant ? ' — qualifié !' : ''), 'ok');
  renderTentatives($('#r1Tentatives'), st, x => r1Accorder(x));
  renderDesks();
  persist();
  publish({ phase: PHASE.R1_REVEAL, q: { texte: byId[st.qid].q, cat: '', depuis: 9999, cps: 0 },
            reponse: { r: byId[st.qid].r, uid: u, texte: null, pts: r.pts, qualif: r.qualifies.length > avant },
            valeur: st.valeur, scores: e.r1.scores });
  setNext(r1Fini(e.r1, e.inscrits) ? 'Fin de la manche' : 'Question suivante', 'arrow-right');
  autoSuite(() => r1Next());
}

function r1Close(force) {
  clearTimers();
  const e = E();
  const N = e.inscrits.length;
  const { qualifies, elimines } = r1Cloture(e.r1, e.inscrits);
  // Étoile de qualification : seulement quand la manche élimine vraiment quelqu'un,
  // ou pour ceux qui ont atteint 9 points par eux-mêmes.
  const meritants = r1Elimine(N) ? qualifies : e.r1.qualifies;
  e.soiree.etoiles = etoiler(e.soiree.etoiles, meritants, RULES.ETOILES.QUALIFIE);
  e.elimines = elimines;
  e.manche = 'r2';
  const { ids: themes, ptr } = prendre(S.game.tirage.r2, e.ptr.r2, RULES.THEMES_PROPOSES);
  e.ptr.r2 = ptr;
  e.r2 = { ordre: qualifies, themes, choix: {}, res: {}, tourIdx: 0 };
  persist();
  sfx.qualif();
  const sous = elimines.length
    ? `Qualifiés : ${noms(qualifies)}. ${noms(elimines)} ${elimines.length > 1 ? 'quittent' : 'quitte'} le plateau.`
    : `Tout le monde continue ! Ordre de passage : ${noms(qualifies)}.`;
  carton({ icone: 'flag-checkered', titre: force ? 'Fin des Neuf points gagnants (au score)' : 'Fin des Neuf points gagnants', sous },
    () => r2Intro(), 'Place au 4 à la suite');
}

/* ═══════════════ MANCHE 2 — 4 À LA SUITE ═══════════════ */

function r2Intro() {
  const e = E();
  sfx.jingle();
  carton({
    icone: 'fire', titre: '4 à la suite',
    sous: `Quatre thèmes au choix, ${secondesR2()} secondes chacun.`,
    regles: [
      `Chacun son tour, dans l'ordre de qualification (${noms(e.r2.ordre)}), choisit un thème sur son téléphone.`,
      `${secondesR2()} secondes pour enchaîner : ${oral() ? "répondez à voix haute, l’animateur valide" : "tapez vite, « Passer » si vous séchez"}.`,
      'Une erreur remet la série à zéro. Quatre bonnes réponses d\'affilée : c\'est gagné, le tour s\'arrête.',
      'On retient la meilleure série. Égalité : le plus rapide à l\'atteindre passe devant.',
      e.r2.ordre.length > 2 ? 'Les deux meilleurs vont au face-à-face.' : 'Les deux candidats se retrouvent au face-à-face : la meilleure série y prend la main en premier.'
    ]
  }, () => r2Tour(), 'Premier candidat');
}

function r2ThemesRestants() {
  const r2 = E().r2;
  const pris = new Set(Object.values(r2.choix));
  return r2.themes.filter(t => !pris.has(t));
}

function r2Tour() {
  clearTimers();
  const e = E();
  if (e.r2.tourIdx >= e.r2.ordre.length) { r2Close(); return; }
  const joueur = e.r2.ordre[e.r2.tourIdx];
  S.seq += 1; S.tour = 0;
  S.step = { kind: 'r2-choix', joueur };
  scene('#stR2');
  $('#r2Choix').hidden = false; $('#r2Jeu').hidden = true; $('#r2Bilan').hidden = true;
  const restants = r2ThemesRestants();
  $('#r2Qui').innerHTML = `${pawn(joueurDe(joueur)).outerHTML} <strong>${esc(nomDe(joueur))}</strong>, choisissez votre thème`;
  const box = $('#r2Themes');
  box.innerHTML = '';
  e.r2.themes.forEach(tid => {
    const t = themeById[tid];
    const pris = !restants.includes(tid);
    box.append(el('button', { class: 'theme-card' + (pris ? ' is-pris' : ''), disabled: pris ? 'disabled' : null,
      onclick: () => r2Choisir(tid) },
      el('span', { class: 'theme-ere' }, t.ere === 'moderne' ? 'Génération Z' : 'Classique'),
      el('span', { class: 'theme-titre' }, t.titre),
      pris ? el('span', { class: 'theme-pris' }, 'Déjà pris') : null));
  });
  renderDesks();
  hint('Le candidat choisit sur son téléphone (ou cliquez sur un thème).');
  setNext('Passer son tour', 'forward', true);
  if (restants.length === 1) { later(() => r2Choisir(restants[0]), 1500); }
  let reste = RULES.SECONDES_CHOIX_THEME;
  publish({ phase: PHASE.R2_CHOIX, secondes: reste,
            r2: { joueur, themes: restants.map(id => ({ id, titre: themeById[id].titre })), theme: null } });
  every(() => { reste -= 1; if (reste <= 0) { clearTimers(); r2Choisir(restants[Math.floor(Math.random() * restants.length)]); } }, 1000);
}

function r2Choisir(tid) {
  const st = S.step;
  if (st?.kind !== 'r2-choix' || !r2ThemesRestants().includes(tid)) return;
  clearTimers();
  E().r2.choix[st.joueur] = tid;
  st.kind = 'r2-pret';
  st.tid = tid;
  sfx.tap();
  $$('#r2Themes .theme-card').forEach(c => c.classList.toggle('is-choisi', c.textContent.includes(themeById[tid].titre)));
  let n = 3;
  $('#r2Qui').innerHTML = `Thème <strong>${esc(themeById[tid].titre)}</strong> — ${esc(nomDe(st.joueur))}, prêt ? <span class="count mono">${n}</span>`;
  publish({ phase: PHASE.R2_CHOIX, secondes: 3, r2: { joueur: st.joueur, themes: [], theme: themeById[tid].titre } });
  setNext('Top chrono', 'play', true);
  every(() => {
    n -= 1; sfx.tick();
    const c = $('#r2Qui .count'); if (c) c.textContent = Math.max(n, 0);
    if (n <= 0) { clearTimers(); r2Start(); }
  }, 1000);
}

function r2Start() {
  const st = S.step;
  if (st?.kind !== 'r2-pret') return;
  clearTimers();
  Object.assign(st, { kind: 'r2-jeu', qi: 0, serie: 0, best: 0, tBest: null, t0: Date.now(),
                      restant: secondesR2(), last: null });
  $('#r2Choix').hidden = true; $('#r2Jeu').hidden = false;
  $('#r2Theme').textContent = themeById[st.tid].titre;
  $('#r2Joueur').innerHTML = `${pawn(joueurDe(st.joueur)).outerHTML} ${esc(nomDe(st.joueur))}`;
  $('#r2Last').innerHTML = '';
  setNext('Arrêter le tour', 'hand', true);
  hint(oral() ? 'L’animateur valide chaque réponse avec les boutons ci-dessous.' : 'Le candidat répond sur son téléphone.');
  sfx.jingle();
  every(() => {
    st.restant -= 1;
    majChrono();
    if (st.restant <= 5 && st.restant > 0) sfx.tick();
    if (st.restant <= 0) { clearTimers(); r2FinTour(); }
  }, 1000);
  r2Ask();
}

function majChrono() {
  const st = S.step;
  $('#r2Chrono').textContent = Math.max(0, st.restant);
  $('#r2ChronoWrap').style.setProperty('--p', Math.max(0, st.restant) / secondesR2());
  $('#r2ChronoWrap').classList.toggle('is-low', st.restant <= 10);
  $('#r2Lampes').innerHTML = '';
  for (let i = 1; i <= RULES.SERIE_R2; i++) $('#r2Lampes').append(el('span', { class: 'lampe' + (i <= st.serie ? ' is-on' : '') }));
  $('#r2Best').textContent = `Meilleure série : ${st.best}`;
}

function r2Ask() {
  const st = S.step;
  const t = themeById[st.tid];
  if (st.qi >= t.questions.length) { r2FinTour(); return; }
  const q = t.questions[st.qi];
  S.seq += 1;
  $('#r2Q').textContent = q.q;
  $('#r2Num').textContent = `Question ${st.qi + 1}`;
  majChrono();
  renderDesks();
  publish({ phase: PHASE.R2_JEU, secondes: st.restant,
            r2: { joueur: st.joueur, tid: st.tid, theme: t.titre, q: q.q, qn: st.qi + 1, serie: st.serie, best: st.best, last: st.last } });
}

function r2Juge(texte) {
  const st = S.step;
  if (st?.kind !== 'r2-jeu' || st.finishing) return;
  const q = themeById[st.tid].questions[st.qi];
  const passe = texte === '' || texte === '__passe__';
  const ok = !passe && juger(texte, q);
  const r = r2Reponse(st, ok, Date.now() - st.t0);
  Object.assign(st, { serie: r.serie, best: r.best, tBest: r.tBest });
  st.last = { texte: passe ? 'Je passe' : texte, ok, r: q.r };
  if (ok) { stat('bonnes', st.joueur); sfx.lampe(st.serie); } else sfx.bad();
  const sr = E().stats.series;
  sr[st.joueur] = Math.max(sr[st.joueur] || 0, st.best);
  $('#r2Last').innerHTML = `<span class="${ok ? 'ok' : 'ko'}">${iconHtml(ok ? 'circle-check' : 'circle-xmark')} « ${esc(st.last.texte)} »</span>`
    + (ok ? '' : ` <span class="attendu">réponse : ${esc(q.r)}</span>`);
  if (r.fini) { st.finishing = true; $('#oralControls').hidden = true; clearTimers(); majChrono(); later(() => r2FinTour(), 600); return; }
  st.qi += 1;
  r2Ask();
}

function r2FinTour() {
  const st = S.step;
  if (!st || (st.kind !== 'r2-jeu' && st.kind !== 'r2-choix' && st.kind !== 'r2-pret')) return;
  clearTimers();
  const e = E();
  const joueur = st.joueur;
  const best = st.best || 0;
  e.r2.res[joueur] = { best, tBest: st.tBest ?? null };
  e.r2.tourIdx += 1;
  S.step = { kind: 'r2-fin', joueur };
  persist();
  const quatre = best >= RULES.SERIE_R2;
  $('#r2Choix').hidden = true; $('#r2Jeu').hidden = true; $('#r2Bilan').hidden = false;
  $('#r2BilanTitre').textContent = quatre ? '4 à la suite !' : `${nomDe(joueur)} : ${pluriel(best, 'point')}`;
  $('#r2BilanSous').textContent = quatre
    ? `${nomDe(joueur)} réussit le sans-faute en ${Math.round((st.tBest || 0) / 1000)} secondes.`
    : `Meilleure série : ${best} sur ${RULES.SERIE_R2}.`;
  if (quatre) { sfx.win(); burst(110); } else sfx.tap();
  renderDesks();
  publish({ phase: PHASE.R2_FIN, r2: { joueur, best, quatre } });
  setNext(e.r2.tourIdx >= e.r2.ordre.length ? 'Résultats de la manche' : 'Candidat suivant', 'arrow-right');
  autoSuite(() => r2Tour(), 5000);
}

function r2Close() {
  clearTimers();
  const e = E();
  const cl = r2Classement(e.r2.res, e.r2.ordre);
  const finalistes = cl.slice(0, 2);
  const out = cl.slice(2);
  e.elimines = [...e.elimines, ...out];
  e.soiree.etoiles = etoiler(e.soiree.etoiles, finalistes, RULES.ETOILES.FINALISTE);
  e.manche = 'faf';
  e.faf = { joueurs: finalistes, scores: {}, main: finalistes[0], nq: 0, grandeFinale: false };
  e.pronos = {};
  persist();
  const det = cl.map(u => `${nomDe(u)} ${e.r2.res[u]?.best ?? 0}`).join(' · ');
  carton({ icone: 'ranking-star', titre: `${noms(finalistes)} au face-à-face !`,
           sous: (out.length ? `${noms(out)} ${out.length > 1 ? 's\'arrêtent' : 's\'arrête'} là. ` : '') + `Séries : ${det}.` },
    () => fafIntro(), 'Place au face-à-face');
}

/* ═══════════════ MANCHE 3 — FACE-À-FACE ═══════════════ */

function fafIntro() {
  const e = E();
  sfx.jingle();
  const [a, b] = e.faf.joueurs;
  carton({
    icone: 'handshake', titre: e.faf.grandeFinale ? 'La Grande Finale' : 'Face-à-face',
    sous: `${nomDe(a)} contre ${nomDe(b)} — premier à ${RULES.POINTS_FAF} points.`,
    regles: [
      'Le thème est annoncé : celui qui a la main décide de la prendre… ou de la laisser à son adversaire.',
      `Les indices tombent un par un. Trouvé au 1er indice : ${RULES.FAF_POINTS_MAX} points, puis 3, 2 et 1.`,
      'Seul le candidat qui joue peut buzzer. S\'il se trompe, l\'adversaire a une chance de rebond pour les mêmes points.',
      'Les zones alternent : 4 et 2 points pour celui qui prend, 3 et 1 pour son adversaire. La main de départ change à chaque question.',
      'Le public (les éliminés) pronostique le vainqueur sur son téléphone : un bon prono rapporte une étoile.'
    ],
    prono: !e.faf.grandeFinale
  }, () => fafNext(), 'Première énigme');
}

function renderPronos() {
  const e = E();
  const box = $('#cartonProno');
  const votes = Object.entries(e.pronos || {});
  box.innerHTML = '';
  box.append(el('span', { class: 'prono-title' }, icon('eye'), ` Pronostics du public : ${votes.length}`));
  e.faf.joueurs.forEach(u => {
    const n = votes.filter(([, v]) => v === u).length;
    box.append(el('span', { class: 'prono-chip' }, pawn(joueurDe(u)), `${nomDe(u)} : ${n}`));
  });
}

const autre = u => E().faf.joueurs.find(x => x !== u);

function fafNext() {
  clearTimers();
  const e = E();
  const f = e.faf;
  const v = fafVainqueur(f.scores, f.joueurs);
  if (v) { fafFin(v); return; }
  if (f.nq >= RULES.MAX_QUESTIONS_FAF) {
    const [a, b] = f.joueurs;
    const sa = f.scores[a] || 0, sb = f.scores[b] || 0;
    if (sa !== sb) { fafFin(sa > sb ? a : b); return; }   // égalité : on continue jusqu'à la différence
  }
  const { ids, ptr } = prendre(S.game.tirage.faf, e.ptr.faf, 1);
  e.ptr.faf = ptr;
  const q = fafById[ids[0]];
  if (!q) { fafFin(f.joueurs[0]); return; }
  markUsed([q.id]);
  S.seq += 1; S.tour = 0; S.buzzes = {};
  S.step = { kind: 'faf-main', qid: q.id, main: f.main, joueur: null, shown: 0, tentatives: [], accordes: [], rebond: false };
  scene('#stFaf');
  renderFafDesks();
  $('#fafTheme').textContent = q.theme;
  $('#fafIndices').innerHTML = '';
  $('#fafValeur').textContent = '';
  $('#fafRev').hidden = true;
  $('#fafStatus').innerHTML = `${pawn(joueurDe(f.main)).outerHTML} <strong>${esc(nomDe(f.main))}</strong>, vous prenez la main ou vous la laissez ?`;
  setNext('Prendre pour lui', 'hand', true);
  hint('Réponse sur le téléphone du candidat.');
  let reste = RULES.SECONDES_MAIN;
  publish({ phase: PHASE.FAF_MAIN, secondes: reste, prono: f.nq === 0 && !f.grandeFinale,
            faf: fafBc({ theme: q.theme }) });
  every(() => { reste -= 1; if (reste <= 0) { clearTimers(); fafDecision('prendre'); } }, 1000);
}

function fafBc(extra = {}) {
  const f = E().faf;
  return { joueurs: f.joueurs, scores: f.scores, main: f.main, grandeFinale: !!f.grandeFinale, ...extra };
}

function renderFafDesks() {
  const f = E().faf;
  const st = S.step || {};
  f.joueurs.forEach((u, i) => {
    const box = $(i === 0 ? '#fafA' : '#fafB');
    const p = joueurDe(u);
    const sc = f.scores[u] || 0;
    box.style.setProperty('--c', p.color);
    box.className = 'faf-desk' + (st.joueur === u || st.repondant === u ? ' is-actif' : '') + (f.main === u ? ' has-main' : '');
    box.innerHTML = '';
    box.append(
      el('div', { class: 'faf-name' }, p.name),
      el('div', { class: 'faf-score mono' }, String(sc)),
      el('div', { class: 'faf-bar' }, Array.from({ length: RULES.POINTS_FAF }, (_, k) => el('span', { class: k < sc ? 'is-on' : '' }))));
    // append(null) écrirait « null » : le badge n'est ajouté que s'il existe.
    if (f.main === u) box.append(el('div', { class: 'faf-main' }, icon('hand'), ' la main'));
  });
}

function fafDecision(v) {
  const st = S.step;
  if (st?.kind !== 'faf-main') return;
  clearTimers();
  const f = E().faf;
  st.premier = v === 'laisser' ? autre(f.main) : f.main;
  st.joueur = st.premier;
  st.kind = 'faf-indices';
  st.shown = 0;
  sfx.tap();
  if (v === 'laisser') toast(`${nomDe(f.main)} laisse la main à ${nomDe(st.joueur)} !`, 'info');
  fafIndice();
}

/** Affiche l'indice suivant ; la valeur de la question baisse à chaque indice. */
function fafIndice() {
  const st = S.step;
  const q = fafById[st.qid];
  clearTimers();
  st.kind = 'faf-indices';
  if (st.shown < q.indices.length) { st.shown += 1; sfx.indice(); }
  S.tour += 1; // Une nouvelle zone invalide les buzz et réponses précédents.
  st.joueur = fafJoueurZone(st.premier, autre(st.premier), st.shown);
  st.repondant = null;
  st.rebond = false;
  const valeur = valeurFaf(st.shown);
  st.valeur = valeur;
  renderIndices(q, st.shown);
  renderFafDesks();
  $('#fafValeur').textContent = pluriel(valeur, 'point');
  $('#fafStatus').innerHTML = `${pawn(joueurDe(st.joueur)).outerHTML} <strong>${esc(nomDe(st.joueur))}</strong> joue — buzzez dès que vous avez trouvé !`;
  setNext(st.shown < q.indices.length ? 'Indice suivant' : 'Révéler', 'forward', true);
  publish({ phase: PHASE.FAF_INDICES, faf: fafBc({ theme: q.theme, joueur: st.joueur, indices: q.indices.slice(0, st.shown), valeur }) });
  const duree = st.shown < q.indices.length ? RULES.SECONDES_PAR_INDICE : RULES.SECONDES_APRES_INDICES;
  later(() => { if (S.step === st && st.kind === 'faf-indices') { if (st.shown < q.indices.length) fafIndice(); else fafReveal(); } }, duree * 1000);
  onBuzz();
}

function renderIndices(q, n) {
  const box = $('#fafIndices');
  box.innerHTML = '';
  q.indices.slice(0, n).forEach((t, i) => box.append(el('li', { class: i === n - 1 ? 'is-new' : '' },
    el('span', { class: 'indice-n' }, String(RULES.FAF_POINTS_MAX - i)), t)));
}

function fafMainAuBuzz(u) {
  const st = S.step;
  if (st?.kind !== 'faf-indices' || u !== st.joueur) return;
  fafRepondre(u, false);
}

function fafRepondre(u, rebond) {
  clearTimers();
  const st = S.step;
  st.kind = 'faf-reponse';
  st.repondant = u;
  st.rebond = rebond;
  if (!rebond) sfx.buzz(joueurDe(u).son);
  renderFafDesks();
  let reste = RULES.SECONDES_REPONSE;
  const tic = () => {
    $('#fafStatus').innerHTML = `${pawn(joueurDe(u)).outerHTML} <strong>${esc(nomDe(u))}</strong> ${rebond ? 'tente le rebond' : 'a buzzé'} ! Réponse dans <strong>${reste}</strong> s`;
  };
  tic();
  publish({ phase: PHASE.FAF_REPONSE, secondes: reste,
            faf: fafBc({ theme: fafById[st.qid].theme, joueur: st.joueur, repondant: u, rebond,
                         indices: fafById[st.qid].indices.slice(0, st.shown), valeur: st.valeur }) });
  every(() => { reste -= 1; tic(); if (reste <= 3 && reste > 0) sfx.tick(); if (reste <= 0) { clearTimers(); fafJuge(u, ''); } }, 1000);
}

function fafJuge(u, texte) {
  const st = S.step;
  if (st?.kind !== 'faf-reponse' || st.repondant !== u) return;
  clearTimers();
  const q = fafById[st.qid];
  const ok = !!texte && juger(texte, q);
  st.tentatives.push({ uid: u, texte, ok });
  const f = E().faf;
  if (ok) {
    f.scores = { ...f.scores, [u]: (f.scores[u] || 0) + st.valeur };
    stat('bonnes', u);
    sfx.good();
    fafReveal({ uid: u, texte, pts: st.valeur });
    return;
  }
  sfx.bad();
  st.kind = 'faf-pause';
  if (!st.rebond) {
    // Rebond : l'adversaire tente sa chance, pour les mêmes points.
    S.tour += 1;
    $('#fafStatus').innerHTML = `${iconHtml('circle-xmark')} « ${esc(texte || 'pas de réponse')} » — rebond pour ${esc(nomDe(autre(u)))} !`;
    later(() => { if (S.step === st) fafRepondre(autre(u), true); }, 1400);
    return;
  }
  later(() => { if (S.step === st) { if (st.shown < q.indices.length) fafIndice(); else fafReveal(); } }, 900);
}

function fafReveal(gain = null) {
  clearTimers();
  const st = S.step;
  if (!st?.qid) return;
  st.kind = 'faf-reveal';
  const q = fafById[st.qid];
  const e = E();
  const f = e.faf;
  renderIndices(q, q.indices.length);
  $('#fafRev').hidden = false;
  $('#fafReponse').textContent = q.r;
  $('#fafResultat').innerHTML = gain
    ? `${iconHtml('circle-check')} <strong>${esc(nomDe(gain.uid))}</strong> marque ${pluriel(gain.pts, 'point')}`
    : 'Personne ne marque.';
  if (gain) burst(40);
  renderTentatives($('#fafTentatives'), st, x => fafAccorder(x));
  f.nq += 1;
  f.main = autre(f.main);
  st.joueur = null; st.repondant = null;
  renderFafDesks();
  persist();
  $('#fafStatus').innerHTML = '';
  publish({ phase: PHASE.FAF_REVEAL, reponse: { r: q.r, uid: gain?.uid || null, pts: gain?.pts || 0 },
            faf: fafBc({ theme: q.theme, indices: q.indices }) });
  const v = fafVainqueur(f.scores, f.joueurs);
  setNext(v ? 'Et le champion est…' : 'Énigme suivante', 'arrow-right');
  hint('');
  autoSuite(() => fafNext(), 5000);
}

function fafAccorder(u) {
  const st = S.step;
  if (st?.kind !== 'faf-reveal' || st.accordes.includes(u)) return;
  const f = E().faf;
  f.scores = { ...f.scores, [u]: (f.scores[u] || 0) + (st.valeur || 1) };
  st.accordes.push(u);
  stat('bonnes', u);
  sfx.good();
  toast(`${nomDe(u)} : +${pluriel(st.valeur || 1, 'point')}`, 'ok');
  renderTentatives($('#fafTentatives'), st, x => fafAccorder(x));
  renderFafDesks();
  persist();
  publish({ phase: PHASE.FAF_REVEAL, reponse: { r: fafById[st.qid].r, uid: u, pts: st.valeur || 1 },
            faf: fafBc({ theme: fafById[st.qid].theme, indices: fafById[st.qid].indices }) });
  const v = fafVainqueur(f.scores, f.joueurs);
  setNext(v ? 'Et le champion est…' : 'Énigme suivante', 'arrow-right');
  autoSuite(() => fafNext(), 5000);
}

function fafFin(v) {
  clearTimers();
  const e = E();
  if (e.faf.grandeFinale) {
    e.soiree.victoires = { ...e.soiree.victoires, [v]: (e.soiree.victoires[v] || 0) + 1 };
    e.soiree.superChampion = v;
    persist();
    terminer();
    return;
  }
  e.soiree.victoires = { ...e.soiree.victoires, [v]: (e.soiree.victoires[v] || 0) + 1 };
  e.soiree.etoiles = etoiler(e.soiree.etoiles, [v], RULES.ETOILES.CHAMPION);
  const bons = Object.entries(e.pronos || {}).filter(([u, pick]) => pick === v && !e.faf.joueurs.includes(u)).map(([u]) => u);
  e.soiree.etoiles = etoiler(e.soiree.etoiles, bons, RULES.ETOILES.PRONO);
  e.soiree.champions = [...(e.soiree.champions || []), v];
  e.dernierProno = bons;
  e.manche = 'fin-emission';
  persist();
  finEmission(false);
}

/* ═══════════════ FIN D'ÉMISSION / SOIRÉE ═══════════════ */

function finEmission(reprise) {
  clearTimers();
  const e = E();
  const v = e.soiree.champions[e.soiree.champions.length - 1];
  S.step = { kind: 'fin-emission' };
  scene('#stFin');
  $('#finTitre').textContent = `${nomDe(v)}, champion de l'émission !`;
  const f = e.faf;
  $('#finSous').textContent = f ? `${f.scores[v] || 0} à ${f.scores[autre(v)] || 0} au face-à-face.`
    + (e.dernierProno?.length ? ` Bon pronostic : ${noms(e.dernierProno)} (+1 étoile).` : '') : '';
  renderClassementSoiree($('#finClassement'));
  if (!reprise) { sfx.win(); burst(160); }
  const derniere = e.emission >= e.nbEmissions;
  const gf = derniere ? grandeFinale(e.soiree, inscritsSoiree(), e.nbEmissions) : null;
  setNext(!derniere ? `Émission ${e.emission + 1}` : gf ? 'La Grande Finale' : 'Le podium de la soirée', 'arrow-right');
  S.step.suite = () => {
    if (!derniere) { startEmission(e.emission + 1); return; }
    if (gf) { lancerGrandeFinale(gf); return; }
    terminer();
  };
  hint(derniere ? '' : 'Tout le monde revient sur le plateau pour l\'émission suivante !');
  publish({ phase: PHASE.FIN_EMISSION, fin: { champion: v, classement: classementBc(), prono: e.dernierProno || [] } });
}

/** Tous ceux qui ont joué au moins une émission (les partis gardent leurs étoiles). */
function inscritsSoiree() {
  const e = E();
  const vus = new Set([...S.players.map(p => p.uid), ...Object.keys(e.soiree.etoiles), ...Object.keys(e.soiree.victoires)]);
  return [...vus].map(u => ({ uid: u, name: nomDe(u), color: joueurDe(u).color }));
}

function classementBc() {
  return classementSoiree(E().soiree, inscritsSoiree()).map(l => ({ uid: l.uid, rang: l.rang, victoires: l.victoires, etoiles: l.etoiles }));
}

function renderClassementSoiree(box) {
  box.innerHTML = '';
  classementSoiree(E().soiree, inscritsSoiree()).forEach(l => box.append(el('div', { class: 'podium-row' },
    el('span', { class: 'rang' }, l.rang), pawn(l), el('span', { class: 'grow' }, l.name),
    el('span', { class: 'vict' }, icon('trophy'), ' ', l.victoires),
    el('span', { class: 'etoiles' }, icon('star'), ' ', l.etoiles))));
}

function lancerGrandeFinale([a, b]) {
  const e = E();
  e.manche = 'finale';
  e.faf = { joueurs: [a, b], scores: {}, main: a, nq: 0, grandeFinale: true };
  e.pronos = {};
  persist();
  fafIntro();
}

async function terminer() {
  clearTimers();
  const e = E();
  e.manche = 'fini';
  S.step = { kind: 'fini' };
  await patchGame(S.code, { status: 'fini', etat: e }).catch(() => {});
  const cl = classementBc();
  publish({ phase: PHASE.FINI, fin: { champion: e.soiree.superChampion || cl[0]?.uid || null, classement: cl,
            trophees: trophees(e.stats, inscritsSoiree()) } });
  showScreen('screen-podium');
  showPodium(false);
}

function showPodium(calme) {
  const e = E();
  if (!e) return;
  const cl = classementSoiree(e.soiree, inscritsSoiree());
  const top = e.soiree.superChampion ? cl.find(l => l.uid === e.soiree.superChampion) : cl[0];
  const exaequo = !e.soiree.superChampion && cl.filter(l => l.rang === 1).length > 1;
  $('#podiumTitle').textContent = !top ? 'Soirée terminée'
    : exaequo ? 'Égalité au sommet !'
    : e.nbEmissions > 1 ? `${top.name}, Super Champion !` : `${top.name}, champion de l'émission !`;
  $('#podiumLine').textContent = !top ? '' : exaequo
    ? `${noms(cl.filter(l => l.rang === 1).map(l => l.uid))} finissent à égalité.`
    : `${pluriel(top.victoires, 'victoire')} et ${pluriel(top.etoiles, 'étoile')} ce soir.`;
  renderClassementSoiree($('#podiumBoard'));
  const tb = $('#podiumTrophees');
  tb.innerHTML = '';
  trophees(e.stats, inscritsSoiree()).forEach(t => tb.append(el('div', { class: 'trophee' },
    el('div', { class: 'trophee-icon' }, icon(t.icone)),
    el('div', { class: 'trophee-titre' }, t.titre),
    el('div', { class: 'trophee-nom' }, nomDe(t.uid)),
    el('div', { class: 'trophee-detail' }, t.detail))));
  if (calme) return;
  sfx.win(); burst(180);
}

/** Rejouer : même code, mêmes joueurs, nouveau tirage — les téléphones suivent seuls. */
$('#btnReplay')?.addEventListener('click', async () => {
  let format = S.game.format;
  if (!guard('format', format).ok) format = 'emission';
  const tirage = nouveauTirage(S.game.ton);
  try {
    await patchGame(S.code, { status: 'lobby', format, tirage, etat: null });
    S.game = { ...S.game, status: 'lobby', format, tirage, etat: null };
    S.etat = null;
    enterLobby(S.code);
  } catch (e) { toast('Impossible de relancer : ' + (e.code || e.message), 'err'); }
});

/* ═══════════════ ENTRÉES DES TÉLÉPHONES ═══════════════ */

function onInputs(list) {
  // Premier instantané : tout ce qui existe déjà date d'avant (reprise) → ignoré.
  if (!S.inputsPrets) {
    list.forEach(i => S.vus.add(cleInput(i)));
    S.inputsPrets = true;
    return;
  }
  for (const i of list) {
    const k = cleInput(i);
    if (S.vus.has(k)) continue;
    S.vus.add(k);
    traiterInput(i);
  }
}
const cleInput = i => `${i.uid}|${i.seq}|${i.tour}|${i.kind}|${i.value}|${i.at?.seconds || 0}.${i.at?.nanoseconds || 0}`;

function traiterInput(i) {
  const st = S.step;
  const e = S.etat;
  if (!st || !e) return;
  if (i.kind === INPUT.PRONO) {
    if (e.faf && !e.faf.grandeFinale && e.faf.nq === 0 && !e.faf.joueurs.includes(i.uid) && e.faf.joueurs.includes(i.value)) {
      e.pronos = { ...(e.pronos || {}), [i.uid]: i.value };
      if (st.kind === 'carton' && !$('#cartonProno').hidden) renderPronos();
      persist();
    }
    return;
  }
  if (i.seq !== S.seq) return;
  switch (st.kind) {
    case 'r1-reponse':
      if (i.kind === INPUT.REPONSE && i.uid === st.main && i.tour === S.tour) r1Juge(i.uid, i.value);
      break;
    case 'r2-choix':
      if (i.kind === INPUT.THEME && i.uid === st.joueur) r2Choisir(i.value);
      break;
    case 'r2-jeu':
      if (i.kind === INPUT.REPONSE && i.uid === st.joueur) r2Juge(i.value);
      break;
    case 'faf-main':
      if (i.kind === INPUT.MAIN && i.uid === st.main) fafDecision(i.value === 'laisser' ? 'laisser' : 'prendre');
      break;
    case 'faf-reponse':
      if (i.kind === INPUT.REPONSE && i.uid === st.repondant && i.tour === S.tour) fafJuge(i.uid, i.value);
      break;
  }
}

/* ═══════════════ COMMANDES DU MAÎTRE DU JEU ═══════════════ */

/** Enchaînement automatique après une révélation (désactivable). */
function autoSuite(fn, ms = RULES.PAUSE_REVELATION_MS) {
  if (!S.auto) return;
  const st = S.step;
  later(() => { if (S.step === st) fn(); }, ms);
}

function majAuto() {
  const b = $('#btnAuto');
  b.innerHTML = S.auto ? `${iconHtml('pause')} Auto` : `${iconHtml('play')} Manuel`;
  b.classList.toggle('is-off', !S.auto);
  b.title = S.auto ? 'Enchaînement automatique activé : cliquer pour passer en manuel'
                   : 'Mode manuel : cliquer pour réactiver l\'enchaînement automatique';
}
$('#btnAuto')?.addEventListener('click', () => {
  S.auto = !S.auto;
  majAuto();
  toast(S.auto ? 'Enchaînement automatique.' : 'Mode manuel : « Suivant » pour avancer.', 'info');
});

async function suivant() {
  if (S.busy || !S.step) return;
  S.busy = true;
  try {
    const st = S.step;
    sfx.tap();
    switch (st.kind) {
      case 'carton': st.suite && st.suite(); break;
      case 'r1-lecture': case 'r1-reponse': case 'r1-pause': r1Reveal(); break;   // « Passer »
      case 'r1-reveal': r1Next(); break;
      case 'r2-choix': r2FinTour(); break;                              // « Passer son tour »
      case 'r2-pret': clearTimers(); r2Start(); break;
      case 'r2-jeu': showConfirmModal(`Arrêter le tour de ${nomDe(st.joueur)} maintenant ?`, () => r2FinTour(), { okLabel: 'Arrêter' }); break;
      case 'r2-fin': r2Tour(); break;
      case 'faf-main': fafDecision('prendre'); break;
      case 'faf-indices': {
        const q = fafById[st.qid];
        if (st.shown < q.indices.length) fafIndice(); else fafReveal();
        break;
      }
      case 'faf-reponse': case 'faf-pause': break;
      case 'faf-reveal': fafNext(); break;
      case 'fin-emission': st.suite && st.suite(); break;
    }
  } finally { setTimeout(() => { S.busy = false; }, 350); }
}
$('#btnLiveNext')?.addEventListener('click', suivant);

$('#btnCloreManche')?.addEventListener('click', () => {
  if (E()?.manche !== 'r1') return;
  showConfirmModal('Clore les Neuf points gagnants maintenant ? Les places restantes vont aux meilleurs scores.',
    () => r1Close(true), { okLabel: 'Clore la manche' });
});

$('#btnLiveQuit')?.addEventListener('click', () => {
  showConfirmModal('Terminer la soirée maintenant et afficher le podium ?', () => terminer(),
    { okLabel: 'Terminer', danger: true });
});

/* Raccourcis clavier : Espace / Entrée pour avancer, A pour l'enchaînement auto. */
document.addEventListener('keydown', e => {
  if (!$('#screen-live').classList.contains('is-active')) return;
  if (e.target.matches('input, textarea') || $('.modal.is-open')) return;
  if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); suivant(); }
  if (e.key === 'a' || e.key === 'A') $('#btnAuto').click();
});

function verdictOral(ok) {
  if (!oral()) return;
  const st = S.step;
  if (st?.kind === 'r1-reponse') r1Juge(st.main, ok ? byId[st.qid].r : '');
  else if (st?.kind === 'faf-reponse') fafJuge(st.repondant, ok ? fafById[st.qid].r : '');
  else if (st?.kind === 'r2-jeu') r2Juge(ok ? themeById[st.tid].questions[st.qi].r : '');
}
$('#btnOralGood').addEventListener('click', () => verdictOral(true));
$('#btnOralBad').addEventListener('click', () => verdictOral(false));
