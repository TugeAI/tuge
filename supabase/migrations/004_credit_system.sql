-- ============================================================================
-- TOUSGETHER - Système de crédits et MLM
-- ============================================================================
-- Ce script crée toutes les tables et fonctions nécessaires pour :
-- - Gestion des crédits (gratuits et payants)
-- - Achats via Stripe
-- - Distribution MLM sur 5 niveaux (50% du bénéfice)
-- ============================================================================

-- ============================================================================
-- CONSTANTES DE CONFIGURATION (synchronisées avec billingConfig.ts)
-- ============================================================================
-- Ces valeurs sont utilisées dans les fonctions RPC
-- COST_AI_PER_ACTION_EUR = 0.004
-- VARIABLE_COST_PER_TX_EUR = 0.30
-- MLM_SHARE_OF_PROFIT = 0.50
-- MLM_LEVELS = 5
-- DAILY_FREE_CREDITS = 10

-- ============================================================================
-- TABLE: credit_wallets
-- ============================================================================
-- Portefeuille de crédits par utilisateur

CREATE TABLE IF NOT EXISTS public.credit_wallets (
  -- Clé primaire liée à auth.users
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Crédits payants (cumulables, pas d'expiration)
  paid_credits INTEGER NOT NULL DEFAULT 0 CHECK (paid_credits >= 0),
  
  -- Crédits gratuits quotidiens (10 max, non cumulables)
  daily_free_credits INTEGER NOT NULL DEFAULT 0 CHECK (daily_free_credits >= 0 AND daily_free_credits <= 10),
  
  -- Date du dernier claim/reset des crédits gratuits (Europe/Paris)
  daily_date DATE NOT NULL DEFAULT (CURRENT_DATE AT TIME ZONE 'Europe/Paris'),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_credit_wallets_daily_date 
  ON public.credit_wallets(daily_date);

-- ============================================================================
-- TABLE: credit_ledger
-- ============================================================================
-- Historique détaillé de toutes les transactions de crédits

CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Utilisateur concerné
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Type de transaction
  type TEXT NOT NULL CHECK (type IN (
    'daily_claim',      -- Réclamation crédits gratuits
    'purchase',         -- Achat de crédits
    'consumption',      -- Consommation pour action IA
    'refund',           -- Remboursement
    'adjustment'        -- Ajustement manuel admin
  )),
  
  -- Montant (positif = crédit, négatif = débit)
  amount INTEGER NOT NULL,
  
  -- Source des crédits affectés
  credit_type TEXT NOT NULL CHECK (credit_type IN ('free', 'paid')),
  
  -- Référence optionnelle (purchase_id, action_id, etc.)
  reference_id UUID,
  reference_type TEXT,
  
  -- Métadonnées supplémentaires
  metadata JSONB DEFAULT '{}',
  
  -- Solde après transaction (pour audit)
  balance_after INTEGER NOT NULL,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes d'historique
CREATE INDEX IF NOT EXISTS idx_credit_ledger_user_id 
  ON public.credit_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_created_at 
  ON public.credit_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_type 
  ON public.credit_ledger(type);

-- ============================================================================
-- TABLE: purchases
-- ============================================================================
-- Achats de crédits via Stripe

CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Utilisateur acheteur
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Identifiant Stripe (UNIQUE pour idempotency)
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_checkout_session_id TEXT,
  
  -- Montant en EUR
  amount_eur NUMERIC(10, 2) NOT NULL CHECK (amount_eur >= 10),
  
  -- Crédits achetés
  credits INTEGER NOT NULL CHECK (credits > 0),
  
  -- Pack acheté (optionnel pour pay-as-you-go)
  pack_id TEXT,
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- En attente de paiement
    'completed',    -- Paiement confirmé, crédits attribués
    'failed',       -- Paiement échoué
    'refunded'      -- Remboursé
  )),
  
  -- Calculs de bénéfice (remplis après confirmation)
  ai_cost_estimated NUMERIC(10, 4),
  variable_cost NUMERIC(10, 2),
  platform_cost_allocated NUMERIC(10, 4),
  benefit NUMERIC(10, 4),
  mlm_pool NUMERIC(10, 4),
  
  -- Flag si MLM déjà distribué (idempotency)
  mlm_distributed BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Index pour les requêtes
