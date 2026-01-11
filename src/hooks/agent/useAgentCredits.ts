import { useState, useCallback } from 'react'

export interface CreditWallet {
  free: number
  paid: number
  total: number
  canClaim: boolean
}

export interface UseAgentCreditsReturn {
  credits: CreditWallet | null
  claimingCredits: boolean
  loadCredits: () => Promise<void>
  handleClaimDaily: () => Promise<void>
  setCredits: (credits: CreditWallet) => void
}

interface UseAgentCreditsOptions {
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

/**
 * Hook pour gérer les crédits de l'agent
 */
export function useAgentCredits({
  onSuccess,
  onError,
}: UseAgentCreditsOptions = {}): UseAgentCreditsReturn {
  const [credits, setCredits] = useState<CreditWallet | null>(null)
  const [claimingCredits, setClaimingCredits] = useState(false)

  const loadCredits = useCallback(async () => {
    try {
      const response = await fetch('/api/credits/wallet')
      if (!response.ok) return
      const data = await response.json()
      setCredits({
        free: data.wallet.daily_free_credits,
        paid: data.wallet.paid_credits,
        total: data.wallet.total_credits,
        canClaim: data.wallet.can_claim_today,
      })
    } catch (error) {
      console.error('Erreur chargement crédits:', error)
    }
  }, [])

  const handleClaimDaily = useCallback(async () => {
    setClaimingCredits(true)
    try {
      const response = await fetch('/api/credits/claim-daily', { method: 'POST' })
      const data = await response.json()
      if (data.success) {
        setCredits({
          free: data.wallet.daily_free_credits,
          paid: data.wallet.paid_credits,
          total: data.wallet.total_credits,
          canClaim: false,
        })
        onSuccess?.(data.message)
      } else {
        onError?.(data.message || 'Erreur')
      }
    } catch (error) {
      console.error('Erreur claim:', error)
      onError?.('Erreur lors de la réclamation')
    } finally {
      setClaimingCredits(false)
    }
  }, [onSuccess, onError])

  return {
    credits,
    claimingCredits,
    loadCredits,
    handleClaimDaily,
    setCredits,
  }
}


