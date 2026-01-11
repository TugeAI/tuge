/**
 * Helper pour consommer des crédits de manière atomique
 */

import { createAdminClient } from '@/lib/supabase/server'
import type { ConsumeCreditsResult } from '@/lib/supabase/types'

import type { Json } from '@/lib/supabase/types'

export interface ConsumeCreditsParams {
  userId: string
  amount?: number
  actionType?: string
  conversationId?: string | null
  metadata?: Json
}

export interface ConsumeCreditsResponse {
  success: boolean
  creditTypeUsed: string | null
  remainingCredits: {
    free: number
    paid: number
    total: number
  }
  error?: string
}

/**
 * Consomme des crédits de manière atomique.
 * Ordre de consommation : gratuits d'abord, puis payants.
 */
export async function consumeCredit(params: ConsumeCreditsParams): Promise<ConsumeCreditsResponse> {
  const {
    userId,
    amount = 1,
    actionType = 'chat',
    conversationId = null,
    metadata = {},
  } = params

  const adminClient = createAdminClient()

  try {
    const { data, error } = await adminClient.rpc('consume_credit_atomic', {
      p_user_id: userId,
      p_amount: amount,
      p_action_type: actionType,
      p_conversation_id: conversationId,
      p_metadata: metadata,
    })

    if (error) {
      console.error('[ConsumeCredit] Erreur RPC:', error)
      return {
        success: false,
        creditTypeUsed: null,
        remainingCredits: { free: 0, paid: 0, total: 0 },
        error: 'Erreur lors de la consommation des crédits',
      }
    }

    const result: ConsumeCreditsResult | undefined = data?.[0]

    if (!result) {
      return {
        success: false,
        creditTypeUsed: null,
        remainingCredits: { free: 0, paid: 0, total: 0 },
        error: 'Réponse invalide du serveur',
      }
    }

    return {
      success: result.success,
      creditTypeUsed: result.credit_type_used,
      remainingCredits: {
        free: result.daily_free_credits,
        paid: result.paid_credits,
        total: result.daily_free_credits + result.paid_credits,
      },
      error: result.success ? undefined : result.message,
    }
  } catch (error) {
    console.error('[ConsumeCredit] Erreur inattendue:', error)
    return {
      success: false,
      creditTypeUsed: null,
      remainingCredits: { free: 0, paid: 0, total: 0 },
      error: 'Erreur serveur',
    }
  }
}

/**
 * Vérifie si un utilisateur a assez de crédits
 */
export async function hasEnoughCredits(userId: string, amount: number = 1): Promise<boolean> {
  const adminClient = createAdminClient()

  try {
    const { data } = await adminClient.rpc('get_user_wallet', {
      p_user_id: userId,
    })

    const wallet = data?.[0]
    if (!wallet) return false

    return wallet.total_credits >= amount
  } catch {
    return false
  }
}

/**
 * Récupère le wallet d'un utilisateur
 */
export async function getUserWallet(userId: string) {
  const adminClient = createAdminClient()

  const { data, error } = await adminClient.rpc('get_user_wallet', {
    p_user_id: userId,
  })

  if (error) {
    console.error('[GetUserWallet] Erreur RPC:', error)
    return null
  }

  return data?.[0] || null
}

