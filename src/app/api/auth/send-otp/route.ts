/**
 * API Route: POST /api/auth/send-otp
 * 
 * Envoie un code OTP par email ou SMS.
 * 
 * Flow :
 * 1. Valide l'identifiant (email ou téléphone)
 * 2. Enregistre le fingerprint pour la protection anti-doublons
 * 3. Stocke le code parrain en metadata temporaire
 * 4. Envoie l'OTP via Supabase Auth
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { 
  SendOtpSchema, 
  getIdentifierType, 
  isValidEmail, 
  isValidPhone,
  normalizePhone,
  type SendOtpResponse,
  type AuthErrorCode 
} from '@/types/auth'
import type { Json } from '@/lib/supabase/types'
import { z } from 'zod'

/**
 * Récupère l'IP du client depuis les headers
 */
function getClientIp(request: NextRequest): string {
  // Ordre de priorité pour récupérer l'IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for peut contenir plusieurs IPs (client, proxy1, proxy2...)
    // On prend la première qui est l'IP du client original
    return forwarded.split(',')[0].trim()
  }
  
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  
  // Fallback : IP de la requête directe (peut être localhost en dev)
  return request.headers.get('cf-connecting-ip') || // Cloudflare
         request.headers.get('true-client-ip') ||   // Akamai
         '127.0.0.1'
}

function errorResponse(
  error: string,
  code: AuthErrorCode,
  status: number
): NextResponse<SendOtpResponse> {
  return NextResponse.json(
    { success: false, error, code },
    { status }
  )
}

function successResponse(
  message: string,
  identifier: string,
  type: 'email' | 'phone',
  suspicionData?: {
    isSuspicious: boolean
    suspicionLevel: string
    suspicionReason: string | null
  }
): NextResponse<SendOtpResponse> {
  return NextResponse.json(
    { 
      success: true, 
      message, 
      data: { 
        identifier, 
        type,
        isSuspicious: suspicionData?.isSuspicious,
        suspicionLevel: suspicionData?.suspicionLevel as 'none' | 'low' | 'medium' | 'high',
        suspicionReason: suspicionData?.suspicionReason,
      } 
    },
    { status: 200 }
  )
}

export async function POST(request: NextRequest) {
  try {
    // 1. Parse et validation
    const body = await request.json()
    const validatedData = SendOtpSchema.parse(body)
    
    const { identifier, referrerCode, fingerprintId, fingerprintMetadata } = validatedData
    const identifierType = getIdentifierType(identifier)
    
    // 2. Validation spécifique selon le type
    if (identifierType === 'email') {
      if (!isValidEmail(identifier)) {
        return errorResponse(
          'Adresse email invalide',
          'INVALID_IDENTIFIER',
          400
        )
      }
    } else {
      if (!isValidPhone(identifier)) {
        return errorResponse(
          'Numéro de téléphone invalide. Format attendu : 06/07 XX XX XX XX',
          'INVALID_IDENTIFIER',
          400
        )
      }
    }
    
    const supabase = createAdminClient()
    
    // 3. Enregistrer le fingerprint pour la protection anti-doublons
    let suspicionData: {
      isSuspicious: boolean
      suspicionLevel: string
      suspicionReason: string | null
    } | undefined
    
    if (fingerprintId) {
      const clientIp = getClientIp(request)
      const userAgent = request.headers.get('user-agent') || null
      
      try {
        const { data: fpResult, error: fpError } = await supabase.rpc(
          'register_device_fingerprint',
          {
            p_email: identifier.toLowerCase().trim(),
            p_ip_address: clientIp,
            p_fingerprint_id: fingerprintId,
            p_user_agent: userAgent,
            p_metadata: (fingerprintMetadata || {}) as Json,
          }
        )
        
        if (fpError) {
          console.error('[SendOTP] Fingerprint registration error:', fpError)
          // On continue malgré l'erreur - le fingerprinting est optionnel
        } else if (fpResult && fpResult.length > 0) {
          const result = fpResult[0]
          suspicionData = {
            isSuspicious: result.is_suspicious,
            suspicionLevel: result.suspicion_level,
            suspicionReason: result.suspicion_reason,
          }
          
          if (result.is_suspicious) {
            console.warn('[SendOTP] Suspicious fingerprint detected:', {
              email: identifier,
              ip: clientIp,
              fingerprintId,
              suspicionLevel: result.suspicion_level,
              suspicionReason: result.suspicion_reason,
            })
          }
        }
      } catch (fpErr) {
        console.error('[SendOTP] Fingerprint error:', fpErr)
        // On continue malgré l'erreur
      }
    }
    
    // 4. Envoie l'OTP via Supabase Auth
    if (identifierType === 'email') {
      const { error } = await supabase.auth.signInWithOtp({
        email: identifier.toLowerCase().trim(),
        options: {
          shouldCreateUser: true,
          data: {
            referrer_code: referrerCode || null,
          }
        }
      })
      
      if (error) {
        console.error('[SendOTP] Email OTP error:', error)
        
        if (error.message.includes('rate') || error.status === 429) {
          return errorResponse(
            'Trop de tentatives. Réessayez dans quelques minutes.',
            'RATE_LIMITED',
            429
          )
        }
        
        return errorResponse(
          'Impossible d\'envoyer le code. Réessayez plus tard.',
          'OTP_SEND_FAILED',
          500
        )
      }
      
      return successResponse(
        'Un code de vérification a été envoyé à votre adresse email.',
        identifier.toLowerCase().trim(),
        'email',
        suspicionData
      )
      
    } else {
      // Téléphone - normalise au format E.164
      const normalizedPhone = normalizePhone(identifier)
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
        options: {
          shouldCreateUser: true,
          data: {
            referrer_code: referrerCode || null,
          }
        }
      })
      
      if (error) {
        console.error('[SendOTP] Phone OTP error:', error)
        
        if (error.message.includes('rate') || error.status === 429) {
          return errorResponse(
            'Trop de tentatives. Réessayez dans quelques minutes.',
            'RATE_LIMITED',
            429
          )
        }
        
        return errorResponse(
          'Impossible d\'envoyer le SMS. Vérifiez le numéro.',
          'OTP_SEND_FAILED',
          500
        )
      }
      
      return successResponse(
        'Un code de vérification a été envoyé par SMS.',
        normalizedPhone,
        'phone',
        suspicionData
      )
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        'Données invalides',
        'VALIDATION_ERROR',
        400
      )
    }
    
    if (error instanceof SyntaxError) {
      return errorResponse(
        'Format de requête invalide',
        'VALIDATION_ERROR',
        400
      )
    }
    
    console.error('[SendOTP] Unexpected error:', error)
    
    return errorResponse(
      'Une erreur inattendue s\'est produite',
      'INTERNAL_ERROR',
      500
    )
  }
}
