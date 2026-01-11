/**
 * API Route: /api/user-agent
 * 
 * Gestion de l'agent IA personnalisé par utilisateur :
 * - GET: Récupère l'agent de l'utilisateur (ou valeurs par défaut)
 * - PUT: Crée ou met à jour l'agent de l'utilisateur
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { AgentGender, AgentTone } from '@/lib/supabase/types'

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Valeurs par défaut pour un agent
 */
const DEFAULT_AGENT = {
  name: 'Assistant',
  gender: 'neutre' as AgentGender,
  tone: 'professionnel' as AgentTone,
}

/**
 * Liste des termes interdits dans le nom de l'agent
 * (évite les dépendances émotionnelles/manipulatrices)
 */
const FORBIDDEN_NAME_PATTERNS = [
  'amour',
  'aime',
  'besoin de toi',
  'seul',
  'triste',
  'dépendant',
  'manque',
  'mon cœur',
  'chéri',
  'chérie',
  'mon amour',
  'bébé',
  'baby',
  'darling',
  'sweetheart',
]

// ============================================================================
// SCHEMAS DE VALIDATION
// ============================================================================

const UpdateAgentSchema = z.object({
  name: z.string()
    .min(1, 'Le nom est requis')
    .max(30, 'Le nom ne doit pas dépasser 30 caractères')
    .refine(
      (name) => !FORBIDDEN_NAME_PATTERNS.some(pattern => 
        name.toLowerCase().includes(pattern.toLowerCase())
      ),
      { message: 'Le nom contient des termes non autorisés' }
    ),
  gender: z.enum(['masculin', 'feminin', 'neutre'], {
    message: 'Genre invalide. Valeurs acceptées: masculin, feminin, neutre'
  }),
  tone: z.enum(['professionnel', 'amical', 'formel', 'decontracte'], {
    message: 'Ton invalide. Valeurs acceptées: professionnel, amical, formel, decontracte'
  }),
})

// ============================================================================
// GET /api/user-agent - Récupère l'agent de l'utilisateur
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

    // Appelle la fonction RPC pour récupérer l'agent avec valeurs par défaut
    const { data, error } = await adminClient.rpc('get_user_agent', {
      p_user_id: user.id
    })

    if (error) {
      console.error('[UserAgent] Erreur get_user_agent:', error)
      
      // Fallback: retourner les valeurs par défaut
      return NextResponse.json({
        agent: {
          user_id: user.id,
          ...DEFAULT_AGENT,
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      })
    }

    const agent = data?.[0] || {
      user_id: user.id,
      ...DEFAULT_AGENT,
      is_default: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    return NextResponse.json({ agent })

  } catch (error) {
    console.error('[UserAgent] Erreur inattendue GET:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT /api/user-agent - Crée ou met à jour l'agent
// ============================================================================

export async function PUT(request: NextRequest) {
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
    const validation = UpdateAgentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { name, gender, tone } = validation.data
    const adminClient = createAdminClient()

    // Appelle la fonction RPC pour upsert l'agent
    const { data, error } = await adminClient.rpc('upsert_user_agent', {
      p_user_id: user.id,
      p_name: name,
      p_gender: gender,
      p_tone: tone,
    })

    if (error) {
      console.error('[UserAgent] Erreur upsert_user_agent:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de l\'agent' },
        { status: 500 }
      )
    }

    const result = data?.[0]

    if (!result?.success) {
      return NextResponse.json(
        { error: result?.message || 'Erreur lors de la mise à jour' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Agent mis à jour avec succès',
      agent: {
        user_id: result.user_id,
        name: result.name,
        gender: result.gender,
        tone: result.tone,
        is_default: false,
      },
    })

  } catch (error) {
    console.error('[UserAgent] Erreur inattendue PUT:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}






