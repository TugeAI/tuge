'use client'

import { FileText, Tag, MapPin, DollarSign } from 'lucide-react'

export type ListingCategory = 'service' | 'product' | 'job' | 'other'
export type PriceType = 'fixed' | 'hourly' | 'negotiable' | 'free'

export interface ListingSummaryCardData {
  title: string
  description: string
  category?: ListingCategory
  price?: number | null
  priceType?: PriceType
  location?: string | null
}

function formatCategory(category?: ListingCategory): string {
  switch (category) {
    case 'service':
      return 'Service'
    case 'product':
      return 'Produit'
    case 'job':
      return 'Emploi'
    case 'other':
      return 'Autre'
    default:
      return '—'
  }
}

function formatPrice(price?: number | null, priceType?: PriceType): string {
  if (priceType === 'free') return 'Gratuit'
  if (priceType === 'negotiable') return price != null ? `${price}€ (Négociable)` : 'À discuter'
  if (priceType === 'hourly') return price != null ? `${price}€/h` : 'Tarif horaire'
  if (priceType === 'fixed') return price != null ? `${price}€` : 'Prix fixe'
  return price != null ? `${price}€` : '—'
}

export function ListingSummaryCard({ data }: { data: ListingSummaryCardData }) {
  return (
    <div className="w-full rounded-xl bg-white/[0.02] border border-white/[0.08] overflow-hidden">
      <div className="px-3.5 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center">
            <FileText className="w-4 h-4 text-violet-400" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white/90 truncate">
              {data.title || 'Annonce'}
            </div>
            <div className="text-xs text-white/40">
              Récapitulatif
            </div>
          </div>
        </div>
      </div>

      <div className="p-3.5 space-y-3">
        {/* Description */}
        <div className="text-sm text-white/75 whitespace-pre-wrap leading-relaxed">
          {data.description || '—'}
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center gap-2 text-white/40 mb-1">
              <Tag className="w-3.5 h-3.5" />
              <span className="text-xs">Catégorie</span>
            </div>
            <div className="text-sm text-white/85 font-medium">
              {formatCategory(data.category)}
            </div>
          </div>

          <div className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center gap-2 text-white/40 mb-1">
              <DollarSign className="w-3.5 h-3.5" />
              <span className="text-xs">Prix</span>
            </div>
            <div className="text-sm text-white/85 font-medium">
              {formatPrice(data.price, data.priceType)}
            </div>
          </div>

          <div className="col-span-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center gap-2 text-white/40 mb-1">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-xs">Localisation</span>
            </div>
            <div className="text-sm text-white/85 font-medium">
              {data.location || '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ListingSummaryCard



