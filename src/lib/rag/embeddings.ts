/**
 * Service d'embeddings pour le RAG
 * 
 * Utilise OpenAI text-embedding-3-small pour générer des embeddings vectoriels.
 * Ces embeddings sont utilisés pour la recherche sémantique dans le RAG.
 */

import OpenAI from 'openai'

// Configuration
const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_DIMENSIONS = 1536
const MAX_TOKENS_PER_CHUNK = 500 // Taille maximale d'un chunk en tokens (approximatif)
const CHUNK_OVERLAP = 50 // Chevauchement entre chunks en tokens

// Client OpenAI (lazy initialization)
let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured')
    }
    openaiClient = new OpenAI({ apiKey })
  }
  return openaiClient
}

/**
 * Résultat d'un embedding
 */
export interface EmbeddingResult {
  embedding: number[]
  tokenCount: number
}

/**
 * Chunk de texte avec son embedding
 */
export interface ChunkWithEmbedding {
  content: string
  embedding: number[]
  tokenCount: number
  index: number
}

/**
 * Génère un embedding pour un texte donné
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  const client = getOpenAIClient()
  
  // Nettoyer le texte
  const cleanedText = text.trim().replace(/\n+/g, ' ').replace(/\s+/g, ' ')
  
  if (!cleanedText) {
    throw new Error('Text cannot be empty')
  }

  try {
    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: cleanedText,
      dimensions: EMBEDDING_DIMENSIONS,
    })

    return {
      embedding: response.data[0].embedding,
      tokenCount: response.usage.total_tokens,
    }
  } catch (error) {
    console.error('[Embeddings] Error generating embedding:', error)
    throw new Error('Failed to generate embedding')
  }
}

/**
 * Génère des embeddings pour plusieurs textes en batch
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<EmbeddingResult[]> {
  const client = getOpenAIClient()
  
  // Nettoyer les textes
  const cleanedTexts = texts.map(t => t.trim().replace(/\n+/g, ' ').replace(/\s+/g, ' '))
  
  // Filtrer les textes vides
  const validTexts = cleanedTexts.filter(t => t.length > 0)
  
  if (validTexts.length === 0) {
    throw new Error('No valid texts to embed')
  }

  try {
    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: validTexts,
      dimensions: EMBEDDING_DIMENSIONS,
    })

    // Reconstituer les résultats avec les textes vides
    const results: EmbeddingResult[] = []
    let validIndex = 0
    
    for (let i = 0; i < cleanedTexts.length; i++) {
      if (cleanedTexts[i].length > 0) {
        results.push({
          embedding: response.data[validIndex].embedding,
          tokenCount: Math.ceil(cleanedTexts[i].length / 4), // Approximation
        })
        validIndex++
      } else {
        // Texte vide - embedding zéro
        results.push({
          embedding: new Array(EMBEDDING_DIMENSIONS).fill(0),
          tokenCount: 0,
        })
      }
    }

    return results
  } catch (error) {
    console.error('[Embeddings] Error generating batch embeddings:', error)
    throw new Error('Failed to generate batch embeddings')
  }
}

/**
 * Estimation approximative du nombre de tokens (règle des 4 caractères)
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Découpe un texte en chunks avec chevauchement
 */
export function splitTextIntoChunks(text: string): string[] {
  const chunks: string[] = []
  const words = text.split(/\s+/)
  
  // Estimation: ~1.3 tokens par mot en moyenne pour le français
  const wordsPerChunk = Math.floor(MAX_TOKENS_PER_CHUNK / 1.3)
  const overlapWords = Math.floor(CHUNK_OVERLAP / 1.3)
  
  let startIndex = 0
  
  while (startIndex < words.length) {
    const endIndex = Math.min(startIndex + wordsPerChunk, words.length)
    const chunk = words.slice(startIndex, endIndex).join(' ')
    
    if (chunk.trim()) {
      chunks.push(chunk.trim())
    }
    
    // Avancer avec chevauchement
    startIndex = endIndex - overlapWords
    
    // Éviter boucle infinie
    if (startIndex <= 0 && chunks.length > 0) {
      startIndex = endIndex
    }
  }
  
  return chunks
}

/**
 * Découpe un texte en chunks sémantiques (par paragraphes/sections)
 * Plus intelligent que le découpage par mots
 */
export function splitTextIntoSemanticChunks(text: string): string[] {
  const chunks: string[] = []
  
  // Découper d'abord par sections (titres markdown ou doubles sauts de ligne)
  const sections = text.split(/\n#{1,3}\s+|\n\n+/)
  
  for (const section of sections) {
    const trimmed = section.trim()
    if (!trimmed) continue
    
    const tokenEstimate = estimateTokenCount(trimmed)
    
    if (tokenEstimate <= MAX_TOKENS_PER_CHUNK) {
      // La section tient dans un chunk
      chunks.push(trimmed)
    } else {
      // Découper la section en plus petits chunks
      const subChunks = splitTextIntoChunks(trimmed)
      chunks.push(...subChunks)
    }
  }
  
  return chunks
}

/**
 * Traite un document complet : découpe en chunks et génère les embeddings
 */
export async function processDocument(content: string): Promise<ChunkWithEmbedding[]> {
  // Découper en chunks sémantiques
  const chunks = splitTextIntoSemanticChunks(content)
  
  if (chunks.length === 0) {
    return []
  }

  // Générer les embeddings en batch
  const embeddings = await generateEmbeddingsBatch(chunks)
  
  // Combiner chunks et embeddings
  return chunks.map((chunk, index) => ({
    content: chunk,
    embedding: embeddings[index].embedding,
    tokenCount: embeddings[index].tokenCount,
    index,
  }))
}

/**
 * Formate un embedding pour l'insertion en base (format pgvector)
 */
export function formatEmbeddingForDB(embedding: number[]): string {
  return `[${embedding.join(',')}]`
}

/**
 * Parse un embedding depuis la base de données
 */
export function parseEmbeddingFromDB(embeddingStr: string): number[] {
  const cleaned = embeddingStr.replace(/[\[\]]/g, '')
  return cleaned.split(',').map(Number)
}

// Export des constantes
export { EMBEDDING_MODEL, EMBEDDING_DIMENSIONS, MAX_TOKENS_PER_CHUNK }







