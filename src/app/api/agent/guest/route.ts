/**
 * API Route: POST /api/agent/guest
 * 
 * Gère les messages envoyés à l'agent IA par des utilisateurs NON AUTHENTIFIÉS
 * avec streaming SSE pour afficher le raisonnement et le texte progressif.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { runAgentStreamGenerator, type AgentMessage } from '@/lib/agent/runAgent'
import { z } from 'zod'

// Schéma de validation de la requête
const GuestAgentRequestSchema = z.object({
  sessionId: z.string().uuid('Session ID invalide'),
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1, 'Le message ne peut pas être vide').max(10000, 'Message trop long')
})

/**
 * Génère un titre à partir du premier message
 */
function generateTitle(message: string): string {
  const cleaned = message.trim().replace(/\n/g, ' ')
  if (cleaned.length <= 50) {
    return cleaned
  }
  return cleaned.substring(0, 47) + '...'
}

/**
 * Encode un événement SSE
 */
function encodeSSE(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

/**
 * POST /api/agent/guest
 * Envoie un message à l'agent IA (mode anonyme) avec streaming SSE
 */
export async function POST(request: NextRequest): Promise<Response> {
  const encoder = new TextEncoder()

  try {
    // 1. Validation du body
    const body = await request.json()
    const validation = GuestAgentRequestSchema.safeParse(body)
    
    if (!validation.success) {
      const errors = validation.error.issues.map(i => i.message).join(', ')
      return new Response(
        encoder.encode(encodeSSE('error', { message: errors, code: 'VALIDATION_ERROR' })),
        {
          status: 400,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
        }
      )
    }

    const { sessionId, conversationId, message } = validation.data
    let currentConversationId = conversationId
    let isNewConversation = false

    // 2. Utiliser le client admin (bypass RLS pour les sessions anonymes)
    const supabase = createAdminClient()

    // 3. Création ou vérification de la conversation
    if (!currentConversationId) {
      const title = generateTitle(message)
      
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          session_id: sessionId,
          user_id: null,
          title
        })
        .select('id')
        .single()
      
      if (convError || !newConversation) {
        console.error('[Guest Agent API] Conversation creation error:', convError)
        return new Response(
          encoder.encode(encodeSSE('error', { message: 'Erreur lors de la création de la conversation', code: 'DB_ERROR' })),
          {
            status: 500,
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            }
          }
        )
      }
      
      currentConversationId = newConversation.id
      isNewConversation = true
    } else {
      // Vérifier que la conversation appartient à cette session
      const { data: existingConv, error: checkError } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', currentConversationId)
        .eq('session_id', sessionId)
        .single()
      
      if (checkError || !existingConv) {
        return new Response(
          encoder.encode(encodeSSE('error', { message: 'Conversation non trouvée', code: 'NOT_FOUND' })),
          {
            status: 404,
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            }
          }
        )
      }
    }

    // 4. Insertion du message utilisateur
    const { error: userMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: currentConversationId,
        role: 'user',
        content: message
      })
    
    if (userMsgError) {
      console.error('[Guest Agent API] User message insert error:', userMsgError)
      return new Response(
        encoder.encode(encodeSSE('error', { message: 'Erreur lors de l\'enregistrement du message', code: 'DB_ERROR' })),
        {
          status: 500,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
        }
      )
    }

    // 5. Récupération de l'historique pour le contexte
    const { data: historyMessages } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', currentConversationId)
      .order('created_at', { ascending: true })
      .limit(20)
    
    const history: AgentMessage[] = (historyMessages ?? []).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))

    // 6. Créer le stream SSE
    const conversationIdForStream = currentConversationId

    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = ''
        
        try {
          // Envoyer l'ID de conversation au début (pour les nouvelles conversations)
          if (isNewConversation) {
            controller.enqueue(encoder.encode(
              encodeSSE('conversation', { id: conversationIdForStream })
            ))
          }

          // Stream les événements de l'agent
          const generator = runAgentStreamGenerator(message, history)
          
          for await (const event of generator) {
            if (event.type === 'chunk') {
              fullResponse += event.data
            }
            
            controller.enqueue(encoder.encode(
              encodeSSE(event.type, event.data)
            ))
          }

          // Sauvegarder la réponse complète en DB
          const { data: assistantMessage, error: assistantMsgError } = await supabase
            .from('messages')
            .insert({
              conversation_id: conversationIdForStream,
              role: 'assistant',
              content: fullResponse
            })
            .select('id, created_at')
            .single()

          if (assistantMsgError) {
            console.error('[Guest Agent API] Assistant message insert error:', assistantMsgError)
          } else if (assistantMessage) {
            // Envoyer les métadonnées du message sauvegardé
            controller.enqueue(encoder.encode(
              encodeSSE('saved', { 
                messageId: assistantMessage.id,
                conversationId: conversationIdForStream,
                createdAt: assistantMessage.created_at
              })
            ))
          }

        } catch (error) {
          console.error('[Guest Agent API] Stream error:', error)
          controller.enqueue(encoder.encode(
            encodeSSE('error', { message: 'Erreur pendant le streaming', code: 'STREAM_ERROR' })
          ))
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      }
    })

  } catch (error) {
    // Erreur JSON parse
    if (error instanceof SyntaxError) {
      return new Response(
        encoder.encode(encodeSSE('error', { message: 'Format de requête invalide', code: 'INVALID_JSON' })),
        {
          status: 400,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
        }
      )
    }

    console.error('[Guest Agent API] Unexpected error:', error)
    return new Response(
      encoder.encode(encodeSSE('error', { message: 'Une erreur inattendue s\'est produite', code: 'INTERNAL_ERROR' })),
      {
        status: 500,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      }
    )
  }
}

/**
 * GET /api/agent/guest - Récupérer les conversations d'une session
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'sessionId requis', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    // Valider le format UUID
    const uuidSchema = z.string().uuid()
    const uuidValidation = uuidSchema.safeParse(sessionId)
    
    if (!uuidValidation.success) {
      return NextResponse.json(
        { success: false, error: 'sessionId invalide', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Récupérer les conversations de cette session
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('session_id', sessionId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[Guest Agent API] Get conversations error:', error)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération des conversations', code: 'DB_ERROR' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      conversations: conversations || []
    })

  } catch (error) {
    console.error('[Guest Agent API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur inattendue s\'est produite', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
