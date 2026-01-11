/**
 * Coach Business - Générateur de recommandations pour les outils IA
 * 
 * Ce module génère des recommandations actionnables et priorisées
 * basées sur le completionScore et le contexte de chaque outil.
 * 
 * Règles :
 * - Maximum 3 recommandations par appel d'outil
 * - Exactement 1 recommandation high-impact
 * - Logique transparente et déterministe (pas de scoring caché)
 * - Jamais de promesse de revenus garantis
 */

import type {
  Recommendation,
  RecommendationImpact,
  RecommendationEffort,
} from './ux-messages'

import type {
  CreateListingDraftResult,
  SearchProductsResult,
  SuggestReferralMessageResult,
} from './definitions'

// ============================================================================
// Types internes
// ============================================================================

/**
 * Règle de recommandation avec condition et contenu
 */
interface RecommendationRule<T> {
  id: string
  condition: (result: T, context: RecommendationContext) => boolean
  impact: RecommendationImpact
  effort: RecommendationEffort
  title: string
  why: string
  action: string
}

/**
 * Contexte d'exécution pour les règles
 */
export interface RecommendationContext {
  isAuthenticated: boolean
  userId?: string
}

// ============================================================================
// Règles pour create_listing_draft
// ============================================================================

const CREATE_LISTING_RULES: RecommendationRule<CreateListingDraftResult>[] = [
  // HIGH IMPACT
  {
    id: 'listing-add-price',
    condition: (result) => 
      result.success && 
      result.draft !== undefined && 
      result.draft.price === undefined &&
      result.draft.priceType !== 'free',
    impact: 'high',
    effort: 'low',
    title: 'Ajouter un prix',
    why: 'Les annonces avec prix reçoivent 40% plus de contacts.',
    action: 'Modifier le brouillon',
  },
  {
    id: 'listing-publish',
    condition: (result) => 
      result.success && 
      result.draftId !== undefined &&
      result.completionScore === 100,
    impact: 'high',
    effort: 'low',
    title: 'Publier l\'annonce',
    why: 'Votre brouillon est complet et prêt à être vu par les utilisateurs.',
    action: 'Publier maintenant',
  },
  {
    id: 'listing-login-required',
    condition: (result, ctx) => 
      result.success && 
      !ctx.isAuthenticated,
    impact: 'high',
    effort: 'low',
    title: 'Se connecter pour sauvegarder',
    why: 'Votre brouillon sera perdu sans compte. L\'inscription prend 30 secondes.',
    action: 'Créer un compte',
  },
  // MEDIUM IMPACT
  {
    id: 'listing-add-location',
    condition: (result) => 
      result.success && 
      result.draft !== undefined && 
      !result.draft.location,
    impact: 'medium',
    effort: 'low',
    title: 'Préciser la localisation',
    why: 'Aide les clients proches à vous trouver plus facilement.',
    action: 'Ajouter une ville',
  },
  {
    id: 'listing-improve-description',
    condition: (result) => 
      result.success && 
      result.draft !== undefined && 
      result.draft.description.length < 100,
    impact: 'medium',
    effort: 'medium',
    title: 'Enrichir la description',
    why: 'Une description détaillée inspire confiance et réduit les questions.',
    action: 'Améliorer la description',
  },
  // LOW IMPACT
  {
    id: 'listing-share',
    condition: (result) => 
      result.success && 
      result.draftId !== undefined,
    impact: 'low',
    effort: 'low',
    title: 'Préparer le partage',
    why: 'Partagez votre annonce sur les réseaux pour plus de visibilité.',
    action: 'Voir les options de partage',
  },
]

// ============================================================================
// Règles pour search_products
// ============================================================================

const SEARCH_PRODUCTS_RULES: RecommendationRule<SearchProductsResult>[] = [
  // HIGH IMPACT
  {
    id: 'search-no-results-broaden',
    condition: (result) => 
      result.success && 
      result.totalFound === 0,
    impact: 'high',
    effort: 'low',
    title: 'Élargir la recherche',
    why: 'Essayez avec moins de filtres ou des termes plus généraux.',
    action: 'Nouvelle recherche',
  },
  {
    id: 'search-contact-provider',
    condition: (result) => 
      result.success && 
      result.totalFound > 0,
    impact: 'high',
    effort: 'low',
    title: 'Contacter un prestataire',
    why: 'Envoyez un message pour obtenir un devis personnalisé.',
    action: 'Envoyer un message',
  },
  {
    id: 'search-login-for-contact',
    condition: (result, ctx) => 
      result.success && 
      result.totalFound > 0 &&
      !ctx.isAuthenticated,
    impact: 'high',
    effort: 'low',
    title: 'Se connecter pour contacter',
    why: 'Créez un compte gratuit pour envoyer des messages aux prestataires.',
    action: 'Créer un compte',
  },
  // MEDIUM IMPACT
  {
    id: 'search-save-search',
    condition: (result, ctx) => 
      result.success && 
      result.totalFound > 0 &&
      ctx.isAuthenticated,
    impact: 'medium',
    effort: 'low',
    title: 'Sauvegarder la recherche',
    why: 'Recevez une alerte quand de nouvelles annonces correspondent.',
    action: 'Créer une alerte',
  },
  {
    id: 'search-refine-filters',
    condition: (result) => 
      result.success && 
      result.totalFound > 5,
    impact: 'medium',
    effort: 'low',
    title: 'Affiner les critères',
    why: 'Ajoutez des filtres pour trouver exactement ce que vous cherchez.',
    action: 'Ajouter des filtres',
  },
  // LOW IMPACT
  {
    id: 'search-create-listing',
    condition: (result) => 
      result.success && 
      result.totalFound === 0,
    impact: 'low',
    effort: 'medium',
    title: 'Créer une demande',
    why: 'Publiez ce que vous cherchez et laissez les prestataires vous contacter.',
    action: 'Créer une annonce',
  },
]

