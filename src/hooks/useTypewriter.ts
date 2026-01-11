'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTypewriterOptions {
  text: string;
  speed?: number;
  delay?: number;
  onComplete?: () => void;
  enabled?: boolean;
}

interface UseTypewriterReturn {
  displayedText: string;
  isTyping: boolean;
  isComplete: boolean;
  skip: () => void;
  reset: () => void;
}

export function useTypewriter({
  text,
  speed = 30,
  delay = 0,
  onComplete,
  enabled = true,
}: UseTypewriterOptions): UseTypewriterReturn {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  const indexRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  const textRef = useRef(text);
  const speedRef = useRef(speed);

  // Keep refs updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    textRef.current = text;
    speedRef.current = speed;
  }, [text, speed]);

  const skip = useCallback(() => {
    setDisplayedText(textRef.current);
    setIsTyping(false);
    setIsComplete(true);
    indexRef.current = textRef.current.length;
    onCompleteRef.current?.();
  }, []);

  const reset = useCallback(() => {
    setDisplayedText('');
    setIsTyping(false);
    setIsComplete(false);
    indexRef.current = 0;
  }, []);

  useEffect(() => {
    // Skip if not enabled
    if (!enabled) {
      return;
    }

    // Reset state for this run
    indexRef.current = 0;
    setDisplayedText('');
    setIsComplete(false);

    let animationFrame: number;
    let startTime: number;
    let delayTimeout: NodeJS.Timeout;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      // Calculate how many characters should be shown
      const targetIndex = Math.floor(elapsed / speedRef.current);
      
      if (targetIndex > indexRef.current && indexRef.current < textRef.current.length) {
        indexRef.current = Math.min(targetIndex, textRef.current.length);
        setDisplayedText(textRef.current.slice(0, indexRef.current));
      }
      
      if (indexRef.current < textRef.current.length) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setIsTyping(false);
        setIsComplete(true);
        onCompleteRef.current?.();
      }
    };

    // Start after delay
    delayTimeout = setTimeout(() => {
      setIsTyping(true);
      animationFrame = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(delayTimeout);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [enabled, text, delay]); // Re-run when text changes or enabled changes

  return {
    displayedText,
    isTyping,
    isComplete,
    skip,
    reset,
  };
}

export default useTypewriter;
