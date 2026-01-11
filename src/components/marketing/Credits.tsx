'use client';

import { Gift, Zap, Crown, Rocket, Check, Sparkles } from 'lucide-react';

const creditPacks = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 50,
    price: 4.99,
    icon: Zap,
    popular: false,
    description: 'Idéal pour découvrir',
    features: ['50 crédits', 'Valables 30 jours', 'Support email'],
  },
  {
    id: 'popular',
    name: 'Populaire',
    credits: 200,
    price: 14.99,
    icon: Crown,
    popular: true,
    description: 'Le plus choisi',
    features: ['200 crédits', 'Valables 60 jours', 'Support prioritaire', '+20 crédits bonus'],
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 500,
    price: 29.99,
    icon: Rocket,
    popular: false,
    description: 'Pour les power users',
    features: ['500 crédits', 'Valables 90 jours', 'Support dédié', '+100 crédits bonus'],
  },
];

export function Credits() {
  return (
    <section id="credits" className="section-padding bg-[var(--bg-secondary)]">
      <div className="container-main">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--brand-violet)]/10 text-[var(--brand-violet)] text-sm font-medium mb-6">
            <Gift size={16} />
            <span>Système de crédits</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-6">
            10 crédits <span className="text-gradient">gratuits</span> chaque jour
          </h2>
          <p className="text-lg text-[var(--text-secondary)]">
            Utilisez vos crédits pour interagir avec l&apos;IA. Rechargez quand vous en avez besoin.
          </p>
        </div>

        {/* Daily Credits Showcase */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="relative p-8 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-3xl overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-violet)]/5 via-transparent to-[var(--brand-pink)]/5" />
            
            <div className="relative">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--brand-violet)] to-[var(--brand-purple)] flex items-center justify-center shadow-lg">
                    <Sparkles size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--text-primary)]">Crédits quotidiens</h3>
                    <p className="text-sm text-[var(--text-tertiary)]">Renouvelés chaque jour à minuit</p>
                  </div>
                </div>
                <div className="px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 text-sm font-semibold">
                  GRATUIT
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--text-secondary)]">Crédits disponibles</span>
                  <span className="text-sm font-bold text-[var(--brand-violet)]">10 / 10</span>
                </div>
                <div className="h-4 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-[var(--brand-violet)] via-[var(--brand-purple)] to-[var(--brand-pink)] transition-all duration-1000 ease-out"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Info */}
              <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>1 crédit = 1 interaction avec l&apos;Agent IA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Credit Packs */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {creditPacks.map((pack) => (
            <div
              key={pack.id}
              className={`relative p-6 rounded-3xl transition-all duration-300 card-hover ${
                pack.popular
                  ? 'bg-[var(--bg-elevated)] border-2 border-[var(--brand-violet)] shadow-xl'
                  : 'bg-[var(--bg-elevated)] border border-[var(--border-primary)]'
              }`}
            >
              {/* Popular Badge */}
              {pack.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[var(--brand-violet)] to-[var(--brand-purple)] text-white text-sm font-medium shadow-lg">
                  <Sparkles size={14} />
                  Recommandé
                </div>
              )}

              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${
                pack.popular
                  ? 'bg-gradient-to-br from-[var(--brand-violet)] to-[var(--brand-purple)] text-white shadow-lg'
                  : 'bg-[var(--bg-tertiary)] text-[var(--brand-violet)]'
              }`}>
                <pack.icon size={28} />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">{pack.name}</h3>
              <p className="text-sm text-[var(--text-tertiary)] mb-4">{pack.description}</p>

              {/* Price */}
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-[var(--text-primary)]">{pack.price}€</span>
                <span className="text-[var(--text-muted)]">/ {pack.credits} crédits</span>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {pack.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      pack.popular
                        ? 'bg-[var(--brand-violet)] text-white'
                        : 'bg-[var(--bg-tertiary)] text-[var(--brand-violet)]'
                    }`}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-[var(--text-secondary)]">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                className={`w-full py-3.5 px-6 rounded-xl font-semibold text-center transition-all duration-200 ${
                  pack.popular
                    ? 'bg-gradient-to-r from-[var(--brand-violet)] to-[var(--brand-purple)] text-white hover:opacity-90 shadow-lg btn-glow'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-primary)]'
                }`}
              >
                Acheter {pack.credits} crédits
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Credits;


