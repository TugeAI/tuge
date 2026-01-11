/**
 * Agent Components
 * 
 * Composants pour la page Agent avec layout IDE 4 panels
 */

// Layout principal
export { PanelsLayout } from './PanelsLayout'
export { PanelsToolbar } from './PanelsToolbar'

// Panels
export { ConversationHistoryPanel } from './ConversationHistoryPanel'
export { AgentChatPanel } from './AgentChatPanel'
export { AppMenuPanel } from './AppMenuPanel'

// Workspace Dock (remplace AgentContextPanel)
export { WorkspaceDock } from './workspace'
export type { 
  WorkspaceView, 
  WorkspaceState, 
  ViewType,
  WorkspaceActions,
  PlanStep,
  LogEntry,
  DraftViewData,
  ListingViewData,
  SearchViewData,
} from './workspace'

// UI
export { CustomResizeHandle } from './CustomResizeHandle'

// Existants
export { ListingCard, ListingsGrid, parseListingsFromMessage } from './ListingCard'
export type { ParsedListing } from './ListingCard'
export { OnboardingView } from './OnboardingView'

// Types partagés
export type {
  LocalMessage,
  ThinkingState,
  ThinkingSectionCategory,
  ThinkingSectionItem,
  ThinkingSectionsState,
  CreditInfo,
  Attachment,
} from './types'
