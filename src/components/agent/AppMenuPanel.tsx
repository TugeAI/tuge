'use client'

import { useState } from 'react'
import { 
  Home,
  MessageSquare,
  Bell,
  Wallet,
  Settings,
  User,
  HelpCircle,
  LogOut,
  ListChecks,
  Database,
  Zap,
  Terminal
} from 'lucide-react'
import type { ViewType } from './workspace/types'

type MenuItemId = 'home' | 'conversations' | 'proposals' | 'wallet' | 'settings' | 'profile' | 'help'
type WorkspaceItemId = 'plan' | 'data' | 'actions' | 'logs'

interface MenuItem {
  id: MenuItemId
  icon: React.ReactNode
  label: string
  badge?: number
}

interface WorkspaceItem {
  id: WorkspaceItemId
  type: ViewType
  icon: React.ReactNode
  label: string
}

interface AppMenuPanelProps {
  activeItem?: MenuItemId
  onItemClick?: (id: MenuItemId) => void
  proposalsCount?: number
  isAuthenticated?: boolean
  onLogout?: () => void
  // Workspace
  openViewTypes?: ViewType[]
  onOpenWorkspaceView?: (type: ViewType, title: string) => void
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'home', icon: <Home className="w-5 h-5" />, label: 'Accueil' },
  { id: 'conversations', icon: <MessageSquare className="w-5 h-5" />, label: 'Conversations' },
  { id: 'proposals', icon: <Bell className="w-5 h-5" />, label: 'Propositions' },
  { id: 'wallet', icon: <Wallet className="w-5 h-5" />, label: 'Portefeuille' },
]

const WORKSPACE_ITEMS: WorkspaceItem[] = [
  { id: 'plan', type: 'plan', icon: <ListChecks className="w-5 h-5" />, label: 'Plan' },
  { id: 'data', type: 'data', icon: <Database className="w-5 h-5" />, label: 'Données' },
  { id: 'actions', type: 'actions', icon: <Zap className="w-5 h-5" />, label: 'Actions' },
  { id: 'logs', type: 'logs', icon: <Terminal className="w-5 h-5" />, label: 'Logs' },
]

const BOTTOM_ITEMS: MenuItem[] = [
  { id: 'settings', icon: <Settings className="w-5 h-5" />, label: 'Paramètres' },
  { id: 'profile', icon: <User className="w-5 h-5" />, label: 'Profil' },
  { id: 'help', icon: <HelpCircle className="w-5 h-5" />, label: 'Aide' },
]

/**
 * Panel 4 - Menu global
 * Navigation verticale par icônes style VS Code
 * Avec section Workspace pour ouvrir les vues dans le Dock
 */
