'use client'

/**
 * Modal d'achat de crédits
 *
 * TEMPORAIREMENT DÉSACTIVÉ - Les paiements Stripe ne sont pas encore configurés
 */

import { Button } from '@/components/ui'

interface BuyCreditsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function BuyCreditsModal({ isOpen, onClose }: BuyCreditsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Paiements bientôt disponibles
          </h3>

          <p className="text-gray-600 mb-6">
            Le système de paiement est actuellement en cours de configuration.
            Vous pourrez bientôt acheter des crédits directement depuis cette interface.
          </p>

          <Button
            onClick={onClose}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white"
          >
            Compris
          </Button>
        </div>
      </div>
    </div>
  )
}
