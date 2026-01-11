'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import { finalCta } from '@/content/landing';

export function FinalCTA() {
  return (
    <section className="section-padding relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-[var(--glow-cyan)] opacity-10 blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-[var(--glow-lime)] opacity-10 blur-[150px]" />
        
        {/* Grid */}
        <div className="absolute inset-0 grid-perspective opacity-50" />
        
        {/* Top border */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-cyan)]/30 to-transparent" />
      </div>

      <div className="container-main relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Portal effect container */}
          <div className="relative mb-12">
            {/* Animated rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-[var(--accent-cyan)]/20 animate-pulse" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-[var(--accent-cyan)]/10" style={{ animation: 'pulse 3s ease-in-out infinite' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-[var(--accent-lime)]/5" style={{ animation: 'pulse 4s ease-in-out infinite' }} />
            
            {/* Central icon */}
            <div className="relative z-10 w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-lime)] flex items-center justify-center shadow-2xl shadow-[var(--glow-cyan)] animate-float">
              <PortalIcon />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-6 leading-tight">
            {finalCta.title}
          </h2>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-[var(--text-secondary)] mb-12 max-w-2xl mx-auto">
            {finalCta.subtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href={finalCta.primaryCta.href}>
              <Button size="lg" variant="neon" icon={<RocketIcon />} iconPosition="left" className="w-full sm:w-auto">
                {finalCta.primaryCta.label}
              </Button>
            </Link>
            <Link href={finalCta.secondaryCta.href}>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                {finalCta.secondaryCta.label}
              </Button>
            </Link>
          </div>

          {/* Social proof mini */}
          <div className="flex items-center justify-center gap-6">
            {/* Avatars */}
            <div className="flex -space-x-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--bg-tertiary)] to-[var(--bg-hover)] border-2 border-[var(--bg-primary)] flex items-center justify-center"
                  style={{ zIndex: 5 - i }}
                >
                  <UserIcon />
                </div>
              ))}
            </div>
            
            <div className="text-left">
              <div className="flex items-center gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} />
                ))}
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Rejoint par <span className="text-[var(--accent-cyan)] font-semibold">10,000+</span> utilisateurs
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PortalIcon() {
  return (
    <svg className="w-12 h-12 text-black" fill="currentColor" viewBox="0 0 24 24">
      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="w-4 h-4 text-[var(--accent-amber)]" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export default FinalCTA;
