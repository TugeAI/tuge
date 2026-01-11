'use client';

import { proposals } from '@/content/landing';

export function AgentProposals() {
  return (
    <section id="proposals" className="section-padding relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-[600px] h-[600px] rounded-full bg-[var(--glow-amber)] opacity-5 blur-[150px] -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full bg-[var(--glow-cyan)] opacity-5 blur-[150px] -translate-y-1/2" />
      </div>

      <div className="container-main relative">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-amber)]/10 border border-[var(--accent-amber)]/20 mb-6">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-amber)] animate-pulse" />
            <span className="text-sm font-mono text-[var(--accent-amber)]">Nouveau</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-4">
            {proposals.title}
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            {proposals.subtitle}
          </p>
        </div>

        {/* Flow Diagram */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4">
            {/* User A */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-cyan-dim)] flex items-center justify-center mb-4 shadow-lg shadow-[var(--glow-cyan)]">
                <UserIcon />
              </div>
              <span className="font-semibold text-[var(--text-primary)]">Utilisateur A</span>
              <span className="text-sm text-[var(--text-tertiary)]">Cherche un service</span>
            </div>

            {/* Arrow 1 */}
            <div className="hidden md:flex items-center flex-1">
              <div className="flex-1 h-px bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-amber)]" />
              <div className="px-2">
                <ArrowRightIcon className="text-[var(--accent-amber)]" />
              </div>
            </div>
            <div className="flex md:hidden items-center h-8">
              <ArrowDownIcon className="text-[var(--accent-amber)]" />
            </div>

            {/* Agent */}
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[var(--accent-amber)] to-[var(--accent-amber-dim)] flex items-center justify-center mb-4 shadow-lg shadow-[var(--glow-amber)] animate-pulse-glow">
                  <AgentIcon />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--accent-lime)] flex items-center justify-center">
                  <SparkIcon />
                </div>
              </div>
              <span className="font-semibold text-[var(--text-primary)]">Agent IA</span>
              <span className="text-sm text-[var(--text-tertiary)]">Crée la proposition</span>
            </div>

            {/* Arrow 2 */}
            <div className="hidden md:flex items-center flex-1">
              <div className="px-2">
                <ArrowRightIcon className="text-[var(--accent-amber)]" />
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-[var(--accent-amber)] to-[var(--accent-lime)]" />
            </div>
            <div className="flex md:hidden items-center h-8">
              <ArrowDownIcon className="text-[var(--accent-lime)]" />
            </div>

            {/* User B */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--accent-lime)] to-[var(--accent-lime-dim)] flex items-center justify-center mb-4 shadow-lg shadow-[var(--glow-lime)]">
                <UserIcon />
              </div>
              <span className="font-semibold text-[var(--text-primary)]">Utilisateur B</span>
              <span className="text-sm text-[var(--text-tertiary)]">Reçoit &amp; approuve</span>
            </div>
          </div>
        </div>

        {/* Proposal Types */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {proposals.types.map((type, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent-amber)]/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--accent-amber)]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ProposalTypeIcon type={type.icon} />
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                {type.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                {type.description}
              </p>
            </div>
          ))}
        </div>

        {/* Safeguards */}
        <div className="max-w-3xl mx-auto">
          <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-lime)]/10 flex items-center justify-center">
                <ShieldIcon />
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Protection anti-spam intégrée
              </h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {proposals.safeguards.map((safeguard, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckIcon />
                  <span className="text-sm text-[var(--text-secondary)]">{safeguard}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function UserIcon() {
  return (
    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function AgentIcon() {
  return (
    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 24 24">
      <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

function ArrowRightIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  );
}

function ArrowDownIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  );
}

function ProposalTypeIcon({ type }: { type: string }) {
  const className = "w-6 h-6 text-[var(--accent-amber)]";
  
  switch (type) {
    case 'briefcase':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
        </svg>
      );
    case 'handshake':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
      );
    case 'share':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
        </svg>
      );
    default:
      return null;
  }
}

function ShieldIcon() {
  return (
    <svg className="w-5 h-5 text-[var(--accent-lime)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-[var(--accent-lime)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default AgentProposals;







