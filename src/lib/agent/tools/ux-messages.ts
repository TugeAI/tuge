/**
 * Messages UX standardisés pour les outils de l'agent IA
 * 
 * Ce module fournit des helpers pour formater les résultats des outils
 * en messages user-friendly avec un format cohérent :
 * - Ce qui a été fait
 * - Résumé du résultat
 * - Prochaine action claire
 */

import type {
  CreateListingDraftResult,
  SearchProductsResult,
  SuggestReferralMessageResult,
  GetMyListingsResult,
  UpdateListingResult,
  DeleteListingResult,
  ListingCategory,
  PriceType,
} from './definitions'

// ============================================================================
// Types
// ============================================================================

/**
 * Niveau d'impact d'une recommandation
 */
export type RecommendationImpact = 'high' | 'medium' | 'low'

/**
 * Niveau d'effort requis pour une recommandation
 */
export type RecommendationEffort = 'low' | 'medium' | 'high'

/**
 * Recommandation business générée par le Coach IA
 * 
 * Chaque recommandation est actionnable et priorisée.
 * Le système garantit max 3 recommandations avec exactement 1 high-impact.
 */
export interface Recommendation {
  /** Identifiant unique de la recommandation */
  id: string
  /** Titre court et accrocheur */
  title: string
  /** Explication du "pourquoi" - bénéfice concret */
  why: string
  /** Niveau d'impact sur le succès de l'utilisateur */
  impact: RecommendationImpact
  /** Effort requis pour réaliser l'action */
  effort: RecommendationEffort
  /** Call-to-action clair (texte du bouton) */
  action: string
}

/**
 * Message UX standardisé retourné après chaque appel d'outil
 */
export interface ToolUXMessage {
  /** Ce qui a été fait (ex: "Brouillon d'annonce créé") */
  actionDone: string
  /** Résumé concis du résultat */
  resultSummary: string
  /** Une seule action claire à effectuer ensuite */
  nextAction: string
  /** Score de complétion de 0 à 100 */
  completionScore: number
  /** Recommandations business (max 3, exactement 1 high-impact) */
  recommendations?: Recommendation[]
}

// ============================================================================
// Helpers de formatage
// ============================================================================

/**
 * Formate le prix pour l'affichage
 */
function formatPrice(price?: number, priceType?: PriceType): string {
  if (!price && priceType === 'free') return 'Gratuit'
  if (!price && priceType === 'negotiable') return 'Prix à négocier'
  if (!price) return ''
  
  const suffix = priceType === 'hourly' ? '/h' : ''
  return `${price}€${suffix}`
}

/**
 * Formate la catégorie pour l'affichage
 */
function formatCategory(category: ListingCategory): string {
  const labels: Record<ListingCategory, string> = {
    service: 'Service',
    product: 'Produit',
    job: 'Offre d\'emploi',
    other: 'Autre',
  }
  return labels[category] || category
}

// ============================================================================
// Formatters par outil
// ============================================================================

/**
 * Formate le message UX pour create_listing_draft
 */
export function formatCreateListingDraftUX(
  result: CreateListingDraftResult
): ToolUXMessage {
  if (!result.success) {
    return {
      actionDone: 'Création du brouillon échouée',
      resultSummary: result.error === 'NOT_AUTHENTICATED' 
        ? 'Vous devez être connecté pour créer une annonce.'
        : result.message,
      nextAction: result.error === 'NOT_AUTHENTICATED'
        ? 'Connectez-vous ou inscrivez-vous pour continuer.'
        : 'Réessayez ou reformulez votre demande.',
      completionScore: 0,
    }
  }

  const draft = result.draft
  if (!draft) {
    return {
      actionDone: 'Brouillon préparé',
      resultSummary: result.message,
      nextAction: 'Connectez-vous pour sauvegarder votre brouillon.',
      completionScore: 50,
    }
  }

  // Construire le résumé
  const priceStr = formatPrice(draft.price, draft.priceType)
  const categoryStr = formatCategory(draft.category)
  const locationStr = draft.location ? ` à ${draft.location}` : ''
  
  const summaryParts = [`"${draft.title}"`, categoryStr]
  if (priceStr) summaryParts.push(priceStr)
  if (locationStr) summaryParts.push(locationStr)

  // Score selon si sauvegardé en DB ou non
  const completionScore = result.draftId ? 100 : 80

  return {
    actionDone: 'Brouillon d\'annonce créé',
    resultSummary: summaryParts.join(' • '),
    nextAction: result.draftId 
      ? 'Retrouvez-le dans Mes brouillons pour le modifier ou publier.'
      : 'Connectez-vous pour sauvegarder et publier votre annonce.',
    completionScore,
  }
}

