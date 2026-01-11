/**
 * POST /api/credits/claim-daily
 * 
 * Réclame les 10 crédits gratuits quotidiens.
 * - Non cumulables : reset à 10 chaque jour
 * - Non transférables
 * - Non commissionnés MLM
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    // Vérifie l'authentification
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Appelle la fonction RPC pour claim les crédits
    const adminClient = createAdminClient()
    const { data, error } = await adminClient.rpc('claim_daily_free_credits', {
      p_user_id: user.id
    })

    if (error) {
      console.error('[ClaimDaily] Erreur RPC:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la réclamation des crédits' },
        { status: 500 }
      )
    }

    const result = data?.[0]

    if (!result) {
      return NextResponse.json(
        { error: 'Réponse invalide du serveur' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: result.success,
      wallet: {
        daily_free_credits: result.daily_free_credits,
        paid_credits: result.paid_credits,
        total_credits: result.daily_free_credits + result.paid_credits,
      },
      message: result.message,
    })

  } catch (error) {
    console.error('[ClaimDaily] Erreur inattendue:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}







