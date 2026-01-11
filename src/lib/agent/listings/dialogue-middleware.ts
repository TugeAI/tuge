/**
 * Dialogue Middleware pour les opérations Listings
 * 
 * Intercepte les messages AVANT l'appel au LLM pour :
 * 1. Classifier l'intention utilisateur
 * 2. Vérifier si une action est en attente (sélection/confirmation)
 * 3. Exécuter directement les tools si les conditions sont remplies
 * 4. Enrichir le contexte pour le LLM si nécessaire
 * 
 * Ce middleware garantit que les actions sont exécutées de manière fiable
 * et que le LLM ne peut pas "simuler" des changements d'état.
 */

import {
  classifyListingIntent,
  isConfirmationResponse,
  isNumericSelection,
  type ListingIntent,
  type IntentClassification,
} from './intent-router'

import {
  type DialogueState,
  type PendingAction,
  type ActionCandidate,
  createDialogueState,
  clearPendingAction,
  isAwaitingResponse,
  getPendingAction,
  initiateSelection,
  initiateConfirmation,
  processSelection,
  processConfirmation,
  buildSelectionMessage,
  buildBulkDeleteConfirmationMessage,
  deserializeDialogueState,
  serializeDialogueState,
} from './dialogue-state'

import {
  handleGetMyListings,
  handleSearchUserListings,
  handleActivateListing,
  handleDeleteDraftListing,
  handleBulkDeleteDrafts,
  type ToolExecutionContext,
} from '../tools/handlers'

import type { GetMyListingsResult, SearchUserListingsResult } from '../tools/definitions'

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration du middleware
 */
export interface DialogueMiddlewareConfig {
  /** Activer le logging de debug */
  debug?: boolean
  /** Forcer le rafraîchissement de la liste après chaque action */
  autoRefreshAfterAction?: boolean
}

/**
 * Résultat du traitement du middleware
 */
export interface DialogueResult {
  /** Indique si le middleware a traité le message (skip LLM) */
  handled: boolean
  /** Réponse directe à envoyer à l'utilisateur */
  directResponse?: string
  /** Action exécutée (si applicable) */
  executedAction?: {
    type: string
    success: boolean
    result: unknown
  }
  /** Liste rafraîchie des annonces (après action) */
  refreshedListings?: GetMyListingsResult
  /** Nouvel état du dialogue */
  newState: DialogueState
  /** Intent classifié */
  intent?: IntentClassification
  /** Contexte enrichi pour le LLM (si handled=false) */
  enrichedContext?: string
}

/**
 * Contexte d'exécution du middleware
 */
export interface MiddlewareContext {
  userId: string
  conversationId: string
  toolContext: ToolExecutionContext
  config?: DialogueMiddlewareConfig
}

// ============================================================================
// Middleware principal
// ============================================================================

/**
 * Traite un message utilisateur avec le middleware de dialogue
 * 
 * @param message - Le message de l'utilisateur
 * @param currentStateJson - L'état actuel du dialogue (JSON sérialisé)
 * @param context - Le contexte d'exécution
 * @returns Le résultat du traitement
 */