/**
 * Formate le message UX pour search_products
 */
export function formatSearchProductsUX(
  result: SearchProductsResult
): ToolUXMessage {
  if (!result.success) {
    return {
      actionDone: 'Recherche effectuée',
      resultSummary: result.error || 'Une erreur est survenue.',
      nextAction: 'Réessayez avec d\'autres termes de recherche.',
      completionScore: 0,
    }
  }

  const count = result.totalFound

  if (count === 0) {
    return {
      actionDone: 'Recherche effectuée',
      resultSummary: 'Aucune annonce correspondante trouvée.',
      nextAction: 'Essayez avec d\'autres mots-clés ou sans filtres.',
      completionScore: 50,
    }
  }

  // Construire le résumé avec les premiers résultats
  const firstResults = result.results.slice(0, 3)
  const titles = firstResults.map(r => `"${r.title}"`).join(', ')
  const moreText = count > 3 ? ` et ${count - 3} autre${count - 3 > 1 ? 's' : ''}` : ''

  return {
    actionDone: 'Recherche effectuée',
    resultSummary: `${count} annonce${count > 1 ? 's' : ''} trouvée${count > 1 ? 's' : ''} : ${titles}${moreText}.`,
    nextAction: 'Consultez les détails ou affinez votre recherche.',
    completionScore: 100,
  }
}

/**
 * Formate le message UX pour suggest_referral_message
 */
export function formatSuggestReferralMessageUX(
  result: SuggestReferralMessageResult
): ToolUXMessage {
  if (!result.success) {
    return {
      actionDone: 'Génération du message échouée',
      resultSummary: result.error || 'Une erreur est survenue.',
      nextAction: 'Réessayez ou précisez le contexte souhaité.',
      completionScore: 0,
    }
  }

  // Score selon si code personnel ou générique
  const hasPersonalCode = result.referralCode && result.referralCode !== 'VOTRE-CODE'
  const completionScore = hasPersonalCode ? 100 : 80

  // Résumé avec aperçu du message
  const messagePreview = result.suggestedMessage 
    ? result.suggestedMessage.substring(0, 60) + (result.suggestedMessage.length > 60 ? '...' : '')
    : 'Message généré'

  return {
    actionDone: 'Message de parrainage généré',
    resultSummary: messagePreview,
    nextAction: hasPersonalCode
      ? 'Copiez et partagez ce message avec votre code personnel.'
      : 'Connectez-vous pour obtenir votre code parrain personnel.',
    completionScore,
  }
}

/**
 * Formate le message UX pour get_my_listings
 */
export function formatGetMyListingsUX(
  result: GetMyListingsResult
): ToolUXMessage {
  if (!result.success) {
    return {
      actionDone: 'Récupération des annonces échouée',
      resultSummary: result.error === 'NOT_AUTHENTICATED' 
        ? 'Vous devez être connecté pour voir vos annonces.'
        : result.message,
      nextAction: result.error === 'NOT_AUTHENTICATED'
        ? 'Connectez-vous pour accéder à vos annonces.'
        : 'Réessayez ou contactez le support.',
      completionScore: 0,
    }
  }

  const count = result.totalCount

  if (count === 0) {
    return {
      actionDone: 'Annonces consultées',
      resultSummary: 'Vous n\'avez aucune annonce pour le moment.',
      nextAction: 'Créez votre première annonce pour commencer à vendre.',
      completionScore: 100,
    }
  }

  const activeCount = result.listings.filter(l => l.isActive && !l.isDraft).length
  const draftCount = result.listings.filter(l => l.isDraft).length
  
  const parts = []
  if (activeCount > 0) parts.push(`${activeCount} active${activeCount > 1 ? 's' : ''}`)
  if (draftCount > 0) parts.push(`${draftCount} brouillon${draftCount > 1 ? 's' : ''}`)

  return {
    actionDone: 'Annonces récupérées',
    resultSummary: `${count} annonce${count > 1 ? 's' : ''} : ${parts.join(', ')}.`,
    nextAction: 'Gérez vos annonces : modifiez, activez ou supprimez.',
    completionScore: 100,
  }
}

