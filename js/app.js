import { LEGAL_VERSION } from './legal-config.js';
/* Bibi Quizz — routeur et amorçage (repris d'Attention à l'escalier). */
import { $, iconHtml, showScreen, toast, sfx, toggleMute, isMuted, copy, burst } from './util.js';
import { ready, uid, configure } from './firebase.js';
import { enterCreate, enterLobby, renderHistory, leaveHost } from './host.js';
import { enterJoin, leavePlayer } from './player.js';
import { refreshPremium, isPremium, diagPremium, resume as planResume,
         PRIX, LIEN_PAIEMENT, urlPaiement, attendrePaiement } from './plan.js';
import { BUZZ, THEMES, FAF, CATEGORIES } from './data/questions.js';

/* ── Routes ───────────────────────────────────────────────────────
   #/            accueil
   #/create      création de partie
   #/host/CODE   salon puis plateau (maître du jeu)
   #/j/CODE      manette joueur
   #/compte      statut d'achat + identifiant
   ───────────────────────────────────────────────────────────────── */
const nettoie = s => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

async function route() {
  const hash = location.hash || '#/';
  if (hash === '#/demo') return;
  leaveHost(); leavePlayer();
  if (hash.startsWith('#/j/'))    { await enterJoin(nettoie(hash.slice(4))); return; }
  if (hash.startsWith('#/host/')) { await enterLobby(nettoie(hash.slice(7))); return; }
  if (hash === '#/create') { enterCreate(); return; }
  if (hash === '#/compte') { enterCompte(); return; }
  renderHistory();
  showScreen('screen-home');
}
window.addEventListener('hashchange', route);

document.addEventListener('click', e => {
  const t = e.target.closest('[data-goto]');
  if (t) { location.hash = t.dataset.goto; sfx.tap(); }
});

$('#btnGoCreate')?.addEventListener('click', () => { location.hash = '#/create'; sfx.tap(); });
$('#btnGoJoin')?.addEventListener('click', () => {
  const code = nettoie($('#inputJoinCode').value.trim());
  if (code.length < 5) { toast("Il faut le code à 5 caractères affiché sur l'écran.", 'err'); return; }
  location.hash = '#/j/' + code;
});
$('#inputJoinCode')?.addEventListener('keydown', e => { if (e.key === 'Enter') $('#btnGoJoin').click(); });

/* Chiffres de la banque affichés sur l'accueil (jamais en dur dans le HTML). */
const nbQ = BUZZ.length + THEMES.reduce((n, t) => n + t.questions.length, 0) + FAF.length;
$('#homeStats').textContent = `${nbQ} questions · ${Object.keys(CATEGORIES).length} catégories · ${THEMES.length} thèmes de Rafale chrono · ${FAF.length} énigmes de duel des indices`;

/* ── Mon compte : seul écran qui expose l'uid (déblocage manuel, support) ── */
function enterCompte() {
  const r = planResume();
  $('#comptePlan').textContent = r.titre;
  $('#compteDetail').textContent = isPremium()
    ? r.ligne + ' Tes joueurs en profitent sans rien acheter.'
    : r.ligne + ` Version complète : ${PRIX}, une seule fois.`;
  $('#compteUid').textContent = uid() || '…';
  const d = diagPremium();
  const box = $('#compteDiag');
  box.hidden = isPremium() || d.etat === 'jamais';
  box.className = 'diag ' + (d.etat === 'refus' ? 'is-err' : 'is-warn');
  box.textContent = d.message;
  showScreen('screen-compte');
}

$('#btnCompteRefresh')?.addEventListener('click', async () => {
  const btn = $('#btnCompteRefresh');
  btn.disabled = true;
  const ok = await refreshPremium();
  btn.disabled = false;
  toast(ok ? 'Version complète active.' : 'Toujours en version gratuite.', ok ? 'ok' : 'err');
  enterCompte();
});
$('#btnCompteCopy')?.addEventListener('click', async () => {
  const ok = await copy(uid() || '');
  toast(ok ? 'Identifiant copié.' : (uid() || ''), ok ? 'ok' : 'info');
});
$('#btnCompteBuy')?.addEventListener('click', () => {
  $('#paywallWhy').textContent = '';
  $('#paywallPrice').textContent = PRIX;
  $('#paywall').classList.add('is-open');
});

