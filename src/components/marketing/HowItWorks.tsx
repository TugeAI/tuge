'use client';

import { MessageSquare, Cpu, CheckCircle } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: MessageSquare,
    title: 'Tu parles à l\'IA',
    description:
      'Explique ta situation, tes objectifs, ce que tu veux accomplir. L\'Agent IA t\'écoute et comprend ton contexte.',
    color: 'var(--brand-violet)',
  },
  {
    number: '02',
    icon: Cpu,
    title: 'L\'IA prépare et exécute',
    description:
      'Elle analyse, structure et crée un plan d\'action concret. Puis elle exécute les tâches pour toi.',
    color: 'var(--brand-purple)',
  },
  {
    number: '03',
    icon: CheckCircle,
    title: 'Tu valides et avances',
    description:
      'Tu gardes le contrôle. Tu valides chaque action avant qu\'elle soit effective. Tu avances, sereinement.',
    color: 'var(--brand-pink)',
  },
];

export function HowItWorks() {
  return (
    <section id="fonctionnement" className="section-padding">
      <div className="container-main">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-6">
            Comment <span className="text-gradient">ça marche ?</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)]">
            Un processus simple en trois étapes pour passer de l&apos;idée à l&apos;action.
          </p>
        </div>

        {/* Steps */}
        <div className="relative max-w-4xl mx-auto">
          {/* Connection Line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--brand-violet)] via-[var(--brand-purple)] to-[var(--brand-pink)] opacity-20 -translate-y-1/2" />

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Step Card */}
                <div className="group relative p-8 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-3xl transition-all duration-500 hover:border-[var(--border-accent)] hover:shadow-xl text-center">
                  {/* Number */}
                  <div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-bold text-white"
                    style={{ background: step.color }}
                  >
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div
                    className="w-16 h-16 flex items-center justify-center rounded-2xl mx-auto mb-6 transition-all duration-300"
                    style={{
                      background: `linear-gradient(135deg, ${step.color}15, ${step.color}05)`,
                      color: step.color,
                    }}
                  >
                    <step.icon size={32} strokeWidth={1.5} />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">
                    {step.title}
                  </h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow (Mobile) */}
                {index < steps.length - 1 && (
                  <div className="md:hidden flex justify-center py-4">
                    <div className="w-0.5 h-8 bg-gradient-to-b from-[var(--brand-violet)] to-[var(--brand-pink)] opacity-30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;







