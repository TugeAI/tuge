/**
 * Templates de messages pour les suggestions proactives
 * 
 * Chaque template génère le contenu d'une suggestion basé sur le contexte.
 */

import type { SuggestionTrigger, SuggestionPriority, Json } from '@/lib/supabase/types'
import { BRAND } from '@/config/brand'

/**
 * Contenu d'une suggestion
 */
export interface SuggestionContent {
  title: string
  message: string
  actionPrompt: string
  priority: SuggestionPriority
}

/**
 * Contexte pour générer une suggestion
 */
export interface SuggestionContext {
  /** Données spécifiques au trigger */
  metadata?: Record<string, unknown>
  /** Nom de l'utilisateur (optionnel) */
  userName?: string
}

/**
 * Génère le contenu pour une suggestion de type page_entry
 */
function generatePageEntryContent(context: SuggestionContext): SuggestionContent {
  const greeting = context.userName 
    ? `Bonjour ${context.userName} !` 
    : 'Bonjour !'
  
  return {
    title: 'Bienvenue sur ' + BRAND.name,
    message: `${greeting} Comment puis-je vous aider aujourd'hui ? Je peux vous aider à créer une annonce, rechercher un service ou comprendre le fonctionnement de la plateforme.`,
    actionPrompt: "Qu'est-ce que je peux faire sur " + BRAND.name + " ?",
    priority: 'low',
  }
}

/**
 * Génère le contenu pour une suggestion de brouillon non publié
 */
function generateDraftNotPublishedContent(context: SuggestionContext): SuggestionContent {
  const draftTitle = context.metadata?.draft_title as string | undefined
  const truncatedTitle = draftTitle 
    ? (draftTitle.length > 30 ? draftTitle.substring(0, 27) + '...' : draftTitle)
    : 'votre annonce'
  
  return {
    title: 'Brouillon en attente',
    message: `Votre annonce "${truncatedTitle}" attend d'être publiée depuis plus de 24h. Souhaitez-vous la finaliser et la publier ?`,
    actionPrompt: "Je voudrais publier mon brouillon d'annonce",
    priority: 'high',
  }
}

/**
 * Génère le contenu pour une suggestion de recherche sans résultats
 */
function generateSearchNoResultsContent(context: SuggestionContext): SuggestionContent {
  const searchQuery = context.metadata?.search_query as string | undefined
  const queryDisplay = searchQuery 
    ? (searchQuery.length > 25 ? searchQuery.substring(0, 22) + '...' : searchQuery)
    : 'votre recherche'
  
  return {
    title: 'Aucun résultat trouvé',
    message: `Nous n'avons pas trouvé de résultats pour "${queryDisplay}". Vous pourriez créer une annonce de recherche pour que les prestataires vous contactent directement !`,
    actionPrompt: "Je voudrais créer une annonce pour trouver un prestataire",
    priority: 'medium',
  }
}

/**
 * Génère le contenu pour une suggestion d'activité de parrainage
 */
function generateNoReferralActivityContent(context: SuggestionContext): SuggestionContent {
  return {
    title: 'Développez votre réseau',
    message: `Vous n'avez pas encore de filleuls. Partagez votre code parrain avec vos proches et gagnez des commissions sur leurs achats de crédits !`,
    actionPrompt: "Comment puis-je partager mon code parrain ?",
    priority: 'medium',
  }
}

/**
 * Générateurs de contenu par type de trigger
 */
const CONTENT_GENERATORS: Record<SuggestionTrigger, (context: SuggestionContext) => SuggestionContent> = {
  page_entry: generatePageEntryContent,
  draft_not_published: generateDraftNotPublishedContent,
  search_no_results: generateSearchNoResultsContent,
  no_referral_activity: generateNoReferralActivityContent,
}

/**
 * Génère le contenu d'une suggestion basé sur le trigger et le contexte
 */
export function generateSuggestionContent(
  trigger: SuggestionTrigger,
  context: SuggestionContext = {}
): SuggestionContent {
  const generator = CONTENT_GENERATORS[trigger]
  return generator(context)
}

/**
 * Convertit les métadonnées en format JSON pour Supabase
 */
export function formatMetadata(metadata: Record<string, unknown>): Json {
  return metadata as Json
}







