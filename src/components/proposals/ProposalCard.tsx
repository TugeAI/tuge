'use client'

/**
 * ProposalCard - Carte de proposition inter-agents
 * 
 * Affiche une proposition dans le chat avec :
 * - Informations sur l'émetteur/destinataire
 * - Type et contenu de la proposition
 * - Timer d'expiration
 * - Boutons d'action (accept/reject/cancel)
 */

import { useState, useEffect, useCallback } from 'react'
import type { ProposalType, ProposalStatus, PendingProposalResult } from '@/lib/supabase/types'

// ============================================================================
// Types
// ============================================================================

interface ProposalCardProps {
  proposal: PendingProposalResult
  isRecipient: boolean
  onAccept?: (id: string) => Promise<void>
  onReject?: (id: string) => Promise<void>
  onCancel?: (id: string) => Promise<void>
}

// ============================================================================
// Utilitaires
// ============================================================================

/**
 * Formate le temps restant en texte lisible
 */
function formatTimeRemaining(expiresAt: string): string {
  const now = new Date()
  const expires = new Date(expiresAt)
  const diffMs = expires.getTime() - now.getTime()
  
  if (diffMs <= 0) return 'Expiré'
  
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffDays > 0) return `${diffDays}j restant${diffDays > 1 ? 's' : ''}`
  if (diffHours > 0) return `${diffHours}h restante${diffHours > 1 ? 's' : ''}`
  if (diffMins > 0) return `${diffMins}min restante${diffMins > 1 ? 's' : ''}`
  return 'Moins d\'1 min'
}

/**
 * Retourne les informations d'affichage pour un type de proposition
 */
function getProposalTypeInfo(type: ProposalType): { label: string; icon: React.ReactNode; color: string } {
  switch (type) {
    case 'service_proposal':
      return {
        label: 'Proposition de service',
        icon: <Icons.Briefcase />,
        color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      }
    case 'collaboration_request':
      return {
        label: 'Demande de collaboration',
        icon: <Icons.Users />,
        color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
      }
    case 'info_share':
      return {
        label: 'Partage d\'information',
        icon: <Icons.Info />,
        color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      }
    default:
      return {
        label: 'Proposition',
        icon: <Icons.Message />,
        color: 'text-gray-500 bg-gray-500/10 border-gray-500/20',
      }
  }
}

// ============================================================================
// Icônes
// ============================================================================

const Icons = {
  Briefcase: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Users: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Info: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Message: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  X: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Robot: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 01-.659 1.591L19 14.5m-4.25-11.396c.251.023.501.05.75.082M12 3c2.485 0 4.5 4.03 4.5 9s-2.015 9-4.5 9-4.5-4.03-4.5-9 2.015-9 4.5-9z" />
    </svg>
  ),
  ArrowRight: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  ),
}

// ============================================================================
// Composant Principal
// ============================================================================

export function ProposalCard({
  proposal,
  isRecipient,
  onAccept,
  onReject,
  onCancel,
}: ProposalCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [loading, setLoading] = useState<'accept' | 'reject' | 'cancel' | null>(null)
  
  const typeInfo = getProposalTypeInfo(proposal.type)

  // Mettre à jour le timer toutes les minutes
  useEffect(() => {
    const updateTimer = () => {
      setTimeRemaining(formatTimeRemaining(proposal.expires_at))
    }
    
    updateTimer()
    const interval = setInterval(updateTimer, 60000)
    
    return () => clearInterval(interval)
  }, [proposal.expires_at])

  // Handlers d'actions
  const handleAccept = useCallback(async () => {
    if (!onAccept || loading) return
    setLoading('accept')
    try {
      await onAccept(proposal.id)
    } finally {
      setLoading(null)
    }
  }, [proposal.id, onAccept, loading])

  const handleReject = useCallback(async () => {
    if (!onReject || loading) return
    setLoading('reject')
    try {
      await onReject(proposal.id)
    } finally {
      setLoading(null)
    }
  }, [proposal.id, onReject, loading])

  const handleCancel = useCallback(async () => {
    if (!onCancel || loading) return
    setLoading('cancel')
    try {
      await onCancel(proposal.id)
    } finally {
      setLoading(null)
    }
  }, [proposal.id, onCancel, loading])

  // Extraire un résumé du payload pour l'affichage
  const payloadSummary = proposal.payload && typeof proposal.payload === 'object'
    ? Object.entries(proposal.payload as Record<string, unknown>)
        .slice(0, 3)
        .map(([key, value]) => `${key}: ${String(value).substring(0, 50)}`)
        .join(' • ')
    : null

  return (
    <div className="flex gap-3 py-4 px-4 md:px-6 animate-fade-in">
      {/* Avatar de l'agent émetteur */}
      <div className="flex-shrink-0">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeInfo.color}`}>
          <Icons.Robot />
        </div>
      </div>

      {/* Contenu de la proposition */}
      <div className="flex-1 min-w-0">
        {/* Header avec type et timer */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${typeInfo.color}`}>
              {typeInfo.icon}
              {typeInfo.label}
            </span>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <Icons.Clock />
            <span>{timeRemaining}</span>
          </div>
        </div>

        {/* Émetteur et destinataire */}
        <div className="flex items-center gap-2 text-xs text-text-secondary mb-2">
          <span className="font-medium">{proposal.from_agent_name}</span>
          <Icons.ArrowRight />
          <span className="font-medium">{proposal.to_agent_name}</span>
        </div>

        {/* Carte de contenu */}
        <div className="rounded-xl border-2 border-dashed border-accent-primary/30 bg-accent-primary/5 p-3">
          {/* Message optionnel */}
          {proposal.message && (
            <p className="text-sm text-text-primary mb-2">
              {proposal.message}
            </p>
          )}

          {/* Résumé du payload */}
          {payloadSummary && (
            <p className="text-xs text-text-muted font-mono bg-bg-tertiary rounded px-2 py-1">
              {payloadSummary}
            </p>
          )}

          {/* Message si pas de contenu */}
          {!proposal.message && !payloadSummary && (
            <p className="text-sm text-text-muted italic">
              Proposition sans détails supplémentaires
            </p>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center gap-2 mt-3">
          {isRecipient ? (
            // Actions pour le destinataire
            <>
              <button
                onClick={handleAccept}
                disabled={loading !== null}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                           bg-emerald-500 text-white text-sm font-medium
                           hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors"
              >
                {loading === 'accept' ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Icons.Check />
                )}
                <span>Accepter</span>
              </button>
              
              <button
                onClick={handleReject}
                disabled={loading !== null}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                           bg-bg-tertiary text-text-secondary text-sm font-medium
                           hover:bg-red-500/10 hover:text-red-500 
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors"
              >
                {loading === 'reject' ? (
                  <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : (
                  <Icons.X />
                )}
                <span>Refuser</span>
              </button>
            </>
          ) : (
            // Action pour l'émetteur
            <button
              onClick={handleCancel}
              disabled={loading !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                         bg-bg-tertiary text-text-muted text-sm font-medium
                         hover:bg-red-500/10 hover:text-red-500 
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
            >
              {loading === 'cancel' ? (
                <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
              ) : (
                <Icons.X />
              )}
              <span>Annuler</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Export par défaut et types
// ============================================================================

export default ProposalCard
export type { ProposalCardProps }







