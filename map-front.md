# map-front — interface et déroulé

## Principe
Un **écran maître** (`#/host/CODE`) arbitre tout : il reçoit buzz et réponses, juge,
compte et diffuse. Chaque **téléphone** (`#/j/CODE`) est un buzzer + un clavier ; il ne
décide rien. Le maître du jeu ne joue pas depuis l'écran : s'il veut jouer, il rejoint
aussi avec son téléphone.

## Soirée (js/host.js)
- Formats (`FORMATS` dans game.js) : émission (1), soirée (2), marathon (3 émissions).
- `startEmission(n)` : les candidats inscrits sont figés au début de chaque émission
  (les retardataires sont « public » et entrent à l'émission suivante), plafonnés à
  `maxJoueurs` du doc de partie.
- Fin d'émission (`fafFin` → `finEmission`) : +1 victoire, étoiles (qualifié 1,
  finaliste 1, champion 2, bon prono 1). Dernière émission : `grandeFinale()` décide
  s'il faut un face-à-face entre les deux premiers (égalité de victoires), sinon podium.
- `terminer()` : podium + trophées (`trophees()` : plus de bonnes réponses, buzz le plus
  rapide, meilleure série, spécialiste d'une catégorie).
- État de reprise `games/{code}.etat` sauvegardé après chaque révélation (`persist`) ;
  un rafraîchissement de l'écran reprend au début de l'étape en cours (`enterLive(true)`).

## Manche 1 — Neuf points gagnants
- `r1Next` tire la question, `r1Lecture` l'affiche au fil de l'eau (`LECTURE_CPS`),
  puis laisse `SECONDES_APRES_LECTURE` pour buzzer.
- `onBuzz` : au premier buzz valide (bon `seq` ET bon `tour`, joueur éligible), fenêtre
  de `FENETRE_BUZZ_MS` puis main au plus petit **horodatage serveur** — jamais l'horloge
  des téléphones.
- `r1Main` → 12 s pour taper. `r1Juge` : bonne réponse → `r1Bonne` (1/2/3 pts selon le
  nombre de candidats en lice) ; erreur → joueur bloqué pour la question, `tour`+1, la
  lecture reprend. Phase transitoire `r1-pause` : aucune réponse acceptée pendant la
  relance (sinon un double envoi était jugé deux fois).
- `r1Close` : 3 qualifiés à partir de 4 joueurs ; à 2-3 joueurs personne n'est éliminé
  (sinon plus de 4 à la suite). Bouton « Clore la manche » = qualification au score.
- `renderTentatives` + « Accorder » : le maître du jeu rattrape une réponse juste refusée
  par la correction automatique (R1 et face-à-face).

## Manche 2 — 4 à la suite
- `r2Tour` : le candidat choisit parmi les thèmes restants (4 proposés, retirés au fur
  et à mesure) sur son téléphone, ou le maître du jeu clique. `r2Start` : 60 s.
- `r2Juge` : série +1 ou remise à zéro, meilleure série retenue, arrêt à 4. Le téléphone
  affiche un ✓/✗ immédiat par correction locale (indicative) ; l'écran fait foi.
- `r2Close` : `r2Classement` (meilleure série, puis temps pour l'atteindre) → 2 finalistes.

## Manche 3 — Face-à-face
- `fafNext` : thème annoncé, celui qui a la main **prend ou laisse** (`faf-main`).
- `fafIndice` : un indice toutes les `SECONDES_PAR_INDICE`, valeur 4/3/2/1. Seul le
  candidat qui joue peut buzzer. Erreur → **rebond** : l'adversaire tente pour les mêmes
  points. La main change de camp à chaque énigme. Premier à 12.
- Pronostic du public (éliminés) ouvert jusqu'à la première énigme.

## Manette (js/player.js)
- Buzzer sur `pointerdown` (pas `click`) et saisie ouverte + focus **dans le geste** :
  iOS n'ouvre le clavier qu'à cette condition. Si un autre a eu la main : toast « Trop tard ».
- `render()` ne redessine que sur un NOUVEAU broadcast (`bc.at`) : le doc de partie change
  aussi à chaque `persist()` de l'hôte et effaçait la saisie en cours.
- « Je passe » et « Valider » en `pointerdown` + `preventDefault` : le champ garde le
  focus, le clavier reste ouvert pendant tout le 4 à la suite.
- Son de buzzer au choix (6 sons synthétisés, `BUZZERS`), vibrations Android.

## Contrat de diffusion (js/live.js)
`games/{code}.bc` : `{ seq, tour, phase, emission, manche, inscrits, qualifies, elimines,
scores, secondes, prono, carton, q, main, bloques, valeur, reponse, r2, faf, fin, at }`.
`seq` change à chaque question, `tour` à chaque relance après erreur. La réponse attendue
n'est jamais diffusée avant la phase *-reveal.

## DA
Bleu profond dégradé + lettrage script orange-or (Exo 2 italique / Kaushan Script /
Outfit). Logo original « Bibi Quizz » ; esprit plateau de quiz télé, jamais le logo ni
l'habillage d'une émission existante. Pupitres lumineux, lampes du 4 à la suite, gros
buzzer laqué sur téléphone. Font Awesome vendorisé : n'utiliser que les icônes de
`vendor/fontawesome/fa.css` (sous-ensemble régénéré avec pyftsubset).

## Pièges
- Chiffres : Orbitron abandonné (zéro barré illisible), scores en Outfit tabulaire.
- `[hidden]{display:none!important}` en tête de CSS (hérité de Bibi Love).
- Pied de plateau décalé à gauche : le bouton son masquait le texte d'aide.
