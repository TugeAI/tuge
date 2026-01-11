/**
 * Listings Agent Module
 * 
 * Gère le dialogue intelligent pour les opérations sur les annonces :
 * - Routage d'intentions
 * - Machine d'état de dialogue
 * - Middleware de conversation
 */

// Intent Router
export {
  classifyListingIntent,
  isConfirmationResponse,
  isNumericSelection,
  detectCategory,
  detectStatusFilter,
  INTENT_PATTERNS,
  CATEGORY_KEYWORDS,
  type ListingIntent,
  type IntentClassification,
  type IntentParams,
} from './intent-router'

// Dialogue State
export {
  type DialogueState,
  type DialogueStateType,
  type PendingAction,
  type PendingActionType,
  type ActionCandidate,
  type DialogueContext,
  type StateTransitionResult,
  createDialogueState,
  createDialogueContext,
  updateDialogueState,
  getPendingAction,
  clearPendingAction,
  isAwaitingResponse,
  isPendingActionExpired,
  initiateSelection,
  initiateConfirmation,
  processSelection,
  processConfirmation,
  buildSelectionMessage,
  buildConfirmationMessage,
  buildBulkDeleteConfirmationMessage,
  serializeDialogueState,
  deserializeDialogueState,
} from './dialogue-state'

// Dialogue Middleware
export {
  processDialogueMessage,
  type DialogueResult,
  type DialogueMiddlewareConfig,
  type MiddlewareContext,
} from './dialogue-middleware'

