/**
 * Taxonomie complète de la plateforme Tuge
 * 
 * Définit tous les types de produits et services avec leurs attributs spécifiques
 */

// ============================================================================
// Types de base
// ============================================================================

export type MainCategory = 'product' | 'service' | 'freelance'

// ============================================================================
// PRODUITS - Sous-catégories
// ============================================================================

export type ProductCategory =
  | 'mode_accessories'
  | 'beauty_wellness'
  | 'home_decoration'
  | 'hightech_electronics'
  | 'auto_moto'
  | 'children_family'
  | 'food_local'

// ============================================================================
// SERVICES - Sous-catégories
// ============================================================================

export type ServiceCategory =
  | 'professional_services'
  | 'digital_tech'
  | 'training_coaching'
  | 'home_services'
  | 'auto_services'
  | 'events'
  | 'travel_leisure'
  | 'community_cultural'

// ============================================================================
// Taxonomie détaillée
// ============================================================================

export interface TaxonomyNode {
  id: string
  label: string
  parent?: string
  keywords: string[]
  specificFields: string[] // Champs spécifiques à collecter
}

/**
 * Taxonomie complète de tous les produits et services
 */
export const TAXONOMY: Record<string, TaxonomyNode> = {
  // ===========================================================================
  // PRODUITS
  // ===========================================================================
  
  'mode_accessories': {
    id: 'mode_accessories',
    label: 'Mode & Accessoires',
    parent: 'product',
    keywords: ['vêtements', 'chaussures', 'sac', 'bijoux', 'montre', 'lunettes', 'mode', 'fashion', 'robe', 'pantalon', 'chemise', 'pull'],
    specificFields: ['taille', 'couleur', 'marque', 'matière', 'genre', 'état', 'saison'],
  },
  
  'beauty_wellness': {
    id: 'beauty_wellness',
    label: 'Beauté & Bien-être',
    parent: 'product',
    keywords: ['cosmétique', 'parfum', 'soin', 'beauté', 'cheveux', 'maquillage', 'bio', 'naturel', 'crème', 'shampoing'],
    specificFields: ['marque', 'contenance', 'type_peau', 'bio', 'vegan', 'date_expiration', 'neuf_scelle'],
  },
  
  'home_decoration': {
    id: 'home_decoration',
    label: 'Maison & Décoration',
    parent: 'product',
    keywords: ['meuble', 'décoration', 'électroménager', 'linge', 'bricolage', 'jardin', 'maison', 'table', 'chaise', 'canapé', 'lit'],
    specificFields: ['dimensions', 'matière', 'couleur', 'style', 'état', 'montage_requis', 'marque'],
  },
  
  'hightech_electronics': {
    id: 'hightech_electronics',
    label: 'High-tech & Électronique',
    parent: 'product',
    keywords: ['téléphone', 'ordinateur', 'tablette', 'audio', 'vidéo', 'gaming', 'console', 'tech', 'iphone', 'samsung', 'laptop', 'pc'],
    specificFields: ['marque', 'modèle', 'année', 'stockage', 'ram', 'état', 'garantie', 'accessoires', 'boite_origine', 'imei'],
  },
  
  'auto_moto': {
    id: 'auto_moto',
    label: 'Auto, Moto & Mobilité',
    parent: 'product',
    keywords: ['voiture', 'moto', 'scooter', 'vélo', 'trottinette', 'véhicule', 'auto', 'pièce', 'nissan', 'renault', 'peugeot', 'citroën', 'bmw', 'mercedes'],
    specificFields: [
      'marque', 'modèle', 'finition', 'année', 'mois', 'vin', 'immatriculation',
      'pays_immatriculation', 'type_véhicule', 'portes', 'places',
      'carburant', 'cylindrée', 'puissance_fiscale', 'puissance_din',
      'transmission', 'rapports', 'drivetrain', 'norme_euro',
      'kilométrage', 'usage', 'historique_km', 'importé', 'propriétaires_précédents',
      'état_général', 'état_mécanique', 'état_carrosserie', 'état_intérieur',
      'accidenté', 'défauts', 'roulant',
      'carnet_entretien', 'factures', 'dernière_révision', 'prochaine_révision',
      'distribution_faite', 'contrôle_technique_valide', 'contrôle_technique_expiration',
      'garantie', 'type_garantie',
      'équipements_sécurité', 'équipements_confort', 'équipements_multimédia', 'équipements_extérieur',
      'prix_négociable', 'tva_récupérable', 'modalités_paiement', 'reprise_possible', 'échange_accepté'
    ],
  },
  
  'children_family': {
    id: 'children_family',
    label: 'Enfants & Famille',
    parent: 'product',
    keywords: ['jouet', 'bébé', 'enfant', 'poussette', 'jeu', 'scolaire', 'éducatif', 'naissance', 'puériculture'],
    specificFields: ['âge_recommandé', 'état', 'sécurité_normes', 'marque', 'complet'],
  },
  
  'food_local': {
    id: 'food_local',
    label: 'Alimentation & Produits locaux',
    parent: 'product',
    keywords: ['alimentation', 'nourriture', 'produit', 'africain', 'artisanal', 'épicerie', 'boisson', 'local', 'bio', 'cuisine'],
    specificFields: ['origine', 'bio', 'date_expiration', 'poids', 'conservation', 'allergènes', 'certifications'],
  },
  
  // ===========================================================================
  // SERVICES
  // ===========================================================================
  
  'professional_services': {
    id: 'professional_services',
    label: 'Services professionnels',
    parent: 'service',
    keywords: ['conseil', 'comptabilité', 'juridique', 'administratif', 'entreprise', 'gestion', 'RH', 'consultant', 'avocat', 'expert-comptable'],
    specificFields: ['expertise', 'diplômes', 'expérience', 'tarif', 'type_tarif', 'zone', 'disponibilité', 'à_distance'],
  },
  
  'digital_tech': {
    id: 'digital_tech',
    label: 'Digital & Tech',
    parent: 'service',
    keywords: ['site web', 'développement', 'design', 'vidéo', 'marketing', 'seo', 'no-code', 'graphisme', 'développeur', 'designer'],
    specificFields: ['spécialité', 'portfolio', 'technologies', 'tarif', 'type_tarif', 'délai', 'à_distance'],
  },
  
  'training_coaching': {
    id: 'training_coaching',
    label: 'Formation & Coaching',
    parent: 'service',
    keywords: ['formation', 'coaching', 'cours', 'soutien', 'mentorat', 'apprentissage', 'enseignement', 'professeur', 'coach', 'formateur'],
    specificFields: ['domaine', 'niveau', 'format', 'durée', 'tarif', 'type_tarif', 'certifications', 'à_distance'],
  },
  
  'home_services': {
    id: 'home_services',
    label: 'Services à domicile',
    parent: 'service',
    keywords: ['ménage', 'bricolage', 'jardinage', 'déménagement', 'garde', 'aide', 'domicile', 'nettoyage', 'réparation'],
    specificFields: ['type_service', 'zone', 'disponibilité', 'tarif', 'type_tarif', 'matériel_fourni', 'assurance'],
  },
  
  'auto_services': {
    id: 'auto_services',
    label: 'Services automobiles',
    parent: 'service',
    keywords: ['voiture', 'auto', 'mécanique', 'entretien', 'réparation', 'expertise', 'véhicule', 'garage', 'mécanicien'],
    specificFields: ['spécialité', 'marques_traitées', 'zone', 'déplacement', 'tarif', 'type_tarif', 'garantie'],
  },
  
  'events': {
    id: 'events',
    label: 'Événementiel',
    parent: 'service',
    keywords: ['événement', 'mariage', 'décoration', 'animation', 'DJ', 'photographe', 'fête', 'organisation', 'traiteur'],
    specificFields: ['type_événement', 'capacité', 'zone', 'matériel_inclus', 'tarif', 'type_tarif', 'portfolio'],
  },
  
  'travel_leisure': {
    id: 'travel_leisure',
    label: 'Voyage & Loisirs',
    parent: 'service',
    keywords: ['voyage', 'billet', 'hébergement', 'location', 'guide', 'tourisme', 'activité', 'loisirs', 'vacances'],
    specificFields: ['destination', 'durée', 'capacité', 'inclus', 'tarif', 'type_tarif', 'saison'],
  },
  
  'community_cultural': {
    id: 'community_cultural',
    label: 'Services communautaires & culturels',
    parent: 'service',
    keywords: ['communauté', 'culturel', 'religieux', 'social', 'accompagnement', 'tradition', 'association', 'entraide'],
    specificFields: ['type_service', 'communauté', 'langues', 'zone', 'tarif', 'type_tarif'],
  },
  
  // ===========================================================================
  // FREELANCE
  // ===========================================================================
  
  'freelance_mission': {
    id: 'freelance_mission',
    label: 'Mission freelance',
    parent: 'freelance',
    keywords: ['mission', 'freelance', 'prestation', 'contrat', 'ponctuel', 'B2B', 'B2C', 'indépendant', 'consultant'],
    specificFields: ['type_mission', 'durée', 'à_distance', 'compétences', 'tarif', 'type_tarif', 'disponibilité'],
  },
}

/**
 * Trouve la catégorie la plus pertinente selon les mots-clés
 */
export function detectCategory(text: string): { 
  mainCategory: MainCategory
  subCategory: string
  confidence: number 
} {
  const lowerText = text.toLowerCase()
  let bestMatch: { category: string; score: number } | null = null
  
  for (const [key, node] of Object.entries(TAXONOMY)) {
    let score = 0
    for (const keyword of node.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        score += 1
      }
    }
    
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { category: key, score }
    }
  }
  
  if (!bestMatch) {
    return { mainCategory: 'product', subCategory: 'other', confidence: 0 }
  }
  
  const node = TAXONOMY[bestMatch.category]
  const confidence = Math.min(bestMatch.score / 3, 1) // Normaliser
  
  return {
    mainCategory: (node.parent || 'product') as MainCategory,
    subCategory: bestMatch.category,
    confidence,
  }
}

/**
 * Retourne les champs spécifiques à collecter pour une catégorie
 */
export function getSpecificFields(subCategory: string): string[] {
  return TAXONOMY[subCategory]?.specificFields || []
}

/**
 * Retourne le label lisible d'une catégorie
 */
export function getCategoryLabel(subCategory: string): string {
  return TAXONOMY[subCategory]?.label || subCategory
}