export async function processDialogueMessage(
  message: string,
  currentStateJson: string | null | undefined,
  context: MiddlewareContext
): Promise<DialogueResult> {
  const config = context.config || {}
  const debug = config.debug ?? false
  
  // Désérialiser l'état actuel
  let state = deserializeDialogueState(currentStateJson)
  
  if (debug) {
    console.log('[DialogueMiddleware] Current state:', state.state)
    console.log('[DialogueMiddleware] Message:', message)
  }
  
  // ============================================================================
  // Phase 1 : Vérifier si on attend une réponse (sélection/confirmation)
  // ============================================================================
  
  if (isAwaitingResponse(state)) {
    const pendingAction = getPendingAction(state)
    
    if (pendingAction) {
      // Vérifier si c'est une sélection numérique
      if (state.state === 'awaiting_selection') {
        const selection = isNumericSelection(message)
        
        if (selection !== null) {
          const transitionResult = processSelection(state, selection)
          
          if (transitionResult.skipLLM) {
            return {
              handled: true,
              directResponse: transitionResult.userMessage,
              newState: transitionResult.newState,
            }
          }
          
          // La sélection a mené à une confirmation, mettre à jour l'état
          state = transitionResult.newState
          // Continuer vers la phase de confirmation si actionToExecute
        }
      }
      
      // Vérifier si c'est une confirmation (oui/non)
      if (state.state === 'awaiting_confirmation') {
        const confirmation = isConfirmationResponse(message)
        
        if (confirmation !== null) {
          const confirmed = confirmation === 'yes'
          const transitionResult = processConfirmation(state, confirmed)
          
          if (transitionResult.skipLLM && !transitionResult.actionToExecute) {
            return {
              handled: true,
              directResponse: transitionResult.userMessage,
              newState: transitionResult.newState,
            }
          }
          
          // Exécuter l'action si confirmée
          if (transitionResult.actionToExecute) {
            const actionResult = await executeAction(
              transitionResult.actionToExecute,
              context.toolContext
            )
            
            // Rafraîchir la liste si demandé
            let refreshedListings: GetMyListingsResult | undefined
            if (config.autoRefreshAfterAction && actionResult.success) {
              refreshedListings = await handleGetMyListings(
                { status: 'all', limit: 20 },
                context.toolContext
              )
            }
            
            return {
              handled: false, // Le LLM doit annoncer le résultat
              executedAction: {
                type: transitionResult.actionToExecute.type,
                success: actionResult.success,
                result: actionResult.result,
              },
              refreshedListings,
              newState: transitionResult.newState,
              enrichedContext: buildActionResultContext(actionResult, refreshedListings),
            }
          }
        }
      }
    }
  }
  
  // ============================================================================
  // Phase 2 : Classifier l'intention du message
  // ============================================================================
  
  const intent = classifyListingIntent(message)
  
  if (debug) {
    console.log('[DialogueMiddleware] Detected intent:', intent.intent, 'confidence:', intent.confidence)
  }
  
  // Si l'intention n'est pas reconnue ou confiance trop faible, laisser le LLM gérer
  if (intent.intent === 'UNKNOWN' || intent.confidence < 0.3) {
    return {
      handled: false,
      newState: clearPendingAction(state),
      intent,
    }
  }
  
  // ============================================================================
  // Phase 3 : Traiter selon l'intention
  // ============================================================================
  
  switch (intent.intent) {
    case 'LIST_LISTINGS':
      return await handleListListings(state, intent, context)
    
    case 'FILTER_LISTINGS':
      return await handleFilterListings(state, intent, context)
    
    case 'ACTIVATE_LISTING':
      return await handleActivateListing_Intent(state, intent, message, context)
    
    case 'DELETE_DRAFTS':
      return await handleDeleteDrafts_Intent(state, intent, context)
    
    case 'DELETE_ONE_DRAFT':
      return await handleDeleteOneDraft_Intent(state, intent, message, context)
    
    default:
      // CREATE_DRAFT, UPDATE_DRAFT : laisser le LLM gérer
      return {
        handled: false,
        newState: clearPendingAction(state),
        intent,
      }
  }
}

// ============================================================================
// Handlers par intention
// ============================================================================

/**
 * Gère LIST_LISTINGS : affiche toutes les annonces
 */
async function handleListListings(
  state: DialogueState,
  intent: IntentClassification,
  context: MiddlewareContext
): Promise<DialogueResult> {
  const result = await handleGetMyListings(
    { status: intent.params.statusFilter || 'all', limit: 20 },
    context.toolContext
  )
  
  return {
    handled: false, // Le LLM doit formater la réponse
    newState: clearPendingAction(state),
    intent,
    enrichedContext: buildListingsContext(result),
    refreshedListings: result,
  }
}

/**
 * Gère FILTER_LISTINGS : recherche et filtre les annonces
 */
