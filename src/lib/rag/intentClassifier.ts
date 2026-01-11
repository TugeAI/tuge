/**
 * Classificateur d'intentions utilisateur pour le RAG
 * 
 * Détermine l'intention de l'utilisateur pour sélectionner
 * les collections RAG appropriées.
 */

import type { RAGCollection } from './retriever'

/**
 * Types d'intentions supportées
 */
export type UserIntent =
  | 'search_service'      // Recherche d'un service ou professionnel
  | 'create_listing'      // Création d'une annonce
  | 'understand_platform' // Comprendre le fonctionnement de Tuge
  | 'referral_help'       // Questions sur le parrainage/MLM
  | 'registration'        // Questions sur l'inscription
  | 'pricing'             // Questions sur les prix/crédits
  | 'general'             // Questions générales

/**
 * Résultat de la classification d'intention
 */
export interface IntentClassification {
  intent: UserIntent
  confidence: number
  collections: RAGCollection[]
  keywords: string[]
}

/**
 * Patterns de mots-clés pour chaque intention
 */
const INTENT_PATTERNS: Record<UserIntent, {
  keywords: string[]
  patterns: RegExp[]
  collections: RAGCollection[]
  weight: number
}> = {
  search_service: {
    keywords: [
      'cherche', 'recherche', 'trouver', 'besoin', 'qui peut', 
      'professionnel', 'prestataire', 'service', 'devis',
      'plombier', 'électricien', 'jardinier', 'peintre', 'artisan',
      'coach', 'prof', 'cours', 'aide', 'assistance'
    ],
    patterns: [
      /je\s+cherche/i,
      /je\s+recherche/i,
      /j'ai\s+besoin/i,
      /qui\s+peut/i,
      /où\s+trouver/i,
      /avez[- ]vous/i,
      /connaissez[- ]vous/i,
    ],
    collections: ['listings', 'professionals'],
    weight: 1.0,
  },
  
  create_listing: {
    keywords: [
      'annonce', 'publier', 'poster', 'créer', 'proposer',
      'offre', 'service', 'vendre', 'louer', 'proposer mes services'
    ],
    patterns: [
      /créer\s+une?\s+annonce/i,
      /publier\s+une?\s+annonce/i,
      /proposer\s+mes?\s+services?/i,
      /je\s+propose/i,
      /je\s+veux\s+vendre/i,
      /comment\s+publier/i,
    ],
    collections: ['platform_docs'],
    weight: 1.0,
  },
  
  understand_platform: {
    keywords: [
      'comment', 'fonctionnement', 'fonctionne', 'c\'est quoi',
      'qu\'est-ce', 'expliquer', 'tuge', 'plateforme',
      'marketplace', 'utiliser', 'marche'
    ],
    patterns: [
      /c'est\s+quoi/i,
      /qu'est[- ]ce\s+que/i,
      /comment\s+ça\s+(fonctionne|marche)/i,
      /comment\s+utiliser/i,
      /expliqu(e|ez)[- ]moi/i,
      /à\s+quoi\s+sert/i,
    ],
    collections: ['platform_docs'],
    weight: 0.9,
  },
  
  referral_help: {
    keywords: [
      'parrainage', 'parrain', 'filleul', 'commission', 'gagner',
      'revenus', 'mlm', 'affiliation', 'code parrain', 'inviter',
      'recommander', 'bonus', 'gains'
    ],
    patterns: [
      /parrain(age|er)?/i,
      /filleul/i,
      /commission/i,
      /gagner\s+de\s+l'argent/i,
      /code\s+(de\s+)?parrain/i,
      /inviter\s+(des\s+)?amis/i,
      /système\s+de\s+parrainage/i,
    ],
    collections: ['referral_mlm', 'platform_docs'],
    weight: 1.0,
  },
  
  registration: {
    keywords: [
      'inscription', 'inscrire', 'compte', 'créer compte',
      'enregistrer', 'rejoindre', 's\'inscrire', 'devenir membre'
    ],
    patterns: [
      /m'inscrire/i,
      /créer\s+un?\s+compte/i,
      /comment\s+s'inscrire/i,
      /rejoindre/i,
      /devenir\s+membre/i,
    ],
    collections: ['platform_docs'],
    weight: 0.95,
  },
  
  pricing: {
    keywords: [
      'prix', 'coût', 'tarif', 'crédit', 'crédits', 'gratuit',
      'payer', 'paiement', 'abonnement', 'pack', 'acheter'
    ],
    patterns: [
      /combien\s+(ça\s+)?coûte/i,
      /quel\s+est\s+le\s+prix/i,
      /c'est\s+gratuit/i,
      /comment\s+acheter/i,
      /tarif/i,
    ],
    collections: ['platform_docs'],
    weight: 0.9,
  },
  
  general: {
    keywords: [],
    patterns: [],
    collections: ['platform_docs'],
    weight: 0.5,
  },
}

