/**
 * Sous-agent Compta (STUB)
 * 
 * RÔLE : Expert comptabilité et questions fiscales (décisionnel)
 * 
 * STATUT : Préparé mais NON ACTIF pour cette itération
 * 
 * Capacités futures :
 * - Réponses aux questions fiscales de base
 * - Informations sur les statuts (auto-entrepreneur, etc.)
 * - Conseils sur la TVA et facturation
 * - Redirection vers des professionnels quand nécessaire
 * 
 * IMPORTANT : Ce sous-agent inclura TOUJOURS un disclaimer
 * car il ne remplace pas un expert-comptable.
 */

import type {
  BusinessSubAgentRequest,
  AccountingResponse,
} from '../types'

// ============================================================================
// Constantes
// ============================================================================

/**
 * Disclaimer obligatoire pour toutes les réponses comptables
 */
const ACCOUNTING_DISCLAIMER = 
  'Ces informations sont données à titre indicatif. ' +
  'Pour des conseils personnalisés, consultez un expert-comptable ou votre centre des impôts.'

// ============================================================================
// Classe AccountingSubAgent (STUB)
// ============================================================================

/**
 * Sous-agent spécialisé Comptabilité (non actif)
 * 
 * Ce sous-agent est préparé pour une implémentation future.
 * Pour l'instant, il retourne une réponse "skipped".
 */
export class AccountingSubAgent {
  private readonly isActive = false

  /**
   * Point d'entrée principal
   */
  async execute(request: BusinessSubAgentRequest): Promise<AccountingResponse> {
    const startTime = Date.now()

    // Ce sous-agent n'est pas encore actif
    if (!this.isActive) {
      return {
        agentType: 'accounting',
        category: 'business',
        status: 'skipped',
        priority: 'low',
        confidence: 0,
        processingTimeMs: Date.now() - startTime,
        timestamp: Date.now(),
        error: 'Sous-agent Compta non actif pour cette itération',
        advice: {
          summary: '',
          details: '',
          suggestedActions: [],
        },
        data: {
          type: 'accounting_advice',
          disclaimer: ACCOUNTING_DISCLAIMER,
        },
      }
    }

    // TODO: Implémenter la logique comptable
    // - Détection du type de question (TVA, statut, déclaration...)
    // - Réponse factuelle basée sur la législation
    // - Toujours inclure le disclaimer

    return this.createStubResponse(startTime)
  }

  /**
   * Crée une réponse stub
   */
  private createStubResponse(startTime: number): AccountingResponse {
    return {
      agentType: 'accounting',
      category: 'business',
      status: 'skipped',
      priority: 'low',
      confidence: 0,
      processingTimeMs: Date.now() - startTime,
      timestamp: Date.now(),
      advice: {
        summary: 'Fonctionnalité en cours de développement',
        details: 'Le sous-agent Comptabilité sera disponible dans une prochaine version.',
        suggestedActions: ['Consulter un expert-comptable'],
      },
      data: {
        type: 'accounting_advice',
        disclaimer: ACCOUNTING_DISCLAIMER,
      },
    }
  }

  // ============================================================================
  // Méthodes préparées pour l'implémentation future
  // ============================================================================

  /**
   * Types de questions comptables supportées
   * @future
   */
  private readonly questionTypes = [
    'tva',           // Questions sur la TVA
    'status',        // Statuts juridiques (auto-entrepreneur, SASU...)
    'declaration',   // Déclarations fiscales
    'facture',       // Facturation
    'seuils',        // Seuils de chiffre d'affaires
    'charges',       // Charges et cotisations
  ]

  /**
   * Détecte le type de question comptable
   * @future
   */
   
  private detectQuestionType(_input: string): string | null {
    // TODO: Implémenter la détection via patterns/NLP
    return null
  }

  /**
   * Base de connaissances simplifiée
   * @future
   */
  private readonly knowledgeBase: Record<string, {
    summary: string
    details: string
    links?: string[]
  }> = {
    'auto_entrepreneur_seuils': {
      summary: 'Seuils auto-entrepreneur 2024',
      details: 'Services : 77 700€ - Vente : 188 700€',
      links: ['https://www.autoentrepreneur.urssaf.fr'],
    },
    'tva_franchise': {
      summary: 'Franchise en base de TVA',
      details: 'Pas de TVA à facturer si CA < seuils de franchise',
    },
  }
}

// Instance singleton
export const accountingSubAgent = new AccountingSubAgent()





