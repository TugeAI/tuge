/**
 * Policies de gouvernance pour l'Agent Principal
 * 
 * Définit les règles globales de la plateforme :
 * - Anti-spam basique
 * - Limites de requêtes
 * - Règles de sécurité
 * - Permissions par type d'agent
 */

import type { SubAgentType, SubAgentContext, RoutingDecision } from '../sub-agents/types'

// ============================================================================
// Types pour les policies
// ============================================================================

/**
 * Résultat d'une vérification de policy
 */
export interface PolicyCheckResult {
  allowed: boolean
  reason?: string
  /** Si bloqué, proposer une alternative ? */
  suggestion?: string
}

/**
 * Configuration des limites par type d'agent
 */
export interface AgentLimits {
  /** Nombre max de requêtes par minute */
  maxRequestsPerMinute: number
  /** Nombre max de requêtes par jour */
  maxRequestsPerDay: number
  /** Timeout en ms */
  timeoutMs: number
  /** Coût estimé par requête (pour tracking) */
  estimatedCostPerRequest: number
}

/**
 * Configuration globale des policies
 */
export interface PoliciesConfig {
  /** Activer le mode strict (plus de vérifications) */
  strictMode: boolean
  /** Limites par type d'agent */
  agentLimits: Record<SubAgentType, AgentLimits>
  /** Patterns de spam à bloquer */
  spamPatterns: RegExp[]
  /** Mots interdits */
  blockedTerms: string[]
}

// ============================================================================
// Configuration par défaut
// ============================================================================

/**
 * Limites par défaut pour chaque type de sous-agent
 */
const DEFAULT_AGENT_LIMITS: Record<SubAgentType, AgentLimits> = {
  // Sous-agents métier (plus coûteux)
  marketing: {
    maxRequestsPerMinute: 10,
    maxRequestsPerDay: 100,
    timeoutMs: 15000,
    estimatedCostPerRequest: 0.002,
  },
  sales: {
    maxRequestsPerMinute: 10,
    maxRequestsPerDay: 100,
    timeoutMs: 15000,
    estimatedCostPerRequest: 0.002,
  },
  accounting: {
    maxRequestsPerMinute: 5,
    maxRequestsPerDay: 50,
    timeoutMs: 20000,
    estimatedCostPerRequest: 0.003,
  },
  // Sous-agents techniques (coûts prévisibles)
  vision: {
    maxRequestsPerMinute: 5,
    maxRequestsPerDay: 30,
    timeoutMs: 30000,
    estimatedCostPerRequest: 0.01, // Vision coûte plus cher
  },
  product_identifier: {
    maxRequestsPerMinute: 10,
    maxRequestsPerDay: 100,
    timeoutMs: 20000,
    estimatedCostPerRequest: 0.005,
  },
}

/**
 * Patterns de spam courants
 */
const DEFAULT_SPAM_PATTERNS: RegExp[] = [
  /(.)\1{10,}/i, // Répétition de caractères (aaaaaaaaaa)
  /\b(spam|scam|hack|crack)\b/i,
  /https?:\/\/[^\s]+\.[^\s]+/gi, // Liens suspects multiples
]

/**
 * Termes bloqués (illégaux ou dangereux)
 */
const DEFAULT_BLOCKED_TERMS: string[] = [
  'drogue',
  'arme',
  'contrefaçon',
  'faux papiers',
  'blanchiment',
]

/**
 * Configuration par défaut
 */
export const DEFAULT_POLICIES_CONFIG: PoliciesConfig = {
  strictMode: false,
  agentLimits: DEFAULT_AGENT_LIMITS,
  spamPatterns: DEFAULT_SPAM_PATTERNS,
  blockedTerms: DEFAULT_BLOCKED_TERMS,
}

// ============================================================================
// Classe Policies
// ============================================================================

/**
 * Gestionnaire des policies de gouvernance
 */
export class Policies {
  private config: PoliciesConfig
  private requestCounts: Map<string, { minute: number; day: number; lastReset: number }>

  constructor(config: Partial<PoliciesConfig> = {}) {
    this.config = { ...DEFAULT_POLICIES_CONFIG, ...config }
    this.requestCounts = new Map()
  }

