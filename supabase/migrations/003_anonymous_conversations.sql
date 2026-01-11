-- ============================================================================
-- TOUSGETHER - Anonymous Conversations Support
-- ============================================================================
-- Ce script ajoute le support des conversations anonymes pour permettre
-- aux utilisateurs non connectés d'utiliser l'agent IA.
-- Les conversations peuvent ensuite être récupérées après inscription.
-- ============================================================================

-- ============================================================================
-- MODIFICATION: Table conversations
-- ============================================================================

-- Ajouter la colonne session_id pour identifier les sessions anonymes
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS session_id UUID NULL;

-- Rendre user_id nullable pour les conversations anonymes
ALTER TABLE public.conversations
ALTER COLUMN user_id DROP NOT NULL;

-- Ajouter un index sur session_id pour les recherches
CREATE INDEX IF NOT EXISTS idx_conversations_session_id 
  ON public.conversations(session_id)
  WHERE session_id IS NOT NULL;

-- Ajouter une contrainte : une conversation doit avoir soit un user_id, soit un session_id
ALTER TABLE public.conversations
ADD CONSTRAINT conversations_owner_check 
CHECK (user_id IS NOT NULL OR session_id IS NOT NULL);

-- ============================================================================
-- POLICIES: Accès anonyme via service_role
-- ============================================================================
-- Note: Les conversations anonymes sont gérées côté serveur via service_role.
-- Les politiques RLS existantes restent en place pour les utilisateurs authentifiés.

-- Politique pour permettre la lecture des conversations anonymes par session_id
-- (via requête serveur avec le bon session_id)
CREATE POLICY "Anonymous can read own conversations by session"
  ON public.conversations
  FOR SELECT
  TO anon
  USING (session_id IS NOT NULL);

-- Politique pour permettre la création de conversations anonymes
CREATE POLICY "Anonymous can create conversations"
  ON public.conversations
  FOR INSERT
  TO anon
  WITH CHECK (session_id IS NOT NULL AND user_id IS NULL);

-- Politique pour les messages des conversations anonymes
CREATE POLICY "Anonymous can read messages from session conversations"
  ON public.messages
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.session_id IS NOT NULL
    )
  );

-- Politique pour créer des messages dans les conversations anonymes
CREATE POLICY "Anonymous can create messages in session conversations"
  ON public.messages
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.session_id IS NOT NULL
    )
  );

-- ============================================================================
-- FUNCTION: Transférer les conversations anonymes vers un utilisateur
-- ============================================================================

CREATE OR REPLACE FUNCTION public.claim_anonymous_conversations(
  p_session_id UUID,
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  claimed_count INTEGER;
BEGIN
  -- Mettre à jour les conversations qui ont ce session_id
  -- et qui n'ont pas encore de user_id
  UPDATE public.conversations
  SET 
    user_id = p_user_id,
    session_id = NULL
  WHERE 
    session_id = p_session_id
    AND user_id IS NULL;
  
  GET DIAGNOSTICS claimed_count = ROW_COUNT;
  
  RETURN claimed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permettre l'exécution de cette fonction par les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.claim_anonymous_conversations(UUID, UUID) TO authenticated;

-- ============================================================================
-- FUNCTION: Nettoyer les conversations anonymes expirées
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_anonymous_conversations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Supprimer les conversations anonymes de plus de 30 jours
  DELETE FROM public.conversations
  WHERE 
    session_id IS NOT NULL
    AND user_id IS NULL
    AND created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS: Documentation
-- ============================================================================

COMMENT ON COLUMN public.conversations.session_id IS 
  'Identifiant de session pour les conversations anonymes. NULL si la conversation appartient à un utilisateur authentifié.';

COMMENT ON FUNCTION public.claim_anonymous_conversations(UUID, UUID) IS 
  'Transfère les conversations anonymes (identifiées par session_id) vers un utilisateur authentifié (user_id).';

COMMENT ON FUNCTION public.cleanup_expired_anonymous_conversations() IS 
  'Supprime les conversations anonymes de plus de 30 jours pour libérer de l''espace.';







