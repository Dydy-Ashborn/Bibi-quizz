// Banque dédiée : aucune question générale ajoutée aux tirages de Noël.
// Textes rédigés pour Bibi Quizz, sans paroles de chansons ni extraits de films.
const rows = (text, prefix, c) => text.trim().split('\n').map((line, i) => {
  const [q, r, ...alt] = line.split('|');
  return { id: prefix + String(i + 1).padStart(3, '0'), c, q, r, alt, d: 1, ere: 'moderne' };
});
export const CHRISTMAS_CATEGORIES = {
  noel: { l: 'La magie de Noël', ere: 'moderne' }
};
export const CHRISTMAS_BUZZ = rows(`
À quelle date fête-t-on Noël dans le calendrier civil français ?|25 décembre|le 25 décembre
Quel arbre décore-t-on traditionnellement pour Noël ?|Le sapin|sapin
Quel personnage apporte les cadeaux dans la nuit de Noël selon la tradition populaire ?|Le Père Noël|père noël|papa noël
Quel véhicule le Père Noël utilise-t-il dans les contes pour sa tournée ?|Un traîneau|traîneau
Quels animaux tirent le traîneau du Père Noël ?|Des rennes|rennes|renne
Comment s'appelle le renne au nez rouge du Père Noël ?|Rudolph|Rodolphe
Quelle couleur a le nez de Rudolph ?|Rouge
Par quel conduit le Père Noël descend-il dans de nombreux contes ?|La cheminée|cheminée
Comment appelle-t-on les petits assistants du Père Noël qui fabriquent les jouets ?|Les lutins|lutins|elfes
Quel sac le Père Noël porte-t-il sur son dos pour transporter les cadeaux ?|Une hotte|hotte
Quel calendrier permet d'ouvrir une case chaque jour avant Noël ?|Le calendrier de l'Avent|calendrier de l'avent
Comment appelle-t-on le repas de fête du soir du 24 décembre ?|Le réveillon de Noël|réveillon
Quel dessert de Noël français a la forme d'un morceau de bois ?|La bûche|bûche de noël
Quel objet à cinq branches place-t-on souvent au sommet du sapin ?|Une étoile|étoile
Quel décor circulaire de Noël suspend-on souvent à une porte ?|Une couronne|couronne de noël
Quel personnage vert veut voler Noël dans l'histoire du Dr Seuss ?|Le Grinch|Grinch
Dans Maman, j'ai raté l'avion !, quel est le prénom de l'enfant oublié à Noël ?|Kevin|Kevin McCallister
Quel acteur joue Kevin dans Maman, j'ai raté l'avion ! ?|Macaulay Culkin|Culkin
Quel est le nom de famille de Kevin dans Maman, j'ai raté l'avion ! ?|McCallister
Quel auteur a écrit Un chant de Noël, avec Ebenezer Scrooge ?|Charles Dickens|Dickens
Quel est le nom de l'avare au centre d'Un chant de Noël ?|Scrooge|Ebenezer Scrooge
Dans Le Noël de Mickey, quel canard joue le rôle de Scrooge ?|Picsou|Oncle Picsou
Dans L'Étrange Noël de Monsieur Jack, quel est le prénom du héros squelette ?|Jack|Jack Skellington
Quel train magique donne son titre au film où des enfants voyagent vers le pôle Nord à Noël ?|Le Pôle Express|Pôle Express|Polar Express
Quelle chanteuse interprète All I Want for Christmas Is You ?|Mariah Carey|Carey
Quel duo britannique interprète Last Christmas dans sa version originale ?|Wham!|Wham
Quel chanteur corse est célèbre pour son interprétation de Petit Papa Noël ?|Tino Rossi|Rossi
Quelle chanson française de Noël porte le nom de l'arbre que l'on décore ?|Mon beau sapin
Quel chant de Noël français porte un titre évoquant un vent d'hiver ?|Vive le vent
Quelle région française est associée aux treize desserts de Noël ?|La Provence|Provence
Combien de desserts compte la tradition provençale des desserts de Noël ?|Treize|13
Comment appelle-t-on les petites figurines des crèches provençales ?|Les santons|santons
Dans quel pays se trouve Rovaniemi, célèbre pour son village du Père Noël ?|La Finlande|Finlande
Dans quelle région du nord de l'Europe situe-t-on souvent la maison du Père Noël ?|La Laponie|Laponie
Dans quelle ville française se tient le marché de Noël surnommé Christkindelsmärik ?|Strasbourg
Quelle région française est particulièrement connue pour ses marchés de Noël à Strasbourg et Colmar ?|L'Alsace|Alsace
Quelle boisson épicée et servie chaude trouve-t-on traditionnellement sur les marchés de Noël pour les adultes ?|Le vin chaud|vin chaud
Quelle épice en bâton parfume souvent les biscuits et boissons de Noël ?|La cannelle|cannelle
Quelle confiserie rayée de Noël ressemble à une petite canne ?|Le sucre d'orge|sucre d'orge|canne en sucre
Quel gâteau italien de Noël est haut et contient traditionnellement raisins secs et fruits confits ?|Le panettone|panettone
Quel gâteau allemand de Noël, souvent saupoudré de sucre glace, s'appelle aussi Christstollen ?|Le stollen|stollen
Quelle boisson de Noël crémeuse porte en français un nom associant un produit laitier et un oiseau ?|Le lait de poule|lait de poule
Comment dit-on Noël en anglais ?|Christmas
Comment dit-on Joyeux Noël en espagnol ?|Feliz Navidad
Comment dit-on Joyeux Noël en anglais ?|Merry Christmas|Happy Christmas
Quel saint, fêté le 6 décembre, est associé à la distribution de friandises aux enfants ?|Saint Nicolas|Nicolas
Quel objet en tissu suspend-on près de la cheminée pour recevoir des petits cadeaux de Noël ?|Une chaussette|chaussette|bas de noël
Quel éclairage forme une longue chaîne lumineuse autour du sapin ?|Une guirlande lumineuse|guirlande
Quelle matière utilise-t-on pour emballer les cadeaux de Noël avant de les décorer d'un ruban ?|Du papier cadeau|papier cadeau
Quelle scène de Noël représente la naissance de Jésus avec des figurines ?|La crèche|crèche
Dans le récit chrétien de Noël, dans quelle ville naît Jésus ?|Bethléem|Bethlehem
Quel est le nom de la mère de Jésus représentée dans la crèche de Noël ?|Marie|la Vierge Marie
Quel personnage accompagne Marie dans la crèche en tant que père nourricier de Jésus ?|Joseph|Saint Joseph
Quelle fête du 6 janvier prolonge le cycle de Noël et célèbre les mages dans la tradition chrétienne occidentale ?|L'Épiphanie|Épiphanie
Quel objet porte le Père Noël sur la tête dans sa représentation la plus courante ?|Un bonnet rouge|bonnet
Quel accessoire ferme souvent le manteau du Père Noël au niveau de la taille ?|Une ceinture|ceinture
Quelle couleur domine le costume du Père Noël dans l'imagerie moderne ?|Rouge
Quelle partie du visage du Père Noël est longue et blanche ?|La barbe|barbe
Quel mot français désigne un présent offert à Noël ?|Un cadeau|cadeau
Comment appelle-t-on un échange de cadeaux de Noël où chacun tire au sort une personne à gâter en secret ?|Secret Santa|Père Noël secret|Noël canadien
`, 'nb', 'noel');

