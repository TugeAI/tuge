/**
 * Service d'envoi d'emails via Resend
 * 
 * Ce service peut être utilisé pour personnaliser les emails
 * au-delà des templates Supabase par défaut.
 * 
 * Pour l'OTP, Supabase gère l'envoi nativement, mais Resend
 * peut être configuré comme SMTP custom dans le dashboard Supabase
 * pour une meilleure personnalisation.
 */

import { Resend } from 'resend'
import { BRAND } from '@/config/brand'

/**
 * Configuration de l'expéditeur par défaut
 */
const DEFAULT_FROM = BRAND.emailFrom

// ============================================================================
// CONSTANTES DE DESIGN TUGE
// ============================================================================

/**
 * Couleurs de la marque Tuge pour les emails
 */
const BRAND_COLORS = {
  // Violet foncé (primaire)
  violetDark: '#6d28d9',
  // Violet clair
  violetLight: '#c084fc',
  // Pink
  pink: '#f472b6',
  // Magenta
  magenta: '#be185d',
  // Fond clair avec teinte violette
  bgLight: '#faf8ff',
  // Fond secondaire
  bgSecondary: '#f5f2fa',
  // Texte principal
  textPrimary: '#1a0f2e',
  // Texte secondaire
  textSecondary: '#4a3d5c',
  // Texte tertiaire
  textTertiary: '#6e6182',
  // Texte muted
  textMuted: '#9e94ab',
}

/**
 * Logo Tuge en SVG inline pour les emails
 * Composé de 4 cercles aux couleurs de la marque
 */
const TUGE_LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 112.5 112.5">
  <circle cx="43.35" cy="56.15" r="9.625" fill="#6d28d9"/>
  <circle cx="68.65" cy="30.88" r="9.625" fill="#be185d"/>
  <circle cx="68.65" cy="56.15" r="9.625" fill="#f472b6"/>
  <circle cx="43.35" cy="81.13" r="9.625" fill="#c084fc"/>
