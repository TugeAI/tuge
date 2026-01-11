'use client'

/**
 * Page de saisie OTP - Code à 6 chiffres
 *
 * UX premium avec :
 * - 6 inputs individuels avec auto-focus
 * - Navigation clavier fluide
 * - Validation automatique
 * - Loader et gestion erreurs
 * - Possibilité de renvoyer le code
 */

import { Suspense, useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BRAND } from '@/config/brand'

// ============================================================================
// Icônes SVG
// ============================================================================

const Icons = {
  Mail: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Phone: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  Check: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Refresh: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
}

// ============================================================================
// Logo animé
// ============================================================================

function MinimalLogo() {
  return (
    <div className="w-16 h-16 relative mx-auto mb-6">
      <div className="w-full h-full bg-bg-tertiary rounded-xl p-3 border border-border-primary">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.svg"
          alt={BRAND.name}
          className="w-full h-full"
        />
      </div>
    </div>
  )
}

// ============================================================================
// Composant OTP Input
// ============================================================================

// Nombre de chiffres du code OTP (Supabase envoie 8 chiffres)
const OTP_LENGTH = 8

interface OtpInputProps {
  value: string[]
  onChange: (value: string[]) => void
  onComplete: (code: string) => void
  disabled?: boolean
  hasError?: boolean
  length?: number
}

function OtpInput({ value, onChange, onComplete, disabled, hasError, length = OTP_LENGTH }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  
  const focusInput = (index: number) => {
    if (index >= 0 && index < length) {
      inputRefs.current[index]?.focus()
    }
  }
  
  const handleChange = (index: number, inputValue: string) => {
    // Ne garde que le dernier chiffre saisi
    const digit = inputValue.replace(/\D/g, '').slice(-1)
    
    const newValue = [...value]
    newValue[index] = digit
    onChange(newValue)
    
    // Auto-focus sur le prochain input
    if (digit && index < length - 1) {
      focusInput(index + 1)
    }
    
    // Vérifie si le code est complet
    const completeCode = newValue.join('')
    if (completeCode.length === length && new RegExp(`^\\d{${length}}$`).test(completeCode)) {
      onComplete(completeCode)
    }
  }
  
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // Si le champ est vide, recule au précédent
        focusInput(index - 1)
      } else {
        // Efface le champ actuel
        const newValue = [...value]
        newValue[index] = ''
        onChange(newValue)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusInput(index - 1)
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      focusInput(index + 1)
    }
  }
  
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    
    if (pastedData) {
      const newValue = pastedData.split('').concat(Array(length).fill('')).slice(0, length)
      onChange(newValue)
      
      // Focus sur le dernier champ rempli ou le suivant
      const lastFilledIndex = Math.min(pastedData.length, length - 1)
      focusInput(lastFilledIndex)
      
      // Vérifie si le code est complet
      if (pastedData.length === length) {
        onComplete(pastedData)
      }
    }
  }
  
  return (
    <div className="flex gap-1.5 sm:gap-2 justify-center max-w-full">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          autoFocus={index === 0}
          className={`
            w-9 h-11 sm:w-10 sm:h-12
            text-center text-lg sm:text-xl font-semibold
            bg-bg-tertiary border rounded-lg
            text-text-primary
            focus:outline-none focus:border-accent-primary
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${hasError 
              ? 'border-red-500/50 animate-shake' 
              : value[index] 
                ? 'border-accent-primary/50' 
                : 'border-border-primary'
            }
          `}
        />
      ))}
    </div>
  )
}

// ============================================================================
// Composant principal
// ============================================================================

function OtpPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [otpValue, setOtpValue] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Récupère les données depuis sessionStorage
  const [identifier, setIdentifier] = useState<string | null>(null)
  const [identifierType, setIdentifierType] = useState<'email' | 'phone'>('email')
  const redirectPath = searchParams.get('redirect') || '/agent'
  
  useEffect(() => {
    const storedIdentifier = sessionStorage.getItem('tug_auth_identifier')
    const storedType = sessionStorage.getItem('tug_auth_type') as 'email' | 'phone'
    
    if (!storedIdentifier) {
      // Pas d'identifiant, retour à la page auth
      router.replace('/auth')
      return
    }
    
    setIdentifier(storedIdentifier)
    setIdentifierType(storedType || 'email')
    
    // Démarre le cooldown de 60 secondes
    setResendCooldown(60)
  }, [router])
  
  // Timer pour le cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])
  
  // Vérification du code
  const handleComplete = useCallback(async (code: string) => {
    if (!identifier || isVerifying) return
    
    setIsVerifying(true)
    setError(null)
    
    try {
      const referrerCode = sessionStorage.getItem('tug_referrer_code')
      
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          code,
          referrerCode,
        }),
      })
      
      const data = await response.json()
      
      if (!data.success) {
        setError(data.error || 'Code incorrect')
        setOtpValue(Array(OTP_LENGTH).fill(''))
        setIsVerifying(false)
        return
      }
      
      // Succès
      setSuccess(true)
      
      // Nettoie le sessionStorage
      sessionStorage.removeItem('tug_auth_identifier')
      sessionStorage.removeItem('tug_auth_type')
      sessionStorage.removeItem('tug_referrer_code')
      
      // Redirige après un court délai pour montrer le succès
      setTimeout(() => {
        router.replace(redirectPath)
      }, 1000)
      
    } catch (err) {
      console.error('Verify OTP error:', err)
      setError('Erreur de connexion. Réessayez.')
      setOtpValue(Array(OTP_LENGTH).fill(''))
      setIsVerifying(false)
    }
  }, [identifier, isVerifying, redirectPath, router])
  
  // Renvoi du code
  const handleResend = useCallback(async () => {
    if (!identifier || isResending || resendCooldown > 0) return
    
    setIsResending(true)
    setError(null)
    
    try {
      const referrerCode = sessionStorage.getItem('tug_referrer_code')
      
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          referrerCode,
        }),
      })
      
      const data = await response.json()
      
      if (!data.success) {
        setError(data.error || 'Impossible de renvoyer le code')
      } else {
        setResendCooldown(60)
        setOtpValue(Array(OTP_LENGTH).fill(''))
      }
      
    } catch (err) {
      console.error('Resend OTP error:', err)
      setError('Erreur de connexion. Réessayez.')
    } finally {
      setIsResending(false)
    }
  }, [identifier, isResending, resendCooldown])
  
  // Retour à la page précédente
  const handleBack = useCallback(() => {
    router.push('/auth')
  }, [router])
  
  // Loading initial
  if (!identifier) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <MinimalLogo />
          <div className="w-6 h-0.5 bg-border-primary rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-accent-primary/60 rounded-full animate-loading-bar" />
          </div>
        </div>
      </div>
    )
  }
  
  // Écran de succès
  if (success) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-14 h-14 mx-auto mb-5 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-500 animate-scale-in">
            <Icons.Check />
          </div>
          
          <h1 className="text-xl font-semibold text-text-primary mb-2">
            Connexion réussie
          </h1>
          <p className="text-sm text-text-muted">
            Redirection en cours...
          </p>
          
          <div className="mt-5 flex justify-center">
            <div className="w-6 h-0.5 bg-border-primary rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-green-500/60 rounded-full animate-loading-bar" />
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Bouton retour */}
        <button
          onClick={handleBack}
          className="mb-6 flex items-center gap-2 text-text-muted hover:text-text-secondary transition-colors text-sm"
        >
          <Icons.ArrowLeft />
          <span>Retour</span>
        </button>
        
        {/* Logo */}
        <MinimalLogo />
        
        {/* Titre */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
            Vérification
          </h1>
          <p className="text-text-secondary">
            Entrez le code à {OTP_LENGTH} chiffres envoyé à
          </p>
          <div className="mt-2 flex items-center justify-center gap-2 text-text-primary font-medium">
            {identifierType === 'email' ? <Icons.Mail /> : <Icons.Phone />}
            <span>{identifier}</span>
          </div>
        </div>
        
        {/* Carte principale */}
        <div className="bg-bg-secondary border border-border-primary rounded-2xl p-5 sm:p-6 shadow-lg overflow-hidden">
          {/* Input OTP */}
          <div className="mb-6 overflow-x-auto">
            <OtpInput
              value={otpValue}
              onChange={setOtpValue}
              onComplete={handleComplete}
              disabled={isVerifying}
              hasError={!!error}
            />
          </div>
          
          {/* Message d'erreur */}
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center animate-fade-in">
              {error}
            </div>
          )}
          
          {/* Loader de vérification */}
          {isVerifying && (
            <div className="mb-6 flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-border-primary border-t-accent-primary rounded-full animate-spin" />
              <p className="text-text-muted text-sm">Vérification...</p>
            </div>
          )}
          
          {/* Renvoyer le code */}
          <div className="text-center">
            {resendCooldown > 0 ? (
              <p className="text-text-muted text-sm">
                Renvoyer le code dans {resendCooldown}s
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={isResending}
                className="inline-flex items-center gap-2 text-accent-primary hover:text-accent-primary/80 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isResending ? (
                  <div className="w-4 h-4 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
                ) : (
                  <Icons.Refresh />
                )}
                <span>Renvoyer le code</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Aide */}
        <div className="mt-6 text-center text-text-muted text-sm">
          <p>
            Vous n&apos;avez pas reçu de code ?{' '}
            <button
              onClick={handleBack}
              className="text-text-secondary hover:text-text-primary transition-colors underline"
            >
              Modifier l&apos;adresse
            </button>
          </p>
        </div>
      </div>
      
      {/* Style pour l'animation shake */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  )
}

export default function OtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <MinimalLogo />
          <div className="w-6 h-0.5 bg-border-primary rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-accent-primary/60 rounded-full animate-loading-bar" />
          </div>
        </div>
      </div>
    }>
      <OtpPageContent />
    </Suspense>
  )
}

