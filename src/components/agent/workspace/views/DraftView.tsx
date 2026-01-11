'use client'

import { useState } from 'react'
import { 
  FileText, 
  MapPin, 
  DollarSign, 
  Tag, 
  Sparkles,
  Send,
  Loader2
} from 'lucide-react'
import type { DraftViewData } from '../types'

interface DraftViewProps {
  draft: DraftViewData
  onUpdate?: (draft: DraftViewData) => void
  onPublish?: () => void
  onAskAgent?: (question: string) => void
  isPublishing?: boolean
}

/**
 * Vue Draft - Édition d'un brouillon d'annonce
 */
export function DraftView({ 
  draft, 
  onUpdate, 
  onPublish, 
  onAskAgent,
  isPublishing = false 
}: DraftViewProps) {
  const [question, setQuestion] = useState('')

  const handleAskAgent = () => {
    if (question.trim() && onAskAgent) {
      onAskAgent(question)
      setQuestion('')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header avec titre */}
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-white/90">{draft.title || 'Sans titre'}</div>
            <div className="text-xs text-white/40">Brouillon</div>
          </div>
        </div>
      </div>

      {/* Contenu du brouillon */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scrollbar">
        {/* Description */}
        <div>
          <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
            Description
          </label>
          <div className="mt-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] text-sm text-white/70">
            {draft.description || 'Aucune description'}
          </div>
        </div>

        {/* Détails en grille */}
        <div className="grid grid-cols-2 gap-3">
          {/* Prix */}
          <div className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center gap-2 text-white/40 mb-1">
              <DollarSign className="w-3.5 h-3.5" />
              <span className="text-xs">Prix</span>
            </div>
            <div className="text-sm text-white/80 font-medium">
              {draft.price ? `${draft.price}€` : 'Non défini'}
              {draft.priceType && (
                <span className="text-xs text-white/40 ml-1">
                  ({draft.priceType === 'negotiable' ? 'négociable' : draft.priceType === 'free' ? 'gratuit' : 'fixe'})
                </span>
              )}
            </div>
          </div>

          {/* Catégorie */}
          <div className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center gap-2 text-white/40 mb-1">
              <Tag className="w-3.5 h-3.5" />
              <span className="text-xs">Catégorie</span>
            </div>
            <div className="text-sm text-white/80 font-medium">
              {draft.category || 'Non définie'}
            </div>
          </div>

          {/* Localisation */}
          <div className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] col-span-2">
            <div className="flex items-center gap-2 text-white/40 mb-1">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-xs">Localisation</span>
            </div>
            <div className="text-sm text-white/80 font-medium">
              {draft.location || 'Non définie'}
            </div>
          </div>
        </div>

        {/* Demander à l'agent */}
        <div className="pt-4 border-t border-white/[0.06]">
          <label className="flex items-center gap-2 text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            Modifier avec l'agent
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskAgent()}
              placeholder="Ex: Ajoute plus de détails..."
              className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
            />
            <button
              onClick={handleAskAgent}
              disabled={!question.trim()}
              className="px-3 py-2 rounded-lg bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer avec actions */}
      <div className="px-4 py-3 border-t border-white/[0.06]">
        <button
          onClick={onPublish}
          disabled={isPublishing || !draft.title}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-medium text-sm hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isPublishing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Publication...
            </>
          ) : (
            <>
              Publier l'annonce
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default DraftView

