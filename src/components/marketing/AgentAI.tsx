'use client';

import {
  User,
  FileText,
  Megaphone,
  TrendingUp,
  Search,
  CalendarCheck,
  CheckCircle2,
  Bot,
  Sparkles,
} from 'lucide-react';

const capabilities = [
  {
    icon: User,
    title: 'Création de profil & offres',
    description: 'Il structure ton identité professionnelle.',
  },
  {
    icon: FileText,
    title: 'Rédaction d\'annonces',
    description: 'Il crée du contenu qui convertit.',
  },
  {
    icon: TrendingUp,
    title: 'Optimisation visibilité',
    description: 'Il améliore ton positionnement.',
  },
  {
    icon: Search,
    title: 'Recherche de prospects',
    description: 'Il identifie tes clients idéaux.',
  },
  {
    icon: CalendarCheck,
    title: 'Organisation & relances',
    description: 'Il gère ton suivi commercial.',
  },
  {
    icon: CheckCircle2,
    title: 'Validation utilisateur',
    description: 'Rien ne se fait sans ton accord.',
  },
];

export function AgentAI() {
  return (
    <section id="agent" className="section-padding bg-[var(--bg-secondary)]">
      <div className="container-main">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Content */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--brand-violet)]/10 text-[var(--brand-violet)] text-sm font-medium mb-6">
              <Bot size={16} />
              <span>Agent IA Personnel</span>
            </div>

            {/* Title */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-6">
              Ton Agent IA devient{' '}
              <span className="text-gradient">ton identité numérique.</span>
            </h2>

            {/* Description */}
            <p className="text-lg text-[var(--text-secondary)] mb-8 leading-relaxed">
              Il apprend ton activité, tes objectifs, tes offres, ton style et tes priorités. 
              Il structure ton plan d&apos;action et agit avec toi. C&apos;est ton{' '}
              <span className="font-semibold text-[var(--text-primary)]">meilleur ami</span>,{' '}
              <span className="font-semibold text-[var(--text-primary)]">coach</span>,{' '}
              <span className="font-semibold text-[var(--text-primary)]">assistant exécutif</span> et{' '}
              <span className="font-semibold text-[var(--text-primary)]">catalyseur de résultats</span>.
            </p>

            {/* Key Point */}
            <div className="flex items-start gap-4 p-5 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-2xl">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-violet)] to-[var(--brand-purple)] text-white shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                  Il conseille ET il agit
                </h4>
                <p className="text-sm text-[var(--text-secondary)]">
                  Le blocage principal des entrepreneurs, c&apos;est le passage à l&apos;action. 
                  Ton Agent IA ne te donne pas juste des conseils — il exécute pour toi.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Capabilities Grid */}
          <div className="grid grid-cols-2 gap-4">
            {capabilities.map((capability, index) => (
              <div
                key={index}
                className="group p-5 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-2xl transition-all duration-300 hover:border-[var(--border-accent)] hover:shadow-md"
              >
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--bg-tertiary)] text-[var(--brand-violet)] mb-3 group-hover:bg-[var(--brand-violet)] group-hover:text-white transition-all duration-300">
                  <capability.icon size={20} />
                </div>
                <h4 className="font-semibold text-[var(--text-primary)] text-sm mb-1">
                  {capability.title}
                </h4>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {capability.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AgentAI;







