# Template Email "Confirm Sign Up" pour Supabase

Ce document contient le template HTML pour l'email de confirmation d'inscription (Magic Link) à utiliser dans Supabase.

## Configuration dans Supabase

### Accéder aux Templates

1. Ouvrir le [Dashboard Supabase](https://supabase.com/dashboard)
2. Sélectionner votre projet Tuge
3. Aller dans **Authentication** → **Email Templates**
4. Sélectionner **Confirm signup**

### Sujet de l'email

```
Bienvenue sur Tuge - Confirmez votre inscription
```

### Corps HTML

Copiez le code HTML ci-dessous dans le champ "Message (HTML)" :

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Bienvenue sur Tuge</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { padding: 16px !important; }
      .button-container { padding: 16px 0 24px !important; }
      .cta-button { padding: 14px 32px !important; font-size: 15px !important; }
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
                Bienvenue sur Tuge !
              </h1>
            </td>
          </tr>
          
          <!-- Corps -->
          <tr>
            <td class="container" style="padding: 40px;">
              
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #1a0f2e; line-height: 1.5;">
                Bonjour,
              </p>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #4a3d5c; line-height: 1.6;">
                Merci de vous être inscrit sur <strong style="color: #6d28d9;">Tuge</strong>, la marketplace conversationnelle propulsée par l'IA ! 🎉
              </p>
              
              <p style="margin: 0 0 28px 0; font-size: 16px; color: #4a3d5c; line-height: 1.6;">
                Pour activer votre compte et commencer à utiliser notre plateforme, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :
              </p>
              
              <!-- Bouton Magic Link -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" class="button-container" style="padding: 8px 0 28px;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #6d28d9 0%, #be185d 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(109, 40, 217, 0.35); transition: transform 0.2s;">
                      Confirmer mon inscription →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #6e6182; line-height: 1.5; text-align: center;">
                ⏱️ Ce lien est valable <strong>24 heures</strong>
              </p>
              
              <hr style="border: none; border-top: 1px solid #f5f2fa; margin: 28px 0;">
              
              <!-- Lien alternatif -->
              <div style="background-color: #faf8ff; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #6e6182; font-weight: 600;">
                  Le bouton ne fonctionne pas ?
                </p>
                <p style="margin: 0 0 12px 0; font-size: 12px; color: #9e94ab; line-height: 1.5; word-break: break-all;">
                  Copiez et collez ce lien dans votre navigateur :<br>
                  <a href="{{ .ConfirmationURL }}" style="color: #6d28d9; text-decoration: none;">{{ .ConfirmationURL }}</a>
                </p>
                <p style="margin: 0; font-size: 12px; color: #9e94ab; line-height: 1.5;">
                  Ou <a href="{{ .SiteURL }}/auth/resend-confirmation" style="color: #6d28d9; text-decoration: none; font-weight: 600;">demandez un nouveau lien</a>
                </p>
              </div>
              
              <!-- Note de sécurité -->
              <div style="background-color: #faf8ff; border-radius: 8px; padding: 16px; border-left: 3px solid #f472b6;">
                <p style="margin: 0; font-size: 13px; color: #6e6182; line-height: 1.5;">
                  🔒 Si vous n'avez pas créé de compte sur Tuge, ignorez simplement cet email. Quelqu'un a peut-être entré votre adresse par erreur.
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
        
        <!-- Lien de support -->
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

## Version Texte Brut (Plain Text)

Pour les clients email ne supportant pas le HTML, configurez également la version texte :

```
Bienvenue sur Tuge !

Bonjour,

Merci de vous être inscrit sur Tuge, la marketplace conversationnelle propulsée par l'IA !

Pour activer votre compte et commencer à utiliser notre plateforme, veuillez confirmer votre adresse email en cliquant sur le lien ci-dessous :

{{ .ConfirmationURL }}

Ce lien est valable 24 heures.

---

Le lien ne fonctionne pas ?

Si le lien ci-dessus ne fonctionne pas :
1. Copiez-le et collez-le dans votre navigateur
2. Ou demandez un nouveau lien : {{ .SiteURL }}/auth/resend-confirmation
3. Vérifiez vos spams pour cet email

---

Si vous n'avez pas créé de compte sur Tuge, ignorez simplement cet email.

Besoin d'aide ? Contactez-nous : support@tuge.app

© 2025 Tuge - Marketplace conversationnelle IA
https://tuge.app
```

## Variables Supabase Utilisées

| Variable | Description |
|----------|-------------|
| `{{ .ConfirmationURL }}` | Lien de confirmation unique et sécurisé |
| `{{ .SiteURL }}` | URL du site (https://tuge.app) |
| `{{ .Email }}` | Adresse email du destinataire |

## Gestion des Erreurs et Fallback

L'application inclut un système complet de gestion des cas où le lien de confirmation ne fonctionne pas :

### Pages créées

#### 1. `/auth/confirm-error` - Page d'erreur
Affiche des messages d'erreur clairs selon le problème rencontré :

**Erreurs gérées :**
- `?error=expired` : Lien expiré (> 24h)
- `?error=already_used` : Compte déjà confirmé
- `?error=invalid_token` : Lien invalide ou corrompu
- `?error=missing_token` : Lien incomplet
- `?error=session_failed` : Erreur de session
- `?error=no_user` : Utilisateur introuvable
- `?error=unexpected` : Erreur inattendue

**Fonctionnalités :**
- Messages d'erreur contextuels et rassurants
- Actions appropriées (renvoyer email, se connecter, contacter support)
- Design cohérent avec le branding Tuge
- Responsive et accessible

#### 2. `/auth/resend-confirmation` - Renvoyer l'email
Permet aux utilisateurs de demander un nouveau lien de confirmation :

**Fonctionnalités :**
- Formulaire simple avec email uniquement
- Rate limiting (3 tentatives / 15 minutes)
- Sécurité : ne révèle pas si l'email existe
- Détecte les emails déjà confirmés
- Messages de succès clairs avec instructions

**API associée :** `POST /api/auth/resend-confirmation`
- Validation email avec Zod
- Rate limiting en mémoire
- Utilise `supabase.auth.resend()` pour renvoyer l'email
- Logs détaillés pour debug

### Routes API améliorées

#### `/api/auth/callback` (amélioré)
Gère maintenant deux types de callbacks :

1. **OAuth callback** (existant) :
   - Google, Apple, LinkedIn, etc.
   - Paramètre : `?code=...`

2. **Email confirmation** (nouveau) :
   - Magic link de confirmation d'inscription
   - Paramètres : `?token_hash=...&type=signup`
   - Gestion d'erreurs détaillée avec redirections appropriées

**Flux de gestion d'erreur :**
```
Callback reçu
    ↓
Token/Code valide ?
    ↓ Non → Redirige vers /auth/confirm-error?error=...
    ↓ Oui
Utilisateur existe ?
    ↓ Non → Redirige vers /auth/confirm-error?error=no_user
    ↓ Oui
Pipeline complet ?
    ↓ Non → Exécute pipeline
    ↓
Succès → Redirige vers /agent
```

### Intégration dans le template email

Le template inclut maintenant un lien vers la page de renvoi :

```html
<p style="margin: 0; font-size: 12px;">
  Ou <a href="{{ .SiteURL }}/auth/resend-confirmation">demandez un nouveau lien</a>
</p>
```

### Middleware

Le middleware Next.js autorise l'accès à toutes les routes d'authentification, y compris :
- `/auth/confirm-error` : Accessible sans authentification
- `/auth/resend-confirmation` : Accessible sans authentification
- `/api/auth/callback` : Endpoint public (déjà configuré)
- `/api/auth/resend-confirmation` : Endpoint public (API routes)

## Paramètres Recommandés

Dans **Authentication** → **Settings** :

- **Confirm email** : Activé (ON)
- **Secure email change** : Activé (ON)
- **Email confirmation expiry** : 86400 secondes (24 heures)
- **Site URL** : `https://tuge.app`
- **Redirect URLs** : 
  - `https://tuge.app/auth/callback`
  - `http://localhost:3000/auth/callback` (développement)

## Test du Template

### 1. Via l'interface de test Supabase

1. Dans Email Templates, cliquez sur "Preview" pour voir le rendu
2. Testez avec différents clients email (Gmail, Outlook, Apple Mail)

### 2. Via votre application

1. Allez sur `/auth/signup` de votre application
2. Créez un compte de test avec une vraie adresse email
3. Vérifiez que l'email reçu correspond au design

### 3. Points à vérifier

- ✅ Le logo Tuge s'affiche correctement
- ✅ Le bouton est cliquable et bien stylisé
- ✅ Le gradient violet/magenta s'affiche
- ✅ Le lien alternatif en texte brut fonctionne
- ✅ L'email est responsive sur mobile
- ✅ Les couleurs correspondent au branding Tuge

## Personnalisation Avancée

### Ajouter le nom de l'utilisateur

Si vous collectez le nom lors de l'inscription, vous pouvez personnaliser le message :

```html
<p style="margin: 0 0 20px 0; font-size: 16px; color: #1a0f2e; line-height: 1.5;">
  Bonjour {{ .UserMetaData.full_name }},
</p>
```

### Ajouter un message de parrainage

Si l'utilisateur a été parrainé, vous pouvez ajouter un message spécial :

```html
<div style="background-color: #faf8ff; border-radius: 8px; padding: 16px; margin-bottom: 20px; border-left: 3px solid #c084fc;">
  <p style="margin: 0; font-size: 14px; color: #4a3d5c; line-height: 1.5;">
    🎁 <strong>Bonus de parrainage activé !</strong> Vous avez été invité par un membre Tuge.
  </p>
</div>
```

## Dépannage

### Le bouton n'apparaît pas

- Vérifiez que les balises `<a>` sont bien fermées
- Testez avec un client email différent (certains bloquent les styles)

### Le lien ne fonctionne pas

- Vérifiez que `{{ .ConfirmationURL }}` est bien présent
- Vérifiez la configuration des Redirect URLs dans Supabase
- Assurez-vous que la route `/auth/callback` existe dans votre app

### L'email n'arrive pas

- Vérifiez les Spam/Courrier indésirable
- Vérifiez la configuration SMTP si vous utilisez un serveur custom
- Consultez les logs dans Authentication → Logs

## Cohérence avec les Autres Templates

Ce template suit le même design que :
- **Confirm signup (OTP)** : Même header, même footer, même palette
- **Reset password** : Structure similaire avec bouton CTA
- **Magic Link** : Même principe de lien cliquable

Palette de couleurs Tuge :
- Violet principal : `#6d28d9`
- Magenta : `#be185d`
- Pink : `#f472b6`
- Violet clair : `#c084fc`
- Fond clair : `#faf8ff`

## Support

Pour toute question sur la configuration des emails :
- 📧 Email : support@tuge.app
- 📚 Documentation : [SUPABASE_EMAIL_CONFIG.md](./SUPABASE_EMAIL_CONFIG.md)

---

**Note** : Ce template a été créé pour Tuge (rebrand de Tousgether) et utilise le branding officiel de la plateforme.

