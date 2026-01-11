# Tuge - Système d'inscription avec parrainage OTP

Plateforme de mise en relation conversationnelle avec inscription sécurisée par OTP et système de parrainage immutable.

> 🔄 **Rebrand Notice**: Anciennement "Tousgether", renommé en "Tuge" (tuge.app)

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FLUX D'INSCRIPTION                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. PRÉ-INSCRIPTION                    2. VALIDATION OTP                │
│  ┌──────────────────┐                  ┌──────────────────┐             │
│  │ POST /api/       │                  │ POST /api/       │             │
│  │ onboarding/      │  ──── OTP ────▶  │ onboarding/      │             │
│  │ pre-register     │     (email)      │ verify-otp       │             │
│  └────────┬─────────┘                  └────────┬─────────┘             │
│           │                                     │                       │
│           ▼                                     ▼                       │
│  ┌──────────────────┐                  ┌──────────────────┐             │
│  │ pending_         │                  │ • profiles       │             │
│  │ registrations    │                  │ • referrer_codes │             │
│  │ (temporaire)     │                  │ • referrals      │             │
│  └──────────────────┘                  │ (permanent)      │             │
│                                        └──────────────────┘             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Principes de sécurité

- **OTP obligatoire** : Aucun compte créé sans validation email
- **Parrainage immutable** : Une fois attaché, le parrainage ne peut être modifié
- **Séparation des rôles** : L'IA guide, le backend décide
- **Traçabilité complète** : Toutes les actions sont loggées
- **RLS activé** : Row Level Security sur toutes les tables

## Configuration

### 1. Variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
# Supabase - Obtenez ces valeurs depuis https://app.supabase.com
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key

# Service Role - JAMAIS exposé côté client
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key

# Resend - https://resend.com
RESEND_API_KEY=re_votre-api-key

# URL de l'application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Base de données Supabase

Exécutez le script de migration dans l'éditeur SQL de Supabase :

```bash
# Le fichier se trouve dans :
supabase/migrations/001_initial_schema.sql
```

### 3. Configuration Resend (optionnel)

Pour personnaliser les emails OTP, configurez Resend comme SMTP custom dans Supabase :

1. Dashboard Supabase → Authentication → Email Templates
2. Settings → SMTP Settings → Enable Custom SMTP
3. Utilisez les credentials SMTP de Resend

## API Routes

### POST `/api/onboarding/pre-register`

Crée une pré-inscription et envoie l'OTP.

**Body :**
```json
{
  "email": "user@example.com",
  "role": "individual",
  "referrer_code": "TUG-A1B2C3",
  "consent": true,
  "source": "web"
}
```

**Réponse succès (200) :**
```json
{
  "success": true,
  "message": "Un code de vérification a été envoyé..."
}
```

**Erreurs possibles :**
- `400` - Validation error
- `409` - Email déjà enregistré
- `429` - Rate limited

### POST `/api/onboarding/verify-otp`

Valide l'OTP et finalise l'inscription.

**Body :**
```json
{
  "email": "user@example.com",
  "token": "123456"
}
```

**Réponse succès (200) :**
```json
{
  "success": true,
  "message": "Inscription réussie !",
  "data": {
    "session": {
      "access_token": "...",
      "refresh_token": "...",
      "expires_at": 1234567890,
      "user": { "id": "...", "email": "..." }
    },
    "profile": {
      "id": "...",
      "role": "individual",
      "referrer_code": "TUG-X9Y8Z7"
    },
    "has_referrer": true
  }
}
```

## Structure du projet

```
src/
├── app/
│   └── api/
│       └── onboarding/
│           ├── pre-register/route.ts  # Pré-inscription + envoi OTP
│           └── verify-otp/route.ts    # Validation OTP + création compte
├── config/
│   └── brand.ts        # Configuration centralisée de la marque
├── lib/
│   ├── supabase/
│   │   ├── client.ts    # Client navigateur (anon key)
│   │   ├── server.ts    # Client serveur (service role)
│   │   └── types.ts     # Types TypeScript générés
│   ├── email/
│   │   └── resend.ts    # Service d'envoi d'emails
│   └── utils/
│       ├── referrer-code.ts  # Génération de codes parrain
│       ├── referrer.ts       # Résolution de parrains
│       └── logger.ts         # Traçabilité des actions
└── types/
    └── onboarding.ts    # Types et schémas Zod

supabase/
└── migrations/
    └── 001_initial_schema.sql  # Schéma complet de la BDD
```

## Modèle de données

### pending_registrations
Pré-inscriptions temporaires (expire après 15 min).

### profiles
Profils utilisateurs liés à `auth.users`.

### referrer_codes
Codes de parrainage uniques (format: `TUG-XXXXXX`).

### referrals
Relations de parrainage immutables avec support multi-niveaux (MLM ready).

### ai_actions_log
Journal de traçabilité de toutes les actions sensibles.

## Configuration de la marque

Toutes les constantes de marque sont centralisées dans `src/config/brand.ts` :

```typescript
import { BRAND } from '@/config/brand'

// Utilisation
console.log(BRAND.name)     // "Tuge"
console.log(BRAND.url)      // "https://tuge.app"
console.log(BRAND.domain)   // "tuge.app"
```

## Développement

```bash
# Installation des dépendances
npm install

# Lancement du serveur de développement
npm run dev

# Build de production
npm run build
```

## Évolutions futures

- [ ] Interface utilisateur d'inscription
- [ ] Dashboard de parrainage
- [ ] Support multi-niveaux MLM
- [ ] API pour l'agent IA opérateur
- [ ] Statistiques de parrainage

## Licence

Propriétaire - Tuge
