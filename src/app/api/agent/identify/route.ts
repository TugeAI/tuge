/**
 * API Route: /api/agent/identify
 * 
 * Identifie un visiteur par IP + fingerprint et retourne son profil
 * avec l'historique de conversation s'il existe.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ============================================================================
// Schémas de validation
// ============================================================================

const IdentifyBodySchema = z.object({
  sessionId: z.string().uuid('Session ID invalide'),
  fingerprintId: z.string().min(1).max(100).optional(),
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
  message_count: number
  ip_address: string | null
  fingerprint_id: string | null
  is_new: boolean
}

interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface IdentifyResponse {
  success: boolean
  profile: VisitorProfile | null
  conversation: {
    id: string
    messages: ConversationMessage[]
  } | null
  isReturningVisitor: boolean
  error?: string
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Extrait l'IP du visiteur depuis les headers
 */
function getClientIP(request: NextRequest): string | null {
  // Priorité : x-forwarded-for (proxy/CDN) > x-real-ip > connection
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // Prendre la première IP (celle du client original)
    return forwarded.split(',')[0].trim()
  }
  
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  
  return null
}

// ============================================================================
// POST /api/agent/identify
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<IdentifyResponse>> {
  try {
    // 1. Récupérer l'IP serveur
    const ipAddress = getClientIP(request)
    
    // 2. Valider le body
    const body = await request.json()
    const validation = IdentifyBodySchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        profile: null,
        conversation: null,
        isReturningVisitor: false,
        error: validation.error.issues.map(i => i.message).join(', ')
      }, { status: 400 })
    }
    
    const { sessionId, fingerprintId } = validation.data
    
    // 3. Appeler la fonction Supabase pour trouver/créer le profil
    const supabase = createAdminClient()
    
    const { data: profileData, error: profileError } = await (supabase as any)
      .rpc('upsert_visitor_profile', {
        p_session_id: sessionId,
        p_ip_address: ipAddress,
        p_fingerprint_id: fingerprintId || null
      })
      .single()
    
    if (profileError) {
      console.error('[Identify API] Profile error:', profileError)
      
      // Fallback: créer un profil minimal
      return NextResponse.json({
        success: true,
        profile: {
          id: sessionId,
          session_id: sessionId,
          first_name: null,
          intention: 'unknown',
          current_step: 'accroche',
          is_intention_active: false,
          message_count: 0,
          ip_address: ipAddress,
          fingerprint_id: fingerprintId || null,
          is_new: true
        },
        conversation: null,
        isReturningVisitor: false
      })
    }
    
    const profile = profileData as VisitorProfile
    const isReturningVisitor = !profile.is_new
    
    // 4. Si visiteur de retour, récupérer la dernière conversation
    let conversation = null
    
    if (isReturningVisitor) {
      // Chercher la dernière conversation anonyme pour cette session
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('id, created_at')
        .eq('session_id', profile.session_id)
        .is('user_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (!convError && convData) {
        // Récupérer les messages de cette conversation
        const { data: messagesData } = await supabase
          .from('messages')
          .select('id, role, content, created_at')
          .eq('conversation_id', convData.id)
          .order('created_at', { ascending: true })
          .limit(50)
        
        conversation = {
          id: convData.id,
          messages: (messagesData || []) as ConversationMessage[]
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      profile,
      conversation,
      isReturningVisitor
    })
    
  } catch (error) {
    console.error('[Identify API] Error:', error)
    return NextResponse.json({
      success: false,
      profile: null,
      conversation: null,
      isReturningVisitor: false,
      error: 'Erreur serveur'
    }, { status: 500 })
  }
}





