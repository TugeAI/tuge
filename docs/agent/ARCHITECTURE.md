# Architecture de la Page Agent

## Vue d'ensemble

La page agent est une interface conversationnelle de type IDE avec 4 panels redimensionnables, permettant aux utilisateurs d'interagir avec un agent IA pour créer et gérer des annonces.

## Structure des composants

```
src/app/agent/
├── page.tsx                      # Page principale avec logique métier
│
src/components/agent/
├── PanelsLayout.tsx              # Layout 4 panels redimensionnables
├── PanelsToolbar.tsx             # Barre d'outils pour toggle panels
├── AgentChatPanel.tsx            # Panel de chat central
├── ConversationHistoryPanel.tsx # Panel historique conversations
├── AppMenuPanel.tsx              # Panel menu navigation
├── CustomResizeHandle.tsx        # Handle de redimensionnement
├── OnboardingView.tsx            # Vue onboarding visiteurs
├── types.ts                      # Types partagés
├── chat/
│   └── ListingSummaryCard.tsx   # Carte récapitulatif annonce
└── workspace/
    ├── WorkspaceDock.tsx         # Dock de vues dynamiques
    ├── types.ts                  # Types workspace
    └── views/                    # Vues individuelles
        ├── ActionsView.tsx
        ├── CreateListingView.tsx
        ├── DataView.tsx
        ├── DraftView.tsx
        ├── EmptyView.tsx
        ├── LogsView.tsx
        └── PlanView.tsx
```

## Flux de données

### 1. Authentification

```
useAgentAuth() → isAuthenticated
                 ↓
         ┌──────────────┐
         │ Authenticated │
         └──────────────┘
                 ↓
    ┌────────────┴────────────┐
    ↓                         ↓
Conversations DB        Credits API
```

### 2. Conversations

```
User Action → selectConversation()
                     ↓
              loadMessages()
                     ↓
              Display in Chat
```

### 3. Streaming SSE

```
sendMessage() → POST /api/agent
                     ↓
              SSE Stream
                     ↓
         ┌───────────┴───────────┐
         ↓                       ↓
    thinking events        chunk events
         ↓                       ↓
    ThinkingIndicator      StreamingMessage
                     ↓
              Final message saved
```

## Panels

### Panel 1: History (20%)
- Liste des conversations
- Recherche
- Bouton nouvelle conversation
- Info utilisateur

### Panel 2: Chat (50%)
- Messages utilisateur/assistant
- Input avec attachments
- Indicateur thinking
- Streaming en temps réel

### Panel 3: Workspace Dock (20%)
- Vues dynamiques (Plan, Data, Actions, Logs)
- Création d'annonces
- Gestion brouillons

### Panel 4: Menu (10%)
- Navigation principale
- Accès workspace views
- Paramètres/Profil

## États principaux

### Page principale (page.tsx)

```typescript
// Auth
isAuthenticated: boolean | null
userEmail: string | null

// Conversations
conversations: Conversation[]
currentConversationId: string | null

// Messages
messages: LocalMessage[]
thinking: ThinkingState
streamingContent: string
isStreaming: boolean

// Crédits
credits: CreditWallet | null

// Brouillon (via store)
draft: ListingDraftState
```

## Hooks personnalisés

### useAgentAuth
Gère l'authentification et la session utilisateur.

### useAgentConversations
Gère le chargement et la manipulation des conversations.

### useAgentCredits
Gère le wallet de crédits et les réclamations quotidiennes.

### useAgentProposals
Gère les propositions reçues/envoyées.

## Store global

### ListingDraftStore
Store Zustand pour gérer l'état du brouillon d'annonce en cours de création.

## Protocole de communication

Voir [STREAMING.md](./STREAMING.md) pour les détails du protocole SSE.

## Workspace Views

Voir [WORKSPACE_VIEWS.md](./WORKSPACE_VIEWS.md) pour la documentation des vues dynamiques.


