-- ============================================================================
-- Migration 013: Device Fingerprints - Protection Anti-Doublons
-- ============================================================================
-- 
-- Cette migration crée un système de détection de doublons de compte
-- basé sur l'IP et l'empreinte de l'appareil (device fingerprint).
--
-- Objectifs :
-- - Enregistrer l'IP et le fingerprint lors de l'inscription
-- - Détecter les tentatives de création de comptes multiples
-- - Permettre l'analyse des patterns suspects
--
-- ============================================================================

-- ============================================================================
-- TABLE: device_fingerprints
-- ============================================================================
-- Stocke les empreintes d'appareils associées aux utilisateurs

CREATE TABLE IF NOT EXISTS public.device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Référence utilisateur (nullable au début, rempli après vérification OTP)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Identifiant temporaire avant que user_id ne soit connu
  email TEXT NOT NULL,
  
  -- Données de fingerprinting
  ip_address INET NOT NULL,
  fingerprint_id TEXT NOT NULL,
  user_agent TEXT,
  
  -- Métadonnées additionnelles (timezone, langue, résolution écran, etc.)
  metadata JSONB DEFAULT '{}',
  
  -- Flag de suspicion
  is_suspicious BOOLEAN DEFAULT FALSE,
  suspicion_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEX pour recherche rapide
-- ============================================================================

-- Recherche par IP (pour détecter plusieurs comptes sur même IP)
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_ip 
  ON public.device_fingerprints(ip_address);

-- Recherche par fingerprint (pour détecter même appareil)
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_fingerprint 
  ON public.device_fingerprints(fingerprint_id);

