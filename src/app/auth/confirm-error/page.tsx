'use client'

/**
 * Page /auth/confirm-error
 * 
 * Affiche des messages d'erreur clairs lorsque le lien de confirmation ne fonctionne pas.
 * 
 * Paramètres URL possibles :
 * - ?error=expired : Lien expiré
 * - ?error=already_used : Lien déjà utilisé
 * - ?error=invalid_token : Token invalide
 * - ?error=missing_token : Token manquant
 * - ?error=session_failed : Échec de session
 * - ?error=no_user : Utilisateur introuvable
 * - ?error=unexpected : Erreur inattendue
 */

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { BRAND } from '@/config/brand'

type ErrorType = 'expired' | 'already_used' | 'invalid_token' | 'missing_token' | 'session_failed' | 'no_user' | 'unexpected'

interface ErrorConfig {
  title: string
  message: string
  icon: string
  canResend: boolean
  primaryAction: {
    label: string
    href: string
  }
  secondaryAction?: {
    label: string
    href: string
  }
}

const ERROR_CONFIGS: Record<ErrorType, ErrorConfig> = {
  expired: {
    title: 'Lien de confirmation expiré',
    message: 'Ce lien de confirmation a expiré. Pour des raisons de sécurité, les liens de confirmation sont valables 24 heures. Vous pouvez demander un nouveau lien ci-dessous.',
    icon: '⏱️',
    canResend: true,
    primaryAction: {
      label: 'Renvoyer un email de confirmation',
      href: '/auth/resend-confirmation',
    },
    secondaryAction: {
      label: 'Retour à l\'accueil',
      href: '/',
    },
  },
  already_used: {
    title: 'Compte déjà confirmé',
    message: 'Ce lien de confirmation a déjà été utilisé. Votre compte est déjà activé ! Vous pouvez vous connecter directement.',
    icon: '✅',
    canResend: false,
    primaryAction: {
      label: 'Se connecter',
      href: '/auth/login',
    },
    secondaryAction: {
      label: 'Retour à l\'accueil',
      href: '/',
    },
  },
  invalid_token: {
    title: 'Lien de confirmation invalide',
    message: 'Ce lien de confirmation n\'est pas valide. Il se peut qu\'il ait été copié incorrectement ou qu\'il soit corrompu. Essayez de copier à nouveau le lien depuis votre email.',
    icon: '❌',
    canResend: true,
    primaryAction: {
      label: 'Renvoyer un email de confirmation',
      href: '/auth/resend-confirmation',
    },
    secondaryAction: {
      label: 'Contacter le support',
      href: `mailto:${BRAND.supportEmail}`,
    },
  },
  missing_token: {
    title: 'Lien de confirmation incomplet',
    message: 'Le lien de confirmation est incomplet. Assurez-vous de copier le lien complet depuis votre email, y compris tous les paramètres.',
    icon: '🔗',
    canResend: true,
    primaryAction: {
      label: 'Renvoyer un email de confirmation',
      href: '/auth/resend-confirmation',
    },
    secondaryAction: {
      label: 'Retour à l\'accueil',
      href: '/',
    },
  },
  session_failed: {
    title: 'Erreur de session',
    message: 'Une erreur est survenue lors de la création de votre session. Cela peut être un problème temporaire. Veuillez réessayer dans quelques instants.',
    icon: '⚠️',
    canResend: true,
    primaryAction: {
      label: 'Renvoyer un email de confirmation',
      href: '/auth/resend-confirmation',
    },
    secondaryAction: {
      label: 'Contacter le support',
      href: `mailto:${BRAND.supportEmail}`,
    },
  },
  no_user: {
    title: 'Utilisateur introuvable',
    message: 'Aucun utilisateur correspondant à ce lien n\'a été trouvé. Le compte a peut-être été supprimé.',
    icon: '👤',
    canResend: false,
    primaryAction: {
      label: 'Créer un nouveau compte',
      href: '/auth/signup',
    },
    secondaryAction: {
      label: 'Contacter le support',
      href: `mailto:${BRAND.supportEmail}`,
    },
  },
  unexpected: {
    title: 'Erreur inattendue',
    message: 'Une erreur inattendue est survenue. Nos équipes ont été notifiées. Veuillez réessayer dans quelques instants ou contacter notre support.',
    icon: '🚨',
    canResend: true,
    primaryAction: {
      label: 'Renvoyer un email de confirmation',
      href: '/auth/resend-confirmation',
    },
    secondaryAction: {
      label: 'Contacter le support',
      href: `mailto:${BRAND.supportEmail}`,
    },
  },
}

export default function ConfirmErrorPage() {
  const searchParams = useSearchParams()
  const errorType = (searchParams.get('error') || 'unexpected') as ErrorType
  const config = ERROR_CONFIGS[errorType] || ERROR_CONFIGS.unexpected

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card principale */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          {/* Icône */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
              <span className="text-4xl">{config.icon}</span>
            </div>
          </div>

          {/* Titre */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">
            {config.title}
          </h1>

          {/* Message */}
          <p className="text-gray-600 dark:text-gray-300 text-center mb-8 leading-relaxed">
            {config.message}
          </p>

          {/* Actions */}
          <div className="space-y-3">
            {/* Action principale */}
            <Link
              href={config.primaryAction.href}
              className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-xl text-center transition-all duration-200 shadow-lg shadow-purple-500/30"
            >
              {config.primaryAction.label}
            </Link>

            {/* Action secondaire */}
            {config.secondaryAction && (
              <Link
                href={config.secondaryAction.href}
                className="block w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-6 rounded-xl text-center transition-all duration-200"
              >
                {config.secondaryAction.label}
              </Link>
            )}
          </div>

          {/* Info additionnelle pour liens expirés */}
          {config.canResend && (
            <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
              <p className="text-sm text-purple-800 dark:text-purple-300 text-center">
                💡 <strong>Conseil :</strong> Vérifiez vos spams si vous ne recevez pas le nouvel email
              </p>
            </div>
          )}
        </div>

        {/* Logo et branding */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 112.5 112.5" className="opacity-80">
              <circle cx="43.35" cy="56.15" r="9.625" fill="#6d28d9"/>
              <circle cx="68.65" cy="30.88" r="9.625" fill="#be185d"/>
              <circle cx="68.65" cy="56.15" r="9.625" fill="#f472b6"/>
              <circle cx="43.35" cy="81.13" r="9.625" fill="#c084fc"/>
            </svg>
            <span className="text-sm font-medium">{BRAND.name}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            {BRAND.tagline}
          </p>
        </div>
      </div>
    </div>
  )
}


