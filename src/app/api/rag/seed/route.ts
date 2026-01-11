/**
 * API Route: POST /api/rag/seed
 * 
 * Ingère les documents de seed (contenu statique) dans le système RAG.
 * Cette route permet d'initialiser la base de connaissances avec :
 * - Documentation de la plateforme
 * - FAQ
 * - Documentation du parrainage
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processDocument, formatEmbeddingForDB } from '@/lib/rag'
import { allRAGDocuments, documentCounts } from '@/content/rag'

/**
 * Vérifie l'autorisation d'ingestion
 */
async function checkAuthorization(request: NextRequest): Promise<{
  authorized: boolean
  error?: string
}> {
  // Vérifier la clé API
  const apiKey = request.headers.get('x-rag-api-key')
  const expectedKey = process.env.RAG_INGEST_API_KEY
  
  if (apiKey && expectedKey && apiKey === expectedKey) {
    return { authorized: true }
  }
  
  // Vérifier l'authentification utilisateur
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return { authorized: false, error: 'Non authentifié' }
  }
  
  return { authorized: true }
}

/**
 * POST /api/rag/seed
 * Ingère tous les documents de seed dans le RAG
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    // 1. Vérifier l'autorisation
    const auth = await checkAuthorization(request)
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Non autorisé' },
        { status: 401 }
      )
    }
    
    // 2. Vérifier la clé OpenAI
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'OPENAI_API_KEY non configurée. Les embeddings ne peuvent pas être générés.' 
        },
        { status: 500 }
      )
    }
    
    const supabase = await createClient()
    
    // 3. Ingérer chaque document
    const results: {
      externalId: string
      title: string
      collection: string
      success: boolean
      chunkCount?: number
      error?: string
    }[] = []
    
    for (const doc of allRAGDocuments) {
      try {
        // Upsert le document
        const { data: docId, error: docError } = await (supabase as any).rpc('upsert_rag_document', {
          p_collection: doc.collection,
          p_external_id: doc.externalId,
          p_title: doc.title,
          p_content: doc.content,
          p_metadata: doc.metadata,
        })
        
        if (docError) {
          results.push({
            externalId: doc.externalId,
            title: doc.title,
            collection: doc.collection,
            success: false,
            error: docError.message,
          })
          continue
        }
        
        const documentId = docId as string
        
        // Traiter le document (chunks + embeddings)
        const chunks = await processDocument(doc.content)
        
        // Insérer les chunks
        for (const chunk of chunks) {
          const { error: chunkError } = await (supabase as any).rpc('insert_rag_chunk', {
            p_document_id: documentId,
            p_chunk_index: chunk.index,
            p_content: chunk.content,
            p_embedding: formatEmbeddingForDB(chunk.embedding),
            p_token_count: chunk.tokenCount,
            p_metadata: {},
          })
          
          if (chunkError) {
            console.warn(`[RAG Seed] Chunk error for ${doc.externalId}:`, chunkError)
          }
        }
        
        results.push({
          externalId: doc.externalId,
          title: doc.title,
          collection: doc.collection,
          success: true,
          chunkCount: chunks.length,
        })
        
      } catch (error) {
        results.push({
          externalId: doc.externalId,
          title: doc.title,
          collection: doc.collection,
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        })
      }
    }
    
    // 4. Calculer les statistiques
    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)
    const totalChunks = successful.reduce((sum, r) => sum + (r.chunkCount || 0), 0)
    const duration = Date.now() - startTime
    
    return NextResponse.json({
      success: failed.length === 0,
      summary: {
        totalDocuments: documentCounts.total,
        processed: results.length,
        successful: successful.length,
        failed: failed.length,
        totalChunks,
        durationMs: duration,
      },
      results,
    })
    
  } catch (error) {
    console.error('[RAG Seed] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/rag/seed
 * Retourne les informations sur les documents de seed disponibles
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    success: true,
    availableDocuments: documentCounts,
    documents: allRAGDocuments.map(doc => ({
      collection: doc.collection,
      externalId: doc.externalId,
      title: doc.title,
      contentLength: doc.content.length,
      metadata: doc.metadata,
    })),
    instructions: {
      message: 'Envoyez une requête POST pour ingérer ces documents dans le RAG',
      headers: {
        'x-rag-api-key': 'Optionnel - clé API pour l\'ingestion automatique',
      },
    },
  })
}






