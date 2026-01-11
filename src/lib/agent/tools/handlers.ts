/**
 * Handlers des outils IA pour l'agent Tuge
 * 
 * Ces handlers exécutent les actions concrètes demandées par le LLM.
 * Ils interagissent avec la base de données Supabase.
 * 
 * NOTE: Les types Supabase pour listing_drafts et listings seront disponibles
 * après exécution de la migration 006_listings_system.sql et régénération des types.
 * En attendant, on utilise des types explicites.
 */

import { createClient as createServerClient } from '@/lib/supabase/server'
import { BRAND, getReferralLink } from '@/config/brand'
import type {
  CreateListingDraftParams,
  CreateListingDraftResult,
  SearchProductsParams,
  SearchProductsResult,
  SuggestReferralMessageParams,
  SuggestReferralMessageResult,
  SendCollaborationProposalParams,
  SendCollaborationProposalResult,
  GetMyListingsParams,
  GetMyListingsResult,
  SearchUserListingsParams,
  SearchUserListingsResult,
  UpdateListingParams,
  UpdateListingResult,
  DeleteListingParams,
  DeleteListingResult,
  DeleteDraftListingParams,
  DeleteDraftListingResult,
  BulkDeleteDraftsParams,
  BulkDeleteDraftsResult,
  ActivateListingParams,
  ActivateListingResult,
  GenerateListingImageParams,
  GenerateListingImageResult,
  ListingCategory,
  PriceType,
  ImageStyle,
} from './definitions'
import OpenAI from 'openai'

import {
  formatCreateListingDraftUX,
  formatSearchProductsUX,
  formatSuggestReferralMessageUX,
} from './ux-messages'

import {
  generateCreateListingDraftRecommendations,
  generateSearchProductsRecommendations,
  generateSuggestReferralMessageRecommendations,
  type RecommendationContext,
} from './recommendations'

import { evaluateSearchNoResults } from '../suggestions'

// Types pour les tables listings (avant régénération des types Supabase)
interface ListingRow {
  id: string
  user_id: string
  title: string
  description: string
  category: ListingCategory
  price: number | null
  price_type: PriceType
  location: string | null
  is_active: boolean
  published_at: string
}

// ============================================================================
// Contexte d'exécution des outils
// ============================================================================

export interface ToolExecutionContext {
  userId?: string
  conversationId?: string
  isAuthenticated: boolean
}

/**
 * Convertit le contexte d'exécution en contexte de recommandation
 */
function toRecommendationContext(context: ToolExecutionContext): RecommendationContext {
  return {
    isAuthenticated: context.isAuthenticated,
    userId: context.userId,
  }
}

// ============================================================================
// Handler: create_listing_draft
// ============================================================================

/**
 * Crée une annonce (brouillon ou publication directe selon publishNow)
 */
export async function handleCreateListingDraft(
  params: CreateListingDraftParams,
  context: ToolExecutionContext
): Promise<CreateListingDraftResult> {
  const recContext = toRecommendationContext(context)

  // Vérifier l'authentification
  if (!context.isAuthenticated || !context.userId) {
    const result: CreateListingDraftResult = {
      success: false,
      message: 'Vous devez être connecté pour créer une annonce.',
      error: 'NOT_AUTHENTICATED',
      completionScore: 0,
    }
    const ux = formatCreateListingDraftUX(result)
    ux.recommendations = generateCreateListingDraftRecommendations(result, recContext)
    result.ux = ux
    return result
  }

  try {
    const supabase = await createServerClient()
    const publishNow = params.publishNow ?? false

    // Si publishNow, créer directement dans listings
    if (publishNow) {
      const { data, error } = await (supabase as any)
        .from('listings')
        .insert({
          user_id: context.userId,
          title: params.title,
          description: params.description,
          category: params.category,
          price: params.price ?? null,
          price_type: params.priceType ?? 'negotiable',
          location: params.location ?? null,
          is_active: true,
        })
        .select('id')
        .single()

      if (error) {
        console.error('[Tool:create_listing_draft] Erreur publication:', error)
        const result: CreateListingDraftResult = {
          success: false,
          message: 'Erreur lors de la publication de l\'annonce.',
          error: error.message,
          completionScore: 0,
        }
        const uxError = formatCreateListingDraftUX(result)
        uxError.recommendations = generateCreateListingDraftRecommendations(result, recContext)
        result.ux = uxError
        return result
      }

      const result: CreateListingDraftResult = {
        success: true,
        draftId: data.id,
        message: `Annonce publiée avec succès ! Titre: "${params.title}". Elle est maintenant visible par tous les utilisateurs.`,
        draft: {
          title: params.title,
          description: params.description,
          category: params.category,
          price: params.price,
          priceType: params.priceType ?? 'negotiable',
          location: params.location,
        },
        completionScore: 100,
      }
      const ux = formatCreateListingDraftUX(result)
      ux.recommendations = generateCreateListingDraftRecommendations(result, recContext)
      result.ux = ux
      return result
    }

    // Sinon, créer un brouillon (comportement par défaut)
    // Essayer d'abord la fonction RPC (si elle existe)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: draftId, error } = await (supabase.rpc as any)('create_listing_draft', {
      p_user_id: context.userId,
      p_title: params.title,
      p_description: params.description,
      p_category: params.category,
      p_price: params.price ?? null,
      p_price_type: params.priceType ?? 'negotiable',
      p_location: params.location ?? null,
      p_conversation_id: context.conversationId ?? null,
      p_agent_metadata: {
        created_by: 'ai_agent',
        created_at: new Date().toISOString(),
      },
    })

    if (error) {
      // Si la fonction RPC n'existe pas, insérer directement
      if (error.message.includes('function') || error.message.includes('does not exist')) {
        return await fallbackCreateDraft(params, context, recContext, supabase)
      }
      
      console.error('[Tool:create_listing_draft] Erreur DB:', error)
      const result: CreateListingDraftResult = {
        success: false,
        message: 'Erreur lors de la création du brouillon.',
        error: error.message,
        completionScore: 0,
      }
      const uxError = formatCreateListingDraftUX(result)
      uxError.recommendations = generateCreateListingDraftRecommendations(result, recContext)
      result.ux = uxError
      return result
    }

    const result: CreateListingDraftResult = {
      success: true,
      draftId: draftId as string,
      message: `Brouillon créé avec succès ! Titre: "${params.title}". Vous pouvez le retrouver dans vos brouillons pour le modifier ou le publier.`,
      draft: {
        title: params.title,
        description: params.description,
        category: params.category,
        price: params.price,
        priceType: params.priceType ?? 'negotiable',
        location: params.location,
      },
      completionScore: 100,
    }
    const ux = formatCreateListingDraftUX(result)
    ux.recommendations = generateCreateListingDraftRecommendations(result, recContext)
    result.ux = ux
    return result
  } catch (error) {
    console.error('[Tool:create_listing_draft] Erreur inattendue:', error)
    const result: CreateListingDraftResult = {
      success: false,
      message: 'Une erreur inattendue est survenue.',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
      completionScore: 0,
    }
    const uxCatch = formatCreateListingDraftUX(result)
    uxCatch.recommendations = generateCreateListingDraftRecommendations(result, recContext)
    result.ux = uxCatch
    return result
  }
}

/**
 * Fallback pour créer un brouillon via INSERT direct
 */
