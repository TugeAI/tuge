/**
 * API Route: POST /api/agent
 * 
 * Gère les messages envoyés à l'agent IA avec streaming SSE :
 * 1. Vérifie l'authentification de l'utilisateur
 * 2. Vérifie et consomme 1 crédit
 * 3. Crée une nouvelle conversation si nécessaire
 * 4. Enregistre le message utilisateur en DB
 * 5. Stream la réponse avec étapes de raisonnement
 * 6. Enregistre la réponse finale en DB
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { 
  runAgentStreamGenerator, 
  type AgentConfig,
  type AgentProfile,
  DEFAULT_AGENT_PROFILE 
} from '@/lib/agent/runAgent'
import { 
  type DBMessage,
  type ToolCallResult,
  buildConversationContext,
  hasToolCalls,
  toSimpleMessages,
} from '@/lib/agent/context'
import { consumeCredit } from '@/lib/credits/consumeCredit'
import { z } from 'zod'
import type { AgentGender, AgentTone, ToolCallData } from '@/lib/supabase/types'

// Import du middleware de dialogue pour les listings
import {
  processDialogueMessage,
  serializeDialogueState,
  type DialogueResult,
} from '@/lib/agent/listings'

// Schéma de validation de la requête
const AgentRequestSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1, 'Le message ne peut pas être vide').max(10000, 'Message trop long'),
  userLocation: z.string().max(100).optional(),
  /** Activer l'orchestration multi-agents (Marketing, Vision, etc.) */
  enableOrchestration: z.boolean().optional().default(true),
  /** URL ou base64 d'une image à analyser (pour Vision) */
  imageData: z.string().optional(),
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
 * POST /api/agent
 * Envoie un message à l'agent IA et stream la réponse
 */
