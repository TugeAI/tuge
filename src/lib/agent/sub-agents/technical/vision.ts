/**
 * Sous-agent Vision/OCR
 * 
 * RÔLE : Extraction et classification d'images (non-décisionnel)
 * 
 * RÈGLE D'OR : Ne parle JAMAIS à l'utilisateur directement
 * 
 * Caractéristiques :
 * - Modèle : GPT-4o-mini (coût maîtrisé)
 * - Pas de conseils, juste des données structurées
 * - Temps de réponse prévisible
 * 
 * Capacités :
 * - Classification d'images (menu, carte de visite, produit, document)
 * - Extraction de texte (OCR)
 * - Structuration des données extraites
 */

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import type {
  TechnicalSubAgentRequest,
  VisionResponse,
  MenuContent,
  BusinessCardContent,
  ProductContent,
  DocumentContent,
} from '../types'

// ============================================================================
// Types spécifiques au sous-agent Vision
// ============================================================================

/**
 * Types d'images supportés
 */
export type ImageType = 'menu' | 'business_card' | 'product' | 'document' | 'unknown'

/**
 * Résultat de l'analyse Vision
 */
export interface VisionAnalysisResult {
  imageType: ImageType
  language: string
  rawText: string
  content: MenuContent | BusinessCardContent | ProductContent | DocumentContent | null
  confidence: number
}

// ============================================================================
// Prompts système pour le sous-agent
// ============================================================================

const VISION_CLASSIFIER_PROMPT = `Tu es un système d'analyse d'images.
Tu NE parles JAMAIS à l'utilisateur.
Tu fournis des réponses STRUCTURÉES en JSON uniquement.

TÂCHE : Analyser l'image et extraire les informations.

ÉTAPE 1 - Classification
Identifie le type d'image parmi :
- menu : carte de restaurant, liste de plats avec prix
- business_card : carte de visite avec coordonnées
- product : photo d'un produit à vendre
- document : document textuel (facture, contrat, etc.)
- unknown : image non classifiable

ÉTAPE 2 - Extraction
Selon le type détecté, extrais les informations pertinentes.

FORMAT DE SORTIE (JSON uniquement) :
{
  "imageType": "menu | business_card | product | document | unknown",
  "language": "fr | en | ...",
  "rawText": "texte brut extrait",
  "content": { ... données structurées selon le type ... },
  "confidence": 0.0 à 1.0
}

RÈGLES :
- Ne devine PAS les informations manquantes
- Si une information n'est pas visible, ne l'inclus pas
- Retourne uniquement du JSON valide
- Pas de commentaires ni d'explications`

const MENU_EXTRACTION_PROMPT = `Extrais les éléments du menu.

FORMAT content pour un menu :
{
  "type": "menu",
  "items": [
    { "name": "...", "price": 12.50, "currency": "EUR", "category": "Entrées", "description": "..." }
  ],
  "currency": "EUR",
  "establishmentName": "..." (si visible)
}`

const BUSINESS_CARD_PROMPT = `Extrais les coordonnées de la carte de visite.

FORMAT content pour une carte de visite :
{
  "type": "business_card",
  "name": "...",
  "company": "...",
  "title": "...",
  "phone": "...",
  "email": "...",
  "website": "...",
  "address": "..."
}`

const PRODUCT_PROMPT = `Décris le produit visible sur l'image.

FORMAT content pour un produit :
{
  "type": "product",
  "name": "...",
  "brand": "...",
  "category": "...",
  "visibleFeatures": ["..."],
  "condition": "neuf | comme neuf | bon | acceptable"
}`

// ============================================================================
// Classe VisionSubAgent
// ============================================================================

/**
 * Sous-agent technique spécialisé Vision/OCR
 */
export class VisionSubAgent {
  private model = 'gpt-4o-mini'

