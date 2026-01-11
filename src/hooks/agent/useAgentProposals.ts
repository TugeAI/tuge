import { useState, useCallback } from 'react'
import type { PendingProposalResult } from '@/lib/supabase/types'

export interface UseAgentProposalsReturn {
  proposals: PendingProposalResult[]
  pendingProposalsCount: number
  loadProposals: () => Promise<void>
}

interface UseAgentProposalsOptions {
  isAuthenticated: boolean
}

/**
 * Hook pour gérer les propositions de l'agent
 */
export function useAgentProposals({
  isAuthenticated,
}: UseAgentProposalsOptions): UseAgentProposalsReturn {
  const [proposals, setProposals] = useState<PendingProposalResult[]>([])
  const [pendingProposalsCount, setPendingProposalsCount] = useState(0)

  const loadProposals = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const response = await fetch('/api/proposals?direction=received')
      const data = await response.json()
      if (data.success) {
        setProposals(data.proposals || [])
        setPendingProposalsCount(data.pendingCount || 0)
      }
    } catch (error) {
      console.error('Erreur chargement propositions:', error)
    }
  }, [isAuthenticated])

  return {
    proposals,
    pendingProposalsCount,
    loadProposals,
  }
}


