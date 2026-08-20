-- Add hash_id column to produtos if it doesn't exist
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS hash_id text;

-- Function to generate hash for products
CREATE OR REPLACE FUNCTION public.generate_product_hash_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.hash_id := encode(sha256(NEW.id::text::bytea), 'hex');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for products
DROP TRIGGER IF EXISTS trigger_update_product_hash_id ON public.produtos;
CREATE TRIGGER trigger_update_product_hash_id
BEFORE INSERT OR UPDATE OF id ON public.produtos
FOR EACH ROW EXECUTE FUNCTION public.generate_product_hash_id();

-- Update existing products
UPDATE public.produtos SET hash_id = encode(sha256(id::text::bytea), 'hex') WHERE hash_id IS NULL;

-- Same for categories
ALTER TABLE public.categorias ADD COLUMN IF NOT EXISTS hash_id text;

CREATE OR REPLACE FUNCTION public.generate_category_hash_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.hash_id := encode(sha256(NEW.id::text::bytea), 'hex');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_category_hash_id ON public.categorias;
CREATE TRIGGER trigger_update_category_hash_id
BEFORE INSERT OR UPDATE OF id ON public.categorias
FOR EACH ROW EXECUTE FUNCTION public.generate_category_hash_id();

UPDATE public.categorias SET hash_id = encode(sha256(id::text::bytea), 'hex') WHERE hash_id IS NULL;

-- Grant access (redundant but safe)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;