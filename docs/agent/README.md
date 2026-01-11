# Documentation Agent

## 📚 Table des matières

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture globale de la page agent
- [STREAMING.md](./STREAMING.md) - Protocole de streaming SSE
- [WORKSPACE_VIEWS.md](./WORKSPACE_VIEWS.md) - Système de vues dynamiques
- [HOOKS.md](./HOOKS.md) - Documentation des hooks personnalisés

## 🎯 Vue d'ensemble

La page agent est une interface conversationnelle de type IDE permettant aux utilisateurs d'interagir avec un agent IA pour créer et gérer des annonces.

## ✨ Fonctionnalités principales

- **Chat en temps réel** avec streaming SSE
- **4 panels redimensionnables** (History, Chat, Workspace, Menu)
- **Workspace dynamique** avec vues ouvertes/fermables
- **Création d'annonces guidée** par l'agent
- **Gestion de crédits** avec réclamation quotidienne
- **Mode invité** avec session anonyme
- **Upload d'images** et génération IA

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        PanelsLayout                          │
├──────────┬──────────────────────┬──────────────┬────────────┤
│ History  │        Chat          │  Workspace   │    Menu    │
│  (20%)   │        (50%)         │    (20%)     │   (10%)    │
│          │                      │              │            │
│ • Convs  │ • Messages           │ • Plan       │ • Home     │
│ • Search │ • Input              │ • Data       │ • Wallet   │
│ • New    │ • Thinking           │ • Actions    │ • Settings │
│          │ • Streaming          │ • Logs       │ • Logout   │
│          │                      │ • Create     │            │
└──────────┴──────────────────────┴──────────────┴────────────┘
```

## 🔧 Technologies

- **React 18** avec hooks
- **Next.js 14** (App Router)
- **TypeScript**
- **Supabase** (auth + database)
- **react-resizable-panels** (panels redimensionnables)
- **Zustand** (store ListingDraft)
- **SSE** (Server-Sent Events)

## 📦 Structure des fichiers

```
src/
├── app/agent/
│   └── page.tsx                    # Page principale
├── components/agent/
│   ├── PanelsLayout.tsx            # Layout 4 panels
│   ├── AgentChatPanel.tsx          # Panel chat
│   ├── ConversationHistoryPanel.tsx
│   ├── AppMenuPanel.tsx
│   └── workspace/
│       ├── WorkspaceDock.tsx       # Dock de vues
│       └── views/                  # Vues individuelles
├── hooks/agent/
│   ├── useAgentAuth.ts             # Hook auth
│   ├── useAgentConversations.ts    # Hook conversations
│   ├── useAgentCredits.ts          # Hook crédits
│   └── useAgentProposals.ts        # Hook propositions
├── stores/
│   └── listing-draft-store.tsx     # Store brouillon
└── types/
    ├── agent.ts                    # Types agent
    └── draft.ts                    # Types brouillon
```

## 🚀 Démarrage rapide

### 1. Lancer le serveur de développement

```bash
npm run dev
```

### 2. Accéder à la page agent

```
http://localhost:3000/agent
```

### 3. Tester en mode invité

Vous pouvez utiliser l'agent sans authentification. Une session anonyme sera créée automatiquement.

### 4. S'authentifier

Cliquez sur "Se connecter" dans le panel History pour créer un compte ou vous connecter.

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests E2E
npm run test:e2e
```

## 📝 Changelog

### Version actuelle (Refactorisation complète)

**Phase 1 : Nettoyage**
- ✅ Suppression des logs de débogage temporaires
- ✅ Suppression des fichiers obsolètes (AgentContextPanel, DraftCard)
- ✅ Suppression du code commenté

**Phase 2 : Simplifications**
- ✅ Simplification de la logique de suggestions (AgentChatPanel)
- ✅ Consolidation de la gestion des brouillons (migration vers ListingDraftStore)
- ✅ Nettoyage de PanelsLayout

**Phase 3 : Refactorisation**
- ✅ Extraction des hooks personnalisés (useAgentAuth, useAgentConversations, etc.)
- ✅ Création de types centralisés
- ✅ Amélioration de l'architecture

**Phase 4 : Documentation**
- ✅ Documentation de l'architecture
- ✅ Documentation du protocole streaming
- ✅ Documentation des workspace views
- ✅ Documentation des hooks

## 🤝 Contribution

Pour contribuer :

1. Lire la documentation d'architecture
2. Respecter les conventions de code
3. Ajouter des tests pour les nouvelles fonctionnalités
4. Mettre à jour la documentation

## 📄 Licence

Voir LICENSE à la racine du projet.


