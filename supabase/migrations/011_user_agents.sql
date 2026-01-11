-- ============================================================================
-- TUGE - Agents IA personnalisés par utilisateur
-- ============================================================================
-- Ce script crée la table pour stocker les profils d'agents personnalisés.
-- Chaque utilisateur peut avoir un seul agent avec un nom, genre et ton.
-- ============================================================================

-- ============================================================================
-- TABLE: user_agents
-- ============================================================================
-- Stocke le profil de l'agent IA personnalisé de chaque utilisateur.
-- Contrainte: 1 agent par utilisateur (user_id = PK).

CREATE TABLE IF NOT EXISTS public.user_agents (
  -- ID lié directement à auth.users (1 agent par user)
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Nom de l'agent (ex: "Alex", "Emma", "Sam")
  -- Limité à 30 caractères pour éviter les abus
  name TEXT NOT NULL DEFAULT 'Assistant' CHECK (
    length(name) >= 1 AND 
    length(name) <= 30 AND
    name !~ '(amour|aime|besoin de toi|seul|triste|dépendant|manque)'
  ),
  
  -- Genre de l'agent (affecte les accords grammaticaux)
  gender TEXT NOT NULL DEFAULT 'neutre' CHECK (
    gender IN ('masculin', 'feminin', 'neutre')
  ),
  
  -- Ton de communication de l'agent
  tone TEXT NOT NULL DEFAULT 'professionnel' CHECK (
    tone IN ('professionnel', 'amical', 'formel', 'decontracte')
  ),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes
CREATE INDEX IF NOT EXISTS idx_user_agents_user_id 
  ON public.user_agents(user_id);

-- ============================================================================
-- TRIGGER: Mise à jour automatique de updated_at
-- ============================================================================

CREATE TRIGGER set_user_agents_updated_at
  BEFORE UPDATE ON public.user_agents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Sécurité stricte: chaque utilisateur n'accède qu'à son propre agent.

ALTER TABLE public.user_agents ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent lire leur propre agent
CREATE POLICY "Users can read own agent"
  ON public.user_agents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leur agent (INSERT)
CREATE POLICY "Users can create own agent"
  ON public.user_agents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leur propre agent
CREATE POLICY "Users can update own agent"
  ON public.user_agents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leur propre agent
CREATE POLICY "Users can delete own agent"
  ON public.user_agents
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Le service_role peut tout faire (pour les API routes)
CREATE POLICY "Service role full access - user_agents"
  ON public.user_agents
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- FONCTION: get_user_agent
-- ============================================================================
-- Récupère l'agent de l'utilisateur avec des valeurs par défaut si inexistant.

CREATE OR REPLACE FUNCTION public.get_user_agent(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  name TEXT,
  gender TEXT,
  tone TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_default BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ua.user_id,
    ua.name,
    ua.gender,
    ua.tone,
    ua.created_at,
    ua.updated_at,
    false AS is_default
  FROM public.user_agents ua
  WHERE ua.user_id = p_user_id;
  
  -- Si aucun résultat, retourner les valeurs par défaut
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      p_user_id AS user_id,
      'Assistant'::TEXT AS name,
      'neutre'::TEXT AS gender,
      'professionnel'::TEXT AS tone,
      NOW() AS created_at,
      NOW() AS updated_at,
      true AS is_default;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FONCTION: upsert_user_agent
-- ============================================================================
-- Crée ou met à jour l'agent de l'utilisateur.

CREATE OR REPLACE FUNCTION public.upsert_user_agent(
  p_user_id UUID,
  p_name TEXT DEFAULT 'Assistant',
  p_gender TEXT DEFAULT 'neutre',
  p_tone TEXT DEFAULT 'professionnel'
)
RETURNS TABLE (
  success BOOLEAN,
  user_id UUID,
  name TEXT,
  gender TEXT,
  tone TEXT,
  message TEXT
) AS $$
DECLARE
  v_result RECORD;
BEGIN
  -- Validation du nom (pas de termes manipulatifs)
  IF p_name ~* '(amour|aime|besoin de toi|seul|triste|dépendant|manque|mon cœur|chéri)' THEN
    RETURN QUERY SELECT 
      false AS success,
      p_user_id AS user_id,
      NULL::TEXT AS name,
      NULL::TEXT AS gender,
      NULL::TEXT AS tone,
      'Le nom contient des termes non autorisés'::TEXT AS message;
    RETURN;
  END IF;

  -- Validation du genre
  IF p_gender NOT IN ('masculin', 'feminin', 'neutre') THEN
    RETURN QUERY SELECT 
      false AS success,
      p_user_id AS user_id,
      NULL::TEXT AS name,
      NULL::TEXT AS gender,
      NULL::TEXT AS tone,
      'Genre invalide. Valeurs acceptées: masculin, feminin, neutre'::TEXT AS message;
    RETURN;
  END IF;

  -- Validation du ton
  IF p_tone NOT IN ('professionnel', 'amical', 'formel', 'decontracte') THEN
    RETURN QUERY SELECT 
      false AS success,
      p_user_id AS user_id,
      NULL::TEXT AS name,
      NULL::TEXT AS gender,
      NULL::TEXT AS tone,
      'Ton invalide. Valeurs acceptées: professionnel, amical, formel, decontracte'::TEXT AS message;
    RETURN;
  END IF;

  -- Upsert de l'agent
  INSERT INTO public.user_agents (user_id, name, gender, tone)
  VALUES (p_user_id, p_name, p_gender, p_tone)
  ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    gender = EXCLUDED.gender,
    tone = EXCLUDED.tone,
    updated_at = NOW()
  RETURNING * INTO v_result;

  RETURN QUERY SELECT 
    true AS success,
    v_result.user_id,
    v_result.name,
    v_result.gender,
    v_result.tone,
    'Agent mis à jour avec succès'::TEXT AS message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS: Documentation
-- ============================================================================

COMMENT ON TABLE public.user_agents IS 
  'Profils d''agents IA personnalisés. 1 agent par utilisateur max.';

COMMENT ON COLUMN public.user_agents.name IS 
  'Nom de l''agent (1-30 caractères, pas de termes manipulatifs)';

COMMENT ON COLUMN public.user_agents.gender IS 
  'Genre pour les accords grammaticaux: masculin, feminin, neutre';

COMMENT ON COLUMN public.user_agents.tone IS 
  'Style de communication: professionnel, amical, formel, decontracte';

COMMENT ON FUNCTION public.get_user_agent IS 
  'Récupère l''agent utilisateur avec valeurs par défaut si inexistant';

COMMENT ON FUNCTION public.upsert_user_agent IS 
  'Crée ou met à jour l''agent avec validation des contenus';







