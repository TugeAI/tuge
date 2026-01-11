'use client';

import { type ReactNode } from 'react';

type BadgeVariant = 'default' | 'accent' | 'outline' | 'neon';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: `
    bg-[var(--bg-tertiary)] text-[var(--text-secondary)]
    border border-[var(--border-primary)]
  `,
  accent: `
    bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]
    border border-[var(--accent-cyan)]/20
  `,
  outline: `
    bg-transparent text-[var(--text-secondary)]
    border border-[var(--border-primary)]
  `,
  neon: `
    bg-[var(--bg-elevated)] text-[var(--accent-cyan)]
    border border-[var(--accent-cyan)]/30
    shadow-[0_0_15px_var(--glow-cyan)]
  `,
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2.5 py-1 text-xs gap-1.5',
  md: 'px-4 py-1.5 text-sm gap-2',
};

export function Badge({
  variant = 'default',
  size = 'sm',
  children,
  icon,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center
        font-medium font-mono
        rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

export default Badge;
