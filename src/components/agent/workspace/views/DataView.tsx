'use client'

import { FileText, Package, ChevronRight } from 'lucide-react'

interface DataViewProps {
  draftsCount?: number
  listingsCount?: number
  onViewDrafts?: () => void
  onViewListings?: () => void
}

/**
 * Vue Données - Données contextuelles de l'utilisateur
 */
export function DataView({ 
  draftsCount = 0, 
  listingsCount = 0,
  onViewDrafts,
  onViewListings,
}: DataViewProps) {
  return (
    <div className="p-4 space-y-4">
      {/* Brouillons */}
      <div>
        <div className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
          Brouillons
        </div>
        <button
          onClick={onViewDrafts}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all text-left"
          aria-label={`Voir les ${draftsCount} brouillon${draftsCount > 1 ? 's' : ''}`}
        >
          <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
            <FileText className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-white/80 font-medium">
              {draftsCount} brouillon{draftsCount > 1 ? 's' : ''}
            </div>
            <div className="text-xs text-white/40">En attente de publication</div>
          </div>
          <ChevronRight className="w-4 h-4 text-white/30" />
        </button>
      </div>

      {/* Annonces */}
      <div>
        <div className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
          Annonces
        </div>
        <button
          onClick={onViewListings}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all text-left"
          aria-label={`Voir les ${listingsCount} annonce${listingsCount > 1 ? 's' : ''}`}
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <Package className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-white/80 font-medium">
              {listingsCount} annonce{listingsCount > 1 ? 's' : ''}
            </div>
            <div className="text-xs text-white/40">Publiées</div>
          </div>
          <ChevronRight className="w-4 h-4 text-white/30" />
        </button>
      </div>

      {/* Stats supplémentaires */}
      <div className="pt-4 border-t border-white/[0.06]">
        <div className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
          Statistiques
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="px-3 py-2 rounded-lg bg-white/[0.02]">
            <div className="text-lg font-semibold text-white/80">{draftsCount + listingsCount}</div>
            <div className="text-xs text-white/40">Total créés</div>
          </div>
          <div className="px-3 py-2 rounded-lg bg-white/[0.02]">
            <div className="text-lg font-semibold text-emerald-400">{listingsCount}</div>
            <div className="text-xs text-white/40">Publiés</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataView

