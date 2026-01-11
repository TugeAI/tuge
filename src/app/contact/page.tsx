'use client';

import { Navbar, Footer } from '@/components/marketing';
import { BRAND } from '@/config/brand';
import { Mail, MessageSquare, Send } from 'lucide-react';
import { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    // Simuler l'envoi (à remplacer par une vraie API)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // TODO: Implémenter l'envoi réel via API
      console.log('Form data:', formData);
      
      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (_error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 bg-[var(--bg-secondary)]">
        <div className="container-main max-w-6xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
              Contactez-nous
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              Une question, une suggestion ou besoin d&apos;aide ? Notre équipe est là pour vous accompagner.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Formulaire de contact */}
            <div className="card-premium p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--brand-violet)] to-[var(--brand-purple)] flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                  Envoyez-nous un message
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Nom */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-violet)] focus:ring-2 focus:ring-[var(--brand-violet)] focus:ring-opacity-20 transition-all"
                    placeholder="Jean Dupont"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Adresse email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-violet)] focus:ring-2 focus:ring-[var(--brand-violet)] focus:ring-opacity-20 transition-all"
                    placeholder="jean.dupont@exemple.fr"
                  />
                </div>

                {/* Sujet */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Sujet *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-violet)] focus:ring-2 focus:ring-[var(--brand-violet)] focus:ring-opacity-20 transition-all"
                  >
                    <option value="">Sélectionnez un sujet</option>
                    <option value="support">Support technique</option>
                    <option value="billing">Questions de facturation</option>
                    <option value="feature">Suggestion de fonctionnalité</option>
                    <option value="partnership">Partenariat</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-violet)] focus:ring-2 focus:ring-[var(--brand-violet)] focus:ring-opacity-20 transition-all resize-none"
                    placeholder="Décrivez votre demande en détail..."
                  />
                </div>

                {/* Status messages */}
                {submitStatus === 'success' && (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 text-sm">
                    ✓ Message envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.
                  </div>
                )}
                {submitStatus === 'error' && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
                    ✗ Une erreur est survenue. Veuillez réessayer ou nous contacter directement par email.
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-3.5 rounded-lg bg-gradient-to-r from-[var(--brand-violet)] to-[var(--brand-purple)] text-white font-semibold hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 btn-glow"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Envoyer le message</span>
                    </>
                  )}
                </button>

                <p className="text-xs text-[var(--text-muted)] text-center">
                  En soumettant ce formulaire, vous acceptez notre{' '}
                  <a href="/confidentialite" className="text-[var(--brand-violet)] hover:underline">
                    politique de confidentialité
                  </a>.
                </p>
              </form>
            </div>

            {/* Informations de contact */}
            <div className="space-y-6">
              {/* Email direct */}
              <div className="card-premium p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--brand-violet)] to-[var(--brand-purple)] flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                      Email direct
                    </h3>
                    <p className="text-[var(--text-secondary)] mb-3 text-sm">
                      Pour toute question urgente ou spécifique, contactez-nous directement par email.
                    </p>
                    <a
                      href={`mailto:${BRAND.supportEmail}`}
                      className="inline-flex items-center gap-2 text-[var(--brand-violet)] hover:text-[var(--brand-violet-light)] font-medium transition-colors"
                    >
                      {BRAND.supportEmail}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* FAQ */}
              <div className="card-premium p-6 border-gradient">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
                  Besoin d&apos;une réponse rapide ?
                </h3>
                <p className="text-[var(--text-secondary)] mb-4 text-sm">
                  Consultez notre FAQ pour trouver des réponses aux questions les plus fréquentes.
                </p>
                <a
                  href="/#faq"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border-primary)] hover:border-[var(--brand-violet)] text-[var(--text-primary)] hover:text-[var(--brand-violet)] font-medium transition-all"
                >
                  Voir la FAQ
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>

              {/* Horaires */}
              <div className="card-premium p-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
                  Temps de réponse
                </h3>
                <div className="space-y-3 text-sm text-[var(--text-secondary)]">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[var(--brand-violet)] mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">Questions générales</p>
                      <p>Réponse sous 24-48 heures</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[var(--brand-violet)] mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">Support technique</p>
                      <p>Réponse sous 24 heures</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[var(--brand-violet)] mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">Urgences</p>
                      <p>Réponse prioritaire</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Réseaux sociaux */}
              <div className="card-premium p-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
                  Suivez-nous
                </h3>
                <p className="text-[var(--text-secondary)] mb-4 text-sm">
                  Restez informé de nos actualités et nouveautés.
                </p>
                <div className="flex gap-3">
                  <a
                    href={BRAND.social.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg border border-[var(--border-primary)] hover:border-[var(--brand-violet)] hover:bg-[var(--brand-violet)] hover:bg-opacity-10 flex items-center justify-center transition-all"
                    aria-label="Twitter"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                  <a
                    href={BRAND.social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg border border-[var(--border-primary)] hover:border-[var(--brand-violet)] hover:bg-[var(--brand-violet)] hover:bg-opacity-10 flex items-center justify-center transition-all"
                    aria-label="LinkedIn"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                  <a
                    href={BRAND.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg border border-[var(--border-primary)] hover:border-[var(--brand-violet)] hover:bg-[var(--brand-violet)] hover:bg-opacity-10 flex items-center justify-center transition-all"
                    aria-label="Instagram"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}


