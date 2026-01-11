/**
 * Intent Router pour les opérations sur les Listings
 * 
 * Classifie les intentions utilisateur en catégories d'actions :
 * - LIST_LISTINGS : afficher toutes les annonces
 * - FILTER_LISTINGS : rechercher/filtrer des annonces
 * - ACTIVATE_LISTING : publier un brouillon ou réactiver une annonce
 * - DELETE_DRAFTS : supprimer tous les brouillons
 * - DELETE_ONE_DRAFT : supprimer un brouillon spécifique
 * - CREATE_DRAFT : créer une nouvelle annonce
 * - UPDATE_DRAFT : modifier une annonce existante
 * - UNKNOWN : intention non reconnue
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Types d'intentions pour les opérations listings
 */
export type ListingIntent =
  | 'LIST_LISTINGS'
  | 'FILTER_LISTINGS'
  | 'ACTIVATE_LISTING'
  | 'DELETE_DRAFTS'
  | 'DELETE_ONE_DRAFT'
  | 'CREATE_DRAFT'
  | 'UPDATE_DRAFT'
  | 'UNKNOWN'

/**
 * Résultat de la classification d'intention
 */
export interface IntentClassification {
  /** L'intention détectée */
  intent: ListingIntent
  /** Score de confiance (0-1) */
  confidence: number
  /** Paramètres extraits du message */
  params: IntentParams
  /** Patterns qui ont matché */
  matchedPatterns: string[]
}

/**
 * Paramètres extraits selon l'intention
 */
export interface IntentParams {
  /** Requête de recherche (pour FILTER_LISTINGS) */
  query?: string
  /** Filtre de statut */
  statusFilter?: 'active' | 'inactive' | 'draft' | 'all'
  /** Catégorie de produit détectée */
  categoryHint?: string
  /** Titre/nom ciblé (pour ACTIVATE, DELETE_ONE) */
  targetTitle?: string
  /** Mots-clés détectés */
  keywords: string[]
}

// ============================================================================
// Patterns de détection
// ============================================================================

interface IntentPattern {
  intent: ListingIntent
  patterns: RegExp[]
  keywords: string[]
  priority: number
}

/**
 * Patterns pour détecter les intentions
 * Ordonnés par priorité (plus haut = vérifié en premier)
 */
