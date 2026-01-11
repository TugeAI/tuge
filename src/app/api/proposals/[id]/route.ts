/**
 * API Route: /api/proposals/[id]
 * 
 * Gère les actions sur une proposition spécifique :
 * - GET: Récupérer les détails d'une proposition
 * - PATCH: Répondre (accept/reject) ou annuler une proposition
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ============================================================================
// Schémas de validation
// ============================================================================

const ProposalActionSchema = z.object({
  action: z.enum(['accept', 'reject', 'cancel']),
})

// ============================================================================
// GET /api/proposals/[id] - Récupérer une proposition
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params

    // 1. Validation de l'ID
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json(
        { success: false, error: 'ID de proposition invalide', code: 'INVALID_ID' },
        { status: 400 }
      )
    }

    // 2. Vérification de l'authentification
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // 3. Récupérer la proposition via RPC
    const adminClient = createAdminClient()
    const { data: proposal, error: rpcError } = await adminClient.rpc('get_proposal_by_id', {
      p_proposal_id: id,
    })

    if (rpcError) {
      console.error('[Proposals API] RPC error:', rpcError)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération', code: 'RPC_ERROR' },
        { status: 500 }
      )
    }

    if (!proposal || proposal.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Proposition non trouvée', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      proposal: proposal[0],
    })

  } catch (error) {
    console.error('[Proposals API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PATCH /api/proposals/[id] - Répondre ou annuler une proposition
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params

    // 1. Validation de l'ID
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json(
        { success: false, error: 'ID de proposition invalide', code: 'INVALID_ID' },
        { status: 400 }
      )
    }

    // 2. Vérification de l'authentification
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // 3. Validation du body
    const body = await request.json()
    const validation = ProposalActionSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Action invalide. Utilisez "accept", "reject" ou "cancel"', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const { action } = validation.data
    const adminClient = createAdminClient()

    // 4. Exécuter l'action appropriée
    if (action === 'cancel') {
      // L'émetteur annule sa proposition
      const { data: result, error: rpcError } = await adminClient.rpc('cancel_proposal', {
        p_proposal_id: id,
      })

      if (rpcError) {
        console.error('[Proposals API] RPC error:', rpcError)
        return NextResponse.json(
          { success: false, error: 'Erreur lors de l\'annulation', code: 'RPC_ERROR' },
          { status: 500 }
        )
      }

      const cancelResult = result?.[0]
      
      if (!cancelResult?.success) {
        return NextResponse.json(
          { success: false, error: cancelResult?.error_message || 'Impossible d\'annuler', code: 'CANCEL_FAILED' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Proposition annulée',
        newStatus: 'cancelled',
      })

    } else {
      // Le destinataire accepte ou refuse
      const { data: result, error: rpcError } = await adminClient.rpc('respond_to_proposal', {
        p_proposal_id: id,
        p_action: action,
      })

      if (rpcError) {
        console.error('[Proposals API] RPC error:', rpcError)
        return NextResponse.json(
          { success: false, error: 'Erreur lors de la réponse', code: 'RPC_ERROR' },
          { status: 500 }
        )
      }

      const respondResult = result?.[0]
      
      if (!respondResult?.success) {
        return NextResponse.json(
          { success: false, error: respondResult?.error_message || 'Impossible de répondre', code: 'RESPOND_FAILED' },
          { status: 400 }
        )
      }

      // Récupérer la proposition mise à jour
      const { data: updatedProposal } = await adminClient.rpc('get_proposal_by_id', {
        p_proposal_id: id,
      })

      return NextResponse.json({
        success: true,
        message: action === 'accept' ? 'Proposition acceptée' : 'Proposition refusée',
        newStatus: respondResult.new_status,
        proposal: updatedProposal?.[0] || null,
      })
    }

  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'Format JSON invalide', code: 'INVALID_JSON' },
        { status: 400 }
      )
    }

    console.error('[Proposals API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}







