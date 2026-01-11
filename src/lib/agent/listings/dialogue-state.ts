/**
 * Dialogue State Machine pour les opérations Listings
 * 
 * Gère les états de conversation pour garantir l'exécution fiable des actions :
 * - idle : état initial, prêt à recevoir une commande
 * - awaiting_selection : ambiguïté détectée, en attente de choix utilisateur
 * - awaiting_confirmation : action destructive, en attente de confirmation
 * 
 * L'état est stocké dans le contexte de la conversation et persiste
 * entre les messages pour permettre les dialogues multi-tours.
 */

import type { ListingIntent } from './intent-router'

// ============================================================================
// Types
// ============================================================================

/**
 * États possibles du dialogue
 */
export type DialogueStateType = 
  | 'idle'                    // Prêt à recevoir une commande
  | 'awaiting_selection'      // En attente d'une sélection (1, 2, 3...)
  | 'awaiting_confirmation'   // En attente de confirmation (oui/non)

/**
 * Candidat pour une action (annonce ou brouillon)
 */
export interface ActionCandidate {
  id: string
  title: string
  status: 'active' | 'inactive' | 'draft'
  price?: number
  category?: string
  createdAt?: string
}

/**
 * Type d'action en attente
 */
export type PendingActionType =
  | 'ACTIVATE_LISTING'
  | 'DELETE_DRAFTS'
  | 'DELETE_ONE_DRAFT'

/**
 * Action en attente d'exécution
 */
export interface PendingAction {
  /** Type de l'action */
  type: PendingActionType
  /** Candidats potentiels (pour sélection) */
  candidates: ActionCandidate[]
  /** ID du candidat sélectionné (après sélection) */
  selectedId?: string
  /** ID de l'utilisateur */
  userId: string
  /** Timestamp de création */
  createdAt: number
  /** Message d'origine qui a déclenché l'action */
  originalMessage: string
  /** Intention classifiée */
  intent: ListingIntent
}

/**
 * État complet du dialogue
 */
export interface DialogueState {
  /** État courant */
  state: DialogueStateType
  /** Action en attente (si applicable) */
  pendingAction: PendingAction | null
  /** Nombre de tentatives de clarification */
  clarificationAttempts: number
  /** Dernière mise à jour */
  updatedAt: number
}

/**
 * Contexte du dialogue (passé entre les appels)
 */
export interface DialogueContext {
  userId: string
  conversationId: string
  currentState: DialogueState
}

/**
 * Résultat d'une transition d'état
 */
export interface StateTransitionResult {
  /** Nouvel état */
  newState: DialogueState
  /** Action à exécuter (si l'état permet l'exécution) */
  actionToExecute?: {
    type: PendingActionType
    targetId?: string
    candidates?: ActionCandidate[]
  }
  /** Message à envoyer à l'utilisateur */
  userMessage?: string
  /** Indique si le dialogue doit continuer sans appeler le LLM */
  skipLLM: boolean
}

// ============================================================================
// Constantes
// ============================================================================

/**
 * Timeout pour les actions en attente (5 minutes)
 */
const PENDING_ACTION_TIMEOUT_MS = 5 * 60 * 1000

/**
 * Nombre maximum de tentatives de clarification
 */
const MAX_CLARIFICATION_ATTEMPTS = 3

// ============================================================================
// Factory et helpers
// ============================================================================

/**
 * Crée un nouvel état de dialogue initial
 */
export function createDialogueState(): DialogueState {
  return {
    state: 'idle',
    pendingAction: null,
    clarificationAttempts: 0,
    updatedAt: Date.now(),
  }
}

/**
 * Crée un contexte de dialogue
 */
export function createDialogueContext(
  userId: string,
  conversationId: string,
  existingState?: DialogueState
): DialogueContext {
  return {
    userId,
    conversationId,
    currentState: existingState || createDialogueState(),
  }
}

/**
 * Vérifie si une action en attente a expiré
 */
export function isPendingActionExpired(pendingAction: PendingAction | null): boolean {
  if (!pendingAction) return false
  return Date.now() - pendingAction.createdAt > PENDING_ACTION_TIMEOUT_MS
}

/**
 * Vérifie si le dialogue est en attente d'une réponse utilisateur
 */
export function isAwaitingResponse(state: DialogueState): boolean {
  return state.state === 'awaiting_selection' || state.state === 'awaiting_confirmation'
}

