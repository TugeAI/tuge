/**
 * Définitions des outils IA pour l'agent Tuge
 * 
 * Ces outils sont exposés au LLM via Vercel AI SDK v6
 * et permettent à l'agent d'effectuer des actions concrètes.
 */

import { z } from 'zod'
import { tool, zodSchema } from 'ai'
import { BRAND } from '@/config/brand'
import {
  handleCreateListingDraft,
  handleSearchProducts,
  handleSuggestReferralMessage,
  handleSendCollaborationProposal,
  handleGetMyListings,
  handleSearchUserListings,
  handleUpdateListing,
  handleDeleteListing,
  handleDeleteDraftListing,
  handleBulkDeleteDrafts,
  handleActivateListing,
  handleGenerateListingImage,
  type ToolExecutionContext,
} from './handlers'
import type { ToolUXMessage } from './ux-messages'

// ============================================================================
// Schémas de validation Zod
// ============================================================================

/**
 * Catégories d'annonces disponibles
 */
export const ListingCategorySchema = z.enum(['service', 'product', 'job', 'other'])
export type ListingCategory = z.infer<typeof ListingCategorySchema>

/**
 * Types de prix
 */
export const PriceTypeSchema = z.enum(['fixed', 'hourly', 'negotiable', 'free'])
export type PriceType = z.infer<typeof PriceTypeSchema>

/**
 * Contextes pour les messages de parrainage
 */
export const ReferralContextSchema = z.enum(['friend', 'professional', 'social_media', 'family'])
export type ReferralContext = z.infer<typeof ReferralContextSchema>

/**
 * Tons de message
 */
export const MessageToneSchema = z.enum(['casual', 'formal', 'enthusiastic', 'neutral'])
export type MessageTone = z.infer<typeof MessageToneSchema>

// ============================================================================
// Paramètres des outils
// ============================================================================

/**
 * Paramètres pour create_listing_draft
 */
export const CreateListingDraftParamsSchema = z.object({
  title: z
    .string()
    .min(3, 'Le titre doit faire au moins 3 caractères')
    .max(100, 'Le titre ne peut pas dépasser 100 caractères')
    .describe('Titre de l\'annonce (max 100 caractères)'),
  
  description: z
    .string()
    .min(10, 'La description doit faire au moins 10 caractères')
    .max(2000, 'La description ne peut pas dépasser 2000 caractères')
    .describe('Description détaillée de l\'annonce (max 2000 caractères)'),
  
  category: ListingCategorySchema
    .describe('Catégorie: service (prestation), product (objet à vendre), job (offre d\'emploi), other'),
  
  price: z
    .number()
    .min(0, 'Le prix ne peut pas être négatif')
    .optional()
    .describe('Prix en euros (optionnel, laisser vide si gratuit ou à négocier)'),
  
  priceType: PriceTypeSchema
    .optional()
    .default('negotiable')
    .describe('Type de prix: fixed (fixe), hourly (horaire), negotiable, free (gratuit)'),
  
  location: z
    .string()
    .max(100, 'La localisation ne peut pas dépasser 100 caractères')
    .optional()
    .describe('Localisation (ville, département ou région)'),
  
  publishNow: z
    .boolean()
    .optional()
    .default(false)
    .describe('Si true, publie directement l\'annonce. Si false (défaut), crée un brouillon.'),
})

export type CreateListingDraftParams = z.infer<typeof CreateListingDraftParamsSchema>

/**
 * Paramètres pour search_products
 */
export const SearchProductsParamsSchema = z.object({
  query: z
    .string()
    .min(1, 'La requête ne peut pas être vide')
    .max(200, 'La requête est trop longue')
    .describe('Termes de recherche (ce que l\'utilisateur cherche)'),
  
  category: ListingCategorySchema
    .optional()
    .describe('Filtrer par catégorie (optionnel)'),
  
  maxPrice: z
    .number()
    .min(0, 'Le prix maximum ne peut pas être négatif')
    .optional()
    .describe('Prix maximum en euros (optionnel)'),
  
  location: z
    .string()
    .max(100)
    .optional()
    .describe('Filtrer par localisation (optionnel)'),
  
  limit: z
    .number()
    .min(1)
    .max(10)
    .optional()
    .default(5)
    .describe('Nombre maximum de résultats (1-10, défaut: 5)'),
})

