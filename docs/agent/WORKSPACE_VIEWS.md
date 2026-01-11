# Workspace Views

## Vue d'ensemble

Le Workspace Dock est un système de vues dynamiques qui remplace l'ancien `AgentContextPanel`. Il permet d'ouvrir/fermer des vues de manière flexible, pilotées par l'agent ou l'utilisateur.

## Types de vues

### Vues système (non-closable)
- `plan` : Plan d'action de l'agent
- `data` : Données (brouillons, annonces)
- `actions` : Actions rapides
- `logs` : Logs des appels API

### Vues dynamiques (closable)
- `create-listing` : Création d'annonce
- `draft` : Édition de brouillon
- `listing` : Détails d'une annonce
- `search` : Recherche d'annonces

## Structure d'une vue

```typescript
interface WorkspaceView {
  id: string                    // UUID unique
  type: ViewType                // Type de vue
  title: string                 // Titre affiché
  icon?: React.ReactNode        // Icône optionnelle
  closable: boolean             // Peut être fermée ?
  data?: unknown                // Données spécifiques
  createdAt: number             // Timestamp création
}
```

## Création d'une vue

```typescript
const openView = (viewParams: Omit<WorkspaceView, 'id' | 'createdAt'>) => {
  const newView = createView(viewParams)
  setWorkspaceViews(prev => [...prev, newView])
  setActiveViewId(newView.id)
}

// Exemple
openView({
  type: 'create-listing',
  title: 'Création annonce',
  closable: true,
  data: { mode: 'create' }
})
```

## Vues détaillées

### PlanView
Affiche le plan d'action de l'agent avec les étapes en cours.

```typescript
interface PlanStep {
  id: string
  label: string
  status: 'pending' | 'in_progress' | 'completed'
}
```

### DataView
Affiche un résumé des données (brouillons, annonces).

**Props :**
- `draftsCount: number`
- `listingsCount: number`
- `onViewDrafts: () => void`
- `onViewListings: () => void`

### ActionsView
Boutons d'actions rapides.

**Actions disponibles :**
- `new_listing` : Créer une annonce
- `publish` : Publier le brouillon
- `search` : Rechercher des annonces
- `ask_agent` : Poser une question

### LogsView
Affiche l'historique des appels API/outils.

```typescript
interface LogEntry {
  id: string
  timestamp: string
  type: 'tool_call' | 'response' | 'error'
  content: string
}
```

### CreateListingView
Vue complète pour créer une annonce avec le store `ListingDraftStore`.

**Fonctionnalités :**
- Formulaire complet (titre, description, prix, etc.)
- Upload d'images
- Génération d'images IA
- Prévisualisation
- Publication

**Props :**
- `onPublish: () => void`
- `onAskAgent: (question: string) => void`
- `isPublishing: boolean`

### DraftView
Vue pour éditer un brouillon existant.

```typescript
interface DraftViewData {
  id: string
  title: string
  description: string
  category: ListingCategory
  price?: number
  priceType?: PriceType
  location?: string
}
```

### EmptyView
Vue par défaut quand aucune vue n'est ouverte.

Affiche des boutons pour ouvrir les vues système (Plan, Actions).

## Gestion des vues

### Ouvrir une vue

```typescript
// Depuis le menu
onOpenWorkspaceView('plan', 'Plan')

// Depuis le code
openView({
  type: 'create-listing',
  title: 'Nouvelle annonce',
  closable: true
})
```

### Fermer une vue

```typescript
closeView(viewId)
```

**Comportement :**
- Si la vue fermée était active, active la vue précédente
- Les vues système ne peuvent pas être fermées

### Activer une vue

```typescript
setActiveView(viewId)
```

## Ouverture automatique

Certaines vues s'ouvrent automatiquement :

### CreateListingView
S'ouvre quand :
- L'agent crée un brouillon (`tool_call: create_listing_draft`)
- L'utilisateur clique sur "Créer une annonce"

### DraftView
S'ouvre quand :
- L'utilisateur clique sur un brouillon dans DataView

## Intégration avec l'agent

L'agent peut demander l'ouverture d'une vue via un événement SSE :

```json
{
  "event": "open_view",
  "data": {
    "type": "create-listing",
    "title": "Votre annonce",
    "data": { "mode": "edit", "draftId": "draft_123" }
  }
}
```

## Persistance

Les vues ouvertes ne sont **pas** persistées entre les sessions. À chaque chargement de la page, seule la vue par défaut (EmptyView) est affichée.

## Raccourcis clavier (futur)

- `Cmd/Ctrl + P` : Ouvrir Plan
- `Cmd/Ctrl + D` : Ouvrir Data
- `Cmd/Ctrl + K` : Ouvrir Actions
- `Cmd/Ctrl + L` : Ouvrir Logs
- `Cmd/Ctrl + W` : Fermer la vue active


