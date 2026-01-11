/**
 * Types TypeScript pour le système d'onboarding
 * 
 * Définit les structures de données pour :
 * - Requêtes API (input)
 * - Réponses API (output)
 * - Erreurs métier
 */

import { z } from 'zod'

// Types locaux pour éviter les dépendances circulaires
export type UserRole = 'individual' | 'professional'
export type RegistrationSource = 'ai' | 'web'

// ============================================================================
// SCHEMAS DE VALIDATION ZOD
// ============================================================================

/**
 * Schéma de validation pour la pré-inscription
 */
export const PreRegisterSchema = z.object({
  // Email valide requis
  email: z
    .string()
    .email('Adresse email invalide')
    .min(1, 'L\'email est requis')
    .max(255, 'L\'email est trop long')
    .transform(val => val.toLowerCase().trim()),
  
  // Rôle : particulier ou professionnel
  role: z.enum(['individual', 'professional'], {
    message: 'Le rôle doit être "individual" ou "professional"'
  }),
  
  // Code parrain optionnel
  referrer_code: z
    .string()
    .max(20, 'Le code parrain est trop long')
    .transform(val => val?.toUpperCase().trim() || null)
    .nullable()
    .optional(),
  
  // Consentement obligatoire (doit être true)
  consent: z.literal(true, {
    message: 'Le consentement est obligatoire'
  }),
  
  // Source de l'inscription
  source: z.enum(['ai', 'web'], {
    message: 'La source doit être "ai" ou "web"'
  })
})

/**
 * Schéma de validation pour la vérification OTP
 */
export const VerifyOtpSchema = z.object({
  // Email pour identifier la pré-inscription
  email: z
    .string()
    .email('Adresse email invalide')
    .min(1, 'L\'email est requis')
    .transform(val => val.toLowerCase().trim()),
  
  // Token OTP reçu par email (6 chiffres généralement)
  token: z
    .string()
    .min(6, 'Le code OTP doit contenir au moins 6 caractères')
    .max(10, 'Le code OTP est trop long')
    .regex(/^[0-9]+$/, 'Le code OTP ne doit contenir que des chiffres')
})

// ============================================================================
// TYPES INFÉRÉS DES SCHÉMAS
// ============================================================================

/**
 * Données de pré-inscription validées
 */
export type PreRegisterInput = z.infer<typeof PreRegisterSchema>

/**
 * Données de vérification OTP validées
 */
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>

// ============================================================================
// TYPES DE RÉPONSES API
// ============================================================================

/**
 * Réponse de succès générique
 */
export interface ApiSuccessResponse<T = undefined> {
  success: true
  message: string
  data?: T
}

/**
 * Réponse d'erreur API
 */
export interface ApiErrorResponse {
  success: false
  error: string
  code: ErrorCode
  details?: Record<string, string[]>
}

/**
 * Type union pour les réponses API
 */
export type ApiResponse<T = undefined> = ApiSuccessResponse<T> | ApiErrorResponse

// ============================================================================
// CODES D'ERREUR
// ============================================================================

/**
 * Codes d'erreur métier pour le frontend
 */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'EMAIL_ALREADY_REGISTERED'
  | 'INVALID_REFERRER_CODE'
  | 'PENDING_REGISTRATION_NOT_FOUND'
  | 'PENDING_REGISTRATION_EXPIRED'
  | 'OTP_VERIFICATION_FAILED'
  | 'OTP_EXPIRED'
  | 'OTP_INVALID'
  | 'USER_CREATION_FAILED'
  | 'PROFILE_CREATION_FAILED'
  | 'REFERRAL_CREATION_FAILED'
  | 'INTERNAL_ERROR'
  | 'RATE_LIMITED'

// ============================================================================
// TYPES MÉTIER
// ============================================================================

/**
 * Données de pré-inscription (avant OTP)
 */
export interface PreRegistrationData {
  email: string
  role: UserRole
  referrer_code: string | null
  referrer_id: string | null // Résolu depuis referrer_code
  consent: boolean
  source: RegistrationSource
}

/**
 * Résultat de la résolution d'un code parrain
 */
export interface ReferrerResolution {
  found: boolean
  referrer_id: string | null
  referrer_code: string | null
}

/**
 * Données retournées après inscription réussie
 */
export interface RegistrationResult {
  user_id: string
  email: string
  role: UserRole
  referrer_code: string // Code parrain du nouvel utilisateur
  has_referrer: boolean
}

/**
 * Session utilisateur après vérification OTP
 */
export interface UserSession {
  access_token: string
  refresh_token: string
  expires_at: number
  user: {
    id: string
    email: string
  }
}

/**
 * Réponse complète de vérification OTP
 */
export interface VerifyOtpResult {
  session: UserSession
  profile: {
    id: string
    role: UserRole
    referrer_code: string
  }
  has_referrer: boolean
}

// ============================================================================
// TYPES POUR LES LOGS
// ============================================================================

/**
 * Types d'actions loguées
 */
export type ActionType =
  | 'PRE_REGISTRATION_INITIATED'
  | 'PRE_REGISTRATION_CREATED'
  | 'OTP_SENT'
  | 'OTP_VERIFIED'
  | 'USER_CREATED'
  | 'PROFILE_CREATED'
  | 'REFERRAL_CREATED'
  | 'REGISTRATION_COMPLETED'
  | 'REGISTRATION_FAILED'

/**
 * Statuts des actions loguées
 */
export type ActionStatus = 'initiated' | 'pending' | 'completed' | 'failed'

/**
 * Métadonnées pour les logs
 */
export interface ActionMetadata {
  ip_address?: string
  user_agent?: string
  referrer_code?: string
  error_details?: string
  [key: string]: unknown
}

