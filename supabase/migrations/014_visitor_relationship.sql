-- ============================================================================
-- TUGE - Visitor Relationship & Onboarding State
-- ============================================================================
-- Ce script gère l'état de la relation avec les visiteurs anonymes :
-- - Stockage du prénom, intention détectée, étape du flow
-- - Lien avec session_id des conversations anonymes
-- - Support du flow conversationnel en 7 étapes
-- ============================================================================

-- ============================================================================
-- TYPES ENUM
-- ============================================================================

-- Type d'intention détectée par l'agent
CREATE TYPE public.visitor_intention AS ENUM (
  -- Intentions actives (prêt à agir)
  'acheter',
  'vendre',
  'proposer_service',
  'creer_revenus',
  'developper_reseau',
  -- Intentions latentes (pas encore prêt)
  'curiosite',
  'reflexion',
  'apprentissage',
  'comparaison',
  'inspiration',
  -- Non encore détectée
  'unknown'
);

-- Étape du flow conversationnel
CREATE TYPE public.onboarding_step AS ENUM (
  'accroche',           -- Étape 1: Question d'ouverture
  'intention_detectee', -- Étape 2: Intention analysée (invisible)
  'reaction_adaptee',   -- Étape 3: Réponse selon intention
  'prenom_demande',     -- Étape 4: Demande du prénom
  'nurturing',          -- Étape 5: Contenu proposé (si intention latente)
  'email_propose',      -- Étape 6: Email demandé
  'ancrage',            -- Étape 7: Relation ancrée
  'complete'            -- Flow terminé
);

-- ============================================================================
-- TABLE: visitor_profiles
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.visitor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification
  session_id UUID NOT NULL UNIQUE,
  
  -- Informations collectées progressivement
  first_name VARCHAR(100),
  intention visitor_intention DEFAULT 'unknown',
  current_step onboarding_step DEFAULT 'accroche',
  
  -- Métadonnées de la relation
  is_intention_active BOOLEAN DEFAULT false,
  nurturing_content_ids TEXT[] DEFAULT '{}',
  last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Tracking
  message_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les recherches par session_id
CREATE INDEX IF NOT EXISTS idx_visitor_profiles_session_id 
  ON public.visitor_profiles(session_id);

-- Index pour le cleanup des profils inactifs
CREATE INDEX IF NOT EXISTS idx_visitor_profiles_last_interaction 
  ON public.visitor_profiles(last_interaction_at);

