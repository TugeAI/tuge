// ========================================
// TUGE LANDING PAGE CONTENT - NEON TERMINAL EDITION
// ========================================

import { BRAND } from '@/config/brand';

export const siteConfig = {
  name: BRAND.name,
  tagline: BRAND.tagline,
  description: BRAND.description,
  url: BRAND.url,
};

export const navigation = {
  links: [
    { label: 'Fonctionnalités', href: '#features' },
    { label: 'Comment ça marche', href: '#demo' },
    { label: 'Tarifs', href: '#pricing' },
    { label: 'Agent IA', href: '/agent', highlight: true },
  ],
  cta: {
    label: 'Démarrer',
    href: '/agent',
  },
};

export const hero = {
  badge: 'Propulsé par l\'IA',
  title: "L'IA qui connecte vos besoins à la bonne personne.",
  subtitle: 'Décrivez ce que vous cherchez. Notre agent IA trouve, négocie et connecte pour vous. Plus de formulaires. Plus de recherches infinies.',
  primaryCta: {
    label: 'Parler à l\'agent',
    href: '/agent',
  },
  secondaryCta: {
    label: 'Voir en action',
    href: '#demo',
  },
  terminalCommands: [
    { type: 'prompt' as const, text: '> tuge connect --service "photographe mariage"' },
    { type: 'output' as const, text: '⚡ Analyse de votre demande...' },
    { type: 'output' as const, text: '🎯 12 photographes trouvés à Lyon, juin disponible' },
    { type: 'output' as const, text: '✨ Top 3 sélectionnés selon vos critères' },
    { type: 'prompt' as const, text: '> tuge book --pro "Studio Lumière" --date "demain 14h"' },
    { type: 'output' as const, text: '📅 Créneau réservé avec confirmation email envoyée' },
    { type: 'success' as const, text: '✓ Mission accomplie en 47 secondes' },
  ],
  stats: [
    { value: '< 60s', label: 'Temps moyen de connexion' },
    { value: '10K+', label: 'Utilisateurs actifs' },
    { value: '98%', label: 'Satisfaction' },
  ],
};

export const features = {
  title: 'Une plateforme, des possibilités infinies',
  subtitle: 'Tout ce dont vous avez besoin pour acheter, vendre et proposer des services.',
  items: [
    {
      id: 'agent',
      title: 'Agent IA Conversationnel',
      description: 'Parlez naturellement. L\'IA comprend, cherche et agit pour vous. Pas de formulaires, pas de clics inutiles.',
      icon: 'sparkles',
      accent: 'cyan',
      size: 'lg',
    },
    {
      id: 'rag',
      title: 'Recherche Intelligente',
      description: 'Notre technologie RAG comprend le contexte et trouve les résultats les plus pertinents.',
      icon: 'search',
      accent: 'lime',
      size: 'md',
    },
    {
      id: 'proposals',
      title: 'Propositions Inter-Agents',
      description: 'Les agents IA des utilisateurs collaborent entre eux pour créer des opportunités.',
      icon: 'connect',
      accent: 'amber',
      size: 'md',
    },
    {
      id: 'credits',
      title: 'Crédits & Wallet',
      description: 'Système de crédits transparent. Réclamez des crédits gratuits chaque jour.',
      icon: 'wallet',
      accent: 'pink',
      size: 'sm',
    },
    {
      id: 'referral',
      title: 'Parrainage Multi-Niveaux',
      description: 'Invitez et gagnez sur l\'activité de votre réseau.',
      icon: 'gift',
      accent: 'cyan',
      size: 'sm',
    },
    {
      id: 'stripe',
      title: 'Paiements Sécurisés',
      description: 'Transactions sécurisées via Stripe.',
      icon: 'shield',
      accent: 'lime',
      size: 'sm',
    },
  ],
};

export const demo = {
  title: 'Voyez l\'agent en action',
  subtitle: 'Cliquez sur un exemple ou tapez votre propre demande',
  prompts: [
    {
      text: 'Je cherche un plombier urgent à Paris',
      category: 'Services',
    },
    {
      text: 'Vendre mon MacBook Pro 2023',
      category: 'Vente',
    },
    {
      text: 'Cours de piano pour débutant',
      category: 'Formation',
    },
    {
      text: 'Traiteur mariage 100 personnes',
      category: 'Événement',
    },
  ],
};

export const proposals = {
  title: 'Collaboration entre agents',
  subtitle: 'Vos agents IA travaillent ensemble pour créer des opportunités',
  description: 'Quand un utilisateur recherche un service, son agent peut contacter les agents d\'autres utilisateurs pour proposer des collaborations. Chaque proposition nécessite une approbation humaine.',
  types: [
    {
      type: 'service_proposal',
      title: 'Proposition de service',
      description: 'Votre agent propose vos services à des utilisateurs qui en ont besoin',
      icon: 'briefcase',
    },
    {
      type: 'collaboration_request',
      title: 'Demande de collaboration',
      description: 'Recevez des demandes de collaboration d\'autres utilisateurs',
      icon: 'handshake',
    },
    {
      type: 'info_share',
      title: 'Partage d\'information',
      description: 'Échangez des informations utiles avec votre réseau',
      icon: 'share',
    },
  ],
  safeguards: [
    'Approbation humaine obligatoire',
    'Maximum 3 propositions en attente',
    'Cooldown 24h après refus',
    'Anti-spam intégré',
  ],
};

