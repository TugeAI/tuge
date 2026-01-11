'use client';

import { UserX, Compass, Eye, Shuffle, Clock } from 'lucide-react';

const problems = [
  {
    icon: UserX,
    title: 'Solitude entrepreneuriale',
    description: 'Tu avances seul, sans soutien ni réseau pour t\'aider à progresser.',
  },
  {
    icon: Compass,
    title: 'Manque de méthode',
    description: 'Tu ne sais pas par où commencer ni comment structurer tes actions.',
  },
  {
    icon: Eye,
    title: 'Manque de visibilité',
    description: 'Tes offres existent mais personne ne les trouve.',
  },
  {
    icon: Shuffle,
    title: 'Dispersion',
    description: 'Tu t\'éparpilles entre trop d\'outils et de tâches sans priorité.',
  },
  {
    icon: Clock,
    title: 'Procrastination',
    description: 'Tu sais ce qu\'il faut faire mais tu repousses sans cesse.',
  },
];

export function Problem() {
  return (
    <section className="section-padding bg-[var(--bg-secondary)]">
      <div className="container-main">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-6">
            Le vrai blocage, c&apos;est{' '}
            <span className="text-gradient">le passage à l&apos;action.</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)]">
            Tu as des idées, des compétences, des envies. Mais quelque chose t&apos;empêche d&apos;avancer.
          </p>
        </div>

        {/* Problems Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {problems.map((problem, index) => (
            <div
              key={index}
              className="group p-6 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-2xl transition-all duration-300 hover:border-[var(--border-accent)] hover:shadow-lg"
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[var(--bg-tertiary)] text-[var(--brand-violet)] mb-4 group-hover:bg-[var(--brand-violet)] group-hover:text-white transition-all duration-300">
                <problem.icon size={24} />
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                {problem.title}
              </h3>
              <p className="text-sm text-[var(--text-tertiary)]">
                {problem.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom Message */}
        <div className="mt-16 text-center">
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Ces blocages sont réels. Mais ils ne sont pas une fatalité.{' '}
            <span className="font-semibold text-[var(--brand-violet)]">
              Tuge AI est conçu pour les débloquer.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

export default Problem;







