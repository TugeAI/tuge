/**
 * API Route: Transcription audio via Whisper
 * 
 * Reçoit un fichier audio et le transcrit en texte
 * en utilisant l'API OpenAI Whisper.
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Taille maximale de l'audio (25MB - limite Whisper)
const MAX_AUDIO_SIZE = 25 * 1024 * 1024

export async function POST(req: NextRequest) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Aucun fichier audio fourni' },
        { status: 400 }
      )
    }

    // Vérification de la taille
    if (audioFile.size > MAX_AUDIO_SIZE) {
      return NextResponse.json(
        { error: 'Fichier audio trop volumineux. Maximum 25MB.' },
        { status: 400 }
      )
    }

    // Vérifier que c'est bien un fichier audio
    const validTypes = [
      'audio/webm', 
      'audio/mp3', 
      'audio/mpeg', 
      'audio/wav', 
      'audio/ogg',
      'audio/mp4',
      'audio/m4a'
    ]
    
    // Le MediaRecorder peut produire des types variés
    const isValidType = validTypes.some(type => 
      audioFile.type.includes(type.split('/')[1]) || audioFile.type.startsWith('audio/')
    )

    if (!isValidType && !audioFile.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: 'Type de fichier non supporté. Utilisez un format audio valide.' },
        { status: 400 }
      )
    }

    // Convertir le fichier pour l'API OpenAI
    const audioBuffer = await audioFile.arrayBuffer()
    
    // Créer un File-like object pour l'API OpenAI
    const file = new File([audioBuffer], 'audio.webm', { type: audioFile.type })

    // Appeler l'API Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'fr', // Français par défaut
      response_format: 'text'
    })

    return NextResponse.json({
      success: true,
      text: transcription.trim()
    })

  } catch (error) {
    console.error('Transcription error:', error)
    
    // Gestion des erreurs OpenAI spécifiques
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'Limite de requêtes atteinte. Réessayez dans quelques instants.' },
          { status: 429 }
        )
      }
      if (error.status === 400) {
        return NextResponse.json(
          { error: 'Format audio non reconnu. Essayez de réenregistrer.' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Erreur lors de la transcription' },
      { status: 500 }
    )
  }
}







