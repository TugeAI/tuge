/**
 * Types centralisés pour l'agent
 */

export interface Toast {
  id: string
  message: string
  type: 'error' | 'success'
  retry?: () => void
}

export interface VisitorProfile {
  id: string
  session_id: string
  first_name: string | null
  intention: string
  message_count: number
}

export interface ExistingConversation {
  id: string
  messages: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
  }>
}


