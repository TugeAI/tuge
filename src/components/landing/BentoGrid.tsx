'use client';

import { features } from '@/content/landing';

export function BentoGrid() {
  return (
    <section id="features" className="section-padding relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[var(--glow-cyan)] opacity-10 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[var(--glow-lime)] opacity-10 blur-[120px]" />
      </div>

      <div className="container-main relative">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-4">
            {features.title}
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            {features.subtitle}
          </p>
        </div>

        {/* Bento Grid */}
        <div className="bento-grid">
          {features.items.map((feature, index) => (
            <BentoCard
              key={feature.id}
              feature={feature}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface BentoCardProps {
  feature: {
    id: string;
    title: string;
    description: string;
    icon: string;
    accent: string;
    size: string;
  };
  index: number;
}

function BentoCard({ feature, index }: BentoCardProps) {
  const sizeClass = feature.size === 'lg' 
    ? 'bento-card-lg' 
    : feature.size === 'md' 
      ? 'bento-card-md' 
      : 'bento-card-sm';

  const accentColor = feature.accent === 'cyan' 
    ? 'var(--accent-cyan)' 
    : feature.accent === 'lime'
      ? 'var(--accent-lime)'
      : feature.accent === 'amber'
        ? 'var(--accent-amber)'
        : 'var(--accent-pink)';

  const glowColor = feature.accent === 'cyan' 
    ? 'var(--glow-cyan)' 
    : feature.accent === 'lime'
      ? 'var(--glow-lime)'
      : feature.accent === 'amber'
        ? 'var(--glow-amber)'
        : 'var(--glow-pink)';

  return (
    <div
      className={`bento-card ${sizeClass} group animate-fade-in-up`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Accent glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${glowColor} 0%, transparent 70%)`,
        }}
      />

      {/* Icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110"
        style={{
          background: `linear-gradient(135deg, ${accentColor}20 0%, transparent 100%)`,
          border: `1px solid ${accentColor}30`,
        }}
      >
        <FeatureIcon type={feature.icon} color={accentColor} />
      </div>

      {/* Content */}
      <h3 
        className="text-xl font-semibold mb-3 transition-colors"
        style={{ color: 'var(--text-primary)' }}
      >
        {feature.title}
      </h3>
      <p className="text-[var(--text-secondary)] leading-relaxed">
        {feature.description}
      </p>

      {/* Decorative corner */}
      <div
        className="absolute top-0 right-0 w-24 h-24 opacity-5 group-hover:opacity-10 transition-opacity"
        style={{
          background: `linear-gradient(135deg, ${accentColor} 0%, transparent 100%)`,
          borderRadius: '0 var(--radius-2xl) 0 100%',
        }}
      />
    </div>
  );
}

function FeatureIcon({ type, color }: { type: string; color: string }) {
  const iconClass = "w-6 h-6";
  const style = { color };

  switch (type) {
    case 'sparkles':
      return (
        <svg className={iconClass} style={style} fill="currentColor" viewBox="0 0 24 24">
          <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
        </svg>
      );
    case 'search':
      return (
        <svg className={iconClass} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      );
    case 'connect':
      return (
        <svg className={iconClass} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
      );
    case 'wallet':
      return (
        <svg className={iconClass} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
        </svg>
      );
    case 'gift':
      return (
        <svg className={iconClass} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      );
    case 'shield':
      return (
        <svg className={iconClass} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      );
    default:
      return null;
  }
}

export default BentoGrid;







