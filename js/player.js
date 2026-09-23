import { setChristmas } from './christmas-scene.js';
import { revealQuestion } from './question-text.js';
/* Bibi Quizz — manette téléphone : rejoindre → buzzer / taper / choisir → résultats.
 *
 * Le téléphone ne décide rien : il affiche le broadcast de l'écran maître (live.js)
 * et renvoie buzz et saisies. Toutes les durées sont des chronos LOCAUX démarrés à
 * réception : on ne compare jamais les horloges des appareils.
 */
import { $, $$, el, icon, iconHtml, esc, showScreen, toast, sfx, burst, initiale, ls, vibre,
         listeNoms, pluriel } from './util.js';
import { COULEURS, BUZZERS, RULES } from './config.js';
import { uid } from './firebase.js';
import { loadGame, watchGame, watchPlayers, watchMyPlayer, joinGame, myPlayer, sendBuzz, sendInput } from './store.js';
import { PHASE, INPUT, peutBuzzer, retraitConfirme } from './live.js';
import { juger } from './game.js';
import { themeById } from './data/questions.js';

const P = {
  session: 0, code: null, me: null, players: [], bc: null, unsubs: [],
  timer: null, typo: null,
  buzzKey: null,       // `${seq}:${tour}` du dernier buzz envoyé
  envoye: null,        // `${seq}:${tour}` de la dernière réponse envoyée
  vueCle: null
};

export function leavePlayer() {
  setChristmas(false);
  P.session++;
  P.unsubs.forEach(u => { try { u(); } catch {} });
  P.unsubs = [];
  stopTimer(); stopTypo();
  P.bc = null; P.vueCle = null;
}
function stopTimer() { if (P.timer) { clearInterval(P.timer); P.timer = null; } }
function stopTypo() { if (P.typo) { clearInterval(P.typo); P.typo = null; } }

const nomDe = u => P.players.find(p => p.uid === u)?.name || 'Un candidat';
const moi = () => uid();

/* ═══════════════ REJOINDRE ═══════════════ */
let sonChoisi = ls.get('bq.son', 'classique');

export async function enterJoin(code) {
  leavePlayer();
  P.code = code;
  const session = P.session;
  const active = () => P.session === session;
  let game;
  try { game = await loadGame(code); } catch { game = null; }
  if (!active()) return;
  if (!game) { toast('Aucune partie avec ce code.', 'err'); location.hash = '#/'; return; }

  const deja = await myPlayer(code).catch(() => null);
  if (!active()) return;
  if (deja) { P.me = deja; enterPlay(); return; }

  $('#joinCode').textContent = code;
  $('#joinMeta').textContent = game.status === 'lobby'
    ? 'Choisis ton prénom et ton son de buzzer.'
    : "La partie a commencé : tu rejoins le public et tu joueras dès l'émission suivante.";
  $('#inputName').value = ls.get('bq.name', '');
  renderSons();
  showScreen('screen-join');
  setTimeout(() => $('#inputName').focus(), 300);

  $('#btnJoinConfirm').onclick = async () => {
    if (!active()) return;
    const name = $('#inputName').value.trim().replace(/\s+/g, ' ');
    if (name.length < 2) { toast('Ton prénom (2 lettres minimum).', 'err'); return; }
    const btn = $('#btnJoinConfirm');
    btn.disabled = true;
    try {
      const g = await loadGame(code);
      if (!g) { toast('La partie a été supprimée.', 'err'); location.hash = '#/'; return; }
      if (!active()) return;
      const players = await new Promise(res => { const un = watchPlayers(code, ps => { un(); res(ps); }); });
      if (players.some(p => p.name.toLowerCase() === name.toLowerCase() && p.uid !== uid())) {
        toast('Ce prénom est déjà pris dans la partie.', 'err'); return;
      }
      if (players.length >= (g.maxJoueurs || 4)) {
        toast(`La partie est complète (${g.maxJoueurs} candidats max).`, 'err'); return;
      }
      const pris = new Set(players.map(p => p.color));
      const color = COULEURS.find(c => !pris.has(c)) || COULEURS[players.length % COULEURS.length];
      ls.set('bq.name', name);
      await joinGame(code, { name, color, son: sonChoisi });
      if (!active()) return;
      P.me = { uid: uid(), name, color, son: sonChoisi };
      sfx.buzz(sonChoisi); vibre(40);
      enterPlay();
    } catch (e) {
      toast('Impossible de rejoindre : ' + (e.code || e.message), 'err');
    } finally { btn.disabled = false; }
  };
}
$('#inputName')?.addEventListener('keydown', e => { if (e.key === 'Enter') $('#btnJoinConfirm').click(); });

