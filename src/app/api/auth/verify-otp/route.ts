/**
 * API Route: POST /api/auth/verify-otp
 * 
 * Vérifie le code OTP et finalise l'authentification.
 * 
 * Flow :
 * 1. Valide le code OTP via Supabase Auth
 * 2. Crée le profil si nouvel utilisateur (avec parrainage)
 * 3. Définit les cookies de session
 * 4. Retourne la session
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/server'
import { createProfile, profileExists } from '@/lib/auth/createProfile'
import { 
  VerifyOtpSchema, 
  getIdentifierType,
  normalizePhone,
  type AuthErrorCode 
} from '@/types/auth'
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
          // Stocke les cookies pour les ajouter à la réponse finale
          cookies.forEach((cookie) => {
            cookiesToSet.push(cookie)
          })
        },
      },
    }
  )
  
  // Fonction helper pour créer une réponse avec les cookies
  function createResponse(body: Record<string, unknown>, status: number): NextResponse {
    const response = NextResponse.json(body, { status })
    
    // Ajoute tous les cookies stockés à la réponse
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })
    
    return response
  }
  
  try {
    // 1. Parse et validation
    const body = await request.json()
    const validatedData = VerifyOtpSchema.parse(body)
    
    const { identifier, code, referrerCode } = validatedData
    const identifierType = getIdentifierType(identifier)
    
    // 2. Vérifie l'OTP via Supabase Auth (avec le client qui gère les cookies)
    let verifyResult
    
    if (identifierType === 'email') {
      verifyResult = await supabase.auth.verifyOtp({
        email: identifier.toLowerCase().trim(),
        token: code,
        type: 'email',
      })
    } else {
      const normalizedPhone = normalizePhone(identifier)
      verifyResult = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token: code,
        type: 'sms',
      })
    }
    
    const { data: verifyData, error: verifyError } = verifyResult
    
    if (verifyError || !verifyData.user) {
      console.error('[VerifyOTP] Verification error:', verifyError)
      
      const isExpired = verifyError?.message.includes('expired')
      return createResponse(
        { 
          success: false, 
          error: isExpired ? 'Le code a expiré. Demandez un nouveau code.' : 'Code incorrect. Vérifiez et réessayez.',
          code: (isExpired ? 'OTP_EXPIRED' : 'OTP_INVALID') as AuthErrorCode
        },
        isExpired ? 410 : 401
      )
    }
    
    const user = verifyData.user
    
    // 3. Utilise le client admin pour les opérations sur la DB (bypass RLS)
    const adminClient = createAdminClient()
    const isNewUser = !(await profileExists(user.id))
    
    // 4. Crée le profil si nouveau utilisateur
    let hasReferrer = false
    
    if (isNewUser) {
      const storedReferrerCode = user.user_metadata?.referrer_code || referrerCode
      
      const profileResult = await createProfile({
        userId: user.id,
        email: user.email,
        phone: user.phone,
        referrerCode: storedReferrerCode,
      })
      
      if (!profileResult.success) {
        console.error('[VerifyOTP] Profile creation failed:', profileResult.error)
        return createResponse(
          { success: false, error: 'Erreur lors de la création du profil.', code: 'PROFILE_CREATION_FAILED' as AuthErrorCode },
          500
        )
      }
      
      hasReferrer = profileResult.hasReferrer
    } else {
      // Utilisateur existant - vérifie s'il a un parrain
      const { data: referral } = await adminClient
        .from('referrals')
        .select('referrer_id')
        .eq('user_id', user.id)
        .single()
      
      hasReferrer = !!referral
    }
    
    // 5. Lie le fingerprint au user_id (protection anti-doublons)
    const userEmail = user.email || identifier.toLowerCase().trim()
    try {
      const { error: linkError } = await adminClient.rpc(
        'link_fingerprint_to_user',
        {
          p_email: userEmail,
          p_user_id: user.id,
        }
      )
      
      if (linkError) {
        // Log l'erreur mais continue - ce n'est pas critique
        console.warn('[VerifyOTP] Failed to link fingerprint:', linkError)
      }
    } catch (linkErr) {
      console.warn('[VerifyOTP] Fingerprint link error:', linkErr)
    }
    
    // 6. Retourne le succès avec les cookies de session
    return createResponse(
      {
        success: true,
        message: isNewUser ? 'Inscription réussie ! Bienvenue.' : 'Connexion réussie !',
        data: {
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
          },
          isNewUser,
          hasReferrer,
        },
      },
      200
    )
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createResponse(
        { success: false, error: 'Code invalide', code: 'VALIDATION_ERROR' as AuthErrorCode },
        400
      )
    }
    
    if (error instanceof SyntaxError) {
      return createResponse(
        { success: false, error: 'Format de requête invalide', code: 'VALIDATION_ERROR' as AuthErrorCode },
        400
      )
    }
    
    console.error('[VerifyOTP] Unexpected error:', error)
    
    return createResponse(
      { success: false, error: 'Une erreur inattendue s\'est produite', code: 'INTERNAL_ERROR' as AuthErrorCode },
      500
    )
  }
}
