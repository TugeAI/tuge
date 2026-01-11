/**
 * Initialisation du portefeuille de crédits pour un nouvel utilisateur
 * 
 * Cette fonction crée le wallet avec les crédits gratuits de départ
 * lors de l'inscription d'un nouvel utilisateur.
 */

import { createAdminClient } from '@/lib/supabase/server'

export interface InitializeWalletResult {
  success: boolean
  initialCredits: number
  error?: string
}

/**
 * Initialise le wallet de crédits pour un nouvel utilisateur
 * 
 * Crée l'entrée dans credit_wallets avec 10 crédits gratuits de départ
 * et enregistre la transaction dans le ledger
 */
export async function initializeWallet(userId: string): Promise<InitializeWalletResult> {
  console.log('[InitializeWallet] Initialisation wallet pour:', userId)
  
  const supabase = createAdminClient()
  const INITIAL_FREE_CREDITS = 10
  
  try {
    // 1. Vérifier si le wallet existe déjà
    const { data: existingWallet, error: checkError } = await supabase
      .from('credit_wallets')
      .select('user_id, daily_free_credits, paid_credits')
      .eq('user_id', userId)
      .single()
    
    if (existingWallet) {
      console.log('[InitializeWallet] Wallet existe déjà:', existingWallet)
      return {
        success: true,
        initialCredits: existingWallet.daily_free_credits + existingWallet.paid_credits,
      }
    }
    
    // 2. Créer le wallet avec les crédits de départ
    const today = new Date().toISOString().split('T')[0] // Format YYYY-MM-DD
    
    const { error: walletError } = await supabase
      .from('credit_wallets')
      .insert({
        user_id: userId,
        daily_free_credits: INITIAL_FREE_CREDITS,
        paid_credits: 0,
        daily_date: today,
      })
    
    if (walletError) {
      console.error('[InitializeWallet] Wallet creation error:', walletError)
      return {
        success: false,
        initialCredits: 0,
        error: walletError.message,
      }
    }
    
    // 3. Enregistrer dans le ledger
    const { error: ledgerError } = await supabase
      .from('credit_ledger')
      .insert({
        user_id: userId,
        type: 'daily_claim',
        amount: INITIAL_FREE_CREDITS,
        credit_type: 'free',
        balance_after: INITIAL_FREE_CREDITS,
        metadata: {
          source: 'registration',
          description: 'Crédits gratuits de bienvenue',
        },
      })
    
    if (ledgerError) {
      // Non bloquant - le wallet est créé même si le ledger échoue
      console.warn('[InitializeWallet] Ledger creation warning:', ledgerError)
    }
    
    console.log('[InitializeWallet] ✓ Wallet créé avec succès:', {
      userId,
      initialCredits: INITIAL_FREE_CREDITS,
    })
    
    return {
      success: true,
      initialCredits: INITIAL_FREE_CREDITS,
    }
    
  } catch (error) {
    console.error('[InitializeWallet] Unexpected error:', error)
    return {
      success: false,
      initialCredits: 0,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * Vérifie si un wallet existe pour un utilisateur
 */
export async function walletExists(userId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('credit_wallets')
      .select('user_id')
      .eq('user_id', userId)
      .single()
    
    return !error && !!data
  } catch {
    return false
  }
}

/**
 * Récupère le solde actuel du wallet
 */
export async function getWalletBalance(userId: string): Promise<{
  free: number
  paid: number
  total: number
} | null> {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('credit_wallets')
      .select('daily_free_credits, paid_credits')
      .eq('user_id', userId)
      .single()
    
    if (error || !data) {
      return null
    }
    
    return {
      free: data.daily_free_credits,
      paid: data.paid_credits,
      total: data.daily_free_credits + data.paid_credits,
    }
  } catch {
    return null
  }
}


