/**
 * API Route: POST /api/rag/search
 * 
 * Effectue une recherche sémantique dans la base RAG.
 * Utile pour le debug et les tests du système RAG.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { searchRAG, classifyIntent, type RAGCollection } from '@/lib/rag'
import { z } from 'zod'

// Schéma de validation
const SearchSchema = z.object({
  query: z.string().min(1, 'La requête est requise').max(1000),
  collections: z.array(z.enum([
    'platform_docs',
    'listings',
    'professionals',
    'referral_mlm',
  ])).optional(),
  matchThreshold: z.number().min(0).max(1).optional().default(0.65),
  matchCount: z.number().min(1).max(20).optional().default(5),
  includeIntent: z.boolean().optional().default(true),
})

/**
 * POST /api/rag/search
 * Recherche dans la base RAG
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Vérifier l'authentification (optionnel mais recommandé)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Pour le moment, autoriser les recherches même sans auth (pour le debug)
    // TODO: Restreindre en production si nécessaire
    
    // 2. Valider le body
    const body = await request.json()
    const validation = SearchSchema.safeParse(body)
    
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
    
    const { query, collections, matchThreshold, matchCount, includeIntent } = validation.data
    
    // 3. Classifier l'intention si demandé
    let intentInfo = null
    if (includeIntent) {
      intentInfo = classifyIntent(query)
    }
    
    // 4. Effectuer la recherche
    const results = await searchRAG(query, {
      collections: collections as RAGCollection[] | undefined,
      matchThreshold,
      matchCount,
    })
    
    // 5. Retourner les résultats
    return NextResponse.json({
      success: true,
      query,
      intent: intentInfo,
      results: results.map(r => ({
        documentId: r.documentId,
        documentTitle: r.documentTitle,
        collection: r.collection,
        content: r.chunkContent,
        similarity: Math.round(r.similarity * 1000) / 1000,
        metadata: r.documentMetadata,
      })),
      meta: {
        totalResults: results.length,
        threshold: matchThreshold,
        requestedCount: matchCount,
        collectionsSearched: collections || (intentInfo?.collections) || ['all'],
        authenticated: !!user,
      },
    })
    
  } catch (error) {
    console.error('[RAG Search] Error:', error)
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'JSON invalide' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la recherche' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/rag/search
 * Recherche simple via query params (pour les tests rapides)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || searchParams.get('query')
    
    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Le paramètre q ou query est requis' },
        { status: 400 }
      )
    }
    
    const collectionsParam = searchParams.get('collections')
    const collections = collectionsParam ? collectionsParam.split(',') : undefined
    
    const threshold = parseFloat(searchParams.get('threshold') || '0.65')
    const count = parseInt(searchParams.get('count') || '5', 10)
    
    // Classifier l'intention
    const intentInfo = classifyIntent(query)
    
    // Effectuer la recherche
    const results = await searchRAG(query, {
      collections: collections as RAGCollection[] | undefined,
      matchThreshold: threshold,
      matchCount: count,
    })
    
    return NextResponse.json({
      success: true,
      query,
      intent: intentInfo,
      results: results.map(r => ({
        title: r.documentTitle,
        collection: r.collection,
        excerpt: r.chunkContent.substring(0, 200) + (r.chunkContent.length > 200 ? '...' : ''),
        similarity: Math.round(r.similarity * 100) + '%',
      })),
      count: results.length,
    })
    
  } catch (error) {
    console.error('[RAG Search GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la recherche' },
      { status: 500 }
    )
  }
}







