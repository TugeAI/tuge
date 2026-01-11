'use client';

import { type ReactNode, type HTMLAttributes } from 'react';

type CardVariant = 'default' | 'glass' | 'gradient' | 'bordered';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  default: `
    bg-[var(--bg-secondary)]
    border border-[var(--border-primary)]
  `,
  glass: `
    glass
  `,
  gradient: `
    bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)]
    border border-[var(--border-primary)]
  `,
  bordered: `
    bg-transparent
    border border-[var(--border-primary)]
  `,
};

const paddingStyles: Record<string, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  variant = 'default',
  hover = false,
  padding = 'md',
  children,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`
        rounded-[var(--radius-xl)]
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${hover ? 'card-hover cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardHeader({ children, className = '', ...props }: CardHeaderProps) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  as?: 'h2' | 'h3' | 'h4';
}

export function CardTitle({ children, as: Tag = 'h3', className = '', ...props }: CardTitleProps) {
  return (
    <Tag
      className={`text-lg font-semibold text-[var(--text-primary)] ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export function CardDescription({ children, className = '', ...props }: CardDescriptionProps) {
  return (
    <p
      className={`text-sm text-[var(--text-secondary)] mt-1 ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardContent({ children, className = '', ...props }: CardContentProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

interface CardIconProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  gradient?: boolean;
}

export function CardIcon({ children, gradient = false, className = '', ...props }: CardIconProps) {
  return (
    <div
      className={`
        w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center mb-4
        ${gradient
          ? 'bg-gradient-to-br from-[var(--accent-primary)] to-[var(--gradient-end)] text-white'
          : 'bg-[var(--accent-subtle)] text-[var(--accent-primary)]'
        }
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;







