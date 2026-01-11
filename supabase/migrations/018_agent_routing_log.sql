-- ============================================================================
-- Migration 018: Système de logging inter-agents
-- ============================================================================
-- 
-- Cette migration crée la table agent_routing_log pour le tracking minimal
-- des décisions de routage entre agents dans le système multi-agents.
--
-- Utilisation :
-- - Logging des décisions de l'orchestrateur
-- - Tracking des sous-agents consultés
-- - Analytics et debug du système multi-agents
--
-- ============================================================================

-- Table de logging des décisions de routage inter-agents
CREATE TABLE IF NOT EXISTS agent_routing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Références optionnelles (peuvent être NULL pour les visiteurs anonymes)
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Informations de routage
  from_agent TEXT NOT NULL,           -- 'user_agent', 'orchestrator'
  to_agent TEXT NOT NULL,             -- 'marketing', 'vision', 'sales', 'accounting', 'synthesizer'
  
  -- Contexte de la décision
  intent TEXT,                        -- Intention détectée (ex: 'improve_listing_content')
  decision TEXT,                      -- Décision prise (ex: 'route_to_marketing')
  
  -- Métadonnées optionnelles
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_agent_routing_log_conversation 
  ON agent_routing_log(conversation_id) 
  WHERE conversation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agent_routing_log_user 
  ON agent_routing_log(user_id) 
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agent_routing_log_created_at 
  ON agent_routing_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_routing_log_to_agent 
  ON agent_routing_log(to_agent);

-- ============================================================================
-- Fonction RPC pour logger une décision de routage
-- ============================================================================

CREATE OR REPLACE FUNCTION log_agent_routing(
  p_from_agent TEXT,
  p_to_agent TEXT,
  p_intent TEXT DEFAULT NULL,
  p_decision TEXT DEFAULT NULL,
  p_conversation_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO agent_routing_log (
    from_agent,
    to_agent,
    intent,
    decision,
    conversation_id,
    user_id,
    metadata
  ) VALUES (
    p_from_agent,
    p_to_agent,
    p_intent,
    p_decision,
    p_conversation_id,
    p_user_id,
    p_metadata
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- ============================================================================
-- Fonction RPC pour récupérer les stats de routage
-- ============================================================================

CREATE OR REPLACE FUNCTION get_agent_routing_stats(
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  to_agent TEXT,
  total_calls BIGINT,
  unique_users BIGINT,
  unique_conversations BIGINT,
  most_common_intent TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    arl.to_agent,
    COUNT(*)::BIGINT as total_calls,
    COUNT(DISTINCT arl.user_id)::BIGINT as unique_users,
    COUNT(DISTINCT arl.conversation_id)::BIGINT as unique_conversations,
    MODE() WITHIN GROUP (ORDER BY arl.intent) as most_common_intent
  FROM agent_routing_log arl
  WHERE arl.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY arl.to_agent
  ORDER BY total_calls DESC;
END;
$$;

-- ============================================================================
-- Fonction de nettoyage des vieux logs (garder 30 jours par défaut)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_routing_logs(
  p_days_to_keep INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM agent_routing_log
  WHERE created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  RETURN v_deleted;
END;
$$;

-- ============================================================================
-- Policies RLS
-- ============================================================================

-- Activer RLS
ALTER TABLE agent_routing_log ENABLE ROW LEVEL SECURITY;

-- Policy : Les utilisateurs peuvent voir leurs propres logs
CREATE POLICY "Users can view their own routing logs"
  ON agent_routing_log
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy : Insertion uniquement via les fonctions RPC (SECURITY DEFINER)
-- Pas de policy INSERT directe pour les utilisateurs

-- ============================================================================
-- Commentaires
-- ============================================================================

COMMENT ON TABLE agent_routing_log IS 'Logging minimal des décisions de routage inter-agents';
COMMENT ON COLUMN agent_routing_log.from_agent IS 'Agent source de la requête (user_agent, orchestrator)';
COMMENT ON COLUMN agent_routing_log.to_agent IS 'Agent cible (marketing, vision, sales, accounting, synthesizer)';
COMMENT ON COLUMN agent_routing_log.intent IS 'Intention détectée par le router';
COMMENT ON COLUMN agent_routing_log.decision IS 'Décision de routage prise';





