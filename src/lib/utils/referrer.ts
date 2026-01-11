/**
 * Utilitaires pour la résolution et la gestion des parrains
 * 
 * Ces fonctions sont utilisées pour :
 * - Résoudre un code parrain vers un user_id
 * - Créer des relations de parrainage
 * - Valider l'existence d'un parrain
 */

import { createAdminClient } from '@/lib/supabase/server'
import { normalizeReferrerCode, isValidReferrerCodeFormat } from './referrer-code'
import type { ReferrerResolution } from '@/types/onboarding'

/**
 * Résout un code parrain vers l'ID utilisateur correspondant
 * 
 * @param codeOrParam - Code parrain brut (peut venir d'une URL ou d'une saisie manuelle)
 * @returns Résultat de la résolution avec l'ID du parrain si trouvé
 * 
 * @example
 * const result = await resolveReferrer("TUG-A3B7K2")
 * if (result.found) {
 *   console.log("Parrain trouvé:", result.referrer_id)
 * }
 */
export async function resolveReferrer(
  codeOrParam: string | null | undefined
): Promise<ReferrerResolution> {
  // Pas de code fourni
  if (!codeOrParam) {
    return {
      found: false,
      referrer_id: null,
      referrer_code: null
    }
  }

  // Normalise le code
  const normalizedCode = normalizeReferrerCode(codeOrParam)
  
  // Code invalide après normalisation
  if (!normalizedCode) {
    return {
      found: false,
      referrer_id: null,
      referrer_code: null
    }
  }

  // Recherche dans la base de données
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('referrer_codes')
    .select('user_id, code')
    .eq('code', normalizedCode)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return {
      found: false,
      referrer_id: null,
      referrer_code: normalizedCode
    }
  }

  return {
    found: true,
    referrer_id: data.user_id,
    referrer_code: data.code
  }
}

/**
 * Vérifie si un code parrain existe et est valide
 * 
 * @param code - Code parrain à vérifier
 * @returns true si le code existe et est actif
 */
export async function isValidReferrerCode(
  code: string | null | undefined
): Promise<boolean> {
  if (!code) return false
  
  // Vérifie d'abord le format
  if (!isValidReferrerCodeFormat(code)) {
    return false
  }
  
  const resolution = await resolveReferrer(code)
  return resolution.found
}

/**
 * Récupère les informations du parrain par son ID
 * 
 * @param referrerId - ID du parrain
 * @returns Profil du parrain ou null
 */
export async function getReferrerById(referrerId: string): Promise<{
  id: string
  role: string
  referrer_code: string | null
} | null> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, referrer_code')
    .eq('id', referrerId)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

/**
 * Vérifie si un utilisateur a déjà un parrain
 * 
 * @param userId - ID de l'utilisateur à vérifier
 * @returns true si l'utilisateur a déjà un parrain
 */
export async function hasExistingReferrer(userId: string): Promise<boolean> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('referrals')
    .select('id')
    .eq('user_id', userId)
    .single()

  // Si on trouve un enregistrement, l'utilisateur a déjà un parrain
  return !error && !!data
}

/**
 * Compte le nombre de filleuls directs d'un parrain
 * 
 * @param referrerId - ID du parrain
 * @returns Nombre de filleuls directs
 */
export async function countDirectReferrals(referrerId: string): Promise<number> {
  const supabase = createAdminClient()
  
  const { count, error } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', referrerId)
    .eq('level', 1)

  if (error) {
    return 0
  }

  return count ?? 0
}







