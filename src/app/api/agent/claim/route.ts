/**
 * API Route: POST /api/agent/claim
 * 
 * Transfère les conversations anonymes (session_id) et le profil visiteur
 * vers un utilisateur authentifié (user_id) après inscription ou connexion.
 * 
 * Cela permet de récupérer :
 * - L'historique de conversation d'un utilisateur qui a commencé avant de s'inscrire
 * - Les informations collectées pendant l'onboarding (prénom, intention)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Schéma de validation de la requête
const ClaimRequestSchema = z.object({
  sessionId: z.string().uuid('Session ID invalide')
})

// Types de réponse
interface ClaimApiResponse {
  success: boolean
  claimedCount?: number
  visitorProfile?: {
    firstName: string | null
    intention: string | null
    claimed: boolean
  }
  error?: string
  code?: string
}

/**
 * POST /api/agent/claim
 * Transfère les conversations anonymes et le profil visiteur vers l'utilisateur connecté
 */
export async function POST(request: NextRequest): Promise<NextResponse<ClaimApiResponse>> {
  try {
    // 1. Vérification de l'authentification
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // 2. Validation du body
    const body = await request.json()
    const validation = ClaimRequestSchema.safeParse(body)
    
    if (!validation.success) {
      const errors = validation.error.issues.map(i => i.message).join(', ')
      return NextResponse.json(
        { success: false, error: errors, code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const { sessionId } = validation.data

    // 3. Utiliser le client admin pour bypass RLS
    const adminClient = createAdminClient()

    // 4. Appeler la fonction SQL pour transférer les conversations
    const { data: conversationData, error: claimConvError } = await adminClient
      .rpc('claim_anonymous_conversations', {
        p_session_id: sessionId,
        p_user_id: user.id
      })

    if (claimConvError) {
      console.error('[Claim API] Claim conversations error:', claimConvError)
      // On continue quand même pour tenter de transférer le profil visiteur
    }

    const claimedCount = (conversationData as number) || 0

    // 5. Transférer le profil visiteur (prénom, intention)
    let visitorProfile: ClaimApiResponse['visitorProfile'] = undefined
    
    try {
      const { data: profileData, error: claimProfileError } = await (adminClient as any)
        .rpc('claim_visitor_profile', {
          p_session_id: sessionId,
          p_user_id: user.id
        })

      if (!claimProfileError && profileData?.[0]) {
        visitorProfile = {
          firstName: profileData[0].first_name,
          intention: profileData[0].intention,
          claimed: profileData[0].claimed
        }
        
        if (visitorProfile.claimed) {
          console.log(`[Claim API] Profil visiteur transféré: prénom="${visitorProfile.firstName}", intention="${visitorProfile.intention}"`)
        }
      }
    } catch (profileError) {
      console.error('[Claim API] Claim visitor profile error:', profileError)
      // Non bloquant, on continue
    }

    console.log(`[Claim API] ${claimedCount} conversation(s) transférée(s) pour l'utilisateur ${user.id}`)

    return NextResponse.json({
      success: true,
      claimedCount,
      visitorProfile
    })

  } catch (error) {
    // Erreur JSON parse
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'Format de requête invalide', code: 'INVALID_JSON' },
        { status: 400 }
      )
    }

    console.error('[Claim API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur inattendue s\'est produite', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/agent/claim - Non autorisé
 */
export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Méthode non autorisée', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  )
}

