'use client'

/**
 * Page /auth/resend-confirmation
 * 
 * Permet aux utilisateurs de renvoyer un email de confirmation d'inscription.
 * 
 * Cas d'usage :
 * - Lien de confirmation expiré
 * - Email non reçu ou perdu
 * - Lien corrompu ou invalide
 */

import { useState } from 'react'
import Link from 'next/link'
import { BRAND } from '@/config/brand'

type FormState = 'idle' | 'loading' | 'success' | 'error'

export default function ResendConfirmationPage() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<FormState>('idle')
  const [message, setMessage] = useState('')
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) return

    setState('loading')
    setMessage('')
    setAlreadyConfirmed(false)

    try {
      const response = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setState('success')
        setMessage(data.message)
        setAlreadyConfirmed(data.already_confirmed || false)
      } else {
        setState('error')
        setMessage(data.message || 'Une erreur est survenue. Veuillez réessayer.')
      }
    } catch {
      setState('error')
      setMessage('Impossible de se connecter au serveur. Vérifiez votre connexion internet.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card principale */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          {/* Logo et titre */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 112.5 112.5">
                <circle cx="43.35" cy="56.15" r="9.625" fill="#6d28d9"/>
                <circle cx="68.65" cy="30.88" r="9.625" fill="#be185d"/>
                <circle cx="68.65" cy="56.15" r="9.625" fill="#f472b6"/>
                <circle cx="43.35" cy="81.13" r="9.625" fill="#c084fc"/>
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
            Renvoyer l&apos;email de confirmation
          </h1>

          <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
            Entrez votre adresse email et nous vous enverrons un nouveau lien de confirmation.
          </p>

          {/* Formulaire */}
          {state !== 'success' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Adresse email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  required
                  disabled={state === 'loading'}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Message d'erreur */}
              {state === 'error' && message && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-sm text-red-800 dark:text-red-300 flex items-start gap-2">
                    <span className="text-lg">⚠️</span>
                    <span>{message}</span>
                  </p>
                </div>
              )}

              {/* Bouton submit */}
              <button
                type="submit"
                disabled={state === 'loading' || !email}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/30 disabled:shadow-none disabled:cursor-not-allowed"
              >
                {state === 'loading' ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Envoi en cours...
                  </span>
                ) : (
                  'Renvoyer l\'email'
                )}
              </button>
            </form>
          )}

          {/* Message de succès */}
          {state === 'success' && (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <p className="text-sm text-green-800 dark:text-green-300 flex items-start gap-2">
                  <span className="text-lg">✅</span>
                  <span>{message}</span>
                </p>
              </div>

              {alreadyConfirmed ? (
                <Link
                  href="/auth/login"
                  className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-xl text-center transition-all duration-200 shadow-lg shadow-purple-500/30"
                >
                  Se connecter →
                </Link>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                    <p className="text-sm text-purple-800 dark:text-purple-300">
                      <strong>📧 Vérifiez votre boîte de réception</strong>
                    </p>
                    <ul className="mt-2 text-xs text-purple-700 dark:text-purple-400 space-y-1 list-disc list-inside">
                      <li>L&apos;email peut prendre quelques minutes à arriver</li>
                      <li>Vérifiez vos spams/courrier indésirable</li>
                      <li>Cherchez un email de {BRAND.noReplyEmail}</li>
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      setState('idle')
                      setMessage('')
                    }}
                    className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-6 rounded-xl text-center transition-all duration-200"
                  >
                    Renvoyer à nouveau
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Liens utiles */}
          {state !== 'success' && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <Link
                href="/auth/login"
                className="block text-center text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
              >
                Retour à la connexion
              </Link>
              <Link
                href="/auth/signup"
                className="block text-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Créer un nouveau compte
              </Link>
            </div>
          )}
        </div>

        {/* Support */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Besoin d&apos;aide ?{' '}
            <a
              href={`mailto:${BRAND.supportEmail}`}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
            >
              Contactez-nous
            </a>
          </p>
        </div>

        {/* Branding */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {BRAND.copyright}
          </p>
        </div>
      </div>
    </div>
  )
}


