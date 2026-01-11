/**
 * Sous-agent Product & Service Identifier
 * 
 * RÔLE : Expert en identification de TOUS types de produits et services
 * 
 * Supporte :
 * - Produits (mode, beauté, maison, high-tech, auto, enfants, alimentation)
 * - Services (pro, digital, formation, domicile, auto, événementiel, voyage, communautaire)
 * - Missions freelance
 */

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import type {
  TechnicalSubAgentRequest,
  TechnicalSubAgentResponse,
} from '../types'
import { detectCategory, getSpecificFields, TAXONOMY, type MainCategory } from '../../taxonomy'

// ============================================================================
// Types
// ============================================================================

export interface ProductServiceIdentifierResponse extends TechnicalSubAgentResponse {
  agentType: 'product_identifier'
  extractedData: {
    rawText: string
    structured: {
      mainCategory: MainCategory
      subCategory: string
      confidence: number
      data: Record<string, unknown>
      missingFields: string[]
      nextQuestions: string[]
    }
  }
}

// ============================================================================
// System Prompt dynamique
// ============================================================================

function buildIdentifierPrompt(subCategory: string): string {
  const node = TAXONOMY[subCategory]
  const specificFields = node?.specificFields || []
  
  return `Tu es un expert en identification de produits et services pour une marketplace.

## Catégorie détectée : ${node?.label || 'Non spécifiée'}

## Champs à extraire prioritairement :
${specificFields.map(f => `- ${f}`).join('\n')}

## Instructions

1. **Extrais TOUTES les informations** mentionnées explicitement dans le message
2. **NE JAMAIS inventer** des données non mentionnées (ne mets pas de valeur null)
3. **Identifie les 3-5 champs manquants** les plus importants
4. **Génère des questions naturelles** pour collecter ces informations

## Format de sortie JSON

\`\`\`json
{
  "data": {
    "champ1": "valeur1",
    "champ2": "valeur2"
  },
  "missingFields": ["champ3", "champ4"],
  "nextQuestions": [
    "Question naturelle 1 ?",
    "Question naturelle 2 ?"
  ]
}
\`\`\`

## Règles strictes

- Si un champ n'est pas mentionné → ne le mets PAS dans data
- Questions courtes et naturelles (max 15 mots par question)
- Maximum 5 questions
- Priorise les champs essentiels : prix, état/qualité, localisation/zone
- Une seule question à la fois (pas de questions composées)
- Les questions doivent être directes et claires`
}

// ============================================================================
// Classe ProductServiceIdentifierSubAgent
// ============================================================================

export class ProductServiceIdentifierSubAgent {
  private readonly isActive = true

  /**
   * Point d'entrée principal
   */
  async execute(request: TechnicalSubAgentRequest): Promise<ProductServiceIdentifierResponse> {
    const startTime = Date.now()

    if (!this.isActive || !process.env.OPENAI_API_KEY) {
      return this.createSkippedResponse('Sous-agent non actif', startTime)
    }

    try {
      // Étape 1 : Détection de la catégorie
      const categoryDetection = detectCategory(request.input as string)
      
      // Étape 2 : Extraction des données spécifiques
      const extraction = await this.extractData(
        request.input as string,
        categoryDetection.subCategory
      )
      
      return {
        agentType: 'product_identifier',
        category: 'technical',
        status: 'success',
        priority: 'high',
        confidence: categoryDetection.confidence,
        processingTimeMs: Date.now() - startTime,
        timestamp: Date.now(),
        extractedData: {
          rawText: request.input as string,
          structured: {
            mainCategory: categoryDetection.mainCategory,
            subCategory: categoryDetection.subCategory,
            confidence: categoryDetection.confidence,
            ...extraction,
          },
        },
      }
    } catch (error) {
      console.error('[ProductIdentifier] Error:', error)
      return this.createErrorResponse(error as Error, startTime)
    }
  }

  /**
   * Extrait les données spécifiques via GPT
   */
  private async extractData(
    input: string,
    subCategory: string
  ): Promise<{
    data: Record<string, unknown>
    missingFields: string[]
    nextQuestions: string[]
  }> {
    const prompt = buildIdentifierPrompt(subCategory)
    
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: input },
      ],
      temperature: 0.2,
    })

    return this.parseJsonResponse(result.text)
  }

  /**
   * Parse la réponse JSON
   */
  private parseJsonResponse(text: string): {
    data: Record<string, unknown>
    missingFields: string[]
    nextQuestions: string[]
  } {
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0])
        return {
          data: parsed.data || {},
          missingFields: parsed.missingFields || [],
          nextQuestions: parsed.nextQuestions || [],
        }
      }
      return JSON.parse(text)
    } catch (error) {
      console.error('[ProductIdentifier] JSON parse error:', error)
      return {
        data: {},
        missingFields: [],
        nextQuestions: [],
      }
    }
  }

  private createSkippedResponse(reason: string, startTime: number): ProductServiceIdentifierResponse {
    return {
      agentType: 'product_identifier',
      category: 'technical',
      status: 'skipped',
      priority: 'low',
      confidence: 0,
      processingTimeMs: Date.now() - startTime,
      timestamp: Date.now(),
      error: reason,
      extractedData: {
        rawText: '',
        structured: {
          mainCategory: 'product',
          subCategory: 'other',
          confidence: 0,
          data: {},
          missingFields: [],
          nextQuestions: [],
        },
      },
    }
  }

  private createErrorResponse(error: Error, startTime: number): ProductServiceIdentifierResponse {
    return this.createSkippedResponse(error.message, startTime)
  }
}

export const productIdentifierSubAgent = new ProductServiceIdentifierSubAgent()