-- ============================================================================
-- FUNCTION: Obtenir ou créer un profil visiteur
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_or_create_visitor_profile(
  p_session_id UUID
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
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Essayer d'insérer, ignorer si existe déjà
  INSERT INTO public.visitor_profiles (session_id)
  VALUES (p_session_id)
  ON CONFLICT (session_id) DO NOTHING;
  
  -- Retourner le profil
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
    vp.created_at
  FROM public.visitor_profiles vp
  WHERE vp.session_id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Mettre à jour le profil visiteur
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_visitor_profile(
  p_session_id UUID,
  p_first_name VARCHAR(100) DEFAULT NULL,
  p_intention visitor_intention DEFAULT NULL,
  p_current_step onboarding_step DEFAULT NULL,
  p_increment_messages BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  session_id UUID,
  first_name VARCHAR(100),
  intention visitor_intention,
  current_step onboarding_step,
  is_intention_active BOOLEAN,
  message_count INTEGER
) AS $$
DECLARE
  v_is_active BOOLEAN;
BEGIN
  -- Déterminer si l'intention est active
  IF p_intention IS NOT NULL THEN
    v_is_active := p_intention IN ('acheter', 'vendre', 'proposer_service', 'creer_revenus', 'developper_reseau');
  END IF;
  
  -- Mise à jour du profil
  UPDATE public.visitor_profiles vp
  SET
    first_name = COALESCE(p_first_name, vp.first_name),
    intention = COALESCE(p_intention, vp.intention),
    current_step = COALESCE(p_current_step, vp.current_step),
    is_intention_active = COALESCE(v_is_active, vp.is_intention_active),
    message_count = CASE WHEN p_increment_messages THEN vp.message_count + 1 ELSE vp.message_count END,
    last_interaction_at = NOW(),
    updated_at = NOW()
  WHERE vp.session_id = p_session_id;
  
  -- Retourner le profil mis à jour
  RETURN QUERY
  SELECT 
    vp.id,
    vp.session_id,
    vp.first_name,
    vp.intention,
    vp.current_step,
    vp.is_intention_active,
    vp.message_count
  FROM public.visitor_profiles vp
  WHERE vp.session_id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Ajouter du contenu de nurturing vu
-- ============================================================================

CREATE OR REPLACE FUNCTION public.add_nurturing_content(
  p_session_id UUID,
  p_content_id TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.visitor_profiles
  SET
    nurturing_content_ids = array_append(nurturing_content_ids, p_content_id),
    updated_at = NOW()
  WHERE session_id = p_session_id
    AND NOT (p_content_id = ANY(nurturing_content_ids));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Transférer le profil visiteur vers un utilisateur
-- ============================================================================

CREATE OR REPLACE FUNCTION public.claim_visitor_profile(
  p_session_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  first_name VARCHAR(100),
  intention visitor_intention,
  claimed BOOLEAN
) AS $$
DECLARE
  v_profile RECORD;
BEGIN
  -- Récupérer le profil visiteur
  SELECT vp.first_name, vp.intention
  INTO v_profile
  FROM public.visitor_profiles vp
  WHERE vp.session_id = p_session_id;
  
  IF v_profile IS NULL THEN
    RETURN QUERY SELECT NULL::VARCHAR(100), 'unknown'::visitor_intention, false;
    RETURN;
  END IF;
  
  -- Mettre à jour le profil utilisateur avec les infos collectées
  -- Note: On suppose qu'une table profiles existe déjà
  UPDATE public.profiles
  SET
    first_name = COALESCE(profiles.first_name, v_profile.first_name),
    updated_at = NOW()
  WHERE id = p_user_id
    AND profiles.first_name IS NULL;
  
  -- Supprimer le profil visiteur (les données sont transférées)
  DELETE FROM public.visitor_profiles
  WHERE session_id = p_session_id;
  
  RETURN QUERY SELECT v_profile.first_name, v_profile.intention, true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Nettoyer les profils visiteurs expirés
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_visitor_profiles()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Supprimer les profils de plus de 30 jours sans interaction
  DELETE FROM public.visitor_profiles
  WHERE last_interaction_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.update_visitor_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_visitor_profile_timestamp ON public.visitor_profiles;
CREATE TRIGGER trigger_update_visitor_profile_timestamp
  BEFORE UPDATE ON public.visitor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_visitor_profile_timestamp();

-- ============================================================================
-- POLICIES (RLS)
-- ============================================================================

-- Activer RLS
ALTER TABLE public.visitor_profiles ENABLE ROW LEVEL SECURITY;

-- Les profils visiteurs sont gérés côté serveur via service_role
-- Pas de politique pour anon car tout passe par les fonctions SECURITY DEFINER

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Permettre l'exécution des fonctions
GRANT EXECUTE ON FUNCTION public.get_or_create_visitor_profile(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_visitor_profile(UUID, VARCHAR, visitor_intention, onboarding_step, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_nurturing_content(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_visitor_profile(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_visitor_profiles() TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.visitor_profiles IS 
  'Profils des visiteurs anonymes pour le flow d''onboarding conversationnel. Stocke le prénom, l''intention détectée, et l''étape actuelle du flow.';

COMMENT ON TYPE public.visitor_intention IS 
  'Type d''intention du visiteur : active (prêt à agir) ou latente (pas encore prêt).';

COMMENT ON TYPE public.onboarding_step IS 
  'Étape du flow conversationnel en 7 étapes.';

COMMENT ON FUNCTION public.get_or_create_visitor_profile(UUID) IS 
  'Récupère ou crée un profil visiteur pour une session donnée.';

COMMENT ON FUNCTION public.update_visitor_profile(UUID, VARCHAR, visitor_intention, onboarding_step, BOOLEAN) IS 
  'Met à jour le profil visiteur avec les nouvelles informations collectées.';

COMMENT ON FUNCTION public.claim_visitor_profile(UUID, UUID) IS 
  'Transfère les informations du profil visiteur vers le profil utilisateur après authentification.';







