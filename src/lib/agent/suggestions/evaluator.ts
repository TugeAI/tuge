/**
 * Évaluateur de suggestions proactives
 * 
 * Logique pour évaluer les déclencheurs et créer des suggestions
 * en respectant les règles anti-spam.
 */

import { createClient } from '@/lib/supabase/server'
import type { SuggestionTrigger, Json } from '@/lib/supabase/types'
import { getTriggerConfig } from './triggers'
import { generateSuggestionContent, type SuggestionContext } from './templates'

/**
 * Résultat de l'évaluation d'un trigger
 */
export interface EvaluationResult {
  success: boolean
  suggestionId?: string
  message: string
  trigger?: SuggestionTrigger
}

/**
 * Vérifie si une suggestion peut être créée (anti-spam)
 */
export async function canCreateSuggestion(
  userId: string,
  trigger: SuggestionTrigger
): Promise<{ canCreate: boolean; reason: string | null }> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .rpc('can_create_suggestion', {
      p_user_id: userId,
      p_trigger_type: trigger,
    })
    .single()

  if (error) {
    // PGRST202 = function not found, la migration n'est pas encore appliquée
    if (error.code === 'PGRST202') {
      console.warn('[Suggestions] Migration not applied yet')
      return { canCreate: false, reason: 'Migration en attente' }
    }
    console.error('[Suggestions] Error checking can_create:', error)
    return { canCreate: false, reason: 'Erreur lors de la vérification' }
  }

  return {
    canCreate: data?.can_create ?? false,
    reason: data?.reason ?? null,
  }
}

/**
 * Crée une nouvelle suggestion
 */
export async function createSuggestion(
  userId: string,
  trigger: SuggestionTrigger,
  context: SuggestionContext = {}
): Promise<EvaluationResult> {
  const supabase = await createClient()
  
  // Générer le contenu de la suggestion
  const content = generateSuggestionContent(trigger, context)
  
  // Créer la suggestion via RPC
  const { data, error } = await supabase
    .rpc('create_suggestion', {
      p_user_id: userId,
      p_trigger_type: trigger,
      p_title: content.title,
      p_message: content.message,
      p_action_prompt: content.actionPrompt,
      p_priority: content.priority,
      p_metadata: (context.metadata ?? {}) as Json,
    })
    .single()

  if (error) {
    // PGRST202 = function not found, la migration n'est pas encore appliquée
    if (error.code === 'PGRST202') {
      console.warn('[Suggestions] Migration not applied yet, cannot create suggestion')
      return {
        success: false,
        message: 'Migration en attente',
      }
    }
    console.error('[Suggestions] Error creating suggestion:', error)
    return {
      success: false,
      message: 'Erreur lors de la création de la suggestion',
    }
  }

  if (!data?.success) {
    return {
      success: false,
      message: data?.message ?? 'Impossible de créer la suggestion',
    }
  }

  return {
    success: true,
    suggestionId: data.suggestion_id ?? undefined,
    message: 'Suggestion créée avec succès',
    trigger,
  }
}

/**
 * Évalue et crée une suggestion si les conditions sont remplies
 */
export async function evaluateAndCreateSuggestion(
  userId: string,
  trigger: SuggestionTrigger,
  context: SuggestionContext = {}
): Promise<EvaluationResult> {
  // Vérifier les règles anti-spam
  const { canCreate, reason } = await canCreateSuggestion(userId, trigger)
  
  if (!canCreate) {
    return {
      success: false,
      message: reason ?? 'Suggestion non autorisée',
    }
  }

  // Créer la suggestion
  return createSuggestion(userId, trigger, context)
}

/**
 * Évalue le trigger page_entry
 * Appelé à l'entrée sur la page agent
 */
export async function evaluatePageEntry(
  userId: string,
  userName?: string
): Promise<EvaluationResult> {
  return evaluateAndCreateSuggestion(userId, 'page_entry', { userName })
}