async function fallbackCreateDraft(
  params: CreateListingDraftParams,
  context: ToolExecutionContext,
  recContext: RecommendationContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<CreateListingDraftResult> {
  try {
    const { data, error } = await (supabase as any)
      .from('listing_drafts')
      .insert({
        user_id: context.userId,
        conversation_id: context.conversationId ?? null,
        title: params.title,
        description: params.description,
        category: params.category,
        price: params.price ?? null,
        price_type: params.priceType ?? 'negotiable',
        location: params.location ?? null,
        status: 'draft',
        agent_metadata: {
          created_by: 'ai_agent',
          created_at: new Date().toISOString(),
        },
      })
      .select('id')
      .single()

    if (error) {
      // La table n'existe probablement pas encore
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        const result: CreateListingDraftResult = {
          success: true,
          message: `Brouillon préparé : "${params.title}". (La fonctionnalité de sauvegarde sera disponible après mise à jour de la base de données)`,
          draft: {
            title: params.title,
            description: params.description,
            category: params.category,
            price: params.price,
            priceType: params.priceType ?? 'negotiable',
            location: params.location,
          },
          completionScore: 80,
        }
        const ux = formatCreateListingDraftUX(result)
        ux.recommendations = generateCreateListingDraftRecommendations(result, recContext)
        result.ux = ux
        return result
      }
      throw error
    }

    const result: CreateListingDraftResult = {
      success: true,
      draftId: data.id,
      message: `Brouillon créé avec succès ! Titre: "${params.title}".`,
      draft: {
        title: params.title,
        description: params.description,
        category: params.category,
        price: params.price,
        priceType: params.priceType ?? 'negotiable',
        location: params.location,
      },
      completionScore: 100,
    }
    const ux = formatCreateListingDraftUX(result)
    ux.recommendations = generateCreateListingDraftRecommendations(result, recContext)
    result.ux = ux
    return result
  } catch (error) {
    console.error('[Tool:create_listing_draft] Fallback error:', error)
    const result: CreateListingDraftResult = {
      success: true,
      message: `Brouillon préparé : "${params.title}". Vous pourrez le sauvegarder une fois connecté.`,
      draft: {
        title: params.title,
        description: params.description,
        category: params.category,
        price: params.price,
        priceType: params.priceType ?? 'negotiable',
        location: params.location,
      },
      completionScore: 80,
    }
    const ux = formatCreateListingDraftUX(result)
    ux.recommendations = generateCreateListingDraftRecommendations(result, recContext)
    result.ux = ux
    return result
  }
}

// ============================================================================
// Handler: search_products
// ============================================================================

/**
 * Recherche des annonces dans la base de données Tuge
 * Ne retourne QUE des données internes, jamais de données externes
 */
export async function handleSearchProducts(
  params: SearchProductsParams,
  context: ToolExecutionContext
): Promise<SearchProductsResult> {
  const recContext = toRecommendationContext(context)

  try {
    const supabase = await createServerClient()

    // Appeler la fonction RPC de recherche
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: results, error } = await (supabase.rpc as any)('search_listings', {
      search_query: params.query,
      category_filter: params.category ?? null,
      max_price_filter: params.maxPrice ?? null,
      location_filter: params.location ?? null,
      result_limit: params.limit ?? 5,
    })

    if (error) {
      console.error('[Tool:search_products] Erreur DB:', error)
      
      // Si la fonction RPC n'existe pas encore, faire une recherche basique
      if (error.message.includes('function') || error.message.includes('does not exist')) {
        return await fallbackSearch(params, recContext, supabase)
      }
      
      const result: SearchProductsResult = {
        success: false,
        results: [],
        totalFound: 0,
        message: 'Erreur lors de la recherche.',
        error: error.message,
        completionScore: 0,
      }
      const ux = formatSearchProductsUX(result)
      ux.recommendations = generateSearchProductsRecommendations(result, recContext)
      result.ux = ux
      return result
    }

    // Formater les résultats
    const formattedResults = ((results as ListingRow[]) || []).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      price: item.price ?? undefined,
      priceType: item.price_type,
      location: item.location ?? undefined,
      publishedAt: item.published_at,
    }))

    const count = formattedResults.length

    if (count === 0) {
      // Déclencher une suggestion proactive si l'utilisateur est authentifié
      if (context.isAuthenticated && context.userId) {
        // Exécuter en arrière-plan sans bloquer la réponse
        evaluateSearchNoResults(context.userId, params.query).catch((err) => {
          console.warn('[Tool:search_products] Erreur création suggestion:', err)
        })
      }

      const result: SearchProductsResult = {
        success: true,
        results: [],
        totalFound: 0,
        message: `Aucune annonce trouvée pour "${params.query}". Essayez avec d'autres termes ou sans filtres.`,
        completionScore: 50,
      }
      const ux = formatSearchProductsUX(result)
      ux.recommendations = generateSearchProductsRecommendations(result, recContext)
      result.ux = ux
      return result
    }

    const result: SearchProductsResult = {
      success: true,
      results: formattedResults,
      totalFound: count,
      message: `${count} annonce${count > 1 ? 's' : ''} trouvée${count > 1 ? 's' : ''} pour "${params.query}".`,
      completionScore: 100,
    }
    const ux = formatSearchProductsUX(result)
    ux.recommendations = generateSearchProductsRecommendations(result, recContext)
    result.ux = ux
    return result
  } catch (error) {
    console.error('[Tool:search_products] Erreur inattendue:', error)
    const result: SearchProductsResult = {
      success: false,
      results: [],
      totalFound: 0,
      message: 'Une erreur inattendue est survenue lors de la recherche.',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
      completionScore: 0,
    }
    const ux = formatSearchProductsUX(result)
    ux.recommendations = generateSearchProductsRecommendations(result, recContext)
    result.ux = ux
    return result
  }
}

/**
 * Recherche de secours si la fonction RPC n'existe pas
 */
async function fallbackSearch(
  params: SearchProductsParams,
  recContext: RecommendationContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<SearchProductsResult> {
  try {
    let query = supabase
      .from('listings')
      .select('id, title, description, category, price, price_type, location, published_at')
      .eq('is_active', true)
      .order('published_at', { ascending: false })
      .limit(params.limit ?? 5)

    // Appliquer les filtres
    if (params.category) {
      query = query.eq('category', params.category)
    }
    if (params.maxPrice !== undefined) {
      query = query.lte('price', params.maxPrice)
    }
    if (params.location) {
      query = query.ilike('location', `%${params.location}%`)
    }
    // Recherche textuelle basique
    if (params.query) {
      query = query.or(`title.ilike.%${params.query}%,description.ilike.%${params.query}%`)
    }

    const { data, error } = await query

    if (error) {
      // La table n'existe peut-être pas encore
      const result: SearchProductsResult = {
        success: true,
        results: [],
        totalFound: 0,
        message: `Aucune annonce disponible pour le moment. La marketplace ${BRAND.name} se construit !`,
        completionScore: 50,
      }
      const ux = formatSearchProductsUX(result)
      ux.recommendations = generateSearchProductsRecommendations(result, recContext)
      result.ux = ux
      return result
    }

    const formattedResults = ((data as ListingRow[]) || []).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      price: item.price ?? undefined,
      priceType: item.price_type,
      location: item.location ?? undefined,
      publishedAt: item.published_at,
    }))

    // Si aucun résultat, déclencher une suggestion proactive
    if (formattedResults.length === 0 && recContext.isAuthenticated && recContext.userId) {
      evaluateSearchNoResults(recContext.userId, params.query).catch((err) => {
        console.warn('[Tool:search_products:fallback] Erreur création suggestion:', err)
      })
    }

    const result: SearchProductsResult = {
      success: true,
      results: formattedResults,
      totalFound: formattedResults.length,
      message: formattedResults.length > 0 
        ? `${formattedResults.length} annonce(s) trouvée(s).`
        : `Aucune annonce trouvée pour "${params.query}".`,
      completionScore: formattedResults.length > 0 ? 100 : 50,
    }
    const ux = formatSearchProductsUX(result)
    ux.recommendations = generateSearchProductsRecommendations(result, recContext)
    result.ux = ux
    return result
  } catch {
    // La table n'existe pas encore
    const result: SearchProductsResult = {
      success: true,
      results: [],
      totalFound: 0,
      message: `Aucune annonce disponible pour le moment. La marketplace ${BRAND.name} se construit !`,
      completionScore: 50,
    }
    const ux = formatSearchProductsUX(result)
    ux.recommendations = generateSearchProductsRecommendations(result, recContext)
    result.ux = ux
    return result
  }
}

