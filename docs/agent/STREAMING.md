# Protocole Streaming SSE

## Vue d'ensemble

L'agent utilise Server-Sent Events (SSE) pour communiquer en temps réel avec le backend. Cela permet d'afficher la progression de la réflexion de l'agent et de streamer la réponse au fur et à mesure.

## Format des événements

Chaque événement SSE suit ce format :

```
event: <event_type>
data: <json_payload>

```

## Types d'événements

### 1. `credit`
Mise à jour du solde de crédits après consommation.

```json
{
  "remainingCredits": {
    "free": 8,
    "paid": 0,
    "total": 8
  }
}
```

### 2. `conversation`
Création d'une nouvelle conversation.

```json
{
  "id": "conv_123",
  "title": "Nouvelle conversation"
}
```

### 3. `thinking`
Étape de réflexion de l'agent (ancien système).

```json
"Analyse de la demande..."
```

### 4. `thinking_section`
Section de réflexion structurée (nouveau système).

```json
{
  "category": "comprehension",
  "content": "Analyse de la demande utilisateur",
  "items": [
    "L'utilisateur souhaite créer une annonce",
    "Type : produit",
    "Catégorie : électronique"
  ],
  "status": "completed"
}
```

**Catégories disponibles :**
- `comprehension` : Compréhension de la demande
- `plan` : Planification des actions
- `execution` : Exécution des actions

### 5. `chunk`
Morceau de la réponse streamée.

```json
"Voici votre annonce..."
```

### 6. `done`
Fin du streaming de la réponse.

```json
{}
```

### 7. `saved`
Confirmation de sauvegarde du message en base.

```json
{
  "messageId": "msg_456",
  "createdAt": "2024-01-05T10:30:00Z"
}
```

### 8. `tool_call`
Appel d'un outil par l'agent.

```json
{
  "name": "create_listing_draft",
  "result": {
    "success": true,
    "draftId": "draft_789",
    "draft": {
      "title": "iPhone 12 Pro",
      "description": "Excellent état...",
      "category": "product",
      "price": 500,
      "priceType": "fixed"
    }
  }
}
```

**Outils disponibles :**
- `create_listing_draft` : Créer un brouillon d'annonce
- `update_listing` : Mettre à jour une annonce
- `search_listings` : Rechercher des annonces
- `generate_image` : Générer une image IA

### 9. `error`
Erreur durant le traitement.

```json
{
  "code": "NO_CREDITS",
  "message": "Crédits insuffisants",
  "wallet": {
    "free": 0,
    "paid": 0,
    "total": 0
  }
}
```

**Codes d'erreur :**
- `NO_CREDITS` : Solde insuffisant
- `RATE_LIMIT` : Trop de requêtes
- `INVALID_INPUT` : Données invalides
- `UNKNOWN_ERROR` : Erreur inconnue

## Flux typique

```
1. POST /api/agent { message: "..." }
   ↓
2. event: credit
   data: { remainingCredits: {...} }
   ↓
3. event: conversation (si nouvelle)
   data: { id: "..." }
   ↓
4. event: thinking_section (plusieurs fois)
   data: { category: "comprehension", ... }
   ↓
5. event: chunk (plusieurs fois)
   data: "Voici..."
   ↓
6. event: done
   data: {}
   ↓
7. event: saved
   data: { messageId: "..." }
   ↓
8. event: tool_call (optionnel)
   data: { name: "create_listing_draft", ... }
```

## Gestion côté client

```typescript
const reader = response.body?.getReader()
const decoder = new TextDecoder()
let buffer = ''

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  buffer += decoder.decode(value, { stream: true })
  const events = buffer.split('\n\n')
  buffer = events.pop() || ''

  for (const event of events) {
    const lines = event.split('\n')
    let eventType = ''
    let dataStr = ''
    
    for (const line of lines) {
      if (line.startsWith('event: ')) eventType = line.slice(7)
      else if (line.startsWith('data: ')) dataStr = line.slice(6)
    }
    
    if (eventType && dataStr) {
      const data = JSON.parse(dataStr)
      handleEvent(eventType, data)
    }
  }
}
```

## Gestion des erreurs

### Erreur réseau
Si la connexion SSE est interrompue, le client doit :
1. Afficher un message d'erreur
2. Proposer de réessayer
3. Marquer le message comme "error"

### Timeout
Si aucun événement n'est reçu pendant 30s, considérer la connexion comme morte.

### Annulation
L'utilisateur peut annuler une requête en cours via `AbortController`.

```typescript
const abortController = new AbortController()

fetch('/api/agent', {
  signal: abortController.signal
})

// Pour annuler
abortController.abort()
```


