/**
 * Sous-agent Marketing/Communication
 * 
 * RÔLE : Expert copywriting et positionnement (décisionnel)
 * 
 * RÈGLE D'OR : Ne parle JAMAIS à l'utilisateur directement
 * 
 * Capacités :
 * - Amélioration de titres d'annonces
 * - Optimisation de descriptions (copywriting)
 * - Suggestions de hooks et accroches
 * - Adaptation du ton selon la cible
 */

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import type {
  BusinessSubAgentRequest,
  MarketingResponse,
  SubAgentContext,
} from '../types'

// ============================================================================
// Types spécifiques au sous-agent Marketing
// ============================================================================

/**
 * Types de tâches marketing supportées
 */
export type MarketingTask =
  | 'improve_title'
  | 'improve_description'
  | 'suggest_hooks'
  | 'adapt_tone'
  | 'full_optimization'

/**
 * Paramètres pour une requête marketing
 */
export interface MarketingParams {
  task: MarketingTask
  content: {
    title?: string
    description?: string
    category?: string
    price?: number
  }
  targetAudience?: 'particuliers' | 'professionnels' | 'mixte'
  preferredTone?: 'casual' | 'professional' | 'urgent'
}

// ============================================================================
// Prompts système pour le sous-agent
// ============================================================================

const MARKETING_SYSTEM_PROMPT = `Tu es un expert en copywriting et marketing digital.
Tu NE parles JAMAIS directement à l'utilisateur.
Tu fournis des réponses STRUCTURÉES en JSON.

RÈGLES STRICTES :
- Pas de formules de politesse
- Pas de phrases d'introduction
- Pas d'explications longues
- Uniquement des suggestions concrètes et actionnables

FORMAT DE SORTIE (JSON uniquement) :
{
  "suggestions": [
    {
      "original": "texte original",
      "improved": "version améliorée",
      "rationale": "raison courte"
    }
  ],
  "targetAudience": "particuliers | professionnels | mixte",
  "toneRecommendation": "casual | professional | urgent"
}

BONNES PRATIQUES COPYWRITING :
- Titres : 50-70 caractères, accrocheurs, avec bénéfice clair
- Descriptions : structure claire, bullet points quand pertinent
- Éviter le jargon technique sauf pour les pros
- Utiliser des chiffres concrets quand possible
- Créer de l'urgence sans être agressif`

// ============================================================================
// Classe MarketingSubAgent
// ============================================================================

/**
 * Sous-agent spécialisé Marketing/Communication
 */
export class MarketingSubAgent {
  private model = 'gpt-4o-mini'

  /**
   * Point d'entrée principal
   */
  async execute(request: BusinessSubAgentRequest): Promise<MarketingResponse> {
    const startTime = Date.now()

    try {
      // Extraire les paramètres de la requête
      const params = this.parseRequest(request)

      // Générer les suggestions via LLM
      const result = await this.generateSuggestions(params, request.context)

      return {
        agentType: 'marketing',
        category: 'business',
        status: 'success',
        priority: 'high',
        confidence: result.confidence,
        processingTimeMs: Date.now() - startTime,
        timestamp: Date.now(),
        advice: {
          summary: this.generateSummary(result.suggestions),
          details: this.generateDetails(result),
          suggestedActions: this.generateActions(params.task),
        },
        data: {
          type: 'marketing_advice',
          suggestions: result.suggestions,
          targetAudience: result.targetAudience,
          toneRecommendation: result.toneRecommendation,
        },
      }
    } catch (error) {
      return this.createErrorResponse(error, startTime)
    }
  }

  /**
   * Parse la requête pour extraire les paramètres
   */
  private parseRequest(request: BusinessSubAgentRequest): MarketingParams {
    const input = typeof request.input === 'string' 
      ? request.input 
      : JSON.stringify(request.input)

    const structuredData = request.structuredData || {}

    // Détecter la tâche à partir de l'intent
    let task: MarketingTask = 'full_optimization'
    if (request.intent.includes('title')) task = 'improve_title'
    else if (request.intent.includes('description')) task = 'improve_description'
    else if (request.intent.includes('hook')) task = 'suggest_hooks'
    else if (request.intent.includes('tone')) task = 'adapt_tone'

    return {
      task,
      content: {
        title: structuredData.title as string || this.extractTitle(input),
        description: structuredData.description as string || input,
        category: structuredData.category as string,
        price: structuredData.price as number,
      },
      targetAudience: structuredData.targetAudience as any || 'mixte',
      preferredTone: structuredData.preferredTone as any || 'professional',
    }
  }

