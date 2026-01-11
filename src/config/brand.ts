/**
 * Configuration centralisée de la marque Tuge
 * 
 * Ce fichier contient toutes les constantes de marque utilisées dans l'application.
 * Pour rebrander l'application, modifiez uniquement ce fichier.
 * 
 * Historique:
 * - Avant: "Tousgether" / "To us gether" / "tousgether.com"
 * - Après: "Tuge" / "tuge.app"
 */

export const BRAND = {
  // === Identité de marque ===
  /** Nom de la marque affiché dans l'UI */
  name: 'Tuge',
  
  /** Nom complet/légal de l'entreprise */
  legalName: 'TO US GETHER SASU',
  
  /** Sigle de l'entreprise */
  sigle: 'TOUSGETHER',
  
  /** Tagline principale */
  tagline: 'Marketplace conversationnelle IA',
  
  /** Description courte pour SEO */
  description: 'La première plateforme où l\'IA fait le travail à votre place. Achetez, vendez et proposez des services simplement en discutant.',
  
  /** Description OpenGraph */
  ogDescription: 'La première plateforme où l\'IA fait le travail à votre place. Achetez, vendez et proposez des services simplement en discutant.',
  
  // === Domaines et URLs ===
  /** Domaine principal (nouveau) */
  domain: 'tuge.app',
  
  /** URL complète du site */
  url: 'https://tuge.app',
  
  /** Ancien domaine (pour compatibilité/redirections) */
  legacyDomain: 'tousgether.com',
  
  /** Ancienne URL (pour compatibilité/redirections) */
  legacyUrl: 'https://tousgether.com',
  
  // === Emails ===
  /** Email de support */
  supportEmail: 'support@tuge.app',
  
  /** Email no-reply pour les notifications */
  noReplyEmail: 'noreply@tuge.app',
  
  /** Expéditeur par défaut pour Resend */
  emailFrom: 'Tuge <noreply@tuge.app>',
  
  // === Informations légales ===
  /** SIREN de l'entreprise */
  siren: '952 276 939',
  
  /** Code APE */
  codeAPE: '7010Z',
  
  /** Adresse du siège social */
  address: {
    street: '6 rue Rose Dieng-Kuntz',
    postalCode: '44300',
    city: 'Nantes',
    country: 'France',
    full: '6 rue Rose Dieng-Kuntz, 44300 Nantes, France',
  },
  
  /** Forme juridique */
  legalForm: 'SASU',
  
  /** Date d\'immatriculation RNE */
  registrationDate: '12/05/2023',
  
  // === Réseaux sociaux ===
  social: {
    twitter: 'https://twitter.com/tugeapp',
    linkedin: 'https://linkedin.com/company/tuge',
    instagram: 'https://instagram.com/tugeapp',
  },
  
  // === SEO / App ===
  /** Titre SEO par défaut */
  seoTitle: 'Tuge | La marketplace conversationnelle propulsée par l\'IA',
  
  /** Titre pour les cartes Twitter */
  twitterTitle: 'Tuge | Marketplace conversationnelle IA',
  
  /** Nom de l'app (manifest, PWA) */
  appName: 'Tuge',
  
  /** Nom court de l'app */
  appShortName: 'Tuge',
  
  // === Agent IA ===
  /** Nom de l'agent IA */
  agentName: 'Tuge',
  
  /** Description de l'agent */
  agentDescription: 'Assistant IA de Tuge, la marketplace conversationnelle',
  
  // === Copyright ===
  /** Copyright dynamique */
  get copyright() {
    return `© ${new Date().getFullYear()} ${this.name}. Tous droits réservés.`
  },
} as const

/**
 * Génère un lien de parrainage
 * @param referralCode - Code parrain de l'utilisateur
 * @returns URL complète du lien de parrainage
 */
export function getReferralLink(referralCode: string): string {
  return `${BRAND.url}/?ref=${referralCode}`
}

/**
 * Génère un lien de parrainage legacy (pour compatibilité)
 * @param referralCode - Code parrain de l'utilisateur
 * @returns URL legacy du lien de parrainage
 * @deprecated Utiliser getReferralLink à la place
 */
export function getLegacyReferralLink(referralCode: string): string {
  return `${BRAND.legacyUrl}/?ref=${referralCode}`
}

export default BRAND






