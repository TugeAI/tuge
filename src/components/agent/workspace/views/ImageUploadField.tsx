'use client'

import { useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { 
  Camera, 
  Upload, 
  X, 
  Loader2, 
  Sparkles,
  ImagePlus
} from 'lucide-react'
import type { DraftImage } from '@/stores/listing-draft-store'

interface ImageUploadFieldProps {
  images: DraftImage[]
  draftId?: string
  onImagesChange: (images: DraftImage[]) => void
  onGenerateImage?: () => void
  isGenerating?: boolean
  maxImages?: number
  isHighlighted?: boolean
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Composant de gestion des images pour les annonces
 * Support drag & drop, upload manuel et génération IA
 */
export function ImageUploadField({
  images,
  draftId,
  onImagesChange,
  onGenerateImage,
  isGenerating = false,
  maxImages = 5,
  isHighlighted = false,
}: ImageUploadFieldProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canAddMore = images.length < maxImages

  // Drag & Drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (canAddMore) {
      setIsDragging(true)
    }
  }, [canAddMore])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    if (!canAddMore) return
    
    setUploadError(null)
    const filesToUpload = Array.from(files).slice(0, maxImages - images.length)
    
    // Valider les fichiers
    const validFiles: File[] = []
    for (const file of filesToUpload) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setUploadError(`Format non supporté: ${file.type}`)
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`Fichier trop gros: ${file.name} (max 5MB)`)
        continue
      }
      validFiles.push(file)
    }

    if (validFiles.length === 0) return

    const formData = new FormData()
    for (const file of validFiles) {
      formData.append('images', file)
    }

    setIsUploading(true)
    try {
      const params = new URLSearchParams()
      if (draftId) params.set('draftId', draftId)
      params.set('position', String(images.length))

      const response = await fetch(`/api/listings/images?${params}`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      
      if (result.success && result.images) {
        const newImages: DraftImage[] = result.images.map((img: { id: string; url: string; position: number }) => ({
          id: img.id,
          url: img.url,
          isGenerated: false,
          position: img.position,
        }))
        onImagesChange([...images, ...newImages])
        setUploadError(null)
      } else {
        setUploadError(result.error || 'Erreur lors de l\'upload')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError('Erreur lors de l\'upload')
    } finally {
      setIsUploading(false)
    }
  }, [images, draftId, onImagesChange, canAddMore, maxImages])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      await uploadFiles(files)
    }
  }, [uploadFiles])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await uploadFiles(files)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [uploadFiles])

  const handleRemoveImage = useCallback(async (imageId: string) => {
    try {
      await fetch('/api/listings/images', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId }),
      })
      onImagesChange(images.filter(img => img.id !== imageId))
    } catch (error) {
      console.error('Delete error:', error)
    }
  }, [images, onImagesChange])

  return (
    <div 
      className={`
        relative px-3 py-2.5 rounded-lg border transition-all duration-300
        ${isHighlighted 
          ? 'bg-violet-500/20 border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.3)]' 
          : 'bg-white/[0.02] border-white/[0.06]'
        }
      `}
    >
      {/* Highlight glow effect */}
      {isHighlighted && (
        <div className="absolute inset-0 rounded-lg bg-violet-500/10 animate-pulse" />
      )}

      <div className="relative space-y-3">
        {/* Label */}
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 ${isHighlighted ? 'text-violet-400' : 'text-white/40'}`}>
            <Camera className="w-4 h-4" />
            <span className="text-xs font-medium">Photos</span>
          </div>
          <span className="text-xs text-white/40">
            {images.length}/{maxImages}
          </span>
        </div>

        {/* Error message */}
        {uploadError && (
          <div className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
            {uploadError}
          </div>
        )}

        {/* Grille d'images + zone d'upload */}
        <div className="grid grid-cols-5 gap-2">
          {/* Images existantes */}
          {images.map((image, index) => (
            <div
              key={image.id}
              className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group bg-black/20"
            >
              <Image
                src={image.url}
                alt={`Image ${index + 1}`}
                fill
                className="object-cover"
                sizes="100px"
              />
              {image.isGenerated && (
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[10px] font-medium bg-violet-500 text-white rounded flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  IA
                </div>
              )}
              <button
                onClick={() => handleRemoveImage(image.id)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="Supprimer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* Zone d'upload - seulement si on peut ajouter plus */}
          {canAddMore && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative aspect-square rounded-lg border-2 border-dashed cursor-pointer
                flex flex-col items-center justify-center gap-1
                transition-all duration-200
                ${isDragging 
                  ? 'border-violet-500 bg-violet-500/20' 
                  : 'border-white/20 bg-white/[0.02] hover:border-violet-500/50 hover:bg-white/[0.04]'
                }
              `}
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
              ) : (
                <>
                  <Upload className="w-5 h-5 text-white/40" />
                  <span className="text-[10px] text-white/40 text-center px-1">
                    {isDragging ? 'Déposer' : 'Ajouter'}
                  </span>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Bouton génération IA */}
        {onGenerateImage && canAddMore && (
          <button
            onClick={onGenerateImage}
            disabled={isGenerating || isUploading}
            className="w-full py-2 px-3 rounded-lg bg-violet-500/10 border border-violet-500/30 text-white/80 text-xs font-medium transition-all hover:bg-violet-500/20 hover:border-violet-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Générer une image avec l'IA
              </>
            )}
          </button>
        )}

        {/* Info */}
        <p className="text-[10px] text-white/30">
          Formats : JPEG, PNG, WebP • Max 5MB par image
        </p>
      </div>
    </div>
  )
}