// ============================================================================
// Handler: suggest_referral_message
// ============================================================================

/**
 * Génère une suggestion de message de parrainage
 * Ne promet JAMAIS de revenus fixes ou garantis
 */
export async function handleSuggestReferralMessage(
  params: SuggestReferralMessageParams,
  context: ToolExecutionContext
): Promise<SuggestReferralMessageResult> {
  const recContext = toRecommendationContext(context)

  // Récupérer le code parrain de l'utilisateur si connecté
  let referralCode = 'VOTRE-CODE'
  let referralLink = getReferralLink('VOTRE-CODE')

  if (context.isAuthenticated && context.userId) {
    try {
      const supabase = await createServerClient()
      
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('referrer_code')
        .eq('id', context.userId)
        .single()

      if (profile?.referrer_code) {
        referralCode = profile.referrer_code
        referralLink = getReferralLink(referralCode)
      }
    } catch (error) {
      console.warn('[Tool:suggest_referral_message] Impossible de récupérer le code parrain:', error)
    }
  }

  // Générer le message selon le contexte et le ton
  const suggestedMessage = generateReferralMessage(params, referralCode, referralLink)

  // Conseils pour le partage
  const tips = getTipsForContext(params.context)

  // Score selon si code personnel ou générique
  const hasPersonalCode = referralCode !== 'VOTRE-CODE'
  const completionScore = hasPersonalCode ? 100 : 80

  const result: SuggestReferralMessageResult = {
    success: true,
    message: 'Voici une suggestion de message de parrainage.',
    suggestedMessage,
    referralCode: context.isAuthenticated ? referralCode : undefined,
    referralLink: context.isAuthenticated ? referralLink : undefined,
    tips,
    completionScore,
  }
  const ux = formatSuggestReferralMessageUX(result)
  ux.recommendations = generateSuggestReferralMessageRecommendations(result, recContext)
  result.ux = ux
  return result
}

/**
 * Génère un message de parrainage adapté au contexte
 * IMPORTANT: Ne jamais promettre de revenus fixes
 */
function generateReferralMessage(
  params: SuggestReferralMessageParams,
  referralCode: string,
  referralLink: string
): string {
  const { context, tone = 'casual', includeCode = true } = params

  // Messages par contexte et ton
  const messages: Record<string, Record<string, string>> = {
    friend: {
      casual: `Hey ! 👋 Je viens de découvrir ${BRAND.name}, une marketplace vraiment cool où tu discutes avec une IA pour trouver des services ou vendre tes trucs. Tu devrais tester, c'est gratuit !`,
      formal: `Bonjour, je souhaitais te parler de ${BRAND.name}, une plateforme innovante qui simplifie les échanges de services grâce à l'intelligence artificielle. L'inscription est gratuite.`,
      enthusiastic: `🎉 OMG tu dois absolument essayer ${BRAND.name} ! C'est une marketplace géniale où tu parles juste à une IA et elle fait tout le travail pour toi ! Trop pratique !`,
      neutral: `Je te recommande ${BRAND.name}, une marketplace conversationnelle. Tu peux y proposer ou chercher des services simplement en discutant avec une IA.`,
    },
    professional: {
      casual: `Salut ! Je voulais te parler de ${BRAND.name}. C'est une plateforme qui peut t'aider à trouver des clients ou des prestataires via une IA. Assez pratique pour gagner du temps.`,
      formal: `Bonjour, je me permets de vous recommander ${BRAND.name}, une marketplace professionnelle utilisant l'intelligence artificielle pour faciliter les mises en relation. Cela pourrait être pertinent pour votre activité.`,
      enthusiastic: `Tu cherches de nouveaux clients ? 🚀 ${BRAND.name} est parfait ! Une IA qui te trouve des opportunités, c'est l'avenir du networking pro !`,
      neutral: `${BRAND.name} est une plateforme de mise en relation professionnelle basée sur l'IA. Elle peut vous aider à développer votre réseau et trouver des opportunités.`,
    },
    social_media: {
      casual: `💡 Découvrez ${BRAND.name} ! Une marketplace où vous discutez avec une IA pour trouver ce que vous cherchez. Fini les formulaires interminables !`,
      formal: `Présentation de ${BRAND.name} : la première marketplace conversationnelle française. Achetez, vendez et proposez vos services en discutant simplement avec une IA.`,
      enthusiastic: `🔥 Game changer alert ! ${BRAND.name} révolutionne les marketplaces avec son IA conversationnelle. Essayez, vous ne reviendrez plus en arrière ! 🚀`,
      neutral: `${BRAND.name} : une nouvelle façon de faire des échanges. Parlez à l'IA, elle s'occupe du reste. Services, produits, emplois - tout en une conversation.`,
    },
    family: {
      casual: `Coucou ! J'utilise ${BRAND.name} pour trouver des services près de chez nous. Tu parles à une IA super sympa et elle te trouve ce qu'il te faut. Pratique !`,
      formal: `Je souhaitais te recommander ${BRAND.name}, une plateforme très simple d'utilisation pour trouver des services ou proposer les tiens. L'IA guide tout le processus.`,
      enthusiastic: `J'ai trouvé LA solution pour nous simplifier la vie ! 🙌 ${BRAND.name}, tu lui dis ce que tu cherches et l'IA fait tout ! Même mamie pourrait l'utiliser !`,
      neutral: `${BRAND.name} est une plateforme pratique pour trouver des services. L'inscription est simple et gratuite.`,
    },
  }

  let message = messages[context]?.[tone] || messages.friend.casual

  // Ajouter le code/lien si demandé
  if (includeCode) {
    message += `\n\n${referralLink}`
    if (referralCode !== 'VOTRE-CODE') {
      message += `\nMon code : ${referralCode}`
    }
  }

  return message
}

/**
 * Retourne des conseils adaptés au contexte de partage
 */
function getTipsForContext(context: string): string[] {
  const baseTips = [
    '✅ Partagez votre expérience personnelle avec la plateforme',
    '❌ Ne promettez jamais de gains financiers garantis',
    `💡 Expliquez comment ${BRAND.name} vous a aidé concrètement`,
  ]

  const contextTips: Record<string, string[]> = {
    friend: [
      '💬 Personnalisez le message avec une anecdote partagée',
      '🎯 Mentionnez un besoin spécifique que votre ami pourrait avoir',
    ],
    professional: [
      '📊 Mettez en avant les avantages professionnels (gain de temps, leads qualifiés)',
      '🤝 Proposez de montrer comment vous utilisez la plateforme',
    ],
    social_media: [
      '📱 Utilisez des hashtags pertinents (#marketplace #IA #services)',
      '📸 Accompagnez d\'une capture d\'écran si possible',
    ],
    family: [
      '👨‍👩‍👧 Expliquez simplement, sans jargon technique',
      '🏠 Donnez un exemple concret de service local',
    ],
  }

  return [...baseTips, ...(contextTips[context] || [])]
}

