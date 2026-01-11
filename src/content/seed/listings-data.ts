/**
 * Données de seed pour les annonces fictives
 * 
 * 100+ annonces réparties :
 * - 40 services (40%)
 * - 30 produits (30%)
 * - 20 jobs (20%)
 * - 10 autres (10%)
 */

// ============================================================================
// TYPES
// ============================================================================

export type ListingCategory = 'service' | 'product' | 'job' | 'other'
export type PriceType = 'fixed' | 'hourly' | 'negotiable' | 'free'

export interface ListingTemplate {
  title: string
  description: string
  category: ListingCategory
  price: number | null
  priceType: PriceType
  /** Mots-clés pour sélectionner les images */
  imageKeywords: string[]
}

export interface UnsplashImage {
  id: string
  url: string
  keywords: string[]
}

// ============================================================================
// VILLES FRANÇAISES
// ============================================================================

export const FRENCH_CITIES = [
  'Paris',
  'Lyon',
  'Marseille',
  'Bordeaux',
  'Toulouse',
  'Nantes',
  'Lille',
  'Nice',
  'Strasbourg',
  'Montpellier',
  'Rennes',
  'Grenoble',
  'Rouen',
  'Toulon',
  'Saint-Étienne',
  'Le Havre',
  'Reims',
  'Dijon',
  'Angers',
  'Clermont-Ferrand',
  'Aix-en-Provence',
  'Brest',
  'Tours',
  'Amiens',
  'Limoges',
  'Perpignan',
  'Metz',
  'Besançon',
  'Orléans',
  'Caen',
]

// ============================================================================
// IMAGES UNSPLASH PAR CATÉGORIE
// Images sélectionnées manuellement pour garantir la pertinence
// ============================================================================

