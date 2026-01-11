# Product & Service Identifier - Documentation

## 🎯 Vue d'ensemble

Le système **Product & Service Identifier** est un sous-agent intelligent qui identifie automatiquement le type de produit ou service que l'utilisateur souhaite vendre, et extrait les informations pertinentes de manière structurée.

## 📦 Architecture

### Fichiers créés

1. **`src/lib/agent/taxonomy.ts`** : Taxonomie complète de tous les produits et services
2. **`src/lib/agent/sub-agents/technical/product-identifier.ts`** : Sous-agent d'identification
3. Modifications dans :
   - `src/lib/agent/sub-agents/types.ts` : Ajout du type `product_identifier`
   - `src/lib/agent/orchestrator/router.ts` : Règles de routage
   - `src/lib/agent/runAgent.ts` : Enregistrement du sous-agent

## 🏗️ Catégories supportées

### Produits
- **Mode & Accessoires** : vêtements, chaussures, sacs, bijoux, montres
- **Beauté & Bien-être** : cosmétiques, parfums, soins
- **Maison & Décoration** : meubles, décoration, électroménager
- **High-tech & Électronique** : téléphones, ordinateurs, tablettes
- **Auto, Moto & Mobilité** : véhicules, motos, vélos, pièces détachées
- **Enfants & Famille** : jouets, puériculture, jeux
- **Alimentation & Produits locaux** : produits alimentaires, artisanaux

### Services
- **Services professionnels** : conseil, comptabilité, juridique
- **Digital & Tech** : développement, design, marketing
- **Formation & Coaching** : cours, coaching, mentorat
- **Services à domicile** : ménage, bricolage, jardinage
- **Services automobiles** : entretien, réparation, expertise
- **Événementiel** : mariages, animation, décoration
- **Voyage & Loisirs** : billetterie, hébergement, guides
- **Services communautaires & culturels** : associations, entraide

### Freelance
- **Missions freelance** : prestations, contrats, missions ponctuelles

## 🔄 Flow d'utilisation

### Exemple 1 : Vente d'un véhicule

**Utilisateur** : "Je veux vendre ma Nissan Micra de 2018"

**1. Détection de catégorie** (automatique)
```typescript
{
  mainCategory: "product",
  subCategory: "auto_moto",
  confidence: 0.95
}
```

**2. Extraction des données** (via GPT-4o-mini)
```json
{
  "data": {
    "marque": "Nissan",
    "modèle": "Micra",
    "année": 2018
  },
  "missingFields": [
    "kilométrage",
    "carburant",
    "transmission",
    "état_général",
    "prix"
  ],
  "nextQuestions": [
    "Quel est le kilométrage actuel ?",
    "Quel type de carburant (essence, diesel) ?",
    "Dans quel état général est le véhicule ?"
  ]
}
```

**3. Agent principal** utilise ces données pour :
- Créer un brouillon avec `agent_metadata` enrichi
- Poser les questions manquantes une par une
- Générer un titre optimisé

### Exemple 2 : Service de coaching

**Utilisateur** : "Je propose du coaching sportif à domicile"

**1. Détection**
```typescript
{
  mainCategory: "service",
  subCategory: "training_coaching",
  confidence: 0.85
}
```

**2. Extraction**
```json
{
  "data": {
    "domaine": "sport",
    "format": "à domicile"
  },
  "missingFields": ["tarif", "zone", "disponibilité", "certifications"],
  "nextQuestions": [
    "Quel est votre tarif (horaire ou forfait) ?",
    "Dans quelle zone intervenez-vous ?",
    "Avez-vous des certifications ou diplômes ?"
  ]
}
```

## 🧪 Tests à effectuer

### Test 1 : Véhicule complet
```
Message : "Je veux vendre ma Nissan Micra de 2018, essence, manuelle, 45000 km, bon état"

Résultat attendu :
- Catégorie : auto_moto
- Données extraites : marque, modèle, année, carburant, transmission, kilométrage, état
- Questions manquantes : prix, localisation, contrôle technique
```

### Test 2 : Service simple
```
Message : "Je propose des cours de guitare en ligne"

Résultat attendu :
- Catégorie : training_coaching
- Données extraites : domaine (musique/guitare), format (en ligne)
- Questions manquantes : tarif, niveau, disponibilité
```

### Test 3 : Électronique
```
Message : "Je vends mon iPhone 12, 128 Go, noir, comme neuf avec boîte"

Résultat attendu :
- Catégorie : hightech_electronics
- Données extraites : marque, modèle, stockage, couleur, état, boite_origine
- Questions manquantes : prix, garantie, accessoires
```

## 📊 Structure des données dans agent_metadata

Les données extraites sont stockées dans le champ JSONB `agent_metadata` du brouillon :

```typescript
{
  // Métadonnées de taxonomie
  productCategory: "auto_moto",
  mainCategory: "product",
  
  // Données spécifiques extraites
  productData: {
    marque: "Nissan",
    modèle: "Micra",
    année: 2018,
    kilométrage: 45000,
    carburant: "essence",
    transmission: "manuelle",
    état_général: "bon"
    // ... autres champs
  },
  
  // Métadonnées d'extraction
  extractionConfidence: 0.95,
  extractionTimestamp: "2024-01-04T...",
  missingFields: ["prix", "localisation"],
  
  // Données agent existantes
  agentVersion: "1.0.0",
  conversationId: "uuid..."
}
```

## 🎨 Intégration avec l'UI

Le Workspace peut afficher des formulaires dynamiques adaptés au type de produit détecté :

```typescript
// Dans le WorkspaceView
if (draft.agent_metadata?.productCategory === 'auto_moto') {
  return <VehicleFormView data={draft.agent_metadata.productData} />
} else if (draft.agent_metadata?.productCategory === 'hightech_electronics') {
  return <ElectronicsFormView data={draft.agent_metadata.productData} />
} else {
  return <GenericFormView data={draft} />
}
```

## 🔧 Configuration

### Activation de l'orchestration

Dans l'appel à `runAgentStreamGenerator`, assurez-vous que l'orchestration est activée :

```typescript
const config: AgentConfig = {
  orchestration: {
    enabled: true, // 👈 Important !
    enableLogging: true,
    debug: process.env.NODE_ENV === 'development',
  },
  // ... autres configs
}
```

### Variables d'environnement

Le sous-agent nécessite :
```env
OPENAI_API_KEY=sk-...
```

## 🚀 Prochaines étapes

1. ✅ Tester avec différents types de produits/services
2. ⏳ Créer des composants UI dynamiques par catégorie
3. ⏳ Affiner les prompts d'extraction pour chaque catégorie
4. ⏳ Ajouter la validation des données extraites
5. ⏳ Créer des suggestions de prix basées sur la catégorie

## 📝 Notes importantes

- Le sous-agent est **non-bloquant** : si l'API échoue, le flow continue normalement
- Les données sont stockées en **JSONB**, donc pas besoin de migration SQL
- Le système est **évolutif** : facile d'ajouter de nouvelles catégories dans `taxonomy.ts`
- L'extraction est **conservative** : on n'invente jamais de données, on pose des questions