// ============================================================================
// Handler: send_collaboration_proposal
// ============================================================================

/**
 * Envoie une proposition de collaboration à un autre utilisateur
 * Nécessite l'authentification et l'approbation du destinataire
 */
export async function handleSendCollaborationProposal(
  params: SendCollaborationProposalParams,
  context: ToolExecutionContext
): Promise<SendCollaborationProposalResult> {
  // Vérifier l'authentification
  if (!context.isAuthenticated || !context.userId) {
    return {
      success: false,
      message: 'Vous devez être connecté pour envoyer une proposition de collaboration.',
      errorCode: 'NOT_AUTHENTICATED',
      error: 'NOT_AUTHENTICATED',
      completionScore: 0,
    }
  }

  // Empêcher l'auto-proposition
  if (params.toUserId === context.userId) {
    return {
      success: false,
      message: 'Impossible d\'envoyer une proposition à vous-même.',
      errorCode: 'SELF_PROPOSAL',
      error: 'SELF_PROPOSAL',
      completionScore: 0,
    }
  }

  try {
    const supabase = await createServerClient()

    // Appeler la fonction RPC pour créer la proposition
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: result, error } = await (supabase.rpc as any)('create_proposal', {
      p_from_user_id: context.userId,
      p_to_user_id: params.toUserId,
      p_type: params.type,
      p_payload: params.payload || {},
      p_message: params.message || null,
      p_dedupe_key: null, // Laisser la DB générer
    })

    if (error) {
      console.error('[Tool:send_collaboration_proposal] RPC error:', error)
      return {
        success: false,
        message: 'Erreur lors de l\'envoi de la proposition.',
        errorCode: 'RPC_ERROR',
        error: error.message,
        completionScore: 0,
      }
    }

    const proposalResult = result?.[0]

    if (!proposalResult?.success) {
      // Mapper les codes d'erreur vers des messages utilisateur
      const errorMessages: Record<string, string> = {
        'COOLDOWN_ACTIVE': 'Veuillez attendre avant d\'envoyer une nouvelle proposition à cet utilisateur.',
        'RECIPIENT_LIMIT': 'Ce destinataire a atteint la limite de propositions en attente.',
        'DUPLICATE': 'Une proposition similaire est déjà en attente.',
      }

      return {
        success: false,
        message: errorMessages[proposalResult?.error_code] || proposalResult?.error_message || 'Impossible d\'envoyer la proposition.',
        errorCode: proposalResult?.error_code || 'UNKNOWN_ERROR',
        error: proposalResult?.error_message,
        completionScore: 0,
      }
    }

    // Succès
    const typeLabels: Record<string, string> = {
      'service_proposal': 'proposition de service',
      'collaboration_request': 'demande de collaboration',
      'info_share': 'partage d\'information',
    }

    return {
      success: true,
      message: `Votre ${typeLabels[params.type] || 'proposition'} a été envoyée ! Le destinataire pourra l'accepter ou la refuser. Elle expirera automatiquement dans 7 jours si sans réponse.`,
      proposalId: proposalResult.proposal_id,
      completionScore: 100,
    }
  } catch (error) {
    console.error('[Tool:send_collaboration_proposal] Unexpected error:', error)
    return {
      success: false,
      message: 'Une erreur inattendue est survenue.',
      errorCode: 'INTERNAL_ERROR',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
      completionScore: 0,
    }
  }
}

// ============================================================================
// Handler: get_my_listings
// ============================================================================

/**
 * Récupère les annonces de l'utilisateur connecté
 */
