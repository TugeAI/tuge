'use client'

/**
 * OnboardingView - Vue d'activation de l'agent
 * 
 * Affichée sur /agent quand l'utilisateur n'est pas authentifié.
 * Design simple, phrases courtes, focus sur l'activation rapide.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { BRAND } from '@/config/brand'
import { createClient } from '@/lib/supabase/client'
import { useDeviceFingerprint } from '@/hooks/useDeviceFingerprint'

// ============================================================================
// Types
// ============================================================================

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface VisitorProfile {
  id: string
  session_id: string
  first_name: string | null
  intention: string
  message_count: number
}

interface OnboardingViewProps {
  sessionId: string
  onAuthenticated: () => void
  existingConversation?: {
    id: string
    messages: Message[]
  } | null
  visitorProfile?: VisitorProfile | null
}

type Step = 'welcome' | 'email' | 'sending' | 'otp' | 'verifying' | 'success'

const OTP_LENGTH = 8

// ============================================================================
// Composants
// ============================================================================

function AgentAvatar() {
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    </div>
  )
}

function MessageBubble({ content, isAgent }: { content: string; isAgent: boolean }) {
  return (
    <div className={`flex gap-3 ${isAgent ? '' : 'justify-end'}`}>
      {isAgent && <AgentAvatar />}
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
        isAgent 
          ? 'bg-white/10 text-white' 
          : 'bg-violet-500/20 text-white ml-auto'
      }`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  )
}

function EmailForm({ 
  onSubmit, 
  disabled 
}: { 
  onSubmit: (email: string) => void
  disabled: boolean 
}) {
  const [email, setEmail] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim() && !disabled) {
      onSubmit(email.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
      <input
        ref={inputRef}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="ton@email.com"
        disabled={disabled}
        className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-violet-500/50"
        autoComplete="email"
      />
      <button
        type="submit"
        disabled={!email.trim() || disabled}
        className="px-4 py-3 rounded-xl bg-violet-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-violet-600 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>
    </form>
  )
}

function OTPForm({ 
  onSubmit, 
  onResend,
  disabled,
  email 
}: { 
  onSubmit: (otp: string) => void
  onResend: () => void
  disabled: boolean
  email: string
}) {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    if (newOtp.every(d => d !== '')) {
      onSubmit(newOtp.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (pasted.length === OTP_LENGTH) {
      setOtp(pasted.split(''))
      onSubmit(pasted)
    }
  }

  return (
    <div className="mt-4">
      <p className="text-white/60 text-sm mb-3">Code envoyé à {email}</p>
      <div className="flex justify-center gap-2 mb-4">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={`w-10 h-12 text-center text-lg font-mono rounded-lg bg-white/5 border ${
              digit ? 'border-violet-500/50' : 'border-white/10'
            } text-white focus:outline-none focus:border-violet-500`}
          />
        ))}
      </div>
      <button
        onClick={onResend}
        disabled={disabled}
        className="text-sm text-white/50 hover:text-white/80 transition-colors"
      >
        Renvoyer le code
      </button>
    </div>
  )
}

// ============================================================================
// Composant principal
// ============================================================================

export function OnboardingView({ 
  sessionId, 
  onAuthenticated,
  existingConversation,
  visitorProfile
}: OnboardingViewProps) {
  const { fingerprint, getFingerprint } = useDeviceFingerprint()
  const [step, setStep] = useState<Step>('welcome')
  const [messages, setMessages] = useState<Message[]>([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Message d'accueil initial (une seule fois)
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    
    const firstName = visitorProfile?.first_name
    
    if (existingConversation?.messages?.length) {
      // Reprendre la conversation existante
      const existingMsgs = existingConversation.messages.map((m, i) => ({
        ...m,
        id: m.id || `existing-${i}`
      }))
      setMessages([
        ...existingMsgs,
        {
          id: `agent-welcome-${Date.now()}`,
          role: 'assistant' as const,
          content: firstName 
            ? `Content de te revoir, ${firstName} ! On reprend ?` 
            : 'Content de te revoir ! On reprend où on en était ?'
        }
      ])
    } else {
      // Nouveau visiteur - message court et direct
      setMessages([{
        id: `agent-welcome-${Date.now()}`,
        role: 'assistant' as const,
        content: "Salut ! Je suis ton agent Tuge. Pour t'aider, j'ai besoin de ton email."
      }])
      setStep('email')
    }
  }, [existingConversation, visitorProfile])

  const addAgentMessage = useCallback((content: string) => {
    setMessages(prev => [...prev, {
      id: `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'assistant' as const,
      content
    }])
  }, [])

  const addUserMessage = useCallback((content: string) => {
    setMessages(prev => [...prev, {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'user' as const,
      content
    }])
  }, [])

  // Envoi de l'email pour OTP
  const handleEmailSubmit = async (submittedEmail: string) => {
    setEmail(submittedEmail)
    addUserMessage(submittedEmail)
    setLoading(true)
    setError(null)
    setStep('sending')
    
    addAgentMessage('Je t\'envoie un code...')

    try {
      const fp = fingerprint || await getFingerprint()
      
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: submittedEmail,
          fingerprintId: fp?.visitorId,
          fingerprintMetadata: fp?.components,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Erreur')
        addAgentMessage('Hmm, problème avec cet email. Réessaie.')
        setStep('email')
        return
      }

      addAgentMessage('Code envoyé ! Entre-le pour activer ton agent.')
      setStep('otp')
    } catch (err) {
      console.error('Send OTP error:', err)
      addAgentMessage('Erreur de connexion. Réessaie.')
      setStep('email')
    } finally {
      setLoading(false)
    }
  }

  // Vérification OTP
  const handleOTPSubmit = async (otp: string) => {
    setLoading(true)
    setError(null)
    setStep('verifying')
    
    addAgentMessage('Vérification...')

    try {
      const supabase = createClient()
      
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      })

      if (verifyError || !data.user) {
        setError('Code incorrect')
        addAgentMessage('Code incorrect. Vérifie et réessaie.')
        setStep('otp')
        return
      }

      // Transférer le profil visiteur
      if (sessionId) {
        await fetch('/api/agent/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            userId: data.user.id
          }),
        })
      }

      setStep('success')
      addAgentMessage('Parfait ! Ton agent est activé. 🎉')
      
      // Callback pour basculer vers le dashboard
      setTimeout(() => {
        onAuthenticated()
      }, 1500)

    } catch (err) {
      console.error('Verify OTP error:', err)
      addAgentMessage('Erreur. Réessaie.')
      setStep('otp')
    } finally {
      setLoading(false)
    }
  }

  // Renvoi du code
  const handleResendOTP = async () => {
    setLoading(true)
    addAgentMessage('Je renvoie un code...')

    try {
      const fp = fingerprint || await getFingerprint()
      
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: email,
          fingerprintId: fp?.visitorId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        addAgentMessage('Nouveau code envoyé !')
      } else {
        addAgentMessage('Erreur. Réessaie plus tard.')
      }
    } catch {
      addAgentMessage('Erreur de connexion.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0f]">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-900/20 via-transparent to-purple-900/20" />
      
      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <Image
            src="/logo.svg"
            alt={BRAND.name}
            width={48}
            height={48}
            className="mx-auto mb-4"
          />
          <h1 className="text-xl font-semibold text-white">Activer mon agent</h1>
        </div>

        {/* Chat container */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          {/* Messages */}
          <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto chat-scrollbar">
            {messages.map((message) => (
              <MessageBubble 
                key={message.id} 
                content={message.content} 
                isAgent={message.role === 'assistant'} 
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-4 border-t border-white/10">
            {step === 'email' && (
              <EmailForm onSubmit={handleEmailSubmit} disabled={loading} />
            )}
            
            {step === 'otp' && (
              <OTPForm 
                onSubmit={handleOTPSubmit} 
                onResend={handleResendOTP}
                disabled={loading} 
                email={email}
              />
            )}
            
            {(step === 'sending' || step === 'verifying') && (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
              </div>
            )}
            
            {step === 'success' && (
              <div className="text-center py-4">
                <p className="text-green-400 text-sm">Redirection en cours...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

