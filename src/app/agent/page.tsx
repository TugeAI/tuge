'use client'

/**
 * Page Agent - Layout IDE 4 Panels style Cursor
 * 
 * Structure avec react-resizable-panels :
 * 1. History (20%) - Historique des conversations
 * 2. Chat (50%) - Zone de conversation centrale
 * 3. Context (20%) - Onglets Plan/Données/Actions/Logs
 * 4. Menu (10%) - Navigation verticale par icônes
 * 
 * Chaque panel est redimensionnable et masquable via la toolbar
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BRAND } from '@/config/brand'
import type { Conversation, Message, PendingProposalResult } from '@/lib/supabase/types'
import { OnboardingView } from '@/components/agent/OnboardingView'
import { useDeviceFingerprint } from '@/hooks/useDeviceFingerprint'
import { useGeolocation } from '@/hooks/useGeolocation'
import { PanelsLayout } from '@/components/agent'
import type { DraftData } from '@/types/draft'
import type { 
  LocalMessage, 
  ThinkingState, 
  ThinkingSectionItem, 
  ThinkingSectionsState, 
  Attachment 
} from '@/components/agent/types'
import { ListingDraftProvider, useListingDraft, type ListingPatch } from '@/stores/listing-draft-store'

interface Toast {
  id: string
  message: string
  type: 'error' | 'success'
  retry?: () => void
}

// ============================================================================
// Utilitaires
// ============================================================================

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function getOrCreateSessionId(): string {
  const STORAGE_KEY = 'tug_session_id'
  if (typeof window === 'undefined') return generateUUID()
  let sessionId = localStorage.getItem(STORAGE_KEY)
  if (!sessionId) {
    sessionId = generateUUID()
    localStorage.setItem(STORAGE_KEY, sessionId)
  }
  return sessionId
}

function getSessionId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('tug_session_id')
}

function clearSessionId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('tug_session_id')
  }
}

// ============================================================================
// Composants UI
// ============================================================================

function ToastNotification({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div className={`
      flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-message-in
      ${toast.type === 'error' 
        ? 'bg-red-500/10 border border-red-500/30 text-red-400' 
        : 'bg-green-500/10 border border-green-500/30 text-green-400'
      }
    `}>
      <span className="text-sm flex-1">{toast.message}</span>
      {toast.retry && (
        <button onClick={toast.retry} className="text-xs opacity-70 hover:opacity-100 transition-opacity">
          Réessayer
        </button>
      )}
    </div>
  )
}

function NoCreditsModal({
  isOpen, onClose, onClaimDaily, canClaimDaily, isClaimingDaily,
}: {
  isOpen: boolean
  onClose: () => void
  onClaimDaily: () => void
  canClaimDaily: boolean
  isClaimingDaily: boolean
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#16162a] border border-violet-500/20 shadow-2xl shadow-violet-500/10 animate-message-in">
        <div className="flex flex-col items-center pt-8 pb-4 px-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Solde épuisé</h2>
          <p className="text-white/60 text-center text-sm leading-relaxed">
            Vous n&apos;avez plus de crédits pour continuer la conversation.
          </p>
        </div>

        <div className="px-6 pb-6 space-y-3">
          {canClaimDaily && (
            <button
              onClick={() => { onClaimDaily(); onClose() }}
              disabled={isClaimingDaily}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 hover:border-green-500/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Crédits gratuits</p>
                  <p className="text-white/50 text-xs">+10 crédits offerts chaque jour</p>
                </div>
              </div>
              <span className="text-green-400 font-semibold">
                {isClaimingDaily ? '...' : 'Gratuit'}
              </span>
            </button>
          )}

          <a href="/wallet" className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 hover:border-violet-500/40 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Recharger mon compte</p>
                <p className="text-white/50 text-xs">Achetez des crédits supplémentaires</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-violet-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>

          <button onClick={onClose} className="w-full mt-2 py-3 text-white/50 hover:text-white/80 text-sm transition-colors">
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Page principale (avec Provider)
// ============================================================================

export default function AgentPage() {
  return (
    <ListingDraftProvider>
      <AgentPageContent />
    </ListingDraftProvider>
  )
}

// ============================================================================
// Contenu de la page (utilise le contexte ListingDraft)
// ============================================================================

function AgentPageContent() {
  // Store ListingDraft
  const { draft, applyListingPatch, setDraftId, resetDraft, hasDraftData } = useListingDraft()
  
  // Dériver currentDraft du store pour compatibilité
  const currentDraft = hasDraftData ? {
    id: draft.id,
    title: draft.title,
    description: draft.description,
    category: draft.category || 'other',
    price: draft.price || undefined,
    priceType: draft.priceType,
    location: draft.location || undefined,
  } : null
  
  // États principaux
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<LocalMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [mounted, setMounted] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  
  // États onboarding
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [visitorProfile, setVisitorProfile] = useState<{
    id: string; session_id: string; first_name: string | null; intention: string; message_count: number
  } | null>(null)
  const [existingConversation, setExistingConversation] = useState<{
    id: string; messages: { id: string; role: 'user' | 'assistant'; content: string }[]
  } | null>(null)
  
  // Hooks
  const { fingerprint } = useDeviceFingerprint()
  const { location: userLocation, requestLocation } = useGeolocation()
  
  // État brouillon (géré par le store ListingDraft)
  const [isPublishingDraft, setIsPublishingDraft] = useState(false)

  // États streaming
  const [thinking, setThinking] = useState<ThinkingState>({ isThinking: false, steps: [], currentStep: '' })
  const [streamingContent, setStreamingContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [thinkingSections, setThinkingSections] = useState<ThinkingSectionsState>({
    isActive: false, isExpanded: true, startTime: null, sections: []
  })

  // États crédits
  const [credits, setCredits] = useState<{ free: number; paid: number; total: number; canClaim: boolean } | null>(null)
  const [claimingCredits, setClaimingCredits] = useState(false)
  const [showNoCreditsModal, setShowNoCreditsModal] = useState(false)

  // États propositions
  const [proposals, setProposals] = useState<PendingProposalResult[]>([])
  const [pendingProposalsCount, setPendingProposalsCount] = useState(0)

  const abortControllerRef = useRef<AbortController | null>(null)
  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null
    return createClient()
  }, [])

  // Callbacks de base
  const addToast = useCallback((message: string, type: 'error' | 'success', retry?: () => void) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type, retry }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Chargement des crédits
  const loadCredits = useCallback(async () => {
    try {
      const response = await fetch('/api/credits/wallet')
      if (!response.ok) return
      const data = await response.json()
      setCredits({
        free: data.wallet.daily_free_credits,
        paid: data.wallet.paid_credits,
        total: data.wallet.total_credits,
        canClaim: data.wallet.can_claim_today,
      })
    } catch (error) {
      console.error('Erreur chargement crédits:', error)
    }
  }, [])

  const handleClaimDaily = useCallback(async () => {
    setClaimingCredits(true)
    try {
      const response = await fetch('/api/credits/claim-daily', { method: 'POST' })
      const data = await response.json()
      if (data.success) {
        setCredits({
          free: data.wallet.daily_free_credits,
          paid: data.wallet.paid_credits,
          total: data.wallet.total_credits,
          canClaim: false,
        })
        addToast(data.message, 'success')
      } else {
        addToast(data.message || 'Erreur', 'error')
      }
    } catch (error) {
      console.error('Erreur claim:', error)
      addToast('Erreur lors de la réclamation', 'error')
    } finally {
      setClaimingCredits(false)
    }
  }, [addToast])

  // Chargement des propositions
  const loadProposals = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const response = await fetch('/api/proposals?direction=received')
      const data = await response.json()
      if (data.success) {
        setProposals(data.proposals || [])
        setPendingProposalsCount(data.pendingCount || 0)
      }
    } catch (error) {
      console.error('Erreur chargement propositions:', error)
    }
  }, [isAuthenticated])

  // Handlers brouillon
  const handleDraftPublish = useCallback(async () => {
    if (!currentDraft?.title || !currentDraft?.description) {
      addToast('Le titre et la description sont requis', 'error')
      return
    }
    
    setIsPublishingDraft(true)
    try {
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentDraft.title,
          description: currentDraft.description,
          category: currentDraft.category,
          price: currentDraft.price,
          priceType: currentDraft.priceType || 'negotiable',
          location: currentDraft.location,
          publishNow: true,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        addToast('Annonce publiée avec succès !', 'success')
        resetDraft()
      } else {
        addToast(data.error || 'Erreur lors de la publication', 'error')
      }
    } catch (error) {
      console.error('Erreur publication:', error)
      addToast('Erreur lors de la publication', 'error')
    } finally {
      setIsPublishingDraft(false)
    }
  }, [currentDraft, addToast, resetDraft])

  // Chargement conversations
  const loadAuthenticatedConversations = useCallback(async () => {
    if (!supabase) return
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false })
    if (error) {
      console.error('Error loading conversations:', error)
      addToast('Erreur lors du chargement des conversations', 'error')
    } else {
      setConversations(data || [])
    }
    setLoading(false)
  }, [supabase, addToast])

  const loadGuestConversations = useCallback(async (sid: string) => {
    try {
      const response = await fetch(`/api/agent/guest?sessionId=${sid}`)
      const data = await response.json()
      if (data.success) {
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Error loading guest conversations:', error)
    }
    setLoading(false)
  }, [])

  const loadMessages = useCallback(async (conversationId: string) => {
    if (!supabase) return
    setLoadingMessages(true)
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    if (error) {
      console.error('Error loading messages:', error)
      addToast('Erreur lors du chargement des messages', 'error')
    } else {
      setMessages((data || []).map(m => ({ ...m, status: 'sent' as const })))
    }
    setLoadingMessages(false)
  }, [supabase, addToast])

  const handleDeleteConversation = useCallback(async (conversationId: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (!isAuthenticated) {
        const sessionId = getSessionId()
        if (sessionId) headers['x-session-id'] = sessionId
      }

      const response = await fetch(`/api/agent/${conversationId}`, { method: 'DELETE', headers })
      const data = await response.json()

      if (data.success) {
        setConversations(prev => prev.filter(c => c.id !== conversationId))
        if (currentConversationId === conversationId) {
          setCurrentConversationId(null)
          setMessages([])
        }
        addToast('Conversation supprimée', 'success')
      } else {
        addToast(data.error || 'Erreur lors de la suppression', 'error')
      }
    } catch (error) {
      console.error('Erreur suppression conversation:', error)
      addToast('Erreur lors de la suppression', 'error')
    }
  }, [isAuthenticated, currentConversationId, addToast])

  const selectConversation = useCallback((conv: Conversation) => {
    setCurrentConversationId(conv.id)
    loadMessages(conv.id)
    // Note: Le brouillon est maintenant géré globalement par le store
  }, [loadMessages])

  const startNewConversation = useCallback(() => {
    setCurrentConversationId(null)
    setMessages([])
    setThinking({ isThinking: false, steps: [], currentStep: '' })
    setStreamingContent('')
    setIsStreaming(false)
    // Note: Le brouillon est maintenant géré globalement par le store
  }, [])

  const claimAnonymousConversations = useCallback(async () => {
    const sid = getSessionId()
    if (!sid) return
    try {
      const response = await fetch('/api/agent/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid })
      })
      const data = await response.json()
      if (data.success && data.claimedCount > 0) {
        addToast(`${data.claimedCount} conversation(s) récupérée(s)`, 'success')
        clearSessionId()
      }
    } catch (error) {
      console.error('Error claiming conversations:', error)
    }
  }, [addToast])

  const handleSignUp = useCallback(() => {
    window.location.href = '/'
  }, [])

  const handleLogout = useCallback(async () => {
    if (!supabase) return
    try {
      await supabase.auth.signOut()
      clearSessionId()
      window.location.href = '/'
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      addToast('Erreur lors de la déconnexion', 'error')
    }
  }, [supabase, addToast])

  // Envoi de message avec streaming
  const sendMessage = useCallback(async (content: string, attachments?: Attachment[]) => {
    if (sending) return

    if (abortControllerRef.current) abortControllerRef.current.abort()
    abortControllerRef.current = new AbortController()

    const tempId = `temp-${Date.now()}`
    let messageContent = content
    const attachmentUrls: string[] = []

    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        try {
          const formData = new FormData()
          formData.append('file', attachment.file)
          const uploadResponse = await fetch('/api/agent/upload', { method: 'POST', body: formData })
          if (uploadResponse.ok) {
            const { url, type } = await uploadResponse.json()
            attachmentUrls.push(url)
            if (type === 'image') messageContent += `\n\n[Image jointe: ${url}]`
            else messageContent += `\n\n[Document joint: ${attachment.file.name}]`
          }
        } catch (error) {
          console.error('Erreur upload attachment:', error)
        }
      }
    }

    const tempMessage: LocalMessage = {
      id: tempId,
      conversation_id: currentConversationId || '',
      role: 'user',
      content: messageContent,
      created_at: new Date().toISOString(),
      status: 'sending',
      tempId
    }

    setMessages(prev => [...prev, tempMessage])
    setSending(true)
    setThinking({ isThinking: true, steps: [], currentStep: '' })
    setThinkingSections({ isActive: true, isExpanded: true, startTime: Date.now(), sections: [] })
    setStreamingContent('')
    setIsStreaming(false)

    try {
      const currentSessionId = getOrCreateSessionId()
      const apiUrl = isAuthenticated ? '/api/agent' : '/api/agent/guest'
      const body = isAuthenticated
        ? { 
            ...(currentConversationId && { conversationId: currentConversationId }), 
            message: messageContent,
            ...(attachmentUrls.length > 0 && { attachments: attachmentUrls }),
            ...(userLocation && { userLocation }),
            enableOrchestration: true
          }
        : { 
            sessionId: currentSessionId, 
            ...(currentConversationId && { conversationId: currentConversationId }), 
            message: messageContent,
            ...(attachmentUrls.length > 0 && { attachments: attachmentUrls })
          }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        let userMessage = 'Une erreur de connexion est survenue. Réessayez.'
        if (response.status === 402) {
          userMessage = 'Crédits insuffisants pour cette action.'
          setShowNoCreditsModal(true)
        } else if (response.status === 401) {
          userMessage = 'Votre session a expiré. Veuillez vous reconnecter.'
        } else if (response.status === 429) {
          userMessage = 'Trop de requêtes. Patientez quelques instants.'
        } else if (response.status >= 500) {
          userMessage = 'Le service est temporairement indisponible.'
        }
        
        setMessages(prev => prev.map(m => m.tempId === tempId ? { ...m, status: 'error' as const } : m))
        setThinking({ isThinking: false, steps: [], currentStep: '' })
        setSending(false)
        addToast(userMessage, 'error', () => {
          setMessages(prev => prev.filter(m => m.tempId !== tempId))
          sendMessage(content)
        })
        return
      }

      setMessages(prev => prev.map(m => m.tempId === tempId ? { ...m, status: 'sent' as const } : m))

      const reader = response.body?.getReader()
      if (!reader) {
        setMessages(prev => prev.map(m => m.tempId === tempId ? { ...m, status: 'error' as const } : m))
        setThinking({ isThinking: false, steps: [], currentStep: '' })
        setSending(false)
        addToast('Erreur de communication avec le serveur.', 'error')
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''
      let newConversationId: string | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() || ''

        for (const event of events) {
          if (!event.trim()) continue
          
          const lines = event.split('\n')
          let eventType = ''
          let dataStr = ''
          
          for (const line of lines) {
            if (line.startsWith('event: ')) eventType = line.slice(7).trim()
            else if (line.startsWith('data: ')) dataStr = line.slice(6)
          }
          
          if (eventType && dataStr) {
            try {
              const data = JSON.parse(dataStr)
              
              switch (eventType) {
                case 'credit':
                  if (data.remainingCredits) {
                    setCredits({
                      free: data.remainingCredits.free,
                      paid: data.remainingCredits.paid,
                      total: data.remainingCredits.total,
                      canClaim: false,
                    })
                  }
                  break
                case 'conversation':
                  newConversationId = data.id
                  setCurrentConversationId(data.id)
                  break
                case 'thinking':
                  setThinking(prev => ({
                    isThinking: true,
                    steps: [...prev.steps, prev.currentStep].filter(Boolean),
                    currentStep: data
                  }))
                  break
                case 'thinking_section':
                  setThinkingSections(prev => {
                    const newSection: ThinkingSectionItem = {
                      category: data.category,
                      content: data.content,
                      items: data.items,
                      status: data.status || 'completed',
                      timestamp: Date.now()
                    }
                    const startTime = prev.startTime || Date.now()
                    const existingIndex = prev.sections.findIndex(s => 
                      s.category === data.category && (data.category !== 'execution' || s.content === data.content)
                    )
                    
                    let newSections: ThinkingSectionItem[]
                    if (existingIndex >= 0 && data.category !== 'execution') {
                      newSections = [...prev.sections]
                      newSections[existingIndex] = newSection
                    } else {
                      newSections = [...prev.sections, newSection]
                    }
                    
                    return { isActive: true, isExpanded: true, startTime, sections: newSections }
                  })
                  break
                case 'chunk':
                  setThinking(prev => ({
                    ...prev, isThinking: false,
                    steps: [...prev.steps, prev.currentStep].filter(Boolean),
                    currentStep: ''
                  }))
                  setThinkingSections(prev => ({ ...prev, isActive: false, isExpanded: false }))
                  setIsStreaming(true)
                  fullContent += typeof data === 'string' ? data : ''
                  setStreamingContent(fullContent)
                  break
                case 'done':
                  setIsStreaming(false)
                  setThinkingSections(prev => ({ ...prev, isActive: false, isExpanded: false }))
                  if (fullContent) {
                    const assistantMessage: LocalMessage = {
                      id: `assistant-${Date.now()}`,
                      conversation_id: currentConversationId || newConversationId || '',
                      role: 'assistant',
                      content: fullContent,
                      created_at: new Date().toISOString(),
                      status: 'sent'
                    }
                    setMessages(prev => [...prev, assistantMessage])
                    setStreamingContent('')
                  }
                  break
                case 'saved':
                  if (data.messageId) {
                    setMessages(prev => prev.map(m => 
                      m.id.startsWith('assistant-') && m.content === fullContent
                        ? { ...m, id: data.messageId, created_at: data.createdAt }
                        : m
                    ))
                  }
                  break
                case 'tool_call':
                  if (data.name === 'create_listing_draft' && data.result?.success) {
                    const draft = data.result.draft
                    if (draft) {
                      // Appliquer le patch au store ListingDraft
                      const patch: ListingPatch = {
                        title: draft.title,
                        description: draft.description,
                        category: draft.category,
                        price: draft.price,
                        priceType: draft.priceType,
                        location: draft.location || userLocation || null,
                      }
                      applyListingPatch(patch)
                      if (data.result.draftId) {
                        setDraftId(data.result.draftId)
                      }

                      // Afficher le récapitulatif en CARTE dans le chat
                      const cardMessage: LocalMessage = {
                        id: `ui-listing-summary-${Date.now()}`,
                        conversation_id: currentConversationId || newConversationId || '',
                        role: 'assistant',
                        content: '',
                        created_at: new Date().toISOString(),
                        status: 'sent',
                        ui: {
                          type: 'listing_summary',
                          data: {
                            title: draft.title,
                            description: draft.description,
                            category: draft.category,
                            price: draft.price ?? null,
                            priceType: draft.priceType,
                            location: draft.location || userLocation || null,
                          }
                        }
                      }
                      setMessages(prev => [...prev, cardMessage])
                    }
                  }
                  if (data.name === 'update_listing' && data.result?.success && data.result?.listing) {
                    const listing = data.result.listing
                    // Appliquer le patch au store ListingDraft
                    const patch: ListingPatch = {
                      title: listing.title,
                      description: listing.description,
                      category: listing.category,
                      price: listing.price,
                      priceType: listing.priceType,
                      location: listing.location || null,
                    }
                    applyListingPatch(patch)
                    if (listing.id) {
                      setDraftId(listing.id)
                    }

                    // Afficher une carte récap lors d'une mise à jour
                    const cardMessage: LocalMessage = {
                      id: `ui-listing-summary-${Date.now()}`,
                      conversation_id: currentConversationId || newConversationId || '',
                      role: 'assistant',
                      content: '',
                      created_at: new Date().toISOString(),
                      status: 'sent',
                      ui: {
                        type: 'listing_summary',
                        data: {
                          title: listing.title,
                          description: listing.description,
                          category: listing.category,
                          price: listing.price ?? null,
                          priceType: listing.priceType,
                          location: listing.location || userLocation || null,
                        }
                      }
                    }
                    setMessages(prev => [...prev, cardMessage])
                  }
                  break
                case 'error':
                  const errorData = typeof data === 'string' 
                    ? { code: 'UNKNOWN_ERROR', message: data }
                    : data as { code?: string; message?: string; wallet?: { free: number; paid: number; total: number } }
                  
                  if (errorData.code === 'NO_CREDITS') {
                    if (errorData.wallet) {
                      setCredits({
                        free: errorData.wallet.free || 0,
                        paid: errorData.wallet.paid || 0,
                        total: errorData.wallet.total || 0,
                        canClaim: true,
                      })
                    }
                    setMessages(prev => prev.filter(m => m.tempId !== tempId))
                    setThinking({ isThinking: false, steps: [], currentStep: '' })
                    setIsStreaming(false)
                    setStreamingContent('')
                    setSending(false)
                    setShowNoCreditsModal(true)
                    return
                  }
                  
                  setMessages(prev => prev.map(m => m.tempId === tempId ? { ...m, status: 'error' as const } : m))
                  setThinking({ isThinking: false, steps: [], currentStep: '' })
                  setIsStreaming(false)
                  setStreamingContent('')
                  setSending(false)
                  addToast(errorData.message || 'Erreur inattendue', 'error')
                  return
              }
            } catch (e) {
              if (!(e instanceof SyntaxError)) throw e
            }
          }
        }
      }

      if (newConversationId) {
        if (isAuthenticated) loadAuthenticatedConversations()
        else loadGuestConversations(currentSessionId)
      }

      setThinking({ isThinking: false, steps: [], currentStep: '' })

    } catch (error) {
      if ((error as Error).name === 'AbortError') return
      console.error('[sendMessage] Exception:', error)
      setMessages(prev => prev.map(m => m.tempId === tempId ? { ...m, status: 'error' as const } : m))
      setThinking({ isThinking: false, steps: [], currentStep: '' })
      setIsStreaming(false)
      setStreamingContent('')
      addToast('Une erreur inattendue est survenue.', 'error')
    } finally {
      setSending(false)
    }
  }, [currentConversationId, sending, addToast, isAuthenticated, loadAuthenticatedConversations, loadGuestConversations, userLocation, applyListingPatch, setDraftId])

  const handleAskAgentAboutDraft = useCallback((question: string) => {
    if (!currentDraft) {
      sendMessage(question)
      return
    }
    
    const draftContext = `Je voudrais modifier mon brouillon d'annonce.

Brouillon actuel :
- Titre : ${currentDraft.title}
- Description : ${currentDraft.description}
- Prix : ${currentDraft.price || 'non défini'}€ (${currentDraft.priceType || 'négociable'})
- Catégorie : ${currentDraft.category}
- Localisation : ${currentDraft.location || 'non définie'}

Ma demande : ${question}

Recrée le brouillon avec create_listing_draft en appliquant cette modification.`
    
    sendMessage(draftContext)
  }, [currentDraft, sendMessage])

  // Effects
  useEffect(() => {
    setMounted(true)
    requestLocation()
    return () => { if (abortControllerRef.current) abortControllerRef.current.abort() }
  }, [requestLocation])

  useEffect(() => {
    if (!supabase || !mounted) return
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const authenticated = !!user
      setIsAuthenticated(authenticated)
      
      if (authenticated) {
        setUserEmail(user?.email || null)
        setShowOnboarding(false)
        await claimAnonymousConversations()
        loadAuthenticatedConversations()
        loadCredits()
        loadProposals()
      } else {
        const sid = getOrCreateSessionId()
        try {
          const response = await fetch('/api/agent/identify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: sid, fingerprintId: fingerprint?.visitorId })
          })
          const data = await response.json()
          if (data.success) {
            setVisitorProfile(data.profile)
            setExistingConversation(data.conversation)
            setShowOnboarding(true)
          } else {
            setShowOnboarding(true)
          }
        } catch {
          setShowOnboarding(true)
        }
        loadGuestConversations(sid)
      }
    }
    checkAuth()
  }, [supabase, mounted, fingerprint, loadAuthenticatedConversations, loadGuestConversations, claimAnonymousConversations, loadCredits, loadProposals])

  const handleOnboardingAuthenticated = useCallback(() => {
    setShowOnboarding(false)
    setIsAuthenticated(true)
    const reload = async () => {
      if (!supabase) return
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || null)
        await claimAnonymousConversations()
        loadAuthenticatedConversations()
        loadCredits()
        loadProposals()
      }
    }
    reload()
  }, [supabase, claimAnonymousConversations, loadAuthenticatedConversations, loadCredits, loadProposals])

  // Loading
  if (!mounted || isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-[rgba(10,10,15,1)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 p-2.5 animate-pulse">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt={BRAND.name} className="w-full h-full" />
          </div>
          <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const showWelcome = messages.length === 0 && !loadingMessages && !thinking.isThinking && !isStreaming

  return (
    <>
      <PanelsLayout
        // Conversations
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={selectConversation}
        onNewConversation={startNewConversation}
        onDeleteConversation={handleDeleteConversation}
        loadingConversations={loading}
        
        // Auth
        isAuthenticated={isAuthenticated}
        userEmail={userEmail}
        onSignUp={handleSignUp}
        onLogout={handleLogout}
        
        // Messages
        messages={messages}
        thinking={thinking}
        thinkingSections={thinkingSections}
        streamingContent={streamingContent}
        isStreaming={isStreaming}
        sending={sending}
        onSend={sendMessage}
        showWelcome={showWelcome}
        loadingMessages={loadingMessages}
        
        // Credits
        credits={credits}
        onClaimCredits={handleClaimDaily}
        claimingCredits={claimingCredits}
        
        // Draft
        currentDraft={currentDraft}
        onAskAgent={handleAskAgentAboutDraft}
        onPublishDraft={handleDraftPublish}
        isPublishingDraft={isPublishingDraft}
        showDraftActions={hasDraftData}
        
        // Proposals
        proposalsCount={pendingProposalsCount}
        
        // Toggle
        onToggleThinkingSections={() => setThinkingSections(prev => ({ ...prev, isExpanded: !prev.isExpanded }))}
      />

      {/* Modal crédits insuffisants */}
      <NoCreditsModal
        isOpen={showNoCreditsModal}
        onClose={() => setShowNoCreditsModal(false)}
        onClaimDaily={handleClaimDaily}
        canClaimDaily={credits?.canClaim ?? false}
        isClaimingDaily={claimingCredits}
      />

      {/* Toasts */}
      <div className="fixed bottom-6 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map(toast => (
          <ToastNotification key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </>
  )
}
