'use client'

import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect, useState } from 'react'

// ============================================================================
// Types
// ============================================================================

/**
 * Catégories d'annonces disponibles
 */
export type ListingCategory = 'service' | 'product' | 'job' | 'other'

/**
 * Types de prix
 */
export type PriceType = 'fixed' | 'hourly' | 'negotiable' | 'free'

/**
 * Image d'un brouillon
 */
export interface DraftImage {
  id: string
  url: string
  position: number
  isGenerated: boolean
}

/**
 * Interface du Patch - mise à jour partielle du brouillon
 */
export interface ListingPatch {
  title?: string
  description?: string
  category?: ListingCategory
  price?: number | null
  priceType?: PriceType
  location?: string | null
}

/**
 * État complet du brouillon
 */
export interface ListingDraftState {
  id?: string
  title: string
  description: string
  category: ListingCategory | null
  price: number | null
  priceType: PriceType
  location: string | null
  images: DraftImage[]
}

/**
 * Entrée de log pour un patch
 */
export interface PatchLogEntry {
  id: string
  timestamp: number
  patch: ListingPatch
  fieldsModified: string[]
  previousValues: Partial<ListingDraftState>
}

/**
 * État global du store
 */
interface StoreState {
  draft: ListingDraftState
  patchHistory: PatchLogEntry[]
  recentlyModifiedFields: Set<string>
}

// ============================================================================
// Actions
// ============================================================================

type StoreAction =
  | { type: 'APPLY_PATCH'; patch: ListingPatch }
  | { type: 'UNDO_LAST_PATCH' }
  | { type: 'RESET_DRAFT' }
  | { type: 'SET_DRAFT_ID'; id: string }
  | { type: 'CLEAR_RECENTLY_MODIFIED'; fields: string[] }
  | { type: 'ADD_IMAGES'; images: DraftImage[] }
  | { type: 'REMOVE_IMAGE'; imageId: string }
  | { type: 'REORDER_IMAGES'; imageIds: string[] }

// ============================================================================
// Initial State
// ============================================================================

const initialDraftState: ListingDraftState = {
  id: undefined,
  title: '',
  description: '',
  category: null,
  price: null,
  priceType: 'negotiable',
  location: null,
  images: [],
}

const initialStoreState: StoreState = {
  draft: initialDraftState,
  patchHistory: [],
  recentlyModifiedFields: new Set(),
}

// ============================================================================
// Reducer
// ============================================================================

