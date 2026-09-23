# Bibi Quizz

PWA de soirée inspirée des grands jeux télé de culture générale : un écran maître
(télé, ordi) et un téléphone par candidat, qui sert de buzzer et de clavier.
Trois manches par émission — Neuf points gagnants, 4 à la suite, Face-à-face — et
une soirée de 1 à 3 émissions avec Grande Finale. Vanilla JS (modules ES), Firebase
(Firestore + Auth anonyme + Hosting), aucun build.

Démarrage : voir `map-index.md` (chantiers ouverts) puis `map-monetisation.md`.
Tests : `node scripts/test-game.mjs`.

# Thème du site

Le thème public se règle dans [`js/site-config.js`](js/site-config.js) : `SITE_THEME = 'noel'` affiche l'édition de Noël et son quiz, `SITE_THEME = 'standard'` revient au site classique. Après modification, déployer Firebase Hosting pour appliquer ce choix à tous les visiteurs. Le choix n'est pas proposé dans l'interface et ne dépend pas du stockage du navigateur. Les parties de Noël déjà créées conservent leur décor.
