'use client';

import { Search, Network, Lightbulb } from 'lucide-react';

const pillars = [
  {
    icon: Search,
    title: 'Visibilité & opportunités',
    description:
      'Augmente ta présence en ligne. Sois trouvé par ceux qui te cherchent. L\'IA optimise ton profil et tes offres pour maximiser ta visibilité.',
    color: 'var(--brand-violet)',
    gradient: 'from-[#6d28d9] to-[#8b5cf6]',
  },
  {
    icon: Network,
    title: 'MLM = émancipation collective',
    description:
      'Un modèle de parrainage transparent où chacun profite de la croissance du réseau. Créer de la richesse ensemble, pas les uns contre les autres.',
    color: 'var(--brand-purple)',
    gradient: 'from-[#c084fc] to-[#d8b4fe]',
  },
  {
    icon: Lightbulb,
    title: 'Accompagnement des entrepreneurs',
    description:
      'Structure, méthode, actions. L\'Agent IA te guide pas à pas et exécute avec toi. Tu n\'es plus jamais seul face à tes décisions.',
    color: 'var(--brand-pink)',
    gradient: 'from-[#f472b6] to-[#ec4899]',
  },
];

export function Pillars() {
  return (
    <section className="section-padding">
      <div className="container-main">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-6">
            Une communauté. Un réseau.{' '}
            <span className="text-gradient">Une IA qui exécute.</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)]">
            Trois piliers pour transformer ta situation et te permettre d&apos;atteindre tes objectifs.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, index) => (
            <div
              key={index}
              className="group relative p-8 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-3xl transition-all duration-500 hover:border-[var(--border-accent)] card-hover overflow-hidden"
            >
              {/* Gradient Background on Hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${pillar.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`}
              />

              {/* Icon */}
              <div
                className="relative w-14 h-14 flex items-center justify-center rounded-2xl mb-6 transition-all duration-300"
                style={{
                  background: `linear-gradient(135deg, ${pillar.color}15, ${pillar.color}05)`,
                  color: pillar.color,
                }}
              >
                <pillar.icon size={28} strokeWidth={1.5} />
              </div>

              {/* Content */}
              <h3 className="relative text-xl font-bold text-[var(--text-primary)] mb-4">
                {pillar.title}
              </h3>
              <p className="relative text-[var(--text-secondary)] leading-relaxed">
                {pillar.description}
              </p>

              {/* Number Badge */}
              <div className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--bg-tertiary)] text-sm font-bold text-[var(--text-muted)]">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Pillars;