export async function handleGetMyListings(
  params: GetMyListingsParams,
  context: ToolExecutionContext
): Promise<GetMyListingsResult> {
  // Vérifier l'authentification
  if (!context.isAuthenticated || !context.userId) {
    return {
      success: false,
      message: 'Vous devez être connecté pour voir vos annonces.',
      listings: [],
      totalCount: 0,
      error: 'NOT_AUTHENTICATED',
    }
  }

  try {
    const supabase = await createServerClient()
    const status = params.status ?? 'all'
    const limit = params.limit ?? 10

    // Récupérer les annonces publiées
    let listingsQuery = supabase
      .from('listings')
      .select('id, title, description, category, price, price_type, location, is_active, view_count, contact_count, created_at, published_at')
      .eq('user_id', context.userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filtrer par statut si nécessaire
    if (status === 'active') {
      listingsQuery = listingsQuery.eq('is_active', true)
    } else if (status === 'inactive') {
      listingsQuery = listingsQuery.eq('is_active', false)
    }

    const { data: listings, error: listingsError } = await listingsQuery

    if (listingsError) {
      console.error('[Tool:get_my_listings] Erreur listings:', listingsError)
      return {
        success: false,
        message: 'Erreur lors de la récupération des annonces.',
        listings: [],
        totalCount: 0,
        error: listingsError.message,
      }
    }

    // Récupérer les brouillons si nécessaire
    let drafts: Array<{
      id: string
      title: string
      description: string
      category: ListingCategory
      price: number | null
      price_type: PriceType
      location: string | null
      created_at: string
    }> = []

    if (status === 'all' || status === 'draft') {
      const { data: draftsData, error: draftsError } = await (supabase as any)
        .from('listing_drafts')
        .select('id, title, description, category, price, price_type, location, created_at')
        .eq('user_id', context.userId)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (!draftsError && draftsData) {
        drafts = draftsData
      }
    }

    // Combiner et formater les résultats
    const formattedListings = (listings || []).map(l => ({
      id: l.id,
      title: l.title,
      description: l.description,
      category: l.category as ListingCategory,
      price: l.price ?? undefined,
      priceType: l.price_type as PriceType,
      location: l.location ?? undefined,
      isActive: l.is_active,
      isDraft: false,
      viewCount: l.view_count,
      contactCount: l.contact_count,
      createdAt: l.created_at,
      publishedAt: l.published_at,
    }))

    const formattedDrafts = drafts.map(d => ({
      id: d.id,
      title: d.title,
      description: d.description,
      category: d.category,
      price: d.price ?? undefined,
      priceType: d.price_type,
      location: d.location ?? undefined,
      isActive: false,
      isDraft: true,
      viewCount: 0,
      contactCount: 0,
      createdAt: d.created_at,
      publishedAt: undefined,
    }))

    const allListings = status === 'draft' 
      ? formattedDrafts 
      : [...formattedListings, ...formattedDrafts].slice(0, limit)

    const totalCount = allListings.length
    const activeCount = formattedListings.filter(l => l.isActive).length
    const draftCount = formattedDrafts.length

    let message = ''
    if (totalCount === 0) {
      message = 'Vous n\'avez aucune annonce pour le moment.'
    } else {
      const parts = []
      if (activeCount > 0) parts.push(`${activeCount} annonce(s) active(s)`)
      if (draftCount > 0) parts.push(`${draftCount} brouillon(s)`)
      message = `Vous avez ${parts.join(' et ')}.`
    }

    return {
      success: true,
      message,
      listings: allListings,
      totalCount,
    }
  } catch (error) {
    console.error('[Tool:get_my_listings] Erreur inattendue:', error)
    return {
      success: false,
      message: 'Une erreur inattendue est survenue.',
      listings: [],
      totalCount: 0,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    }
  }
}

// ============================================================================
// Handler: search_user_listings
// ============================================================================

/**
 * Recherche et filtre les annonces de l'utilisateur par texte et/ou statut
 * 
 * Ce handler permet une recherche plus fine que get_my_listings :
 * - Recherche textuelle dans titre et description
 * - Filtrage par statut ET par catégorie
 * - Combinaison de plusieurs critères
 */
export async function handleSearchUserListings(
  params: SearchUserListingsParams,
  context: ToolExecutionContext
): Promise<SearchUserListingsResult> {
  // Vérifier l'authentification
  if (!context.isAuthenticated || !context.userId) {
    return {
      success: false,
      message: 'Vous devez être connecté pour rechercher vos annonces.',
      listings: [],
      totalCount: 0,
      appliedFilters: {},
      error: 'NOT_AUTHENTICATED',
    }
  }

  try {
    const supabase = await createServerClient()
    const status = params.status ?? 'all'
    const limit = params.limit ?? 10
    const query = params.query?.trim().toLowerCase()
    const category = params.category

    // Récupérer les annonces publiées
    let listingsQuery = supabase
      .from('listings')
      .select('id, title, description, category, price, price_type, location, is_active, view_count, contact_count, created_at, published_at')
      .eq('user_id', context.userId)
      .order('created_at', { ascending: false })

    // Filtrer par statut
    if (status === 'active') {
      listingsQuery = listingsQuery.eq('is_active', true)
    } else if (status === 'inactive') {
      listingsQuery = listingsQuery.eq('is_active', false)
    }
    // Note: status === 'draft' sera traité séparément

    // Filtrer par catégorie
    if (category) {
      listingsQuery = listingsQuery.eq('category', category)
    }

    // Recherche textuelle (si query fournie)
    if (query) {
      listingsQuery = listingsQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    }

    const { data: listings, error: listingsError } = await listingsQuery.limit(limit)

    if (listingsError) {
      console.error('[Tool:search_user_listings] Erreur listings:', listingsError)
      return {
        success: false,
        message: 'Erreur lors de la recherche des annonces.',
        listings: [],
        totalCount: 0,
        appliedFilters: { status, category },
        error: listingsError.message,
      }
    }

    // Récupérer les brouillons si nécessaire
    let drafts: Array<{
      id: string
      title: string
      description: string
      category: ListingCategory
      price: number | null
      price_type: PriceType
      location: string | null
      created_at: string
    }> = []

    if (status === 'all' || status === 'draft') {
      let draftsQuery = supabase
        .from('listing_drafts')
        .select('id, title, description, category, price, price_type, location, created_at')
        .eq('user_id', context.userId)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })

      // Filtrer par catégorie
      if (category) {
        draftsQuery = draftsQuery.eq('category', category)
      }

      // Recherche textuelle (si query fournie)
      if (query) {
        draftsQuery = draftsQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      }

      const { data: draftsData, error: draftsError } = await draftsQuery.limit(limit)

      if (!draftsError && draftsData) {
        drafts = draftsData
      }
    }

    // Formater les résultats
    const formattedListings = (status !== 'draft' ? (listings || []) : []).map(l => ({
      id: l.id,
      title: l.title,
      description: l.description,
      category: l.category as ListingCategory,
      price: l.price ?? undefined,
      priceType: l.price_type as PriceType,
      location: l.location ?? undefined,
      isActive: l.is_active,
      isDraft: false,
      viewCount: l.view_count,
      contactCount: l.contact_count,
      createdAt: l.created_at,
      publishedAt: l.published_at,
    }))

    const formattedDrafts = drafts.map(d => ({
      id: d.id,
      title: d.title,
      description: d.description,
      category: d.category,
      price: d.price ?? undefined,
      priceType: d.price_type,
      location: d.location ?? undefined,
      isActive: false,
      isDraft: true,
      viewCount: 0,
      contactCount: 0,
      createdAt: d.created_at,
      publishedAt: undefined,
    }))

    // Combiner les résultats
    const allListings = status === 'draft' 
      ? formattedDrafts 
      : [...formattedListings, ...formattedDrafts].slice(0, limit)

    const totalCount = allListings.length
    const activeCount = formattedListings.filter(l => l.isActive).length
    const inactiveCount = formattedListings.filter(l => !l.isActive).length
    const draftCount = formattedDrafts.length

    // Construire le message de résultat
    let message = ''
    if (totalCount === 0) {
      if (query) {
        message = `Aucune annonce trouvée pour "${query}".`
      } else {
        message = 'Aucune annonce correspondante.'
      }
    } else {
      const parts: string[] = []
      if (activeCount > 0) parts.push(`${activeCount} active(s)`)
      if (inactiveCount > 0) parts.push(`${inactiveCount} inactive(s)`)
      if (draftCount > 0) parts.push(`${draftCount} brouillon(s)`)
      
      const queryInfo = query ? ` pour "${query}"` : ''
      message = `${totalCount} annonce(s) trouvée(s)${queryInfo} : ${parts.join(', ')}.`
    }

    return {
      success: true,
      message,
      listings: allListings,
      totalCount,
      searchQuery: query,
      appliedFilters: {
        status: status !== 'all' ? status : undefined,
        category,
      },
    }
  } catch (error) {
    console.error('[Tool:search_user_listings] Erreur inattendue:', error)
    return {
      success: false,
      message: 'Une erreur inattendue est survenue.',
      listings: [],
      totalCount: 0,
      appliedFilters: {},
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    }
  }
}

// ============================================================================
// Handler: update_listing
// ============================================================================

/**
 * Modifie une annonce existante de l'utilisateur
 */
export async function handleUpdateListing(
  params: UpdateListingParams,
  context: ToolExecutionContext
): Promise<UpdateListingResult> {
  // Vérifier l'authentification
  if (!context.isAuthenticated || !context.userId) {
    return {
      success: false,
      message: 'Vous devez être connecté pour modifier une annonce.',
      error: 'NOT_AUTHENTICATED',
    }
  }

  try {
    const supabase = await createServerClient()

    // Vérifier que l'annonce existe et appartient à l'utilisateur
    const { data: existingListing, error: checkError } = await (supabase as any)
      .from('listings')
      .select('id, user_id, title, description, category, price, price_type, location, is_active')
      .eq('id', params.listingId)
      .single()

    if (checkError || !existingListing) {
      return {
        success: false,
        message: 'Annonce introuvable.',
        error: 'NOT_FOUND',
      }
    }

    if (existingListing.user_id !== context.userId) {
      return {
        success: false,
        message: 'Vous ne pouvez pas modifier cette annonce.',
        error: 'NOT_OWNER',
      }
    }

    // Construire l'objet de mise à jour
    const updates: Record<string, unknown> = {}
    if (params.title !== undefined) updates.title = params.title
    if (params.description !== undefined) updates.description = params.description
    if (params.price !== undefined) updates.price = params.price
    if (params.location !== undefined) updates.location = params.location
    if (params.isActive !== undefined) updates.is_active = params.isActive

    if (Object.keys(updates).length === 0) {
      return {
        success: false,
        message: 'Aucune modification spécifiée.',
        error: 'NO_CHANGES',
      }
    }

    // Mettre à jour l'annonce
    const { data: updatedListing, error: updateError } = await (supabase as any)
      .from('listings')
      .update(updates)
      .eq('id', params.listingId)
      .select('id, title, description, category, price, price_type, location, is_active')
      .single()

    if (updateError) {
      console.error('[Tool:update_listing] Erreur update:', updateError)
      return {
        success: false,
        message: 'Erreur lors de la modification de l\'annonce.',
        error: updateError.message,
      }
    }

    const changedFields = Object.keys(updates).map(k => {
      const labels: Record<string, string> = {
        title: 'titre',
        description: 'description',
        price: 'prix',
        location: 'localisation',
        is_active: 'statut',
      }
      return labels[k] || k
    })

    return {
      success: true,
      message: `Annonce modifiée ! ${changedFields.join(', ')} mis à jour.`,
      listing: {
        id: updatedListing.id,
        title: updatedListing.title,
        description: updatedListing.description,
        category: updatedListing.category as ListingCategory,
        price: updatedListing.price ?? undefined,
        priceType: updatedListing.price_type as PriceType,
        location: updatedListing.location ?? undefined,
        isActive: updatedListing.is_active,
      },
    }
  } catch (error) {
    console.error('[Tool:update_listing] Erreur inattendue:', error)
    return {
      success: false,
      message: 'Une erreur inattendue est survenue.',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    }
  }
}

