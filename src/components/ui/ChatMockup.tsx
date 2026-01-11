'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';

interface Message {
  id: number;
  type: 'user' | 'ai';
  content: string;
  delay: number;
}

const messages: Message[] = [
  {
    id: 1,
    type: 'user',
    content: "Je cherche un MacBook Pro M3, budget max 2000€",
    delay: 0,
  },
  {
    id: 2,
    type: 'ai',
    content: "J'ai trouvé 8 offres correspondantes. La meilleure : MacBook Pro M3 14\" à 1850€, vendeur vérifié avec 4.9★. Dois-je négocier pour vous ?",
    delay: 1500,
  },
  {
    id: 3,
    type: 'user',
    content: "Oui, essaie d'obtenir 1700€ avec la housse incluse",
    delay: 3500,
  },
  {
    id: 4,
    type: 'ai',
    content: "✅ Négociation réussie ! Le vendeur accepte 1750€ avec housse premium incluse. Voulez-vous que je finalise la mise en relation ?",
    delay: 5500,
  },
];

export function ChatMockup({ className = '' }: { className?: string }) {
  const [visibleMessages, setVisibleMessages] = useState<number[]>([1]);
  const [isTyping, setIsTyping] = useState(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const hasStartedRef = useRef(false);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    messages.slice(1).forEach((message) => {
      if (message.type === 'ai') {
        const typingTimeout = setTimeout(() => {
          setIsTyping(true);
        }, message.delay - 800);
        timeoutsRef.current.push(typingTimeout);

        const messageTimeout = setTimeout(() => {
          setIsTyping(false);
          setVisibleMessages((prev) => [...prev, message.id]);
        }, message.delay);
        timeoutsRef.current.push(messageTimeout);
      } else {
        const messageTimeout = setTimeout(() => {
          setVisibleMessages((prev) => [...prev, message.id]);
        }, message.delay);
        timeoutsRef.current.push(messageTimeout);
      }
    });

    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  return (
    <div
      className={`
        w-full max-w-md
        rounded-2xl
        bg-[var(--bg-elevated)]
        border border-[var(--border-primary)]
        shadow-xl
        overflow-hidden
        ${className}
      `}
    >
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-4 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        <div className="relative">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--brand-violet)] via-[var(--brand-purple)] to-[var(--brand-pink)] flex items-center justify-center shadow-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[var(--bg-secondary)] animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-[var(--text-primary)]">Agent Tuge</p>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--brand-violet)]/10">
              <Sparkles size={10} className="text-[var(--brand-violet)]" />
              <span className="text-[10px] font-medium text-[var(--brand-violet)]">IA</span>
            </div>
          </div>
          <p className="text-xs text-[var(--text-tertiary)]">Négociateur expert • En ligne</p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="p-4 space-y-4 min-h-[300px] bg-[var(--bg-primary)]">
        {messages.map((message) => {
          const isVisible = visibleMessages.includes(message.id);
          if (!isVisible) return null;
          
          return (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              style={{
                animation: 'fadeInUp 0.4s ease-out forwards',
              }}
            >
              <div
                className={`
                  max-w-[85%] px-4 py-3 text-sm leading-relaxed
                  ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-[var(--brand-violet)] to-[var(--brand-purple)] text-white rounded-2xl rounded-br-md shadow-md'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-2xl rounded-bl-md border border-[var(--border-primary)]'
                  }
                `}
              >
                {message.content}
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[var(--bg-secondary)] rounded-2xl rounded-bl-md px-4 py-3 border border-[var(--border-primary)]">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-[var(--brand-violet)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-[var(--brand-purple)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-[var(--brand-pink)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-full bg-[var(--bg-primary)] border border-[var(--border-primary)]">
            <input
              type="text"
              placeholder="Décrivez ce que vous cherchez..."
              className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
              readOnly
            />
          </div>
          <button className="w-11 h-11 rounded-full bg-gradient-to-r from-[var(--brand-violet)] to-[var(--brand-purple)] flex items-center justify-center hover:opacity-90 transition-all shadow-lg hover:shadow-xl btn-glow">
            <Send size={18} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatMockup;
