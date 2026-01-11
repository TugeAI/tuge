-- ============================================================================
-- Migration 017: Configuration du Storage pour les images d'annonces
-- ============================================================================
-- Crée le bucket et les politiques RLS pour Supabase Storage

-- ============================================================================
-- CRÉATION DU BUCKET
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-images',
  'listing-images',
  true,  -- Bucket public pour accès en lecture
  5242880,  -- 5MB max par fichier
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- POLITIQUES DE STORAGE
-- ============================================================================

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Anyone can view listing images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload listing images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own listing images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own listing images" ON storage.objects;

-- Lecture publique (le bucket est public)
CREATE POLICY "Anyone can view listing images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'listing-images');

-- Upload réservé aux utilisateurs authentifiés
-- Les fichiers sont stockés dans un dossier avec l'ID utilisateur
CREATE POLICY "Authenticated users can upload listing images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'listing-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Mise à jour uniquement de ses propres fichiers
CREATE POLICY "Users can update own listing images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'listing-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Suppression uniquement de ses propres fichiers
CREATE POLICY "Users can delete own listing images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'listing-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- MODIFICATION DE LA TABLE listing_images
-- ============================================================================
-- Permettre les images sans draftId ni listingId (upload temporaire)
-- La contrainte sera mise à jour lors de la publication

ALTER TABLE public.listing_images 
  DROP CONSTRAINT IF EXISTS listing_or_draft;

-- Nouvelle contrainte plus souple : au moins un des deux OU aucun (upload temporaire)
-- Les images orphelines seront nettoyées périodiquement
ALTER TABLE public.listing_images
  ADD CONSTRAINT listing_or_draft_optional CHECK (
    NOT (listing_id IS NOT NULL AND draft_id IS NOT NULL)
  );

-- Ajouter une colonne pour tracer le propriétaire des images temporaires
ALTER TABLE public.listing_images
  ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id);

-- Index pour les images temporaires
CREATE INDEX IF NOT EXISTS idx_listing_images_uploaded_by
  ON public.listing_images(uploaded_by) 
  WHERE listing_id IS NULL AND draft_id IS NULL;

-- Mettre à jour la politique INSERT pour les images temporaires
DROP POLICY IF EXISTS "Users can insert own listing images" ON public.listing_images;

CREATE POLICY "Users can insert own listing images"
  ON public.listing_images
  FOR INSERT
  WITH CHECK (
    -- Image pour une annonce publiée
    (listing_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.listings l 
      WHERE l.id = listing_id AND l.user_id = auth.uid()
    ))
    OR
    -- Image pour un brouillon
    (draft_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.listing_drafts d 
      WHERE d.id = draft_id AND d.user_id = auth.uid()
    ))
    OR
    -- Image temporaire (upload avant création du brouillon)
    (listing_id IS NULL AND draft_id IS NULL AND uploaded_by = auth.uid())
  );

-- Politique SELECT mise à jour
DROP POLICY IF EXISTS "Anyone can view listing images" ON public.listing_images;

CREATE POLICY "Anyone can view listing images"
  ON public.listing_images
  FOR SELECT
  USING (
    -- Annonce publiée = public
    listing_id IS NOT NULL 
    OR
    -- Brouillon = propriétaire seulement
    (draft_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.listing_drafts d 
      WHERE d.id = draft_id AND d.user_id = auth.uid()
    ))
    OR
    -- Image temporaire = propriétaire seulement
    (listing_id IS NULL AND draft_id IS NULL AND uploaded_by = auth.uid())
  );

-- Politique DELETE mise à jour
DROP POLICY IF EXISTS "Users can delete own listing images" ON public.listing_images;

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
    OR
    (listing_id IS NULL AND draft_id IS NULL AND uploaded_by = auth.uid())
  );

-- ============================================================================
-- FONCTION: Nettoyer les images orphelines (plus de 24h)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_orphan_images()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.listing_images
  WHERE listing_id IS NULL 
    AND draft_id IS NULL
    AND created_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seul le service peut exécuter cette fonction (via cron job)
REVOKE ALL ON FUNCTION public.cleanup_orphan_images() FROM PUBLIC;





