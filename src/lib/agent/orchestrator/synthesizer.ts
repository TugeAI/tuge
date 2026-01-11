/**
 * Synthesizer - Agrégation et reformulation des réponses
 * 
 * RÔLE : Transformer les réponses techniques en réponse "coach"
 * 
 * C'est ici que l'agent devient COACH, pas messager.
 * 
 * Responsabilités :
 * 1. Prioriser les réponses (pertinence, urgence)
 * 2. Filtrer les informations techniques non pertinentes
 * 3. Reformuler en langage accessible et actionnable
 * 4. Proposer UNE action claire (pas de surcharge cognitive)
 */

import type {
  SubAgentResponse,
  BusinessSubAgentResponse,
  TechnicalSubAgentResponse,
  AggregatedResponses,
  SynthesisResult,
  SubAgentType,
  ResponsePriority,
  MarketingResponse,
  SalesResponse,
  VisionResponse,
} from '../sub-agents/types'

// Re-export pour utilisation externe
export type { SynthesisResult }

// ============================================================================
// Types pour le synthesizer
// ============================================================================

/**
 * Configuration du synthesizer
 */
export interface SynthesizerConfig {
  /** Nombre max de suggestions à garder */
  maxSuggestions: number
  /** Nombre max d'actions secondaires */
  maxSecondaryActions: number
  /** Langue de sortie */
  language: string
  /** Ton de la réponse */
  tone: 'casual' | 'professional' | 'friendly'
}

/**
 * Élément priorisé pour la synthèse
 */
interface PrioritizedItem {
  source: SubAgentType
  content: string
  priority: number
  type: 'advice' | 'data' | 'action'
}

// ============================================================================
// Configuration par défaut
// ============================================================================

const DEFAULT_CONFIG: SynthesizerConfig = {
  maxSuggestions: 2,
  maxSecondaryActions: 2,
  language: 'fr',
  tone: 'friendly',
}

/**
 * Poids de priorité par type de réponse
 */
const PRIORITY_WEIGHTS: Record<ResponsePriority, number> = {
  critical: 100,
  high: 75,
  medium: 50,
  low: 25,
}

// ============================================================================
// Classe Synthesizer
// ============================================================================

/**
 * Synthesizer - Transforme les réponses brutes en réponse coach
 */
export class Synthesizer {
  private config: SynthesizerConfig