export async function POST(request: NextRequest): Promise<Response> {
  const encoder = new TextEncoder()
  
  try {
    // 1. Vérification de l'authentification
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return new Response(
        encoder.encode(encodeSSE('error', { message: 'Non authentifié', code: 'UNAUTHORIZED' })),
        {
          status: 401,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
        }
      )
    }

    // 2. Validation du body (avant la consommation de crédits)
    const body = await request.json()
    const validation = AgentRequestSchema.safeParse(body)
    
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

    const { conversationId, message, userLocation, enableOrchestration, imageData } = validation.data
    let currentConversationId = conversationId
    let isNewConversation = false

    // En mode développement local, crédits illimités
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    // 3. Consommation d'un crédit (avant toute action coûteuse)
    // Bypass en mode développement
    let creditInfo: {
      creditTypeUsed: string
      remainingCredits: { free: number; paid: number; total: number }
    } = {
      creditTypeUsed: 'free',
      remainingCredits: { free: 999, paid: 0, total: 999 },
    }
    
    if (!isDevelopment) {
      const creditResult = await consumeCredit({
        userId: user.id,
        amount: 1,
        actionType: 'chat',
        conversationId: conversationId || null,
        metadata: { message_preview: message.substring(0, 100) },
      })

      if (!creditResult.success) {
        return new Response(
          encoder.encode(encodeSSE('error', { 
            message: creditResult.error || 'Crédits insuffisants', 
            code: 'NO_CREDITS',
            wallet: creditResult.remainingCredits,
          })),
          {
            status: 402, // Payment Required
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            }
          }
        )
      }

      creditInfo = {
        creditTypeUsed: creditResult.creditTypeUsed || 'free',
        remainingCredits: creditResult.remainingCredits || { free: 0, paid: 0, total: 0 },
      }
    }

    // 4. Charger le profil agent personnalisé de l'utilisateur
    let agentProfile: AgentProfile = DEFAULT_AGENT_PROFILE
    try {
      const adminClient = createAdminClient()
      const { data: agentData } = await adminClient.rpc('get_user_agent', {
        p_user_id: user.id
      })
      
      if (agentData?.[0]) {
        agentProfile = {
          name: agentData[0].name,
          gender: agentData[0].gender as AgentGender,
          tone: agentData[0].tone as AgentTone,
        }
      }
    } catch (agentError) {
      console.warn('[Agent API] Could not load user agent profile, using defaults:', agentError)
    }

    // 5. Création de la conversation si nécessaire
    if (!currentConversationId) {
      const title = generateTitle(message)
      
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title
        })
        .select('id')
        .single()
      
      if (convError || !newConversation) {
        console.error('[Agent API] Conversation creation error:', convError)
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
      // Vérifier que la conversation appartient à l'utilisateur
      const { data: existingConv, error: checkError } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', currentConversationId)
        .eq('user_id', user.id)
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

    // 6. Insertion du message utilisateur
    const { error: userMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: currentConversationId,
        role: 'user',
        content: message
      })
    
    if (userMsgError) {
      console.error('[Agent API] User message insert error:', userMsgError)
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

    // 7. Récupération de l'historique pour le contexte (avec tool_calls)
    const { data: historyMessages } = await supabase
      .from('messages')
      .select('id, conversation_id, role, content, tool_calls, tool_call_id, tool_name, created_at')
      .eq('conversation_id', currentConversationId)
      .order('created_at', { ascending: true })
      .limit(30) // Augmenté pour tenir compte des messages tool
    
    // Convertir en format DBMessage pour le context builder
    const dbHistory: DBMessage[] = (historyMessages ?? []).map(m => ({
      id: m.id,
      conversation_id: m.conversation_id,
      role: m.role as 'user' | 'assistant' | 'tool',
      content: m.content,
      tool_calls: m.tool_calls as ToolCallData[] | null,
      tool_call_id: m.tool_call_id,
      tool_name: m.tool_name,
      created_at: m.created_at
    }))
    
    // Pour la rétrocompatibilité avec runAgentStreamGenerator,
    // on convertit en format simple si pas de tool calls
    const simpleHistory = toSimpleMessages(dbHistory)

    // 7.5. Récupérer l'état de dialogue de la conversation
    // Note: dialogue_state est ajouté par la migration 020_dialogue_state.sql
    // Les types Supabase doivent être régénérés après la migration
    const { data: conversationData } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', currentConversationId)
      .single()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dialogueStateJson = (conversationData as any)?.dialogue_state as string | null

    // 8. Créer le stream SSE avec contexte des outils
    const conversationIdForStream = currentConversationId
    
    // Préparer le message avec les données d'image si présentes
    let finalMessage = message
    if (imageData) {
      // Injecter l'image dans le message pour le routage Vision
      finalMessage = `${message}\n[image:${imageData.substring(0, 100)}...]`
    }
    
    // Configuration de l'agent avec contexte d'authentification pour les outils
    // et profil de personnalité personnalisé
    // + orchestration multi-agents si activée
    const toolContext = {
      userId: user.id,
      conversationId: conversationIdForStream,
      isAuthenticated: true,
    }
    
    const agentConfig: AgentConfig = {
      rag: { enabled: true },
      tools: {
        enabled: true,
        context: toolContext,
      },
      personality: {
        enabled: true,
        profile: agentProfile,
      },
      userLocation,
      // Orchestration multi-agents (Marketing, Vision, etc.)
      orchestration: {
        enabled: enableOrchestration ?? false,
        enableLogging: true,
        debug: process.env.NODE_ENV === 'development',
      },
    }

    // 8.5. Traitement via le middleware de dialogue (listings)
    // Ce middleware gère les intentions liées aux annonces de manière fiable
    let dialogueResult: DialogueResult | null = null
    try {
      dialogueResult = await processDialogueMessage(
        message,
        dialogueStateJson,
        {
          userId: user.id,
          conversationId: conversationIdForStream,
          toolContext,
          config: {
            debug: process.env.NODE_ENV === 'development',
            autoRefreshAfterAction: true,
          },
        }
      )
    } catch (dialogueError) {
      console.warn('[Agent API] Dialogue middleware error, continuing with LLM:', dialogueError)
    }
    
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = ''
        
        try {
          // Envoyer les infos de crédit consommé
          controller.enqueue(encoder.encode(
            encodeSSE('credit', creditInfo)
          ))
          
          // Envoyer l'ID de conversation au début (pour les nouvelles conversations)
          if (isNewConversation) {
            controller.enqueue(encoder.encode(
              encodeSSE('conversation', { id: conversationIdForStream })
            ))
          }

          // =================================================================
          // CAS 1: Le middleware de dialogue a géré le message directement
          // =================================================================
          if (dialogueResult?.handled && dialogueResult.directResponse) {
            // Le middleware a produit une réponse directe (ex: demande de confirmation)
            fullResponse = dialogueResult.directResponse
            
            // Streamer la réponse caractère par caractère pour l'effet de typing
            const words = fullResponse.split(' ')
            for (const word of words) {
              controller.enqueue(encoder.encode(
                encodeSSE('chunk', word + ' ')
              ))
              await new Promise(resolve => setTimeout(resolve, 15))
            }
            
            // Sauvegarder le nouvel état de dialogue
            // Note: dialogue_state est ajouté par la migration 020_dialogue_state.sql
            if (dialogueResult.newState) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (supabase.from('conversations') as any)
                .update({ dialogue_state: serializeDialogueState(dialogueResult.newState) })
                .eq('id', conversationIdForStream)
            }
            
            // Sauvegarder la réponse en DB
            const { data: assistantMessage, error: assistantMsgError } = await supabase
              .from('messages')
              .insert({
                conversation_id: conversationIdForStream,
                role: 'assistant',
                content: fullResponse,
              })
              .select('id, created_at')
              .single()
            
            if (!assistantMsgError && assistantMessage) {
              controller.enqueue(encoder.encode(
                encodeSSE('saved', { 
                  messageId: assistantMessage.id,
                  conversationId: conversationIdForStream,
                  createdAt: assistantMessage.created_at
                })
              ))
            }
            
            controller.enqueue(encoder.encode(encodeSSE('done', '')))
            controller.close()
            return
          }

          // =================================================================
          // CAS 2: Le middleware a enrichi le contexte mais n'a pas géré
          // Le LLM doit produire la réponse avec le contexte enrichi
          // =================================================================
          
          // Enrichir le message si le middleware a produit du contexte
          let enrichedMessage = finalMessage
          if (dialogueResult?.enrichedContext) {
            // Ajouter le contexte enrichi au message pour le LLM
            enrichedMessage = `${finalMessage}\n\n---\n## Contexte du système (données récupérées):\n${dialogueResult.enrichedContext}`
          }
          
          // Si une action a été exécutée par le middleware, informer le LLM
          if (dialogueResult?.executedAction) {
            const actionInfo = dialogueResult.executedAction
            enrichedMessage += `\n\n---\n## Action exécutée:\n- Type: ${actionInfo.type}\n- Succès: ${actionInfo.success ? 'OUI' : 'NON'}\n- Résultat: ${JSON.stringify(actionInfo.result)}`
          }

          // Stream les événements de l'agent avec le contexte des outils
          // Passer le contexte complet avec tool calls si disponibles
          // FIX: Ne pas passer dbHistory avec tool calls car le format n'est pas compatible
          // avec Vercel AI SDK v6. Le SDK gère les tool calls automatiquement pendant la session.
          const generator = runAgentStreamGenerator(
            enrichedMessage, 
            simpleHistory, 
            agentConfig,
            undefined // Toujours undefined pour éviter l'erreur de format tool messages
          )
          
          // Collecter les tool calls pour les sauvegarder
          const collectedToolCalls: ToolCallResult[] = []
          
          for await (const event of generator) {
            if (event.type === 'chunk') {
              fullResponse += event.data
            }
            
            // Collecter les tool calls pour la sauvegarde
            if (event.type === 'tool_call') {
              const toolData = event.data as unknown as ToolCallResult
              collectedToolCalls.push(toolData)
            }
            
            controller.enqueue(encoder.encode(
              encodeSSE(event.type, event.data)
            ))
          }

          // Convertir les tool calls collectés au format OpenAI pour stockage
          const toolCallsForStorage: ToolCallData[] | null = collectedToolCalls.length > 0
            ? collectedToolCalls.map((tc, index) => ({
                id: `call_${Date.now()}_${index}`,
                type: 'function' as const,
                function: {
                  name: tc.name,
                  arguments: JSON.stringify(tc.args)
                }
              }))
            : null

          // Sauvegarder la réponse complète en DB avec les tool_calls
          const { data: assistantMessage, error: assistantMsgError } = await supabase
            .from('messages')
            .insert({
              conversation_id: conversationIdForStream,
              role: 'assistant',
              content: fullResponse,
              tool_calls: toolCallsForStorage
            })
            .select('id, created_at')
            .single()
          
          // Sauvegarder les résultats des tool calls comme messages 'tool'
          if (collectedToolCalls.length > 0 && toolCallsForStorage) {
            const toolMessages = collectedToolCalls.map((tc, index) => ({
              conversation_id: conversationIdForStream,
              role: 'tool' as const,
              content: JSON.stringify(tc.result),
              tool_call_id: toolCallsForStorage[index].id,
              tool_name: tc.name
            }))
            
            const { error: toolMsgError } = await supabase
              .from('messages')
              .insert(toolMessages)
            
            if (toolMsgError) {
              console.error('[Agent API] Tool messages insert error:', toolMsgError)
            }
          }

          if (assistantMsgError) {
            console.error('[Agent API] Assistant message insert error:', assistantMsgError)
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

          // Sauvegarder le nouvel état de dialogue (réinitialiser à idle après traitement LLM)
          // Note: dialogue_state est ajouté par la migration 020_dialogue_state.sql
          if (dialogueResult?.newState) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase.from('conversations') as any)
              .update({ dialogue_state: serializeDialogueState(dialogueResult.newState) })
              .eq('id', conversationIdForStream)
          }

        } catch (error) {
          console.error('[Agent API] Stream error:', error)
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
        'X-Accel-Buffering': 'no', // Désactive le buffering nginx
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

    console.error('[Agent API] Unexpected error:', error)
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
 * GET /api/agent - Non autorisé
 */
export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Méthode non autorisée', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  )
}