/* ── Paywall : achat et restauration ─────────────────────────────────────── */
if (!LIEN_PAIEMENT && $('#paywallBuy')) {
  $('#paywallBuy').disabled = true;
  $('#paywallBuy').textContent = 'Bientôt disponible';
}
$('#paywallBuy')?.addEventListener('click', () => {
  if (!$('#legalConsent').checked) { toast('Accepte les CGV et CGU avant de continuer.', 'info'); $('#legalConsent').focus(); return; }
  const url = urlPaiement();
  if (!url) { toast("Le paiement n'est pas encore ouvert. Reviens bientôt !", 'err'); return; }
  // Marque le départ vers Stripe : au retour on attend le webhook au lieu
  // d'annoncer froidement « version gratuite » à quelqu'un qui vient de payer.
  try { sessionStorage.setItem('bq.achat', '1'); sessionStorage.setItem('bq.conditions', JSON.stringify({ version: LEGAL_VERSION, acceptedAt: new Date().toISOString() })); } catch {}
  location.href = url;
});

async function verifierRetourPaiement() {
  let attendu = false;
  try { attendu = sessionStorage.getItem('bq.achat') === '1'; } catch {}
  const retour = location.hash.includes('paiement=ok');
  if (!attendu && !retour) return;
  try { sessionStorage.removeItem('bq.achat'); } catch {}
  if (isPremium()) return;
  toast('Validation de ton achat…', 'info');
  const ok = await attendrePaiement();
  if (ok) {
    $('#paywall')?.classList.remove('is-open');
    toast('Version complète débloquée. Merci !', 'ok');
    burst(90);
    if (retour) location.hash = '#/'; else route();
  } else {
    toast("Paiement pas encore confirmé. Touche « Vérifier mon statut » dans Mon compte d'ici une minute.", 'err');
  }
}

$('#paywallRestore')?.addEventListener('click', async () => {
  const ok = await refreshPremium();
  toast(ok ? 'Version complète débloquée.' : 'Aucun achat trouvé sur cet appareil.', ok ? 'ok' : 'err');
  if (ok) { $('#paywall').classList.remove('is-open'); route(); }
});

/* ── Son : chaque bascule est confirmée ── */
const muteBtn = $('#btnMute');
function majMute(actif) {
  muteBtn.innerHTML = iconHtml(actif ? 'volume-high' : 'volume-xmark');
  muteBtn.classList.toggle('is-muted', !actif);
  muteBtn.title = actif ? 'Couper le son' : 'Réactiver le son';
  muteBtn.setAttribute('aria-label', muteBtn.title);
  muteBtn.setAttribute('aria-pressed', String(!actif));
}
majMute(!isMuted());
muteBtn.addEventListener('click', () => {
  const actif = toggleMute();
  majMute(actif);
  toast(actif ? 'Son réactivé' : 'Son coupé', actif ? 'ok' : 'info');
  if (actif) sfx.good();
});

/* ── Boot ─────────────────────────────────────────────────────────── */
(async function boot() {
  const t0 = Date.now();
  if (!configure) {
    document.querySelector('.loader-text').textContent =
      'Projet Firebase non configuré : renseigne firebaseConfig dans js/config.js.';
    return;
  }
  try {
    await Promise.race([ready(), new Promise((_, rej) => setTimeout(rej, 9000))]);
  } catch {
    window.dispatchEvent(new Event('bq-offline'));
    return;
  }
  await refreshPremium();
  window.dispatchEvent(new Event('bq-online'));
  verifierRetourPaiement();
  const wait = Math.max(0, 1100 - (Date.now() - t0));
  setTimeout(route, wait);
})();
