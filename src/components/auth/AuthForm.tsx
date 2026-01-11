'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { StepIndicator } from './StepIndicator';
import { EmailStep } from './EmailStep';
import { OTPStep } from './OTPStep';

const STEPS = [
  { id: 1, label: 'Email' },
  { id: 2, label: 'Confirmation' },
  { id: 3, label: 'Code OTP' },
];

type AuthStep = 'email' | 'waiting' | 'otp';

interface AuthFormProps {
  initialStep?: AuthStep;
  initialToken?: string | null;
}

function AuthFormContent({ initialStep = 'email', initialToken }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<AuthStep>(initialStep);
  const [identifier, setIdentifier] = useState('');
  const [identifierType, setIdentifierType] = useState<'email' | 'phone'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const referralCode = searchParams.get('ref');
  const redirectPath = searchParams.get('redirect') || '/agent';

  // Check if returning from confirmation link
  useEffect(() => {
    if (initialToken && initialStep === 'otp') {
      // Token is valid, OTP has been sent
      const storedIdentifier = sessionStorage.getItem('tug_auth_identifier');
      const storedType = sessionStorage.getItem('tug_auth_type') as 'email' | 'phone';
      if (storedIdentifier && storedType) {
        setIdentifier(storedIdentifier);
        setIdentifierType(storedType);
        setStep('otp');
      }
    }
  }, [initialToken, initialStep]);

  const getCurrentStepNumber = () => {
    switch (step) {
      case 'email': return 1;
      case 'waiting': return 2;
      case 'otp': return 3;
      default: return 1;
    }
  };

  // Step 1: Send confirmation email
  const handleEmailSubmit = async (id: string, type: 'email' | 'phone', refCode?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Store for later use
      sessionStorage.setItem('tug_auth_identifier', id);
      sessionStorage.setItem('tug_auth_type', type);
      if (refCode) {
        sessionStorage.setItem('tug_referrer_code', refCode);
      }

      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: id,
          referrerCode: refCode || referralCode,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Une erreur est survenue');
        return;
      }

      setIdentifier(id);
      setIdentifierType(type);
      setStep('waiting');

    } catch (err) {
      console.error('Send confirmation error:', err);
      setError('Impossible de contacter le serveur. Réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Verify OTP
  const handleOTPSubmit = async (code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const storedRef = sessionStorage.getItem('tug_referrer_code');

      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          code,
          referrerCode: storedRef,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Code invalide');
        return;
      }

      // Clear session storage
      sessionStorage.removeItem('tug_auth_identifier');
      sessionStorage.removeItem('tug_auth_type');
      sessionStorage.removeItem('tug_referrer_code');

      // Redirect to dashboard
      router.push(redirectPath);

    } catch (err) {
      console.error('Verify OTP error:', err);
      setError('Impossible de vérifier le code. Réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setError(null);
    
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          referrerCode: sessionStorage.getItem('tug_referrer_code'),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Impossible de renvoyer le code');
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError('Impossible de renvoyer le code');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-secondary)]">
      {/* Background */}
      <div className="hero-gradient" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/logo.svg"
              alt="Tuge AI"
              width={48}
              height={48}
              className="transition-transform duration-300 group-hover:scale-105"
            />
            <span className="text-2xl font-bold text-[var(--text-primary)]">
              Tuge<span className="text-[var(--brand-violet)]"> AI</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-3xl p-8 shadow-xl">
          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              {step === 'email' && 'Activer mon Agent IA'}
              {step === 'waiting' && 'Vérifie ta boîte mail'}
              {step === 'otp' && 'Entre ton code'}
            </h1>
            <p className="text-[var(--text-secondary)] text-sm">
              {step === 'email' && 'Crée ton compte en quelques secondes'}
              {step === 'waiting' && 'Un lien de confirmation t\'a été envoyé'}
              {step === 'otp' && 'Saisis le code reçu par email'}
            </p>
          </div>

          {/* Step Indicator */}
          <StepIndicator steps={STEPS} currentStep={getCurrentStepNumber()} />

          {/* Step Content */}
          {step === 'email' && (
            <EmailStep
              onSubmit={handleEmailSubmit}
              referralCode={referralCode}
              isLoading={isLoading}
              error={error}
            />
          )}

          {step === 'waiting' && (
            <div className="text-center space-y-6">
              {/* Email Icon */}
              <div className="w-20 h-20 mx-auto bg-[var(--brand-violet)]/10 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-[var(--brand-violet)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <div>
                <p className="text-[var(--text-secondary)] mb-2">
                  Clique sur le lien envoyé à
                </p>
                <p className="font-semibold text-[var(--text-primary)]">
                  {identifier}
                </p>
              </div>

              <p className="text-sm text-[var(--text-tertiary)]">
                Le lien expire dans 10 minutes. Vérifie aussi tes spams.
              </p>

              {/* Simulate confirmation for demo */}
              <button
                onClick={() => setStep('otp')}
                className="w-full py-3 px-6 text-[var(--brand-violet)] font-medium rounded-xl border border-[var(--brand-violet)] hover:bg-[var(--brand-violet)]/5 transition-colors"
              >
                J&apos;ai cliqué sur le lien (démo)
              </button>

              <button
                onClick={() => setStep('email')}
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand-violet)] transition-colors"
              >
                ← Modifier mon email
              </button>
            </div>
          )}

          {step === 'otp' && (
            <OTPStep
              identifier={identifier}
              identifierType={identifierType}
              onSubmit={handleOTPSubmit}
              onBack={() => setStep('email')}
              onResend={handleResendOTP}
              isLoading={isLoading}
              error={error}
            />
          )}
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-[var(--text-tertiary)] hover:text-[var(--brand-violet)] transition-colors"
          >
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

export function AuthForm(props: AuthFormProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-secondary)]">
        <div className="w-full max-w-md flex flex-col items-center gap-4">
          <Image
            src="/logo.svg"
            alt="Tuge AI"
            width={48}
            height={48}
            className="animate-pulse"
          />
          <div className="w-8 h-8 border-2 border-[var(--brand-violet)]/30 border-t-[var(--brand-violet)] rounded-full animate-spin" />
        </div>
      </div>
    }>
      <AuthFormContent {...props} />
    </Suspense>
  );
}

export default AuthForm;







