-- ============================================================================
-- TOUSGETHER - Schéma initial pour l'inscription avec parrainage OTP
-- ============================================================================
-- Ce script crée toutes les tables nécessaires pour le système d'inscription
-- sécurisé avec validation OTP et parrainage immutable.
-- ============================================================================

-- ============================================================================
-- TABLE: pending_registrations
-- ============================================================================
-- Stocke les pré-inscriptions en attente de validation OTP.
-- Aucun compte utilisateur n'existe à ce stade.
-- Les enregistrements expirent automatiquement après 15 minutes.

CREATE TABLE IF NOT EXISTS public.pending_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Email de l'utilisateur (unique pour éviter les doublons)
  email TEXT NOT NULL,
  
  -- Rôle choisi : particulier ou professionnel
  role TEXT NOT NULL CHECK (role IN ('individual', 'professional')),
  
  -- Code parrain fourni (sera résolu vers un user_id lors de la validation)
  referrer_code TEXT,
  
  -- Consentement explicite requis
  consent BOOLEAN NOT NULL DEFAULT false,
  
  -- Source de l'inscription : IA opératrice ou interface web
  source TEXT NOT NULL CHECK (source IN ('ai', 'web')),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
  
  -- Un seul enregistrement par email en attente
  CONSTRAINT pending_registrations_email_unique UNIQUE (email)
);

-- Index pour la recherche par email et le nettoyage des expirations
CREATE INDEX IF NOT EXISTS idx_pending_registrations_email 
  ON public.pending_registrations(email);
CREATE INDEX IF NOT EXISTS idx_pending_registrations_expires_at 
  ON public.pending_registrations(expires_at);

-- ============================================================================
-- TABLE: profiles
-- ============================================================================
-- Profils utilisateurs liés aux comptes Supabase Auth.
-- Créé uniquement après validation OTP réussie.

