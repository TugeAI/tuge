/**
 * Types partagés pour le système multi-agents Tousgether
 * 
 * Ce fichier définit les contrats d'interface entre :
 * - L'orchestrateur principal
 * - Les sous-agents métier (Marketing, Vente, Compta)
 * - Les sous-agents techniques (Vision/OCR)
 * - Le synthesizer (agrégation des réponses)
 */

// ============================================================================
// Types de base
// ============================================================================

/**
 * Catégories de sous-agents
 */
export type SubAgentCategory = 'business' | 'technical'

/**
 * Types de sous-agents disponibles
 */
export type SubAgentType = 
  // Métier (décisionnels)
  | 'marketing'
  | 'sales'
  | 'accounting'
  // Techniques (non-décisionnels)
  | 'vision'
  | 'product_identifier'

/**
 * Priorité d'une réponse de sous-agent
 */
export type ResponsePriority = 'low' | 'medium' | 'high' | 'critical'

/**
 * Statut d'exécution d'un sous-agent
 */
export type SubAgentStatus = 'success' | 'error' | 'timeout' | 'skipped'

// ============================================================================
// Requêtes vers les sous-agents
// ============================================================================

/**
 * Contexte partagé pour toutes les requêtes
 */
export interface SubAgentContext {
  /** ID de l'utilisateur (si authentifié) */
  userId?: string
  /** ID de la conversation en cours */
  conversationId?: string
  /** Langue préférée */
  language: string
  /** Métadonnées additionnelles */
  metadata?: Record<string, unknown>
}

/**
 * Requête de base vers un sous-agent
 */
export interface SubAgentRequest {
  /** Type de sous-agent ciblé */
  targetAgent: SubAgentType
  /** Intention détectée par l'orchestrateur */
  intent: string
  /** Message ou données d'entrée */
  input: string | Record<string, unknown>
  /** Contexte partagé */
  context: SubAgentContext
  /** Timestamp de la requête */
  timestamp: number
}

/**
 * Requête spécifique pour les sous-agents métier
 */
export interface BusinessSubAgentRequest extends SubAgentRequest {
  targetAgent: 'marketing' | 'sales' | 'accounting'
  /** Type de conseil demandé */
  adviceType?: string
  /** Données structurées (ex: brouillon d'annonce) */
  structuredData?: Record<string, unknown>
}

/**
 * Requête spécifique pour les sous-agents techniques
 */
export interface TechnicalSubAgentRequest extends SubAgentRequest {
  targetAgent: 'vision'
  /** Type de traitement demandé */
  processingType?: 'classify' | 'extract' | 'ocr'
  /** URL ou base64 de l'image (pour vision) */
  imageData?: string
  /** Format attendu pour le résultat */
  expectedFormat?: string
}

// ============================================================================
// Réponses des sous-agents
// ============================================================================

/**
 * Réponse de base d'un sous-agent
 */
export interface SubAgentResponse {
  /** Type de sous-agent ayant répondu */
  agentType: SubAgentType
  /** Catégorie (métier ou technique) */
  category: SubAgentCategory
  /** Statut de l'exécution */
  status: SubAgentStatus
  /** Priorité de la réponse pour la synthèse */
  priority: ResponsePriority
  /** Score de confiance (0-1) */
  confidence: number
  /** Temps de traitement en ms */
  processingTimeMs: number
  /** Timestamp de la réponse */
  timestamp: number
  /** Message d'erreur si status = 'error' */
  error?: string
}

/**
 * Réponse d'un sous-agent métier (décisionnel)
 */
export interface BusinessSubAgentResponse extends SubAgentResponse {
  category: 'business'
  agentType: 'marketing' | 'sales' | 'accounting'
  /** Conseils et recommandations */
  advice: {
    /** Résumé court pour la synthèse */
    summary: string
    /** Détails complets */
    details: string
    /** Actions suggérées */
    suggestedActions: string[]
  }
  /** Données structurées spécifiques au domaine */
  data: Record<string, unknown>
}

/**
 * Réponse spécifique du sous-agent Marketing
 */
export interface MarketingResponse extends BusinessSubAgentResponse {
  agentType: 'marketing'
  data: {
    type: 'marketing_advice'
    suggestions: Array<{
      original: string
      improved: string
      rationale: string
    }>
    targetAudience: 'particuliers' | 'professionnels' | 'mixte'
    toneRecommendation: 'casual' | 'professional' | 'urgent'
  }
}

/**
 * Réponse spécifique du sous-agent Vente
 */
export interface SalesResponse extends BusinessSubAgentResponse {
  agentType: 'sales'
  data: {
    type: 'sales_advice'
    priceAnalysis?: {
      suggestedPrice: number
      marketRange: { min: number; max: number }
      rationale: string
    }
    conversionTips: string[]
    competitorInsights?: string
  }
}

/**
 * Réponse spécifique du sous-agent Compta
 */
export interface AccountingResponse extends BusinessSubAgentResponse {
  agentType: 'accounting'
  data: {
    type: 'accounting_advice'
    taxImplications?: string
    legalConsiderations?: string
    disclaimer: string // Toujours présent pour les questions fiscales
  }
}

