/**
 * Définition des types de déclencheurs de suggestions
 * 
 * Chaque déclencheur a des conditions spécifiques et une priorité associée.
 */

import type { SuggestionTrigger, SuggestionPriority } from '@/lib/supabase/types'

/**
 * Configuration d'un déclencheur de suggestion
 */
export interface TriggerConfig {
  /** Type du déclencheur */
  type: SuggestionTrigger
  /** Priorité par défaut */
  defaultPriority: SuggestionPriority
  /** Description pour le debug/logs */
  description: string
  /** Délai anti-spam en heures */
  cooldownHours: number
  /** Durée de validité en jours */
  expirationDays: number
}

/**
 * Configuration de tous les déclencheurs disponibles
 */
export const TRIGGER_CONFIGS: Record<SuggestionTrigger, TriggerConfig> = {
  page_entry: {
    type: 'page_entry',
    defaultPriority: 'low',
    description: 'Première visite ou retour après une longue absence',
    cooldownHours: 48,
    expirationDays: 7,
  },
  draft_not_published: {
    type: 'draft_not_published',
    defaultPriority: 'high',
    description: 'Brouillon d\'annonce non publié depuis plus de 24h',
    cooldownHours: 48,
    expirationDays: 7,
  },
  search_no_results: {
    type: 'search_no_results',
    defaultPriority: 'medium',
    description: 'Recherche sans résultats',
    cooldownHours: 48,
    expirationDays: 3,
  },
  no_referral_activity: {
    type: 'no_referral_activity',
    defaultPriority: 'medium',
    description: 'Aucun filleul après 7 jours sur la plateforme',
    cooldownHours: 48,
    expirationDays: 7,
  },
}

/**
 * Récupère la configuration d'un déclencheur
 */
export function getTriggerConfig(trigger: SuggestionTrigger): TriggerConfig {
  return TRIGGER_CONFIGS[trigger]
}

/**
 * Liste des déclencheurs par ordre de priorité (pour évaluation)
 */
export const TRIGGERS_BY_PRIORITY: SuggestionTrigger[] = [
  'draft_not_published',    // high
  'search_no_results',      // medium
  'no_referral_activity',   // medium
  'page_entry',             // low
]







