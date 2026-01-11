import type { Message } from '@/lib/supabase/types'
import type { ListingSummaryCardData } from '@/components/agent/chat/ListingSummaryCard'

/**
 * Types partagés pour les composants Agent
 */

export interface LocalMessage extends Omit<Message, 'id' | 'created_at' | 'tool_calls' | 'tool_call_id' | 'tool_name'> {
  id: string
  created_at: string
  status?: 'sending' | 'streaming' | 'sent' | 'error'
  tempId?: string
  tool_calls?: unknown[] | null
  tool_call_id?: string | null
  tool_name?: string | null
  /** Payload UI optionnel pour rendre des cartes/éléments enrichis dans le chat */
  ui?: {
    type: 'listing_summary'
    data: ListingSummaryCardData
  }
}

export interface ThinkingState {
  isThinking: boolean
  steps: string[]
  currentStep: string
}

export type ThinkingSectionCategory = 'comprehension' | 'plan' | 'execution'

export interface ThinkingSectionItem {
  category: ThinkingSectionCategory
  content: string
  items?: string[]
  status?: 'pending' | 'in_progress' | 'completed'
  timestamp: number
}

export interface ThinkingSectionsState {
  isActive: boolean
  isExpanded: boolean
  startTime: number | null
  sections: ThinkingSectionItem[]
}

export interface CreditInfo {
  total: number
  canClaim: boolean
  free?: number
  paid?: number
}

export interface Attachment {
  id: string
  file: File
  preview: string
  type: 'image' | 'document'
  uploading?: boolean
  url?: string
}