/**
 * Réponse d'un sous-agent technique (non-décisionnel)
 */
export interface TechnicalSubAgentResponse extends SubAgentResponse {
  category: 'technical'
  agentType: 'vision' | 'product_identifier'
  /** Données extraites brutes */
  extractedData: {
    rawText?: string
    structured: Record<string, unknown>
  }
}

/**
 * Réponse spécifique du sous-agent Vision
 */
export interface VisionResponse extends TechnicalSubAgentResponse {
  agentType: 'vision'
  extractedData: {
    rawText?: string
    structured: {
      /** Type d'image détecté */
      imageType: 'menu' | 'business_card' | 'product' | 'document' | 'unknown'
      /** Langue détectée */
      language: string
      /** Données spécifiques au type */
      content: MenuContent | BusinessCardContent | ProductContent | DocumentContent | null
    }
  }
}

/**
 * Contenu extrait d'un menu
 */
export interface MenuContent {
  type: 'menu'
  items: Array<{
    name: string
    price?: number
    currency?: string
    category?: string
    description?: string
  }>
  currency?: string
  establishmentName?: string
}

/**
 * Contenu extrait d'une carte de visite
 */
export interface BusinessCardContent {
  type: 'business_card'
  name?: string
  company?: string
  title?: string
  phone?: string
  email?: string
  website?: string
  address?: string
}

/**
 * Contenu extrait d'une image produit
 */
export interface ProductContent {
  type: 'product'
  name?: string
  brand?: string
  category?: string
  visibleFeatures: string[]
  condition?: string
}

/**
 * Contenu extrait d'un document
 */
export interface DocumentContent {
  type: 'document'
  title?: string
  documentType?: string
  extractedText: string
  keyInformation: Record<string, string>
}

// ============================================================================
// Types pour l'orchestration
// ============================================================================

/**
 * Décision de routage de l'orchestrateur
 */
export interface RoutingDecision {
  /** Sous-agents à consulter */
  targetAgents: SubAgentType[]
  /** Intention détectée */
  intent: string
  /** Raison du routage */
  rationale: string
  /** Exécution parallèle ou séquentielle */
  executionMode: 'parallel' | 'sequential'
  /** Priorité globale */
  priority: ResponsePriority
}

/**
 * Résultat agrégé de tous les sous-agents
 */
export interface AggregatedResponses {
  /** Réponses des sous-agents métier */
  business: BusinessSubAgentResponse[]
  /** Réponses des sous-agents techniques */
  technical: TechnicalSubAgentResponse[]
  /** Nombre total de sous-agents consultés */
  totalAgentsConsulted: number
  /** Temps total de traitement */
  totalProcessingTimeMs: number
  /** Y a-t-il eu des erreurs ? */
  hasErrors: boolean
}

/**
 * Résultat de la synthèse finale
 */
export interface SynthesisResult {
  /** Réponse formatée pour l'utilisateur */
  userResponse: string
  /** Action principale suggérée */
  primaryAction?: {
    label: string
    value: string
  }
  /** Actions secondaires (max 2) */
  secondaryActions?: Array<{
    label: string
    value: string
  }>
  /** Sources utilisées pour la réponse */
  sourcesUsed: SubAgentType[]
  /** Métadonnées de synthèse */
  metadata: {
    synthesisTimeMs: number
    confidenceScore: number
    filteringApplied: boolean
  }
}

// ============================================================================
// Types pour le logging
// ============================================================================

/**
 * Entrée de log pour le routage inter-agents
 */
export interface AgentRoutingLog {
  conversationId?: string
  userId?: string
  fromAgent: 'user_agent' | 'orchestrator'
  toAgent: SubAgentType | 'synthesizer'
  intent: string
  decision: string
  timestamp: number
}

// ============================================================================
// Factory et helpers
// ============================================================================

/**
 * Crée une réponse d'erreur standardisée
 */
export function createErrorResponse(
  agentType: SubAgentType,
  category: SubAgentCategory,
  error: string,
  processingTimeMs: number
): SubAgentResponse {
  return {
    agentType,
    category,
    status: 'error',
    priority: 'low',
    confidence: 0,
    processingTimeMs,
    timestamp: Date.now(),
    error,
  }
}

/**
 * Crée une réponse "skipped" standardisée
 */
export function createSkippedResponse(
  agentType: SubAgentType,
  category: SubAgentCategory,
  reason: string
): SubAgentResponse {
  return {
    agentType,
    category,
    status: 'skipped',
    priority: 'low',
    confidence: 0,
    processingTimeMs: 0,
    timestamp: Date.now(),
    error: reason,
  }
}

/**
 * Vérifie si une réponse est de type métier
 */
export function isBusinessResponse(
  response: SubAgentResponse
): response is BusinessSubAgentResponse {
  return response.category === 'business'
}

/**
 * Vérifie si une réponse est de type technique
 */
export function isTechnicalResponse(
  response: SubAgentResponse
): response is TechnicalSubAgentResponse {
  return response.category === 'technical'
}

/**
 * Vérifie si une réponse est un succès
 */
export function isSuccessResponse(response: SubAgentResponse): boolean {
  return response.status === 'success' && response.confidence > 0
}




