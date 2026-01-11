/**
 * API Route: /api/profile
 * 
 * Gestion du profil utilisateur :
 * - GET: Récupère le profil complet avec email et stats parrainage
 * - PATCH: Met à jour les informations du profil
 * - DELETE: Supprime le compte utilisateur
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ============================================================================
// SCHEMAS DE VALIDATION
// ============================================================================

const UpdateProfileSchema = z.object({
  first_name: z.string().max(50, 'Prénom trop long').nullable().optional(),
  last_name: z.string().max(50, 'Nom trop long').nullable().optional(),
  role: z.enum(['individual', 'professional']).optional(),
  avatar_url: z.string().url('URL invalide').nullable().optional(),
})

// ============================================================================
// GET /api/profile - Récupère le profil complet
// ============================================================================

export async function GET() {
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

    const adminClient = createAdminClient()

    // Récupère le profil
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[Profile] Erreur récupération profil:', profileError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du profil' },
        { status: 500 }
      )
    }

    // Récupère le code de parrainage
    const { data: referrerCode } = await adminClient
      .from('referrer_codes')
      .select('code')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    // Compte le nombre de filleuls directs
    const { count: referralsCount } = await adminClient
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', user.id)
      .eq('level', 1)

    // Récupère le wallet pour les crédits
    const { data: walletData } = await adminClient.rpc('get_user_wallet', {
      p_user_id: user.id
    })

    const wallet = walletData?.[0] || {
      paid_credits: 0,
      daily_free_credits: 0,
      total_credits: 0,
    }

    return NextResponse.json({
      profile: {
        id: profile.id,
        email: user.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        role: profile.role,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      },
      referral: {
        code: referrerCode?.code || null,
        referrals_count: referralsCount || 0,
      },
      wallet: {
        total_credits: wallet.total_credits,
      },
    })

  } catch (error) {
    console.error('[Profile] Erreur inattendue GET:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PATCH /api/profile - Met à jour le profil
// ============================================================================

export async function PATCH(request: NextRequest) {
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

    // Parse et valide le body
    const body = await request.json()
    const validation = UpdateProfileSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const updates = validation.data
    const adminClient = createAdminClient()

    // Met à jour le profil
    const { data: updatedProfile, error: updateError } = await adminClient
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('[Profile] Erreur mise à jour:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du profil' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      profile: {
        id: updatedProfile.id,
        email: user.email,
        first_name: updatedProfile.first_name,
        last_name: updatedProfile.last_name,
        role: updatedProfile.role,
        avatar_url: updatedProfile.avatar_url,
        updated_at: updatedProfile.updated_at,
      },
    })

  } catch (error) {
    console.error('[Profile] Erreur inattendue PATCH:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE /api/profile - Supprime le compte
// ============================================================================

export async function DELETE() {
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

    const adminClient = createAdminClient()

    // Log l'action avant suppression
    await adminClient.from('ai_actions_log').insert({
      action_type: 'account_deletion',
      target_user_id: user.id,
      target_email: user.email,
      status: 'initiated',
      metadata: {
        requested_at: new Date().toISOString(),
      },
    })

    // Supprime l'utilisateur de Supabase Auth
    // Cela cascadera et supprimera également le profil grâce à ON DELETE CASCADE
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('[Profile] Erreur suppression compte:', deleteError)
      
      // Log l'échec
      await adminClient.from('ai_actions_log').insert({
        action_type: 'account_deletion',
        target_user_id: user.id,
        target_email: user.email,
        status: 'failed',
        error_message: deleteError.message,
        metadata: {
          failed_at: new Date().toISOString(),
        },
      })

      return NextResponse.json(
        { error: 'Erreur lors de la suppression du compte' },
        { status: 500 }
      )
    }

    // Log le succès
    await adminClient.from('ai_actions_log').insert({
      action_type: 'account_deletion',
      target_email: user.email,
      status: 'completed',
      metadata: {
        deleted_at: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Compte supprimé avec succès',
    })

  } catch (error) {
    console.error('[Profile] Erreur inattendue DELETE:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}







