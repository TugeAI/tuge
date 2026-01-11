'use client'

import { 
  MessageSquare, 
  FileText, 
  Bell, 
  TrendingUp,
  ArrowRight
} from 'lucide-react'

interface DashboardViewProps {
  // Statistiques
  conversationsCount?: number
  listingsCount?: number
  proposalsCount?: number
  draftsCount?: number
  
  // Actions
  onStartChat?: () => void
  onCreateListing?: () => void
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  color: 'violet' | 'cyan' | 'pink' | 'emerald'
  trend?: number
}

function StatCard({ icon, label, value, color, trend }: StatCardProps) {
  const colorClasses = {
    violet: {
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20',
      icon: 'text-violet-400',
      glow: 'shadow-violet-500/20'
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      icon: 'text-cyan-400',
      glow: 'shadow-cyan-500/20'
    },
    pink: {
      bg: 'bg-pink-500/10',
      border: 'border-pink-500/20',
      icon: 'text-pink-400',
      glow: 'shadow-pink-500/20'
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      icon: 'text-emerald-400',
      glow: 'shadow-emerald-500/20'
    }
  }
  
  const c = colorClasses[color]
  
  return (
    <div className={`
      relative p-3 rounded-lg border ${c.border} ${c.bg}
      backdrop-blur-sm transition-all duration-300
      hover:shadow-lg hover:${c.glow} hover:scale-[1.02]
      group cursor-default
    `}>
      {/* Icon */}
      <div className={`
        w-8 h-8 rounded-md ${c.bg} border ${c.border}
        flex items-center justify-center mb-2
        group-hover:scale-110 transition-transform duration-300
      `}>
        <div className={c.icon}>{icon}</div>
      </div>
      
      {/* Value */}
      <div className="text-2xl font-bold text-white mb-0.5">
        {value}
      </div>
      
      {/* Label */}
      <div className="text-xs text-white/50">
        {label}
      </div>
      
      {/* Trend indicator */}
      {trend !== undefined && trend !== 0 && (
        <div className={`
          absolute top-3 right-3 flex items-center gap-1 text-xs
          ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}
        `}>
          <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
  )
}

interface ActionCardProps {
  icon: React.ReactNode
  title: string
  description: string
  onClick?: () => void
  color: 'violet' | 'cyan'
}

function ActionCard({ icon, title, description, onClick, color }: ActionCardProps) {
  const colorClasses = {
    violet: {
      gradient: 'from-violet-500/20 to-violet-600/10',
      border: 'border-violet-500/30 hover:border-violet-500/50',
      icon: 'text-violet-400',
      button: 'bg-violet-500 hover:bg-violet-600'
    },
    cyan: {
      gradient: 'from-cyan-500/20 to-cyan-600/10',
      border: 'border-cyan-500/30 hover:border-cyan-500/50',
      icon: 'text-cyan-400',
      button: 'bg-cyan-500 hover:bg-cyan-600'
    }
  }
  
  const c = colorClasses[color]
  
  return (
    <button
      onClick={onClick}
      className={`
        relative p-4 rounded-lg border ${c.border}
        bg-gradient-to-br ${c.gradient}
        backdrop-blur-sm transition-all duration-300
        hover:shadow-lg hover:scale-[1.01]
        text-left group w-full
      `}
    >
      {/* Icon */}
      <div className={`
        w-10 h-10 rounded-lg bg-white/5 border border-white/10
        flex items-center justify-center mb-3
        group-hover:scale-110 transition-transform duration-300
        ${c.icon}
      `}>
        {icon}
      </div>
      
      {/* Title */}
      <h3 className="text-base font-semibold text-white mb-0.5">
        {title}
      </h3>
      
      {/* Description */}
      <p className="text-xs text-white/50 mb-3">
        {description}
      </p>
      
      {/* Arrow */}
      <div className={`
        absolute bottom-3 right-3 w-7 h-7 rounded-full ${c.button}
        flex items-center justify-center
        group-hover:translate-x-1 transition-transform duration-300
      `}>
        <ArrowRight className="w-3.5 h-3.5 text-white" />
      </div>
    </button>
  )
}

/**
 * DashboardView - Vue principale du tableau de bord
 * Affiche les statistiques et actions rapides
 */
export function DashboardView({
  conversationsCount = 0,
  listingsCount = 0,
  proposalsCount = 0,
  draftsCount = 0,
  onStartChat,
  onCreateListing
}: DashboardViewProps) {
  return (
    <div className="h-full overflow-y-auto bg-transparent chat-scrollbar">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center pt-8 pb-4">
          <h1 className="text-2xl font-bold text-white mb-2">
            Bienvenue sur Tuge
          </h1>
          <p className="text-white/50 max-w-md mx-auto">
            Votre assistant intelligent pour gérer vos annonces et conversations
          </p>
        </div>

        {/* Stats Grid */}
        <div>
          <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">
            Aperçu
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={<MessageSquare className="w-5 h-5" />}
              label="Conversations"
              value={conversationsCount}
              color="violet"
            />
            <StatCard
              icon={<FileText className="w-5 h-5" />}
              label="Annonces"
              value={listingsCount}
              color="cyan"
            />
            <StatCard
              icon={<Bell className="w-5 h-5" />}
              label="Propositions"
              value={proposalsCount}
              color="pink"
            />
            <StatCard
              icon={<FileText className="w-5 h-5" />}
              label="Brouillons"
              value={draftsCount}
              color="emerald"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">
            Actions rapides
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ActionCard
              icon={<MessageSquare className="w-6 h-6" />}
              title="Démarrer une conversation"
              description="Posez une question à l'assistant Tug"
              onClick={onStartChat}
              color="violet"
            />
            <ActionCard
              icon={<FileText className="w-6 h-6" />}
              title="Créer une annonce"
              description="Publiez une nouvelle annonce avec l'aide de l'IA"
              onClick={onCreateListing}
              color="cyan"
            />
          </div>
        </div>

        {/* Tips section */}
        <div className="pb-8">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <h3 className="text-sm font-medium text-white/60 mb-2">
              💡 Astuce
            </h3>
            <p className="text-sm text-white/40">
              Utilisez l&apos;assistant pour créer des annonces optimisées automatiquement. 
              Il peut vous aider à rédiger des descriptions accrocheuses et suggérer les meilleurs prix.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardView

