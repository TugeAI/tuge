'use client'

/**
 * Hook pour gérer le profil visiteur pendant l'onboarding
 * 
 * - Récupère et stocke le profil visiteur (prénom, intention, étape)
 * - Synchronise avec le backend via l'API /api/agent/onboarding
 * - Gère le session ID de manière persistante
 */

import { useState, useEffect, useCallback, useRef } from 'react'

// ============================================================================
// Types
// ============================================================================

export interface VisitorProfile {
  sessionId: string
  firstName: string | null
  intention: VisitorIntention
  currentStep: OnboardingStep
  isIntentionActive: boolean
  messageCount: number
  createdAt?: string
}

export type VisitorIntention =
  | 'acheter'
  | 'vendre'
  | 'proposer_service'
  | 'creer_revenus'
  | 'developper_reseau'
  | 'curiosite'
  | 'reflexion'
  | 'apprentissage'
  | 'comparaison'
  | 'inspiration'
  | 'unknown'

export type OnboardingStep =
  | 'accroche'
  | 'intention_detectee'
  | 'reaction_adaptee'
  | 'prenom_demande'
  | 'nurturing'
  | 'email_propose'
  | 'ancrage'
  | 'complete'

export interface UseVisitorProfileReturn {
  profile: VisitorProfile | null
  isLoading: boolean
  error: string | null
  sessionId: string
  updateProfile: (updates: Partial<Pick<VisitorProfile, 'firstName' | 'intention' | 'currentStep'>>) => Promise<void>
  refreshProfile: () => Promise<void>
  isReady: boolean
}

// ============================================================================
// Constants
// ============================================================================

const SESSION_STORAGE_KEY = 'tug_session_id'
const PROFILE_CACHE_KEY = 'tug_visitor_profile'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// ============================================================================
// Helpers
// ============================================================================

/**
 * Génère un UUID v4
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Récupère ou crée un session ID persistant
 */
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return generateUUID()
  
  let sessionId = localStorage.getItem(SESSION_STORAGE_KEY)
  if (!sessionId) {
    sessionId = generateUUID()
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId)
  }
  return sessionId
}

/**
 * Cache le profil en localStorage avec timestamp
 */
function cacheProfile(profile: VisitorProfile): void {
  if (typeof window === 'undefined') return
  
  try {
    const cacheData = {
      profile,
      timestamp: Date.now(),
    }
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cacheData))
  } catch {
    // Ignore storage errors
  }
}

/**
 * Récupère le profil du cache si encore valide
 */
function getCachedProfile(): VisitorProfile | null {
  if (typeof window === 'undefined') return null
  
  try {
    const cached = localStorage.getItem(PROFILE_CACHE_KEY)
    if (!cached) return null
    
    const { profile, timestamp } = JSON.parse(cached)
    
    // Vérifier si le cache est encore valide
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(PROFILE_CACHE_KEY)
      return null
    }
    
    return profile
  } catch {
    return null
  }
}

// ============================================================================
// Hook
// ============================================================================

export function useVisitorProfile(): UseVisitorProfileReturn {
  const [profile, setProfile] = useState<VisitorProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string>('')
  const [isReady, setIsReady] = useState(false)
  
  const mountedRef = useRef(false)
  const fetchingRef = useRef(false)

  // Initialiser le session ID au montage
  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true
    
    const sid = getOrCreateSessionId()
    setSessionId(sid)
    
    // Vérifier le cache d'abord
    const cached = getCachedProfile()
    if (cached && cached.sessionId === sid) {
      setProfile(cached)
      setIsLoading(false)
      setIsReady(true)
    }
  }, [])

  // Charger le profil depuis l'API
  const fetchProfile = useCallback(async () => {
    if (!sessionId || fetchingRef.current) return
    
    fetchingRef.current = true
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/agent/onboarding?sessionId=${sessionId}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement du profil')
      }
      
      if (data.success && data.profile) {
        const newProfile: VisitorProfile = {
          sessionId: data.profile.sessionId,
          firstName: data.profile.firstName,
          intention: data.profile.intention || 'unknown',
          currentStep: data.profile.currentStep || 'accroche',
          isIntentionActive: data.profile.isIntentionActive || false,
          messageCount: data.profile.messageCount || 0,
          createdAt: data.profile.createdAt,
        }
        setProfile(newProfile)
        cacheProfile(newProfile)
      }
    } catch (err) {
      console.error('[useVisitorProfile] Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
      setIsReady(true)
      fetchingRef.current = false
    }
  }, [sessionId])

  // Charger le profil quand le sessionId est disponible
  useEffect(() => {
    if (sessionId && !profile) {
      fetchProfile()
    }
  }, [sessionId, profile, fetchProfile])

  // Mettre à jour le profil
  const updateProfile = useCallback(async (
    updates: Partial<Pick<VisitorProfile, 'firstName' | 'intention' | 'currentStep'>>
  ) => {
    if (!sessionId) return
    
    try {
      const response = await fetch('/api/agent/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          ...updates,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour')
      }
      
      if (data.success && data.profile) {
        const updatedProfile: VisitorProfile = {
          sessionId: data.profile.sessionId,
          firstName: data.profile.firstName,
          intention: data.profile.intention || 'unknown',
          currentStep: data.profile.currentStep || 'accroche',
          isIntentionActive: data.profile.isIntentionActive || false,
          messageCount: data.profile.messageCount || 0,
        }
        setProfile(updatedProfile)
        cacheProfile(updatedProfile)
      }
    } catch (err) {
      console.error('[useVisitorProfile] Update error:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }, [sessionId])

  // Rafraîchir le profil
  const refreshProfile = useCallback(async () => {
    // Invalider le cache
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PROFILE_CACHE_KEY)
    }
    await fetchProfile()
  }, [fetchProfile])

  return {
    profile,
    isLoading,
    error,
    sessionId,
    updateProfile,
    refreshProfile,
    isReady,
  }
}

export default useVisitorProfile







