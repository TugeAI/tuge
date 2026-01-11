'use client'

import { Package, Wrench, Tag, MapPin, Euro, ExternalLink, Edit2, FileText } from 'lucide-react'

/**
 * Type représentant une annonce parsée depuis le message de l'agent
 */
export interface ParsedListing {
  index: number
  title: string
  price?: number
  currency?: string
  status: 'brouillon' | 'publié' | 'archivé'
  category?: 'product' | 'service' | 'job' | 'other'
}

interface ListingCardProps {
  listing: ParsedListing
  onClick?: () => void
  variant?: 'compact' | 'default'
}

const CATEGORY_CONFIG = {
  product: { icon: Package, color: 'violet', label: 'Produit' },
  service: { icon: Wrench, color: 'cyan', label: 'Service' },
  job: { icon: Tag, color: 'pink', label: 'Emploi' },
  other: { icon: FileText, color: 'gray', label: 'Autre' },
}

const STATUS_CONFIG = {
  brouillon: { color: 'amber', bg: 'rgba(251, 191, 36, 0.15)', text: 'rgba(251, 191, 36, 1)' },
  publié: { color: 'emerald', bg: 'rgba(16, 185, 129, 0.15)', text: 'rgba(16, 185, 129, 1)' },
  archivé: { color: 'gray', bg: 'rgba(156, 163, 175, 0.15)', text: 'rgba(156, 163, 175, 1)' },
}

/**
 * Carte premium pour afficher une annonce
 */
