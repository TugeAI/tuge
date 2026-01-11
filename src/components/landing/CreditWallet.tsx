'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import { wallet } from '@/content/landing';

export function CreditWallet() {
  return (
    <section id="pricing" className="section-padding relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-pink)]/20 to-transparent" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-[var(--glow-pink)] opacity-5 blur-[150px]" />
      </div>

      <div className="container-main relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Content */}
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-4">
              {wallet.title}
            </h2>
            <p className="text-xl text-[var(--accent-pink)] font-medium mb-4">
              {wallet.subtitle}
            </p>
            <p className="text-[var(--text-secondary)] mb-10 leading-relaxed">
              {wallet.description}
            </p>

            {/* Features */}
            <div className="space-y-4 mb-10">
              {wallet.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent-pink)]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <WalletFeatureIcon type={feature.icon} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/wallet">
              <Button variant="outline" size="lg" icon={<WalletIcon />} iconPosition="left">
                Voir mon wallet
              </Button>
            </Link>
          </div>

          {/* Right - Wallet Mockup + Pricing */}
          <div className="space-y-8">
            {/* Wallet Card */}
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[var(--accent-pink)] to-[var(--accent-cyan)] opacity-20 blur-2xl" />
              <div className="relative p-8 rounded-3xl bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)] border border-[var(--border-primary)] overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[var(--accent-pink)] opacity-5 -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[var(--accent-cyan)] opacity-5 translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-sm text-[var(--text-tertiary)] uppercase tracking-wider font-mono">Solde disponible</span>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[var(--accent-lime)] animate-pulse" />
                      <span className="text-xs text-[var(--accent-lime)]">Actif</span>
                    </div>
                  </div>
                  
                  <div className="flex items-baseline gap-2 mb-8">
                    <span className="text-5xl font-bold font-mono text-gradient-multi">247</span>
                    <span className="text-xl text-[var(--text-secondary)]">crédits</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-primary)]/50 border border-[var(--border-primary)]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--accent-lime)]/10 flex items-center justify-center">
                        <GiftIcon />
                      </div>
                      <span className="text-sm text-[var(--text-secondary)]">Crédits quotidiens</span>
                    </div>
                    <Button size="sm" variant="neon">
                      Réclamer +10
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-3 gap-4">
              {wallet.pricing.map((tier, index) => (
                <div
                  key={index}
                  className={`
                    relative p-4 rounded-2xl border transition-all
                    ${tier.popular 
                      ? 'bg-[var(--accent-cyan)]/5 border-[var(--accent-cyan)]/30 shadow-lg shadow-[var(--glow-cyan)]' 
                      : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] hover:border-[var(--accent-cyan)]/20'
                    }
                  `}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[var(--accent-cyan)] text-black text-xs font-semibold">
                      Populaire
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-2xl font-bold font-mono text-[var(--text-primary)] mb-1">
                      {tier.credits}
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)] mb-3">crédits</div>
                    <div className="text-lg font-semibold text-[var(--accent-cyan)]">
                      {tier.price}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WalletFeatureIcon({ type }: { type: string }) {
  const className = "w-5 h-5 text-[var(--accent-pink)]";
  
  switch (type) {
    case 'calendar':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      );
    case 'wallet':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
        </svg>
      );
    case 'creditcard':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
      );
    default:
      return null;
  }
}

function WalletIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg className="w-4 h-4 text-[var(--accent-lime)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}

export default CreditWallet;







