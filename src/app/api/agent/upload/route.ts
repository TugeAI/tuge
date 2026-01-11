/**
 * API Route: Upload de fichiers pour le chat
 * 
 * Upload des images et documents vers Supabase Storage
 * pour analyse par GPT-4 Vision ou partage dans la conversation.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_DOC_TYPES = ['application/pdf']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Permettre aussi aux invités d'uploader (optionnel)
    // Pour le moment, on exige une authentification
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    // Vérification du type de fichier
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const isDocument = ALLOWED_DOC_TYPES.includes(file.type)

    if (!isImage && !isDocument) {
      return NextResponse.json(
        { error: 'Type de fichier non supporté. Utilisez JPG, PNG, WebP, GIF ou PDF.' },
        { status: 400 }
      )
    }

    // Vérification de la taille
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux. Maximum 10MB.' },
        { status: 400 }
      )
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 10)
    const extension = file.name.split('.').pop() || (isImage ? 'png' : 'pdf')
    const fileName = `${user.id}/${timestamp}-${randomId}.${extension}`
    const bucket = isImage ? 'chat-images' : 'chat-documents'

    // Upload vers Supabase Storage avec le client admin
    const adminClient = createAdminClient()
    
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { data, error } = await adminClient.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json(
        { error: 'Erreur lors de l\'upload' },
        { status: 500 }
      )
    }

    // Obtenir l'URL publique
    const { data: urlData } = adminClient.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      type: isImage ? 'image' : 'document',
      fileName: file.name,
      size: file.size
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}