function renderSons() {
  const box = $('#joinSons');
  box.innerHTML = '';
  BUZZERS.forEach(b => box.append(el('button', { class: 'son' + (b.id === sonChoisi ? ' is-on' : ''), type: 'button',
    onclick: () => { sonChoisi = b.id; ls.set('bq.son', b.id); sfx.buzz(b.id); renderSons(); } },
    icon('music'), ' ', b.label)));
}

/* ═══════════════ MANETTE ═══════════════ */

function enterPlay() {
  showScreen('screen-play');
  $('#playMe').innerHTML = '';
  $('#playMe').append(pawn(P.me), P.me.name);
  vue('wait', { titre: 'Tu es dans la partie !', ligne: "Regarde l'écran du maître du jeu." });
  const session = P.session;
  const active = () => P.session === session;
  P.unsubs.push(watchPlayers(P.code, ps => {
    if (active()) P.players = ps;
  }));
  P.unsubs.push(watchMyPlayer(P.code, (exists, metadata, error) => {
    if (!active()) return;
    if (error) { toast('Connexion interrompue. Reconnexion en cours…', 'info'); return; }
    if (retraitConfirme(exists, metadata)) {
      leavePlayer();
      toast('Tu as été retiré de la partie.', 'err');
      location.hash = '#/';
    }
  }));
  P.unsubs.push(watchGame(P.code, (g, error, metadata) => {
    if (!active()) return;
    if (error) { toast('Connexion interrompue. Reconnexion en cours…', 'info'); return; }
    if (!g) {
      if (retraitConfirme(false, metadata)) {
        leavePlayer(); toast('La partie a été supprimée.', 'err'); location.hash = '#/';
      }
      return;
    }
    setChristmas(g.event === 'noel');
    // Le doc de partie change aussi à chaque sauvegarde de l'état de reprise : on ne
    // redessine que sur un NOUVEAU broadcast, sinon la saisie en cours serait effacée.
    if (g.bc && (!P.bc || g.bc.at !== P.bc.at || g.bc.seq !== P.bc.seq)) render(g.bc);
  }));
}

function pawn(p) {
  const s = el('span', { class: 'pawn' }, initiale(p?.name));
  s.style.setProperty('--c', p?.color || '#ffb020');
  return s;
}

/** Affiche une seule section de la manette. */
function vue(nom, data = {}) {
  ['wait', 'buzz', 'saisie', 'themes', 'main', 'result'].forEach(v => { $('#p-' + v).hidden = v !== nom; });
  $('#pWaitTest').hidden = true;
  if (nom === 'wait') {
    $('#pWaitIcon').innerHTML = iconHtml(data.icone || 'tv');
    $('#pWaitTitre').textContent = data.titre || '';
    $('#pWaitLigne').textContent = data.ligne || '';
    renderProno(data.prono);
  }
}

function status(txt, kind = '') {
  const s = $('#playStatus');
  s.textContent = txt || '';
  s.dataset.kind = kind;
}

/** Chrono local affiché dans `node`. */
function chrono(node, secondes, fin) {
  stopTimer();
  let reste = secondes;
  if (!node) return;
  node.textContent = reste > 0 ? reste + ' s' : '';
  if (reste <= 0) return;
  P.timer = setInterval(() => {
    reste -= 1;
    node.textContent = Math.max(0, reste) + ' s';
    node.classList.toggle('is-low', reste <= 3);
    if (reste <= 0) { stopTimer(); fin && fin(); }
  }, 1000);
}

