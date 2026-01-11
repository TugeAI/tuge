/**
 * Module RAG (Retrieval Augmented Generation) pour Tuge
 * 
 * Ce module fournit les fonctionnalités de recherche sémantique
 * et d'enrichissement de contexte pour l'agent IA.
 */

// Services d'embeddings
export {
  generateEmbedding,
  generateEmbeddingsBatch,
  processDocument,
  splitTextIntoChunks,
  splitTextIntoSemanticChunks,
  estimateTokenCount,
  formatEmbeddingForDB,
  parseEmbeddingFromDB,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
  MAX_TOKENS_PER_CHUNK,
  type EmbeddingResult,
  type ChunkWithEmbedding,
} from './embeddings'

// Retriever
export {
  searchRAG,
  searchCollection,
  searchMultipleCollections,
  getRAGStats,
  checkRAGHealth,
  type RAGCollection,
  type RAGSearchResult,
  type RAGSearchOptions,
} from './retriever'

// Intent Classifier
export {
  classifyIntent,
  getCollectionsForIntent,
  getIntentContext,
  shouldUseRAG,
  type UserIntent,
  type IntentClassification,
} from './intentClassifier'

// Context Builder
export {
  buildRAGContext,
  buildEnrichedSystemPrompt,
  executeRAGPipeline,
  type ContextBuilderConfig,
  type RAGContext,
} from './contextBuilder'

