/**
 * Utilitaire de logging pour les actions sensibles
 * 
 * Centralise la logique d'écriture dans ai_actions_log
 * pour garantir la traçabilité de toutes les opérations.
 */

import { createAdminClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/types'
import type { ActionType, ActionMetadata, ActionStatus } from '@/types/onboarding'

interface LogActionParams {
  action_type: ActionType
  target_email?: string
  target_user_id?: string
  referrer_id?: string
  status: ActionStatus
  metadata?: ActionMetadata
  error_message?: string
}

/**
 * Enregistre une action dans le journal de traçabilité
 * 
 * @param params - Paramètres de l'action à logger
 * @returns ID du log créé ou null en cas d'erreur
 */
export async function logAction(params: LogActionParams): Promise<string | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('ai_actions_log')
    .insert({
      action_type: params.action_type,
      target_email: params.target_email ?? null,
      target_user_id: params.target_user_id ?? null,
      referrer_id: params.referrer_id ?? null,
      status: params.status,
      metadata: (params.metadata ?? {}) as Json,
      error_message: params.error_message ?? null
    })
    .select('id')
    .single()

  if (error) {
    console.error('[Logger] Failed to log action:', error.message)
    return null
  }

  return data.id
}

/**
 * Met à jour le statut d'un log existant
 * 
 * @param logId - ID du log à mettre à jour
 * @param status - Nouveau statut
 * @param errorMessage - Message d'erreur optionnel
 */
export async function updateLogStatus(
  logId: string,
  status: ActionStatus,
  errorMessage?: string
): Promise<void> {
  const supabase = createAdminClient()

  const updateData: { status: ActionStatus; error_message?: string } = { status }
  if (errorMessage) {
    updateData.error_message = errorMessage
  }

  const { error } = await supabase
    .from('ai_actions_log')
    .update(updateData)
    .eq('id', logId)

  if (error) {
    console.error('[Logger] Failed to update log status:', error.message)
  }
}

/**
 * Crée un log initial pour une pré-inscription et retourne une fonction
 * pour mettre à jour le statut final
 * 
 * @param email - Email de l'utilisateur
 * @param referrer_id - ID du parrain éventuel
 * @param metadata - Métadonnées supplémentaires
 */
export async function createRegistrationLogger(
  email: string,
  referrer_id: string | null,
  metadata?: ActionMetadata
) {
  const logId = await logAction({
    action_type: 'PRE_REGISTRATION_INITIATED',
    target_email: email,
    referrer_id: referrer_id ?? undefined,
    status: 'initiated',
    metadata
  })

  return {
    logId,
    
    async pending() {
      if (logId) {
        await updateLogStatus(logId, 'pending')
      }
    },
    
    async complete(userId?: string) {
      if (logId) {
        // Créer un nouveau log de complétion avec le user_id
        await logAction({
          action_type: 'REGISTRATION_COMPLETED',
          target_email: email,
          target_user_id: userId,
          referrer_id: referrer_id ?? undefined,
          status: 'completed',
          metadata
        })
      }
    },
    
    async fail(errorMessage: string) {
      if (logId) {
        await updateLogStatus(logId, 'failed', errorMessage)
      }
    }
  }
}

