'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, ThemeToggle } from '@/components/ui';
import { navigation, siteConfig } from '@/content/landing';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-50
        transition-all duration-300
        ${
          isScrolled
            ? 'py-3 glass border-b border-[var(--border-primary)]'
            : 'py-5 bg-transparent'
        }
      `}
    >
      <nav className="container-main flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 group"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-primary)] flex items-center justify-center overflow-hidden group-hover:border-[var(--accent-cyan)] transition-colors">
              <LogoIcon />
            </div>
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--glow-cyan)] blur-xl" />
          </div>
          <span className="text-xl font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-cyan)] transition-colors font-mono">
            {siteConfig.name}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1">
          {navigation.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg transition-all
                ${link.highlight 
                  ? 'text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/10' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }
              `}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-3">
          <ThemeToggle />
          <Link href={navigation.cta.href}>
            <Button size="sm" variant="neon">
              {navigation.cta.label}
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex lg:hidden items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] hover:border-[var(--accent-cyan)] transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`
          lg:hidden
          absolute top-full left-0 right-0
          glass border-b border-[var(--border-primary)]
          transition-all duration-300 overflow-hidden
          ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="container-main py-4 flex flex-col gap-1">
          {navigation.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`
                py-3 px-4 text-sm font-medium rounded-lg transition-all
                ${link.highlight 
                  ? 'text-[var(--accent-cyan)] bg-[var(--accent-cyan)]/5' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }
              `}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 mt-3 border-t border-[var(--border-primary)]">
            <Link href={navigation.cta.href}>
              <Button fullWidth size="md" variant="neon">
                {navigation.cta.label}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function LogoIcon() {
  return (
    <svg className="w-6 h-6 text-[var(--accent-cyan)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      className="w-5 h-5 text-[var(--text-primary)]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      className="w-5 h-5 text-[var(--text-primary)]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default Navbar;