  /**
   * Point d'entrée principal
   */
  async execute(request: TechnicalSubAgentRequest): Promise<VisionResponse> {
    const startTime = Date.now()

    try {
      // Vérifier qu'on a une image
      const imageData = this.extractImageData(request)
      if (!imageData) {
        return this.createErrorResponse('Aucune image fournie', startTime)
      }

      // Analyser l'image
      const analysis = await this.analyzeImage(imageData)

      return {
        agentType: 'vision',
        category: 'technical',
        status: 'success',
        priority: 'medium',
        confidence: analysis.confidence,
        processingTimeMs: Date.now() - startTime,
        timestamp: Date.now(),
        extractedData: {
          rawText: analysis.rawText,
          structured: {
            imageType: analysis.imageType,
            language: analysis.language,
            content: analysis.content,
          },
        },
      }
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Erreur d\'analyse',
        startTime
      )
    }
  }

  /**
   * Extrait les données image de la requête
   */
  private extractImageData(request: TechnicalSubAgentRequest): string | null {
    // Vérifier imageData directement
    if (request.imageData) {
      return request.imageData
    }

    // Vérifier dans l'input si c'est un objet
    if (typeof request.input === 'object' && request.input !== null) {
      const inputObj = request.input as Record<string, unknown>
      if (inputObj.imageUrl) return inputObj.imageUrl as string
      if (inputObj.imageBase64) return inputObj.imageBase64 as string
    }

    // Vérifier si l'input est une URL d'image
    if (typeof request.input === 'string') {
      if (request.input.startsWith('data:image/')) return request.input
      if (/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)/i.test(request.input)) {
        return request.input
      }
    }

    return null
  }

  /**
   * Analyse l'image via GPT-4o-mini vision
   */
  private async analyzeImage(imageData: string): Promise<VisionAnalysisResult> {
    // Construire le message avec l'image
    const imageUrl = imageData.startsWith('data:')
      ? imageData
      : imageData

    try {
      // Première passe : classification
      const classificationResult = await generateText({
        model: openai(this.model),
        messages: [
          {
            role: 'system',
            content: VISION_CLASSIFIER_PROMPT,
          },
          {
            role: 'user',
            content: [
              {
                type: 'image',
                image: imageUrl,
              },
              {
                type: 'text',
                text: 'Analyse cette image et retourne le JSON structuré.',
              },
            ],
          },
        ],
        maxRetries: 2,
      })

      // Parser la réponse
      return this.parseVisionResponse(classificationResult.text)
    } catch (error) {
      console.error('[Vision SubAgent] Error analyzing image:', error)
      throw error
    }
  }

  /**
   * Parse la réponse JSON du modèle vision
   */
  private parseVisionResponse(text: string): VisionAnalysisResult {
    try {
      // Extraire le JSON de la réponse
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])

      // Valider et normaliser
      const imageType = this.normalizeImageType(parsed.imageType)
      const content = this.normalizeContent(imageType, parsed.content)

      return {
        imageType,
        language: parsed.language || 'fr',
        rawText: parsed.rawText || '',
        content,
        confidence: this.normalizeConfidence(parsed.confidence),
      }
    } catch (error) {
      console.error('[Vision SubAgent] Parse error:', error)
      return {
        imageType: 'unknown',
        language: 'fr',
        rawText: '',
        content: null,
        confidence: 0.3,
      }
    }
  }

  /**
   * Normalise le type d'image
   */
  private normalizeImageType(type: string | undefined): ImageType {
    const validTypes: ImageType[] = ['menu', 'business_card', 'product', 'document', 'unknown']
    const normalized = type?.toLowerCase().replace(/\s+/g, '_')
    return validTypes.includes(normalized as ImageType)
      ? (normalized as ImageType)
      : 'unknown'
  }

  /**
   * Normalise le contenu selon le type
   */
  private normalizeContent(
    imageType: ImageType,
    content: unknown
  ): MenuContent | BusinessCardContent | ProductContent | DocumentContent | null {
    if (!content || typeof content !== 'object') return null

    const contentObj = content as Record<string, unknown>

    switch (imageType) {
      case 'menu':
        return this.normalizeMenuContent(contentObj)
      case 'business_card':
        return this.normalizeBusinessCardContent(contentObj)
      case 'product':
        return this.normalizeProductContent(contentObj)
      case 'document':
        return this.normalizeDocumentContent(contentObj)
      default:
        return null
    }
  }

  /**
   * Normalise le contenu d'un menu
   */
  private normalizeMenuContent(content: Record<string, unknown>): MenuContent {
    const items = Array.isArray(content.items)
      ? content.items.map((item: any) => ({
          name: String(item.name || ''),
          price: typeof item.price === 'number' ? item.price : undefined,
          currency: String(item.currency || 'EUR'),
          category: item.category ? String(item.category) : undefined,
          description: item.description ? String(item.description) : undefined,
        }))
      : []

    return {
      type: 'menu',
      items,
      currency: String(content.currency || 'EUR'),
      establishmentName: content.establishmentName
        ? String(content.establishmentName)
        : undefined,
    }
  }

  /**
   * Normalise le contenu d'une carte de visite
   */
  private normalizeBusinessCardContent(content: Record<string, unknown>): BusinessCardContent {
    return {
      type: 'business_card',
      name: content.name ? String(content.name) : undefined,
      company: content.company ? String(content.company) : undefined,
      title: content.title ? String(content.title) : undefined,
      phone: content.phone ? String(content.phone) : undefined,
      email: content.email ? String(content.email) : undefined,
      website: content.website ? String(content.website) : undefined,
      address: content.address ? String(content.address) : undefined,
    }
  }

  /**
   * Normalise le contenu d'un produit
   */
  private normalizeProductContent(content: Record<string, unknown>): ProductContent {
    return {
      type: 'product',
      name: content.name ? String(content.name) : undefined,
      brand: content.brand ? String(content.brand) : undefined,
      category: content.category ? String(content.category) : undefined,
      visibleFeatures: Array.isArray(content.visibleFeatures)
        ? content.visibleFeatures.map(String)
        : [],
      condition: content.condition ? String(content.condition) : undefined,
    }
  }

  /**
   * Normalise le contenu d'un document
   */
  private normalizeDocumentContent(content: Record<string, unknown>): DocumentContent {
    return {
      type: 'document',
      title: content.title ? String(content.title) : undefined,
      documentType: content.documentType ? String(content.documentType) : undefined,
      extractedText: String(content.extractedText || ''),
      keyInformation:
        typeof content.keyInformation === 'object' && content.keyInformation !== null
          ? Object.fromEntries(
              Object.entries(content.keyInformation).map(([k, v]) => [k, String(v)])
            )
          : {},
    }
  }

  /**
   * Normalise le score de confiance
   */
  private normalizeConfidence(confidence: unknown): number {
    if (typeof confidence !== 'number') return 0.5
    return Math.max(0, Math.min(1, confidence))
  }

  /**
   * Crée une réponse d'erreur
   */
  private createErrorResponse(errorMessage: string, startTime: number): VisionResponse {
    return {
      agentType: 'vision',
      category: 'technical',
      status: 'error',
      priority: 'low',
      confidence: 0,
      processingTimeMs: Date.now() - startTime,
      timestamp: Date.now(),
      error: errorMessage,
      extractedData: {
        rawText: '',
        structured: {
          imageType: 'unknown',
          language: 'fr',
          content: null,
        },
      },
    }
  }
}

// Instance singleton
export const visionSubAgent = new VisionSubAgent()





