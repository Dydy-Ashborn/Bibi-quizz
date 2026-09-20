# map-donnees — Firestore, banques de questions

## Modèle Firestore
- `games/{code}` : `hostUid, status (lobby|live|fini), format, ton, maxJoueurs,
  tirage{r1[], r2[], faf[]}, etat{…}, bc{…}` — écrit par l'hôte seul.
- `games/{code}/players/{uid}` : `name, color, son, joinedAt` — écrit par le joueur.
- `games/{code}/buzz/{uid}` : `seq, tour, at` — `at` doit valoir l'heure serveur
  (règle `request.time`) : impossible d'antidater un buzz.
- `games/{code}/inputs/{uid}` : `seq, tour, kind (reponse|theme|main|prono), value` —
  lisible par son auteur et l'hôte seulement.
- `hosts/{uid}` : `premium` — écriture refusée côté client, webhook Stripe seul.
- L'hôte ignore le premier instantané de `inputs` (reprise) et dédoublonne par clé.

## Mémoire locale de l'hôte (localStorage)
`bq.host.games` (10 dernières parties), `bq.host.used` (questions posées, repoussées en
fin de tirage, 1 500 max), `bq.premium` (cache), `bq.name`, `bq.son`, `bq.mute`.

## Banques — js/data/questions.js
- `BUZZ` (612) : `id, c, q, r, alt?, d` — 34 catégories × 18, moitié « classique »
  (histoire, géo, sciences, espace, corps, nature, littérature, art, chanson, langue,
  cuisine, mythologie, cinéma, sport, inventions, France), moitié « moderne » (rap,
  pop, séries, jeux vidéo, manga, internet, streamers, tech, marques, foot, NBA/F1,
  super-héros, Disney/Pixar, sagas, télé-réalité, Pokémon, mode, années 2000).
- `THEMES` (50 × 14 = 700) : questionnaires rapides du 4 à la suite, `ere` par thème.
- `FAF` (160) : énigmes « Je suis… » à 4 indices, du plus pointu au plus évident.
- **Ajouter à la FIN des tableaux, ne jamais renuméroter** (historique + découpe gratuite).
- `node scripts/test-game.mjs` vérifie : champs, que chaque réponse ET variante est
  acceptée par la correction, qu'aucune réponse d'une autre question de la même
  catégorie/du même thème n'est acceptée, que la réponse n'est pas dans les indices.

## Correction automatique — `juger()` (game.js)
Minuscules, sans accents ni ponctuation ni articles ; « tik tok » = « tiktok ».
Fautes tolérées selon la longueur (0 jusqu'à 4 lettres, 1 jusqu'à 7, 2 jusqu'à 12, 3
au-delà). Sur les mots courts, la **substitution** d'une lettre est refusée (Monet ≠
Manet, Nancy ≠ Sancy), l'oubli/ajout/inversion acceptés. Nombres et chiffres romains
exacts (Louis XIV = Louis 14 ≠ Louis XVI ; 1789 ≠ 1798). Réponse noyée dans une petite
phrase acceptée (« c'est Booba »), exacte pour les réponses courtes (« Mont » ≠ « Monet »).
Le bouton « Accorder » du maître du jeu rattrape les refus injustes.

## À vérifier
Banque rédigée et relue automatiquement en deux passes, mais sans source externe par
question : une relecture humaine avant une vraie soirée publique reste recommandée,
en priorité sur les catégories « moderne » (faits récents).
