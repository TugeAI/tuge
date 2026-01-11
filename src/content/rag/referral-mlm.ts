/**
 * Documents pour la collection "referral_mlm"
 * 
 * Contient la documentation sur le système de parrainage :
 * - Fonctionnement du parrainage
 * - Calcul des commissions
 * - Règles et bonnes pratiques
 */

import type { RAGDocument } from './platform-docs'
import { BRAND } from '@/config/brand'

export const referralDocs: RAGDocument[] = [
  {
    collection: 'referral_mlm',
    externalId: 'referral-overview',
    title: `Système de parrainage ${BRAND.name}`,
    content: `# Système de parrainage ${BRAND.name}

${BRAND.name} propose un système de parrainage innovant qui récompense les membres actifs de la communauté.

## Comment ça marche ?

### Votre code parrain unique
Chaque utilisateur inscrit reçoit un code parrain unique. Partagez ce code avec vos amis, collègues ou sur les réseaux sociaux.

### 5 niveaux de commissions
Quand un de vos filleuls (ou les filleuls de vos filleuls) achète des crédits, vous recevez une commission sur 5 niveaux :

- **Niveau 1** : Vos filleuls directs
- **Niveau 2** : Les filleuls de vos filleuls
- **Niveau 3** : 3ème génération
- **Niveau 4** : 4ème génération
- **Niveau 5** : 5ème génération

### Calcul des commissions
Les commissions sont calculées sur le bénéfice net des achats de crédits :
- Le bénéfice = Prix payé - Coûts (IA, transaction, infrastructure)
- 50% du bénéfice est redistribué aux parrains
- Ce montant est divisé équitablement entre les 5 niveaux

## Exemple concret

Imaginons que votre filleul achète le Pack Pro à 39€ :
1. ${BRAND.name} calcule le bénéfice net (environ 30€ après coûts)
2. 50% soit ~15€ vont au pool de parrainage
3. Chaque niveau reçoit ~3€

Si vous êtes le parrain direct (niveau 1), vous recevez ~3€.

## Avantages du système

- **Revenus passifs** : Gagnez sur l'activité de votre réseau
- **5 niveaux** : Profitez de la croissance de votre réseau sur plusieurs générations
- **Transparence** : Suivez vos commissions en temps réel
- **Pas de plafond** : Aucune limite de gains

## Important à savoir

⚠️ **Les gains ne sont pas garantis** : Vos revenus dépendent de l'activité réelle de votre réseau. Nous ne promettons aucun revenu fixe.

Le parrainage est un bonus, pas un salaire. Concentrez-vous sur la valeur que vous apportez à vos filleuls.`,
    metadata: {
      category: 'referral-basics',
      priority: 1,
      keywords: ['parrainage', 'mlm', 'commission', 'filleul', 'niveaux', 'gains']
    }
  },
  {
    collection: 'referral_mlm',
    externalId: 'referral-code-sharing',
    title: 'Comment partager son code parrain ?',
    content: `# Comment partager son code parrain efficacement ?

Votre code parrain est la clé pour développer votre réseau sur ${BRAND.name}. Voici comment le partager de manière efficace.

## Où trouver votre code parrain ?

1. Connectez-vous à votre compte
2. Allez dans "Mon profil" ou "Parrainage"
3. Votre code unique est affiché (ex: TUG-ABC123)

## Méthodes de partage

### 1. Partage direct
Envoyez votre code par :
- SMS à vos contacts
- Email personnalisé
- Message privé sur les réseaux sociaux

### 2. Réseaux sociaux
Postez sur :
- Facebook
- LinkedIn (si vous proposez des services pro)
- Instagram
- Twitter/X

### 3. Lien de parrainage
Utilisez votre lien unique : ${BRAND.url}/?ref=VOTRE-CODE
Ce lien pré-remplit automatiquement votre code à l'inscription.

### 4. Bouche à oreille
La méthode la plus efficace ! Parlez de ${BRAND.name} à :
- Vos amis et famille
- Vos collègues
- Vos clients existants

## Conseils pour un parrainage efficace

### ✅ À faire
- Expliquez les avantages de ${BRAND.name}
- Partagez votre propre expérience positive
- Aidez vos filleuls à bien démarrer
- Restez disponible pour leurs questions

### ❌ À éviter
- Promettre des gains garantis
- Spammer vos contacts
- Faire de fausses promesses
- Inscrire des personnes sans leur accord

## Suivi de vos parrainages

Consultez votre tableau de bord pour voir :
- Nombre de filleuls par niveau
- Commissions générées
- Activité de votre réseau`,
    metadata: {
      category: 'referral-tips',
      priority: 2,
      keywords: ['code parrain', 'partage', 'lien', 'réseaux sociaux', 'conseils']
    }
  },
  {
    collection: 'referral_mlm',
    externalId: 'referral-commissions',
    title: 'Calcul détaillé des commissions',
    content: `# Calcul détaillé des commissions de parrainage

Comprendre comment sont calculées vos commissions sur ${BRAND.name}.

## Formule de calcul

### Étape 1 : Calcul du bénéfice net
\`\`\`
Bénéfice = Prix payé 
         - Coût IA estimé (crédits × 0,004€)
         - Frais de transaction (0,30€)
         - Coûts de plateforme (répartis par utilisateur)
\`\`\`

### Étape 2 : Pool de commissions
\`\`\`
Pool MLM = Bénéfice × 50%
\`\`\`

### Étape 3 : Répartition par niveau
\`\`\`
Commission par niveau = Pool MLM ÷ 5
\`\`\`

## Exemple avec le Pack Pro (39€)

| Élément | Montant |
|---------|---------|
| Prix payé | 39,00€ |
| - Coût IA (500 × 0,004€) | -2,00€ |
| - Frais transaction | -0,30€ |
| - Coûts plateforme | -5,00€ |
| **= Bénéfice net** | **31,70€** |
| Pool MLM (50%) | 15,85€ |
| **Commission par niveau** | **3,17€** |

## Cas particuliers

### Si un niveau manque
Si votre filleul n'a pas de parrain au niveau 3, par exemple, cette part reste à la plateforme. Elle n'est pas redistribuée aux autres niveaux.

### Arrondis
Les montants sont arrondis à 2 décimales. Les centimes sont conservés par la plateforme.

## Quand sont créditées les commissions ?

- **Immédiatement** après confirmation du paiement Stripe
- **Visibles** dans votre balance MLM sous quelques minutes
- **Idempotence** : une seule commission par achat, même si le webhook est reçu plusieurs fois

## Retrait des commissions

Les conditions de retrait des commissions MLM seront détaillées dans la section "Mon Wallet". Un montant minimum peut être requis.`,
    metadata: {
      category: 'referral-commissions',
      priority: 2,
      keywords: ['commission', 'calcul', 'bénéfice', 'pourcentage', 'formule']
    }
  },
  {
    collection: 'referral_mlm',
    externalId: 'referral-ethics',
    title: 'Éthique et règles du parrainage',
    content: `# Éthique et règles du parrainage ${BRAND.name}

Le parrainage sur ${BRAND.name} suit des règles strictes pour protéger tous les membres de la communauté.

## Règles fondamentales

### 1. Pas de promesses de revenus
❌ "Gagne 1000€/mois facilement !"
✅ "Les gains dépendent de ton activité et celle de ton réseau"

Nous ne promettons JAMAIS de revenus fixes. Les commissions dépendent de l'activité réelle.

### 2. Inscription volontaire uniquement
- Ne jamais inscrire quelqu'un à son insu
- Toujours obtenir le consentement explicite
- Expliquer clairement le fonctionnement avant inscription

### 3. Transparence totale
- Expliquer honnêtement le système
- Ne pas exagérer les avantages
- Mentionner les coûts (crédits payants)

### 4. Pas de spam
- Ne pas envoyer de messages non sollicités en masse
- Respecter les refus
- Privilégier la qualité à la quantité

## Ce que le parrainage N'EST PAS

- ❌ Un système pyramidal (les gains viennent des achats réels, pas des inscriptions)
- ❌ Un revenu garanti
- ❌ Une opportunité de "devenir riche rapidement"
- ❌ Un système obligatoire (vous pouvez utiliser ${BRAND.name} sans parrainer)

## Ce que le parrainage EST

- ✅ Une récompense pour la recommandation
- ✅ Un bonus basé sur l'activité réelle
- ✅ Une façon de partager une plateforme utile
- ✅ Un système transparent et traçable

## Sanctions en cas d'abus

Les comportements suivants peuvent entraîner une suspension :
- Fausses promesses de revenus
- Spam ou harcèlement
- Fraude ou manipulation
- Création de faux comptes

## Notre philosophie

Le parrainage est un BONUS, pas un business. Concentrez-vous sur :
1. Utiliser ${BRAND.name} pour vos propres besoins
2. Recommander naturellement si vous êtes satisfait
3. Aider vos filleuls à bien utiliser la plateforme
4. Construire une communauté de qualité`,
    metadata: {
      category: 'referral-ethics',
      priority: 3,
      keywords: ['éthique', 'règles', 'abus', 'promesse', 'spam', 'pyramide']
    }
  },
]
