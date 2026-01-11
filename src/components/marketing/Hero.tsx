'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Zap, Shield, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ChatMockup } from '@/components/ui/ChatMockup';

export function Hero() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
    });
  }, []);

  const scrollToHowItWorks = () => {
    const element = document.getElementById('fonctionnement');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center pt-28 pb-20 overflow-hidden">
      {/* Background Effects */}
      <div className="hero-gradient" />
      <div className="grid-pattern" />

      {/* Content */}
      <div className="container-main relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Text Content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] mb-8 animate-fade-in">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-[var(--brand-violet)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--brand-violet)]"></span>
              </span>
              <span className="text-sm font-medium text-[var(--text-secondary)]">
                Marketplace conversationnelle IA
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6 animate-fade-in-up stagger-1">
              <span className="text-[var(--text-primary)]">Achetez, vendez,</span>
              <br />
              <span className="text-gradient">en conversant.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-xl mx-auto lg:mx-0 mb-8 animate-fade-in-up stagger-2 leading-relaxed">
              L&apos;IA négocie pour vous, trouve les meilleures offres et connecte acheteurs et vendeurs. Dites simplement ce que vous cherchez.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up stagger-3">
              {isAuthenticated ? (
                <Link
                  href="/agent"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white rounded-full bg-gradient-to-r from-[var(--brand-violet)] to-[var(--brand-purple)] hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl btn-glow"
                >
                  Accéder à mon Agent
                  <ArrowRight size={20} />
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white rounded-full bg-gradient-to-r from-[var(--brand-violet)] to-[var(--brand-purple)] hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl btn-glow"
                >
                  <Sparkles size={18} />
                  Se connecter
                </Link>
              )}
              <button
                onClick={scrollToHowItWorks}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-[var(--text-primary)] rounded-full bg-white border border-[var(--border-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-hover)] transition-all duration-200 shadow-sm"
              >
                Voir comment ça marche
              </button>
            </div>

            {/* Micro-proof */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mt-10 animate-fade-in-up stagger-4">
              <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
                <Zap size={16} className="text-[var(--brand-violet)]" />
                <span>10 crédits gratuits offerts</span>
              </div>
              <div className="hidden sm:block w-1 h-1 rounded-full bg-[var(--text-muted)]" />
              <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
                <Shield size={16} className="text-[var(--brand-violet)]" />
                <span>Inscription sécurisée</span>
              </div>
              <div className="hidden sm:block w-1 h-1 rounded-full bg-[var(--text-muted)]" />
              <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
                <Users size={16} className="text-[var(--brand-violet)]" />
                <span>Agent IA personnel</span>
              </div>
            </div>
          </div>

          {/* Right Column - Chat Mockup */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end animate-fade-in-up stagger-2">
            <div className="relative">
              {/* Glow effect behind the chat */}
              <div className="absolute -inset-4 bg-gradient-to-r from-[var(--brand-violet)]/20 via-[var(--brand-purple)]/15 to-[var(--brand-pink)]/20 rounded-3xl blur-2xl opacity-60" />
              <ChatMockup className="relative animate-float" />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 animate-fade-in stagger-5">
        <span className="text-xs text-[var(--text-muted)] uppercase tracking-widest">Découvrir</span>
        <div className="w-5 h-9 rounded-full border-2 border-[var(--border-primary)] flex items-start justify-center p-1.5">
          <div className="w-1 h-2.5 rounded-full bg-[var(--brand-violet)] animate-subtle-pulse" />
        </div>
      </div>
    </section>
  );
}

export default Hero;
