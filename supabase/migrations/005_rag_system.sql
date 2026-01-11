-- ============================================================================
-- TOUSGETHER - RAG System Schema (pgvector)
-- ============================================================================
-- Ce script crée les tables et fonctions nécessaires pour le système RAG
-- utilisant pgvector pour la recherche sémantique.
-- ============================================================================

-- ============================================================================
-- EXTENSION: pgvector
-- ============================================================================
-- Active l'extension pgvector pour le stockage et la recherche de vecteurs

CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- TYPE ENUM: Collection types
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE rag_collection AS ENUM (
    'platform_docs',    -- Documentation de la plateforme (FAQ, aide, fonctionnement)
    'listings',         -- Annonces et services de la marketplace
    'professionals',    -- Profils des professionnels
    'referral_mlm'      -- Documentation parrainage et MLM
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- TABLE: rag_documents
-- ============================================================================
-- Documents sources avec métadonnées

CREATE TABLE IF NOT EXISTS public.rag_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Collection à laquelle appartient le document
  collection rag_collection NOT NULL,
  
  -- Identifiant externe (ex: ID d'une annonce, ID d'un profil)
  external_id TEXT,
  
  -- Titre du document
  title TEXT NOT NULL,
  
  -- Contenu brut du document
  content TEXT NOT NULL,
  
  -- Métadonnées JSON (flexible pour chaque type de collection)
  metadata JSONB DEFAULT '{}',
  
  -- Statut du document
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Contrainte d'unicité pour éviter les doublons par collection + external_id
  CONSTRAINT unique_collection_external_id UNIQUE (collection, external_id)
);

-- Index pour la recherche
CREATE INDEX IF NOT EXISTS idx_rag_documents_collection 
  ON public.rag_documents(collection);
CREATE INDEX IF NOT EXISTS idx_rag_documents_external_id 
  ON public.rag_documents(external_id);
CREATE INDEX IF NOT EXISTS idx_rag_documents_is_active 
  ON public.rag_documents(is_active);
CREATE INDEX IF NOT EXISTS idx_rag_documents_metadata 
  ON public.rag_documents USING GIN (metadata);

-- ============================================================================
-- TABLE: rag_chunks
-- ============================================================================
-- Morceaux de documents avec embeddings vectoriels

CREATE TABLE IF NOT EXISTS public.rag_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Document parent
  document_id UUID NOT NULL REFERENCES public.rag_documents(id) ON DELETE CASCADE,
  
  -- Index du chunk dans le document (pour l'ordre)
  chunk_index INTEGER NOT NULL DEFAULT 0,
  
  -- Contenu du chunk
  content TEXT NOT NULL,
  
  -- Embedding vectoriel (1536 dimensions pour text-embedding-3-small)
  embedding vector(1536),
  
  -- Nombre de tokens du chunk
  token_count INTEGER,
  
  -- Métadonnées supplémentaires du chunk
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Contrainte d'unicité
  CONSTRAINT unique_document_chunk_index UNIQUE (document_id, chunk_index)
);

-- Index pour la recherche vectorielle (HNSW pour performance)
CREATE INDEX IF NOT EXISTS idx_rag_chunks_embedding 
  ON public.rag_chunks 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Index pour les recherches classiques
CREATE INDEX IF NOT EXISTS idx_rag_chunks_document_id 
  ON public.rag_chunks(document_id);

-- ============================================================================
-- TRIGGER: Mise à jour automatique de updated_at
-- ============================================================================

CREATE TRIGGER set_rag_documents_updated_at
  BEFORE UPDATE ON public.rag_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- FUNCTION: search_rag_chunks
-- ============================================================================
-- Recherche sémantique dans les chunks avec filtrage par collection

