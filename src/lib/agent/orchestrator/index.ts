/**
 * Agent Principal (Orchestrateur) - Tousgether
 * 
 * RÔLE : Gouverneur du système multi-agents
 * 
 * Responsabilités :
 * - Définir et appliquer les règles globales
 * - Router les requêtes vers les sous-agents appropriés
 * - Superviser l'exécution et collecter les réponses
 * - Logger les décisions (minimal)
 * 
 * RÈGLE D'OR : Ne parle JAMAIS à l'utilisateur
 */

import { Router, defaultRouter, type DetectedIntent } from './router'
import { Policies, defaultPolicies, type PolicyCheckResult } from './policies'
import type {
  SubAgentType,
  SubAgentContext,
  SubAgentRequest,
  SubAgentResponse,
  BusinessSubAgentRequest,
  TechnicalSubAgentRequest,
  RoutingDecision,
  AggregatedResponses,
  AgentRoutingLog,
  isBusinessResponse,
  isTechnicalResponse,
} from '../sub-agents/types'

// ============================================================================
// Types pour l'orchestrateur
// ============================================================================

/**
 * Configuration de l'orchestrateur
 */
export interface OrchestratorConfig {
  /** Activer le logging des décisions */
  enableLogging: boolean
  /** Timeout global en ms */
  globalTimeoutMs: number
  /** Activer le mode debug */
  debug: boolean
}

/**
 * Résultat de l'orchestration
 */
export interface OrchestrationResult {
  /** La requête a-t-elle été acceptée ? */
  accepted: boolean
  /** Raison si refusée */
  rejectionReason?: string
  /** Décision de routage prise */
  routingDecision: RoutingDecision
  /** Réponses agrégées des sous-agents */
  responses: AggregatedResponses
  /** Logs de l'orchestration */
  logs: AgentRoutingLog[]
  /** Métadonnées */
  metadata: {
    totalTimeMs: number
    estimatedCost: number
  }
}

/**
 * Type pour les handlers de sous-agents
 */
export type SubAgentHandler = (request: SubAgentRequest) => Promise<SubAgentResponse>

// ============================================================================
// Configuration par défaut
// ============================================================================

const DEFAULT_CONFIG: OrchestratorConfig = {
  enableLogging: true,
  globalTimeoutMs: 30000,
  debug: process.env.NODE_ENV === 'development',
}

// ============================================================================
// Classe Orchestrator
// ============================================================================

/**
 * Agent Principal - Orchestrateur du système multi-agents
 */
export class Orchestrator {
  private config: OrchestratorConfig
  private router: Router
  private policies: Policies
  private handlers: Map<SubAgentType, SubAgentHandler>
  private logs: AgentRoutingLog[]

  constructor(
    config: Partial<OrchestratorConfig> = {},
    router?: Router,
    policies?: Policies
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.router = router || defaultRouter
    this.policies = policies || defaultPolicies
    this.handlers = new Map()
    this.logs = []
  }

  /**
   * Enregistre un handler pour un type de sous-agent
   */
  registerHandler(agentType: SubAgentType, handler: SubAgentHandler): void {
    this.handlers.set(agentType, handler)
    this.log('orchestrator', agentType, 'handler_registered', `Handler enregistré pour ${agentType}`)
  }

  /**
   * Point d'entrée principal : orchestre une requête
   */
  async orchestrate(
    input: string,
    context: SubAgentContext,
    metadata?: Record<string, unknown>
  ): Promise<OrchestrationResult> {
    const startTime = Date.now()
    this.logs = [] // Reset logs pour cette requête

    // 1. Déterminer la décision de routage
    let routingDecision = this.router.route(input, context)

    // 2. Enrichir avec Vision si image détectée
    routingDecision = this.router.enhanceWithVision(routingDecision, input, metadata)

    // 3. Appliquer les policies
    routingDecision = this.policies.applyToRoutingDecision(routingDecision, context)

    // 4. Vérifier si la requête est autorisée
    const policyCheck = this.policies.checkRequest(
      input,
      context,
      routingDecision.targetAgents
    )

    if (!policyCheck.allowed) {
      return this.createRejectedResult(routingDecision, policyCheck, startTime)
    }

    // 5. Log de la décision de routage
    this.log(
      'orchestrator',
      routingDecision.targetAgents.length > 0 ? routingDecision.targetAgents[0] : 'none',
      routingDecision.intent,
      routingDecision.rationale
    )

    // 6. Exécuter les sous-agents
    const responses = await this.executeSubAgents(routingDecision, input, context)

    // 7. Calculer le coût estimé
    const estimatedCost = this.policies.estimateCost(routingDecision.targetAgents)

    return {
      accepted: true,
      routingDecision,
      responses,
      logs: [...this.logs],
      metadata: {
        totalTimeMs: Date.now() - startTime,
        estimatedCost,
      },
    }
  }

