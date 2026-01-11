'use client';

import { Users, Gift, TrendingUp, AlertCircle, Copy, Check } from 'lucide-react';
import { useState } from 'react';

const levels = [
  { level: 1, percentage: 10, color: 'var(--brand-violet)', description: 'Vos filleuls directs' },
  { level: 2, percentage: 5, color: 'var(--brand-purple)', description: 'Filleuls de niveau 2' },
  { level: 3, percentage: 3, color: '#c084fc', description: 'Filleuls de niveau 3' },
  { level: 4, percentage: 2, color: 'var(--brand-pink)', description: 'Filleuls de niveau 4' },
  { level: 5, percentage: 1, color: 'var(--brand-rose)', description: 'Filleuls de niveau 5' },
];

const benefits = [
  {
    icon: Gift,
    title: 'Récompenses automatiques',
    description: 'Recevez des crédits bonus à chaque achat de vos filleuls, sur 5 niveaux.',
  },
  {
    icon: Users,
    title: 'Réseau en croissance',
    description: 'Votre réseau se développe naturellement. Plus il grandit, plus vous gagnez.',
  },
  {
    icon: TrendingUp,
    title: 'Revenus passifs',
    description: 'Vos gains augmentent sans effort supplémentaire de votre part.',
  },
];

export function MLM() {
  const [copied, setCopied] = useState(false);
  const referralCode = 'TUG-XXXXXX';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="parrainage" className="section-padding">
      <div className="container-main">
        <div className="max-w-6xl mx-auto">
          {/* Disclaimer - Fonctionnalité temporairement désactivée */}
          <div className="flex items-start gap-4 p-6 bg-amber-50 border-2 border-amber-200 rounded-2xl max-w-3xl mx-auto mb-12">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-amber-100 text-amber-600 shrink-0">
              <AlertCircle size={24} />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 mb-2 text-base">
                🚧 Fonctionnalité en développement
              </h4>
              <p className="text-sm text-amber-800 leading-relaxed">
                Le système de parrainage est actuellement en phase de préparation. Toute l&apos;infrastructure est prête, mais cette fonctionnalité sera activée prochainement. 
                En attendant, concentrez-vous sur la découverte de votre Agent IA personnel !
              </p>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-16 opacity-60">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--brand-violet)]/10 text-[var(--brand-violet)] text-sm font-medium mb-6">
              <Users size={16} />
              <span>Programme de parrainage (bientôt disponible)</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-6">
              Parrainez et gagnez sur <span className="text-gradient">5 niveaux</span>
            </h2>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              Un système de parrainage transparent et équitable. Partagez votre code et recevez des récompenses à chaque niveau.
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-12 items-start mb-16 opacity-60 pointer-events-none">
            {/* Left: Network Visualization */}
            <div className="relative">
              <div className="p-8 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-3xl">
                {/* Code Parrain */}
                <div className="mb-8">
                  <p className="text-sm font-medium text-[var(--text-tertiary)] mb-3">Votre code parrain</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 px-5 py-4 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-primary)]">
                      <span className="text-xl font-mono font-bold text-gradient">{referralCode}</span>
                    </div>
                    <button
                      onClick={handleCopy}
                      className="p-4 rounded-xl bg-[var(--brand-violet)] text-white hover:opacity-90 transition-all btn-glow"
                    >
                      {copied ? <Check size={20} /> : <Copy size={20} />}
                    </button>
                  </div>
                </div>

                {/* Network Visualization - Concentric circles */}
                <div className="relative aspect-square max-w-sm mx-auto">
                  {/* Levels circles */}
                  {levels.map((level, index) => {
                    const size = 100 - (index * 15);
                    return (
                      <div
                        key={level.level}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all duration-500"
                        style={{
                          width: `${size}%`,
                          height: `${size}%`,
                          borderColor: level.color,
                          opacity: 0.3 + (index * 0.15),
                        }}
                      />
                    );
                  })}
                  
                  {/* Center - You */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-[var(--brand-violet)] to-[var(--brand-purple)] flex items-center justify-center shadow-xl z-10">
                    <span className="text-white font-bold text-sm">VOUS</span>
                  </div>

                  {/* Level labels */}
                  {levels.map((level, index) => {
                    const angle = -90 + (index * 30);
                    const radius = 35 + (index * 7);
                    const x = 50 + radius * Math.cos(angle * Math.PI / 180);
                    const y = 50 + radius * Math.sin(angle * Math.PI / 180);
                    
                    return (
                      <div
                        key={`label-${level.level}`}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded-full text-xs font-bold text-white shadow-lg"
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                          backgroundColor: level.color,
                        }}
                      >
                        N{level.level}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Levels Table */}
            <div>
              <div className="p-8 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-3xl">
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">
                  Commission par niveau
                </h3>
                
                <div className="space-y-4">
                  {levels.map((level) => (
                    <div
                      key={level.level}
                      className="flex items-center gap-4 p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] transition-all hover:border-[var(--border-accent)]"
                    >
                      {/* Level Badge */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-md"
                        style={{ backgroundColor: level.color }}
                      >
                        N{level.level}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1">
                        <p className="font-semibold text-[var(--text-primary)]">{level.description}</p>
                        <p className="text-sm text-[var(--text-tertiary)]">Sur chaque achat de crédits</p>
                      </div>
                      
                      {/* Percentage */}
                      <div className="text-right">
                        <span
                          className="text-2xl font-bold"
                          style={{ color: level.color }}
                        >
                          {level.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="mt-6 p-4 bg-gradient-to-r from-[var(--brand-violet)]/10 to-[var(--brand-pink)]/10 rounded-xl border border-[var(--border-accent)]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[var(--text-primary)]">Commission totale possible</span>
                    <span className="text-2xl font-bold text-gradient">21%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12 opacity-60 pointer-events-none">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="p-6 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-2xl transition-all duration-300 hover:border-[var(--border-accent)] hover:shadow-md card-hover"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-violet)] to-[var(--brand-purple)] text-white mb-4 shadow-md">
                  <benefit.icon size={24} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>

          {/* Disclaimer - Transparence */}
          <div className="flex items-start gap-4 p-5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl max-w-3xl mx-auto opacity-60">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-amber-100 text-amber-600 shrink-0">
              <AlertCircle size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-[var(--text-primary)] mb-1 text-sm">
                Transparence totale
              </h4>
              <p className="text-sm text-[var(--text-tertiary)]">
                Aucune promesse de gains. Les résultats dépendent de l&apos;implication de chacun. 
                Ce n&apos;est pas un système pour devenir riche rapidement, mais un outil pour créer de la valeur ensemble.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MLM;
