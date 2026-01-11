/**
 * Types générés pour la base de données Supabase
 * 
 * Ces types correspondent au schéma défini dans les migrations SQL.
 * Dans un projet réel, ces types seraient générés automatiquement avec :
 * npx supabase gen types typescript --project-id <your-project-id> > src/lib/supabase/types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/**
 * Rôles utilisateur disponibles
 */
export type UserRole = 'individual' | 'professional'

/**
 * Sources d'inscription
 */
export type RegistrationSource = 'ai' | 'web'

/**
 * Statuts des actions loguées
 */
export type ActionStatus = 'initiated' | 'pending' | 'completed' | 'failed'

/**
 * Types de transactions de crédits
 */
export type CreditTransactionType = 'daily_claim' | 'purchase' | 'consumption' | 'refund' | 'adjustment'

/**
 * Types de crédits
 */
export type CreditType = 'free' | 'paid'

/**
 * Statuts d'achat
 */
export type PurchaseStatus = 'pending' | 'completed' | 'failed' | 'refunded'

/**
 * Types de déclencheurs de suggestions
 */
export type SuggestionTrigger = 'page_entry' | 'draft_not_published' | 'search_no_results' | 'no_referral_activity'

/**
 * Niveaux de priorité des suggestions
 */
export type SuggestionPriority = 'low' | 'medium' | 'high'

/**
 * Genres disponibles pour l'agent IA personnalisé
 */
export type AgentGender = 'masculin' | 'feminin' | 'neutre'

/**
 * Tons de communication pour l'agent IA personnalisé
 */
export type AgentTone = 'professionnel' | 'amical' | 'formel' | 'decontracte'

/**
 * Types de propositions inter-agents
 */
export type ProposalType = 'service_proposal' | 'collaboration_request' | 'info_share'

/**
 * Statuts des propositions inter-agents
 */
export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'expired'

/**
 * Rôle des messages (inclut 'tool' pour les résultats d'outils)
 */
export type MessageRole = 'user' | 'assistant' | 'tool'

/**
 * Catégories d'annonces
 */
export type ListingCategory = 'service' | 'product' | 'job' | 'other'

/**
 * Types de prix
 */
export type ListingPriceType = 'fixed' | 'hourly' | 'negotiable' | 'free'

/**
 * Statuts de brouillon d'annonce
 */
export type ListingDraftStatus = 'draft' | 'pending_review' | 'published' | 'rejected'

/**
 * Structure d'un tool call (format OpenAI)
 * Représente un appel d'outil demandé par l'assistant
 */
export interface ToolCallData {
  /** ID unique du tool call (généré par OpenAI) */
  id: string
  /** Type du tool call (toujours 'function' pour l'instant) */
  type: 'function'
  /** Détails de la fonction appelée */
  function: {
    /** Nom de l'outil (ex: 'create_listing_draft') */
    name: string
    /** Arguments JSON stringifiés */
    arguments: string
  }
}

/**
 * Résultat d'un tool call avec ses métadonnées
 * Utilisé pour stocker le résultat complet d'un outil
 */
export interface ToolCallResult {
  /** Nom de l'outil exécuté */
  name: string
  /** Arguments passés à l'outil */
  args: unknown
  /** Résultat de l'exécution */
  result: {
    success: boolean
    [key: string]: unknown
  }
}