/**
 * Formate le message UX pour update_listing
 */
export function formatUpdateListingUX(
  result: UpdateListingResult
): ToolUXMessage {
  if (!result.success) {
    const errorMessages: Record<string, string> = {
      'NOT_AUTHENTICATED': 'Vous devez être connecté pour modifier une annonce.',
      'NOT_FOUND': 'Cette annonce n\'existe pas ou a été supprimée.',
      'NOT_OWNER': 'Vous ne pouvez modifier que vos propres annonces.',
      'NO_CHANGES': 'Aucune modification n\'a été spécifiée.',
    }

    return {
      actionDone: 'Modification échouée',
      resultSummary: errorMessages[result.error || ''] || result.message,
      nextAction: result.error === 'NOT_AUTHENTICATED'
        ? 'Connectez-vous pour modifier vos annonces.'
        : 'Vérifiez l\'annonce et réessayez.',
      completionScore: 0,
    }
  }

  const listing = result.listing
  if (!listing) {
    return {
      actionDone: 'Annonce modifiée',
      resultSummary: result.message,
      nextAction: 'Consultez votre annonce mise à jour.',
      completionScore: 100,
    }
  }

  const statusText = listing.isActive ? 'active' : 'désactivée'

  return {
    actionDone: 'Annonce modifiée',
    resultSummary: `"${listing.title}" mise à jour (${statusText}).`,
    nextAction: listing.isActive 
      ? 'Votre annonce est visible par tous les utilisateurs.'
      : 'Réactivez votre annonce pour la rendre visible.',
    completionScore: 100,
  }
}

/**
 * Formate le message UX pour delete_listing
 */
export function formatDeleteListingUX(
  result: DeleteListingResult
): ToolUXMessage {
  if (!result.success) {
    const errorMessages: Record<string, string> = {
      'NOT_AUTHENTICATED': 'Vous devez être connecté pour supprimer une annonce.',
      'NOT_FOUND': 'Cette annonce n\'existe pas ou a déjà été supprimée.',
      'NOT_OWNER': 'Vous ne pouvez supprimer que vos propres annonces.',
      'NOT_CONFIRMED': 'La suppression doit être confirmée.',
    }

    return {
      actionDone: 'Suppression échouée',
      resultSummary: errorMessages[result.error || ''] || result.message,
      nextAction: result.error === 'NOT_CONFIRMED'
        ? 'Confirmez la suppression pour continuer.'
        : 'Vérifiez l\'annonce et réessayez.',
      completionScore: 0,
    }
  }

  return {
    actionDone: 'Annonce supprimée',
    resultSummary: result.message,
    nextAction: 'L\'annonce a été définitivement retirée.',
    completionScore: 100,
  }
}

// ============================================================================
// Helper générique
// ============================================================================

/**
 * Types des outils supportés
 */
export type SupportedToolName = 
  | 'create_listing_draft' 
  | 'search_products' 
  | 'suggest_referral_message'
  | 'get_my_listings'
  | 'update_listing'
  | 'delete_listing'

/**
 * Union des résultats possibles
 */
export type AnyToolResult = 
  | CreateListingDraftResult 
  | SearchProductsResult 
  | SuggestReferralMessageResult
  | GetMyListingsResult
  | UpdateListingResult
  | DeleteListingResult

/**
 * Formate le message UX pour n'importe quel outil supporté
 */
export function formatToolUXMessage(
  toolName: SupportedToolName,
  result: AnyToolResult
): ToolUXMessage {
  switch (toolName) {
    case 'create_listing_draft':
      return formatCreateListingDraftUX(result as CreateListingDraftResult)
    case 'search_products':
      return formatSearchProductsUX(result as SearchProductsResult)
    case 'suggest_referral_message':
      return formatSuggestReferralMessageUX(result as SuggestReferralMessageResult)
    case 'get_my_listings':
      return formatGetMyListingsUX(result as GetMyListingsResult)
    case 'update_listing':
      return formatUpdateListingUX(result as UpdateListingResult)
    case 'delete_listing':
      return formatDeleteListingUX(result as DeleteListingResult)
    default:
      return {
        actionDone: 'Action effectuée',
        resultSummary: 'Résultat disponible.',
        nextAction: 'Continuez la conversation.',
        completionScore: (result as { success?: boolean }).success ? 100 : 0,
      }
  }
}

