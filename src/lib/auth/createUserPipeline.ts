/**
 * Pipeline unifié de création d'utilisateur
 * 
 * Cette fonction orchestre TOUTES les étapes nécessaires lors de l'inscription :
 * 1. Création du profil utilisateur
 * 2. Création de l'agent IA personnel
 * 3. Initialisation du wallet de crédits
 * 4. Création de l'espace de travail (conversation initiale)
 * 
 * Ce pipeline est utilisé de manière identique pour :
 * - Inscription via formulaire classique (email/password)
 * - Inscription via Google OAuth
 * - Futures méthodes OAuth (Apple, LinkedIn, etc.)
 */

import { createProfile } from './createProfile'
import { createUserAgent } from '@/lib/agent/createUserAgent'
import { initializeWallet } from '@/lib/credits/initializeWallet'
import { initializeWorkspace } from '@/lib/workspace/initializeWorkspace'

export interface UserPipelineParams {
  userId: string
  email: string
  fullName?: string
  referrerCode?: string | null
}

export interface UserPipelineResult {
  success: boolean
  userId: string
  profileId?: string
  conversationId?: string
  initialCredits?: number
  error?: string
  failedStep?: 'profile' | 'agent' | 'credits' | 'workspace'
}

/**
 * Exécute le pipeline complet de création d'utilisateur
 * 
 * Ce pipeline est ATOMIQUE : si une étape échoue, on retourne l'erreur
 * mais les étapes précédentes ne sont pas annulées (pas de rollback pour l'instant).
 */
export async function createUserPipeline(
  params: UserPipelineParams
): Promise<UserPipelineResult> {
  const { userId, email, fullName, referrerCode } = params
  
  console.log('[UserPipeline] 🚀 Démarrage du pipeline pour:', {
    userId,
    email,
    hasFullName: !!fullName,
    hasReferrerCode: !!referrerCode,
  })
  
  try {
    // =========================================================================
    // ÉTAPE 1 : Création du profil utilisateur
    // =========================================================================
    console.log('[UserPipeline] 📝 Étape 1/4 : Création du profil...')
    
    const profileResult = await createProfile({
      userId,
      email,
      referrerCode,
    })
    
    if (!profileResult.success) {
      console.error('[UserPipeline] ❌ Échec étape 1 (profil):', profileResult.error)
      return {
        success: false,
        userId,
        error: profileResult.error || 'Échec de création du profil',
        failedStep: 'profile',
      }
    }
    
    console.log('[UserPipeline] ✅ Profil créé:', {
      profileId: profileResult.profileId,
      referrerCode: profileResult.referrerCode,
    })
    
    // =========================================================================
    // ÉTAPE 2 : Création de l'agent IA personnel
    // =========================================================================
    console.log('[UserPipeline] 🤖 Étape 2/4 : Création de l\'agent IA...')
    
    const agentResult = await createUserAgent({
      userId,
      name: 'Assistant',
      gender: 'neutre',
      tone: 'professionnel',
    })
    
    if (!agentResult.success) {
      // Non bloquant - on continue le pipeline même si l'agent échoue
      console.warn('[UserPipeline] ⚠️ Échec étape 2 (agent):', agentResult.error)
      // Pas de return, on continue
    } else {
      console.log('[UserPipeline] ✅ Agent IA créé:', {
        agentName: agentResult.agentName,
      })
    }
    
    // =========================================================================
    // ÉTAPE 3 : Initialisation du wallet de crédits
    // =========================================================================
    console.log('[UserPipeline] 💰 Étape 3/4 : Initialisation des crédits...')
    
    const creditsResult = await initializeWallet(userId)
    
    if (!creditsResult.success) {
      console.error('[UserPipeline] ❌ Échec étape 3 (crédits):', creditsResult.error)
      return {
        success: false,
        userId,
        profileId: profileResult.profileId,
        error: creditsResult.error || 'Échec d\'initialisation des crédits',
        failedStep: 'credits',
      }
    }
    
    console.log('[UserPipeline] ✅ Crédits initialisés:', {
      initialCredits: creditsResult.initialCredits,
    })
    
    // =========================================================================
    // ÉTAPE 4 : Création de l'espace de travail
    // =========================================================================
    console.log('[UserPipeline] 💬 Étape 4/4 : Création de l\'espace de travail...')
    
    // Extraire le prénom du nom complet si disponible
    const firstName = fullName?.split(' ')[0]
    
    const workspaceResult = await initializeWorkspace(userId, firstName)
    
    if (!workspaceResult.success) {
      // Non bloquant - on considère que le pipeline est réussi même sans workspace
      console.warn('[UserPipeline] ⚠️ Échec étape 4 (workspace):', workspaceResult.error)
      // Pas de return, on termine le pipeline avec succès
    } else {
      console.log('[UserPipeline] ✅ Workspace créé:', {
        conversationId: workspaceResult.conversationId,
      })
    }
    
    // =========================================================================
    // SUCCÈS : Pipeline complet terminé
    // =========================================================================
    console.log('[UserPipeline] 🎉 Pipeline terminé avec succès pour:', userId)
    
    return {
      success: true,
      userId,
      profileId: profileResult.profileId,
      conversationId: workspaceResult.conversationId,
      initialCredits: creditsResult.initialCredits,
    }
    
  } catch (error) {
    console.error('[UserPipeline] 💥 Erreur inattendue dans le pipeline:', error)
    
    return {
      success: false,
      userId,
      error: error instanceof Error ? error.message : 'Erreur inconnue dans le pipeline',
    }
  }
}

/**
 * Vérifie si un utilisateur a déjà un pipeline complet
 * (profil + agent + wallet + conversation)
 */
export async function isPipelineComplete(userId: string): Promise<boolean> {
  try {
    const { profileExists } = await import('./createProfile')
    const { userAgentExists } = await import('@/lib/agent/createUserAgent')
    const { walletExists } = await import('@/lib/credits/initializeWallet')
    
    const [hasProfile, hasAgent, hasWallet] = await Promise.all([
      profileExists(userId),
      userAgentExists(userId),
      walletExists(userId),
    ])
    
    // Le pipeline est considéré comme complet si au minimum le profil et le wallet existent
    return hasProfile && hasWallet
  } catch {
    return false
  }
}


