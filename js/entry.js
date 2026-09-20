import { BUZZ, CATEGORIES, THEMES, FAF } from './data/questions.js';
import { DISCOVERY } from './discovery.js';
import { shuffle, juger } from './game.js';

const $ = s => document.querySelector(s);
const count = BUZZ.length + THEMES.reduce((n,t) => n + t.questions.length, 0) + FAF.length;
$('#homeStats').textContent = `${count.toLocaleString('fr-FR')} questions · ${THEMES.length} thèmes de Rafale chrono · ${FAF.length} énigmes de duel des indices`;
$('#categoryCount').textContent = `${Object.keys(CATEGORIES).length} catégories`;
const featured = ['rap','manga','jv','series','food','kpop','web','sciences','mytho','ecologie','animation','voyage'];
featured.filter(c => CATEGORIES[c]).forEach(c => {
  const chip = document.createElement('span');
  chip.textContent = CATEGORIES[c].l;
  $('#categoryChips').append(chip);
});
let connected = false;
let demo = null;
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('is-active', s.id === id));
  window.scrollTo(0,0);
}
function offline() {
  $('#connectionNotice').hidden = false;
  if (location.hash !== '#/demo') show('screen-home');
}
window.addEventListener('bq-offline', offline);
window.addEventListener('bq-online', () => { connected = true; $('#connectionNotice').hidden = true; });
// L'accueil et l'échauffement restent utilisables même si le SDK distant ne se charge pas.
document.addEventListener('click', e => {
  const action = e.target.closest('#btnGoCreate,#btnGoJoin,[data-goto]');
  if (action && !connected) { e.preventDefault(); e.stopImmediatePropagation(); offline(); }
}, true);
$('#btnDemo').onclick = () => { location.hash = '#/demo'; };
function routeLocal() {
  if (location.hash === '#/demo') {
    demo = { questions: shuffle(DISCOVERY.buzz.filter(q => q.d < 3)).slice(0,10), index: 0, score: 0, answered: false };
    show('screen-demo'); draw();
  } else if (!connected) show('screen-home');
}
window.addEventListener('hashchange', routeLocal);
function draw() {
  const q = demo.questions[demo.index];
  demo.answered = false;
  $('#demoProgress').textContent = `${demo.index + 1} / 10`;
  $('#demoCategory').textContent = CATEGORIES[q.c].l;
  $('#demoQuestion').textContent = q.q;
  $('#demoAnswer').value = '';
  $('#demoForm').hidden = false;
  $('#demoFeedback').hidden = true;
  $('#demoNext').hidden = true;
  $('#demoNext').textContent = demo.index === 9 ? 'Voir mon résultat →' : 'Question suivante →';
  $('#demoScore').textContent = `${demo.score} bonne${demo.score > 1 ? 's' : ''} réponse${demo.score > 1 ? 's' : ''}`;
  $('#demoAnswer').focus({ preventScroll: true });
}
function answer(value) {
  if (!demo || demo.answered) return;
  demo.answered = true;
  const q = demo.questions[demo.index], ok = juger(value,q);
  if (ok) demo.score++;
  $('#demoForm').hidden = true;
  $('#demoFeedback').hidden = false;
  $('#demoFeedback').className = 'demo-feedback ' + (ok ? 'is-correct' : 'is-incorrect');
  $('#demoFeedback').textContent = `${ok ? 'Bien joué !' : 'La réponse était…'} ${q.r}`;
  $('#demoNext').hidden = false;
  $('#demoNext').focus({ preventScroll: true });
}
$('#demoForm').onsubmit = e => { e.preventDefault(); if ($('#demoAnswer').value.trim()) answer($('#demoAnswer').value); };
$('#demoSkip').onclick = () => answer('');
$('#demoNext').onclick = () => {
  if (demo.index >= 10) { routeLocal(); return; }
  demo.index++;
  if (demo.index < 10) { draw(); return; }
  $('#demoCategory').textContent = 'ÉCHAUFFEMENT TERMINÉ';
  $('#demoQuestion').textContent = demo.score >= 7 ? 'Le plateau t’attend.' : 'Prêt pour la revanche ?';
  $('#demoFeedback').textContent = `${demo.score} / 10 bonnes réponses`;
  $('#demoFeedback').className = 'demo-feedback';
  $('#demoNext').textContent = 'Rejouer 10 questions →';
  $('#demoScore').textContent = 'À plusieurs, chacun rejoint avec son téléphone depuis l’accueil.';
};
routeLocal();
import('./app.js').catch(error => { console.error('[Bibi Quizz] Chargement multijoueur', error); offline(); });
setTimeout(() => { if (!connected) offline(); }, 10000);