const INTENT_PATTERNS: IntentPattern[] = [
  // DELETE_DRAFTS - Suppression en masse des brouillons
  {
    intent: 'DELETE_DRAFTS',
    patterns: [
      /supprim(e|er?)?\s+(tous?\s+)?(les\s+|mes\s+)?brouillons?/i,
      /efface[rz]?\s+(tous?\s+)?(les\s+|mes\s+)?brouillons?/i,
      /nettoie[rz]?\s+(les\s+|mes\s+)?brouillons?/i,
      /purge[rz]?\s+(les\s+|mes\s+)?brouillons?/i,
      /vide[rz]?\s+(les\s+|mes\s+)?brouillons?/i,
      /supprim(e|er?)?\s+tout(es?)?\s+(les\s+)?brouillons?/i,
    ],
    keywords: ['supprimer', 'brouillons', 'tous', 'nettoyer', 'purger', 'effacer'],
    priority: 100,
  },

  // DELETE_ONE_DRAFT - Suppression d'un brouillon spécifique
  {
    intent: 'DELETE_ONE_DRAFT',
    patterns: [
      /supprim(e|er?)?\s+(le\s+)?brouillon\s+["']?([^"']+)["']?/i,
      /efface[rz]?\s+(le\s+)?brouillon\s+["']?([^"']+)["']?/i,
      /supprim(e|er?)?\s+["']?([^"']+)["']?\s+\(brouillon\)/i,
      /retire[rz]?\s+(le\s+)?brouillon/i,
    ],
    keywords: ['supprimer', 'brouillon', 'effacer', 'retirer'],
    priority: 95,
  },

  // ACTIVATE_LISTING - Activer/publier une annonce
  {
    intent: 'ACTIVATE_LISTING',
    patterns: [
      /active[rz]?\s+(l['']?annonce\s+)?["']?([^"']+)["']?/i,
      /publie[rz]?\s+(l['']?annonce\s+)?["']?([^"']+)["']?/i,
      /mets?\s+en\s+(ligne|vente)\s+["']?([^"']+)["']?/i,
      /lance[rz]?\s+(l['']?annonce\s+)?["']?([^"']+)["']?/i,
      /active[rz]?\s+(le\s+)?brouillon/i,
      /publie[rz]?\s+(le\s+)?brouillon/i,
      /r[ée]active[rz]?\s+["']?([^"']+)["']?/i,
    ],
    keywords: ['activer', 'publier', 'mettre en ligne', 'lancer', 'réactiver'],
    priority: 90,
  },

  // FILTER_LISTINGS - Recherche/filtrage d'annonces
  {
    intent: 'FILTER_LISTINGS',
    patterns: [
      /annonces?\s+(d['']?)?iphone/i,
      /annonces?\s+(de\s+)?t[ée]l[ée]phones?/i,
      /annonces?\s+(de\s+)?samsung/i,
      /(uniquement|seulement)\s+(les\s+)?t[ée]l[ée]phones?/i,
      /(uniquement|seulement)\s+(les\s+)?(annonces?\s+)?activ(es?|ées?)/i,
      /(uniquement|seulement)\s+(les\s+)?(annonces?\s+)?en\s+vente/i,
      /annonces?\s+activ(es?|ées?)/i,
      /annonces?\s+en\s+vente/i,
      /cherche[rz]?\s+(dans\s+)?(mes\s+)?annonces?/i,
      /filtre[rz]?\s+(mes\s+)?annonces?/i,
      /montre[z-]?moi\s+(les\s+)?annonces?\s+(de\s+|d[''])?/i,
      /affiche[rz]?\s+(les\s+)?annonces?\s+(de\s+|d[''])?/i,
    ],
    keywords: ['iphone', 'samsung', 'téléphone', 'actives', 'en vente', 'filtre', 'cherche'],
    priority: 80,
  },

  // LIST_LISTINGS - Lister toutes les annonces
  {
    intent: 'LIST_LISTINGS',
    patterns: [
      /^(mes\s+)?annonces?$/i,
      /liste[rz]?\s+(mes\s+)?annonces?/i,
      /voir\s+(mes\s+)?annonces?/i,
      /affiche[rz]?\s+(mes\s+)?annonces?/i,
      /montre[z-]?moi\s+(mes\s+)?annonces?$/i,
      /qu['']?est-ce\s+que\s+j['']?ai\s+(en\s+vente|publi[ée])/i,
      /mes\s+ventes?/i,
      /mes\s+publications?/i,
      /combien\s+(d['']?)?annonces?/i,
      /j['']?ai\s+quoi\s+en\s+vente/i,
      /mes\s+brouillons?$/i,
      /voir\s+(mes\s+)?brouillons?/i,
    ],
    keywords: ['annonces', 'voir', 'liste', 'ventes', 'publications', 'brouillons'],
    priority: 70,
  },

  // CREATE_DRAFT - Créer une annonce
  {
    intent: 'CREATE_DRAFT',
    patterns: [
      /cr[ée]e[rz]?\s+(une\s+)?annonce/i,
      /nouvelle\s+annonce/i,
      /je\s+veux\s+vendre/i,
      /je\s+vends?/i,
      /proposer?\s+(un\s+)?service/i,
      /mettre\s+en\s+vente/i,
      /publier\s+(une\s+)?annonce/i,
    ],
    keywords: ['créer', 'nouvelle', 'vendre', 'proposer', 'publier'],
    priority: 60,
  },

  // UPDATE_DRAFT - Modifier une annonce
  {
    intent: 'UPDATE_DRAFT',
    patterns: [
      /modifie[rz]?\s+(l['']?annonce|le\s+brouillon)/i,
      /change[rz]?\s+(le\s+)?(prix|titre|description)/i,
      /met[sz]?\s+[àa]\s+jour/i,
      /[ée]dite[rz]?\s+(l['']?annonce|le\s+brouillon)/i,
      /ajuste[rz]?\s+(le\s+)?prix/i,
    ],
    keywords: ['modifier', 'changer', 'mettre à jour', 'éditer', 'ajuster'],
    priority: 50,
  },
]

// ============================================================================
// Détection de catégorie/produit
// ============================================================================

/**
 * Mots-clés pour détecter la catégorie de produit
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  phone: ['iphone', 'samsung', 'téléphone', 'smartphone', 'mobile', 'huawei', 'xiaomi', 'pixel'],
  electronics: ['ordinateur', 'laptop', 'pc', 'tablette', 'ipad', 'macbook', 'écran', 'tv', 'console'],
  vehicle: ['voiture', 'auto', 'moto', 'vélo', 'scooter', 'véhicule'],
  furniture: ['meuble', 'table', 'chaise', 'canapé', 'lit', 'armoire', 'bureau'],
  clothing: ['vêtement', 'robe', 'pantalon', 'veste', 'chaussure', 'sac'],
  service: ['service', 'prestation', 'cours', 'formation', 'coaching', 'jardinage', 'plomberie'],
}

/**
 * Détecte la catégorie probable à partir du message
 */
