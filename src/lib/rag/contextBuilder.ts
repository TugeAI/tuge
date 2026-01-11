/**
 * Context Builder pour le RAG
 * 
 * Construit le contexte enrichi pour le LLM en combinant
 * les résultats de la recherche RAG avec l'intention de l'utilisateur.
 */

import { searchRAG, type RAGSearchResult, type RAGCollection } from './retriever'
import { classifyIntent, getIntentContext, shouldUseRAG, type IntentClassification } from './intentClassifier'

/**
 * Configuration du context builder
 */
export interface ContextBuilderConfig {
  maxContextLength?: number      // Longueur max du contexte en caractères
  maxChunks?: number             // Nombre max de chunks à inclure
  includeMetadata?: boolean      // Inclure les métadonnées des documents
  matchThreshold?: number        // Seuil de similarité minimum
}

const DEFAULT_CONFIG: Required<ContextBuilderConfig> = {
  maxContextLength: 4000,
  maxChunks: 5,
  includeMetadata: true,
  matchThreshold: 0.65,
}

/**
 * Contexte RAG enrichi pour le LLM
 */
export interface RAGContext {
  // Classification de l'intention
  intent: IntentClassification
  
  // Contexte textuel à injecter dans le prompt
  contextText: string
  
  // Chunks sources utilisés
  sources: {
    title: string
    collection: RAGCollection
    excerpt: string
    similarity: number
  }[]
  
  // Métadonnées
  ragUsed: boolean
  totalChunks: number
  avgSimilarity: number
}

/**
 * Formate un chunk pour l'inclure dans le contexte
 */
function formatChunk(result: RAGSearchResult, index: number, includeMetadata: boolean): string {
  const parts = [`[Source ${index + 1}: ${result.documentTitle}]`]
  parts.push(result.chunkContent)
  
  if (includeMetadata && Object.keys(result.documentMetadata).length > 0) {
    const metaStr = Object.entries(result.documentMetadata)
      .filter(([_, v]) => v !== null && v !== undefined)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ')
    if (metaStr) {
      parts.push(`(${metaStr})`)
    }
  }
  
  return parts.join('\n')
}

/**
 * Construit le contexte RAG pour un message utilisateur
 */
export async function buildRAGContext(
  message: string,
  config: ContextBuilderConfig = {}
): Promise<RAGContext> {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  
  // 1. Classifier l'intention
  const intent = classifyIntent(message)
  
  // 2. Vérifier si le RAG est nécessaire
  if (!shouldUseRAG(intent)) {
    return {
      intent,
      contextText: '',
      sources: [],
      ragUsed: false,
      totalChunks: 0,
      avgSimilarity: 0,
    }
  }
  
  // 3. Rechercher dans les collections appropriées
  const searchResults = await searchRAG(message, {
    collections: intent.collections,
    matchThreshold: cfg.matchThreshold,
    matchCount: cfg.maxChunks,
  })
  
  if (searchResults.length === 0) {
    return {
      intent,
      contextText: '',
      sources: [],
      ragUsed: false,
      totalChunks: 0,
      avgSimilarity: 0,
    }
  }
  
  // 4. Construire le contexte textuel
  const contextParts: string[] = [
    '--- CONTEXTE DE LA BASE DE CONNAISSANCES ---',
    `Intention détectée: ${getIntentContext(intent)}`,
    '',
  ]
  
  let totalLength = contextParts.join('\n').length
  const includedResults: RAGSearchResult[] = []
  
  for (const result of searchResults) {
    const formattedChunk = formatChunk(result, includedResults.length, cfg.includeMetadata)
    
    // Vérifier la limite de longueur
    if (totalLength + formattedChunk.length > cfg.maxContextLength) {
      break
    }
    
    contextParts.push(formattedChunk)
    contextParts.push('')
    totalLength += formattedChunk.length + 1
    includedResults.push(result)
  }
  
  contextParts.push('--- FIN DU CONTEXTE ---')
  
  // 5. Calculer les statistiques
  const avgSimilarity = includedResults.length > 0
    ? includedResults.reduce((sum, r) => sum + r.similarity, 0) / includedResults.length
    : 0
  
  // 6. Préparer les sources
  const sources = includedResults.map(r => ({
    title: r.documentTitle,
    collection: r.collection,
    excerpt: r.chunkContent.substring(0, 150) + (r.chunkContent.length > 150 ? '...' : ''),
    similarity: r.similarity,
  }))
  
  return {
    intent,
    contextText: contextParts.join('\n'),
    sources,
    ragUsed: true,
    totalChunks: includedResults.length,
    avgSimilarity,
  }
}

/**
 * Génère le prompt système enrichi avec le contexte RAG
 */
export function buildEnrichedSystemPrompt(
  baseSystemPrompt: string,
  ragContext: RAGContext
): string {
  if (!ragContext.ragUsed || !ragContext.contextText) {
    return baseSystemPrompt
  }
  
  // Injecter le contexte RAG dans le prompt système
  const enrichedPrompt = `${baseSystemPrompt}

## Contexte de la Base de Connaissances

Utilise les informations suivantes pour répondre à l'utilisateur. Ces informations proviennent de la base de connaissances Tuge et sont pertinentes pour la question posée.

${ragContext.contextText}

## Instructions Importantes

1. Base ta réponse principalement sur le contexte fourni ci-dessus
2. Si le contexte ne contient pas l'information demandée, dis-le clairement
3. Ne fais pas de suppositions au-delà du contexte fourni
4. Cite les sources si pertinent (ex: "Selon notre documentation...")
5. Si l'utilisateur pose une question hors sujet, guide-le vers les sujets couverts`

  return enrichedPrompt
}

/**
 * Pipeline complet RAG : classification + recherche + enrichissement
 */
export async function executeRAGPipeline(
  message: string,
  baseSystemPrompt: string,
  config: ContextBuilderConfig = {}
): Promise<{
  enrichedSystemPrompt: string
  ragContext: RAGContext
}> {
  // Construire le contexte RAG
  const ragContext = await buildRAGContext(message, config)
  
  // Enrichir le prompt système
  const enrichedSystemPrompt = buildEnrichedSystemPrompt(baseSystemPrompt, ragContext)
  
  return {
    enrichedSystemPrompt,
    ragContext,
  }
}

/**
 * Exporte un fichier index pour le module RAG
 */
export { classifyIntent, getIntentContext } from './intentClassifier'
export { searchRAG, getRAGStats, checkRAGHealth } from './retriever'
export { generateEmbedding, processDocument } from './embeddings'

