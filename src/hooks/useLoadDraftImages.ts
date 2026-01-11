import { useEffect } from 'react'
import { useListingDraft, type DraftImage } from '@/stores/listing-draft-store'

/**
 * Hook pour charger les images d'un brouillon depuis l'API
 * Synchronise automatiquement le store avec la base de données
 */
export function useLoadDraftImages(draftId?: string) {
  const { addImages, draft } = useListingDraft()

  useEffect(() => {
    // Ne charger que si on a un draftId et que le store n'a pas déjà d'images
    if (!draftId || draft.images.length > 0) return

    let cancelled = false

    async function loadImages() {
      try {
        const response = await fetch(`/api/listings/images?draftId=${draftId}`)
        const result = await response.json()

        if (cancelled) return

        if (result.success && result.images && result.images.length > 0) {
          const images: DraftImage[] = result.images.map((img: any) => ({
            id: img.id,
            url: img.url,
            position: img.position,
            isGenerated: img.isGenerated,
          }))
          addImages(images)
        }
      } catch (error) {
        console.error('[useLoadDraftImages] Error loading images:', error)
      }
    }

    loadImages()

    return () => {
      cancelled = true
    }
  }, [draftId, draft.images.length, addImages])
}