/**
 * Récupère l'action en attente (si valide)
 */
export function getPendingAction(state: DialogueState): PendingAction | null {
  if (!state.pendingAction) return null
  if (isPendingActionExpired(state.pendingAction)) return null
  return state.pendingAction
}

/**
 * Efface l'action en attente et remet l'état à idle
 */
export function clearPendingAction(state: DialogueState): DialogueState {
  return {
    ...state,
    state: 'idle',
    pendingAction: null,
    clarificationAttempts: 0,
    updatedAt: Date.now(),
  }
}

// ============================================================================
// Transitions d'état
// ============================================================================

/**
 * Initie une action en attente de sélection (ambiguïté)
 * 
 * @param state - État actuel
 * @param action - Type d'action
 * @param candidates - Candidats entre lesquels choisir
 * @param userId - ID de l'utilisateur
 * @param originalMessage - Message d'origine
 * @param intent - Intention classifiée
 */
export function initiateSelection(
  state: DialogueState,
  action: PendingActionType,
  candidates: ActionCandidate[],
  userId: string,
  originalMessage: string,
  intent: ListingIntent
): DialogueState {
  return {
    state: 'awaiting_selection',
    pendingAction: {
      type: action,
      candidates,
      userId,
      createdAt: Date.now(),
      originalMessage,
      intent,
    },
    clarificationAttempts: 0,
    updatedAt: Date.now(),
  }
}

/**
 * Initie une action en attente de confirmation
 * 
 * @param state - État actuel
 * @param action - Type d'action
 * @param candidates - Candidats concernés
 * @param userId - ID de l'utilisateur
 * @param originalMessage - Message d'origine
 * @param intent - Intention classifiée
 * @param selectedId - ID du candidat sélectionné (optionnel)
 */
export function initiateConfirmation(
  state: DialogueState,
  action: PendingActionType,
  candidates: ActionCandidate[],
  userId: string,
  originalMessage: string,
  intent: ListingIntent,
  selectedId?: string
): DialogueState {
  return {
    state: 'awaiting_confirmation',
    pendingAction: {
      type: action,
      candidates,
      selectedId,
      userId,
      createdAt: Date.now(),
      originalMessage,
      intent,
    },
    clarificationAttempts: 0,
    updatedAt: Date.now(),
  }
}

/**
 * Traite une sélection numérique de l'utilisateur
 * 
 * @param state - État actuel
 * @param selectionIndex - Index sélectionné (1-based)
 * @returns Résultat de la transition
 */
export function processSelection(
  state: DialogueState,
  selectionIndex: number
): StateTransitionResult {
  const pendingAction = getPendingAction(state)
  
  if (!pendingAction || state.state !== 'awaiting_selection') {
    return {
      newState: clearPendingAction(state),
      userMessage: "Il n'y a pas de sélection en attente.",
      skipLLM: false,
    }
  }
  
  // Vérifier que l'index est valide
  if (selectionIndex < 1 || selectionIndex > pendingAction.candidates.length) {
    const attempts = state.clarificationAttempts + 1
    
    if (attempts >= MAX_CLARIFICATION_ATTEMPTS) {
      return {
        newState: clearPendingAction(state),
        userMessage: "Trop de tentatives. L'action a été annulée.",
        skipLLM: false,
      }
    }
    
    return {
      newState: {
        ...state,
        clarificationAttempts: attempts,
        updatedAt: Date.now(),
      },
      userMessage: `Choix invalide. Veuillez choisir un numéro entre 1 et ${pendingAction.candidates.length}.`,
      skipLLM: true,
    }
  }
  
  // Sélection valide - passer à la confirmation
  const selectedCandidate = pendingAction.candidates[selectionIndex - 1]
  
  return {
    newState: initiateConfirmation(
      state,
      pendingAction.type,
      [selectedCandidate],
      pendingAction.userId,
      pendingAction.originalMessage,
      pendingAction.intent,
      selectedCandidate.id
    ),
    userMessage: buildConfirmationMessage(pendingAction.type, selectedCandidate),
    skipLLM: true,
  }
}

/**
 * Traite une confirmation (oui/non) de l'utilisateur
 * 
 * @param state - État actuel
 * @param confirmed - true si l'utilisateur a confirmé
 * @returns Résultat de la transition
 */