  constructor(config: Partial<SynthesizerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Point d'entrée principal : synthétise les réponses agrégées
   */
  synthesize(
    aggregatedResponses: AggregatedResponses,
    originalIntent: string
  ): SynthesisResult {
    const startTime = Date.now()

    // 1. Collecter et prioriser tous les éléments
    const prioritizedItems = this.prioritizeResponses(aggregatedResponses)

    // 2. Filtrer pour l'UX (garder les plus pertinents)
    const filteredItems = this.filterForUX(prioritizedItems)

    // 3. Générer la réponse coach
    const userResponse = this.generateCoachResponse(filteredItems, originalIntent)

    // 4. Extraire les actions suggérées
    const actions = this.extractActions(filteredItems, aggregatedResponses)

    // 5. Identifier les sources utilisées
    const sourcesUsed = this.identifySources(aggregatedResponses)

    return {
      userResponse,
      primaryAction: actions.primary,
      secondaryActions: actions.secondary,
      sourcesUsed,
      metadata: {
        synthesisTimeMs: Date.now() - startTime,
        confidenceScore: this.calculateConfidence(aggregatedResponses),
        filteringApplied: prioritizedItems.length > filteredItems.length,
      },
    }
  }

  /**
   * Priorise les réponses des sous-agents
   */
  private prioritizeResponses(responses: AggregatedResponses): PrioritizedItem[] {
    const items: PrioritizedItem[] = []

    // Traiter les réponses métier
    for (const response of responses.business) {
      if (response.status !== 'success') continue

      const basePriority = PRIORITY_WEIGHTS[response.priority] * response.confidence

      // Extraire le conseil principal
      if (response.advice?.summary) {
        items.push({
          source: response.agentType,
          content: response.advice.summary,
          priority: basePriority,
          type: 'advice',
        })
      }

      // Extraire les suggestions spécifiques (Marketing)
      if (response.agentType === 'marketing') {
        const marketingData = (response as MarketingResponse).data
        if (marketingData?.suggestions) {
          for (const suggestion of marketingData.suggestions.slice(0, this.config.maxSuggestions)) {
            items.push({
              source: 'marketing',
              content: suggestion.improved,
              priority: basePriority * 0.8,
              type: 'advice',
            })
          }
        }
      }

      // Extraire les tips de vente (Sales)
      if (response.agentType === 'sales') {
        const salesData = (response as SalesResponse).data
        if (salesData?.priceAnalysis) {
          items.push({
            source: 'sales',
            content: `Prix suggéré : ${salesData.priceAnalysis.suggestedPrice}€ (${salesData.priceAnalysis.rationale})`,
            priority: basePriority * 0.9,
            type: 'advice',
          })
        }
      }
    }

    // Traiter les réponses techniques
    for (const response of responses.technical) {
      if (response.status !== 'success') continue

      const basePriority = PRIORITY_WEIGHTS[response.priority] * response.confidence

      // Extraire les données Vision
      if (response.agentType === 'vision') {
        const visionData = (response as VisionResponse).extractedData
        if (visionData?.structured?.content) {
          items.push({
            source: 'vision',
            content: this.formatVisionData(visionData.structured),
            priority: basePriority,
            type: 'data',
          })
        }
      }
    }

    // Trier par priorité décroissante
    return items.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Filtre les éléments pour l'UX (éviter la surcharge cognitive)
   */
  private filterForUX(items: PrioritizedItem[]): PrioritizedItem[] {
    // Garder max 3 éléments de conseil
    const adviceItems = items.filter(i => i.type === 'advice').slice(0, 3)
    
    // Garder max 1 élément de données
    const dataItems = items.filter(i => i.type === 'data').slice(0, 1)

    return [...adviceItems, ...dataItems]
  }

  /**
   * Génère la réponse coach formatée pour l'utilisateur
   */
  private generateCoachResponse(items: PrioritizedItem[], intent: string): string {
    if (items.length === 0) {
      return this.getDefaultResponse(intent)
    }

    const parts: string[] = []

    // Intro contextualisée selon l'intent
    parts.push(this.getIntroForIntent(intent))

    // Ajouter les éléments de conseil (max 2)
    const adviceItems = items.filter(i => i.type === 'advice').slice(0, this.config.maxSuggestions)
    if (adviceItems.length === 1) {
      parts.push(adviceItems[0].content)
    } else if (adviceItems.length > 1) {
      parts.push(`Voici mes suggestions :`)
      adviceItems.forEach((item, i) => {
        parts.push(`${i + 1}. ${item.content}`)
      })
    }

    // Ajouter les données extraites (Vision)
    const dataItems = items.filter(i => i.type === 'data')
    if (dataItems.length > 0) {
      parts.push(`\n${dataItems[0].content}`)
    }

    // Question de suivi pour engager
    parts.push(this.getFollowUpQuestion(intent, items))

    return parts.filter(p => p).join('\n\n')
  }

  /**
   * Retourne une intro adaptée à l'intent
   */
  private getIntroForIntent(intent: string): string {
    const intros: Record<string, string> = {
      improve_listing_content: "J'ai analysé ton annonce et j'ai quelques idées pour l'améliorer.",
      create_listing: "Super, je t'aide à créer ton annonce !",
      analyze_image: "J'ai analysé ton image.",
      price_advice: "Voici mon analyse pour le prix.",
      improve_sales: "Pour booster tes ventes, voici ce que je te suggère.",
      general_conversation: "",
    }

    return intros[intent] || "Voici ce que j'ai trouvé pour toi."
  }

  /**
   * Retourne une question de suivi engageante
   */
  private getFollowUpQuestion(intent: string, items: PrioritizedItem[]): string {
    if (items.length === 0) return ""

    const questions: Record<string, string[]> = {
      improve_listing_content: [
        "Laquelle te plaît le plus ?",
        "Tu veux que j'ajuste quelque chose ?",
      ],
      create_listing: [
        "Ça te convient ?",
        "Tu veux modifier quelque chose avant de publier ?",
      ],
      analyze_image: [
        "Tu veux que je crée une annonce à partir de ça ?",
        "C'est bien ça ?",
      ],
      price_advice: [
        "Tu veux qu'on ajuste le prix ?",
        "Ça te semble cohérent ?",
      ],
      improve_sales: [
        "Par quoi tu veux commencer ?",
        "Tu veux qu'on travaille sur l'un de ces points ?",
      ],
    }

    const intentQuestions = questions[intent] || ["Tu veux qu'on continue ?"]
    return intentQuestions[Math.floor(Math.random() * intentQuestions.length)]
  }

  /**
   * Retourne une réponse par défaut si rien n'a été trouvé
   */
  private getDefaultResponse(intent: string): string {
    return "Je n'ai pas trouvé d'information spécifique pour t'aider sur ce point. Tu peux me donner plus de détails ?"
  }

  /**
   * Formate les données Vision pour l'utilisateur
   */
  private formatVisionData(structured: {
    imageType: string
    language: string
    content: unknown
  }): string {
    const { imageType, content } = structured

    if (!content) return "Je n'ai pas pu extraire d'informations de cette image."

    switch (imageType) {
      case 'menu':
        return this.formatMenuContent(content as any)
      case 'business_card':
        return this.formatBusinessCardContent(content as any)
      case 'product':
        return this.formatProductContent(content as any)
      default:
        return "Image analysée. Type détecté : " + imageType
    }
  }

  /**
   * Formate le contenu d'un menu
   */
  private formatMenuContent(content: {
    items: Array<{ name: string; price?: number; category?: string }>
    currency?: string
  }): string {
    if (!content.items?.length) return "Menu vide ou non lisible."

    const itemCount = content.items.length
    const categories = [...new Set(content.items.map(i => i.category).filter(Boolean))]
    
    let result = `J'ai détecté un menu avec ${itemCount} article${itemCount > 1 ? 's' : ''}`
    if (categories.length > 0) {
      result += ` dans ${categories.length} catégorie${categories.length > 1 ? 's' : ''}`
    }
    result += '.'

    return result
  }

  /**
   * Formate le contenu d'une carte de visite
   */
  private formatBusinessCardContent(content: {
    name?: string
    company?: string
    phone?: string
    email?: string
  }): string {
    const parts: string[] = ['Carte de visite détectée :']
    
    if (content.name) parts.push(`• Nom : ${content.name}`)
    if (content.company) parts.push(`• Entreprise : ${content.company}`)
    if (content.phone) parts.push(`• Téléphone : ${content.phone}`)
    if (content.email) parts.push(`• Email : ${content.email}`)

    return parts.length > 1 ? parts.join('\n') : "Carte de visite détectée mais informations non lisibles."
  }

  /**
   * Formate le contenu d'un produit
   */
  private formatProductContent(content: {
    name?: string
    brand?: string
    category?: string
    visibleFeatures?: string[]
  }): string {
    const parts: string[] = ['Produit détecté :']

    if (content.name) parts.push(`• Nom : ${content.name}`)
    if (content.brand) parts.push(`• Marque : ${content.brand}`)
    if (content.category) parts.push(`• Catégorie : ${content.category}`)

    return parts.length > 1 ? parts.join('\n') : "Produit détecté."
  }

  /**
   * Extrait les actions suggérées
   */
  private extractActions(
    items: PrioritizedItem[],
    responses: AggregatedResponses
  ): {
    primary?: { label: string; value: string }
    secondary: Array<{ label: string; value: string }>
  } {
    const actions: Array<{ label: string; value: string }> = []

    // Actions basées sur les réponses métier
    for (const response of responses.business) {
      if (response.status !== 'success') continue

      for (const action of response.advice?.suggestedActions || []) {
        actions.push({
          label: action,
          value: `action_${response.agentType}_${actions.length}`,
        })
      }
    }

    // Limiter les actions
    const [primary, ...rest] = actions.slice(0, this.config.maxSecondaryActions + 1)

    return {
      primary,
      secondary: rest.slice(0, this.config.maxSecondaryActions),
    }
  }

  /**
   * Identifie les sources utilisées
   */
  private identifySources(responses: AggregatedResponses): SubAgentType[] {
    const sources = new Set<SubAgentType>()

    for (const response of [...responses.business, ...responses.technical]) {
      if (response.status === 'success') {
        sources.add(response.agentType)
      }
    }

    return Array.from(sources)
  }

  /**
   * Calcule le score de confiance global
   */
  private calculateConfidence(responses: AggregatedResponses): number {
    const allResponses = [...responses.business, ...responses.technical]
    const successResponses = allResponses.filter(r => r.status === 'success')

    if (successResponses.length === 0) return 0

    const totalConfidence = successResponses.reduce((sum, r) => sum + r.confidence, 0)
    return totalConfidence / successResponses.length
  }
}

// Instance singleton par défaut
export const defaultSynthesizer = new Synthesizer()




