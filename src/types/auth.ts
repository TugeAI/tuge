/**
 * Types TypeScript pour le système d'authentification OTP
 * 
 * Définit les structures de données pour :
 * - Requêtes d'envoi OTP (email ou téléphone)
 * - Requêtes de vérification OTP
 * - Réponses API
 */

import { z } from 'zod'

// ============================================================================
// SCHEMAS DE VALIDATION ZOD
// ============================================================================

/**
 * Regex pour validation téléphone français
 * Formats acceptés : 06/07 + 8 chiffres, +33 6/7 + 8 chiffres
 */
const PHONE_REGEX = /^(?:(?:\+33|0033|0)[67])(?:[\s.-]?\d{2}){4}$/

/**
 * Schéma pour l'envoi d'OTP
 * Accepte soit un email, soit un téléphone
 */
export const SendOtpSchema = z.object({
  // Identifiant : email OU téléphone
  identifier: z
    .string()
    .min(1, 'L\'email ou le téléphone est requis')
    .max(255, 'Identifiant trop long'),
  
  // Code parrain optionnel (depuis URL ?ref=xxx)
  referrerCode: z
    .string()
    .max(20, 'Code parrain trop long')
    .nullable()
    .optional()
    .transform(val => val?.toUpperCase().trim() || null),
  
  // Device fingerprint pour la protection anti-doublons
  fingerprintId: z
    .string()
    .max(100, 'Fingerprint ID trop long')
    .nullable()
    .optional(),
  
  // Métadonnées du fingerprint (timezone, language, etc.)
  fingerprintMetadata: z
    .record(z.string(), z.unknown())
    .nullable()
    .optional(),
})

/**
 * Schéma pour la vérification OTP
 */
export const VerifyOtpSchema = z.object({
  // Email ou téléphone utilisé pour l'envoi
  identifier: z
    .string()
    .min(1, 'L\'identifiant est requis'),
  
  // Code OTP à 6 chiffres (Supabase envoie 6 chiffres par défaut)
  code: z
    .string()
    .min(6, 'Le code doit contenir au moins 6 chiffres')
    .max(8, 'Le code ne peut pas dépasser 8 chiffres')
    .regex(/^\d+$/, 'Le code doit contenir uniquement des chiffres'),
  
  // Code parrain (passé depuis la page précédente)
  referrerCode: z
    .string()
    .nullable()
    .optional(),
})

/**
 * Schéma pour l'inscription classique (email + mot de passe)
 */
export const SignupSchema = z.object({
  email: z
    .string()
    .email('Format d\'email invalide')
    .min(1, 'L\'email est requis')
    .max(255, 'Email trop long')
    .transform(val => val.toLowerCase().trim()),
  
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(72, 'Le mot de passe ne peut pas dépasser 72 caractères'),
  
  confirmPassword: z
    .string()
    .min(1, 'La confirmation du mot de passe est requise'),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  }
)

/**
 * Schéma pour la connexion classique
 */
export const LoginSchema = z.object({
  email: z
    .string()
    .email('Format d\'email invalide')
    .min(1, 'L\'email est requis')
    .transform(val => val.toLowerCase().trim()),
  
  password: z
    .string()
    .min(1, 'Le mot de passe est requis'),
})

// ============================================================================
// TYPES INFÉRÉS
// ============================================================================

export type SendOtpInput = z.infer<typeof SendOtpSchema>
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>
export type SignupInput = z.infer<typeof SignupSchema>
export type LoginInput = z.infer<typeof LoginSchema>

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Détermine si l'identifiant est un email ou un téléphone
 */
export function getIdentifierType(identifier: string): 'email' | 'phone' {
  // Nettoie l'identifiant
  const cleaned = identifier.trim()
  
  // Si contient @ c'est un email
  if (cleaned.includes('@')) {
    return 'email'
  }
  
  // Sinon on considère que c'est un téléphone
  return 'phone'
}

/**
 * Valide un email
 */
export function isValidEmail(email: string): boolean {
  const emailSchema = z.string().email()
  return emailSchema.safeParse(email).success
}

/**
 * Valide un numéro de téléphone français
 */
export function isValidPhone(phone: string): boolean {
  // Nettoie les espaces et caractères spéciaux pour la validation
  const cleaned = phone.replace(/[\s.-]/g, '')
  return PHONE_REGEX.test(cleaned)
}

/**
 * Normalise un numéro de téléphone au format E.164 (+33...)
 */
export function normalizePhone(phone: string): string {
  // Supprime tous les caractères non numériques sauf +
  let cleaned = phone.replace(/[^\d+]/g, '')
  
  // Si commence par 0, remplace par +33
  if (cleaned.startsWith('0')) {
    cleaned = '+33' + cleaned.slice(1)
  }
  
  // Si commence par 33 sans +, ajoute +
  if (cleaned.startsWith('33') && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned
  }
  
  return cleaned
}

// ============================================================================
// TYPES DE RÉPONSES API
// ============================================================================

/**
 * Réponse de succès pour l'envoi OTP
 */
export interface SendOtpSuccessResponse {
  success: true
  message: string
  data: {
    identifier: string
    type: 'email' | 'phone'
    // Protection anti-doublons
    isSuspicious?: boolean
    suspicionLevel?: 'none' | 'low' | 'medium' | 'high'
    suspicionReason?: string | null
  }
}

/**
 * Réponse de succès pour la vérification OTP
 */
export interface VerifyOtpSuccessResponse {
  success: true
  message: string
  data: {
    user: {
      id: string
      email?: string
      phone?: string
    }
    isNewUser: boolean
    hasReferrer: boolean
  }
}

/**
 * Réponse d'erreur API
 */
export interface AuthErrorResponse {
  success: false
  error: string
  code: AuthErrorCode
}

/**
 * Codes d'erreur auth
 */
export type AuthErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_IDENTIFIER'
  | 'RATE_LIMITED'
  | 'OTP_SEND_FAILED'
  | 'OTP_INVALID'
  | 'OTP_EXPIRED'
  | 'PROFILE_CREATION_FAILED'
  | 'EMAIL_ALREADY_EXISTS'
  | 'INVALID_CREDENTIALS'
  | 'USER_NOT_FOUND'
  | 'PIPELINE_FAILED'
  | 'INTERNAL_ERROR'

/**
 * Réponse de succès pour l'inscription classique
 */
export interface SignupSuccessResponse {
  success: true
  message: string
  data: {
    user: {
      id: string
      email: string
    }
    isNewUser: true
  }
}

/**
 * Réponse de succès pour la connexion
 */
export interface LoginSuccessResponse {
  success: true
  message: string
  data: {
    user: {
      id: string
      email: string
    }
  }
}

/**
 * Type union pour les réponses
 */
export type SendOtpResponse = SendOtpSuccessResponse | AuthErrorResponse
export type VerifyOtpResponse = VerifyOtpSuccessResponse | AuthErrorResponse
export type SignupResponse = SignupSuccessResponse | AuthErrorResponse
export type LoginResponse = LoginSuccessResponse | AuthErrorResponse

