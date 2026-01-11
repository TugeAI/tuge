# Configuration des Templates Email Supabase

Ce guide explique comment configurer les templates email personnalisées Tuge dans le dashboard Supabase.

## Accéder aux Templates

1. Ouvrir le [Dashboard Supabase](https://supabase.com/dashboard)
2. Sélectionner le projet Tuge
3. Aller dans **Authentication** → **Email Templates**

## Templates à Configurer

### 1. Confirm signup (OTP)

Cette template est utilisée pour envoyer le code OTP lors de la connexion/inscription.

**Subject:**
```
{{ .Token }} - Votre code de connexion Tuge
```

**Body (HTML):**

Copier le contenu HTML généré par la fonction `generateSupabaseOtpTemplate()` dans `src/lib/email/resend.ts`.

Pour obtenir le HTML à copier, exécuter dans la console :

```typescript
import { generateSupabaseOtpTemplate } from '@/lib/email/resend'
console.log(generateSupabaseOtpTemplate())
```

Ou utiliser ce template directement :

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Votre code de connexion Tuge</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { padding: 16px !important; }
      .code-box { padding: 20px 16px !important; }
      .code-text { font-size: 28px !important; letter-spacing: 6px !important; }
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
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 112.5 112.5">
                  <circle cx="43.35" cy="56.15" r="9.625" fill="#6d28d9"/>
                  <circle cx="68.65" cy="30.88" r="9.625" fill="#be185d"/>
                  <circle cx="68.65" cy="56.15" r="9.625" fill="#f472b6"/>
                  <circle cx="43.35" cy="81.13" r="9.625" fill="#c084fc"/>
                </svg>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600; letter-spacing: -0.5px;">
                Votre code de connexion
              </h1>
            </td>
          </tr>
          
          <!-- Corps -->
          <tr>
            <td class="container" style="padding: 40px;">
              
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #1a0f2e; line-height: 1.5;">
                Bonjour,
              </p>
              
              <p style="margin: 0 0 28px 0; font-size: 16px; color: #4a3d5c; line-height: 1.6;">
                Voici votre code de vérification pour vous connecter à <strong style="color: #6d28d9;">Tuge</strong> :
              </p>
              
              <!-- Code OTP Box -->
              <div class="code-box" style="background: linear-gradient(135deg, #faf8ff 0%, #f5f2fa 100%); border: 2px solid #6d28d9; border-radius: 12px; padding: 28px 20px; text-align: center; margin-bottom: 28px;">
                <p class="code-text" style="margin: 0; font-size: 36px; font-weight: 700; color: #6d28d9; letter-spacing: 10px; font-family: 'SF Mono', 'Roboto Mono', Consolas, monospace;">
                  {{ .Token }}
                </p>
              </div>
              
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #6e6182; line-height: 1.5; text-align: center;">
                ⏱️ Ce code est valable <strong>10 minutes</strong>
              </p>
              
              <hr style="border: none; border-top: 1px solid #f5f2fa; margin: 28px 0;">
              
              <div style="background-color: #faf8ff; border-radius: 8px; padding: 16px; border-left: 3px solid #f472b6;">
                <p style="margin: 0; font-size: 13px; color: #6e6182; line-height: 1.5;">
                  🔒 Si vous n'avez pas demandé ce code, ignorez simplement cet email. Quelqu'un a peut-être entré votre adresse par erreur.
                </p>
              </div>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #faf8ff; padding: 24px 40px; text-align: center; border-top: 1px solid #f5f2fa;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #6e6182;">
                Marketplace conversationnelle IA
              </p>
              <p style="margin: 0; font-size: 12px; color: #9e94ab;">
                © 2025 Tuge. Tous droits réservés.
              </p>
            </td>
          </tr>
          
        </table>
        
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; margin-top: 24px;">
          <tr>
            <td align="center">
              <p style="margin: 0; font-size: 12px; color: #9e94ab;">
                Besoin d'aide ? <a href="mailto:support@tuge.app" style="color: #6d28d9; text-decoration: none;">Contactez-nous</a>
              </p>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>
```

### 2. Magic Link (optionnel)

Si vous utilisez aussi les magic links, vous pouvez adapter la template OTP en remplaçant le code par un bouton :

**Subject:**
```
Connectez-vous à Tuge
```

**Body (HTML):**

Remplacer la section du code OTP par :

```html
<!-- Bouton Magic Link -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td align="center" style="padding: 8px 0 24px;">
      <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #6d28d9 0%, #be185d 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(109, 40, 217, 0.35);">
        Se connecter à Tuge →
      </a>
    </td>
  </tr>
</table>
```

## Variables Supabase Disponibles

| Variable | Description |
|----------|-------------|
| `{{ .Token }}` | Code OTP à 6 chiffres |
| `{{ .ConfirmationURL }}` | Lien de confirmation (magic link) |
| `{{ .SiteURL }}` | URL du site configurée |
| `{{ .Email }}` | Email du destinataire |

## Configuration SMTP (Optionnelle)

Pour un contrôle total, vous pouvez configurer Resend comme serveur SMTP :

1. Dans Supabase : **Project Settings** → **Auth** → **SMTP Settings**
2. Activer "Enable Custom SMTP"
3. Configurer :
   - **Host**: `smtp.resend.com`
   - **Port**: `465`
   - **User**: `resend`
   - **Password**: Votre clé API Resend
   - **Sender email**: `noreply@tuge.app`
   - **Sender name**: `Tuge`

## Palette de Couleurs Tuge

| Couleur | Hex | Usage |
|---------|-----|-------|
| Violet foncé | `#6d28d9` | Accent principal, liens |
| Magenta | `#be185d` | Gradient, accents |
| Pink | `#f472b6` | Accents secondaires |
| Violet clair | `#c084fc` | Logo |
| Fond clair | `#faf8ff` | Arrière-plan |
| Fond secondaire | `#f5f2fa` | Sections |
| Texte principal | `#1a0f2e` | Titres |
| Texte secondaire | `#4a3d5c` | Corps |
| Texte tertiaire | `#6e6182` | Sous-textes |
| Texte muted | `#9e94ab` | Footer |

## Test

Pour tester les templates :

1. Aller sur la page `/auth` de l'application
2. Entrer une adresse email
3. Vérifier que l'email reçu correspond au design

## Fonctions Disponibles dans le Code

```typescript
import { 
  generateOtpEmailHtml,      // Génère le HTML de l'email OTP
  generateSupabaseOtpTemplate, // Template avec variables Supabase
  sendOtpEmail               // Envoie un email OTP via Resend
} from '@/lib/email/resend'
```







