'use client';

import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';

const plans = [
  {
    name: 'Gratuit',
    price: '0€',
    period: '/mois',
    description: 'Pour découvrir la plateforme et la communauté.',
    features: [
      'Accès à la communauté',
      'Profil et offres de base',
      'Agent IA limité',
      'Parrainage activé',
    ],
    cta: 'Commencer gratuitement',
    popular: false,
  },
  {
    name: 'Premium',
    price: '29€',
    period: '/mois',
    description: 'Pour ceux qui veulent passer à l\'action avec l\'IA.',
    features: [
      'Tout le plan Gratuit',
      'Agent IA avancé illimité',
      'Actions automatisées',
      'Priorité sur la visibilité',
      'Outils de prospection',
      'Support prioritaire',
    ],
    cta: 'Activer mon Agent IA',
    popular: true,
  },
];

export function Pricing() {
  return (
    <section id="tarifs" className="section-padding bg-[var(--bg-secondary)]">
      <div className="container-main">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-6">
            Un tarif simple,{' '}
            <span className="text-gradient">sans surprise.</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)]">
            Commence gratuitement, passe à la vitesse supérieure quand tu es prêt.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative p-8 rounded-3xl transition-all duration-300 ${
                plan.popular
                  ? 'bg-[var(--bg-elevated)] border-2 border-[var(--brand-violet)] shadow-xl'
                  : 'bg-[var(--bg-elevated)] border border-[var(--border-primary)]'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[var(--brand-violet)] to-[var(--brand-purple)] text-white text-sm font-medium">
                  <Sparkles size={14} />
                  Recommandé
                </div>
              )}

              {/* Plan Info */}
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1 mb-3">
                  <span className="text-4xl font-bold text-[var(--text-primary)]">
                    {plan.price}
                  </span>
                  <span className="text-[var(--text-muted)]">{plan.period}</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  {plan.description}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 flex items-center justify-center rounded-full shrink-0 mt-0.5 ${
                        plan.popular
                          ? 'bg-[var(--brand-violet)] text-white'
                          : 'bg-[var(--bg-tertiary)] text-[var(--brand-violet)]'
                      }`}
                    >
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="text-[var(--text-secondary)]">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/auth/login"
                className={`block w-full py-4 px-6 rounded-xl font-semibold text-center transition-all duration-200 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-[var(--brand-violet)] to-[var(--brand-purple)] text-white hover:opacity-90 shadow-lg btn-glow'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-primary)]'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Pricing;