async function handleFilterListings(
  state: DialogueState,
  intent: IntentClassification,
  context: MiddlewareContext
): Promise<DialogueResult> {
  const result = await handleSearchUserListings(
    {
      query: intent.params.query,
      status: intent.params.statusFilter || 'all',
      category: intent.params.categoryHint as 'service' | 'product' | 'job' | 'other' | undefined,
      limit: 20,
    },
    context.toolContext
  )
  
  return {
    handled: false, // Le LLM doit formater la réponse
    newState: clearPendingAction(state),
    intent,
    enrichedContext: buildSearchResultsContext(result, intent.params.query),
    refreshedListings: result as unknown as GetMyListingsResult,
  }
}

/**
 * Gère ACTIVATE_LISTING : active un brouillon ou réactive une annonce
 */
async function handleActivateListing_Intent(
  state: DialogueState,
  intent: IntentClassification,
  message: string,
  context: MiddlewareContext
): Promise<DialogueResult> {
  // D'abord, récupérer les annonces pour identifier les candidats
  const listings = await handleGetMyListings(
    { status: 'all', limit: 50 },
    context.toolContext
  )
  
  if (!listings.success) {
    return {
      handled: false,
      newState: clearPendingAction(state),
      intent,
      enrichedContext: 'Erreur lors de la récupération des annonces.',
    }
  }
  
  // Identifier les candidats à activer
  const targetTitle = intent.params.targetTitle?.toLowerCase()
  let candidates: ActionCandidate[]
  
  if (targetTitle) {
    // Recherche par titre
    candidates = listings.listings
      .filter(l => 
        (l.isDraft || !l.isActive) && // Brouillons ou inactifs
        l.title.toLowerCase().includes(targetTitle)
      )
      .map(l => ({
        id: l.id,
        title: l.title,
        status: l.isDraft ? 'draft' as const : (l.isActive ? 'active' as const : 'inactive' as const),
        price: l.price,
        category: l.category,
        createdAt: l.createdAt,
      }))
  } else {
    // Pas de titre spécifié, prendre tous les brouillons
    candidates = listings.listings
      .filter(l => l.isDraft)
      .map(l => ({
        id: l.id,
        title: l.title,
        status: 'draft' as const,
        price: l.price,
        category: l.category,
        createdAt: l.createdAt,
      }))
  }
  
  // Pas de candidat trouvé
  if (candidates.length === 0) {
    return {
      handled: false,
      newState: clearPendingAction(state),
      intent,
      enrichedContext: targetTitle
        ? `Aucun brouillon ou annonce inactive trouvé avec le titre "${targetTitle}".`
        : 'Aucun brouillon à activer.',
    }
  }
  
  // Un seul candidat : demander confirmation
  if (candidates.length === 1) {
    const newState = initiateConfirmation(
      state,
      'ACTIVATE_LISTING',
      candidates,
      context.userId,
      message,
      intent.intent,
      candidates[0].id
    )
    
    return {
      handled: true,
      directResponse: `Voulez-vous activer l'annonce "${candidates[0].title}" ? (oui / non)`,
      newState,
      intent,
    }
  }
  
  // Plusieurs candidats : demander sélection
  const newState = initiateSelection(
    state,
    'ACTIVATE_LISTING',
    candidates,
    context.userId,
    message,
    intent.intent
  )
  
  return {
    handled: true,
    directResponse: buildSelectionMessage('ACTIVATE_LISTING', candidates),
    newState,
    intent,
  }
}

/**
 * Gère DELETE_DRAFTS : supprime tous les brouillons
 */
