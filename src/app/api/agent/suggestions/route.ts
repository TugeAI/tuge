/**
 * API Route: /api/agent/suggestions
 * 
 * Gère les suggestions proactives de l'agent IA :
 * - GET : Récupère la suggestion active et évalue les triggers
 * - POST : Actions sur une suggestion (dismiss, click)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { evaluateAllTriggers, evaluateSearchNoResults } from '@/lib/agent/suggestions'
import type { SuggestionTrigger } from '@/lib/supabase/types'

/**
 * GET /api/agent/suggestions
 * 
 * Récupère la suggestion active pour l'utilisateur.
 * Évalue également les triggers si aucune suggestion n'est active.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer la suggestion active
    const { data: activeSuggestion, error: fetchError } = await supabase
      .rpc('get_active_suggestion', { p_user_id: user.id })
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, ce qui est normal s'il n'y a pas de suggestion
      // PGRST202 = function not found, la migration n'est pas encore appliquée
      if (fetchError.code === 'PGRST202') {
        console.warn('[Suggestions API] Migration not applied yet, function not found')
        return NextResponse.json({
          success: true,
          suggestion: null,
          migrationPending: true,
        })
      }
      
      console.error('[Suggestions API] Error fetching suggestion:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération' },
        { status: 500 }
      )
    }

    // Si une suggestion active existe, la retourner
    if (activeSuggestion) {
      return NextResponse.json({
        success: true,
        suggestion: {
          id: activeSuggestion.id,
          triggerType: activeSuggestion.trigger_type,
          title: activeSuggestion.title,
          message: activeSuggestion.message,
          actionPrompt: activeSuggestion.action_prompt,
          priority: activeSuggestion.priority,
          metadata: activeSuggestion.metadata,
          createdAt: activeSuggestion.created_at,
        },
      })
    }

    // Paramètre pour forcer l'évaluation des triggers
    const searchParams = request.nextUrl.searchParams
    const evaluate = searchParams.get('evaluate') === 'true'
    const userName = searchParams.get('userName') || undefined

    if (evaluate) {
      // Évaluer tous les triggers et créer une suggestion si applicable
      const result = await evaluateAllTriggers(user.id, { userName })
      
      if (result.success && result.suggestionId) {
        // Récupérer la suggestion nouvellement créée
        const { data: newSuggestion } = await supabase
          .rpc('get_active_suggestion', { p_user_id: user.id })
          .single()

        if (newSuggestion) {
          return NextResponse.json({
            success: true,
            suggestion: {
              id: newSuggestion.id,
              triggerType: newSuggestion.trigger_type,
              title: newSuggestion.title,
              message: newSuggestion.message,
              actionPrompt: newSuggestion.action_prompt,
              priority: newSuggestion.priority,
              metadata: newSuggestion.metadata,
              createdAt: newSuggestion.created_at,
            },
            evaluated: true,
          })
        }
      }
    }

    // Pas de suggestion active
    return NextResponse.json({
      success: true,
      suggestion: null,
    })

  } catch (error) {
    console.error('[Suggestions API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur inattendue' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/agent/suggestions
 * 
 * Actions sur une suggestion :
 * - action: 'dismiss' - Ignorer la suggestion
 * - action: 'click' - Marquer comme cliquée
 * - action: 'trigger' - Déclencher manuellement un type de suggestion
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, suggestionId, triggerType, metadata } = body

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action requise' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'dismiss': {
        if (!suggestionId) {
          return NextResponse.json(
            { success: false, error: 'ID de suggestion requis' },
            { status: 400 }
          )
        }

        const { data: dismissed, error: dismissError } = await supabase
          .rpc('dismiss_suggestion', { p_suggestion_id: suggestionId })

        if (dismissError) {
          console.error('[Suggestions API] Error dismissing:', dismissError)
          return NextResponse.json(
            { success: false, error: 'Erreur lors du rejet' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: dismissed,
          message: dismissed ? 'Suggestion ignorée' : 'Suggestion non trouvée',
        })
      }

      case 'click': {
        if (!suggestionId) {
          return NextResponse.json(
            { success: false, error: 'ID de suggestion requis' },
            { status: 400 }
          )
        }

        const { data: clicked, error: clickError } = await supabase
          .rpc('click_suggestion', { p_suggestion_id: suggestionId })

        if (clickError) {
          console.error('[Suggestions API] Error clicking:', clickError)
          return NextResponse.json(
            { success: false, error: 'Erreur lors du clic' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: clicked,
          message: clicked ? 'Suggestion cliquée' : 'Suggestion non trouvée',
        })
      }

      case 'trigger': {
        // Déclencher manuellement une évaluation de trigger spécifique
        if (!triggerType) {
          return NextResponse.json(
            { success: false, error: 'Type de trigger requis' },
            { status: 400 }
          )
        }

        const validTriggers: SuggestionTrigger[] = [
          'page_entry',
          'draft_not_published',
          'search_no_results',
          'no_referral_activity',
        ]

        if (!validTriggers.includes(triggerType)) {
          return NextResponse.json(
            { success: false, error: 'Type de trigger invalide' },
            { status: 400 }
          )
        }

        // Pour search_no_results, on a besoin de la query
        if (triggerType === 'search_no_results') {
          const searchQuery = metadata?.searchQuery || metadata?.search_query
          if (!searchQuery) {
            return NextResponse.json(
              { success: false, error: 'Query de recherche requise pour ce trigger' },
              { status: 400 }
            )
          }

          const result = await evaluateSearchNoResults(user.id, searchQuery as string)
          return NextResponse.json({
            success: result.success,
            message: result.message,
            suggestionId: result.suggestionId,
          })
        }

        // Pour les autres triggers, utiliser evaluateAllTriggers
        const result = await evaluateAllTriggers(user.id, {
          userName: metadata?.userName,
          skipPageEntry: triggerType !== 'page_entry',
        })

        return NextResponse.json({
          success: result.success,
          message: result.message,
          suggestionId: result.suggestionId,
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Action non reconnue' },
          { status: 400 }
        )
    }

  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'Format JSON invalide' },
        { status: 400 }
      )
    }

    console.error('[Suggestions API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur inattendue' },
      { status: 500 }
    )
  }
}

