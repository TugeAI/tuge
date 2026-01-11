-- ============================================================================
-- TUGE - Système de Propositions Inter-Agents (Propals)
-- ============================================================================
-- Ce script crée les tables et fonctions nécessaires pour permettre aux agents
-- IA de proposer des collaborations entre utilisateurs, avec approbation humaine
-- obligatoire et règles anti-spam.
-- ============================================================================

-- ============================================================================
-- ENUM: Types de propositions
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE proposal_type AS ENUM (
    'service_proposal',       -- Proposition de service
    'collaboration_request',  -- Demande de collaboration
    'info_share'              -- Partage d'information
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- ENUM: Statuts des propositions
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE proposal_status AS ENUM (
    'pending',    -- En attente de réponse
    'accepted',   -- Acceptée par le destinataire
    'rejected',   -- Refusée par le destinataire
    'cancelled',  -- Annulée par l'émetteur
    'expired'     -- Expirée automatiquement (7 jours)
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABLE: agent_proposals
-- ============================================================================
-- Stocke les propositions de collaboration entre agents/utilisateurs.
-- Règles anti-spam: max 3 pending par destinataire, dedupe_key unique.

CREATE TABLE IF NOT EXISTS public.agent_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Émetteur de la proposition
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Destinataire de la proposition
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Type de proposition
  type proposal_type NOT NULL,
  
  -- Payload JSON structuré (données spécifiques au type)
  payload JSONB NOT NULL DEFAULT '{}',
  
  -- Message optionnel de l'émetteur
  message TEXT CHECK (message IS NULL OR char_length(message) <= 500),
  
  -- Clé de déduplication (évite les doublons)
  -- Format suggéré: {from_user_id}:{to_user_id}:{type}:{hash_payload}
  dedupe_key TEXT NOT NULL,
  
  -- Statut actuel
  status proposal_status NOT NULL DEFAULT 'pending',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  responded_at TIMESTAMPTZ,
  
  -- Empêcher les auto-propositions
  CONSTRAINT no_self_proposal CHECK (from_user_id != to_user_id)
);

-- ============================================================================
-- INDEX: Optimisation des requêtes
-- ============================================================================

-- Index pour compter les pending par destinataire (anti-spam)
CREATE INDEX IF NOT EXISTS idx_proposals_recipient_pending 
  ON public.agent_proposals(to_user_id, status) 
  WHERE status = 'pending';

-- Index pour la déduplication (unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_proposals_dedupe 
  ON public.agent_proposals(dedupe_key) 
  WHERE status = 'pending';

-- Index pour l'expiration automatique
CREATE INDEX IF NOT EXISTS idx_proposals_expires 
  ON public.agent_proposals(expires_at) 
  WHERE status = 'pending';

-- Index pour les requêtes par émetteur
CREATE INDEX IF NOT EXISTS idx_proposals_from_user 
  ON public.agent_proposals(from_user_id, created_at DESC);

-- Index pour les requêtes par destinataire
CREATE INDEX IF NOT EXISTS idx_proposals_to_user 
  ON public.agent_proposals(to_user_id, created_at DESC);

-- Index pour le cooldown après rejet (paire user + type)
CREATE INDEX IF NOT EXISTS idx_proposals_cooldown 
  ON public.agent_proposals(from_user_id, to_user_id, type, responded_at DESC) 
  WHERE status = 'rejected';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.agent_proposals ENABLE ROW LEVEL SECURITY;

-- Les émetteurs peuvent voir leurs propres propositions
CREATE POLICY "Senders can read own proposals"
  ON public.agent_proposals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = from_user_id);

-- Les destinataires peuvent voir les propositions qui leur sont adressées
CREATE POLICY "Recipients can read received proposals"
  ON public.agent_proposals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = to_user_id);

-- Les utilisateurs authentifiés peuvent créer des propositions
-- (la validation anti-spam est faite dans la fonction RPC)
CREATE POLICY "Users can create proposals"
  ON public.agent_proposals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

-- Les émetteurs peuvent annuler leurs propositions pending
CREATE POLICY "Senders can cancel own pending proposals"
  ON public.agent_proposals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = from_user_id AND status = 'pending')
  WITH CHECK (auth.uid() = from_user_id AND status = 'cancelled');

