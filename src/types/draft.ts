/**
 * Types pour les brouillons d'annonces
 */

export type ListingCategory = 'product' | 'service' | 'job' | 'other'
export type PriceType = 'fixed' | 'hourly' | 'negotiable' | 'free'

export interface DraftImage {
  id: string
  url: string
  isGenerated: boolean
  position: number
}

export interface DraftData {
  id?: string
  title: string
  description: string
  category: ListingCategory
  price?: number
  priceType?: PriceType
  location?: string
  images?: DraftImage[]
}


