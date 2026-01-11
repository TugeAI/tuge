/**
 * Workspace Dock - Types
 * 
 * Système de vues dynamiques piloté par l'agent IA et l'utilisateur.
 * Inspiré de Cursor, VS Code, Linear.
 */

import type { ReactNode } from 'react'

// ============================================================================
// View Types
// ============================================================================

/**
 * Types de vues disponibles dans le Workspace
 */
export type ViewType = 
  | 'plan'           // Plan d'exécution de l'agent
  | 'data'           // Données contextuelles
  | 'actions'        // Actions rapides
  | 'logs'           // Historique des appels
  | 'draft'          // Brouillon d'annonce (ancienne vue)
  | 'create-listing' // Création d'annonce avec auto-remplissage
  | 'listing'        // Détail d'une annonce
  | 'search'         // Résultats de recherche
  | 'settings'       // Paramètres
  | 'profile'        // Profil utilisateur
  | 'wallet'         // Portefeuille
  | 'proposals'      // Propositions reçues

/**
 * Vue dans le Workspace Dock
 */
export interface WorkspaceView {
  /** Identifiant unique de la vue */
  id: string
  /** Type de vue */
  type: ViewType
  /** Titre affiché dans l'onglet */
  title: string
  /** Icône optionnelle */
  icon?: ReactNode
  /** La vue peut-elle être fermée ? */
  closable: boolean
  /** Données spécifiques à la vue */
  data?: unknown
  /** Timestamp de création */
  createdAt: number
}

/**
 * État du Workspace
 */
export interface WorkspaceState {
  /** Liste des vues ouvertes */
  views: WorkspaceView[]
  /** ID de la vue active */
  activeViewId: string | null
}

// ============================================================================
// View Data Types
// ============================================================================

/**
 * Données pour la vue Plan
 */
export interface PlanViewData {
  steps: PlanStep[]
}

export interface PlanStep {
  id: string
  label: string
  status: 'pending' | 'in_progress' | 'completed'
}

/**
 * Données pour la vue Draft
 */
export interface DraftViewData {
  draftId: string
  title: string
  description: string
  category?: string
  price?: number
  priceType?: 'fixed' | 'negotiable' | 'free'
  location?: string
}

/**
 * Données pour la vue Listing
 */
export interface ListingViewData {
  listingId: string
  title: string
  description: string
  price?: number
  status: 'draft' | 'published' | 'sold' | 'archived'
}

/**
 * Données pour la vue Search
 */
export interface SearchViewData {
  query: string
  results: Array<{
    id: string
    title: string
    price?: number
    image?: string
  }>
}

/**
 * Données pour la vue Logs
 */
export interface LogsViewData {
  entries: LogEntry[]
}

export interface LogEntry {
  id: string
  timestamp: string
  type: 'tool_call' | 'response' | 'error' | 'info'
  content: string
}

/**
 * Données pour la vue Create Listing
 * Note: Les données sont gérées par le store ListingDraft,
 * cette interface est pour les données passées à l'ouverture de la vue
 */
export interface CreateListingViewData {
  /** Mode de la vue : création ou édition */
  mode: 'create' | 'edit'
  /** ID du brouillon si édition */
  draftId?: string
}

// ============================================================================
// Actions
// ============================================================================

/**
 * Callbacks pour manipuler le Workspace
 */
export interface WorkspaceActions {
  /** Ouvrir une nouvelle vue (ou activer si déjà ouverte) */
  openView: (view: Omit<WorkspaceView, 'id' | 'createdAt'>) => void
  /** Fermer une vue */
  closeView: (viewId: string) => void
  /** Activer une vue */
  setActiveView: (viewId: string) => void
  /** Mettre à jour les données d'une vue */
  updateViewData: (viewId: string, data: unknown) => void
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Génère un ID unique pour une vue
 */
export function generateViewId(type: ViewType): string {
  return `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Trouve une vue par type (pour éviter les doublons)
 */
export function findViewByType(views: WorkspaceView[], type: ViewType): WorkspaceView | undefined {
  return views.find(v => v.type === type)
}

/**
 * Crée une vue avec des valeurs par défaut
 */
export function createView(params: Omit<WorkspaceView, 'id' | 'createdAt'>): WorkspaceView {
  return {
    ...params,
    id: generateViewId(params.type),
    createdAt: Date.now(),
  }
}

