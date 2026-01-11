'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useDeviceFingerprint } from '@/hooks/useDeviceFingerprint';

// Types
type AuthStep = 
  | 'init'
  | 'welcome'
  | 'context'
  | 'ask_email'
  | 'sending_otp'
  | 'otp_sent'
  | 'ask_referral'
  | 'ask_otp'
  | 'verifying'
  | 'success'
  | 'error';

interface Message {
  id: string;
  type: 'agent' | 'user';
  content: string;
  step: AuthStep;
}

// Nombre de chiffres OTP (Supabase envoie 8 chiffres)
const OTP_LENGTH = 8;

// Clés de stockage pour le profil visiteur
const VISITOR_PROFILE_KEY = 'tug_visitor_profile';
const SESSION_ID_KEY = 'tug_session_id';

/**
 * Récupère le prénom du visiteur depuis le cache local
 */
function getVisitorFirstName(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(VISITOR_PROFILE_KEY);
    if (!cached) return null;
    const { profile } = JSON.parse(cached);
    return profile?.firstName || null;
  } catch {
    return null;
  }
}

/**
 * Récupère le session ID du visiteur
 */
function getVisitorSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_ID_KEY);
}

/**
 * Génère les messages personnalisés avec le prénom si connu
 */
function getAgentMessages(firstName: string | null): Record<string, string> {
  const name = firstName || '';
  const greeting = firstName ? `${firstName}, bienvenue` : 'Bienvenue';
  const successName = firstName ? `, ${firstName}` : '';
  
  return {
    welcome: firstName 
      ? `${firstName} ! Content de te retrouver 👋`
      : "Bienvenue ! Je suis ton assistant Tuge. 👋",
    context: firstName
      ? "On y est presque. Je vais activer ton Agent IA personnel pour de bon."
      : "Je vais activer ton Agent IA personnel. Il pourra t'aider à trouver des services, vendre, acheter... bref, simplifier ton quotidien.",
    ask_email: firstName
      ? `${firstName}, indique-moi ton email pour finaliser :`
      : "Pour commencer, indique-moi ton email :",
    sending_otp: "Parfait ! Je t'envoie un code de vérification...",
    otp_sent: "✓ Code envoyé à ton adresse email !",
    ask_referral: "As-tu un code parrain ? C'est optionnel, tu peux passer cette étape si tu n'en as pas.",
    ask_otp: `Entre le code à ${OTP_LENGTH} chiffres que tu as reçu :`,
    verifying: "Vérification en cours...",
    success: `Excellent${successName} ! 🎉 Ton agent est maintenant actif. Prêt à découvrir ce qu'il peut faire pour toi ?`,
    error_generic: "Oups, quelque chose s'est mal passé. Réessayons.",
    error_invalid_email: "Hmm, cet email ne semble pas valide. Peux-tu vérifier ?",
    error_invalid_otp: "Ce code n'est pas correct. Vérifie et réessaie.",
    error_invalid_referral: "Ce code parrain n'est pas valide. Vérifie ou passe cette étape.",
  };
}

// Séquence des étapes
const STEP_SEQUENCE: Record<AuthStep, AuthStep | null> = {
  'init': 'welcome',
  'welcome': 'context',
  'context': 'ask_email',
  'ask_email': null, // Attend input email
  'sending_otp': null,
  'otp_sent': 'ask_referral',
  'ask_referral': null, // Attend input ou skip
  'ask_otp': null, // Attend input OTP
  'verifying': null,
  'success': null,
  'error': null,
};