// ============================================================================
// Règles pour suggest_referral_message
// ============================================================================

const REFERRAL_MESSAGE_RULES: RecommendationRule<SuggestReferralMessageResult>[] = [
  // HIGH IMPACT
  {
    id: 'referral-login-for-code',
    condition: (result, ctx) => 
      result.success && 
      !ctx.isAuthenticated,
    impact: 'high',
    effort: 'low',
    title: 'Se connecter pour son code',
    why: 'Obtenez votre code parrain personnel pour suivre vos invitations.',
    action: 'Créer un compte',
  },
  {
    id: 'referral-share-now',
    condition: (result, ctx) => 
      result.success && 
      ctx.isAuthenticated &&
      result.referralCode !== undefined &&
      result.referralCode !== 'VOTRE-CODE',
    impact: 'high',
    effort: 'low',
    title: 'Partager maintenant',
    why: 'Plus vous partagez tôt, plus vous avez de chances d\'inviter vos proches.',
    action: 'Copier le message',
  },
  // MEDIUM IMPACT
  {
    id: 'referral-share-social',
    condition: (result, ctx) => 
      result.success && 
      ctx.isAuthenticated,
    impact: 'medium',
    effort: 'low',
    title: 'Partager sur les réseaux',
    why: 'LinkedIn et Facebook sont idéaux pour toucher votre réseau professionnel.',
    action: 'Choisir un réseau',
  },
  {
    id: 'referral-personalize',
    condition: (result) => 
      result.success && 
      result.suggestedMessage !== undefined,
    impact: 'medium',
    effort: 'medium',
    title: 'Personnaliser le message',
    why: 'Un message personnalisé a 3x plus de chances d\'être lu.',
    action: 'Modifier le texte',
  },
  // LOW IMPACT
  {
    id: 'referral-track-invites',
    condition: (result, ctx) => 
      result.success && 
      ctx.isAuthenticated,
    impact: 'low',
    effort: 'low',
    title: 'Suivre vos invitations',
    why: 'Consultez qui a utilisé votre code et vos récompenses.',
    action: 'Voir le tableau de bord',
  },
]

// ============================================================================
// Logique de sélection des recommandations
// ============================================================================

/**
 * Filtre et ordonne les recommandations selon les règles métier
 * 
 * Règles appliquées :
 * 1. Évaluer toutes les conditions
 * 2. Garantir exactement 1 high-impact
 * 3. Limiter à 3 recommandations max
 * 4. Prioriser : high > medium > low
 */
function selectRecommendations<T>(
  rules: RecommendationRule<T>[],
  result: T,
  context: RecommendationContext
): Recommendation[] {
  // 1. Filtrer les règles dont la condition est vraie
  const matchingRules = rules.filter(rule => rule.condition(result, context))
  
  if (matchingRules.length === 0) {
    return []
  }

  // 2. Séparer par niveau d'impact
  const highImpact = matchingRules.filter(r => r.impact === 'high')
  const mediumImpact = matchingRules.filter(r => r.impact === 'medium')
  const lowImpact = matchingRules.filter(r => r.impact === 'low')

  // 3. Sélectionner les recommandations finales
  const selected: RecommendationRule<T>[] = []

  // Toujours inclure exactement 1 high-impact (la première qui match)
  if (highImpact.length > 0) {
    selected.push(highImpact[0])
  }

  // Ajouter des medium-impact si on a de la place
  for (const rule of mediumImpact) {
    if (selected.length >= 3) break
    selected.push(rule)
  }

  // Ajouter des low-impact si on a encore de la place
  for (const rule of lowImpact) {
    if (selected.length >= 3) break
    selected.push(rule)
  }

  // 4. Convertir en Recommendation
  return selected.map(rule => ({
    id: rule.id,
    title: rule.title,
    why: rule.why,
    impact: rule.impact,
    effort: rule.effort,
    action: rule.action,
  }))
}

// ============================================================================
// Fonctions publiques par outil
// ============================================================================

/**
 * Génère les recommandations pour create_listing_draft
 */
export function generateCreateListingDraftRecommendations(
  result: CreateListingDraftResult,
  context: RecommendationContext
): Recommendation[] {
  return selectRecommendations(CREATE_LISTING_RULES, result, context)
}

/**
 * Génère les recommandations pour search_products
 */
export function generateSearchProductsRecommendations(
  result: SearchProductsResult,
  context: RecommendationContext
): Recommendation[] {
  return selectRecommendations(SEARCH_PRODUCTS_RULES, result, context)
}

/**
 * Génère les recommandations pour suggest_referral_message
 */
export function generateSuggestReferralMessageRecommendations(
  result: SuggestReferralMessageResult,
  context: RecommendationContext
): Recommendation[] {
  return selectRecommendations(REFERRAL_MESSAGE_RULES, result, context)
}







