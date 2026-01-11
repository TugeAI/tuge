'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface SignupFormProps {
  redirectTo?: string;
}

export function SignupForm({ redirectTo = '/agent' }: SignupFormProps) {
  const router = useRouter();
  const supabase = createClient();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Calcul de la force du mot de passe
  const calculatePasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
    return Math.min(strength, 4);
  };

  // Gestion de l'inscription Google OAuth
  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        setError('Impossible de se connecter avec Google. Réessayez.');
        console.error('Google OAuth error:', error);
      }
      // Pas besoin de setIsGoogleLoading(false) car on redirige
    } catch (err) {
      console.error('Google signup error:', err);
      setError('Une erreur est survenue. Réessayez.');
      setIsGoogleLoading(false);
    }
  };

  // Gestion de l'inscription classique
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validation côté client
    if (!email || !password || !confirmPassword) {
      setError('Tous les champs sont requis');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Une erreur est survenue lors de l\'inscription');
        setIsLoading(false);
        return;
      }

      // Succès - redirection
      router.push(redirectTo);
    } catch (err) {
      console.error('Signup error:', err);
      setError('Impossible de contacter le serveur. Réessayez.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Erreur globale */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl animate-fade-in flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700 flex-1">{error}</p>
        </div>
      )}

      {/* Bouton Google OAuth - CTA principal */}
      <button
        onClick={handleGoogleSignup}
        disabled={isGoogleLoading || isLoading}
        className="relative w-full py-4 px-6 bg-white border-2 border-[var(--border-primary)] rounded-2xl font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:border-[var(--brand-violet)] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-lg group overflow-hidden"
      >
        {/* Effet de brillance au hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12" />
        
        {isGoogleLoading ? (
          <div className="w-5 h-5 border-2 border-[var(--brand-violet)] border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <svg className="w-5 h-5 transition-transform group-hover:scale-110 duration-300" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="relative z-10">Continuer avec Google</span>
          </>
        )}
      </button>

      {/* Séparateur "OU" */}
      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border-primary)]"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-6 py-1 bg-[var(--bg-elevated)] text-[var(--text-tertiary)] font-medium text-xs uppercase tracking-widest">
            Ou par email
          </span>
        </div>
      </div>

      {/* Formulaire classique */}
      <form onSubmit={handleEmailSignup} className="space-y-5">
        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-semibold text-[var(--text-primary)]">
            Adresse email
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-[var(--text-muted)] group-focus-within:text-[var(--brand-violet)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || isGoogleLoading}
              placeholder="vous@exemple.com"
              className="w-full pl-12 pr-4 py-3.5 bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-2xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--brand-violet)]/10 focus:border-[var(--brand-violet)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              required
            />
          </div>
        </div>

        {/* Mot de passe */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-semibold text-[var(--text-primary)]">
            Mot de passe
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-[var(--text-muted)] group-focus-within:text-[var(--brand-violet)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordStrength(calculatePasswordStrength(e.target.value));
              }}
              disabled={isLoading || isGoogleLoading}
              placeholder="Minimum 8 caractères"
              className="w-full pl-12 pr-12 py-3.5 bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-2xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--brand-violet)]/10 focus:border-[var(--brand-violet)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-all"
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Indicateur de force du mot de passe */}
          {password && (
            <div className="space-y-1.5 animate-fade-in">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      passwordStrength >= level
                        ? passwordStrength <= 1
                          ? 'bg-red-500'
                          : passwordStrength <= 2
                          ? 'bg-orange-500'
                          : passwordStrength <= 3
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                        : 'bg-[var(--bg-tertiary)]'
                    }`}
                  />
                ))}
              </div>
              <p className={`text-xs ${
                passwordStrength <= 1
                  ? 'text-red-600'
                  : passwordStrength <= 2
                  ? 'text-orange-600'
                  : passwordStrength <= 3
                  ? 'text-yellow-600'
                  : 'text-green-600'
              }`}>
                {passwordStrength <= 1 && 'Mot de passe faible'}
                {passwordStrength === 2 && 'Mot de passe moyen'}
                {passwordStrength === 3 && 'Mot de passe fort'}
                {passwordStrength === 4 && 'Mot de passe très fort'}
              </p>
            </div>
          )}
        </div>

        {/* Confirmation mot de passe */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[var(--text-primary)]">
            Confirmer le mot de passe
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-[var(--text-muted)] group-focus-within:text-[var(--brand-violet)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading || isGoogleLoading}
              placeholder="Confirmer votre mot de passe"
              className="w-full pl-12 pr-4 py-3.5 bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-2xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--brand-violet)]/10 focus:border-[var(--brand-violet)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              required
              minLength={8}
            />
            {confirmPassword && password === confirmPassword && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 animate-fade-in">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Bouton d'inscription */}
        <button
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="relative w-full py-4 px-6 bg-gradient-to-r from-[var(--brand-violet)] to-[var(--brand-purple)] text-white rounded-2xl font-semibold hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-[var(--brand-violet)]/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 overflow-hidden group"
        >
          {/* Effet de brillance animé */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/25 to-transparent transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
          
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="relative z-10">Création de votre compte...</span>
            </>
          ) : (
            <>
              <span className="relative z-10">Créer mon compte</span>
              <svg className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>
      </form>

      {/* Lien vers connexion */}
      <div className="text-center pt-2">
        <p className="text-sm text-[var(--text-secondary)]">
          Vous avez déjà un compte ?{' '}
          <Link
            href="/auth/login"
            className="text-[var(--brand-violet)] hover:text-[var(--brand-violet-dark)] font-semibold transition-colors inline-flex items-center gap-1 group"
          >
            <span>Se connecter</span>
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </p>
      </div>
    </div>
  );
}

