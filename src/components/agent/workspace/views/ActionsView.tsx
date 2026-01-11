'use client'

import { Package, Edit2, Zap, Search, MessageSquare } from 'lucide-react'

interface ActionsViewProps {
  onAction?: (action: string) => void
  hasActiveDraft?: boolean
}

/**
 * Vue Actions - Actions rapides disponibles
 */
export function ActionsView({ onAction, hasActiveDraft = false }: ActionsViewProps) {
  return (
    <div className="p-4 space-y-3">
      <div className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">
        Actions rapides
      </div>
      
      {/* Action principale - Créer annonce */}
      <button
        onClick={() => onAction?.('new_listing')}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-violet-500/10 border border-violet-500/25 text-white/90 hover:bg-violet-500/20 hover:border-violet-500/40 transition-all"
        aria-label="Créer une annonce"
      >
        <Package className="w-5 h-5 text-violet-400" />
        <div className="flex-1 text-left">
          <span className="font-medium text-sm">Créer une annonce</span>
          <p className="text-xs text-white/50">Démarrer avec l&apos;assistant</p>
        </div>
      </button>

      {/* Modifier brouillon - si existant */}
      {hasActiveDraft && (
        <button
          onClick={() => onAction?.('edit_draft')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white/70 hover:bg-white/[0.06] hover:text-white/90 transition-all"
          aria-label="Modifier le brouillon"
        >
          <Edit2 className="w-5 h-5 text-white/50" />
          <div className="flex-1 text-left">
            <span className="font-medium text-sm">Modifier le brouillon</span>
            <p className="text-xs text-white/40">Continuer l&apos;édition</p>
          </div>
        </button>
      )}

      {/* Publier - si brouillon existant */}
      {hasActiveDraft && (
        <button
          onClick={() => onAction?.('publish')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-white/90 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all"
          aria-label="Publier l'annonce"
        >
          <Zap className="w-5 h-5 text-emerald-400" />
          <div className="flex-1 text-left">
            <span className="font-medium text-sm">Publier</span>
            <p className="text-xs text-white/40">Mettre en ligne</p>
          </div>
        </button>
      )}

      {/* Séparateur */}
      <div className="pt-2 border-t border-white/[0.06]" />

      {/* Actions secondaires */}
      <button
        onClick={() => onAction?.('search')}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/[0.02] border border-white/[0.06] text-white/60 hover:bg-white/[0.04] hover:text-white/80 transition-all"
        aria-label="Rechercher des annonces"
      >
        <Search className="w-5 h-5 text-white/40" />
        <span className="font-medium text-sm">Rechercher des annonces</span>
      </button>

      <button
        onClick={() => onAction?.('ask_agent')}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/[0.02] border border-white/[0.06] text-white/60 hover:bg-white/[0.04] hover:text-white/80 transition-all"
        aria-label="Demander à l'agent"
      >
        <MessageSquare className="w-5 h-5 text-white/40" />
        <span className="font-medium text-sm">Demander à l&apos;agent</span>
      </button>
    </div>
  )
}

export default ActionsView