/* ── Rendu principal ─────────────────────────────────────────────────── */
function render(bc) {
  const prev = P.bc;
  P.bc = bc;
  const me = moi();
  const inscrit = bc.inscrits.includes(me);
  const cle = `${bc.phase}|${bc.seq}|${bc.tour}`;
  const nouvelle = cle !== P.vueCle;
  P.vueCle = cle;
  status(statutCourt(bc));

  switch (bc.phase) {
    case PHASE.ATTENTE:
      stopTimer(); stopTypo();
      vue('wait', { icone: 'people-group', titre: 'Tu es dans la partie !',
        ligne: 'Le maître du jeu va lancer l\'émission. Teste ton buzzer en attendant !' });
      $('#pWaitTest').hidden = false;
      return;
    case PHASE.CARTON:
      stopTimer(); stopTypo();
      if (nouvelle) vibre(20);
      vue('wait', { icone: bc.carton?.icone || 'tv', titre: bc.carton?.titre || '', ligne: bc.carton?.sous || '',
                    prono: bc.prono ? bc.faf : null });
      return;

    case PHASE.R1_LECTURE:
    case PHASE.R1_REPONSE:
      renderR1(bc, nouvelle, inscrit);
      return;
    case PHASE.R1_REVEAL:
      stopTimer(); stopTypo();
      renderResultat(bc.reponse, bc.reponse?.uid === me
        ? `+${pluriel(bc.reponse.pts, 'point')}${bc.reponse.qualif ? ' — Qualifié !' : ''}` : null, bc);
      if (nouvelle && bc.reponse?.uid === me) { vibre([40, 60, 40]); if (bc.reponse.qualif) burst(60); }
      return;

    case PHASE.R2_CHOIX: renderR2Choix(bc, nouvelle); return;
    case PHASE.R2_JEU:   renderR2Jeu(bc, nouvelle, prev); return;
    case PHASE.R2_FIN:
      stopTimer();
      vue('wait', { icone: 'flag-checkered',
        titre: `${bc.r2?.joueur === me ? 'Ton score' : nomDe(bc.r2?.joueur)} : ${bc.r2?.best || 0} points`,
        ligne: 'Regarde l’écran.' });
      return;

    case PHASE.FAF_MAIN: renderFafMain(bc, nouvelle); return;
    case PHASE.FAF_INDICES: renderFafIndices(bc, nouvelle); return;
    case PHASE.FAF_REPONSE: renderFafReponse(bc, nouvelle); return;
    case PHASE.FAF_REVEAL:
      stopTimer();
      renderResultat(bc.reponse, bc.reponse?.uid === me ? `+${pluriel(bc.reponse.pts, 'point')}` : null, bc);
      if (nouvelle && bc.reponse?.uid === me) vibre([40, 60, 40]);
      return;

    case PHASE.FIN_EMISSION: {
      stopTimer(); stopTypo();
      const f = bc.fin || {};
      const ligne = f.classement?.find(l => l.uid === me);
      const champ = f.champion === me;
      vue('wait', { icone: champ ? 'crown' : 'trophy',
        titre: champ ? 'Tu es champion de l\'émission !' : `${nomDe(f.champion)} remporte l'émission`,
        ligne: ligne ? `Ta soirée : ${pluriel(ligne.victoires, 'victoire')}, ${pluriel(ligne.etoiles, 'étoile')}.`
          + (f.prono?.includes(me) ? ' Bon pronostic, +1 étoile !' : '') : '' });
      if (nouvelle && champ) { burst(140); vibre([80, 50, 80, 50, 200]); }
      return;
    }
    case PHASE.FINI: {
      stopTimer(); stopTypo();
      const f = bc.fin || {};
      const ligne = f.classement?.find(l => l.uid === me);
      const mesTrophees = (f.trophees || []).filter(t => t.uid === me).map(t => t.titre);
      vue('wait', { icone: f.champion === me ? 'crown' : 'ranking-star',
        titre: f.champion === me ? 'Super Champion de la soirée !' : ligne ? `Tu finis ${ligne.rang === 1 ? '1er' : ligne.rang + 'e'}` : 'Soirée terminée',
        ligne: (ligne ? `${pluriel(ligne.victoires, 'victoire')}, ${pluriel(ligne.etoiles, 'étoile')}.` : '')
          + (mesTrophees.length ? ` Trophée : ${mesTrophees.join(', ')} !` : '') });
      if (nouvelle && f.champion === me) burst(160);
      return;
    }
  }
}