/**
 * Évalue le trigger draft_not_published
 * Appelé au chargement de la page ou via cron
 */
export async function evaluateDraftNotPublished(userId: string): Promise<EvaluationResult> {
  const supabase = await createClient()
  
  // Vérifier d'abord s'il y a des brouillons éligibles
  // Note: On utilise RPC pour éviter les problèmes de types avec listing_drafts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: drafts, error } = await (supabase.rpc as any)('get_eligible_drafts_for_suggestion', {
    p_user_id: userId,
  }) as { data: Array<{ id: string; title: string }> | null; error: { code?: string; message?: string } | null }

  if (error) {
    // PGRST202 = function not found, la migration n'est pas encore appliquée
    if (error.code === 'PGRST202') {
      console.warn('[Suggestions] get_eligible_drafts_for_suggestion not found, migration pending')
      return {
        success: false,
        message: 'Migration en attente',
      }
    }
    console.error('[Suggestions] Error checking drafts:', error)
    return {
      success: false,
      message: 'Erreur lors de la vérification des brouillons',
    }
  }

  if (!drafts || drafts.length === 0) {
    return {
      success: false,
      message: 'Pas de brouillon éligible',
    }
  }

  const draft = drafts[0]
  
  return evaluateAndCreateSuggestion(userId, 'draft_not_published', {
    metadata: {
      draft_id: draft.id,
      draft_title: draft.title,
    },
  })
}

/**
 * Évalue le trigger search_no_results
 * Appelé quand une recherche ne retourne aucun résultat
 */
export async function evaluateSearchNoResults(
  userId: string,
  searchQuery: string
): Promise<EvaluationResult> {
  return evaluateAndCreateSuggestion(userId, 'search_no_results', {
    metadata: {
      search_query: searchQuery,
    },
  })
}

/**
 * Évalue le trigger no_referral_activity
 * Appelé au chargement de la page agent
 */
export async function evaluateNoReferralActivity(userId: string): Promise<EvaluationResult> {
  const supabase = await createClient()
  
  // Vérifier si le profil a plus de 7 jours
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('created_at')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    return {
      success: false,
      message: 'Profil non trouvé',
    }
  }

  const profileCreatedAt = new Date(profile.created_at)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  
  if (profileCreatedAt > sevenDaysAgo) {
    return {
      success: false,
      message: 'Compte trop récent (moins de 7 jours)',
    }
  }

  // Vérifier s'il y a des filleuls
  const { count, error: referralError } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', userId)
    .eq('level', 1)

  if (referralError) {
    return {
      success: false,
      message: 'Erreur lors de la vérification des filleuls',
    }
  }

  if (count && count > 0) {
    return {
      success: false,
      message: 'L\'utilisateur a déjà des filleuls',
    }
  }

  return evaluateAndCreateSuggestion(userId, 'no_referral_activity', {})
}

/**
 * Évalue tous les triggers applicables pour un utilisateur
 * Retourne dès qu'une suggestion est créée (une seule active à la fois)
 */
export async function evaluateAllTriggers(
  userId: string,
  options: {
    userName?: string
    skipPageEntry?: boolean
  } = {}
): Promise<EvaluationResult> {
  // Ordre de priorité des évaluations
  const evaluations = [
    // Priorité haute : brouillons non publiés
    () => evaluateDraftNotPublished(userId),
    // Priorité moyenne : pas de filleuls
    () => evaluateNoReferralActivity(userId),
    // Priorité basse : entrée sur page
    () => options.skipPageEntry 
      ? Promise.resolve({ success: false, message: 'Skipped' }) 
      : evaluatePageEntry(userId, options.userName),
  ]

  for (const evaluate of evaluations) {
    const result = await evaluate()
    if (result.success) {
      return result
    }
  }

  return {
    success: false,
    message: 'Aucune suggestion applicable',
  }
}

