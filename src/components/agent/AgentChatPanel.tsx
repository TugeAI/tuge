'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { 
  Sparkles, 
  Send, 
  Paperclip, 
  Mic, 
  MicOff, 
  XCircle,
  Image as ImageIcon,
  FileText,
  Loader2
} from 'lucide-react'
import { BRAND } from '@/config/brand'
import type { DraftData } from '@/types/draft'
import type { LocalMessage } from './types'
import { ListingSummaryCard, type ListingSummaryCardData } from './chat/ListingSummaryCard'
import type { 
  ThinkingState, 
  ThinkingSectionsState, 
  CreditInfo, 
  Attachment 
} from './types'

interface PromptSuggestion {
  icon: React.ReactNode
  title: string
  subtitle: string
  prompt: string
}

// Suggestions par défaut pour l'écran de bienvenue
const PROMPT_SUGGESTIONS: PromptSuggestion[] = [
  {
    icon: <FileText className="w-4 h-4" />,
    title: 'Créer une annonce',
    subtitle: 'Je vous guide étape par étape',
    prompt: 'Je voudrais créer une nouvelle annonce'
  },
  {
    icon: <Sparkles className="w-4 h-4" />,
    title: 'Optimiser mon annonce',
    subtitle: 'Améliorer titre et description',
    prompt: 'Comment optimiser mon annonce pour avoir plus de vues ?'
  },
  {
    icon: <ImageIcon className="w-4 h-4" />,
    title: 'Conseils photos',
    subtitle: 'Prendre de meilleures photos',
    prompt: 'Quels conseils pour prendre de bonnes photos pour mes annonces ?'
  },
]

interface AgentChatPanelProps {
  messages: LocalMessage[]
  thinking: ThinkingState
  thinkingSections: ThinkingSectionsState
  streamingContent: string
  isStreaming: boolean
  sending: boolean
  onSend: (content: string, attachments?: Attachment[]) => void
  onNewChat: () => void
  showWelcome: boolean
  loadingMessages: boolean
  credits?: CreditInfo | null
  onClaimCredits?: () => void
  claimingCredits?: boolean
  isAuthenticated: boolean
  currentDraft?: DraftData | null
  onAskAgent?: (question: string) => void
  onPublishDraft?: () => void
  isPublishingDraft?: boolean
  showDraftActions?: boolean
  onToggleThinkingSections?: () => void
}

// Composant Avatar Agent
function AgentAvatar({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  
  return (
    <div className={`relative ${sizeClass}`}>
      <div className={`${sizeClass} rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center`}>
        <Sparkles className={`${iconSize} text-white`} />
      </div>
      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[rgba(12,12,18,1)] rounded-full" />
    </div>
  )
}

// Composant Bulle de message (simplifié)
function MessageBubble({ message }: { message: LocalMessage }) {
  const isUser = message.role === 'user'
  const ui = (message as any).ui as { type?: string; data?: unknown } | undefined
  const listingData = ui?.type === 'listing_summary' ? (ui.data as ListingSummaryCardData) : null
  
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && <AgentAvatar size="sm" />}
      <div
        className={`
          max-w-[75%] px-4 py-3 rounded-2xl
          ${isUser 
            ? 'bg-gradient-to-br from-violet-600 to-violet-700 text-white rounded-br-md' 
            : 'bg-[rgba(30,30,45,0.8)] border border-white/10 text-white/90 rounded-bl-md'
          }
          ${message.status === 'error' ? 'border-red-500/50' : ''}
        `}
      >
        {listingData ? (
          <ListingSummaryCard data={listingData} />
        ) : (
          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        )}

        {message.status === 'sending' && (
          <div className="flex items-center gap-1 mt-1 text-xs text-white/50">
            <Loader2 className="w-3 h-3 animate-spin" />
            Envoi...
          </div>
        )}
      </div>
    </div>
  )
}

