'use client'

import { 
  PanelLeftClose, 
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  LayoutGrid,
  Menu
} from 'lucide-react'

interface PanelsToolbarProps {
  showHistory: boolean
  showContext: boolean
  showMenu: boolean
  onToggleHistory: () => void
  onToggleContext: () => void
  onToggleMenu: () => void
}

interface ToolbarButtonProps {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  position?: 'left' | 'right'
}

function ToolbarButton({ active, onClick, icon, label, position }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center justify-center w-8 h-8 rounded-lg
        transition-all duration-200 ease-out
        ${active 
          ? 'bg-violet-500/20 text-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.2)]' 
          : 'text-white/40 hover:text-white/70 hover:bg-white/5'
        }
      `}
      title={label}
      aria-label={label}
      aria-pressed={active}
    >
      {icon}
      
      {/* Indicateur actif */}
      {active && (
        <span 
          className={`
            absolute w-1 h-1 rounded-full bg-violet-400
            ${position === 'left' ? 'left-0.5 top-1/2 -translate-y-1/2' : ''}
            ${position === 'right' ? 'right-0.5 top-1/2 -translate-y-1/2' : ''}
            ${!position ? 'bottom-0.5 left-1/2 -translate-x-1/2' : ''}
          `}
        />
      )}
    </button>
  )
}

/**
 * Barre d'outils discrète pour toggle les panels
 * Design minimaliste type IDE
 */
export function PanelsToolbar({
  showHistory,
  showContext,
  showMenu,
  onToggleHistory,
  onToggleContext,
  onToggleMenu,
}: PanelsToolbarProps) {
  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-[rgba(12,12,18,0.95)] border-b border-white/[0.06]">
      {/* Groupe gauche - Toggle History */}
      <div className="flex items-center">
        <ToolbarButton
          active={showHistory}
          onClick={onToggleHistory}
          icon={showHistory ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          label={showHistory ? 'Masquer historique' : 'Afficher historique'}
          position="left"
        />
      </div>

      {/* Séparateur */}
      <div className="w-px h-4 bg-white/10 mx-1" />

      {/* Groupe centre - Toggle Context */}
      <ToolbarButton
        active={showContext}
        onClick={onToggleContext}
        icon={<LayoutGrid className="w-4 h-4" />}
        label={showContext ? 'Masquer contexte' : 'Afficher contexte'}
      />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Groupe droite - Toggle Menu */}
      <div className="flex items-center">
        <ToolbarButton
          active={showMenu}
          onClick={onToggleMenu}
          icon={showMenu ? <PanelRightClose className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          label={showMenu ? 'Masquer menu' : 'Afficher menu'}
          position="right"
        />
      </div>
    </div>
  )
}

export default PanelsToolbar


