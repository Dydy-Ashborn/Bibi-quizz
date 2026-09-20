/* Bibi Quizz — helpers DOM, modale maison, sons synthétisés, particules.
 * Repris d'Attention à l'escalier (mêmes garde-fous) ; aucune alerte native :
 * toute confirmation passe par showConfirmModal(). */

export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== null && v !== undefined && v !== false) node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

/** Icône Font Awesome (sous-ensemble vendorisé : seules les icônes de fa.css existent). */
export function icon(name, extra = '') {
  const i = document.createElement('i');
  i.className = 'fa fa-' + name + (extra ? ' ' + extra : '');
  i.setAttribute('aria-hidden', 'true');
  return i;
}
export function iconHtml(name, extra = '') {
  return `<i class="fa fa-${name}${extra ? ' ' + extra : ''}" aria-hidden="true"></i>`;
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

export function showScreen(id) {
  $$('.screen').forEach(s => s.classList.toggle('is-active', s.id === id));
  window.scrollTo(0, 0);
}

/* ── Modale de confirmation maison (jamais confirm()) ───────────────────── */
export function showConfirmModal(message, onConfirm, opts = {}) {
  const modal = $('#confirmModal');
  $('#confirmModalText').textContent = message;
  const ok = $('#confirmModalOk');
  const no = $('#confirmModalCancel');
  ok.textContent = opts.okLabel || 'Confirmer';
  no.textContent = opts.cancelLabel || 'Annuler';
  ok.className = 'btn ' + (opts.danger ? 'btn-danger' : 'btn-gold');

  // Écouteurs détruits à la fermeture (cloneNode) : sans ça, le second usage de la
  // modale déclenche deux callbacks (piège hérité de Bibi Love).
  const close = () => {
    modal.classList.remove('is-open');
    ok.replaceWith(ok.cloneNode(true));
    no.replaceWith(no.cloneNode(true));
    modal.removeEventListener('click', backdrop);
  };
  const backdrop = e => { if (e.target === modal) close(); };

  ok.addEventListener('click', () => { close(); onConfirm && onConfirm(); });
  no.addEventListener('click', close);
  modal.addEventListener('click', backdrop);
  modal.classList.add('is-open');
}

/* ── Toast ─────────────────────────────────────────────────────────────── */
let toastTimer = null;
export function toast(msg, kind = 'info') {
  const t = $('#toast');
  t.textContent = msg;
  t.dataset.kind = kind;
  t.classList.add('is-open');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.classList.remove('is-open');
    setTimeout(() => { if (!t.classList.contains('is-open')) t.textContent = ''; }, 350);
  }, 2800);
}

/* ── Stockage local protégé (navigation privée, données bloquées) ───────── */
export const ls = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} }
};

/* ── Vibration (téléphones Android ; ignorée ailleurs) ──────────────────── */
export function vibre(motif = 30) {
  try { if (navigator.vibrate) navigator.vibrate(motif); } catch {}
}

/* ── Sons synthétisés (aucun fichier audio à héberger) ──────────────────── */
let actx = null;
const audioOn = () => ls.get('bq.mute') !== '1';
export function toggleMute() {
  const muted = ls.get('bq.mute') === '1';
  ls.set('bq.mute', muted ? '0' : '1');
  return !muted;
}
export function isMuted() { return ls.get('bq.mute') === '1'; }

/* Les navigateurs créent l'AudioContext `suspended` tant que l'utilisateur n'a pas
   interagi : on le réveille au premier geste réel. */
function ctx() {
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  return actx;
}
let audioPret = false;
function reveillerAudio() {
  const c = ctx();
  if (c.state === 'suspended') c.resume().then(() => { audioPret = true; }).catch(() => {});
  else audioPret = true;
}
// Garde `typeof window` : le module est importé hors navigateur par les scripts de contrôle.
if (typeof window !== 'undefined') {
  ['pointerdown', 'touchstart', 'keydown'].forEach(evt =>
    window.addEventListener(evt, reveillerAudio, { capture: true, passive: true }));
}