export interface Database {
  public: {
    Tables: {
      /**
       * Pré-inscriptions en attente de validation OTP
       */
      pending_registrations: {
        Row: {
          id: string
          email: string
          role: string
          referrer_code: string | null
          consent: boolean
          source: string
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          email: string
          role: string
          referrer_code?: string | null
          consent: boolean
          source: string
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: string
          referrer_code?: string | null
          consent?: boolean
          source?: string
          created_at?: string
          expires_at?: string
        }
        Relationships: []
      }
      
      /**
       * Profils utilisateurs
       */
      profiles: {
        Row: {
          id: string
          role: string
          referrer_code: string | null
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: string
          referrer_code?: string | null
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: string
          referrer_code?: string | null
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      
      /**
       * Codes de parrainage
       */
      referrer_codes: {
        Row: {
          id: string
          user_id: string
          code: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          code: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          code?: string
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      
      /**
       * Relations de parrainage (immutables)
       */
      referrals: {
        Row: {
          id: string
          user_id: string
          referrer_id: string
          level: number
          source: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          referrer_id: string
          level?: number
          source: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          referrer_id?: string
          level?: number
          source?: string
          created_at?: string
        }
        Relationships: []
      }
      
      /**
       * Journal des actions (traçabilité)
       */
      ai_actions_log: {
        Row: {
          id: string
          action_type: string
          target_email: string | null
          target_user_id: string | null
          referrer_id: string | null
          status: string
          metadata: Json
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          action_type: string
          target_email?: string | null
          target_user_id?: string | null
          referrer_id?: string | null
          status: string
          metadata?: Json
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          action_type?: string
          target_email?: string | null
          target_user_id?: string | null
          referrer_id?: string | null
          status?: string
          metadata?: Json
          error_message?: string | null
          created_at?: string
        }
        Relationships: []
      }
      
      /**
       * Conversations avec l'agent IA
       */
      conversations: {
        Row: {
          id: string
          user_id: string | null
          session_id: string | null
          title: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          title?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          title?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      
      /**
       * Messages des conversations avec l'agent IA
       * Inclut le support des tool calls pour la restauration du contexte
       */
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant' | 'tool'
          content: string
          tool_calls: ToolCallData[] | null
          tool_call_id: string | null
          tool_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant' | 'tool'
          content: string
          tool_calls?: ToolCallData[] | null
          tool_call_id?: string | null
          tool_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: 'user' | 'assistant' | 'tool'
          content?: string
          tool_calls?: ToolCallData[] | null
          tool_call_id?: string | null
          tool_name?: string | null
          created_at?: string
        }
        Relationships: [{
          foreignKeyName: "messages_conversation_id_fkey"
          columns: ["conversation_id"]
          referencedRelation: "conversations"
          referencedColumns: ["id"]
        }]
      }

      // ============================================================================
      // TABLES DU SYSTÈME DE CRÉDITS (migration 004)
      // ============================================================================

      /**
       * Portefeuille de crédits par utilisateur
       */
      credit_wallets: {
        Row: {
          user_id: string
          paid_credits: number
          daily_free_credits: number
          daily_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          paid_credits?: number
          daily_free_credits?: number
          daily_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          paid_credits?: number
          daily_free_credits?: number
          daily_date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      /**
       * Historique des transactions de crédits
       */
      credit_ledger: {
        Row: {
          id: string
          user_id: string
          type: CreditTransactionType
          amount: number
          credit_type: CreditType
          reference_id: string | null
          reference_type: string | null
          metadata: Json
          balance_after: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: CreditTransactionType
          amount: number
          credit_type: CreditType
          reference_id?: string | null
          reference_type?: string | null
          metadata?: Json
          balance_after: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: CreditTransactionType
          amount?: number
          credit_type?: CreditType
          reference_id?: string | null
          reference_type?: string | null
          metadata?: Json
          balance_after?: number
          created_at?: string
        }
        Relationships: []
      }

      /**
       * Achats de crédits via Stripe
       */
      purchases: {
        Row: {
          id: string
          user_id: string
          stripe_payment_intent_id: string
          stripe_checkout_session_id: string | null
          amount_eur: number
          credits: number
          pack_id: string | null
          status: PurchaseStatus
          ai_cost_estimated: number | null
          variable_cost: number | null
          platform_cost_allocated: number | null
          benefit: number | null
          mlm_pool: number | null
          mlm_distributed: boolean
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          stripe_payment_intent_id: string
          stripe_checkout_session_id?: string | null
          amount_eur: number
          credits: number
          pack_id?: string | null
          status?: PurchaseStatus
          ai_cost_estimated?: number | null
          variable_cost?: number | null
          platform_cost_allocated?: number | null
          benefit?: number | null
          mlm_pool?: number | null
          mlm_distributed?: boolean
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          stripe_payment_intent_id?: string
          stripe_checkout_session_id?: string | null
          amount_eur?: number
          credits?: number
          pack_id?: string | null
          status?: PurchaseStatus
          ai_cost_estimated?: number | null
          variable_cost?: number | null
          platform_cost_allocated?: number | null
          benefit?: number | null
          mlm_pool?: number | null
          mlm_distributed?: boolean
          created_at?: string
          completed_at?: string | null
        }
        Relationships: []
      }

      /**
       * Commissions MLM distribuées
       */
      mlm_commissions: {
        Row: {
          id: string
          purchase_id: string
          to_user_id: string
          level: number
          amount_eur: number
          created_at: string
        }
        Insert: {
          id?: string
          purchase_id: string
          to_user_id: string
          level: number
          amount_eur: number
          created_at?: string
        }
        Update: {
          id?: string
          purchase_id?: string
          to_user_id?: string
          level?: number
          amount_eur?: number
          created_at?: string
        }
        Relationships: [{
          foreignKeyName: "mlm_commissions_purchase_id_fkey"
          columns: ["purchase_id"]
          referencedRelation: "purchases"
          referencedColumns: ["id"]
        }]
      }

      /**
       * Solde MLM retirable par utilisateur
       */
      mlm_balances: {
        Row: {
          user_id: string
          balance_eur: number
          total_earned_eur: number
          total_withdrawn_eur: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          balance_eur?: number
          total_earned_eur?: number
          total_withdrawn_eur?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          balance_eur?: number
          total_earned_eur?: number
          total_withdrawn_eur?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      /**
       * Coûts mensuels de la plateforme
       */
      platform_costs: {
        Row: {
          month: string
          supabase_cost: number
          resend_cost: number
          other_costs: number
          active_users: number
          cost_per_user: number
          created_at: string
          updated_at: string
        }
        Insert: {
          month: string
          supabase_cost?: number
          resend_cost?: number
          other_costs?: number
          active_users?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          month?: string
          supabase_cost?: number
          resend_cost?: number
          other_costs?: number
          active_users?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      /**
       * Revenus conservés par la plateforme
       */
      platform_revenue: {
        Row: {
          id: string
          purchase_id: string
          gross_revenue: number
          total_costs: number
          mlm_distributed: number
          retained_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          purchase_id: string
          gross_revenue: number
          total_costs: number
          mlm_distributed?: number
          retained_amount: number
          created_at?: string
        }
        Update: {
          id?: string
          purchase_id?: string
          gross_revenue?: number
          total_costs?: number
          mlm_distributed?: number
          retained_amount?: number
          created_at?: string
        }
        Relationships: [{
          foreignKeyName: "platform_revenue_purchase_id_fkey"
          columns: ["purchase_id"]
          referencedRelation: "purchases"
          referencedColumns: ["id"]
        }]
      }

      /**
       * Actions IA avec tracking des crédits
       */
      ai_actions: {
        Row: {
          id: string
          user_id: string
          action_type: string
          credits_used: number
          credit_type: CreditType
          conversation_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action_type?: string
          credits_used?: number
          credit_type: CreditType
          conversation_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action_type?: string
          credits_used?: number
          credit_type?: CreditType
          conversation_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: [{
          foreignKeyName: "ai_actions_conversation_id_fkey"
          columns: ["conversation_id"]
          referencedRelation: "conversations"
          referencedColumns: ["id"]
        }]
      }

      /**
       * Suggestions proactives de l'agent IA
       */
      agent_suggestions: {
        Row: {
          id: string
          user_id: string
          trigger_type: SuggestionTrigger
          title: string
          message: string
          action_prompt: string
          priority: SuggestionPriority
          metadata: Json
          is_active: boolean
          dismissed_at: string | null
          clicked_at: string | null
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          user_id: string
          trigger_type: SuggestionTrigger
          title: string
          message: string
          action_prompt: string
          priority?: SuggestionPriority
          metadata?: Json
          is_active?: boolean
          dismissed_at?: string | null
          clicked_at?: string | null
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          trigger_type?: SuggestionTrigger
          title?: string
          message?: string
          action_prompt?: string
          priority?: SuggestionPriority
          metadata?: Json
          is_active?: boolean
          dismissed_at?: string | null
          clicked_at?: string | null
          created_at?: string
          expires_at?: string
        }
        Relationships: []
      }

      /**
       * Agents IA personnalisés par utilisateur
       */
      user_agents: {
        Row: {
          user_id: string
          name: string
          gender: AgentGender
          tone: AgentTone
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          name?: string
          gender?: AgentGender
          tone?: AgentTone
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          name?: string
          gender?: AgentGender
          tone?: AgentTone
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      /**
       * Propositions de collaboration inter-agents
       */
      agent_proposals: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          type: ProposalType
          payload: Json
          message: string | null
          dedupe_key: string
          status: ProposalStatus
          created_at: string
          expires_at: string
          responded_at: string | null
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          type: ProposalType
          payload?: Json
          message?: string | null
          dedupe_key: string
          status?: ProposalStatus
          created_at?: string
          expires_at?: string
          responded_at?: string | null
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          type?: ProposalType
          payload?: Json
          message?: string | null
          dedupe_key?: string
          status?: ProposalStatus
          created_at?: string
          expires_at?: string
          responded_at?: string | null
        }
        Relationships: []
      }

      /**
       * Empreintes d'appareils pour la protection anti-doublons
       */
      device_fingerprints: {
        Row: {
          id: string
          user_id: string | null
          email: string
          ip_address: string
          fingerprint_id: string
          user_agent: string | null
          metadata: Json
          is_suspicious: boolean
          suspicion_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          email: string
          ip_address: string
          fingerprint_id: string
          user_agent?: string | null
          metadata?: Json
          is_suspicious?: boolean
          suspicion_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          email?: string
          ip_address?: string
          fingerprint_id?: string
          user_agent?: string | null
          metadata?: Json
          is_suspicious?: boolean
          suspicion_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      /**
       * Logging des décisions de routage inter-agents
       */
      agent_routing_log: {
        Row: {
          id: string
          conversation_id: string | null
          user_id: string | null
          from_agent: string
          to_agent: string
          intent: string | null
          decision: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id?: string | null
          user_id?: string | null
          from_agent: string
          to_agent: string
          intent?: string | null
          decision?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string | null
          user_id?: string | null
          from_agent?: string
          to_agent?: string
          intent?: string | null
          decision?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }

      /**
       * Brouillons d'annonces créés par l'agent IA
       */
      listing_drafts: {
        Row: {
          id: string
          user_id: string
          conversation_id: string | null
          title: string
          description: string
          category: ListingCategory
          price: number | null
          price_type: ListingPriceType
          location: string | null
          status: ListingDraftStatus
          agent_metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          conversation_id?: string | null
          title: string
          description: string
          category?: ListingCategory
          price?: number | null
          price_type?: ListingPriceType
          location?: string | null
          status?: ListingDraftStatus
          agent_metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          conversation_id?: string | null
          title?: string
          description?: string
          category?: ListingCategory
          price?: number | null
          price_type?: ListingPriceType
          location?: string | null
          status?: ListingDraftStatus
          agent_metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      /**
       * Annonces publiées
       */
      listings: {
        Row: {
          id: string
          user_id: string
          draft_id: string | null
          title: string
          description: string
          category: ListingCategory
          price: number | null
          price_type: ListingPriceType
          location: string | null
          is_active: boolean
          view_count: number
          contact_count: number
          created_at: string
          updated_at: string
          published_at: string
        }
        Insert: {
          id?: string
          user_id: string
          draft_id?: string | null
          title: string
          description: string
          category?: ListingCategory
          price?: number | null
          price_type?: ListingPriceType
          location?: string | null
          is_active?: boolean
          view_count?: number
          contact_count?: number
          created_at?: string
          updated_at?: string
          published_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          draft_id?: string | null
          title?: string
          description?: string
          category?: ListingCategory
          price?: number | null
          price_type?: ListingPriceType
          location?: string | null
          is_active?: boolean
          view_count?: number
          contact_count?: number
          created_at?: string
          updated_at?: string
          published_at?: string
        }
        Relationships: []
      }
    }
    
    Views: {
      [_ in never]: never
    }
    
    Functions: {
      cleanup_expired_pending_registrations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      claim_anonymous_conversations: {
        Args: {
          p_session_id: string
          p_user_id: string
        }
        Returns: number
      }
      claim_daily_free_credits: {
        Args: {
          p_user_id: string
        }
        Returns: {
          success: boolean
          daily_free_credits: number
          paid_credits: number
          message: string
        }[]
      }
      consume_credit_atomic: {
        Args: {
          p_user_id: string
          p_amount?: number
          p_action_type?: string
          p_conversation_id?: string | null
          p_metadata?: Json
        }
        Returns: {
          success: boolean
          credit_type_used: string | null
          daily_free_credits: number
          paid_credits: number
          message: string
        }[]
      }
      create_purchase: {
        Args: {
          p_user_id: string
          p_stripe_pi_id: string
          p_stripe_session_id: string
          p_amount_eur: number
          p_credits: number
          p_pack_id?: string | null
        }
        Returns: {
          success: boolean
          purchase_id: string
          message: string
        }[]
      }
      confirm_purchase_and_distribute_mlm: {
        Args: {
          p_stripe_pi_id: string
        }
        Returns: {
          success: boolean
          purchase_id: string
          benefit: number
          mlm_distributed: number
          levels_paid: number
          message: string
        }[]
      }
      get_user_wallet: {
        Args: {
          p_user_id: string
        }
        Returns: {
          paid_credits: number
          daily_free_credits: number
          total_credits: number
          daily_date: string
          can_claim_today: boolean
        }[]
      }
      get_active_suggestion: {
        Args: {
          p_user_id: string
        }
        Returns: {
          id: string
          trigger_type: SuggestionTrigger
          title: string
          message: string
          action_prompt: string
          priority: SuggestionPriority
          metadata: Json
          created_at: string
        }[]
      }
      can_create_suggestion: {
        Args: {
          p_user_id: string
          p_trigger_type: SuggestionTrigger
        }
        Returns: {
          can_create: boolean
          reason: string | null
        }[]
      }
      create_suggestion: {
        Args: {
          p_user_id: string
          p_trigger_type: SuggestionTrigger
          p_title: string
          p_message: string
          p_action_prompt: string
          p_priority?: SuggestionPriority
          p_metadata?: Json
        }
        Returns: {
          success: boolean
          suggestion_id: string | null
          message: string
        }[]
      }
      dismiss_suggestion: {
        Args: {
          p_suggestion_id: string
        }
        Returns: boolean
      }
      click_suggestion: {
        Args: {
          p_suggestion_id: string
        }
        Returns: boolean
      }
      check_draft_suggestions: {
        Args: {
          p_user_id: string
        }
        Returns: undefined
      }
      check_referral_suggestions: {
        Args: {
          p_user_id: string
        }
        Returns: undefined
      }
      get_user_agent: {
        Args: {
          p_user_id: string
        }
        Returns: {
          user_id: string
          name: string
          gender: AgentGender
          tone: AgentTone
          created_at: string
          updated_at: string
          is_default: boolean
        }[]
      }
      upsert_user_agent: {
        Args: {
          p_user_id: string
          p_name?: string
          p_gender?: AgentGender
          p_tone?: AgentTone
        }
        Returns: {
          success: boolean
          user_id: string
          name: string | null
          gender: string | null
          tone: string | null
          message: string
        }[]
      }
      // ============================================================================
      // Fonctions RPC - Propositions inter-agents
      // ============================================================================
      create_proposal: {
        Args: {
          p_from_user_id: string
          p_to_user_id: string
          p_type: ProposalType
          p_payload?: Json
          p_message?: string | null
          p_dedupe_key?: string | null
        }
        Returns: {
          success: boolean
          proposal_id: string | null
          error_code: string | null
          error_message: string | null
        }[]
      }
      respond_to_proposal: {
        Args: {
          p_proposal_id: string
          p_action: string
        }
        Returns: {
          success: boolean
          proposal_id: string
          new_status: ProposalStatus | null
          error_message: string | null
        }[]
      }
      cancel_proposal: {
        Args: {
          p_proposal_id: string
        }
        Returns: {
          success: boolean
          error_message: string | null
        }[]
      }
      get_pending_proposals: {
        Args: {
          p_user_id: string
          p_direction?: string
        }
        Returns: {
          id: string
          from_user_id: string
          to_user_id: string
          from_agent_name: string
          to_agent_name: string
          type: ProposalType
          payload: Json
          message: string | null
          status: ProposalStatus
          created_at: string
          expires_at: string
          time_remaining: string
        }[]
      }
      get_proposal_by_id: {
        Args: {
          p_proposal_id: string
        }
        Returns: {
          id: string
          from_user_id: string
          to_user_id: string
          from_agent_name: string
          to_agent_name: string
          type: ProposalType
          payload: Json
          message: string | null
          status: ProposalStatus
          created_at: string
          expires_at: string
          responded_at: string | null
          is_sender: boolean
          is_recipient: boolean
        }[]
      }
      expire_proposals: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      count_pending_proposals: {
        Args: {
          p_to_user_id: string
        }
        Returns: number
      }
      // ============================================================================
      // Fonctions RPC - Device Fingerprints (anti-doublons)
      // ============================================================================
      check_fingerprint_duplicates: {
        Args: {
          p_email: string
          p_ip_address: string
          p_fingerprint_id: string
        }
        Returns: {
          is_suspicious: boolean
          suspicion_level: string
          suspicion_reason: string | null
          existing_emails: string[] | null
          ip_count: number
          fingerprint_count: number
        }[]
      }
      register_device_fingerprint: {
        Args: {
          p_email: string
          p_ip_address: string
          p_fingerprint_id: string
          p_user_agent?: string | null
          p_metadata?: Json
        }
        Returns: {
          success: boolean
          fingerprint_record_id: string | null
          is_suspicious: boolean
          suspicion_level: string
          suspicion_reason: string | null
        }[]
      }
      link_fingerprint_to_user: {
        Args: {
          p_email: string
          p_user_id: string
        }
        Returns: boolean
      }
      // ============================================================================
      // Fonctions RPC - Agent Routing Log
      // ============================================================================
      log_agent_routing: {
        Args: {
          p_from_agent: string
          p_to_agent: string
          p_intent?: string | null
          p_decision?: string | null
          p_conversation_id?: string | null
          p_user_id?: string | null
          p_metadata?: Json
        }
        Returns: string // UUID
      }
      get_agent_routing_stats: {
        Args: {
          p_days?: number
        }
        Returns: {
          to_agent: string
          total_calls: number
          unique_users: number
          unique_conversations: number
          most_common_intent: string | null
        }[]
      }
      cleanup_old_routing_logs: {
        Args: {
          p_days_to_keep?: number
        }
        Returns: number
      }
    }
    
    Enums: {
      [_ in never]: never
    }
    
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

/**
 * Types utilitaires pour faciliter l'utilisation
 */
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']

export type InsertTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert']

export type UpdateTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update']

// Alias pratiques - Tables existantes
export type PendingRegistration = Tables<'pending_registrations'>
export type Profile = Tables<'profiles'>
export type ReferrerCode = Tables<'referrer_codes'>
export type Referral = Tables<'referrals'>
export type ActionLog = Tables<'ai_actions_log'>
export type Conversation = Tables<'conversations'>
export type Message = Tables<'messages'>

// Alias pratiques - Nouvelles tables crédits/MLM
export type CreditWallet = Tables<'credit_wallets'>
export type CreditLedgerEntry = Tables<'credit_ledger'>
export type Purchase = Tables<'purchases'>
export type MlmCommission = Tables<'mlm_commissions'>
export type MlmBalance = Tables<'mlm_balances'>
export type PlatformCost = Tables<'platform_costs'>
export type PlatformRevenue = Tables<'platform_revenue'>
export type AiAction = Tables<'ai_actions'>

// Alias pratiques - Suggestions proactives
export type AgentSuggestion = Tables<'agent_suggestions'>

// Alias pratiques - Agents IA personnalisés
export type UserAgent = Tables<'user_agents'>

// Types pour les résultats des fonctions RPC
export type ClaimDailyResult = Database['public']['Functions']['claim_daily_free_credits']['Returns'][number]
export type ConsumeCreditsResult = Database['public']['Functions']['consume_credit_atomic']['Returns'][number]
export type CreatePurchaseResult = Database['public']['Functions']['create_purchase']['Returns'][number]
export type ConfirmPurchaseResult = Database['public']['Functions']['confirm_purchase_and_distribute_mlm']['Returns'][number]
export type WalletResult = Database['public']['Functions']['get_user_wallet']['Returns'][number]

// Types pour les résultats des fonctions RPC - Suggestions
export type ActiveSuggestionResult = Database['public']['Functions']['get_active_suggestion']['Returns'][number]
export type CanCreateSuggestionResult = Database['public']['Functions']['can_create_suggestion']['Returns'][number]
export type CreateSuggestionResult = Database['public']['Functions']['create_suggestion']['Returns'][number]

// Types pour les résultats des fonctions RPC - Agents personnalisés
export type GetUserAgentResult = Database['public']['Functions']['get_user_agent']['Returns'][number]
export type UpsertUserAgentResult = Database['public']['Functions']['upsert_user_agent']['Returns'][number]

// Alias pratiques - Propositions inter-agents
export type AgentProposal = Tables<'agent_proposals'>

// Types pour les résultats des fonctions RPC - Propositions
export type CreateProposalResult = Database['public']['Functions']['create_proposal']['Returns'][number]
export type RespondToProposalResult = Database['public']['Functions']['respond_to_proposal']['Returns'][number]
export type CancelProposalResult = Database['public']['Functions']['cancel_proposal']['Returns'][number]
export type PendingProposalResult = Database['public']['Functions']['get_pending_proposals']['Returns'][number]
export type ProposalByIdResult = Database['public']['Functions']['get_proposal_by_id']['Returns'][number]

// Alias pratiques - Device Fingerprints (anti-doublons)
export type DeviceFingerprint = Tables<'device_fingerprints'>

// Types pour les résultats des fonctions RPC - Device Fingerprints
export type CheckFingerprintDuplicatesResult = Database['public']['Functions']['check_fingerprint_duplicates']['Returns'][number]
export type RegisterDeviceFingerprintResult = Database['public']['Functions']['register_device_fingerprint']['Returns'][number]

// Alias pratiques - Agent Routing Log (système multi-agents)
export type AgentRoutingLog = Tables<'agent_routing_log'>

// Types pour les résultats des fonctions RPC - Agent Routing
export type AgentRoutingStatsResult = Database['public']['Functions']['get_agent_routing_stats']['Returns'][number]
