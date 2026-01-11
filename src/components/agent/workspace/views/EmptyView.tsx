'use client'

import { Layers, Plus } from 'lucide-react'

interface EmptyViewProps {
  onOpenPlan?: () => void
  onOpenActions?: () => void
}

/**
 * Vue vide - Affichée quand aucune vue n'est ouverte
 */
export function EmptyView({ onOpenPlan, onOpenActions }: EmptyViewProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
        <Layers className="w-7 h-7 text-violet-400/60" />
      </div>
      
      <h3 className="text-sm font-medium text-white/70 mb-1">
        Espace de travail
      </h3>
      <p className="text-xs text-white/40 max-w-[200px] mb-6">
        Les vues contextuelles s'afficheront ici pendant votre conversation
      </p>

      <div className="flex flex-col gap-2 w-full max-w-[180px]">
        <button
          onClick={onOpenPlan}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white/60 text-xs hover:bg-white/[0.06] hover:text-white/80 transition-all"
          aria-label="Ouvrir le Plan"
        >
          <Plus className="w-3.5 h-3.5" />
          Ouvrir le Plan
        </button>
        <button
          onClick={onOpenActions}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white/60 text-xs hover:bg-white/[0.06] hover:text-white/80 transition-all"
          aria-label="Voir les Actions"
        >
          <Plus className="w-3.5 h-3.5" />
          Voir les Actions
        </button>
      </div>
    </div>
  )
}

export default EmptyView

