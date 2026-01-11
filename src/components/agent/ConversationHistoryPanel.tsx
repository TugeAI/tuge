'use client'

import { useState } from 'react'
import { 
  Search, 
  Plus, 
  MessageSquare, 
  Trash2, 
  MoreHorizontal,
  Clock
} from 'lucide-react'
import { BRAND } from '@/config/brand'
import { getDisplayVersion } from '@/config/version'
import type { Conversation } from '@/lib/supabase/types'

interface ConversationHistoryPanelProps {
  conversations: Conversation[]
  currentId: string | null
  onSelect: (conv: Conversation) => void
  onNew: () => void
  onDelete: (id: string) => void
  loading: boolean
  isAuthenticated: boolean
  userEmail: string | null
  onSignUp: () => void
  onLogout: () => void
}

/**
 * Panel 1 - Historique des conversations
 * Liste scrollable avec hover actions (delete/rename)
 */
export function ConversationHistoryPanel({
  conversations,
  currentId,
  onSelect,
  onNew,
  onDelete,
  loading,
  isAuthenticated,
  userEmail,
  onSignUp,
  onLogout,
}: ConversationHistoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const filteredConversations = conversations.filter(conv =>
    conv.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Limiter à 5 conversations si showAll est false
  const displayedConversations = showAll 
    ? filteredConversations 
    : filteredConversations.slice(0, 5)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return "Aujourd'hui"
    if (days === 1) return 'Hier'
    if (days < 7) return `Il y a ${days} jours`
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="flex flex-col h-full bg-[rgba(12,12,18,0.95)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex flex-col">
          <span className="font-semibold text-white/90 text-sm">{BRAND.name} AI</span>
          <span className="text-xs text-white/40">v{getDisplayVersion()}</span>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08]">
          <Search className="w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/35 outline-none"
          />
        </div>
      </div>

      {/* New Chat Button */}
      <div className="px-3 pb-2">
        <button
          onClick={onNew}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-violet-500/15 border border-violet-500/30 text-white/90 text-sm font-medium transition-all hover:bg-violet-500/25 hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)]"
          aria-label="Nouvelle conversation"
        >
          <Plus className="w-4 h-4" />
          Nouvelle conversation
        </button>
      </div>

      {/* Section title */}
      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/35">
        Historique
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5 chat-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-white/40 text-sm">
            {searchQuery ? 'Aucun résultat' : 'Aucune conversation'}
          </div>
        ) : (
          <>
            {displayedConversations.map((conv) => (
            <div
              key={conv.id}
              onMouseEnter={() => setHoveredId(conv.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`
                group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer
                transition-all duration-150
                ${currentId === conv.id 
                  ? 'bg-violet-500/15 border border-violet-500/25' 
                  : 'hover:bg-white/[0.04] border border-transparent'
                }
              `}
              onClick={() => onSelect(conv)}
            >
              <MessageSquare className={`w-4 h-4 flex-shrink-0 ${currentId === conv.id ? 'text-violet-400' : 'text-white/40'}`} />
              
              <div className="flex-1 min-w-0">
                <div className={`text-sm truncate ${currentId === conv.id ? 'text-white/95' : 'text-white/70'}`}>
                  {conv.title || 'Nouvelle conversation'}
                </div>
                <div className="flex items-center gap-1 text-xs text-white/35 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {formatDate(conv.updated_at || conv.created_at)}
                </div>
              </div>

              {/* Hover Actions */}
              {hoveredId === conv.id && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(conv.id)
                    }}
                    className="p-1.5 rounded-md text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Supprimer"
                    aria-label="Supprimer la conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-md text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
                    title="Plus d'options"
                    aria-label="Plus d'options"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            ))}
            
            {/* Bouton Voir plus */}
            {filteredConversations.length > 5 && (
              <div className="px-2 pt-2">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="w-full py-2 text-xs font-medium text-white/50 hover:text-white/80 hover:bg-white/[0.04] rounded-lg transition-all"
                  aria-label={showAll ? 'Voir moins de conversations' : `Voir plus de conversations (${filteredConversations.length - 5})`}
                >
                  {showAll ? 'Voir moins' : `Voir plus (${filteredConversations.length - 5})`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer - User info */}
      <div className="px-3 py-3 border-t border-white/[0.06]">
        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 text-sm font-medium">
              {userEmail?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white/80 truncate">{userEmail}</div>
            </div>
            <button
              onClick={onLogout}
              className="text-xs text-white/40 hover:text-white/70 transition-colors"
              aria-label="Déconnexion"
            >
              Déconnexion
            </button>
          </div>
        ) : (
          <button
            onClick={onSignUp}
            className="flex items-center justify-center w-full py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:bg-white/10 hover:text-white/90 transition-all"
            aria-label="Se connecter"
          >
            Se connecter
          </button>
        )}
      </div>
    </div>
  )
}

export default ConversationHistoryPanel

