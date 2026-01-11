'use client';

import Link from 'next/link';
import { Button, Badge, TerminalMockup } from '@/components/ui';
import { hero } from '@/content/landing';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-28 pb-20 overflow-hidden">
      {/* Background Effects */}
      <div className="hero-gradient" />
      <div className="grid-perspective" />
      <div className="noise" />

      {/* Content */}
      <div className="container-main relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* Left Column - Text */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Badge */}
            <Badge
              variant="neon"
              className="mb-8 animate-fade-in"
              icon={<SparklesIcon />}
            >
              {hero.badge}
            </Badge>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight mb-8 animate-fade-in-up stagger-1">
              <span className="text-[var(--text-primary)]">L&apos;IA qui connecte</span>
              <br />
              <span className="text-gradient-cyan">vos besoins</span>
              <br />
              <span className="text-[var(--text-primary)]">à la bonne personne.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-xl mb-10 animate-fade-in-up stagger-2">
              {hero.subtitle}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fade-in-up stagger-3">
              <Link href={hero.primaryCta.href}>
                <Button 
                  size="lg" 
                  variant="neon"
                  icon={<ArrowIcon />}
                  iconPosition="right"
                  className="w-full sm:w-auto"
                >
                  {hero.primaryCta.label}
                </Button>
              </Link>
              <Link href={hero.secondaryCta.href}>
                <Button 
                  variant="ghost" 
                  size="lg" 
                  icon={<PlayIcon />}
                  iconPosition="left"
                  className="w-full sm:w-auto"
                >
                  {hero.secondaryCta.label}
                </Button>
              </Link>
            </div>

            {/* Mini Stats */}
            <div className="flex items-center gap-8 mt-12 animate-fade-in-up stagger-4">
              {hero.stats.map((stat, index) => (
                <div key={index} className="text-center lg:text-left">
                  <div className="text-2xl font-bold font-mono text-gradient-cyan">
                    {stat.value}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Terminal */}
          <div className="flex justify-center lg:justify-end animate-fade-in-up stagger-2">
            <div className="relative w-full max-w-lg">
              {/* Glow effect behind terminal */}
              <div 
                className="absolute inset-0 rounded-2xl opacity-40 blur-3xl"
                style={{
                  background: 'radial-gradient(circle at center, var(--glow-cyan) 0%, transparent 70%)',
                  transform: 'scale(1.1)',
                }}
              />
              
              {/* Floating badges */}
              <div className="absolute -top-4 -left-4 z-20 animate-float">
                <div className="px-3 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--accent-lime)]/30 shadow-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent-lime)] animate-pulse" />
                  <span className="text-xs font-mono text-[var(--accent-lime)]">En ligne</span>
                </div>
              </div>
              
              <div className="absolute -bottom-3 -right-3 z-20 animate-float" style={{ animationDelay: '1s' }}>
                <div className="px-3 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--accent-amber)]/30 shadow-lg flex items-center gap-2">
                  <BoltIcon />
                  <span className="text-xs font-mono text-[var(--accent-amber)]">47s</span>
                </div>
              </div>
              
              {/* Terminal */}
              <TerminalMockup
                commands={hero.terminalCommands}
                className="relative w-full shadow-2xl"
                autoPlay={true}
                typingSpeed={25}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 animate-fade-in stagger-5">
        <span className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-mono">Scroll</span>
        <div className="w-5 h-9 rounded-full border border-[var(--border-primary)] flex items-start justify-center p-1.5">
          <div className="w-1 h-2.5 rounded-full bg-[var(--accent-cyan)] animate-pulse" />
        </div>
      </div>
    </section>
  );
}

function SparklesIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg className="w-3 h-3 text-[var(--accent-amber)]" fill="currentColor" viewBox="0 0 24 24">
      <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

export default Hero;