-- Recherche par email (pour retrouver les fingerprints d'un email)
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_email 
  ON public.device_fingerprints(email);

-- Recherche par user_id (pour les utilisateurs vérifiés)
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_user_id 
  ON public.device_fingerprints(user_id) 
  WHERE user_id IS NOT NULL;

-- Index composite pour recherche de doublons
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_ip_fingerprint 
  ON public.device_fingerprints(ip_address, fingerprint_id);

-- ============================================================================
-- TRIGGER: Mise à jour automatique de updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_device_fingerprints_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_device_fingerprints_updated_at ON public.device_fingerprints;
CREATE TRIGGER trigger_device_fingerprints_updated_at
  BEFORE UPDATE ON public.device_fingerprints
  FOR EACH ROW
  EXECUTE FUNCTION update_device_fingerprints_updated_at();

-- ============================================================================
-- FONCTION: check_fingerprint_duplicates
-- ============================================================================
-- Vérifie si l'IP ou le fingerprint existe déjà pour un autre utilisateur
-- Retourne les informations de suspicion

CREATE OR REPLACE FUNCTION check_fingerprint_duplicates(
  p_email TEXT,
  p_ip_address INET,
  p_fingerprint_id TEXT
)
RETURNS TABLE (
  is_suspicious BOOLEAN,
  suspicion_level TEXT,
  suspicion_reason TEXT,
  existing_emails TEXT[],
  ip_count INTEGER,
  fingerprint_count INTEGER
) AS $$
DECLARE
  v_ip_count INTEGER;
  v_fingerprint_count INTEGER;
  v_existing_emails TEXT[];
  v_suspicion_level TEXT;
  v_suspicion_reason TEXT;
  v_is_suspicious BOOLEAN;
BEGIN
  -- Compter les utilisations de cette IP (excluant l'email actuel)
  SELECT COUNT(DISTINCT email)
  INTO v_ip_count
  FROM public.device_fingerprints
  WHERE ip_address = p_ip_address
    AND email != LOWER(p_email)
    AND user_id IS NOT NULL;  -- Seulement les comptes vérifiés
  
  -- Compter les utilisations de ce fingerprint (excluant l'email actuel)
  SELECT COUNT(DISTINCT email)
  INTO v_fingerprint_count
  FROM public.device_fingerprints
  WHERE fingerprint_id = p_fingerprint_id
    AND email != LOWER(p_email)
    AND user_id IS NOT NULL;  -- Seulement les comptes vérifiés
  
  -- Récupérer les emails existants avec ce fingerprint
  SELECT ARRAY_AGG(DISTINCT email)
  INTO v_existing_emails
  FROM public.device_fingerprints
  WHERE fingerprint_id = p_fingerprint_id
    AND email != LOWER(p_email)
    AND user_id IS NOT NULL;
  
  -- Déterminer le niveau de suspicion
  IF v_fingerprint_count > 0 AND v_ip_count > 0 THEN
    v_is_suspicious := TRUE;
    v_suspicion_level := 'high';
    v_suspicion_reason := 'IP et appareil déjà utilisés pour un autre compte';
  ELSIF v_fingerprint_count > 0 THEN
    v_is_suspicious := TRUE;
    v_suspicion_level := 'medium';
    v_suspicion_reason := 'Appareil déjà utilisé pour un autre compte';
  ELSIF v_ip_count > 2 THEN  -- Plus de 2 comptes sur même IP
    v_is_suspicious := TRUE;
    v_suspicion_level := 'low';
    v_suspicion_reason := 'Plusieurs comptes sur la même adresse IP';
  ELSE
    v_is_suspicious := FALSE;
    v_suspicion_level := 'none';
    v_suspicion_reason := NULL;
  END IF;
  
  RETURN QUERY SELECT 
    v_is_suspicious,
    v_suspicion_level,
    v_suspicion_reason,
    v_existing_emails,
    v_ip_count,
    v_fingerprint_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FONCTION: register_device_fingerprint
-- ============================================================================
-- Enregistre un nouveau fingerprint pour un email

CREATE OR REPLACE FUNCTION register_device_fingerprint(
  p_email TEXT,
  p_ip_address INET,
  p_fingerprint_id TEXT,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE (
  success BOOLEAN,
  fingerprint_record_id UUID,
  is_suspicious BOOLEAN,
  suspicion_level TEXT,
  suspicion_reason TEXT
) AS $$
DECLARE
  v_record_id UUID;
  v_check RECORD;
BEGIN
  -- Vérifier les doublons
  SELECT * INTO v_check
  FROM check_fingerprint_duplicates(p_email, p_ip_address, p_fingerprint_id);
  
  -- Insérer ou mettre à jour le fingerprint
  INSERT INTO public.device_fingerprints (
    email,
    ip_address,
    fingerprint_id,
    user_agent,
    metadata,
    is_suspicious,
    suspicion_reason
  )
  VALUES (
    LOWER(p_email),
    p_ip_address,
    p_fingerprint_id,
    p_user_agent,
    p_metadata,
    v_check.is_suspicious,
    v_check.suspicion_reason
  )
  ON CONFLICT (email, fingerprint_id) 
    WHERE user_id IS NULL
  DO UPDATE SET
    ip_address = EXCLUDED.ip_address,
    user_agent = EXCLUDED.user_agent,
    metadata = EXCLUDED.metadata,
    is_suspicious = EXCLUDED.is_suspicious,
    suspicion_reason = EXCLUDED.suspicion_reason,
    updated_at = NOW()
  RETURNING id INTO v_record_id;
  
  RETURN QUERY SELECT 
    TRUE,
    v_record_id,
    v_check.is_suspicious,
    v_check.suspicion_level,
    v_check.suspicion_reason;
    
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT 
    FALSE,
    NULL::UUID,
    FALSE,
    'error'::TEXT,
    SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ajouter une contrainte unique partielle pour éviter les doublons
-- (email + fingerprint quand user_id est null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_device_fingerprints_email_fingerprint_pending
  ON public.device_fingerprints(email, fingerprint_id)
  WHERE user_id IS NULL;

-- ============================================================================
-- FONCTION: link_fingerprint_to_user
-- ============================================================================
-- Lie un fingerprint à un user_id après vérification OTP

CREATE OR REPLACE FUNCTION link_fingerprint_to_user(
  p_email TEXT,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.device_fingerprints
  SET user_id = p_user_id,
      updated_at = NOW()
  WHERE email = LOWER(p_email)
    AND user_id IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres fingerprints
CREATE POLICY "Users can view own fingerprints"
  ON public.device_fingerprints
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Seuls les admins peuvent insérer/modifier (via fonctions SECURITY DEFINER)
-- Pas de policy INSERT/UPDATE/DELETE pour les utilisateurs normaux

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Les fonctions RPC sont accessibles via service_role uniquement
GRANT EXECUTE ON FUNCTION check_fingerprint_duplicates TO service_role;
GRANT EXECUTE ON FUNCTION register_device_fingerprint TO service_role;
GRANT EXECUTE ON FUNCTION link_fingerprint_to_user TO service_role;

-- Accès lecture pour les utilisateurs authentifiés (via RLS)
GRANT SELECT ON public.device_fingerprints TO authenticated;

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE public.device_fingerprints IS 
  'Stocke les empreintes d''appareils pour détecter les doublons de compte';

COMMENT ON COLUMN public.device_fingerprints.fingerprint_id IS 
  'Identifiant unique généré par FingerprintJS côté client';

COMMENT ON COLUMN public.device_fingerprints.is_suspicious IS 
  'Indique si ce fingerprint a été marqué comme suspect';

COMMENT ON FUNCTION check_fingerprint_duplicates IS 
  'Vérifie si l''IP ou le fingerprint existe déjà pour un autre compte';

COMMENT ON FUNCTION register_device_fingerprint IS 
  'Enregistre un nouveau fingerprint et vérifie les doublons';

COMMENT ON FUNCTION link_fingerprint_to_user IS 
  'Lie un fingerprint à un user_id après vérification OTP';







