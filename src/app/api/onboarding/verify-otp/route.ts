/**
 * API Route: POST /api/onboarding/verify-otp
 * 
 * Gère la validation de l'OTP et la finalisation de l'inscription :
 * 1. Valide le token OTP via Supabase Auth
 * 2. Récupère la pré-inscription correspondante
 * 3. Crée le profil utilisateur
 * 4. Génère un code parrain pour le nouvel utilisateur
 * 5. Crée la relation de parrainage si applicable
 * 6. Supprime la pré-inscription
 * 7. Log l'action complète
 * 8. Retourne la session utilisateur
 * 
 * IMPORTANT: C'est ici que le compte est finalisé et le parrainage verrouillé.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateReferrerCode } from '@/lib/utils/referrer-code'
import { resolveReferrer } from '@/lib/utils/referrer'
import { logAction } from '@/lib/utils/logger'
import { sendWelcomeEmail, sendReferralNotificationEmail } from '@/lib/email/resend'
import { 
  VerifyOtpSchema, 
  type ApiResponse,
  type VerifyOtpResult,
  type ErrorCode,
  type UserRole
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
 * Crée une réponse de succès avec données
 */
function successResponse(
  message: string, 
  data: VerifyOtpResult
): NextResponse<ApiResponse<VerifyOtpResult>> {
  return NextResponse.json(
    { success: true, message, data },
    { status: 200 }
  )
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()
  
  // Extraction des métadonnées pour le logging
  const metadata = {
    ip_address: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
    user_agent: request.headers.get('user-agent') ?? undefined
  }

  try {
    // =========================================================================
    // 1. Parse et validation du body
    // =========================================================================
    const body = await request.json()
    const validatedData = VerifyOtpSchema.parse(body)
    
    const { email, token } = validatedData

    // =========================================================================
    // 2. Récupération de la pré-inscription
    // =========================================================================
    const { data: pendingReg, error: pendingError } = await supabase
      .from('pending_registrations')
      .select('*')
      .eq('email', email)
      .single()

    if (pendingError || !pendingReg) {
      await logAction({
        action_type: 'OTP_VERIFIED',
        target_email: email,
        status: 'failed',
        metadata,
        error_message: 'Pending registration not found'
      })
      
      return errorResponse(
        'Aucune inscription en attente pour cet email. Veuillez recommencer le processus.',
        'PENDING_REGISTRATION_NOT_FOUND',
        404
      )
    }

    // =========================================================================
    // 3. Vérification de l'expiration
    // =========================================================================
    const expiresAt = new Date(pendingReg.expires_at)
    if (expiresAt < new Date()) {
      // Supprime la pré-inscription expirée
      await supabase
        .from('pending_registrations')
        .delete()
        .eq('id', pendingReg.id)

      await logAction({
        action_type: 'OTP_VERIFIED',
        target_email: email,
        status: 'failed',
        metadata,
        error_message: 'Pending registration expired'
      })

      return errorResponse(
        'Le délai de vérification a expiré. Veuillez recommencer le processus.',
        'PENDING_REGISTRATION_EXPIRED',
        410
      )
    }

    // =========================================================================
    // 4. Vérification de l'OTP via Supabase Auth
    // =========================================================================
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    })

    if (verifyError || !verifyData.user) {
      await logAction({
        action_type: 'OTP_VERIFIED',
        target_email: email,
        status: 'failed',
        metadata,
        error_message: verifyError?.message ?? 'OTP verification failed'
      })

      // Détermine le type d'erreur
      if (verifyError?.message.includes('expired')) {
        return errorResponse(
          'Le code de vérification a expiré. Veuillez en demander un nouveau.',
          'OTP_EXPIRED',
          410
        )
      }

      return errorResponse(
        'Code de vérification incorrect',
        'OTP_INVALID',
        401
      )
    }

    const user = verifyData.user
    const session = verifyData.session

    // Log OTP validé
    await logAction({
      action_type: 'OTP_VERIFIED',
      target_email: email,
      target_user_id: user.id,
      status: 'completed',
      metadata
    })

    // =========================================================================
    // 5. Résolution du parrain (si code fourni dans la pré-inscription)
    // =========================================================================
    let referrerId: string | null = null
    
    if (pendingReg.referrer_code) {
      const referrerResolution = await resolveReferrer(pendingReg.referrer_code)
      if (referrerResolution.found) {
        referrerId = referrerResolution.referrer_id
      }
    }

    // =========================================================================
    // 6. Génération du code parrain pour le nouvel utilisateur
    // =========================================================================
    let referrerCode = generateReferrerCode()
    
    // Vérifie l'unicité du code (très rare collision, mais on s'assure)
    let attempts = 0
    const maxAttempts = 5
    
    while (attempts < maxAttempts) {
      const { data: existing } = await supabase
        .from('referrer_codes')
        .select('id')
        .eq('code', referrerCode)
        .single()
      
      if (!existing) break
      
      referrerCode = generateReferrerCode()
      attempts++
    }

    // =========================================================================
    // 7. Création du profil utilisateur (transaction logique)
    // =========================================================================
    
    // 7a. Créer le profil
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        role: pendingReg.role,
        referrer_code: referrerCode
      })

    if (profileError) {
      console.error('[VerifyOTP] Profile creation error:', profileError)
      
      await logAction({
        action_type: 'PROFILE_CREATED',
        target_user_id: user.id,
        status: 'failed',
        metadata,
        error_message: profileError.message
      })

      return errorResponse(
        'Erreur lors de la création du profil',
        'PROFILE_CREATION_FAILED',
        500
      )
    }

    await logAction({
      action_type: 'PROFILE_CREATED',
      target_user_id: user.id,
      status: 'completed',
      metadata
    })

    // 7b. Créer le code parrain dans la table dédiée
    const { error: codeError } = await supabase
      .from('referrer_codes')
      .insert({
        user_id: user.id,
        code: referrerCode,
        is_active: true
      })

    if (codeError) {
      console.error('[VerifyOTP] Referrer code creation error:', codeError)
      // Non bloquant - le code est déjà dans le profil
    }

    // =========================================================================
    // 8. Création de la relation de parrainage (si applicable)
    // =========================================================================
    let hasReferrer = false
    
    if (referrerId) {
      const { error: referralError } = await supabase
        .from('referrals')
        .insert({
          user_id: user.id,
          referrer_id: referrerId,
          level: 1, // Parrainage direct
          source: pendingReg.source
        })

      if (referralError) {
        // Log l'erreur mais ne bloque pas l'inscription
        console.error('[VerifyOTP] Referral creation error:', referralError)
        
        await logAction({
          action_type: 'REFERRAL_CREATED',
          target_user_id: user.id,
          referrer_id: referrerId,
          status: 'failed',
          metadata,
          error_message: referralError.message
        })
      } else {
        hasReferrer = true
        
        await logAction({
          action_type: 'REFERRAL_CREATED',
          target_user_id: user.id,
          referrer_id: referrerId,
          status: 'completed',
          metadata: {
            ...metadata,
            referrer_code: pendingReg.referrer_code ?? undefined
          }
        })

        // Notifie le parrain (async, non bloquant)
        notifyReferrerAsync(supabase, referrerId, email)
      }
    }

    // =========================================================================
    // 9. Suppression de la pré-inscription
    // =========================================================================
    await supabase
      .from('pending_registrations')
      .delete()
      .eq('id', pendingReg.id)

    // =========================================================================
    // 10. Log de complétion et envoi email de bienvenue
    // =========================================================================
    await logAction({
      action_type: 'REGISTRATION_COMPLETED',
      target_email: email,
      target_user_id: user.id,
      referrer_id: referrerId ?? undefined,
      status: 'completed',
      metadata: {
        ...metadata,
        role: pendingReg.role,
        source: pendingReg.source,
        has_referrer: hasReferrer
      }
    })

    // Envoi email de bienvenue (async, non bloquant)
    sendWelcomeEmail(email, referrerCode).catch(err => {
      console.error('[VerifyOTP] Welcome email error:', err)
    })

    // =========================================================================
    // 11. Retour de la réponse avec session
    // =========================================================================
    if (!session) {
      // Si pas de session (cas rare), le frontend devra reconnecter l'utilisateur
      return successResponse(
        'Inscription réussie ! Vous pouvez maintenant vous connecter.',
        {
          session: {
            access_token: '',
            refresh_token: '',
            expires_at: 0,
            user: { id: user.id, email: user.email! }
          },
          profile: {
            id: user.id,
            role: pendingReg.role as UserRole,
            referrer_code: referrerCode
          },
          has_referrer: hasReferrer
        }
      )
    }

    return successResponse(
      'Inscription réussie ! Bienvenue sur Tuge.',
      {
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at ?? 0,
          user: {
            id: user.id,
            email: user.email!
          }
        },
        profile: {
          id: user.id,
          role: pendingReg.role as UserRole,
          referrer_code: referrerCode
        },
        has_referrer: hasReferrer
      }
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
    console.error('[VerifyOTP] Unexpected error:', error)

    return errorResponse(
      'Une erreur inattendue s\'est produite',
      'INTERNAL_ERROR',
      500
    )
  }
}

/**
 * Notifie le parrain de manière asynchrone (non bloquante)
 */
async function notifyReferrerAsync(
  supabase: ReturnType<typeof createAdminClient>,
  referrerId: string,
  referredEmail: string
) {
  try {
    // Récupère l'email du parrain
    const { data: referrerUser } = await supabase.auth.admin.getUserById(referrerId)
    
    if (referrerUser?.user?.email) {
      await sendReferralNotificationEmail(referrerUser.user.email, referredEmail)
    }
  } catch (err) {
    console.error('[VerifyOTP] Referrer notification error:', err)
    // Non bloquant - on ne fait que logger l'erreur
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

