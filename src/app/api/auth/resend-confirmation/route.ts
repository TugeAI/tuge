/**
 * API Route: POST /api/auth/resend-confirmation
 * 
 * Renvoie un email de confirmation à un utilisateur.
 * 
 * Cas d'usage :
 * - Lien de confirmation expiré
 * - Email non reçu
 * - Lien corrompu ou invalide
 * 
 * Body :
 * {
 *   "email": "user@example.com"
 * }
 * 
 * Réponse :
 * {
 *   "success": true,
 *   "message": "Email de confirmation envoyé"
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Schéma de validation
const ResendConfirmationSchema = z.object({
  email: z.string().email('Email invalide'),
})

// Rate limiting simple en mémoire (pour production, utiliser Redis)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const MAX_REQUESTS = 3 // 3 tentatives par 15 minutes

function checkRateLimit(email: string): { allowed: boolean; resetAt?: number } {
  const now = Date.now()
  const record = rateLimitStore.get(email)

  // Nettoyer les anciennes entrées
  if (record && now > record.resetAt) {
    rateLimitStore.delete(email)
    return { allowed: true }
  }

  // Première requête
  if (!record) {
    rateLimitStore.set(email, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    })
    return { allowed: true }
  }

  // Vérifier la limite
  if (record.count >= MAX_REQUESTS) {
    return { allowed: false, resetAt: record.resetAt }
  }

  // Incrémenter le compteur
  record.count++
  return { allowed: true }
}

export async function POST(request: NextRequest) {
  try {
    // =========================================================================
    // 1. Validation des données
    // =========================================================================
    const body = await request.json()
    const validation = ResendConfirmationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { email } = validation.data

    // =========================================================================
    // 2. Rate limiting
    // =========================================================================
    const rateLimit = checkRateLimit(email)
    if (!rateLimit.allowed) {
      const minutesLeft = Math.ceil((rateLimit.resetAt! - Date.now()) / 60000)
      return NextResponse.json(
        {
          success: false,
          error: 'rate_limit',
          message: `Trop de tentatives. Veuillez réessayer dans ${minutesLeft} minutes.`,
        },
        { status: 429 }
      )
    }

    // =========================================================================
    // 3. Créer un client Supabase avec service role
    // =========================================================================
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // =========================================================================
    // 4. Vérifier si l'utilisateur existe
    // =========================================================================
    const { data: users, error: getUserError } = await supabase
      .from('auth.users')
      .select('id, email, email_confirmed_at')
      .eq('email', email)
      .limit(1)

    // Note : Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
    // On retourne toujours un succès pour éviter l'énumération d'emails

    if (getUserError) {
      console.error('[Resend Confirmation] Error fetching user:', getUserError)
      // Retourner succès pour ne pas révéler l'existence de l'email
      return NextResponse.json({
        success: true,
        message: 'Si cet email existe dans notre système, un email de confirmation a été envoyé.',
      })
    }

    // Si l'utilisateur n'existe pas, on retourne quand même un succès
    if (!users || users.length === 0) {
      console.log('[Resend Confirmation] User not found:', email)
      return NextResponse.json({
        success: true,
        message: 'Si cet email existe dans notre système, un email de confirmation a été envoyé.',
      })
    }

    const user = users[0]

    // Si l'email est déjà confirmé, on le signale
    if (user.email_confirmed_at) {
      console.log('[Resend Confirmation] Email already confirmed:', email)
      return NextResponse.json({
        success: true,
        message: 'Cet email est déjà confirmé. Vous pouvez vous connecter.',
        already_confirmed: true,
      })
    }

    // =========================================================================
    // 5. Renvoyer l'email de confirmation via Supabase Auth
    // =========================================================================
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback`,
      },
    })

    if (resendError) {
      console.error('[Resend Confirmation] Error resending email:', resendError)
      
      // Erreurs spécifiques
      if (resendError.message.includes('rate limit')) {
        return NextResponse.json(
          {
            success: false,
            error: 'rate_limit',
            message: 'Trop de tentatives. Veuillez réessayer dans quelques minutes.',
          },
          { status: 429 }
        )
      }

      // Retourner succès pour ne pas révéler les détails
      return NextResponse.json({
        success: true,
        message: 'Si cet email existe dans notre système, un email de confirmation a été envoyé.',
      })
    }

    console.log('[Resend Confirmation] ✓ Confirmation email sent to:', email)

    return NextResponse.json({
      success: true,
      message: 'Un nouvel email de confirmation a été envoyé. Vérifiez votre boîte de réception et vos spams.',
    })

  } catch (error) {
    console.error('[Resend Confirmation] Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'internal_error',
        message: 'Une erreur est survenue. Veuillez réessayer.',
      },
      { status: 500 }
    )
  }
}

