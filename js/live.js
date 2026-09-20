/* Bibi Quizz — contrat de diffusion entre l'écran maître et les téléphones.
 *
 * L'hôte publie un « broadcast » dans games/{code}.bc à chaque changement d'état.
 * Champ séparé de `etat` (l'état de reprise), qui est réécrit en bloc à chaque
 * sauvegarde et emporterait la diffusion avec lui (piège vécu sur Bibi Love).
 *
 * Les téléphones l'écoutent et se rendent seuls. Ils répondent par deux canaux :
 *   games/{code}/buzz/{uid}    { seq, tour, at: serverTimestamp }   — le buzzer
 *   games/{code}/inputs/{uid}  { seq, tour, kind, value, at }       — réponse tapée,
 *                              choix de thème, prendre/laisser la main, pronostic
 * `seq` change à chaque nouvelle question, `tour` à chaque reprise de lecture après
 * une erreur : un buzz ou une réponse périmés sont ignorés par l'hôte.
 *
 * Aucune réponse attendue n'est diffusée avant la révélation (`reponse` n'est
 * rempli qu'aux phases *-reveal).
 */

export const PHASE = {
  ATTENTE:     'attente',      // salon
  CARTON:      'carton',       // annonce plein écran (manche, qualifiés, champion…)
  R1_LECTURE:  'r1-lecture',   // question qui s'affiche, buzzer ouvert
  R1_REPONSE:  'r1-reponse',   // un joueur a la main et tape sa réponse
  R1_REVEAL:   'r1-reveal',
  R2_CHOIX:    'r2-choix',     // le joueur choisit son thème
  R2_JEU:      'r2-jeu',       // 60 s de questions à la suite
  R2_FIN:      'r2-fin',       // bilan du tour
  FAF_MAIN:    'faf-main',     // prendre ou laisser la main
  FAF_INDICES: 'faf-indices',  // les indices tombent, le joueur en jeu peut buzzer
  FAF_REPONSE: 'faf-reponse',  // réponse tapée (ou rebond de l'adversaire)
  FAF_REVEAL:  'faf-reveal',
  FIN_EMISSION:'fin-emission', // champion de l'émission
  FINI:        'fini'          // podium de la soirée
};

export const INPUT = { REPONSE: 'reponse', THEME: 'theme', MAIN: 'main', PRONO: 'prono' };

/** Remplace récursivement `undefined` par `null` : Firestore refuse `undefined`. */
function propre(v) {
  return JSON.parse(JSON.stringify(v, (k, x) => (x === undefined ? null : x)));
}

/** Construit un broadcast complet (valeurs par défaut + champs de la phase). */
export function broadcast(fields) {
  return propre({
    seq: 0, tour: 0, phase: PHASE.ATTENTE,
    emission: 1, nbEmissions: 1, manche: null,
    inscrits: [], qualifies: [], elimines: [], scores: {},
    secondes: 0, prono: false,
    carton: null, q: null, main: null, bloques: [], valeur: 0,
    reponse: null, r2: null, faf: null, fin: null,
    ...fields,
    at: Date.now()
  });
}

/** Ce téléphone peut-il buzzer maintenant ? */
export function peutBuzzer(bc, moi) {
  if (!bc) return false;
  if (bc.phase === PHASE.R1_LECTURE) {
    return bc.inscrits.includes(moi) && !bc.qualifies.includes(moi)
      && !bc.elimines.includes(moi) && !bc.bloques.includes(moi);
  }
  if (bc.phase === PHASE.FAF_INDICES) return !!bc.faf && bc.faf.joueur === moi;
  return false;
}