CREATE INDEX IF NOT EXISTS idx_purchases_user_id 
  ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status 
  ON public.purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at 
  ON public.purchases(created_at DESC);

-- ============================================================================
-- TABLE: mlm_commissions
-- ============================================================================
-- Commissions MLM distribuées

CREATE TABLE IF NOT EXISTS public.mlm_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Achat source de la commission
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  
  -- Bénéficiaire de la commission
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Niveau dans la lignée (1 = parrain direct, 5 = 5ème niveau)
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 5),
  
  -- Montant de la commission en EUR
  amount_eur NUMERIC(10, 4) NOT NULL CHECK (amount_eur >= 0),
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Contrainte d'unicité : une seule commission par achat/bénéficiaire/niveau
  CONSTRAINT unique_commission_per_purchase_level 
    UNIQUE (purchase_id, to_user_id, level)
);

-- Index pour les requêtes
CREATE INDEX IF NOT EXISTS idx_mlm_commissions_to_user_id 
  ON public.mlm_commissions(to_user_id);
CREATE INDEX IF NOT EXISTS idx_mlm_commissions_purchase_id 
  ON public.mlm_commissions(purchase_id);
CREATE INDEX IF NOT EXISTS idx_mlm_commissions_created_at 
  ON public.mlm_commissions(created_at DESC);

-- ============================================================================
-- TABLE: mlm_balances
-- ============================================================================
-- Solde MLM retirable par utilisateur

