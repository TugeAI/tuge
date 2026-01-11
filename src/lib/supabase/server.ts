/**
 * Clients Supabase côté serveur
 * 
 * Deux types de clients disponibles :
 * 1. Client avec cookies (pour les requêtes authentifiées utilisateur)
 * 2. Client admin avec service_role (pour les opérations privilégiées)
 * 
 * IMPORTANT: Le client admin ne doit JAMAIS être exposé côté client.
 */

import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './types'

/**
 * Crée un client Supabase serveur avec gestion des cookies
 * Utilisé pour les requêtes authentifiées où l'utilisateur a une session
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Le callback setAll est appelé depuis un Server Component.
            // Cela peut être ignoré si vous avez un middleware qui rafraîchit
            // les sessions utilisateur.
          }
        },
      },
    }
  )
}

/**
 * Crée un client Supabase admin avec la clé service_role
 * 
 * ⚠️ ATTENTION: Ce client bypass TOUTES les politiques RLS !
 * À utiliser uniquement dans les API Routes pour les opérations privilégiées :
 * - Création de comptes
 * - Création de referrals
 * - Accès aux logs
 * - Opérations sur pending_registrations
 * 
 * JAMAIS exposer ce client ou la clé service_role côté client !
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
    )
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}







