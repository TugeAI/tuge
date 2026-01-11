-- ============================================================================
-- TUGE - Extension du profil utilisateur
-- ============================================================================
-- Ce script ajoute les champs pour un profil utilisateur complet :
-- - first_name : Prénom de l'utilisateur
-- - last_name : Nom de l'utilisateur  
-- - avatar_url : URL de l'avatar (stocké dans Supabase Storage)
-- ============================================================================

-- ============================================================================
-- MODIFICATION: profiles
-- ============================================================================

-- Ajout du prénom
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT;

-- Ajout du nom
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Ajout de l'URL de l'avatar
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ============================================================================
-- COMMENTS: Documentation des nouveaux champs
-- ============================================================================

COMMENT ON COLUMN public.profiles.first_name IS 
  'Prénom de l''utilisateur (optionnel)';

COMMENT ON COLUMN public.profiles.last_name IS 
  'Nom de famille de l''utilisateur (optionnel)';

COMMENT ON COLUMN public.profiles.avatar_url IS 
  'URL de l''avatar stocké dans Supabase Storage (optionnel)';

-- ============================================================================
-- STORAGE: Configuration du bucket avatars
-- ============================================================================
-- Note: Cette partie doit être exécutée manuellement dans le dashboard Supabase
-- ou via la CLI Supabase car le SQL ne peut pas créer de buckets Storage.
--
-- Créer un bucket "avatars" avec :
-- - Public: true (pour que les avatars soient accessibles publiquement)
-- - Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
-- - Max file size: 2MB
-- ============================================================================

-- ============================================================================
-- FUNCTION: Génère un nom de fichier unique pour l'avatar
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_avatar_filename(user_id UUID, extension TEXT DEFAULT 'jpg')
RETURNS TEXT AS $$
BEGIN
  RETURN user_id::TEXT || '_' || extract(epoch from now())::BIGINT || '.' || extension;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS POLICY UPDATE: Permettre la mise à jour des nouveaux champs
-- ============================================================================
-- Les policies existantes permettent déjà la mise à jour du profil par l'utilisateur
-- Aucune modification nécessaire car la policy "Users can update own profile" 
-- s'applique à toutes les colonnes.







