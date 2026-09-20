# Offre Bibi Quizz

- Découverte : pack fixe de 140 questions (60 buzzer, 4 thèmes de 14 questions, 24 énigmes), une émission en Mix, 4 candidats.
- Complète : 1 672 questions, 50 thèmes, 160 énigmes, tous les tons, soirées 45 min–1 h, marathon, 8 candidats. Achat unique de 4,99 € pour l’hôte.
- Le pack ne se renouvelle pas en relançant une partie. L’échauffement solo pioche dans ce même pack.
- `js/discovery.js` définit la sélection ; `js/plan.js` centralise les droits. Les règles Firestore contrôlent le format, le ton et la capacité à la création.
- Les banques restent livrées en JavaScript public : ces restrictions commerciales ne constituent pas une protection contre l’extraction du code source.
- Le lien Stripe fourni est raccordé. Déployer le webhook avec STRIPE_SECRET_KEY et STRIPE_WEBHOOK_SECRET, puis configurer les événements checkout.session.completed et checkout.session.async_payment_succeeded. Retour conseillé : https://bibi-quizz.web.app/#/?paiement=ok.
- L’achat est lié à l’identité anonyme du navigateur. Le webhook vérifie le lien exact, le montant de 499 centimes, la devise EUR et le paiement effectif. Aucun déblocage réel n’a encore été testé.
