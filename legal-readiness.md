# Bibi Quizz — état juridique et publication, 20 septembre 2026

## Réalisé dans le dépôt
CGV, CGU, mentions/confidentialité et formulaire de rétractation reliés au site. CGV consultables et imprimables avant paiement, case non précochée obligatoire dans le parcours de l'application. Droit de rétractation conservé 14 jours même après utilisation. Le formulaire enregistre la déclaration côté serveur et ne confirme qu'après lecture serveur ; accusé horodaté téléchargeable. Les remboursements restent à traiter par DB Digital, sans automatisme.

Logo typographique droit, suppression de la présentation manuscrite dorée et de l'arabesque, palette menthe/corail/ardoise, nouvelle icône vectorielle utilisée par le manifeste. Intitulés Course aux points / Rafale chrono / Duel des indices. Rafale chrono : points cumulés, erreurs sans perte de points, aucun arrêt après quatre bonnes réponses. Les anciens fichiers d'icônes restent archivés dans le dépôt mais ne sont plus référencés par le site.

## À compléter avant de considérer les ventes prêtes
- Renseigner js/legal-config.js : identité juridique, statut, adresse, téléphone, immatriculation selon le statut, TVA applicable, responsable de publication et médiateur effectivement désigné. Ne pas inventer une adhésion.
- Confirmer les coordonnées contractuelles de l'hébergeur, la région Firebase et les garanties de transfert ; fixer les durées de conservation et appliquer la purge.
- Déployer les règles Firestore pour withdrawalRequests. Tester un enregistrement réel dans un environnement de test avant publication. Surveiller cette collection et traiter les remboursements ; aucun e-mail de notification n'est envoyé automatiquement.
- Configurer Stripe pour afficher les coordonnées complètes, les liens contractuels publics et recueillir l'acceptation sur le Payment Link aussi : le lien direct peut contourner la case de l'application. L'acceptation locale en sessionStorage n'est pas une preuve serveur de commande.
- Organiser l'envoi de la confirmation contractuelle sur support durable avec la version des CGV applicable. Le reçu Stripe et un lien vers des pages modifiables ne suffisent pas nécessairement. Aucun envoi de ces documents n'est automatisé ici.
- Les modifications et les règles ne sont pas déployées dans le cadre de ce travail.

## Propriété intellectuelle
Aucun registre exhaustif de marques, dessins/modèles ni contrat de licence de l'émission n'a été obtenu. Le nom Bibi Quizz n'est donc pas certifié disponible. Les nouveaux intitulés ne sont pas certifiés disponibles non plus. Les changements ci-dessus réduisent la proximité et modifient effectivement une manche ; ils ne constituent pas une autorisation ni une garantie de non-contrefaçon ou d'absence de parasitisme. Le format conserve une qualification au buzzer et un duel à indices : une analyse d'ensemble reste nécessaire.

Sources officielles consultées :
- https://www.inpi.fr/ressources/propriete-intellectuelle/droit-dauteur
- https://www.inpi.fr/sites/default/files/proteger_ses_creations.pdf
- https://entreprendre.service-public.gouv.fr/vosdroits/F33527
- https://entreprendre.service-public.gouv.fr/vosdroits/F23455
- https://entreprendre.service-public.gouv.fr/vosdroits/F33338

Les CGV sont une rédaction de travail adaptée au produit, pas une certification juridique. Les données DB Digital / SIRET / e-mail sont celles fournies par l'utilisateur, non validées auprès du registre.
