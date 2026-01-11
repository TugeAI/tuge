'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, 
  MapPin, 
  DollarSign, 
  Tag, 
  Sparkles,
  Send,
  Loader2,
  Undo2,
  Trash2,
  History,
  Package,
  Briefcase,
  HelpCircle,
  Check,
  Wrench
} from 'lucide-react'
import { useListingDraft, type ListingCategory, type PriceType } from '@/stores/listing-draft-store'
import { ImageUploadField } from './ImageUploadField'
import { useLoadDraftImages } from '@/hooks/useLoadDraftImages'
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete'

interface CreateListingViewProps {
  onPublish?: () => void
  onAskAgent?: (question: string) => void
  isPublishing?: boolean
}

/**
 * Labels pour les catégories
 */
const CATEGORY_LABELS: Record<ListingCategory, { label: string; icon: React.ReactNode }> = {
  service: { label: 'Service', icon: <Wrench className="w-4 h-4" /> },
  product: { label: 'Produit', icon: <Package className="w-4 h-4" /> },
  job: { label: 'Emploi', icon: <Briefcase className="w-4 h-4" /> },
  other: { label: 'Autre', icon: <HelpCircle className="w-4 h-4" /> },
}

/**
 * Options de catégories pour le select
 */
const CATEGORY_OPTIONS: { value: ListingCategory; label: string }[] = [
  { value: 'service', label: 'Service' },
  { value: 'product', label: 'Produit' },
  { value: 'job', label: 'Emploi' },
  { value: 'other', label: 'Autre' },
]

/**
 * Labels pour les types de prix
 */
const PRICE_TYPE_LABELS: Record<PriceType, string> = {
  fixed: 'Fixe',
  hourly: '/heure',
  negotiable: 'Négociable',
  free: 'Gratuit',
}

/**
 * Options de types de prix pour le select
 */
const PRICE_TYPE_OPTIONS: { value: PriceType; label: string }[] = [
  { value: 'fixed', label: 'Fixe' },
  { value: 'hourly', label: '/heure' },
  { value: 'negotiable', label: 'Négociable' },
  { value: 'free', label: 'Gratuit' },
]

/**
 * Composant de champ éditable avec highlight
 */
function EditableTextField({ 
  label, 
  value, 
  icon, 
  isHighlighted,
  placeholder = '',
  onChange,
  multiline = false,
  className = '',
}: {
  label: string
  value: string | null | undefined
  icon: React.ReactNode
  isHighlighted: boolean
  placeholder?: string
  onChange: (value: string) => void
  multiline?: boolean
  className?: string
}) {
  return (
    <div 
      className={`
        relative px-3 py-2.5 rounded-lg border transition-all duration-300
        ${isHighlighted 
          ? 'bg-violet-500/20 border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.3)]' 
          : 'bg-white/[0.02] border-white/[0.06]'
        }
        ${className}
      `}
    >
      {/* Highlight glow effect */}
      {isHighlighted && (
        <div className="absolute inset-0 rounded-lg bg-violet-500/10 animate-pulse" />
      )}
      
      <div className="relative">
        <div className={`flex items-center gap-2 mb-1.5 ${isHighlighted ? 'text-violet-400' : 'text-white/40'}`}>
          {icon}
          <span className="text-xs font-medium">{label}</span>
          {isHighlighted && (
            <span className="ml-auto flex items-center gap-1 text-[10px] text-violet-400">
              <Check className="w-3 h-3" />
              Modifié
            </span>
          )}
        </div>
        
        {multiline ? (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={4}
            className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-md text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.08] transition-all resize-none"
          />
        ) : (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-md text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.08] transition-all"
          />
        )}
      </div>
    </div>
  )
}

/**
 * Vue CreateListing - Création d'annonce avec auto-remplissage via patches
 */