-- Les destinataires peuvent répondre aux propositions pending
CREATE POLICY "Recipients can respond to pending proposals"
  ON public.agent_proposals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = to_user_id AND status = 'pending')
  WITH CHECK (auth.uid() = to_user_id AND status IN ('accepted', 'rejected'));

-- Le service_role peut tout faire (pour les cron jobs et API internes)
CREATE POLICY "Service role full access - agent_proposals"
  ON public.agent_proposals
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- FONCTION: count_pending_proposals
-- ============================================================================
-- Compte les propositions pending pour un destinataire (pour anti-spam)

CREATE OR REPLACE FUNCTION public.count_pending_proposals(p_to_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.agent_proposals
  WHERE to_user_id = p_to_user_id
    AND status = 'pending'
    AND expires_at > NOW();
$$;

-- ============================================================================
-- FONCTION: check_proposal_cooldown
-- ============================================================================
-- Vérifie si un cooldown est actif après un rejet (24h)

CREATE OR REPLACE FUNCTION public.check_proposal_cooldown(
  p_from_user_id UUID,
  p_to_user_id UUID,
  p_type proposal_type
)
RETURNS TABLE (
  is_in_cooldown BOOLEAN,
  cooldown_ends_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_rejected TIMESTAMPTZ;
  v_cooldown_end TIMESTAMPTZ;
BEGIN
  -- Chercher le dernier rejet pour cette paire user + type
  SELECT responded_at
  INTO v_last_rejected
  FROM public.agent_proposals
  WHERE from_user_id = p_from_user_id
    AND to_user_id = p_to_user_id
    AND type = p_type
    AND status = 'rejected'
  ORDER BY responded_at DESC
  LIMIT 1;

  IF v_last_rejected IS NULL THEN
    RETURN QUERY SELECT false, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  v_cooldown_end := v_last_rejected + INTERVAL '24 hours';
  
  IF NOW() < v_cooldown_end THEN
    RETURN QUERY SELECT true, v_cooldown_end;
  ELSE
    RETURN QUERY SELECT false, NULL::TIMESTAMPTZ;
  END IF;
END;
$$;

-- ============================================================================
-- FONCTION: create_proposal
-- ============================================================================
-- Crée une nouvelle proposition avec validation anti-spam complète

CREATE OR REPLACE FUNCTION public.create_proposal(
  p_from_user_id UUID,
  p_to_user_id UUID,
  p_type proposal_type,
  p_payload JSONB DEFAULT '{}',
  p_message TEXT DEFAULT NULL,
  p_dedupe_key TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  proposal_id UUID,
  error_code TEXT,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pending_count INTEGER;
  v_is_in_cooldown BOOLEAN;
  v_cooldown_ends TIMESTAMPTZ;
  v_dedupe_key TEXT;
  v_new_id UUID;
BEGIN
  -- Validation: pas d'auto-proposition
  IF p_from_user_id = p_to_user_id THEN
    RETURN QUERY SELECT 
      false, 
      NULL::UUID, 
      'SELF_PROPOSAL'::TEXT, 
      'Impossible de créer une proposition pour soi-même'::TEXT;
    RETURN;
  END IF;

  -- Vérifier le cooldown après rejet
  SELECT cc.is_in_cooldown, cc.cooldown_ends_at
  INTO v_is_in_cooldown, v_cooldown_ends
  FROM public.check_proposal_cooldown(p_from_user_id, p_to_user_id, p_type) cc;

  IF v_is_in_cooldown THEN
    RETURN QUERY SELECT 
      false, 
      NULL::UUID, 
      'COOLDOWN_ACTIVE'::TEXT, 
      ('Cooldown actif jusqu''au ' || to_char(v_cooldown_ends, 'DD/MM/YYYY HH24:MI'))::TEXT;
    RETURN;
  END IF;

  -- Compter les propositions pending du destinataire (max 3)
  SELECT public.count_pending_proposals(p_to_user_id)
  INTO v_pending_count;

  IF v_pending_count >= 3 THEN
    RETURN QUERY SELECT 
      false, 
      NULL::UUID, 
      'RECIPIENT_LIMIT'::TEXT, 
      'Le destinataire a atteint la limite de propositions en attente (3 max)'::TEXT;
    RETURN;
  END IF;

  -- Générer la clé de déduplication si non fournie
  v_dedupe_key := COALESCE(
    p_dedupe_key,
    p_from_user_id::TEXT || ':' || p_to_user_id::TEXT || ':' || p_type::TEXT || ':' || md5(p_payload::TEXT)
  );

  -- Vérifier la déduplication (une proposition identique pending existe-t-elle?)
  IF EXISTS (
    SELECT 1 FROM public.agent_proposals
    WHERE dedupe_key = v_dedupe_key
      AND status = 'pending'
      AND expires_at > NOW()
  ) THEN
    RETURN QUERY SELECT 
      false, 
      NULL::UUID, 
      'DUPLICATE'::TEXT, 
      'Une proposition identique est déjà en attente'::TEXT;
    RETURN;
  END IF;

  -- Créer la proposition
  INSERT INTO public.agent_proposals (
    from_user_id,
    to_user_id,
    type,
    payload,
    message,
    dedupe_key
  ) VALUES (
    p_from_user_id,
    p_to_user_id,
    p_type,
    p_payload,
    p_message,
    v_dedupe_key
  )
  RETURNING id INTO v_new_id;

  RETURN QUERY SELECT 
    true, 
    v_new_id, 
    NULL::TEXT, 
    NULL::TEXT;
END;
$$;

-- ============================================================================
-- FONCTION: respond_to_proposal
-- ============================================================================
-- Permet au destinataire d'accepter ou refuser une proposition

CREATE OR REPLACE FUNCTION public.respond_to_proposal(
  p_proposal_id UUID,
  p_action TEXT  -- 'accept' ou 'reject'
)
RETURNS TABLE (
  success BOOLEAN,
  proposal_id UUID,
  new_status proposal_status,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_proposal RECORD;
  v_new_status proposal_status;
BEGIN
  -- Valider l'action
  IF p_action NOT IN ('accept', 'reject') THEN
    RETURN QUERY SELECT 
      false, 
      p_proposal_id, 
      NULL::proposal_status, 
      'Action invalide. Utilisez "accept" ou "reject"'::TEXT;
    RETURN;
  END IF;

  -- Récupérer la proposition
  SELECT *
  INTO v_proposal
  FROM public.agent_proposals
  WHERE id = p_proposal_id
    AND to_user_id = auth.uid()
    AND status = 'pending'
    AND expires_at > NOW()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      false, 
      p_proposal_id, 
      NULL::proposal_status, 
      'Proposition non trouvée ou déjà traitée'::TEXT;
    RETURN;
  END IF;

  -- Déterminer le nouveau statut
  v_new_status := CASE p_action
    WHEN 'accept' THEN 'accepted'::proposal_status
    WHEN 'reject' THEN 'rejected'::proposal_status
  END;

  -- Mettre à jour la proposition
  UPDATE public.agent_proposals
  SET 
    status = v_new_status,
    responded_at = NOW()
  WHERE id = p_proposal_id;

  RETURN QUERY SELECT 
    true, 
    p_proposal_id, 
    v_new_status, 
    NULL::TEXT;
END;
$$;

-- ============================================================================
-- FONCTION: cancel_proposal
-- ============================================================================
-- Permet à l'émetteur d'annuler sa proposition

CREATE OR REPLACE FUNCTION public.cancel_proposal(p_proposal_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE public.agent_proposals
  SET 
    status = 'cancelled',
    responded_at = NOW()
  WHERE id = p_proposal_id
    AND from_user_id = auth.uid()
    AND status = 'pending';
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  IF v_updated > 0 THEN
    RETURN QUERY SELECT true, NULL::TEXT;
  ELSE
    RETURN QUERY SELECT false, 'Proposition non trouvée ou déjà traitée'::TEXT;
  END IF;
END;
$$;

-- ============================================================================
-- FONCTION: get_pending_proposals
-- ============================================================================
-- Récupère les propositions pending pour un utilisateur (reçues ou envoyées)

CREATE OR REPLACE FUNCTION public.get_pending_proposals(
  p_user_id UUID,
  p_direction TEXT DEFAULT 'received'  -- 'received', 'sent', ou 'both'
)
RETURNS TABLE (
  id UUID,
  from_user_id UUID,
  to_user_id UUID,
  from_agent_name TEXT,
  to_agent_name TEXT,
  type proposal_type,
  payload JSONB,
  message TEXT,
  status proposal_status,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  time_remaining INTERVAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.from_user_id,
    p.to_user_id,
    COALESCE(fa.name, 'Agent') AS from_agent_name,
    COALESCE(ta.name, 'Agent') AS to_agent_name,
    p.type,
    p.payload,
    p.message,
    p.status,
    p.created_at,
    p.expires_at,
    (p.expires_at - NOW()) AS time_remaining
  FROM public.agent_proposals p
  LEFT JOIN public.user_agents fa ON fa.user_id = p.from_user_id
  LEFT JOIN public.user_agents ta ON ta.user_id = p.to_user_id
  WHERE 
    p.status = 'pending'
    AND p.expires_at > NOW()
    AND (
      (p_direction = 'received' AND p.to_user_id = p_user_id)
      OR (p_direction = 'sent' AND p.from_user_id = p_user_id)
      OR (p_direction = 'both' AND (p.to_user_id = p_user_id OR p.from_user_id = p_user_id))
    )
  ORDER BY 
    p.created_at DESC;
END;
$$;

-- ============================================================================
-- FONCTION: expire_proposals
-- ============================================================================
-- Expire automatiquement les propositions dépassées (à appeler via cron)

CREATE OR REPLACE FUNCTION public.expire_proposals()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  UPDATE public.agent_proposals
  SET 
    status = 'expired',
    responded_at = NOW()
  WHERE status = 'pending'
    AND expires_at <= NOW();
  
  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  RETURN v_expired_count;
END;
$$;

-- ============================================================================
-- FONCTION: get_proposal_by_id
-- ============================================================================
-- Récupère une proposition par son ID (avec vérification d'accès)

CREATE OR REPLACE FUNCTION public.get_proposal_by_id(p_proposal_id UUID)
RETURNS TABLE (
  id UUID,
  from_user_id UUID,
  to_user_id UUID,
  from_agent_name TEXT,
  to_agent_name TEXT,
  type proposal_type,
  payload JSONB,
  message TEXT,
  status proposal_status,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  is_sender BOOLEAN,
  is_recipient BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.from_user_id,
    p.to_user_id,
    COALESCE(fa.name, 'Agent') AS from_agent_name,
    COALESCE(ta.name, 'Agent') AS to_agent_name,
    p.type,
    p.payload,
    p.message,
    p.status,
    p.created_at,
    p.expires_at,
    p.responded_at,
    (p.from_user_id = auth.uid()) AS is_sender,
    (p.to_user_id = auth.uid()) AS is_recipient
  FROM public.agent_proposals p
  LEFT JOIN public.user_agents fa ON fa.user_id = p.from_user_id
  LEFT JOIN public.user_agents ta ON ta.user_id = p.to_user_id
  WHERE p.id = p_proposal_id
    AND (p.from_user_id = auth.uid() OR p.to_user_id = auth.uid());
END;
$$;

-- ============================================================================
-- TRIGGER: Mise à jour automatique via handle_updated_at (si existe)
-- ============================================================================
-- Note: On n'ajoute pas de trigger updated_at car les propositions sont
-- immuables après création, seul le status/responded_at changent.

-- ============================================================================
-- COMMENTS: Documentation
-- ============================================================================

COMMENT ON TABLE public.agent_proposals IS 
  'Propositions de collaboration inter-agents avec approbation humaine obligatoire.';

COMMENT ON COLUMN public.agent_proposals.dedupe_key IS 
  'Clé unique pour éviter les doublons. Format: from:to:type:hash_payload';

COMMENT ON COLUMN public.agent_proposals.payload IS 
  'Données structurées JSON spécifiques au type de proposition.';

COMMENT ON FUNCTION public.create_proposal IS 
  'Crée une proposition avec validation anti-spam (3 pending max, cooldown 24h, dedupe).';

COMMENT ON FUNCTION public.respond_to_proposal IS 
  'Permet au destinataire d''accepter ou refuser une proposition pending.';

COMMENT ON FUNCTION public.cancel_proposal IS 
  'Permet à l''émetteur d''annuler sa proposition pending.';

COMMENT ON FUNCTION public.get_pending_proposals IS 
  'Liste les propositions pending (reçues, envoyées, ou les deux).';

COMMENT ON FUNCTION public.expire_proposals IS 
  'Expire les propositions dépassées. À appeler via cron job.';