export type SearchProductsParams = z.infer<typeof SearchProductsParamsSchema>

/**
 * Paramètres pour suggest_referral_message
 */
export const SuggestReferralMessageParamsSchema = z.object({
  context: ReferralContextSchema
    .describe('Contexte du partage: friend (ami), professional (collègue), social_media (réseaux sociaux), family (famille)'),
  
  tone: MessageToneSchema
    .optional()
    .default('casual')
    .describe('Ton du message: casual (décontracté), formal (formel), enthusiastic (enthousiaste), neutral'),
  
  includeCode: z
    .boolean()
    .optional()
    .default(true)
    .describe('Inclure le code parrain dans le message'),
})

export type SuggestReferralMessageParams = z.infer<typeof SuggestReferralMessageParamsSchema>

/**
 * Statut de filtrage pour get_my_listings
 */
export const ListingStatusFilterSchema = z.enum(['all', 'active', 'inactive', 'draft'])
export type ListingStatusFilter = z.infer<typeof ListingStatusFilterSchema>

/**
 * Paramètres pour get_my_listings
 */
export const GetMyListingsParamsSchema = z.object({
  status: ListingStatusFilterSchema
    .optional()
    .default('all')
    .describe('Filtrer par statut: all (tout), active (publiées), inactive (désactivées), draft (brouillons)'),
  
  limit: z
    .number()
    .min(1)
    .max(20)
    .optional()
    .default(10)
    .describe('Nombre maximum de résultats (1-20, défaut: 10)'),
})

export type GetMyListingsParams = z.infer<typeof GetMyListingsParamsSchema>

/**
 * Paramètres pour search_user_listings
 * Recherche et filtre les annonces de l'utilisateur par texte et/ou statut
 */
export const SearchUserListingsParamsSchema = z.object({
  query: z
    .string()
    .max(200, 'La requête est trop longue')
    .optional()
    .describe('Terme de recherche pour filtrer par titre/description (ex: "iPhone", "téléphone")'),
  
  status: ListingStatusFilterSchema
    .optional()
    .describe('Filtrer par statut: all (tout), active (publiées), inactive (désactivées), draft (brouillons)'),
  
  category: ListingCategorySchema
    .optional()
    .describe('Filtrer par catégorie: service, product, job, other'),
  
  limit: z
    .number()
    .min(1)
    .max(20)
    .optional()
    .default(10)
    .describe('Nombre maximum de résultats (1-20, défaut: 10)'),
})

export type SearchUserListingsParams = z.infer<typeof SearchUserListingsParamsSchema>

/**
 * Résultat de search_user_listings
 */
export interface SearchUserListingsResult {
  success: boolean
  message: string
  listings: Array<{
    id: string
    title: string
    description: string
    category: ListingCategory
    price?: number
    priceType: PriceType
    location?: string
    isActive: boolean
    isDraft: boolean
    viewCount: number
    contactCount: number
    createdAt: string
    publishedAt?: string
  }>
  /** Nombre total d'annonces correspondantes */
  totalCount: number
  /** Requête utilisée pour la recherche */
  searchQuery?: string
  /** Filtres appliqués */
  appliedFilters: {
    status?: string
    category?: string
  }
  error?: string
}

/**
 * Paramètres pour update_listing
 */
export const UpdateListingParamsSchema = z.object({
  listingId: z
    .string()
    .uuid('ID d\'annonce invalide')
    .describe('UUID de l\'annonce à modifier (obligatoire)'),
  
  title: z
    .string()
    .min(3, 'Le titre doit faire au moins 3 caractères')
    .max(100, 'Le titre ne peut pas dépasser 100 caractères')
    .optional()
    .describe('Nouveau titre de l\'annonce (optionnel)'),
  
  description: z
    .string()
    .min(10, 'La description doit faire au moins 10 caractères')
    .max(2000, 'La description ne peut pas dépasser 2000 caractères')
    .optional()
    .describe('Nouvelle description de l\'annonce (optionnel)'),
  
  price: z
    .number()
    .min(0, 'Le prix ne peut pas être négatif')
    .optional()
    .describe('Nouveau prix en euros (optionnel)'),
  
  location: z
    .string()
    .max(100, 'La localisation ne peut pas dépasser 100 caractères')
    .optional()
    .describe('Nouvelle localisation (optionnel)'),
  
  isActive: z
    .boolean()
    .optional()
    .describe('Activer (true) ou désactiver (false) l\'annonce (optionnel)'),
})

