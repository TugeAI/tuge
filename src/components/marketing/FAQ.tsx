'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'Tuge AI est-il un MLM ?',
    answer:
      'Tuge AI intègre un système de parrainage transparent inspiré du MLM, mais repensé de manière éthique. Pas de stock à acheter, pas de pression commerciale. Tu es récompensé pour la valeur que tu apportes au réseau, pas pour le recrutement à tout prix.',
  },
  {
    question: 'L\'Agent IA agit-il à ma place ?',
    answer:
      'L\'Agent IA prépare et exécute des actions pour toi, mais tu gardes toujours le contrôle. Rien ne se fait sans ta validation. C\'est un assistant qui travaille AVEC toi, pas à ta place. Tu décides, il agit.',
  },
  {
    question: 'Puis-je m\'inscrire sans parrain ?',
    answer:
      'Oui, absolument. Le code parrain est optionnel. Si tu n\'en as pas, tu seras automatiquement rattaché au réseau. Tu profiteras des mêmes avantages et pourras toi-même devenir parrain.',
  },
  {
    question: 'Est-ce adapté aux débutants ?',
    answer:
      'Tuge AI est conçu pour les débutants. L\'Agent IA te guide pas à pas, structure tes actions et t\'accompagne même si tu ne sais pas par où commencer. C\'est justement fait pour ceux qui démarrent.',
  },
  {
    question: 'Comment fonctionne l\'OTP ?',
    answer:
      'L\'OTP (One-Time Password) est un code de vérification unique envoyé par email ou SMS lors de ton inscription. Il garantit que c\'est bien toi qui crées le compte. Simple, rapide et sécurisé.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="section-padding">
      <div className="container-main">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-6">
            Questions <span className="text-gradient">fréquentes</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)]">
            Tout ce que tu dois savoir avant de rejoindre Tuge AI.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`accordion-item ${openIndex === index ? 'border-[var(--border-accent)]' : ''}`}
              data-state={openIndex === index ? 'open' : 'closed'}
            >
              <button
                className="accordion-trigger"
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndex === index}
              >
                <span className="text-[var(--text-primary)] pr-4">{faq.question}</span>
                <ChevronDown
                  size={20}
                  className={`text-[var(--text-muted)] shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="accordion-content">
                  <p className="leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQ;







