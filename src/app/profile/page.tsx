'use client'

/**
 * Page Profil & Paramètres - Gestion du compte utilisateur
 * 
 * Design: Light mode avec esthétique moderne et épurée
 * Fonctionnalités:
 * - Affichage et édition du profil (nom, prénom, avatar)
 * - Personnalisation de l'agent IA (nom, genre, ton)
 * - Informations de parrainage (code, nombre de filleuls)
 * - Actions de compte (déconnexion, suppression)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { BRAND, getReferralLink } from '@/config/brand'
import { createClient } from '@/lib/supabase/client'

// ============================================================================
// TYPES
// ============================================================================

interface ProfileData {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: 'individual' | 'professional'
  avatar_url: string | null
  created_at: string
  updated_at: string
}

interface ReferralData {
  code: string | null
  referrals_count: number
}

interface WalletData {
  total_credits: number
}

interface AgentData {
  name: string
  gender: 'masculin' | 'feminin' | 'neutre'
  tone: 'professionnel' | 'amical' | 'formel' | 'decontracte'
  is_default: boolean
}

// ============================================================================
// ICÔNES SVG
// ============================================================================

const UserIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
    <path d="M20 21c0-4.418-3.582-8-8-8s-8 3.582-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const EditIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CopyIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const CheckIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const UsersIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const WalletIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 4H3a2 2 0 00-2 2v12a2 2 0 002 2h18a2 2 0 002-2V6a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="17" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const LogoutIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const TrashIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CameraIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const BotIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="8" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="9" cy="14" r="2" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="15" cy="14" r="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 2v4M8 4h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const SparklesIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3v2m0 14v2M5.636 5.636l1.414 1.414m9.9 9.9l1.414 1.414M3 12h2m14 0h2M5.636 18.364l1.414-1.414m9.9-9.9l1.414-1.414" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function ProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // États - Profil
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [referral, setReferral] = useState<ReferralData | null>(null)
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // États - Agent IA
  const [agent, setAgent] = useState<AgentData | null>(null)
  const [isEditingAgent, setIsEditingAgent] = useState(false)
  const [savingAgent, setSavingAgent] = useState(false)
  const [agentForm, setAgentForm] = useState({
    name: '',
    gender: 'neutre' as 'masculin' | 'feminin' | 'neutre',
    tone: 'professionnel' as 'professionnel' | 'amical' | 'formel' | 'decontracte',
  })
  
  // Formulaire d'édition profil
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    role: 'individual' as 'individual' | 'professional',
  })

  // Client Supabase pour les actions browser
  const supabase = createClient()

  // Charge les données du profil
  const loadProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/profile')
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/login')
          return
        }
        throw new Error('Erreur chargement profil')
      }
      
      const data = await response.json()
      setProfile(data.profile)
      setReferral(data.referral)
      setWallet(data.wallet)
      setEditForm({
        first_name: data.profile.first_name || '',
        last_name: data.profile.last_name || '',
        role: data.profile.role,
      })
    } catch (error) {
      console.error('Erreur chargement profil:', error)
      setMessage({ type: 'error', text: 'Erreur lors du chargement du profil' })
    }
  }, [router])

  // Charge les données de l'agent IA
  const loadAgent = useCallback(async () => {
    try {
      const response = await fetch('/api/user-agent')
      if (!response.ok) throw new Error('Erreur chargement agent')
      
      const data = await response.json()
      setAgent(data.agent)
      setAgentForm({
        name: data.agent.name || '',
        gender: data.agent.gender || 'neutre',
        tone: data.agent.tone || 'professionnel',
      })
    } catch (error) {
      console.error('Erreur chargement agent:', error)
    }
  }, [])

  useEffect(() => {
    Promise.all([loadProfile(), loadAgent()]).finally(() => setLoading(false))
  }, [loadProfile, loadAgent])

  // Sauvegarde les modifications du profil
  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: editForm.first_name || null,
          last_name: editForm.last_name || null,
          role: editForm.role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }

      setProfile(data.profile)
      setIsEditing(false)
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès' })
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Erreur lors de la sauvegarde' })
    } finally {
      setSaving(false)
    }
  }

  // Sauvegarde les modifications de l'agent
  const handleSaveAgent = async () => {
    setSavingAgent(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/user-agent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentForm),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }

      setAgent(data.agent)
      setIsEditingAgent(false)
      setMessage({ type: 'success', text: 'Agent IA personnalisé avec succès' })
    } catch (error) {
      console.error('Erreur sauvegarde agent:', error)
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Erreur lors de la sauvegarde' })
    } finally {
      setSavingAgent(false)
    }
  }

  // Copie le lien de parrainage
  const handleCopyReferralLink = async () => {
    if (!referral?.code) return
    
    try {
      await navigator.clipboard.writeText(getReferralLink(referral.code))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Erreur copie:', error)
    }
  }

  // Déconnexion
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // Suppression du compte
  const handleDeleteAccount = async () => {
    setDeleting(true)
    
    try {
      const response = await fetch('/api/profile', { method: 'DELETE' })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Erreur suppression:', error)
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Erreur lors de la suppression' })
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  // Upload d'avatar
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !profile) return

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner une image' })
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'L\'image ne doit pas dépasser 2 Mo' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}_${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw new Error(uploadError.message)

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: publicUrl }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erreur lors de la mise à jour')

      setProfile(data.profile)
      setMessage({ type: 'success', text: 'Avatar mis à jour' })
    } catch (error) {
      console.error('Erreur upload avatar:', error)
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Erreur lors de l\'upload' })
    } finally {
      setSaving(false)
    }
  }

  // Formatage de la date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  // Labels pour le genre de l'agent
  const genderLabels = {
    masculin: 'Masculin',
    feminin: 'Féminin',
    neutre: 'Neutre',
  }

  // Labels pour le ton de l'agent
  const toneLabels = {
    professionnel: 'Professionnel',
    amical: 'Amical',
    formel: 'Formel',
    decontracte: 'Décontracté',
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border border-violet-200" />
            <div className="absolute inset-0 rounded-full border border-transparent border-t-violet-500 animate-spin" />
          </div>
          <p className="text-gray-500 text-sm animate-pulse">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      {/* Background decoratif */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-100/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-pink-100/50 rounded-full blur-[100px]" />
      </div>

      {/* Header sticky */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
        <div className="container-main py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 group">
              <img src="/logo.svg" alt={BRAND.name} className="w-7 h-7" />
              <span className="text-sm font-semibold text-gray-900">{BRAND.name}</span>
            </a>
            <div className="h-4 w-px bg-gray-200" />
            <span className="text-gray-500 text-xs">Profil & Paramètres</span>
          </div>
          <a href="/agent" className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Retour</span>
          </a>
        </div>
      </header>

      <main className="relative container-main py-6 md:py-8 max-w-2xl">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-3 rounded-xl animate-fade-in-up ${
            message.type === 'success' 
              ? 'bg-emerald-50 border border-emerald-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <p className={`text-sm ${message.type === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
                {message.text}
              </p>
              <button 
                onClick={() => setMessage(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-black/5 rounded-lg"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ================================================================
            SECTION 1: INFORMATIONS PERSONNELLES
            ================================================================ */}
        <section className="mb-6 animate-fade-in-up">
          <h2 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-violet-500" />
            Informations personnelles
          </h2>
          
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-pink-50" />
            
            <div className="relative p-5 md:p-6 border border-gray-200 rounded-2xl bg-white/60 backdrop-blur-sm shadow-sm">
              <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* Avatar */}
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-100 to-pink-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-lg">
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={saving}
                    className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    <CameraIcon className="w-6 h-6 text-white" />
                  </button>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>

                {/* Infos */}
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-xl font-semibold text-gray-900 mb-1">
                    {profile?.first_name && profile?.last_name 
                      ? `${profile.first_name} ${profile.last_name}`
                      : profile?.email?.split('@')[0] || 'Utilisateur'
                    }
                  </h1>
                  <p className="text-gray-500 text-sm mb-2">{profile?.email}</p>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                      profile?.role === 'professional' 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}>
                      {profile?.role === 'professional' ? 'Professionnel' : 'Particulier'}
                    </span>
                    <span className="text-gray-400 text-[10px]">
                      Membre depuis {profile?.created_at ? formatDate(profile.created_at) : '—'}
                    </span>
                  </div>
                </div>

                {/* Bouton éditer */}
                {!isEditing && (
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="gap-1.5 h-9 text-xs"
                  >
                    <EditIcon className="w-3.5 h-3.5" />
                    Modifier
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Section Édition Profil */}
        {isEditing && (
          <section className="mb-6 animate-fade-in-up">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Modifier le profil</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-500 text-xs mb-1.5">Prénom</label>
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    placeholder="Votre prénom"
                    className="w-full px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 text-xs mb-1.5">Nom</label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    placeholder="Votre nom"
                    className="w-full px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 text-xs mb-1.5">Type de compte</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, role: 'individual' })}
                      className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        editForm.role === 'individual'
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      Particulier
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, role: 'professional' })}
                      className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        editForm.role === 'professional'
                          ? 'bg-blue-100 text-blue-700 border border-blue-300'
                          : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      Professionnel
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => {
                      setIsEditing(false)
                      setEditForm({
                        first_name: profile?.first_name || '',
                        last_name: profile?.last_name || '',
                        role: profile?.role || 'individual',
                      })
                    }}
                    className="flex-1 h-10"
                  >
                    Annuler
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 h-10"
                  >
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================================================================
            SECTION 2: MON AGENT IA
            ================================================================ */}
        <section className="mb-6 animate-fade-in-up stagger-1">
          <h2 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <BotIcon className="w-4 h-4 text-violet-500" />
            Mon Agent IA
          </h2>
          
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            {!isEditingAgent ? (
              /* Affichage agent */
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar Agent */}
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg">
                      <SparklesIcon className="w-7 h-7 text-white" />
                    </div>
                    
                    <div>
                      <p className="text-base font-semibold text-gray-900 mb-1">
                        {agent?.name || 'Assistant'}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-violet-100 text-violet-700 border border-violet-200">
                          {agent?.gender ? genderLabels[agent.gender] : 'Neutre'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-pink-100 text-pink-700 border border-pink-200">
                          {agent?.tone ? toneLabels[agent.tone] : 'Professionnel'}
                        </span>
                        {agent?.is_default && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                            Par défaut
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => setIsEditingAgent(true)}
                    className="gap-1.5 h-9 text-xs flex-shrink-0"
                  >
                    <EditIcon className="w-3.5 h-3.5" />
                    Personnaliser
                  </Button>
                </div>
                
                <p className="text-gray-500 text-xs mt-4 pt-4 border-t border-gray-100">
                  Personnalisez votre agent IA pour qu&apos;il corresponde à vos préférences de communication.
                </p>
              </div>
            ) : (
              /* Formulaire édition agent */
              <div className="p-5">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Personnaliser l&apos;agent</h3>
                
                <div className="space-y-4">
                  {/* Nom de l'agent */}
                  <div>
                    <label className="block text-gray-500 text-xs mb-1.5">Nom de l&apos;agent</label>
                    <input
                      type="text"
                      value={agentForm.name}
                      onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                      placeholder="Ex: Alex, Luna, Max..."
                      maxLength={30}
                      className="w-full px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all outline-none"
                    />
                  </div>

                  {/* Genre */}
                  <div>
                    <label className="block text-gray-500 text-xs mb-1.5">Genre</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['masculin', 'feminin', 'neutre'] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setAgentForm({ ...agentForm, gender: g })}
                          className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            agentForm.gender === g
                              ? 'bg-violet-100 text-violet-700 border border-violet-300'
                              : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {genderLabels[g]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ton */}
                  <div>
                    <label className="block text-gray-500 text-xs mb-1.5">Ton de communication</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['professionnel', 'amical', 'formel', 'decontracte'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setAgentForm({ ...agentForm, tone: t })}
                          className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            agentForm.tone === t
                              ? 'bg-pink-100 text-pink-700 border border-pink-300'
                              : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {toneLabels[t]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => {
                        setIsEditingAgent(false)
                        setAgentForm({
                          name: agent?.name || '',
                          gender: agent?.gender || 'neutre',
                          tone: agent?.tone || 'professionnel',
                        })
                      }}
                      className="flex-1 h-10"
                    >
                      Annuler
                    </Button>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={handleSaveAgent}
                      disabled={savingAgent || !agentForm.name.trim()}
                      className="flex-1 h-10"
                    >
                      {savingAgent ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ================================================================
            SECTION 3: PARRAINAGE
            ================================================================ */}
        <section className="mb-6 animate-fade-in-up stagger-2">
          <h2 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <UsersIcon className="w-4 h-4 text-violet-500" />
            Parrainage
          </h2>
          
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            {/* Code de parrainage */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-[10px] mb-1">Votre code de parrainage</p>
                  <p className="text-lg font-mono font-semibold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
                    {referral?.code || '—'}
                  </p>
                </div>
                {referral?.code && (
                  <button
                    onClick={handleCopyReferralLink}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs text-emerald-600">Copié !</span>
                      </>
                    ) : (
                      <>
                        <CopyIcon className="w-4 h-4" />
                        <span className="text-xs">Copier le lien</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Stats filleuls */}
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="text-gray-400 text-[10px]">Filleuls directs</p>
                <p className="text-xl font-semibold text-gray-900">{referral?.referrals_count || 0}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            SECTION 4: ACTIONS RAPIDES
            ================================================================ */}
        <section className="mb-6 animate-fade-in-up stagger-3">
          <h2 className="text-sm font-medium text-gray-900 mb-3">Actions rapides</h2>
          
          <div className="grid gap-2">
            {/* Wallet */}
            <a 
              href="/wallet"
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors group shadow-sm"
            >
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <WalletIcon className="w-5 h-5 text-violet-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Mon wallet</p>
                <p className="text-gray-500 text-xs">{wallet?.total_credits || 0} crédits disponibles</p>
              </div>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>

            {/* Déconnexion */}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors group text-left shadow-sm"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <LogoutIcon className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Se déconnecter</p>
                <p className="text-gray-500 text-xs">Fermer la session</p>
              </div>
            </button>
          </div>
        </section>

        {/* ================================================================
            SECTION 5: ZONE DANGER
            ================================================================ */}
        <section className="animate-fade-in-up stagger-4">
          <h2 className="text-sm font-medium text-red-600 mb-3">Zone de danger</h2>
          
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <TrashIcon className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">Supprimer mon compte</p>
                <p className="text-gray-600 text-xs mb-3">
                  Cette action est irréversible. Toutes vos données seront définitivement supprimées.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowDeleteModal(true)}
                  className="border-red-300 text-red-600 hover:bg-red-100 hover:border-red-400 h-8 text-xs"
                >
                  Supprimer mon compte
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-gray-400 text-[10px]">
            {BRAND.copyright}
          </p>
        </div>
      </main>

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !deleting && setShowDeleteModal(false)}
          />
          
          <div className="relative w-full max-w-sm rounded-2xl border border-red-200 bg-white p-6 animate-scale-in shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <TrashIcon className="w-7 h-7 text-red-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Supprimer votre compte ?
              </h3>
              
              <p className="text-gray-600 text-sm mb-6">
                Cette action est <span className="text-red-600 font-medium">irréversible</span>. 
                Toutes vos données, crédits et historique seront définitivement supprimés.
              </p>
              
              <div className="flex gap-3 w-full">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1 h-10"
                >
                  Annuler
                </Button>
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 h-10 bg-red-500 hover:bg-red-600 border-red-500"
                >
                  {deleting ? 'Suppression...' : 'Supprimer'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
