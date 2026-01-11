/**
 * API Route: /api/agent/onboarding
 * 
 * Gère le flow conversationnel d'onboarding avec l'agent compagnon :
 * - GET : Récupère l'état du profil visiteur
 * - POST : Envoie un message à l'agent compagnon avec streaming SSE
 * - PUT : Met à jour le profil visiteur (prénom, intention, étape)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { 
  runAgentStreamGenerator, 
  buildCompanionPrompt,
  type AgentMessage,
  type VisitorContext,
} from '@/lib/agent/runAgent'
import { z } from 'zod'

// ============================================================================
// Schémas de validation
// ============================================================================

const GetQuerySchema = z.object({
  sessionId: z.string().uuid('Session ID invalide'),
})

const PostBodySchema = z.object({
  sessionId: z.string().uuid('Session ID invalide'),
  conversationId: z.string().uuid().optional().nullable(),
  message: z.string().min(1, 'Le message ne peut pas être vide').max(10000, 'Message trop long'),
})

// Signal spécial pour générer le message d'accueil initial
const INIT_MESSAGE_SIGNAL = '__INIT__'

const PutBodySchema = z.object({
  sessionId: z.string().uuid('Session ID invalide'),
  firstName: z.string().min(1).max(100).optional(),
  intention: z.enum([
    'acheter', 'vendre', 'proposer_service', 'creer_revenus', 'developper_reseau',
    'curiosite', 'reflexion', 'apprentissage', 'comparaison', 'inspiration', 'unknown'
  ]).optional(),
  currentStep: z.enum([
    'accroche', 'intention_detectee', 'reaction_adaptee', 'prenom_demande',
    'nurturing', 'email_propose', 'ancrage', 'complete'
  ]).optional(),
})

// ============================================================================
// Types
// ============================================================================

interface VisitorProfile {
  id: string
  session_id: string
  first_name: string | null
  intention: string
  current_step: string
  is_intention_active: boolean
  nurturing_content_ids: string[]
  message_count: number
  created_at: string
}

// ============================================================================
// Helpers
// ============================================================================

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
 * Interface pour les suggestions (boutons)
 */
interface Suggestion {
  label: string
  value: string
}

/**
 * Parse le contenu de l'IA pour extraire :
 * - Suggestions: [[SUGGESTIONS]][...][[/SUGGESTIONS]]
 * - Demande d'auth: [[AUTH_REQUEST]]true[[/AUTH_REQUEST]]
 */
function parseAIContent(content: string): { 
  text: string
  suggestions: Suggestion[]
  authRequested: boolean
} {
  const suggestionsRegex = /\[\[SUGGESTIONS\]\]([\s\S]*?)\[\[\/SUGGESTIONS\]\]/
  const authRegex = /\[\[AUTH_REQUEST\]\]([\s\S]*?)\[\[\/AUTH_REQUEST\]\]/
  
  let text = content
  let suggestions: Suggestion[] = []
  let authRequested = false
  
  // Parser les suggestions
  const suggestionsMatch = content.match(suggestionsRegex)
  if (suggestionsMatch) {
    text = text.replace(suggestionsRegex, '').trim()
    try {
      suggestions = JSON.parse(suggestionsMatch[1]) as Suggestion[]
    } catch {
      console.error('[Onboarding API] Failed to parse suggestions:', suggestionsMatch[1])
    }
  }
  
  // Parser la demande d'authentification
  const authMatch = content.match(authRegex)
  if (authMatch) {
    text = text.replace(authRegex, '').trim()
    authRequested = authMatch[1].trim().toLowerCase() === 'true'
  }
  
  return { text, suggestions, authRequested }
}

/**
 * Convertit un profil DB en contexte visiteur
 */
function toVisitorContext(profile: VisitorProfile): VisitorContext {
  return {
    sessionId: profile.session_id,
    firstName: profile.first_name,
    intention: profile.intention,
    currentStep: profile.current_step,
    messageCount: profile.message_count,
    isIntentionActive: profile.is_intention_active,
  }
}

