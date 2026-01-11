/**
 * Création de l'agent IA personnel pour un utilisateur
 * 
 * Cette fonction crée l'agent IA avec des paramètres par défaut lors de l'inscription.
 * L'utilisateur pourra personnaliser son agent plus tard.
 */

import { createAdminClient } from '@/lib/supabase/server'

export interface CreateUserAgentParams {
  userId: string
  name?: string
  gender?: 'masculin' | 'feminin' | 'neutre'
  tone?: 'professionnel' | 'amical' | 'formel' | 'decontracte'
}

export interface CreateUserAgentResult {
  success: boolean
  agentName: string
  error?: string
}

/**
 * Crée l'agent IA personnel de l'utilisateur avec les paramètres par défaut
 */
export async function createUserAgent(
  params: CreateUserAgentParams
): Promise<CreateUserAgentResult> {
  const {
    userId,
    name = 'Assistant',
    gender = 'neutre',
    tone = 'professionnel'
  } = params
  
  console.log('[CreateUserAgent] Création agent IA:', { userId, name, gender, tone })
  
  try {
    const supabase = createAdminClient()
    
    // Appel de la fonction RPC Supabase pour créer/mettre à jour l'agent
    const { data, error } = await supabase.rpc('upsert_user_agent', {
      p_user_id: userId,
      p_name: name,
      p_gender: gender,
      p_tone: tone,
    })
    
    if (error) {
      console.error('[CreateUserAgent] RPC error:', error)
      return {
        success: false,
        agentName: name,
        error: error.message,
      }
    }
    
    // Vérifie le résultat de la fonction
    const result = Array.isArray(data) ? data[0] : data
    
    if (!result?.success) {
      console.error('[CreateUserAgent] Agent creation failed:', result?.message)
      return {
        success: false,
        agentName: name,
        error: result?.message || 'Échec de création de l\'agent',
      }
    }
    
    console.log('[CreateUserAgent] ✓ Agent IA créé avec succès:', {
      userId,
      name: result.name,
      gender: result.gender,
      tone: result.tone,
    })
    
    return {
      success: true,
      agentName: result.name ?? name,
    }
    
  } catch (error) {
    console.error('[CreateUserAgent] Unexpected error:', error)
    return {
      success: false,
      agentName: name,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * Vérifie si un agent existe déjà pour un utilisateur
 */
export async function userAgentExists(userId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('user_agents')
      .select('user_id')
      .eq('user_id', userId)
      .single()
    
    return !error && !!data
  } catch {
    return false
  }
}