export function AppMenuPanel({
  activeItem = 'conversations',
  onItemClick,
  proposalsCount = 0,
  isAuthenticated = false,
  onLogout,
  openViewTypes = [],
  onOpenWorkspaceView,
}: AppMenuPanelProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const renderMenuItem = (item: MenuItem, showBadge = false) => {
    const isActive = activeItem === item.id
    const isHovered = hoveredItem === item.id
    const badgeCount = item.id === 'proposals' ? proposalsCount : item.badge

    return (
      <div key={item.id} className="relative">
        <button
          onClick={() => onItemClick?.(item.id)}
          onMouseEnter={() => setHoveredItem(item.id)}
          onMouseLeave={() => setHoveredItem(null)}
          className={`
            relative w-full flex items-center justify-center p-3
            transition-all duration-150
            ${isActive 
              ? 'text-violet-400' 
              : 'text-white/40 hover:text-white/70'
            }
          `}
          title={item.label}
          aria-label={item.label}
        >
          {/* Active indicator */}
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-violet-500 rounded-r" />
          )}

          {/* Icon */}
          <div className={`
            relative p-2 rounded-lg transition-all duration-150
            ${isActive ? 'bg-violet-500/15' : isHovered ? 'bg-white/5' : ''}
          `}>
            {item.icon}

            {/* Badge */}
            {showBadge && badgeCount !== undefined && badgeCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-pink-500 text-white text-[10px] font-bold">
                {badgeCount > 99 ? '99+' : badgeCount}
              </span>
            )}
          </div>
        </button>

        {/* Tooltip */}
        {isHovered && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 pointer-events-none">
            <div className="px-2.5 py-1.5 rounded-md bg-[rgba(30,30,40,0.95)] border border-white/10 shadow-lg">
              <span className="text-xs font-medium text-white/90 whitespace-nowrap">
                {item.label}
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderWorkspaceItem = (item: WorkspaceItem) => {
    const isOpen = openViewTypes.includes(item.type)
    const isHovered = hoveredItem === `workspace-${item.id}`

    return (
      <div key={item.id} className="relative">
        <button
          onClick={() => onOpenWorkspaceView?.(item.type, item.label)}
          onMouseEnter={() => setHoveredItem(`workspace-${item.id}`)}
          onMouseLeave={() => setHoveredItem(null)}
          className={`
            relative w-full flex items-center justify-center p-3
            transition-all duration-150
            ${isOpen 
              ? 'text-cyan-400' 
              : 'text-white/40 hover:text-white/70'
            }
          `}
          title={item.label}
          aria-label={item.label}
        >
          {/* Open indicator */}
          {isOpen && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-cyan-500 rounded-r" />
          )}

          {/* Icon */}
          <div className={`
            relative p-2 rounded-lg transition-all duration-150
            ${isOpen ? 'bg-cyan-500/15' : isHovered ? 'bg-white/5' : ''}
          `}>
            {item.icon}
          </div>
        </button>

        {/* Tooltip */}
        {isHovered && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 pointer-events-none">
            <div className="px-2.5 py-1.5 rounded-md bg-[rgba(30,30,40,0.95)] border border-white/10 shadow-lg">
              <span className="text-xs font-medium text-white/90 whitespace-nowrap">
                {item.label}
                {isOpen && <span className="text-cyan-400 ml-1">•</span>}
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[rgba(10,10,15,0.98)] border-l border-white/[0.06]">
      {/* Top section - Main menu items */}
      <div className="py-2">
        {MENU_ITEMS.map((item) => renderMenuItem(item, true))}
      </div>

      {/* Separator */}
      <div className="mx-3 h-px bg-white/[0.06]" />

      {/* Workspace section */}
      <div className="py-2">
        <div className="px-3 py-1 text-[10px] font-medium text-white/30 uppercase tracking-wider text-center">
          Workspace
        </div>
        {WORKSPACE_ITEMS.map((item) => renderWorkspaceItem(item))}
      </div>

      {/* Separator */}
      <div className="mx-3 h-px bg-white/[0.06]" />

      {/* Bottom section - Settings & Profile */}
      <div className="flex-1" />
      <div className="py-2">
        {BOTTOM_ITEMS.map((item) => renderMenuItem(item))}
      </div>

      {/* Logout button */}
      {isAuthenticated && (
        <>
          <div className="mx-3 h-px bg-white/[0.06]" />
          <div className="py-2">
            <button
              onClick={onLogout}
              onMouseEnter={() => setHoveredItem('logout')}
              onMouseLeave={() => setHoveredItem(null)}
              className="w-full flex items-center justify-center p-3 text-white/40 hover:text-red-400 transition-colors"
              title="Déconnexion"
              aria-label="Déconnexion"
            >
              <div className="p-2 rounded-lg hover:bg-red-500/10 transition-colors">
                <LogOut className="w-5 h-5" />
              </div>
            </button>
            {hoveredItem === 'logout' && (
              <div className="absolute left-full bottom-4 ml-2 z-50 pointer-events-none">
                <div className="px-2.5 py-1.5 rounded-md bg-[rgba(30,30,40,0.95)] border border-white/10 shadow-lg">
                  <span className="text-xs font-medium text-white/90 whitespace-nowrap">
                    Déconnexion
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default AppMenuPanel
