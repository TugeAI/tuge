/**
 * Module de suggestions proactives pour l'agent IA
 * 
 * Ce module gère la création et l'évaluation de suggestions contextuelles
 * pour guider les utilisateurs sur la plateforme.
 */

// Types et configurations
export { TRIGGER_CONFIGS, getTriggerConfig, TRIGGERS_BY_PRIORITY } from './triggers'
export type { TriggerConfig } from './triggers'

// Templates de contenu
export { generateSuggestionContent, formatMetadata } from './templates'
export type { SuggestionContent, SuggestionContext } from './templates'

// Évaluateur et créateur de suggestions
export {
  canCreateSuggestion,
  createSuggestion,
  evaluateAndCreateSuggestion,
  evaluatePageEntry,
  evaluateDraftNotPublished,
  evaluateSearchNoResults,
  evaluateNoReferralActivity,
  evaluateAllTriggers,
} from './evaluator'
export type { EvaluationResult } from './evaluator'

// Re-export des types Supabase pour commodité
export type { SuggestionTrigger, SuggestionPriority, AgentSuggestion } from '@/lib/supabase/types'







