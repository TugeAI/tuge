import { Suspense } from 'react';
import { SignupForm } from '@/components/auth/SignupForm';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inscription | Tuge AI',
  description: 'Créez votre compte Tuge AI et activez votre Agent IA personnel en quelques secondes.',
};

function SignupPageContent() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-secondary)] relative overflow-hidden">
      {/* Background gradient animé */}
      <div className="hero-gradient" />
      
      {/* Blobs décoratifs animés */}
      <div className="absolute top-20 -left-20 w-72 h-72 bg-[var(--brand-violet)]/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 -right-20 w-96 h-96 bg-[var(--brand-pink)]/10 rounded-full blur-3xl animate-pulse animation-delay-1000" />
      
      {/* Grid pattern subtle */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, var(--text-primary) 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Logo avec animation */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-[var(--brand-violet)]/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
              <Image
                src="/logo.svg"
                alt="Tuge AI"
                width={48}
                height={48}
                className="relative transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
              />
            </div>
            <span className="text-2xl font-bold text-[var(--text-primary)]">
              Tuge<span className="bg-gradient-to-r from-[var(--brand-violet)] to-[var(--brand-pink)] bg-clip-text text-transparent"> AI</span>
            </span>
          </Link>
        </div>

        {/* Card avec glassmorphism */}
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[var(--brand-violet)] via-[var(--brand-purple)] to-[var(--brand-pink)] rounded-3xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity" />
          
          <div className="relative bg-[var(--bg-elevated)]/80 backdrop-blur-xl border border-[var(--border-primary)] rounded-3xl p-8 shadow-2xl">
            {/* Title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--brand-violet)] to-[var(--brand-purple)] mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3">
                Créer un compte
              </h1>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Rejoignez Tuge AI et activez votre assistant personnel intelligent
              </p>
            </div>

            {/* Form */}
            <SignupForm />
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-[var(--text-tertiary)] hover:text-[var(--brand-violet)] transition-colors inline-flex items-center gap-2 group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Retour à l&apos;accueil</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)]">
          <div className="w-10 h-10 border-2 border-[var(--brand-violet-light)] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SignupPageContent />
    </Suspense>
  );
}
