'use client'

/**
 * Page Wallet Premium - Gestion des crédits et solde MLM
 * 
 * Design: Light mode moderne inspiré de la page Profile
 * Features: Sparkline 7j, code parrainage, stats, filtres historique
 */

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui'
import { BuyCreditsModal } from '@/components/credits/BuyCreditsModal'
import { BILLING } from '@/lib/billingConfig'
import { BRAND, getReferralLink } from '@/config/brand'

// ============================================================================
// TYPES
// ============================================================================

interface WalletData {
  paid_credits: number
  daily_free_credits: number
  total_credits: number
  can_claim_today: boolean
}

interface MlmData {
  balance_eur: number
  total_earned_eur: number
}

interface SparklinePoint {
  date: string
  consumed: number
  gained: number
  net: number
}

interface StatsData {
  sparkline: SparklinePoint[]
  totalConsumed: number
  totalGained: number
  dailyAverage: number
  trend: number
}

interface ReferralData {
  code: string | null
  referrals_count: number
}

interface LedgerEntry {
  id: string
  type: string
  amount: number
  credit_type: string
  created_at: string
  metadata: Record<string, unknown>
}

type HistoryFilter = 'all' | 'purchase' | 'consumption' | 'daily_claim' | 'mlm_commission'

// ============================================================================
// ICÔNES SVG
// ============================================================================

const CreditIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 6v12M8 10l4-4 4 4M8 14l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const GiftIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 110-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 100-5C13 2 12 7 12 7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const LightningIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const SparklesIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3v2m0 14v2M5.636 5.636l1.414 1.414m9.9 9.9l1.414 1.414M3 12h2m14 0h2M5.636 18.364l1.414-1.414m9.9-9.9l1.414-1.414" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const RocketIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09zM12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CopyIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const CheckIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const TrendUpIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23 6l-9.5 9.5-5-5L1 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 6h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const TrendDownIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23 18l-9.5-9.5-5 5L1 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 18h6v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const UsersIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const FilterIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const WalletIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 4H3a2 2 0 00-2 2v12a2 2 0 002 2h18a2 2 0 002-2V6a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="17" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

// ============================================================================
// COMPOSANT SPARKLINE
// ============================================================================

const Sparkline = ({ data, width = 120, height = 40 }: { data: SparklinePoint[]; width?: number; height?: number }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <span className="text-gray-400 text-[10px]">Pas de données</span>
      </div>
    )
  }

  const values = data.map(d => d.consumed)
  const max = Math.max(...values, 1)
  const min = 0

  const padding = 4
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  const points = values.map((value, index) => {
    const x = padding + (index / (values.length - 1)) * chartWidth
    const y = padding + chartHeight - ((value - min) / (max - min)) * chartHeight
    return `${x},${y}`
  })

  const linePath = `M ${points.join(' L ')}`
  const areaPath = `${linePath} L ${padding + chartWidth},${padding + chartHeight} L ${padding},${padding + chartHeight} Z`

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id="sparklineGradientLight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="sparklineStrokeLight" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparklineGradientLight)" />
      <path
        d={linePath}
        fill="none"
        stroke="url(#sparklineStrokeLight)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={padding + chartWidth}
        cy={padding + chartHeight - ((values[values.length - 1] - min) / (max - min)) * chartHeight}
        r="3"
        fill="#ec4899"
        className="animate-pulse"
      />
    </svg>
  )
}

// ============================================================================
// COMPOSANT SKELETON LOADING
// ============================================================================