export function ConversationalAuth() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);
  
  // State
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [step, setStep] = useState<AuthStep>('init');
  const [messages, setMessages] = useState<Message[]>([]);
  const [email, setEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  
  // Profil visiteur (depuis l'onboarding)
  const [visitorFirstName, setVisitorFirstName] = useState<string | null>(null);
  const [visitorSessionId, setVisitorSessionId] = useState<string | null>(null);
  
  // Messages personnalisés basés sur le prénom
  const AGENT_MESSAGES = getAgentMessages(visitorFirstName);
  
  // Params
  const urlReferralCode = searchParams.get('ref');
  const redirectPath = searchParams.get('redirect') || '/agent';

  // Device fingerprint pour la protection anti-doublons
  const { fingerprint, getFingerprint } = useDeviceFingerprint();
  
  // Récupérer le profil visiteur au montage
  useEffect(() => {
    const firstName = getVisitorFirstName();
    const sessionId = getVisitorSessionId();
    setVisitorFirstName(firstName);
    setVisitorSessionId(sessionId);
  }, []);

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Ajouter un message agent
  const addAgentMessage = useCallback((messageStep: AuthStep, content: string) => {
    const id = `msg-${Date.now()}`;
    setMessages(prev => [...prev, { id, type: 'agent', content, step: messageStep }]);
    setTypingMessageId(id);
    return id;
  }, []);

  // Ajouter un message utilisateur
  const addUserMessage = useCallback((content: string) => {
    const id = `user-${Date.now()}`;
    setMessages(prev => [...prev, { id, type: 'user', content, step }]);
  }, [step]);

  // Gérer la fin du typing d'un message
  const handleTypingComplete = useCallback((messageId: string, messageStep: AuthStep) => {
    setTypingMessageId(null);
    
    // Passer à l'étape suivante après un délai
    const nextStep = STEP_SEQUENCE[messageStep];
    if (nextStep) {
      setTimeout(() => {
        setStep(nextStep);
      }, 400);
    }
  }, []);

  // Effet pour ajouter les messages selon l'étape
  useEffect(() => {
    if (step === 'init') return;
    if (typingMessageId) return;
    
    const messageContent = AGENT_MESSAGES[step];
    if (messageContent && !messages.some(m => m.step === step)) {
      addAgentMessage(step, messageContent);
    }
  }, [step, typingMessageId, messages, addAgentMessage]);

  // Vérifier l'état d'authentification au chargement
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    
    const checkAuthStatus = async () => {
      try {
        // 1. Vérifier si l'utilisateur est déjà connecté
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Utilisateur connecté → rediriger vers l'agent
          router.replace(redirectPath);
          return;
        }

        // 2. Vérifier si un email est en cours d'onboarding
        const storedEmail = sessionStorage.getItem('tug_auth_identifier');
        
        if (storedEmail) {
          // Reprendre le flow avec l'email stocké
          setEmail(storedEmail);
          setIsCheckingAuth(false);
          setTimeout(() => {
            addAgentMessage('welcome', AGENT_MESSAGES.welcome);
            setTimeout(() => {
              // Reprendre à l'étape code parrain (OTP déjà envoyé)
              setStep('ask_referral');
            }, 500);
          }, 600);
          return;
        }

        // 3. Sinon, démarrer normalement depuis le début
        setIsCheckingAuth(false);
        setTimeout(() => {
          setStep('welcome');
        }, 600);

      } catch (error) {
        console.error('Auth check error:', error);
        setIsCheckingAuth(false);
        setTimeout(() => {
          setStep('welcome');
        }, 600);
      }
    };

    checkAuthStatus();
  }, [addAgentMessage, router, redirectPath]);

  // Soumettre l'email (envoi du code OTP)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isLoading) return;

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      addAgentMessage('error', AGENT_MESSAGES.error_invalid_email);
      return;
    }

    // Afficher le message utilisateur
    addUserMessage(email);
    setIsLoading(true);
    
    // Stocker pour plus tard
    sessionStorage.setItem('tug_auth_identifier', email);
    sessionStorage.setItem('tug_auth_type', 'email');

    setTimeout(() => setStep('sending_otp'), 300);

    try {
      // Récupérer le fingerprint (ou le regénérer si pas encore disponible)
      const fp = fingerprint || await getFingerprint();
      
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: email,
          referrerCode: urlReferralCode,
          // Données de fingerprint pour la protection anti-doublons
          fingerprintId: fp?.visitorId,
          fingerprintMetadata: fp?.components,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        addAgentMessage('error', data.error || AGENT_MESSAGES.error_generic);
        setStep('ask_email');
        setIsLoading(false);
        return;
      }

      // Avertissement si doublon détecté (mais on continue quand même)
      if (data.data?.isSuspicious) {
        addAgentMessage('error', "⚠️ Je remarque que cet appareil a déjà été utilisé pour un autre compte. Si c'est bien toi, continue. Sinon, connecte-toi avec ton compte existant.");
      }

      // Succès - passer à l'étape otp_sent → ask_referral
      setTimeout(() => setStep('otp_sent'), 1000);

    } catch (err) {
      console.error('Send OTP error:', err);
      addAgentMessage('error', AGENT_MESSAGES.error_generic);
      setStep('ask_email');
    } finally {
      setIsLoading(false);
    }
  };

  // Soumettre le code parrain
  const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralCode.trim()) {
      handleSkipReferral();
      return;
    }

    addUserMessage(referralCode);
    
    // Stocker le code parrain
    sessionStorage.setItem('tug_referrer_code', referralCode);
    
    // Passer directement à la demande OTP (déjà envoyé avec l'email)
    setTimeout(() => {
      setStep('ask_otp');
    }, 500);
  };

  // Passer l'étape parrain
  const handleSkipReferral = () => {
    addUserMessage("Je n'ai pas de code");
    sessionStorage.removeItem('tug_referrer_code');
    // Passer directement à la demande OTP (déjà envoyé avec l'email)
    setTimeout(() => {
      setStep('ask_otp');
    }, 500);
  };

  // Gérer l'input OTP
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-focus next input
    if (digit && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit quand complet
    const completeCode = newOtp.join('');
    if (completeCode.length === OTP_LENGTH && /^\d+$/.test(completeCode)) {
      handleOtpSubmit(completeCode);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    
    if (pastedData) {
      const newOtp = pastedData.split('').concat(Array(OTP_LENGTH).fill('')).slice(0, OTP_LENGTH);
      setOtp(newOtp);
      
      if (pastedData.length === OTP_LENGTH) {
        handleOtpSubmit(pastedData);
      }
    }
  };

  // Soumettre l'OTP
  const handleOtpSubmit = async (code: string) => {
    if (isLoading) return;

    addUserMessage(code.split('').join(' '));
    setIsLoading(true);

    setTimeout(() => setStep('verifying'), 300);

    try {
      const storedRef = sessionStorage.getItem('tug_referrer_code');

      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: email,
          code,
          referrerCode: storedRef,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        addAgentMessage('error', data.error || AGENT_MESSAGES.error_invalid_otp);
        setOtp(Array(OTP_LENGTH).fill(''));
        setStep('ask_otp');
        setIsLoading(false);
        return;
      }

      // Succès !
      sessionStorage.removeItem('tug_auth_identifier');
      sessionStorage.removeItem('tug_auth_type');
      sessionStorage.removeItem('tug_referrer_code');
      sessionStorage.removeItem('tug_email_verified');

      // Transférer le profil visiteur vers l'utilisateur authentifié
      if (visitorSessionId) {
        try {
          await fetch('/api/agent/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: visitorSessionId }),
          });
          // Nettoyer le cache local du profil visiteur
          localStorage.removeItem(VISITOR_PROFILE_KEY);
          localStorage.removeItem(SESSION_ID_KEY);
        } catch (claimError) {
          console.error('Error claiming visitor profile:', claimError);
          // On continue quand même, ce n'est pas bloquant
        }
      }

      setTimeout(() => setStep('success'), 500);

      // Redirection après le message de succès
      setTimeout(() => {
        router.push(redirectPath);
      }, 3500);

    } catch (err) {
      console.error('Verify OTP error:', err);
      addAgentMessage('error', AGENT_MESSAGES.error_generic);
      setOtp(Array(OTP_LENGTH).fill(''));
      setStep('ask_otp');
    } finally {
      setIsLoading(false);
    }
  };

  // Renvoyer le code OTP
  const handleResendOtp = async () => {
    if (isLoading) return;
    setIsLoading(true);
    addAgentMessage('sending_otp', "Je te renvoie un nouveau code...");
    
    try {
      const fp = fingerprint || await getFingerprint();
      
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: email,
          referrerCode: sessionStorage.getItem('tug_referrer_code'),
          fingerprintId: fp?.visitorId,
          fingerprintMetadata: fp?.components,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        addAgentMessage('error', data.error || AGENT_MESSAGES.error_generic);
      } else {
        addAgentMessage('otp_sent', "✓ Nouveau code envoyé !");
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      addAgentMessage('error', AGENT_MESSAGES.error_generic);
    } finally {
      setIsLoading(false);
    }
  };

  // Conditions d'affichage des inputs
  const showEmailInput = step === 'ask_email' && !isLoading && !typingMessageId;
  const showReferralInput = step === 'ask_referral' && !isLoading && !typingMessageId;
  const showOtpInput = step === 'ask_otp' && !isLoading && !typingMessageId;

  // Loader pendant la vérification d'auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="auth-cyber-bg" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Image
            src="/logo.svg"
            alt="Tuge AI"
            width={48}
            height={48}
            className="animate-pulse"
          />
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-white/50 text-sm">Vérification en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Cyber Background */}
      <div className="auth-cyber-bg" />

      {/* Chat Container */}
      <div className="w-full max-w-lg relative z-10 animate-chat-scale-in">
        {/* Header avec logo */}
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/logo.svg"
              alt="Tuge AI"
              width={40}
              height={40}
              className="transition-transform duration-300 group-hover:scale-105"
            />
            <span className="text-xl font-bold text-white">
              Tuge<span className="text-violet-glow"> AI</span>
            </span>
          </Link>
        </div>

        {/* Chat Window */}
        <div className="chat-container-glass">
          {/* Chat Header */}
          <div className="flex items-center gap-3 p-4 border-b border-white/10">
            <div className="agent-avatar">
              <div className="agent-avatar-inner">
                <AgentIcon />
              </div>
              <span className="status-dot" />
            </div>
            <div>
              <p className="font-semibold text-white">Agent Tuge</p>
              <p className="text-xs text-white/50">En ligne • Répond instantanément</p>
            </div>
          </div>

          {/* Messages */}
          <div className="p-4 space-y-4 min-h-[320px] max-h-[450px] overflow-y-auto">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isTyping={typingMessageId === message.id}
                onTypingComplete={() => handleTypingComplete(message.id, message.step)}
              />
            ))}

            {/* Input Email */}
            {showEmailInput && (
              <div className="animate-message-in">
                <form onSubmit={handleEmailSubmit} className="mt-4">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ton@email.com"
                      className="cyber-input flex-1"
                      autoFocus
                      autoComplete="email"
                    />
                    <button
                      type="submit"
                      disabled={!email.trim()}
                      className="cyber-btn px-4"
                    >
                      <SendIcon />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Input Code Parrain */}
            {showReferralInput && (
              <div className="animate-message-in mt-4">
                <form onSubmit={handleReferralSubmit}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      placeholder="CODE-PARRAIN"
                      className="cyber-input flex-1 uppercase tracking-wider"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="cyber-btn px-4"
                    >
                      <SendIcon />
                    </button>
                  </div>
                </form>
                <button
                  onClick={handleSkipReferral}
                  className="w-full mt-3 text-sm text-white/40 hover:text-white/70 transition-colors"
                >
                  Je n&apos;ai pas de code parrain →
                </button>
              </div>
            )}

            {/* Input OTP */}
            {showOtpInput && (
              <div className="animate-message-in mt-4">
                <div className="flex justify-center gap-1.5 flex-wrap">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpInputRefs.current[index] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className={`cyber-otp-input ${digit ? 'filled' : ''}`}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
                <button
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="w-full mt-4 text-sm text-white/50 hover:text-white/80 transition-colors disabled:opacity-50"
                >
                  Renvoyer le code
                </button>
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start animate-message-in">
                <div className="chat-bubble-agent">
                  <div className="typing-indicator">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}

            {/* Success CTA */}
            {step === 'success' && !typingMessageId && (
              <div className="animate-message-in mt-4">
                <Link href={redirectPath}>
                  <button className="cyber-btn w-full flex items-center justify-center gap-2">
                    <span>Découvrir mon Agent</span>
                    <ArrowIcon />
                  </button>
                </Link>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

// Composant Message avec effet typewriter
function MessageBubble({ 
  message, 
  isTyping,
  onTypingComplete,
}: { 
  message: Message;
  isTyping: boolean;
  onTypingComplete: () => void;
}) {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const indexRef = useRef(0);
  const hasCompletedRef = useRef(false);

  // Cursor blink
  useEffect(() => {
    if (!isTyping) return;
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, [isTyping]);

  // Typewriter effect
  useEffect(() => {
    if (message.type !== 'agent' || !isTyping) {
      if (message.type === 'agent' && !isTyping) {
        setDisplayedText(message.content);
      }
      return;
    }

    indexRef.current = 0;
    hasCompletedRef.current = false;
    setDisplayedText('');

    let animationFrame: number;
    let startTime: number;
    const speed = 25;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      const targetIndex = Math.floor(elapsed / speed);
      
      if (targetIndex > indexRef.current && indexRef.current < message.content.length) {
        indexRef.current = Math.min(targetIndex, message.content.length);
        setDisplayedText(message.content.slice(0, indexRef.current));
      }
      
      if (indexRef.current < message.content.length) {
        animationFrame = requestAnimationFrame(animate);
      } else if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        setDisplayedText(message.content);
        onTypingComplete();
      }
    };

    const timeout = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, 100);

    return () => {
      clearTimeout(timeout);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [message.content, message.type, isTyping, onTypingComplete]);

  if (message.type === 'user') {
    return (
      <div className="flex justify-end animate-message-in">
        <div className="chat-bubble-user max-w-[85%]">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start animate-message-in">
      <div className="chat-bubble-agent max-w-[85%]">
        <span>{displayedText}</span>
        {isTyping && showCursor && <span className="typewriter-cursor" />}
      </div>
    </div>
  );
}

// Icons
function AgentIcon() {
  return (
    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

export default ConversationalAuth;
