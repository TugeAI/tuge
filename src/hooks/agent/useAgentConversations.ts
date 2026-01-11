import { useState, useCallback } from 'react'
import type { Conversation } from '@/lib/supabase/types'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface UseAgentConversationsReturn {
  conversations: Conversation[]
  currentConversationId: string | null
  loading: boolean
  loadAuthenticatedConversations: () => Promise<void>
  loadGuestConversations: (sessionId: string) => Promise<void>
  selectConversation: (conv: Conversation) => void
  startNewConversation: () => void
  deleteConversation: (id: string) => Promise<void>
  setCurrentConversationId: (id: string | null) => void
}

interface UseAgentConversationsOptions {
  supabase: SupabaseClient | null
  isAuthenticated: boolean
  onError?: (message: string) => void
  onLoadMessages?: (conversationId: string) => void
}

/**
 * Hook pour gérer les conversations de l'agent
 */
export function useAgentConversations({
  supabase,
  isAuthenticated,
  onError,
  onLoadMessages,
}: UseAgentConversationsOptions): UseAgentConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadAuthenticatedConversations = useCallback(async () => {
    if (!supabase) return
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false })
    if (error) {
      console.error('Error loading conversations:', error)
      onError?.('Erreur lors du chargement des conversations')
    } else {
      setConversations(data || [])
    }
    setLoading(false)
  }, [supabase, onError])

  const loadGuestConversations = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/agent/guest?sessionId=${sessionId}`)
      const data = await response.json()
      if (data.success) {
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Error loading guest conversations:', error)
    }
    setLoading(false)
  }, [])

  const selectConversation = useCallback((conv: Conversation) => {
    setCurrentConversationId(conv.id)
    onLoadMessages?.(conv.id)
  }, [onLoadMessages])

  const startNewConversation = useCallback(() => {
    setCurrentConversationId(null)
  }, [])

  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (!isAuthenticated && typeof window !== 'undefined') {
        const sessionId = localStorage.getItem('tug_session_id')
        if (sessionId) headers['x-session-id'] = sessionId
      }

      const response = await fetch(`/api/agent/${conversationId}`, { method: 'DELETE', headers })
      const data = await response.json()

      if (data.success) {
        setConversations(prev => prev.filter(c => c.id !== conversationId))
        if (currentConversationId === conversationId) {
          setCurrentConversationId(null)
        }
      } else {
        onError?.(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur suppression conversation:', error)
      onError?.('Erreur lors de la suppression')
    }
  }, [isAuthenticated, currentConversationId, onError])

  return {
    conversations,
    currentConversationId,
    loading,
    loadAuthenticatedConversations,
    loadGuestConversations,
    selectConversation,
    startNewConversation,
    deleteConversation,
    setCurrentConversationId,
  }
}


