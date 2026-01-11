'use client'

/**
 * Modal d'achat de crédits
 * 
 * Permet de sélectionner un pack ou un montant personnalisé
 * et redirige vers Stripe Checkout.
 */

import { useState } from 'react'
import { Button } from '@/components/ui'
import { BILLING, CreditPack } from '@/lib/billingConfig'

interface BuyCreditsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function BuyCreditsModal({ isOpen, onClose }: BuyCreditsModalProps) {
  const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handlePurchase = async () => {
    if (!selectedPack) {
      setError('Veuillez sélectionner un pack')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack_id: selectedPack.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création du paiement')
      }

      // Redirige vers Stripe Checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        throw new Error('URL de paiement non reçue')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-bg-secondary rounded-2xl border border-border-primary p-6 md:p-8 max-w-lg w-full animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-primary">Acheter des crédits</h2>
          <button 
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        {/* Packs */}
        <div className="space-y-3 mb-6">
          {BILLING.PACKS.map((pack) => (
            <button
              key={pack.id}
              onClick={() => setSelectedPack(pack)}
              className={`
                w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between
                ${selectedPack?.id === pack.id 
                  ? 'border-accent-primary bg-accent-subtle ring-2 ring-accent-primary/30' 
                  : 'border-border-primary bg-bg-tertiary hover:border-accent-primary/50'
                }
              `}
            >
              <div className="flex items-center gap-4">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center text-xl
                  ${pack.popular 
                    ? 'bg-gradient-to-br from-accent-primary to-pink-primary text-white' 
                    : 'bg-bg-elevated text-accent-secondary'
                  }
                `}>
                  {pack.id === 'starter_50' && '🌱'}
                  {pack.id === 'pro_500' && '⚡'}
                  {pack.id === 'business_2000' && '🚀'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">{pack.name}</span>
                    {pack.popular && (
                      <span className="px-2 py-0.5 bg-accent-primary/20 text-accent-secondary text-xs rounded-full">
                        Populaire
                      </span>
                    )}
                  </div>
                  <div className="text-text-secondary text-sm">{pack.credits} crédits</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-text-primary">{pack.price} €</div>
                <div className="text-text-muted text-xs">
                  {(pack.price / pack.credits * 100).toFixed(1)} cts/crédit
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Économies */}
        {selectedPack && selectedPack.id !== 'starter_50' && (
          <div className="mb-6 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
            💰 Vous économisez{' '}
            {Math.round((1 - (selectedPack.price / selectedPack.credits) / (BILLING.PACKS[0].price / BILLING.PACKS[0].credits)) * 100)}%
            {' '}par rapport au pack Starter !
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button 
            variant="secondary" 
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button 
            variant="primary" 
            className="flex-1"
            onClick={handlePurchase}
            disabled={!selectedPack || loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Chargement...
              </span>
            ) : (
              `Payer ${selectedPack?.price || 0} €`
            )}
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-text-muted text-xs">
          🔒 Paiement sécurisé par Stripe
        </div>
      </div>
    </div>
  )
}