// ============================================================================
// Handler: delete_listing
// ============================================================================

/**
 * Supprime définitivement une annonce PUBLIÉE et INACTIVE de l'utilisateur
 * PROTECTION: Ne peut PAS supprimer une annonce active (is_active = true)
 */
export async function handleDeleteListing(
  params: DeleteListingParams,
  context: ToolExecutionContext
): Promise<DeleteListingResult> {
  // Vérifier l'authentification
  if (!context.isAuthenticated || !context.userId) {
    return {
      success: false,
      message: 'Vous devez être connecté pour supprimer une annonce.',
      error: 'NOT_AUTHENTICATED',
    }
  }

  // Vérifier la confirmation
  if (!params.confirm) {
    return {
      success: false,
      message: 'La suppression doit être confirmée (confirm: true).',
      error: 'NOT_CONFIRMED',
    }
  }

  try {
    const supabase = await createServerClient()

    // Vérifier que l'annonce existe et appartient à l'utilisateur
    // IMPORTANT: Récupérer aussi is_active pour la protection
    const { data: existingListing, error: checkError } = await (supabase as any)
      .from('listings')
      .select('id, user_id, title, is_active')
      .eq('id', params.listingId)
      .single()

    if (checkError || !existingListing) {
      return {
        success: false,
        message: 'Annonce introuvable.',
        error: 'NOT_FOUND',
      }
    }

    if (existingListing.user_id !== context.userId) {
      return {
        success: false,
        message: 'Vous ne pouvez pas supprimer cette annonce.',
        error: 'NOT_OWNER',
      }
    }

    // PROTECTION: Interdire la suppression d'une annonce active
    if (existingListing.is_active) {
      return {
        success: false,
        message: `Impossible de supprimer l'annonce "${existingListing.title}" car elle est ACTIVE. Désactivez-la d'abord avec update_listing (isActive: false) si vous souhaitez vraiment la supprimer.`,
        error: 'CANNOT_DELETE_ACTIVE_LISTING',
      }
    }

    const listingTitle = existingListing.title

    // Supprimer l'annonce (uniquement si inactive)
    const { error: deleteError } = await (supabase as any)
      .from('listings')
      .delete()
      .eq('id', params.listingId)
      .eq('is_active', false) // Double protection au niveau SQL

    if (deleteError) {
      console.error('[Tool:delete_listing] Erreur delete:', deleteError)
      return {
        success: false,
        message: 'Erreur lors de la suppression de l\'annonce.',
        error: deleteError.message,
      }
    }

    return {
      success: true,
      message: `Annonce "${listingTitle}" supprimée définitivement.`,
      deletedId: params.listingId,
    }
  } catch (error) {
    console.error('[Tool:delete_listing] Erreur inattendue:', error)
    return {
      success: false,
      message: 'Une erreur inattendue est survenue.',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    }
  }
}

// ============================================================================
// Handler: delete_draft_listing
// ============================================================================

/**
 * Supprime définitivement UN brouillon spécifique de l'utilisateur
 */
export async function handleDeleteDraftListing(
  params: DeleteDraftListingParams,
  context: ToolExecutionContext
): Promise<DeleteDraftListingResult> {
  // Vérifier l'authentification
  if (!context.isAuthenticated || !context.userId) {
    return {
      success: false,
      message: 'Vous devez être connecté pour supprimer un brouillon.',
      error: 'NOT_AUTHENTICATED',
    }
  }

  // Vérifier la confirmation
  if (!params.confirm) {
    return {
      success: false,
      message: 'La suppression doit être confirmée (confirm: true) après confirmation explicite de l\'utilisateur.',
      error: 'NOT_CONFIRMED',
    }
  }

  try {
    const supabase = await createServerClient()

    // Vérifier que le brouillon existe et appartient à l'utilisateur
    const { data: existingDraft, error: checkError } = await (supabase as any)
      .from('listing_drafts')
      .select('id, user_id, title, status')
      .eq('id', params.draftId)
      .single()

    if (checkError || !existingDraft) {
      return {
        success: false,
        message: 'Brouillon introuvable.',
        error: 'NOT_FOUND',
      }
    }

    if (existingDraft.user_id !== context.userId) {
      return {
        success: false,
        message: 'Vous ne pouvez pas supprimer ce brouillon.',
        error: 'NOT_OWNER',
      }
    }

    // Vérifier que c'est bien un brouillon (status = 'draft')
    if (existingDraft.status !== 'draft') {
      return {
        success: false,
        message: `Ce brouillon a le statut "${existingDraft.status}" et ne peut pas être supprimé directement.`,
        error: 'INVALID_STATUS',
      }
    }

    const draftTitle = existingDraft.title

    // Supprimer le brouillon
    const { error: deleteError } = await (supabase as any)
      .from('listing_drafts')
      .delete()
      .eq('id', params.draftId)
      .eq('user_id', context.userId) // Double protection

    if (deleteError) {
      console.error('[Tool:delete_draft_listing] Erreur delete:', deleteError)
      return {
        success: false,
        message: 'Erreur lors de la suppression du brouillon.',
        error: deleteError.message,
      }
    }

    return {
      success: true,
      message: `Brouillon "${draftTitle}" supprimé définitivement.`,
      deletedId: params.draftId,
      deletedTitle: draftTitle,
    }
  } catch (error) {
    console.error('[Tool:delete_draft_listing] Erreur inattendue:', error)
    return {
      success: false,
      message: 'Une erreur inattendue est survenue.',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    }
  }
}

// ============================================================================
// Handler: bulk_delete_drafts
// ============================================================================

/**
 * Supprime TOUS les brouillons de l'utilisateur
 * PROTECTION: Ne touche JAMAIS aux annonces publiées
 */