  /**
   * Extrait un titre potentiel du texte
   */
  private extractTitle(text: string): string {
    // Prendre la première ligne ou les 100 premiers caractères
    const firstLine = text.split('\n')[0]
    return firstLine.length > 100 ? firstLine.substring(0, 97) + '...' : firstLine
  }

  /**
   * Génère les suggestions via LLM
   */
  private async generateSuggestions(
    params: MarketingParams,
    context: SubAgentContext
  ): Promise<{
    suggestions: Array<{ original: string; improved: string; rationale: string }>
    targetAudience: 'particuliers' | 'professionnels' | 'mixte'
    toneRecommendation: 'casual' | 'professional' | 'urgent'
    confidence: number
  }> {
    const userPrompt = this.buildPrompt(params)

    try {
      const result = await generateText({
        model: openai(this.model),
        system: MARKETING_SYSTEM_PROMPT,
        prompt: userPrompt,
        maxRetries: 2,
      })

      // Parser la réponse JSON
      const parsed = this.parseResponse(result.text)

      return {
        ...parsed,
        confidence: this.calculateConfidence(parsed),
      }
    } catch (error) {
      // Fallback avec des suggestions génériques
      return this.getFallbackSuggestions(params)
    }
  }

  /**
   * Construit le prompt utilisateur
   */
  private buildPrompt(params: MarketingParams): string {
    const parts: string[] = []

    parts.push(`TÂCHE : ${this.getTaskDescription(params.task)}`)
    parts.push(`AUDIENCE CIBLE : ${params.targetAudience}`)
    parts.push(`TON PRÉFÉRÉ : ${params.preferredTone}`)

    if (params.content.title) {
      parts.push(`\nTITRE ACTUEL : "${params.content.title}"`)
    }

    if (params.content.description) {
      parts.push(`\nDESCRIPTION ACTUELLE :\n${params.content.description}`)
    }

    if (params.content.category) {
      parts.push(`\nCATÉGORIE : ${params.content.category}`)
    }

    if (params.content.price) {
      parts.push(`\nPRIX : ${params.content.price}€`)
    }

    parts.push(`\nGénère 2-3 suggestions d'amélioration en JSON.`)

    return parts.join('\n')
  }

  /**
   * Retourne la description de la tâche
   */
  private getTaskDescription(task: MarketingTask): string {
    const descriptions: Record<MarketingTask, string> = {
      improve_title: 'Améliorer le titre pour plus d\'impact',
      improve_description: 'Optimiser la description pour la conversion',
      suggest_hooks: 'Proposer des accroches percutantes',
      adapt_tone: 'Adapter le ton au public cible',
      full_optimization: 'Optimisation complète titre + description',
    }
    return descriptions[task]
  }

  /**
   * Parse la réponse JSON du LLM
   */
  private parseResponse(text: string): {
    suggestions: Array<{ original: string; improved: string; rationale: string }>
    targetAudience: 'particuliers' | 'professionnels' | 'mixte'
    toneRecommendation: 'casual' | 'professional' | 'urgent'
  } {
    try {
      // Extraire le JSON de la réponse (peut être entouré de markdown)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found')

      const parsed = JSON.parse(jsonMatch[0])

      return {
        suggestions: parsed.suggestions || [],
        targetAudience: parsed.targetAudience || 'mixte',
        toneRecommendation: parsed.toneRecommendation || 'professional',
      }
    } catch {
      throw new Error('Failed to parse marketing response')
    }
  }

  /**
   * Calcule le score de confiance
   */
  private calculateConfidence(result: {
    suggestions: Array<{ original: string; improved: string; rationale: string }>
  }): number {
    // Base de 0.7, +0.1 par suggestion valide (max 1.0)
    const validSuggestions = result.suggestions.filter(
      s => s.improved && s.improved.length > 0
    ).length

    return Math.min(0.7 + validSuggestions * 0.1, 1.0)
  }

