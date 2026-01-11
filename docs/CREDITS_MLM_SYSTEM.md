# Système de Crédits et MLM - Tuge

## Vue d'ensemble

Ce document décrit l'implémentation du système de crédits IA "à l'usage" avec redistribution MLM sur 5 niveaux.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
├─────────────────────────────────────────────────────────────┤
│  /wallet          │  /agent           │  Stripe Checkout    │
│  - Solde crédits  │  - Affiche solde  │  - Paiement         │
│  - Achat packs    │  - Consomme 1cr   │  - Redirect         │
│  - Historique     │  - Erreur NO_CR   │                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Routes (Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│  POST /api/credits/claim-daily  → claim_daily_free_credits  │
│  GET  /api/credits/wallet       → get_user_wallet           │
│  POST /api/agent                → consume_credit_atomic     │
│  POST /api/stripe/checkout      → Stripe Session            │
│  POST /api/stripe/webhook       → confirm_purchase_and_mlm  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                PostgreSQL / Supabase                         │
├─────────────────────────────────────────────────────────────┤
│  Tables:                    │  Fonctions RPC:               │
│  - credit_wallets           │  - claim_daily_free_credits   │
│  - credit_ledger            │  - consume_credit_atomic      │
│  - purchases                │  - create_purchase            │
│  - mlm_commissions          │  - confirm_purchase_and_mlm   │
│  - mlm_balances             │  - get_user_wallet            │
│  - platform_costs           │                               │
│  - platform_revenue         │                               │
└─────────────────────────────────────────────────────────────┘
```

## Modèle de Crédits

### Crédits Gratuits (Free)
- **10 crédits / jour / utilisateur**
- Non cumulables (reset quotidien)
- Non transférables
- Non commissionnés MLM
- Timezone: Europe/Paris

### Crédits Payants (Paid)
- Cumulables sans expiration
- Commissionnés MLM (50% du bénéfice)
- Packs disponibles:
  - Starter: 50 crédits = 10€
  - Pro: 500 crédits = 39€
  - Business: 2000 crédits = 129€

### Ordre de Consommation
1. Crédits gratuits en premier
2. Puis crédits payants

## Calcul du Bénéfice

```
benefit = revenue 
        - ai_cost_estimated      (credits × 0.004€)
        - variable_cost          (0.30€ / transaction)
        - platform_cost_per_user (coûts fixes / users actifs)

mlm_pool = benefit × 0.50
commission_per_level = mlm_pool / 5
```

### Coûts Fixes Mensuels
- Supabase: 100€ / mois
- Resend: ~20€ / mois
- Allocation par utilisateur actif

## Système MLM

### Règles
- 5 niveaux maximum (parrain direct jusqu'au 5ème niveau)
- Commission identique par niveau: `mlm_pool / 5`
- Si un niveau manque, la part est conservée par la plateforme
- Arrondi à 2 décimales
- Idempotency via contrainte UNIQUE sur (purchase_id, to_user_id, level)

### Lignée
- Utilise la table `referrals` existante
- `referrer_id` = sponsor direct
- Parcours récursif pour trouver les 5 niveaux

## Rate Limiting

- 10 actions / minute
- 100 actions / heure
- Monitoring: alerte si coût utilisateur > 3× moyenne

## Fichiers Clés

### Backend
- `src/lib/billingConfig.ts` - Configuration centralisée
- `src/lib/stripe/client.ts` - Client Stripe
- `src/lib/credits/consumeCredit.ts` - Helper consommation
- `src/app/api/credits/` - Endpoints crédits
- `src/app/api/stripe/` - Endpoints Stripe

### Frontend
- `src/app/wallet/page.tsx` - Page wallet
- `src/components/credits/BuyCreditsModal.tsx` - Modal achat

### Base de données
- `supabase/migrations/004_credit_system.sql` - Tables et RPC

## Variables d'Environnement

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Supabase (existants)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Checklist Déploiement

### 1. Base de données
- [ ] Exécuter `supabase/migrations/004_credit_system.sql`
- [ ] Vérifier que les fonctions RPC sont créées
- [ ] Vérifier les policies RLS

### 2. Stripe
- [ ] Créer un compte Stripe (si pas déjà fait)
- [ ] Récupérer les clés API (mode test puis production)
- [ ] Configurer le webhook:
  - URL: `https://votredomaine.com/api/stripe/webhook`
  - Événements: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
- [ ] Ajouter les variables d'environnement

### 3. Vérifications
- [ ] Tester le claim des crédits gratuits
- [ ] Tester un achat Stripe (mode test)
- [ ] Vérifier que le MLM se distribue correctement
- [ ] Vérifier la consommation de crédits sur l'agent IA

### 4. Production
- [ ] Passer Stripe en mode live
- [ ] Mettre à jour les clés API
- [ ] Monitorer les premiers paiements

## Sécurité

- Toute logique critique côté serveur (RPC SECURITY DEFINER)
- Pas de solde négatif possible (contraintes CHECK)
- Idempotency Stripe obligatoire
- RLS strictes sur toutes les tables
- Validation Zod sur tous les endpoints

## Monitoring

- Logs clairs dans les fonctions RPC
- Table `ai_actions` pour audit
- Table `credit_ledger` pour traçabilité complète
- `platform_revenue` pour suivi des revenus

