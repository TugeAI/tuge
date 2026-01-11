/**
 * Context Builder - Reconstruction du contexte de conversation pour l'IA
 * 
 * Ce module centralise la logique de reconstruction du prompt complet
 * incluant l'historique des messages ET les tool calls pour garantir
 * la continuité du contexte lors de la reprise d'une conversation.
 * 
 * Format OpenAI attendu pour les conversations avec tools :
 * 1. {"role": "system", "content": "..."}
 * 2. {"role": "user", "content": "Crée une annonce..."}
 * 3. {"role": "assistant", "tool_calls": [...]}  // Demande d'outil
 * 4. {"role": "tool", "tool_call_id": "...", "content": "..."}  // Résultat
 * 5. {"role": "assistant", "content": "J'ai créé..."}  // Réponse finale
 */

import type { ToolCallData, ToolCallResult } from '@/lib/supabase/types'

// ============================================================================
// Types pour les messages OpenAI
// ============================================================================

/**
 * Message système pour OpenAI
 */
export interface SystemMessage {
  role: 'system'
  content: string
}

/**
 * Message utilisateur pour OpenAI
 */
export interface UserMessage {
  role: 'user'
  content: string
}

/**
 * Message assistant pour OpenAI (peut contenir des tool_calls)
 * Note: Vercel AI SDK v6 requiert content comme string, pas null
 */
export interface AssistantMessage {
  role: 'assistant'
  content: string
  tool_calls?: ToolCallData[]
}

/**
 * Message de résultat d'outil pour OpenAI
 */
export interface ToolMessage {
  role: 'tool'
  tool_call_id: string
  content: string
}

/**
 * Union de tous les types de messages OpenAI
 */
export type OpenAIMessage = SystemMessage | UserMessage | AssistantMessage | ToolMessage

// ============================================================================
// Types pour les messages de la DB
// ============================================================================

/**
 * Message tel qu'il est stocké en base de données
 */
export interface DBMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  tool_calls?: ToolCallData[] | null
  tool_call_id?: string | null
  tool_name?: string | null
  created_at: string
}

/**
 * Message simplifié pour l'historique (sans tool calls)
 * Utilisé pour la rétrocompatibilité avec l'ancien format
 */
export interface SimpleMessage {
  role: 'user' | 'assistant'
  content: string
}

// ============================================================================
// Fonctions de construction du contexte
// ============================================================================

/**
 * Construit le tableau de messages complet pour OpenAI
 * 
 * Cette fonction centrale reconstruit le contexte complet d'une conversation
 * en incluant :
 * - Le message système (instructions de l'agent)
 * - L'historique complet des messages (user, assistant, tool)
 * - Les tool calls et leurs résultats
 * - Le message utilisateur actuel
 * 
 * @param systemPrompt - Le prompt système de l'agent
 * @param historyMessages - Les messages historiques depuis la DB
 * @param currentMessage - Le nouveau message de l'utilisateur
 * @returns Tableau de messages formaté pour l'API OpenAI
 */
export function buildConversationContext(
  systemPrompt: string,
  historyMessages: DBMessage[],
  currentMessage: string
): OpenAIMessage[] {
  const messages: OpenAIMessage[] = [
    { role: 'system', content: systemPrompt }
  ]

  // Parcourir l'historique et reconstruire les messages
  for (const msg of historyMessages) {
    if (msg.role === 'user') {
      // Message utilisateur simple
      messages.push({
        role: 'user',
        content: msg.content
      })
    } else if (msg.role === 'assistant') {
      // Message assistant - peut contenir des tool_calls
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        // Assistant avec tool calls (demande d'exécution d'outils)
        // IMPORTANT: Vercel AI SDK v6 requiert content comme string, pas null
        messages.push({
          role: 'assistant',
          content: msg.content || '', // String vide au lieu de null
          tool_calls: msg.tool_calls
        })
      } else if (msg.content && msg.content.trim() !== '') {
        // Assistant sans tool calls (réponse textuelle simple)
        // On ignore les messages vides
        messages.push({
          role: 'assistant',
          content: msg.content
        })
      }
    } else if (msg.role === 'tool') {
      // Résultat d'un outil
      if (msg.tool_call_id) {
        messages.push({
          role: 'tool',
          tool_call_id: msg.tool_call_id,
          content: msg.content
        })
      }
    }
  }

  // Ajouter le nouveau message utilisateur
  messages.push({
    role: 'user',
    content: currentMessage
  })

  return messages
}

