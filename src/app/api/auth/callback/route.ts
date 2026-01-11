/**
 * API Route: GET /api/auth/callback
 * 
 * Gère plusieurs types de callbacks :
 * 1. OAuth (Google, Apple, LinkedIn, etc.)
 * 2. Email confirmation (magic link)
 * 3. Password reset
 * 
 * Flow OAuth :
 * 1. Échange le code OAuth contre une session
 * 2. Vérifie si l'utilisateur existe déjà
 * 3. Si nouveau → lance le pipeline de création
 * 4. Si existant → connexion directe
 * 5. Redirige vers /agent
 * 
 * Flow Email Confirmation :
 * 1. Vérifie le token de confirmation
 * 2. Confirme l'email de l'utilisateur
 * 3. Lance le pipeline si nouvel utilisateur
 * 4. Redirige vers /agent
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createUserPipeline, isPipelineComplete } from '@/lib/auth/createUserPipeline'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const origin = requestUrl.origin
  
  // Déterminer le type de callback
  const isEmailConfirmation = type === 'signup' || type === 'email_change' || type === 'recovery'
  
  if (!code && !token_hash) {
    console.error('[Auth Callback] No code or token_hash provided')
    return NextResponse.redirect(`${origin}/auth/confirm-error?error=missing_token`)
  }
  
  // Stocke les cookies à définir
  const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = []
  
  // Crée un client Supabase avec gestion des cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookies) {
          cookies.forEach((cookie) => {
            cookiesToSet.push(cookie)
          })
        },
      },
    }
  )
  
  try {
    let user
    
    // =========================================================================
    // 1. Échanger le code/token contre une session
    // =========================================================================
    if (isEmailConfirmation && token_hash) {
      // Cas : Confirmation d'email (magic link)
      console.log('[Auth Callback] Email confirmation detected, type:', type)
      
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as 'signup' | 'email_change' | 'recovery',
      })
      
      if (error) {
        console.error('[Auth Callback] Email verification error:', error.message)
        
        // Erreurs spécifiques
        if (error.message.includes('expired')) {
          return NextResponse.redirect(`${origin}/auth/confirm-error?error=expired`)
        }
        if (error.message.includes('already') || error.message.includes('used')) {
          return NextResponse.redirect(`${origin}/auth/confirm-error?error=already_used`)
        }
        
        return NextResponse.redirect(`${origin}/auth/confirm-error?error=invalid_token`)
      }
      
      user = data.user
      console.log('[Auth Callback] Email confirmed for user:', user?.id)
      
    } else if (code) {
      // Cas : OAuth callback
      console.log('[Auth Callback] OAuth callback detected')
      
      const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (sessionError || !sessionData.user) {
        console.error('[Auth Callback] Session exchange error:', sessionError)
        return NextResponse.redirect(`${origin}/auth/confirm-error?error=session_failed`)
      }
      
      user = sessionData.user
      console.log('[Auth Callback] OAuth user authenticated:', user.id)
      
    } else {
      console.error('[Auth Callback] Invalid callback parameters')
      return NextResponse.redirect(`${origin}/auth/confirm-error?error=invalid_request`)
    }
    
    if (!user) {
      console.error('[Auth Callback] No user found after authentication')
      return NextResponse.redirect(`${origin}/auth/confirm-error?error=no_user`)
    }
    
    // =========================================================================
    // 2. Vérifier si le pipeline a déjà été exécuté
    // =========================================================================
    const pipelineComplete = await isPipelineComplete(user.id)
    
    if (!pipelineComplete) {
      console.log('[Auth Callback] Nouvel utilisateur, lancement du pipeline')
      
      // =========================================================================
      // 3. Lancer le pipeline pour nouvel utilisateur
      // =========================================================================
      
      // Extraire le nom complet depuis les métadonnées
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name
      
      const pipelineResult = await createUserPipeline({
        userId: user.id,
        email: user.email!,
        fullName,
        referrerCode: null,
      })
      
      if (!pipelineResult.success) {
        console.error('[Auth Callback] Pipeline failed:', pipelineResult.error)
        // On redirige quand même vers /agent, le pipeline peut être réessayé
        return NextResponse.redirect(`${origin}/agent?warning=pipeline_incomplete`)
      }
      
      console.log('[Auth Callback] ✓ Pipeline terminé avec succès')
    } else {
      console.log('[Auth Callback] Utilisateur existant, connexion directe')
    }
    
    // =========================================================================
    // 4. Rediriger vers l'application
    // =========================================================================
    const response = NextResponse.redirect(`${origin}/agent`)
    
    // Ajouter les cookies de session
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })
    
    return response
    
  } catch (error) {
    console.error('[Auth Callback] Unexpected error:', error)
    return NextResponse.redirect(`${origin}/auth/confirm-error?error=unexpected`)
  }
}

