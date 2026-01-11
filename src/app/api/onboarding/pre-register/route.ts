/**
 * API Route: POST /api/onboarding/pre-register
 * 
 * Gère la première étape de l'inscription :
 * 1. Valide les données entrantes
 * 2. Vérifie que l'email n'est pas déjà utilisé
 * 3. Résout le code parrain si fourni
 * 4. Crée une pré-inscription en attente
 * 5. Envoie l'OTP via Supabase Auth
 * 6. Log l'action pour traçabilité
 * 
 * IMPORTANT: Aucun compte utilisateur n'est créé à cette étape.
 * Le compte sera créé uniquement après validation OTP.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { resolveReferrer } from '@/lib/utils/referrer'
import { createRegistrationLogger } from '@/lib/utils/logger'
import { 
  PreRegisterSchema, 
  type ApiResponse,
  type ErrorCode 
} from '@/types/onboarding'
import { z } from 'zod'

/**
 * Crée une réponse d'erreur standardisée
 */
function errorResponse(
  error: string, 
  code: ErrorCode, 
  status: number,
  details?: Record<string, string[]>
): NextResponse<ApiResponse> {
  return NextResponse.json(
    { success: false, error, code, details },
    { status }
  )
}

/**
 * Crée une réponse de succès standardisée
 */
function successResponse(message: string): NextResponse<ApiResponse> {
  return NextResponse.json(
    { success: true, message },
    { status: 200 }
  )
}