export type UpdateListingParams = z.infer<typeof UpdateListingParamsSchema>

/**
 * Paramètres pour delete_listing
 */
export const DeleteListingParamsSchema = z.object({
  listingId: z
    .string()
    .uuid('ID d\'annonce invalide')
    .describe('UUID de l\'annonce à supprimer (obligatoire)'),
  
  confirm: z
    .boolean()
    .refine(val => val === true, 'La confirmation doit être true pour supprimer')
    .describe('Confirmation de suppression (doit être true)'),
})

export type DeleteListingParams = z.infer<typeof DeleteListingParamsSchema>

/**
 * Paramètres pour delete_draft_listing
 */
export const DeleteDraftListingParamsSchema = z.object({
  draftId: z
    .string()
    .uuid('ID de brouillon invalide')
    .describe('UUID du brouillon à supprimer (obligatoire)'),
  
  confirm: z
    .boolean()
    .refine(val => val === true, 'La confirmation doit être true pour supprimer')
    .describe('Confirmation de suppression (doit être true, après confirmation explicite de l\'utilisateur)'),
})

export type DeleteDraftListingParams = z.infer<typeof DeleteDraftListingParamsSchema>

/**
 * Paramètres pour bulk_delete_drafts
 */
export const BulkDeleteDraftsParamsSchema = z.object({
  confirm: z
    .boolean()
    .refine(val => val === true, 'La confirmation doit être true pour supprimer')
    .describe('Confirmation de suppression en masse (doit être true, après confirmation explicite de l\'utilisateur)'),
})

export type BulkDeleteDraftsParams = z.infer<typeof BulkDeleteDraftsParamsSchema>

/**
 * Style d'image pour la génération
 */
export const ImageStyleSchema = z.enum(['photo', 'illustration', 'minimal'])
export type ImageStyle = z.infer<typeof ImageStyleSchema>

/**
 * Source de l'activation (brouillon ou annonce existante)
 */
export const ActivateListingSourceSchema = z.enum(['draft', 'listing'])
export type ActivateListingSource = z.infer<typeof ActivateListingSourceSchema>

/**
 * Paramètres pour activate_listing
 * - source = 'draft' : publie un brouillon (listing_drafts -> listings)
 * - source = 'listing' : réactive une annonce inactive (is_active = true)
 */
export const ActivateListingParamsSchema = z.object({
  id: z
    .string()
    .uuid('ID invalide')
    .describe('UUID du brouillon (source=draft) ou de l\'annonce (source=listing) à activer'),
  
  source: ActivateListingSourceSchema
    .describe('Source: "draft" pour publier un brouillon, "listing" pour réactiver une annonce inactive'),
  
  confirm: z
    .boolean()
    .refine(val => val === true, 'La confirmation doit être true pour activer')
    .describe('Confirmation d\'activation (doit être true)'),
})

export type ActivateListingParams = z.infer<typeof ActivateListingParamsSchema>

/**
 * Paramètres pour generate_listing_image
 */
export const GenerateListingImageParamsSchema = z.object({
  title: z
    .string()
    .min(3, 'Le titre doit faire au moins 3 caractères')
    .max(100, 'Le titre ne peut pas dépasser 100 caractères')
    .describe('Titre du produit/service pour lequel générer l\'image'),
  
  description: z
    .string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional()
    .describe('Description détaillée pour guider la génération (optionnel)'),
  
  style: ImageStyleSchema
    .optional()
    .default('photo')
    .describe('Style de l\'image: photo (réaliste), illustration (dessin), minimal (épuré)'),
  
  draftId: z
    .string()
    .uuid('ID de brouillon invalide')
    .optional()
    .describe('ID du brouillon auquel associer l\'image (optionnel)'),
})