const SkeletonLoader = () => (
  <div className="min-h-screen bg-gray-50">
    {/* Background */}
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-100/50 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-pink-100/50 rounded-full blur-[100px]" />
    </div>

    {/* Header */}
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
      <div className="container-main py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gray-200 animate-pulse" />
          <div className="w-16 h-4 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="w-16 h-8 rounded-lg bg-gray-200 animate-pulse" />
      </div>
    </header>

    <main className="relative container-main py-6 md:py-8 max-w-4xl">
      {/* Hero Skeleton */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="w-24 h-3 rounded bg-gray-200 animate-pulse mb-3" />
            <div className="w-40 h-12 rounded bg-gray-200 animate-pulse mb-4" />
            <div className="flex gap-2">
              <div className="w-24 h-6 rounded-lg bg-gray-200 animate-pulse" />
              <div className="w-24 h-6 rounded-lg bg-gray-200 animate-pulse" />
            </div>
          </div>
          <div className="w-[140px] h-[50px] rounded-xl bg-gray-100 animate-pulse" />
        </div>
        <div className="flex gap-2 mt-5 pt-5 border-t border-gray-100">
          <div className="flex-1 h-10 rounded-lg bg-gray-200 animate-pulse" />
          <div className="flex-1 h-10 rounded-lg bg-gray-200 animate-pulse" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="w-16 h-3 rounded bg-gray-200 animate-pulse mb-2" />
            <div className="w-12 h-6 rounded bg-gray-200 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Referral Skeleton */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse" />
            <div>
              <div className="w-32 h-3 rounded bg-gray-200 animate-pulse mb-2" />
              <div className="w-24 h-6 rounded bg-gray-200 animate-pulse" />
            </div>
          </div>
          <div className="w-28 h-10 rounded-lg bg-gray-200 animate-pulse" />
        </div>
      </div>

      {/* Packs Skeleton */}
      <div className="mb-6">
        <div className="w-20 h-4 rounded bg-gray-200 animate-pulse mb-4" />
        <div className="grid md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-gray-200 animate-pulse mb-3" />
              <div className="w-20 h-4 rounded bg-gray-200 animate-pulse mb-2" />
              <div className="w-32 h-3 rounded bg-gray-200 animate-pulse mb-4" />
              <div className="w-16 h-6 rounded bg-gray-200 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* History Skeleton */}
      <div>
        <div className="w-20 h-4 rounded bg-gray-200 animate-pulse mb-4" />
        <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 shadow-sm overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-200 animate-pulse" />
                <div>
                  <div className="w-24 h-3 rounded bg-gray-200 animate-pulse mb-1" />
                  <div className="w-16 h-2 rounded bg-gray-200 animate-pulse" />
                </div>
              </div>
              <div className="w-14 h-6 rounded-lg bg-gray-200 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </main>
  </div>
)

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function WalletPage() {
  const searchParams = useSearchParams()
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [mlm, setMlm] = useState<MlmData | null>(null)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [referral, setReferral] = useState<ReferralData | null>(null)
  const [history, setHistory] = useState<LedgerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all')

  // Gestion des paramètres de retour Stripe
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setSuccessMessage('Paiement réussi ! Vos crédits ont été ajoutés.')
      window.history.replaceState({}, '', '/wallet')
    }
    if (searchParams.get('canceled') === 'true') {
      setSuccessMessage('Paiement annulé.')
      window.history.replaceState({}, '', '/wallet')
    }
  }, [searchParams])

  // Charge les données du wallet
  const loadWallet = useCallback(async () => {
    try {
      const response = await fetch('/api/credits/wallet?history=true&limit=50')
      if (!response.ok) throw new Error('Erreur chargement wallet')
      
      const data = await response.json()
      setWallet(data.wallet)
      setMlm(data.mlm)
      setStats(data.stats)
      setReferral(data.referral)
      setHistory(data.history || [])
    } catch (error) {
      console.error('Erreur chargement wallet:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadWallet()
  }, [loadWallet])

  // Réclame les crédits gratuits
  const handleClaimDaily = async () => {
    setClaiming(true)
    try {
      const response = await fetch('/api/credits/claim-daily', { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        setWallet(data.wallet)
        setSuccessMessage(data.message)
      } else {
        setSuccessMessage(data.message || 'Erreur lors de la réclamation')
      }
    } catch (error) {
      console.error('Erreur claim:', error)
      setSuccessMessage('Erreur lors de la réclamation des crédits')
    } finally {
      setClaiming(false)
    }
  }

  // Copie le lien de parrainage
  const handleCopyReferralLink = async () => {
    if (!referral?.code) return
    
    try {
      await navigator.clipboard.writeText(getReferralLink(referral.code))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Erreur copie:', error)
    }
  }

  // Formate une date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Formate le type de transaction avec icône et couleur
  const formatTransactionType = (type: string) => {
    const types: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
      daily_claim: { label: 'Crédits gratuits', color: 'text-emerald-600', bgColor: 'bg-emerald-100', icon: '🎁' },
      purchase: { label: 'Achat', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: '💎' },
      consumption: { label: 'Utilisation IA', color: 'text-pink-600', bgColor: 'bg-pink-100', icon: '✨' },
      refund: { label: 'Remboursement', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: '↩️' },
      adjustment: { label: 'Ajustement', color: 'text-slate-600', bgColor: 'bg-slate-100', icon: '⚙️' },
      mlm_commission: { label: 'Commission', color: 'text-violet-600', bgColor: 'bg-violet-100', icon: '👥' },
    }
    return types[type] || { label: type, color: 'text-slate-600', bgColor: 'bg-slate-100', icon: '📝' }
  }

  // Filtre l'historique
  const filteredHistory = history.filter(entry => {
    if (historyFilter === 'all') return true
    return entry.type === historyFilter
  })

  // Calcul du prix par crédit
  const getPricePerCredit = (pack: typeof BILLING.PACKS[number]) => {
    return (pack.price / pack.credits * 100).toFixed(1)
  }

  // Filtres disponibles
  const filterOptions: { value: HistoryFilter; label: string }[] = [
    { value: 'all', label: 'Tous' },
    { value: 'purchase', label: 'Achats' },
    { value: 'consumption', label: 'Utilisation' },
    { value: 'daily_claim', label: 'Gratuits' },
    { value: 'mlm_commission', label: 'Parrainage' },
  ]

  if (loading) {
    return <SkeletonLoader />
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      {/* Background decoratif */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-100/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-pink-100/50 rounded-full blur-[100px]" />
      </div>

      {/* Header sticky */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
        <div className="container-main py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 group">
              <img src="/logo.svg" alt={BRAND.name} className="w-7 h-7" />
              <span className="text-sm font-semibold text-gray-900">{BRAND.name}</span>
            </a>
            <div className="h-4 w-px bg-gray-200" />
            <div className="flex items-center gap-1.5">
              <WalletIcon className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-500 text-xs">Wallet</span>
            </div>
          </div>
          <a href="/agent" className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Retour</span>
          </a>
        </div>
      </header>

      <main className="relative container-main py-6 md:py-8 max-w-4xl">
        {/* Message de succès */}
        {successMessage && (
          <div className="mb-6 p-3 rounded-xl bg-emerald-50 border border-emerald-200 animate-fade-in-up">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-emerald-600" />
                <p className="text-emerald-700 text-sm">{successMessage}</p>
              </div>
              <button 
                onClick={() => setSuccessMessage(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-black/5 rounded-lg"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Hero Section - Solde principal avec Sparkline */}
        <section className="mb-6 animate-fade-in-up">
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-pink-50" />
            
            <div className="relative p-5 md:p-6 border border-gray-200 rounded-2xl bg-white/60 backdrop-blur-sm shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                {/* Solde total */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditIcon className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-500 text-[11px] font-medium uppercase tracking-wider">Solde total</span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent tracking-tight">
                      {wallet?.total_credits || 0}
                    </span>
                    <span className="text-base text-gray-500">crédits</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-emerald-700 text-xs">{wallet?.daily_free_credits || 0} gratuits</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="text-blue-700 text-xs">{wallet?.paid_credits || 0} achetés</span>
                    </div>
                  </div>
                </div>

                {/* Sparkline 7 jours */}
                <div className="flex flex-col items-center gap-2">
                  <div className="px-4 py-3 rounded-xl bg-white border border-gray-200 shadow-sm">
                    <Sparkline data={stats?.sparkline || []} width={140} height={50} />
                  </div>
                  <span className="text-gray-400 text-[10px]">Consommation 7 derniers jours</span>
                </div>
              </div>

              {/* Actions rapides */}
              <div className="flex flex-col sm:flex-row gap-2 mt-5 pt-5 border-t border-gray-200">
                {wallet?.can_claim_today && (
                  <Button 
                    variant="secondary" 
                    size="sm"
                    className="flex-1 sm:flex-none gap-1.5 h-10 text-xs bg-emerald-50 hover:bg-emerald-100 border-emerald-200 hover:border-emerald-300"
                    onClick={handleClaimDaily}
                    disabled={claiming}
                  >
                    <GiftIcon className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">{claiming ? 'Réclamation...' : 'Réclamer mes crédits'}</span>
                  </Button>
                )}
                <Button 
                  variant="primary" 
                  size="sm"
                  className="flex-1 sm:flex-none gap-1.5 h-10 text-xs"
                  onClick={() => setShowBuyModal(true)}
                >
                  <LightningIcon className="w-4 h-4" />
                  Acheter des crédits
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Cards - 3 mini-cards */}
        <section className="mb-6 animate-fade-in-up stagger-1">
          <div className="grid grid-cols-3 gap-3">
            {/* Consommation semaine */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all group">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center">
                  <SparklesIcon className="w-3.5 h-3.5 text-pink-600" />
                </div>
                <span className="text-gray-500 text-[10px] uppercase tracking-wider">Cette semaine</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-semibold text-gray-900">{stats?.totalConsumed || 0}</span>
                <span className="text-gray-400 text-[10px]">crédits</span>
              </div>
            </div>

            {/* Moyenne quotidienne */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all group">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CreditIcon className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span className="text-gray-500 text-[10px] uppercase tracking-wider">Moyenne/jour</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-semibold text-gray-900">{stats?.dailyAverage || 0}</span>
                <span className="text-gray-400 text-[10px]">crédits</span>
              </div>
            </div>

            {/* Tendance */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all group">
              <div className="flex items-center gap-1.5 mb-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  (stats?.trend || 0) >= 0 ? 'bg-emerald-100' : 'bg-amber-100'
                }`}>
                  {(stats?.trend || 0) >= 0 
                    ? <TrendUpIcon className="w-3.5 h-3.5 text-emerald-600" />
                    : <TrendDownIcon className="w-3.5 h-3.5 text-amber-600" />
                  }
                </div>
                <span className="text-gray-500 text-[10px] uppercase tracking-wider">Tendance</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-xl font-semibold ${
                  (stats?.trend || 0) >= 0 ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {(stats?.trend || 0) >= 0 ? '+' : ''}{stats?.trend || 0}%
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Section Parrainage */}
        {referral?.code && (
          <section className="mb-6 animate-fade-in-up stagger-2">
            <div className="relative rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-50 via-white to-pink-50" />
              
              <div className="relative p-4 md:p-5 border border-violet-200 rounded-xl bg-white/60 backdrop-blur-sm shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-100 to-pink-100 flex items-center justify-center border border-violet-200">
                      <UsersIcon className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-gray-500 text-[10px] uppercase tracking-wider">Votre code parrain</span>
                        <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 text-[9px] font-medium border border-violet-200">
                          {referral.referrals_count} filleul{referral.referrals_count > 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="text-lg font-mono font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent tracking-wider">
                        {referral.code}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleCopyReferralLink}
                    className={`
                      flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                      ${copied 
                        ? 'bg-emerald-100 border border-emerald-300 text-emerald-700' 
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm'
                      }
                    `}
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="w-4 h-4" />
                        <span>Copié !</span>
                      </>
                    ) : (
                      <>
                        <CopyIcon className="w-4 h-4" />
                        <span>Copier le lien</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Section Packs */}
        <section className="mb-6 animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-900">Recharger</h2>
            <span className="text-gray-400 text-[10px]">Paiement sécurisé par Stripe</span>
          </div>
          
          <div className="grid md:grid-cols-3 gap-3">
            {BILLING.PACKS.map((pack, index) => (
              <button
                key={pack.id}
                onClick={() => setShowBuyModal(true)}
                className={`
                  group relative overflow-hidden rounded-xl border text-left transition-all duration-300
                  ${pack.popular 
                    ? 'border-violet-300 bg-gradient-to-br from-violet-50 via-white to-pink-50 shadow-md' 
                    : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
                  }
                  hover:shadow-lg hover:-translate-y-0.5
                `}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Badge populaire */}
                {pack.popular && (
                  <div className="absolute top-0 right-0">
                    <div className="px-2.5 py-1 bg-gradient-to-r from-violet-500 to-pink-500 text-white text-[9px] font-medium uppercase tracking-wider rounded-bl-lg">
                      Populaire
                    </div>
                  </div>
                )}

                {/* Contenu */}
                <div className="p-4">
                  {/* Icône */}
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-transform group-hover:scale-105
                    ${pack.popular 
                      ? 'bg-gradient-to-br from-violet-500 to-pink-500' 
                      : 'bg-gray-100 border border-gray-200'
                    }
                  `}>
                    {pack.id === 'starter_50' && <SparklesIcon className={`w-5 h-5 ${pack.popular ? 'text-white' : 'text-gray-500'}`} />}
                    {pack.id === 'pro_500' && <LightningIcon className={`w-5 h-5 ${pack.popular ? 'text-white' : 'text-gray-500'}`} />}
                    {pack.id === 'business_2000' && <RocketIcon className={`w-5 h-5 ${pack.popular ? 'text-white' : 'text-gray-500'}`} />}
                  </div>

                  {/* Nom et description */}
                  <h3 className="text-sm font-semibold text-gray-900 mb-0.5">{pack.name}</h3>
                  <p className="text-gray-500 text-[10px] mb-3">{pack.description}</p>

                  {/* Crédits */}
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className={`text-2xl font-bold ${pack.popular ? 'bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent' : 'text-gray-900'}`}>
                      {pack.credits}
                    </span>
                    <span className="text-gray-500 text-xs">crédits</span>
                  </div>

                  {/* Prix */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-200">
                    <div>
                      <span className="text-base font-semibold text-gray-900">{pack.price} €</span>
                      <span className="text-gray-400 text-[10px] ml-1">({getPricePerCredit(pack)}c/cr)</span>
                    </div>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-50 group-hover:bg-gray-100 transition-all border border-gray-200">
                      <svg className="w-4 h-4 text-gray-400 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Section MLM */}
        {mlm && mlm.total_earned_eur > 0 && (
          <section className="mb-6 animate-fade-in-up stagger-3">
            <div className="relative rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-50 via-white to-violet-50" />
              
              <div className="relative p-4 md:p-5 border border-pink-200 rounded-xl bg-white/60 backdrop-blur-sm shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-medium text-gray-900">Gains de parrainage</h2>
                    <p className="text-gray-500 text-[10px]">Programme MLM</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {/* Solde disponible */}
                  <div className="p-3 rounded-lg bg-white border border-gray-200 shadow-sm">
                    <div className="text-gray-500 text-[10px] mb-1">Solde disponible</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-semibold text-pink-600">{mlm.balance_eur.toFixed(2)}</span>
                      <span className="text-gray-500 text-xs">€</span>
                    </div>
                    {mlm.balance_eur >= 10 && (
                      <Button variant="secondary" size="sm" className="mt-2 gap-1 h-8 text-[10px]">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Retirer
                      </Button>
                    )}
                  </div>

                  {/* Total gagné */}
                  <div className="p-3 rounded-lg bg-white border border-gray-200 shadow-sm">
                    <div className="text-gray-500 text-[10px] mb-1">Total gagné</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-semibold text-gray-900">{mlm.total_earned_eur.toFixed(2)}</span>
                      <span className="text-gray-500 text-xs">€</span>
                    </div>
                    <p className="text-gray-400 text-[10px] mt-1">Depuis le début</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Section Historique avec Filtres */}
        <section className="animate-fade-in-up stagger-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-medium text-gray-900">Historique</h2>
              {history.length > 0 && (
                <span className="text-gray-400 text-[10px]">{filteredHistory.length} transaction{filteredHistory.length > 1 ? 's' : ''}</span>
              )}
            </div>
            
            {/* Filtres */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              <FilterIcon className="w-3.5 h-3.5 text-gray-400 mr-1 flex-shrink-0" />
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setHistoryFilter(option.value)}
                  className={`
                    px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all whitespace-nowrap
                    ${historyFilter === option.value
                      ? 'bg-violet-100 text-violet-700 border border-violet-200'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
            {filteredHistory.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">
                  {historyFilter === 'all' ? 'Aucune transaction' : 'Aucune transaction de ce type'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredHistory.map((entry, index) => {
                  const typeInfo = formatTransactionType(entry.type)
                  return (
                    <div 
                      key={entry.id} 
                      className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors group"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        {/* Icône */}
                        <div className={`w-9 h-9 rounded-lg ${typeInfo.bgColor} flex items-center justify-center text-sm`}>
                          {typeInfo.icon}
                        </div>
                        {/* Détails */}
                        <div>
                          <div className={`text-xs font-medium ${typeInfo.color}`}>{typeInfo.label}</div>
                          <div className="text-gray-400 text-[10px]">{formatDate(entry.created_at)}</div>
                        </div>
                      </div>
                      {/* Montant */}
                      <div className={`
                        px-2.5 py-1 rounded-lg font-mono text-xs font-medium
                        ${entry.amount >= 0 
                          ? 'text-emerald-700 bg-emerald-100' 
                          : 'text-pink-700 bg-pink-100'
                        }
                      `}>
                        {entry.amount >= 0 ? '+' : ''}{entry.amount}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-gray-400 text-[10px]">
            🔒 Paiements sécurisés • Crédits sans expiration
          </p>
        </div>
      </main>

      {/* Modal d'achat */}
      <BuyCreditsModal 
        isOpen={showBuyModal} 
        onClose={() => setShowBuyModal(false)} 
      />
    </div>
  )
}
