/**
 * API Route: /api/proposals
 * 
 * Gère les propositions de collaboration inter-agents :
 * - POST: Créer une nouvelle proposition
 * - GET: Lister les propositions (reçues/envoyées)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { ProposalType, Json } from '@/lib/supabase/types'

// ============================================================================
// Schémas de validation
// ============================================================================

const CreateProposalSchema = z.object({
  toUserId: z.string().uuid('ID destinataire invalide'),
  type: z.enum(['service_proposal', 'collaboration_request', 'info_share'] as const),
  payload: z.record(z.string(), z.unknown()).optional().default({}),
  message: z.string().max(500, 'Message trop long (500 caractères max)').optional().nullable(),
  dedupeKey: z.string().optional().nullable(),
})

const ListProposalsSchema = z.object({
  direction: z.enum(['received', 'sent', 'both']).optional().default('received'),
})

// ============================================================================
// POST /api/proposals - Créer une proposition
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
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
    const validation = CreateProposalSchema.safeParse(body)
    
    if (!validation.success) {
      const errors = validation.error.issues.map(i => i.message).join(', ')
      return NextResponse.json(
        { success: false, error: errors, code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const { toUserId, type, payload, message, dedupeKey } = validation.data

    // 3. Vérifier que le destinataire existe
    const adminClient = createAdminClient()
    const { data: recipientExists } = await adminClient
      .from('profiles')
      .select('id')
      .eq('id', toUserId)
      .single()

    if (!recipientExists) {
      return NextResponse.json(
        { success: false, error: 'Destinataire non trouvé', code: 'RECIPIENT_NOT_FOUND' },
        { status: 404 }
      )
    }

    // 4. Créer la proposition via RPC (avec validation anti-spam)
    const { data: result, error: rpcError } = await adminClient.rpc('create_proposal', {
      p_from_user_id: user.id,
      p_to_user_id: toUserId,
      p_type: type as ProposalType,
      p_payload: payload as Json,
      p_message: message || null,
      p_dedupe_key: dedupeKey || null,
    })

    if (rpcError) {
      console.error('[Proposals API] RPC error:', rpcError)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la création', code: 'RPC_ERROR' },
        { status: 500 }
      )
    }

    const proposalResult = result?.[0]

    if (!proposalResult?.success) {
      // Mapper les codes d'erreur vers des statuts HTTP appropriés
      const statusMap: Record<string, number> = {
        'SELF_PROPOSAL': 400,
        'COOLDOWN_ACTIVE': 429,
        'RECIPIENT_LIMIT': 429,
        'DUPLICATE': 409,
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: proposalResult?.error_message || 'Erreur inconnue', 
          code: proposalResult?.error_code || 'UNKNOWN_ERROR' 
        },
        { status: statusMap[proposalResult?.error_code || ''] || 400 }
      )
    }

    // 5. Récupérer les détails de la proposition créée
    const { data: proposal } = await adminClient.rpc('get_proposal_by_id', {
      p_proposal_id: proposalResult.proposal_id!,
    })

    return NextResponse.json({
      success: true,
      proposal: proposal?.[0] || { id: proposalResult.proposal_id },
    }, { status: 201 })

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

// ============================================================================
// GET /api/proposals - Lister les propositions
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
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

    // 2. Parser les paramètres de query
    const { searchParams } = new URL(request.url)
    const direction = searchParams.get('direction') || 'received'
    
    const validation = ListProposalsSchema.safeParse({ direction })
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Paramètre direction invalide', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    // 3. Récupérer les propositions via RPC
    const adminClient = createAdminClient()
    const { data: proposals, error: rpcError } = await adminClient.rpc('get_pending_proposals', {
      p_user_id: user.id,
      p_direction: validation.data.direction,
    })

    if (rpcError) {
      console.error('[Proposals API] RPC error:', rpcError)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération', code: 'RPC_ERROR' },
        { status: 500 }
      )
    }

    // 4. Compter les pending pour le badge
    const { data: pendingCount } = await adminClient.rpc('count_pending_proposals', {
      p_to_user_id: user.id,
    })

    return NextResponse.json({
      success: true,
      proposals: proposals || [],
      pendingCount: pendingCount || 0,
    })

  } catch (error) {
    console.error('[Proposals API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

