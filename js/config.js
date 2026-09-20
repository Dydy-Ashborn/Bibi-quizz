/* Bibi Quizz — configuration.
 *
 * Clés Firebase : publiques par nature (SDK web), la sécurité réelle est dans
 * firestore.rules. Tant que `projectId` est vide, l'app affiche un message
 * explicite au démarrage au lieu de planter dans le SDK.
 */
export const firebaseConfig = {
  apiKey: "AIzaSyAkhXfU2V-Q6uXB2UshO02Og1zQqeVAtns",
  authDomain: "bibi-quizz.firebaseapp.com",
  projectId: "bibi-quizz",
  storageBucket: "bibi-quizz.firebasestorage.app",
  messagingSenderId: "841093359937",
  appId: "1:841093359937:web:1f33f56b56591b75d319c0"
};

/* Réglages de jeu — seul endroit où vivent les constantes de rythme et de barème. */
export const RULES = {
  /* ── Manche 1 : Neuf points gagnants ── */
  POINTS_R1: 9,              // score de qualification
  QUALIFIES_R1: 3,           // qualifiés à partir de 4 joueurs
  LECTURE_CPS: 17,           // vitesse d'affichage de la question (caractères / s)
  SECONDES_APRES_LECTURE: 6, // fenêtre de buzz une fois la question entièrement affichée
  SECONDES_REPONSE: 12,      // temps pour taper sa réponse après un buzz
  FENETRE_BUZZ_MS: 350,      // on attend ce délai après le 1er buzz reçu pour départager les quasi-simultanés
  MAX_QUESTIONS_R1: 55,      // garde-fou : au-delà, qualification au score

  /* ── Manche 2 : 4 à la suite ── */
  SERIE_R2: 4,
  SECONDES_R2: 60,           // 40 s à la télé, où l'on répond à l'oral ; ici on tape au téléphone
  SECONDES_CHOIX_THEME: 25,
  THEMES_PROPOSES: 4,

  /* ── Manche 3 : Face-à-face ── */
  POINTS_FAF: 12,
  FAF_POINTS_MAX: 4,         // 4 points au 1er indice, puis 3, 2, 1
  SECONDES_PAR_INDICE: 6,
  SECONDES_APRES_INDICES: 7,
  SECONDES_MAIN: 12,         // temps pour « prendre » ou « laisser » la main
  MAX_QUESTIONS_FAF: 22,     // garde-fou : au-delà, le mieux placé l'emporte

  /* ── Soirée ── */
  ETOILES: { QUALIFIE: 1, FINALISTE: 1, CHAMPION: 2, PRONO: 1 },
  PAUSE_REVELATION_MS: 3800, // enchaînement automatique après une révélation
  MIN_JOUEURS: 2,
  MAX_JOUEURS: 8
};

/** Couleurs des pupitres, attribuées dans l'ordre d'arrivée. */
export const COULEURS = ['#ffb020', '#3fb6ff', '#ff5f7e', '#57e38a', '#c38bff', '#ff8a3d', '#40e0d0', '#f5e663'];

/** Sons de buzzer au choix du joueur (synthétisés dans util.js). */
export const BUZZERS = [
  { id: 'classique', label: 'Classique' },
  { id: 'laser', label: 'Laser' },
  { id: 'klaxon', label: 'Klaxon' },
  { id: 'arcade', label: 'Arcade' },
  { id: 'cloche', label: 'Cloche' },
  { id: 'boing', label: 'Boing' }
];
