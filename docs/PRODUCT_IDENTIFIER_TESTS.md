# Test du Product & Service Identifier

## 🧪 Guide de test

Pour tester le nouveau système d'identification de produits, suivez ces étapes :

## 1️⃣ Configuration préalable

Assurez-vous que :
- ✅ `OPENAI_API_KEY` est configurée dans `.env.local`
- ✅ L'utilisateur est connecté
- ✅ L'orchestration est activée dans la configuration de l'agent

## 2️⃣ Tests recommandés

### Test A : Véhicule - Nissan Micra

**Message à envoyer** :
```
Je veux vendre ma Nissan Micra de 2018
```

**Comportement attendu** :
1. L'orchestrateur détecte l'intent `sell_product_or_service`
2. Le sous-agent `product_identifier` est consulté
3. Extraction des données :
   - Catégorie : `auto_moto`
   - Marque : `Nissan`
   - Modèle : `Micra`
   - Année : `2018`
4. L'agent pose des questions ciblées :
   - Kilométrage ?
   - Type de carburant ?
   - État général ?
   - Prix souhaité ?

**Vérification dans les métadonnées** :
```json
{
  "agent_metadata": {
    "mainCategory": "product",
    "productCategory": "auto_moto",
    "productData": {
      "marque": "Nissan",
      "modèle": "Micra",
      "année": 2018
    }
  }
}
```

---

### Test B : Véhicule complet

**Message à envoyer** :
```
Je veux vendre ma Nissan Micra de 2018, essence, manuelle, 45000 km, bon état, contrôle technique valide
```

**Comportement attendu** :
- Extraction de TOUS les champs mentionnés
- Questions uniquement sur les champs manquants (prix, localisation, etc.)
- Aucune répétition des informations déjà fournies

---

### Test C : Smartphone

**Message à envoyer** :
```
Je vends mon iPhone 12, 128 Go
```

**Comportement attendu** :
1. Catégorie : `hightech_electronics`
2. Extraction :
   - Marque : `Apple` (ou `iPhone`)
   - Modèle : `12`
   - Stockage : `128`
3. Questions :
   - État du téléphone ?
   - Garantie restante ?
   - Accessoires inclus ?
   - Prix ?

---

### Test D : Service de coaching

**Message à envoyer** :
```
Je propose du coaching sportif à domicile
```

**Comportement attendu** :
1. Catégorie : `training_coaching`
2. Extraction :
   - Domaine : `sport`
   - Format : `à domicile`
3. Questions :
   - Zone d'intervention ?
   - Tarif (horaire/forfait) ?
   - Diplômes/certifications ?

---

### Test E : Service digital

**Message à envoyer** :
```
Je crée des sites web en no-code avec Webflow
```

**Comportement attendu** :
1. Catégorie : `digital_tech`
2. Extraction :
   - Spécialité : `création de sites web`
   - Technologies : `no-code`, `Webflow`
3. Questions :
   - Tarif ?
   - Délai moyen ?
   - Portfolio disponible ?

---

### Test F : Meuble

**Message à envoyer** :
```
Je vends une table en bois massif
```

**Comportement attendu** :
1. Catégorie : `home_decoration`
2. Extraction :
   - Type : `table`
   - Matière : `bois massif`
3. Questions :
   - Dimensions ?
   - État ?
   - Prix ?
   - Localisation ?

---

## 3️⃣ Vérification des résultats

### Dans la console développeur

Cherchez ces logs :
```
[ProductIdentifier] Detected category: auto_moto (confidence: 0.95)
[ProductIdentifier] Extracted data: {...}
[ProductIdentifier] Missing fields: [...]
[ProductIdentifier] Next questions: [...]
```

### Dans l'interface

1. **Workspace Panel** : Devrait afficher les données extraites
2. **Chat** : L'agent pose les questions une par une
3. **Brouillon créé** : Contient `agent_metadata` enrichi

### Dans la base de données

```sql
SELECT 
  id,
  title,
  category,
  agent_metadata->>'mainCategory' as main_category,
  agent_metadata->>'productCategory' as product_category,
  agent_metadata->'productData' as product_data
FROM listing_drafts
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 1;
```

---

## 4️⃣ Tests de robustesse

### Test G : Message ambigu

**Message** : "Je vends quelque chose"

**Attendu** : Catégorie `other`, questions génériques

---

### Test H : Multiple produits

**Message** : "Je vends mon iPhone et ma voiture"

**Attendu** : L'agent demande lequel créer en premier

---

### Test I : Langage naturel

**Message** : "J'ai une Nissan que je ne conduis plus, elle a 3 ans, c'est une Micra"

**Attendu** : Extraction correcte malgré la formulation naturelle

---

## 5️⃣ Debugging

### Activer le mode debug

Dans `runAgent.ts`, ligne ~1758 :
```typescript
orchestrationConfig: { 
  ...DEFAULT_ORCHESTRATION_CONFIG, 
  ...config.orchestration,
  debug: true // 👈 Force debug mode
}
```

### Logs utiles

```typescript
console.log('[ProductIdentifier] Input:', request.input)
console.log('[ProductIdentifier] Category detection:', categoryDetection)
console.log('[ProductIdentifier] Extraction result:', extraction)
```

---

## 6️⃣ Troubleshooting

### Le sous-agent n'est pas appelé

**Vérification** :
1. L'orchestration est-elle activée ?
   ```typescript
   orchestration: { enabled: true }
   ```
2. Le routage détecte-t-il l'intent ?
   - Cherchez "vendre", "proposer", "créer annonce" dans les patterns
3. L'API OpenAI est-elle disponible ?

### Les données ne sont pas extraites

**Vérification** :
1. Le prompt d'extraction est-il bien construit ?
2. La réponse GPT est-elle un JSON valide ?
3. Le parsing JSON fonctionne-t-il ?

### Les questions posées ne sont pas pertinentes

**Solution** : Affiner le prompt dans `buildIdentifierPrompt()` pour cette catégorie spécifique

---

## 7️⃣ Amélioration continue

### Ajouter une nouvelle catégorie

1. Modifier `taxonomy.ts` :
```typescript
'new_category': {
  id: 'new_category',
  label: 'Nouvelle catégorie',
  parent: 'product' | 'service' | 'freelance',
  keywords: ['mot1', 'mot2', 'mot3'],
  specificFields: ['champ1', 'champ2', 'champ3'],
}
```

2. Tester avec un message contenant les mots-clés

3. Vérifier l'extraction et ajuster le prompt si nécessaire

---

## 📊 Métriques de succès

✅ **Taux de détection** : >90% pour les catégories principales
✅ **Taux d'extraction** : >80% des champs explicitement mentionnés
✅ **Pertinence des questions** : >85% des questions sont utiles
✅ **Temps de réponse** : <3 secondes pour l'extraction complète

---

## 🎯 Prochaines optimisations

1. **Cache des extractions** : Éviter de réanalyser le même message
2. **Validation des données** : Vérifier la cohérence (ex: année > 1900)
3. **Suggestions de valeurs** : Proposer des valeurs typiques
4. **Auto-complétion** : Utiliser des bases de données de référence