export function processConfirmation(
  state: DialogueState,
  confirmed: boolean
): StateTransitionResult {
  const pendingAction = getPendingAction(state)
  
  if (!pendingAction || state.state !== 'awaiting_confirmation') {
    return {
      newState: clearPendingAction(state),
      userMessage: "Il n'y a pas de confirmation en attente.",
      skipLLM: false,
    }
  }
  
  if (!confirmed) {
    return {
      newState: clearPendingAction(state),
      userMessage: "Action annulée.",
      skipLLM: true,
    }
  }
  
  // Confirmation positive - préparer l'exécution
  return {
    newState: clearPendingAction(state),
    actionToExecute: {
      type: pendingAction.type,
      targetId: pendingAction.selectedId || pendingAction.candidates[0]?.id,
      candidates: pendingAction.candidates,
    },
    skipLLM: false, // Le LLM doit annoncer le résultat
  }
}

/**
 * Met à jour l'état du dialogue
 */
export function updateDialogueState(
  currentState: DialogueState,
  updates: Partial<DialogueState>
): DialogueState {
  return {
    ...currentState,
    ...updates,
    updatedAt: Date.now(),
  }
}

// ============================================================================
// Génération de messages
// ============================================================================

/**
 * Génère le message de sélection pour une liste de candidats
 */
export function buildSelectionMessage(
  actionType: PendingActionType,
  candidates: ActionCandidate[]
): string {
  const actionVerb = getActionVerb(actionType)
  
  let message = `J'ai trouvé ${candidates.length} éléments correspondants. Lequel voulez-vous ${actionVerb} ?\n\n`
  
  candidates.forEach((candidate, index) => {
    const statusLabel = getStatusLabel(candidate.status)
    const priceStr = candidate.price ? ` - ${candidate.price}€` : ''
    message += `${index + 1}. **${candidate.title}**${priceStr} (${statusLabel})\n`
  })
  
  message += '\nRépondez avec le numéro de votre choix (1, 2, 3...).'
  
  return message
}

/**
 * Génère le message de confirmation
 */
export function buildConfirmationMessage(
  actionType: PendingActionType,
  candidate: ActionCandidate
): string {
  switch (actionType) {
    case 'ACTIVATE_LISTING':
      return `Confirmez-vous la publication de l'annonce "${candidate.title}" ? (oui / non)`
    
    case 'DELETE_ONE_DRAFT':
      return `Confirmez-vous la suppression définitive du brouillon "${candidate.title}" ? (oui / non)`
    
    case 'DELETE_DRAFTS':
      return `Confirmez-vous la suppression définitive de ce brouillon ? (oui / non)`
    
    default:
      return `Confirmez-vous cette action sur "${candidate.title}" ? (oui / non)`
  }
}

/**
 * Génère le message de confirmation pour suppression en masse
 */
export function buildBulkDeleteConfirmationMessage(count: number): string {
  return `Confirmez-vous la suppression définitive de ${count} brouillon${count > 1 ? 's' : ''} ? (oui / non)\n\n⚠️ Cette action est irréversible. Vos annonces publiées resteront intactes.`
}

// ============================================================================
// Helpers
// ============================================================================

function getActionVerb(actionType: PendingActionType): string {
  switch (actionType) {
    case 'ACTIVATE_LISTING':
      return 'activer'
    case 'DELETE_ONE_DRAFT':
    case 'DELETE_DRAFTS':
      return 'supprimer'
    default:
      return 'traiter'
  }
}

function getStatusLabel(status: ActionCandidate['status']): string {
  switch (status) {
    case 'active':
      return '✅ active'
    case 'inactive':
      return '⏸️ inactive'
    case 'draft':
      return '📝 brouillon'
    default:
      return status
  }
}

// ============================================================================
// Sérialisation pour stockage
// ============================================================================

/**
 * Sérialise l'état du dialogue pour stockage (JSON)
 */
export function serializeDialogueState(state: DialogueState): string {
  return JSON.stringify(state)
}

/**
 * Désérialise l'état du dialogue depuis le stockage
 */
export function deserializeDialogueState(json: string | null | undefined): DialogueState {
  if (!json) {
    return createDialogueState()
  }
  
  try {
    const parsed = JSON.parse(json) as DialogueState
    
    // Vérifier si l'action en attente a expiré
    if (parsed.pendingAction && isPendingActionExpired(parsed.pendingAction)) {
      return clearPendingAction(parsed)
    }
    
    return parsed
  } catch {
    return createDialogueState()
  }
}





