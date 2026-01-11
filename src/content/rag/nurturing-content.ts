/**
 * Contenu RAG pour le nurturing des visiteurs
 * 
 * Articles et contenus adaptés aux intentions latentes :
 * - curiosité, réflexion, apprentissage, comparaison, inspiration
 * 
 * Ces contenus sont proposés par l'agent compagnon pour
 * accompagner les visiteurs qui ne sont pas encore prêts à agir.
 */

import type { RAGDocument } from './platform-docs'

/**
 * Contenus de nurturing pour les différentes intentions latentes
 */
export const nurturingDocs: RAGDocument[] = [
  // ============================================================================
  // CURIOSITÉ - Pour ceux qui découvrent
  // ============================================================================
  {
    externalId: 'nurturing-curiosite-intro',
    collection: 'nurturing',
    title: 'Découvrir TUGE sans pression',
    content: `
Tu viens d'arriver sur TUGE et tu te demandes ce que c'est vraiment ?

TUGE, c'est une marketplace conversationnelle. Ça veut dire quoi concrètement ?

Au lieu de parcourir des dizaines d'annonces, tu parles directement avec un assistant IA qui comprend ce que tu cherches. Tu lui expliques ton besoin, et il te met en relation avec les bonnes personnes.

Que tu veuilles acheter, vendre, ou simplement comprendre comment ça marche, tu es au bon endroit.

Prends ton temps. Pose tes questions. Il n'y a aucune obligation.
    `.trim(),
    metadata: {
      category: 'nurturing',
      intention: 'curiosite',
      priority: 'high',
    },
  },
  {
    externalId: 'nurturing-curiosite-difference',
    collection: 'nurturing',
    title: 'Ce qui rend TUGE différent',
    content: `
Sur les plateformes classiques, tu passes des heures à chercher, comparer, contacter des vendeurs qui ne répondent pas...

Sur TUGE, c'est différent :

1. Tu expliques ce que tu veux à l'agent IA
2. Il comprend ton besoin réel (pas juste des mots-clés)
3. Il te propose des options pertinentes
4. Tu choisis et tu échanges directement

Pas de scroll infini. Pas de formulaires compliqués. Juste une conversation naturelle.

C'est comme avoir un assistant personnel qui connaît tous les prestataires et tous les produits.
    `.trim(),
    metadata: {
      category: 'nurturing',
      intention: 'curiosite',
      priority: 'medium',
    },
  },

  // ============================================================================
  // RÉFLEXION - Pour ceux qui hésitent
  // ============================================================================
  {
    externalId: 'nurturing-reflexion-pas-presse',
    collection: 'nurturing',
    title: 'Prendre le temps de réfléchir',
    content: `
Tu n'es pas obligé de décider aujourd'hui. Vraiment.

Beaucoup de personnes arrivent sur TUGE avec une idée vague. Peut-être que tu as un projet en tête mais tu ne sais pas encore par où commencer.

C'est normal. Et c'est même sain de prendre le temps.

Ce que tu peux faire maintenant :
- Poser des questions pour mieux comprendre
- Explorer les possibilités sans t'engager
- Revenir quand tu seras prêt

L'agent est là pour t'accompagner, pas pour te presser.
    `.trim(),
    metadata: {
      category: 'nurturing',
      intention: 'reflexion',
      priority: 'high',
    },
  },
  {
    externalId: 'nurturing-reflexion-questions-frequentes',
    collection: 'nurturing',
    title: 'Les questions que tout le monde se pose',
    content: `
Voici les questions qu'on nous pose le plus souvent :

"Est-ce que c'est gratuit ?"
Tu as 10 crédits gratuits par jour pour utiliser l'agent IA. Pour la plupart des usages, c'est largement suffisant.

"Est-ce que mes données sont sécurisées ?"
Oui, on ne vend pas tes données et on utilise des standards de sécurité élevés.

"Qu'est-ce que je peux faire concrètement ?"
Tu peux chercher des services, proposer tes compétences, ou simplement discuter pour clarifier tes besoins.

"Est-ce que je dois m'inscrire ?"
Tu peux commencer sans inscription. L'email est demandé seulement si tu veux sauvegarder tes conversations ou recevoir des alertes.
    `.trim(),
    metadata: {
      category: 'nurturing',
      intention: 'reflexion',
      priority: 'medium',
    },
  },

  // ============================================================================
  // APPRENTISSAGE - Pour ceux qui veulent comprendre
  // ============================================================================
  {
    externalId: 'nurturing-apprentissage-fonctionnement',
    collection: 'nurturing',
    title: 'Comment fonctionne TUGE étape par étape',
    content: `
Voici comment ça se passe sur TUGE :

**Pour les acheteurs :**
1. Tu décris ce que tu cherches à l'agent
2. L'agent te pose des questions pour affiner
3. Il te propose des options adaptées
4. Tu choisis et tu échanges avec le vendeur

**Pour les vendeurs :**
1. Tu décris ce que tu proposes
2. L'agent crée une annonce pour toi
3. Les acheteurs intéressés te contactent
4. Tu concrétises tes ventes

**Le système de crédits :**
- 10 crédits gratuits par jour (renouvelés automatiquement)
- 1 crédit = 1 échange avec l'agent
- Des packs si tu veux plus de crédits

C'est simple, transparent, sans surprise.
    `.trim(),
    metadata: {
      category: 'nurturing',
      intention: 'apprentissage',
      priority: 'high',
    },
  },
  {
    externalId: 'nurturing-apprentissage-parrainage',
    collection: 'nurturing',
    title: 'Comprendre le système de parrainage',
    content: `
TUGE a un système de parrainage sur 5 niveaux. Voici comment ça marche :

Quand quelqu'un s'inscrit avec ton code parrain et achète des crédits, tu reçois une commission.

**Les niveaux :**
- Niveau 1 (tes filleuls directs) : 20%
- Niveau 2 : 10%
- Niveau 3 : 5%
- Niveau 4 : 3%
- Niveau 5 : 2%

**Important à comprendre :**
- Ce n'est PAS un revenu garanti
- Ça dépend de l'activité de ton réseau
- C'est un bonus, pas une promesse

Le parrainage est une opportunité, pas un emploi. Sois réaliste dans tes attentes.
    `.trim(),
    metadata: {
      category: 'nurturing',
      intention: 'apprentissage',
      priority: 'medium',
    },
  },

  // ============================================================================
  // COMPARAISON - Pour ceux qui évaluent
  // ============================================================================
  {
    externalId: 'nurturing-comparaison-autres-plateformes',
    collection: 'nurturing',
    title: 'TUGE comparé aux autres plateformes',
    content: `
Tu compares peut-être TUGE à d'autres services. Voici les différences clés :

**Par rapport aux petites annonces classiques :**
- Pas de scroll infini
- L'IA comprend ton besoin réel
- Mise en relation directe et pertinente

**Par rapport aux plateformes de freelance :**
- Pas de commission sur les transactions
- Interface conversationnelle naturelle
- Accessible aux particuliers comme aux pros

**Par rapport aux assistants virtuels :**
- Connecté à une vraie marketplace
- Des vrais prestataires et vendeurs
- Actions concrètes, pas juste des conseils

On ne prétend pas être parfait. Mais on fait les choses différemment.
    `.trim(),
    metadata: {
      category: 'nurturing',
      intention: 'comparaison',
      priority: 'high',
    },
  },
  {
    externalId: 'nurturing-comparaison-pour-qui',
    collection: 'nurturing',
    title: 'Est-ce que TUGE est fait pour toi ?',
    content: `
TUGE n'est pas pour tout le monde. Voici pour qui c'est vraiment utile :

**TUGE est pour toi si :**
- Tu veux gagner du temps dans tes recherches
- Tu préfères parler plutôt que remplir des formulaires
- Tu cherches des services ou tu en proposes
- Tu veux explorer sans pression

**TUGE n'est peut-être pas pour toi si :**
- Tu veux acheter des produits physiques en grande quantité
- Tu cherches uniquement les prix les plus bas
- Tu n'aimes pas interagir avec une IA

Sois honnête avec toi-même. Si ça ne te correspond pas, pas de problème.
    `.trim(),
    metadata: {
      category: 'nurturing',
      intention: 'comparaison',
      priority: 'medium',
    },
  },

  // ============================================================================
  // INSPIRATION - Pour ceux qui cherchent des idées
  // ============================================================================
  {
    externalId: 'nurturing-inspiration-exemples',
    collection: 'nurturing',
    title: 'Ce que font les autres sur TUGE',
    content: `
Voici quelques exemples de ce que les gens font sur TUGE :

**Des particuliers qui cherchent :**
- Un prof de guitare pour leur enfant
- Un jardinier pour l'été
- Quelqu'un pour des petits travaux

**Des professionnels qui proposent :**
- Un développeur web freelance
- Une coach en nutrition
- Un électricien indépendant

**Des curieux qui explorent :**
- Comprendre comment créer un réseau
- Découvrir de nouvelles opportunités
- Se projeter dans une activité secondaire

Chacun utilise TUGE à sa façon. Il n'y a pas de bonne ou mauvaise approche.
    `.trim(),
    metadata: {
      category: 'nurturing',
      intention: 'inspiration',
      priority: 'high',
    },
  },
  {
    externalId: 'nurturing-inspiration-temoignages',
    collection: 'nurturing',
    title: 'Témoignages d\'utilisateurs',
    content: `
Voici ce que disent certains utilisateurs (anonymisés) :

"Au début j'étais sceptique. Une IA qui comprend ce que je veux ? Mais j'ai essayé et j'ai trouvé un plombier en 5 minutes. Avant, je passais des heures à comparer." - Marie, 42 ans

"Je suis graphiste freelance. Sur les autres plateformes, je passe mon temps à répondre à des demandes non qualifiées. Ici, les contacts sont plus pertinents." - Thomas, 31 ans

"Je n'ai pas encore acheté ni vendu. Mais les conversations avec l'agent m'ont aidé à clarifier mon projet. C'est déjà ça." - Sophie, 28 ans

Chaque parcours est différent. Le tien sera unique aussi.
    `.trim(),
    metadata: {
      category: 'nurturing',
      intention: 'inspiration',
      priority: 'medium',
    },
  },
  {
    externalId: 'nurturing-inspiration-premier-pas',
    collection: 'nurturing',
    title: 'Par où commencer quand on ne sait pas',
    content: `
Tu ne sais pas trop par où commencer ? C'est normal.

Voici quelques idées :

**Si tu as une vague idée :**
Explique-la à l'agent, même imparfaitement. Il t'aidera à la clarifier.

**Si tu veux juste explorer :**
Pose des questions. Demande comment ça marche. Il n'y a pas de mauvaise question.

**Si tu as peur de te tromper :**
Tu ne peux pas te tromper ici. C'est une conversation, pas un engagement.

**Si tu veux voir avant de décider :**
Regarde les annonces, les services proposés. Fais-toi une idée.

Le plus important : commence par ce qui t'attire naturellement.
    `.trim(),
    metadata: {
      category: 'nurturing',
      intention: 'inspiration',
      priority: 'high',
    },
  },

  // ============================================================================
  // TRANSITION VERS L'ACTION
  // ============================================================================
  {
    externalId: 'nurturing-transition-pret',
    collection: 'nurturing',
    title: 'Quand tu seras prêt',
    content: `
Tu n'as rien à décider maintenant.

Mais quand tu seras prêt à passer à l'action, voici ce qui t'attend :

**Pour acheter ou chercher un service :**
Tu décris ton besoin, l'agent fait le reste.

**Pour vendre ou proposer tes services :**
Tu expliques ce que tu fais, l'agent crée ton annonce.

**Pour développer ton réseau :**
Tu partages ton code parrain et tu accompagnes tes contacts.

D'ici là, prends le temps qu'il te faut. L'agent sera là quand tu reviendras.
    `.trim(),
    metadata: {
      category: 'nurturing',
      intention: 'transition',
      priority: 'high',
    },
  },
]

/**
 * Récupère les contenus de nurturing par intention
 */
export function getNurturingContentByIntention(intention: string): RAGDocument[] {
  return nurturingDocs.filter(doc => doc.metadata?.intention === intention)
}

/**
 * Récupère un contenu de nurturing par ID
 */
export function getNurturingContentById(id: string): RAGDocument | undefined {
  return nurturingDocs.find(doc => doc.externalId === id)
}

/**
 * Récupère les contenus de nurturing de haute priorité
 */
export function getHighPriorityNurturingContent(): RAGDocument[] {
  return nurturingDocs.filter(doc => doc.metadata?.priority === 'high')
}






