# decisions — Bibi Quizz

## Format
- **Fidèle au déroulé télé** : Neuf points gagnants (1/2/3 pts selon les candidats en
  lice, 9 pour se qualifier, 3 qualifiés) → 4 à la suite (thème au choix, erreur = remise
  à zéro, meilleure série retenue) → Face-à-face (indices, 4/3/2/1, premier à 12,
  prendre ou laisser la main).
- **Réponses tapées** sur le téléphone (on ne peut pas répondre à l'oral à une app),
  correction automatique tolérante + bouton « Accorder » pour le maître du jeu.
- **Durée 45 min – 1 h** obtenue par la « soirée » : 2 émissions + Grande Finale en cas
  d'égalité de victoires, plutôt qu'en gonflant les seuils (9 et 12 sont iconiques).
- 4 à la suite : **60 s** au lieu de 40 s (taper au téléphone est plus lent que parler).
- 2-3 joueurs : pas d'élimination au buzzer ; 4 à 8 : format complet.
- Modernisation : ton « Classique / Mix / 100 % moderne », 34 catégories dont 18
  « Génération Z », sons de buzzer perso, pronostics du public, trophées de fin de soirée.

## Technique
- Pas de Cloud Functions sauf le webhook Stripe (même exception que Bibi Love).
- L'écran maître est l'unique arbitre ; départage des buzz à l'horodatage **serveur**
  (fenêtre de 350 ms), jamais par les horloges des téléphones.
- `bc` séparé de `etat` (piège Bibi Love : réécrire l'état effaçait la diffusion).
- Banque embarquée en JS statique : zéro latence ; contrepartie assumée, un joueur qui
  ouvre le code source peut lire les réponses (jeu de soirée, pas d'enjeu).
- Service worker réseau-d'abord pour le code (leçon Bibi Love).

## Identité
Nom « Bibi Quizz », logo et DA originaux (bleu/orange, script doré). L'esprit du jeu
télé est repris, jamais la marque, le logo, le jingle ni l'habillage d'une émission.
