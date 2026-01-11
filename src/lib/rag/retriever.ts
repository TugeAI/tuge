/**
 * Service de récupération (Retriever) pour le RAG
 * 
 * Effectue la recherche sémantique dans les chunks de documents
 * en utilisant pgvector via Supabase.
 */

import { createClient as createServerClient } from '@/lib/supabase/server'
import { generateEmbedding, formatEmbeddingForDB } from './embeddings'

/**
 * Types de collections RAG disponibles
 */
export type RAGCollection = 
  | 'platform_docs'
  | 'listings'
  | 'professionals'
  | 'referral_mlm'
  | 'nurturing'

/**
 * Résultat d'une recherche RAG
 */
export interface RAGSearchResult {
  chunkId: string
  documentId: string
  collection: RAGCollection
  documentTitle: string
  chunkContent: string
  chunkMetadata: Record<string, unknown>
  documentMetadata: Record<string, unknown>
  similarity: number
}

/**
 * Options de recherche RAG
 */
export interface RAGSearchOptions {
  collections?: RAGCollection[]
  matchThreshold?: number
  matchCount?: number
}

const DEFAULT_MATCH_THRESHOLD = 0.7
const DEFAULT_MATCH_COUNT = 5

/**
 * Recherche sémantique dans les chunks RAG
 */
export async function searchRAG(
  query: string,
  options: RAGSearchOptions = {}
): Promise<RAGSearchResult[]> {
  const {
    collections = null,
    matchThreshold = DEFAULT_MATCH_THRESHOLD,
    matchCount = DEFAULT_MATCH_COUNT,
  } = options

  try {
    // Générer l'embedding de la requête
    const { embedding } = await generateEmbedding(query)
    
    // Créer le client Supabase
    const supabase = await createServerClient()
    
    // Formater l'embedding pour pgvector
    const embeddingStr = formatEmbeddingForDB(embedding)
    
    // Appeler la fonction RPC de recherche
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('search_rag_chunks', {
      query_embedding: embeddingStr,
      target_collections: collections,
      match_threshold: matchThreshold,
      match_count: matchCount,
    })

    if (error) {
      console.error('[Retriever] Search error:', error)
      throw new Error(`RAG search failed: ${error.message}`)
    }

    // Transformer les résultats
    const results: RAGSearchResult[] = (data || []).map((row: {
      chunk_id: string
      document_id: string
      collection: RAGCollection
      document_title: string
      chunk_content: string
      chunk_metadata: Record<string, unknown>
      document_metadata: Record<string, unknown>
      similarity: number
    }) => ({
      chunkId: row.chunk_id,
      documentId: row.document_id,
      collection: row.collection,
      documentTitle: row.document_title,
      chunkContent: row.chunk_content,
      chunkMetadata: row.chunk_metadata || {},
      documentMetadata: row.document_metadata || {},
      similarity: row.similarity,
    }))

    return results
  } catch (error) {
    console.error('[Retriever] Error:', error)
    
    // En cas d'erreur, retourner un tableau vide plutôt que de faire échouer l'agent
    return []
  }
}

/**
 * Recherche dans une collection spécifique
 */
export async function searchCollection(
  query: string,
  collection: RAGCollection,
  matchCount: number = 3
): Promise<RAGSearchResult[]> {
  return searchRAG(query, {
    collections: [collection],
    matchCount,
  })
}

/**
 * Recherche multi-collections avec pondération
 */
export async function searchMultipleCollections(
  query: string,
  collectionsConfig: { collection: RAGCollection; weight: number }[],
  totalResults: number = 5
): Promise<RAGSearchResult[]> {
  // Calculer le nombre de résultats par collection proportionnellement
  const totalWeight = collectionsConfig.reduce((sum, c) => sum + c.weight, 0)
  
  // Rechercher dans chaque collection
  const allResults: RAGSearchResult[] = []
  
  for (const { collection, weight } of collectionsConfig) {
    const count = Math.max(1, Math.ceil((weight / totalWeight) * totalResults))
    const results = await searchCollection(query, collection, count)
    allResults.push(...results)
  }
  
  // Trier par similarité et limiter
  return allResults
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, totalResults)
}

/**
 * Récupère les statistiques du RAG
 */
export async function getRAGStats(): Promise<{
  collection: RAGCollection
  documentCount: number
  chunkCount: number
  chunksWithEmbeddings: number
}[]> {
  try {
    const supabase = await createServerClient()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('get_rag_stats')
    
    if (error) {
      console.error('[Retriever] Stats error:', error)
      return []
    }
    
    return (data || []).map((row: {
      collection: RAGCollection
      document_count: number
      chunk_count: number
      chunks_with_embeddings: number
    }) => ({
      collection: row.collection,
      documentCount: Number(row.document_count),
      chunkCount: Number(row.chunk_count),
      chunksWithEmbeddings: Number(row.chunks_with_embeddings),
    }))
  } catch (error) {
    console.error('[Retriever] Stats error:', error)
    return []
  }
}

/**
 * Vérifie si le système RAG est opérationnel
 */
export async function checkRAGHealth(): Promise<{
  healthy: boolean
  hasDocuments: boolean
  hasEmbeddings: boolean
  error?: string
}> {
  try {
    const stats = await getRAGStats()
    
    const hasDocuments = stats.some(s => s.documentCount > 0)
    const hasEmbeddings = stats.some(s => s.chunksWithEmbeddings > 0)
    
    return {
      healthy: true,
      hasDocuments,
      hasEmbeddings,
    }
  } catch (error) {
    return {
      healthy: false,
      hasDocuments: false,
      hasEmbeddings: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}






