/**
 * API Route: /api/listings
 * 
 * Gère la publication et la récupération des annonces.
 * 
 * POST - Publier une nouvelle annonce
 * GET - Récupérer les annonces (de l'utilisateur connecté)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Schéma de validation pour la création d'annonce
const CreateListingSchema = z.object({
  title: z
    .string()
    .min(3, 'Le titre doit faire au moins 3 caractères')
    .max(100, 'Le titre ne peut pas dépasser 100 caractères'),
  
  description: z
    .string()
    .min(10, 'La description doit faire au moins 10 caractères')
    .max(2000, 'La description ne peut pas dépasser 2000 caractères'),
  
  category: z.enum(['service', 'product', 'job', 'other']),
  
  price: z
    .number()
    .min(0, 'Le prix ne peut pas être négatif')
    .nullable()
    .optional(),
  
  priceType: z
    .enum(['fixed', 'hourly', 'negotiable', 'free'])
    .optional()
    .default('negotiable'),
  
  location: z
    .string()
    .max(100, 'La localisation ne peut pas dépasser 100 caractères')
    .nullable()
    .optional(),
  
  publishNow: z
    .boolean()
    .optional()
    .default(true),
})

/**
 * POST /api/listings
 * Publie une nouvelle annonce
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Vérification de l'authentification
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // 2. Validation du body
    const body = await request.json()
    const validation = CreateListingSchema.safeParse(body)
    
    if (!validation.success) {
      const errors = validation.error.issues.map(i => i.message).join(', ')
      return NextResponse.json(
        { success: false, error: errors },
        { status: 400 }
      )
    }

    const { title, description, category, price, priceType, location, publishNow } = validation.data

    // 3. Insertion de l'annonce
    if (publishNow) {
      // Publication directe dans la table listings
      const { data: listing, error: insertError } = await (supabase as any)
        .from('listings')
        .insert({
          user_id: user.id,
          title,
          description,
          category,
          price: price ?? null,
          price_type: priceType,
          location: location ?? null,
          is_active: true,
        })
        .select('id, title, description, category, price, price_type, location, is_active, published_at')
        .single()

      if (insertError) {
        console.error('[API:listings] Insert error:', insertError)
        return NextResponse.json(
          { success: false, error: 'Erreur lors de la publication de l\'annonce' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Annonce publiée avec succès !',
        listing: {
          id: listing.id,
          title: listing.title,
          description: listing.description,
          category: listing.category,
          price: listing.price,
          priceType: listing.price_type,
          location: listing.location,
          isActive: listing.is_active,
          publishedAt: listing.published_at,
        },
      })
    } else {
      // Création d'un brouillon dans listing_drafts
      const { data: draft, error: draftError } = await (supabase as any)
        .from('listing_drafts')
        .insert({
          user_id: user.id,
          title,
          description,
          category,
          price: price ?? null,
          price_type: priceType,
          location: location ?? null,
          status: 'draft',
        })
        .select('id, title, description, category, price, price_type, location, status')
        .single()

      if (draftError) {
        console.error('[API:listings] Draft insert error:', draftError)
        return NextResponse.json(
          { success: false, error: 'Erreur lors de la création du brouillon' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Brouillon créé avec succès !',
        draft: {
          id: draft.id,
          title: draft.title,
          description: draft.description,
          category: draft.category,
          price: draft.price,
          priceType: draft.price_type,
          location: draft.location,
          status: draft.status,
        },
      })
    }

  } catch (error) {
    console.error('[API:listings] Unexpected error:', error)
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'Format de requête invalide' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Une erreur inattendue s\'est produite' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/listings
 * Récupère les annonces de l'utilisateur connecté
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all' // all, active, inactive
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

    // Construire la requête
    let query = (supabase as any)
      .from('listings')
      .select('id, title, description, category, price, price_type, location, is_active, view_count, contact_count, created_at, published_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filtrer par statut
    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    }

    const { data: listings, error: listingsError } = await query

    if (listingsError) {
      console.error('[API:listings] Fetch error:', listingsError)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération des annonces' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      listings: (listings || []).map((l: Record<string, unknown>) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        category: l.category,
        price: l.price,
        priceType: l.price_type,
        location: l.location,
        isActive: l.is_active,
        viewCount: l.view_count,
        contactCount: l.contact_count,
        createdAt: l.created_at,
        publishedAt: l.published_at,
      })),
      count: listings?.length || 0,
    })

  } catch (error) {
    console.error('[API:listings] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur inattendue s\'est produite' },
      { status: 500 }
    )
  }
}




