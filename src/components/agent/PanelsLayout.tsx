'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Home, MessageSquare, Bell, Wallet } from 'lucide-react'
import { PanelsToolbar } from './PanelsToolbar'
import { ConversationHistoryPanel } from './ConversationHistoryPanel'
import { AgentChatPanel } from './AgentChatPanel'
import { DashboardView } from './DashboardView'
import { NotificationsView } from './NotificationsView'
import { WalletView } from './WalletView'
import { WorkspaceDock } from './workspace'
import { AppMenuPanel } from './AppMenuPanel'
import type { Conversation } from '@/lib/supabase/types'
import type { DraftData } from '@/types/draft'
import type { 
  LocalMessage, 
  ThinkingState, 
  ThinkingSectionsState, 
  CreditInfo, 
  Attachment 
} from './types'
import type { 
  WorkspaceView, 
  ViewType, 
  PlanStep, 
  LogEntry,
} from './workspace/types'
import { createView, findViewByType } from './workspace/types'

interface PanelsLayoutProps {
  // Conversations
  conversations: Conversation[]
  currentConversationId: string | null
  onSelectConversation: (conv: Conversation) => void
  onNewConversation: () => void
  onDeleteConversation: (id: string) => void
  loadingConversations: boolean
  
  // Auth
  isAuthenticated: boolean
  userEmail: string | null
  onSignUp: () => void
  onLogout: () => void
  
  // Messages
  messages: LocalMessage[]
  thinking: ThinkingState
  thinkingSections: ThinkingSectionsState
  streamingContent: string
  isStreaming: boolean
  sending: boolean
  onSend: (content: string, attachments?: Attachment[]) => void
  showWelcome: boolean
  loadingMessages: boolean
  
  // Credits
  credits?: CreditInfo | null
  onClaimCredits?: () => void
  claimingCredits?: boolean
  
  // Draft
  currentDraft?: DraftData | null
  onAskAgent?: (question: string) => void
  onPublishDraft?: () => void
  isPublishingDraft?: boolean
  showDraftActions?: boolean
  
  // Proposals
  proposalsCount?: number
  
  // Toggle thinking sections
  onToggleThinkingSections?: () => void
  
  // Workspace
  onOpenWorkspaceView?: (view: Omit<WorkspaceView, 'id' | 'createdAt'>) => void
}

// Composant pour le handle de redimensionnement
function ResizeHandle({ 
  onMouseDown, 
  isResizing 
}: { 
  onMouseDown: (e: React.MouseEvent) => void
  isResizing: boolean 
}) {
  return (
    <div
      onMouseDown={onMouseDown}
      className={`
        w-1 cursor-col-resize flex-shrink-0 relative group
        transition-colors duration-200
        ${isResizing ? 'bg-violet-500/30' : 'hover:bg-violet-500/20'}
      `}
    >
      <div 
        className={`
          absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5
          transition-all duration-200
          ${isResizing 
            ? 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]' 
            : 'bg-white/10 group-hover:bg-violet-500/60 group-hover:shadow-[0_0_6px_rgba(139,92,246,0.4)]'
          }
        `}
      />
    </div>
  )
}

/**
 * PanelsLayout - Layout IDE avec 4 panels redimensionnables
 * Version CSS Flexbox - plus robuste
 */
