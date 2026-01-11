# Hooks personnalisés Agent

## Vue d'ensemble

Les hooks personnalisés encapsulent la logique métier de la page agent, facilitant la réutilisation et les tests.

## useAgentAuth

Gère l'authentification et la session utilisateur.

### Utilisation

```typescript
import { useAgentAuth } from '@/hooks/agent'

function MyComponent() {
  const {
    isAuthenticated,
    userEmail,
    mounted,
    supabase,
    handleLogout
  } = useAgentAuth()

  if (!mounted || isAuthenticated === null) {
    return <Loading />
  }

  return (
    <div>
      {isAuthenticated ? (
        <p>Connecté en tant que {userEmail}</p>
      ) : (
        <p>Non connecté</p>
      )}
    </div>
  )
}
```

### API

```typescript
interface UseAgentAuthReturn {
  isAuthenticated: boolean | null  // null = en cours de vérification
  userEmail: string | null
  mounted: boolean                 // true après hydratation
  supabase: SupabaseClient | null
  handleLogout: () => Promise<void>
}
```

## useAgentConversations

Gère le chargement et la manipulation des conversations.

### Utilisation

```typescript
import { useAgentConversations } from '@/hooks/agent'

function MyComponent() {
  const {
    conversations,
    currentConversationId,
    loading,
    loadAuthenticatedConversations,
    selectConversation,
    deleteConversation
  } = useAgentConversations({
    supabase,
    isAuthenticated,
    onError: (msg) => showToast(msg, 'error'),
    onLoadMessages: (id) => loadMessages(id)
  })

  return (
    <div>
      {conversations.map(conv => (
        <button
          key={conv.id}
          onClick={() => selectConversation(conv)}
        >
          {conv.title}
        </button>
      ))}
    </div>
  )
}
```

### API

```typescript
interface UseAgentConversationsOptions {
  supabase: SupabaseClient | null
  isAuthenticated: boolean
  onError?: (message: string) => void
  onLoadMessages?: (conversationId: string) => void
}

interface UseAgentConversationsReturn {
  conversations: Conversation[]
  currentConversationId: string | null
  loading: boolean
  loadAuthenticatedConversations: () => Promise<void>
  loadGuestConversations: (sessionId: string) => Promise<void>
  selectConversation: (conv: Conversation) => void
  startNewConversation: () => void
  deleteConversation: (id: string) => Promise<void>
  setCurrentConversationId: (id: string | null) => void
}
```

## useAgentCredits

Gère le wallet de crédits et les réclamations quotidiennes.

### Utilisation

```typescript
import { useAgentCredits } from '@/hooks/agent'

function MyComponent() {
  const {
    credits,
    claimingCredits,
    loadCredits,
    handleClaimDaily
  } = useAgentCredits({
    onSuccess: (msg) => showToast(msg, 'success'),
    onError: (msg) => showToast(msg, 'error')
  })

  useEffect(() => {
    loadCredits()
  }, [loadCredits])

  return (
    <div>
      <p>Crédits : {credits?.total || 0}</p>
      {credits?.canClaim && (
        <button
          onClick={handleClaimDaily}
          disabled={claimingCredits}
        >
          Réclamer +10 crédits
        </button>
      )}
    </div>
  )
}
```

### API

```typescript
interface CreditWallet {
  free: number
  paid: number
  total: number
  canClaim: boolean
}

interface UseAgentCreditsOptions {
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

interface UseAgentCreditsReturn {
  credits: CreditWallet | null
  claimingCredits: boolean
  loadCredits: () => Promise<void>
  handleClaimDaily: () => Promise<void>
  setCredits: (credits: CreditWallet) => void
}
```

## useAgentProposals

Gère les propositions reçues/envoyées.

### Utilisation

```typescript
import { useAgentProposals } from '@/hooks/agent'

function MyComponent() {
  const {
    proposals,
    pendingProposalsCount,
    loadProposals
  } = useAgentProposals({
    isAuthenticated
  })

  useEffect(() => {
    loadProposals()
  }, [loadProposals])

  return (
    <div>
      <p>Propositions en attente : {pendingProposalsCount}</p>
      {proposals.map(proposal => (
        <ProposalCard key={proposal.id} proposal={proposal} />
      ))}
    </div>
  )
}
```

### API

```typescript
interface UseAgentProposalsOptions {
  isAuthenticated: boolean
}

interface UseAgentProposalsReturn {
  proposals: PendingProposalResult[]
  pendingProposalsCount: number
  loadProposals: () => Promise<void>
}
```

## Bonnes pratiques

### 1. Toujours vérifier `mounted` et `isAuthenticated`

```typescript
const { mounted, isAuthenticated } = useAgentAuth()

if (!mounted || isAuthenticated === null) {
  return <Loading />
}
```

### 2. Utiliser les callbacks pour les toasts

```typescript
const { handleClaimDaily } = useAgentCredits({
  onSuccess: (msg) => addToast(msg, 'success'),
  onError: (msg) => addToast(msg, 'error')
})
```

### 3. Charger les données au bon moment

```typescript
useEffect(() => {
  if (isAuthenticated) {
    loadCredits()
    loadProposals()
  }
}, [isAuthenticated, loadCredits, loadProposals])
```

### 4. Nettoyer les effets

```typescript
useEffect(() => {
  const controller = new AbortController()
  
  loadData(controller.signal)
  
  return () => controller.abort()
}, [])
```

## Tests

Les hooks peuvent être testés avec `@testing-library/react-hooks` :

```typescript
import { renderHook, act } from '@testing-library/react-hooks'
import { useAgentCredits } from '@/hooks/agent'

test('should load credits', async () => {
  const { result } = renderHook(() => useAgentCredits())
  
  await act(async () => {
    await result.current.loadCredits()
  })
  
  expect(result.current.credits).toBeDefined()
})
```