async function handleDeleteDrafts_Intent(
  state: DialogueState,
  intent: IntentClassification,
  context: MiddlewareContext
): Promise<DialogueResult> {
  // Récupérer les brouillons
  const listings = await handleGetMyListings(
    { status: 'draft', limit: 50 },
    context.toolContext
  )
  
  if (!listings.success) {
    return {
      handled: false,
      newState: clearPendingAction(state),
      intent,
      enrichedContext: 'Erreur lors de la récupération des brouillons.',
    }
  }
  
  const drafts = listings.listings.filter(l => l.isDraft)
  
  if (drafts.length === 0) {
    return {
      handled: true,
      directResponse: 'Vous n\'avez aucun brouillon à supprimer.',
      newState: clearPendingAction(state),
      intent,
    }
  }
  
  // Créer les candidats
  const candidates: ActionCandidate[] = drafts.map(d => ({
    id: d.id,
    title: d.title,
    status: 'draft' as const,
    price: d.price,
    category: d.category,
    createdAt: d.createdAt,
  }))
  
  // Demander confirmation
  const newState = initiateConfirmation(
    state,
    'DELETE_DRAFTS',
    candidates,
    context.userId,
    'supprimer tous les brouillons',
    intent.intent
  )
  
  return {
    handled: true,
    directResponse: buildBulkDeleteConfirmationMessage(drafts.length),
    newState,
    intent,
  }
}

/**
 * Gère DELETE_ONE_DRAFT : supprime un brouillon spécifique
 */
async function handleDeleteOneDraft_Intent(
  state: DialogueState,
  intent: IntentClassification,
  message: string,
  context: MiddlewareContext
): Promise<DialogueResult> {
  // Récupérer les brouillons
  const listings = await handleGetMyListings(
    { status: 'draft', limit: 50 },
    context.toolContext
  )
  
  if (!listings.success) {
    return {
      handled: false,
      newState: clearPendingAction(state),
      intent,
      enrichedContext: 'Erreur lors de la récupération des brouillons.',
    }
  }
  
  const drafts = listings.listings.filter(l => l.isDraft)
  
  if (drafts.length === 0) {
    return {
      handled: true,
      directResponse: 'Vous n\'avez aucun brouillon à supprimer.',
      newState: clearPendingAction(state),
      intent,
    }
  }
  
  // Identifier les candidats
  const targetTitle = intent.params.targetTitle?.toLowerCase()
  let candidates: ActionCandidate[]
  
  if (targetTitle) {
    candidates = drafts
      .filter(d => d.title.toLowerCase().includes(targetTitle))
      .map(d => ({
        id: d.id,
        title: d.title,
        status: 'draft' as const,
        price: d.price,
        category: d.category,
        createdAt: d.createdAt,
      }))
  } else {
    // Pas de titre spécifié, demander de choisir parmi tous les brouillons
    candidates = drafts.map(d => ({
      id: d.id,
      title: d.title,
      status: 'draft' as const,
      price: d.price,
      category: d.category,
      createdAt: d.createdAt,
    }))
  }
  
  if (candidates.length === 0) {
    return {
      handled: true,
      directResponse: `Aucun brouillon trouvé avec le titre "${targetTitle}".`,
      newState: clearPendingAction(state),
      intent,
    }
  }
  
  if (candidates.length === 1) {
    const newState = initiateConfirmation(
      state,
      'DELETE_ONE_DRAFT',
      candidates,
      context.userId,
      message,
      intent.intent,
      candidates[0].id
    )
    
    return {
      handled: true,
      directResponse: `Confirmez-vous la suppression définitive du brouillon "${candidates[0].title}" ? (oui / non)`,
      newState,
      intent,
    }
  }
  
  // Plusieurs candidats : demander sélection
  const newState = initiateSelection(
    state,
    'DELETE_ONE_DRAFT',
    candidates,
    context.userId,
    message,
    intent.intent
  )
  
  return {
    handled: true,
    directResponse: buildSelectionMessage('DELETE_ONE_DRAFT', candidates),
    newState,
    intent,
  }
}

// ============================================================================
// Exécution des actions
// ============================================================================

interface ActionExecutionResult {
  success: boolean
  result: unknown
  message?: string
}

/**
 * Exécute une action après confirmation
 */
