import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Outfit } from 'next/font/google';
import './globals.css';
import { BRAND } from '@/config/brand';

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

const outfit = Outfit({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#ffffff',
};

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.url),
  title: 'Tuge AI | La tech au service de ton projet',
  description: 'Rejoins une communauté qui vend, s\'entraide et crée de la richesse ensemble — avec un Agent IA qui te conseille et agit pour toi.',
  keywords: [
    'agent IA',
    'intelligence artificielle',
    'entrepreneuriat',
    'MLM éthique',
    'communauté',
    'vente en ligne',
    'accompagnement entrepreneur',
    'visibilité',
    'parrainage',
  ],
  authors: [{ name: BRAND.name }],
  creator: BRAND.name,
  publisher: BRAND.name,
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: BRAND.url,
    siteName: BRAND.name,
    title: 'Tuge AI | La tech au service de ton projet',
    description: 'Rejoins une communauté qui vend, s\'entraide et crée de la richesse ensemble — avec un Agent IA qui te conseille et agit pour toi.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Tuge AI - La tech au service de ton projet',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tuge AI | La tech au service de ton projet',
    description: 'Rejoins une communauté qui vend, s\'entraide et crée de la richesse ensemble — avec un Agent IA qui te conseille et agit pour toi.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
