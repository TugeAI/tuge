/**
 * Module des outils IA pour l'agent Tuge
 * 
 * Ce module exporte :
 * - Les définitions d'outils pour Vercel AI SDK
 * - Les handlers qui exécutent les actions
 * - Les types et schémas de validation
 */

// Types et schémas
export {
  // Schémas Zod
  ListingCategorySchema,
  PriceTypeSchema,
  ReferralContextSchema,
  MessageToneSchema,
  CreateListingDraftParamsSchema,
  SearchProductsParamsSchema,
  SuggestReferralMessageParamsSchema,
  ProposalTypeSchema,
  SendCollaborationProposalParamsSchema,
  DeleteDraftListingParamsSchema,
  BulkDeleteDraftsParamsSchema,
  ActivateListingSourceSchema,
  ActivateListingParamsSchema,
  
  // Types dérivés
  type ListingCategory,
  type PriceType,
  type ReferralContext,
  type MessageTone,
  type CreateListingDraftParams,
  type SearchProductsParams,
  type SuggestReferralMessageParams,
  type SendCollaborationProposalParams,
  type DeleteDraftListingParams,
  type BulkDeleteDraftsParams,
  type ActivateListingSource,
  type ActivateListingParams,
  
  // Types de résultats
  type CreateListingDraftResult,
  type SearchProductsResult,
  type SuggestReferralMessageResult,
  type SendCollaborationProposalResult,
  type DeleteDraftListingResult,
  type BulkDeleteDraftsResult,
  type ActivateListingResult,
  type ToolResult,
  
  // Factory d'outils
  createAgentTools,
  agentToolDefinitions,
} from './definitions'

// Handlers
export {
  handleCreateListingDraft,
  handleSearchProducts,
  handleSuggestReferralMessage,
  handleSendCollaborationProposal,
  handleDeleteDraftListing,
  handleBulkDeleteDrafts,
  handleActivateListing,
  executeToolHandler,
  type ToolExecutionContext,
  type ToolName,
} from './handlers'

// Messages UX
export {
  formatCreateListingDraftUX,
  formatSearchProductsUX,
  formatSuggestReferralMessageUX,
  type ToolUXMessage,
  type Recommendation,
  type RecommendationImpact,
  type RecommendationEffort,
} from './ux-messages'

// Recommandations Coach Business
export {
  generateCreateListingDraftRecommendations,
  generateSearchProductsRecommendations,
  generateSuggestReferralMessageRecommendations,
  type RecommendationContext,
} from './recommendations'
