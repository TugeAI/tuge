/**
 * Router pour l'Agent Principal
 * 
 * Responsable de :
 * - Analyser l'intention de l'utilisateur
 * - Décider quels sous-agents consulter
 * - Définir l'ordre d'exécution (parallèle ou séquentiel)
 */

import type {
  SubAgentType,
  SubAgentContext,
  RoutingDecision,
  ResponsePriority,
} from '../sub-agents/types'

// ============================================================================
// Types pour le routing
// ============================================================================

/**
 * Intent détecté avec son score de confiance
 */
export interface DetectedIntent {
  name: string
  confidence: number
  keywords: string[]
}

/**
 * Règle de routage
 */
interface RoutingRule {
  /** Patterns qui déclenchent cette règle */
  patterns: RegExp[]
  /** Mots-clés associés */
  keywords: string[]
  /** Sous-agents à consulter */
  targetAgents: SubAgentType[]
  /** Mode d'exécution */
  executionMode: 'parallel' | 'sequential'
  /** Priorité */
  priority: ResponsePriority
  /** Nom de l'intent */
  intentName: string
}

// ============================================================================
// Règles de routage prédéfinies
// ============================================================================

/**
 * Règles de routage pour les différents cas d'usage
 */
const ROUTING_RULES: RoutingRule[] = [
  // === Vente de produit/service → Product Identifier en premier ===
  {
    patterns: [
      /vendre\s+(mon|ma|mes)/i,
      /je\s+veux\s+vendre/i,
      /à\s+vendre\s*:/i,
      /proposer\s+(mon|ma|mes)\s+(service|produit)/i,
      /mettre\s+en\s+vente/i,
    ],
    keywords: ['vendre', 'vente', 'proposer', 'à vendre'],
    targetAgents: ['product_identifier', 'marketing'],
    executionMode: 'sequential', // Product Identifier d'abord, puis Marketing
    priority: 'critical',
    intentName: 'sell_product_or_service',
  },

  // === Création/amélioration d'annonces → Marketing ===
  {
    patterns: [
      /améliore[rz]?\s+(le\s+)?titre/i,
      /meilleur\s+titre/i,
      /optimise[rz]?\s+(la\s+)?description/i,
      /réécrire?\s+(mon\s+)?annonce/i,
      /copywriting/i,
      /accroche/i,
      /hook/i,
    ],
    keywords: ['titre', 'description', 'annonce', 'améliorer', 'optimiser', 'réécrire'],
    targetAgents: ['marketing'],
    executionMode: 'parallel',
    priority: 'high',
    intentName: 'improve_listing_content',
  },

  // === Analyse d'image → Vision ===
  {
    patterns: [
      /analyse[rz]?\s+(cette\s+)?image/i,
      /photo\s+de\s+(mon\s+)?produit/i,
      /carte\s+de\s+visite/i,
      /menu\s+du\s+restaurant/i,
      /qu['']est-ce\s+qu[e']\s*il\s+y\s+a\s+(sur|dans)/i,
      /extraire?\s+(le\s+)?texte/i,
      /ocr/i,
    ],
    keywords: ['image', 'photo', 'carte', 'menu', 'analyser', 'extraire', 'ocr'],
    targetAgents: ['vision'],
    executionMode: 'parallel',
    priority: 'medium',
    intentName: 'analyze_image',
  },

  // === Questions de prix → Vente ===
  {
    patterns: [
      /quel\s+prix\s+(fixer|mettre)/i,
      /combien\s+(je\s+peux\s+)?vendre/i,
      /prix\s+(du\s+)?march[ée]/i,
      /estim(er|ation)\s+du\s+prix/i,
      /trop\s+cher/i,
      /pas\s+assez\s+cher/i,
    ],
    keywords: ['prix', 'vendre', 'estimation', 'marché', 'cher'],
    targetAgents: ['sales'],
    executionMode: 'parallel',
    priority: 'medium',
    intentName: 'price_advice',
  },

  // === Questions fiscales/légales → Compta ===
  {
    patterns: [
      /d[ée]clar(er|ation)/i,
      /imp[oô]t/i,
      /tva/i,
      /facture/i,
      /auto[- ]?entrepreneur/i,
      /micro[- ]?entreprise/i,
      /statut\s+(juridique|fiscal)/i,
    ],
    keywords: ['impôt', 'tva', 'déclaration', 'facture', 'fiscal', 'juridique'],
    targetAgents: ['accounting'],
    executionMode: 'parallel',
    priority: 'medium',
    intentName: 'tax_legal_advice',
  },

  // === Création complète d'annonce → Product Identifier + Marketing ===
  {
    patterns: [
      /cr[ée](er|e)\s+(une\s+)?annonce/i,
      /publier\s+(une\s+)?offre/i,
      /nouvelle\s+annonce/i,
    ],
    keywords: ['créer', 'annonce', 'publier', 'nouvelle'],
    targetAgents: ['product_identifier', 'marketing'],
    executionMode: 'sequential',
    priority: 'high',
    intentName: 'create_listing',
  },

  // === Conversion/vente → Vente + Marketing ===
  {
    patterns: [
      /comment\s+vendre\s+plus/i,
      /augmenter\s+(mes\s+)?ventes/i,
      /am[ée]liorer\s+(la\s+)?conversion/i,
      /personne\s+ne\s+(m[''])?ach[eè]te/i,
      /pas\s+de\s+ventes?/i,
    ],
    keywords: ['vendre', 'ventes', 'conversion', 'acheter'],
    targetAgents: ['sales', 'marketing'],
    executionMode: 'parallel',
    priority: 'high',
    intentName: 'improve_sales',
  },
]

// ============================================================================
// Classe Router
// ============================================================================

/**
 * Router intelligent pour l'orchestrateur
 */
export class Router {
  private rules: RoutingRule[]

  constructor(customRules?: RoutingRule[]) {
    this.rules = customRules || ROUTING_RULES
  }

  /**
   * Analyse l'input et détermine l'intention
   */
  detectIntent(input: string): DetectedIntent | null {
    const lowerInput = input.toLowerCase()
    let bestMatch: { rule: RoutingRule; score: number } | null = null

    for (const rule of this.rules) {
      let score = 0

      // Score basé sur les patterns (priorité haute)
      for (const pattern of rule.patterns) {
        if (pattern.test(input)) {
          score += 10
        }
      }

      // Score basé sur les keywords
      for (const keyword of rule.keywords) {
        if (lowerInput.includes(keyword.toLowerCase())) {
          score += 2
        }
      }

      // Garder le meilleur match
      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { rule, score }
      }
    }

    if (!bestMatch) {
      return null
    }

    // Normaliser le score en confiance (0-1)
    const maxPossibleScore = bestMatch.rule.patterns.length * 10 + bestMatch.rule.keywords.length * 2
    const confidence = Math.min(bestMatch.score / maxPossibleScore, 1)

    return {
      name: bestMatch.rule.intentName,
      confidence,
      keywords: bestMatch.rule.keywords.filter(k => lowerInput.includes(k.toLowerCase())),
    }
  }

  /**
   * Détermine la décision de routage basée sur l'input
   */
  route(input: string, context: SubAgentContext): RoutingDecision {
    const intent = this.detectIntent(input)

    // Si aucune intention détectée, pas de sous-agent
    if (!intent) {
      return {
        targetAgents: [],
        intent: 'general_conversation',
        rationale: 'Conversation générale, pas de sous-agent spécialisé nécessaire',
        executionMode: 'parallel',
        priority: 'low',
      }
    }

    // Trouver la règle correspondante
    const matchingRule = this.rules.find(r => r.intentName === intent.name)

    if (!matchingRule) {
      return {
        targetAgents: [],
        intent: intent.name,
        rationale: 'Intention détectée mais pas de règle de routage',
        executionMode: 'parallel',
        priority: 'low',
      }
    }

    // Construire la décision
    return {
      targetAgents: matchingRule.targetAgents,
      intent: intent.name,
      rationale: `Intent "${intent.name}" détecté avec confiance ${(intent.confidence * 100).toFixed(0)}%`,
      executionMode: matchingRule.executionMode,
      priority: matchingRule.priority,
    }
  }

  /**
   * Vérifie si un message contient une image (pour le routing vers Vision)
   */
  hasImageContent(input: string, metadata?: Record<string, unknown>): boolean {
    // Vérifier dans les métadonnées
    if (metadata?.hasImage || metadata?.imageUrl || metadata?.imageBase64) {
      return true
    }

    // Vérifier les patterns dans le texte
    const imagePatterns = [
      /\[image\]/i,
      /\[photo\]/i,
      /data:image\//i,
      /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/i,
    ]

    return imagePatterns.some(p => p.test(input))
  }

  /**
   * Ajoute le sous-agent Vision si une image est détectée
   */
  enhanceWithVision(
    decision: RoutingDecision,
    input: string,
    metadata?: Record<string, unknown>
  ): RoutingDecision {
    if (this.hasImageContent(input, metadata) && !decision.targetAgents.includes('vision')) {
      return {
        ...decision,
        targetAgents: ['vision', ...decision.targetAgents],
        rationale: `${decision.rationale} + image détectée`,
      }
    }

    return decision
  }

  /**
   * Retourne les règles de routage (pour debug/admin)
   */
  getRules(): RoutingRule[] {
    return [...this.rules]
  }
}

// Instance singleton par défaut
export const defaultRouter = new Router()