/**
 * Construit le contexte à partir de messages simples (rétrocompatibilité)
 * 
 * Utilisé pour les conversations anciennes qui n'ont pas de tool_calls stockés.
 * Cette fonction est maintenue pour la rétrocompatibilité.
 * 
 * @param systemPrompt - Le prompt système de l'agent
 * @param history - L'historique simple (role + content uniquement)
 * @param currentMessage - Le nouveau message de l'utilisateur
 * @returns Tableau de messages formaté pour l'API OpenAI
 */
export function buildSimpleContext(
  systemPrompt: string,
  history: SimpleMessage[],
  currentMessage: string
): OpenAIMessage[] {
  const messages: OpenAIMessage[] = [
    { role: 'system', content: systemPrompt }
  ]

  for (const msg of history) {
    messages.push({
      role: msg.role,
      content: msg.content
    })
  }

  messages.push({
    role: 'user',
    content: currentMessage
  })

  return messages
}

/**
 * Détermine si un historique contient des tool calls
 * 
 * Utile pour savoir si on doit utiliser buildConversationContext
 * ou buildSimpleContext.
 * 
 * @param messages - Les messages de l'historique
 * @returns true si au moins un message contient des tool calls
 */
export function hasToolCalls(messages: DBMessage[]): boolean {
  return messages.some(msg => 
    (msg.tool_calls && msg.tool_calls.length > 0) || 
    msg.role === 'tool'
  )
}

/**
 * Convertit les messages DB en messages simples (pour rétrocompatibilité)
 * 
 * Filtre les messages 'tool' et extrait uniquement role + content
 * des messages user et assistant.
 * 
 * @param dbMessages - Messages depuis la DB
 * @returns Messages simples pour l'ancien format
 */
export function toSimpleMessages(dbMessages: DBMessage[]): SimpleMessage[] {
  return dbMessages
    .filter(msg => msg.role !== 'tool')
    .filter(msg => msg.content && msg.content.trim() !== '') // Ignorer les messages vides
    .map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }))
}

/**
 * Crée un message tool à partir d'un résultat de tool call
 * 
 * @param toolCallId - L'ID du tool call auquel ce résultat répond
 * @param toolName - Le nom de l'outil exécuté
 * @param result - Le résultat de l'exécution
 * @returns Un objet prêt à être inséré en DB
 */
export function createToolMessage(
  conversationId: string,
  toolCallId: string,
  toolName: string,
  result: ToolCallResult['result']
): Omit<DBMessage, 'id' | 'created_at'> {
  return {
    conversation_id: conversationId,
    role: 'tool',
    content: JSON.stringify(result),
    tool_calls: null,
    tool_call_id: toolCallId,
    tool_name: toolName
  }
}

/**
 * Crée un message assistant avec tool calls
 * 
 * @param conversationId - L'ID de la conversation
 * @param toolCalls - Les tool calls demandés par l'assistant
 * @returns Un objet prêt à être inséré en DB
 */
export function createAssistantToolCallMessage(
  conversationId: string,
  toolCalls: ToolCallData[]
): Omit<DBMessage, 'id' | 'created_at'> {
  return {
    conversation_id: conversationId,
    role: 'assistant',
    content: '', // Vide car ce sont les tool calls qui comptent
    tool_calls: toolCalls,
    tool_call_id: null,
    tool_name: null
  }
}

/**
 * Crée un message assistant avec réponse textuelle
 * 
 * @param conversationId - L'ID de la conversation
 * @param content - Le contenu textuel de la réponse
 * @param toolCalls - Optionnel: tool calls associés à cette réponse
 * @returns Un objet prêt à être inséré en DB
 */
export function createAssistantMessage(
  conversationId: string,
  content: string,
  toolCalls?: ToolCallData[] | null
): Omit<DBMessage, 'id' | 'created_at'> {
  return {
    conversation_id: conversationId,
    role: 'assistant',
    content,
    tool_calls: toolCalls || null,
    tool_call_id: null,
    tool_name: null
  }
}

// ============================================================================
// Exports
// ============================================================================

export type {
  ToolCallData,
  ToolCallResult
}