export type GenerateListingImageParams = z.infer<typeof GenerateListingImageParamsSchema>

/**
 * Types de propositions inter-agents
 */
export const ProposalTypeSchema = z.enum(['service_proposal', 'collaboration_request', 'info_share'])

/**
 * Paramètres pour send_collaboration_proposal
 */
export const SendCollaborationProposalParamsSchema = z.object({
  toUserId: z
    .string()
    .uuid('ID utilisateur destinataire invalide')
    .describe('ID UUID de l\'utilisateur destinataire de la proposition'),
  
  type: ProposalTypeSchema
    .describe('Type de proposition: service_proposal (offre de service), collaboration_request (demande de collaboration), info_share (partage d\'info)'),
  
  message: z
    .string()
    .max(500, 'Message trop long (500 caractères max)')
    .optional()
    .describe('Message personnalisé pour accompagner la proposition (optionnel, max 500 caractères)'),
  
  payload: z
    .record(z.string(), z.unknown())
    .optional()
    .default({})
    .describe('Données structurées additionnelles pour la proposition (objet JSON)'),
})

export type SendCollaborationProposalParams = z.infer<typeof SendCollaborationProposalParamsSchema>

// ============================================================================
// Types de résultats des outils
// ============================================================================

/**
 * Résultat de create_listing_draft
 */
export interface CreateListingDraftResult {
  success: boolean
  draftId?: string
  message: string
  draft?: {
    title: string
    description: string
    category: ListingCategory
    price?: number
    priceType: PriceType
    location?: string
  }
  error?: string
  /** Score de complétion de 0 à 100 */
  completionScore?: number
  /** Message UX formaté pour l'utilisateur */
  ux?: ToolUXMessage
}

/**
 * Résultat de search_products
 */
export interface SearchProductsResult {
  success: boolean
  results: Array<{
    id: string
    title: string
    description: string
    category: ListingCategory
    price?: number
    priceType: PriceType
    location?: string
    publishedAt: string
  }>
  totalFound: number
  message: string
  error?: string
  /** Score de complétion de 0 à 100 */
  completionScore?: number
  /** Message UX formaté pour l'utilisateur */
  ux?: ToolUXMessage
}

/**
 * Résultat de suggest_referral_message
 */
export interface SuggestReferralMessageResult {
  success: boolean
  message: string
  suggestedMessage?: string
  referralCode?: string
  referralLink?: string
  tips?: string[]
  error?: string
  /** Score de complétion de 0 à 100 */
  completionScore?: number
  /** Message UX formaté pour l'utilisateur */
  ux?: ToolUXMessage
}

/**
 * Résultat de send_collaboration_proposal
 */
export interface SendCollaborationProposalResult {
  success: boolean
  message: string
  proposalId?: string
  errorCode?: string
  error?: string
  /** Score de complétion de 0 à 100 */
  completionScore?: number
  /** Message UX formaté pour l'utilisateur */
  ux?: ToolUXMessage
}

/**
 * Résultat de get_my_listings
 */
export interface GetMyListingsResult {
  success: boolean
  message: string
  listings: Array<{
    id: string
    title: string
    description: string
    category: ListingCategory
    price?: number
    priceType: PriceType
    location?: string
    isActive: boolean
    isDraft: boolean
    viewCount: number
    contactCount: number
    createdAt: string
    publishedAt?: string
  }>
  totalCount: number
  error?: string
  /** Message UX formaté pour l'utilisateur */
  ux?: ToolUXMessage
}

/**
 * Résultat de update_listing
 */
export interface UpdateListingResult {
  success: boolean
  message: string
  listing?: {
    id: string
    title: string
    description: string
    category: ListingCategory
    price?: number
    priceType: PriceType
    location?: string
    isActive: boolean
  }
  error?: string
  /** Message UX formaté pour l'utilisateur */
  ux?: ToolUXMessage
}

/**
 * Résultat de delete_listing
 */