/** Petite ligne d'état en haut de la manette. */
function statutCourt(bc) {
  const me = moi();
  if (!bc.inscrits.includes(me) && bc.phase !== PHASE.ATTENTE && bc.phase !== PHASE.FINI) return 'Public';
  if (bc.elimines.includes(me)) return 'Éliminé — dans le public';
  if (bc.manche === 'r1') {
    if (bc.qualifies.includes(me)) return 'Qualifié !';
    return pluriel(bc.scores?.[me] || 0, 'point');
  }
  if (bc.faf && bc.faf.joueurs?.includes(me)) return `Duel des indices : ${bc.faf.scores?.[me] || 0} / ${RULES.POINTS_FAF}`;
  return '';
}

/* ── Manche 1 ────────────────────────────────────────────────────────── */
function renderR1(bc, nouvelle, inscrit) {
  const me = moi();
  const k = `${bc.seq}:${bc.tour}`;
  const texte = bc.q?.texte || '';

  if (bc.phase === PHASE.R1_REPONSE && bc.main === me) {
    stopTypo();
    if (P.envoye === k && !$('#p-saisie').hidden) return;   // déjà répondu : on n'efface rien
    ouvrirSaisie({ titre: 'À toi ! Tape ta réponse', question: texte.slice(0, bc.q.depuis) + (bc.q.depuis < texte.length ? '…' : ''),
                   secondes: bc.secondes, kind: 'r1', garder: true });
    return;
  }
  // J'ai buzzé à l'instant, la main n'est pas encore attribuée : on garde la saisie ouverte.
  if (bc.phase === PHASE.R1_LECTURE && P.buzzKey === k && !$('#p-saisie').hidden) return;

  vue('buzz');
  $('#pBuzzQ').hidden = false;
  $('#pBuzzIndices').hidden = true;
  $('#pBuzzCat').textContent = [bc.q?.cat, bc.valeur ? pluriel(bc.valeur, 'point') : ''].filter(Boolean).join(' · ');
  if (bc.phase === PHASE.R1_LECTURE) {
    if (nouvelle) typewriter(texte, bc.q.depuis, bc.q.cps);
  } else {
    stopTypo();
    revealQuestion($('#pBuzzQ'), texte, bc.q.depuis);
  }
  const btn = $('#btnBuzz');
  const peut = peutBuzzer(bc, me);
  btn.disabled = !peut || P.buzzKey === k;
  let ligne = '';
  if (!inscrit) ligne = 'Tu es dans le public : tu joueras à la prochaine émission.';
  else if (bc.qualifies.includes(me)) ligne = 'Qualifié ! Tu attends les autres.';
  else if (bc.bloques.includes(me)) ligne = 'Raté pour cette question… prochaine !';
  else if (bc.phase === PHASE.R1_REPONSE) ligne = `${nomDe(bc.main)} a buzzé !`;
  $('#pBuzzLigne').textContent = ligne;
  btn.classList.toggle('is-off', btn.disabled);
  if (nouvelle && bc.phase === PHASE.R1_REPONSE && bc.main !== me && P.buzzKey === `${bc.seq}:${bc.tour}`) {
    toast(`Trop tard, ${nomDe(bc.main)} a été plus rapide !`, 'info');
  }
}

/** Affichage progressif local de la question (même vitesse que l'écran maître). */
function typewriter(texte, depuis, cps) {
  stopTypo();
  const node = $('#pBuzzQ');
  let n = depuis || 0;
  const draw = () => revealQuestion(node, texte, n);
  draw();
  if (!cps || n >= texte.length) return;
  P.typo = setInterval(() => { n += 1; draw(); if (n >= texte.length) stopTypo(); }, 1000 / cps);
}

/* Le buzzer : pointerdown (pas click) pour gagner les ~100 ms du tap. La saisie
   s'ouvre et prend le focus DANS le geste : iOS n'ouvre le clavier qu'à cette condition. */