async function executeAction(
  action: { type: string; targetId?: string; candidates?: ActionCandidate[] },
  toolContext: ToolExecutionContext
): Promise<ActionExecutionResult> {
  switch (action.type) {
    case 'ACTIVATE_LISTING': {
      if (!action.targetId) {
        return { success: false, result: null, message: 'ID manquant' }
      }
      
      // Déterminer la source (draft ou listing)
      const candidate = action.candidates?.find(c => c.id === action.targetId)
      const source = candidate?.status === 'draft' ? 'draft' : 'listing'
      
      const result = await handleActivateListing(
        { id: action.targetId, source, confirm: true },
        toolContext
      )
      
      return {
        success: result.success,
        result,
        message: result.message,
      }
    }
    
    case 'DELETE_ONE_DRAFT': {
      if (!action.targetId) {
        return { success: false, result: null, message: 'ID manquant' }
      }
      
      const result = await handleDeleteDraftListing(
        { draftId: action.targetId, confirm: true },
        toolContext
      )
      
      return {
        success: result.success,
        result,
        message: result.message,
      }
    }
    
    case 'DELETE_DRAFTS': {
      const result = await handleBulkDeleteDrafts(
        { confirm: true },
        toolContext
      )
      
      return {
        success: result.success,
        result,
        message: result.message,
      }
    }
    
    default:
      return { success: false, result: null, message: 'Action non supportée' }
  }
}

// ============================================================================
// Construction du contexte enrichi
// ============================================================================

/**
 * Construit le contexte enrichi pour le résultat d'une action
 */
function buildActionResultContext(
  actionResult: ActionExecutionResult,
  refreshedListings?: GetMyListingsResult
): string {
  let context = `## Résultat de l'action\n`
  context += `- Succès: ${actionResult.success ? 'OUI' : 'NON'}\n`
  context += `- Message: ${actionResult.message || 'Aucun message'}\n`
  
  if (refreshedListings) {
    context += `\n## État actuel des annonces\n`
    context += buildListingsContext(refreshedListings)
  }
  
  return context
}

/**
 * Construit le contexte pour afficher les annonces
 */
function buildListingsContext(result: GetMyListingsResult): string {
  if (!result.success) {
    return `Erreur: ${result.error || 'Impossible de récupérer les annonces'}`
  }
  
  if (result.listings.length === 0) {
    return 'Aucune annonce.'
  }
  
  let context = `${result.totalCount} annonce(s) trouvée(s):\n\n`
  
  result.listings.forEach((listing, index) => {
    const status = listing.isDraft ? '📝 BROUILLON' : (listing.isActive ? '✅ ACTIVE' : '⏸️ INACTIVE')
    const price = listing.price ? `${listing.price}€` : 'Prix non défini'
    context += `${index + 1}. **${listing.title}** - ${price} (${status})\n`
    context += `   ID: ${listing.id}\n`
    context += `   Catégorie: ${listing.category}\n`
  })
  
  return context
}

/**
 * Construit le contexte pour les résultats de recherche
 */
function buildSearchResultsContext(
  result: SearchUserListingsResult,
  query?: string
): string {
  if (!result.success) {
    return `Erreur de recherche: ${result.error || 'Impossible de rechercher'}`
  }
  
  if (result.listings.length === 0) {
    return query
      ? `Aucune annonce trouvée pour "${query}".`
      : 'Aucune annonce correspondante.'
  }
  
  let context = `## Résultats de recherche${query ? ` pour "${query}"` : ''}\n`
  context += `${result.totalCount} annonce(s) correspondante(s):\n\n`
  
  result.listings.forEach((listing, index) => {
    const status = listing.isDraft ? '📝 BROUILLON' : (listing.isActive ? '✅ ACTIVE' : '⏸️ INACTIVE')
    const price = listing.price ? `${listing.price}€` : 'Prix non défini'
    context += `${index + 1}. **${listing.title}** - ${price} (${status})\n`
    context += `   ID: ${listing.id}\n`
  })
  
  return context
}

// ============================================================================
// Exports utilitaires
// ============================================================================

export {
  serializeDialogueState,
  deserializeDialogueState,
  createDialogueState,
}