  /**
   * Génère un résumé des suggestions
   */
  private generateSummary(
    suggestions: Array<{ original: string; improved: string; rationale: string }>
  ): string {
    if (suggestions.length === 0) {
      return 'Aucune suggestion disponible.'
    }

    if (suggestions.length === 1) {
      return `Suggestion : "${suggestions[0].improved}"`
    }

    return `${suggestions.length} suggestions d'amélioration générées.`
  }

  /**
   * Génère les détails complets
   */
  private generateDetails(result: {
    suggestions: Array<{ original: string; improved: string; rationale: string }>
    targetAudience: string
    toneRecommendation: string
  }): string {
    const parts: string[] = []

    for (const suggestion of result.suggestions) {
      parts.push(`• ${suggestion.improved}`)
      if (suggestion.rationale) {
        parts.push(`  Raison : ${suggestion.rationale}`)
      }
    }

    parts.push(`\nAudience cible recommandée : ${result.targetAudience}`)
    parts.push(`Ton recommandé : ${result.toneRecommendation}`)

    return parts.join('\n')
  }

  /**
   * Génère les actions suggérées
   */
  private generateActions(task: MarketingTask): string[] {
    const baseActions = ['Appliquer la suggestion', 'Voir d\'autres options']

    const taskSpecificActions: Record<MarketingTask, string[]> = {
      improve_title: ['Tester avec différents publics'],
      improve_description: ['Ajouter des bullet points', 'Ajouter un appel à l\'action'],
      suggest_hooks: ['Tester sur les réseaux sociaux'],
      adapt_tone: ['Voir le ton opposé'],
      full_optimization: ['Publier l\'annonce', 'Générer une image'],
    }

    return [...baseActions, ...(taskSpecificActions[task] || [])]
  }

  /**
   * Suggestions de fallback si le LLM échoue
   */
  private getFallbackSuggestions(params: MarketingParams): {
    suggestions: Array<{ original: string; improved: string; rationale: string }>
    targetAudience: 'particuliers' | 'professionnels' | 'mixte'
    toneRecommendation: 'casual' | 'professional' | 'urgent'
    confidence: number
  } {
    const suggestions: Array<{ original: string; improved: string; rationale: string }> = []

    // Suggestion de base pour le titre
    if (params.content.title) {
      suggestions.push({
        original: params.content.title,
        improved: this.quickTitleImprovement(params.content.title),
        rationale: 'Titre plus accrocheur',
      })
    }

    return {
      suggestions,
      targetAudience: params.targetAudience || 'mixte',
      toneRecommendation: params.preferredTone || 'professional',
      confidence: 0.5,
    }
  }

  /**
   * Amélioration rapide de titre (sans LLM)
   */
  private quickTitleImprovement(title: string): string {
    // Règles simples de copywriting
    let improved = title.trim()

    // Capitaliser la première lettre
    improved = improved.charAt(0).toUpperCase() + improved.slice(1)

    // Retirer les points finaux
    improved = improved.replace(/\.+$/, '')

    // Ajouter un emoji si absent et titre court
    if (improved.length < 40 && !/[\u{1F600}-\u{1F6FF}]/u.test(improved)) {
      improved = '✨ ' + improved
    }

    return improved
  }

  /**
   * Crée une réponse d'erreur
   */
  private createErrorResponse(error: unknown, startTime: number): MarketingResponse {
    return {
      agentType: 'marketing',
      category: 'business',
      status: 'error',
      priority: 'low',
      confidence: 0,
      processingTimeMs: Date.now() - startTime,
      timestamp: Date.now(),
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      advice: {
        summary: 'Erreur lors de l\'analyse marketing',
        details: '',
        suggestedActions: [],
      },
      data: {
        type: 'marketing_advice',
        suggestions: [],
        targetAudience: 'mixte',
        toneRecommendation: 'professional',
      },
    }
  }
}

// Instance singleton
export const marketingSubAgent = new MarketingSubAgent()