  /**
   * Vérifie si une requête est autorisée selon les policies
   */
  checkRequest(
    input: string,
    context: SubAgentContext,
    targetAgents: SubAgentType[]
  ): PolicyCheckResult {
    // 1. Vérifier le contenu (spam, termes bloqués)
    const contentCheck = this.checkContent(input)
    if (!contentCheck.allowed) {
      return contentCheck
    }

    // 2. Vérifier les limites de rate pour chaque agent ciblé
    for (const agent of targetAgents) {
      const rateLimitCheck = this.checkRateLimit(context.userId || 'anonymous', agent)
      if (!rateLimitCheck.allowed) {
        return rateLimitCheck
      }
    }

    // 3. Vérifier les permissions utilisateur
    const permissionCheck = this.checkPermissions(context, targetAgents)
    if (!permissionCheck.allowed) {
      return permissionCheck
    }

    return { allowed: true }
  }

  /**
   * Vérifie le contenu pour spam et termes bloqués
   */
  private checkContent(input: string): PolicyCheckResult {
    const lowerInput = input.toLowerCase()

    // Vérifier les termes bloqués
    for (const term of this.config.blockedTerms) {
      if (lowerInput.includes(term.toLowerCase())) {
        return {
          allowed: false,
          reason: `Contenu non autorisé détecté`,
          suggestion: 'Veuillez reformuler votre message.',
        }
      }
    }

    // Vérifier les patterns de spam
    for (const pattern of this.config.spamPatterns) {
      if (pattern.test(input)) {
        return {
          allowed: false,
          reason: 'Message détecté comme spam',
          suggestion: 'Veuillez envoyer un message plus naturel.',
        }
      }
    }

    // Vérifier la longueur minimale
    if (input.trim().length < 2) {
      return {
        allowed: false,
        reason: 'Message trop court',
        suggestion: 'Veuillez préciser votre demande.',
      }
    }

    return { allowed: true }
  }

  /**
   * Vérifie les limites de requêtes
   */
  private checkRateLimit(userId: string, agentType: SubAgentType): PolicyCheckResult {
    const limits = this.config.agentLimits[agentType]
    const key = `${userId}:${agentType}`
    const now = Date.now()

    let counts = this.requestCounts.get(key)
    
    // Reset si nouvelle minute/jour
    if (!counts || now - counts.lastReset > 60000) {
      counts = { minute: 0, day: counts?.day || 0, lastReset: now }
    }

    // Vérifier limite par minute
    if (counts.minute >= limits.maxRequestsPerMinute) {
      return {
        allowed: false,
        reason: `Limite atteinte pour ${agentType}`,
        suggestion: 'Veuillez patienter quelques secondes.',
      }
    }

    // Vérifier limite par jour
    if (counts.day >= limits.maxRequestsPerDay) {
      return {
        allowed: false,
        reason: `Limite journalière atteinte pour ${agentType}`,
        suggestion: 'Vous pourrez réessayer demain.',
      }
    }

    // Incrémenter les compteurs
    counts.minute++
    counts.day++
    this.requestCounts.set(key, counts)

    return { allowed: true }
  }

  /**
   * Vérifie les permissions utilisateur
   */
  private checkPermissions(
    context: SubAgentContext,
    targetAgents: SubAgentType[]
  ): PolicyCheckResult {
    // En mode structurel, les permissions sont basiques
    // - Vision nécessite d'être authentifié (coût élevé)
    if (targetAgents.includes('vision') && !context.userId) {
      return {
        allowed: false,
        reason: 'Analyse d\'images réservée aux utilisateurs connectés',
        suggestion: 'Connectez-vous pour utiliser cette fonctionnalité.',
      }
    }

    return { allowed: true }
  }

  /**
   * Retourne les limites pour un type d'agent
   */
  getLimits(agentType: SubAgentType): AgentLimits {
    return this.config.agentLimits[agentType]
  }

  /**
   * Applique une policy sur une décision de routage
   * Peut filtrer ou modifier la décision
   */
  applyToRoutingDecision(
    decision: RoutingDecision,
    context: SubAgentContext
  ): RoutingDecision {
    // En mode non-authentifié, limiter aux agents non coûteux
    if (!context.userId) {
      const filteredAgents = decision.targetAgents.filter(
        agent => !['vision', 'accounting'].includes(agent)
      )
      
      if (filteredAgents.length < decision.targetAgents.length) {
        return {
          ...decision,
          targetAgents: filteredAgents,
          rationale: `${decision.rationale} (filtré: utilisateur non connecté)`,
        }
      }
    }

    return decision
  }

  /**
   * Estime le coût total d'une décision de routage
   */
  estimateCost(targetAgents: SubAgentType[]): number {
    return targetAgents.reduce((total, agent) => {
      return total + this.config.agentLimits[agent].estimatedCostPerRequest
    }, 0)
  }
}

// Instance singleton par défaut
export const defaultPolicies = new Policies()





