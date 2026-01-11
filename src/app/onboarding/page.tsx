'use client'

/**
 * Page /onboarding - Redirection vers /agent
 * 
 * Cette page a été fusionnée avec /agent.
 * Redirection automatique pour maintenir la compatibilité.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/agent')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/50 text-sm">Redirection...</p>
      </div>
    </div>
  )
}
