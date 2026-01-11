/**
 * Création de profil utilisateur avec gestion du parrainage
 * 
 * Cette fonction est appelée après validation OTP réussie.
 * Elle gère :
 * - La vérification si un profil existe déjà
 * - La résolution du parrain (code fourni ou fallback dernier inscrit)
 * - La création du profil
 * - La génération du code parrain
 * - La création de la relation de parrainage
 */

import { createAdminClient } from '@/lib/supabase/server'
import { resolveReferrer } from '@/lib/utils/referrer'
import { generateReferrerCode } from '@/lib/utils/referrer-code'
import { getLastRegisteredUserExcluding } from './getLastRegisteredUser'

export interface CreateProfileParams {
  userId: string
  email?: string
  phone?: string
  referrerCode?: string | null
}

export interface CreateProfileResult {
  success: boolean
  profileId: string
  referrerCode: string
  hasReferrer: boolean
  referrerId: string | null
  error?: string
}

/**
 * Crée un profil utilisateur avec gestion automatique du parrainage
 */
export async function createProfile(params: CreateProfileParams): Promise<CreateProfileResult> {
  const { userId, email, phone, referrerCode } = params
  const supabase = createAdminClient()
  
  console.log('[CreateProfile] Début création profil:', { userId, email, referrerCode })
  
  // 1. Vérifie si le profil existe déjà
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, referrer_code')
    .eq('id', userId)
    .single()
  
  if (existingProfile) {
    // Profil existe déjà, vérifie s'il a un parrain
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('referrer_id')
      .eq('user_id', userId)
      .single()
    
    return {
      success: true,
      profileId: existingProfile.id,
      referrerCode: existingProfile.referrer_code || '',
      hasReferrer: !!existingReferral,
      referrerId: existingReferral?.referrer_id || null,
    }
  }
  
  // 2. Résout le parrain
  let referrerId: string | null = null
  
  // 2a. Essaie avec le code fourni
  if (referrerCode) {
    console.log('[CreateProfile] Résolution code parrain:', referrerCode)
    const resolution = await resolveReferrer(referrerCode)
    if (resolution.found && resolution.referrer_id !== userId) {
      referrerId = resolution.referrer_id
      console.log('[CreateProfile] Parrain trouvé via code:', referrerId)
    } else {
      console.log('[CreateProfile] Code parrain invalide ou auto-parrainage')
    }
  }
  
  // 2b. Fallback : dernier utilisateur inscrit
  // DÉSACTIVÉ : Système de parrainage temporairement désactivé
  // Pour réactiver : décommenter les lignes ci-dessous
  /*
  if (!referrerId) {
    console.log('[CreateProfile] Fallback: recherche dernier inscrit...')
    referrerId = await getLastRegisteredUserExcluding(userId)
    if (referrerId) {
      console.log('[CreateProfile] Parrain fallback (dernier inscrit):', referrerId)
    } else {
      console.log('[CreateProfile] Aucun parrain disponible (premier utilisateur)')
    }
  }
  */
  
  // 3. Génère un code parrain unique pour ce nouvel utilisateur
  let newReferrerCode = generateReferrerCode()
  let attempts = 0
  const maxAttempts = 5
  
  while (attempts < maxAttempts) {
    const { data: existing } = await supabase
      .from('referrer_codes')
      .select('id')
      .eq('code', newReferrerCode)
      .single()
    
    if (!existing) break
    
    newReferrerCode = generateReferrerCode()
    attempts++
  }
  
  // 4. Crée le profil (rôle par défaut: individual)
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      role: 'individual',
      referrer_code: newReferrerCode,
    })
  
  if (profileError) {
    console.error('[CreateProfile] Profile creation error:', profileError)
    return {
      success: false,
      profileId: userId,
      referrerCode: '',
      hasReferrer: false,
      referrerId: null,
      error: profileError.message,
    }
  }
  
  // 5. Crée le code parrain dans la table dédiée
  await supabase
    .from('referrer_codes')
    .insert({
      user_id: userId,
      code: newReferrerCode,
      is_active: true,
    })
  
  // 6. Crée la relation de parrainage si un parrain a été trouvé
  // DÉSACTIVÉ : Système de parrainage temporairement désactivé
  // Pour réactiver : décommenter les lignes ci-dessous
  const hasReferrer = false
  /*
  if (referrerId) {
    const { error: referralError } = await supabase
      .from('referrals')
      .insert({
        user_id: userId,
        referrer_id: referrerId,
        level: 1,
        source: 'web',
      })
    
    if (!referralError) {
      hasReferrer = true
      console.log('[CreateProfile] ✓ Relation de parrainage créée:', { userId, referrerId })
    } else {
      console.error('[CreateProfile] Referral creation error:', referralError)
      // Non bloquant - le profil est créé quand même
    }
  }
  */
  
  console.log('[CreateProfile] ✓ Profil créé avec succès:', { 
    userId, 
    referrerCode: newReferrerCode, 
    hasReferrer, 
    referrerId 
  })
  
  return {
    success: true,
    profileId: userId,
    referrerCode: newReferrerCode,
    hasReferrer,
    referrerId,
  }
}

/**
 * Vérifie si un profil existe pour un utilisateur donné
 */
export async function profileExists(userId: string): Promise<boolean> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()
  
  return !error && !!data
}

