'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface TerminalCommand {
  type: 'prompt' | 'output' | 'success' | 'error';
  text: string;
}

interface TerminalMockupProps {
  commands: TerminalCommand[];
  className?: string;
  autoPlay?: boolean;
  typingSpeed?: number;
}

export function TerminalMockup({
  commands,
  className = '',
  autoPlay = true,
  typingSpeed = 30,
}: TerminalMockupProps) {
  const [displayedLines, setDisplayedLines] = useState<{ type: string; text: string }[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);

  // Cursor blink effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  const typeNextCharacter = useCallback(() => {
    if (currentLineIndex >= commands.length) {
      setIsTyping(false);
      return;
    }

    const currentCommand = commands[currentLineIndex];
    
    if (currentCommand.type === 'prompt') {
      // Type character by character for prompts
      if (currentCharIndex < currentCommand.text.length) {
        setDisplayedLines(prev => {
          const newLines = [...prev];
          const lastLine = newLines[newLines.length - 1];
          if (lastLine && lastLine.type === 'typing') {
            lastLine.text = currentCommand.text.slice(0, currentCharIndex + 1);
          } else {
            newLines.push({ type: 'typing', text: currentCommand.text.slice(0, currentCharIndex + 1) });
          }
          return newLines;
        });
        setCurrentCharIndex(prev => prev + 1);
      } else {
        // Finished typing this line
        setDisplayedLines(prev => {
          const newLines = prev.filter(l => l.type !== 'typing');
          newLines.push({ type: 'prompt', text: currentCommand.text });
          return newLines;
        });
        setCurrentLineIndex(prev => prev + 1);
        setCurrentCharIndex(0);
      }
    } else {
      // Output lines appear instantly after a delay
      setDisplayedLines(prev => [...prev, { type: currentCommand.type, text: currentCommand.text }]);
      setCurrentLineIndex(prev => prev + 1);
      setCurrentCharIndex(0);
    }
  }, [commands, currentLineIndex, currentCharIndex]);

  useEffect(() => {
    if (!autoPlay || hasStartedRef.current) return;
    hasStartedRef.current = true;
    setIsTyping(true);
  }, [autoPlay]);

  useEffect(() => {
    if (!isTyping) return;

    const currentCommand = commands[currentLineIndex];
    if (!currentCommand) {
      setIsTyping(false);
      return;
    }

    const delay = currentCommand.type === 'prompt' 
      ? typingSpeed 
      : currentCommand.type === 'success' 
        ? 800 
        : 400;

    const timeout = setTimeout(typeNextCharacter, delay);
    return () => clearTimeout(timeout);
  }, [isTyping, currentLineIndex, currentCharIndex, commands, typingSpeed, typeNextCharacter]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayedLines]);

  return (
    <div className={`terminal ${className}`}>
      {/* Terminal Header */}
      <div className="terminal-header">
        <div className="flex items-center gap-2">
          <span className="terminal-dot terminal-dot-red" />
          <span className="terminal-dot terminal-dot-yellow" />
          <span className="terminal-dot terminal-dot-green" />
        </div>
        <span className="ml-4 text-xs text-[var(--text-tertiary)] font-mono">
          tuge-agent — zsh
        </span>
      </div>

      {/* Terminal Body */}
      <div 
        ref={containerRef}
        className="terminal-body overflow-y-auto max-h-[350px]"
      >
        {displayedLines.map((line, index) => (
          <div
            key={index}
            className={`mb-1 ${
              line.type === 'prompt' || line.type === 'typing'
                ? 'text-[var(--accent-cyan)]'
                : line.type === 'success'
                ? 'text-[var(--accent-lime)]'
                : line.type === 'error'
                ? 'text-red-400'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            {line.text}
            {line.type === 'typing' && showCursor && (
              <span className="terminal-cursor animate-cursor" />
            )}
          </div>
        ))}
        
        {/* Waiting cursor when not typing */}
        {!isTyping && currentLineIndex >= commands.length && showCursor && (
          <div className="text-[var(--accent-cyan)]">
            {'> '}
            <span className="terminal-cursor animate-cursor" />
          </div>
        )}
      </div>
    </div>
  );
}

export default TerminalMockup;







