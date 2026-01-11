/**
 * API Route: POST /api/listings/images
 * 
 * Gère l'upload d'images pour les annonces vers Supabase Storage.
 * Supporte les formats JPEG, PNG, WebP jusqu'à 5MB.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGES_PER_LISTING = 5

// Schéma de validation
const UploadQuerySchema = z.object({
  draftId: z.string().uuid().optional(),
  listingId: z.string().uuid().optional(),
  position: z.coerce.number().min(0).max(4).optional().default(0),
})

interface UploadResult {
  success: boolean
  images?: Array<{
    id: string
    url: string
    position: number
    width?: number
    height?: number
  }>
  error?: string
}

/**
 * POST /api/listings/images
 * Upload une ou plusieurs images pour une annonce
 */
export async function POST(request: NextRequest): Promise<NextResponse<UploadResult>> {
  try {
    // 1. Vérifier l'authentification
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // 2. Parser les paramètres de query
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const queryValidation = UploadQuerySchema.safeParse(searchParams)
    
    if (!queryValidation.success) {
      return NextResponse.json(
        { success: false, error: 'Paramètres invalides' },
        { status: 400 }
      )
    }

    const { draftId, listingId, position } = queryValidation.data

    // 3. Vérifier la propriété du brouillon/annonce
    if (draftId) {
      const { data: draft, error: draftError } = await (supabase as any)
        .from('listing_drafts')
        .select('id, user_id')
        .eq('id', draftId)
        .single()

      if (draftError || !draft || draft.user_id !== user.id) {
        return NextResponse.json(
          { success: false, error: 'Brouillon non trouvé ou non autorisé' },
          { status: 404 }
        )
      }
    }

    if (listingId) {
      const { data: listing, error: listingError } = await (supabase as any)
        .from('listings')
        .select('id, user_id')
        .eq('id', listingId)
        .single()

      if (listingError || !listing || listing.user_id !== user.id) {
        return NextResponse.json(
          { success: false, error: 'Annonce non trouvée ou non autorisée' },
          { status: 404 }
        )
      }
    }

    // 4. Vérifier le nombre d'images existantes
    if (draftId || listingId) {
      let query = (supabase as any)
        .from('listing_images')
        .select('*', { count: 'exact', head: true })
      
      if (draftId) {
        query = query.eq('draft_id', draftId)
      } else if (listingId) {
        query = query.eq('listing_id', listingId)
      }

      const { count } = await query

      if (count && count >= MAX_IMAGES_PER_LISTING) {
        return NextResponse.json(
          { success: false, error: `Maximum ${MAX_IMAGES_PER_LISTING} images par annonce` },
          { status: 400 }
        )
      }
    }

    // 5. Récupérer le fichier
    const formData = await request.formData()
    const files = formData.getAll('images') as File[]
    
    if (!files.length) {
      const singleFile = formData.get('image') as File | null
      if (singleFile) files.push(singleFile)
    }

    if (!files.length) {
      return NextResponse.json(
        { success: false, error: 'Aucune image fournie' },
        { status: 400 }
      )
    }

    // 6. Valider et uploader chaque fichier
    const uploadedImages: Array<{
      id: string
      url: string
      position: number
      width?: number
      height?: number
    }> = []

    const adminClient = createAdminClient()

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Valider le type
      if (!ALLOWED_TYPES.includes(file.type)) {
        continue // Skip les fichiers non supportés
      }

      // Valider la taille
      if (file.size > MAX_FILE_SIZE) {
        continue // Skip les fichiers trop gros
      }

      // Générer un nom unique
      const extension = file.type.split('/')[1]
      const fileName = `${user.id}/${Date.now()}-${i}.${extension}`

      // Lire le contenu
      const buffer = Buffer.from(await file.arrayBuffer())

      // Uploader vers Supabase Storage
      const { data: uploadData, error: uploadError } = await adminClient.storage
        .from('listing-images')
        .upload(fileName, buffer, {
          contentType: file.type,
          cacheControl: '31536000', // 1 an
          upsert: false,
        })

      if (uploadError) {
        console.error('[API:listings/images] Upload error:', uploadError)
        continue
      }

      // Obtenir l'URL publique
      const { data: { publicUrl } } = adminClient.storage
        .from('listing-images')
        .getPublicUrl(uploadData.path)

      // Enregistrer dans la base de données
      const imagePosition = position + i
      const { data: imageRecord, error: insertError } = await (supabase as any)
        .from('listing_images')
        .insert({
          draft_id: draftId || null,
          listing_id: listingId || null,
          uploaded_by: user.id, // Propriétaire pour les images temporaires
          url: publicUrl,
          position: imagePosition,
          is_generated: false,
          mime_type: file.type,
          file_size: file.size,
        })
        .select('id, url, position')
        .single()

      if (!insertError && imageRecord) {
        uploadedImages.push({
          id: imageRecord.id,
          url: imageRecord.url,
          position: imageRecord.position,
        })
      }
    }

    if (uploadedImages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Aucune image n\'a pu être uploadée' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      images: uploadedImages,
    })

  } catch (error) {
    console.error('[API:listings/images] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'upload' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/listings/images
 * Récupère les images d'un brouillon ou d'une annonce
 */
export async function GET(request: NextRequest): Promise<NextResponse<{
  success: boolean
  images?: Array<{
    id: string
    url: string
    position: number
    isGenerated: boolean
  }>
  error?: string
}>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const draftId = searchParams.get('draftId')
    const listingId = searchParams.get('listingId')

    if (!draftId && !listingId) {
      return NextResponse.json(
        { success: false, error: 'draftId ou listingId requis' },
        { status: 400 }
      )
    }

    // Construire la requête
    let query = (supabase as any)
      .from('listing_images')
      .select('id, url, position, is_generated')
      .order('position', { ascending: true })

    if (draftId) {
      query = query.eq('draft_id', draftId)
    } else if (listingId) {
      query = query.eq('listing_id', listingId)
    }

    const { data: images, error: fetchError } = await query

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      images: (images || []).map((img: any) => ({
        id: img.id,
        url: img.url,
        position: img.position,
        isGenerated: img.is_generated,
      })),
    })
  } catch (error) {
    console.error('[API:listings/images] GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/listings/images
 * Supprime une image d'une annonce
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<{ success: boolean; error?: string }>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { imageId } = await request.json()
    
    if (!imageId) {
      return NextResponse.json(
        { success: false, error: 'ID d\'image requis' },
        { status: 400 }
      )
    }

    // Vérifier que l'image appartient à l'utilisateur
    const { data: image, error: imageError } = await (supabase as any)
      .from('listing_images')
      .select(`
        id, 
        url,
        draft_id,
        listing_id,
        listing_drafts!left(user_id),
        listings!left(user_id)
      `)
      .eq('id', imageId)
      .single()

    if (imageError || !image) {
      return NextResponse.json(
        { success: false, error: 'Image non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier la propriété
    const ownerId = (image.listing_drafts as { user_id: string } | null)?.user_id 
      || (image.listings as { user_id: string } | null)?.user_id

    if (ownerId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 403 }
      )
    }

    // Supprimer de la base de données
    const { error: deleteError } = await (supabase as any)
      .from('listing_images')
      .delete()
      .eq('id', imageId)

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la suppression' },
        { status: 500 }
      )
    }

    // Supprimer du storage (optionnel, en arrière-plan)
    try {
      const adminClient = createAdminClient()
      const urlPath = new URL(image.url).pathname
      const storagePath = urlPath.replace('/storage/v1/object/public/listing-images/', '')
      await adminClient.storage.from('listing-images').remove([storagePath])
    } catch (e) {
      console.warn('[API:listings/images] Could not delete from storage:', e)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[API:listings/images] Delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression' },
      { status: 500 }
    )
  }
}


