-- ============================================================================
-- Migration 016: Images pour les annonces
-- ============================================================================
-- Ajoute le support des images pour les annonces (upload ou générées par IA)

-- ============================================================================
-- TABLE: listing_images
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.listing_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Référence à l'annonce publiée (optionnel si brouillon)
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  
  -- Référence au brouillon (optionnel si annonce publiée)
  draft_id UUID REFERENCES public.listing_drafts(id) ON DELETE CASCADE,
  
  -- URL de l'image stockée dans Supabase Storage
  url TEXT NOT NULL,
  
  -- Position dans la galerie (0 = image principale)
  "position" INTEGER NOT NULL DEFAULT 0,
  
  -- Indique si l'image a été générée par IA (DALL-E)
  is_generated BOOLEAN NOT NULL DEFAULT false,
  
  -- Prompt utilisé pour la génération (si is_generated = true)
  generation_prompt TEXT,
  
  -- Métadonnées de l'image
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  mime_type VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Contrainte : soit listing_id soit draft_id doit être défini
  CONSTRAINT listing_or_draft CHECK (
    (listing_id IS NOT NULL AND draft_id IS NULL) OR
    (listing_id IS NULL AND draft_id IS NOT NULL)
  )
);

-- Index pour les requêtes
CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id 
  ON public.listing_images(listing_id) WHERE listing_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listing_images_draft_id 
  ON public.listing_images(draft_id) WHERE draft_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listing_images_position 
  ON public.listing_images(listing_id, "position");

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;

-- Les images des annonces publiées sont visibles par tous
CREATE POLICY "Anyone can view listing images"
  ON public.listing_images
  FOR SELECT
  USING (
    listing_id IS NOT NULL OR
    (draft_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.listing_drafts d 
      WHERE d.id = draft_id AND d.user_id = auth.uid()
    ))
  );

-- Seul le propriétaire peut ajouter des images à ses annonces/brouillons
CREATE POLICY "Users can insert own listing images"
  ON public.listing_images
  FOR INSERT
  WITH CHECK (
    (listing_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.listings l 
      WHERE l.id = listing_id AND l.user_id = auth.uid()
    ))
    OR
    (draft_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.listing_drafts d 
      WHERE d.id = draft_id AND d.user_id = auth.uid()
    ))
  );

-- Seul le propriétaire peut supprimer ses images
CREATE POLICY "Users can delete own listing images"
  ON public.listing_images
  FOR DELETE
  USING (
    (listing_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.listings l 
      WHERE l.id = listing_id AND l.user_id = auth.uid()
    ))
    OR
    (draft_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.listing_drafts d 
      WHERE d.id = draft_id AND d.user_id = auth.uid()
    ))
  );

-- ============================================================================
-- STORAGE BUCKET
-- ============================================================================
-- Note: Le bucket doit être créé via la console Supabase ou une migration storage

-- Création du bucket pour les images d'annonces (si Supabase Storage est configuré)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('listing-images', 'listing-images', true)
-- ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- FONCTION: Transférer les images d'un brouillon vers une annonce
-- ============================================================================

CREATE OR REPLACE FUNCTION public.transfer_draft_images_to_listing(
  p_draft_id UUID,
  p_listing_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  transferred_count INTEGER;
BEGIN
  UPDATE public.listing_images
  SET listing_id = p_listing_id, draft_id = NULL
  WHERE draft_id = p_draft_id;
  
  GET DIAGNOSTICS transferred_count = ROW_COUNT;
  RETURN transferred_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.transfer_draft_images_to_listing(UUID, UUID) TO authenticated;

-- ============================================================================
-- FONCTION: Obtenir les images d'une annonce ou brouillon
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_listing_images(
  p_listing_id UUID DEFAULT NULL,
  p_draft_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  url TEXT,
  img_position INTEGER,
  is_generated BOOLEAN,
  width INTEGER,
  height INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    li.id,
    li.url,
    li."position" AS img_position,
    li.is_generated,
    li.width,
    li.height
  FROM public.listing_images li
  WHERE 
    (p_listing_id IS NOT NULL AND li.listing_id = p_listing_id) OR
    (p_draft_id IS NOT NULL AND li.draft_id = p_draft_id)
  ORDER BY li."position" ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_listing_images(UUID, UUID) TO anon, authenticated;