const theme = (id, titre, text) => ({ id, titre, ere: 'moderne', questions: rows(text, id + '-', 'noel') });
export const CHRISTMAS_THEMES = [
theme('nt1', 'L’atelier du Père Noël', `
Quel mot complète « Père … » pour nommer le distributeur de cadeaux du 25 décembre ?|Noël
Quelle couleur complète le rouge sur la bordure du bonnet du Père Noël ?|Blanc|blanche
Dans les contes, qui fabrique les jouets dans l'atelier du Père Noël ?|Les lutins|lutins|elfes
Quel outil sert à découper le papier d'un cadeau de Noël ?|Des ciseaux|ciseaux
Quel adhésif permet de fermer le papier d'un cadeau de Noël ?|Du ruban adhésif|scotch|adhésif
Quel petit carton permet d'inscrire le destinataire d'un cadeau de Noël ?|Une étiquette|étiquette
Quel accessoire de tissu peut-on nouer autour d'un cadeau de Noël ?|Un ruban|ruban
Comment s'appelle la liste que l'enfant prépare pour demander ses cadeaux au Père Noël ?|Une liste de souhaits|liste de cadeaux|liste de noël|liste
Quel message les enfants écrivent-ils traditionnellement au Père Noël ?|Une lettre|lettre
Quel objet à patins transporte les cadeaux du Père Noël dans la neige ?|Un traîneau|traîneau
Quel animal de l'attelage de Noël porte des bois sur la tête ?|Le renne|renne
Quel renne de Noël guide l'attelage grâce à son nez lumineux ?|Rudolph|Rodolphe
Quel sac de cadeaux le Père Noël porte-t-il traditionnellement sur le dos ?|Une hotte|hotte
Selon la tradition populaire, les cadeaux attendent souvent les enfants au pied de quel arbre ?|Le sapin|sapin
`),
theme('nt2', 'À table pour Noël', `
Quel dessert de Noël peut être pâtissier ou glacé et évoque un tronc ?|La bûche|bûche
Combien de desserts sont traditionnellement servis pour Noël en Provence ?|13|treize
Quel fruit sec obtenu en séchant du raisin entre dans le panettone de Noël ?|Le raisin sec|raisin sec
Quel agrume confit trouve-t-on souvent dans le panettone de Noël ?|L'orange|orange
Quel aliment sucré fabriqué par les abeilles entre dans le pain d'épices de Noël ?|Le miel|miel
Quel ingrédient issu du cacao peut garnir une bûche de Noël ?|Le chocolat|chocolat
Quel sucre très fin donne un effet de neige sur les gâteaux de Noël ?|Le sucre glace|sucre glace
Quel petit gâteau de Noël en forme de personnage est souvent parfumé au gingembre ?|Un bonhomme en pain d'épices|bonhomme de pain d'épices|pain d'épices
Quel gâteau italien de Noël a un nom commençant par « panet » ?|Le panettone|panettone
Quelle boisson chaude sans alcool, à base de cacao, accompagne volontiers les biscuits de Noël ?|Le chocolat chaud|chocolat chaud
Quel ingrédient blanc monte-t-on en chantilly pour décorer une bûche de Noël ?|La crème|crème liquide|crème
Quel parfum provenant d'une gousse est classique dans les bûches de Noël ?|La vanille|vanille
Quel ustensile aux contours de sapin ou d'étoile découpe les sablés de Noël ?|Un emporte-pièce|emporte-pièce
Quelle préparation de sucre et de blanc d'œuf décore traditionnellement les biscuits de Noël ?|Le glaçage royal|glaçage
`),
theme('nt3', 'Noël au cinéma et en musique', `
Quel est le prénom du garçon de Maman, j'ai raté l'avion ! ?|Kevin
Quelle couleur a le Grinch ?|Vert|verte
Quel auteur a créé Scrooge dans Un chant de Noël ?|Charles Dickens|Dickens
Quel est le prénom de Scrooge ?|Ebenezer
Dans Le Noël de Mickey, quel personnage Disney joue l'avare Scrooge ?|Picsou
Quel est le prénom du héros de L'Étrange Noël de Monsieur Jack ?|Jack
Quelle fête donne son nom à la ville d'origine de Jack Skellington ?|Halloween
Quel moyen de transport empruntent les enfants du Pôle Express ?|Un train|train
Quel chanteur interprète le célèbre Petit Papa Noël enregistré en 1946 ?|Tino Rossi
Quelle chanteuse est associée à All I Want for Christmas Is You ?|Mariah Carey
Quel duo chante Last Christmas ?|Wham!|Wham
Quel mot anglais du titre Last Christmas signifie « Noël » ?|Christmas
Quel arbre est célébré dans Mon beau sapin ?|Le sapin|sapin
Dans le titre du chant Douce nuit, quel moment de la journée est évoqué ?|La nuit|nuit
`),
theme('nt4', 'Décors et traditions de Noël', `
Quel calendrier cache souvent des chocolats dans ses cases avant Noël ?|Le calendrier de l'Avent|calendrier de l'avent
Quel mois accueille Noël en France ?|Décembre
Quel nombre correspond au jour de Noël en France ?|25|vingt-cinq
Quel soir de décembre précède immédiatement Noël ?|Le 24 décembre|24 décembre|24
Quelle décoration sphérique accroche-t-on aux branches du sapin ?|Une boule|boule de noël
Quel objet étoilé est souvent placé tout en haut du sapin ?|Une étoile|étoile
Quel décor de porte en forme d'anneau se prépare à Noël ?|Une couronne|couronne
Quel mot désigne les figurines de la crèche provençale ?|Les santons|santons
Quelle scène miniature de Noël présente Marie, Joseph et Jésus ?|La crèche|crèche
Quelle matière blanche peut-on imiter avec du coton sur un décor de Noël ?|La neige|neige
Quel objet sonore en forme de petite cloche orne parfois le traîneau de Noël ?|Un grelot|grelot|clochette
Quel pays abrite le village du Père Noël à Rovaniemi ?|La Finlande|Finlande
Quelle fête chrétienne du 6 janvier clôt traditionnellement les douze jours de Noël ?|L'Épiphanie|Épiphanie
Quel mot complète le souhait français « Joyeux … » adressé le 25 décembre ?|Noël
`)
];
export const CHRISTMAS_FAF = [
['Un personnage de Noël','Je parcours le ciel dans les contes.|Un attelage m’accompagne.|Ma hotte est remplie de surprises.|Je distribue les cadeaux avec ma barbe blanche.','Le Père Noël','Père Noël','Papa Noël'],
['Un animal de Noël','Je vis dans les régions froides.|Je porte des bois.|Dans les contes, je vole en attelage.|Je tire le traîneau du Père Noël.','Le renne','renne'],
['Un dessert de Noël','Mon nom évoque la forêt.|Je termine souvent le réveillon en France.|Je peux être glacé ou roulé.|Je ressemble à un morceau de tronc décoré.','La bûche','bûche','bûche de Noël'],
['Une tradition de décembre','J’aide à attendre une fête.|On me trouve en carton ou en tissu.|Je cache parfois des chocolats.|On ouvre mes cases avant Noël.','Le calendrier de l’Avent',"calendrier de l'avent"],
['Un personnage de fiction','Je suis né sous la plume du Dr Seuss.|Je vis à l’écart des habitants de Chouville.|Je veux dérober leurs cadeaux.|Créature verte, je déteste Noël au début de mon histoire.','Le Grinch','Grinch'],
['Un personnage de Dickens','Je préfère mon argent à la générosité.|Des esprits me rendent visite à Noël.|Mon prénom est Ebenezer.|Je suis l’avare que trois esprits de Noël poussent à devenir généreux.','Scrooge','Ebenezer Scrooge'],
['Une décoration de Noël','On peut me choisir naturel ou artificiel.|Je porte des lumières en décembre.|On dépose les cadeaux à mon pied.|On chante que je suis beau et roi des forêts.','Le sapin','sapin','sapin de Noël'],
['Une ville de Noël','Je suis une ville finlandaise.|Je me situe en Laponie.|On vient y rencontrer un célèbre personnage barbu.|Mon village du Père Noël est traversé par le cercle polaire.','Rovaniemi'],
['Un gâteau de Noël','Je viens d’Italie.|Ma pâte est levée.|Je contiens souvent des raisins secs et des fruits confits.|Mon nom commence par « panet ».','Le panettone','panettone'],
['Un accessoire de Noël','Je transporte des surprises.|On peut me représenter en osier.|Je suis plus volumineux qu’une simple poche.|Le Père Noël me porte sur son dos, pleine de cadeaux.','La hotte','hotte'],
['Une décoration de Noël','Je peux être composée de branches.|Je forme une boucle fermée.|On me décore de rubans ou de pommes de pin.|Je suis souvent accrochée à la porte d’entrée en décembre.','La couronne','couronne','couronne de Noël'],
['Une figurine de Noël','Je suis souvent fabriquée en argile.|Je représente parfois un métier traditionnel.|Je suis associée à la Provence.|Je peuple les petites crèches : on me nomme un…','Un santon','santon']
].map(([theme, clues, r, ...alt], i) => ({id:'nf'+String(i+1).padStart(3,'0'),theme,ere:'moderne',indices:clues.split('|'),r,alt}));
export const CHRISTMAS_POOL = {buzz: CHRISTMAS_BUZZ, themes: CHRISTMAS_THEMES, faf: CHRISTMAS_FAF};
export const CHRISTMAS_COUNT = CHRISTMAS_BUZZ.length + CHRISTMAS_THEMES.reduce((n,t)=>n+t.questions.length,0) + CHRISTMAS_FAF.length;