export interface DeleteListingResult {
  success: boolean
  message: string
  deletedId?: string
  error?: string
  /** Message UX formaté pour l'utilisateur */
  ux?: ToolUXMessage
}

/**
 * Résultat de delete_draft_listing
 */
export interface DeleteDraftListingResult {
  success: boolean
  message: string
  deletedId?: string
  deletedTitle?: string
  error?: string
  /** Message UX formaté pour l'utilisateur */
  ux?: ToolUXMessage
}

/**
 * Résultat de bulk_delete_drafts
 */
export interface BulkDeleteDraftsResult {
  success: boolean
  message: string
  deletedCount: number
  deletedIds?: string[]
  error?: string
  /** Message UX formaté pour l'utilisateur */
  ux?: ToolUXMessage
}

/**
 * Résultat de activate_listing
 */
export interface ActivateListingResult {
  success: boolean
  message: string
  listing?: {
    id: string
    title: string
    description: string
    category: ListingCategory
    price?: number
    priceType: PriceType
    location?: string
    isActive: boolean
    publishedAt?: string
  }
  /** Source utilisée pour l'activation */
  source?: 'draft' | 'listing'
  /** ID du brouillon supprimé (si source=draft) */
  deletedDraftId?: string
  error?: string
  /** Message UX formaté pour l'utilisateur */
  ux?: ToolUXMessage
}

/**
 * Résultat de generate_listing_image
 */
export interface GenerateListingImageResult {
  success: boolean
  message: string
  image?: {
    id: string
    url: string
    width: number
    height: number
    isGenerated: boolean
  }
  error?: string
  /** Message UX formaté pour l'utilisateur */
  ux?: ToolUXMessage
}

/**
 * Union des résultats possibles
 */
export type ToolResult = 
  | CreateListingDraftResult 
  | SearchProductsResult 
  | SuggestReferralMessageResult
  | SendCollaborationProposalResult
  | GetMyListingsResult
  | UpdateListingResult
  | DeleteListingResult
  | DeleteDraftListingResult
  | BulkDeleteDraftsResult
  | ActivateListingResult
  | GenerateListingImageResult

// ============================================================================
// Factory pour créer les outils avec contexte
// ============================================================================

/**
 * Crée les définitions d'outils pour Vercel AI SDK v6
 * Les outils ont besoin du contexte d'exécution pour fonctionner
 */
