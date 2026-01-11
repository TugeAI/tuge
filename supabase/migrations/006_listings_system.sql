-- ============================================================================
-- TOUSGETHER - Système d'annonces (Listings)
-- ============================================================================
-- Ce script crée les tables nécessaires pour le système d'annonces :
-- - listing_drafts : brouillons créés par l'agent IA
-- - listings : annonces publiées et recherchables
-- ============================================================================

-- ============================================================================
-- ENUM: Catégories d'annonces
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE listing_category AS ENUM ('service', 'product', 'job', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE listing_price_type AS ENUM ('fixed', 'hourly', 'negotiable', 'free');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE listing_draft_status AS ENUM ('draft', 'pending_review', 'published', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABLE: listing_drafts
-- ============================================================================
-- Brouillons d'annonces créés par l'agent IA.
-- Ces brouillons doivent être validés avant publication.

CREATE TABLE IF NOT EXISTS public.listing_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Propriétaire du brouillon
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Conversation dans laquelle le brouillon a été créé (optionnel)
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  
  -- Contenu de l'annonce
  title TEXT NOT NULL CHECK (char_length(title) <= 100),
  description TEXT NOT NULL CHECK (char_length(description) <= 2000),
  category listing_category NOT NULL DEFAULT 'other',
  
  -- Prix (optionnel)
  price DECIMAL(10, 2) CHECK (price IS NULL OR price >= 0),
  price_type listing_price_type DEFAULT 'negotiable',
  
  -- Localisation (optionnel)
  location TEXT CHECK (location IS NULL OR char_length(location) <= 100),
  
  -- Statut du brouillon
  status listing_draft_status NOT NULL DEFAULT 'draft',
  
  -- Métadonnées de l'agent
  agent_metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes
CREATE INDEX IF NOT EXISTS idx_listing_drafts_user_id 
  ON public.listing_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_listing_drafts_conversation_id 
  ON public.listing_drafts(conversation_id);
CREATE INDEX IF NOT EXISTS idx_listing_drafts_status 
  ON public.listing_drafts(status);
CREATE INDEX IF NOT EXISTS idx_listing_drafts_created_at 
  ON public.listing_drafts(created_at DESC);

-- Trigger pour updated_at
CREATE TRIGGER set_listing_drafts_updated_at
  BEFORE UPDATE ON public.listing_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- TABLE: listings
-- ============================================================================
-- Annonces publiées et recherchables sur la plateforme.

CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Propriétaire de l'annonce
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Référence au brouillon d'origine (optionnel)
  draft_id UUID REFERENCES public.listing_drafts(id) ON DELETE SET NULL,
  
  -- Contenu de l'annonce
  title TEXT NOT NULL CHECK (char_length(title) <= 100),
  description TEXT NOT NULL CHECK (char_length(description) <= 2000),
  category listing_category NOT NULL DEFAULT 'other',
  
  -- Prix (optionnel)
  price DECIMAL(10, 2) CHECK (price IS NULL OR price >= 0),
  price_type listing_price_type DEFAULT 'negotiable',
  
  -- Localisation (optionnel)
  location TEXT CHECK (location IS NULL OR char_length(location) <= 100),
  
  -- Statut de publication
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Statistiques
  view_count INTEGER NOT NULL DEFAULT 0,
  contact_count INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes de recherche
CREATE INDEX IF NOT EXISTS idx_listings_user_id 
  ON public.listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_category 
  ON public.listings(category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_listings_location 
  ON public.listings(location) WHERE is_active = true AND location IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_price 
  ON public.listings(price) WHERE is_active = true AND price IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_published_at 
  ON public.listings(published_at DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_listings_is_active 
  ON public.listings(is_active);

-- Index full-text pour la recherche
CREATE INDEX IF NOT EXISTS idx_listings_search 
  ON public.listings USING gin(
    to_tsvector('french', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) WHERE is_active = true;

-- Trigger pour updated_at
CREATE TRIGGER set_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.listing_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES: listing_drafts
-- ============================================================================

-- Les utilisateurs peuvent voir leurs propres brouillons
CREATE POLICY "Users can read own listing drafts"
  ON public.listing_drafts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer des brouillons pour eux-mêmes
CREATE POLICY "Users can create own listing drafts"
  ON public.listing_drafts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent modifier leurs propres brouillons
CREATE POLICY "Users can update own listing drafts"
  ON public.listing_drafts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres brouillons
CREATE POLICY "Users can delete own listing drafts"
  ON public.listing_drafts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Le service_role peut tout faire
CREATE POLICY "Service role full access - listing_drafts"
  ON public.listing_drafts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- POLICIES: listings
-- ============================================================================

-- Tout le monde peut voir les annonces actives (même anonyme)
CREATE POLICY "Anyone can read active listings"
  ON public.listings
  FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Les utilisateurs peuvent voir toutes leurs propres annonces
CREATE POLICY "Users can read all own listings"
  ON public.listings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer des annonces pour eux-mêmes
CREATE POLICY "Users can create own listings"
  ON public.listings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent modifier leurs propres annonces
CREATE POLICY "Users can update own listings"
  ON public.listings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres annonces
CREATE POLICY "Users can delete own listings"
  ON public.listings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Le service_role peut tout faire
CREATE POLICY "Service role full access - listings"
  ON public.listings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- FONCTION: Recherche full-text dans les annonces
-- ============================================================================

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

-- ============================================================================
-- FONCTION: Créer un brouillon d'annonce (pour l'agent IA)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_listing_draft(
  p_user_id UUID,
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
BEGIN
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
    p_user_id,
    p_conversation_id,
    p_title,
    p_description,
    p_category,
    p_price,
    p_price_type,
    p_location,
    p_agent_metadata,
    'draft' -- Toujours créé comme brouillon, jamais auto-publié
  )
  RETURNING id INTO v_draft_id;
  
  RETURN v_draft_id;
END;
$$;

-- ============================================================================
-- COMMENTS: Documentation des tables
-- ============================================================================

COMMENT ON TABLE public.listing_drafts IS 
  'Brouillons d''annonces créés par l''agent IA, en attente de validation.';

COMMENT ON TABLE public.listings IS 
  'Annonces publiées et recherchables sur la plateforme Tousgether.';

COMMENT ON FUNCTION public.search_listings IS 
  'Recherche full-text dans les annonces actives avec filtres optionnels.';

COMMENT ON FUNCTION public.create_listing_draft IS 
  'Crée un brouillon d''annonce (utilisé par l''agent IA). Ne publie jamais automatiquement.';







