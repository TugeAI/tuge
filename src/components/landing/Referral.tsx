'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import { referral } from '@/content/landing';

// Pre-calculated positions to avoid hydration mismatch from Math.sin/cos
const LEVEL_1_NODES = [
  { angle: 0, top: 50, left: 85 },
  { angle: 72, top: 83.29, left: 60.82 },
  { angle: 144, top: 69.45, left: 21.68 },
  { angle: 216, top: 30.55, left: 21.68 },
  { angle: 288, top: 16.71, left: 60.82 },
];

const LEVEL_2_NODES = [
  { angle: 30, top: 74, left: 91.57 },
  { angle: 90, top: 98, left: 50 },
  { angle: 150, top: 74, left: 8.43 },
  { angle: 210, top: 26, left: 8.43 },
  { angle: 270, top: 2, left: 50 },
  { angle: 330, top: 26, left: 91.57 },
];

const LINE_POSITIONS = LEVEL_1_NODES.map(node => ({
  x2: node.left,
  y2: node.top,
}));

export function Referral() {
  return (
    <section id="referral" className="section-padding relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--accent-cyan)]/3 to-transparent" />
      </div>
      
      <div className="container-main relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Content */}
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-4">
              {referral.title}
            </h2>
            <p className="text-xl text-[var(--accent-cyan)] font-medium mb-4">
              {referral.subtitle}
            </p>
            <p className="text-[var(--text-secondary)] mb-10 leading-relaxed">
              {referral.description}
            </p>
            
            {/* Commission Levels */}
            <div className="space-y-4 mb-10">
              {referral.levels.map((level, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent-cyan)]/30 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold"
                      style={{
                        background: `linear-gradient(135deg, var(--accent-cyan)${30 - index * 10}%, transparent)`,
                        border: '1px solid var(--accent-cyan)',
                        opacity: 1 - index * 0.2,
                      }}
                    >
                      {level.level}
                    </div>
                    <span className="text-[var(--text-primary)] font-medium">{level.label}</span>
                  </div>
                  <span className="text-2xl font-bold font-mono text-[var(--accent-cyan)]">
                    {level.commission}
                  </span>
                </div>
              ))}
            </div>

            <Link href={referral.cta.href}>
              <Button variant="neon" size="lg" icon={<LinkIcon />} iconPosition="left">
              {referral.cta.label}
            </Button>
            </Link>
          </div>

          {/* Right - Network Visualization */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-md aspect-square">
              {/* Central node - You */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-lime)] flex items-center justify-center shadow-2xl shadow-[var(--glow-cyan)] animate-pulse-glow">
                    <UserIcon className="w-10 h-10 text-black" />
                  </div>
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--accent-cyan)] text-xs font-mono text-[var(--accent-cyan)] whitespace-nowrap">
                    Vous
                  </div>
                </div>
              </div>

              {/* Level 1 ring */}
              <div className="absolute inset-[15%] rounded-full border border-[var(--accent-cyan)]/20" />
              
              {/* Level 1 nodes */}
              {LEVEL_1_NODES.map((node, index) => (
                <div
                  key={`l1-${index}`}
                  className="absolute w-12 h-12 rounded-full bg-[var(--bg-secondary)] border border-[var(--accent-cyan)]/40 flex items-center justify-center animate-float"
                  style={{
                    top: `${node.top}%`,
                    left: `${node.left}%`,
                    transform: 'translate(-50%, -50%)',
                    animationDelay: `${index * 300}ms`,
                  }}
                >
                  <UserIcon className="w-5 h-5 text-[var(--accent-cyan)]" />
                </div>
              ))}

              {/* Level 2 ring */}
              <div className="absolute inset-0 rounded-full border border-[var(--accent-lime)]/10" />
              
              {/* Level 2 nodes */}
              {LEVEL_2_NODES.map((node, index) => (
                <div
                  key={`l2-${index}`}
                  className="absolute w-8 h-8 rounded-full bg-[var(--bg-tertiary)] border border-[var(--accent-lime)]/30 flex items-center justify-center animate-float"
                  style={{
                    top: `${node.top}%`,
                    left: `${node.left}%`,
                    transform: 'translate(-50%, -50%)',
                    animationDelay: `${500 + index * 200}ms`,
                  }}
                >
                  <UserIcon className="w-3 h-3 text-[var(--accent-lime)]" />
                </div>
              ))}

              {/* Connection lines (simplified) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="var(--accent-lime)" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                {/* Lines from center to level 1 */}
                {LINE_POSITIONS.map((pos, index) => (
                  <line
                    key={`line-${index}`}
                    x1="50%"
                    y1="50%"
                    x2={`${pos.x2}%`}
                    y2={`${pos.y2}%`}
                    stroke="url(#lineGradient)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                ))}
              </svg>

              {/* Earnings indicator */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--accent-lime)]/30 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-lime)]/10 flex items-center justify-center">
                    <CoinIcon />
              </div>
                  <div>
                    <div className="text-xs text-[var(--text-tertiary)]">Gains potentiels</div>
                    <div className="text-lg font-bold font-mono text-[var(--accent-lime)]">+17%</div>
              </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function UserIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
  );
}

function CoinIcon() {
  return (
    <svg className="w-4 h-4 text-[var(--accent-lime)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default Referral;