export async function handleBulkDeleteDrafts(
  params: BulkDeleteDraftsParams,
  context: ToolExecutionContext
): Promise<BulkDeleteDraftsResult> {
  // Vérifier l'authentification
  if (!context.isAuthenticated || !context.userId) {
    return {
      success: false,
      message: 'Vous devez être connecté pour supprimer vos brouillons.',
      deletedCount: 0,
      error: 'NOT_AUTHENTICATED',
    }
  }

  // Vérifier la confirmation
  if (!params.confirm) {
    return {
      success: false,
      message: 'La suppression en masse doit être confirmée (confirm: true) après confirmation explicite de l\'utilisateur.',
      deletedCount: 0,
      error: 'NOT_CONFIRMED',
    }
  }

  try {
    const supabase = await createServerClient()

    // D'abord, compter et lister les brouillons à supprimer
    const { data: draftsToDelete, error: countError } = await (supabase as any)
      .from('listing_drafts')
      .select('id, title')
      .eq('user_id', context.userId)
      .eq('status', 'draft')

    if (countError) {
      console.error('[Tool:bulk_delete_drafts] Erreur count:', countError)
      return {
        success: false,
        message: 'Erreur lors de la récupération des brouillons.',
        deletedCount: 0,
        error: countError.message,
      }
    }

    const count = draftsToDelete?.length ?? 0

    if (count === 0) {
      return {
        success: true,
        message: 'Aucun brouillon à supprimer.',
        deletedCount: 0,
      }
    }

    const draftIds = draftsToDelete.map((d: { id: string }) => d.id)

    // Supprimer tous les brouillons de l'utilisateur avec status = 'draft'
    const { error: deleteError } = await (supabase as any)
      .from('listing_drafts')
      .delete()
      .eq('user_id', context.userId)
      .eq('status', 'draft')

    if (deleteError) {
      console.error('[Tool:bulk_delete_drafts] Erreur delete:', deleteError)
      return {
        success: false,
        message: 'Erreur lors de la suppression des brouillons.',
        deletedCount: 0,
        error: deleteError.message,
      }
    }

    return {
      success: true,
      message: `${count} brouillon(s) supprimé(s) définitivement. Vos annonces publiées restent intactes.`,
      deletedCount: count,
      deletedIds: draftIds,
    }
  } catch (error) {
    console.error('[Tool:bulk_delete_drafts] Erreur inattendue:', error)
    return {
      success: false,
      message: 'Une erreur inattendue est survenue.',
      deletedCount: 0,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    }
  }
}

// ============================================================================
// Handler: activate_listing
// ============================================================================

/**
 * Active une annonce selon la source :
 * - source='draft' : publie un brouillon (listing_drafts -> listings, puis supprime le brouillon)
 * - source='listing' : réactive une annonce inactive (is_active = false -> true)
 * 
 * RÈGLES DE SÉCURITÉ :
 * - Aucune activation sans ID explicite
 * - Aucune activation par titre
 * - Aucune supposition de source
 * - Toute incohérence retourne une erreur
 */
export async function handleActivateListing(
  params: ActivateListingParams,
  context: ToolExecutionContext
): Promise<ActivateListingResult> {
  // Vérifier l'authentification
  if (!context.isAuthenticated || !context.userId) {
    return {
      success: false,
      message: 'Vous devez être connecté pour activer une annonce.',
      error: 'NOT_AUTHENTICATED',
    }
  }

  // Vérifier la confirmation
  if (!params.confirm) {
    return {
      success: false,
      message: 'L\'activation doit être confirmée (confirm: true).',
      error: 'NOT_CONFIRMED',
    }
  }

  try {
    const supabase = await createServerClient()

    // CAS 1 : Publication d'un brouillon (draft -> listing)
    if (params.source === 'draft') {
      // Vérifier que le brouillon existe et appartient à l'utilisateur
      const { data: draft, error: draftError } = await (supabase as any)
        .from('listing_drafts')
        .select('id, user_id, title, description, category, price, price_type, location, status')
        .eq('id', params.id)
        .single()

      if (draftError || !draft) {
        return {
          success: false,
          message: 'Brouillon introuvable.',
          error: 'DRAFT_NOT_FOUND',
        }
      }

      if (draft.user_id !== context.userId) {
        return {
          success: false,
          message: 'Vous ne pouvez pas activer ce brouillon.',
          error: 'NOT_OWNER',
        }
      }

      if (draft.status !== 'draft') {
        return {
          success: false,
          message: `Ce brouillon a le statut "${draft.status}" et ne peut pas être publié.`,
          error: 'INVALID_STATUS',
        }
      }

      // Créer l'annonce dans listings
      const { data: newListing, error: insertError } = await (supabase as any)
        .from('listings')
        .insert({
          user_id: context.userId,
          title: draft.title,
          description: draft.description,
          category: draft.category,
          price: draft.price,
          price_type: draft.price_type,
          location: draft.location,
          is_active: true,
        })
        .select('id, title, description, category, price, price_type, location, is_active, published_at')
        .single()

      if (insertError || !newListing) {
        console.error('[Tool:activate_listing] Insert error:', insertError)
        return {
          success: false,
          message: 'Erreur lors de la publication de l\'annonce.',
          error: insertError?.message || 'INSERT_ERROR',
        }
      }

      // Supprimer le brouillon d'origine
      const { error: deleteError } = await (supabase as any)
        .from('listing_drafts')
        .delete()
        .eq('id', params.id)
        .eq('user_id', context.userId)

      if (deleteError) {
        console.warn('[Tool:activate_listing] Draft cleanup failed:', deleteError)
        // On ne bloque pas car l'annonce a bien été créée
      }

      return {
        success: true,
        message: `Annonce "${newListing.title}" publiée avec succès ! Elle est maintenant visible par tous.`,
        source: 'draft',
        deletedDraftId: params.id,
        listing: {
          id: newListing.id,
          title: newListing.title,
          description: newListing.description,
          category: newListing.category as ListingCategory,
          price: newListing.price ?? undefined,
          priceType: newListing.price_type as PriceType,
          location: newListing.location ?? undefined,
          isActive: newListing.is_active,
          publishedAt: newListing.published_at,
        },
      }
    }

    // CAS 2 : Réactivation d'une annonce existante (listing inactive -> active)
    if (params.source === 'listing') {
      // Vérifier que l'annonce existe et appartient à l'utilisateur
      const { data: listing, error: listingError } = await (supabase as any)
        .from('listings')
        .select('id, user_id, title, description, category, price, price_type, location, is_active')
        .eq('id', params.id)
        .single()

      if (listingError || !listing) {
        return {
          success: false,
          message: 'Annonce introuvable.',
          error: 'LISTING_NOT_FOUND',
        }
      }

      if (listing.user_id !== context.userId) {
        return {
          success: false,
          message: 'Vous ne pouvez pas activer cette annonce.',
          error: 'NOT_OWNER',
        }
      }

      // Vérifier si déjà active
      if (listing.is_active) {
        return {
          success: false,
          message: `L'annonce "${listing.title}" est déjà active.`,
          error: 'ALREADY_ACTIVE',
        }
      }

      // Réactiver l'annonce
      const { data: updatedListing, error: updateError } = await (supabase as any)
        .from('listings')
        .update({ is_active: true })
        .eq('id', params.id)
        .eq('user_id', context.userId)
        .select('id, title, description, category, price, price_type, location, is_active, published_at')
        .single()

      if (updateError || !updatedListing) {
        console.error('[Tool:activate_listing] Update error:', updateError)
        return {
          success: false,
          message: 'Erreur lors de la réactivation de l\'annonce.',
          error: updateError?.message || 'UPDATE_ERROR',
        }
      }

      return {
        success: true,
        message: `Annonce "${updatedListing.title}" réactivée avec succès ! Elle est à nouveau visible.`,
        source: 'listing',
        listing: {
          id: updatedListing.id,
          title: updatedListing.title,
          description: updatedListing.description,
          category: updatedListing.category as ListingCategory,
          price: updatedListing.price ?? undefined,
          priceType: updatedListing.price_type as PriceType,
          location: updatedListing.location ?? undefined,
          isActive: updatedListing.is_active,
          publishedAt: updatedListing.published_at,
        },
      }
    }

    // Source invalide (ne devrait jamais arriver grâce au schema Zod)
    return {
      success: false,
      message: 'Source invalide. Utilisez "draft" ou "listing".',
      error: 'INVALID_SOURCE',
    }
  } catch (error) {
    console.error('[Tool:activate_listing] Unexpected error:', error)
    return {
      success: false,
      message: 'Une erreur inattendue est survenue.',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    }
  }
}