export const UNSPLASH_IMAGES: Record<string, UnsplashImage[]> = {
  // Services - Cours et formation
  tutoring: [
    { id: 'DUmFLtMeAbQ', url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop', keywords: ['cours', 'formation', 'tutoring'] },
    { id: 'N_aihp118p8', url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=600&fit=crop', keywords: ['cours', 'formation'] },
    { id: 'OQMZwNd3ThU', url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=600&fit=crop', keywords: ['cours', 'école'] },
  ],
  
  // Services - Bricolage
  handyman: [
    { id: 'wR11KBaB86U', url: 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=800&h=600&fit=crop', keywords: ['bricolage', 'outils'] },
    { id: '4ojhpgKpS68', url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&h=600&fit=crop', keywords: ['bricolage', 'réparation'] },
    { id: 'XGcaMo6MI3s', url: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&h=600&fit=crop', keywords: ['bricolage', 'construction'] },
  ],
  
  // Services - Jardinage
  gardening: [
    { id: 'vrbZVyX2k4I', url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop', keywords: ['jardinage', 'plantes'] },
    { id: 'diJpTE0fPFo', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop', keywords: ['jardinage', 'jardin'] },
    { id: 'XMcoTHgNcQA', url: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=800&h=600&fit=crop', keywords: ['jardinage', 'potager'] },
  ],
  
  // Services - Garde d'enfants
  childcare: [
    { id: 'hLvQ4-QEBAE', url: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&h=600&fit=crop', keywords: ['enfants', 'garde'] },
    { id: 'YFmvjO3TP_s', url: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&h=600&fit=crop', keywords: ['enfants', 'jeux'] },
    { id: 'WYegFmU85C4', url: 'https://images.unsplash.com/photo-1484820540004-14229fe36ca4?w=800&h=600&fit=crop', keywords: ['enfants', 'activités'] },
  ],
  
  // Services - Ménage
  cleaning: [
    { id: '0REG87gxJ3E', url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop', keywords: ['ménage', 'nettoyage'] },
    { id: 'kG71BXh8KFw', url: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&h=600&fit=crop', keywords: ['ménage', 'maison'] },
    { id: 'NL_DF0Klepc', url: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&h=600&fit=crop', keywords: ['ménage', 'propre'] },
  ],
  
  // Services - Déménagement
  moving: [
    { id: 'HJckKnwCXxQ', url: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=800&h=600&fit=crop', keywords: ['déménagement', 'cartons'] },
    { id: '9HI8UJMSdZA', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop', keywords: ['déménagement', 'transport'] },
    { id: 'JVD3XPqjLaQ', url: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800&h=600&fit=crop', keywords: ['déménagement', 'maison'] },
  ],
  
  // Services - Coaching / Sport
  coaching: [
    { id: 'CQfNt66ttZM', url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=600&fit=crop', keywords: ['coaching', 'sport'] },
    { id: 'U5kQvbQWoG0', url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop', keywords: ['fitness', 'gym'] },
    { id: 'sHfo3WOgGTU', url: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800&h=600&fit=crop', keywords: ['sport', 'entrainement'] },
  ],
  
  // Services - Informatique
  tech: [
    { id: 'FewHpO4VC9Y', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop', keywords: ['informatique', 'ordinateur'] },
    { id: '6JVlSdgMacE', url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop', keywords: ['code', 'programmation'] },
    { id: 'oqStl2L5oxI', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=600&fit=crop', keywords: ['tech', 'réparation'] },
  ],
  
  // Services - Musique
  music: [
    { id: 'J4kK8b9Fgj8', url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=600&fit=crop', keywords: ['musique', 'piano'] },
    { id: '1oKxSKSOowE', url: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&h=600&fit=crop', keywords: ['musique', 'guitare'] },
    { id: 'PDX_a_82obo', url: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800&h=600&fit=crop', keywords: ['musique', 'cours'] },
  ],
  
  // Services - Cuisine
  cooking: [
    { id: 'CIuakYIjadc', url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=600&fit=crop', keywords: ['cuisine', 'chef'] },
    { id: 'kcA-c3f_3FE', url: 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800&h=600&fit=crop', keywords: ['cuisine', 'plat'] },
    { id: 'IGfIGP5ONV0', url: 'https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?w=800&h=600&fit=crop', keywords: ['cuisine', 'préparation'] },
  ],
  
  // Produits - Meubles
  furniture: [
    { id: 'MP0bgaS_d1c', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop', keywords: ['meuble', 'canapé'] },
    { id: 'wR11KBaB86U', url: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=600&fit=crop', keywords: ['meuble', 'table'] },
    { id: 'FV3GConVSss', url: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&h=600&fit=crop', keywords: ['meuble', 'salon'] },
  ],
  
  // Produits - Électronique
  electronics: [
    { id: '1SAnrIxw5OY', url: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800&h=600&fit=crop', keywords: ['électronique', 'téléphone'] },
    { id: 'Im7lZjxeLhg', url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=600&fit=crop', keywords: ['électronique', 'laptop'] },
    { id: 'PDX_a_82obo', url: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&h=600&fit=crop', keywords: ['électronique', 'console'] },
  ],
  
  // Produits - Vêtements
  clothing: [
    { id: 'Df2pfZ_wGdU', url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&h=600&fit=crop', keywords: ['vêtements', 'mode'] },
    { id: 'KiEiI2b9GkU', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop', keywords: ['vêtements', 'boutique'] },
    { id: 'TS--uNw-JqE', url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=600&fit=crop', keywords: ['vêtements', 'accessoires'] },
  ],
  
  // Produits - Vélos
  bikes: [
    { id: 'qy27JnsH9sU', url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&h=600&fit=crop', keywords: ['vélo', 'cyclisme'] },
    { id: '3U7HcqkIbb4', url: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=800&h=600&fit=crop', keywords: ['vélo', 'route'] },
    { id: 'xzJkEbX4PkM', url: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800&h=600&fit=crop', keywords: ['vélo', 'vtt'] },
  ],
  
  // Produits - Livres
  books: [
    { id: 'sfL_QOnmy00', url: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&h=600&fit=crop', keywords: ['livres', 'lecture'] },
    { id: 'lUaaKCUANVI', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&h=600&fit=crop', keywords: ['livres', 'bibliothèque'] },
    { id: 'IOzk8YKDhYg', url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&h=600&fit=crop', keywords: ['livres', 'étude'] },
  ],
  
  // Produits - Décoration
  decor: [
    { id: 'FBXuXp57eM0', url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop', keywords: ['décoration', 'intérieur'] },
    { id: '2d4lAQAlbDA', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&h=600&fit=crop', keywords: ['décoration', 'salon'] },
    { id: 'R-LK3sqLiBw', url: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&h=600&fit=crop', keywords: ['décoration', 'maison'] },
  ],
  
  // Jobs - Bureau / Freelance
  office: [
    { id: 'wD1LRb9OeEo', url: 'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800&h=600&fit=crop', keywords: ['bureau', 'travail'] },
    { id: '5fNmWej4tAA', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop', keywords: ['équipe', 'collaboration'] },
    { id: 'QBpZGqEMsKg', url: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=600&fit=crop', keywords: ['réunion', 'travail'] },
  ],
  
  // Jobs - Restauration
  restaurant: [
    { id: '26T6EAsQCiA', url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop', keywords: ['restaurant', 'service'] },
    { id: 'W3SEyZODn8U', url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop', keywords: ['restaurant', 'bar'] },
    { id: 'MqT0asuoIcU', url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop', keywords: ['restaurant', 'café'] },
  ],
  
  // Jobs - Commerce
  retail: [
    { id: 'VO5w2Ida70s', url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop', keywords: ['commerce', 'vente'] },
    { id: 'gMsnXqILjp4', url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=600&fit=crop', keywords: ['boutique', 'magasin'] },
    { id: 'Y5bvRlcCx8k', url: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&h=600&fit=crop', keywords: ['commerce', 'caisse'] },
  ],
  
  // Autres - Événements
  events: [
    { id: 'hzgs56Ze49s', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop', keywords: ['événement', 'fête'] },
    { id: 'aWf7mjwwJJo', url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop', keywords: ['conférence', 'événement'] },
    { id: 'Q_KdjKxntH8', url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop', keywords: ['événement', 'réception'] },
  ],
  
  // Autres - Animaux
  pets: [
    { id: 'v3-zcCWMjgM', url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop', keywords: ['chien', 'animal'] },
    { id: '75715CVEJhI', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&h=600&fit=crop', keywords: ['chat', 'animal'] },
    { id: 'gKXKBY-C-Dk', url: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&h=600&fit=crop', keywords: ['animaux', 'promenade'] },
  ],
}

// ============================================================================
// TEMPLATES D'ANNONCES - SERVICES (40)
// ============================================================================

export const SERVICE_TEMPLATES: ListingTemplate[] = [
  // Cours particuliers (10)
  {
    title: 'Cours de mathématiques niveau collège/lycée',
    description: 'Professeur expérimenté propose des cours particuliers de mathématiques pour collégiens et lycéens. Méthodologie adaptée à chaque élève, préparation au brevet et au bac. Première heure d\'essai gratuite. Disponible en semaine après 17h et le week-end.',
    category: 'service',
    price: 25,
    priceType: 'hourly',
    imageKeywords: ['tutoring'],
  },
  {
    title: 'Cours de français et aide aux devoirs',
    description: 'Étudiante en lettres modernes donne des cours de français tous niveaux. Grammaire, orthographe, rédaction, préparation aux examens. Aide aux devoirs possible pour toutes les matières. Patiente et pédagogue.',
    category: 'service',
    price: 20,
    priceType: 'hourly',
    imageKeywords: ['tutoring'],
  },
  {
    title: 'Cours d\'anglais conversationnel',
    description: 'Bilingue français-anglais, je propose des cours de conversation en anglais pour améliorer votre expression orale. Tous niveaux acceptés. Sessions dynamiques et personnalisées selon vos objectifs professionnels ou personnels.',
    category: 'service',
    price: 30,
    priceType: 'hourly',
    imageKeywords: ['tutoring'],
  },
  {
    title: 'Préparation au TOEIC/TOEFL',
    description: 'Formateur certifié propose une préparation intensive aux tests TOEIC et TOEFL. Méthodes éprouvées pour maximiser votre score. Supports de cours fournis. Résultats garantis ou cours supplémentaires offerts.',
    category: 'service',
    price: 40,
    priceType: 'hourly',
    imageKeywords: ['tutoring'],
  },
  {
    title: 'Cours de physique-chimie lycée',
    description: 'Ingénieur diplômé donne des cours de physique-chimie pour lycéens. Spécialité première et terminale, préparation au bac. Explications claires et exercices pratiques. Possibilité de cours en visio.',
    category: 'service',
    price: 28,
    priceType: 'hourly',
    imageKeywords: ['tutoring'],
  },
  {
    title: 'Soutien scolaire primaire toutes matières',
    description: 'Enseignante retraitée propose soutien scolaire pour enfants du primaire. Aide aux devoirs, apprentissage de la lecture, calcul. Expérience de 30 ans en éducation nationale. Ambiance bienveillante et encourageante.',
    category: 'service',
    price: 18,
    priceType: 'hourly',
    imageKeywords: ['tutoring'],
  },
  {
    title: 'Cours d\'espagnol tous niveaux',
    description: 'Native espagnole propose des cours particuliers d\'espagnol. Conversation, grammaire, culture hispanique. Préparation aux examens (bac, DELE). Cours adaptés à votre rythme et vos objectifs.',
    category: 'service',
    price: 25,
    priceType: 'hourly',
    imageKeywords: ['tutoring'],
  },
  {
    title: 'Cours d\'allemand débutant à avancé',
    description: 'Professeur d\'allemand certifié propose cours particuliers. Méthode communicative, immersion linguistique. Préparation aux certifications Goethe. Nombreuses années d\'expérience en enseignement.',
    category: 'service',
    price: 30,
    priceType: 'hourly',
    imageKeywords: ['tutoring'],
  },
  {
    title: 'Cours de SVT - Sciences de la vie',
    description: 'Doctorant en biologie propose des cours de SVT pour collège et lycée. Approche pratique et illustrée. Aide à la compréhension des concepts complexes. Préparation efficace aux examens.',
    category: 'service',
    price: 25,
    priceType: 'hourly',
    imageKeywords: ['tutoring'],
  },
  {
    title: 'Cours d\'histoire-géographie',
    description: 'Passionné d\'histoire, diplômé en sciences politiques, je propose des cours d\'histoire-géo. Méthodologie de dissertation, analyse de documents. Préparation aux épreuves du bac avec fiches de révision.',
    category: 'service',
    price: 22,
    priceType: 'hourly',
    imageKeywords: ['tutoring'],
  },

  // Bricolage et réparations (6)
  {
    title: 'Bricoleur polyvalent - petits travaux',
    description: 'Bricoleur expérimenté propose ses services pour tous vos petits travaux : montage de meubles, fixations murales, étagères, petite plomberie, électricité simple. Déplacement inclus dans un rayon de 20km. Devis gratuit.',
    category: 'service',
    price: 35,
    priceType: 'hourly',
    imageKeywords: ['handyman'],
  },
  {
    title: 'Peinture intérieure - Rénovation',
    description: 'Peintre expérimenté propose travaux de peinture intérieure. Préparation des surfaces, application soignée, finitions impeccables. Conseils couleurs offerts. Matériel de qualité professionnelle. Propreté garantie.',
    category: 'service',
    price: 180,
    priceType: 'fixed',
    imageKeywords: ['handyman'],
  },
  {
    title: 'Réparation et montage de meubles',
    description: 'Spécialiste du montage de meubles en kit (IKEA, Conforama, etc.). Réparation de meubles abîmés, ajustement de portes et tiroirs. Travail soigné et rapide. Intervention à domicile.',
    category: 'service',
    price: 40,
    priceType: 'hourly',
    imageKeywords: ['handyman'],
  },
  {
    title: 'Plomberie - Dépannage urgent',
    description: 'Plombier indépendant intervient rapidement pour vos urgences : fuite d\'eau, débouchage, remplacement robinetterie. Tarifs transparents, pas de frais cachés. Disponible 7j/7.',
    category: 'service',
    price: 50,
    priceType: 'hourly',
    imageKeywords: ['handyman'],
  },
  {
    title: 'Électricité - Installation et dépannage',
    description: 'Électricien qualifié propose installation de prises, interrupteurs, luminaires. Mise aux normes tableau électrique. Dépannage rapide. Devis détaillé gratuit. Travail conforme aux normes.',
    category: 'service',
    price: 45,
    priceType: 'hourly',
    imageKeywords: ['handyman'],
  },
  {
    title: 'Carrelage - Pose et rénovation',
    description: 'Carreleur professionnel propose pose de carrelage sol et mur, faïence salle de bain, cuisine. Travail méticuleux, joints parfaits. Conseil sur le choix des matériaux. Devis gratuit sur place.',
    category: 'service',
    price: 35,
    priceType: 'fixed',
    imageKeywords: ['handyman'],
  },

  // Jardinage (5)
  {
    title: 'Entretien de jardin régulier',
    description: 'Jardinier passionné propose entretien régulier de votre jardin : tonte pelouse, taille haies, désherbage, arrosage. Forfaits mensuels ou interventions ponctuelles. Évacuation des déchets verts incluse.',
    category: 'service',
    price: 30,
    priceType: 'hourly',
    imageKeywords: ['gardening'],
  },
  {
    title: 'Création de potager bio',
    description: 'Maraîcher amateur vous accompagne dans la création de votre potager bio. Préparation du sol, choix des variétés, plan de plantation, conseils d\'entretien. Faites pousser vos propres légumes !',
    category: 'service',
    price: 150,
    priceType: 'fixed',
    imageKeywords: ['gardening'],
  },
  {
    title: 'Élagage et abattage d\'arbres',
    description: 'Élagueur professionnel intervient pour l\'élagage, l\'abattage et le démontage d\'arbres. Équipement complet, travail en hauteur sécurisé. Évacuation des branches. Devis gratuit.',
    category: 'service',
    price: null,
    priceType: 'negotiable',
    imageKeywords: ['gardening'],
  },
  {
    title: 'Arrosage automatique - Installation',
    description: 'Installation de systèmes d\'arrosage automatique pour jardins et terrasses. Programmation intelligente, économie d\'eau. Système goutte-à-goutte ou asperseurs selon vos besoins.',
    category: 'service',
    price: 300,
    priceType: 'fixed',
    imageKeywords: ['gardening'],
  },
  {
    title: 'Nettoyage de terrasse et dallage',
    description: 'Nettoyage haute pression de terrasses, allées, dalles. Traitement anti-mousse durable. Redonnez à vos extérieurs leur éclat d\'origine. Résultat spectaculaire garanti.',
    category: 'service',
    price: 25,
    priceType: 'fixed',
    imageKeywords: ['gardening'],
  },

  // Garde d'enfants (4)
  {
    title: 'Baby-sitting soirs et week-ends',
    description: 'Étudiante sérieuse propose baby-sitting le soir et le week-end. Expérience avec enfants de 2 à 12 ans. Jeux éducatifs, aide aux devoirs, préparation des repas. Références disponibles.',
    category: 'service',
    price: 12,
    priceType: 'hourly',
    imageKeywords: ['childcare'],
  },
  {
    title: 'Nounou à temps partiel',
    description: 'Auxiliaire de puériculture propose garde d\'enfants à temps partiel. Disponible du lundi au vendredi. Éveil, sorties au parc, activités créatives. Diplômée et expérimentée.',
    category: 'service',
    price: 11,
    priceType: 'hourly',
    imageKeywords: ['childcare'],
  },
  {
    title: 'Garde périscolaire et aide aux devoirs',
    description: 'Retraitée de l\'éducation nationale propose garde d\'enfants après l\'école. Récupération à la sortie des classes, goûter, aide aux devoirs. Ambiance familiale et bienveillante.',
    category: 'service',
    price: 10,
    priceType: 'hourly',
    imageKeywords: ['childcare'],
  },
  {
    title: 'Garde d\'enfants bilingue anglais',
    description: 'Jeune femme bilingue français-anglais propose garde d\'enfants avec immersion en anglais. Jeux, chansons, histoires en anglais. Idéal pour initier vos enfants à la langue.',
    category: 'service',
    price: 15,
    priceType: 'hourly',
    imageKeywords: ['childcare'],
  },

  // Ménage et aide à domicile (4)
  {
    title: 'Ménage et repassage à domicile',
    description: 'Femme de ménage expérimentée propose prestations de ménage et repassage. Nettoyage complet, vitres, fours. Produits écologiques sur demande. Intervention régulière ou ponctuelle.',
    category: 'service',
    price: 15,
    priceType: 'hourly',
    imageKeywords: ['cleaning'],
  },
  {
    title: 'Grand ménage de printemps',
    description: 'Spécialiste du grand ménage propose nettoyage en profondeur de votre logement. Placards, dessous de meubles, électroménager. Idéal avant déménagement ou pour un nouveau départ.',
    category: 'service',
    price: 180,
    priceType: 'fixed',
    imageKeywords: ['cleaning'],
  },
  {
    title: 'Aide aux personnes âgées',
    description: 'Aide à domicile bienveillante propose accompagnement pour personnes âgées. Courses, préparation des repas, compagnie, petites tâches ménagères. Expérience en EHPAD.',
    category: 'service',
    price: 18,
    priceType: 'hourly',
    imageKeywords: ['cleaning'],
  },
  {
    title: 'Nettoyage fin de chantier',
    description: 'Entreprise de nettoyage propose prestations après travaux. Évacuation des gravats, nettoyage des surfaces, vitres. Remise en état complète pour emménagement immédiat.',
    category: 'service',
    price: 250,
    priceType: 'fixed',
    imageKeywords: ['cleaning'],
  },

  // Déménagement (3)
  {
    title: 'Aide au déménagement - Homme toutes mains',
    description: 'Costaud et organisé, je propose mon aide pour vos déménagements. Portage, chargement/déchargement du camion. Disponible également pour les petits déplacements de meubles.',
    category: 'service',
    price: 20,
    priceType: 'hourly',
    imageKeywords: ['moving'],
  },
  {
    title: 'Déménagement complet avec camion',
    description: 'Propose déménagement complet avec camion 20m³. Emballage, démontage/remontage meubles, transport. Équipe de 2-3 personnes selon volume. Devis gratuit après visite.',
    category: 'service',
    price: null,
    priceType: 'negotiable',
    imageKeywords: ['moving'],
  },
  {
    title: 'Location camionnette avec chauffeur',
    description: 'Camionnette 12m³ avec chauffeur pour vos transports ponctuels. Achats encombrants, petits déménagements. Aide au chargement incluse. Tarif kilométrique avantageux.',
    category: 'service',
    price: 45,
    priceType: 'hourly',
    imageKeywords: ['moving'],
  },

  // Sport et coaching (4)
  {
    title: 'Coach sportif personnel à domicile',
    description: 'Coach sportif diplômé propose entraînements personnalisés à domicile. Perte de poids, renforcement musculaire, remise en forme. Programme sur mesure, suivi nutritionnel inclus.',
    category: 'service',
    price: 50,
    priceType: 'hourly',
    imageKeywords: ['coaching'],
  },
  {
    title: 'Cours de yoga à domicile',
    description: 'Professeur de yoga certifié propose séances à domicile ou en petit groupe. Hatha yoga, vinyasa, relaxation. Tous niveaux bienvenus. Tapis fourni si besoin.',
    category: 'service',
    price: 45,
    priceType: 'hourly',
    imageKeywords: ['coaching'],
  },
  {
    title: 'Préparation physique running',
    description: 'Marathonien expérimenté propose coaching running personnalisé. Préparation 10km, semi, marathon. Plans d\'entraînement, conseils techniques, sorties accompagnées.',
    category: 'service',
    price: 35,
    priceType: 'hourly',
    imageKeywords: ['coaching'],
  },
  {
    title: 'Cours de natation adultes et enfants',
    description: 'Maître-nageur propose cours de natation en piscine municipale. Apprentissage pour débutants, perfectionnement des nages. Vaincre la peur de l\'eau. Cours individuels ou petits groupes.',
    category: 'service',
    price: 40,
    priceType: 'hourly',
    imageKeywords: ['coaching'],
  },

  // Informatique (4)
  {
    title: 'Dépannage informatique à domicile',
    description: 'Technicien informatique propose dépannage à domicile. Virus, lenteurs, installation logiciels, configuration internet, récupération de données. PC et Mac. Intervention rapide.',
    category: 'service',
    price: 40,
    priceType: 'hourly',
    imageKeywords: ['tech'],
  },
  {
    title: 'Cours d\'informatique pour seniors',
    description: 'Patient et pédagogue, je propose des cours d\'informatique adaptés aux seniors. Utilisation d\'internet, emails, réseaux sociaux, appels vidéo. À votre rythme, sans stress.',
    category: 'service',
    price: 25,
    priceType: 'hourly',
    imageKeywords: ['tech'],
  },
  {
    title: 'Création de site web',
    description: 'Développeur freelance crée votre site web professionnel. Sites vitrines, e-commerce, blogs. Design moderne et responsive. Référencement inclus. Maintenance et évolutions possibles.',
    category: 'service',
    price: 800,
    priceType: 'fixed',
    imageKeywords: ['tech'],
  },
  {
    title: 'Formation bureautique Word/Excel',
    description: 'Formateur certifié propose cours de bureautique. Word, Excel, PowerPoint. Du débutant au perfectionnement. Exercices pratiques, support de cours fourni.',
    category: 'service',
    price: 35,
    priceType: 'hourly',
    imageKeywords: ['tech'],
  },
]

// ============================================================================
// TEMPLATES D'ANNONCES - PRODUITS (30)
// ============================================================================

export const PRODUCT_TEMPLATES: ListingTemplate[] = [
  // Meubles (8)
  {
    title: 'Canapé d\'angle convertible gris',
    description: 'Vends ce meuble canapé d\'angle convertible 5 places, couleur gris anthracite. Couchage 140x190cm, matelas confortable. Coffre de rangement intégré. Très bon état, acheté il y a 2 ans. Dimension totale : 280x180cm. Meuble idéal pour salon.',
    category: 'product',
    price: 450,
    priceType: 'fixed',
    imageKeywords: ['furniture'],
  },
  {
    title: 'Table à manger en chêne massif',
    description: 'Belle table à manger en chêne massif, style scandinave. Meuble de qualité, dimensions 180x90cm, peut accueillir 8 personnes. Quelques traces d\'usure normales. Possibilité de livraison payante.',
    category: 'product',
    price: 280,
    priceType: 'negotiable',
    imageKeywords: ['furniture'],
  },
  {
    title: 'Armoire 3 portes avec miroir',
    description: 'Grande armoire 3 portes coulissantes dont 1 miroir. Dimensions : 250cm largeur, 220cm hauteur, 60cm profondeur. Nombreux rangements intérieurs. Démontage à prévoir.',
    category: 'product',
    price: 200,
    priceType: 'fixed',
    imageKeywords: ['furniture'],
  },
  {
    title: 'Bureau en bois avec tiroirs',
    description: 'Bureau en bois clair, style vintage. 3 tiroirs à droite, pieds métalliques noirs. Dimensions : 120x60cm. Parfait pour télétravail. Très bon état.',
    category: 'product',
    price: 95,
    priceType: 'fixed',
    imageKeywords: ['furniture'],
  },
  {
    title: 'Lit 160x200 avec sommier et matelas',
    description: 'Ensemble lit complet : cadre en bois blanc, sommier à lattes et matelas ressorts ensachés (ferme). Utilisé 3 ans en chambre d\'amis. Comme neuf.',
    category: 'product',
    price: 350,
    priceType: 'negotiable',
    imageKeywords: ['furniture'],
  },
  {
    title: 'Bibliothèque modulable Billy IKEA',
    description: 'Bibliothèque Billy IKEA, couleur bouleau. 6 éléments avec portes vitrées. Montée, jamais démontée. Idéale pour grande collection de livres. Dimensions totales : 240x200cm.',
    category: 'product',
    price: 180,
    priceType: 'fixed',
    imageKeywords: ['furniture'],
  },
  {
    title: 'Fauteuil club cuir véritable',
    description: 'Authentique fauteuil club en cuir marron patiné. Style années 30, très confortable. Cuir souple et entretenu. Une pièce de caractère pour votre salon.',
    category: 'product',
    price: 320,
    priceType: 'negotiable',
    imageKeywords: ['furniture'],
  },
  {
    title: 'Commode vintage 5 tiroirs',
    description: 'Jolie commode vintage en bois, 5 tiroirs. Poignées en laiton d\'origine. Dimensions : 90x45x100cm. Petites marques d\'usage, charme authentique.',
    category: 'product',
    price: 145,
    priceType: 'fixed',
    imageKeywords: ['furniture'],
  },

  // Électronique (7)
  {
    title: 'MacBook Pro 13" M1 2020',
    description: 'Vends MacBook Pro 13 pouces, puce M1, 8Go RAM, 256Go SSD. Batterie excellente (92% capacité). Chargeur et boîte d\'origine inclus. Sous garantie jusqu\'en mars.',
    category: 'product',
    price: 850,
    priceType: 'fixed',
    imageKeywords: ['electronics'],
  },
  {
    title: 'iPhone 13 128Go bleu',
    description: 'iPhone 13 bleu, 128Go de stockage. Excellent état, toujours protégé. Face ID parfait, batterie 89%. Débloqué tout opérateur. Avec coque et protection écran.',
    category: 'product',
    price: 520,
    priceType: 'negotiable',
    imageKeywords: ['electronics'],
  },
  {
    title: 'PlayStation 5 + 2 manettes',
    description: 'PS5 version disque avec 2 manettes DualSense. Console parfait état, peu utilisée. Inclus : 3 jeux (FIFA 24, Spider-Man 2, God of War). Câbles et boîte d\'origine.',
    category: 'product',
    price: 420,
    priceType: 'fixed',
    imageKeywords: ['electronics'],
  },
  {
    title: 'TV Samsung 55" 4K QLED',
    description: 'Téléviseur Samsung QLED 55 pouces, 4K UHD. Smart TV avec Netflix, Disney+ préinstallés. Acheté en 2022, excellent état. Support mural offert.',
    category: 'product',
    price: 480,
    priceType: 'fixed',
    imageKeywords: ['electronics'],
  },
  {
    title: 'Casque Sony WH-1000XM4',
    description: 'Casque audio sans fil Sony WH-1000XM4, réduction de bruit active. Couleur noir. Batterie 30h. Étui de transport et câbles inclus. Comme neuf.',
    category: 'product',
    price: 180,
    priceType: 'fixed',
    imageKeywords: ['electronics'],
  },
  {
    title: 'iPad Air 4 64Go WiFi',
    description: 'iPad Air 4ème génération, 64Go, WiFi, couleur gris sidéral. Écran impeccable. Compatible Apple Pencil 2. Chargeur et câble originaux. Facture disponible.',
    category: 'product',
    price: 380,
    priceType: 'negotiable',
    imageKeywords: ['electronics'],
  },
  {
    title: 'Appareil photo Canon EOS 250D',
    description: 'Reflex Canon EOS 250D avec objectif 18-55mm IS STM. 24MP, WiFi, Bluetooth. Parfait pour débuter la photo. Sac de transport et carte SD 32Go inclus.',
    category: 'product',
    price: 450,
    priceType: 'fixed',
    imageKeywords: ['electronics'],
  },

  // Vêtements et mode (5)
  {
    title: 'Lot vêtements homme taille M',
    description: 'Lot de 15 vêtements homme taille M : 5 chemises, 4 t-shirts, 3 pulls, 3 pantalons. Marques variées (Zara, H&M, Jules). Bon état général. Idéal pour renouveler sa garde-robe.',
    category: 'product',
    price: 60,
    priceType: 'fixed',
    imageKeywords: ['clothing'],
  },
  {
    title: 'Robe de soirée noire Maje',
    description: 'Robe de soirée Maje, noire, taille 38. Portée une seule fois pour un mariage. Coupe élégante, dos nu. Prix neuf 280€. Parfait état.',
    category: 'product',
    price: 95,
    priceType: 'negotiable',
    imageKeywords: ['clothing'],
  },
  {
    title: 'Manteau d\'hiver Comptoir des Cotonniers',
    description: 'Manteau long en laine mélangée, couleur camel. Taille 40, marque Comptoir des Cotonniers. Très chaud, doublure intérieure. Quelques saisons mais impeccable.',
    category: 'product',
    price: 120,
    priceType: 'fixed',
    imageKeywords: ['clothing'],
  },
  {
    title: 'Baskets Nike Air Max 90 - taille 43',
    description: 'Nike Air Max 90, coloris blanc/noir, taille 43. Portées quelques fois, très bon état. Semelle intacte. Boîte d\'origine disponible.',
    category: 'product',
    price: 75,
    priceType: 'fixed',
    imageKeywords: ['clothing'],
  },
  {
    title: 'Sac à main Longchamp Pliage L',
    description: 'Sac Longchamp Le Pliage, taille L, couleur navy. Anses cuir en très bon état. Utilisé mais bien entretenu. Classique indémodable.',
    category: 'product',
    price: 55,
    priceType: 'fixed',
    imageKeywords: ['clothing'],
  },

  // Vélos et mobilité (4)
  {
    title: 'VTT Rockrider ST 530 taille L',
    description: 'VTT Rockrider ST 530, cadre aluminium taille L. 27 vitesses, freins à disque hydrauliques, suspension avant. Parfait pour randonnées. Entretien récent.',
    category: 'product',
    price: 280,
    priceType: 'negotiable',
    imageKeywords: ['bikes'],
  },
  {
    title: 'Vélo de ville électrique Decathlon',
    description: 'Vélo électrique Elops 920E, autonomie 70km. Batterie amovible, 7 vitesses. Porte-bagages et éclairage intégrés. 2000km au compteur. Batterie en bon état.',
    category: 'product',
    price: 650,
    priceType: 'fixed',
    imageKeywords: ['bikes'],
  },
  {
    title: 'Trottinette électrique Xiaomi Pro 2',
    description: 'Trottinette Xiaomi Mi Electric Scooter Pro 2. Autonomie 45km, vitesse max 25km/h. Pneus antidérapants, freins doubles. Application smartphone. État impeccable.',
    category: 'product',
    price: 320,
    priceType: 'fixed',
    imageKeywords: ['bikes'],
  },
  {
    title: 'Vélo enfant 20 pouces',
    description: 'Vélo enfant B\'twin 20 pouces, pour 6-9 ans. Couleur bleu, vitesse unique. Freins avant et arrière. Stabilisateurs retirés mais fournis. Bon état.',
    category: 'product',
    price: 45,
    priceType: 'fixed',
    imageKeywords: ['bikes'],
  },

  // Livres et culture (3)
  {
    title: 'Collection Harry Potter intégrale',
    description: 'Collection complète Harry Potter, 7 tomes édition Gallimard Jeunesse. Format poche, couvertures souples. Quelques traces de lecture mais bon état général.',
    category: 'product',
    price: 25,
    priceType: 'fixed',
    imageKeywords: ['books'],
  },
  {
    title: 'Lot 50 BD Astérix et Tintin',
    description: 'Lot de 50 bandes dessinées : 30 Astérix et 20 Tintin. Éditions anciennes et récentes. État variable mais lisibles. Idéal collection ou pour enfants.',
    category: 'product',
    price: 80,
    priceType: 'negotiable',
    imageKeywords: ['books'],
  },
  {
    title: 'Encyclopédie Universalis 24 volumes',
    description: 'Encyclopédie Universalis complète, 24 volumes reliés cuir. Édition 1995, très bon état. Meuble présentoir en bois inclus. Pour amateur de culture.',
    category: 'product',
    price: 150,
    priceType: 'negotiable',
    imageKeywords: ['books'],
  },

  // Décoration (3)
  {
    title: 'Tableau abstrait contemporain 100x80cm',
    description: 'Tableau original d\'artiste local, peinture acrylique sur toile. Style abstrait, tons bleus et dorés. Dimensions 100x80cm. Signé et certificat d\'authenticité.',
    category: 'product',
    price: 180,
    priceType: 'fixed',
    imageKeywords: ['decor'],
  },
  {
    title: 'Miroir rond rotin 80cm',
    description: 'Joli miroir rond encadré de rotin naturel. Diamètre 80cm. Tendance bohème chic. Accroché 1 an, comme neuf. Fixation murale incluse.',
    category: 'product',
    price: 45,
    priceType: 'fixed',
    imageKeywords: ['decor'],
  },
  {
    title: 'Lot luminaires vintage',
    description: 'Lot de 3 lampes vintage années 70 : 1 lampadaire arc, 2 lampes de chevet assorties. Abat-jour tissus d\'origine. Fonctionnent parfaitement. Patine du temps.',
    category: 'product',
    price: 120,
    priceType: 'negotiable',
    imageKeywords: ['decor'],
  },
]

// ============================================================================
// TEMPLATES D'ANNONCES - JOBS (20)
// ============================================================================

export const JOB_TEMPLATES: ListingTemplate[] = [
  // Freelance / Missions (8)
  {
    title: 'Recherche graphiste freelance',
    description: 'Startup en croissance recherche graphiste freelance pour création de visuels réseaux sociaux et supports marketing. Mission 3 mois renouvelable. Télétravail possible. Portfolio requis.',
    category: 'job',
    price: 350,
    priceType: 'fixed',
    imageKeywords: ['office'],
  },
  {
    title: 'Mission rédaction web SEO',
    description: 'Agence digitale cherche rédacteur web pour production d\'articles optimisés SEO. Thématiques variées : tech, lifestyle, voyage. Paiement à l\'article. Longue collaboration possible.',
    category: 'job',
    price: 50,
    priceType: 'fixed',
    imageKeywords: ['office'],
  },
  {
    title: 'Développeur React pour projet e-commerce',
    description: 'Recherche développeur React.js expérimenté pour développement boutique en ligne. Mission 2-3 mois, possibilité télétravail. Expérience e-commerce souhaitée. TJM à négocier.',
    category: 'job',
    price: 400,
    priceType: 'fixed',
    imageKeywords: ['office'],
  },
  {
    title: 'Community Manager temps partiel',
    description: 'PME cherche community manager pour gestion des réseaux sociaux (Instagram, LinkedIn, Facebook). 15h/semaine, horaires flexibles. Création de contenu et reporting mensuel.',
    category: 'job',
    price: 18,
    priceType: 'hourly',
    imageKeywords: ['office'],
  },
  {
    title: 'Traducteur anglais-français technique',
    description: 'Société de traduction recherche traducteurs anglais-français spécialisés technique/informatique. Missions régulières, paiement au feuillet. Test de recrutement.',
    category: 'job',
    price: 45,
    priceType: 'fixed',
    imageKeywords: ['office'],
  },
  {
    title: 'Assistant virtuel administratif',
    description: 'Entrepreneur cherche assistant virtuel pour gestion administrative : emails, agenda, factures, organisation. 10-20h/semaine selon besoins. 100% télétravail.',
    category: 'job',
    price: 15,
    priceType: 'hourly',
    imageKeywords: ['office'],
  },
  {
    title: 'Photographe événementiel recherché',
    description: 'Agence événementielle recherche photographe pour couverture d\'événements corporate. Mariages et soirées possibles. Matériel pro requis. Tarif par prestation.',
    category: 'job',
    price: 300,
    priceType: 'fixed',
    imageKeywords: ['office'],
  },
  {
    title: 'Monteur vidéo YouTube',
    description: 'Créateur de contenu YouTube (100k abonnés) cherche monteur vidéo régulier. Adobe Premiere ou DaVinci. 2-3 vidéos par semaine, style dynamique. Forfait mensuel.',
    category: 'job',
    price: 600,
    priceType: 'fixed',
    imageKeywords: ['office'],
  },

  // Restauration / Hôtellerie (4)
  {
    title: 'Serveur/serveuse week-end',
    description: 'Restaurant brasserie centre-ville recrute serveur(se) pour le week-end. Expérience exigée. Service midi et soir. Pourboires partagés. Ambiance conviviale.',
    category: 'job',
    price: 12,
    priceType: 'hourly',
    imageKeywords: ['restaurant'],
  },
  {
    title: 'Commis de cuisine en extra',
    description: 'Traiteur événementiel cherche commis de cuisine pour extras. Préparation buffets, mise en place, service. Expérience en cuisine requise. Missions ponctuelles.',
    category: 'job',
    price: 13,
    priceType: 'hourly',
    imageKeywords: ['restaurant'],
  },
  {
    title: 'Barman/barmaid saisonnier été',
    description: 'Bar de plage recrute barman pour la saison estivale (juin-septembre). Expérience cocktails appréciée. Logement possible. Ambiance festive garantie.',
    category: 'job',
    price: 11,
    priceType: 'hourly',
    imageKeywords: ['restaurant'],
  },
  {
    title: 'Réceptionniste hôtel nuit',
    description: 'Hôtel 3 étoiles recherche réceptionniste de nuit. Accueil clients, check-in/out, gestion des réservations. Anglais courant exigé. CDI temps plein.',
    category: 'job',
    price: 1800,
    priceType: 'fixed',
    imageKeywords: ['restaurant'],
  },

  // Commerce et vente (4)
  {
    title: 'Vendeur/vendeuse prêt-à-porter',
    description: 'Boutique de mode centre commercial recrute vendeur(se). Conseil client, mise en rayon, encaissement. 35h/semaine, travail le samedi. Expérience vente souhaitée.',
    category: 'job',
    price: 1600,
    priceType: 'fixed',
    imageKeywords: ['retail'],
  },
  {
    title: 'Hôte/Hôtesse de caisse grande surface',
    description: 'Supermarché recrute hôte(sse) de caisse en CDI temps partiel. 24h/semaine, planning variable. Formation assurée. Évolution possible vers temps plein.',
    category: 'job',
    price: 11,
    priceType: 'hourly',
    imageKeywords: ['retail'],
  },
  {
    title: 'Commercial terrain B2B',
    description: 'Société de services aux entreprises recherche commercial terrain. Prospection, rendez-vous clients, closing. Fixe + commissions attractives. Véhicule fourni.',
    category: 'job',
    price: 2200,
    priceType: 'fixed',
    imageKeywords: ['retail'],
  },
  {
    title: 'Animateur/animatrice en magasin',
    description: 'Agence d\'animation commerciale recrute animateurs pour grandes surfaces. Démonstration produits, distribution d\'échantillons. Missions le week-end. Formation assurée.',
    category: 'job',
    price: 12,
    priceType: 'hourly',
    imageKeywords: ['retail'],
  },

  // Stages et alternances (4)
  {
    title: 'Stage marketing digital 6 mois',
    description: 'Scale-up tech offre stage marketing digital. Gestion campagnes Ads, analytics, création contenu. Profil école de commerce ou marketing. Gratification légale + tickets restaurant.',
    category: 'job',
    price: 600,
    priceType: 'fixed',
    imageKeywords: ['office'],
  },
  {
    title: 'Alternance développeur web',
    description: 'Agence web propose alternance développeur. Formation sur nos technos (React, Node.js). Projets clients variés. 12-24 mois selon cursus. Ambiance startup.',
    category: 'job',
    price: 1100,
    priceType: 'fixed',
    imageKeywords: ['office'],
  },
  {
    title: 'Stage assistant RH 4 mois',
    description: 'Grande entreprise propose stage assistant RH. Recrutement, intégration, formation. Profil Master RH ou équivalent. Missions enrichissantes, équipe bienveillante.',
    category: 'job',
    price: 600,
    priceType: 'fixed',
    imageKeywords: ['office'],
  },
  {
    title: 'Alternance comptabilité BTS/DCG',
    description: 'Cabinet comptable recrute alternant en comptabilité. Saisie, déclarations, révision. Préparation BTS CG ou DCG. Accompagnement par expert-comptable expérimenté.',
    category: 'job',
    price: 900,
    priceType: 'fixed',
    imageKeywords: ['office'],
  },
]

// ============================================================================
// TEMPLATES D'ANNONCES - AUTRES (10)
// ============================================================================

export const OTHER_TEMPLATES: ListingTemplate[] = [
  // Dons (4)
  {
    title: 'Don vêtements bébé 0-12 mois',
    description: 'Donne lot de vêtements bébé mixte, taille 0 à 12 mois. Bodies, pyjamas, combinaisons. Bon état général. À récupérer sur place. Préférence jeunes parents.',
    category: 'other',
    price: null,
    priceType: 'free',
    imageKeywords: ['clothing'],
  },
  {
    title: 'Récupération gratuite électroménager',
    description: 'Donne lave-vaisselle et four micro-ondes en état de marche. Raison : déménagement. À récupérer avant le 15 du mois. Aide au portage appréciée.',
    category: 'other',
    price: null,
    priceType: 'free',
    imageKeywords: ['electronics'],
  },
  {
    title: 'Don livres scolaires collège',
    description: 'Donne manuels scolaires niveau collège (6ème à 3ème). Programmes récents. Bon état. Mathématiques, français, histoire-géo, sciences.',
    category: 'other',
    price: null,
    priceType: 'free',
    imageKeywords: ['books'],
  },
  {
    title: 'Donne canapé 3 places',
    description: 'Donne canapé 3 places tissu beige. Quelques taches mais fonctionnel. Idéal pour dépannage ou recouvrement. À récupérer avec véhicule adapté.',
    category: 'other',
    price: null,
    priceType: 'free',
    imageKeywords: ['furniture'],
  },

  // Échanges et trocs (3)
  {
    title: 'Échange Switch contre PS5',
    description: 'Propose échange Nintendo Switch (modèle OLED) avec 5 jeux contre PlayStation 5. Switch en excellent état, sous garantie. Échange en main propre uniquement.',
    category: 'other',
    price: null,
    priceType: 'negotiable',
    imageKeywords: ['electronics'],
  },
  {
    title: 'Troc cours de piano contre anglais',
    description: 'Professeur de piano propose d\'échanger des cours contre des cours d\'anglais conversationnel. 1h pour 1h, une fois par semaine. Niveau intermédiaire recherché.',
    category: 'other',
    price: null,
    priceType: 'free',
    imageKeywords: ['music'],
  },
  {
    title: 'Échange plantes vertes',
    description: 'Passionné de plantes propose boutures et échanges : monstera, pothos, philodendron. Ouvert à toutes variétés. Agrandissons nos collections ensemble !',
    category: 'other',
    price: null,
    priceType: 'free',
    imageKeywords: ['gardening'],
  },

  // Services animaliers (3)
  {
    title: 'Garde de chien pendant vacances',
    description: 'Propose garde de votre chien pendant vos vacances. Maison avec jardin clos. Promenades quotidiennes, beaucoup de câlins. Expérience avec toutes races. Tarif selon durée.',
    category: 'other',
    price: 20,
    priceType: 'fixed',
    imageKeywords: ['pets'],
  },
  {
    title: 'Promenade de chiens quotidienne',
    description: 'Amoureux des animaux propose promenades quotidiennes de votre chien. Sortie de 30min à 1h selon besoins. Quartier centre-ville et parc municipal. Groupe max 3 chiens.',
    category: 'other',
    price: 10,
    priceType: 'fixed',
    imageKeywords: ['pets'],
  },
  {
    title: 'Cat-sitter à domicile',
    description: 'Cat-sitter expérimentée propose de s\'occuper de votre chat chez vous. Visite quotidienne : nourriture, litière, jeux, câlins. Photos et nouvelles envoyées. Tarif à la semaine.',
    category: 'other',
    price: 15,
    priceType: 'fixed',
    imageKeywords: ['pets'],
  },
]

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Retourne tous les templates d'annonces
 */
export function getAllTemplates(): ListingTemplate[] {
  return [
    ...SERVICE_TEMPLATES,
    ...PRODUCT_TEMPLATES,
    ...JOB_TEMPLATES,
    ...OTHER_TEMPLATES,
  ]
}

/**
 * Retourne une ville aléatoire
 */
export function getRandomCity(): string {
  return FRENCH_CITIES[Math.floor(Math.random() * FRENCH_CITIES.length)]
}

/**
 * Retourne des images pour une catégorie de keywords
 */
export function getImagesForKeywords(keywords: string[]): UnsplashImage[] {
  for (const keyword of keywords) {
    if (UNSPLASH_IMAGES[keyword]) {
      return UNSPLASH_IMAGES[keyword]
    }
  }
  // Fallback par catégorie générale
  return UNSPLASH_IMAGES.office || []
}

/**
 * Retourne 1-3 images aléatoires pour un template
 */
export function getRandomImagesForTemplate(template: ListingTemplate): UnsplashImage[] {
  const availableImages = getImagesForKeywords(template.imageKeywords)
  const numImages = Math.floor(Math.random() * 3) + 1 // 1 à 3 images
  
  // Mélanger et prendre les N premières
  const shuffled = [...availableImages].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(numImages, shuffled.length))
}

/**
 * Statistiques des templates
 */
export const TEMPLATE_STATS = {
  services: SERVICE_TEMPLATES.length,
  products: PRODUCT_TEMPLATES.length,
  jobs: JOB_TEMPLATES.length,
  others: OTHER_TEMPLATES.length,
  total: SERVICE_TEMPLATES.length + PRODUCT_TEMPLATES.length + JOB_TEMPLATES.length + OTHER_TEMPLATES.length,
}

// Vérification que nous avons bien 100+ annonces
console.assert(TEMPLATE_STATS.total >= 100, `Seulement ${TEMPLATE_STATS.total} templates, 100 minimum requis`)

