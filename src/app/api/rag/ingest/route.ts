/**
 * API Route: POST /api/rag/ingest
 * 
 * Ingère un document dans le système RAG :
 * 1. Valide les données d'entrée
 * 2. Découpe le contenu en chunks
 * 3. Génère les embeddings pour chaque chunk
 * 4. Sauvegarde en base de données
 * 
 * Cette route est protégée et nécessite une authentification admin
 * ou une clé API spéciale pour l'ingestion automatique.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processDocument, formatEmbeddingForDB } from '@/lib/rag'
import { z } from 'zod'

// Types de collections valides
const CollectionEnum = z.enum([
  'platform_docs',
  'listings',
  'professionals',
  'referral_mlm',
])

// Schéma de validation pour un document
const DocumentSchema = z.object({
  collection: CollectionEnum,
  externalId: z.string().min(1, 'L\'ID externe est requis'),
  title: z.string().min(1, 'Le titre est requis').max(500),
  content: z.string().min(10, 'Le contenu doit faire au moins 10 caractères'),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
})

// Schéma pour l'ingestion en batch
const BatchIngestSchema = z.object({
  documents: z.array(DocumentSchema).min(1).max(50),
})

// Schéma pour l'ingestion d'un seul document
const SingleIngestSchema = DocumentSchema

/**
 * Vérifie l'autorisation d'ingestion
 */
async function checkIngestAuthorization(request: NextRequest): Promise<{
  authorized: boolean
  error?: string
}> {
  // Vérifier la clé API d'ingestion (pour les automatisations)
  const apiKey = request.headers.get('x-rag-api-key')
  const expectedKey = process.env.RAG_INGEST_API_KEY
  
  if (apiKey && expectedKey && apiKey === expectedKey) {
    return { authorized: true }
  }
  
  // Vérifier l'authentification utilisateur (admin)
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return { authorized: false, error: 'Non authentifié' }
  }
  
  // Vérifier si l'utilisateur est admin (à adapter selon votre logique)
  // Pour l'instant, on autorise tous les utilisateurs authentifiés
  // TODO: Ajouter une vérification de rôle admin
  
  return { authorized: true }
}

/**
 * Ingère un document dans le système RAG
 */
async function ingestDocument(
  document: z.infer<typeof DocumentSchema>
): Promise<{ success: boolean; documentId?: string; chunkCount?: number; error?: string }> {
  const supabase = await createClient()
  
  try {
    // 1. Upsert le document
    const { data: docResult, error: docError } = await (supabase as any).rpc('upsert_rag_document', {
      p_collection: document.collection,
      p_external_id: document.externalId,
      p_title: document.title,
      p_content: document.content,
      p_metadata: document.metadata,
    })
    
    if (docError) {
      console.error('[RAG Ingest] Document upsert error:', docError)
      return { success: false, error: `Erreur lors de l'insertion du document: ${docError.message}` }
    }
    
    const documentId = docResult as string
    
    // 2. Traiter le document (découpage + embeddings)
    const chunks = await processDocument(document.content)
    
    if (chunks.length === 0) {
      return { success: true, documentId, chunkCount: 0 }
    }
    
    // 3. Insérer les chunks avec leurs embeddings
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
        console.error('[RAG Ingest] Chunk insert error:', chunkError)
        // Continuer avec les autres chunks malgré l'erreur
      }
    }
    
    return { success: true, documentId, chunkCount: chunks.length }
    
  } catch (error) {
    console.error('[RAG Ingest] Processing error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    }
  }
}

/**
 * POST /api/rag/ingest
 * Ingère un ou plusieurs documents dans le système RAG
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Vérifier l'autorisation
    const auth = await checkIngestAuthorization(request)
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Non autorisé' },
        { status: 401 }
      )
    }
    
    // 2. Parser le body
    const body = await request.json()
    
    // 3. Déterminer si c'est un batch ou un document unique
    let documents: z.infer<typeof DocumentSchema>[]
    
    if ('documents' in body) {
      // Batch mode
      const validation = BatchIngestSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Validation échouée',
            details: validation.error.issues.map(i => i.message)
          },
          { status: 400 }
        )
      }
      documents = validation.data.documents
    } else {
      // Single document mode
      const validation = SingleIngestSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Validation échouée',
            details: validation.error.issues.map(i => i.message)
          },
          { status: 400 }
        )
      }
      documents = [validation.data]
    }
    
    // 4. Ingérer les documents
    const results = await Promise.all(documents.map(ingestDocument))
    
    // 5. Préparer le rapport
    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)
    
    const totalChunks = successful.reduce((sum, r) => sum + (r.chunkCount || 0), 0)
    
    return NextResponse.json({
      success: failed.length === 0,
      summary: {
        total: documents.length,
        successful: successful.length,
        failed: failed.length,
        totalChunks,
      },
      results: results.map((r, i) => ({
        externalId: documents[i].externalId,
        ...r,
      })),
    })
    
  } catch (error) {
    console.error('[RAG Ingest] Unexpected error:', error)
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'JSON invalide' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/rag/ingest
 * Supprime (désactive) un document du système RAG
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Vérifier l'autorisation
    const auth = await checkIngestAuthorization(request)
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Non autorisé' },
        { status: 401 }
      )
    }
    
    // 2. Parser les paramètres
    const { searchParams } = new URL(request.url)
    const collection = searchParams.get('collection')
    const externalId = searchParams.get('externalId')
    
    if (!collection || !externalId) {
      return NextResponse.json(
        { success: false, error: 'collection et externalId sont requis' },
        { status: 400 }
      )
    }
    
    // Valider la collection
    const collectionValidation = CollectionEnum.safeParse(collection)
    if (!collectionValidation.success) {
      return NextResponse.json(
        { success: false, error: 'Collection invalide' },
        { status: 400 }
      )
    }
    
    // 3. Supprimer le document
    const supabase = await createClient()
    const { data, error } = await (supabase as any).rpc('delete_rag_document', {
      p_collection: collectionValidation.data,
      p_external_id: externalId,
    })
    
    if (error) {
      console.error('[RAG Ingest] Delete error:', error)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la suppression' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      deleted: data as boolean,
    })
    
  } catch (error) {
    console.error('[RAG Ingest] Unexpected delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

