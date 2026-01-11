'use client';

import { ShoppingBag, MapPin, Rocket, FileEdit, ArrowRight } from 'lucide-react';

const useCases = [
  {
    icon: ShoppingBag,
    quote: 'Je vends mes produits — aide-moi à faire mes premières ventes',
    description:
      'L\'Agent IA crée tes fiches produits, optimise tes annonces et te connecte aux bons acheteurs.',
    color: 'var(--brand-violet)',
  },
  {
    icon: MapPin,
    quote: 'Je propose un service — je veux être trouvé près de chez moi',
    description:
      'Il configure ta géolocalisation, améliore ton référencement local et met en avant ton expertise.',
    color: 'var(--brand-purple)',
  },
  {
    icon: Rocket,
    quote: 'Je démarre — je ne sais pas par où commencer',
    description:
      'Il te guide étape par étape, structure ton projet et te donne un plan d\'action clair.',
    color: 'var(--brand-pink)',
  },
  {
    icon: FileEdit,
    quote: 'Crée mon profil, mes offres et un plan d\'action',
    description:
      'En quelques minutes, tout est prêt. Tu n\'as plus qu\'à valider et commencer.',
    color: 'var(--brand-pink-dark)',
  },
];

export function UseCases() {
  return (
    <section className="section-padding bg-[var(--bg-secondary)]">
      <div className="container-main">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-6">
            Dis-lui ce que tu veux,{' '}
            <span className="text-gradient">il s&apos;en occupe.</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)]">
            Voici quelques exemples de ce que tu peux demander à ton Agent IA.
          </p>
        </div>

        {/* Use Cases Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className="group relative p-6 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-2xl transition-all duration-300 hover:border-[var(--border-accent)] hover:shadow-lg overflow-hidden"
            >
              {/* Quote */}
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0 transition-all duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${useCase.color}15, ${useCase.color}05)`,
                    color: useCase.color,
                  }}
                >
                  <useCase.icon size={20} />
                </div>
                <p className="text-[var(--text-primary)] font-medium italic leading-relaxed">
                  &ldquo;{useCase.quote}&rdquo;
                </p>
              </div>

              {/* Description */}
              <p className="text-sm text-[var(--text-secondary)] pl-14">
                {useCase.description}
              </p>

              {/* Arrow */}
              <div className="absolute bottom-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
                <ArrowRight size={16} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default UseCases;







