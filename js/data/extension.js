/* Extension V1 : faits durables, questions originales. Les identifiants sont stables.
 * Une ligne = question | réponse | variantes facultatives séparées par ;.
 * Les sources et la portée de vérification sont documentées dans map-donnees.md.
 */
const packs = [
['kpop','K-pop & culture coréenne','moderne',`
Quel groupe sud-coréen a sorti le single anglophone Dynamite en 2020 ?|BTS
Quel groupe réunit Jisoo, Jennie, Rosé et Lisa ?|Blackpink
Quel chanteur a popularisé la danse du cheval avec Gangnam Style ?|Psy
Dans quel pays la K-pop est-elle née ?|Corée du Sud
Quelle est la capitale de la Corée du Sud ?|Séoul
Quel nom portent les fans de BTS ?|Army
Quel nom portent les fans de Blackpink ?|Blinks|Blink
Quel membre de Blackpink a sorti le titre Solo en 2018 ?|Jennie
Quel membre de Blackpink a sorti l'album single Lalisa en 2021 ?|Lisa
Quel réalisateur sud-coréen a signé Parasite ?|Bong Joon-ho
Quel film de Bong Joon-ho a remporté l'Oscar du meilleur film en 2020 ?|Parasite
Dans quelle série coréenne le héros porte-t-il le numéro 456 ?|Squid Game
Quel légume fermenté est au cœur du kimchi le plus courant ?|Chou|Chou chinois
Quel plat coréen mélange riz, légumes et souvent un œuf dans un bol ?|Bibimbap
Quel alphabet sert à écrire le coréen ?|Hangeul|Hangul
Quel art martial coréen est célèbre pour ses coups de pied ?|Taekwondo
Quelle chanson de Pinkfong met en scène une famille de requins ?|Baby Shark
Quel groupe de K-pop a sorti le titre God's Menu en 2020 ?|Stray Kids
Quel groupe de K-pop a sorti le titre Super Shy en 2023 ?|NewJeans
Avec quel chanteur Rosé interprète-t-elle APT., sorti en 2024 ?|Bruno Mars
`],
['food','Street food & coffee','moderne',`
De quel pays le bubble tea est-il originaire ?|Taïwan
Quel féculent compose les perles noires classiques du bubble tea ?|Tapioca
Quel thé vert en poudre colore les matcha lattes ?|Matcha
Quel fruit est l'ingrédient principal du guacamole ?|Avocat
De quel pays le burrito est-il originaire ?|Mexique
Quel pain rond troué sert souvent de base à un sandwich au saumon ?|Bagel
Quelle pâtisserie américaine porte un glaçage et un trou central ?|Donut|Doughnut
Quel sandwich vietnamien utilise une baguette ?|Banh mi|Bánh mì
Quel plat hawaïen servi dans un bol associe traditionnellement poisson cru et assaisonnement ?|Poke|Poké
Quel pays a donné son nom au café turc ?|Turquie
Quel café très court sert de base au cappuccino ?|Espresso|Expresso
Quel ingrédient fouetté couvre traditionnellement un cappuccino ?|Mousse de lait
Quel lait végétal fabrique-t-on avec la céréale utilisée dans le porridge ?|Lait d'avoine|Avoine
Quel dessert italien signifie littéralement « crème cuite » ?|Panna cotta
Quelle spécialité japonaise est une brochette de poulet grillé ?|Yakitori
Quel plat japonais consiste en une soupe de nouilles de blé ?|Ramen
Quel condiment vert japonais accompagne souvent les sushis ?|Wasabi
Quel dessert français assemble deux coques à l'amande autour d'une garniture ?|Macaron
Quelle pâte de pois chiches du Moyen-Orient contient souvent du tahini ?|Houmous|Hummus
Quel sandwich grec associe généralement viande, crudités et sauce dans une pita ?|Gyros
`],
['animation','Animation & studios','moderne',`
Quel studio a produit Le Voyage de Chihiro ?|Studio Ghibli|Ghibli
Quel réalisateur japonais a signé Mon voisin Totoro ?|Hayao Miyazaki|Miyazaki
Dans Le Voyage de Chihiro, en quels animaux les parents de Chihiro se transforment-ils ?|Cochons|Porcs
Quel film de Ghibli suit une jeune sorcière qui effectue des livraisons ?|Kiki la petite sorcière|Kiki
Quel château ambulant donne son titre à un film de Miyazaki ?|Le Château ambulant
Dans Shrek, quelle créature est le héros vert ?|Ogre
Quel personnage bavard accompagne Shrek ?|L'Âne|Âne;Donkey
Quel studio a produit Shrek et Kung Fu Panda ?|DreamWorks
Dans Kung Fu Panda, comment s'appelle le panda héros ?|Po
Dans Dragons, comment s'appelle le dragon noir de Harold ?|Krokmou|Toothless
Quel film d'animation suit les sœurs Anna et Elsa ?|La Reine des neiges|Frozen
Quel film Pixar se déroule en grande partie dans la tête de Riley ?|Vice-versa|Inside Out
Quelle émotion bleue porte des lunettes dans Vice-versa ?|Tristesse
Quel film Pixar suit deux robots nommés WALL-E et EVE ?|WALL-E
Dans Coco, quel instrument Miguel rêve-t-il de jouer ?|Guitare
Quel film Pixar met en scène une famille de super-héros nommée Parr ?|Les Indestructibles|The Incredibles
Quel héros de Spider-Man: New Generation est un adolescent de Brooklyn ?|Miles Morales|Miles
Dans L'Âge de glace, quel animal est Manny ?|Mammouth
Dans Madagascar, quel animal est Alex ?|Lion
Quel film d'animation met en scène la lapine policière Judy Hopps et son partenaire renard Nick Wilde ?|Zootopie|Zootopia
`],
['voyage','Voyages & city trips','moderne',`
Quelle ville portugaise est connue pour ses tramways jaunes et la tour de Belém ?|Lisbonne
Dans quelle ville espagnole peut-on visiter la Sagrada Família ?|Barcelone
Dans quelle ville italienne se trouve le Colisée ?|Rome
Quelle ville néerlandaise abrite le musée Van Gogh ?|Amsterdam
Quel pays abrite la ville de Marrakech ?|Maroc
Dans quel pays se trouve l'île de Bali ?|Indonésie
Quelle capitale thaïlandaise est traversée par le fleuve Chao Phraya ?|Bangkok
Quel pays abrite la ville de Kyoto ?|Japon
Quelle ville américaine est surnommée la Big Apple ?|New York|NYC
Quelle ville britannique abrite le marché de Camden ?|Londres
Quel pays abrite les falaises de Moher ?|Irlande
Quelle capitale islandaise est la principale porte d'entrée de l'île ?|Reykjavik
Quel pays abrite le site antique de Pétra ?|Jordanie
Quel désert s'étend sur une grande partie du nord de l'Afrique ?|Sahara
Dans quel pays se trouve le Machu Picchu ?|Pérou
Quelle ville allemande est célèbre pour sa porte de Brandebourg ?|Berlin
Quelle capitale danoise abrite le port coloré de Nyhavn ?|Copenhague
Quel pays abrite les îles des Cyclades ?|Grèce
Quelle ville turque est située de part et d'autre du Bosphore ?|Istanbul
Quelle ville australienne abrite un opéra au toit en forme de voiles ?|Sydney
`],
['ecologie','Planète & écologie','moderne',`
Quel gaz de formule CO2 est émis lors de la combustion du charbon ?|Dioxyde de carbone|Gaz carbonique
Quel processus permet aux plantes de transformer l'énergie lumineuse en énergie chimique ?|Photosynthèse
Quel nom donne-t-on à la diversité des êtres vivants d'un milieu ?|Biodiversité
Quel dispositif transforme directement la lumière solaire en électricité ?|Panneau photovoltaïque|Panneau solaire;Cellule photovoltaïque
Quelle machine produit de l'électricité grâce au vent ?|Éolienne
Quelle énergie utilise la chaleur interne de la Terre ?|Géothermie
Quel phénomène naturel retient une partie de la chaleur dans l'atmosphère ?|Effet de serre
Quel gaz majoritaire de l'air porte le symbole chimique N2 ?|Diazote|Azote
Quelle couche de l'atmosphère nous protège d'une grande partie des UV ?|Couche d'ozone|Ozone
Quel processus transforme des déchets organiques en amendement pour le sol ?|Compostage|Compost
Quel insecte pollinisateur fabrique du miel ?|Abeille
Quel animal marin à huit bras est un mollusque ?|Poulpe|Pieuvre
Quelle forêt tropicale est traversée par le fleuve Amazone ?|Amazonie|Forêt amazonienne
Quel continent est recouvert par une vaste calotte glaciaire autour du pôle Sud ?|Antarctique
Quel nom donne-t-on à la montée du niveau de la mer sur le littoral ?|Élévation du niveau marin|Montée des eaux
Quel matériau fabriqué à partir de sable sert à produire les bouteilles transparentes classiques ?|Verre
Quel métal léger constitue la plupart des canettes de boisson ?|Aluminium
Quel moyen de transport individuel à pédales n'émet pas de gaz d'échappement ?|Vélo|Bicyclette
Quel mot désigne la réutilisation d'un objet pour un nouvel usage sans le détruire ?|Réemploi
Quel océan borde la côte ouest de la France métropolitaine ?|Atlantique|Océan Atlantique
`],
['jeuxsociete','Jeux de société','moderne',`
Dans quel jeu achète-t-on des rues et construit-on des hôtels ?|Monopoly
Quel jeu de cartes impose de crier son nom lorsqu'il ne reste qu'une carte ?|Uno
Dans quel jeu fait-on deviner un mot avec un dessin ?|Pictionary
Quel jeu consiste à retirer des blocs d'une tour sans la faire tomber ?|Jenga
Quel jeu de lettres utilise un plateau avec des cases « mot compte triple » ?|Scrabble
Quel jeu d'enquête demande de trouver un coupable, une arme et une pièce ?|Cluedo
Dans quel jeu de déduction sociale les villageois affrontent-ils des loups-garous ?|Les Loups-garous de Thiercelieux|Loups-garous
Quel personnage des Loups-garous peut observer l'identité d'un joueur la nuit ?|Voyante
Quel personnage des Loups-garous dispose d'une potion de vie et d'une potion de mort ?|Sorcière
Quel jeu coopératif demande de lutter contre des épidémies mondiales ?|Pandemic|Pandémie
Quel jeu de plateau fait construire des routes ferroviaires entre des villes ?|Les Aventuriers du Rail|Ticket to Ride
Quel jeu utilise des moutons, du bois, de l'argile, du blé et du minerai comme ressources ?|Catan|Les Colons de Catane
Quel jeu d'ambiance demande de retrouver un symbole commun entre deux cartes rondes ?|Dobble
Quel jeu de mots oppose deux équipes guidées par des maîtres-espions ?|Codenames
Quel jeu utilise des cartes illustrées pour faire deviner une image à partir d'une phrase ?|Dixit
Combien de cases compte un échiquier classique ?|64
Quelle pièce d'échecs se déplace en L ?|Cavalier
Quelle pièce faut-il mettre échec et mat pour gagner aux échecs ?|Roi
Combien de faces possède un dé cubique classique ?|6|Six
Quel jeu de stratégie à deux utilise traditionnellement des pierres noires et blanches sur un goban ?|Go
`],
['maths','Logique & calcul mental','classique',`
Combien vaut le carré de 12 ?|144
Combien vaut 15 % de 200 ?|30
Quel nombre complète la suite 2, 4, 8, 16 ?|32
Combien de côtés possède un hexagone ?|6|Six
Combien de degrés mesure un angle droit ?|90
Quel est le plus petit nombre premier ?|2|Deux
Combien vaut la racine carrée de 81 ?|9|Neuf
Combien de minutes y a-t-il dans deux heures et demie ?|150
Quel est le périmètre d'un carré de côté 5 cm, en centimètres ?|20
Quelle est l'aire d'un rectangle de 3 cm sur 7 cm, en centimètres carrés ?|21
Quel nombre romain représente la lettre X ?|10|Dix
Combien vaut trois quarts de 100 ?|75
Combien vaut la somme des angles d'un triangle, en degrés ?|180
Comment appelle-t-on un triangle dont les trois côtés sont égaux ?|Équilatéral|Triangle équilatéral
Quel est le résultat de 7 multiplié par 8 ?|56
Combien de millimètres y a-t-il dans un mètre ?|1000|Mille
Quel nombre obtient-on en divisant 1 par 4, en écriture décimale ?|0,25|0.25
Quel est le double de 128 ?|256
Quel nombre précède immédiatement zéro dans les entiers relatifs ?|-1|Moins un;Moins 1
Comment appelle-t-on le segment qui relie deux points d'un cercle en passant par son centre ?|Diamètre
`],
['instruments','Musique & instruments','classique',`
Combien de cordes possède une guitare classique standard ?|6|Six
Combien de cordes possède un violon ?|4|Quatre
Quel instrument à clavier produit ses sons en frappant des cordes avec des marteaux ?|Piano
Quel grand instrument à cordes se joue assis avec une pique au sol ?|Violoncelle
Quel instrument de cuivre possède une coulisse ?|Trombone
Quel instrument à vent a été inventé par Adolphe Sax ?|Saxophone
Quel instrument à percussion se compose de lames de bois accordées ?|Xylophone
Quel instrument traditionnel écossais possède une poche d'air ?|Cornemuse
Quel instrument à soufflet possède des touches ou des boutons ?|Accordéon
Quel instrument hawaïen ressemble à une petite guitare à quatre cordes ?|Ukulélé|Ukulele
Quel instrument à cordes de forme triangulaire se joue en pinçant ses cordes ?|Harpe
Quel accessoire utilise-t-on pour frotter les cordes d'un violon ?|Archet
Quel objet donne le la lorsqu'on le frappe et qu'il vibre ?|Diapason
Quel appareil marque une pulsation régulière pour travailler le rythme ?|Métronome
Comment appelle-t-on la vitesse d'exécution d'un morceau ?|Tempo
Quelle indication italienne demande de jouer doucement ?|Piano
Quelle indication italienne demande de jouer fort ?|Forte
Combien de lignes comporte une portée musicale standard ?|5|Cinq
Quelle note vient après mi dans la gamme de do majeur ascendante ?|Fa
Quel symbole musical élève une note d'un demi-ton ?|Dièse
`],
['numerique','Culture numérique','moderne',`
Quel raccourci Windows permet de copier une sélection ?|Ctrl C|Control C
Quel raccourci Windows permet de coller le contenu du presse-papiers ?|Ctrl V|Control V
Quel raccourci Windows permet d'annuler la dernière action dans de nombreuses applications ?|Ctrl Z|Control Z
Quel format d'image animé est souvent utilisé pour les réactions sur Internet ?|GIF
Quel format de document porte les initiales de Portable Document Format ?|PDF
Quel symbole sépare le nom d'utilisateur du domaine dans une adresse e-mail ?|Arobase|Arrobe
Quel mot français désigne un message électronique indésirable ?|Pourriel|Spam
Comment appelle-t-on la fraude qui imite un service pour voler des identifiants ?|Hameçonnage|Phishing
Quel terme désigne une copie de données conservée pour pouvoir les restaurer ?|Sauvegarde|Backup
Quel code carré se scanne avec l'appareil photo d'un téléphone ?|QR code|Code QR
Quel nom donne-t-on à une diffusion vidéo en direct sur Internet ?|Livestream|Live;Streaming en direct
Quel format audio numérique a popularisé la musique compressée à la fin des années 1990 ?|MP3
Quel périphérique permet de déplacer un pointeur sur un ordinateur de bureau ?|Souris
Quel périphérique convertit un document papier en image numérique ?|Scanner|Scanneur
Quel mot désigne une émission audio publiée en épisodes et écoutable à la demande ?|Podcast|Balado
Quel symbole musical donne son nom au signe placé devant un hashtag en français courant ?|Dièse
Quel navigateur web est développé par Mozilla ?|Firefox
Quel système d'exploitation mobile est développé par Google ?|Android
Quelle entreprise a créé le système Windows ?|Microsoft
Quel nom porte l'encyclopédie collaborative lancée en 2001 ?|Wikipédia|Wikipedia
`],
['sportsurbains','Glisse & sports urbains','moderne',`
Quel sport consiste à se déplacer sur une planche à quatre roues ?|Skateboard|Skate
Quel sport de glisse se pratique sur une vague avec une planche ?|Surf
Quel sport de neige utilise une seule planche fixée aux deux pieds ?|Snowboard
Quel sport de déplacement urbain consiste à franchir des obstacles avec son corps ?|Parkour
Quel petit vélo se prête aux courses sur bosses et aux figures acrobatiques ?|BMX
Dans quel sport réalise-t-on un ollie avec une planche à roulettes ?|Skateboard|Skate
Comment appelle-t-on la figure de skate qui fait tourner la planche autour de son axe longitudinal ?|Kickflip
Quel skateur a réussi un 900 aux X Games en 1999 ?|Tony Hawk
Quel sport utilise une voile reliée à une planche par un mât ?|Planche à voile|Windsurf
Quel sport de glisse utilise une aile de traction tenue avec une barre ?|Kitesurf|Kite
Quel sport consiste à marcher en équilibre sur une sangle tendue ?|Slackline
Quel sport consiste à gravir un mur ou une paroi avec les mains et les pieds ?|Escalade
Quelle discipline d'escalade se pratique à faible hauteur, sans corde et au-dessus de tapis ?|Bloc
Quel équipement protège la tête d'un cycliste en cas de chute ?|Casque
Quel appareil de fitness simule la course sur place avec une bande mobile ?|Tapis de course
Quelle danse de rue a fait son entrée aux Jeux olympiques à Paris en 2024 ?|Breaking|Breakdance
Dans quelle ville se sont déroulés les Jeux olympiques d'été de 2024 ?|Paris
Quelle compétition multisports extrêmes est connue sous le nom de « Jeux X » en anglais ?|X Games
Quel sport de raquette se joue dans une cage vitrée et généralement en double ?|Padel
Quel sport de disque se joue en équipe et interdit de courir avec le disque en main ?|Ultimate|Ultimate frisbee
`]
];
export const EXTRA_CATEGORIES = Object.fromEntries(packs.map(([id,l,ere]) => [id,{l,ere}]));
export const EXTRA_BUZZ = packs.flatMap(([c,,, text]) => text.trim().split('\n').map((line,i) => {
  const [q,r,aliases] = line.split('|');
  return { id: `v1-${c}-${String(i+1).padStart(2,'0')}`, c, q, r,
    // Un pack commence par des repères accessibles et finit avec des questions plus pointues.
    d: i < 8 ? 1 : i < 17 ? 2 : 3,
    ...(aliases ? {alt: aliases.split(';')} : {}) };
}));