export function PanelsLayout(props: PanelsLayoutProps) {
  const {
    conversations,
    currentConversationId,
    onSelectConversation,
    onNewConversation,
    onDeleteConversation,
    loadingConversations,
    isAuthenticated,
    userEmail,
    onSignUp,
    onLogout,
    messages,
    thinking,
    thinkingSections,
    streamingContent,
    isStreaming,
    sending,
    onSend,
    showWelcome,
    loadingMessages,
    credits,
    onClaimCredits,
    claimingCredits,
    currentDraft,
    onAskAgent,
    onPublishDraft,
    isPublishingDraft,
    showDraftActions,
    proposalsCount = 0,
    onToggleThinkingSections,
  } = props

  // Refs pour le container
  const containerRef = useRef<HTMLDivElement>(null)

  // États des panels (visibilité)
  const [showHistory, setShowHistory] = useState(() => {
    if (typeof window === 'undefined') return true
    const saved = localStorage.getItem('tug_show_history')
    return saved !== null ? saved === 'true' : true
  })
  const [showContext, setShowContext] = useState(() => {
    if (typeof window === 'undefined') return true
    const saved = localStorage.getItem('tug_show_context')
    return saved !== null ? saved === 'true' : true
  })
  const [showMenu, setShowMenu] = useState(() => {
    if (typeof window === 'undefined') return true
    const saved = localStorage.getItem('tug_show_menu')
    return saved !== null ? saved === 'true' : true
  })

  // États des tailles (en pixels)
  const [sizes, setSizes] = useState(() => {
    if (typeof window === 'undefined') {
      return { history: 280, context: 320, menu: 60 }
    }
    try {
      const saved = localStorage.getItem('tug_panel_sizes')
      if (saved) return JSON.parse(saved)
    } catch {}
    return { history: 280, context: 320, menu: 60 }
  })

  // État de redimensionnement
  const [resizing, setResizing] = useState<string | null>(null)
  const resizeStartRef = useRef({ x: 0, size: 0 })

  // État de la vue principale (Panel 2)
  type MainViewType = 'dashboard' | 'chat' | 'notifications' | 'wallet'
  const [mainView, setMainView] = useState<MainViewType>(() => {
    if (typeof window === 'undefined') return 'dashboard'
    const saved = localStorage.getItem('tug_main_view')
    return (saved as MainViewType) || 'dashboard'
  })

  // État workspace
  const [workspaceViews, setWorkspaceViews] = useState<WorkspaceView[]>([])
  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const [planSteps] = useState<PlanStep[]>([])
  const [logs] = useState<LogEntry[]>([])

  // Sauvegarder les préférences
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tug_show_history', String(showHistory))
      localStorage.setItem('tug_show_context', String(showContext))
      localStorage.setItem('tug_show_menu', String(showMenu))
      localStorage.setItem('tug_panel_sizes', JSON.stringify(sizes))
      localStorage.setItem('tug_main_view', mainView)
    }
  }, [showHistory, showContext, showMenu, sizes, mainView])

  // Ouvrir automatiquement une vue CreateListing quand un brouillon est créé
  useEffect(() => {
    if (currentDraft && showDraftActions) {
      const existingCreateListingView = workspaceViews.find(
        v => v.type === 'create-listing'
      )
      
      if (!existingCreateListingView) {
        openView({
          type: 'create-listing',
          title: 'Création annonce',
          closable: true,
          data: { mode: 'create' }
        })
      } else {
        setActiveViewId(existingCreateListingView.id)
      }
    }
  }, [currentDraft, showDraftActions, workspaceViews])

  // Gestion du redimensionnement
  const handleMouseDown = useCallback((panel: string, e: React.MouseEvent) => {
    e.preventDefault()
    setResizing(panel)
    resizeStartRef.current = {
      x: e.clientX,
      size: sizes[panel as keyof typeof sizes]
    }
  }, [sizes])

  useEffect(() => {
    if (!resizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - resizeStartRef.current.x
      const isRightSide = resizing === 'context' || resizing === 'menu'
      const newSize = resizeStartRef.current.size + (isRightSide ? -delta : delta)
      
      // Limites min/max
      const limits = {
        history: { min: 200, max: 400 },
        context: { min: 250, max: 500 },
        menu: { min: 50, max: 120 }
      }
      
      const { min, max } = limits[resizing as keyof typeof limits]
      const clampedSize = Math.max(min, Math.min(max, newSize))
      
      setSizes((prev: typeof sizes) => ({ ...prev, [resizing]: clampedSize }))
    }

    const handleMouseUp = () => {
      setResizing(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizing])

  // Callbacks Workspace
  const openView = useCallback((viewParams: Omit<WorkspaceView, 'id' | 'createdAt'>) => {
    const systemTypes: ViewType[] = ['plan', 'data', 'actions', 'logs']
    if (systemTypes.includes(viewParams.type)) {
      const existing = findViewByType(workspaceViews, viewParams.type)
      if (existing) {
        setActiveViewId(existing.id)
        return
      }
    }
    
    const newView = createView(viewParams)
    setWorkspaceViews(prev => [...prev, newView])
    setActiveViewId(newView.id)
    
    if (!showContext) {
      setShowContext(true)
    }
  }, [workspaceViews, showContext])

  const closeView = useCallback((viewId: string) => {
    setWorkspaceViews(prev => {
      const newViews = prev.filter(v => v.id !== viewId)
      
      if (activeViewId === viewId) {
        const closedIndex = prev.findIndex(v => v.id === viewId)
        const newActiveIndex = Math.max(0, closedIndex - 1)
        setActiveViewId(newViews[newActiveIndex]?.id || null)
      }
      
      return newViews
    })
  }, [activeViewId])

  const handleSetActiveView = useCallback((viewId: string) => {
    setActiveViewId(viewId)
  }, [])

  const handleOpenWorkspaceViewFromMenu = useCallback((type: ViewType, title: string) => {
    openView({ type, title, closable: true })
  }, [openView])

  const handleQuickAction = useCallback((action: string) => {
    if (action === 'new_listing') {
      openView({
        type: 'create-listing',
        title: 'Création annonce',
        closable: true,
        data: { mode: 'create' }
      })
      onSend?.('Je voudrais créer une nouvelle annonce')
    } else if (action === 'publish' && onPublishDraft) {
      onPublishDraft()
    } else if (action === 'search') {
      onSend?.('Recherche des annonces')
    }
  }, [onSend, onPublishDraft, openView])

  const openViewTypes = workspaceViews.map(v => v.type)

  // Callback pour les items du menu
  type MenuItemId = 'home' | 'conversations' | 'proposals' | 'wallet' | 'settings' | 'profile' | 'help'
  const handleMenuItemClick = useCallback((id: MenuItemId) => {
    if (id === 'home') {
      setMainView('dashboard')
    } else if (id === 'conversations') {
      setMainView('chat')
    } else if (id === 'proposals') {
      setMainView('notifications')
    } else if (id === 'wallet') {
      setMainView('wallet')
    }
    // Autres items peuvent être gérés ici
  }, [])

  // Actions rapides depuis le Dashboard
  const handleStartChat = useCallback(() => {
    setMainView('chat')
    onNewConversation()
  }, [onNewConversation])

  const handleCreateListing = useCallback(() => {
    setMainView('chat')
    openView({
      type: 'create-listing',
      title: 'Création annonce',
      closable: true,
      data: { mode: 'create' }
    })
    onSend?.('Je voudrais créer une nouvelle annonce')
  }, [openView, onSend])

  // Déterminer l'item actif du menu
  const activeMenuItem = mainView === 'dashboard' 
    ? 'home' 
    : mainView === 'notifications' 
      ? 'proposals' 
      : mainView === 'wallet'
        ? 'wallet'
        : 'conversations'

  return (
    <div className="flex flex-col h-screen bg-[rgba(10,10,15,1)]">
      {/* Background cyber */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 50% 35% at 15% 25%, rgba(109, 40, 217, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse 40% 30% at 85% 20%, rgba(139, 92, 246, 0.08) 0%, transparent 45%),
              radial-gradient(ellipse 60% 40% at 50% 90%, rgba(244, 114, 182, 0.06) 0%, transparent 40%)
            `
          }}
        />
      </div>

      {/* Toolbar */}
      <PanelsToolbar
        showHistory={showHistory}
        showContext={showContext}
        showMenu={showMenu}
        onToggleHistory={() => setShowHistory(!showHistory)}
        onToggleContext={() => setShowContext(!showContext)}
        onToggleMenu={() => setShowMenu(!showMenu)}
      />

      {/* Panels - CSS Flexbox */}
      <div 
        ref={containerRef}
        className={`flex-1 relative z-10 overflow-hidden flex ${resizing ? 'select-none' : ''}`}
        >
          {/* Panel 1: History */}
        {showHistory && (
          <>
            <div 
              className="flex-shrink-0 overflow-hidden border-r border-white/[0.06]"
              style={{ width: sizes.history }}
              >
                <ConversationHistoryPanel
                  conversations={conversations}
                  currentId={currentConversationId}
                  onSelect={onSelectConversation}
                onNew={handleStartChat}
                  onDelete={onDeleteConversation}
                  loading={loadingConversations}
                  isAuthenticated={isAuthenticated}
                  userEmail={userEmail}
                  onSignUp={onSignUp}
                  onLogout={onLogout}
                />
            </div>
            <ResizeHandle 
              onMouseDown={(e) => handleMouseDown('history', e)}
              isResizing={resizing === 'history'}
            />
            </>
          )}

        {/* Panel 2: Vue principale (Dashboard, Chat, Notifications, Wallet) */}
        <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="flex items-center border-b border-white/[0.06] bg-[rgba(15,15,20,0.8)] px-2">
            <button
              onClick={() => setMainView('dashboard')}
              className={`
                flex items-center gap-2 px-3 py-2.5 text-xs font-medium transition-all
                border-b-2 -mb-px
                ${mainView === 'dashboard' 
                  ? 'text-violet-400 border-violet-500' 
                  : 'text-white/40 border-transparent hover:text-white/60'
                }
              `}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Accueil</span>
            </button>
            <button
              onClick={() => setMainView('chat')}
              className={`
                flex items-center gap-2 px-3 py-2.5 text-xs font-medium transition-all
                border-b-2 -mb-px
                ${mainView === 'chat' 
                  ? 'text-violet-400 border-violet-500' 
                  : 'text-white/40 border-transparent hover:text-white/60'
                }
              `}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>
            <button
              onClick={() => setMainView('notifications')}
              className={`
                flex items-center gap-2 px-3 py-2.5 text-xs font-medium transition-all
                border-b-2 -mb-px relative
                ${mainView === 'notifications' 
                  ? 'text-violet-400 border-violet-500' 
                  : 'text-white/40 border-transparent hover:text-white/60'
                }
              `}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Notifications</span>
              {proposalsCount > 0 && (
                <span className="absolute -top-0.5 left-5 min-w-[16px] h-4 flex items-center justify-center px-1 rounded-full bg-pink-500 text-white text-[10px] font-bold">
                  {proposalsCount > 99 ? '99+' : proposalsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMainView('wallet')}
              className={`
                flex items-center gap-2 px-3 py-2.5 text-xs font-medium transition-all
                border-b-2 -mb-px
                ${mainView === 'wallet' 
                  ? 'text-violet-400 border-violet-500' 
                  : 'text-white/40 border-transparent hover:text-white/60'
                }
              `}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Crédits</span>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {mainView === 'dashboard' && (
              <DashboardView
                conversationsCount={conversations.length}
                listingsCount={5}
                proposalsCount={proposalsCount}
                draftsCount={2}
                onStartChat={handleStartChat}
                onCreateListing={handleCreateListing}
              />
            )}
            {mainView === 'chat' && (
            <AgentChatPanel
              messages={messages}
              thinking={thinking}
              thinkingSections={thinkingSections}
              streamingContent={streamingContent}
              isStreaming={isStreaming}
              sending={sending}
              onSend={onSend}
              onNewChat={onNewConversation}
              showWelcome={showWelcome}
              loadingMessages={loadingMessages}
              credits={credits}
              onClaimCredits={onClaimCredits}
              claimingCredits={claimingCredits}
              isAuthenticated={isAuthenticated}
              currentDraft={currentDraft}
              onAskAgent={onAskAgent}
              onPublishDraft={onPublishDraft}
              isPublishingDraft={isPublishingDraft}
              showDraftActions={showDraftActions}
              onToggleThinkingSections={onToggleThinkingSections}
            />
            )}
            {mainView === 'notifications' && (
              <NotificationsView />
            )}
            {mainView === 'wallet' && (
              <WalletView 
                onClaimDaily={onClaimCredits}
                canClaimDaily={!claimingCredits}
              />
            )}
          </div>
        </div>

          {/* Panel 3: Workspace Dock */}
        {showContext && (
          <>
            <ResizeHandle 
              onMouseDown={(e) => handleMouseDown('context', e)}
              isResizing={resizing === 'context'}
            />
            <div 
              className="flex-shrink-0 overflow-hidden border-l border-white/[0.06]"
              style={{ width: sizes.context }}
              >
                <WorkspaceDock
                  views={workspaceViews}
                  activeViewId={activeViewId}
                  onCloseView={closeView}
                  onSetActiveView={handleSetActiveView}
                  onOpenView={openView}
                  planSteps={planSteps}
                  logs={logs}
                  draftsCount={2}
                  listingsCount={5}
                  onQuickAction={handleQuickAction}
                  onPublishDraft={onPublishDraft}
                  onAskAgentAboutDraft={onAskAgent}
                  isPublishingDraft={isPublishingDraft}
                  hasActiveDraft={!!currentDraft}
                />
            </div>
            </>
          )}

          {/* Panel 4: Menu */}
        {showMenu && (
          <>
            <ResizeHandle 
              onMouseDown={(e) => handleMouseDown('menu', e)}
              isResizing={resizing === 'menu'}
            />
            <div 
              className="flex-shrink-0 overflow-hidden border-l border-white/[0.06]"
              style={{ width: sizes.menu }}
              >
                <AppMenuPanel
                activeItem={activeMenuItem}
                  proposalsCount={proposalsCount}
                  isAuthenticated={isAuthenticated}
                  onLogout={onLogout}
                  openViewTypes={openViewTypes}
                  onOpenWorkspaceView={handleOpenWorkspaceViewFromMenu}
                onItemClick={handleMenuItemClick}
                />
            </div>
            </>
          )}
      </div>
    </div>
  )
}

export default PanelsLayout
