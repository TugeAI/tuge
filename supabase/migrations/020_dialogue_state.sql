-- ============================================================================
-- Migration: État de dialogue pour les conversations
-- ============================================================================
-- Cette migration ajoute le support du stockage de l'état de dialogue
-- dans la table conversations pour gérer les actions en attente
-- (sélection, confirmation) de manière fiable.
--
-- L'état de dialogue permet :
-- - De suivre si l'agent attend une réponse utilisateur (oui/non, sélection 1,2,3)
-- - De stocker les actions en attente (suppression, activation)
-- - De garantir que les actions sont exécutées après confirmation explicite
-- ============================================================================

-- ============================================================================
-- STEP 1: Ajouter la colonne dialogue_state
-- ============================================================================

-- Colonne pour stocker l'état du dialogue
-- Format: {state: 'idle'|'awaiting_selection'|'awaiting_confirmation', pendingAction: {...}, ...}
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS dialogue_state JSONB DEFAULT NULL;

-- ============================================================================
-- STEP 2: Index pour les performances
-- ============================================================================

-- Index partiel pour trouver les conversations avec un état actif
CREATE INDEX IF NOT EXISTS idx_conversations_dialogue_state_active 
ON public.conversations((dialogue_state->>'state')) 
WHERE dialogue_state IS NOT NULL AND dialogue_state->>'state' != 'idle';

-- ============================================================================
-- STEP 3: Commentaires de documentation
-- ============================================================================

COMMENT ON COLUMN public.conversations.dialogue_state IS 
'État de la machine de dialogue. Stocke les actions en attente de confirmation/sélection. Format: {state, pendingAction, clarificationAttempts, updatedAt}';

-- ============================================================================
-- STEP 4: Fonction pour nettoyer les états expirés
-- ============================================================================

-- Fonction pour réinitialiser les états de dialogue expirés (> 5 minutes)
CREATE OR REPLACE FUNCTION clean_expired_dialogue_states()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  UPDATE public.conversations
  SET dialogue_state = NULL
  WHERE dialogue_state IS NOT NULL
    AND dialogue_state->>'state' != 'idle'
    AND (
      -- L'état n'a pas de timestamp ou est expiré (5 minutes)
      dialogue_state->>'updatedAt' IS NULL
      OR (dialogue_state->>'updatedAt')::bigint < (EXTRACT(EPOCH FROM NOW()) * 1000 - 300000)::bigint
    );
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  RETURN cleaned_count;
END;
$$;

COMMENT ON FUNCTION clean_expired_dialogue_states() IS 
'Nettoie les états de dialogue expirés (plus de 5 minutes). Retourne le nombre de conversations nettoyées.';

-- ============================================================================
-- Note sur l'utilisation
-- ============================================================================
-- L'état de dialogue est géré par le middleware src/lib/agent/listings/dialogue-middleware.ts
-- Il est automatiquement sérialisé/désérialisé via les fonctions dans dialogue-state.ts
-- Les états possibles sont:
-- - idle: prêt à recevoir une commande
-- - awaiting_selection: en attente d'un choix (1, 2, 3...)
-- - awaiting_confirmation: en attente de confirmation (oui/non)





