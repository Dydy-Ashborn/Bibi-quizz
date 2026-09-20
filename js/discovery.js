import { BUZZ, THEMES, FAF, ereDe } from './data/questions.js';

// Un pack fixe : relancer une découverte ne débloque pas de nouvelles questions.
function balanced(list, count, era) {
  const classic = list.filter(x => era(x) === 'classique');
  const modern = list.filter(x => era(x) === 'moderne');
  const result = [];
  for (let i = 0; result.length < count && (i < classic.length || i < modern.length); i++) {
    if (modern[i]) result.push(modern[i]);
    if (classic[i] && result.length < count) result.push(classic[i]);
  }
  return result;
}
// Panacher les catégories avant de sélectionner les 60 questions buzzer.
const categories = [...new Set(BUZZ.map(q => q.c))];
const byCategory = categories.map(c => BUZZ.filter(q => q.c === c));
const varied = [];
for (let i = 0; byCategory.some(qs => qs[i]); i++) {
  for (const qs of byCategory) if (qs[i]) varied.push(qs[i]);
}
export const DISCOVERY = Object.freeze({
  buzz: balanced(varied, 60, ereDe),
  themes: balanced(THEMES, 4, t => t.ere),
  faf: balanced(FAF, 24, q => q.ere)
});
