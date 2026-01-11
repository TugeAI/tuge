-- ============================================================================
-- Migration: Support des Tool Calls dans les messages
-- ============================================================================
-- Cette migration ajoute le support du stockage des tool calls (appels d'outils)
-- dans la table messages pour permettre la restauration complète du contexte
-- IA lors de la reprise d'une conversation existante.
--
-- Problème résolu :
-- Quand l'IA utilise un outil (ex: create_listing_draft), cette information
-- n'était pas sauvegardée. Lors de la reprise d'une conversation, l'IA perdait
-- le contexte des actions passées.
--
-- Format OpenAI des tool calls :
-- - Message assistant avec tool_calls : demande d'exécution d'un outil
-- - Message tool avec tool_call_id : résultat de l'exécution
-- ============================================================================

-- ============================================================================
-- STEP 1: Ajouter les nouvelles colonnes
-- ============================================================================

-- Colonne pour stocker les tool calls (format OpenAI)
-- Contient un tableau d'objets : [{id, type, function: {name, arguments}}]
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS tool_calls JSONB DEFAULT NULL;

-- Colonne pour identifier le tool call auquel ce message répond
-- Utilisé pour les messages de type 'tool' (résultats d'outils)
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS tool_call_id TEXT DEFAULT NULL;

-- Colonne pour stocker le nom de l'outil (pour les messages tool)
-- Facilite les requêtes et le debugging
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS tool_name TEXT DEFAULT NULL;

-- ============================================================================
-- STEP 2: Mettre à jour la contrainte de rôle
-- ============================================================================

-- Supprimer l'ancienne contrainte si elle existe
ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_role_check;

-- Ajouter la nouvelle contrainte avec le rôle 'tool'
-- - 'user' : message de l'utilisateur
-- - 'assistant' : réponse de l'IA (peut contenir des tool_calls)
-- - 'tool' : résultat d'un outil (doit avoir tool_call_id)
ALTER TABLE public.messages 
ADD CONSTRAINT messages_role_check 
CHECK (role IN ('user', 'assistant', 'tool'));

-- ============================================================================
-- STEP 3: Index pour les performances
-- ============================================================================

-- Index sur tool_call_id pour rechercher rapidement les résultats d'outils
CREATE INDEX IF NOT EXISTS idx_messages_tool_call_id 
ON public.messages(tool_call_id) 
WHERE tool_call_id IS NOT NULL;

-- Index GIN sur tool_calls pour requêtes JSONB (si besoin de recherche)
CREATE INDEX IF NOT EXISTS idx_messages_tool_calls 
ON public.messages USING GIN (tool_calls) 
WHERE tool_calls IS NOT NULL;

-- ============================================================================
-- STEP 4: Commentaires de documentation
-- ============================================================================

COMMENT ON COLUMN public.messages.tool_calls IS 
'Tool calls demandés par l''assistant (format OpenAI). Tableau JSON contenant les appels d''outils avec leur ID, type et arguments.';

COMMENT ON COLUMN public.messages.tool_call_id IS 
'ID du tool call auquel ce message répond. Utilisé uniquement pour les messages de rôle "tool".';

COMMENT ON COLUMN public.messages.tool_name IS 
'Nom de l''outil exécuté (ex: create_listing_draft). Utilisé pour les messages de rôle "tool".';

-- ============================================================================
-- STEP 5: Contrainte de cohérence
-- ============================================================================

-- Les messages 'tool' doivent avoir un tool_call_id
-- Les messages 'user' et 'assistant' ne doivent PAS avoir de tool_call_id
ALTER TABLE public.messages
ADD CONSTRAINT messages_tool_consistency
CHECK (
  (role = 'tool' AND tool_call_id IS NOT NULL) OR
  (role IN ('user', 'assistant') AND tool_call_id IS NULL)
);

-- ============================================================================
-- Note sur la rétrocompatibilité
-- ============================================================================
-- Les conversations existantes sans tool_calls continueront de fonctionner.
-- Les nouvelles colonnes ont des valeurs par défaut NULL.
-- Le code doit gérer le cas où tool_calls est NULL (conversations anciennes).





