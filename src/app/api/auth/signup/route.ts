/**
 * API Route: POST /api/auth/signup
 * 
 * Inscription classique avec email et mot de passe
 * 
 * Flow :
 * 1. Valide les données (email, password, confirmPassword)
 * 2. Vérifie que l'email n'existe pas déjà
 * 3. Crée le compte via Supabase Auth
 * 4. Lance le pipeline de création (profil, agent, crédits, workspace)
 * 5. Définit les cookies de session
 * 6. Retourne la session
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/server'
import { createUserPipeline, isPipelineComplete } from '@/lib/auth/createUserPipeline'
import { SignupSchema, type AuthErrorCode, type SignupResponse } from '@/types/auth'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  // Stocke les cookies à définir
  const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = []
  
  // Crée un client Supabase avec gestion des cookies pour la session
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
  
  // Fonction helper pour créer une réponse avec les cookies
  function createResponse(body: SignupResponse, status: number): NextResponse {
    const response = NextResponse.json(body, { status })
    
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })
    
    return response
  }
  
  try {
    // =========================================================================
    // 1. Parse et validation
    // =========================================================================
    const body = await request.json()
    const validatedData = SignupSchema.parse(body)
    
    const { email, password } = validatedData
    
    // =========================================================================
    // 2. Vérifier que l'email n'existe pas déjà
    // =========================================================================
    const adminClient = createAdminClient()
    const { data: existingUsers } = await adminClient.auth.admin.listUsers()
    
    const emailExists = existingUsers?.users?.some(
      user => user.email?.toLowerCase() === email.toLowerCase()
    )
    
    if (emailExists) {
      return createResponse(
        {
          success: false,
          error: 'Cette adresse email est déjà utilisée',
          code: 'EMAIL_ALREADY_EXISTS' as AuthErrorCode,
        },
        409
      )
    }
    
    // =========================================================================
    // 3. Créer le compte via Supabase Auth
    // =========================================================================
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Pas de confirmation email pour l'instant (authentification immédiate)
        emailRedirectTo: undefined,
      },
    })
    
    if (signUpError || !signUpData.user) {
      console.error('[Signup API] SignUp error:', signUpError)
      
      return createResponse(
        {
          success: false,
          error: signUpError?.message || 'Erreur lors de la création du compte',
          code: 'INTERNAL_ERROR' as AuthErrorCode,
        },
        500
      )
    }
    
    const user = signUpData.user
    
    // =========================================================================
    // 4. Vérifier si le pipeline a déjà été exécuté
    // =========================================================================
    const pipelineAlreadyComplete = await isPipelineComplete(user.id)
    
    if (!pipelineAlreadyComplete) {
      // =========================================================================
      // 5. Lancer le pipeline de création
      // =========================================================================
      console.log('[Signup API] Lancement du pipeline pour:', user.id)
      
      const pipelineResult = await createUserPipeline({
        userId: user.id,
        email: user.email!,
        fullName: undefined,
        referrerCode: null,
      })
      
      if (!pipelineResult.success) {
        console.error('[Signup API] Pipeline failed:', pipelineResult.error)
        
        // Le compte est créé mais le pipeline a échoué
        // On retourne une erreur mais l'utilisateur peut se reconnecter
        return createResponse(
          {
            success: false,
            error: `Le compte a été créé mais l'initialisation a échoué : ${pipelineResult.error}`,
            code: 'PIPELINE_FAILED' as AuthErrorCode,
          },
          500
        )
      }
      
      console.log('[Signup API] ✓ Pipeline terminé avec succès')
    } else {
      console.log('[Signup API] Pipeline déjà complet, skip')
    }
    
    // =========================================================================
    // 6. Retourner le succès avec les cookies de session
    // =========================================================================
    return createResponse(
      {
        success: true,
        message: 'Inscription réussie ! Bienvenue sur Tuge AI.',
        data: {
          user: {
            id: user.id,
            email: user.email!,
          },
          isNewUser: true,
        },
      },
      201
    )
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return createResponse(
        {
          success: false,
          error: firstError?.message || 'Données invalides',
          code: 'VALIDATION_ERROR' as AuthErrorCode,
        },
        400
      )
    }
    
    if (error instanceof SyntaxError) {
      return createResponse(
        {
          success: false,
          error: 'Format de requête invalide',
          code: 'VALIDATION_ERROR' as AuthErrorCode,
        },
        400
      )
    }
    
    console.error('[Signup API] Unexpected error:', error)
    
    return createResponse(
      {
        success: false,
        error: 'Une erreur inattendue s\'est produite',
        code: 'INTERNAL_ERROR' as AuthErrorCode,
      },
      500
    )
  }
}