function blip(freq, start, dur, type = 'sine', gain = 0.18, slideTo = null) {
  const c = ctx();
  if (c.state !== 'running') { reveillerAudio(); if (!audioPret) return; }
  const o = c.createOscillator();
  const g = c.createGain();
  const t0 = c.currentTime + start;
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

/** Les six sons de buzzer au choix (config.BUZZERS). */
const BUZZ_SONS = {
  classique() { blip(880, 0, .12, 'square', .14); blip(660, .1, .35, 'square', .14); },
  laser()     { blip(1800, 0, .35, 'sawtooth', .11, 180); },
  klaxon()    { blip(420, 0, .18, 'sawtooth', .14); blip(420, .22, .3, 'sawtooth', .14); },
  arcade()    { [523, 659, 784, 1047].forEach((f, i) => blip(f, i * .05, .09, 'square', .1)); },
  cloche()    { blip(1320, 0, .9, 'sine', .2); blip(1980, 0, .6, 'sine', .08); },
  boing()     { blip(160, 0, .45, 'triangle', .22, 640); }
};

export const sfx = {
  tap()    { if (audioOn()) blip(660, 0, 0.07, 'triangle', 0.09); },
  buzz(son = 'classique') { if (audioOn()) (BUZZ_SONS[son] || BUZZ_SONS.classique)(); },
  /** Bonne réponse : le « ding-ding » du plateau. */
  good()   { if (!audioOn()) return; blip(1046, 0, .25, 'sine', .22); blip(1318, .14, .45, 'sine', .22); },
  bad()    { if (!audioOn()) return; blip(180, 0, .5, 'sawtooth', .13); blip(120, 0, .5, 'square', .06); },
  tick()   { if (audioOn()) blip(1200, 0, .03, 'square', .05); },
  lampe(n = 1) { if (audioOn()) blip(440 * Math.pow(1.26, n), 0, .18, 'triangle', .18); },
  /** Indice suivant au face-à-face. */
  indice() { if (!audioOn()) return; blip(740, 0, .12, 'sine', .14); blip(988, .08, .18, 'sine', .12); },
  qualif() { if (!audioOn()) return; [523, 659, 784, 1047, 1319].forEach((f, i) => blip(f, i * .08, .3, 'triangle', .17)); },
  /** Générique d'ouverture d'une manche. */
  jingle() { if (!audioOn()) return; [392, 523, 659, 784, 659, 784, 1047].forEach((f, i) => blip(f, i * .11, .32, 'triangle', .17)); },
  win()    { if (!audioOn()) return; [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => blip(f, i * .13, .5, 'triangle', .2)); }
};

/* ── Particules ────────────────────────────────────────────────────────── */
export function burst(count = 90, colors = ['#ffb020', '#ffe066', '#ffffff', '#3fb6ff', '#ff7a1a']) {
  const layer = $('#fxLayer');
  if (!layer) return;
  for (let n = 0; n < count; n++) {
    const p = document.createElement('span');
    p.className = 'fx-confetti';
    p.style.background = colors[n % colors.length];
    p.style.left = Math.random() * 100 + 'vw';
    p.style.animationDelay = (Math.random() * 0.6).toFixed(2) + 's';
    p.style.animationDuration = (1.8 + Math.random() * 1.6).toFixed(2) + 's';
    p.style.setProperty('--drift', (Math.random() * 200 - 100).toFixed(0) + 'px');
    p.style.setProperty('--spin', (Math.random() * 720 - 360).toFixed(0) + 'deg');
    layer.append(p);
    setTimeout(() => p.remove(), 3600);
  }
}

export function shake(node) {
  if (!node) return;
  node.classList.remove('shake'); void node.offsetWidth; node.classList.add('shake');
}

/* ── Divers ────────────────────────────────────────────────────────────── */
export function makeCode(len = 5) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans I, O, 0, 1
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch { return false; }
}

export function initiale(name) {
  return (name || '?').trim().slice(0, 1).toUpperCase();
}

/** « A », « A et B », « A, B et C ». */
export function listeNoms(noms) {
  return noms.length <= 1 ? noms.join('') : noms.slice(0, -1).join(', ') + ' et ' + noms[noms.length - 1];
}

export const pluriel = (n, mot, pl = mot + 's') => `${n} ${n > 1 ? pl : mot}`;
