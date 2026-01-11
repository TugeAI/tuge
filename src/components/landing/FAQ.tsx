'use client';

import { useState } from 'react';
import { faq } from '@/content/landing';

export function FAQ() {
  return (
    <section id="faq" className="section-padding relative">
      <div className="container-main">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-4">
            {faq.title}
          </h2>
        </div>

        {/* FAQ Items */}
        <div className="max-w-3xl mx-auto space-y-4">
          {faq.items.map((item, index) => (
            <FAQItem key={index} item={item} index={index} />
          ))}
        </div>

        {/* Contact CTA */}
        <div className="text-center mt-16">
          <p className="text-[var(--text-secondary)] mb-4">
            Vous avez d&apos;autres questions ?
          </p>
          <a
            href="mailto:support@tuge.app"
            className="inline-flex items-center gap-2 text-[var(--accent-cyan)] hover:text-[var(--accent-cyan-dim)] font-medium transition-colors group"
          >
            <span>Contactez notre équipe</span>
            <ArrowIcon />
          </a>
        </div>
      </div>
    </section>
  );
}

interface FAQItemProps {
  item: { question: string; answer: string };
  index: number;
}

function FAQItem({ item, index }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`
        rounded-2xl border overflow-hidden transition-all duration-300
        ${isOpen 
          ? 'bg-[var(--bg-secondary)] border-[var(--accent-cyan)]/30' 
          : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] hover:border-[var(--accent-cyan)]/20'
        }
      `}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <span className="font-semibold text-[var(--text-primary)] pr-4">
          {item.question}
        </span>
        <div
          className={`
            flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300
            ${isOpen 
              ? 'bg-[var(--accent-cyan)] rotate-180' 
              : 'bg-[var(--bg-tertiary)]'
            }
          `}
        >
          <ChevronIcon className={isOpen ? 'text-black' : 'text-[var(--text-secondary)]'} />
        </div>
      </button>
      
      <div
        className={`
          overflow-hidden transition-all duration-300 ease-out
          ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="px-6 pb-6 text-[var(--text-secondary)] leading-relaxed">
          {item.answer}
        </div>
      </div>
    </div>
  );
}

function ChevronIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  );
}

export default FAQ;