$('#btnBuzz')?.addEventListener('pointerdown', e => {
  e.preventDefault();
  const bc = P.bc;
  if (!bc || !peutBuzzer(bc, moi())) return;
  const k = `${bc.seq}:${bc.tour}`;
  if (P.buzzKey === k) return;
  P.buzzKey = k;
  sfx.buzz(P.me?.son); vibre(60);
  sendBuzz(P.code, { seq: bc.seq, tour: bc.tour }).catch(() => {
    if (P.buzzKey === k) P.buzzKey = null;
    if (P.bc) render(P.bc);
    toast('Buzz non transmis, réessaie.', 'err');
  });
  stopTypo();
  const faf = bc.phase === PHASE.FAF_INDICES;
  ouvrirSaisie({ titre: 'Buzz ! Tape ta réponse', question: faf ? null : $('#pBuzzQ').textContent,
                 indices: faf ? bc.faf.indices : null, secondes: 0, kind: faf ? 'faf' : 'r1', garder: false });
});

/* ── Saisie commune (R1, R2, FAF) ────────────────────────────────────── */
let saisieKind = null;

function ouvrirSaisie({ titre, question, indices = null, secondes, kind, garder, passer = false }) {
  const dejaOuverte = !$('#p-saisie').hidden && saisieKind === kind;
  vue('saisie');
  saisieKind = kind;
  const oral = P.bc?.reponses === 'oral';
  $('#pSaisieTitre').textContent = oral ? 'À toi ! Réponds à voix haute' : titre;
  $('.p-saisie-row').hidden = oral;
  $('#oralHint').hidden = !oral;
  $('#pSaisieQ').hidden = !question;
  $('#pSaisieQ').textContent = question || '';
  const ul = $('#pSaisieIndices');
  ul.hidden = !indices;
  ul.innerHTML = '';
  (indices || []).forEach(t => ul.append(el('li', {}, t)));
  $('#btnPasser').hidden = !passer || oral;
  $('#pSaisieR2').hidden = kind !== 'r2';
  const input = $('#inputReponse');
  if (!garder || !dejaOuverte) input.value = '';
  input.disabled = false;
  $('#btnValider').disabled = false;
  $('#pSaisieEnvoye').hidden = true;
  if (!oral && document.activeElement !== input) input.focus();
  chrono($('#pSaisieTimer'), secondes);
}

function envoyer(valeur) {
  const bc = P.bc;
  if (!bc) return;
  const v = String(valeur ?? '').trim();
  const k = `${bc.seq}:${bc.tour}`;
  if (P.envoye === k) return;
  if (!v && saisieKind !== 'r2') { $('#inputReponse').focus(); return; }
  P.envoye = k;
  sendInput(P.code, { seq: bc.seq, tour: bc.tour, kind: INPUT.REPONSE, value: v || '__passe__' })
    .catch(() => {
      if (P.envoye === k) P.envoye = null;
      if (P.bc?.seq === bc.seq && P.bc?.tour === bc.tour) {
        $('#inputReponse').disabled = false; $('#btnValider').disabled = false; $('#pSaisieEnvoye').hidden = true;
      }
      toast('Réponse non transmise, renvoie-la.', 'err');
    });
  vibre(25);
  if (saisieKind === 'r2') {
    // Rythme : retour immédiat (correction locale indicative, l'écran maître fait foi).
    $('#inputReponse').value = '';
    const q = P.r2q;
    if (q && v) { const ok = juger(v, q); flashR2(ok); }
    else flashR2(false);
    return;
  }
  $('#inputReponse').disabled = true;
  $('#btnValider').disabled = true;
  $('#pSaisieEnvoye').hidden = false;
  stopTimer();
}

$('#btnValider')?.addEventListener('pointerdown', e => { e.preventDefault(); envoyer($('#inputReponse').value); });
$('#inputReponse')?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); envoyer($('#inputReponse').value); } });
// pointerdown + preventDefault : le champ garde le focus, le clavier reste ouvert.
$('#btnPasser')?.addEventListener('pointerdown', e => { e.preventDefault(); envoyer(''); });

function flashR2(ok) {
  const f = $('#pSaisieFlash');
  f.className = 'saisie-flash ' + (ok ? 'is-ok' : 'is-ko');
  f.innerHTML = iconHtml(ok ? 'circle-check' : 'circle-xmark');
  void f.offsetWidth;
  f.classList.add('go');
}