  /**
   * Exécute les sous-agents selon la décision de routage
   */
  private async executeSubAgents(
    decision: RoutingDecision,
    input: string,
    context: SubAgentContext
  ): Promise<AggregatedResponses> {
    const responses: SubAgentResponse[] = []
    const startTime = Date.now()

    if (decision.targetAgents.length === 0) {
      return this.createEmptyAggregation()
    }

    // Créer les requêtes pour chaque sous-agent
    const requests = decision.targetAgents.map(agentType => 
      this.createRequest(agentType, input, context, decision.intent)
    )

    // Exécuter en parallèle ou séquentiel selon la décision
    if (decision.executionMode === 'parallel') {
      const promises = requests.map(async (request) => {
        const handler = this.handlers.get(request.targetAgent)
        if (!handler) {
          return this.createMissingHandlerResponse(request.targetAgent)
        }
        
        try {
          const response = await this.executeWithTimeout(
            handler(request),
            this.policies.getLimits(request.targetAgent).timeoutMs
          )
          this.log('orchestrator', request.targetAgent, 'response_received', `Réponse reçue`)
          return response
        } catch (error) {
          return this.createErrorResponse(request.targetAgent, error)
        }
      })

      responses.push(...await Promise.all(promises))
    } else {
      // Exécution séquentielle
      for (const request of requests) {
        const handler = this.handlers.get(request.targetAgent)
        if (!handler) {
          responses.push(this.createMissingHandlerResponse(request.targetAgent))
          continue
        }

        try {
          const response = await this.executeWithTimeout(
            handler(request),
            this.policies.getLimits(request.targetAgent).timeoutMs
          )
          this.log('orchestrator', request.targetAgent, 'response_received', `Réponse reçue`)
          responses.push(response)
        } catch (error) {
          responses.push(this.createErrorResponse(request.targetAgent, error))
        }
      }
    }

    return this.aggregateResponses(responses, startTime)
  }

  /**
   * Crée une requête pour un sous-agent
   */
  private createRequest(
    agentType: SubAgentType,
    input: string,
    context: SubAgentContext,
    intent: string
  ): SubAgentRequest {
    const baseRequest: SubAgentRequest = {
      targetAgent: agentType,
      intent,
      input,
      context,
      timestamp: Date.now(),
    }

    // Spécialiser selon le type
    if (['marketing', 'sales', 'accounting'].includes(agentType)) {
      return {
        ...baseRequest,
        targetAgent: agentType as 'marketing' | 'sales' | 'accounting',
      } as BusinessSubAgentRequest
    }

    if (agentType === 'vision') {
      return {
        ...baseRequest,
        targetAgent: 'vision',
        processingType: 'classify',
      } as TechnicalSubAgentRequest
    }

    return baseRequest
  }

  /**
   * Exécute une promesse avec timeout
   */
  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeoutMs)
      ),
    ])
  }

  /**
   * Agrège les réponses des sous-agents
   */
  private aggregateResponses(
    responses: SubAgentResponse[],
    startTime: number
  ): AggregatedResponses {
    const business = responses.filter(r => r.category === 'business') as any[]
    const technical = responses.filter(r => r.category === 'technical') as any[]

    return {
      business,
      technical,
      totalAgentsConsulted: responses.length,
      totalProcessingTimeMs: Date.now() - startTime,
      hasErrors: responses.some(r => r.status === 'error'),
    }
  }

  /**
   * Crée un résultat d'orchestration vide
   */
  private createEmptyAggregation(): AggregatedResponses {
    return {
      business: [],
      technical: [],
      totalAgentsConsulted: 0,
      totalProcessingTimeMs: 0,
      hasErrors: false,
    }
  }

  /**
   * Crée un résultat de rejet
   */
  private createRejectedResult(
    routingDecision: RoutingDecision,
    policyCheck: PolicyCheckResult,
    startTime: number
  ): OrchestrationResult {
    return {
      accepted: false,
      rejectionReason: policyCheck.reason,
      routingDecision,
      responses: this.createEmptyAggregation(),
      logs: [...this.logs],
      metadata: {
        totalTimeMs: Date.now() - startTime,
        estimatedCost: 0,
      },
    }
  }

  /**
   * Crée une réponse pour un handler manquant
   */
  private createMissingHandlerResponse(agentType: SubAgentType): SubAgentResponse {
    return {
      agentType,
      category: ['marketing', 'sales', 'accounting'].includes(agentType) ? 'business' : 'technical',
      status: 'skipped',
      priority: 'low',
      confidence: 0,
      processingTimeMs: 0,
      timestamp: Date.now(),
      error: `Handler non enregistré pour ${agentType}`,
    }
  }

  /**
   * Crée une réponse d'erreur
   */
  private createErrorResponse(agentType: SubAgentType, error: unknown): SubAgentResponse {
    return {
      agentType,
      category: ['marketing', 'sales', 'accounting'].includes(agentType) ? 'business' : 'technical',
      status: 'error',
      priority: 'low',
      confidence: 0,
      processingTimeMs: 0,
      timestamp: Date.now(),
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }

  /**
   * Ajoute un log de routage
   */
  private log(
    fromAgent: 'user_agent' | 'orchestrator',
    toAgent: SubAgentType | 'synthesizer' | 'none',
    intent: string,
    decision: string
  ): void {
    if (!this.config.enableLogging) return

    this.logs.push({
      fromAgent,
      toAgent: toAgent as SubAgentType | 'synthesizer',
      intent,
      decision,
      timestamp: Date.now(),
    })

    if (this.config.debug) {
      console.log(`[Orchestrator] ${fromAgent} → ${toAgent}: ${intent} - ${decision}`)
    }
  }

  /**
   * Retourne les logs de la dernière orchestration
   */
  getLogs(): AgentRoutingLog[] {
    return [...this.logs]
  }
}

// Export des sous-modules
export { Router, defaultRouter, type DetectedIntent } from './router'
export { Policies, defaultPolicies, type PolicyCheckResult, type AgentLimits } from './policies'

// Instance singleton par défaut
export const defaultOrchestrator = new Orchestrator()