</svg>
`

// ============================================================================
// CLIENT RESEND
// ============================================================================

/**
 * Initialisation paresseuse du client Resend
 * Évite les erreurs au build si RESEND_API_KEY n'est pas défini
 */
let resendClient: Resend | null = null

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }
    resendClient = new Resend(apiKey)
  }
  return resendClient
}

interface SendEmailParams {
  to: string
  subject: string
  html: string
  from?: string
}

/**
 * Envoie un email via Resend
 * 
 * @param params - Paramètres de l'email
 * @returns Résultat de l'envoi
 */
export async function sendEmail(params: SendEmailParams) {
  const { to, subject, html, from = DEFAULT_FROM } = params

  try {
    const resend = getResendClient()
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html
    })

    if (error) {
      console.error('[Resend] Email send error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }
  } catch (err) {
    console.error('[Resend] Unexpected error:', err)
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error' 
    }
  }
}

/**
 * Envoie un email de bienvenue après inscription réussie
 * 
 * @param to - Email du destinataire
 * @param name - Nom du destinataire (optionnel)
 * @param referrerCode - Code parrain du nouvel utilisateur
 */
export async function sendWelcomeEmail(
  to: string,
  referrerCode: string,
  name?: string
) {
  const greeting = name ? `Bonjour ${name}` : 'Bonjour'
  
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>Bienvenue sur ${BRAND.name}</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { padding: 16px !important; }
      .referral-box { padding: 20px 16px !important; }
      .referral-code { font-size: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #faf8ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf8ff;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(109, 40, 217, 0.08); overflow: hidden;">
          
          <!-- Header avec gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #6d28d9 0%, #be185d 100%); padding: 32px 40px; text-align: center;">
              <div style="margin-bottom: 16px;">
                ${TUGE_LOGO_SVG}
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">
                Bienvenue sur ${BRAND.name} !
              </h1>
            </td>
          </tr>
          
          <!-- Corps -->
          <tr>
            <td class="container" style="padding: 40px;">
              
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #1a0f2e; line-height: 1.5;">
                ${greeting},
              </p>
              
              <p style="margin: 0 0 28px 0; font-size: 16px; color: #4a3d5c; line-height: 1.6;">
                Votre compte a été créé avec succès ! Vous faites maintenant partie de la communauté <strong style="color: #6d28d9;">${BRAND.name}</strong>.
              </p>
              
              <!-- Code parrain -->
              <div class="referral-box" style="background: linear-gradient(135deg, #faf8ff 0%, #f5f2fa 100%); border: 2px dashed #6d28d9; border-radius: 12px; padding: 24px 20px; text-align: center; margin-bottom: 28px;">
                <p style="margin: 0 0 12px 0; font-size: 13px; color: #6e6182; text-transform: uppercase; letter-spacing: 1px;">
                  Votre code parrain personnel
                </p>
                <p class="referral-code" style="margin: 0; font-size: 28px; font-weight: 700; color: #6d28d9; letter-spacing: 3px; font-family: 'SF Mono', 'Roboto Mono', Consolas, monospace;">
                  ${referrerCode}
                </p>
              </div>
              
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #6e6182; line-height: 1.6;">
                🎁 Partagez ce code avec vos proches pour les inviter sur ${BRAND.name} et <strong style="color: #be185d;">gagnez des crédits</strong> à chaque inscription !
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${BRAND.url}/agent" style="display: inline-block; background: linear-gradient(135deg, #6d28d9 0%, #be185d 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 600; box-shadow: 0 4px 14px rgba(109, 40, 217, 0.35);">
                      Commencer à discuter →
                    </a>
                  </td>
                </tr>
              </table>
              
              <hr style="border: none; border-top: 1px solid #f5f2fa; margin: 20px 0;">
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #faf8ff; padding: 24px 40px; text-align: center; border-top: 1px solid #f5f2fa;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #6e6182;">
                ${BRAND.tagline}
              </p>
              <p style="margin: 0; font-size: 12px; color: #9e94ab;">
                ${BRAND.copyright}
              </p>
            </td>
          </tr>
          
        </table>
        
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; margin-top: 24px;">
          <tr>
            <td align="center">
              <p style="margin: 0; font-size: 12px; color: #9e94ab;">
                Besoin d'aide ? <a href="mailto:${BRAND.supportEmail}" style="color: #6d28d9; text-decoration: none;">Contactez-nous</a>
              </p>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>
  `

  return sendEmail({
    to,
    subject: `Bienvenue sur ${BRAND.name} ! 🎉`,
    html
  })
}

/**
 * Envoie une notification au parrain quand quelqu'un utilise son code
 * 
 * @param to - Email du parrain
 * @param referredEmail - Email du filleul (partiellement masqué)
 */
export async function sendReferralNotificationEmail(
  to: string,
  referredEmail: string
) {
  // Masque partiellement l'email du filleul pour la vie privée
  const [localPart, domain] = referredEmail.split('@')
  const maskedLocal = localPart.substring(0, 2) + '***'
  const maskedEmail = `${maskedLocal}@${domain}`

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Nouveau filleul ! 🌟</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #374151;">Bonne nouvelle !</p>
        
        <p style="font-size: 16px; color: #374151;">
          Quelqu'un a utilisé votre code parrain pour s'inscrire sur ${BRAND.name}.
        </p>
        
        <div style="background: white; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Nouveau membre</p>
          <p style="margin: 5px 0 0 0; font-size: 16px; color: #374151;">${maskedEmail}</p>
        </div>
        
        <p style="font-size: 14px; color: #6b7280;">
          Continuez à partager votre code pour développer votre réseau !
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          ${BRAND.copyright}
        </p>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to,
    subject: 'Un nouveau membre a rejoint grâce à vous ! 🌟',
    html
  })
}

// ============================================================================
// EMAIL OTP - Template Tuge
// ============================================================================

/**
 * Génère le HTML de l'email OTP avec le design Tuge
 * 
 * @param code - Code OTP à afficher (6 chiffres)
 * @returns HTML de l'email
 */