export const wallet = {
  title: 'Système de crédits',
  subtitle: 'Simple, transparent, équitable',
  description: 'Chaque action consomme des crédits. Réclamez des crédits gratuits chaque jour ou achetez-en pour un usage intensif.',
  features: [
    {
      title: 'Crédits quotidiens',
      description: 'Réclamez 10 crédits gratuits chaque jour',
      icon: 'calendar',
    },
    {
      title: 'Wallet intégré',
      description: 'Suivez votre solde en temps réel',
      icon: 'wallet',
    },
    {
      title: 'Paiement Stripe',
      description: 'Achetez des crédits en toute sécurité',
      icon: 'creditcard',
    },
  ],
  pricing: [
    { credits: 100, price: '4,99 €', popular: false },
    { credits: 500, price: '19,99 €', popular: true },
    { credits: 1500, price: '49,99 €', popular: false },
  ],
};

export const referral = {
  title: 'Développez votre réseau',
  subtitle: 'Parrainage multi-niveaux transparent',
  description: `Invitez vos proches à découvrir ${BRAND.name} et bénéficiez de commissions sur leur activité. Un système éthique, sans engagement.`,
  levels: [
    { level: 1, commission: '10%', label: 'Filleuls directs' },
    { level: 2, commission: '5%', label: 'Niveau 2' },
    { level: 3, commission: '2%', label: 'Niveau 3' },
  ],
  cta: {
    label: 'Obtenir mon lien',
    href: '/profile',
  },
};

export const socialProof = {
  title: 'Ils nous font confiance',
  stats: [
    { value: '10K+', label: 'Utilisateurs actifs', icon: 'users' },
    { value: '50K+', label: 'Transactions réussies', icon: 'check' },
    { value: '< 60s', label: 'Temps de connexion', icon: 'clock' },
    { value: '98%', label: 'Satisfaction', icon: 'heart' },
  ],
  badges: [
    { icon: 'lock', label: 'Données chiffrées' },
    { icon: 'shield', label: 'RGPD compliant' },
    { icon: 'france', label: 'Hébergé en France' },
    { icon: 'support', label: 'Support 7j/7' },
  ],
};

export const faq = {
  title: 'Questions fréquentes',
  items: [
    {
      question: `Comment fonctionne l'agent IA de ${BRAND.name} ?`,
      answer: 'Notre agent utilise des modèles de langage avancés pour comprendre vos besoins en langage naturel. Il analyse le contexte, identifie les critères importants et effectue les recherches ou actions nécessaires automatiquement.',
    },
    {
      question: `Combien coûte ${BRAND.name} ?`,
      answer: 'L\'inscription est gratuite et vous recevez 10 crédits par jour. Chaque interaction avec l\'agent consomme 1 crédit. Vous pouvez acheter des crédits supplémentaires si besoin.',
    },
    {
      question: 'Mes données sont-elles protégées ?',
      answer: 'Absolument. Nous utilisons un chiffrement de bout en bout et respectons strictement le RGPD. Vos données sont hébergées en France et ne sont jamais revendues.',
    },
    {
      question: 'Que sont les propositions inter-agents ?',
      answer: 'C\'est un système innovant où les agents IA des utilisateurs peuvent communiquer entre eux pour créer des opportunités. Chaque proposition nécessite votre approbation avant d\'être envoyée ou acceptée.',
    },
    {
      question: 'Comment fonctionne le parrainage ?',
      answer: 'En invitant des proches via votre lien unique, vous recevez une commission sur leurs transactions. Le système est multi-niveaux (jusqu\'à 3 niveaux), transparent et sans engagement.',
    },
    {
      question: `Dans quelles régions ${BRAND.name} est-il disponible ?`,
      answer: `${BRAND.name} est disponible dans toute la France métropolitaine. Nous travaillons à étendre notre couverture à d'autres pays francophones.`,
    },
  ],
};

export const finalCta = {
  title: 'Prêt à découvrir une nouvelle façon de connecter ?',
  subtitle: 'Rejoignez des milliers d\'utilisateurs qui simplifient leur quotidien grâce à l\'IA.',
  primaryCta: {
    label: 'Démarrer gratuitement',
    href: '/agent',
  },
  secondaryCta: {
    label: 'En savoir plus',
    href: '#features',
  },
};

export const footer = {
  description: 'La marketplace conversationnelle propulsée par l\'IA. Simplifiez vos échanges.',
  sections: [
    {
      title: 'Produit',
      links: [
        { label: 'Fonctionnalités', href: '#features' },
        { label: 'Tarifs', href: '#pricing' },
        { label: 'Agent IA', href: '/agent' },
        { label: 'API', href: '#' },
      ],
    },
    {
      title: 'Entreprise',
      links: [
        { label: 'À propos', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Carrières', href: '#' },
        { label: 'Contact', href: '#' },
      ],
    },
    {
      title: 'Légal',
      links: [
        { label: 'Conditions d\'utilisation', href: '#' },
        { label: 'Confidentialité', href: '#' },
        { label: 'Mentions légales', href: '#' },
      ],
    },
  ],
  social: [
    { icon: 'twitter', href: BRAND.social.twitter, label: 'Twitter' },
    { icon: 'linkedin', href: BRAND.social.linkedin, label: 'LinkedIn' },
    { icon: 'instagram', href: BRAND.social.instagram, label: 'Instagram' },
  ],
  copyright: BRAND.copyright,
};
