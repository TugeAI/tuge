/**
 * Récupère le dernier utilisateur inscrit
 * 
 * Utilisé comme fallback pour le parrainage automatique
 * quand aucun code parrain n'est fourni.
 */

import { createAdminClient } from '@/lib/supabase/server'

/**
 * Retourne l'ID du dernier utilisateur inscrit
 * 
 * @returns L'ID du dernier inscrit ou null si aucun utilisateur
 */
export async function getLastRegisteredUser(): Promise<string | null> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  if (error || !data) {
    // Pas d'utilisateur existant (premier inscrit)
    return null
  }
  
  return data.id
}

/**
 * Retourne l'ID du dernier utilisateur inscrit, excluant un ID spécifique
 * 
 * Utile pour éviter de s'auto-parrainer
 * 
 * @param excludeId - ID à exclure de la recherche
 * @returns L'ID du dernier inscrit ou null
 */
export async function getLastRegisteredUserExcluding(excludeId: string): Promise<string | null> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .neq('id', excludeId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data.id
}







