'use client'

import { Wallet, Coins, ArrowUpRight, ArrowDownLeft, Clock, Gift } from 'lucide-react'

type TransactionType = 'credit' | 'debit' | 'bonus'

interface Transaction {
  id: string
  type: TransactionType
  amount: number
  description: string
  timestamp: Date
}

interface WalletViewProps {
  balance?: number
  transactions?: Transaction[]
  onClaimDaily?: () => void
  canClaimDaily?: boolean
}

function getTransactionIcon(type: TransactionType) {
  switch (type) {
    case 'credit':
      return <ArrowDownLeft className="w-4 h-4" />
    case 'debit':
      return <ArrowUpRight className="w-4 h-4" />
    case 'bonus':
      return <Gift className="w-4 h-4" />
  }
}

function getTransactionColor(type: TransactionType) {
  switch (type) {
    case 'credit':
      return {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        icon: 'text-emerald-400',
        amount: 'text-emerald-400'
      }
    case 'debit':
      return {
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        icon: 'text-red-400',
        amount: 'text-red-400'
      }
    case 'bonus':
      return {
        bg: 'bg-violet-500/10',
        border: 'border-violet-500/20',
        icon: 'text-violet-400',
        amount: 'text-violet-400'
      }
  }
}

function formatTimestamp(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes} min`
  if (hours < 24) return `Il y a ${hours}h`
  if (days < 7) return `Il y a ${days}j`
  return date.toLocaleDateString('fr-FR')
}

interface TransactionItemProps {
  transaction: Transaction
}

function TransactionItem({ transaction }: TransactionItemProps) {
  const colors = getTransactionColor(transaction.type)
  const sign = transaction.type === 'debit' ? '-' : '+'

  return (
    <div className={`
      p-3 rounded-lg border transition-all duration-200
      bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]
    `}>
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={`
          w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
          ${colors.bg} border ${colors.border}
        `}>
          <div className={colors.icon}>
            {getTransactionIcon(transaction.type)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white/70 truncate">
            {transaction.description}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <Clock className="w-3 h-3 text-white/30" />
            <span className="text-[10px] text-white/30">
              {formatTimestamp(transaction.timestamp)}
            </span>
          </div>
        </div>

        {/* Amount */}
        <div className={`text-sm font-medium ${colors.amount}`}>
          {sign}{transaction.amount} crédits
        </div>
      </div>
    </div>
  )
}

// Données de démonstration
const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    type: 'bonus',
    amount: 10,
    description: 'Bonus quotidien réclamé',
    timestamp: new Date(Date.now() - 1000 * 60 * 30)
  },
  {
    id: '2',
    type: 'debit',
    amount: 5,
    description: 'Création d\'annonce avec l\'IA',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2)
  },
  {
    id: '3',
    type: 'credit',
    amount: 50,
    description: 'Achat de crédits',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24)
  },
  {
    id: '4',
    type: 'debit',
    amount: 2,
    description: 'Conversation avec l\'assistant',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
  },
  {
    id: '5',
    type: 'bonus',
    amount: 10,
    description: 'Bonus de bienvenue',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
  }
]

/**
 * WalletView - Vue du portefeuille de crédits
 * Affiche le solde et l'historique des transactions
 */
export function WalletView({
  balance = 63,
  transactions = DEMO_TRANSACTIONS,
  onClaimDaily,
  canClaimDaily = true
}: WalletViewProps) {
  return (
    <div className="h-full overflow-y-auto bg-transparent chat-scrollbar">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="pt-4 pb-2">
          <h1 className="text-xl font-bold text-white">
            Portefeuille
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Gérez vos crédits et consultez votre historique
          </p>
        </div>

        {/* Balance Card */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/10 border border-violet-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/50 mb-1">Solde disponible</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">{balance}</span>
                <span className="text-lg text-white/50">crédits</span>
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
              <Coins className="w-7 h-7 text-violet-400" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-5">
            {canClaimDaily && (
              <button
                onClick={onClaimDaily}
                className="flex-1 py-2.5 px-4 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Gift className="w-4 h-4" />
                Réclamer bonus quotidien
              </button>
            )}
            <button
              className="flex-1 py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              Acheter des crédits
            </button>
          </div>
        </div>

        {/* Transactions */}
        <div>
          <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">
            Historique
          </h2>
          {transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-7 h-7 text-white/20" />
              </div>
              <h3 className="text-base font-medium text-white/60 mb-2">
                Aucune transaction
              </h3>
              <p className="text-sm text-white/40 max-w-xs mx-auto">
                Votre historique de transactions apparaîtra ici
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WalletView

