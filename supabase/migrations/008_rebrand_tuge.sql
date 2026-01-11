-- ============================================================================
-- TUGE - Migration de rebranding (cosmétique)
-- ============================================================================
-- Cette migration met à jour les commentaires de la base de données
-- pour refléter le nouveau nom de marque: Tuge (anciennement Tousgether)
-- 
-- CHANGEMENTS:
-- - Commentaires des tables mis à jour
-- - Aucune modification de schéma ou de données
-- ============================================================================

-- Mise à jour des commentaires pour listings
COMMENT ON TABLE public.listings IS 
  'Annonces publiées et recherchables sur la plateforme Tuge.';

-- Mise à jour des commentaires pour listing_drafts
COMMENT ON TABLE public.listing_drafts IS 
  'Brouillons d''annonces créés par l''agent IA Tuge, en attente de validation.';

-- Mise à jour des commentaires pour conversations (agent chat)
COMMENT ON TABLE public.conversations IS 
  'Conversations entre utilisateurs et l''agent IA Tuge.';

-- Mise à jour des commentaires pour rag_documents
COMMENT ON TABLE public.rag_documents IS 
  'Documents sources pour le système RAG de Tuge.';

-- Mise à jour des commentaires pour search_listings
COMMENT ON FUNCTION public.search_listings IS 
  'Recherche full-text dans les annonces actives avec filtres optionnels.';

-- Mise à jour des commentaires pour create_listing_draft
COMMENT ON FUNCTION public.create_listing_draft IS 
  'Crée un brouillon d''annonce (utilisé par l''agent IA Tuge). Ne publie jamais automatiquement.';

-- Note: Les anciennes migrations (001-007) mentionnent "TOUSGETHER" dans leurs 
-- headers SQL, mais ces commentaires ne sont pas stockés en base de données.
-- Seuls les COMMENT ON sont persistés et sont mis à jour ici.

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================

