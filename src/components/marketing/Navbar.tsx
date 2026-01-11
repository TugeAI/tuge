'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const navLinks = [
  { href: '#fonctionnement', label: 'Comment ça marche' },
  { href: '#agent', label: 'Agent IA' },
  { href: '#tarifs', label: 'Tarifs' },
  { href: '#faq', label: 'FAQ' },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
    });
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'glass py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="container-main flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/logo.svg"
            alt="Tuge AI"
            width={36}
            height={36}
            className="transition-transform duration-300 group-hover:scale-105"
          />
          <span className="text-xl font-bold text-[var(--text-primary)]">
            Tuge<span className="text-[var(--brand-violet)]"> AI</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--brand-violet)] transition-colors duration-200 link-underline"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA Button */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <Link
              href="/profile"
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-full bg-gradient-to-r from-[var(--brand-violet)] to-[var(--brand-purple)] hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-lg btn-glow"
            >
              <User size={16} />
              Mon espace
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="px-5 py-2.5 text-sm font-semibold text-white rounded-full bg-gradient-to-r from-[var(--brand-violet)] to-[var(--brand-purple)] hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-lg btn-glow"
            >
              Se connecter
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-[var(--text-primary)]"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 glass border-t border-[var(--border-primary)] animate-fade-in">
          <div className="container-main py-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-base font-medium text-[var(--text-secondary)] hover:text-[var(--brand-violet)] transition-colors py-2"
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <Link
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mt-2 w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white rounded-full bg-gradient-to-r from-[var(--brand-violet)] to-[var(--brand-purple)] transition-opacity hover:opacity-90"
              >
                <User size={16} />
                Mon espace
              </Link>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mt-2 w-full px-5 py-3 text-sm font-semibold text-white text-center rounded-full bg-gradient-to-r from-[var(--brand-violet)] to-[var(--brand-purple)] transition-opacity hover:opacity-90"
              >
                Se connecter
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
