'use client';

import { useState, type ReactNode, createContext, useContext, useRef, useEffect } from 'react';

// Context for accordion state
interface AccordionContextType {
  openItems: string[];
  toggleItem: (id: string) => void;
  allowMultiple: boolean;
}

const AccordionContext = createContext<AccordionContextType | null>(null);

function useAccordion() {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('Accordion components must be used within an Accordion');
  }
  return context;
}

// Accordion Root
interface AccordionProps {
  children: ReactNode;
  allowMultiple?: boolean;
  defaultOpen?: string[];
  className?: string;
}

export function Accordion({
  children,
  allowMultiple = false,
  defaultOpen = [],
  className = '',
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>(defaultOpen);

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (allowMultiple) {
        return [...prev, id];
      }
      return [id];
    });
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, allowMultiple }}>
      <div className={`space-y-3 ${className}`}>{children}</div>
    </AccordionContext.Provider>
  );
}

// Accordion Item
interface AccordionItemProps {
  id: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const AccordionItemContext = createContext<string | null>(null);

export function AccordionItem({ id, children, className = '', style }: AccordionItemProps) {
  const { openItems } = useAccordion();
  const isOpen = openItems.includes(id);

  return (
    <AccordionItemContext.Provider value={id}>
      <div
        className={`
          rounded-2xl
          border border-[var(--border-primary)]
          bg-[var(--bg-secondary)]
          overflow-hidden
          transition-colors duration-200
          ${isOpen ? 'border-[var(--border-accent)]' : ''}
          ${className}
        `}
        style={style}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

// Accordion Trigger
interface AccordionTriggerProps {
  children: ReactNode;
  className?: string;
}

export function AccordionTrigger({ children, className = '' }: AccordionTriggerProps) {
  const { openItems, toggleItem } = useAccordion();
  const itemId = useContext(AccordionItemContext);
  
  if (!itemId) {
    throw new Error('AccordionTrigger must be used within an AccordionItem');
  }
  
  const isOpen = openItems.includes(itemId);

  return (
    <button
      type="button"
      onClick={() => toggleItem(itemId)}
      className={`
        w-full flex items-center justify-between
        p-5
        text-left font-medium text-[var(--text-primary)]
        hover:bg-[var(--bg-hover)]
        transition-colors duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent-primary)]
        ${className}
      `}
      aria-expanded={isOpen}
    >
      <span>{children}</span>
      <ChevronIcon isOpen={isOpen} />
    </button>
  );
}

// Accordion Content
interface AccordionContentProps {
  children: ReactNode;
  className?: string;
}

export function AccordionContent({ children, className = '' }: AccordionContentProps) {
  const { openItems } = useAccordion();
  const itemId = useContext(AccordionItemContext);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  
  if (!itemId) {
    throw new Error('AccordionContent must be used within an AccordionItem');
  }
  
  const isOpen = openItems.includes(itemId);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [children]);

  return (
    <div
      style={{
        height: isOpen ? height : 0,
        opacity: isOpen ? 1 : 0,
        overflow: 'hidden',
        transition: 'height 0.3s ease-out, opacity 0.2s ease-out',
      }}
    >
      <div ref={contentRef} className={`px-5 pb-5 text-[var(--text-secondary)] ${className}`}>
        {children}
      </div>
    </div>
  );
}

// Chevron Icon
function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0 ml-4"
      style={{
        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.3s ease-out',
      }}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default Accordion;