/**
 * Classifie l'intention de l'utilisateur à partir de son message
 */
export function classifyIntent(message: string): IntentClassification {
  const lowerMessage = message.toLowerCase()
  const scores: Record<UserIntent, { score: number; matchedKeywords: string[] }> = {} as Record<UserIntent, { score: number; matchedKeywords: string[] }>
  
  // Calculer le score pour chaque intention
  for (const [intent, config] of Object.entries(INTENT_PATTERNS) as [UserIntent, typeof INTENT_PATTERNS[UserIntent]][]) {
    let score = 0
    const matchedKeywords: string[] = []
    
    // Vérifier les mots-clés
    for (const keyword of config.keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        score += 1
        matchedKeywords.push(keyword)
      }
    }
    
    // Vérifier les patterns regex (plus de poids)
    for (const pattern of config.patterns) {
      if (pattern.test(message)) {
        score += 2
      }
    }
    
    // Appliquer le poids de l'intention
    score *= config.weight
    
    scores[intent] = { score, matchedKeywords }
  }
  
  // Trouver l'intention avec le meilleur score
  let bestIntent: UserIntent = 'general'
  let bestScore = 0
  
  for (const [intent, { score }] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score
      bestIntent = intent as UserIntent
    }
  }
  
  // Calculer la confiance (normalisée entre 0 et 1)
  const maxPossibleScore = Math.max(
    ...Object.values(INTENT_PATTERNS).map(c => c.keywords.length + c.patterns.length * 2)
  )
  const confidence = Math.min(1, bestScore / Math.max(1, maxPossibleScore / 2))
  
  // Si la confiance est trop basse, utiliser l'intention générale
  if (confidence < 0.2 && bestIntent !== 'general') {
    bestIntent = 'general'
  }
  
  const config = INTENT_PATTERNS[bestIntent]
  
  return {
    intent: bestIntent,
    confidence,
    collections: config.collections,
    keywords: scores[bestIntent]?.matchedKeywords || [],
  }
}

/**
 * Obtient les collections RAG pour une intention donnée
 */
export function getCollectionsForIntent(intent: UserIntent): RAGCollection[] {
  return INTENT_PATTERNS[intent]?.collections || ['platform_docs']
}

/**
 * Enrichit le message avec le contexte de l'intention détectée
 */
export function getIntentContext(classification: IntentClassification): string {
  const contextMap: Record<UserIntent, string> = {
    search_service: "L'utilisateur recherche un service ou un professionnel.",
    create_listing: "L'utilisateur veut créer ou publier une annonce.",
    understand_platform: "L'utilisateur veut comprendre le fonctionnement de Tuge.",
    referral_help: "L'utilisateur a des questions sur le système de parrainage.",
    registration: "L'utilisateur veut s'inscrire ou créer un compte.",
    pricing: "L'utilisateur a des questions sur les prix ou les crédits.",
    general: "Question générale sur la plateforme.",
  }
  
  return contextMap[classification.intent]
}

/**
 * Détermine si le RAG est nécessaire pour cette intention
 */
export function shouldUseRAG(classification: IntentClassification): boolean {
  // Toujours utiliser le RAG sauf pour les salutations simples
  const noRAGPatterns = [
    /^(salut|bonjour|hello|hey|coucou|bonsoir)[\s!.]*$/i,
    /^(merci|thanks|ok|d'accord)[\s!.]*$/i,
    /^(au revoir|bye|à bientôt|à plus)[\s!.]*$/i,
  ]
  
  return !noRAGPatterns.some(p => p.test(classification.keywords.join(' ') || ''))
}

