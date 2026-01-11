/**
 * API Route: GET /api/rag/stats
 * 
 * Retourne les statistiques du système RAG :
 * - Nombre de documents par collection
 * - Nombre de chunks
 * - État de santé du système
 */

import { NextResponse } from 'next/server'
import { getRAGStats, checkRAGHealth } from '@/lib/rag'

/**
 * GET /api/rag/stats
 * Statistiques du système RAG
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Récupérer les stats et l'état de santé en parallèle
    const [stats, health] = await Promise.all([
      getRAGStats(),
      checkRAGHealth(),
    ])
    
    // Calculer les totaux
    const totals = stats.reduce(
      (acc, s) => ({
        documents: acc.documents + s.documentCount,
        chunks: acc.chunks + s.chunkCount,
        withEmbeddings: acc.withEmbeddings + s.chunksWithEmbeddings,
      }),
      { documents: 0, chunks: 0, withEmbeddings: 0 }
    )
    
    // Calculer le pourcentage d'embeddings générés
    const embeddingCoverage = totals.chunks > 0 
      ? Math.round((totals.withEmbeddings / totals.chunks) * 100) 
      : 0
    
    return NextResponse.json({
      success: true,
      health: {
        status: health.healthy ? 'healthy' : 'unhealthy',
        hasDocuments: health.hasDocuments,
        hasEmbeddings: health.hasEmbeddings,
        error: health.error,
      },
      totals: {
        documents: totals.documents,
        chunks: totals.chunks,
        chunksWithEmbeddings: totals.withEmbeddings,
        embeddingCoverage: `${embeddingCoverage}%`,
      },
      collections: stats.map(s => ({
        name: s.collection,
        documents: s.documentCount,
        chunks: s.chunkCount,
        chunksWithEmbeddings: s.chunksWithEmbeddings,
        ready: s.chunksWithEmbeddings > 0,
      })),
      timestamp: new Date().toISOString(),
    })
    
  } catch (error) {
    console.error('[RAG Stats] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des statistiques',
        health: { status: 'error' },
      },
      { status: 500 }
    )
  }
}