CREATE OR REPLACE FUNCTION public.search_rag_chunks(
  query_embedding vector(1536),
  target_collections rag_collection[] DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INTEGER DEFAULT 5
)
RETURNS TABLE (
  chunk_id UUID,
  document_id UUID,
  collection rag_collection,
  document_title TEXT,
  chunk_content TEXT,
  chunk_metadata JSONB,
  document_metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS chunk_id,
    d.id AS document_id,
    d.collection,
    d.title AS document_title,
    c.content AS chunk_content,
    c.metadata AS chunk_metadata,
    d.metadata AS document_metadata,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.rag_chunks c
  INNER JOIN public.rag_documents d ON c.document_id = d.id
  WHERE 
    d.is_active = true
    AND c.embedding IS NOT NULL
    AND (target_collections IS NULL OR d.collection = ANY(target_collections))
    AND 1 - (c.embedding <=> query_embedding) >= match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================================
-- FUNCTION: get_document_chunks
-- ============================================================================
-- Récupère tous les chunks d'un document

CREATE OR REPLACE FUNCTION public.get_document_chunks(
  target_document_id UUID
)
RETURNS TABLE (
  chunk_id UUID,
  chunk_index INTEGER,
  content TEXT,
  token_count INTEGER,
  has_embedding BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS chunk_id,
    c.chunk_index,
    c.content,
    c.token_count,
    (c.embedding IS NOT NULL) AS has_embedding
  FROM public.rag_chunks c
  WHERE c.document_id = target_document_id
  ORDER BY c.chunk_index;
END;
$$;

-- ============================================================================
-- FUNCTION: upsert_rag_document
-- ============================================================================
-- Insère ou met à jour un document RAG (supprime les anciens chunks)

CREATE OR REPLACE FUNCTION public.upsert_rag_document(
  p_collection rag_collection,
  p_external_id TEXT,
  p_title TEXT,
  p_content TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_document_id UUID;
BEGIN
  -- Upsert le document
  INSERT INTO public.rag_documents (collection, external_id, title, content, metadata)
  VALUES (p_collection, p_external_id, p_title, p_content, p_metadata)
  ON CONFLICT (collection, external_id) 
  DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    metadata = EXCLUDED.metadata,
    updated_at = NOW(),
    is_active = true
  RETURNING id INTO v_document_id;
  
  -- Supprimer les anciens chunks (ils seront recréés)
  DELETE FROM public.rag_chunks WHERE document_id = v_document_id;
  
  RETURN v_document_id;
END;
$$;

-- ============================================================================
-- FUNCTION: insert_rag_chunk
-- ============================================================================
-- Insère un chunk avec son embedding

CREATE OR REPLACE FUNCTION public.insert_rag_chunk(
  p_document_id UUID,
  p_chunk_index INTEGER,
  p_content TEXT,
  p_embedding vector(1536),
  p_token_count INTEGER DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_chunk_id UUID;
BEGIN
  INSERT INTO public.rag_chunks (
    document_id, 
    chunk_index, 
    content, 
    embedding, 
    token_count, 
    metadata
  )
  VALUES (
    p_document_id, 
    p_chunk_index, 
    p_content, 
    p_embedding, 
    p_token_count, 
    p_metadata
  )
  ON CONFLICT (document_id, chunk_index)
  DO UPDATE SET
    content = EXCLUDED.content,
    embedding = EXCLUDED.embedding,
    token_count = EXCLUDED.token_count,
    metadata = EXCLUDED.metadata
  RETURNING id INTO v_chunk_id;
  
  RETURN v_chunk_id;
END;
$$;

-- ============================================================================
-- FUNCTION: delete_rag_document
-- ============================================================================
-- Supprime (désactive) un document et ses chunks

CREATE OR REPLACE FUNCTION public.delete_rag_document(
  p_collection rag_collection,
  p_external_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows_affected INTEGER;
BEGIN
  UPDATE public.rag_documents
  SET is_active = false, updated_at = NOW()
  WHERE collection = p_collection AND external_id = p_external_id;
  
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  
  RETURN v_rows_affected > 0;
END;
$$;

-- ============================================================================
-- FUNCTION: get_rag_stats
-- ============================================================================
-- Statistiques du système RAG

CREATE OR REPLACE FUNCTION public.get_rag_stats()
RETURNS TABLE (
  collection rag_collection,
  document_count BIGINT,
  chunk_count BIGINT,
  chunks_with_embeddings BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.collection,
    COUNT(DISTINCT d.id) AS document_count,
    COUNT(c.id) AS chunk_count,
    COUNT(c.id) FILTER (WHERE c.embedding IS NOT NULL) AS chunks_with_embeddings
  FROM public.rag_documents d
  LEFT JOIN public.rag_chunks c ON d.id = c.document_id
  WHERE d.is_active = true
  GROUP BY d.collection
  ORDER BY d.collection;
END;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur les tables
ALTER TABLE public.rag_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_chunks ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES: rag_documents
-- ============================================================================

-- Lecture publique pour les documents actifs (le RAG doit pouvoir lire)
CREATE POLICY "Public read access for active documents"
  ON public.rag_documents
  FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Le service_role peut tout faire (pour l'ingestion)
CREATE POLICY "Service role full access - rag_documents"
  ON public.rag_documents
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- POLICIES: rag_chunks
-- ============================================================================

-- Lecture publique pour les chunks de documents actifs
CREATE POLICY "Public read access for chunks of active documents"
  ON public.rag_chunks
  FOR SELECT
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM public.rag_documents d
      WHERE d.id = rag_chunks.document_id
      AND d.is_active = true
    )
  );

-- Le service_role peut tout faire
CREATE POLICY "Service role full access - rag_chunks"
  ON public.rag_chunks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS: Documentation des tables
-- ============================================================================

COMMENT ON TABLE public.rag_documents IS 
  'Documents sources pour le système RAG de Tousgether.';

COMMENT ON TABLE public.rag_chunks IS 
  'Chunks de documents avec embeddings vectoriels pour la recherche sémantique.';

COMMENT ON COLUMN public.rag_chunks.embedding IS 
  'Vecteur d''embedding de 1536 dimensions (OpenAI text-embedding-3-small).';

COMMENT ON FUNCTION public.search_rag_chunks IS 
  'Recherche sémantique dans les chunks RAG avec filtrage par collection.';

COMMENT ON FUNCTION public.upsert_rag_document IS 
  'Insère ou met à jour un document RAG, supprimant les anciens chunks.';







