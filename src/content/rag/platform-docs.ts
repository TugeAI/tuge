/**
 * Documents de base pour la collection "platform_docs"
 * 
 * Contient la documentation générale de Tuge :
 * - Présentation de la plateforme
 * - Guide d'utilisation
 * - FAQ
 * - Aide et support
 */

import type { RAGCollection } from '@/lib/rag'
import { BRAND } from '@/config/brand'

export interface RAGDocument {
  collection: RAGCollection
  externalId: string
  title: string
  content: string
  metadata: Record<string, unknown>
}

export const platformDocs: RAGDocument[] = [
  {
    collection: 'platform_docs',
    externalId: 'what-is-tuge',
    title: `Qu'est-ce que ${BRAND.name} ?`,
    content: `# Qu'est-ce que ${BRAND.name} ?

${BRAND.name} est une marketplace conversationnelle innovante qui connecte particuliers et professionnels de manière simple et intuitive.

## Notre concept

Contrairement aux marketplaces traditionnelles, ${BRAND.name} utilise un agent IA intelligent pour faciliter les échanges. Vous discutez naturellement avec notre assistant qui comprend vos besoins et vous met en relation avec les bonnes personnes.

## Comment ça fonctionne ?

1. **Vous exprimez votre besoin** : Décrivez ce que vous cherchez ou proposez en langage naturel
2. **L'agent IA analyse** : Notre assistant comprend votre demande et recherche les meilleures correspondances
3. **Mise en relation** : Vous êtes connecté avec des professionnels ou particuliers correspondant à vos critères
4. **Échange direct** : Discutez, négociez et finalisez vos accords directement sur la plateforme

## Qui peut utiliser ${BRAND.name} ?

- **Particuliers** : Trouvez des services, demandez des devis, obtenez de l'aide
- **Professionnels** : Proposez vos services, trouvez des clients, développez votre activité
- **Entreprises** : Gérez vos besoins en services de manière centralisée

## Nos valeurs

- **Simplicité** : Une interface conversationnelle intuitive
- **Confiance** : Des profils vérifiés et des avis authentiques
- **Efficacité** : L'IA qui fait le travail de recherche pour vous
- **Équité** : Un système de parrainage qui récompense la communauté`,
    metadata: {
      category: 'introduction',
      priority: 1,
      keywords: ['présentation', 'concept', 'fonctionnement', 'marketplace']
    }
  },
  {
    collection: 'platform_docs',
    externalId: 'how-to-register',
    title: `Comment s'inscrire sur ${BRAND.name} ?`,
    content: `# Comment s'inscrire sur ${BRAND.name} ?

L'inscription sur ${BRAND.name} est simple, gratuite et prend moins d'une minute.

## Étapes d'inscription

### 1. Accédez à la page d'inscription
Cliquez sur le bouton "S'inscrire" en haut à droite de la page d'accueil ou dans le menu de l'agent IA.

### 2. Entrez votre email
Saisissez votre adresse email. C'est votre identifiant principal sur ${BRAND.name}.

### 3. Vérification par code OTP
Vous recevrez un code de vérification à 6 chiffres par email. Entrez ce code pour confirmer votre adresse.

### 4. C'est terminé !
Votre compte est créé. Vous pouvez immédiatement :
- Parcourir la marketplace
- Créer des annonces
- Contacter des professionnels
- Bénéficier de 10 crédits gratuits par jour

## Inscription avec code parrain

Si quelqu'un vous a parrainé, entrez son code parrain lors de l'inscription. Cela vous lie à son réseau et vous permet de bénéficier d'un suivi personnalisé.

## Questions fréquentes

**Q: L'inscription est-elle payante ?**
R: Non, l'inscription est 100% gratuite.

**Q: Puis-je m'inscrire sans email ?**
R: Non, un email valide est nécessaire pour la vérification et les notifications.

**Q: Comment retrouver mon code de vérification ?**
R: Vérifiez vos spams. Si vous ne le recevez pas, vous pouvez demander un nouvel envoi après 60 secondes.`,
    metadata: {
      category: 'getting-started',
      priority: 2,
      keywords: ['inscription', 'créer compte', 'email', 'otp', 'code']
    }
  },
  {
    collection: 'platform_docs',
    externalId: 'credits-system',
    title: `Système de crédits ${BRAND.name}`,
    content: `# Système de crédits ${BRAND.name}

${BRAND.name} fonctionne avec un système de crédits qui permet d'utiliser l'agent IA et les fonctionnalités de la plateforme.

## Types de crédits

### Crédits gratuits quotidiens
- **10 crédits offerts chaque jour**
- Réclamez-les en un clic sur le bouton "+10" dans l'interface
- Non cumulables : ils expirent à minuit (Europe/Paris)
- Non transférables à d'autres utilisateurs

### Crédits payants
- Achetés via nos packs de crédits
- **Cumulables sans expiration**
- Génèrent des commissions pour le parrainage

## Coût des actions

| Action | Coût en crédits |
|--------|-----------------|
| Message à l'agent IA | 1 crédit |
| Création d'annonce | Gratuit |
| Consultation de profils | Gratuit |
| Mise en relation | Variable |

## Packs de crédits disponibles

### Pack Starter - 10€
- 50 crédits
- Idéal pour découvrir la plateforme

### Pack Pro - 39€
- 500 crédits
- Meilleur rapport qualité/prix

### Pack Business - 129€
- 2000 crédits
- Pour les utilisateurs intensifs

## Comment acheter des crédits ?

1. Cliquez sur votre solde de crédits ou allez dans "Mon Wallet"
2. Choisissez votre pack
3. Payez par carte bancaire (Stripe sécurisé)
4. Vos crédits sont instantanément disponibles

## Ordre de consommation

Les crédits gratuits sont toujours utilisés en premier, puis les crédits payants.`,
    metadata: {
      category: 'billing',
      priority: 2,
      keywords: ['crédits', 'prix', 'tarif', 'paiement', 'gratuit', 'pack']
    }
  },
  {
    collection: 'platform_docs',
    externalId: 'create-listing',
    title: 'Comment créer une annonce ?',
    content: `# Comment créer une annonce sur ${BRAND.name} ?

Créer une annonce sur ${BRAND.name} est simple grâce à notre agent IA conversationnel.

## Méthode 1 : Via l'agent IA

La façon la plus simple de créer une annonce :

1. **Dites à l'agent** que vous voulez créer une annonce
2. **Décrivez votre service** ou votre demande en langage naturel
3. **L'agent vous guide** pour compléter les informations nécessaires
4. **Validez et publiez** votre annonce

Exemple de conversation :
> Vous : "Je voudrais proposer mes services de jardinage"
> Agent : "Super ! Décrivez-moi vos services..."

## Types d'annonces

### Offre de service
Vous proposez un service ou une compétence :
- Description de vos services
- Zone d'intervention
- Tarifs indicatifs
- Disponibilités

### Demande de service
Vous recherchez un prestataire :
- Description de votre besoin
- Budget estimé
- Délais souhaités
- Localisation

## Conseils pour une bonne annonce

1. **Soyez précis** : Décrivez clairement ce que vous proposez/cherchez
2. **Ajoutez des détails** : Zone géographique, tarifs, délais
3. **Utilisez des mots-clés** : Pour être trouvé facilement
4. **Restez honnête** : Pas de promesses exagérées

## Gestion de vos annonces

- Modifiez vos annonces à tout moment
- Désactivez temporairement si nécessaire
- Consultez les statistiques de vos annonces
- Répondez aux demandes directement via l'agent`,
    metadata: {
      category: 'features',
      priority: 2,
      keywords: ['annonce', 'créer', 'publier', 'service', 'offre', 'demande']
    }
  },
  {
    collection: 'platform_docs',
    externalId: 'faq-general',
    title: 'FAQ - Questions fréquentes',
    content: `# FAQ - Questions fréquentes sur ${BRAND.name}

## Questions générales

### ${BRAND.name} est-il gratuit ?
L'inscription et la création d'annonces sont gratuites. L'utilisation de l'agent IA consomme des crédits (10 gratuits par jour + packs payants).

### Comment fonctionne la mise en relation ?
Notre agent IA analyse votre demande et trouve les profils les plus pertinents. Vous pouvez ensuite échanger directement avec eux.

### Mes données sont-elles protégées ?
Oui, nous respectons le RGPD. Vos données ne sont jamais vendues et sont utilisées uniquement pour le fonctionnement de la plateforme.

## Questions sur les crédits

### Mes crédits gratuits sont-ils cumulables ?
Non, les 10 crédits quotidiens gratuits expirent chaque jour à minuit. Réclamez-les tous les jours !

### Puis-je obtenir un remboursement ?
Les crédits achetés ne sont pas remboursables mais n'expirent jamais.

### Comment voir mon solde ?
Votre solde est affiché en haut de la page, à côté de votre profil.

## Questions techniques

### L'agent IA ne répond pas, que faire ?
Vérifiez votre connexion internet. Si le problème persiste, actualisez la page ou contactez le support.

### Puis-je utiliser ${BRAND.name} sur mobile ?
Oui, le site est entièrement responsive et fonctionne sur tous les appareils.

### Comment supprimer mon compte ?
Contactez le support via l'agent IA ou par email. La suppression est définitive.

## Questions sur le parrainage

### Comment fonctionne le parrainage ?
Partagez votre code parrain. Quand vos filleuls achètent des crédits, vous recevez une commission sur 5 niveaux.

### Quand puis-je retirer mes commissions ?
Les commissions sont créditées sur votre balance MLM et peuvent être retirées selon les conditions en vigueur.`,
    metadata: {
      category: 'faq',
      priority: 3,
      keywords: ['faq', 'questions', 'aide', 'problème', 'support']
    }
  },
]