CREATE TABLE IF NOT EXISTS public.profiles (
  -- ID lié directement à auth.users
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Rôle de l'utilisateur
  role TEXT NOT NULL CHECK (role IN ('individual', 'professional')),
  
  -- Code parrain unique de cet utilisateur (pour parrainer d'autres)
  referrer_code TEXT UNIQUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour la recherche par code parrain
CREATE INDEX IF NOT EXISTS idx_profiles_referrer_code 
  ON public.profiles(referrer_code);

-- ============================================================================
-- TABLE: referrer_codes
-- ============================================================================
-- Table dédiée pour les codes de parrainage (permet plusieurs codes par user si besoin futur)

CREATE TABLE IF NOT EXISTS public.referrer_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Propriétaire du code
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Code unique (ex: TUG-A1B2C3)
  code TEXT NOT NULL UNIQUE,
  
  -- Statut du code (actif par défaut)
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour la recherche par code
CREATE INDEX IF NOT EXISTS idx_referrer_codes_code 
  ON public.referrer_codes(code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_referrer_codes_user_id 
  ON public.referrer_codes(user_id);

-- ============================================================================
-- TABLE: referrals
-- ============================================================================
-- Relations de parrainage IMMUTABLES.
-- Une fois créée, une relation ne peut pas être modifiée ou supprimée.
-- Préparé pour l'évolution MLM avec le champ "level".

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Filleul (celui qui s'est inscrit avec un parrain)
  -- UNIQUE: un utilisateur ne peut avoir qu'un seul parrain
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Parrain (celui qui a parrainé)
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Niveau dans l'arbre de parrainage (1 = direct, 2 = parrain du parrain, etc.)
  -- Préparé pour l'évolution MLM
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  
  -- Source de l'inscription
  source TEXT NOT NULL CHECK (source IN ('ai', 'web')),
  
  -- Timestamp de création (immutable)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Contrainte: impossible de se parrainer soi-même
  CONSTRAINT no_self_referral CHECK (user_id != referrer_id)
);

-- Index pour les requêtes de parrainage
CREATE INDEX IF NOT EXISTS idx_referrals_user_id 
  ON public.referrals(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id 
  ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_level 
  ON public.referrals(level);

-- ============================================================================
-- TABLE: ai_actions_log
-- ============================================================================
-- Traçabilité complète de toutes les actions sensibles.
-- Permet l'audit et le debugging.

CREATE TABLE IF NOT EXISTS public.ai_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Type d'action effectuée
  action_type TEXT NOT NULL,
  
  -- Email cible (pour les actions pré-inscription)
  target_email TEXT,
  
  -- ID utilisateur cible (après création du compte)
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- ID du parrain impliqué
  referrer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Statut de l'action
  status TEXT NOT NULL CHECK (status IN ('initiated', 'pending', 'completed', 'failed')),
  
  -- Métadonnées supplémentaires (JSON)
  metadata JSONB DEFAULT '{}',
  
  -- Message d'erreur en cas d'échec
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes d'audit
CREATE INDEX IF NOT EXISTS idx_ai_actions_log_action_type 
  ON public.ai_actions_log(action_type);
CREATE INDEX IF NOT EXISTS idx_ai_actions_log_target_email 
  ON public.ai_actions_log(target_email);
CREATE INDEX IF NOT EXISTS idx_ai_actions_log_target_user_id 
  ON public.ai_actions_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_ai_actions_log_status 
  ON public.ai_actions_log(status);
CREATE INDEX IF NOT EXISTS idx_ai_actions_log_created_at 
  ON public.ai_actions_log(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Sécurité au niveau des lignes pour protéger les données.

-- Activer RLS sur toutes les tables
ALTER TABLE public.pending_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrer_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_actions_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES: pending_registrations
-- ============================================================================
-- Seul le service_role peut accéder à cette table (via API routes)

CREATE POLICY "Service role only - pending_registrations"
  ON public.pending_registrations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- POLICIES: profiles
-- ============================================================================

-- Les utilisateurs peuvent lire leur propre profil
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Les utilisateurs peuvent mettre à jour leur propre profil (sauf le code parrain)
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Le service_role peut tout faire
CREATE POLICY "Service role full access - profiles"
  ON public.profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- POLICIES: referrer_codes
-- ============================================================================

-- Tout le monde peut lire les codes actifs (pour la validation)
CREATE POLICY "Anyone can read active referrer codes"
  ON public.referrer_codes
  FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Les utilisateurs peuvent lire leurs propres codes
CREATE POLICY "Users can read own referrer codes"
  ON public.referrer_codes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Le service_role peut tout faire
CREATE POLICY "Service role full access - referrer_codes"
  ON public.referrer_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- POLICIES: referrals
-- ============================================================================

-- Les utilisateurs peuvent voir leurs propres relations (filleul ou parrain)
CREATE POLICY "Users can read own referrals"
  ON public.referrals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = referrer_id);

-- Le service_role peut créer des referrals (via API routes)
CREATE POLICY "Service role full access - referrals"
  ON public.referrals
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- POLICIES: ai_actions_log
-- ============================================================================
-- Seul le service_role peut accéder aux logs (sécurité)

CREATE POLICY "Service role only - ai_actions_log"
  ON public.ai_actions_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS: Mise à jour automatique de updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour profiles
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- FUNCTIONS: Nettoyage des pré-inscriptions expirées
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_pending_registrations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.pending_registrations
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS: Documentation des tables
-- ============================================================================

COMMENT ON TABLE public.pending_registrations IS 
  'Pré-inscriptions en attente de validation OTP. Expire après 15 minutes.';

COMMENT ON TABLE public.profiles IS 
  'Profils utilisateurs créés après validation OTP.';

COMMENT ON TABLE public.referrer_codes IS 
  'Codes de parrainage uniques attribués aux utilisateurs.';

COMMENT ON TABLE public.referrals IS 
  'Relations de parrainage immutables entre utilisateurs.';

COMMENT ON TABLE public.ai_actions_log IS 
  'Journal de traçabilité de toutes les actions sensibles.';







