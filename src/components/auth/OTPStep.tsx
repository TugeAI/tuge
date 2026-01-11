'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowRight, Loader2, ArrowLeft, Shield } from 'lucide-react';

interface OTPStepProps {
  identifier: string;
  identifierType: 'email' | 'phone';
  onSubmit: (code: string) => Promise<void>;
  onBack: () => void;
  onResend: () => Promise<void>;
  isLoading: boolean;
  error?: string | null;
}

export function OTPStep({
  identifier,
  identifierType,
  onSubmit,
  onBack,
  onResend,
  isLoading,
  error,
}: OTPStepProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (index === 5 && value) {
      const code = newOtp.join('');
      if (code.length === 6) {
        onSubmit(code);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      onSubmit(pastedData);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    await onResend();
    setIsResending(false);
    setResendCooldown(60);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length === 6) {
      onSubmit(code);
    }
  };

  const maskedIdentifier = identifierType === 'email'
    ? identifier.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    : identifier.replace(/(.{4})(.*)(.{2})/, '$1****$3');

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--brand-violet)] transition-colors"
      >
        <ArrowLeft size={16} />
        Modifier mon {identifierType === 'email' ? 'email' : 'téléphone'}
      </button>

      {/* Info */}
      <div className="text-center">
        <p className="text-[var(--text-secondary)]">
          Un code à 6 chiffres a été envoyé à
        </p>
        <p className="font-semibold text-[var(--text-primary)] mt-1">
          {maskedIdentifier}
        </p>
      </div>

      {/* OTP Inputs */}
      <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            disabled={isLoading}
            className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-bold bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:border-[var(--brand-violet)] focus:ring-2 focus:ring-[var(--brand-violet)]/20 transition-all duration-200 disabled:opacity-50"
          />
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center animate-fade-in">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || otp.join('').length < 6}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 text-white font-semibold rounded-xl bg-gradient-to-r from-[var(--brand-violet)] to-[var(--brand-purple)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg btn-glow"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            Créer mon compte
            <ArrowRight size={18} />
          </>
        )}
      </button>

      {/* Resend */}
      <div className="text-center">
        {resendCooldown > 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            Renvoyer le code dans {resendCooldown}s
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-sm text-[var(--brand-violet)] hover:underline disabled:opacity-50"
          >
            {isResending ? 'Envoi en cours...' : 'Renvoyer le code'}
          </button>
        )}
      </div>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
        <Shield size={14} />
        <span>Connexion sécurisée sans mot de passe</span>
      </div>
    </form>
  );
}

export default OTPStep;







