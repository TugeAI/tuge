'use client';

import { useState } from 'react';
import { Mail, Phone, ArrowRight, Loader2, Users } from 'lucide-react';

interface EmailStepProps {
  onSubmit: (identifier: string, type: 'email' | 'phone', referralCode?: string) => Promise<void>;
  referralCode?: string | null;
  isLoading: boolean;
  error?: string | null;
}

export function EmailStep({ onSubmit, referralCode, isLoading, error }: EmailStepProps) {
  const [inputType, setInputType] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [localReferralCode, setLocalReferralCode] = useState(referralCode || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    await onSubmit(identifier.trim(), inputType, localReferralCode || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Toggle Email/Phone */}
      <div className="flex gap-2 p-1 bg-[var(--bg-tertiary)] rounded-full">
        <button
          type="button"
          onClick={() => setInputType('email')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-sm font-medium transition-all duration-200 ${
            inputType === 'email'
              ? 'bg-white text-[var(--brand-violet)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Mail size={16} />
          Email
        </button>
        <button
          type="button"
          onClick={() => setInputType('phone')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-sm font-medium transition-all duration-200 ${
            inputType === 'phone'
              ? 'bg-white text-[var(--brand-violet)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Phone size={16} />
          Téléphone
        </button>
      </div>

      {/* Input Field */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          {inputType === 'email' ? 'Adresse email' : 'Numéro de téléphone'}
        </label>
        <input
          type={inputType === 'email' ? 'email' : 'tel'}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder={
            inputType === 'email'
              ? 'ton@email.com'
              : '+33 6 12 34 56 78'
          }
          required
          disabled={isLoading}
          className="w-full px-4 py-3.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-violet)] focus:ring-2 focus:ring-[var(--brand-violet)]/20 transition-all duration-200 disabled:opacity-50"
        />
      </div>

      {/* Referral Code Field */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          Code parrain <span className="text-[var(--text-muted)]">(optionnel)</span>
        </label>
        <input
          type="text"
          value={localReferralCode}
          onChange={(e) => setLocalReferralCode(e.target.value)}
          placeholder="CODE123"
          disabled={isLoading}
          className="w-full px-4 py-3.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-violet)] focus:ring-2 focus:ring-[var(--brand-violet)]/20 transition-all duration-200 disabled:opacity-50"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm animate-fade-in">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !identifier.trim()}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 text-white font-semibold rounded-xl bg-gradient-to-r from-[var(--brand-violet)] to-[var(--brand-purple)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg btn-glow"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            Recevoir le lien de confirmation
            <ArrowRight size={18} />
          </>
        )}
      </button>

      {/* Info Box */}
      <div className="flex items-start gap-3 p-4 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl">
        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--brand-violet)]/10 text-[var(--brand-violet)] shrink-0">
          <Users size={16} />
        </div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {referralCode ? (
            <>Tu as été parrainé ! Ton parrain sera automatiquement associé à ton compte.</>
          ) : (
            <>Sans parrain ? Tu seras automatiquement rattaché à la communauté.</>
          )}
        </p>
      </div>
    </form>
  );
}

export default EmailStep;