// Composant Streaming
function StreamingMessage({ content }: { content: string }) {
  return (
    <div className="flex gap-3">
      <AgentAvatar size="sm" />
      <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-bl-md bg-[rgba(30,30,45,0.8)] border border-violet-500/30 text-white/90">
        <div className="text-sm whitespace-pre-wrap">
          {content}
          <span className="inline-block w-0.5 h-4 ml-1 bg-violet-400 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

// Composant Thinking
function ThinkingIndicator({ thinking }: { thinking: ThinkingState }) {
  if (!thinking.isThinking && thinking.steps.length === 0) return null
  
  return (
    <div className="flex gap-3">
      <AgentAvatar size="sm" />
      <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-[rgba(30,30,45,0.6)] border border-violet-500/20">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm text-white/60">
            {thinking.currentStep || 'Réflexion...'}
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * Panel 2 - Zone de chat centrale
 * Toujours visible, devient fullscreen si autres panels cachés
 */
export function AgentChatPanel({
  messages,
  thinking,
  thinkingSections,
  streamingContent,
  isStreaming,
  sending,
  onSend,
  onNewChat,
  showWelcome,
  loadingMessages,
  credits,
  onClaimCredits,
  claimingCredits,
  isAuthenticated,
  onToggleThinkingSections,
}: AgentChatPanelProps) {
  const [inputValue, setInputValue] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isRecording, setIsRecording] = useState(false)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent, thinking])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px'
    }
  }, [inputValue])

  const handleSend = useCallback((content: string) => {
    if (!content.trim() && attachments.length === 0) return
    if (sending) return
    
    onSend(content, attachments)
    setInputValue('')
    setAttachments([])
  }, [attachments, sending, onSend])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(inputValue)
    }
  }

  const addFiles = useCallback((files: FileList | File[]) => {
    const newAttachments: Attachment[] = Array.from(files).map(file => ({
      id: crypto.randomUUID(),
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      type: file.type.startsWith('image/') ? 'image' : 'document'
    }))
    setAttachments(prev => [...prev, ...newAttachments])
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    addFiles(files)
    e.target.value = ''
  }, [addFiles])

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => {
      const attachment = prev.find(a => a.id === id)
      if (attachment?.preview) URL.revokeObjectURL(attachment.preview)
      return prev.filter(a => a.id !== id)
    })
  }, [])

  const canSend = (inputValue.trim() || attachments.length > 0) && !sending && !isRecording

  return (
    <div className="flex flex-col h-full bg-[rgba(15,15,22,0.95)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[rgba(12,12,18,0.9)]">
        <div className="flex items-center gap-3">
          <AgentAvatar />
          <div>
            <p className="font-medium text-white text-sm">{BRAND.agentName}</p>
            <p className="text-xs text-white/40">En ligne</p>
          </div>
        </div>
        
        {isAuthenticated && credits && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            {credits.canClaim && onClaimCredits && (
              <button
                onClick={onClaimCredits}
                disabled={claimingCredits}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50"
              >
                {claimingCredits ? '...' : '+10'}
              </button>
            )}
            <span className="text-sm text-white/80 tabular-nums">{credits.total}</span>
            <span className="text-xs text-white/40">crédits</span>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scrollbar">
        {loadingMessages ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
          </div>
        ) : showWelcome ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/15 border border-violet-500/30 flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-violet-400" />
            </div>
            <h1 className="text-xl font-semibold text-white/95 mb-2">Comment puis-je vous aider ?</h1>
            <p className="text-sm text-white/50 max-w-xs mb-6">
              Posez une question ou choisissez une suggestion ci-dessous
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg">
              {PROMPT_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion.title}
                  onClick={() => onSend(suggestion.prompt)}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] text-left hover:bg-violet-500/10 hover:border-violet-500/30 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center mb-3 text-violet-400 group-hover:bg-violet-500/20">
                    {suggestion.icon}
                  </div>
                  <div className="text-sm font-medium text-white/90 mb-1">{suggestion.title}</div>
                  <div className="text-xs text-white/40">{suggestion.subtitle}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages
              .filter(m => m.role !== 'tool')
              .map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            
            {(thinking.isThinking || thinking.steps.length > 0) && thinkingSections.sections.length === 0 && (
              <ThinkingIndicator thinking={thinking} />
            )}
            
            {isStreaming && streamingContent && (
              <StreamingMessage content={streamingContent} />
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-white/[0.06] bg-[rgba(12,12,18,0.9)]">
        {/* Preview attachments */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="relative group">
                {attachment.type === 'image' ? (
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={attachment.preview} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white/40" />
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Supprimer la pièce jointe"
                  title="Supprimer"
                >
                  <XCircle className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Exit button */}
          {messages.length > 0 && (
            <button
              onClick={onNewChat}
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
              aria-label="Nouvelle conversation"
              title="Nouvelle conversation"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}

          {/* Upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-white/40 hover:text-violet-400 hover:bg-violet-500/10 transition-all disabled:opacity-40"
            aria-label="Joindre un fichier"
            title="Joindre un fichier"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Mic button */}
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              isRecording 
                ? 'bg-red-500/20 text-red-400' 
                : 'bg-white/5 text-white/40 hover:text-violet-400 hover:bg-violet-500/10'
            }`}
            aria-label={isRecording ? 'Arrêter l\'enregistrement' : 'Enregistrer un message vocal'}
            title={isRecording ? 'Arrêter l\'enregistrement' : 'Enregistrer un message vocal'}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Textarea */}
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Votre message..."
              rows={1}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/35 resize-none focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-all"
              style={{ maxHeight: '160px' }}
            />
          </div>

          {/* Send button */}
          <button
            onClick={() => handleSend(inputValue)}
            disabled={!canSend}
            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              canSend
                ? 'bg-gradient-to-br from-violet-600 to-violet-700 text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.4)]'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            }`}
            aria-label={sending ? 'Envoi en cours...' : 'Envoyer le message'}
            title={sending ? 'Envoi en cours...' : 'Envoyer'}
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AgentChatPanel

