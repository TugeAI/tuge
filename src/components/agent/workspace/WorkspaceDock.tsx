'use client'

import { X, ListChecks, Database, Zap, Terminal, FileText, Package, Search, PlusCircle } from 'lucide-react'
import type { WorkspaceView, WorkspaceActions, DraftViewData, PlanStep, LogEntry } from './types'
import { PlanView, DataView, ActionsView, LogsView, DraftView, CreateListingView, EmptyView } from './views'

interface WorkspaceDockProps {
  views: WorkspaceView[]
  activeViewId: string | null
  onCloseView: (viewId: string) => void
  onSetActiveView: (viewId: string) => void
  onOpenView: WorkspaceActions['openView']
  // Données pour les vues
  planSteps?: PlanStep[]
  logs?: LogEntry[]
  draftsCount?: number
  listingsCount?: number
  // Callbacks
  onQuickAction?: (action: string) => void
  onPublishDraft?: () => void
  onAskAgentAboutDraft?: (question: string) => void
  isPublishingDraft?: boolean
  hasActiveDraft?: boolean
}

/**
 * Icônes pour les types de vues
 */
const VIEW_ICONS: Record<string, React.ReactNode> = {
  plan: <ListChecks className="w-3.5 h-3.5" />,
  data: <Database className="w-3.5 h-3.5" />,
  actions: <Zap className="w-3.5 h-3.5" />,
  logs: <Terminal className="w-3.5 h-3.5" />,
  draft: <FileText className="w-3.5 h-3.5" />,
  'create-listing': <PlusCircle className="w-3.5 h-3.5" />,
  listing: <Package className="w-3.5 h-3.5" />,
  search: <Search className="w-3.5 h-3.5" />,
}

/**
 * WorkspaceDock - Panel de vues dynamiques
 * 
 * Remplace l'ancien AgentContextPanel.
 * Gère des vues ouvertes/fermables, pilotées par l'agent ou l'utilisateur.
 */
export function WorkspaceDock({
  views,
  activeViewId,
  onCloseView,
  onSetActiveView,
  onOpenView,
  planSteps,
  logs,
  draftsCount = 0,
  listingsCount = 0,
  onQuickAction,
  onPublishDraft,
  onAskAgentAboutDraft,
  isPublishingDraft,
  hasActiveDraft,
}: WorkspaceDockProps) {
  const activeView = views.find(v => v.id === activeViewId)

  // Render le contenu de la vue active
  const renderViewContent = () => {
    if (!activeView) {
      return (
        <EmptyView
          onOpenPlan={() => onOpenView({ type: 'plan', title: 'Plan', closable: true })}
          onOpenActions={() => onOpenView({ type: 'actions', title: 'Actions', closable: true })}
        />
      )
    }

    switch (activeView.type) {
      case 'plan':
        return <PlanView steps={planSteps} />
      
      case 'data':
        return (
          <DataView 
            draftsCount={draftsCount} 
            listingsCount={listingsCount}
            onViewDrafts={() => onQuickAction?.('view_drafts')}
            onViewListings={() => onQuickAction?.('view_listings')}
          />
        )
      
      case 'actions':
        return (
          <ActionsView 
            onAction={onQuickAction} 
            hasActiveDraft={hasActiveDraft}
          />
        )
      
      case 'logs':
        return <LogsView logs={logs} />
      
      case 'draft':
        const draftData = activeView.data as DraftViewData
        return (
          <DraftView
            draft={draftData}
            onPublish={onPublishDraft}
            onAskAgent={onAskAgentAboutDraft}
            isPublishing={isPublishingDraft}
          />
        )
      
      case 'create-listing':
        return (
          <CreateListingView
            onPublish={onPublishDraft}
            onAskAgent={onAskAgentAboutDraft}
            isPublishing={isPublishingDraft}
          />
        )
      
      default:
        return (
          <div className="flex items-center justify-center h-full text-white/40 text-sm">
            Vue non implémentée: {activeView.type}
          </div>
        )
    }
  }

  return (
    <div className="flex flex-col h-full bg-[rgba(12,12,18,0.95)]">
      {/* Tabs */}
      {views.length > 0 && (
        <div className="flex items-center border-b border-white/[0.06] overflow-x-auto scrollbar-hide">
          {views.map((view) => {
            const isActive = view.id === activeViewId
            const icon = view.icon || VIEW_ICONS[view.type]
            
            return (
              <div
                key={view.id}
                className={`
                  group relative flex items-center gap-1.5 px-3 py-2.5 min-w-0
                  cursor-pointer select-none transition-all
                  ${isActive 
                    ? 'bg-white/[0.03] border-b-2 border-violet-500' 
                    : 'hover:bg-white/[0.02] border-b-2 border-transparent'
                  }
                `}
                onClick={() => onSetActiveView(view.id)}
              >
                {/* Icon */}
                <span className={`flex-shrink-0 ${isActive ? 'text-violet-400' : 'text-white/40'}`}>
                  {icon}
                </span>
                
                {/* Title */}
                <span className={`text-xs font-medium truncate max-w-[100px] ${
                  isActive ? 'text-white/90' : 'text-white/50'
                }`}>
                  {view.title}
                </span>
                
                {/* Close button */}
                {view.closable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onCloseView(view.id)
                    }}
                    className={`
                      flex-shrink-0 p-0.5 rounded
                      opacity-0 group-hover:opacity-100
                      text-white/30 hover:text-white/70 hover:bg-white/10
                      transition-all
                    `}
                    aria-label={`Fermer ${view.title}`}
                    title={`Fermer ${view.title}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {renderViewContent()}
      </div>
    </div>
  )
}

export default WorkspaceDock

