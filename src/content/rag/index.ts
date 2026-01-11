/**
 * Index des documents RAG
 * 
 * Regroupe tous les documents de contenu statique
 * pour l'ingestion dans le système RAG.
 */

import { platformDocs, type RAGDocument } from './platform-docs'
import { referralDocs } from './referral-mlm'
import { nurturingDocs } from './nurturing-content'

/**
 * Tous les documents de seed pour le RAG
 */
export const allRAGDocuments: RAGDocument[] = [
  ...platformDocs,
  ...referralDocs,
  ...nurturingDocs,
]

/**
 * Documents par collection
 */
export const documentsByCollection = {
  platform_docs: platformDocs,
  referral_mlm: referralDocs,
  nurturing: nurturingDocs,
  listings: [] as RAGDocument[], // Généré dynamiquement depuis la DB
  professionals: [] as RAGDocument[], // Généré dynamiquement depuis la DB
}

/**
 * Compte des documents par collection
 */
export const documentCounts = {
  platform_docs: platformDocs.length,
  referral_mlm: referralDocs.length,
  nurturing: nurturingDocs.length,
  listings: 0,
  professionals: 0,
  total: platformDocs.length + referralDocs.length + nurturingDocs.length,
}

// Re-export des types
export type { RAGDocument }

// Re-export des fonctions utilitaires de nurturing
export { 
  getNurturingContentByIntention, 
  getNurturingContentById,
  getHighPriorityNurturingContent 
} from './nurturing-content'