function generatePatchId(): string {
  return `patch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

function getModifiedFields(patch: ListingPatch): string[] {
  return Object.keys(patch).filter(key => patch[key as keyof ListingPatch] !== undefined)
}

function getPreviousValues(draft: ListingDraftState, fields: string[]): Partial<ListingDraftState> {
  const previous: Partial<ListingDraftState> = {}
  for (const field of fields) {
    previous[field as keyof ListingDraftState] = draft[field as keyof ListingDraftState] as any
  }
  return previous
}

function storeReducer(state: StoreState, action: StoreAction): StoreState {
  switch (action.type) {
    case 'APPLY_PATCH': {
      const { patch } = action
      const fieldsModified = getModifiedFields(patch)
      
      if (fieldsModified.length === 0) {
        return state
      }

      const previousValues = getPreviousValues(state.draft, fieldsModified)

      const logEntry: PatchLogEntry = {
        id: generatePatchId(),
        timestamp: Date.now(),
        patch,
        fieldsModified,
        previousValues,
      }

      const newDraft: ListingDraftState = {
        ...state.draft,
        ...(patch.title !== undefined && { title: patch.title }),
        ...(patch.description !== undefined && { description: patch.description }),
        ...(patch.category !== undefined && { category: patch.category }),
        ...(patch.price !== undefined && { price: patch.price }),
        ...(patch.priceType !== undefined && { priceType: patch.priceType }),
        ...(patch.location !== undefined && { location: patch.location }),
      }

      const newRecentlyModified = new Set(state.recentlyModifiedFields)
      fieldsModified.forEach(field => newRecentlyModified.add(field))

      console.log('[ListingDraftStore] Patch applied:', {
        patch,
        fieldsModified,
        timestamp: logEntry.timestamp,
      })

      return {
        ...state,
        draft: newDraft,
        patchHistory: [...state.patchHistory, logEntry],
        recentlyModifiedFields: newRecentlyModified,
      }
    }

    case 'UNDO_LAST_PATCH': {
      if (state.patchHistory.length === 0) {
        console.log('[ListingDraftStore] No patch to undo')
        return state
      }

      const lastPatch = state.patchHistory[state.patchHistory.length - 1]
      const newDraft = { ...state.draft }

      // Restore previous values
      for (const [key, value] of Object.entries(lastPatch.previousValues)) {
        (newDraft as any)[key] = value
      }

      console.log('[ListingDraftStore] Undo patch:', {
        patchId: lastPatch.id,
        restoredFields: Object.keys(lastPatch.previousValues),
      })

      return {
        ...state,
        draft: newDraft,
        patchHistory: state.patchHistory.slice(0, -1),
        recentlyModifiedFields: new Set(Object.keys(lastPatch.previousValues)),
      }
    }

    case 'RESET_DRAFT': {
      console.log('[ListingDraftStore] Draft reset')
      return {
        ...initialStoreState,
        recentlyModifiedFields: new Set(),
      }
    }

    case 'SET_DRAFT_ID': {
      return {
        ...state,
        draft: {
          ...state.draft,
          id: action.id,
        },
      }
    }

    case 'CLEAR_RECENTLY_MODIFIED': {
      const newRecentlyModified = new Set(state.recentlyModifiedFields)
      action.fields.forEach(field => newRecentlyModified.delete(field))
      return {
        ...state,
        recentlyModifiedFields: newRecentlyModified,
      }
    }

    case 'ADD_IMAGES': {
      const newImages = [...state.draft.images, ...action.images]
      const newRecentlyModified = new Set(state.recentlyModifiedFields)
      newRecentlyModified.add('images')
      
      console.log('[ListingDraftStore] Images added:', action.images.length)
      
      return {
        ...state,
        draft: {
          ...state.draft,
          images: newImages,
        },
        recentlyModifiedFields: newRecentlyModified,
      }
    }

    case 'REMOVE_IMAGE': {
      const newImages = state.draft.images.filter(img => img.id !== action.imageId)
      const newRecentlyModified = new Set(state.recentlyModifiedFields)
      newRecentlyModified.add('images')
      
      console.log('[ListingDraftStore] Image removed:', action.imageId)
      
      return {
        ...state,
        draft: {
          ...state.draft,
          images: newImages,
        },
        recentlyModifiedFields: newRecentlyModified,
      }
    }

    case 'REORDER_IMAGES': {
      const imageMap = new Map(state.draft.images.map(img => [img.id, img]))
      const newImages = action.imageIds
        .map((id, index) => {
          const img = imageMap.get(id)
          return img ? { ...img, position: index } : null
        })
        .filter((img): img is DraftImage => img !== null)
      
      console.log('[ListingDraftStore] Images reordered')
      
      return {
        ...state,
        draft: {
          ...state.draft,
          images: newImages,
        },
      }
    }

    default:
      return state
  }
}

// ============================================================================
// Context
// ============================================================================

interface ListingDraftContextValue {
  /** État actuel du brouillon */
  draft: ListingDraftState
  /** Historique des patches */
  patchHistory: PatchLogEntry[]
  /** Champs modifiés récemment (pour le highlight) */
  recentlyModifiedFields: Set<string>
  /** Applique un patch au brouillon */
  applyListingPatch: (patch: ListingPatch) => void
  /** Annule le dernier patch */
  undoLastPatch: () => void
  /** Remet à zéro le brouillon */
  resetDraft: () => void
  /** Définit l'ID du brouillon */
  setDraftId: (id: string) => void
  /** Vérifie si un champ a été modifié récemment */
  isFieldRecentlyModified: (field: string) => boolean
  /** Indique si le brouillon a des données */
  hasDraftData: boolean
  /** Nombre de patches appliqués */
  patchCount: number
  /** Indique si on peut annuler */
  canUndo: boolean
  /** Ajoute des images au brouillon */
  addImages: (images: DraftImage[]) => void
  /** Supprime une image du brouillon */
  removeImage: (imageId: string) => void
  /** Réordonne les images */
  reorderImages: (imageIds: string[]) => void
}

const ListingDraftContext = createContext<ListingDraftContextValue | null>(null)

// ============================================================================
// Provider
// ============================================================================

interface ListingDraftProviderProps {
  children: React.ReactNode
}

export function ListingDraftProvider({ children }: ListingDraftProviderProps) {
  const [state, dispatch] = useReducer(storeReducer, initialStoreState)
  
  // Timer refs pour le clear des highlights
  const highlightTimers = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Clear highlights après 1.5s
  useEffect(() => {
    const fieldsToTrack = Array.from(state.recentlyModifiedFields)
    
    fieldsToTrack.forEach(field => {
      // Clear existing timer for this field
      const existingTimer = highlightTimers.current.get(field)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      // Set new timer
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEAR_RECENTLY_MODIFIED', fields: [field] })
        highlightTimers.current.delete(field)
      }, 1500)

      highlightTimers.current.set(field, timer)
    })

    return () => {
      // Cleanup on unmount
      highlightTimers.current.forEach(timer => clearTimeout(timer))
    }
  }, [state.recentlyModifiedFields])

  const applyListingPatch = useCallback((patch: ListingPatch) => {
    dispatch({ type: 'APPLY_PATCH', patch })
  }, [])

  const undoLastPatch = useCallback(() => {
    dispatch({ type: 'UNDO_LAST_PATCH' })
  }, [])

  const resetDraft = useCallback(() => {
    dispatch({ type: 'RESET_DRAFT' })
  }, [])

  const setDraftId = useCallback((id: string) => {
    dispatch({ type: 'SET_DRAFT_ID', id })
  }, [])

  const isFieldRecentlyModified = useCallback((field: string): boolean => {
    return state.recentlyModifiedFields.has(field)
  }, [state.recentlyModifiedFields])

  const addImages = useCallback((images: DraftImage[]) => {
    dispatch({ type: 'ADD_IMAGES', images })
  }, [])

  const removeImage = useCallback((imageId: string) => {
    dispatch({ type: 'REMOVE_IMAGE', imageId })
  }, [])

  const reorderImages = useCallback((imageIds: string[]) => {
    dispatch({ type: 'REORDER_IMAGES', imageIds })
  }, [])

  const hasDraftData = Boolean(
    state.draft.title || 
    state.draft.description || 
    state.draft.category || 
    state.draft.price !== null ||
    state.draft.images.length > 0
  )

  const value: ListingDraftContextValue = {
    draft: state.draft,
    patchHistory: state.patchHistory,
    recentlyModifiedFields: state.recentlyModifiedFields,
    applyListingPatch,
    undoLastPatch,
    resetDraft,
    setDraftId,
    isFieldRecentlyModified,
    hasDraftData,
    patchCount: state.patchHistory.length,
    canUndo: state.patchHistory.length > 0,
    addImages,
    removeImage,
    reorderImages,
  }

  return (
    <ListingDraftContext.Provider value={value}>
      {children}
    </ListingDraftContext.Provider>
  )
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook pour accéder au store ListingDraft
 */
export function useListingDraft(): ListingDraftContextValue {
  const context = useContext(ListingDraftContext)
  
  if (!context) {
    throw new Error('useListingDraft must be used within a ListingDraftProvider')
  }
  
  return context
}

/**
 * Hook pour vérifier si le provider est disponible
 */
export function useListingDraftOptional(): ListingDraftContextValue | null {
  return useContext(ListingDraftContext)
}

