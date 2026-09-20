# map-index — Bibi Quizz

Aiguillage global. Aucun détail comportemental ici : voir les maps spécialisées.

| Module | Fichier(s) | Map | Statut |
|---|---|---|---|
| Coque PWA, routeur, boot | `index.html`, `js/app.js`, `sw.js`, `manifest.webmanifest` | [map-front](map-front.md) | ✅ v1 |
| Direction artistique | `css/style.css`, `icons/` | [map-front](map-front.md) | ✅ v1 |
| Maître du jeu (création → salon → 3 manches → podium) | `js/host.js` | [map-front](map-front.md) | ✅ v1 |
| Manette téléphone (buzzer, saisie, thèmes, main, prono) | `js/player.js` | [map-front](map-front.md) | ✅ v1 |
| Contrat de diffusion écran ↔ téléphones | `js/live.js` | [map-front](map-front.md) | ✅ v1 |
| Logique pure (correction des réponses, barèmes, tirages, soirée) | `js/game.js`, `js/config.js` | [map-front](map-front.md) | ✅ v1, testée |
| Banques de questions | `js/data/questions.js` | [map-donnees](map-donnees.md) | ✅ 612 buzzer · 50 thèmes (700 q.) · 160 énigmes |
| Accès Firestore + mémoire locale hôte | `js/store.js`, `js/firebase.js` | [map-donnees](map-donnees.md) | ✅ v1 |
| Règles de sécurité | `firestore.rules` | [map-donnees](map-donnees.md) | ✅ v1 |
| Plan gratuit / complet + webhook Stripe | `js/plan.js`, `functions/index.js` | [map-monetisation](map-monetisation.md) | ⚠️ Stripe à brancher |
| Tests | `scripts/test-game.mjs` | — | ✅ 14 tests |

## Chantiers ouverts

- [x] **Firebase** : projet `bibi-quizz` renseigné dans `js/config.js` et `.firebaserc`.
- [ ] Console Firebase : Authentication → Anonyme **activé** ; Firestore créé en `eur3`/`europe-west1`.
- [ ] Déployer : `firebase deploy --only firestore:rules,hosting`.
- [ ] **Stripe** : Payment Link 4,99 € + webhook (voir map-monetisation).
- [ ] Première vraie soirée : chronométrer les manches et ajuster `RULES` (config.js) si besoin.
- [ ] QR code dans le salon (évite de taper l'adresse).
- [ ] Faire relire la banque par un humain (voir map-donnees, « à vérifier »).