/* ── Manche 2 ────────────────────────────────────────────────────────── */
function renderR2Choix(bc, nouvelle) {
  const me = moi();
  const r2 = bc.r2 || {};
  if (r2.joueur !== me) {
    stopTimer();
    vue('wait', { icone: 'layer-group', titre: `${nomDe(r2.joueur)} ${r2.theme ? 'joue sur « ' + r2.theme + ' »' : 'choisit son thème'}`,
                  ligne: `Rafale chrono : ${bc.reponses === 'oral' ? 40 : 60} secondes pour enchaîner 4 bonnes réponses.` });
    return;
  }
  if (r2.theme) {
    stopTimer();
    vue('wait', { icone: 'stopwatch', titre: `« ${r2.theme} »`, ligne: 'Prépare-toi… le chrono démarre !' });
    if (nouvelle) vibre([30, 200, 30, 200, 30]);
    return;
  }
  vue('themes');
  const box = $('#pThemes');
  box.innerHTML = '';
  (r2.themes || []).forEach(t => box.append(el('button', { class: 'btn btn-theme', onclick: () => {
    sendInput(P.code, { seq: bc.seq, tour: bc.tour, kind: INPUT.THEME, value: t.id }).catch(() => toast('Choix non transmis.', 'err'));
    $$('#pThemes .btn').forEach(b => { b.disabled = true; });
    sfx.tap(); vibre(30);
  } }, t.titre)));
  chrono($('#pThemesTimer'), bc.secondes);
  if (nouvelle) vibre([40, 40, 40]);
}

function renderR2Jeu(bc, nouvelle, prev) {
  const me = moi();
  const r2 = bc.r2 || {};
  if (r2.joueur !== me) {
    vue('wait', { icone: 'fire', titre: `${nomDe(r2.joueur)} — « ${r2.theme} »`,
                  ligne: `Score : ${r2.best}` });
    return;
  }
  // L'écran renvoie le temps restant à chaque question : le chrono local se recale.
  P.r2q = themeById[r2.tid]?.questions[r2.qn - 1] || null;
  ouvrirSaisie({ titre: `« ${r2.theme} » — question ${r2.qn}`, question: r2.q, secondes: bc.secondes,
                 kind: 'r2', garder: false, passer: true });
  const lamps = $('#pLampes');
  lamps.innerHTML = '';
  lamps.hidden = true;
  $('#pBest').textContent = `Score : ${r2.best}`;
}

/* ── Duel des indices ─────────────────────────────────────────────────────── */
function renderFafMain(bc, nouvelle) {
  const me = moi();
  const f = bc.faf || {};
  if (f.main !== me) {
    stopTimer();
    const finaliste = f.joueurs?.includes(me);
    vue('wait', { icone: 'hand', titre: `Thème : ${f.theme}`,
                  ligne: `${nomDe(f.main)} a la main : il la prend ou il ${finaliste ? 'te la laisse' : 'la laisse'} ?`,
                  prono: bc.prono && !finaliste ? f : null });
    return;
  }
  vue('main');
  $('#pMainTheme').textContent = f.theme;
  $$('#p-main .btn').forEach(b => { b.disabled = false; });
  chrono($('#pMainTimer'), bc.secondes);
  if (nouvelle) vibre([40, 40, 40]);
}
$$('#p-main [data-main]').forEach(b => b.addEventListener('click', () => {
  const bc = P.bc;
  if (!bc) return;
  sendInput(P.code, { seq: bc.seq, tour: bc.tour, kind: INPUT.MAIN, value: b.dataset.main }).catch(() => toast('Choix non transmis.', 'err'));
  $$('#p-main .btn').forEach(x => { x.disabled = true; });
  sfx.tap(); vibre(30);
}));

