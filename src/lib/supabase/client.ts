/**
 * Client Supabase côté navigateur
 * 
 * Ce client utilise la clé anon (publique) et est destiné aux opérations
 * côté client qui respectent les politiques RLS.
 * 
 * IMPORTANT: Ne jamais utiliser ce client pour des opérations privilégiées.
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

/**
 * Crée un client Supabase pour le navigateur
 * Utilise la clé anon publique - toutes les requêtes passent par RLS
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}







