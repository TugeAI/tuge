-- ============================================================================
-- TUGE - Visitor IP & Fingerprint Tracking
-- ============================================================================
-- Ajoute le tracking par IP et fingerprint pour identifier les visiteurs
-- et reprendre leur conversation automatiquement.
-- ============================================================================

-- ============================================================================
-- ALTER TABLE: Ajouter les colonnes IP et Fingerprint
-- ============================================================================

ALTER TABLE public.visitor_profiles
  ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45),
  ADD COLUMN IF NOT EXISTS fingerprint_id VARCHAR(100);

-- Index pour les recherches par IP
CREATE INDEX IF NOT EXISTS idx_visitor_profiles_ip_address 
  ON public.visitor_profiles(ip_address) 
  WHERE ip_address IS NOT NULL;

-- Index pour les recherches par fingerprint
CREATE INDEX IF NOT EXISTS idx_visitor_profiles_fingerprint_id 
  ON public.visitor_profiles(fingerprint_id) 
  WHERE fingerprint_id IS NOT NULL;

-- ============================================================================
-- FUNCTION: Rechercher un profil visiteur par IP ou Fingerprint
-- ============================================================================

CREATE OR REPLACE FUNCTION public.find_visitor_by_identity(
  p_ip_address VARCHAR(45) DEFAULT NULL,
  p_fingerprint_id VARCHAR(100) DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  session_id UUID,
  first_name VARCHAR(100),
  intention visitor_intention,
  current_step onboarding_step,
  is_intention_active BOOLEAN,
  nurturing_content_ids TEXT[],
  message_count INTEGER,
  ip_address VARCHAR(45),
  fingerprint_id VARCHAR(100),
  created_at TIMESTAMPTZ,
  last_interaction_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Priorité 1: Chercher par fingerprint (plus fiable)
  IF p_fingerprint_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      vp.id,
      vp.session_id,
      vp.first_name,
      vp.intention,
      vp.current_step,
      vp.is_intention_active,
      vp.nurturing_content_ids,
      vp.message_count,
      vp.ip_address,
      vp.fingerprint_id,
      vp.created_at,
      vp.last_interaction_at
    FROM public.visitor_profiles vp
    WHERE vp.fingerprint_id = p_fingerprint_id
    ORDER BY vp.last_interaction_at DESC
    LIMIT 1;
    
    IF FOUND THEN
      RETURN;
    END IF;
  END IF;
  
  -- Priorité 2: Chercher par IP
  IF p_ip_address IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      vp.id,
      vp.session_id,
      vp.first_name,
      vp.intention,
      vp.current_step,
      vp.is_intention_active,
      vp.nurturing_content_ids,
      vp.message_count,
      vp.ip_address,
      vp.fingerprint_id,
      vp.created_at,
      vp.last_interaction_at
    FROM public.visitor_profiles vp
    WHERE vp.ip_address = p_ip_address
    ORDER BY vp.last_interaction_at DESC
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Créer ou mettre à jour un profil avec IP/Fingerprint
-- ============================================================================

CREATE OR REPLACE FUNCTION public.upsert_visitor_profile(
  p_session_id UUID,
  p_ip_address VARCHAR(45) DEFAULT NULL,
  p_fingerprint_id VARCHAR(100) DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  session_id UUID,
  first_name VARCHAR(100),
  intention visitor_intention,
  current_step onboarding_step,
  is_intention_active BOOLEAN,
  message_count INTEGER,
  ip_address VARCHAR(45),
  fingerprint_id VARCHAR(100),
  is_new BOOLEAN
) AS $$
DECLARE
  v_existing RECORD;
  v_is_new BOOLEAN := false;
BEGIN
  -- Chercher un profil existant par fingerprint ou IP
  SELECT vp.* INTO v_existing
  FROM public.visitor_profiles vp
  WHERE (p_fingerprint_id IS NOT NULL AND vp.fingerprint_id = p_fingerprint_id)
     OR (p_ip_address IS NOT NULL AND vp.ip_address = p_ip_address)
  ORDER BY vp.last_interaction_at DESC
  LIMIT 1;
  
  IF v_existing IS NOT NULL THEN
    -- Mettre à jour le profil existant avec les nouvelles infos
    UPDATE public.visitor_profiles vp
    SET
      ip_address = COALESCE(p_ip_address, vp.ip_address),
      fingerprint_id = COALESCE(p_fingerprint_id, vp.fingerprint_id),
      last_interaction_at = NOW(),
      updated_at = NOW()
    WHERE vp.id = v_existing.id;
    
    RETURN QUERY
    SELECT 
      vp.id,
      vp.session_id,
      vp.first_name,
      vp.intention,
      vp.current_step,
      vp.is_intention_active,
      vp.message_count,
      vp.ip_address,
      vp.fingerprint_id,
      false AS is_new
    FROM public.visitor_profiles vp
    WHERE vp.id = v_existing.id;
  ELSE
    -- Créer un nouveau profil
    v_is_new := true;
    
    INSERT INTO public.visitor_profiles (session_id, ip_address, fingerprint_id)
    VALUES (p_session_id, p_ip_address, p_fingerprint_id)
    ON CONFLICT (session_id) DO UPDATE
    SET
      ip_address = COALESCE(EXCLUDED.ip_address, public.visitor_profiles.ip_address),
      fingerprint_id = COALESCE(EXCLUDED.fingerprint_id, public.visitor_profiles.fingerprint_id),
      last_interaction_at = NOW(),
      updated_at = NOW();
    
    RETURN QUERY
    SELECT 
      vp.id,
      vp.session_id,
      vp.first_name,
      vp.intention,
      vp.current_step,
      vp.is_intention_active,
      vp.message_count,
      vp.ip_address,
      vp.fingerprint_id,
      v_is_new AS is_new
    FROM public.visitor_profiles vp
    WHERE vp.session_id = p_session_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.find_visitor_by_identity(VARCHAR, VARCHAR) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_visitor_profile(UUID, VARCHAR, VARCHAR) TO anon, authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.visitor_profiles.ip_address IS 
  'Adresse IP du visiteur pour identification automatique';

COMMENT ON COLUMN public.visitor_profiles.fingerprint_id IS 
  'ID FingerprintJS du visiteur pour identification fiable';

COMMENT ON FUNCTION public.find_visitor_by_identity IS 
  'Recherche un profil visiteur par fingerprint (prioritaire) ou IP';

COMMENT ON FUNCTION public.upsert_visitor_profile IS 
  'Crée ou met à jour un profil visiteur avec IP et fingerprint';