export function generateOtpEmailHtml(code: string): string {
  // Formate le code avec des espaces pour une meilleure lisibilité
  const formattedCode = code.split('').join(' ')
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Votre code de connexion ${BRAND.name}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width: 600px) {
      .container { padding: 16px !important; }
      .code-box { padding: 20px 16px !important; }
      .code-text { font-size: 28px !important; letter-spacing: 6px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND_COLORS.bgLight}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  
  <!-- Wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${BRAND_COLORS.bgLight};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Main Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(109, 40, 217, 0.08); overflow: hidden;">
          
          <!-- Header avec gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLORS.violetDark} 0%, ${BRAND_COLORS.magenta} 100%); padding: 32px 40px; text-align: center;">
              <!-- Logo -->
              <div style="margin-bottom: 16px;">
                ${TUGE_LOGO_SVG}
              </div>
              <!-- Titre -->
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600; letter-spacing: -0.5px;">
                Votre code de connexion
              </h1>
            </td>
          </tr>
          
          <!-- Corps -->
          <tr>
            <td class="container" style="padding: 40px;">
              
              <!-- Salutation -->
              <p style="margin: 0 0 20px 0; font-size: 16px; color: ${BRAND_COLORS.textPrimary}; line-height: 1.5;">
                Bonjour,
              </p>
              
              <!-- Message -->
              <p style="margin: 0 0 28px 0; font-size: 16px; color: ${BRAND_COLORS.textSecondary}; line-height: 1.6;">
                Voici votre code de vérification pour vous connecter à <strong style="color: ${BRAND_COLORS.violetDark};">${BRAND.name}</strong> :
              </p>
              
              <!-- Code OTP Box -->
              <div class="code-box" style="background: linear-gradient(135deg, ${BRAND_COLORS.bgLight} 0%, ${BRAND_COLORS.bgSecondary} 100%); border: 2px solid ${BRAND_COLORS.violetDark}; border-radius: 12px; padding: 28px 20px; text-align: center; margin-bottom: 28px;">
                <p class="code-text" style="margin: 0; font-size: 36px; font-weight: 700; color: ${BRAND_COLORS.violetDark}; letter-spacing: 10px; font-family: 'SF Mono', 'Roboto Mono', Consolas, monospace;">
                  ${formattedCode}
                </p>
              </div>
              
              <!-- Validité -->
              <p style="margin: 0 0 24px 0; font-size: 14px; color: ${BRAND_COLORS.textTertiary}; line-height: 1.5; text-align: center;">
                ⏱️ Ce code est valable <strong>10 minutes</strong>
              </p>
              
              <!-- Séparateur -->
              <hr style="border: none; border-top: 1px solid ${BRAND_COLORS.bgSecondary}; margin: 28px 0;">
              
              <!-- Message de sécurité -->
              <div style="background-color: ${BRAND_COLORS.bgLight}; border-radius: 8px; padding: 16px; border-left: 3px solid ${BRAND_COLORS.pink};">
                <p style="margin: 0; font-size: 13px; color: ${BRAND_COLORS.textTertiary}; line-height: 1.5;">
                  🔒 Si vous n'avez pas demandé ce code, ignorez simplement cet email. Quelqu'un a peut-être entré votre adresse par erreur.
                </p>
              </div>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: ${BRAND_COLORS.bgLight}; padding: 24px 40px; text-align: center; border-top: 1px solid ${BRAND_COLORS.bgSecondary};">
              <!-- Tagline -->
              <p style="margin: 0 0 8px 0; font-size: 13px; color: ${BRAND_COLORS.textTertiary};">
                ${BRAND.tagline}
              </p>
              <!-- Copyright -->
              <p style="margin: 0; font-size: 12px; color: ${BRAND_COLORS.textMuted};">
                ${BRAND.copyright}
              </p>
            </td>
          </tr>
          
        </table>
        
        <!-- Lien support -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; margin-top: 24px;">
          <tr>
            <td align="center">
              <p style="margin: 0; font-size: 12px; color: ${BRAND_COLORS.textMuted};">
                Besoin d'aide ? <a href="mailto:${BRAND.supportEmail}" style="color: ${BRAND_COLORS.violetDark}; text-decoration: none;">Contactez-nous</a>
              </p>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>