function detectCategory(message: string): string | undefined {
  const lowerMessage = message.toLowerCase()
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        return category
      }
    }
  }
  
  return undefined
}

/**
 * Extrait les mots-clés de recherche du message
 */
function extractSearchQuery(message: string, intent: ListingIntent): string | undefined {
  const lowerMessage = message.toLowerCase()
  
  // Pour FILTER_LISTINGS, extraire le terme de recherche
  if (intent === 'FILTER_LISTINGS') {
    // Patterns pour extraire le terme de recherche
    const queryPatterns = [
      /annonces?\s+(d['']?|de\s+)?([a-zéèêëàâäùûüôöîï0-9\s]+)/i,
      /(uniquement|seulement)\s+(les\s+)?([a-zéèêëàâäùûüôöîï0-9\s]+)/i,
      /cherche[rz]?\s+([a-zéèêëàâäùûüôöîï0-9\s]+)/i,
    ]
    
    for (const pattern of queryPatterns) {
      const match = message.match(pattern)
      if (match) {
        // Prendre le dernier groupe capturé (le terme de recherche)
        const query = match[match.length - 1]?.trim()
        if (query && query.length > 1) {
          // Nettoyer les mots inutiles
          const cleaned = query
            .replace(/^(les?|des?|mes?|en\s+vente|activ[eé]s?)\s*/gi, '')
            .trim()
          if (cleaned.length > 1) {
            return cleaned
          }
        }
      }
    }
  }
  
  return undefined
}

/**
 * Extrait le titre ciblé du message (pour ACTIVATE, DELETE_ONE)
 */
function extractTargetTitle(message: string, intent: ListingIntent): string | undefined {
  if (intent !== 'ACTIVATE_LISTING' && intent !== 'DELETE_ONE_DRAFT') {
    return undefined
  }
  
  // Patterns pour extraire le titre
  const titlePatterns = [
    /["']([^"']+)["']/,                                    // Entre guillemets
    /active[rz]?\s+(?:l['']?annonce\s+)?([^,.!?]+)/i,     // Après "active"
    /publie[rz]?\s+(?:l['']?annonce\s+)?([^,.!?]+)/i,     // Après "publie"
    /supprim(?:e|er?)?\s+(?:le\s+)?brouillon\s+([^,.!?]+)/i, // Après "supprime brouillon"
  ]
  
  for (const pattern of titlePatterns) {
    const match = message.match(pattern)
    if (match && match[1]) {
      const title = match[1].trim()
      // Ignorer les titres trop courts ou qui sont des mots-clés
      if (title.length > 2 && !['le', 'la', 'les', 'un', 'une', 'des'].includes(title.toLowerCase())) {
        return title
      }
    }
  }
  
  return undefined
}

/**
 * Détecte le filtre de statut implicite dans le message
 */
function detectStatusFilter(message: string): IntentParams['statusFilter'] {
  const lowerMessage = message.toLowerCase()
  
  if (/brouillons?/.test(lowerMessage)) {
    return 'draft'
  }
  if (/(activ[eé]s?|en\s+vente|publi[eé]s?)/.test(lowerMessage)) {
    return 'active'
  }
  if (/(inactiv[eé]s?|d[eé]sactiv[eé]s?)/.test(lowerMessage)) {
    return 'inactive'
  }
  
  return 'all'
}

// ============================================================================
// Router principal
// ============================================================================

/**
 * Classifie l'intention utilisateur pour les opérations listings
 * 
 * @param message - Le message de l'utilisateur
 * @returns Classification avec intention, confiance et paramètres
 */
export function classifyListingIntent(message: string): IntentClassification {
  const lowerMessage = message.toLowerCase().trim()
  const matchedPatterns: string[] = []
  
  let bestMatch: { intent: ListingIntent; score: number } | null = null
  
  // Trier les patterns par priorité décroissante
  const sortedPatterns = [...INTENT_PATTERNS].sort((a, b) => b.priority - a.priority)
  
  for (const intentPattern of sortedPatterns) {
    let score = 0
    
    // Vérifier les patterns regex (poids élevé)
    for (const pattern of intentPattern.patterns) {
      if (pattern.test(message)) {
        score += 10
        matchedPatterns.push(pattern.source)
      }
    }
    
    // Vérifier les mots-clés (poids moyen)
    for (const keyword of intentPattern.keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        score += 2
      }
    }
    
    // Bonus de priorité
    score += intentPattern.priority / 100
    
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { intent: intentPattern.intent, score }
    }
  }
  
  // Si aucun match, retourner UNKNOWN
  if (!bestMatch) {
    return {
      intent: 'UNKNOWN',
      confidence: 0,
      params: { keywords: [] },
      matchedPatterns: [],
    }
  }
  
  // Calculer la confiance (normalisée entre 0 et 1)
  const maxPossibleScore = 50 // 5 patterns * 10
  const confidence = Math.min(bestMatch.score / maxPossibleScore, 1)
  
  // Extraire les paramètres selon l'intention
  const params: IntentParams = {
    keywords: extractKeywords(message),
    statusFilter: detectStatusFilter(message),
    categoryHint: detectCategory(message),
    query: extractSearchQuery(message, bestMatch.intent),
    targetTitle: extractTargetTitle(message, bestMatch.intent),
  }
  
  return {
    intent: bestMatch.intent,
    confidence,
    params,
    matchedPatterns,
  }
}