// ============================================================================
// GET /api/agent/onboarding
// Récupère l'état du profil visiteur
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    // Validation
    const validation = GetQuerySchema.safeParse({ sessionId })
    if (!validation.success) {
      const errors = validation.error.issues.map(i => i.message).join(', ')
      return NextResponse.json(
        { success: false, error: errors, code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Essayer de récupérer ou créer le profil visiteur via la fonction SQL
    let profile: VisitorProfile | undefined
    
    try {
      const { data: profiles, error } = await (supabase as any).rpc('get_or_create_visitor_profile', {
        p_session_id: validation.data.sessionId
      })

      if (!error && profiles?.[0]) {
        profile = profiles[0] as VisitorProfile
      }
    } catch (rpcError) {
      // La fonction SQL n'existe peut-être pas encore (migration non exécutée)
      console.warn('[Onboarding API] RPC not available, using default profile:', rpcError)
    }

    // Si pas de profil SQL, retourner un profil par défaut
    if (!profile) {
      return NextResponse.json({
        success: true,
        profile: {
          sessionId: validation.data.sessionId,
          firstName: null,
          intention: 'unknown',
          currentStep: 'accroche',
          isIntentionActive: false,
          messageCount: 0,
          createdAt: new Date().toISOString(),
        }
      })
    }

    return NextResponse.json({
      success: true,
      profile: {
        sessionId: profile.session_id,
        firstName: profile.first_name,
        intention: profile.intention,
        currentStep: profile.current_step,
        isIntentionActive: profile.is_intention_active,
        messageCount: profile.message_count,
        createdAt: profile.created_at,
      }
    })

  } catch (error) {
    console.error('[Onboarding API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur inattendue s\'est produite', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/agent/onboarding
// Envoie un message à l'agent compagnon avec streaming SSE
// ============================================================================

export async function POST(request: NextRequest): Promise<Response> {
  const encoder = new TextEncoder()

  try {
    // 1. Validation du body
    const body = await request.json()
    const validation = PostBodySchema.safeParse(body)
    
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
    
    // Détecter si c'est une demande de message d'accueil initial
    const isInitMessage = message === INIT_MESSAGE_SIGNAL

    // 2. Récupérer le profil visiteur
    const supabase = createAdminClient()
    
    let profile: VisitorProfile | undefined
    
    try {
      const { data: profiles, error: profileError } = await (supabase as any).rpc('get_or_create_visitor_profile', {
        p_session_id: sessionId
      })

      if (!profileError && profiles?.[0]) {
        profile = profiles[0] as VisitorProfile
      }
    } catch (rpcError) {
      // La fonction SQL n'existe peut-être pas encore
      console.warn('[Onboarding API] RPC not available:', rpcError)
    }

    // Si pas de profil SQL, créer un profil par défaut en mémoire
    if (!profile) {
      profile = {
        id: sessionId,
        session_id: sessionId,
        first_name: null,
        intention: 'unknown',
        current_step: 'accroche',
        is_intention_active: false,
        nurturing_content_ids: [],
        message_count: 0,
        created_at: new Date().toISOString(),
      }
    }

    // 3. Créer ou vérifier la conversation
    if (!currentConversationId) {
      // Pour le message d'init, on crée une conversation avec un titre générique
      const title = isInitMessage ? 'Nouvelle conversation' : generateTitle(message)
      
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
        console.error('[Onboarding API] Conversation creation error:', convError)
        return new Response(
          encoder.encode(encodeSSE('error', { message: 'Erreur création conversation', code: 'DB_ERROR' })),
          { status: 500, headers: { 'Content-Type': 'text/event-stream' } }
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
          { status: 404, headers: { 'Content-Type': 'text/event-stream' } }
        )
      }
    }

    // 4. Insérer le message utilisateur (sauf si c'est un message d'init)
    if (!isInitMessage) {
      const { error: userMsgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: currentConversationId,
          role: 'user',
          content: message
        })
      
      if (userMsgError) {
        console.error('[Onboarding API] User message insert error:', userMsgError)
        return new Response(
          encoder.encode(encodeSSE('error', { message: 'Erreur enregistrement message', code: 'DB_ERROR' })),
          { status: 500, headers: { 'Content-Type': 'text/event-stream' } }
        )
      }

      // 5. Incrémenter le compteur de messages (si la fonction existe)
      try {
        await (supabase as any).rpc('update_visitor_profile', {
          p_session_id: sessionId,
          p_increment_messages: true
        })
      } catch {
        // Fonction SQL non disponible, on continue
      }
    }

    // 6. Récupérer l'historique (vide pour le message d'init)
    let history: AgentMessage[] = []
    
    if (!isInitMessage) {
      const { data: historyMessages } = await supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', currentConversationId)
        .order('created_at', { ascending: true })
        .limit(20)
      
      history = (historyMessages ?? []).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
    }

    // 7. Construire le prompt compagnon avec le contexte visiteur
    // Pour l'init, s'assurer que messageCount est à 0
    const visitorContext = toVisitorContext(profile)
    if (isInitMessage) {
      visitorContext.messageCount = 0
    }
    const companionPrompt = buildCompanionPrompt(visitorContext)
    
    // Message à envoyer à l'IA
    // Pour l'init : demande spéciale de générer l'accueil
    // Sinon : message utilisateur normal
    const messageForAI = isInitMessage
      ? "Génère ton message d'accueil pour ce nouveau visiteur. Présente-toi en tant que Kévin de manière unique et personnelle."
      : message

    // 8. Créer le stream SSE
    const conversationIdForStream = currentConversationId

    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = ''
        
        try {
          // Envoyer l'ID de conversation au début
          if (isNewConversation) {
            controller.enqueue(encoder.encode(
              encodeSSE('conversation', { id: conversationIdForStream })
            ))
          }

          // Envoyer le profil visiteur actuel
          controller.enqueue(encoder.encode(
            encodeSSE('visitor', {
              firstName: profile.first_name,
              intention: profile.intention,
              currentStep: profile.current_step,
              messageCount: profile.message_count + 1,
            })
          ))

          // Stream les événements de l'agent avec le prompt compagnon
          const generator = runAgentStreamGenerator(messageForAI, history, {
            customSystemPrompt: companionPrompt, // Utiliser le prompt compagnon
            rag: { enabled: !isInitMessage }, // RAG désactivé pour l'init (pas de contexte nécessaire)
            tools: { enabled: false }, // Pas d'outils pour l'onboarding
            personality: { enabled: false }, // Personnalité intégrée au prompt compagnon
          })

          // Streamer les événements
          for await (const event of generator) {
            if (event.type === 'chunk') {
              fullResponse += event.data
            }
            
            controller.enqueue(encoder.encode(
              encodeSSE(event.type, event.data)
            ))
          }

          // Parser le contenu final (suggestions + demande d'auth)
          const { text: cleanedContent, suggestions, authRequested } = parseAIContent(fullResponse)

          // Envoyer les suggestions si présentes
          if (suggestions.length > 0) {
            controller.enqueue(encoder.encode(
              encodeSSE('suggestions', suggestions)
            ))
          }
          
          // Envoyer la demande d'authentification si nécessaire
          if (authRequested) {
            controller.enqueue(encoder.encode(
              encodeSSE('auth_requested', { show: true })
            ))
          }

          // Sauvegarder la réponse nettoyée (sans les balises)
          const { data: assistantMessage, error: assistantMsgError } = await supabase
            .from('messages')
            .insert({
              conversation_id: conversationIdForStream,
              role: 'assistant',
              content: cleanedContent
            })
            .select('id, created_at')
            .single()

          if (assistantMsgError) {
            console.error('[Onboarding API] Assistant message insert error:', assistantMsgError)
          } else if (assistantMessage) {
            controller.enqueue(encoder.encode(
              encodeSSE('saved', { 
                messageId: assistantMessage.id,
                conversationId: conversationIdForStream,
                createdAt: assistantMessage.created_at
              })
            ))
          }

          // Analyser la réponse pour détecter les mises à jour de profil
          // (sauf pour le message d'init où il n'y a pas de message utilisateur à analyser)
          if (!isInitMessage) {
            await analyzeAndUpdateProfile(supabase, sessionId, message, cleanedContent, profile)
          }

        } catch (error) {
          console.error('[Onboarding API] Stream error:', error)
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
        { status: 400, headers: { 'Content-Type': 'text/event-stream' } }
      )
    }

    console.error('[Onboarding API] Unexpected error:', error)
    return new Response(
      encoder.encode(encodeSSE('error', { message: 'Une erreur inattendue s\'est produite', code: 'INTERNAL_ERROR' })),
      { status: 500, headers: { 'Content-Type': 'text/event-stream' } }
    )
  }
}

// ============================================================================
// PUT /api/agent/onboarding
// Met à jour le profil visiteur
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = PutBodySchema.safeParse(body)
    
    if (!validation.success) {
      const errors = validation.error.issues.map(i => i.message).join(', ')
      return NextResponse.json(
        { success: false, error: errors, code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const { sessionId, firstName, intention, currentStep } = validation.data

    const supabase = createAdminClient()

    // Essayer de mettre à jour le profil via la fonction SQL
    let profile: Record<string, unknown> | undefined
    
    try {
      const { data: profiles, error } = await (supabase as any).rpc('update_visitor_profile', {
        p_session_id: sessionId,
        p_first_name: firstName || null,
        p_intention: intention || null,
        p_current_step: currentStep || null,
        p_increment_messages: false
      })

      if (!error && profiles?.[0]) {
        profile = profiles[0]
      }
    } catch (rpcError) {
      // Fonction SQL non disponible
      console.warn('[Onboarding API] Update RPC not available:', rpcError)
    }

    // Retourner le profil mis à jour ou un profil par défaut avec les nouvelles valeurs
    return NextResponse.json({
      success: true,
      profile: profile ? {
        sessionId: profile.session_id,
        firstName: profile.first_name,
        intention: profile.intention,
        currentStep: profile.current_step,
        isIntentionActive: profile.is_intention_active,
        messageCount: profile.message_count,
      } : {
        sessionId,
        firstName: firstName || null,
        intention: intention || 'unknown',
        currentStep: currentStep || 'accroche',
        isIntentionActive: ['acheter', 'vendre', 'proposer_service', 'creer_revenus', 'developper_reseau'].includes(intention || ''),
        messageCount: 0,
      }
    })

  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'Format de requête invalide', code: 'INVALID_JSON' },
        { status: 400 }
      )
    }

    console.error('[Onboarding API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur inattendue s\'est produite', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

// ============================================================================
// Analyse et mise à jour automatique du profil
// ============================================================================

/**
 * Analyse les messages pour détecter automatiquement :
 * - Le prénom (si l'utilisateur le donne)
 * - L'intention (basée sur les mots-clés)
 * - L'étape actuelle du flow
 */
async function analyzeAndUpdateProfile(
  supabase: ReturnType<typeof createAdminClient>,
  sessionId: string,
  userMessage: string,
  agentResponse: string,
  currentProfile: VisitorProfile
) {
  const updates: {
    firstName?: string
    intention?: string
    currentStep?: string
  } = {}

  const lowerMessage = userMessage.toLowerCase()
  const lowerResponse = agentResponse.toLowerCase()

  // Détecter le prénom si pas encore connu
  if (!currentProfile.first_name) {
    // Patterns pour détecter un prénom
    const prenomPatterns = [
      /(?:je m'appelle|moi c'est|appelle[- ]moi|mon prénom c'est|c'est)\s+([A-ZÀ-Ÿ][a-zà-ÿ]+)/i,
      /^([A-ZÀ-Ÿ][a-zà-ÿ]+)$/i, // Juste un prénom seul
    ]
    
    for (const pattern of prenomPatterns) {
      const match = userMessage.match(pattern)
      if (match && match[1]) {
        const potentialName = match[1].trim()
        // Vérifier que ce n'est pas un mot commun
        const commonWords = ['oui', 'non', 'merci', 'bonjour', 'salut', 'hello', 'ok', 'bien']
        if (!commonWords.includes(potentialName.toLowerCase()) && potentialName.length >= 2) {
          updates.firstName = potentialName
          break
        }
      }
    }
  }

  // Détecter l'intention si pas encore connue
  if (currentProfile.intention === 'unknown') {
    // Intentions actives
    if (lowerMessage.match(/\b(acheter|achat|commander|trouver|cherche|besoin)\b/)) {
      updates.intention = 'acheter'
    } else if (lowerMessage.match(/\b(vendre|vente|proposer|offrir|mettre en vente)\b/)) {
      updates.intention = 'vendre'
    } else if (lowerMessage.match(/\b(service|prestation|freelance|mission)\b/)) {
      updates.intention = 'proposer_service'
    } else if (lowerMessage.match(/\b(gagner|revenus?|argent|monétiser|business)\b/)) {
      updates.intention = 'creer_revenus'
    } else if (lowerMessage.match(/\b(réseau|parrain|filleul|développer|mlm)\b/)) {
      updates.intention = 'developper_reseau'
    }
    // Intentions latentes
    else if (lowerMessage.match(/\b(curieux|découvrir|voir|explorer|jeter un œil)\b/)) {
      updates.intention = 'curiosite'
    } else if (lowerMessage.match(/\b(réfléchir|hésit|savoir|penser|envisager)\b/)) {
      updates.intention = 'reflexion'
    } else if (lowerMessage.match(/\b(comprendre|apprendre|comment ça|fonctionne|explique)\b/)) {
      updates.intention = 'apprentissage'
    } else if (lowerMessage.match(/\b(comparer|différence|mieux|plutôt|ou bien)\b/)) {
      updates.intention = 'comparaison'
    } else if (lowerMessage.match(/\b(idée|inspiration|exemple|possibilités)\b/)) {
      updates.intention = 'inspiration'
    }
  }

  // Mettre à jour l'étape en fonction du contexte
  if (currentProfile.current_step === 'accroche' && currentProfile.message_count >= 1) {
    updates.currentStep = 'intention_detectee'
  } else if (updates.intention && currentProfile.current_step === 'intention_detectee') {
    updates.currentStep = 'reaction_adaptee'
  } else if (updates.firstName && currentProfile.current_step === 'reaction_adaptee') {
    updates.currentStep = 'prenom_demande'
  } else if (lowerResponse.includes('partager') && lowerResponse.includes('contenu')) {
    updates.currentStep = 'nurturing'
  } else if (lowerResponse.includes('où est-ce que je peux t\'envoyer')) {
    updates.currentStep = 'email_propose'
  }

  // Appliquer les mises à jour si nécessaire
  if (Object.keys(updates).length > 0) {
    try {
      await (supabase as any).rpc('update_visitor_profile', {
        p_session_id: sessionId,
        p_first_name: updates.firstName || null,
        p_intention: updates.intention || null,
        p_current_step: updates.currentStep || null,
        p_increment_messages: false
      })
    } catch (error) {
      console.error('[Onboarding API] Auto-update profile error:', error)
    }
  }
}

