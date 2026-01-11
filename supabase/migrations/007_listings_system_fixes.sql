-- ============================================================================
-- TOUSGETHER - Corrections système d'annonces (Listings)
-- Migration 007 - Corrections ciblées
-- ============================================================================
-- Ce script applique les corrections suivantes :
-- 1. Correction de l'enum listing_draft_status (suppression de 'published')
-- 2. Renforcement sécurité search_listings (commentaires critiques)
-- 3. Sécurisation create_listing_draft (ownership via auth.uid())
-- 4. Ajout colonne completion_score
-- ============================================================================

-- ============================================================================
-- 1. CORRECTION ENUM: listing_draft_status
-- ============================================================================
-- Un brouillon ne doit JAMAIS avoir le statut 'published'.
-- La publication se fait par copie des données vers la table 'listings'.
-- Nouveaux statuts : 'draft', 'ready', 'rejected'

-- Créer le nouvel enum avec les bonnes valeurs
CREATE TYPE listing_draft_status_new AS ENUM ('draft', 'ready', 'rejected');

-- Migrer la colonne status vers le nouveau type
-- - 'draft' reste 'draft'
-- - 'pending_review' devient 'ready'
-- - 'published' devient 'ready' (cas legacy, ne devrait pas exister)
-- - 'rejected' reste 'rejected'
ALTER TABLE public.listing_drafts 
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE listing_draft_status_new 
    USING (CASE 
      WHEN status::text IN ('pending_review', 'published') THEN 'ready'::listing_draft_status_new
      ELSE status::text::listing_draft_status_new
    END),
  ALTER COLUMN status SET DEFAULT 'draft';

-- Supprimer l'ancien enum et renommer le nouveau
DROP TYPE listing_draft_status;
ALTER TYPE listing_draft_status_new RENAME TO listing_draft_status;

-- ============================================================================
-- 2. RENFORCEMENT SÉCURITÉ: search_listings
-- ============================================================================
-- Ajout de commentaires critiques sur la condition is_active = true
-- Cette condition est une défense en profondeur, indépendante de RLS

CREATE OR REPLACE FUNCTION public.search_listings(
  search_query TEXT,
  category_filter listing_category DEFAULT NULL,
  max_price_filter DECIMAL DEFAULT NULL,
  location_filter TEXT DEFAULT NULL,
  result_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  description TEXT,
  category listing_category,
  price DECIMAL,
  price_type listing_price_type,
  location TEXT,
  published_at TIMESTAMPTZ,
  relevance REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.user_id,
    l.title,
    l.description,
    l.category,
    l.price,
    l.price_type,
    l.location,
    l.published_at,
    ts_rank(
      to_tsvector('french', coalesce(l.title, '') || ' ' || coalesce(l.description, '')),
      plainto_tsquery('french', search_query)
    ) AS relevance
  FROM public.listings l
  WHERE 
    -- =========================================================================
    -- SÉCURITÉ CRITIQUE: Cette condition DOIT TOUJOURS être présente.
    -- Elle garantit que seules les annonces actives sont retournées.
    -- NE PAS SUPPRIMER même si RLS est active (défense en profondeur).
    -- La fonction étant SECURITY DEFINER, elle bypass RLS.
    -- =========================================================================
    l.is_active = true
    AND (
      search_query IS NULL 
      OR search_query = ''
      OR to_tsvector('french', coalesce(l.title, '') || ' ' || coalesce(l.description, '')) 
         @@ plainto_tsquery('french', search_query)
    )
    AND (category_filter IS NULL OR l.category = category_filter)
    AND (max_price_filter IS NULL OR l.price IS NULL OR l.price <= max_price_filter)
    AND (
      location_filter IS NULL 
      OR location_filter = ''
      OR l.location ILIKE '%' || location_filter || '%'
    )
  ORDER BY relevance DESC, l.published_at DESC
  LIMIT result_limit;
END;
$$;

COMMENT ON FUNCTION public.search_listings IS 
  'Recherche full-text dans les annonces actives avec filtres optionnels. '
  'SÉCURITÉ: La condition is_active=true est obligatoire et ne doit jamais être supprimée.';

-- ============================================================================
-- 3. SÉCURISATION OWNERSHIP: create_listing_draft
-- ============================================================================
-- Le paramètre p_user_id est conservé pour compatibilité API mais IGNORÉ.
-- L'user_id utilisé est TOUJOURS auth.uid() pour empêcher le spoofing.

CREATE OR REPLACE FUNCTION public.create_listing_draft(
  p_user_id UUID,  -- IGNORÉ: conservé uniquement pour compatibilité API
  p_title TEXT,
  p_description TEXT,
  p_category listing_category DEFAULT 'other',
  p_price DECIMAL DEFAULT NULL,
  p_price_type listing_price_type DEFAULT 'negotiable',
  p_location TEXT DEFAULT NULL,
  p_conversation_id UUID DEFAULT NULL,
  p_agent_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_draft_id UUID;
  v_actual_user_id UUID;
BEGIN
  -- =========================================================================
  -- SÉCURITÉ: Toujours utiliser auth.uid(), JAMAIS p_user_id.
  -- Cela empêche un client malveillant de créer des brouillons pour un autre user.
  -- Le paramètre p_user_id est ignoré mais conservé pour compatibilité API.
  -- =========================================================================
  v_actual_user_id := auth.uid();
  
  IF v_actual_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié. Impossible de créer un brouillon.';
  END IF;

  INSERT INTO public.listing_drafts (
    user_id,
    conversation_id,
    title,
    description,
    category,
    price,
    price_type,
    location,
    agent_metadata,
    status
  ) VALUES (
    v_actual_user_id,  -- SÉCURITÉ: Utilise auth.uid(), pas p_user_id
    p_conversation_id,
    p_title,
    p_description,
    p_category,
    p_price,
    p_price_type,
    p_location,
    p_agent_metadata,
    'draft'  -- Toujours créé comme brouillon, jamais auto-publié
  )
  RETURNING id INTO v_draft_id;
  
  RETURN v_draft_id;
END;
$$;

COMMENT ON FUNCTION public.create_listing_draft IS 
  'Crée un brouillon d''annonce (utilisé par l''agent IA). '
  'Ne publie jamais automatiquement. '
  'SÉCURITÉ: Le user_id est toujours auth.uid(), le paramètre p_user_id est ignoré.';

-- ============================================================================
-- 4. AJOUT COLONNE: completion_score
-- ============================================================================
-- Score de complétude entre 0 et 100, calculé par l'IA pour feedback UI.
-- N'est PAS requis pour la publication.

ALTER TABLE public.listing_drafts 
ADD COLUMN IF NOT EXISTS completion_score INTEGER DEFAULT 0;

-- Ajouter la contrainte CHECK séparément pour éviter les erreurs si la colonne existe déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'listing_drafts_completion_score_check'
  ) THEN
    ALTER TABLE public.listing_drafts 
    ADD CONSTRAINT listing_drafts_completion_score_check 
    CHECK (completion_score >= 0 AND completion_score <= 100);
  END IF;
END $$;

COMMENT ON COLUMN public.listing_drafts.completion_score IS 
  'Score de complétude (0-100) calculé par l''IA pour feedback UI. Non requis pour publication.';

-- ============================================================================
-- FIN DE LA MIGRATION 007
-- ============================================================================







