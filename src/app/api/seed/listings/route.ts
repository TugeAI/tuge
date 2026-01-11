/**
 * API Route: POST /api/seed/listings
 * 
 * Génère des annonces fictives pour les tests.
 * Crée 100+ annonces avec images Unsplash.
 * 
 * Sécurisé par clé API (SEED_API_KEY) ou authentification admin.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  getAllTemplates,
  getRandomCity,
  getRandomImagesForTemplate,
  TEMPLATE_STATS,
  type ListingTemplate,
} from '@/content/seed/listings-data'

// ============================================================================
// TYPES
// ============================================================================

interface SeedResult {
  success: boolean
  summary?: {
    totalCreated: number
    listingsCreated: number
    imagesCreated: number
    categories: Record<string, number>
    durationMs: number
  }
  error?: string
  details?: Array<{
    title: string
    success: boolean
    listingId?: string
    error?: string
  }>
}

// ============================================================================
// AUTHENTIFICATION
// ============================================================================

/**
 * Vérifie l'autorisation pour le seed
 * Accepte soit une clé API, soit un utilisateur admin
 */
async function checkAuthorization(request: NextRequest): Promise<{
  authorized: boolean
  error?: string
  userId?: string
}> {
  // 1. Vérifier la clé API
  const apiKey = request.headers.get('x-seed-api-key')
  const expectedKey = process.env.SEED_API_KEY
  
  if (apiKey && expectedKey && apiKey === expectedKey) {
    return { authorized: true, userId: 'seed-api' }
  }
  
  // 2. En développement, autoriser sans clé si pas de SEED_API_KEY configurée
  if (process.env.NODE_ENV === 'development' && !expectedKey) {
    console.warn('[Seed] No SEED_API_KEY configured, allowing in development mode')
    return { authorized: true, userId: 'dev-mode' }
  }
  
  return { 
    authorized: false, 
    error: 'Non autorisé. Fournissez x-seed-api-key dans les headers.' 
  }
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Génère une date de publication aléatoire dans les 30 derniers jours
 */
function getRandomPublishDate(): string {
  const daysAgo = Math.floor(Math.random() * 30)
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString()
}

/**
 * Génère des statistiques de vues/contacts aléatoires
 */
function getRandomStats(): { viewCount: number; contactCount: number } {
  const viewCount = Math.floor(Math.random() * 500) + 10
  const contactCount = Math.floor(viewCount * (Math.random() * 0.15))
  return { viewCount, contactCount }
}

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

/**
 * GET /api/seed/listings
 * Retourne les informations sur le seed disponible
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    success: true,
    info: {
      description: 'API de seed pour créer des annonces fictives de test',
      stats: TEMPLATE_STATS,
      usage: {
        method: 'POST',
        headers: {
          'x-seed-api-key': 'Votre clé SEED_API_KEY',
        },
        options: {
          clear: 'boolean - Supprimer les annonces existantes avant le seed (default: false)',
          userId: 'UUID - ID utilisateur pour associer les annonces (optionnel, crée un user test sinon)',
          limit: 'number - Nombre max d\'annonces à créer (default: toutes)',
        },
      },
    },
  })
}

/**
 * POST /api/seed/listings
 * Exécute le seed des annonces
 */
export async function POST(request: NextRequest): Promise<NextResponse<SeedResult>> {
  const startTime = Date.now()
  
  try {
    // 1. Vérifier l'autorisation
    const auth = await checkAuthorization(request)
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      )
    }
    
    // 2. Parser les options
    let options: { clear?: boolean; userId?: string; limit?: number } = {}
    try {
      const body = await request.text()
      if (body) {
        options = JSON.parse(body)
      }
    } catch {
      // Pas de body ou JSON invalide, utiliser les valeurs par défaut
    }
    
    const supabase = createAdminClient()
    
    // 3. Optionnellement, nettoyer les annonces existantes
    if (options.clear) {
      console.log('[Seed] Clearing existing listings...')
      
      // Supprimer les images d'abord (contrainte FK)
      await (supabase as any).from('listing_images').delete().not('listing_id', 'is', null)
      
      // Supprimer les annonces
      const { error: clearError } = await (supabase as any).from('listings').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      
      if (clearError) {
        console.warn('[Seed] Clear error:', clearError)
      }
    }
    
    // 4. Obtenir ou créer un utilisateur pour les annonces
    let userId = options.userId
    
    if (!userId) {
      // Chercher un utilisateur existant ou utiliser un ID de test
      const { data: existingUsers } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
      
      if (existingUsers && existingUsers.length > 0) {
        userId = existingUsers[0].id
        console.log('[Seed] Using existing user:', userId)
      } else {
        // Créer un utilisateur de test via Supabase Auth (optionnel)
        // Pour simplifier, on génère un UUID qui sera utilisé directement
        // Note: Cela peut nécessiter une adaptation selon votre setup
        const testEmail = `test-seed-${Date.now()}@example.com`
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: testEmail,
          email_confirm: true,
          password: 'test-password-123!',
          user_metadata: { role: 'individual' }
        })
        
        if (authError || !authUser.user) {
          console.error('[Seed] Could not create test user:', authError)
          return NextResponse.json(
            { 
              success: false, 
              error: 'Impossible de créer un utilisateur de test. Fournissez un userId existant.' 
            },
            { status: 400 }
          )
        }
        
        userId = authUser.user.id
        console.log('[Seed] Created test user:', userId, testEmail)
      }
    }
    
    // 5. Obtenir tous les templates
    let templates = getAllTemplates()
    
    // Limiter si demandé
    if (options.limit && options.limit < templates.length) {
      // Mélanger et limiter
      templates = templates.sort(() => Math.random() - 0.5).slice(0, options.limit)
    }
    
    // 6. Créer les annonces
    const details: Array<{ title: string; success: boolean; listingId?: string; error?: string }> = []
    const categories: Record<string, number> = { service: 0, product: 0, job: 0, other: 0 }
    let imagesCreated = 0
    
    for (const template of templates) {
      try {
        const stats = getRandomStats()
        const publishedAt = getRandomPublishDate()
        const location = getRandomCity()
        
        // Insérer l'annonce
        const { data: listing, error: listingError } = await (supabase as any)
          .from('listings')
          .insert({
            user_id: userId,
            title: template.title,
            description: template.description,
            category: template.category,
            price: template.price,
            price_type: template.priceType,
            location,
            is_active: true,
            view_count: stats.viewCount,
            contact_count: stats.contactCount,
            published_at: publishedAt,
            created_at: publishedAt,
          })
          .select('id')
          .single()
        
        if (listingError || !listing) {
          details.push({
            title: template.title,
            success: false,
            error: listingError?.message || 'Erreur inconnue',
          })
          continue
        }
        
        // Créer les images
        const images = getRandomImagesForTemplate(template)
        for (let i = 0; i < images.length; i++) {
          const image = images[i]
          const { error: imageError } = await (supabase as any)
            .from('listing_images')
            .insert({
              listing_id: listing.id,
              url: image.url,
              position: i,
              is_generated: false,
              width: 800,
              height: 600,
            })
          
          if (!imageError) {
            imagesCreated++
          }
        }
        
        categories[template.category]++
        details.push({
          title: template.title,
          success: true,
          listingId: listing.id,
        })
        
      } catch (error) {
        details.push({
          title: template.title,
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        })
      }
    }
    
    // 7. Calculer le résumé
    const successfulListings = details.filter(d => d.success).length
    const durationMs = Date.now() - startTime
    
    console.log(`[Seed] Completed: ${successfulListings}/${templates.length} listings, ${imagesCreated} images in ${durationMs}ms`)
    
    return NextResponse.json({
      success: successfulListings > 0,
      summary: {
        totalCreated: successfulListings,
        listingsCreated: successfulListings,
        imagesCreated,
        categories,
        durationMs,
      },
      details,
    })
    
  } catch (error) {
    console.error('[Seed] Unexpected error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur interne du serveur' 
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/seed/listings
 * Supprime toutes les annonces de seed (utile pour reset)
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    // Vérifier l'autorisation
    const auth = await checkAuthorization(request)
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      )
    }
    
    const supabase = createAdminClient()
    
    // Supprimer les images d'abord
    const { count: imagesCount } = await (supabase as any)
      .from('listing_images')
      .delete()
      .not('listing_id', 'is', null)
      .select('*', { count: 'exact', head: true })
    
    // Supprimer les annonces
    const { count: listingsCount } = await (supabase as any)
      .from('listings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .select('*', { count: 'exact', head: true })
    
    return NextResponse.json({
      success: true,
      deleted: {
        listings: listingsCount || 0,
        images: imagesCount || 0,
      },
    })
    
  } catch (error) {
    console.error('[Seed] Delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression' },
      { status: 500 }
    )
  }
}

