-- ============================================================================
-- TUGE - Système de Suggestions Proactives pour l'Agent IA
-- ============================================================================
-- Ce script crée les tables et fonctions nécessaires pour le système de
-- suggestions proactives qui détecte les moments clés et propose des actions
-- contextuelles à l'utilisateur.
-- ============================================================================

-- ============================================================================
-- ENUM: Types de déclencheurs de suggestions
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE suggestion_trigger AS ENUM (
    'page_entry',           -- Entrée sur la page agent
    'draft_not_published',  -- Brouillon non publié après 24h
    'search_no_results',    -- Recherche sans résultats
    'no_referral_activity'  -- Pas d'activité de parrainage après 7 jours
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- ENUM: Niveaux de priorité des suggestions
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE suggestion_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABLE: agent_suggestions
-- ============================================================================
-- Stocke les suggestions proactives pour chaque utilisateur.
-- Une seule suggestion active par utilisateur à la fois.

CREATE TABLE IF NOT EXISTS public.agent_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Propriétaire de la suggestion
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Type de déclencheur qui a créé cette suggestion
  trigger_type suggestion_trigger NOT NULL,
  
  -- Contenu de la suggestion
  title TEXT NOT NULL CHECK (char_length(title) <= 100),
  message TEXT NOT NULL CHECK (char_length(message) <= 500),
  action_prompt TEXT NOT NULL CHECK (char_length(action_prompt) <= 500),
  
  -- Priorité d'affichage
  priority suggestion_priority NOT NULL DEFAULT 'medium',
  
  -- Métadonnées additionnelles (ex: draft_id, search_query, etc.)
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- État de la suggestion
  is_active BOOLEAN NOT NULL DEFAULT true,
  dismissed_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_suggestions_user_active 
  ON public.agent_suggestions(user_id) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_suggestions_trigger_spam 
  ON public.agent_suggestions(user_id, trigger_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_suggestions_expires 
  ON public.agent_suggestions(expires_at) 
  WHERE is_active = true;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.agent_suggestions ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres suggestions
CREATE POLICY "Users can read own suggestions"
  ON public.agent_suggestions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres suggestions (dismiss, click)
CREATE POLICY "Users can update own suggestions"
  ON public.agent_suggestions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Le service_role peut tout faire (pour création via API)
CREATE POLICY "Service role full access - agent_suggestions"
  ON public.agent_suggestions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- FONCTION: get_active_suggestion
-- ============================================================================
-- Récupère la suggestion active pour un utilisateur (une seule à la fois)
-- Désactive automatiquement les suggestions expirées

CREATE OR REPLACE FUNCTION public.get_active_suggestion(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  trigger_type suggestion_trigger,
  title TEXT,
  message TEXT,
  action_prompt TEXT,
  priority suggestion_priority,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Désactiver les suggestions expirées
  UPDATE public.agent_suggestions
  SET is_active = false
  WHERE user_id = p_user_id
    AND is_active = true
    AND expires_at < NOW();

  -- Retourner la suggestion active (priorité haute d'abord, puis la plus récente)
  RETURN QUERY
  SELECT 
    s.id,
    s.trigger_type,
    s.title,
    s.message,
    s.action_prompt,
    s.priority,
    s.metadata,
    s.created_at
  FROM public.agent_suggestions s
  WHERE s.user_id = p_user_id
    AND s.is_active = true
    AND s.expires_at > NOW()
  ORDER BY 
    CASE s.priority 
      WHEN 'high' THEN 1 
      WHEN 'medium' THEN 2 
      WHEN 'low' THEN 3 
    END,
    s.created_at DESC
  LIMIT 1;
END;
$$;

-- ============================================================================
-- FONCTION: can_create_suggestion
-- ============================================================================
-- Vérifie si on peut créer une nouvelle suggestion (anti-spam)
-- Règles:
-- - Pas de suggestion active existante
-- - 48h minimum depuis la dernière suggestion du même type

CREATE OR REPLACE FUNCTION public.can_create_suggestion(
  p_user_id UUID,
  p_trigger_type suggestion_trigger
)
RETURNS TABLE (
  can_create BOOLEAN,
  reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_active_count INTEGER;
  v_last_same_trigger TIMESTAMPTZ;
BEGIN
  -- Vérifier s'il y a déjà une suggestion active
  SELECT COUNT(*)
  INTO v_active_count
  FROM public.agent_suggestions
  WHERE user_id = p_user_id
    AND is_active = true
    AND expires_at > NOW();

  IF v_active_count > 0 THEN
    RETURN QUERY SELECT false, 'Une suggestion est déjà active';
    RETURN;
  END IF;

  -- Vérifier la règle anti-spam (48h pour le même trigger)
  SELECT MAX(created_at)
  INTO v_last_same_trigger
  FROM public.agent_suggestions
  WHERE user_id = p_user_id
    AND trigger_type = p_trigger_type
    AND created_at > NOW() - INTERVAL '48 hours';

  IF v_last_same_trigger IS NOT NULL THEN
    RETURN QUERY SELECT false, 'Trop tôt pour ce type de suggestion (48h minimum)';
    RETURN;
  END IF;

  RETURN QUERY SELECT true, NULL::TEXT;
END;
$$;

-- ============================================================================
-- FONCTION: create_suggestion
-- ============================================================================
-- Crée une nouvelle suggestion si les règles anti-spam sont respectées

CREATE OR REPLACE FUNCTION public.create_suggestion(
  p_user_id UUID,
  p_trigger_type suggestion_trigger,
  p_title TEXT,
  p_message TEXT,
  p_action_prompt TEXT,
  p_priority suggestion_priority DEFAULT 'medium',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE (
  success BOOLEAN,
  suggestion_id UUID,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_can_create BOOLEAN;
  v_reason TEXT;
  v_suggestion_id UUID;
BEGIN
  -- Vérifier les règles anti-spam
  SELECT cc.can_create, cc.reason
  INTO v_can_create, v_reason
  FROM public.can_create_suggestion(p_user_id, p_trigger_type) cc;

  IF NOT v_can_create THEN
    RETURN QUERY SELECT false, NULL::UUID, v_reason;
    RETURN;
  END IF;

  -- Désactiver toute suggestion active existante (sécurité)
  UPDATE public.agent_suggestions
  SET is_active = false
  WHERE user_id = p_user_id AND is_active = true;

  -- Créer la nouvelle suggestion
  INSERT INTO public.agent_suggestions (
    user_id,
    trigger_type,
    title,
    message,
    action_prompt,
    priority,
    metadata
  ) VALUES (
    p_user_id,
    p_trigger_type,
    p_title,
    p_message,
    p_action_prompt,
    p_priority,
    p_metadata
  )
  RETURNING id INTO v_suggestion_id;

  RETURN QUERY SELECT true, v_suggestion_id, 'Suggestion créée avec succès'::TEXT;
END;
$$;

-- ============================================================================
-- FONCTION: dismiss_suggestion
-- ============================================================================
-- Marque une suggestion comme rejetée par l'utilisateur

CREATE OR REPLACE FUNCTION public.dismiss_suggestion(p_suggestion_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE public.agent_suggestions
  SET 
    is_active = false,
    dismissed_at = NOW()
  WHERE id = p_suggestion_id
    AND user_id = auth.uid()
    AND is_active = true;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

-- ============================================================================
-- FONCTION: click_suggestion
-- ============================================================================
-- Marque une suggestion comme cliquée (utilisateur a interagi)

CREATE OR REPLACE FUNCTION public.click_suggestion(p_suggestion_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE public.agent_suggestions
  SET 
    is_active = false,
    clicked_at = NOW()
  WHERE id = p_suggestion_id
    AND user_id = auth.uid()
    AND is_active = true;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

-- ============================================================================
-- FONCTION: check_draft_suggestions
-- ============================================================================
-- Vérifie les brouillons non publiés et crée des suggestions
-- À appeler via un cron job ou au chargement de la page

CREATE OR REPLACE FUNCTION public.check_draft_suggestions(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_draft RECORD;
  v_can_create BOOLEAN;
BEGIN
  -- Chercher un brouillon non publié de plus de 24h
  SELECT id, title
  INTO v_draft
  FROM public.listing_drafts
  WHERE user_id = p_user_id
    AND status = 'draft'
    AND created_at < NOW() - INTERVAL '24 hours'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_draft.id IS NOT NULL THEN
    -- Vérifier si on peut créer une suggestion
    SELECT cc.can_create INTO v_can_create
    FROM public.can_create_suggestion(p_user_id, 'draft_not_published') cc;

    IF v_can_create THEN
      PERFORM public.create_suggestion(
        p_user_id,
        'draft_not_published',
        'Brouillon en attente',
        'Votre annonce "' || LEFT(v_draft.title, 30) || '" attend d''être publiée depuis plus de 24h.',
        'Je voudrais publier mon brouillon d''annonce',
        'high',
        jsonb_build_object('draft_id', v_draft.id, 'draft_title', v_draft.title)
      );
    END IF;
  END IF;
END;
$$;

-- ============================================================================
-- FONCTION: check_referral_suggestions
-- ============================================================================
-- Vérifie l'activité de parrainage et crée des suggestions
-- À appeler au chargement de la page agent

CREATE OR REPLACE FUNCTION public.check_referral_suggestions(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_created_at TIMESTAMPTZ;
  v_referral_count INTEGER;
  v_can_create BOOLEAN;
BEGIN
  -- Récupérer la date de création du profil
  SELECT created_at INTO v_profile_created_at
  FROM public.profiles
  WHERE id = p_user_id;

  -- Vérifier si le compte a plus de 7 jours
  IF v_profile_created_at IS NULL OR v_profile_created_at > NOW() - INTERVAL '7 days' THEN
    RETURN;
  END IF;

  -- Compter les filleuls directs
  SELECT COUNT(*) INTO v_referral_count
  FROM public.referrals
  WHERE referrer_id = p_user_id AND level = 1;

  -- Si aucun filleul, proposer une suggestion
  IF v_referral_count = 0 THEN
    SELECT cc.can_create INTO v_can_create
    FROM public.can_create_suggestion(p_user_id, 'no_referral_activity') cc;

    IF v_can_create THEN
      PERFORM public.create_suggestion(
        p_user_id,
        'no_referral_activity',
        'Boostez votre réseau',
        'Vous n''avez pas encore de filleuls. Partagez votre code parrain pour gagner des commissions !',
        'Comment puis-je partager mon code parrain ?',
        'medium',
        '{}'::jsonb
      );
    END IF;
  END IF;
END;
$$;

-- ============================================================================
-- HELPER: Get eligible drafts for suggestion
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_eligible_drafts_for_suggestion(
  p_user_id uuid
)
RETURNS TABLE (
  id uuid,
  title text
) AS $$
BEGIN
  -- Check if listing_drafts table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'listing_drafts'
  ) THEN
    RETURN;
  END IF;
  
  -- Return eligible drafts (older than 24h, still in draft status)
  RETURN QUERY
  SELECT ld.id, ld.title::text
  FROM public.listing_drafts ld
  WHERE ld.user_id = p_user_id
    AND ld.status = 'draft'
    AND ld.created_at < NOW() - INTERVAL '24 hours'
  ORDER BY ld.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS: Documentation
-- ============================================================================

COMMENT ON TABLE public.agent_suggestions IS 
  'Suggestions proactives pour guider les utilisateurs sur la plateforme Tuge.';

COMMENT ON FUNCTION public.get_active_suggestion IS 
  'Récupère la suggestion active pour un utilisateur (une seule à la fois).';

COMMENT ON FUNCTION public.can_create_suggestion IS 
  'Vérifie les règles anti-spam avant création d''une suggestion.';

COMMENT ON FUNCTION public.create_suggestion IS 
  'Crée une nouvelle suggestion si les règles anti-spam le permettent.';

COMMENT ON FUNCTION public.dismiss_suggestion IS 
  'Marque une suggestion comme ignorée par l''utilisateur.';

COMMENT ON FUNCTION public.click_suggestion IS 
  'Marque une suggestion comme cliquée (interaction utilisateur).';

COMMENT ON FUNCTION public.check_draft_suggestions IS 
  'Vérifie les brouillons non publiés et crée des suggestions appropriées.';

COMMENT ON FUNCTION public.check_referral_suggestions IS 
  'Vérifie l''activité de parrainage et suggère des actions.';