`
}

/**
 * Génère le template HTML pour Supabase Dashboard
 * Utilise les variables Supabase {{ .Token }} et {{ .SiteURL }}
 * 
 * @returns HTML du template avec les variables Supabase
 */
export function generateSupabaseOtpTemplate(): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Votre code de connexion ${BRAND.name}</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { padding: 16px !important; }
      .code-box { padding: 20px 16px !important; }
      .code-text { font-size: 28px !important; letter-spacing: 6px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND_COLORS.bgLight}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${BRAND_COLORS.bgLight};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(109, 40, 217, 0.08); overflow: hidden;">
          
          <!-- Header avec gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLORS.violetDark} 0%, ${BRAND_COLORS.magenta} 100%); padding: 32px 40px; text-align: center;">
              <div style="margin-bottom: 16px;">
                ${TUGE_LOGO_SVG}
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600; letter-spacing: -0.5px;">
                Votre code de connexion
              </h1>
            </td>
          </tr>
          
          <!-- Corps -->
          <tr>
            <td class="container" style="padding: 40px;">
              
              <p style="margin: 0 0 20px 0; font-size: 16px; color: ${BRAND_COLORS.textPrimary}; line-height: 1.5;">
                Bonjour,
              </p>
              
              <p style="margin: 0 0 28px 0; font-size: 16px; color: ${BRAND_COLORS.textSecondary}; line-height: 1.6;">
                Voici votre code de vérification pour vous connecter à <strong style="color: ${BRAND_COLORS.violetDark};">${BRAND.name}</strong> :
              </p>
              
              <!-- Code OTP Box - Utilise {{ .Token }} de Supabase -->
              <div class="code-box" style="background: linear-gradient(135deg, ${BRAND_COLORS.bgLight} 0%, ${BRAND_COLORS.bgSecondary} 100%); border: 2px solid ${BRAND_COLORS.violetDark}; border-radius: 12px; padding: 28px 20px; text-align: center; margin-bottom: 28px;">
                <p class="code-text" style="margin: 0; font-size: 36px; font-weight: 700; color: ${BRAND_COLORS.violetDark}; letter-spacing: 10px; font-family: 'SF Mono', 'Roboto Mono', Consolas, monospace;">
                  {{ .Token }}
                </p>
              </div>
              
              <p style="margin: 0 0 24px 0; font-size: 14px; color: ${BRAND_COLORS.textTertiary}; line-height: 1.5; text-align: center;">
                ⏱️ Ce code est valable <strong>10 minutes</strong>
              </p>
              
              <hr style="border: none; border-top: 1px solid ${BRAND_COLORS.bgSecondary}; margin: 28px 0;">
              
              <div style="background-color: ${BRAND_COLORS.bgLight}; border-radius: 8px; padding: 16px; border-left: 3px solid ${BRAND_COLORS.pink};">
                <p style="margin: 0; font-size: 13px; color: ${BRAND_COLORS.textTertiary}; line-height: 1.5;">
                  🔒 Si vous n'avez pas demandé ce code, ignorez simplement cet email. Quelqu'un a peut-être entré votre adresse par erreur.
                </p>
              </div>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: ${BRAND_COLORS.bgLight}; padding: 24px 40px; text-align: center; border-top: 1px solid ${BRAND_COLORS.bgSecondary};">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: ${BRAND_COLORS.textTertiary};">
                ${BRAND.tagline}
              </p>
              <p style="margin: 0; font-size: 12px; color: ${BRAND_COLORS.textMuted};">
                ${BRAND.copyright}
              </p>
            </td>
          </tr>
          
        </table>
        
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; margin-top: 24px;">
          <tr>
            <td align="center">
              <p style="margin: 0; font-size: 12px; color: ${BRAND_COLORS.textMuted};">
                Besoin d'aide ? <a href="mailto:${BRAND.supportEmail}" style="color: ${BRAND_COLORS.violetDark}; text-decoration: none;">Contactez-nous</a>
              </p>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>
`
}

/**
 * Envoie un email OTP via Resend
 * 
 * @param to - Email du destinataire
 * @param code - Code OTP à 6 chiffres
 * @returns Résultat de l'envoi
 */
export async function sendOtpEmail(to: string, code: string) {
  const html = generateOtpEmailHtml(code)
  
  return sendEmail({
    to,
    subject: `${code} - Votre code de connexion ${BRAND.name}`,
    html
  })
}