export function ListingCard({ listing, onClick, variant = 'default' }: ListingCardProps) {
  const category = listing.category || 'other'
  const CategoryIcon = CATEGORY_CONFIG[category].icon
  const statusConfig = STATUS_CONFIG[listing.status]
  
  if (variant === 'compact') {
    return (
      <button
        onClick={onClick}
        className="listing-card-compact group w-full text-left"
      >
        {/* Index badge */}
        <div className="listing-card-index">
          {listing.index}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="listing-card-title truncate">{listing.title}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            {listing.price !== undefined && (
              <span className="listing-card-price">
                {listing.price}€
              </span>
            )}
            <span 
              className="listing-card-status"
              style={{ 
                background: statusConfig.bg, 
                color: statusConfig.text 
              }}
            >
              {listing.status}
            </span>
          </div>
        </div>
        
        {/* Arrow */}
        <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-violet-400 transition-colors flex-shrink-0" />
      </button>
    )
  }
  
  return (
    <button
      onClick={onClick}
      className="listing-card group w-full text-left"
    >
      {/* Header avec catégorie et statut */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="listing-card-category-icon">
            <CategoryIcon className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-medium text-white/50">
            {CATEGORY_CONFIG[category].label}
          </span>
        </div>
        <span 
          className="listing-card-status"
          style={{ 
            background: statusConfig.bg, 
            color: statusConfig.text 
          }}
        >
          {listing.status}
        </span>
      </div>
      
      {/* Index et Titre */}
      <div className="flex items-start gap-3 mb-3">
        <div className="listing-card-index-large">
          {listing.index}
        </div>
        <h4 className="listing-card-title-large flex-1">
          {listing.title}
        </h4>
      </div>
      
      {/* Prix */}
      {listing.price !== undefined && (
        <div className="flex items-center gap-1.5 mb-3">
          <Euro className="w-4 h-4 text-emerald-400" />
          <span className="text-lg font-bold text-white">
            {listing.price}
            <span className="text-sm font-normal text-white/50 ml-0.5">€</span>
          </span>
        </div>
      )}
      
      {/* Actions hint */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-2 text-xs text-white/40">
          <Edit2 className="w-3 h-3" />
          <span>Cliquer pour modifier</span>
        </div>
        <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-violet-400 transition-colors" />
      </div>
    </button>
  )
}

/**
 * Grille de cartes d'annonces
 */
interface ListingsGridProps {
  listings: ParsedListing[]
  onListingClick?: (listing: ParsedListing) => void
  title?: string
  variant?: 'compact' | 'default'
}

export function ListingsGrid({ listings, onListingClick, title, variant = 'compact' }: ListingsGridProps) {
  return (
    <div className="listings-grid-container">
      {/* Titre optionnel */}
      {title && (
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-medium text-white/80">{title}</h3>
          <span className="ml-auto text-xs text-white/40">{listings.length} annonce{listings.length > 1 ? 's' : ''}</span>
        </div>
      )}
      
      {/* Grille de cartes */}
      <div className={variant === 'compact' ? 'listings-grid-compact' : 'listings-grid'}>
        {listings.map((listing) => (
          <ListingCard
            key={listing.index}
            listing={listing}
            onClick={() => onListingClick?.(listing)}
            variant={variant}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Parser pour extraire les annonces d'un message texte
 * Détecte les patterns comme :
 * - "1. **iPhone 11 - Excellent état** - 350€ (📝 Brouillon)"
 * - "2. **MacBook Pro 13"** - 900€ (📝 Brouillon)"
 * - "3. Cartes Pokémon - 10€ (Publié)"
 */
export function parseListingsFromMessage(content: string): { text: string; listings: ParsedListing[] } | null {
  const lines = content.split('\n')
  const listings: ParsedListing[] = []
  const textParts: string[] = []
  let foundListings = false
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    
    // Vérifier si la ligne commence par un numéro suivi d'un point
    if (/^\d+\./.test(trimmedLine)) {
      // Extraire le numéro
      const indexMatch = trimmedLine.match(/^(\d+)\./)
      if (!indexMatch) continue
      const index = parseInt(indexMatch[1], 10)
      
      // Chercher le prix (nombre suivi de €)
      const priceMatch = trimmedLine.match(/(\d+)\s*€/)
      const price = priceMatch ? parseInt(priceMatch[1], 10) : undefined
      
      // Chercher le statut entre parenthèses
      const statusMatch = trimmedLine.match(/\((.*?)(Brouillon|Publié|Archivé)(.*?)\)/i)
      if (!statusMatch) continue
      
      const status = statusMatch[2].toLowerCase() as 'brouillon' | 'publié' | 'archivé'
      
      // Extraire le titre : tout ce qui est entre "numero. " et " - prix€"
      const title = trimmedLine
        .replace(/^\d+\.\s*/, '')  // Enlever le numéro
        .replace(/\s*[-–]\s*\d+\s*€.*$/, '')  // Enlever depuis le prix jusqu'à la fin
        .replace(/\*\*/g, '')  // Enlever les **
        .trim()
      
      if (title) {
        foundListings = true
        listings.push({
          index,
          title,
          price,
          status,
          category: detectCategory(title),
        })
      }
      continue
    }
    
    // Si ce n'est pas une annonce, garder le texte
    if (trimmedLine && !foundListings) {
      textParts.push(line)
    }
  }
  
  if (listings.length === 0) {
    return null
  }
  
  return {
    text: textParts.join('\n').trim(),
    listings,
  }
}

/**
 * Détecte la catégorie probable d'une annonce basée sur son titre
 */
function detectCategory(title: string): 'product' | 'service' | 'job' | 'other' {
  const titleLower = title.toLowerCase()
  
  // Mots-clés pour produits
  const productKeywords = [
    'iphone', 'macbook', 'airpods', 'samsung', 'carte', 'cartes', 
    'casque', 'écouteurs', 'téléphone', 'ordinateur', 'console',
    'vêtement', 'meuble', 'vélo', 'voiture', 'moto',
  ]
  
  // Mots-clés pour services
  const serviceKeywords = [
    'cours', 'leçon', 'formation', 'coaching', 'aide', 'service',
    'réparation', 'installation', 'livraison', 'ménage', 'garde',
  ]
  
  // Mots-clés pour emploi
  const jobKeywords = [
    'emploi', 'job', 'poste', 'stage', 'alternance', 'cdi', 'cdd',
    'recherche', 'recrute', 'embauche',
  ]
  
  if (productKeywords.some(kw => titleLower.includes(kw))) {
    return 'product'
  }
  if (serviceKeywords.some(kw => titleLower.includes(kw))) {
    return 'service'
  }
  if (jobKeywords.some(kw => titleLower.includes(kw))) {
    return 'job'
  }
  
  return 'product' // Par défaut
}

export default ListingCard