function renderFafIndices(bc, nouvelle) {
  const me = moi();
  const f = bc.faf || {};
  const k = `${bc.seq}:${bc.tour}`;
  if (f.joueur === me && P.buzzKey === k && !$('#p-saisie').hidden) {
    // Buzz envoyé, indices qui continuent d'arriver : on met juste la liste à jour.
    const ul = $('#pSaisieIndices'); ul.innerHTML = '';
    (f.indices || []).forEach(t => ul.append(el('li', {}, t)));
    return;
  }
  if (f.joueur !== me) {
    stopTimer();
    vue('wait', { icone: 'lightbulb', titre: `${nomDe(f.joueur)} joue (${pluriel(f.valeur, 'point')})`,
                  ligne: (f.indices || []).map((t, i) => `${i + 1}. ${t}`).join('\n') });
    return;
  }
  vue('buzz');
  $('#pBuzzQ').hidden = true;
  $('#pBuzzCat').textContent = `${f.theme} · ${pluriel(f.valeur, 'point')}`;
  const ul = $('#pBuzzIndices');
  ul.hidden = false; ul.innerHTML = '';
  (f.indices || []).forEach((t, i) => ul.append(el('li', { class: i === f.indices.length - 1 ? 'is-new' : '' }, t)));
  const btn = $('#btnBuzz');
  btn.disabled = P.buzzKey === k;
  btn.classList.toggle('is-off', btn.disabled);
  $('#pBuzzLigne').textContent = 'Buzze dès que tu as trouvé !';
  if (nouvelle) vibre(20);
}

function renderFafReponse(bc, nouvelle) {
  const me = moi();
  const f = bc.faf || {};
  if (f.repondant !== me) {
    stopTimer();
    vue('wait', { icone: 'keyboard', titre: `${nomDe(f.repondant)} ${f.rebond ? 'tente le rebond' : 'répond'}…`,
                  ligne: f.rebond ? '' : `Pour ${pluriel(f.valeur, 'point')}.` });
    return;
  }
  ouvrirSaisie({ titre: f.rebond ? 'Rebond ! À toi de répondre' : 'À toi ! Tape ta réponse', indices: f.indices,
                 secondes: bc.secondes, kind: 'faf', garder: !f.rebond });
  if (nouvelle && f.rebond) { vibre([60, 40, 60]); toast('Rebond : ton adversaire s\'est trompé !', 'info'); }
}

/* ── Résultat d'une question ─────────────────────────────────────────── */
function renderResultat(rep, gain, bc) {
  vue('result');
  const me = moi();
  $('#pResIcon').innerHTML = iconHtml(gain ? 'circle-check' : rep?.uid ? 'user' : 'circle-xmark');
  $('#pResIcon').className = 'res-icon ' + (gain ? 'is-ok' : rep?.uid ? '' : 'is-ko');
  $('#pResTitre').textContent = gain ? `Bravo ! ${gain}` : rep?.uid ? `${nomDe(rep.uid)} a trouvé` : 'Personne n\'a trouvé';
  $('#pResReponse').textContent = rep?.r || '';
  const sc = bc.manche === 'r1' ? (bc.scores?.[me] ?? null) : (bc.faf?.scores?.[me] ?? null);
  $('#pResLigne').textContent = sc === null ? '' : bc.manche === 'r1'
    ? `Ton score : ${pluriel(sc, 'point')} sur ${RULES.POINTS_R1}` : `Ton score : ${sc} / ${RULES.POINTS_FAF}`;
}

/* ── Pronostic du public ─────────────────────────────────────────────── */
function renderProno(faf) {
  const box = $('#pProno');
  const me = moi();
  if (!faf || !faf.joueurs || faf.joueurs.includes(me)) { box.hidden = true; return; }
  box.hidden = false;
  const choisi = ls.get('bq.prono.' + P.code + '.' + P.bc?.emission);
  const list = $('#pPronoList');
  list.innerHTML = '';
  faf.joueurs.forEach(u => list.append(el('button', { class: 'btn btn-prono' + (choisi === u ? ' is-on' : ''), onclick: () => {
    sendInput(P.code, { seq: P.bc.seq, tour: 0, kind: INPUT.PRONO, value: u }).catch(() => toast('Pronostic non transmis.', 'err'));
    ls.set('bq.prono.' + P.code + '.' + P.bc?.emission, u);
    sfx.tap(); vibre(30);
    renderProno(faf);
  } }, nomDe(u))));
  $('#pPronoLigne').textContent = choisi ? `Ton prono : ${nomDe(choisi)}. Tu peux changer tant que le duel des indices n'a pas commencé.`
    : 'Qui va gagner le duel des indices ? Un bon prono = +1 étoile.';
}

$('#pWaitTest')?.addEventListener('pointerdown', e => { e.preventDefault(); sfx.buzz(P.me?.son); vibre(60); });
