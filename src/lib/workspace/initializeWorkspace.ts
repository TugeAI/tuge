/**
 * Initialisation de l'espace de travail pour un nouvel utilisateur
 * 
 * Cette fonction crée la première conversation et un message de bienvenue
 * lors de l'inscription d'un nouvel utilisateur.
 */

import { createAdminClient } from '@/lib/supabase/server'

export interface InitializeWorkspaceResult {
  success: boolean
  conversationId?: string
  error?: string
}

/**
 * Crée la conversation initiale avec message de bienvenue
 */
export async function initializeWorkspace(
  userId: string,
  userName?: string
): Promise<InitializeWorkspaceResult> {
  console.log('[InitializeWorkspace] Initialisation workspace pour:', userId)
  
  const supabase = createAdminClient()
  
  try {
    // 1. Créer la conversation de bienvenue
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        title: 'Bienvenue sur Tuge AI',
      })
      .select('id')
      .single()
    
    if (convError || !conversation) {
      console.error('[InitializeWorkspace] Conversation creation error:', convError)
      return {
        success: false,
        error: convError?.message || 'Échec de création de la conversation',
      }
    }
    
    const conversationId = conversation.id
    
    // 2. Créer le message de bienvenue
    const welcomeMessage = userName
      ? `Bonjour ${userName} ! 👋\n\nBienvenue sur Tuge AI ! Je suis votre assistant personnel, prêt à vous aider.\n\nVous pouvez me poser n'importe quelle question ou me demander de l'aide sur vos projets. Je suis là pour vous accompagner.\n\nPar où souhaitez-vous commencer ?`
      : `Bonjour ! 👋\n\nBienvenue sur Tuge AI ! Je suis votre assistant personnel, prêt à vous aider.\n\nVous pouvez me poser n'importe quelle question ou me demander de l'aide sur vos projets. Je suis là pour vous accompagner.\n\nPar où souhaitez-vous commencer ?`
    
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: welcomeMessage,
      })
    
    if (messageError) {
      // Non bloquant - la conversation est créée même sans message
      console.warn('[InitializeWorkspace] Message creation warning:', messageError)
    }
    
    console.log('[InitializeWorkspace] ✓ Workspace créé avec succès:', {
      userId,
      conversationId,
    })
    
    return {
      success: true,
      conversationId,
    }
    
  } catch (error) {
    console.error('[InitializeWorkspace] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * Vérifie si l'utilisateur a déjà des conversations
 */
export async function hasExistingConversations(userId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
    
    return !error && data && data.length > 0
  } catch {
    return false
  }
}

/**
 * Récupère la dernière conversation de l'utilisateur
 */
export async function getLastConversation(userId: string): Promise<string | null> {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error || !data) {
      return null
    }
    
    return data.id
  } catch {
    return null
  }
}