// ============================================================================
// Handler: generate_listing_image
// ============================================================================

/**
 * Génère une image pour une annonce via DALL-E 3
 */
export async function handleGenerateListingImage(
  params: GenerateListingImageParams,
  context: ToolExecutionContext
): Promise<GenerateListingImageResult> {
  // Vérifier l'authentification
  if (!context.isAuthenticated || !context.userId) {
    return {
      success: false,
      message: 'Vous devez être connecté pour générer une image.',
      error: 'NOT_AUTHENTICATED',
    }
  }

  // Vérifier que l'API OpenAI est configurée
  if (!process.env.OPENAI_API_KEY) {
    return {
      success: false,
      message: 'La génération d\'images n\'est pas disponible.',
      error: 'OPENAI_NOT_CONFIGURED',
    }
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Construire le prompt selon le style
    const stylePrompts: Record<ImageStyle, string> = {
      photo: 'Professional product photography, high quality, clean white background, studio lighting, detailed and realistic',
      illustration: 'Modern flat illustration style, vibrant colors, clean design, vector art aesthetic',
      minimal: 'Minimalist design, simple shapes, limited color palette, clean and elegant, negative space',
    }

    const style = params.style || 'photo'
    const stylePrompt = stylePrompts[style]

    // Construire le prompt complet
    const prompt = `${stylePrompt}. 
Product: ${params.title}.
${params.description ? `Details: ${params.description}` : ''}
The image should be suitable for an e-commerce listing or marketplace.
Do not include any text, logos, or watermarks in the image.`

    console.log('[Tool:generate_listing_image] Generating image with prompt:', prompt.substring(0, 100) + '...')

    // Appeler DALL-E 3
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'url',
    })

    const imageUrl = response.data?.[0]?.url

    if (!imageUrl) {
      return {
        success: false,
        message: 'Aucune image n\'a été générée.',
        error: 'NO_IMAGE_GENERATED',
      }
    }

    // Télécharger l'image et l'uploader vers Supabase Storage
    const supabase = await createServerClient()
    
    // Télécharger l'image depuis l'URL DALL-E
    const imageResponse = await fetch(imageUrl)
    const imageBlob = await imageResponse.blob()
    const imageBuffer = Buffer.from(await imageBlob.arrayBuffer())
    
    // Générer un nom de fichier unique
    const fileName = `${context.userId}/${Date.now()}-generated.png`
    
    // Uploader vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('listing-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('[Tool:generate_listing_image] Upload error:', uploadError)
      // Retourner l'URL temporaire de DALL-E si l'upload échoue
      return {
        success: true,
        message: 'Image générée ! (stockage temporaire)',
        image: {
          id: `temp-${Date.now()}`,
          url: imageUrl,
          width: 1024,
          height: 1024,
          isGenerated: true,
        },
      }
    }

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('listing-images')
      .getPublicUrl(uploadData.path)

    // Enregistrer dans la table listing_images si un draftId est fourni
    let imageId = `gen-${Date.now()}`
    if (params.draftId) {
      const { data: imageRecord, error: insertError } = await (supabase as any)
        .from('listing_images')
        .insert({
          draft_id: params.draftId,
          url: publicUrl,
          position: 0,
          is_generated: true,
          generation_prompt: prompt,
          width: 1024,
          height: 1024,
          mime_type: 'image/png',
        })
        .select('id')
        .single()

      if (!insertError && imageRecord) {
        imageId = imageRecord.id
      }
    }

    return {
      success: true,
      message: `Image générée avec succès pour "${params.title}" !`,
      image: {
        id: imageId,
        url: publicUrl,
        width: 1024,
        height: 1024,
        isGenerated: true,
      },
    }
  } catch (error) {
    console.error('[Tool:generate_listing_image] Error:', error)
    
    // Gérer les erreurs spécifiques de l'API OpenAI
    if (error instanceof OpenAI.APIError) {
      if (error.status === 400) {
        return {
          success: false,
          message: 'La description contient du contenu non autorisé.',
          error: 'CONTENT_POLICY',
        }
      }
      if (error.status === 429) {
        return {
          success: false,
          message: 'Trop de demandes. Réessayez dans quelques instants.',
          error: 'RATE_LIMITED',
        }
      }
    }

    return {
      success: false,
      message: 'Erreur lors de la génération de l\'image.',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    }
  }
}

// ============================================================================
// Exécuteur principal des outils
// ============================================================================

export type ToolName = 
  | 'create_listing_draft' 
  | 'search_products' 
  | 'suggest_referral_message' 
  | 'send_collaboration_proposal'
  | 'get_my_listings'
  | 'search_user_listings'
  | 'update_listing'
  | 'delete_listing'
  | 'delete_draft_listing'
  | 'bulk_delete_drafts'
  | 'activate_listing'
  | 'generate_listing_image'

/**
 * Exécute un outil et retourne son résultat
 */
export async function executeToolHandler(
  toolName: ToolName,
  args: unknown,
  context: ToolExecutionContext
): Promise<
  | CreateListingDraftResult 
  | SearchProductsResult 
  | SuggestReferralMessageResult 
  | SendCollaborationProposalResult
  | GetMyListingsResult
  | UpdateListingResult
  | DeleteListingResult
  | DeleteDraftListingResult
  | BulkDeleteDraftsResult
  | ActivateListingResult
  | GenerateListingImageResult
> {
  switch (toolName) {
    case 'create_listing_draft':
      return handleCreateListingDraft(args as CreateListingDraftParams, context)
    
    case 'search_products':
      return handleSearchProducts(args as SearchProductsParams, context)
    
    case 'suggest_referral_message':
      return handleSuggestReferralMessage(args as SuggestReferralMessageParams, context)
    
    case 'send_collaboration_proposal':
      return handleSendCollaborationProposal(args as SendCollaborationProposalParams, context)
    
    case 'get_my_listings':
      return handleGetMyListings(args as GetMyListingsParams, context)
    
    case 'search_user_listings':
      return handleSearchUserListings(args as SearchUserListingsParams, context)
    
    case 'update_listing':
      return handleUpdateListing(args as UpdateListingParams, context)
    
    case 'delete_listing':
      return handleDeleteListing(args as DeleteListingParams, context)
    
    case 'delete_draft_listing':
      return handleDeleteDraftListing(args as DeleteDraftListingParams, context)
    
    case 'bulk_delete_drafts':
      return handleBulkDeleteDrafts(args as BulkDeleteDraftsParams, context)
    
    case 'activate_listing':
      return handleActivateListing(args as ActivateListingParams, context)
    
    case 'generate_listing_image':
      return handleGenerateListingImage(args as GenerateListingImageParams, context)
    
    default:
      return {
        success: false,
        message: `Outil inconnu: ${toolName}`,
        error: 'UNKNOWN_TOOL',
      } as CreateListingDraftResult
  }
}
