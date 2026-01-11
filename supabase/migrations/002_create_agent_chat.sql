-- ============================================================================
-- TOUSGETHER - Agent Chat Schema
-- ============================================================================
-- Ce script crée les tables nécessaires pour le système de chat avec l'agent IA.
-- Inclut l'historique des conversations et les messages avec RLS.
-- ============================================================================

-- ============================================================================
-- TABLE: conversations
-- ============================================================================
-- Stocke les conversations entre utilisateurs et l'agent IA.

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Propriétaire de la conversation
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Titre de la conversation (auto-généré à partir du premier message)
  title TEXT NOT NULL DEFAULT 'Nouvelle conversation',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour la recherche par utilisateur et le tri par date
CREATE INDEX IF NOT EXISTS idx_conversations_user_id 
  ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at 
  ON public.conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at 
  ON public.conversations(updated_at DESC);

-- ============================================================================
-- TABLE: messages
-- ============================================================================
-- Stocke les messages de chaque conversation.

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Conversation parente
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  
  -- Rôle de l'émetteur du message
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  
  -- Contenu du message
  content TEXT NOT NULL,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour la recherche par conversation et le tri chronologique
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
  ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at 
  ON public.messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
  ON public.messages(conversation_id, created_at ASC);

-- ============================================================================
-- TRIGGER: Mise à jour automatique de updated_at sur conversations
-- ============================================================================

CREATE TRIGGER set_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- TRIGGER: Mise à jour de updated_at de la conversation quand un message est ajouté
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_timestamp();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur les tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES: conversations
-- ============================================================================

-- Les utilisateurs peuvent voir leurs propres conversations
CREATE POLICY "Users can read own conversations"
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leurs propres conversations
CREATE POLICY "Users can create own conversations"
  ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres conversations
CREATE POLICY "Users can update own conversations"
  ON public.conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres conversations
CREATE POLICY "Users can delete own conversations"
  ON public.conversations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Le service_role peut tout faire
CREATE POLICY "Service role full access - conversations"
  ON public.conversations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- POLICIES: messages
-- ============================================================================

-- Les utilisateurs peuvent voir les messages de leurs propres conversations
CREATE POLICY "Users can read messages from own conversations"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Les utilisateurs peuvent créer des messages dans leurs propres conversations
CREATE POLICY "Users can create messages in own conversations"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Les utilisateurs peuvent supprimer des messages de leurs propres conversations
CREATE POLICY "Users can delete messages from own conversations"
  ON public.messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Le service_role peut tout faire
CREATE POLICY "Service role full access - messages"
  ON public.messages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS: Documentation des tables
-- ============================================================================

COMMENT ON TABLE public.conversations IS 
  'Conversations entre utilisateurs et l''agent IA Tousgether.';

COMMENT ON TABLE public.messages IS 
  'Messages individuels au sein des conversations avec l''agent IA.';

COMMENT ON COLUMN public.messages.role IS 
  'Rôle de l''émetteur: user (utilisateur) ou assistant (agent IA).';







