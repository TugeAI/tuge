-- ============================================================================
-- FIX: Ambiguïté de colonne dans consume_credit_atomic
-- ============================================================================
-- Erreur corrigée: "column reference \"daily_free_credits\" is ambiguous"
-- Le problème était dans la clause RETURNING où les noms de colonnes
-- entraient en conflit avec les champs du record v_wallet.
-- ============================================================================

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
  v_new_free INTEGER;
  v_new_paid INTEGER;
BEGIN
  -- Date du jour en Europe/Paris
  v_today := (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Paris')::DATE;
  
  -- Vérifie/crée le wallet
  INSERT INTO public.credit_wallets (user_id, paid_credits, daily_free_credits, daily_date)
  VALUES (p_user_id, 0, 0, v_today - INTERVAL '1 day')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Lock et récupère le wallet
  SELECT cw.* INTO v_wallet
  FROM public.credit_wallets cw
  WHERE cw.user_id = p_user_id
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
  
  -- Met à jour le wallet et capture les nouvelles valeurs dans des variables distinctes
  UPDATE public.credit_wallets cw
  SET 
    daily_free_credits = GREATEST(0, cw.daily_free_credits - v_from_free),
    paid_credits = GREATEST(0, cw.paid_credits - v_from_paid),
    daily_date = v_today,
    updated_at = NOW()
  WHERE cw.user_id = p_user_id
  RETURNING cw.daily_free_credits, cw.paid_credits INTO v_new_free, v_new_paid;
  
  -- Log dans le ledger
  INSERT INTO public.credit_ledger (
    user_id, type, amount, credit_type, balance_after, metadata
  ) VALUES (
    p_user_id, 
    'consumption', 
    -p_amount, 
    v_credit_type,
    v_new_free + v_new_paid,
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
    v_new_free,
    v_new_paid,
    'Crédit consommé'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire
COMMENT ON FUNCTION public.consume_credit_atomic IS 'Consomme des crédits (gratuits d''abord, puis payants) - v2 fix ambiguity';







