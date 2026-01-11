import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface UseAgentAuthReturn {
  isAuthenticated: boolean | null
  userEmail: string | null
  mounted: boolean
  supabase: ReturnType<typeof createClient> | null
  handleLogout: () => Promise<void>
}

/**
 * Hook pour gérer l'authentification de l'agent
 */
export function useAgentAuth(): UseAgentAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null
    return createClient()
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!supabase || !mounted) return

    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const authenticated = !!user
      setIsAuthenticated(authenticated)
      setUserEmail(user?.email || null)
    }

    checkAuth()
  }, [supabase, mounted])

  const handleLogout = useCallback(async () => {
    if (!supabase) return
    try {
      await supabase.auth.signOut()
      if (typeof window !== 'undefined') {
        localStorage.removeItem('tug_session_id')
      }
      window.location.href = '/'
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      throw error
    }
  }, [supabase])

  return {
    isAuthenticated,
    userEmail,
    mounted,
    supabase,
    handleLogout,
  }
}