CREATE TABLE IF NOT EXISTS public.mlm_balances (
  -- Clé primaire liée à auth.users
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Solde disponible en EUR
  balance_eur NUMERIC(10, 4) NOT NULL DEFAULT 0 CHECK (balance_eur >= 0),
  
  -- Total des commissions reçues (historique)
  total_earned_eur NUMERIC(10, 4) NOT NULL DEFAULT 0,
  
  -- Total des retraits effectués
  total_withdrawn_eur NUMERIC(10, 4) NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: platform_costs
-- ============================================================================
-- Coûts mensuels de la plateforme (pour calcul bénéfice)

CREATE TABLE IF NOT EXISTS public.platform_costs (
  -- Mois au format YYYY-MM
  month TEXT PRIMARY KEY CHECK (month ~ '^\d{4}-\d{2}$'),
  
  -- Coûts en EUR
  supabase_cost NUMERIC(10, 2) NOT NULL DEFAULT 100,
  resend_cost NUMERIC(10, 2) NOT NULL DEFAULT 20,
  other_costs NUMERIC(10, 2) NOT NULL DEFAULT 0,
  
  -- Nombre d'utilisateurs actifs ce mois
  active_users INTEGER NOT NULL DEFAULT 1 CHECK (active_users >= 1),
  
  -- Coût par utilisateur calculé
  cost_per_user NUMERIC(10, 4) GENERATED ALWAYS AS (
    (supabase_cost + resend_cost + other_costs) / active_users
  ) STORED,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insérer le mois courant par défaut
INSERT INTO public.platform_costs (month, supabase_cost, resend_cost, active_users)
VALUES (TO_CHAR(NOW(), 'YYYY-MM'), 100, 20, 1)
ON CONFLICT (month) DO NOTHING;

-- ============================================================================
-- TABLE: platform_revenue
-- ============================================================================
-- Revenus conservés par la plateforme par achat

CREATE TABLE IF NOT EXISTS public.platform_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Achat source
  purchase_id UUID NOT NULL UNIQUE REFERENCES public.purchases(id) ON DELETE CASCADE,
  
  -- Montants en EUR
  gross_revenue NUMERIC(10, 2) NOT NULL,
  total_costs NUMERIC(10, 4) NOT NULL,
  mlm_distributed NUMERIC(10, 4) NOT NULL DEFAULT 0,
  retained_amount NUMERIC(10, 4) NOT NULL,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: ai_actions (renommée/étendue de ai_actions_log pour crédits)
-- ============================================================================
-- Actions IA avec tracking des crédits consommés

CREATE TABLE IF NOT EXISTS public.ai_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Utilisateur
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Type d'action IA
  action_type TEXT NOT NULL DEFAULT 'chat',
  
  -- Crédits utilisés (toujours 1 pour l'instant)
  credits_used INTEGER NOT NULL DEFAULT 1 CHECK (credits_used > 0),
  
  -- Type de crédit utilisé
  credit_type TEXT NOT NULL CHECK (credit_type IN ('free', 'paid')),
  
  -- Conversation associée (optionnel)
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  
  -- Métadonnées (tokens, modèle, etc.)
  metadata JSONB DEFAULT '{}',
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes
CREATE INDEX IF NOT EXISTS idx_ai_actions_user_id 
  ON public.ai_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_actions_created_at 
  ON public.ai_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_actions_credit_type 
  ON public.ai_actions(credit_type);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.credit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mlm_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mlm_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_actions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES: credit_wallets
-- ============================================================================

CREATE POLICY "Users can read own wallet"
  ON public.credit_wallets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access - credit_wallets"
  ON public.credit_wallets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- POLICIES: credit_ledger
-- ============================================================================

CREATE POLICY "Users can read own ledger"
  ON public.credit_ledger
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access - credit_ledger"
  ON public.credit_ledger
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- POLICIES: purchases
-- ============================================================================

CREATE POLICY "Users can read own purchases"
  ON public.purchases
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access - purchases"
  ON public.purchases
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- POLICIES: mlm_commissions
-- ============================================================================

CREATE POLICY "Users can read own commissions"
  ON public.mlm_commissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = to_user_id);

CREATE POLICY "Service role full access - mlm_commissions"
  ON public.mlm_commissions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- POLICIES: mlm_balances
-- ============================================================================

CREATE POLICY "Users can read own MLM balance"
  ON public.mlm_balances
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access - mlm_balances"
  ON public.mlm_balances
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- POLICIES: platform_costs (admin only)
-- ============================================================================

CREATE POLICY "Service role only - platform_costs"
  ON public.platform_costs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- POLICIES: platform_revenue (admin only)
-- ============================================================================

CREATE POLICY "Service role only - platform_revenue"
  ON public.platform_revenue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- POLICIES: ai_actions
-- ============================================================================

CREATE POLICY "Users can read own actions"
  ON public.ai_actions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access - ai_actions"
  ON public.ai_actions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TRIGGERS: Updated at
-- ============================================================================

CREATE TRIGGER set_credit_wallets_updated_at
  BEFORE UPDATE ON public.credit_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_mlm_balances_updated_at
  BEFORE UPDATE ON public.mlm_balances
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_platform_costs_updated_at
  BEFORE UPDATE ON public.platform_costs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- FUNCTION: claim_daily_free_credits
-- ============================================================================
-- Réclame les crédits gratuits quotidiens (10 max, non cumulables)
-- Retourne le nombre de crédits disponibles après claim

CREATE OR REPLACE FUNCTION public.claim_daily_free_credits(p_user_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  daily_free_credits INTEGER,
  paid_credits INTEGER,
  message TEXT
) AS $$
DECLARE
  v_today DATE;
  v_wallet RECORD;
  v_new_free INTEGER := 10;
BEGIN
  -- Date du jour en Europe/Paris
  v_today := (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Paris')::DATE;
  
  -- Vérifie/crée le wallet
  INSERT INTO public.credit_wallets (user_id, paid_credits, daily_free_credits, daily_date)
  VALUES (p_user_id, 0, 0, v_today - INTERVAL '1 day')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Récupère le wallet actuel
  SELECT * INTO v_wallet
  FROM public.credit_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Si déjà claim aujourd'hui, retourne le solde actuel
  IF v_wallet.daily_date = v_today THEN
    RETURN QUERY SELECT 
      false,
      v_wallet.daily_free_credits,
      v_wallet.paid_credits,
      'Crédits gratuits déjà réclamés aujourd''hui'::TEXT;
    RETURN;
  END IF;
  
  -- Reset et attribue les crédits gratuits
  UPDATE public.credit_wallets
  SET 
    daily_free_credits = v_new_free,
    daily_date = v_today,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log dans le ledger
  INSERT INTO public.credit_ledger (
    user_id, type, amount, credit_type, balance_after, metadata
  ) VALUES (
    p_user_id, 
    'daily_claim', 
    v_new_free, 
    'free',
    v_new_free + v_wallet.paid_credits,
    jsonb_build_object('date', v_today)
  );
  
  RETURN QUERY SELECT 
    true,
    v_new_free,
    v_wallet.paid_credits,
    '10 crédits gratuits réclamés !'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: consume_credit_atomic
-- ============================================================================
-- Consomme des crédits de manière atomique (gratuits d'abord, puis payants)
-- Retourne le type de crédit utilisé et le solde restant

CREATE OR REPLACE FUNCTION public.consume_credit_atomic(
  p_user_id UUID,
  p_amount INTEGER DEFAULT 1,
  p_action_type TEXT DEFAULT 'chat',
  p_conversation_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE (
  success BOOLEAN,
  credit_type_used TEXT,
  daily_free_credits INTEGER,
  paid_credits INTEGER,
  message TEXT
) AS $$
DECLARE
  v_today DATE;
  v_wallet RECORD;
  v_credit_type TEXT;
  v_from_free INTEGER := 0;
  v_from_paid INTEGER := 0;
  v_total_available INTEGER;
BEGIN
  -- Date du jour en Europe/Paris
  v_today := (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Paris')::DATE;
  
  -- Vérifie/crée le wallet
  INSERT INTO public.credit_wallets (user_id, paid_credits, daily_free_credits, daily_date)
  VALUES (p_user_id, 0, 0, v_today - INTERVAL '1 day')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Lock et récupère le wallet
  SELECT * INTO v_wallet
  FROM public.credit_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Reset automatique des crédits gratuits si nouvelle journée
  IF v_wallet.daily_date < v_today THEN
    v_wallet.daily_free_credits := 0;
  END IF;
  
  -- Calcule le total disponible
  v_total_available := v_wallet.daily_free_credits + v_wallet.paid_credits;
  
  -- Vérifie si assez de crédits
  IF v_total_available < p_amount THEN
    RETURN QUERY SELECT 
      false,
      NULL::TEXT,
      v_wallet.daily_free_credits,
      v_wallet.paid_credits,
      'Crédits insuffisants'::TEXT;
    RETURN;
  END IF;
  
  -- Consomme les crédits gratuits d'abord
  IF v_wallet.daily_free_credits >= p_amount THEN
    v_from_free := p_amount;
    v_credit_type := 'free';
  ELSIF v_wallet.daily_free_credits > 0 THEN
    v_from_free := v_wallet.daily_free_credits;
    v_from_paid := p_amount - v_from_free;
    v_credit_type := 'mixed';
  ELSE
    v_from_paid := p_amount;
    v_credit_type := 'paid';
  END IF;
  
  -- Met à jour le wallet
  UPDATE public.credit_wallets
  SET 
    daily_free_credits = GREATEST(0, daily_free_credits - v_from_free),
    paid_credits = GREATEST(0, paid_credits - v_from_paid),
    daily_date = v_today,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING daily_free_credits, paid_credits INTO v_wallet.daily_free_credits, v_wallet.paid_credits;
  
  -- Log dans le ledger (un seul entry pour simplifier)
  INSERT INTO public.credit_ledger (
    user_id, type, amount, credit_type, balance_after, metadata
  ) VALUES (
    p_user_id, 
    'consumption', 
    -p_amount, 
    v_credit_type,
    v_wallet.daily_free_credits + v_wallet.paid_credits,
    p_metadata || jsonb_build_object(
      'action_type', p_action_type,
      'from_free', v_from_free,
      'from_paid', v_from_paid
    )
  );
  
  -- Enregistre l'action IA
  INSERT INTO public.ai_actions (
    user_id, action_type, credits_used, credit_type, conversation_id, metadata
  ) VALUES (
    p_user_id,
    p_action_type,
    p_amount,
    CASE WHEN v_from_paid > 0 THEN 'paid' ELSE 'free' END,
    p_conversation_id,
    p_metadata
  );
  
  RETURN QUERY SELECT 
    true,
    v_credit_type,
    v_wallet.daily_free_credits,
    v_wallet.paid_credits,
    'Crédit consommé'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: create_purchase
-- ============================================================================
-- Crée un achat en statut pending (idempotent via stripe_payment_intent_id)

CREATE OR REPLACE FUNCTION public.create_purchase(
  p_user_id UUID,
  p_stripe_pi_id TEXT,
  p_stripe_session_id TEXT,
  p_amount_eur NUMERIC,
  p_credits INTEGER,
  p_pack_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  purchase_id UUID,
  message TEXT
) AS $$
DECLARE
  v_purchase_id UUID;
BEGIN
  -- Insert avec ON CONFLICT pour idempotency
  INSERT INTO public.purchases (
    user_id,
    stripe_payment_intent_id,
    stripe_checkout_session_id,
    amount_eur,
    credits,
    pack_id,
    status
  ) VALUES (
    p_user_id,
    p_stripe_pi_id,
    p_stripe_session_id,
    p_amount_eur,
    p_credits,
    p_pack_id,
    'pending'
  )
  ON CONFLICT (stripe_payment_intent_id) DO UPDATE
  SET stripe_checkout_session_id = EXCLUDED.stripe_checkout_session_id
  RETURNING id INTO v_purchase_id;
  
  RETURN QUERY SELECT 
    true,
    v_purchase_id,
    'Achat créé'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: confirm_purchase_and_distribute_mlm
-- ============================================================================
-- Confirme un achat, calcule le bénéfice, distribue le MLM sur 5 niveaux
-- Idempotent : ne distribue qu'une seule fois

CREATE OR REPLACE FUNCTION public.confirm_purchase_and_distribute_mlm(
  p_stripe_pi_id TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  purchase_id UUID,
  benefit NUMERIC,
  mlm_distributed NUMERIC,
  levels_paid INTEGER,
  message TEXT
) AS $$
DECLARE
  v_purchase RECORD;
  v_platform_cost NUMERIC;
  v_ai_cost NUMERIC;
  v_variable_cost NUMERIC := 0.30;
  v_benefit NUMERIC;
  v_mlm_pool NUMERIC;
  v_commission_per_level NUMERIC;
  v_current_user_id UUID;
  v_level INTEGER := 0;
  v_total_mlm_distributed NUMERIC := 0;
  v_levels_paid INTEGER := 0;
BEGIN
  -- Récupère l'achat
  SELECT * INTO v_purchase
  FROM public.purchases
  WHERE stripe_payment_intent_id = p_stripe_pi_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      false, NULL::UUID, 0::NUMERIC, 0::NUMERIC, 0, 'Achat non trouvé'::TEXT;
    RETURN;
  END IF;
  
  -- Si déjà complété et MLM distribué, retourne succès (idempotency)
  IF v_purchase.status = 'completed' AND v_purchase.mlm_distributed THEN
    RETURN QUERY SELECT 
      true, 
      v_purchase.id, 
      v_purchase.benefit, 
      v_purchase.mlm_pool,
      (SELECT COUNT(*)::INTEGER FROM public.mlm_commissions WHERE purchase_id = v_purchase.id),
      'Achat déjà traité'::TEXT;
    RETURN;
  END IF;
  
  -- Récupère le coût plateforme du mois courant
  SELECT COALESCE(cost_per_user, 120.0 / 100) INTO v_platform_cost
  FROM public.platform_costs
  WHERE month = TO_CHAR(NOW(), 'YYYY-MM');
  
  IF v_platform_cost IS NULL THEN
    v_platform_cost := 1.20; -- Fallback: (100 + 20) / 100 users
  END IF;
  
  -- Calcule les coûts
  v_ai_cost := v_purchase.credits * 0.004;
  
  -- Calcule le bénéfice
  v_benefit := v_purchase.amount_eur - v_ai_cost - v_variable_cost - v_platform_cost;
  
  -- Si bénéfice négatif ou nul, pas de MLM
  IF v_benefit <= 0 THEN
    v_mlm_pool := 0;
    v_commission_per_level := 0;
  ELSE
    v_mlm_pool := v_benefit * 0.50;
    v_commission_per_level := ROUND(v_mlm_pool / 5, 4);
  END IF;
  
  -- Met à jour l'achat
  UPDATE public.purchases
  SET 
    status = 'completed',
    ai_cost_estimated = v_ai_cost,
    variable_cost = v_variable_cost,
    platform_cost_allocated = v_platform_cost,
    benefit = v_benefit,
    mlm_pool = v_mlm_pool,
    completed_at = NOW()
  WHERE id = v_purchase.id;
  
  -- Ajoute les crédits au wallet
  INSERT INTO public.credit_wallets (user_id, paid_credits, daily_free_credits, daily_date)
  VALUES (v_purchase.user_id, v_purchase.credits, 0, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    paid_credits = credit_wallets.paid_credits + EXCLUDED.paid_credits,
    updated_at = NOW();
  
  -- Log dans le ledger
  INSERT INTO public.credit_ledger (
    user_id, type, amount, credit_type, reference_id, reference_type, balance_after, metadata
  )
  SELECT 
    v_purchase.user_id,
    'purchase',
    v_purchase.credits,
    'paid',
    v_purchase.id,
    'purchase',
    cw.paid_credits + cw.daily_free_credits,
    jsonb_build_object('amount_eur', v_purchase.amount_eur, 'pack_id', v_purchase.pack_id)
  FROM public.credit_wallets cw
  WHERE cw.user_id = v_purchase.user_id;
  
  -- Distribution MLM si pool > 0
  IF v_mlm_pool > 0 AND v_commission_per_level > 0 THEN
    v_current_user_id := v_purchase.user_id;
    
    -- Parcourt les 5 niveaux de la lignée
    FOR v_level IN 1..5 LOOP
      -- Trouve le parrain du niveau actuel
      SELECT referrer_id INTO v_current_user_id
      FROM public.referrals
      WHERE user_id = v_current_user_id;
      
      -- Si pas de parrain, arrête
      EXIT WHEN v_current_user_id IS NULL;
      
      -- Crée la commission
      INSERT INTO public.mlm_commissions (
        purchase_id, to_user_id, level, amount_eur
      ) VALUES (
        v_purchase.id, v_current_user_id, v_level, v_commission_per_level
      )
      ON CONFLICT (purchase_id, to_user_id, level) DO NOTHING;
      
      -- Met à jour le solde MLM du bénéficiaire
      INSERT INTO public.mlm_balances (user_id, balance_eur, total_earned_eur)
      VALUES (v_current_user_id, v_commission_per_level, v_commission_per_level)
      ON CONFLICT (user_id) DO UPDATE
      SET 
        balance_eur = mlm_balances.balance_eur + EXCLUDED.balance_eur,
        total_earned_eur = mlm_balances.total_earned_eur + EXCLUDED.total_earned_eur,
        updated_at = NOW();
      
      v_total_mlm_distributed := v_total_mlm_distributed + v_commission_per_level;
      v_levels_paid := v_levels_paid + 1;
    END LOOP;
  END IF;
  
  -- Marque MLM comme distribué
  UPDATE public.purchases
  SET mlm_distributed = true
  WHERE id = v_purchase.id;
  
  -- Enregistre le revenu plateforme
  INSERT INTO public.platform_revenue (
    purchase_id, gross_revenue, total_costs, mlm_distributed, retained_amount
  ) VALUES (
    v_purchase.id,
    v_purchase.amount_eur,
    v_ai_cost + v_variable_cost + v_platform_cost,
    v_total_mlm_distributed,
    v_purchase.amount_eur - (v_ai_cost + v_variable_cost + v_platform_cost) - v_total_mlm_distributed
  )
  ON CONFLICT (purchase_id) DO NOTHING;
  
  RETURN QUERY SELECT 
    true,
    v_purchase.id,
    v_benefit,
    v_total_mlm_distributed,
    v_levels_paid,
    'Achat confirmé et MLM distribué'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: get_user_wallet
-- ============================================================================
-- Récupère le wallet d'un utilisateur avec reset auto des crédits gratuits

CREATE OR REPLACE FUNCTION public.get_user_wallet(p_user_id UUID)
RETURNS TABLE (
  paid_credits INTEGER,
  daily_free_credits INTEGER,
  total_credits INTEGER,
  daily_date DATE,
  can_claim_today BOOLEAN
) AS $$
DECLARE
  v_today DATE;
  v_wallet RECORD;
BEGIN
  v_today := (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Paris')::DATE;
  
  -- Crée le wallet si inexistant
  INSERT INTO public.credit_wallets (user_id, paid_credits, daily_free_credits, daily_date)
  VALUES (p_user_id, 0, 0, v_today - INTERVAL '1 day')
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT * INTO v_wallet
  FROM public.credit_wallets
  WHERE user_id = p_user_id;
  
  -- Si nouvelle journée, les crédits gratuits sont expirés
  IF v_wallet.daily_date < v_today THEN
    v_wallet.daily_free_credits := 0;
  END IF;
  
  RETURN QUERY SELECT 
    v_wallet.paid_credits,
    v_wallet.daily_free_credits,
    v_wallet.paid_credits + v_wallet.daily_free_credits,
    v_wallet.daily_date,
    v_wallet.daily_date < v_today;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.credit_wallets IS 'Portefeuille de crédits par utilisateur (payants + gratuits quotidiens)';
COMMENT ON TABLE public.credit_ledger IS 'Historique complet des transactions de crédits';
COMMENT ON TABLE public.purchases IS 'Achats de crédits via Stripe';
COMMENT ON TABLE public.mlm_commissions IS 'Commissions MLM distribuées par achat';
COMMENT ON TABLE public.mlm_balances IS 'Solde MLM retirable par utilisateur';
COMMENT ON TABLE public.platform_costs IS 'Coûts mensuels plateforme pour calcul bénéfice';
COMMENT ON TABLE public.platform_revenue IS 'Revenus conservés par la plateforme';
COMMENT ON TABLE public.ai_actions IS 'Actions IA avec tracking crédits consommés';

COMMENT ON FUNCTION public.claim_daily_free_credits IS 'Réclame les 10 crédits gratuits quotidiens (non cumulables)';
COMMENT ON FUNCTION public.consume_credit_atomic IS 'Consomme des crédits (gratuits d''abord, puis payants)';
COMMENT ON FUNCTION public.create_purchase IS 'Crée un achat Stripe en statut pending';
COMMENT ON FUNCTION public.confirm_purchase_and_distribute_mlm IS 'Confirme achat et distribue MLM sur 5 niveaux';
COMMENT ON FUNCTION public.get_user_wallet IS 'Récupère le wallet avec reset auto des crédits gratuits';







