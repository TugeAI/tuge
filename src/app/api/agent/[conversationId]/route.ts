import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

/**
 * DELETE /api/agent/[conversationId] - Supprimer une conversation
 * 
 * Supprime une conversation et tous ses messages associés.
 * Pour les utilisateurs authentifiés : vérifie la propriété via RLS
 * Pour les sessions anonymes : vérifie le session_id
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params

    // Valider le format UUID
    const uuidSchema = z.string().uuid()
    const validation = uuidSchema.safeParse(conversationId)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'ID de conversation invalide', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Utilisateur authentifié : utiliser le client avec RLS
      // La politique RLS "Users can delete own conversations" vérifie automatiquement la propriété
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', user.id)

      if (error) {
        console.error('[Agent API] Delete conversation error:', error)
        return NextResponse.json(
          { success: false, error: 'Erreur lors de la suppression', code: 'DB_ERROR' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Conversation supprimée'
      })
    } else {
      // Session anonyme : vérifier le session_id
      const sessionId = request.headers.get('x-session-id')

      if (!sessionId) {
        return NextResponse.json(
          { success: false, error: 'Session ID requis', code: 'AUTH_ERROR' },
          { status: 401 }
        )
      }

      // Valider le format UUID du sessionId
      const sessionValidation = uuidSchema.safeParse(sessionId)
      if (!sessionValidation.success) {
        return NextResponse.json(
          { success: false, error: 'Session ID invalide', code: 'VALIDATION_ERROR' },
          { status: 400 }
        )
      }

      const adminClient = createAdminClient()

      // Vérifier que la conversation appartient bien à cette session
      const { data: conversation, error: fetchError } = await adminClient
        .from('conversations')
        .select('id, session_id')
        .eq('id', conversationId)
        .eq('session_id', sessionId)
        .single()

      if (fetchError || !conversation) {
        return NextResponse.json(
          { success: false, error: 'Conversation non trouvée', code: 'NOT_FOUND' },
          { status: 404 }
        )
      }

      // Supprimer la conversation (les messages seront supprimés en cascade)
      const { error: deleteError } = await adminClient
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('session_id', sessionId)

      if (deleteError) {
        console.error('[Agent API] Delete anonymous conversation error:', deleteError)
        return NextResponse.json(
          { success: false, error: 'Erreur lors de la suppression', code: 'DB_ERROR' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Conversation supprimée'
      })
    }
  } catch (error) {
    console.error('[Agent API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur inattendue s\'est produite', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}


