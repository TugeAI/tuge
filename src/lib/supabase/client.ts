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
 *
 * Note: Si les variables d'environnement ne sont pas configurées,
 * retourne un client avec des valeurs par défaut qui échouera gracieusement
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('[Supabase Client] Environment variables not configured. Supabase features will not work.')
  }

  return createBrowserClient<Database>(url, key)
}