export function createAgentTools(context: ToolExecutionContext) {
  return {
    /**
     * Créer une annonce (brouillon ou publication directe)
     */
    create_listing_draft: tool({
      description: `Crée une annonce sur ${BRAND.name}. 
Par défaut, l'annonce est créée comme BROUILLON. Si publishNow=true, elle est publiée directement.
Utilise cet outil quand l'utilisateur veut créer une annonce pour vendre un produit, proposer un service, ou publier une offre.
Ne crée PAS d'annonce si l'utilisateur demande juste des informations.`,
      inputSchema: zodSchema(CreateListingDraftParamsSchema),
      execute: async (params: CreateListingDraftParams) => {
        return handleCreateListingDraft(params, context)
      },
    }),

    /**
     * Rechercher des annonces sur la plateforme
     * Ne retourne QUE des données Tuge
     */
    search_products: tool({
      description: `Recherche des annonces (produits, services, emplois) sur la plateforme ${BRAND.name}.
Utilise cet outil quand l'utilisateur cherche quelque chose à acheter, un service, ou une offre.
Les résultats proviennent UNIQUEMENT de la base de données ${BRAND.name}.
Ne retourne jamais de données externes ou inventées.`,
      inputSchema: zodSchema(SearchProductsParamsSchema),
      execute: async (params: SearchProductsParams) => {
        return handleSearchProducts(params, context)
      },
    }),

    /**
     * Suggérer un message de parrainage
     * Ne promet JAMAIS de revenus fixes
     */
    suggest_referral_message: tool({
      description: `Génère une suggestion de message pour partager son code parrain ${BRAND.name}.
Utilise cet outil quand l'utilisateur veut partager son code parrain avec quelqu'un.
Le message est adapté au contexte (ami, professionnel, réseaux sociaux).
IMPORTANT: Ne jamais promettre de revenus fixes ou garantis dans le message.`,
      inputSchema: zodSchema(SuggestReferralMessageParamsSchema),
      execute: async (params: SuggestReferralMessageParams) => {
        return handleSuggestReferralMessage(params, context)
      },
    }),

    /**
     * Envoyer une proposition de collaboration inter-agents
     * NÉCESSITE l'approbation explicite de l'utilisateur destinataire
     */
    send_collaboration_proposal: tool({
      description: `Envoie une proposition de collaboration à un autre utilisateur ${BRAND.name}.
Utilise cet outil UNIQUEMENT quand l'utilisateur actuel demande explicitement d'envoyer une proposition à quelqu'un.
La proposition sera visible par le destinataire qui devra l'ACCEPTER ou la REFUSER.
IMPORTANT: L'utilisateur doit confirmer avant l'envoi. Ne jamais envoyer sans demande explicite.
Types: service_proposal (offre de service), collaboration_request (projet commun), info_share (partage d'info).
Limite: 3 propositions pending maximum par destinataire.`,
      inputSchema: zodSchema(SendCollaborationProposalParamsSchema),
      execute: async (params: SendCollaborationProposalParams) => {
        return handleSendCollaborationProposal(params, context)
      },
    }),

    /**
     * Consulter ses propres annonces
     */
    get_my_listings: tool({
      description: `Récupère les annonces de l'utilisateur connecté sur ${BRAND.name}.
Utilise cet outil quand l'utilisateur veut voir ses annonces, brouillons, ou gérer ses publications.
Permet de filtrer par statut: actives, inactives, brouillons, ou toutes.`,
      inputSchema: zodSchema(GetMyListingsParamsSchema),
      execute: async (params: GetMyListingsParams) => {
        return handleGetMyListings(params, context)
      },
    }),

    /**
     * Rechercher et filtrer les annonces de l'utilisateur
     */
    search_user_listings: tool({
      description: `Recherche et filtre les annonces de l'utilisateur connecté sur ${BRAND.name}.
Utilise cet outil quand l'utilisateur veut :
- Voir uniquement ses annonces d'un certain type (ex: "mes annonces iPhone", "mes téléphones")
- Filtrer par statut ET par terme de recherche
- Trouver une annonce spécifique parmi ses publications

Différence avec get_my_listings :
- get_my_listings : liste simple avec filtre de statut uniquement
- search_user_listings : recherche textuelle + filtres combinés

Exemples d'utilisation :
- "annonces iPhone" → query: "iphone"
- "téléphones en vente" → query: "téléphone", status: "active"
- "mes brouillons de services" → status: "draft", category: "service"`,
      inputSchema: zodSchema(SearchUserListingsParamsSchema),
      execute: async (params: SearchUserListingsParams) => {
        return handleSearchUserListings(params, context)
      },
    }),

    /**
     * Modifier une annonce existante
     */
    update_listing: tool({
      description: `Modifie une annonce existante de l'utilisateur sur ${BRAND.name}.
Utilise cet outil quand l'utilisateur veut changer le titre, la description, le prix, la localisation, ou activer/désactiver une annonce.
IMPORTANT: L'annonce doit appartenir à l'utilisateur connecté.`,
      inputSchema: zodSchema(UpdateListingParamsSchema),
      execute: async (params: UpdateListingParams) => {
        return handleUpdateListing(params, context)
      },
    }),

    /**
     * Supprimer une annonce PUBLIÉE (inactive uniquement)
     */
    delete_listing: tool({
      description: `Supprime définitivement une annonce PUBLIÉE et INACTIVE de l'utilisateur sur ${BRAND.name}.
IMPORTANT: 
- NE PEUT PAS supprimer une annonce ACTIVE (is_active = true). Utilisez update_listing pour la désactiver d'abord.
- Pour supprimer des BROUILLONS, utilisez delete_draft_listing ou bulk_delete_drafts.
- Demande TOUJOURS confirmation avant de supprimer. La suppression est irréversible.
- Passe confirm: true UNIQUEMENT après avoir reçu "oui" explicitement de l'utilisateur.`,
      inputSchema: zodSchema(DeleteListingParamsSchema),
      execute: async (params: DeleteListingParams) => {
        return handleDeleteListing(params, context)
      },
    }),

    /**
     * Supprimer UN brouillon spécifique
     */
    delete_draft_listing: tool({
      description: `Supprime définitivement UN brouillon spécifique de l'utilisateur sur ${BRAND.name}.
Utilise cet outil quand l'utilisateur veut supprimer UN brouillon précis (pas une annonce publiée).
IMPORTANT:
- Demande TOUJOURS confirmation explicite ("oui") avant de supprimer.
- Passe confirm: true UNIQUEMENT après avoir reçu "oui" de l'utilisateur.
- La suppression est irréversible.`,
      inputSchema: zodSchema(DeleteDraftListingParamsSchema),
      execute: async (params: DeleteDraftListingParams) => {
        return handleDeleteDraftListing(params, context)
      },
    }),

    /**
     * Supprimer TOUS les brouillons de l'utilisateur
     */
    bulk_delete_drafts: tool({
      description: `Supprime TOUS les brouillons de l'utilisateur sur ${BRAND.name}.
Utilise cet outil quand l'utilisateur veut "nettoyer", "purger", ou "supprimer tous" ses brouillons.
IMPORTANT:
- NE TOUCHE JAMAIS aux annonces publiées (actives ou inactives).
- Demande TOUJOURS confirmation explicite avec le nombre exact de brouillons.
- Formule: "Confirmez-vous la suppression définitive de X brouillons ? (oui / non)"
- Passe confirm: true UNIQUEMENT après avoir reçu "oui" de l'utilisateur.
- La suppression est irréversible.`,
      inputSchema: zodSchema(BulkDeleteDraftsParamsSchema),
      execute: async (params: BulkDeleteDraftsParams) => {
        return handleBulkDeleteDrafts(params, context)
      },
    }),

    /**
     * Activer une annonce (publier un brouillon ou réactiver une annonce inactive)
     */
    activate_listing: tool({
      description: `Active une annonce sur ${BRAND.name}. Deux cas possibles selon la source :

CAS 1 - Publication d'un brouillon (source="draft") :
- L'id référence un brouillon dans listing_drafts
- Crée une nouvelle annonce ACTIVE dans listings
- Supprime le brouillon d'origine
- L'utilisateur doit confirmer avant publication

CAS 2 - Réactivation d'une annonce (source="listing") :
- L'id référence une annonce INACTIVE dans listings
- Passe is_active de false à true
- Ne crée pas de nouvelle annonce

RÈGLES DE SÉCURITÉ ABSOLUES :
- Aucune activation sans ID explicite (UUID)
- Aucune activation par titre
- Aucune supposition de source : toujours spécifier "draft" ou "listing"
- Demande TOUJOURS confirmation avant d'activer
- Passe confirm: true UNIQUEMENT après "oui" explicite de l'utilisateur
- Si incohérence (brouillon introuvable, déjà active) → retourne une erreur

IMPORTANT: Le LLM n'est PAS autorisé à annoncer une activation sans avoir reçu success: true du backend.`,
      inputSchema: zodSchema(ActivateListingParamsSchema),
      execute: async (params: ActivateListingParams) => {
        return handleActivateListing(params, context)
      },
    }),

    /**
     * Générer une image pour une annonce via DALL-E
     */
    generate_listing_image: tool({
      description: `Génère une image pour une annonce via DALL-E 3.
Utilise cet outil quand :
- L'utilisateur n'a pas de photo pour son annonce
- L'utilisateur demande explicitement de générer une image
- Tu proposes proactivement de créer une image pour l'annonce
Styles disponibles: photo (réaliste), illustration (dessin), minimal (épuré).`,
      inputSchema: zodSchema(GenerateListingImageParamsSchema),
      execute: async (params: GenerateListingImageParams) => {
        return handleGenerateListingImage(params, context)
      },
    }),
  }
}

/**
 * Outils par défaut (pour le mode non-authentifié)
 * @deprecated Utilisez createAgentTools avec un contexte approprié
 */
export const agentToolDefinitions = createAgentTools({ isAuthenticated: false })