/**
 * Extrait les mots-clés significatifs du message
 */
function extractKeywords(message: string): string[] {
  const stopWords = new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'au', 'aux',
    'et', 'ou', 'mais', 'donc', 'car', 'ni', 'que', 'qui', 'quoi',
    'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles',
    'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses',
    'ce', 'cette', 'ces', 'est', 'sont', 'suis', 'es', 'sommes', 'êtes',
    'a', 'ai', 'as', 'avons', 'avez', 'ont',
    'pour', 'dans', 'sur', 'avec', 'sans', 'sous', 'par', 'en',
    'tout', 'tous', 'toute', 'toutes', 'très', 'plus', 'moins',
  ])
  
  const words = message
    .toLowerCase()
    .replace(/[^a-zéèêëàâäùûüôöîï0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
  
  return [...new Set(words)]
}

/**
 * Vérifie si le message est une confirmation (oui/non)
 */
export function isConfirmationResponse(message: string): 'yes' | 'no' | null {
  const lowerMessage = message.toLowerCase().trim()
  
  // Patterns pour "oui"
  const yesPatterns = [
    /^oui$/i,
    /^ok$/i,
    /^d['']?accord$/i,
    /^confirme?$/i,
    /^vas-?y$/i,
    /^c['']?est\s+bon$/i,
    /^parfait$/i,
    /^yes$/i,
    /^yep$/i,
    /^absolument$/i,
    /^exactement$/i,
    /^bien\s+s[ûu]r$/i,
  ]
  
  // Patterns pour "non"
  const noPatterns = [
    /^non$/i,
    /^nope$/i,
    /^annule[rz]?$/i,
    /^stop$/i,
    /^arr[êe]te[rz]?$/i,
    /^pas\s+maintenant$/i,
    /^finalement\s+non$/i,
    /^laisse\s+tomber$/i,
  ]
  
  for (const pattern of yesPatterns) {
    if (pattern.test(lowerMessage)) {
      return 'yes'
    }
  }
  
  for (const pattern of noPatterns) {
    if (pattern.test(lowerMessage)) {
      return 'no'
    }
  }
  
  return null
}

/**
 * Vérifie si le message est une sélection numérique (1, 2, 3...)
 */
export function isNumericSelection(message: string): number | null {
  const trimmed = message.trim()
  
  // Patterns pour sélection numérique
  const numericPatterns = [
    /^(\d+)$/,                          // Juste le numéro
    /^le\s+(\d+)$/i,                    // "le 1"
    /^l['']?option\s+(\d+)$/i,          // "l'option 2"
    /^num[ée]ro\s+(\d+)$/i,             // "numéro 3"
    /^choix\s+(\d+)$/i,                 // "choix 1"
  ]
  
  for (const pattern of numericPatterns) {
    const match = trimmed.match(pattern)
    if (match && match[1]) {
      const num = parseInt(match[1], 10)
      if (num >= 1 && num <= 20) { // Limite raisonnable
        return num
      }
    }
  }
  
  // Mots numériques
  const wordToNumber: Record<string, number> = {
    'premier': 1, 'première': 1, 'un': 1, 'une': 1,
    'deuxième': 2, 'second': 2, 'seconde': 2, 'deux': 2,
    'troisième': 3, 'trois': 3,
    'quatrième': 4, 'quatre': 4,
    'cinquième': 5, 'cinq': 5,
  }
  
  const lowerTrimmed = trimmed.toLowerCase()
  for (const [word, num] of Object.entries(wordToNumber)) {
    if (lowerTrimmed === word || lowerTrimmed === `le ${word}` || lowerTrimmed === `la ${word}`) {
      return num
    }
  }
  
  return null
}

// ============================================================================
// Exports
// ============================================================================

export {
  INTENT_PATTERNS,
  CATEGORY_KEYWORDS,
  detectCategory,
  detectStatusFilter,
}





