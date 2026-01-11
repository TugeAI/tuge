'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { demo } from '@/content/landing';

export function LiveDemo() {
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const handlePromptClick = (prompt: string) => {
    setSelectedPrompt(prompt);
    setIsTyping(true);
    
    // Simulate typing delay
    setTimeout(() => {
      setIsTyping(false);
    }, 1500);
  };

  return (
    <section id="demo" className="section-padding relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-cyan)]/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-lime)]/20 to-transparent" />
      </div>

      <div className="container-main relative">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-4">
            {demo.title}
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            {demo.subtitle}
          </p>
        </div>

        {/* Demo Container */}
        <div className="max-w-4xl mx-auto">
          {/* Chat Interface */}
          <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-primary)] bg-[var(--bg-elevated)]">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-lime)] flex items-center justify-center">
                    <AgentIcon />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-[var(--accent-lime)] rounded-full border-2 border-[var(--bg-elevated)]" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">Agent Tuge</p>
                  <p className="text-xs text-[var(--accent-lime)]">En ligne • Répond instantanément</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[var(--accent-lime)]/10 text-[var(--accent-lime)] text-xs font-mono">
                  Mode démo
                </span>
              </div>
            </div>

            {/* Chat Body */}
            <div className="p-6 min-h-[300px] flex flex-col justify-between">
              {/* Messages */}
              <div className="space-y-4 mb-6">
                {selectedPrompt ? (
                  <>
                    {/* User message */}
                    <div className="flex justify-end">
                      <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-br-md bg-[var(--accent-cyan)] text-black">
                        {selectedPrompt}
                      </div>
                    </div>
                    
                    {/* AI response */}
                    <div className="flex justify-start">
                      <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-bl-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                        {isTyping ? (
                          <div className="flex gap-1.5">
                            <span className="w-2 h-2 bg-[var(--accent-cyan)] rounded-full animate-pulse" />
                            <span className="w-2 h-2 bg-[var(--accent-cyan)] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                            <span className="w-2 h-2 bg-[var(--accent-cyan)] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                          </div>
                        ) : (
                          <p className="text-[var(--text-primary)]">
                            J&apos;ai bien compris votre demande. Pour vous aider au mieux, je vais analyser les options disponibles...
                            <span className="block mt-2 text-[var(--accent-cyan)]">
                              → Essayez l&apos;agent complet pour une réponse personnalisée
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-32 text-[var(--text-tertiary)]">
                    <p className="text-center">
                      Cliquez sur un exemple ci-dessous pour voir l&apos;agent en action
                    </p>
                  </div>
                )}
              </div>

              {/* Prompt Suggestions */}
              <div className="space-y-3">
                <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
                  Essayez un exemple
                </p>
                <div className="flex flex-wrap gap-2">
                  {demo.prompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handlePromptClick(prompt.text)}
                      className={`
                        px-4 py-2 rounded-xl text-sm font-medium
                        border transition-all
                        ${selectedPrompt === prompt.text
                          ? 'bg-[var(--accent-cyan)]/10 border-[var(--accent-cyan)] text-[var(--accent-cyan)]'
                          : 'bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--accent-cyan)]/50 hover:text-[var(--text-primary)]'
                        }
                      `}
                    >
                      <span className="opacity-60 mr-2">{prompt.category}</span>
                      {prompt.text.length > 30 ? prompt.text.slice(0, 30) + '...' : prompt.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer CTA */}
            <div className="px-6 py-4 border-t border-[var(--border-primary)] bg-[var(--bg-elevated)]">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-[var(--text-secondary)]">
                  Prêt à essayer avec votre propre demande ?
                </p>
                <Link href="/agent">
                  <Button variant="neon" size="sm" icon={<ArrowIcon />} iconPosition="right">
                    Lancer l&apos;agent
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AgentIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  );
}

export default LiveDemo;