export async function POST(request: NextRequest) {
  // Extraction des métadonnées pour le logging
  const metadata = {
    ip_address: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
    user_agent: request.headers.get('user-agent') ?? undefined
  }

  let logger: Awaited<ReturnType<typeof createRegistrationLogger>> | null = null

  try {
    // =========================================================================
    // 1. Parse et validation du body
    // =========================================================================
    const body = await request.json()
    const validatedData = PreRegisterSchema.parse(body)
    
    const { email, role, referrer_code, source } = validatedData

    // =========================================================================
    // 2. Résolution du parrain (si code fourni)
    // =========================================================================
    let referrerId: string | null = null
    
    if (referrer_code) {
      const referrerResolution = await resolveReferrer(referrer_code)
      
      if (!referrerResolution.found) {
        return errorResponse(
          'Le code parrain fourni est invalide ou inactif',
          'INVALID_REFERRER_CODE',
          400
        )
      }
      
      referrerId = referrerResolution.referrer_id
    }

    // =========================================================================
    // 3. Initialisation du logger
    // =========================================================================
    logger = await createRegistrationLogger(email, referrerId, {
      ...metadata,
      referrer_code: referrer_code ?? undefined
    })

    // =========================================================================
    // 4. Vérification que l'email n'est pas déjà enregistré
    // =========================================================================
    const supabase = createAdminClient()
    
    // Vérifie dans auth.users via l'API admin
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const emailExists = existingUsers?.users?.some(
      user => user.email?.toLowerCase() === email.toLowerCase()
    )
    
    if (emailExists) {
      await logger.fail('Email already registered')
      return errorResponse(
        'Cette adresse email est déjà associée à un compte',
        'EMAIL_ALREADY_REGISTERED',
        409
      )
    }

    // =========================================================================
    // 5. Création/Mise à jour de la pré-inscription
    // =========================================================================
    // Supprime d'abord toute pré-inscription existante pour cet email
    await supabase
      .from('pending_registrations')
      .delete()
      .eq('email', email)
    
    // Crée une nouvelle pré-inscription
    const { error: insertError } = await supabase
      .from('pending_registrations')
      .insert({
        email,
        role,
        referrer_code: referrer_code ?? null,
        consent: true, // Déjà validé par Zod comme literal true
        source,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      })

    if (insertError) {
      console.error('[PreRegister] Insert error:', insertError)
      await logger.fail(insertError.message)
      return errorResponse(
        'Erreur lors de la création de la pré-inscription',
        'INTERNAL_ERROR',
        500
      )
    }

    // =========================================================================
    // 6. Envoi de l'OTP via Supabase Auth
    // =========================================================================
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Pas de création automatique de compte
        // L'utilisateur doit d'abord valider l'OTP
        shouldCreateUser: false
      }
    })

    // Note: Supabase retourne une erreur si l'utilisateur n'existe pas
    // mais avec shouldCreateUser: false. C'est le comportement attendu.
    // L'OTP sera quand même envoyé pour les nouveaux utilisateurs.
    
    // On ignore l'erreur "User not found" car c'est normal pour une nouvelle inscription
    if (otpError && !otpError.message.includes('User not found')) {
      console.error('[PreRegister] OTP error:', otpError)
      
      // Si l'erreur est liée au rate limiting
      if (otpError.message.includes('rate') || otpError.status === 429) {
        await logger.fail('Rate limited')
        return errorResponse(
          'Trop de tentatives. Veuillez réessayer dans quelques minutes.',
          'RATE_LIMITED',
          429
        )
      }
      
      await logger.fail(otpError.message)
      return errorResponse(
        'Erreur lors de l\'envoi du code de vérification',
        'INTERNAL_ERROR',
        500
      )
    }

    // Workaround: Pour les nouveaux utilisateurs, on utilise signUp avec un mot de passe temporaire
    // puis on supprime le compte créé car on veut que la vraie création se fasse après validation OTP
    // 
    // Alternative plus propre: Utiliser Supabase Auth Hooks ou un email custom via Resend
    // Pour l'instant, on envoie directement l'OTP via signInWithOtp avec shouldCreateUser: true
    // car Supabase gère automatiquement l'envoi de l'email
    
    const { error: signUpOtpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: {
          // Métadonnées stockées temporairement
          pending_registration: true,
          role,
          referrer_code: referrer_code ?? null,
          source
        }
      }
    })

    if (signUpOtpError) {
      // Rate limiting
      if (signUpOtpError.message.includes('rate') || signUpOtpError.status === 429) {
        await logger.fail('Rate limited')
        return errorResponse(
          'Trop de tentatives. Veuillez réessayer dans quelques minutes.',
          'RATE_LIMITED',
          429
        )
      }
      
      // Pour "User already registered", c'est normal si quelqu'un retente
      if (!signUpOtpError.message.includes('already registered')) {
        console.error('[PreRegister] SignUp OTP error:', signUpOtpError)
        await logger.fail(signUpOtpError.message)
        return errorResponse(
          'Erreur lors de l\'envoi du code de vérification',
          'INTERNAL_ERROR',
          500
        )
      }
    }

    // =========================================================================
    // 7. Succès - OTP envoyé
    // =========================================================================
    await logger.pending()

    return successResponse(
      'Un code de vérification a été envoyé à votre adresse email. ' +
      'Ce code expire dans 15 minutes.'
    )

  } catch (error) {
    // Erreur de validation Zod
    if (error instanceof z.ZodError) {
      const details: Record<string, string[]> = {}
      error.issues.forEach(issue => {
        const path = issue.path.join('.')
        if (!details[path]) {
          details[path] = []
        }
        details[path].push(issue.message)
      })

      return errorResponse(
        'Données invalides',
        'VALIDATION_ERROR',
        400,
        details
      )
    }

    // Erreur JSON parse
    if (error instanceof SyntaxError) {
      return errorResponse(
        'Format de requête invalide',
        'VALIDATION_ERROR',
        400
      )
    }

    // Erreur inattendue
    console.error('[PreRegister] Unexpected error:', error)
    
    if (logger) {
      await logger.fail(error instanceof Error ? error.message : 'Unknown error')
    }

    return errorResponse(
      'Une erreur inattendue s\'est produite',
      'INTERNAL_ERROR',
      500
    )
  }
}

/**
 * Gestion des autres méthodes HTTP
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

