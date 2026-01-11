'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BRAND } from '@/config/brand';
import { Mail, Twitter, Linkedin, Instagram, ArrowRight } from 'lucide-react';

const footerSections = {
  product: {
    title: 'Produit',
    links: [
      { href: '#fonctionnement', label: 'Comment ça marche' },
      { href: '#agent', label: 'Agent IA' },
      { href: '#tarifs', label: 'Tarifs' },
      { href: '/agent', label: 'Essayer maintenant' },
    ],
  },
  resources: {
    title: 'Ressources',
    links: [
      { href: '#faq', label: 'FAQ' },
      { href: '/contact', label: 'Support' },
      { href: '/#fonctionnement', label: 'Documentation' },
    ],
  },
  company: {
    title: 'Entreprise',
    links: [
      { href: '/contact', label: 'Contact' },
      { href: '/mentions-legales', label: 'Mentions légales' },
      { href: '/confidentialite', label: 'Confidentialité' },
    ],
  },
};

const socialLinks = [
  { 
    name: 'Twitter', 
    href: BRAND.social.twitter, 
    icon: Twitter,
    color: 'hover:text-[#1DA1F2]',
  },
  { 
    name: 'LinkedIn', 
    href: BRAND.social.linkedin, 
    icon: Linkedin,
    color: 'hover:text-[#0A66C2]',
  },
  { 
    name: 'Instagram', 
    href: BRAND.social.instagram, 
    icon: Instagram,
    color: 'hover:text-[#E4405F]',
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-[var(--bg-tertiary)] border-t border-[var(--border-primary)]">
      {/* Gradient Background Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--brand-violet)] rounded-full blur-[128px] opacity-20" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[var(--brand-purple)] rounded-full blur-[128px] opacity-20" />
      </div>

      <div className="container-main relative">
        {/* Main Footer Content */}
        <div className="py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-4">
              <Link href="/" className="flex items-center gap-3 mb-4 group">
                <div className="relative">
                  <Image
                    src="/logo.svg"
                    alt="Tuge AI"
                    width={40}
                    height={40}
                    className="transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <span className="text-xl font-bold text-[var(--text-primary)]">
                  Tuge<span className="text-gradient"> AI</span>
                </span>
              </Link>
              <p className="text-[var(--text-secondary)] mb-6 leading-relaxed max-w-sm">
                {BRAND.description}
              </p>
              
              {/* Social Links */}
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.name}
                      className={`
                        w-10 h-10 rounded-lg 
                        bg-[var(--bg-secondary)] 
                        border border-[var(--border-primary)] 
                        hover:border-[var(--brand-violet)]
                        flex items-center justify-center 
                        text-[var(--text-tertiary)] ${social.color}
                        transition-all duration-200 
                        hover:scale-105 hover:shadow-md
                      `}
                    >
                      <Icon size={18} />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Links Sections */}
            <div className="lg:col-span-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                {/* Product Links */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4">
                    {footerSections.product.title}
                  </h3>
                  <ul className="space-y-3">
                    {footerSections.product.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-sm text-[var(--text-tertiary)] hover:text-[var(--brand-violet)] transition-colors duration-200 flex items-center gap-1 group"
                        >
                          <span>{link.label}</span>
                          <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Resources Links */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4">
                    {footerSections.resources.title}
                  </h3>
                  <ul className="space-y-3">
                    {footerSections.resources.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-sm text-[var(--text-tertiary)] hover:text-[var(--brand-violet)] transition-colors duration-200 flex items-center gap-1 group"
                        >
                          <span>{link.label}</span>
                          <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Company Links */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4">
                    {footerSections.company.title}
                  </h3>
                  <ul className="space-y-3">
                    {footerSections.company.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-sm text-[var(--text-tertiary)] hover:text-[var(--brand-violet)] transition-colors duration-200 flex items-center gap-1 group"
                        >
                          <span>{link.label}</span>
                          <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-[var(--border-primary)]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-sm text-[var(--text-muted)] text-center md:text-left">
              {BRAND.copyright}
            </p>

            {/* Contact Email */}
            <a
              href={`mailto:${BRAND.supportEmail}`}
              className="flex items-center gap-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--brand-violet)] transition-colors duration-200 group"
            >
              <Mail size={16} className="group-hover:scale-110 transition-transform duration-200" />
              <span>{BRAND.supportEmail}</span>
            </a>

            {/* Made in France Badge (optionnel) */}
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <span>Made with</span>
              <span className="text-red-500 animate-pulse">♥</span>
              <span>in France</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;






