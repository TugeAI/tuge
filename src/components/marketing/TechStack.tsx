'use client';

import { Code2, Database, CreditCard, Brain, Cpu, Shield, Zap, Lock } from 'lucide-react';

const technologies = [
  {
    name: 'Next.js 16',
    description: 'Framework React ultra-performant',
    icon: Code2,
    color: '#000000',
    bgColor: 'rgba(0, 0, 0, 0.05)',
  },
  {
    name: 'Supabase',
    description: 'Backend temps réel & Auth',
    icon: Database,
    color: '#3ECF8E',
    bgColor: 'rgba(62, 207, 142, 0.1)',
  },
  {
    name: 'Stripe',
    description: 'Paiements sécurisés',
    icon: CreditCard,
    color: '#635BFF',
    bgColor: 'rgba(99, 91, 255, 0.1)',
  },
  {
    name: 'RAG',
    description: 'Recherche augmentée par IA',
    icon: Brain,
    color: 'var(--brand-violet)',
    bgColor: 'rgba(109, 40, 217, 0.1)',
  },
  {
    name: 'OpenAI',
    description: 'Intelligence artificielle GPT-4',
    icon: Cpu,
    color: '#10A37F',
    bgColor: 'rgba(16, 163, 127, 0.1)',
  },
  {
    name: 'TypeScript',
    description: 'Typage strict & fiable',
    icon: Code2,
    color: '#3178C6',
    bgColor: 'rgba(49, 120, 198, 0.1)',
  },
];

const securityFeatures = [
  {
    icon: Shield,
    title: 'Auth OTP',
    description: 'Authentification par code email sécurisé',
  },
  {
    icon: Lock,
    title: 'Chiffrement',
    description: 'Données chiffrées de bout en bout',
  },
  {
    icon: Zap,
    title: 'Edge Functions',
    description: 'Logique serveur au plus proche de vous',
  },
];

export function TechStack() {
  return (
    <section id="tech" className="section-padding">
      <div className="container-main">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--brand-violet)]/10 text-[var(--brand-violet)] text-sm font-medium mb-6">
            <Code2 size={16} />
            <span>Stack technique</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-6">
            Construit avec les <span className="text-gradient">meilleures technologies</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)]">
            Une architecture moderne, scalable et sécurisée pour une expérience utilisateur optimale.
          </p>
        </div>

        {/* Tech Badges Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
          {technologies.map((tech, index) => (
            <div
              key={index}
              className="group p-5 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-2xl transition-all duration-300 hover:border-[var(--border-accent)] hover:shadow-lg card-hover text-center"
              style={{
                ['--glow-color' as string]: tech.color,
              }}
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110"
                style={{ 
                  backgroundColor: tech.bgColor,
                  color: tech.color,
                }}
              >
                <tech.icon size={28} strokeWidth={1.5} />
              </div>
              <h3 className="font-bold text-[var(--text-primary)] mb-1">{tech.name}</h3>
              <p className="text-xs text-[var(--text-tertiary)]">{tech.description}</p>
            </div>
          ))}
        </div>

        {/* Security Features */}
        <div className="max-w-4xl mx-auto">
          <div className="p-8 bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Left: Title */}
              <div className="md:w-1/3 text-center md:text-left">
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                  Sécurité <span className="text-gradient">maximale</span>
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Vos données sont protégées avec les standards les plus élevés.
                </p>
              </div>

              {/* Right: Features */}
              <div className="md:w-2/3 grid sm:grid-cols-3 gap-6">
                {securityFeatures.map((feature, index) => (
                  <div key={index} className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-[var(--brand-violet)]/10 text-[var(--brand-violet)] flex items-center justify-center mx-auto mb-3">
                      <feature.icon size={24} />
                    </div>
                    <h4 className="font-semibold text-[var(--text-primary)] mb-1 text-sm">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TechStack;