export function CreateListingView({ 
  onPublish,
  onAskAgent,
  isPublishing = false 
}: CreateListingViewProps) {
  const { 
    draft, 
    patchHistory, 
    isFieldRecentlyModified,
    applyListingPatch,
    undoLastPatch,
    resetDraft,
    canUndo,
    hasDraftData,
    patchCount,
    addImages,
    removeImage
  } = useListingDraft()

  const [question, setQuestion] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  // Charger les images du brouillon si elles existent
  useLoadDraftImages(draft.id)

  const handleAskAgent = () => {
    if (question.trim() && onAskAgent) {
      onAskAgent(question)
      setQuestion('')
    }
  }

  // Calculer le score de complétion
  const getCompletionScore = () => {
    let score = 0
    if (draft.title) score += 25
    if (draft.description) score += 25
    if (draft.category) score += 20
    if (draft.price !== null || draft.priceType === 'free') score += 15
    if (draft.location) score += 15
    return score
  }

  const completionScore = getCompletionScore()
  const isComplete = completionScore >= 70

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-white/90">
                {draft.title || 'Nouvelle annonce'}
              </div>
              <div className="text-xs text-white/40">
                {patchCount} modification{patchCount > 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Completion badge */}
          <div className={`
            px-2.5 py-1 rounded-full text-xs font-medium
            ${isComplete 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }
          `}>
            {completionScore}% complet
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 bg-white/[0.06] rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : 'bg-violet-500'}`}
            style={{ width: `${completionScore}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scrollbar">
        {/* Titre */}
        <EditableTextField
          label="Titre"
          value={draft.title}
          icon={<FileText className="w-3.5 h-3.5" />}
          isHighlighted={isFieldRecentlyModified('title')}
          placeholder="Titre de l'annonce..."
          onChange={(value) => applyListingPatch({ title: value })}
        />

        {/* Description */}
        <EditableTextField
          label="Description"
          value={draft.description}
          icon={<FileText className="w-3.5 h-3.5" />}
          isHighlighted={isFieldRecentlyModified('description')}
          placeholder="Description de l'annonce..."
          onChange={(value) => applyListingPatch({ description: value })}
          multiline
        />

        {/* Grid: Catégorie, Prix, Localisation */}
        <div className="grid grid-cols-2 gap-3">
          {/* Catégorie */}
          <div 
            className={`
              relative px-3 py-2.5 rounded-lg border transition-all duration-300
              ${isFieldRecentlyModified('category')
                ? 'bg-violet-500/20 border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.3)]' 
                : 'bg-white/[0.02] border-white/[0.06]'
              }
            `}
          >
            {isFieldRecentlyModified('category') && (
              <div className="absolute inset-0 rounded-lg bg-violet-500/10 animate-pulse" />
            )}
            <div className="relative">
              <div className={`flex items-center gap-2 mb-1.5 ${isFieldRecentlyModified('category') ? 'text-violet-400' : 'text-white/40'}`}>
                <Tag className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Catégorie</span>
                {isFieldRecentlyModified('category') && (
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-violet-400">
                    <Check className="w-3 h-3" />
                    Modifié
                  </span>
                )}
              </div>
              <select
                value={draft.category || ''}
                onChange={(e) => applyListingPatch({ category: e.target.value as ListingCategory })}
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-md text-sm text-white/90 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.08] transition-all cursor-pointer"
              >
                <option value="" disabled className="bg-[#1a1a1a] text-white/50">
                  Non défini
                </option>
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-[#1a1a1a] text-white/90">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Prix */}
          <div 
            className={`
              relative px-3 py-2.5 rounded-lg border transition-all duration-300
              ${isFieldRecentlyModified('price') || isFieldRecentlyModified('priceType')
                ? 'bg-violet-500/20 border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.3)]' 
                : 'bg-white/[0.02] border-white/[0.06]'
              }
            `}
          >
            {(isFieldRecentlyModified('price') || isFieldRecentlyModified('priceType')) && (
              <div className="absolute inset-0 rounded-lg bg-violet-500/10 animate-pulse" />
            )}
            <div className="relative">
              <div className={`flex items-center gap-2 mb-1.5 ${isFieldRecentlyModified('price') || isFieldRecentlyModified('priceType') ? 'text-violet-400' : 'text-white/40'}`}>
                <DollarSign className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Prix</span>
                {(isFieldRecentlyModified('price') || isFieldRecentlyModified('priceType')) && (
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-violet-400">
                    <Check className="w-3 h-3" />
                    Modifié
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={draft.price ?? ''}
                  onChange={(e) => applyListingPatch({ price: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="w-20 px-2 py-1.5 bg-white/[0.05] border border-white/[0.08] rounded-md text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.08] transition-all"
                />
                <select
                  value={draft.priceType ?? 'negotiable'}
                  onChange={(e) => applyListingPatch({ priceType: e.target.value as PriceType })}
                  className="flex-1 px-2 py-1.5 bg-white/[0.05] border border-white/[0.08] rounded-md text-sm text-white/90 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.08] transition-all cursor-pointer"
                >
                  {PRICE_TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-[#1a1a1a] text-white/90">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Localisation */}
          <AddressAutocomplete
            value={draft.location || ''}
            onChange={(value) => applyListingPatch({ location: value || null })}
            isHighlighted={isFieldRecentlyModified('location')}
            placeholder="Ville, région..."
            className="col-span-2"
          />
        </div>

        {/* Photos */}
        <ImageUploadField
          images={draft.images}
          draftId={draft.id}
          onImagesChange={(newImages) => {
            // Remplacer toutes les images
            const imagesToAdd = newImages.filter(
              newImg => !draft.images.some(img => img.id === newImg.id)
            )
            if (imagesToAdd.length > 0) {
              addImages(imagesToAdd)
            }
            // Gérer les suppressions
            const imagesToRemove = draft.images.filter(
              img => !newImages.some(newImg => newImg.id === img.id)
            )
            imagesToRemove.forEach(img => removeImage(img.id))
          }}
          onGenerateImage={() => {
            const prompt = draft.title || draft.description 
              ? `Génère une image pour mon annonce: ${draft.title}. ${draft.description}`
              : 'Génère une image pour mon annonce'
            onAskAgent?.(prompt)
          }}
          isHighlighted={isFieldRecentlyModified('images')}
        />

        {/* Historique des patches */}
        {patchHistory.length > 0 && (
          <div className="pt-3 border-t border-white/[0.06]">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-xs text-white/50 hover:text-white/70 transition-colors"
            >
              <History className="w-3.5 h-3.5" />
              <span>Historique des modifications ({patchHistory.length})</span>
            </button>

            {showHistory && (
              <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto chat-scrollbar">
                {patchHistory.slice().reverse().map((entry, index) => (
                  <div 
                    key={entry.id}
                    className="flex items-start gap-2 px-2 py-1.5 rounded bg-white/[0.02] text-xs"
                  >
                    <span className="text-white/30 font-mono">
                      {new Date(entry.timestamp).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                    <span className="text-white/60">
                      {entry.fieldsModified.join(', ')}
                    </span>
                    {index === 0 && canUndo && (
                      <button
                        onClick={undoLastPatch}
                        className="ml-auto text-violet-400 hover:text-violet-300 transition-colors"
                        title="Annuler"
                      >
                        <Undo2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions rapides */}
        <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
          {canUndo && (
            <button
              onClick={undoLastPatch}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-white/60 hover:text-white/90 hover:bg-white/[0.05] transition-all"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Annuler
            </button>
          )}
          
          {hasDraftData && (
            <button
              onClick={resetDraft}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-white/60 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Effacer
            </button>
          )}
        </div>

        {/* Demander à l'agent */}
        <div className="pt-4 border-t border-white/[0.06]">
          <label className="flex items-center gap-2 text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            Modifier avec l&apos;agent
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskAgent()}
              placeholder="Ex: Ajoute plus de détails, change le prix..."
              className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 transition-colors"
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

      {/* Footer avec action publier */}
      <div className="px-4 py-3 border-t border-white/[0.06]">
        <button
          onClick={onPublish}
          disabled={isPublishing || !isComplete}
          className={`
            w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all
            ${isComplete
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30'
              : 'bg-white/[0.03] border border-white/[0.08] text-white/40 cursor-not-allowed'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {isPublishing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Publication...
            </>
          ) : isComplete ? (
            <>
              <Check className="w-4 h-4" />
              Publier l'annonce
            </>
          ) : (
            <>
              Complétez l&apos;annonce ({completionScore}%)
            </>
          )}
        </button>
        
        {!isComplete && (
          <p className="mt-2 text-center text-xs text-white/40">
            Ajoutez au moins un titre, une description et une catégorie
          </p>
        )}
      </div>
    </div>
  )
}

export default CreateListingView

